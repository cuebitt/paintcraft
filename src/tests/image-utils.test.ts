import { describe, it, expect } from "vite-plus/test";
import { rgbString, computeScale, computeDisplayDimensions } from "../core/image-utils";

describe("rgbString", () => {
  it("converts RGB tuple to CSS rgb string", () => {
    expect(rgbString([255, 0, 0])).toBe("rgb(255,0,0)");
  });

  it("handles black", () => {
    expect(rgbString([0, 0, 0])).toBe("rgb(0,0,0)");
  });

  it("handles white", () => {
    expect(rgbString([255, 255, 255])).toBe("rgb(255,255,255)");
  });

  it("handles mid-range values", () => {
    expect(rgbString([128, 64, 32])).toBe("rgb(128,64,32)");
  });

  it("returns rgba string when alpha is provided", () => {
    expect(rgbString([255, 0, 0], 0.5)).toBe("rgba(255,0,0,0.5)");
  });

  it("handles alpha of 1 (fully opaque)", () => {
    expect(rgbString([0, 0, 0], 1)).toBe("rgba(0,0,0,1)");
  });

  it("handles alpha of 0 (fully transparent)", () => {
    expect(rgbString([0, 0, 0], 0)).toBe("rgba(0,0,0,0)");
  });
});

describe("computeScale", () => {
  it("returns targetWidth/imageWidth for width fit mode", () => {
    expect(computeScale(100, 200, 50, 50, "width")).toBe(0.5);
  });

  it("returns targetHeight/imageHeight for height fit mode", () => {
    expect(computeScale(100, 200, 50, 50, "height")).toBe(0.25);
  });

  it("returns min ratio for contain fit mode", () => {
    expect(computeScale(100, 200, 50, 50, "contain")).toBe(0.25);
  });

  it("returns min ratio when width is limiting (contain)", () => {
    expect(computeScale(200, 100, 50, 50, "contain")).toBe(0.25);
  });

  it("handles same-size images", () => {
    expect(computeScale(100, 100, 100, 100, "contain")).toBe(1);
  });

  it("handles upscaling", () => {
    expect(computeScale(50, 50, 100, 100, "contain")).toBe(2);
  });
});

describe("computeDisplayDimensions", () => {
  it("expands width to match canvas aspect ratio in width fit mode", () => {
    const result = computeDisplayDimensions(200, 100, 50, 50, "width");
    expect(result.width).toBe(200);
    expect(result.height).toBe(200);
  });

  it("expands height to match canvas aspect ratio in height fit mode", () => {
    const result = computeDisplayDimensions(100, 200, 50, 50, "height");
    expect(result.width).toBe(200);
    expect(result.height).toBe(200);
  });

  it("uses width as limiting axis for contain when image is wider than tall", () => {
    const result = computeDisplayDimensions(200, 100, 50, 50, "contain");
    expect(result.width).toBe(200);
    expect(result.height).toBe(200);
  });

  it("uses height as limiting axis for contain when image is taller than wide", () => {
    const result = computeDisplayDimensions(100, 200, 50, 50, "contain");
    expect(result.width).toBe(200);
    expect(result.height).toBe(200);
  });

  it("matches canvas aspect ratio for contain when image is square", () => {
    const result = computeDisplayDimensions(100, 100, 50, 50, "contain");
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
  });

  it("computes display dimensions for width fit mode with wide image", () => {
    const result = computeDisplayDimensions(400, 100, 100, 50, "width");
    expect(result.width).toBe(400);
    expect(result.height).toBe(200);
  });

  it("computes display dimensions for height fit mode with tall image", () => {
    const result = computeDisplayDimensions(100, 400, 100, 50, "height");
    expect(result.width).toBe(800);
    expect(result.height).toBe(400);
  });
});
