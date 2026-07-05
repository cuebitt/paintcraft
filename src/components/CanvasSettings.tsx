import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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
  showTooltips: boolean;
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
  showTooltips,
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
      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Grid3x3Icon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Canvas Size</span>
        </span>
        <Tooltip disabled={!showTooltips}>
          <TooltipTrigger
            render={
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
            }
          />
          <TooltipContent side="bottom" sideOffset={8}>
            Choose the painting canvas size
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <PaintbrushIcon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Padding</span>
        </span>
        <Tooltip disabled={!showTooltips}>
          <TooltipTrigger
            render={
              <div className="flex items-center gap-2">
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
              </div>
            }
          />
          <TooltipContent>Set the background color for padding areas</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Grid3x3Icon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Cell Grid</span>
        </span>
        <Switch
          id="embed-grid-toggle"
          checked={showGrid}
          onCheckedChange={() => setShowGrid(!showGrid)}
        />
      </div>
      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <LayersIcon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Transparency Grid</span>
        </span>
        <Switch
          id="embed-transparency-toggle"
          checked={showTransparencyGrid}
          onCheckedChange={() => setShowTransparencyGrid(!showTransparencyGrid)}
        />
      </div>
    </div>
  );
}
