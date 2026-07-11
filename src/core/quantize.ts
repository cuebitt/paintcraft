import {
  buildPaletteSync,
  applyPaletteSync,
  utils,
  type ColorDistanceFormula,
  type ImageQuantization,
  type PaletteQuantization,
} from "image-q";
import { FIXED_PALETTE, type RGB } from "@/core/palette";

export type QuantMethod = "median-cut" | "neuquant" | "wuquant";

export interface QuantizeOptions {
  colors: number;
  includeFixedPalette: boolean;
}

interface QuantizeResult {
  quantized: ImageData;
  adaptivePalette: readonly RGB[];
}

const setAlpha = (data: Uint8ClampedArray, i: number, alpha: number) => {
  data[i * 4 + 3] = alpha;
};

const DITHER: ImageQuantization = "floyd-steinberg";
const DISTANCE: ColorDistanceFormula = "cie94-graphic-arts";
const MEDIAN_CUT: PaletteQuantization = "rgbquant";
const NEUQUANT: PaletteQuantization = "neuquant";
const WUQUANT: PaletteQuantization = "wuquant";

export function quantize(
  imageData: ImageData,
  method: QuantMethod = "median-cut",
  options: QuantizeOptions = { colors: 12, includeFixedPalette: true },
): QuantizeResult {
  return quantizeImage(imageData, method, options);
}

function pointContainerToImageData(pc: utils.PointContainer): ImageData {
  return new ImageData(new Uint8ClampedArray(pc.toUint8Array()), pc.getWidth(), pc.getHeight());
}

function buildCombinedPalette(adaptiveColors: RGB[], includeFixed: boolean): utils.Palette {
  const combined = includeFixed ? [...FIXED_PALETTE, ...adaptiveColors] : adaptiveColors;
  const palette = new utils.Palette();
  for (const [r, g, b] of combined) {
    palette.add(utils.Point.createByRGBA(r, g, b, 255));
  }
  palette.sort();
  return palette;
}

function extractAdaptiveColors(pc: utils.PointContainer, maxColors: number): RGB[] {
  const pointArray = pc.getPointArray();
  const colors: RGB[] = [];
  for (let i = 0; i < Math.min(maxColors, pointArray.length); i++) {
    const p = pointArray[i]!;
    colors.push([p.r, p.g, p.b]);
  }
  return colors;
}

function applyPalette(inPC: utils.PointContainer, palette: utils.Palette): utils.PointContainer {
  return applyPaletteSync(inPC, palette, {
    imageQuantization: DITHER,
    colorDistanceFormula: DISTANCE,
  });
}

const QUANT_CONFIG: Record<
  QuantMethod,
  { paletteQuantization: PaletteQuantization; preserveAlpha: boolean; buildColors: number }
> = {
  "median-cut": { paletteQuantization: MEDIAN_CUT, preserveAlpha: true, buildColors: 0 },
  neuquant: { paletteQuantization: NEUQUANT, preserveAlpha: false, buildColors: 0 },
  wuquant: { paletteQuantization: WUQUANT, preserveAlpha: false, buildColors: 256 },
};

function quantizeImage(
  imageData: ImageData,
  method: QuantMethod,
  options: QuantizeOptions,
): QuantizeResult {
  const { data } = imageData;
  const config = QUANT_CONFIG[method];

  let alpha: Uint8Array | undefined;
  if (config.preserveAlpha) {
    alpha = new Uint8Array(data.length / 4);
    for (let i = 0; i < data.length; i += 4) {
      alpha[i / 4] = data[i + 3]!;
    }
  }

  const inPC = utils.PointContainer.fromImageData(imageData);
  const buildColors = config.buildColors || options.colors;
  const adaptiveQ = buildPaletteSync([inPC], {
    paletteQuantization: config.paletteQuantization,
    colors: buildColors,
    colorDistanceFormula: DISTANCE,
  });

  const adaptiveColors = extractAdaptiveColors(adaptiveQ.getPointContainer(), options.colors);
  const combinedPalette = buildCombinedPalette(adaptiveColors, options.includeFixedPalette);
  const outPC = applyPalette(inPC, combinedPalette);

  const quantized = pointContainerToImageData(outPC);
  if (alpha) {
    for (let i = 0; i < alpha.length; i++) {
      setAlpha(quantized.data, i, alpha[i]!);
    }
  }

  return { quantized, adaptivePalette: adaptiveColors };
}
