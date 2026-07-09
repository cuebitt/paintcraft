import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
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

export type PreviewOptions = {
  showOriginal: boolean;
  showTransparencyGrid: boolean;
  showGrid: boolean;
  activeUrl: string | null;
  cellsX: number;
  cellsY: number;
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
  const { showOriginal, showTransparencyGrid, showGrid, activeUrl, cellsX, cellsY } = preview;
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitStyle, setFitStyle] = useState<{ width: number; height: number } | null>(null);

  const ratio = cellsX / cellsY;

  const recalc = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { clientWidth: w, clientHeight: h } = el;
    if (w === 0 || h === 0) return;
    const fromW = { width: w, height: Math.round(w / ratio) };
    const fromH = { width: Math.round(h * ratio), height: h };
    setFitStyle(fromW.height <= h ? fromW : fromH);
  }, [ratio]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [recalc]);

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
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportPaintFile}
            disabled={loading}
            className="text-xs"
          >
            <PaintBucketIcon className="size-3.5" />
            Export .paint
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportPng}
            disabled={loading}
            className="text-xs"
          >
            <ImageIcon className="size-3.5" />
            Export PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={loading}
            className="text-xs"
          >
            <UploadIcon className="size-3.5" />
            New
          </Button>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SettingsPanel />
        </CardContent>
      </Card>

      <Card size="sm" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex shrink-0 flex-row items-center justify-center">
          <Button variant="ghost" size="sm" onClick={onToggleOriginal} className="gap-1 text-xs">
            <ArrowLeftRightIcon className="size-3" />
            {showOriginal ? "Original" : "Processed"}
          </Button>
        </CardHeader>
        <CardContent className="relative flex min-h-0 flex-1 overflow-hidden p-2">
          {activeUrl && showTransparencyGrid && (
            <div className="transparency-grid pointer-events-none absolute inset-0 z-0" />
          )}
          <div ref={containerRef} className="flex h-full w-full items-center justify-center">
            {activeUrl && fitStyle && (
              <AspectRatio ratio={ratio} style={{ width: fitStyle.width, height: fitStyle.height }}>
                <img
                  src={activeUrl}
                  alt={showOriginal ? "Original preview" : "Processed preview"}
                  className="image-rendering-pixelated absolute inset-0 h-full w-full object-contain"
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
              </AspectRatio>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-1 md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPaintFile}
          disabled={loading}
          className="min-h-9 gap-1 text-xs"
        >
          <PaintBucketIcon className="size-3.5" />
          .paint
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPng}
          disabled={loading}
          className="min-h-9 gap-1 text-xs"
        >
          <ImageIcon className="size-3.5" />
          PNG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={loading}
          className="min-h-9 gap-1 text-xs"
        >
          <UploadIcon className="size-3.5" />
          New
        </Button>
        <div className="ml-auto">
          <Button
            variant={mobileSettingsOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setMobileSettingsOpen(!mobileSettingsOpen)}
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
