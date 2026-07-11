import { useEffect, useRef, useCallback, useMemo } from "preact/hooks";
import type { RefObject } from "preact";
import type { QuantMethod, QuantizeOptions } from "@/core/quantize";
import type { RGB } from "@/core/palette";
import { imageDataToBlob } from "@/lib/utils";
import { useAppStore, getProcessImageOptions, type ProcessImageOptions } from "@/app/store";
import { dispatchError } from "@/lib/helpers";

export interface ImageProcessorWorkers {
  workerRef: RefObject<Worker | null>;
  importWorkerRef: RefObject<Worker | null>;
  originalImageRef: RefObject<HTMLImageElement | null>;
  preprocessedDataRef: RefObject<ImageData | null>;
  quantizedDataRef: RefObject<{
    quantized: ImageData;
    adaptivePalette: readonly RGB[];
  } | null>;
  pendingProcessRef: RefObject<{
    displayDataUrl: string;
    method: QuantMethod;
    quantEnabled: boolean;
    quantOptions: QuantizeOptions;
  } | null>;
  pendingResultRef: RefObject<{
    type: "preprocessed" | "quantized";
    processedData: ImageData;
    adaptivePalette?: readonly RGB[];
  } | null>;
  clearTemporalOnNextResult: RefObject<boolean>;
  flushPendingResult: () => void;
}

export type ProcessImageFn = (img: HTMLImageElement, options: ProcessImageOptions) => Promise<void>;

export function useImageProcessor(processImage: ProcessImageFn): ImageProcessorWorkers {
  const workerRef = useRef<Worker | null>(null);
  const importWorkerRef = useRef<Worker | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const preprocessedDataRef = useRef<ImageData | null>(null);
  const quantizedDataRef = useRef<{
    quantized: ImageData;
    adaptivePalette: readonly RGB[];
  } | null>(null);
  const pendingProcessRef = useRef<{
    displayDataUrl: string;
    method: QuantMethod;
    quantEnabled: boolean;
    quantOptions: QuantizeOptions;
  } | null>(null);
  const pendingResultRef = useRef<{
    type: "preprocessed" | "quantized";
    processedData: ImageData;
    adaptivePalette?: readonly RGB[];
  } | null>(null);
  const displayDataUrlRef = useRef<string>("");
  const clearTemporalOnNextResult = useRef(false);
  const processImageRef = useRef(processImage);
  processImageRef.current = processImage;

  async function flushPendingResult() {
    const pendingResult = pendingResultRef.current;
    const displayDataUrl = displayDataUrlRef.current;
    if (!pendingResult || !displayDataUrl) return;

    try {
      const blob = await imageDataToBlob(pendingResult.processedData);
      useAppStore
        .getState()
        .setResult(displayDataUrl, URL.createObjectURL(blob), pendingResult.adaptivePalette ?? []);
      if (clearTemporalOnNextResult.current) {
        useAppStore.temporal.getState().clear();
        useAppStore.temporal.getState().resume();
        clearTemporalOnNextResult.current = false;
      }
    } catch (err) {
      dispatchError(err, "Failed to finalize image result");
    }
    pendingResultRef.current = null;
    pendingProcessRef.current = null;
  }

  function handleImportMessage(e: MessageEvent) {
    const msg = e.data;
    if (msg.type === "error") {
      useAppStore.getState().setError(msg.message);
      return;
    }

    if (msg.type === "result") {
      const blob = new Blob([msg.imageData.buffer], { type: "image/png" });
      const dataUrl = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        useAppStore.getState().setOriginal(dataUrl);
        void processImageRef.current(img, getProcessImageOptions(useAppStore.getState()));
      };
      img.onerror = () => {
        URL.revokeObjectURL(dataUrl);
        useAppStore.getState().setError("could not load parsed image");
      };
      img.src = dataUrl;
    }
  }

  function handleWorkerMessage(e: MessageEvent) {
    const msg = e.data;
    if (msg.type === "error") {
      useAppStore.getState().setError(msg.message);
      return;
    }

    if (msg.type === "displayed") {
      const displayImageData = new ImageData(
        msg.imageData.data,
        msg.imageData.width,
        msg.imageData.height,
      );
      void imageDataToBlob(displayImageData).then((blob) => {
        displayDataUrlRef.current = URL.createObjectURL(blob);
        if (pendingProcessRef.current) {
          pendingProcessRef.current.displayDataUrl = displayDataUrlRef.current;
        }
        void flushPendingResult();
      });
      return;
    }

    if (msg.type === "quantized") {
      const quantized = new ImageData(
        msg.quantized.data,
        msg.quantized.width,
        msg.quantized.height,
      );

      quantizedDataRef.current = { quantized, adaptivePalette: msg.adaptivePalette };
      pendingResultRef.current = {
        type: "quantized",
        processedData: quantized,
        adaptivePalette: msg.adaptivePalette,
      };
      void flushPendingResult();
    }
  }

  useEffect(() => {
    const worker = new Worker(new URL("../core/quantize.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    const importWorker = new Worker(new URL("../formats/import.worker.ts", import.meta.url), {
      type: "module",
    });
    importWorkerRef.current = importWorker;

    importWorker.onmessage = handleImportMessage;
    importWorker.onerror = () => {
      dispatchError(new Error("Import worker failed"), "Import worker failed");
    };

    worker.onmessage = handleWorkerMessage;
    worker.onerror = () => {
      dispatchError(new Error("Image worker failed"), "Image worker failed");
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      importWorker.terminate();
      importWorkerRef.current = null;
    };
  }, []);

  const flushPendingResultCb = useCallback(() => void flushPendingResult(), []);

  return useMemo(
    () => ({
      workerRef,
      importWorkerRef,
      originalImageRef,
      preprocessedDataRef,
      quantizedDataRef,
      pendingProcessRef,
      pendingResultRef,
      clearTemporalOnNextResult,
      flushPendingResult: flushPendingResultCb,
    }),
    [flushPendingResultCb],
  );
}
