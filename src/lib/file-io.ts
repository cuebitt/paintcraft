import { saveAs } from "file-saver";
import { generateSlug } from "random-word-slugs";
import { zipSync } from "fflate";
import type { ImageProcessorWorkers } from "@/hooks/useImageProcessor";
import { useAppStore } from "@/app/store";
import { createCanvas, getContext2D } from "@/formats/canvas";
import type { CanvasType } from "@/types";
import {
  writePaintFile,
  readPaintFile,
  getCanvasTypeIndex,
  getCanvasTypeByNbtCt,
  detectFormat,
} from "@/formats/paint-nbt";
import type { PaintingData } from "@/formats/paint-nbt";
import { canvasToBlob, imageDataToBlob } from "@/lib/utils";
import { dispatchError } from "@/lib/helpers";
import { computeTiles } from "@/core/tiling";

export function sanitizeForFilename(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 48);
}

export function paintingDataToImageData(painting: PaintingData, canvas: CanvasType): ImageData {
  const data = new Uint8ClampedArray(canvas.width * canvas.height * 4);
  for (let i = 0; i < painting.pixels.length; i++) {
    const [r, g, b] = painting.pixels[i]!;
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return new ImageData(data, canvas.width, canvas.height);
}

export function importPaintFile(file: File, workers: ImageProcessorWorkers) {
  useAppStore.getState().setLoading(true);
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const painting: PaintingData = await readPaintFile(reader.result as ArrayBuffer);
      const canvasType = getCanvasTypeByNbtCt(painting.canvasType);
      const format = detectFormat(painting);

      const imageData = paintingDataToImageData(painting, canvasType);

      workers.quantizedDataRef.current = { quantized: imageData, adaptivePalette: [] };
      workers.originalImageRef.current = null;
      workers.preprocessedDataRef.current = null;

      let originalUrl: string;
      if (painting.originalImage) {
        const blob = new Blob([new Uint8Array(painting.originalImage)], { type: "image/webp" });
        originalUrl = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load embedded original image"));
          img.src = originalUrl;
        });
        workers.originalImageRef.current = img;
      } else {
        originalUrl = URL.createObjectURL(await imageDataToBlob(imageData));
      }

      const quantizedUrl = URL.createObjectURL(await imageDataToBlob(imageData));

      useAppStore.getState().importPaint({
        canvas: canvasType,
        title: painting.title,
        author: painting.author,
        signed: painting.generation === 1 && painting.version === 2,
        preprocessed: originalUrl,
        processed: quantizedUrl,
        format,
        glass: painting.glass ?? false,
        sidesActive: painting.sidesActive ?? false,
      });
      useAppStore.temporal.getState().clear();
    } catch (err) {
      dispatchError(err, `Failed to import ${file.name}`);
    }
  };
  reader.onerror = () => {
    dispatchError(new Error(`Failed to read ${file.name}`), `Failed to read ${file.name}`);
  };
  reader.readAsArrayBuffer(file);
}

export function quantizedToPixels(quantized: ImageData): [number, number, number][] {
  const pixels: [number, number, number][] = [];
  for (let i = 0; i < quantized.data.length; i += 4) {
    pixels.push([quantized.data[i]!, quantized.data[i + 1]!, quantized.data[i + 2]!]);
  }
  return pixels;
}

export async function encodeOriginalImage(
  preprocessedData: ImageData | null,
): Promise<Uint8Array | undefined> {
  if (!preprocessedData) return;
  try {
    const canvas = new OffscreenCanvas(preprocessedData.width, preprocessedData.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(preprocessedData, 0, 0);
    const blob = await canvas.convertToBlob({ type: "image/webp" });
    return new Uint8Array(await blob.arrayBuffer());
  } catch {
    // WebP encoding not supported, skip original image
  }
}

export function extractSidePixels(
  quantized: ImageData,
  width: number,
  height: number,
): [number, number, number][] {
  const getPixel = (idx: number) =>
    [quantized.data[idx * 4]!, quantized.data[idx * 4 + 1]!, quantized.data[idx * 4 + 2]!] as [
      number,
      number,
      number,
    ];

  return [
    ...Array.from({ length: width }, (_, x) => getPixel(x)),
    ...Array.from({ length: width }, (_, x) => getPixel((height - 1) * width + x)),
    ...Array.from({ length: height }, (_, y) => getPixel(y * width)),
    ...Array.from({ length: height }, (_, y) => getPixel(y * width + (width - 1))),
  ];
}

export function getPaintBaseName(state: ReturnType<typeof useAppStore.getState>): string {
  if (state.author && state.title) {
    return `${sanitizeForFilename(state.author)}_${sanitizeForFilename(state.title)}`;
  }
  return generateSlug(4);
}

export function sliceImageData(
  src: ImageData,
  sx: number,
  sy: number,
  w: number,
  h: number,
): ImageData {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const srcOff = ((sy + y) * src.width + sx) * 4;
    const dstOff = y * w * 4;
    out.set(src.data.subarray(srcOff, srcOff + w * 4), dstOff);
  }
  return new ImageData(out, w, h);
}

