import { Switch } from "@/components/ui/switch";
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
import { Grid3x3Icon, PaintbrushIcon, LayersIcon } from "lucide-react";
import type { RGB } from "@/core/palette";

import type { CanvasType } from "@/types";

type CanvasSettingsProps = {
  selectedCanvas: CanvasType;
  paintFormat: PaintFormat;
  paddingColorPreview: RGB;
  paddingAlpha: number;
  glass: boolean;
  showGrid: boolean;
  showTransparencyGrid: boolean;
  loading: boolean;
  setCanvas: (canvas: CanvasType) => void;
  setPaddingColorPreview: (color: RGB, alpha: number) => void;
  setPaddingColor: (color: RGB, alpha: number) => void;
  setShowGrid: (show: boolean) => void;
  setShowTransparencyGrid: (show: boolean) => void;
};

export function CanvasSettings({
  selectedCanvas,
  paintFormat,
  paddingColorPreview,
  paddingAlpha,
  glass,
  showGrid,
  showTransparencyGrid,
  loading,
  setCanvas,
  setPaddingColorPreview,
  setPaddingColor,
  setShowGrid,
  setShowTransparencyGrid,
}: CanvasSettingsProps) {
  const allowedTypes = ALLOWED_CANVAS_TYPES_FOR_FORMAT[paintFormat];
  const filteredCanvases = CANVAS_TYPES.filter((c) => allowedTypes.has(c.name));
  const selectedAllowed = allowedTypes.has(selectedCanvas.name);
  const hexColor = glass
    ? rgbaToHex(paddingColorPreview, paddingAlpha)
    : rgbToHex(paddingColorPreview);

  return (
    <div className="flex flex-col gap-3">
      <SettingRow icon={Grid3x3Icon} label="Canvas Size" tooltip="Choose the painting canvas size">
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
        label="Cell Grid"
        tooltip="Overlays the canvas cell grid on the preview"
      >
        <Switch
          id="setting-grid-toggle"
          checked={showGrid}
          onCheckedChange={() => setShowGrid(!showGrid)}
        />
      </SettingRow>

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
