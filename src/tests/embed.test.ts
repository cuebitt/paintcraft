import { describe, it, expect } from "vite-plus/test";
import { detectEmbedMode } from "@/lib/embed";

describe("detectEmbedMode", () => {
  it("returns false when not in an iframe and no embed params", () => {
    expect(detectEmbedMode()).toBe(false);
  });

  it("handles undefined window gracefully", () => {
    const win = globalThis.window;
    (globalThis as any).window = undefined;
    expect(detectEmbedMode()).toBe(false);
    (globalThis as any).window = win;
  });
});
