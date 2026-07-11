import { useEffect, useRef, useCallback, useMemo } from "preact/hooks";
import { AppHeader } from "@/components/AppHeader";
import { UploadDropzone } from "@/components/UploadDropzone";
import { PalettesSection } from "@/components/PalettesSection";
import { EmbedLayout } from "@/components/EmbedLayout";
import { ResultCards } from "@/components/ResultCards";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDisclosure } from "@mantine/hooks";
import { useImageProcessor, type ProcessImageFn } from "@/hooks/useImageProcessor";
import { useAppCallbacks } from "@/hooks/useAppCallbacks";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useClipboard } from "@/hooks/useClipboard";
import { resolveImageParam } from "@/hooks/useEmbedMode";
import { preprocessImageForCanvas } from "@/core/preprocess";
import { detectEmbedMode } from "@/lib/embed";
import { useAppStore, getProcessImageOptions } from "@/app/store";
import { dispatchError } from "@/lib/helpers";
import type { CanvasType, ImageFitMode } from "@/types";
import type { RGB } from "@/core/palette";
import type { QuantMethod, QuantizeOptions } from "@/core/quantize";

const toggleGrid = () => {
  useAppStore.getState().setShowGrid(!useAppStore.getState().showGrid);
};

const toggleQuantize = () => {
  useAppStore.getState().setQuantizationEnabled(!useAppStore.getState().quantizationEnabled);
};

const handleReset = () => useAppStore.getState().reset();

function postDisplayMessage(
  worker: Worker,
  imageBitmap: ImageBitmap,
  canvas: CanvasType,
  mode: ImageFitMode,
  padding: RGB,
  paddingAlpha?: number,
) {
  worker.postMessage({
    type: "display",
    imageBitmap,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    fitMode: mode,
    paddingColor: padding,
    paddingAlpha,
  });
}

function postQuantizeMessage(
  worker: Worker,
  preprocessedData: ImageData,
  method: QuantMethod,
  quantOptions: QuantizeOptions,
) {
  worker.postMessage(
    {
      type: "quantize" as const,
      imageData: {
        data: preprocessedData.data,
        width: preprocessedData.width,
        height: preprocessedData.height,
      },
      method,
      options: quantOptions,
    },
    [preprocessedData.data.buffer],
  );
}