export async function exportPaintFile(
  workers: ImageProcessorWorkers,
  state: ReturnType<typeof useAppStore.getState>,
): Promise<void> {
  if (!workers.quantizedDataRef.current) return;

  const hasAuthorAndTitle = state.author !== "" && state.title !== "";
  const baseName = getPaintBaseName(state);
  const commonFields = {
    author: hasAuthorAndTitle ? state.author : "",
    title: hasAuthorAndTitle ? state.title : "",
    generation: state.signed ? 1 : 0,
    version: state.signed ? 2 : 99,
    glass: state.paintFormat === "jop-2x" ? state.glass : undefined,
    sidesActive: state.paintFormat === "jop-2x" ? state.sidesActive : undefined,
  } as const;

  if (state.multiCanvas) {
    const { quantized } = workers.quantizedDataRef.current;
    const tiles = computeTiles(state.multiWidth, state.multiHeight, state.paintFormat);
    const n = tiles.length;
    const zipEntries: Record<string, Uint8Array> = {};
    for (let i = 0; i < n; i++) {
      const tile = tiles[i]!;
      const sx = tile.x * 16;
      const sy = tile.y * 16;
      const tw = tile.canvasType.width;
      const th = tile.canvasType.height;
      const sliced = sliceImageData(quantized, sx, sy, tw, th);
      const pixels = quantizedToPixels(sliced);
      const sidePixels =
        state.paintFormat === "jop-2x" && state.sidesActive
          ? extractSidePixels(sliced, tw, th)
          : undefined;
      const slicedOriginal = workers.preprocessedDataRef.current
        ? sliceImageData(workers.preprocessedDataRef.current, sx, sy, tw, th)
        : null;
      const originalImage = await encodeOriginalImage(slicedOriginal);
      const paintBuffer = await writePaintFile(
        {
          canvasType: getCanvasTypeIndex(tile.canvasType),
          pixels,
          name: `${baseName}_${i + 1}of${n}`,
          ...commonFields,
          originalImage,
          sidePixels,
        },
        state.paintFormat,
      );
      zipEntries[`${baseName}_${i + 1}of${n}.paint`] = paintBuffer;
    }
    const layoutLines = [
      `Paintcraft multi-canvas layout`,
      `Base: ${baseName}`,
      `Size: ${state.multiWidth}×${state.multiHeight} blocks (${state.multiWidth * 16}×${state.multiHeight * 16}px)`,
      `Format: ${state.paintFormat}`,
      `Paintings: ${n}`,
      `Order: row-major, top-left = 1`,
      ``,
      ...tiles.map(
        (t, idx) =>
          `${idx + 1}of${n}: ${t.canvasType.name} ${t.canvasType.cellsX}×${t.canvasType.cellsY} at block (${t.x},${t.y}) → pixels (${t.x * 16},${t.y * 16}) ${t.canvasType.width}×${t.canvasType.height} → ${baseName}_${idx + 1}of${n}.paint`,
      ),
    ];
    zipEntries[`${baseName}_layout.txt`] = new TextEncoder().encode(layoutLines.join("\n"));
    const zipped = zipSync(zipEntries);
    const blob = new Blob([zipped as BlobPart], { type: "application/zip" });
    saveAs(blob, `${baseName}.zip`);
    return;
  }

  const { quantized } = workers.quantizedDataRef.current;
  const pixels = quantizedToPixels(quantized);
  const originalImage = await encodeOriginalImage(workers.preprocessedDataRef.current);

  const sidePixels =
    state.paintFormat === "jop-2x" && state.sidesActive
      ? extractSidePixels(quantized, state.selectedCanvas.width, state.selectedCanvas.height)
      : undefined;

  const name = `${generateSlug(4)}_${Date.now().toString(36)}`;
  const canvasTypeIndex = getCanvasTypeIndex(state.selectedCanvas);

  const paintBuffer = await writePaintFile(
    {
      canvasType: canvasTypeIndex,
      pixels,
      name,
      ...commonFields,
      originalImage,
      sidePixels,
    },
    state.paintFormat,
  );

  const blob = new Blob([paintBuffer as BlobPart], { type: "application/octet-stream" });
  saveAs(blob, `${getPaintBaseName(state)}.paint`);
}

export async function exportPng(workers: ImageProcessorWorkers): Promise<void> {
  if (!workers.quantizedDataRef.current) return;

  const { quantized } = workers.quantizedDataRef.current;
  const canvas = createCanvas(quantized.width, quantized.height);
  const ctx = getContext2D(canvas);
  ctx.putImageData(quantized, 0, 0);

  let blob: Blob;
  try {
    blob = await canvasToBlob(canvas);
  } catch {
    useAppStore.getState().setError("Failed to export PNG");
    return;
  }
  const timestamp = Date.now().toString(36);
  const name = `${generateSlug(4)}_${timestamp}`;
  saveAs(blob, `painting_${name}.png`);
}
