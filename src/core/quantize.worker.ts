import { quantize, type QuantMethod, type QuantizeOptions } from "./quantize";
import type { RGB } from "./palette";
import type { ImageFitMode } from "../types";
import {
  computeScale,
  rgbString,
  type ErrorResponse,
  type SerializedImageData,
} from "./image-utils";

interface QuantizeRequest {
  type: "quantize";
  imageData: SerializedImageData;
  method: QuantMethod;
  options: QuantizeOptions;
}

interface DisplayRequest {
  type: "display";
  imageBitmap: ImageBitmap;
  canvasWidth: number;
  canvasHeight: number;
  fitMode: ImageFitMode;
  paddingColor: RGB;
  paddingAlpha?: number;
}

type WorkerRequest = QuantizeRequest | DisplayRequest;

interface QuantizeResponse {
  type: "quantized";
  quantized: SerializedImageData;
  adaptivePalette: readonly RGB[];
}

interface DisplayResponse {
  type: "displayed";
  imageData: SerializedImageData;
}

type WorkerResponse = QuantizeResponse | DisplayResponse | ErrorResponse;

function handleDisplay(msg: DisplayRequest): DisplayResponse {
  const { imageBitmap, canvasWidth, canvasHeight, fitMode, paddingColor, paddingAlpha } = msg;

  const imgW = imageBitmap.width;
  const imgH = imageBitmap.height;
  const targetRatio = canvasWidth / canvasHeight;
  const imageRatio = imgW / imgH;

  let dw: number;
  let dh: number;

  if (fitMode === "width") {
    dw = imgW;
    dh = Math.round(imgW / targetRatio);
  } else if (fitMode === "height") {
    dh = imgH;
    dw = Math.round(imgH * targetRatio);
  } else {
    if (imageRatio > targetRatio) {
      dw = imgW;
      dh = Math.round(imgW / targetRatio);
    } else {
      dh = imgH;
      dw = Math.round(imgH * targetRatio);
    }
  }

  const scale = computeScale(imgW, imgH, dw, dh, fitMode);
  const scaledWidth = Math.round(imgW * scale);
  const scaledHeight = Math.round(imgH * scale);
  const offsetX = (dw - scaledWidth) / 2;
  const offsetY = (dh - scaledHeight) / 2;

  const canvas = new OffscreenCanvas(dw, dh);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = rgbString(paddingColor, paddingAlpha);
  ctx.fillRect(0, 0, dw, dh);
  ctx.drawImage(imageBitmap, offsetX, offsetY, scaledWidth, scaledHeight);
  imageBitmap.close();

  const imageData = ctx.getImageData(0, 0, dw, dh);

  return {
    type: "displayed",
    imageData: {
      data: imageData.data,
      width: imageData.width,
      height: imageData.height,
    },
  };
}

function handleQuantize(msg: QuantizeRequest): QuantizeResponse {
  const { imageData, method, options } = msg;
  const input = new ImageData(
    imageData.data as Uint8ClampedArray<ArrayBuffer>,
    imageData.width,
    imageData.height,
  );

  const result = quantize(input, method, options);

  return {
    type: "quantized",
    quantized: {
      data: result.quantized.data,
      width: result.quantized.width,
      height: result.quantized.height,
    },
    adaptivePalette: result.adaptivePalette,
  };
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  try {
    const msg = e.data;
    let response: WorkerResponse;

    switch (msg.type) {
      case "display":
        response = handleDisplay(msg);
        break;
      case "quantize":
        response = handleQuantize(msg);
        break;
      default:
        throw new Error(`Unknown message type: ${(msg as { type: string }).type}`);
    }

    const transferable: Transferable[] = [];
    if ("imageData" in response && response.imageData?.data?.buffer) {
      transferable.push(response.imageData.data.buffer);
    }
    if ("quantized" in response && response.quantized?.data?.buffer) {
      transferable.push(response.quantized.data.buffer);
    }
    (self as unknown as Worker).postMessage(response, transferable);
  } catch (err) {
    const response: ErrorResponse = {
      type: "error",
      message: err instanceof Error ? err.message : "Processing failed",
    };
    self.postMessage(response);
  }
};
