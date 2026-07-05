import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { QuantMethod } from "@/core/quantize";
import { HashIcon, SparklesIcon, SwatchBookIcon } from "lucide-react";

const QUANT_METHODS: { value: QuantMethod; label: string }[] = [
  { value: "median-cut", label: "Median Cut" },
  { value: "neuquant", label: "NeuQuant Adaptive" },
  { value: "wuquant", label: "WuQuant Remap" },
];

type ColorSettingsProps = {
  quantizationEnabled: boolean;
  quantMethod: QuantMethod;
  colorCountLocal: number;
  includeFixedPalette: boolean;
  showTooltips: boolean;
  loading: boolean;
  setQuantizationEnabled: (enabled: boolean) => void;
  setQuantMethod: (method: QuantMethod) => void;
  handleColorCountChange: (val: number) => void;
  setIncludeFixedPalette: (include: boolean) => void;
};

export function ColorSettings({
  quantizationEnabled,
  quantMethod,
  colorCountLocal,
  includeFixedPalette,
  showTooltips,
  loading,
  setQuantizationEnabled,
  setQuantMethod,
  handleColorCountChange,
  setIncludeFixedPalette,
}: ColorSettingsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <SparklesIcon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Quantize</span>
        </span>
        <Switch
          id="embed-quantization-toggle"
          checked={quantizationEnabled}
          onCheckedChange={() => setQuantizationEnabled(!quantizationEnabled)}
          disabled={loading}
        />
      </div>

      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <SparklesIcon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Method</span>
        </span>
        <Tooltip disabled={!showTooltips}>
          <TooltipTrigger
            render={
              <Select
                value={quantMethod}
                onValueChange={(v) => setQuantMethod(v as QuantMethod)}
                disabled={loading || !quantizationEnabled}
              >
                <SelectTrigger className="w-36">
                  <span className="flex flex-1 text-left">
                    {QUANT_METHODS.find((m) => m.value === quantMethod)?.label ?? quantMethod}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {QUANT_METHODS.map((m) => (
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
            Algorithm used for color quantization
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <HashIcon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Color Count</span>
        </span>
        <Input
          id="embed-adaptive-colors"
          type="number"
          min={1}
          max={256}
          value={colorCountLocal}
          onChange={(e) => {
            const val = parseInt((e.target as HTMLInputElement).value, 10);
            if (!isNaN(val) && val >= 1 && val <= 256) {
              handleColorCountChange(val);
            }
          }}
          disabled={loading || !quantizationEnabled}
          className="w-20"
        />
      </div>

      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <SwatchBookIcon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Fixed Palette</span>
        </span>
        <Switch
          id="embed-fixed-palette-toggle"
          checked={includeFixedPalette}
          onCheckedChange={() => setIncludeFixedPalette(!includeFixedPalette)}
          disabled={loading || !quantizationEnabled}
        />
      </div>
    </div>
  );
}
