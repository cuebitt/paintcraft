import { describe, it, expect } from "vite-plus/test";
import {
  writePaintFile,
  readPaintFile,
  getCanvasTypeIndex,
  getCanvasTypeByNbtCt,
  detectFormat,
} from "@/formats/paint-nbt";
import type { PaintingData } from "@/formats/paint-nbt";
import { CANVAS_TYPES } from "@/types";

function makePaintData(
  canvasType: number,
  pixelCount: number,
  overrides: Partial<PaintingData> = {},
): PaintingData {
  const pixels: [number, number, number][] = Array.from({ length: pixelCount }, (_, i) => [
    (i * 37) & 0xff,
    (i * 73) & 0xff,
    (i * 113) & 0xff,
  ]);
  return {
    canvasType,
    pixels,
    name: "test_painting",
    author: "",
    title: "",
    generation: 0,
    version: 99,
    ...overrides,
  };
}

describe("getCanvasTypeIndex", () => {
  it("maps every supported canvas size to its index", () => {
    // Canvas type indices follow the .paint file spec order, not CANVAS_TYPES order.
    const expected = [0, 2, 3, 1, 4, 5, 6, 7, 8, 9];
    for (let i = 0; i < CANVAS_TYPES.length; i++) {
      expect(getCanvasTypeIndex(CANVAS_TYPES[i]!)).toBe(expected[i]);
    }
  });

  it("throws for unknown dimensions", () => {
    expect(() =>
      getCanvasTypeIndex({ name: "Custom", width: 100, height: 100, cellsX: 5, cellsY: 5 }),
    ).toThrow("Unsupported canvas dimensions");
  });
});

describe("writePaintFile", () => {
  it("rejects invalid canvas types", async () => {
    await expect(writePaintFile(makePaintData(-1, 256))).rejects.toThrow("Invalid canvas type");
    await expect(writePaintFile(makePaintData(10, 256))).rejects.toThrow("Invalid canvas type");
  });

  it("rejects a pixel count that does not match the canvas", async () => {
    await expect(writePaintFile(makePaintData(0, 100))).rejects.toThrow("Expected 256 pixels");
    await expect(writePaintFile(makePaintData(1, 100))).rejects.toThrow("Expected 1024 pixels");
    await expect(writePaintFile(makePaintData(4, 100))).rejects.toThrow("Expected 2304 pixels");
  });

  it("writes a non-empty Uint8Array for valid input", async () => {
    const result = await writePaintFile(makePaintData(0, 256));
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.byteLength).toBeGreaterThan(0);
  });
});

describe("readPaintFile", () => {
  it("round-trips a Small canvas", async () => {
    const data = makePaintData(0, 256);
    const result = await readPaintFile(await writePaintFile(data));
    expect(result.canvasType).toBe(0);
    expect(result.pixels).toHaveLength(256);
    expect(result.name).toBe("test_painting");
    expect(result.generation).toBe(0);
    expect(result.version).toBe(99);
  });

  it("round-trips a Large canvas", async () => {
    const data = makePaintData(1, 1024);
    const result = await readPaintFile(await writePaintFile(data));
    expect(result.canvasType).toBe(1);
    expect(result.pixels).toHaveLength(1024);
  });

  it("round-trips a non-square canvas", async () => {
    const data = makePaintData(2, 512);
    const result = await readPaintFile(await writePaintFile(data));
    expect(result.canvasType).toBe(2);
    expect(result.pixels).toHaveLength(512);
  });

  it("round-trips a big square canvas", async () => {
    const data = makePaintData(4, 2304);
    const result = await readPaintFile(await writePaintFile(data));
    expect(result.canvasType).toBe(4);
    expect(result.pixels).toHaveLength(2304);
  });

  it("preserves RGB values through ARGB encoding", async () => {
    const data = makePaintData(0, 256);
    const result = await readPaintFile(await writePaintFile(data));
    for (let i = 0; i < data.pixels.length; i++) {
      expect(result.pixels[i]).toEqual(data.pixels[i]);
    }
  });

  it("preserves author and title when both are provided", async () => {
    const data = makePaintData(0, 256, { author: "Player", title: "Sunset" });
    const result = await readPaintFile(await writePaintFile(data));
    expect(result.author).toBe("Player");
    expect(result.title).toBe("Sunset");
  });

  it("drops author and title unless both are provided", async () => {
    const onlyAuthor = makePaintData(0, 256, { author: "Player", title: "" });
    const onlyTitle = makePaintData(0, 256, { author: "", title: "Sunset" });
    const neither = makePaintData(0, 256, { author: "", title: "" });

    for (const data of [onlyAuthor, onlyTitle, neither]) {
      const result = await readPaintFile(await writePaintFile(data));
      expect(result.author).toBe("");
      expect(result.title).toBe("");
    }
  });

  it("preserves generation and version fields", async () => {
    const data = makePaintData(0, 256, { generation: 1, version: 2 });
    const result = await readPaintFile(await writePaintFile(data));
    expect(result.generation).toBe(1);
    expect(result.version).toBe(2);
  });

  it("round-trips original image bytes", async () => {
    const fakeImage = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x01, 0x02, 0x03]);
    const data = makePaintData(0, 256, { originalImage: fakeImage });
    const result = await readPaintFile(await writePaintFile(data));
    expect(result.originalImage).toBeInstanceOf(Uint8Array);
    expect(result.originalImage).toEqual(fakeImage);
  });

  it("omits original image when not provided", async () => {
    const data = makePaintData(0, 256);
    const result = await readPaintFile(await writePaintFile(data));
    expect(result.originalImage).toBeUndefined();
  });
});

