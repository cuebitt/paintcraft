import { HexColorPicker, HexAlphaColorPicker } from "react-colorful";

import { Popover } from "@base-ui/react/popover";

interface PopoverPickerProps {
  color: string;
  onChange: (color: string) => void;
  onChangeEnd?: (color: string) => void;
  alpha?: boolean;
  showTransparencyGrid?: boolean;
}

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;
const HEX_ALPHA_COLOR_RE = /^#[0-9a-f]{8}$/i;

export function PopoverPicker({
  color,
  onChange,
  onChangeEnd,
  alpha,
  showTransparencyGrid,
}: PopoverPickerProps) {
  const hexRegex = alpha ? HEX_ALPHA_COLOR_RE : HEX_COLOR_RE;
  const Picker = alpha ? HexAlphaColorPicker : HexColorPicker;
  const isTranslucent = alpha && color.length === 9 && color.slice(7, 9) !== "ff";

  return (
    <Popover.Root>
      <Popover.Trigger
        className={`h-7 w-7 cursor-pointer rounded-lg border-2 border-border shadow-sm ${showTransparencyGrid && isTranslucent ? "transparency-grid" : ""}`}
        style={{ backgroundColor: color }}
      />
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className="w-[200px] rounded-lg border border-border shadow-lg">
            <Picker color={color} onChange={onChange} onChangeEnd={onChangeEnd} />
            {/* onInput is the Preact equivalent of React's onChange, this input IS controlled */}
            {/* oxlint-disable-next-line react-doctor/no-uncontrolled-input */}
            <input
              value={color}
              aria-label="Hex color"
              onInput={(e) => {
                const val = (e.target as HTMLInputElement).value;
                if (hexRegex.test(val)) {
                  onChange(val);
                }
              }}
              className="w-full rounded-b-lg border-t border-border bg-background px-3 py-2 text-sm focus:outline-none"
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
