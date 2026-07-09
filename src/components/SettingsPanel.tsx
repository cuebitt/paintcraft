import { useState, useEffect } from "preact/hooks";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAppStore } from "@/app/store";
import { CanvasSettings } from "@/components/CanvasSettings";
import { ResizeSettings } from "@/components/ResizeSettings";
import { QuantizationSettings } from "@/components/QuantizationSettings";
import { ExportSettings } from "@/components/ExportSettings";
import { Undo2Icon, Redo2Icon } from "lucide-react";

function useStoreSnapshot() {
  const [, forceUpdate] = useState(0);
  useEffect(() => useAppStore.subscribe(() => forceUpdate((n) => n + 1)), []);
  return useAppStore.getState();
}

function useTemporalSnapshot() {
  const [, forceUpdate] = useState(0);
  useEffect(() => useAppStore.temporal.subscribe(() => forceUpdate((n) => n + 1)), []);
  return useAppStore.temporal.getState();
}

export function SettingsPanel() {
  const {
    selectedCanvas,
    paddingColorPreview,
    paddingAlpha,
    showGrid,
    quantMethod,
    fitMode,
    quantizationEnabled,
    adaptiveColorCount,
    includeFixedPalette,
    resizeFilter,
    unsharpAmount,
    title,
    author,
    signed,
    embedOriginalImage,
    paintFormat,
    glass,
    sidesActive,
    showTransparencyGrid,
    loading,
    setCanvas,
    setPaddingColorPreview,
    setPaddingColor,
    setShowGrid,
    setQuantMethod,
    setFitMode,
    setQuantizationEnabled,
    setAdaptiveColorCount,
    setIncludeFixedPalette,
    setResizeFilter,
    setUnsharpAmount,
    setTitle,
    setAuthor,
    setSigned,
    setEmbedOriginalImage,
    setPaintFormat,
    setGlass,
    setSidesActive,
    setShowTransparencyGrid,
  } = useStoreSnapshot();

  const { undo, redo, pastStates, futureStates } = useTemporalSnapshot();
  const totalSteps = pastStates.length + futureStates.length + 1;
  const currentStep = futureStates.length + 1;

  const { showTooltips } = useTheme();
  const [colorCountLocal, setColorCount] = useDebouncedValue(adaptiveColorCount, 400);
  const [sharpenLocal, setSharpen] = useDebouncedValue(unsharpAmount, 400);

  const onColorCount = (val: number) => {
    setColorCount(val);
    setAdaptiveColorCount(val);
  };

  const onSharpen = (val: number) => {
    setSharpen(val);
    setUnsharpAmount(val);
  };

  return (
    <Tabs defaultValue="canvas" className="flex min-h-0 flex-1 flex-col">
      <TabsList className="w-full shrink-0">
        <TabsTrigger value="canvas">Canvas</TabsTrigger>
        <TabsTrigger value="resize">Resize</TabsTrigger>
        <TabsTrigger value="colors">Colors</TabsTrigger>
        <TabsTrigger value="export">Export</TabsTrigger>
      </TabsList>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <TabsContent value="canvas" keepMounted>
          <CanvasSettings
            selectedCanvas={selectedCanvas}
            paintFormat={paintFormat}
            paddingColorPreview={paddingColorPreview}
            paddingAlpha={paddingAlpha}
            glass={glass}
            showGrid={showGrid}
            showTransparencyGrid={showTransparencyGrid}
            showTooltips={showTooltips}
            loading={loading}
            setCanvas={setCanvas}
            setPaddingColorPreview={setPaddingColorPreview}
            setPaddingColor={setPaddingColor}
            setShowGrid={setShowGrid}
            setShowTransparencyGrid={setShowTransparencyGrid}
          />
        </TabsContent>

        <TabsContent value="resize" keepMounted>
          <ResizeSettings
            resizeFilter={resizeFilter}
            resizeSharpenLocal={sharpenLocal}
            fitMode={fitMode}
            showTooltips={showTooltips}
            loading={loading}
            setResizeFilter={setResizeFilter}
            handleSharpenChange={onSharpen}
            setFitMode={setFitMode}
          />
        </TabsContent>

        <TabsContent value="colors" keepMounted>
          <QuantizationSettings
            quantizationEnabled={quantizationEnabled}
            quantMethod={quantMethod}
            colorCountLocal={colorCountLocal}
            includeFixedPalette={includeFixedPalette}
            showTooltips={showTooltips}
            loading={loading}
            setQuantizationEnabled={setQuantizationEnabled}
            setQuantMethod={setQuantMethod}
            handleColorCountChange={onColorCount}
            setIncludeFixedPalette={setIncludeFixedPalette}
          />
        </TabsContent>

        <TabsContent value="export" keepMounted>
          <ExportSettings
            paintFormat={paintFormat}
            glass={glass}
            sidesActive={sidesActive}
            signed={signed}
            embedOriginalImage={embedOriginalImage}
            title={title}
            author={author}
            showTooltips={showTooltips}
            loading={loading}
            setPaintFormat={setPaintFormat}
            setGlass={setGlass}
            setSidesActive={setSidesActive}
            setSigned={setSigned}
            setEmbedOriginalImage={setEmbedOriginalImage}
            setTitle={setTitle}
            setAuthor={setAuthor}
          />
        </TabsContent>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-1 border-t border-border px-2 py-2 text-xs text-muted-foreground">
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          disabled={pastStates.length === 0}
          onClick={() => undo()}
        >
          <Undo2Icon className="size-3.5" />
        </Button>
        <span className="min-w-[4rem] text-center tabular-nums">
          {currentStep}/{totalSteps}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          disabled={futureStates.length === 0}
          onClick={() => redo()}
        >
          <Redo2Icon className="size-3.5" />
        </Button>
      </div>
    </Tabs>
  );
}
