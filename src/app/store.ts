import { create } from "zustand";
import type { QuantMethod } from "@/core/quantize";
import type { CanvasType, ImageFitMode, PaintFormat } from "@/types";
import type { RGB } from "@/core/palette";
import type { ResizeFilter } from "@/core/preprocess";
import { DEFAULT_PADDING_COLOR } from "@/core/preprocess";
import { CANVAS_TYPES, findClosestCanvas } from "@/types";
import { loadPreferences } from "@/hooks/preferences";

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

const MAX_HISTORY = 50;

const UI_ONLY_ACTIONS = new Set<string>([
  "setShowGrid",
  "setTitle",
  "setAuthor",
  "setSigned",
  "setEmbedOriginalImage",
  "setSidesActive",
  "setShowTransparencyGrid",
  "setPaddingColorPreview",
  "setLoading",
  "setError",
]);

export type Snapshot = AppState;

interface StoreActions {
  _set: (partial: Partial<AppState>, actionName?: string) => void;
  _restore: (snap: Snapshot) => void;
  undo: () => void;
  redo: () => void;

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

type StoreState = {
  past: Snapshot[];
  future: Snapshot[];
} & Snapshot &
  StoreActions;

function snapshot(s: StoreState): Snapshot {
  const { past: _, future: __, _set: ___, _restore: ____, undo: _____, redo: ______, ...rest } = s;
  return rest as Snapshot;
}

export const useAppStore = create<StoreState>()((set, get) => ({
  ...initialState,
  past: [],
  future: [],

  _set: (partial, actionName) => {
    const s = get() as StoreState;
    if (actionName && UI_ONLY_ACTIONS.has(actionName)) {
      set(partial);
    } else {
      const snap = snapshot(s);
      const past = s.past.length >= MAX_HISTORY ? s.past.slice(1) : s.past;
      set({ ...partial, past: [...past, snap], future: [] });
    }
  },

  _restore: (snap) => set(snap),

  undo: () => {
    const s = get() as StoreState;
    if (s.past.length === 0) return;
    const previous = s.past[s.past.length - 1]!;
    set({
      ...previous,
      past: s.past.slice(0, -1),
      future: [snapshot(s), ...s.future],
    });
  },

  redo: () => {
    const s = get() as StoreState;
    if (s.future.length === 0) return;
    const next = s.future[0]!;
    set({
      ...next,
      past: [...s.past, snapshot(s)],
      future: s.future.slice(1),
    });
  },

  setOriginal: (url) => get()._set({ originalUrl: url, error: null }, "setOriginal"),
  setResult: (preprocessed, processed, adaptive) =>
    get()._set(
      {
        preprocessedUrl: preprocessed,
        quantizedUrl: processed,
        adaptivePalette: adaptive,
        loading: false,
      },
      "setResult",
    ),
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
    get()._set(
      {
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
      },
      "importPaint",
    );
  },
  setLoading: (loading) => get()._set({ loading }, "setLoading"),
  setError: (error) => get()._set({ error, loading: false }, "setError"),
  // these are all the same pattern — could probably batch them
  setCanvas: (canvas) => get()._set({ selectedCanvas: canvas }, "setCanvas"),
  setShowGrid: (show) => get()._set({ showGrid: show }, "setShowGrid"),
  setQuantMethod: (method) => get()._set({ quantMethod: method }, "setQuantMethod"),
  setFitMode: (mode) => get()._set({ fitMode: mode }, "setFitMode"),
  setPaddingColor: (color, alpha) =>
    get()._set(
      {
        paddingColor: color,
        paddingColorPreview: color,
        ...(alpha !== undefined ? { paddingAlpha: alpha } : {}),
      },
      "setPaddingColor",
    ),
  setPaddingColorPreview: (color, alpha) =>
    get()._set(
      { paddingColorPreview: color, ...(alpha !== undefined ? { paddingAlpha: alpha } : {}) },
      "setPaddingColorPreview",
    ),
  setQuantizationEnabled: (enabled) =>
    get()._set({ quantizationEnabled: enabled }, "setQuantizationEnabled"),
  setAdaptiveColorCount: (count) =>
    get()._set({ adaptiveColorCount: count }, "setAdaptiveColorCount"),
  setIncludeFixedPalette: (include) =>
    get()._set({ includeFixedPalette: include }, "setIncludeFixedPalette"),
  setResizeFilter: (filter) => get()._set({ resizeFilter: filter }, "setResizeFilter"),
  setUnsharpAmount: (amount) => get()._set({ unsharpAmount: amount }, "setUnsharpAmount"),
  setPaddingAlpha: (alpha) => get()._set({ paddingAlpha: alpha }, "setPaddingAlpha"),
  setTitle: (title) => get()._set({ title }, "setTitle"),
  setAuthor: (author) => get()._set({ author }, "setAuthor"),
  setSigned: (signed) => get()._set({ signed }, "setSigned"),
  setEmbedOriginalImage: (embed) =>
    get()._set({ embedOriginalImage: embed }, "setEmbedOriginalImage"),
  setShowTransparencyGrid: (show) =>
    get()._set({ showTransparencyGrid: show }, "setShowTransparencyGrid"),
  setPaintFormat: (format) => {
    const s = get() as StoreState;
    get()._set(
      {
        paintFormat: format,
        selectedCanvas: findClosestCanvas(s.selectedCanvas, format),
        glassPadding: s.glass && format === "jop-2x",
      },
      "setPaintFormat",
    );
  },
  setGlass: (glass) => {
    const s = get() as StoreState;
    get()._set(
      {
        glass,
        glassPadding: glass && s.paintFormat === "jop-2x",
        paddingAlpha: glass ? 0 : 1,
      },
      "setGlass",
    );
  },
  setSidesActive: (active) => get()._set({ sidesActive: active }, "setSidesActive"),
  reset: () => {
    set({ ...initialState, past: [], future: [] });
  },
}));

export function restorePreferencesFromStorage() {
  const prefs = loadPreferences();
  if (Object.keys(prefs).length > 0) {
    useAppStore.getState()._set(prefs);
  }
}

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
