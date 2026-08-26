import { describe, it, expect } from "vite-plus/test";
import { computeTiles } from "@/core/tiling";

describe("computeTiles", () => {
  it("1x1 always single", () => {
    expect(computeTiles(1, 1, "jop-1x")).toHaveLength(1);
    expect(computeTiles(1, 1, "jop-delta")).toHaveLength(1);
  });
  it("2x2 jop-1x single 2x2", () => {
    const t = computeTiles(2, 2, "jop-1x");
    expect(t).toHaveLength(1);
    expect(t[0]!.canvasType.cellsX).toBe(2);
  });
  it("4x4 under jop-1x uses 4 tiles of 2x2", () => {
    const t = computeTiles(4, 4, "jop-1x");
    expect(t).toHaveLength(4);
  });
  it("6x6 under delta is 4 tiles", () => {
    const t = computeTiles(6, 6, "jop-delta");
    // 4x4+2x4+4x2+2x2 = 4
    expect(t).toHaveLength(4);
  });
  it("coverage no gaps overlaps", () => {
    for (const fmt of ["jop-1x", "jop-delta", "jop-2x"] as const) {
      for (const w of [1, 2, 3, 5, 6])
        for (const h of [1, 3, 5]) {
          const tiles = computeTiles(w, h, fmt);
          const grid = Array.from({ length: h }, () => Array(w).fill(0));
          for (const tl of tiles) {
            for (let dy = 0; dy < tl.canvasType.cellsY; dy++)
              for (let dx = 0; dx < tl.canvasType.cellsX; dx++) {
                const x = tl.x + dx,
                  y = tl.y + dy;
                expect(grid[y]![x]).toBe(0);
                grid[y]![x] = 1;
              }
          }
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) expect(grid[y]![x]).toBe(1);
        }
    }
  });
});
