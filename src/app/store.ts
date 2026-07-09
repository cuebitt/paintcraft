import { create } from "zustand";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";
import type { QuantMethod } from "@/core/quantize";
import type { CanvasType, ImageFitMode, PaintFormat } from "@/types";
import type { RGB } from "@/core/palette";
import type { ResizeFilter } from "@/core/preprocess";
import { DEFAULT_PADDING_COLOR } from "@/core/preprocess";
import { CANVAS_TYPES, findClosestCanvas } from "@/types";

export interface AppState {
  originalUrl: string | null;
  preprocessedUrl: string | null;
  quantizedUrl: string | null;
  adaptivePalette: readonly RGB[];
  loading: boolean;
  error: string | null;
  selectedCanvas: CanvasType;
  showGrid: boolean;
  quantMethod: QuantMethod;
  fitMode: ImageFitMode;
  paddingColor: RGB;
  paddingColorPreview: RGB;
  paddingAlpha: number;
  quantizationEnabled: boolean;
  adaptiveColorCount: number;
  includeFixedPalette: boolean;
  resizeFilter: ResizeFilter;
  unsharpAmount: number;
  title: string;
  author: string;
  signed: boolean;
  embedOriginalImage: boolean;
  paintFormat: PaintFormat;
  glass: boolean;
  sidesActive: boolean;
  showTransparencyGrid: boolean;
  glassPadding: boolean;
}

const initialState: AppState = {
  originalUrl: null,
  preprocessedUrl: null,
  quantizedUrl: null,
  adaptivePalette: [],
  loading: false,
  error: null,
  selectedCanvas: CANVAS_TYPES[0]!,
  showGrid: false,
  quantMethod: "median-cut",
  fitMode: "contain",
  paddingColor: DEFAULT_PADDING_COLOR,
  paddingColorPreview: DEFAULT_PADDING_COLOR,
  paddingAlpha: 1,
  quantizationEnabled: false,
  adaptiveColorCount: 12,
  includeFixedPalette: false,
  resizeFilter: "box",
  unsharpAmount: 0,
  title: "",
  author: "",
  signed: false,
  embedOriginalImage: true,
  paintFormat: "jop-1x",
  glass: false,
  sidesActive: false,
  showTransparencyGrid: true,
  glassPadding: false,
};

