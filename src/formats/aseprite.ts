import {
  Aseprite,
  AsepriteColorDepth,
  AsepriteLayerBlendMode,
  type AsepriteCel,
  type AsepritePixel,
} from "@pixelation/aseprite";
import { applyBlendMode } from "@/formats/blend-modes";

const HEADER_SIZE = 128;
const FRAME_MAGIC = 0xf1fa;
const LAYER_CHUNK_TYPE = 0x2004;

interface AsepriteData {
  width: number;
  height: number;
  imageData: ImageData;
}

interface RawLayerMeta {
  name: string;
  level: number;
  type: number;
  visible: boolean;
  opacity: number;
  blend: AsepriteLayerBlendMode;
}

interface ProcessedLayer {
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: AsepriteLayerBlendMode;
  children: ProcessedLayer[];
  cels: AsepriteCel[];
}

interface FlattenedLayer {
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: AsepriteLayerBlendMode;
  cels: AsepriteCel[];
}

function readLeU16(buf: ArrayBuffer, offset: number): number {
  return new DataView(buf).getUint16(offset, true);
}

function readLeU32(buf: ArrayBuffer, offset: number): number {
  return new DataView(buf).getUint32(offset, true);
}

function readStringAt(buf: ArrayBuffer, offset: number): { value: string; bytesRead: number } {
  const len = readLeU16(buf, offset);
  const bytes = new Uint8Array(buf, offset + 2, len);
  return { value: new TextDecoder().decode(bytes), bytesRead: 2 + len };
}

function parseLayerMetadata(buf: ArrayBuffer): RawLayerMeta[] {
  const headerSize = HEADER_SIZE;
  let cursor = headerSize;
  const totalSize = buf.byteLength;

  if (cursor >= totalSize) return [];

  cursor += 4; // frame size
  const frameMagic = readLeU16(buf, cursor);
  cursor += 2;
  if (frameMagic !== FRAME_MAGIC) return [];

  const chunkCount = readLeU16(buf, cursor);
  cursor += 2;
  cursor += 2; // old chunk count
  cursor += 2; // frame duration (ms)
  cursor += 4; // reserved

  const layers: RawLayerMeta[] = [];

  for (let c = 0; c < chunkCount; c++) {
    if (cursor + 6 > totalSize) break;

    const chunkSize = readLeU32(buf, cursor);
    const chunkType = readLeU16(buf, cursor + 4);

    if (chunkType === LAYER_CHUNK_TYPE) {
      let p = cursor + 6;
      const flags = readLeU16(buf, p);
      p += 2;
      const layerType = readLeU16(buf, p);
      p += 2;
      const level = readLeU16(buf, p);
      p += 2;
      p += 2;
      p += 2;
      const blend = readLeU16(buf, p);
      p += 2;
      const opacity = new Uint8Array(buf)[p]!;
      p += 1;
      p += 3;
      const { value: name } = readStringAt(buf, p);

      layers.push({
        name,
        level,
        type: layerType,
        visible: !!(flags & 1),
        opacity,
        blend: blend as AsepriteLayerBlendMode,
      });
    }

    cursor += chunkSize;
  }

  return layers;
}

function buildLayerTree(
  rawLayers: RawLayerMeta[],
  spriteLayers: {
    visible: boolean;
    opacity: number;
    blend: AsepriteLayerBlendMode;
    cels: AsepriteCel[];
  }[],
  level: number,
  startIdx = 0,
): ProcessedLayer[] {
  const result: ProcessedLayer[] = [];
  let i = startIdx;

  while (i < rawLayers.length) {
    const raw = rawLayers[i];
    if (!raw) break;

    if (raw.level < level) break;
    if (raw.level > level) {
      i++;
      continue;
    }

    const spriteLayer = spriteLayers[i];
    const isGroup = raw.type === 1;

    const processed: ProcessedLayer = {
      name: raw.name,
      visible: raw.visible,
      opacity: raw.opacity / 255,
      blendMode: raw.blend,
      children: [],
      cels: spriteLayer?.cels ?? [],
    };

    if (isGroup) {
      i++;
      processed.children = buildLayerTree(rawLayers, spriteLayers, level + 1, i);
    } else {
      i++;
    }

    result.push(processed);
  }

  return result;
}

function flattenLayers(
  layers: ProcessedLayer[],
  parentOpacity: number,
  parentVisible: boolean,
): FlattenedLayer[] {
  const result: FlattenedLayer[] = [];

  for (const layer of layers) {
    const effectiveVisible = parentVisible && layer.visible;
    const effectiveOpacity = parentOpacity * layer.opacity;

    if (layer.children.length > 0) {
      result.push(...flattenLayers(layer.children, effectiveOpacity, effectiveVisible));
    } else {
      result.push({
        name: layer.name,
        visible: effectiveVisible,
        opacity: effectiveOpacity,
        blendMode: layer.blendMode,
        cels: layer.cels,
      });
    }
  }

  return result;
}

