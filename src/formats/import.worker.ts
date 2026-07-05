import { imageDataToBlob } from "../lib/utils";
import type { ErrorResponse } from "../core/image-utils";

interface ParseAsepriteRequest {
  type: "parseAseprite";
  buffer: ArrayBuffer;
}

interface ParsePsdRequest {
  type: "parsePsd";
  buffer: ArrayBuffer;
}

interface ParseSvgRequest {
  type: "parseSvg";
  text: string;
}

interface ParsePiskelRequest {
  type: "parsePiskel";
  text: string;
}

interface ParsePixilRequest {
  type: "parsePixil";
  text: string;
}

type ParseRequest =
  | ParseAsepriteRequest
  | ParsePsdRequest
  | ParseSvgRequest
  | ParsePiskelRequest
  | ParsePixilRequest;

interface ParseResponse {
  type: "result";
  width: number;
  height: number;
  imageData: Uint8ClampedArray;
}

async function parseSvg(svgText: string): Promise<ParseResponse> {
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const bitmap = await createImageBitmap(blob);

  if (bitmap.width === 0 || bitmap.height === 0) {
    throw new Error("SVG must have explicit width and height attributes");
  }

  const { width, height } = bitmap;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const imageData = ctx.getImageData(0, 0, width, height);

  const pngBlob = await imageDataToBlob(imageData);
  const arrayBuffer = await pngBlob.arrayBuffer();

  return {
    type: "result",
    width,
    height,
    imageData: new Uint8ClampedArray(arrayBuffer),
  };
}

async function parseImageDataFile(
  buffer: ArrayBuffer,
  parse: (data: ArrayBuffer) => { width: number; height: number; imageData: ImageData },
): Promise<ParseResponse> {
  const data = parse(buffer);
  const pngBlob = await imageDataToBlob(data.imageData);
  const arrayBuffer = await pngBlob.arrayBuffer();

  return {
    type: "result",
    width: data.width,
    height: data.height,
    imageData: new Uint8ClampedArray(arrayBuffer),
  };
}

async function parseAseprite(buffer: ArrayBuffer): Promise<ParseResponse> {
  const { readAsepriteFile } = await import("./aseprite");
  return parseImageDataFile(buffer, readAsepriteFile);
}

async function parsePsd(buffer: ArrayBuffer): Promise<ParseResponse> {
  const { readPsdFile } = await import("./psd");
  return parseImageDataFile(buffer, readPsdFile);
}

async function canvasToPngBytes(
  canvas: HTMLCanvasElement | OffscreenCanvas,
): Promise<Uint8ClampedArray> {
  if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    const pngBlob = await canvas.convertToBlob({ type: "image/png" });
    const arrayBuffer = await pngBlob.arrayBuffer();
    return new Uint8ClampedArray(arrayBuffer);
  }

  const htmlCanvas = canvas as HTMLCanvasElement;
  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    htmlCanvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create PNG blob"));
    }, "image/png");
  });
  const arrayBuffer = await pngBlob.arrayBuffer();
  return new Uint8ClampedArray(arrayBuffer);
}

async function parsePiskel(text: string): Promise<ParseResponse> {
  const { parsePiskel } = await import("./piskel");
  const canvas = await parsePiskel(text);

  return {
    type: "result",
    width: canvas.width,
    height: canvas.height,
    imageData: await canvasToPngBytes(canvas),
  };
}

async function parsePixil(text: string): Promise<ParseResponse> {
  const { parsePixil } = await import("./pixil");
  const canvas = await parsePixil(text);

  return {
    type: "result",
    width: canvas.width,
    height: canvas.height,
    imageData: await canvasToPngBytes(canvas),
  };
}

self.onmessage = async (e: MessageEvent<ParseRequest>) => {
  try {
    const msg = e.data;
    let response: ParseResponse;

    switch (msg.type) {
      case "parseAseprite":
        response = await parseAseprite(msg.buffer);
        break;
      case "parsePsd":
        response = await parsePsd(msg.buffer);
        break;
      case "parseSvg":
        response = await parseSvg(msg.text);
        break;
      case "parsePiskel":
        response = await parsePiskel(msg.text);
        break;
      case "parsePixil":
        response = await parsePixil(msg.text);
        break;
      default:
        throw new Error(`Unknown message type: ${(msg as { type: string }).type}`);
    }

    const transferable: Transferable[] = [];
    if (response.imageData?.buffer) {
      transferable.push(response.imageData.buffer);
    }
    (self as unknown as Worker).postMessage(response, transferable);
  } catch (err) {
    const response: ErrorResponse = {
      type: "error",
      message: err instanceof Error ? err.message : "Import failed",
    };
    self.postMessage(response);
  }
};
