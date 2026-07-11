import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SettingRow } from "@/components/SettingRow";
import { Button } from "@/components/ui/button";
import type { ResizeFilter } from "@/core/preprocess";
import type { ImageFitMode } from "@/types";
import { FIT_MODES } from "@/types";
import { ScalingIcon, WandIcon, Maximize2Icon, RefreshCwIcon } from "lucide-react";

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
  loading: boolean;
  setResizeFilter: (filter: ResizeFilter) => void;
  handleSharpenChange: (val: number) => void;
  setFitMode: (mode: ImageFitMode) => void;
  onReprocess: () => void;
};

export function ResizeSettings({
  resizeFilter,
  resizeSharpenLocal,
  fitMode,
  loading,
  setResizeFilter,
  handleSharpenChange,
  setFitMode,
  onReprocess,
}: ResizeSettingsProps) {
  return (
    <div className="flex flex-col gap-3">
      <SettingRow
        icon={ScalingIcon}
        label="Resize Filter"
        tooltip="Algorithm used when resizing the image to fit the canvas"
      >
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
      </SettingRow>

      <SettingRow icon={WandIcon} label="Sharpen" tooltip="Sharpen Strength">
        <div className="flex min-w-35 flex-1 items-center gap-2">
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
      </SettingRow>

      <SettingRow
        icon={Maximize2Icon}
        label="Fit Mode"
        tooltip="How the image fits within the canvas dimensions"
      >
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
      </SettingRow>

      <div className="flex min-h-9 items-center justify-between gap-2">
        <SettingRow
          icon={RefreshCwIcon}
          label="Reprocess"
          tooltip="Re-runs image processing. This action cannot be undone."
        >
          <Button variant="outline" size="sm" disabled={loading} onClick={onReprocess}>
            <RefreshCwIcon className="size-3.5" />
            Refresh
          </Button>
        </SettingRow>
      </div>
    </div>
  );
}
