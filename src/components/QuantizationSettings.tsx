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
import type { QuantMethod } from "@/core/quantize";
import { HashIcon, SparklesIcon, SwatchBookIcon } from "lucide-react";

const QUANT_METHODS: { value: QuantMethod; label: string }[] = [
  { value: "median-cut", label: "Median Cut" },
  { value: "neuquant", label: "NeuQuant Adaptive" },
  { value: "wuquant", label: "WuQuant Remap" },
];

type QuantizationSettingsProps = {
  quantizationEnabled: boolean;
  quantMethod: QuantMethod;
  colorCountLocal: number;
  includeFixedPalette: boolean;
  loading: boolean;
  setQuantizationEnabled: (enabled: boolean) => void;
  setQuantMethod: (method: QuantMethod) => void;
  handleColorCountChange: (val: number) => void;
  setIncludeFixedPalette: (include: boolean) => void;
};

export function QuantizationSettings({
  quantizationEnabled,
  quantMethod,
  colorCountLocal,
  includeFixedPalette,
  loading,
  setQuantizationEnabled,
  setQuantMethod,
  handleColorCountChange,
  setIncludeFixedPalette,
}: QuantizationSettingsProps) {
  return (
    <div className="flex flex-col gap-3">
      <SettingRow
        icon={SparklesIcon}
        label="Quantize"
        tooltip="Enable or disable color quantization"
      >
        <Switch
          id="setting-quantization-toggle"
          checked={quantizationEnabled}
          onCheckedChange={() => setQuantizationEnabled(!quantizationEnabled)}
          disabled={loading}
        />
      </SettingRow>

      <SettingRow
        icon={SparklesIcon}
        label="Method"
        tooltip="Algorithm used for color quantization"
      >
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
      </SettingRow>

      <SettingRow
        icon={HashIcon}
        label="Color Count"
        tooltip="Number of adaptive colors to extract (1–256)"
      >
        <Input
          id="setting-adaptive-colors"
          type="number"
          min={1}
          max={256}
          value={colorCountLocal}
          onChange={(e) => {
            const val = parseInt((e.target as HTMLInputElement).value, 10);
            if (!Number.isNaN(val) && val >= 1 && val <= 256) {
              handleColorCountChange(val);
            }
          }}
          disabled={loading || !quantizationEnabled}
          className="w-20"
        />
      </SettingRow>

      <SettingRow
        icon={SwatchBookIcon}
        label="Fixed Palette"
        tooltip="Merges Minecraft's 16-color palette with the adaptive colors"
      >
        <Switch
          id="setting-fixed-palette-toggle"
          checked={includeFixedPalette}
          onCheckedChange={() => setIncludeFixedPalette(!includeFixedPalette)}
          disabled={loading || !quantizationEnabled}
        />
      </SettingRow>
    </div>
  );
}
