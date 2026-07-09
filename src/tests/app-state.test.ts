import { describe, it, expect, beforeEach } from "vite-plus/test";
import { useAppStore, getProcessImageArgs } from "@/app/store";
import { CANVAS_TYPES } from "@/types";

function temporal() {
  return useAppStore.temporal.getState();
}

beforeEach(() => {
  useAppStore.getState().reset();
  temporal().clear();
  localStorage.clear();
});

describe("appStore", () => {
  it("setOriginal sets url and clears error", () => {
    useAppStore.getState().setError("previous error");
    useAppStore.getState().setOriginal("test.png");
    const s = useAppStore.getState();
    expect(s.originalUrl).toBe("test.png");
    expect(s.error).toBeNull();
  });

  it("setResult updates urls, palette, and clears loading", () => {
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setResult("pre.png", "proc.png", [[100, 200, 50]]);
    const s = useAppStore.getState();
    expect(s.preprocessedUrl).toBe("pre.png");
    expect(s.quantizedUrl).toBe("proc.png");
    expect(s.adaptivePalette).toEqual([[100, 200, 50]]);
    expect(s.loading).toBe(false);
  });

  it("setError clears loading", () => {
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setError("something broke");
    const s = useAppStore.getState();
    expect(s.error).toBe("something broke");
    expect(s.loading).toBe(false);
  });

  it("setError with null clears both error and loading", () => {
    useAppStore.getState().setError("old error");
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setError(null);
    const s = useAppStore.getState();
    expect(s.error).toBeNull();
    expect(s.loading).toBe(false);
  });

  it("setPaddingColor updates both paddingColor and preview", () => {
    useAppStore.getState().setPaddingColor([100, 200, 50]);
    const s = useAppStore.getState();
    expect(s.paddingColor).toEqual([100, 200, 50]);
    expect(s.paddingColorPreview).toEqual([100, 200, 50]);
  });

  it("setPaddingColorPreview updates only preview", () => {
    useAppStore.getState().setPaddingColorPreview([100, 200, 50]);
    const s = useAppStore.getState();
    expect(s.paddingColor).toEqual(useAppStore.getState().paddingColor);
    expect(s.paddingColorPreview).toEqual([100, 200, 50]);
  });

  it("reset returns to initial state", () => {
    useAppStore.getState().setOriginal("something.png");
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setError("oops");
    useAppStore.getState().setQuantMethod("neuquant");
    useAppStore.getState().reset();
    const s = useAppStore.getState();
    expect(s.originalUrl).toBeNull();
    expect(s.loading).toBe(false);
    expect(s.error).toBeNull();
    expect(s.quantMethod).toBe("median-cut");
  });

  it("toggles each field independently", () => {
    useAppStore.getState().setLoading(true);
    expect(useAppStore.getState().loading).toBe(true);

    useAppStore.getState().setCanvas(CANVAS_TYPES[3]!);
    expect(useAppStore.getState().selectedCanvas).toBe(CANVAS_TYPES[3]!);

    useAppStore.getState().setShowGrid(true);
    expect(useAppStore.getState().showGrid).toBe(true);

    useAppStore.getState().setQuantMethod("neuquant");
    expect(useAppStore.getState().quantMethod).toBe("neuquant");

    useAppStore.getState().setFitMode("width");
    expect(useAppStore.getState().fitMode).toBe("width");

    useAppStore.getState().setQuantizationEnabled(true);
    expect(useAppStore.getState().quantizationEnabled).toBe(true);

    useAppStore.getState().setAdaptiveColorCount(8);
    expect(useAppStore.getState().adaptiveColorCount).toBe(8);

    useAppStore.getState().setIncludeFixedPalette(true);
    expect(useAppStore.getState().includeFixedPalette).toBe(true);

    useAppStore.getState().setResizeFilter("lanczos3");
    expect(useAppStore.getState().resizeFilter).toBe("lanczos3");

    useAppStore.getState().setUnsharpAmount(150);
    expect(useAppStore.getState().unsharpAmount).toBe(150);

    useAppStore.getState().setTitle("Sunset");
    expect(useAppStore.getState().title).toBe("Sunset");

    useAppStore.getState().setAuthor("Player");
    expect(useAppStore.getState().author).toBe("Player");

    useAppStore.getState().setSigned(true);
    expect(useAppStore.getState().signed).toBe(true);

    useAppStore.getState().setSigned(false);
    expect(useAppStore.getState().signed).toBe(false);
  });

  it("setPaddingAlpha updates paddingAlpha", () => {
    useAppStore.getState().setPaddingAlpha(0.5);
    expect(useAppStore.getState().paddingAlpha).toBe(0.5);
  });

  it("setPaintFormat updates format and finds closest canvas", () => {
    const large = CANVAS_TYPES.find((c) => c.name === "4×4 Large Square")!;
    useAppStore.getState().setCanvas(large);
    useAppStore.getState().setPaintFormat("jop-1x");
    const s = useAppStore.getState();
    expect(s.paintFormat).toBe("jop-1x");
    const allowed = new Set(["1×1 Canvas", "2×2 Square", "2×1 Long Canvas", "1×2 Tall Canvas"]);
    expect(allowed.has(s.selectedCanvas.name)).toBe(true);
  });

  it("setGlass toggles glass and updates paddingAlpha", () => {
    useAppStore.getState().setGlass(true);
    expect(useAppStore.getState().glass).toBe(true);
    expect(useAppStore.getState().paddingAlpha).toBe(0);
    useAppStore.getState().setGlass(false);
    expect(useAppStore.getState().glass).toBe(false);
    expect(useAppStore.getState().paddingAlpha).toBe(1);
  });

  it("setGlass with jop-2x format sets glassPadding", () => {
    useAppStore.getState().setPaintFormat("jop-2x");
    useAppStore.getState().setGlass(true);
    expect(useAppStore.getState().glassPadding).toBe(true);
  });

  it("setGlass with non-jop-2x format does not set glassPadding", () => {
    useAppStore.getState().setPaintFormat("jop-1x");
    useAppStore.getState().setGlass(true);
    expect(useAppStore.getState().glassPadding).toBe(false);
  });

  it("importPaint sets all fields", () => {
    useAppStore.getState().importPaint({
      canvas: CANVAS_TYPES[4]!,
      title: "My Painting",
      author: "Steve",
      signed: true,
      preprocessed: "pre.png",
      processed: "proc.png",
      format: "jop-2x",
      glass: true,
      sidesActive: true,
    });
    const s = useAppStore.getState();
    expect(s.selectedCanvas).toBe(CANVAS_TYPES[4]!);
    expect(s.title).toBe("My Painting");
    expect(s.author).toBe("Steve");
    expect(s.signed).toBe(true);
    expect(s.preprocessedUrl).toBe("pre.png");
    expect(s.quantizedUrl).toBe("proc.png");
    expect(s.originalUrl).toBe("pre.png");
    expect(s.paintFormat).toBe("jop-2x");
    expect(s.glass).toBe(true);
    expect(s.sidesActive).toBe(true);
    expect(s.glassPadding).toBe(true);
    expect(s.loading).toBe(false);
  });

  it("undo and redo work correctly", () => {
    useAppStore.getState().setOriginal("first.png");
    useAppStore.getState().setOriginal("second.png");
    expect(useAppStore.getState().originalUrl).toBe("second.png");

    temporal().undo();
    expect(useAppStore.getState().originalUrl).toBe("first.png");

    temporal().redo();
    expect(useAppStore.getState().originalUrl).toBe("second.png");
  });

  it("undo does nothing when history is empty", () => {
    temporal().undo();
    expect(useAppStore.getState().originalUrl).toBeNull();
  });

  it("redo does nothing when future is empty", () => {
    temporal().redo();
    expect(useAppStore.getState().originalUrl).toBeNull();
  });

  it("new action clears future", () => {
    useAppStore.getState().setOriginal("a.png");
    useAppStore.getState().setOriginal("b.png");
    temporal().undo();
    expect(temporal().futureStates.length).toBe(1);
    useAppStore.getState().setOriginal("c.png");
    expect(temporal().futureStates.length).toBe(0);
    temporal().redo();
    expect(useAppStore.getState().originalUrl).toBe("c.png");
  });

  it("setPaintFormat with same canvas keeps it", () => {
    const canvas1x = CANVAS_TYPES.find((c) => c.name === "1×1 Canvas")!;
    useAppStore.getState().setCanvas(canvas1x);
    useAppStore.getState().setPaintFormat("jop-1x");
    expect(useAppStore.getState().selectedCanvas.name).toBe("1×1 Canvas");
  });
});

describe("getProcessImageArgs", () => {
  it("returns correct args tuple", () => {
    useAppStore.getState().reset();
    const s = useAppStore.getState();
    const args = getProcessImageArgs(s);
    expect(args).toHaveLength(8);
    expect(args[0]).toBe(s.selectedCanvas);
    expect(args[1]).toBe(s.quantMethod);
    expect(args[2]).toBe(s.fitMode);
    expect(args[3]).toEqual(s.paddingColor);
    expect(args[4]).toBe(s.quantizationEnabled);
    expect(args[5]).toEqual({
      colors: s.adaptiveColorCount,
      includeFixedPalette: s.includeFixedPalette,
    });
    expect(args[6]).toEqual({ filter: s.resizeFilter, unsharpAmount: s.unsharpAmount });
    expect(args[7]).toBe(1);
  });

  it("returns paddingAlpha when glass is enabled", () => {
    useAppStore.getState().setGlass(true);
    useAppStore.getState().setPaddingAlpha(0.3);
    const s = useAppStore.getState();
    const args = getProcessImageArgs(s);
    expect(args[7]).toBe(0.3);
  });
});
