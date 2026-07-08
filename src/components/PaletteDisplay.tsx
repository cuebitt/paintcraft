import { rgbToHex, type RGB } from "@/core/palette";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SwatchBookIcon } from "lucide-react";

interface PaletteDisplayProps {
  title: string;
  colors: readonly RGB[];
}

export function PaletteDisplay({ title, colors }: PaletteDisplayProps) {
  return (
    <Card className="min-w-[200px] flex-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <SwatchBookIcon className="size-4 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-2">
          {colors.map((color) => {
            const hex = rgbToHex(color);
            return (
              <div key={hex} className="flex flex-col items-center gap-1">
                <div
                  title={hex}
                  className="size-8 rounded-md border border-border shadow-sm"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-[10px] leading-none text-muted-foreground">{hex}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
