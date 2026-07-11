import type { ComponentChildren, ComponentType } from "preact";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useTheme } from "@/components/ThemeProvider";

interface SettingRowProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tooltip: string;
  children: ComponentChildren;
}

export function SettingRow({ icon: Icon, label, tooltip, children }: SettingRowProps) {
  const { showTooltips } = useTheme();

  return (
    <div className="flex min-h-9 items-center justify-between gap-2">
      <Tooltip disabled={!showTooltips}>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="flex cursor-default items-center gap-2 text-sm font-medium text-foreground"
            >
              <Icon className="size-4 shrink-0 text-accent" />
              {label}
            </button>
          }
        />
        <TooltipContent side="bottom" sideOffset={8}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
      {children}
    </div>
  );
}
