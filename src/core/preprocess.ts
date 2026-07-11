import type { CanvasType, ImageFitMode } from "@/types";
import type { RGB } from "@/core/palette";
import { computeScale, rgbString } from "@/core/image-utils";
import { acquireCanvas, releaseCanvas } from "@/core/canvas-pool";

export const DEFAULT_PADDING_COLOR: RGB = [255, 255, 255];

const PICA_UNSHARP_RADIUS = 0.6;
const PICA_UNSHARP_THRESHOLD = 1;

export type ResizeFilter = "nearest" | "box" | "hamming" | "lanczos2" | "lanczos3" | "mks2013";

export interface ResizeOptions {
  filter: ResizeFilter;
  unsharpAmount: number;
}

let picaPromise: Promise<typeof import("pica")> | null = null;

async function getPica() {
  if (!picaPromise) {
    picaPromise = import("pica");
  }
  const mod = await picaPromise;
  return mod.default();
}

function renderToCanvas(
  width: number,
  height: number,
  paddingColor: RGB,
  paddingAlpha: number | undefined,
  render: (ctx: CanvasRenderingContext2D) => void,
): ImageData {
  const canvas = acquireCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    releaseCanvas(canvas);
    throw new Error("Could not get 2D context");
  }

  ctx.fillStyle = rgbString(paddingColor, paddingAlpha);
  ctx.fillRect(0, 0, width, height);
  render(ctx);

  const result = ctx.getImageData(0, 0, width, height);
  releaseCanvas(canvas);
  return result;
}

async function resizeWithPica(
  image: HTMLImageElement,
  scaledWidth: number,
  scaledHeight: number,
  options: ResizeOptions,
): Promise<HTMLCanvasElement> {
  const picaInstance = await getPica();
  const sourceCanvas = acquireCanvas(image.width, image.height);
  const sourceCtx = sourceCanvas.getContext("2d");
  if (!sourceCtx) {
    releaseCanvas(sourceCanvas);
    throw new Error("Could not get 2D context for source canvas");
  }
  sourceCtx.drawImage(image, 0, 0);

  const scaledCanvas = acquireCanvas(scaledWidth, scaledHeight);
  await picaInstance.resize(sourceCanvas, scaledCanvas, {
    filter: options.filter as never,
    unsharpAmount: options.unsharpAmount,
    unsharpRadius: PICA_UNSHARP_RADIUS,
    unsharpThreshold: PICA_UNSHARP_THRESHOLD,
  });

  releaseCanvas(sourceCanvas);
  return scaledCanvas;
}

export const preprocessImageForCanvas = async (
  image: HTMLImageElement,
  canvasType: CanvasType,
  fitMode: ImageFitMode = "contain",
  paddingColor: RGB = DEFAULT_PADDING_COLOR,
  resizeOptions: ResizeOptions = { filter: "nearest", unsharpAmount: 0 },
  paddingAlpha?: number,
): Promise<ImageData> => {
  const scale = computeScale(
    image.width,
    image.height,
    canvasType.width,
    canvasType.height,
    fitMode,
  );
  const scaledWidth = Math.floor(image.width * scale);
  const scaledHeight = Math.floor(image.height * scale);
  const offsetX = (canvasType.width - scaledWidth) / 2;
  const offsetY = (canvasType.height - scaledHeight) / 2;

  if (resizeOptions.filter === "nearest") {
    return renderToCanvas(
      canvasType.width,
      canvasType.height,
      paddingColor,
      paddingAlpha,
      (ctx) => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);
      },
    );
  }

  const scaledCanvas = await resizeWithPica(image, scaledWidth, scaledHeight, resizeOptions);
  const result = renderToCanvas(
    canvasType.width,
    canvasType.height,
    paddingColor,
    paddingAlpha,
    (ctx) => {
      ctx.drawImage(scaledCanvas, offsetX, offsetY);
    },
  );
  releaseCanvas(scaledCanvas);
  return result;
};