function getPixelColor(
  pixel: AsepritePixel,
  depth: AsepriteColorDepth,
  palette: Record<number | string, { red: number; green: number; blue: number; alpha: number }>,
): [number, number, number, number] {
  // @pixelation/aseprite exposes pixels as an opaque type, but in practice each
  // pixel is stored as the raw bytes described by the file's color depth.
  if (depth === AsepriteColorDepth.Rgba) {
    const p = pixel as unknown as Uint8Array;
    return [p[0]!, p[1]!, p[2]!, p[3]!];
  }

  if (depth === AsepriteColorDepth.Grayscale) {
    const p = pixel as unknown as Uint8Array;
    return [p[0]!, p[0]!, p[0]!, p[1]!];
  }

  if (depth === AsepriteColorDepth.Index) {
    const index = pixel as number;
    const entry = palette[index] ?? palette[String(index)];
    if (entry) {
      return [entry.red, entry.green, entry.blue, entry.alpha];
    }
  }

  return [0, 0, 0, 0];
}

function writePixel(
  data: Uint8ClampedArray,
  index: number,
  r: number,
  g: number,
  b: number,
  a: number,
) {
  data[index] = r;
  data[index + 1] = g;
  data[index + 2] = b;
  data[index + 3] = Math.round(a * 255);
}

function compositeCel(
  data: Uint8ClampedArray,
  cel: AsepriteCel,
  width: number,
  height: number,
  depth: AsepriteColorDepth,
  palette: Record<number | string, { red: number; green: number; blue: number; alpha: number }>,
  blendMode: AsepriteLayerBlendMode,
  layerOpacity: number,
) {
  for (let cy = 0; cy < cel.height; cy++) {
    for (let cx = 0; cx < cel.width; cx++) {
      const pixelIndex = cy * cel.width + cx;
      const pixel = cel.pixels[pixelIndex];
      if (pixel === undefined) continue;

      const [r, g, b, a] = getPixelColor(pixel, depth, palette);

      const celOpacity = cel.opacity / 255;
      const finalOpacity = (a / 255) * celOpacity * layerOpacity;
      if (finalOpacity <= 0) continue;

      const targetX = cel.x + cx;
      const targetY = cel.y + cy;
      if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) continue;

      const targetIndex = (targetY * width + targetX) * 4;
      const dstR = data[targetIndex]!;
      const dstG = data[targetIndex + 1]!;
      const dstB = data[targetIndex + 2]!;
      const dstA = data[targetIndex + 3]! / 255;

      const [outR, outG, outB, outA] = applyBlendMode(
        blendMode,
        r,
        g,
        b,
        finalOpacity,
        dstR,
        dstG,
        dstB,
        dstA,
      );

      writePixel(data, targetIndex, outR, outG, outB, outA);
    }
  }
}

function compositeLayers(
  layers: FlattenedLayer[],
  width: number,
  height: number,
  depth: AsepriteColorDepth,
  palette: Record<number | string, { red: number; green: number; blue: number; alpha: number }>,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);

  for (const layer of layers) {
    if (!layer.visible) continue;
    for (const cel of layer.cels) {
      if (!cel.pixels || cel.pixels.length === 0) continue;
      compositeCel(data, cel, width, height, depth, palette, layer.blendMode, layer.opacity);
    }
  }

  return data;
}

function toBuffer(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  if (data.buffer instanceof ArrayBuffer) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  }
  return new Uint8Array(data).buffer as ArrayBuffer;
}

export function readAsepriteFile(data: ArrayBuffer | Uint8Array): AsepriteData {
  return readAsepriteFileFromBuffer(toBuffer(data));
}

function readAsepriteFileFromBuffer(data: ArrayBuffer): AsepriteData {
  const sprite = new Aseprite(data);
  const { width, height, depth } = sprite.header;

  if (sprite.frames.length === 0) {
    throw new Error("Aseprite file contains no frames");
  }

  const firstFrame = sprite.frames[0]!;

  const rawLayers = parseLayerMetadata(data);
  const layerTree = buildLayerTree(rawLayers, firstFrame.layers, 0);
  const flatLayers = flattenLayers(layerTree, 1, true);

  const pixelData = compositeLayers(flatLayers, width, height, depth, sprite.palette);

  const imageData = new ImageData(width, height);
  imageData.data.set(pixelData);

  return { width, height, imageData };
}
