import { useState, useEffect } from "preact/hooks";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useTheme } from "@/components/ThemeProvider";
import { useDebouncedCallback } from "@mantine/hooks";
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
    reprocess,
  } = useStoreSnapshot();

  const { undo, redo, pastStates, futureStates } = useTemporalSnapshot();
  const totalSteps = pastStates.length + futureStates.length + 1;
  const currentStep = futureStates.length + 1;

  const { showTooltips } = useTheme();

  const [colorCountLocal, setColorCount] = useState(adaptiveColorCount);
  useEffect(() => {
    setColorCount(adaptiveColorCount);
  }, [adaptiveColorCount]);
  const debouncedSetColor = useDebouncedCallback((val: number) => setAdaptiveColorCount(val), 150);
  const onColorCount = (val: number) => {
    setColorCount(val);
    debouncedSetColor(val);
  };

  const [sharpenLocal, setSharpen] = useState(unsharpAmount);
  useEffect(() => {
    setSharpen(unsharpAmount);
  }, [unsharpAmount]);
  const debouncedSetUnsharp = useDebouncedCallback((val: number) => setUnsharpAmount(val), 150);
  const onSharpen = (val: number) => {
    setSharpen(val);
    debouncedSetUnsharp(val);
  };

  return (
    <Tabs defaultValue="canvas" className="flex min-h-0 flex-1 flex-col">
      <TabsList className="w-full shrink-0">
        <TabsTrigger value="canvas">Canvas</TabsTrigger>
        <TabsTrigger value="resize">Resize</TabsTrigger>
        <TabsTrigger value="colors">Colors</TabsTrigger>
        <TabsTrigger value="export">Export</TabsTrigger>
      </TabsList>

      <TabsContent value="canvas" keepMounted className="min-h-0 flex-1 overflow-y-auto">
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

      <TabsContent value="resize" keepMounted className="min-h-0 flex-1 overflow-y-auto">
        <ResizeSettings
          resizeFilter={resizeFilter}
          resizeSharpenLocal={sharpenLocal}
          fitMode={fitMode}
          showTooltips={showTooltips}
          loading={loading}
          setResizeFilter={setResizeFilter}
          handleSharpenChange={onSharpen}
          setFitMode={setFitMode}
          onReprocess={reprocess}
        />
      </TabsContent>

      <TabsContent value="colors" keepMounted className="min-h-0 flex-1 overflow-y-auto">
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

      <TabsContent value="export" keepMounted className="min-h-0 flex-1 overflow-y-auto">
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

      <Separator />
      <div className="flex shrink-0 items-center justify-center gap-1 px-2 py-2 text-xs text-muted-foreground">
        <Tooltip disabled={!showTooltips}>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 sm:size-6"
                disabled={pastStates.length === 0}
                onClick={() => undo()}
              >
                <Undo2Icon className="size-4 sm:size-3.5" />
              </Button>
            }
          />
          <TooltipContent side="bottom">Undo (⌘Z)</TooltipContent>
        </Tooltip>
        <span className="min-w-[4rem] text-center tabular-nums">
          {currentStep}/{totalSteps}
        </span>
        <Tooltip disabled={!showTooltips}>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 sm:size-6"
                disabled={futureStates.length === 0}
                onClick={() => redo()}
              >
                <Redo2Icon className="size-4 sm:size-3.5" />
              </Button>
            }
          />
          <TooltipContent side="bottom">Redo (⌘⇧Z)</TooltipContent>
        </Tooltip>
      </div>
    </Tabs>
  );
}
