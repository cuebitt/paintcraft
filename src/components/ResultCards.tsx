import { useEffect, useRef } from "preact/hooks";
import { useResizeObserver, useDisclosure } from "@mantine/hooks";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftRightIcon,
  PaintBucketIcon,
  ImageIcon,
  UploadIcon,
  SettingsIcon,
  XIcon,
} from "lucide-react";
import { SettingsPanel } from "@/components/SettingsPanel";
import { cn } from "@/lib/utils";

type ExportButtonsProps = {
  handleExportPng: () => void;
  handleExportPaintFile: () => void;
  handleReset: () => void;
  loading: boolean;
  variant?: "secondary" | "outline";
  labels?: "full" | "short";
};

function ExportButtons({
  handleExportPng,
  handleExportPaintFile,
  handleReset,
  loading,
  variant = "secondary",
  labels = "full",
  tiles,
}: ExportButtonsProps & { tiles?: TilePlacement[] }) {
  const count = tiles?.length ?? 0;
  const multi = count > 1;
  const paintLabel = multi
    ? labels === "short"
      ? `.zip (${count})`
      : `Export ${count} Paintings (.zip)`
    : labels === "short"
      ? ".paint"
      : "Export .paint";
  const pngLabel = labels === "short" ? "PNG" : "Export PNG";

  return (
    <>
      <Button
        variant={variant}
        size="sm"
        onClick={handleExportPaintFile}
        disabled={loading}
        className={labels === "short" ? "min-h-9 gap-1 text-xs" : "text-xs"}
      >
        <PaintBucketIcon className="size-3.5" />
        {paintLabel}
      </Button>
      <Button
        variant={variant}
        size="sm"
        onClick={handleExportPng}
        disabled={loading}
        className={labels === "short" ? "min-h-9 gap-1 text-xs" : "text-xs"}
      >
        <ImageIcon className="size-3.5" />
        {pngLabel}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        disabled={loading}
        className={labels === "short" ? "min-h-9 gap-1 text-xs" : "text-xs"}
      >
        <UploadIcon className="size-3.5" />
        New
      </Button>
    </>
  );
}

import type { TilePlacement } from "@/core/tiling";

export type PreviewOptions = {
  showOriginal: boolean;
  showTransparencyGrid: boolean;
  showGrid: boolean;
  showTileBorders: boolean;
  activeUrl: string | null;
  cellsX: number;
  cellsY: number;
  tiles?: TilePlacement[];
};

type ResultCardsProps = {
  handleExportPng: () => void;
  handleExportPaintFile: () => void;
  loading: boolean;
  handleReset: () => void;
  onToggleOriginal: () => void;
  preview: PreviewOptions;
  className?: string;
};

export function ResultCards({
  handleExportPng,
  handleExportPaintFile,
  loading,
  handleReset,
  onToggleOriginal,
  preview,
  className,
}: ResultCardsProps) {
  const {
    showOriginal,
    showTransparencyGrid,
    showGrid,
    showTileBorders,
    activeUrl,
    cellsX,
    cellsY,
    tiles,
  } = preview;
  const [mobileSettingsOpen, { toggle: toggleMobileSettings }] = useDisclosure(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const resizeObserver = useResizeObserver<HTMLDivElement>();
  const containerRef = resizeObserver[0] as import("preact").RefObject<HTMLDivElement>;
  const rect = resizeObserver[1];
  const exportProps = { handleExportPng, handleExportPaintFile, handleReset, loading, tiles };

  useEffect(() => {
    const el = previewRef.current;
    if (!rect || !el) return;
    const { width: cw, height: ch } = rect;
    if (cw === 0 || ch === 0) return;
    const h = Math.min(Math.floor(cw / cellsX), Math.floor(ch / cellsY));
    if (h <= 0) return;
    const w = h * cellsX;
    const he = h * cellsY;
    if (el.style.width !== `${w}px` || el.style.height !== `${he}px`) {
      el.style.width = `${w}px`;
      el.style.height = `${he}px`;
    }
  }, [rect, cellsX, cellsY]);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2 md:flex-row", className)}>
      <Card
        size="sm"
        className={cn(
          "shrink-0 flex-col overflow-hidden md:flex md:w-80",
          mobileSettingsOpen ? "max-md:flex max-md:w-full" : "max-md:hidden",
        )}
      >
        <CardHeader className="flex flex-row flex-wrap items-center gap-1">
          <ExportButtons {...exportProps} variant="secondary" labels="full" />
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SettingsPanel tiles={tiles} />
        </CardContent>
      </Card>

      <Card size="sm" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex shrink-0 flex-row items-center justify-center">
          <Button variant="ghost" size="sm" onClick={onToggleOriginal} className="gap-1 text-xs">
            <ArrowLeftRightIcon className="size-3" />
            {showOriginal ? "Original" : "Processed"}
          </Button>
        </CardHeader>
        <CardContent className="relative min-h-0 flex-1 overflow-hidden p-2">
          {activeUrl && showTransparencyGrid && (
            <div className="transparency-grid pointer-events-none absolute inset-0 z-0" />
          )}
          <div
            ref={containerRef}
            className="absolute inset-0 flex items-center justify-center overflow-hidden p-2"
          >
            {activeUrl && (
              <div ref={previewRef} className="relative">
                <img
                  src={activeUrl}
                  alt={showOriginal ? "Original preview" : "Processed preview"}
                  className="image-rendering-pixelated block h-full w-full"
                />
                {showGrid && (
                  <div
                    className="cell-grid pointer-events-none absolute inset-0"
                    style={
                      {
                        "--grid-cols": cellsX,
                        "--grid-rows": cellsY,
                      } as React.CSSProperties
                    }
                  />
                )}
                {tiles &&
                  tiles.length > 1 &&
                  showTileBorders &&
                  tiles.map((t) => (
                    <div
                      key={`${t.x}-${t.y}`}
                      className="tile-border pointer-events-none absolute border-2"
                      title={`${t.canvasType.name} at block ${t.x},${t.y}`}
                      style={{
                        left: `${(t.x / cellsX) * 100}%`,
                        top: `${(t.y / cellsY) * 100}%`,
                        width: `${(t.canvasType.cellsX / cellsX) * 100}%`,
                        height: `${(t.canvasType.cellsY / cellsY) * 100}%`,
                      }}
                    >
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-background/80 px-1 py-0.5 text-[10px] leading-none font-medium text-foreground shadow-sm">
                        {t.canvasType.cellsX}×{t.canvasType.cellsY}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-1 md:hidden">
        <ExportButtons {...exportProps} variant="outline" labels="short" />
        <div className="ml-auto">
          <Button
            variant={mobileSettingsOpen ? "secondary" : "outline"}
            size="sm"
            onClick={toggleMobileSettings}
            className="min-h-9 gap-1 text-xs"
          >
            {mobileSettingsOpen ? (
              <XIcon className="size-3.5" />
            ) : (
              <SettingsIcon className="size-3.5" />
            )}
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
