import { useState } from "preact/hooks";
import { memo } from "preact/compat";
import type { RGB } from "@/core/palette";
import { FIXED_PALETTE } from "@/core/palette";
import { PaletteDisplay } from "@/components/PaletteDisplay";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const PAGE_SIZE = 12;

interface PalettesSectionProps {
  adaptivePalette: readonly RGB[];
  adaptiveColorCount: number;
}

export const PalettesSection = memo(function PalettesSection({
  adaptivePalette,
  adaptiveColorCount,
}: PalettesSectionProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(adaptivePalette.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  const pageStart = safePage * PAGE_SIZE;
  const pageColors = adaptivePalette.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 lg:flex-row">
        <PaletteDisplay title="Fixed Palette (16 colors)" colors={FIXED_PALETTE} />
        <div className="flex min-w-50 flex-1 flex-col gap-3">
          <PaletteDisplay
            title={`Adaptive Palette (${adaptiveColorCount} colors)`}
            colors={pageColors}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {safePage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
