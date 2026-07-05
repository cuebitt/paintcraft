import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTheme } from "@/components/ThemeProvider";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAppStore } from "@/app/store";
import { CanvasSettings } from "@/components/CanvasSettings";
import { ResizeSettings } from "@/components/ResizeSettings";
import { ColorSettings } from "@/components/ColorSettings";
import { ExportSettings } from "@/components/ExportSettings";

export function EmbedSettings() {
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
  } = useAppStore();

  const { showTooltips } = useTheme();
  const [colorCountLocal, setColorCount] = useDebouncedValue(adaptiveColorCount, 400);
  const [sharpenLocal, setSharpen] = useDebouncedValue(unsharpAmount, 400);

  const handleColorCountChange = (val: number) => {
    setColorCount(val);
    setAdaptiveColorCount(val);
  };

  const handleSharpenChange = (val: number) => {
    setSharpen(val);
    setUnsharpAmount(val);
  };

  return (
    <Tabs defaultValue="canvas" className="flex flex-col">
      <TabsList className="w-full">
        <TabsTrigger value="canvas">Canvas</TabsTrigger>
        <TabsTrigger value="resize">Resize</TabsTrigger>
        <TabsTrigger value="colors">Colors</TabsTrigger>
        <TabsTrigger value="export">Export</TabsTrigger>
      </TabsList>

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
          handleSharpenChange={handleSharpenChange}
          setFitMode={setFitMode}
        />
      </TabsContent>

      <TabsContent value="colors" keepMounted>
        <ColorSettings
          quantizationEnabled={quantizationEnabled}
          quantMethod={quantMethod}
          colorCountLocal={colorCountLocal}
          includeFixedPalette={includeFixedPalette}
          showTooltips={showTooltips}
          loading={loading}
          setQuantizationEnabled={setQuantizationEnabled}
          setQuantMethod={setQuantMethod}
          handleColorCountChange={handleColorCountChange}
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
    </Tabs>
  );
}
