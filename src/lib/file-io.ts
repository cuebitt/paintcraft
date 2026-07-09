import { saveAs } from "file-saver";
import { generateSlug } from "random-word-slugs";
import type { ImageProcessorWorkers } from "@/hooks/useImageProcessor";
import { useAppStore } from "@/app/store";
import { createCanvas } from "@/formats/canvas";
import {
  writePaintFile,
  readPaintFile,
  getCanvasTypeIndex,
  getCanvasTypeByNbtCt,
  detectFormat,
} from "@/formats/paint-nbt";
import type { PaintingData } from "@/formats/paint-nbt";
import { imageDataToBlob } from "@/lib/utils";
import { dispatchError } from "@/lib/helpers";

function sanitizeForFilename(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 48);
}

export function importPaintFile(file: File, workers: ImageProcessorWorkers) {
  useAppStore.getState().setLoading(true);
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const painting: PaintingData = await readPaintFile(reader.result as ArrayBuffer);

      const detectedFormat = detectFormat(painting);

      const canvasType = getCanvasTypeByNbtCt(painting.canvasType);

      const data = new Uint8ClampedArray(canvasType.width * canvasType.height * 4);
      for (let i = 0; i < painting.pixels.length; i++) {
        const [r, g, b] = painting.pixels[i]!;
        data[i * 4] = r;
        data[i * 4 + 1] = g;
        data[i * 4 + 2] = b;
        data[i * 4 + 3] = 255;
      }
      const imageData = new ImageData(data, canvasType.width, canvasType.height);

      workers.quantizedDataRef.current = {
        quantized: imageData,
        adaptivePalette: [],
      };
      workers.originalImageRef.current = null;
      workers.preprocessedDataRef.current = null;

      let originalUrl: string;
      if (painting.originalImage) {
        const blob = new Blob([new Uint8Array(painting.originalImage).buffer as BlobPart], {
          type: "image/webp",
        });
        originalUrl = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load embedded original image"));
          img.src = originalUrl;
        });
        workers.originalImageRef.current = img;
      } else {
        const blob = await imageDataToBlob(imageData);
        originalUrl = URL.createObjectURL(blob);
      }

      const quantizedBlob = await imageDataToBlob(imageData);
      const quantizedUrl = URL.createObjectURL(quantizedBlob);

      useAppStore.getState().importPaint({
        canvas: canvasType,
        title: painting.title,
        author: painting.author,
        signed: painting.generation === 1 && painting.version === 2,
        preprocessed: originalUrl,
        processed: quantizedUrl,
        format: detectedFormat,
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

export async function exportPaintFile(
  workers: ImageProcessorWorkers,
  state: ReturnType<typeof useAppStore.getState>,
): Promise<void> {
  if (!workers.quantizedDataRef.current) return;

  const { quantized } = workers.quantizedDataRef.current;
  const pixels: [number, number, number][] = [];
  for (let i = 0; i < quantized.data.length; i += 4) {
    pixels.push([quantized.data[i]!, quantized.data[i + 1]!, quantized.data[i + 2]!]);
  }

  let originalImage: Uint8Array | undefined;
  if (state.embedOriginalImage) {
    const preprocessedData = workers.preprocessedDataRef.current;
    if (preprocessedData) {
      try {
        const canvas = new OffscreenCanvas(preprocessedData.width, preprocessedData.height);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.putImageData(preprocessedData, 0, 0);
          const blob = await canvas.convertToBlob({ type: "image/webp" });
          originalImage = new Uint8Array(await blob.arrayBuffer());
        }
      } catch {
        // WebP encoding not supported, skip original image
      }
    }
  }

  // grab edge pixels for jop-2x side rendering
  let sidePixels: [number, number, number][] | undefined;
  if (state.paintFormat === "jop-2x" && state.sidesActive) {
    const { width, height } = state.selectedCanvas;
    sidePixels = [];
    let idx = 0;

    // top + bottom
    for (let x = 0; x < width; x++) {
      const pixelIdx = x;
      sidePixels[idx++] = [
        quantized.data[pixelIdx * 4]!,
        quantized.data[pixelIdx * 4 + 1]!,
        quantized.data[pixelIdx * 4 + 2]!,
      ];
    }
    for (let x = 0; x < width; x++) {
      const pixelIdx = (height - 1) * width + x;
      sidePixels[idx++] = [
        quantized.data[pixelIdx * 4]!,
        quantized.data[pixelIdx * 4 + 1]!,
        quantized.data[pixelIdx * 4 + 2]!,
      ];
    }

    // left + right
    for (let y = 0; y < height; y++) {
      const pixelIdx = y * width;
      sidePixels[idx++] = [
        quantized.data[pixelIdx * 4]!,
        quantized.data[pixelIdx * 4 + 1]!,
        quantized.data[pixelIdx * 4 + 2]!,
      ];
    }
    for (let y = 0; y < height; y++) {
      const pixelIdx = y * width + (width - 1);
      sidePixels[idx++] = [
        quantized.data[pixelIdx * 4]!,
        quantized.data[pixelIdx * 4 + 1]!,
        quantized.data[pixelIdx * 4 + 2]!,
      ];
    }
  }

  const timestamp = Date.now().toString(36);
  const name = `${generateSlug(4)}_${timestamp}`;
  const canvasTypeIndex = getCanvasTypeIndex(state.selectedCanvas);

  const hasAuthorAndTitle = state.author !== "" && state.title !== "";
  const paintBuffer = await writePaintFile(
    {
      canvasType: canvasTypeIndex,
      pixels,
      name,
      author: hasAuthorAndTitle ? state.author : "",
      title: hasAuthorAndTitle ? state.title : "",
      generation: state.signed ? 1 : 0,
      version: state.signed ? 2 : 99,
      originalImage,
      glass: state.paintFormat === "jop-2x" ? state.glass : undefined,
      sidesActive: state.paintFormat === "jop-2x" ? state.sidesActive : undefined,
      sidePixels,
    },
    state.paintFormat,
  );

  let filename: string;
  if (hasAuthorAndTitle) {
    const safeAuthor = sanitizeForFilename(state.author);
    const safeTitle = sanitizeForFilename(state.title);
    filename = `${safeAuthor}_${safeTitle}.paint`;
  } else {
    filename = `${generateSlug(4)}.paint`;
  }

  const blob = new Blob([paintBuffer as BlobPart], { type: "application/octet-stream" });
  saveAs(blob, filename);
}

export async function exportPng(workers: ImageProcessorWorkers): Promise<void> {
  if (!workers.quantizedDataRef.current) return;

  const { quantized } = workers.quantizedDataRef.current;
  const canvas = createCanvas(quantized.width, quantized.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.putImageData(quantized, 0, 0);

  let blob: Blob | null = null;
  if (canvas instanceof HTMLCanvasElement) {
    blob = await new Promise((resolve) =>
      canvas.toBlob(resolve as (b: Blob | null) => void, "image/png"),
    );
  } else {
    blob = await (canvas as OffscreenCanvas).convertToBlob({ type: "image/png" });
  }

  if (!blob) {
    useAppStore.getState().setError("Failed to export PNG");
    return;
  }
  const timestamp = Date.now().toString(36);
  const name = `${generateSlug(4)}_${timestamp}`;
  saveAs(blob, `painting_${name}.png`);
}
