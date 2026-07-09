import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftRightIcon, PaintBucketIcon, ImageIcon, UploadIcon } from "lucide-react";
import { SettingsPanel } from "@/components/SettingsPanel";

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
};

export function ResultCards({
  handleExportPng,
  handleExportPaintFile,
  loading,
  handleReset,
  onToggleOriginal,
  preview,
}: ResultCardsProps) {
  const { showOriginal, showTransparencyGrid, showGrid, activeUrl, cellsX, cellsY } = preview;

  return (
    <div className="flex min-h-0 flex-1 gap-2">
      <Card size="sm" className="w-80 shrink-0 self-stretch overflow-hidden">
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
        <CardContent className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden">
          {activeUrl && (
            <div className="relative h-full w-full">
              <div
                className="absolute top-1/2 left-1/2 max-h-full w-full"
                style={{
                  aspectRatio: `${cellsX} / ${cellsY}`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {showTransparencyGrid && <div className="transparency-grid absolute inset-0" />}
                {showGrid && (
                  <div
                    className="cell-grid pointer-events-none absolute inset-0 z-20"
                    style={
                      {
                        "--grid-cols": cellsX,
                        "--grid-rows": cellsY,
                      } as React.CSSProperties
                    }
                  />
                )}
                <img
                  src={activeUrl}
                  alt={showOriginal ? "Original preview" : "Processed preview"}
                  className="image-rendering-pixelated relative z-10 h-full w-full object-contain"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