interface StoreActions {
  setOriginal: (url: string) => void;
  setResult: (preprocessed: string, processed: string, adaptive: readonly RGB[]) => void;
  importPaint: (args: {
    canvas: CanvasType;
    title: string;
    author: string;
    signed: boolean;
    preprocessed: string;
    processed: string;
    format: PaintFormat;
    glass: boolean;
    sidesActive: boolean;
  }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCanvas: (canvas: CanvasType) => void;
  setShowGrid: (show: boolean) => void;
  setQuantMethod: (method: QuantMethod) => void;
  setFitMode: (mode: ImageFitMode) => void;
  setPaddingColor: (color: RGB, alpha?: number) => void;
  setPaddingColorPreview: (color: RGB, alpha?: number) => void;
  setQuantizationEnabled: (enabled: boolean) => void;
  setAdaptiveColorCount: (count: number) => void;
  setIncludeFixedPalette: (include: boolean) => void;
  setResizeFilter: (filter: ResizeFilter) => void;
  setUnsharpAmount: (amount: number) => void;
  setPaddingAlpha: (alpha: number) => void;
  setTitle: (title: string) => void;
  setAuthor: (author: string) => void;
  setSigned: (signed: boolean) => void;
  setEmbedOriginalImage: (embed: boolean) => void;
  setShowTransparencyGrid: (show: boolean) => void;
  setPaintFormat: (format: PaintFormat) => void;
  setGlass: (glass: boolean) => void;
  setSidesActive: (active: boolean) => void;
  reset: () => void;
}

const VALID_QUANT_METHODS = new Set<string>(["median-cut", "neuquant", "wuquant"]);
const VALID_FIT_MODES = new Set<string>(["contain", "fill", "width", "height"]);
const VALID_RESIZE_FILTERS = new Set<string>([
  "nearest",
  "box",
  "hamming",
  "lanczos2",
  "lanczos3",
  "mks2013",
]);
const VALID_PAINT_FORMATS = new Set<string>(["jop-1x", "jop-delta", "jop-2x"]);

export const useAppStore = create<AppState & StoreActions>()(
  persist(
    temporal(
      (set, get) => ({
        ...initialState,

        setOriginal: (url) => set({ originalUrl: url, error: null }),
        setResult: (preprocessed, processed, adaptive) =>
          set({
            preprocessedUrl: preprocessed,
            quantizedUrl: processed,
            adaptivePalette: adaptive,
            loading: false,
          }),
        importPaint: ({
          canvas,
          title,
          author,
          signed,
          preprocessed,
          processed,
          format,
          glass,
          sidesActive,
        }) => {
          const glassPadding = glass && format === "jop-2x";
          set({
            selectedCanvas: canvas,
            title,
            author,
            signed,
            preprocessedUrl: preprocessed,
            quantizedUrl: processed,
            originalUrl: preprocessed,
            loading: false,
            paintFormat: format,
            glass,
            sidesActive,
            glassPadding,
          });
        },
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error, loading: false }),
        setCanvas: (canvas) => set({ selectedCanvas: canvas }),
        setShowGrid: (show) => set({ showGrid: show }),
        setQuantMethod: (method) => set({ quantMethod: method }),
        setFitMode: (mode) => set({ fitMode: mode }),
        setPaddingColor: (color, alpha) =>
          set({
            paddingColor: color,
            paddingColorPreview: color,
            ...(alpha !== undefined ? { paddingAlpha: alpha } : {}),
          }),
        setPaddingColorPreview: (color, alpha) =>
          set({
            paddingColorPreview: color,
            ...(alpha !== undefined ? { paddingAlpha: alpha } : {}),
          }),
        setQuantizationEnabled: (enabled) => set({ quantizationEnabled: enabled }),
        setAdaptiveColorCount: (count) => set({ adaptiveColorCount: count }),
        setIncludeFixedPalette: (include) => set({ includeFixedPalette: include }),
        setResizeFilter: (filter) => set({ resizeFilter: filter }),
        setUnsharpAmount: (amount) => set({ unsharpAmount: amount }),
        setPaddingAlpha: (alpha) => set({ paddingAlpha: alpha }),
        setTitle: (title) => set({ title }),
        setAuthor: (author) => set({ author }),
        setSigned: (signed) => set({ signed }),
        setEmbedOriginalImage: (embed) => set({ embedOriginalImage: embed }),
        setShowTransparencyGrid: (show) => set({ showTransparencyGrid: show }),
        setPaintFormat: (format) => {
          const state = get();
          set({
            paintFormat: format,
            selectedCanvas: findClosestCanvas(state.selectedCanvas, format),
            glassPadding: state.glass && format === "jop-2x",
          });
        },
        setGlass: (glass) => {
          const state = get();
          set({
            glass,
            glassPadding: glass && state.paintFormat === "jop-2x",
            paddingAlpha: glass ? 0 : 1,
          });
        },
        setSidesActive: (active) => set({ sidesActive: active }),
        reset: () => set(initialState),
      }),
      {
        partialize: (state) => {
          const {
            loading: _loading,
            error: _error,
            showGrid: _showGrid,
            title: _title,
            author: _author,
            signed: _signed,
            embedOriginalImage: _embed,
            sidesActive: _sides,
            showTransparencyGrid: _transparency,
            paddingColorPreview: _preview,
            ...tracked
          } = state;
          return tracked;
        },
        equality: (a, b) => {
          const aKeys = Object.keys(a) as (keyof typeof a)[];
          if (aKeys.length !== Object.keys(b).length) return false;
          for (const key of aKeys) {
            if (key === "preprocessedUrl" || key === "quantizedUrl" || key === "adaptivePalette")
              continue;
            if (a[key] !== b[key]) return false;
          }
          return true;
        },
        limit: 50,
      },
    ),
    {
      name: "paintcraft-preferences",
      partialize: (state) => ({
        quantMethod: state.quantMethod,
        fitMode: state.fitMode,
        resizeFilter: state.resizeFilter,
        paintFormat: state.paintFormat,
      }),
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown>;
        return {
          ...current,
          ...(typeof p.quantMethod === "string" &&
          VALID_QUANT_METHODS.has(p.quantMethod as QuantMethod)
            ? { quantMethod: p.quantMethod as QuantMethod }
            : {}),
          ...(typeof p.fitMode === "string" && VALID_FIT_MODES.has(p.fitMode as ImageFitMode)
            ? { fitMode: p.fitMode as ImageFitMode }
            : {}),
          ...(typeof p.resizeFilter === "string" &&
          VALID_RESIZE_FILTERS.has(p.resizeFilter as ResizeFilter)
            ? { resizeFilter: p.resizeFilter as ResizeFilter }
            : {}),
          ...(typeof p.paintFormat === "string" &&
          VALID_PAINT_FORMATS.has(p.paintFormat as PaintFormat)
            ? { paintFormat: p.paintFormat as PaintFormat }
            : {}),
        };
      },
    },
  ),
);

export function getProcessImageArgs(s: AppState) {
  return [
    s.selectedCanvas,
    s.quantMethod,
    s.fitMode,
    s.paddingColor,
    s.quantizationEnabled,
    { colors: s.adaptiveColorCount, includeFixedPalette: s.includeFixedPalette },
    { filter: s.resizeFilter, unsharpAmount: s.unsharpAmount },
    s.glass ? s.paddingAlpha : 1,
  ] as const;
}
