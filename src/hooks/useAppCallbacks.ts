import { useCallback, useRef } from "preact/hooks";
import type { ProcessImageFn, ImageProcessorWorkers } from "@/hooks/useImageProcessor";
import { useAppStore, getProcessImageOptions } from "@/app/store";
import { importPaintFile, exportPaintFile, exportPng } from "@/lib/file-io";
import { dispatchError } from "@/lib/helpers";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

const IMPORT_HANDLERS: Record<
  string,
  { type: string; extract: (reader: FileReader) => Record<string, unknown>; text?: boolean }
> = {
  ".ase": { type: "parseAseprite", extract: (r) => ({ buffer: r.result }) },
  ".aseprite": { type: "parseAseprite", extract: (r) => ({ buffer: r.result }) },
  ".psd": { type: "parsePsd", extract: (r) => ({ buffer: r.result }) },
  ".svg": { type: "parseSvg", extract: (r) => ({ text: r.result }), text: true },
  ".piskel": { type: "parsePiskel", extract: (r) => ({ text: r.result }), text: true },
  ".pixil": { type: "parsePixil", extract: (r) => ({ text: r.result }), text: true },
};

export function useAppCallbacks(processImage: ProcessImageFn, workers: ImageProcessorWorkers) {
  const processImageRef = useRef(processImage);
  processImageRef.current = processImage;

  const workersRef = useRef(workers);
  workersRef.current = workers;

  const readIntoWorker = useCallback(
    (
      file: File,
      type: string,
      extract: (reader: FileReader) => Record<string, unknown>,
      asText = false,
    ) => {
      useAppStore.getState().setLoading(true);
      const reader = new FileReader();
      reader.onload = () => {
        if (!workersRef.current.importWorkerRef.current) {
          dispatchError(
            new Error("Import worker not initialized"),
            "Import worker not initialized",
          );
          return;
        }
        workersRef.current.importWorkerRef.current.postMessage({ type, ...extract(reader) });
      };
      reader.onerror = () => {
        dispatchError(new Error(`Failed to read ${file.name}`), `Failed to read ${file.name}`);
      };
      if (asText) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    },
    [],
  );

  const handleImportPaintFile = useCallback(
    (file: File) => importPaintFile(file, workersRef.current),
    [],
  );

  const handleUpload = useCallback(
    (file: File) => {
      useAppStore.temporal.getState().clear();

      if (file.name.endsWith(".paint")) {
        handleImportPaintFile(file);
        return;
      }
      for (const [ext, handler] of Object.entries(IMPORT_HANDLERS)) {
        if (file.name.endsWith(ext)) {
          useAppStore.temporal.getState().pause();
          workersRef.current.clearTemporalOnNextResult.current = true;
          readIntoWorker(file, handler.type, handler.extract, handler.text);
          return;
        }
      }

      useAppStore.temporal.getState().pause();
      workersRef.current.clearTemporalOnNextResult.current = true;
      useAppStore.getState().setLoading(true);
      void readFileAsDataUrl(file)
        .then(async (dataUrl) => {
          const img = await loadImageFromDataUrl(dataUrl);
          workersRef.current.originalImageRef.current = img;
          useAppStore.getState().setOriginal(dataUrl);
          const s = useAppStore.getState();
          void processImageRef.current(img, getProcessImageOptions(s));
        })
        .catch((err) => {
          dispatchError(err, `Failed to load ${file.name}`);
        });
    },
    [handleImportPaintFile, readIntoWorker],
  );

  const handleExportPaintFile = useCallback(() => {
    const s = useAppStore.getState();
    return exportPaintFile(workersRef.current, s);
  }, []);

  const handleExportPng = useCallback(() => exportPng(workersRef.current), []);

  return { handleUpload, handleExportPaintFile, handleExportPng };
}
