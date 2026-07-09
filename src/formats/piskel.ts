import { compositeLayers, createCanvas, getContext2D, loadImage } from "@/formats/canvas";

interface PiskelChunk {
  layout: number[][];
  base64PNG: string;
}

interface PiskelLayer {
  name: string;
  opacity: number;
  frameCount: number;
  chunks?: PiskelChunk[];
  base64PNG?: string;
}

interface PiskelContent {
  name: string;
  description: string;
  fps: number;
  width: number;
  height: number;
  layers: string[];
}

export interface PiskelFile {
  modelVersion: number;
  piskel: PiskelContent;
}

function findFrameInChunks(
  chunks: PiskelChunk[],
  frameIndex: number,
): { chunk: PiskelChunk; row: number; col: number } | undefined {
  for (const chunk of chunks) {
    for (let row = 0; row < chunk.layout.length; row++) {
      const cols = chunk.layout[row];
      if (!cols) continue;
      for (let col = 0; col < cols.length; col++) {
        if (cols[col] === frameIndex) {
          return { chunk, row, col };
        }
      }
    }
  }
  return undefined;
}

async function extractFirstFrame(
  layer: PiskelLayer,
  width: number,
  height: number,
  modelVersion: number,
): Promise<HTMLCanvasElement | OffscreenCanvas> {
  const canvas = createCanvas(width, height);
  const ctx = getContext2D(canvas);

  if (modelVersion === 1 || !layer.chunks || layer.chunks.length === 0) {
    if (!layer.base64PNG) {
      throw new Error(`Piskel layer "${layer.name}" has no image data`);
    }
    const img = await loadImage(layer.base64PNG);
    ctx.drawImage(img, 0, 0, width, height, 0, 0, width, height);
    return canvas;
  }

  const match = findFrameInChunks(layer.chunks, 0);
  if (!match) {
    throw new Error(`Frame index 0 not found in any chunk for layer "${layer.name}"`);
  }

  const img = await loadImage(match.chunk.base64PNG);
  const sx = match.col * width;
  const sy = match.row * height;
  ctx.drawImage(img, sx, sy, width, height, 0, 0, width, height);
  return canvas;
}

export async function parsePiskel(json: string): Promise<HTMLCanvasElement | OffscreenCanvas> {
  const file: PiskelFile = JSON.parse(json);
  const { modelVersion } = file;
  const { width, height, layers: layerStrings } = file.piskel;

  const layers: PiskelLayer[] = layerStrings.map((s) => JSON.parse(s) as PiskelLayer);

  const frameCanvases = await Promise.all(
    layers.map((layer) => extractFirstFrame(layer, width, height, modelVersion)),
  );
  return compositeLayers(
    frameCanvases.map((canvas, i) => ({ image: canvas, opacity: layers[i]!.opacity })),
    width,
    height,
  );
}
