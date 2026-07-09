import { Moon, Sun, PaletteIcon, CircleHelpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, ACCENT_COLORS } from "@/components/ThemeProvider";

export function ModeToggle() {
  const { setTheme, setAccentColor, showTooltips, setShowTooltips } = useTheme();

  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className="min-h-9 min-w-9 sm:min-h-8 sm:min-w-8"
            />
          }
        >
          <PaletteIcon className="h-[1.2rem] w-[1.2rem]" style={{ color: `var(--accent)` }} />
          <span className="sr-only">Accent color</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {ACCENT_COLORS.map((color) => (
            <DropdownMenuItem key={color.name} onClick={() => setAccentColor(color)}>
              <span
                className="mr-2 inline-block size-3 rounded-full"
                style={{ backgroundColor: color.light }}
              />
              {color.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className="min-h-9 min-w-9 sm:min-h-8 sm:min-w-8"
            />
          }
        >
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant={showTooltips ? "secondary" : "outline"}
        size="icon"
        onClick={() => setShowTooltips(!showTooltips)}
        title={showTooltips ? "Hide tooltips" : "Show tooltips"}
        className="min-h-9 min-w-9 sm:min-h-8 sm:min-w-8"
      >
        <CircleHelpIcon className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle tooltips</span>
      </Button>
    </div>
  );
}
