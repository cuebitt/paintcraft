import type { ImageFitMode } from "@/types";
import type { RGB } from "@/core/palette";

export function rgbString(color: RGB, alpha?: number): string {
  if (alpha !== undefined) {
    return `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
  }
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}

export function computeScale(
  imageWidth: number,
  imageHeight: number,
  targetWidth: number,
  targetHeight: number,
  fitMode: ImageFitMode,
): number {
  if (fitMode === "width") return targetWidth / imageWidth;
  if (fitMode === "height") return targetHeight / imageHeight;
  return Math.min(targetWidth / imageWidth, targetHeight / imageHeight);
}

export function computeDisplayDimensions(
  imgW: number,
  imgH: number,
  canvasWidth: number,
  canvasHeight: number,
  fitMode: ImageFitMode,
): { width: number; height: number } {
  const targetRatio = canvasWidth / canvasHeight;
  const imageRatio = imgW / imgH;

  if (fitMode === "width") {
    return { width: imgW, height: Math.round(imgW / targetRatio) };
  }
  if (fitMode === "height") {
    return { width: Math.round(imgH * targetRatio), height: imgH };
  }
  if (imageRatio > targetRatio) {
    return { width: imgW, height: Math.round(imgW / targetRatio) };
  }
  return { width: Math.round(imgH * targetRatio), height: imgH };
}

export interface ErrorResponse {
  type: "error";
  message: string;
}

export interface SerializedImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}
