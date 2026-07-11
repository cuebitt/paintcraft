import { describe, it, expect } from "vite-plus/test";
import { applyBlendMode } from "../formats/blend-modes";
import { AsepriteLayerBlendMode } from "@pixelation/aseprite";

describe("applyBlendMode", () => {
  const opaque = 1;
  const semi = 0.5;

  it("Normal: returns source color when fully opaque", () => {
    const [r, g, b, a] = applyBlendMode(
      AsepriteLayerBlendMode.Normal,
      255,
      0,
      0,
      opaque,
      0,
      255,
      0,
      opaque,
    );
    expect(r).toBe(255);
    expect(g).toBe(0);
    expect(b).toBe(0);
    expect(a).toBe(opaque);
  });

  it("Normal: blends semi-transparent source over opaque destination", () => {
    const [r, g, , a] = applyBlendMode(
      AsepriteLayerBlendMode.Normal,
      255,
      0,
      0,
      semi,
      0,
      255,
      0,
      opaque,
    );
    expect(a).toBe(1);
    expect(r).toBe(128);
    expect(g).toBe(128);
  });

  it("Normal: returns transparent when both alpha are 0", () => {
    const [r, g, b, a] = applyBlendMode(AsepriteLayerBlendMode.Normal, 255, 0, 0, 0, 0, 255, 0, 0);
    expect(a).toBe(0);
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it("Multiply: multiplies channel values", () => {
    const [r] = applyBlendMode(
      AsepriteLayerBlendMode.Multiply,
      128,
      128,
      128,
      opaque,
      128,
      128,
      128,
      opaque,
    );
    expect(r).toBe(64);
  });

  it("Screen: lightens the result", () => {
    const [r] = applyBlendMode(
      AsepriteLayerBlendMode.Screen,
      128,
      128,
      128,
      opaque,
      0,
      0,
      0,
      opaque,
    );
    expect(r).toBe(128);
  });

  it("Overlay: applies overlay blend", () => {
    const [r] = applyBlendMode(
      AsepriteLayerBlendMode.Overlay,
      128,
      128,
      128,
      opaque,
      64,
      64,
      64,
      opaque,
    );
    expect(r).toBe(64);
  });

  it("Darken: picks the darker value", () => {
    const [r] = applyBlendMode(
      AsepriteLayerBlendMode.Darken,
      100,
      100,
      100,
      opaque,
      200,
      200,
      200,
      opaque,
    );
    expect(r).toBe(100);
  });

  it("Lighten: picks the lighter value", () => {
    const [r] = applyBlendMode(
      AsepriteLayerBlendMode.Lighten,
      100,
      100,
      100,
      opaque,
      200,
      200,
      200,
      opaque,
    );
    expect(r).toBe(200);
  });

  it("ColorDodge: brightens toward white", () => {
    const [r] = applyBlendMode(
      AsepriteLayerBlendMode.ColorDodge,
      128,
      128,
      128,
      opaque,
      128,
      128,
      128,
      opaque,
    );
    expect(r).toBe(255);
  });

  it("ColorBurn: darkens toward black", () => {
    const [r] = applyBlendMode(
      AsepriteLayerBlendMode.ColorBurn,
      128,
      128,
      128,
      opaque,
      128,
      128,
      128,
      opaque,
    );
    expect(r).toBe(2);
  });

  it("HardLight: applies hard light", () => {
    const [r] = applyBlendMode(
      AsepriteLayerBlendMode.HardLight,
      128,
      128,
      128,
      opaque,
      128,
      128,
      128,
      opaque,
    );
    expect(r).toBe(128);
  });

  it("SoftLight: applies soft light", () => {
    const [r] = applyBlendMode(
      AsepriteLayerBlendMode.SoftLight,
      128,
      128,
      128,
      opaque,
      128,
      128,
      128,
      opaque,
    );
    expect(r).toBe(32513);
  });

  it("Difference: returns absolute difference", () => {
    const [r] = applyBlendMode(
      AsepriteLayerBlendMode.Difference,
      200,
      200,
      200,
      opaque,
      100,
      100,
      100,
      opaque,
    );
    expect(r).toBe(100);
  });

  it("Exclusion: applies exclusion blend", () => {
    const [r] = applyBlendMode(
      AsepriteLayerBlendMode.Exclusion,
      128,
      128,
      128,
      opaque,
      128,
      128,
      128,
      opaque,
    );
    expect(r).toBe(127);
  });

  it("Addition: clamps at 255", () => {
    const [r] = applyBlendMode(
      AsepriteLayerBlendMode.Addition,
      200,
      200,
      200,
      opaque,
      200,
      200,
      200,
      opaque,
    );
    expect(r).toBe(255);
  });

  it("Subtract: clamps at 0", () => {
    const [r] = applyBlendMode(
      AsepriteLayerBlendMode.Subtract,
      50,
      50,
      50,
      opaque,
      200,
      200,
      200,
      opaque,
    );
    expect(r).toBe(0);
  });

  it("Divide: divides source by destination", () => {
    const [r] = applyBlendMode(
      AsepriteLayerBlendMode.Divide,
      200,
      200,
      200,
      opaque,
      100,
      100,
      100,
      opaque,
    );
    expect(r).toBe(255);
  });

  it("Divide: returns 255 when destination is 0", () => {
    const [r] = applyBlendMode(
      AsepriteLayerBlendMode.Divide,
      128,
      128,
      128,
      opaque,
      0,
      0,
      0,
      opaque,
    );
    expect(r).toBe(255);
  });

  it("Hue: applies hue blend and returns 4 channels", () => {
    const result = applyBlendMode(AsepriteLayerBlendMode.Hue, 255, 0, 0, opaque, 0, 0, 255, opaque);
    expect(result).toHaveLength(4);
    expect(result[3]).toBe(opaque);
    expect(result[0]).toBeGreaterThanOrEqual(0);
    expect(result[0]).toBeLessThanOrEqual(255);
  });

  it("Saturation: applies saturation blend and returns 4 channels", () => {
    const result = applyBlendMode(
      AsepriteLayerBlendMode.Saturation,
      255,
      0,
      0,
      opaque,
      0,
      0,
      255,
      opaque,
    );
    expect(result).toHaveLength(4);
    expect(result[3]).toBe(opaque);
  });

  it("Color: applies color blend and returns 4 channels", () => {
    const result = applyBlendMode(
      AsepriteLayerBlendMode.Color,
      255,
      0,
      0,
      opaque,
      0,
      0,
      255,
      opaque,
    );
    expect(result).toHaveLength(4);
    expect(result[3]).toBe(opaque);
  });

  it("Luminosity: applies luminosity blend and returns 4 channels", () => {
    const result = applyBlendMode(
      AsepriteLayerBlendMode.Luminosity,
      255,
      0,
      0,
      opaque,
      0,
      0,
      255,
      opaque,
    );
    expect(result).toHaveLength(4);
    expect(result[3]).toBe(opaque);
  });

  it("returns 4 values", () => {
    const result = applyBlendMode(
      AsepriteLayerBlendMode.Normal,
      100,
      150,
      200,
      opaque,
      50,
      100,
      150,
      opaque,
    );
    expect(result).toHaveLength(4);
  });

  it("handles fully transparent source over opaque dest", () => {
    const result = applyBlendMode(AsepriteLayerBlendMode.Normal, 255, 0, 0, 0, 0, 255, 0, opaque);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(255);
    expect(result[2]).toBe(0);
    expect(result[3]).toBe(opaque);
  });

  it("handles opaque source over fully transparent dest", () => {
    const result = applyBlendMode(AsepriteLayerBlendMode.Normal, 255, 0, 0, opaque, 0, 255, 0, 0);
    expect(result[0]).toBe(255);
    expect(result[3]).toBe(opaque);
  });
});
