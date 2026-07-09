export type CanvasSource = HTMLCanvasElement | OffscreenCanvas;
export type CanvasImageSource = HTMLImageElement | ImageBitmap;

export function loadImage(dataUri: string): Promise<CanvasImageSource> {
  if (typeof document !== "undefined") {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        const commaIdx = dataUri.lastIndexOf(",");
        if (commaIdx === -1) {
          reject(new Error("Invalid image data URI: missing base64 separator"));
          return;
        }
        const base64 = dataUri.slice(commaIdx + 1);
        const fallback = `data:image/png;base64,${base64}`;
        const img2 = new Image();
        img2.onload = () => resolve(img2);
        img2.onerror = () => reject(new Error("Failed to decode image from data URI"));
        img2.src = fallback;
      };
      img.src = dataUri;
    });
  }

  const commaIdx = dataUri.lastIndexOf(",");
  if (commaIdx === -1) {
    return Promise.reject(new Error("Invalid image data URI: missing base64 separator"));
  }
  const base64 = dataUri.slice(commaIdx + 1);
  const byteString = atob(base64);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "image/png" });
  return createImageBitmap(blob);
}

export function createCanvas(width: number, height: number): CanvasSource {
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  return new OffscreenCanvas(width, height);
}

export async function compositeLayers(
  layers: { image: CanvasSource | CanvasImageSource; opacity: number }[],
  width: number,
  height: number,
): Promise<CanvasSource> {
  const canvas = createCanvas(width, height);
  const ctx = getContext2D(canvas);
  for (const { image, opacity } of layers) {
    ctx.globalAlpha = opacity;
    ctx.drawImage(image, 0, 0);
  }
  ctx.globalAlpha = 1;
  return canvas;
}

export function getContext2D(
  canvas: CanvasSource,
): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas 2d context");
  // The union type from getContext("2d") on HTMLCanvasElement | OffscreenCanvas is too broad;
  // we know the context is always a 2D rendering context here.
  return ctx as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}
