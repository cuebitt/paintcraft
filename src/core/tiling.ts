import { ALLOWED_CANVAS_TYPES_FOR_FORMAT, CANVAS_TYPES } from "@/types";
import type { CanvasType, PaintFormat } from "@/types";

export interface TilePlacement {
  x: number;
  y: number;
  canvasType: CanvasType;
}

export function multiCanvasType(w: number, h: number): CanvasType {
  return { name: `${w}×${h} Multi`, width: w * 16, height: h * 16, cellsX: w, cellsY: h };
}

export function computeTiles(wCells: number, hCells: number, format: PaintFormat): TilePlacement[] {
  const allowed = CANVAS_TYPES.filter((c) =>
    ALLOWED_CANVAS_TYPES_FOR_FORMAT[format].has(c.name),
  ).sort((a, b) => b.width * b.height - a.width * a.height || a.name.localeCompare(b.name));

  const total = wCells * hCells;
  if (total === 0) return [];
  const grid = new Uint8Array(total);
  const memo = new Map<string, TilePlacement[] | null>();
  const key = () => grid.join("");

  const canFit = (x: number, y: number, ct: CanvasType) => {
    if (x + ct.cellsX > wCells || y + ct.cellsY > hCells) return false;
    for (let dy = 0; dy < ct.cellsY; dy++) {
      const row = (y + dy) * wCells + x;
      for (let dx = 0; dx < ct.cellsX; dx++) if (grid[row + dx] !== 0) return false;
    }
    return true;
  };

  const fill = (x: number, y: number, ct: CanvasType, v: 0 | 1) => {
    for (let dy = 0; dy < ct.cellsY; dy++) {
      const row = (y + dy) * wCells + x;
      for (let dx = 0; dx < ct.cellsX; dx++) grid[row + dx] = v;
    }
  };

  function solve(): TilePlacement[] | null {
    const idx = grid.indexOf(0);
    if (idx === -1) return [];
    const k = key();
    if (memo.has(k)) return memo.get(k)!;
    const x = idx % wCells;
    const y = (idx / wCells) | 0;

    let best: TilePlacement[] | null = null;
    for (const ct of allowed) {
      if (!canFit(x, y, ct)) continue;
      fill(x, y, ct, 1);
      const sub = solve();
      fill(x, y, ct, 0);
      if (sub === null) continue;
      const cand: TilePlacement[] = [{ x, y, canvasType: ct }, ...sub];
      if (best === null || cand.length < best.length) {
        best = cand;
        if (best.length === 1) break;
      }
    }
    memo.set(k, best);
    return best;
  }

  return solve()!;
}
