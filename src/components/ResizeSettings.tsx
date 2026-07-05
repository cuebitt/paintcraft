import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { ResizeFilter } from "@/core/preprocess";
import type { ImageFitMode } from "@/types";
import { FIT_MODES } from "@/types";
import { ScalingIcon, WandIcon, Maximize2Icon } from "lucide-react";

const RESIZE_FILTERS: { value: ResizeFilter; label: string }[] = [
  { value: "box", label: "Box" },
  { value: "hamming", label: "Hamming" },
  { value: "lanczos2", label: "Lanczos 2" },
  { value: "lanczos3", label: "Lanczos 3" },
  { value: "mks2013", label: "MKS 2013" },
  { value: "nearest", label: "Nearest Neighbor" },
];

type ResizeSettingsProps = {
  resizeFilter: ResizeFilter;
  resizeSharpenLocal: number;
  fitMode: ImageFitMode;
  showTooltips: boolean;
  loading: boolean;
  setResizeFilter: (filter: ResizeFilter) => void;
  handleSharpenChange: (val: number) => void;
  setFitMode: (mode: ImageFitMode) => void;
};

export function ResizeSettings({
  resizeFilter,
  resizeSharpenLocal,
  fitMode,
  showTooltips,
  loading,
  setResizeFilter,
  handleSharpenChange,
  setFitMode,
}: ResizeSettingsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <ScalingIcon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Resize Filter</span>
        </span>
        <Tooltip disabled={!showTooltips}>
          <TooltipTrigger
            render={
              <Select
                value={resizeFilter}
                onValueChange={(v) => setResizeFilter(v as ResizeFilter)}
                disabled={loading}
              >
                <SelectTrigger className="w-36">
                  <span className="flex flex-1 text-left">
                    {RESIZE_FILTERS.find((f) => f.value === resizeFilter)?.label ?? resizeFilter}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {RESIZE_FILTERS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            }
          />
          <TooltipContent side="bottom" sideOffset={8}>
            Algorithm used when resizing the image to fit the canvas
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex min-h-9 items-center justify-between gap-2">
        <Tooltip disabled={!showTooltips}>
          <TooltipTrigger
            render={
              <span className="flex items-center gap-2">
                <WandIcon className="size-4 shrink-0 text-accent" />
                <span className="text-sm font-medium text-foreground">Sharpen</span>
              </span>
            }
          />
          <TooltipContent side="bottom" sideOffset={8}>
            Sharpen Strength
          </TooltipContent>
        </Tooltip>
        <div className="flex min-w-[140px] flex-1 items-center gap-2">
          <Slider
            min={0}
            max={300}
            step={10}
            value={[resizeSharpenLocal]}
            onValueChange={(v) => {
              const val = Array.isArray(v) ? v[0] : v;
              handleSharpenChange(val ?? 0);
            }}
            disabled={loading || resizeFilter === "nearest"}
          />
          <span className="w-8 text-right text-xs text-muted-foreground">{resizeSharpenLocal}</span>
        </div>
      </div>

      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Maximize2Icon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Fit Mode</span>
        </span>
        <Tooltip disabled={!showTooltips}>
          <TooltipTrigger
            render={
              <Select
                value={fitMode}
                onValueChange={(v) => setFitMode(v as ImageFitMode)}
                disabled={loading}
              >
                <SelectTrigger className="w-36">
                  <span className="flex flex-1 text-left">
                    {FIT_MODES.find((m) => m.value === fitMode)?.label ?? fitMode}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {FIT_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            }
          />
          <TooltipContent side="bottom" sideOffset={8}>
            How the image fits within the canvas dimensions
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
