import { describe, it, expect } from "vite-plus/test";
import {
  sanitizeForFilename,
  quantizedToPixels,
  extractSidePixels,
  paintingDataToImageData,
  getPaintBaseName,
} from "@/lib/file-io";
import type { PaintingData } from "@/formats/paint-nbt";
import type { CanvasType } from "@/types";

describe("sanitizeForFilename", () => {
  it("replaces spaces with underscores", () => {
    expect(sanitizeForFilename("hello world")).toBe("hello_world");
  });

  it("removes special characters", () => {
    expect(sanitizeForFilename("a!@#$b")).toBe("ab");
  });

  it("truncates long strings to 48 characters", () => {
    const longStr = "a".repeat(100);
    expect(sanitizeForFilename(longStr)).toBe("a".repeat(48));
  });

  it("handles empty string", () => {
    expect(sanitizeForFilename("")).toBe("");
  });

  it("handles already-clean strings", () => {
    expect(sanitizeForFilename("hello_world-123")).toBe("hello_world-123");
  });
});

describe("quantizedToPixels", () => {
  it("converts a single pixel to a tuple", () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255]);
    const imageData = new ImageData(data, 1, 1);
    expect(quantizedToPixels(imageData)).toEqual([[255, 0, 0]]);
  });

  it("converts multiple pixels in order", () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);
    const imageData = new ImageData(data, 3, 1);
    expect(quantizedToPixels(imageData)).toEqual([
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
    ]);
  });

  it("converts a 2D image row by row", () => {
    const data = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255,
    ]);
    const imageData = new ImageData(data, 2, 2);
    expect(quantizedToPixels(imageData)).toEqual([
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [255, 255, 0],
    ]);
  });

  it("ignores alpha channel", () => {
    const data = new Uint8ClampedArray([128, 64, 32, 100]);
    const imageData = new ImageData(data, 1, 1);
    expect(quantizedToPixels(imageData)).toEqual([[128, 64, 32]]);
  });

  it("handles empty image", () => {
    const imageData = new ImageData(new Uint8ClampedArray(0), 0, 0);
    expect(quantizedToPixels(imageData)).toEqual([]);
  });
});

describe("extractSidePixels", () => {
  it("extracts edge pixels from a 2x2 canvas in correct order", () => {
    // 2x2 image pixels:
    // [0] top-left:     red     (255,0,0)
    // [1] top-right:    green   (0,255,0)
    // [2] bottom-left:  blue    (0,0,255)
    // [3] bottom-right: yellow  (255,255,0)
    const data = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255,
    ]);
    const imageData = new ImageData(data, 2, 2);
    // Order: top, bottom, left, right
    // top: px(0), px(1) = red, green
    // bottom: px(2), px(3) = blue, yellow
    // left: px(0), px(2) = red, blue
    // right: px(1), px(3) = green, yellow
    const result = extractSidePixels(imageData, 2, 2);
    expect(result).toHaveLength(8);
    expect(result[0]).toEqual([255, 0, 0]); // top-left
    expect(result[1]).toEqual([0, 255, 0]); // top-right
    expect(result[2]).toEqual([0, 0, 255]); // bottom-left
    expect(result[3]).toEqual([255, 255, 0]); // bottom-right
    expect(result[4]).toEqual([255, 0, 0]); // left-top
    expect(result[5]).toEqual([0, 0, 255]); // left-bottom
    expect(result[6]).toEqual([0, 255, 0]); // right-top
    expect(result[7]).toEqual([255, 255, 0]); // right-bottom
  });

  it("extracts edge pixels from a 1x1 canvas", () => {
    const data = new Uint8ClampedArray([128, 64, 32, 255]);
    const imageData = new ImageData(data, 1, 1);
    const result = extractSidePixels(imageData, 1, 1);
    expect(result).toHaveLength(4);
    for (const pixel of result) {
      expect(pixel).toEqual([128, 64, 32]);
    }
  });

  it("extracts edge pixels from a 3x3 canvas", () => {
    const data = new Uint8ClampedArray(3 * 3 * 4);
    for (let i = 0; i < 9; i++) {
      data[i * 4] = i;
      data[i * 4 + 1] = i + 1;
      data[i * 4 + 2] = i + 2;
      data[i * 4 + 3] = 255;
    }
    const imageData = new ImageData(data, 3, 3);
    const result = extractSidePixels(imageData, 3, 3);
    expect(result).toHaveLength(12);
    // top row: pixels 0,1,2
    expect(result[0]).toEqual([0, 1, 2]);
    expect(result[1]).toEqual([1, 2, 3]);
    expect(result[2]).toEqual([2, 3, 4]);
    // bottom row: pixels 6,7,8
    expect(result[3]).toEqual([6, 7, 8]);
    expect(result[4]).toEqual([7, 8, 9]);
    expect(result[5]).toEqual([8, 9, 10]);
    // left col: pixels 0,3,6
    expect(result[6]).toEqual([0, 1, 2]);
    expect(result[7]).toEqual([3, 4, 5]);
    expect(result[8]).toEqual([6, 7, 8]);
    // right col: pixels 2,5,8
    expect(result[9]).toEqual([2, 3, 4]);
    expect(result[10]).toEqual([5, 6, 7]);
    expect(result[11]).toEqual([8, 9, 10]);
  });
});

