import { describe, it, expect, beforeEach } from "vite-plus/test";
import { acquireCanvas, releaseCanvas } from "@/core/canvas-pool";

describe("canvas pool", () => {
  beforeEach(() => {
    // Release any pooled canvases by acquiring until pool is empty, then releasing all
    const drained: HTMLCanvasElement[] = [];
    for (let i = 0; i < 10; i++) {
      const c = acquireCanvas(1, 1);
      if (drained.some((d) => d === c)) break;
      drained.push(c);
    }
    for (const c of drained) releaseCanvas(c);
  });

  it("returns a canvas with the requested dimensions", () => {
    const canvas = acquireCanvas(100, 200);
    expect(canvas.width).toBe(100);
    expect(canvas.height).toBe(200);
  });

  it("reuses canvases from the pool", () => {
    const c1 = acquireCanvas(10, 10);
    releaseCanvas(c1);
    const c2 = acquireCanvas(10, 10);
    expect(c2).toBe(c1);
  });

  it("resets dimensions on acquired canvases", () => {
    const c1 = acquireCanvas(10, 10);
    releaseCanvas(c1);
    const c2 = acquireCanvas(200, 300);
    expect(c2.width).toBe(200);
    expect(c2.height).toBe(300);
  });

  it("creates new canvases when pool is empty", () => {
    const c1 = acquireCanvas(5, 5);
    const c2 = acquireCanvas(5, 5);
    expect(c2).not.toBe(c1);
  });

  it("limits pool size to 4", () => {
    const canvases: HTMLCanvasElement[] = [];
    for (let i = 0; i < 10; i++) {
      canvases.push(acquireCanvas(1, 1));
    }
    for (const c of canvases) releaseCanvas(c);

    // First 4 acquires should be from pool, 5th creates new
    const reused: HTMLCanvasElement[] = [];
    for (let i = 0; i < 5; i++) {
      reused.push(acquireCanvas(1, 1));
    }
    // Only the first 4 should be from the pool
    const poolMatches = reused.filter((c) => canvases.includes(c)).length;
    expect(poolMatches).toBe(4);
  });

  it("returns a canvas with valid 2D context", () => {
    const canvas = acquireCanvas(50, 50);
    const ctx = canvas.getContext("2d");
    expect(ctx).toBeTruthy();
  });
});
