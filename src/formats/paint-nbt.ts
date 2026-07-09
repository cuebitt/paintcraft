import { read, write, Int8, Int32, type CompoundTag } from "nbtify";
import type { CanvasType, PaintFormat } from "@/types";

const PIXEL_COUNTS: Record<number, number> = {
  0: 256, // 16×16
  1: 1024, // 32×32
  2: 512, // 32×16
  3: 512, // 16×32
  4: 2304, // 48×48
  5: 4096, // 64×64
  6: 1536, // 48×32
  7: 3072, // 64×48
  8: 1536, // 32×48
  9: 3072, // 48×64
};

const CANVAS_TYPE_BY_SIZE: Record<string, number> = {
  "16x16": 0,
  "32x32": 1,
  "32x16": 2,
  "16x32": 3,
  "48x48": 4,
  "64x64": 5,
  "48x32": 6,
  "64x48": 7,
  "32x48": 8,
  "48x64": 9,
};

const SUPPORTED_SIZES = Object.keys(CANVAS_TYPE_BY_SIZE).join(", ");

const MAX_CT_FOR_FORMAT: Record<PaintFormat, number> = {
  "jop-1x": 3,
  "jop-delta": 9,
  "jop-2x": 3,
};

export interface PaintingData {
  canvasType: number;
  pixels: [number, number, number][];
  name: string;
  author: string;
  title: string;
  generation: number;
  version: number;
  originalImage?: Uint8Array;
  glass?: boolean;
  sidePixels?: [number, number, number][];
  sidesActive?: boolean;
  format?: PaintFormat;
}

export function getCanvasTypeByNbtCt(
  nbtCt: number,
): CanvasType & { name: string; cellsX: number; cellsY: number } {
  for (const [sizeKey, ct] of Object.entries(CANVAS_TYPE_BY_SIZE)) {
    if (ct === nbtCt) {
      const parts = sizeKey.split("x");
      const width = Number(parts[0]);
      const height = Number(parts[1]);
      return {
        name: `${width}x${height}`,
        width,
        height,
        cellsX: width / 16,
        cellsY: height / 16,
      };
    }
  }
  throw new Error(
    `Unknown NBT canvas type: ${nbtCt}. Supported types are 0-${Object.keys(CANVAS_TYPE_BY_SIZE).length - 1}.`,
  );
}

export function getCanvasTypeIndex(canvas: CanvasType): number {
  const key = `${canvas.width}x${canvas.height}`;
  const idx = CANVAS_TYPE_BY_SIZE[key];
  if (idx === undefined) {
    throw new Error(
      `Unsupported canvas dimensions: ${canvas.width}×${canvas.height}. Supported sizes are ${SUPPORTED_SIZES}.`,
    );
  }
  return idx;
}

export async function writePaintFile(
  data: PaintingData,
  format: PaintFormat = "jop-delta",
): Promise<Uint8Array> {
  const maxCt = MAX_CT_FOR_FORMAT[format];
  if (data.canvasType < 0 || data.canvasType > maxCt) {
    throw new Error(
      `Invalid canvas type: ${data.canvasType}. Must be 0 to ${maxCt} for ${format}.`,
    );
  }

  const expected = PIXEL_COUNTS[data.canvasType];
  if (data.pixels.length !== expected) {
    throw new Error(
      `Expected ${expected} pixels for canvas type ${data.canvasType}, got ${data.pixels.length}.`,
    );
  }

  const argbPixels = data.pixels.map(([r, g, b]) => (0xff << 24) | (r << 16) | (g << 8) | b);

  const fields: CompoundTag = {
    ct: new Int8(data.canvasType),
    pixels: new Int32Array(argbPixels),
    generation: new Int32(data.generation),
    v: new Int32(data.version),
    name: data.name,
    fmt: format,
  };

  if (data.title !== "" && data.author !== "") {
    fields.author = data.author;
    fields.title = data.title;
  }

  if (data.originalImage) {
    fields.img = data.originalImage;
  }

  // jop-2x has extra fields
  if (format === "jop-2x") {
    const hasGlass = data.glass ?? false;
    fields.glass = new Int8(hasGlass ? 1 : 0);

    const sidesActive = data.sidesActive ?? false;
    if (sidesActive && data.sidePixels) {
      fields.sidePixels = new Int32Array(
        data.sidePixels.map(([r, g, b]) => (0xff << 24) | (r << 16) | (g << 8) | b),
      );
      fields.sidesActive = new Int8(1);
    } else {
      fields.sidesActive = new Int8(0);
    }
  }

  return write(fields, { rootName: "", endian: "big", compression: null });
}

export async function readPaintFile(data: ArrayBuffer | Uint8Array): Promise<PaintingData> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const result = await read(bytes, {
    rootName: true,
    endian: "big",
    compression: null,
  });
  const root = result.data as CompoundTag;

  const ct = (root.ct as Int8).valueOf();
  const pixels = root.pixels as unknown as Int32Array;
  const generation = (root.generation as Int32).valueOf();
  const v = (root.v as Int32).valueOf();
  const name = root.name as string;

  let author = "";
  let title = "";
  if (root.author && root.title) {
    author = root.author as string;
    title = root.title as string;
  }

  const img = root.img as Int8Array | Uint8Array | undefined;

  const rgbPixels: [number, number, number][] = Array.from(pixels, (argb: number) => [
    (argb >> 16) & 0xff,
    (argb >> 8) & 0xff,
    argb & 0xff,
  ]);

  const storedFormat = root.fmt as PaintFormat | undefined;
  let detectedFormat: PaintFormat;
  if (storedFormat && ["jop-1x", "jop-2x", "jop-delta"].includes(storedFormat)) {
    detectedFormat = storedFormat;
  } else {
    const hasGlass = "glass" in root;
    const hasSidePixels = "sidePixels" in root;
    const hasSidesActive = "sidesActive" in root;

    if (hasGlass || hasSidePixels || hasSidesActive) {
      detectedFormat = "jop-2x";
    } else if (ct > 3) {
      detectedFormat = "jop-delta";
    } else {
      detectedFormat = "jop-1x";
    }
  }

  let glass = false;
  let sidePixels: [number, number, number][] | undefined;
  let sidesActive = false;

  if (detectedFormat === "jop-2x") {
    glass = (root.glass as Int8).valueOf() === 1;
    sidesActive = (root.sidesActive as Int8).valueOf() === 1;

    if (sidesActive && "sidePixels" in root) {
      const sidePixelsRaw = root.sidePixels as unknown as Int32Array;
      sidePixels = Array.from(sidePixelsRaw, (argb: number) => [
        (argb >> 16) & 0xff,
        (argb >> 8) & 0xff,
        argb & 0xff,
      ]);
    }
  }

  return {
    canvasType: ct,
    pixels: rgbPixels,
    name,
    author,
    title,
    generation,
    version: v,
    format: detectedFormat,
    ...(img ? { originalImage: img instanceof Uint8Array ? img : new Uint8Array(img) } : {}),
    ...(detectedFormat === "jop-2x" ? { glass, sidesActive, sidePixels } : {}),
  };
}

export function detectFormat(painting: PaintingData): PaintFormat {
  if (painting.format) return painting.format;

  const hasGlass = painting.glass !== undefined;
  const hasSidePixels = painting.sidePixels !== undefined;
  const hasSidesActive = painting.sidesActive !== undefined;

  if (hasGlass || hasSidePixels || hasSidesActive) {
    return "jop-2x";
  }
  if (painting.canvasType > 3) {
    return "jop-delta";
  }
  return "jop-1x";
}