describe("paintingDataToImageData", () => {
  it("converts pixel tuples to RGBA ImageData", () => {
    const canvas: CanvasType = { name: "1x1", width: 1, height: 1, cellsX: 1, cellsY: 1 };
    const painting: PaintingData = {
      canvasType: 0,
      pixels: [[255, 0, 0]],
      name: "test",
      author: "",
      title: "",
      generation: 0,
      version: 99,
    };
    const result = paintingDataToImageData(painting, canvas);
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
    expect(result.data[0]).toBe(255);
    expect(result.data[1]).toBe(0);
    expect(result.data[2]).toBe(0);
    expect(result.data[3]).toBe(255);
  });

  it("maps multiple pixels to the correct indices", () => {
    const canvas: CanvasType = { name: "2x2", width: 2, height: 2, cellsX: 1, cellsY: 1 };
    const painting: PaintingData = {
      canvasType: 1,
      pixels: [
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
        [255, 255, 0],
      ],
      name: "test",
      author: "",
      title: "",
      generation: 0,
      version: 99,
    };
    const result = paintingDataToImageData(painting, canvas);
    expect(result.data[0]).toBe(255);
    expect(result.data[4]).toBe(0);
    expect(result.data[8]).toBe(0);
    expect(result.data[12]).toBe(255);
    expect(result.data[3]).toBe(255);
  });

  it("always sets alpha to 255", () => {
    const canvas: CanvasType = { name: "1x1", width: 1, height: 1, cellsX: 1, cellsY: 1 };
    const painting: PaintingData = {
      canvasType: 0,
      pixels: [[128, 64, 32]],
      name: "test",
      author: "",
      title: "",
      generation: 0,
      version: 99,
    };
    const result = paintingDataToImageData(painting, canvas);
    for (let i = 3; i < result.data.length; i += 4) {
      expect(result.data[i]).toBe(255);
    }
  });
});

describe("getPaintBaseName", () => {
  it("uses author and title when both are present", () => {
    const state = { author: "test_author", title: "test_title" } as any;
    expect(getPaintBaseName(state)).toBe("test_author_test_title");
  });

  it("sanitizes author and title", () => {
    const state = { author: "hello world!", title: "my painting #1" } as any;
    expect(getPaintBaseName(state)).toBe("hello_world_my_painting_1");
  });

  it("falls back to random slug when author or title is missing", () => {
    const state = { author: "", title: "title" } as any;
    const result = getPaintBaseName(state);
    expect(result).toMatch(/^[a-z-]+$/);
  });

  it("falls back to random slug when both are missing", () => {
    const state = { author: "", title: "" } as any;
    const result = getPaintBaseName(state);
    expect(result).toMatch(/^[a-z-]+$/);
  });
});
