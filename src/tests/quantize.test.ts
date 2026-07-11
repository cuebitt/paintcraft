import { describe, it, expect } from "vite-plus/test";
import { quantize } from "@/core/quantize";
import { FIXED_PALETTE, type RGB } from "@/core/palette";

function makeImageData(
  pixels: [number, number, number][],
  width: number,
  height: number,
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i++) {
    data[i * 4] = pixels[i]![0];
    data[i * 4 + 1] = pixels[i]![1];
    data[i * 4 + 2] = pixels[i]![2];
    data[i * 4 + 3] = 255;
  }
  return new ImageData(data, width, height);
}

describe("quantize", () => {
  it("keeps image dimensions for every method", () => {
    const data = makeImageData([[128, 128, 128]], 1, 1);
    for (const method of ["median-cut", "neuquant", "wuquant"] as const) {
      const result = quantize(data, method);
      expect(result.quantized.width).toBe(1);
      expect(result.quantized.height).toBe(1);
    }
  });

  it("returns a bounded adaptive palette for every method", () => {
    const data = makeImageData([[128, 128, 128]], 1, 1);
    const median = quantize(data, "median-cut");
    expect(median.adaptivePalette.length).toBeGreaterThan(0);
    expect(median.adaptivePalette.length).toBeLessThanOrEqual(16);

    for (const method of ["neuquant", "wuquant"] as const) {
      const result = quantize(data, method);
      expect(result.adaptivePalette.length).toBeGreaterThan(0);
      expect(result.adaptivePalette.length).toBeLessThanOrEqual(12);
    }
  });

  it("keeps the fixed palette available by default", () => {
    const data = makeImageData([[128, 128, 128]], 1, 1);
    for (const method of ["median-cut", "neuquant", "wuquant"] as const) {
      const result = quantize(data, method);
      const combined: RGB[] = [...FIXED_PALETTE, ...result.adaptivePalette];
      expect(combined.length).toBeGreaterThanOrEqual(FIXED_PALETTE.length);
    }
  });

  it("preserves the alpha channel with median-cut", () => {
    const data = new ImageData(new Uint8ClampedArray([128, 128, 128, 128]), 1, 1);
    const result = quantize(data, "median-cut");
    expect(result.quantized.data[3]).toBe(128);
  });

  it("handles a multi-color image", () => {
    const colors = [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [255, 255, 0],
    ] as [number, number, number][];
    const data = makeImageData(colors, 2, 2);
    const result = quantize(data, "median-cut");
    expect(result.quantized.width).toBe(2);
    expect(result.quantized.height).toBe(2);
    expect(result.adaptivePalette.length).toBeGreaterThan(0);
  });

  it("handles a single-color image efficiently", () => {
    const data = makeImageData([[128, 128, 128]], 1, 1);
    const result = quantize(data, "median-cut", { colors: 1, includeFixedPalette: false });
    expect(result.adaptivePalette.length).toBe(1);
  });

  it("handles transparent pixels with wuquant", () => {
    const data = new ImageData(new Uint8ClampedArray([128, 0, 0, 0, 0, 255, 0, 128]), 1, 2);
    const result = quantize(data, "wuquant");
    expect(result.quantized.data.length).toBe(8);
  });

  it("handles transparent pixels with neuquant", () => {
    const data = new ImageData(new Uint8ClampedArray([128, 0, 0, 0, 0, 255, 0, 128]), 1, 2);
    const result = quantize(data, "neuquant");
    expect(result.quantized.data.length).toBe(8);
  });
});
