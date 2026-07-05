import { useEffect, useRef, useCallback, useMemo, useState } from "preact/hooks";
import { AppHeader } from "@/components/AppHeader";
import { UploadDropzone } from "@/components/UploadDropzone";
import { PalettesSection } from "@/components/PalettesSection";
import { EmbedLayout } from "@/components/EmbedLayout";
import { ResultCards } from "@/components/ResultCards";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useImageProcessor, type ProcessImageFn } from "@/hooks/useImageProcessor";
import { useAppCallbacks } from "@/hooks/useAppCallbacks";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useClipboard } from "@/hooks/useClipboard";
import { resolveImageParam } from "@/hooks/useEmbedMode";
import { preprocessImageForCanvas } from "@/core/preprocess";
import { useAppStore, getProcessImageArgs, restorePreferencesFromStorage } from "@/app/store";
import { dispatchError } from "@/lib/helpers";

function App() {
  const state = useAppStore();
  const { undo, redo } = state;
  const [showOriginal, setShowOriginal] = useState(false);

  const isEmbedded =
    typeof window !== "undefined" &&
    (window.self !== window.top ||
      window.location.pathname.includes("embed") ||
      new URLSearchParams(window.location.search).has("embed"));

  useEffect(() => {
    if (!isEmbedded) {
      restorePreferencesFromStorage();
    }
  }, [isEmbedded]);
  useLocalStorage("dark", isEmbedded);

  const { startTimer, endTimer } = usePerformanceMonitor();

  const toggleGrid = useCallback(() => {
    useAppStore.getState().setShowGrid(!useAppStore.getState().showGrid);
  }, []);

  const toggleQuantize = useCallback(() => {
    useAppStore.getState().setQuantizationEnabled(!useAppStore.getState().quantizationEnabled);
  }, []);

  const processImage = useCallback<ProcessImageFn>(
    async (
      img,
      canvas,
      method,
      mode,
      padding,
      quantEnabled,
      quantOptions,
      resizeOptions,
      paddingAlpha,
    ) => {
      try {
        const workers = workersRef.current;
        if (!workers?.workerRef.current) {
          dispatchError(new Error("Image processor not ready"), "Image processor not ready");
          return;
        }

        workers.pendingProcessRef.current = {
          displayDataUrl: "",
          method,
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
        workers.workerRef.current.postMessage({
          type: "display",
          imageBitmap: displayBitmap,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          fitMode: mode,
          paddingColor: padding,
          paddingAlpha,
        });

        if (quantEnabled) {
          const msg = {
            type: "quantize" as const,
            imageData: {
              data: preprocessedData.data,
              width: preprocessedData.width,
              height: preprocessedData.height,
            },
            method,
            options: quantOptions,
          };
          workers.workerRef.current.postMessage(msg, [preprocessedData.data.buffer]);
        } else {
          workers.quantizedDataRef.current = { quantized: preprocessedData, adaptivePalette: [] };
          workers.pendingResultRef.current = {
            type: "preprocessed",
            processedData: preprocessedData,
          };
          workers.flushPendingResult();
        }
      } catch (err) {
        dispatchError(err, "Failed to process image");
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
    "ctrl+z": undo,
    "ctrl+shift+z": redo,
    "ctrl+y": redo,
    g: toggleGrid,
    q: toggleQuantize,
    "ctrl+shift+e": handleExportPaintFile,
    "ctrl+shift+p": handleExportPng,
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
        void processImage(workers.originalImageRef.current, ...getProcessImageArgs(s));
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
    processImage,
    workers.originalImageRef,
    startTimer,
  ]);

  const hasResults = useMemo(
    () => !!(state.originalUrl && state.preprocessedUrl && state.quantizedUrl),
    [state.originalUrl, state.preprocessedUrl, state.quantizedUrl],
  );

  const activeUrl = showOriginal ? state.originalUrl : state.quantizedUrl;

  const handleReset = useCallback(() => useAppStore.getState().reset(), []);
  const onToggleOriginal = useCallback(() => setShowOriginal((p) => !p), []);

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
        onToggleOriginal={onToggleOriginal}
        preview={preview}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
          {state.error && (
            <div
              role="alert"
              className="mx-auto mb-6 max-w-2xl rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
            >
              {state.error}
            </div>
          )}

          <div
            className={`flex min-h-0 flex-1 flex-col${hasResults ? " max-h-[calc(100vh-12rem)]" : ""}`}
          >
            {hasResults ? (
              <ResultCards
                handleExportPng={handleExportPng}
                handleExportPaintFile={handleExportPaintFile}
                loading={state.loading}
                handleReset={handleReset}
                onToggleOriginal={onToggleOriginal}
                preview={preview}
              />
            ) : (
              <div className="mx-auto w-full max-w-2xl">
                <UploadDropzone onUpload={handleUpload} loading={state.loading} />
              </div>
            )}
          </div>

          {hasResults && state.quantizationEnabled && (
            <PalettesSection
              adaptivePalette={state.adaptivePalette}
              adaptiveColorCount={state.adaptiveColorCount}
            />
          )}
        </main>

        <footer className="border-t border-border bg-background/80">
          <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
            paintcraft - Built with Preact + shadcn/ui + TailwindCSS
            <span className="mx-2">·</span>
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