describe("writePaintFile format validation", () => {
  it("rejects canvas type > 3 for jop-1x format", async () => {
    await expect(writePaintFile(makePaintData(4, 2304), "jop-1x")).rejects.toThrow(
      "Must be 0 to 3 for jop-1x",
    );
  });

  it("rejects canvas type > 3 for jop-2x format", async () => {
    await expect(writePaintFile(makePaintData(4, 2304), "jop-2x")).rejects.toThrow(
      "Must be 0 to 3 for jop-2x",
    );
  });

  it("allows canvas type 4-9 for jop-delta format", async () => {
    const result = await writePaintFile(makePaintData(4, 2304), "jop-delta");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.byteLength).toBeGreaterThan(0);
  });
});

describe("jop-2x format fields", () => {
  it("round-trips glass field", async () => {
    const data = makePaintData(0, 256, { glass: true });
    const result = await readPaintFile(await writePaintFile(data, "jop-2x"));
    expect(result.glass).toBe(true);
  });

  it("round-trips sidesActive and sidePixels", async () => {
    const sidePixelCount = 2 * 16 + 2 * 16; // 64 for 16x16 canvas
    const sidePixels: [number, number, number][] = Array.from(
      { length: sidePixelCount },
      (_, i) => [(i * 17) & 0xff, (i * 31) & 0xff, (i * 47) & 0xff],
    );
    const data = makePaintData(0, 256, { glass: false, sidesActive: true, sidePixels });
    const result = await readPaintFile(await writePaintFile(data, "jop-2x"));
    expect(result.sidesActive).toBe(true);
    expect(result.sidePixels).toHaveLength(sidePixelCount);
    for (let i = 0; i < sidePixelCount; i++) {
      expect(result.sidePixels![i]).toEqual(sidePixels[i]);
    }
  });

  it("defaults sidesActive to false when not provided", async () => {
    const data = makePaintData(0, 256);
    const result = await readPaintFile(await writePaintFile(data, "jop-2x"));
    expect(result.sidesActive).toBe(false);
  });
});

describe("detectFormat", () => {
  it("detects jop-1x format", () => {
    const painting: PaintingData = {
      canvasType: 0,
      pixels: [],
      name: "",
      author: "",
      title: "",
      generation: 0,
      version: 1,
    };
    expect(detectFormat(painting)).toBe("jop-1x");
  });

  it("detects jop-delta format from ct > 3", () => {
    const painting: PaintingData = {
      canvasType: 4,
      pixels: [],
      name: "",
      author: "",
      title: "",
      generation: 0,
      version: 1,
    };
    expect(detectFormat(painting)).toBe("jop-delta");
  });

  it("detects jop-2x format from glass field", () => {
    const painting: PaintingData = {
      canvasType: 0,
      pixels: [],
      name: "",
      author: "",
      title: "",
      generation: 0,
      version: 1,
      glass: true,
    };
    expect(detectFormat(painting)).toBe("jop-2x");
  });

  it("detects jop-2x format from sidesActive field", () => {
    const painting: PaintingData = {
      canvasType: 0,
      pixels: [],
      name: "",
      author: "",
      title: "",
      generation: 0,
      version: 1,
      sidesActive: true,
    };
    expect(detectFormat(painting)).toBe("jop-2x");
  });
});

describe("getCanvasTypeByNbtCt", () => {
  it("maps ct 0 to 16x16", () => {
    const result = getCanvasTypeByNbtCt(0);
    expect(result.name).toBe("16x16");
    expect(result.width).toBe(16);
    expect(result.height).toBe(16);
    expect(result.cellsX).toBe(1);
    expect(result.cellsY).toBe(1);
  });

  it("maps ct 1 to 32x32", () => {
    const result = getCanvasTypeByNbtCt(1);
    expect(result.width).toBe(32);
    expect(result.height).toBe(32);
  });

  it("maps ct 4 to 48x48", () => {
    const result = getCanvasTypeByNbtCt(4);
    expect(result.width).toBe(48);
    expect(result.height).toBe(48);
    expect(result.cellsX).toBe(3);
    expect(result.cellsY).toBe(3);
  });

  it("maps ct 5 to 64x64", () => {
    const result = getCanvasTypeByNbtCt(5);
    expect(result.width).toBe(64);
    expect(result.height).toBe(64);
  });

  it("roundtrips with getCanvasTypeIndex", () => {
    for (let ct = 0; ct <= 9; ct++) {
      const canvas = getCanvasTypeByNbtCt(ct);
      expect(getCanvasTypeIndex(canvas)).toBe(ct);
    }
  });

  it("throws for unknown ct", () => {
    expect(() => getCanvasTypeByNbtCt(99)).toThrow("Unknown NBT canvas type: 99");
  });

  it("throws for negative ct", () => {
    expect(() => getCanvasTypeByNbtCt(-1)).toThrow("Unknown NBT canvas type: -1");
  });
});
