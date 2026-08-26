import { useMemo } from "preact/hooks";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SettingRow } from "@/components/SettingRow";
import { PopoverPicker } from "@/components/PopoverPicker";
import { CANVAS_TYPES, ALLOWED_CANVAS_TYPES_FOR_FORMAT } from "@/types";
import type { PaintFormat } from "@/types";
import { rgbaToHex, rgbToHex, hexToRgb, hexToRgba } from "@/core/palette";
import { Grid3x3Icon, PaintbrushIcon, LayersIcon, PanelsTopLeftIcon } from "lucide-react";
import type { RGB } from "@/core/palette";
import type { TilePlacement } from "@/core/tiling";

import type { CanvasType } from "@/types";

type CanvasSettingsProps = {
  selectedCanvas: CanvasType;
  paintFormat: PaintFormat;
  paddingColorPreview: RGB;
  paddingAlpha: number;
  glass: boolean;
  showGrid: boolean;
  showTransparencyGrid: boolean;
  showTileBorders: boolean;
  loading: boolean;
  multiCanvas: boolean;
  multiWidth: number;
  multiHeight: number;
  tiles?: TilePlacement[];
  setCanvas: (canvas: CanvasType) => void;
  setPaddingColorPreview: (color: RGB, alpha: number) => void;
  setPaddingColor: (color: RGB, alpha: number) => void;
  setShowGrid: (show: boolean) => void;
  setShowTransparencyGrid: (show: boolean) => void;
  setShowTileBorders: (show: boolean) => void;
  setMultiCanvas: (enabled: boolean) => void;
  setMultiSize: (w: number, h: number) => void;
};

export function CanvasSettings({
  selectedCanvas,
  paintFormat,
  paddingColorPreview,
  paddingAlpha,
  glass,
  showGrid,
  showTransparencyGrid,
  showTileBorders,
  loading,
  multiCanvas,
  multiWidth,
  multiHeight,
  tiles,
  setCanvas,
  setPaddingColorPreview,
  setPaddingColor,
  setShowGrid,
  setShowTransparencyGrid,
  setShowTileBorders,
  setMultiCanvas,
  setMultiSize,
}: CanvasSettingsProps) {
  const allowedTypes = ALLOWED_CANVAS_TYPES_FOR_FORMAT[paintFormat];
  const filteredCanvases = CANVAS_TYPES.filter((c) => allowedTypes.has(c.name));
  const selectedAllowed = allowedTypes.has(selectedCanvas.name);
  const hexColor = glass
    ? rgbaToHex(paddingColorPreview, paddingAlpha)
    : rgbToHex(paddingColorPreview);
  const { tileCount, breakdown } = useMemo(() => {
    if (!multiCanvas || !tiles) return { tileCount: 0, breakdown: "" };
    const map = new Map<string, number>();
    for (const t of tiles) {
      const k = `${t.canvasType.cellsX}×${t.canvasType.cellsY}`;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    const breakdown = Array.from(map.entries())
      .map(([k, c]) => `${c}× ${k}`)
      .join(" + ");
    return { tileCount: tiles.length, breakdown };
  }, [multiCanvas, tiles]);

  return (
    <div className="flex flex-col gap-3">
      <SettingRow
        icon={Grid3x3Icon}
        label="Multi-canvas"
        tooltip="Split a larger painting across multiple blocks"
      >
        <Switch
          id="setting-multi-canvas"
          checked={multiCanvas}
          onCheckedChange={setMultiCanvas}
          disabled={loading}
        />
      </SettingRow>

      {multiCanvas ? (
        <>
          <SettingRow icon={Grid3x3Icon} label="Width" tooltip="Width in 16px blocks (1–16)">
            <Input
              type="number"
              min={1}
              max={16}
              value={multiWidth}
              disabled={loading}
              className="h-8 w-20 text-center"
              onChange={(e) =>
                setMultiSize(Number((e.target as HTMLInputElement).value), multiHeight)
              }
            />
          </SettingRow>
          <SettingRow icon={Grid3x3Icon} label="Height" tooltip="Height in 16px blocks (1–16)">
            <Input
              type="number"
              min={1}
              max={16}
              value={multiHeight}
              disabled={loading}
              className="h-8 w-20 text-center"
              onChange={(e) =>
                setMultiSize(multiWidth, Number((e.target as HTMLInputElement).value))
              }
            />
          </SettingRow>
          <p className="px-1 text-xs text-muted-foreground">
            {multiWidth * 16}×{multiHeight * 16}px · {tileCount}{" "}
            {tileCount === 1 ? "canvas" : "canvases"}
            {breakdown ? ` · ${breakdown}` : ""}
          </p>
        </>
      ) : (
        <SettingRow
          icon={Grid3x3Icon}
          label="Canvas Size"
          tooltip="Choose the painting canvas size"
        >
          <Select
            value={selectedAllowed ? selectedCanvas.name : filteredCanvases[0]?.name}
            onValueChange={(value) => {
              const canvas = CANVAS_TYPES.find((c) => c.name === value);
              if (canvas) setCanvas(canvas);
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-36">
              <span className="flex flex-1 text-left">
                {selectedAllowed ? selectedCanvas.name : filteredCanvases[0]?.name}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {filteredCanvases.map((canvas) => (
                  <SelectItem key={canvas.name} value={canvas.name}>
                    {canvas.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingRow>
      )}

      <SettingRow
        icon={PaintbrushIcon}
        label="Padding"
        tooltip="Set the background color for padding areas"
      >
        <PopoverPicker
          color={hexColor}
          alpha={glass}
          showTransparencyGrid={showTransparencyGrid}
          onChange={(hex) => {
            if (glass) {
              const { color, alpha } = hexToRgba(hex);
              setPaddingColorPreview(color, alpha);
            } else {
              setPaddingColorPreview(hexToRgb(hex), 1);
            }
          }}
          onChangeEnd={(hex) => {
            if (glass) {
              const { color, alpha } = hexToRgba(hex);
              setPaddingColor(color, alpha);
            } else {
              setPaddingColor(hexToRgb(hex), 1);
            }
          }}
        />
      </SettingRow>

      <SettingRow
        icon={Grid3x3Icon}
        label="Block Grid"
        tooltip="Show 16×16 block grid over the preview"
      >
        <Switch
          id="setting-grid-toggle"
          checked={showGrid}
          onCheckedChange={() => setShowGrid(!showGrid)}
        />
      </SettingRow>

      {multiCanvas && (
        <SettingRow
          icon={PanelsTopLeftIcon}
          label="Painting Borders"
          tooltip="Highlight where the image splits into separate paintings"
        >
          <Switch
            id="setting-tile-borders-toggle"
            checked={showTileBorders}
            onCheckedChange={() => setShowTileBorders(!showTileBorders)}
          />
        </SettingRow>
      )}

      <SettingRow
        icon={LayersIcon}
        label="Transparency Background"
        tooltip="Shows a checkerboard pattern behind transparent areas"
      >
        <Switch
          id="setting-transparency-toggle"
          checked={showTransparencyGrid}
          onCheckedChange={() => setShowTransparencyGrid(!showTransparencyGrid)}
        />
      </SettingRow>
    </div>
  );
}
