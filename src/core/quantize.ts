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
  switch (method) {
    case "neuquant":
      return quantizeNeuQuant(imageData, options);
    case "wuquant":
      return quantizeWuQuant(imageData, options);
    case "median-cut":
      return quantizeMedianCut(imageData, options);
  }
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

// TODO: quantizeMedianCut, quantizeNeuQuant, and quantizeWuQuant are nearly
// identical, the only difference is the paletteQuantization value and the
// alpha-preservation step in median-cut. Should deduplicate.
function quantizeMedianCut(imageData: ImageData, options: QuantizeOptions): QuantizeResult {
  const { data } = imageData;
  const alpha = new Uint8Array(data.length / 4);
  for (let i = 0; i < data.length; i += 4) {
    alpha[i / 4] = data[i + 3]!;
  }

  const inPC = utils.PointContainer.fromImageData(imageData);
  const adaptiveQ = buildPaletteSync([inPC], {
    paletteQuantization: MEDIAN_CUT,
    colors: options.colors,
    colorDistanceFormula: DISTANCE,
  });

  const adaptiveColors = extractAdaptiveColors(adaptiveQ.getPointContainer(), options.colors);
  const combinedPalette = buildCombinedPalette(adaptiveColors, options.includeFixedPalette);
  const outPC = applyPalette(inPC, combinedPalette);

  const quantized = pointContainerToImageData(outPC);
  for (let i = 0; i < alpha.length; i++) {
    quantized.data[i * 4 + 3] = alpha[i]!;
  }

  return { quantized, adaptivePalette: adaptiveColors };
}

function quantizeNeuQuant(imageData: ImageData, options: QuantizeOptions): QuantizeResult {
  const inPC = utils.PointContainer.fromImageData(imageData);

  const adaptiveQ = buildPaletteSync([inPC], {
    paletteQuantization: NEUQUANT,
    colors: options.colors,
    colorDistanceFormula: DISTANCE,
  });

  const adaptiveColors = extractAdaptiveColors(adaptiveQ.getPointContainer(), options.colors);
  const combinedPalette = buildCombinedPalette(adaptiveColors, options.includeFixedPalette);
  const outPC = applyPalette(inPC, combinedPalette);

  return { quantized: pointContainerToImageData(outPC), adaptivePalette: adaptiveColors };
}

function quantizeWuQuant(imageData: ImageData, options: QuantizeOptions): QuantizeResult {
  const inPC = utils.PointContainer.fromImageData(imageData);

  const fullQ = buildPaletteSync([inPC], {
    paletteQuantization: WUQUANT,
    colors: 256,
    colorDistanceFormula: DISTANCE,
  });

  const fullColors = extractAdaptiveColors(fullQ.getPointContainer(), options.colors);
  const combinedPalette = buildCombinedPalette(fullColors, options.includeFixedPalette);
  const outPC = applyPalette(inPC, combinedPalette);

  return { quantized: pointContainerToImageData(outPC), adaptivePalette: fullColors };
}