function App() {
  const state = useAppStore();
  const { undo, redo } = useAppStore.temporal.getState();
  const [showOriginal, { toggle: toggleOrig }] = useDisclosure(false);

  const isEmbedded = detectEmbedMode();

  const { startTimer, endTimer } = usePerformanceMonitor();

  const processImage = useCallback<ProcessImageFn>(
    async (img, options) => {
      try {
        const {
          canvas,
          fitMode: mode,
          method,
          padding,
          quantEnabled,
          quantOptions,
          resizeOptions,
          paddingAlpha,
        } = options;
        const workers = workersRef.current;
        if (!workers?.workerRef.current) {
          dispatchError(new Error("Image processor not ready"), "Image processor not ready");
          return;
        }

        workers.pendingProcessRef.current = {
          displayDataUrl: "",
          method: options.method,
          quantEnabled,
          quantOptions,
        };

        const preprocessedData = await preprocessImageForCanvas(
          img,
          canvas,
          mode,
          padding,
          resizeOptions,
          paddingAlpha,
        );
        workers.preprocessedDataRef.current = preprocessedData;

        const displayBitmap = await createImageBitmap(img);
        postDisplayMessage(
          workers.workerRef.current,
          displayBitmap,
          canvas,
          mode,
          padding,
          paddingAlpha,
        );

        if (quantEnabled) {
          postQuantizeMessage(workers.workerRef.current, preprocessedData, method, quantOptions);
        } else {
          workers.quantizedDataRef.current = { quantized: preprocessedData, adaptivePalette: [] };
          workers.pendingResultRef.current = {
            type: "preprocessed",
            processedData: preprocessedData,
          };
          workers.flushPendingResult();
        }
      } catch (err) {
        dispatchError(err, "processing failed");
      } finally {
        endTimer("process-image");
      }
    },
    [endTimer],
  );

  const workers = useImageProcessor(processImage);
  const workersRef = useRef(workers);
  workersRef.current = workers;

  const { handleUpload, handleExportPaintFile, handleExportPng } = useAppCallbacks(
    processImage,
    workers,
  );

  const handleCopyToClipboard = useClipboard(workers, startTimer, endTimer);

  useKeyboardShortcuts({
    "cmd+z": undo,
    "ctrl+z": undo,
    "cmd+shift+z": redo,
    "ctrl+shift+z": redo,
    "ctrl+y": redo,
    g: toggleGrid,
    q: toggleQuantize,
    "cmd+shift+e": handleExportPaintFile,
    "ctrl+shift+e": handleExportPaintFile,
    "cmd+shift+p": handleExportPng,
    "ctrl+shift+p": handleExportPng,
    "cmd+shift+c": handleCopyToClipboard,
    "ctrl+shift+c": handleCopyToClipboard,
  });

  useEffect(() => {
    if (!isEmbedded) return;
    const params = new URLSearchParams(window.location.search);
    const imageParam = params.get("image");
    if (!imageParam) return;
    let cancelled = false;
    void resolveImageParam(imageParam).then((file) => {
      if (file && !cancelled) handleUpload(file);
    });
    return () => {
      cancelled = true;
    };
  }, [isEmbedded, handleUpload]);

  const reprocessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (reprocessTimeoutRef.current !== null) {
      clearTimeout(reprocessTimeoutRef.current);
    }
    reprocessTimeoutRef.current = setTimeout(() => {
      reprocessTimeoutRef.current = null;
      if (workers.originalImageRef.current && useAppStore.getState().originalUrl) {
        useAppStore.getState().setLoading(true);
        const s = useAppStore.getState();
        startTimer("process-image");
        void processImage(workers.originalImageRef.current, getProcessImageOptions(s));
      }
    }, 50);
    return () => {
      if (reprocessTimeoutRef.current !== null) {
        clearTimeout(reprocessTimeoutRef.current);
      }
    };
  }, [
    state.selectedCanvas,
    state.quantMethod,
    state.fitMode,
    state.paddingColor,
    state.paddingAlpha,
    state.quantizationEnabled,
    state.adaptiveColorCount,
    state.includeFixedPalette,
    state.resizeFilter,
    state.unsharpAmount,
    state.reprocessCount,
    processImage,
    workers.originalImageRef,
    startTimer,
  ]);

  const hasResults = !!(state.originalUrl && state.preprocessedUrl && state.quantizedUrl);

  const activeUrl = showOriginal ? state.originalUrl : state.quantizedUrl;

  const preview = useMemo(
    () => ({
      showOriginal,
      showTransparencyGrid: state.showTransparencyGrid,
      showGrid: state.showGrid,
      activeUrl,
      cellsX: state.selectedCanvas.cellsX,
      cellsY: state.selectedCanvas.cellsY,
    }),
    [
      showOriginal,
      state.showTransparencyGrid,
      state.showGrid,
      activeUrl,
      state.selectedCanvas.cellsX,
      state.selectedCanvas.cellsY,
    ],
  );

  if (isEmbedded) {
    return (
      <EmbedLayout
        hasResults={hasResults}
        error={state.error}
        handleUpload={handleUpload}
        loading={state.loading}
        handleExportPng={handleExportPng}
        handleExportPaintFile={handleExportPaintFile}
        handleReset={handleReset}
        onToggleOriginal={toggleOrig}
        preview={preview}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-2 px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
          {state.error && (
            <Alert variant="destructive" className="mx-auto mb-6 max-w-2xl">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {hasResults ? (
            <ResultCards
              handleExportPng={handleExportPng}
              handleExportPaintFile={handleExportPaintFile}
              loading={state.loading}
              handleReset={handleReset}
              onToggleOriginal={toggleOrig}
              preview={preview}
              className="max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)]"
            />
          ) : (
            <div className="mx-auto w-full max-w-2xl">
              <UploadDropzone onUpload={handleUpload} loading={state.loading} />
            </div>
          )}

          {hasResults && state.quantizationEnabled && (
            <PalettesSection
              adaptivePalette={state.adaptivePalette}
              adaptiveColorCount={state.adaptiveColorCount}
            />
          )}
        </main>

        <footer className="border-t border-border bg-background/80">
          <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
            <span className="block sm:inline">
              paintcraft - Built with Preact + shadcn/ui + TailwindCSS
            </span>
            <span className="mx-2 hidden sm:inline">·</span>
            <a
              href="https://github.com/cuebitt/paintcraft"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}

export default App;
