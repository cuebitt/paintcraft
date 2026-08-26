import { describe, it, expect, beforeEach } from "vite-plus/test";
import { useAppStore } from "@/app/store";

const STORAGE_KEY = "paintcraft-preferences";

describe("preferences persist", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.getState().reset();
    useAppStore.temporal.getState().clear();
  });

  it("saves preference fields to localStorage", () => {
    useAppStore.getState().setQuantMethod("neuquant");
    useAppStore.getState().setFitMode("width");
    useAppStore.getState().setResizeFilter("lanczos3");
    useAppStore.getState().setPaintFormat("jop-delta");

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const data = JSON.parse(raw!);
    expect(data.state).toEqual({
      quantMethod: "neuquant",
      fitMode: "width",
      resizeFilter: "lanczos3",
      paintFormat: "jop-delta",
      multiCanvas: false,
      multiWidth: 2,
      multiHeight: 2,
    });
  });

  it("does not persist non-preference fields", () => {
    useAppStore.getState().setOriginal("test.png");

    const raw = localStorage.getItem(STORAGE_KEY);
    const data = JSON.parse(raw!);
    expect(data.state.originalUrl).toBeUndefined();
  });

  it("resets preference fields to defaults on reset", () => {
    useAppStore.getState().setQuantMethod("neuquant");
    useAppStore.getState().reset();

    const raw = localStorage.getItem(STORAGE_KEY);
    const data = JSON.parse(raw!);
    expect(data.state.quantMethod).toBe("median-cut");
    expect(data.state.fitMode).toBe("contain");
    expect(data.state.resizeFilter).toBe("box");
    expect(data.state.paintFormat).toBe("jop-1x");
  });
});
