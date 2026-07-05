import { TooltipProvider } from "@/components/ui/tooltip";
import { ResultCards, type PreviewOptions } from "@/components/ResultCards";
import { UploadDropzone } from "@/components/UploadDropzone";

type EmbedLayoutProps = {
  error: string | null;
  handleUpload: (file: File) => void;
  loading: boolean;
  hasResults: boolean;
  handleExportPng: () => void;
  handleExportPaintFile: () => void;
  handleReset: () => void;
  onToggleOriginal: () => void;
  preview: PreviewOptions;
};

export function EmbedLayout({
  error,
  handleUpload,
  loading,
  hasResults,
  handleExportPng,
  handleExportPaintFile,
  handleReset,
  onToggleOriginal,
  preview,
}: EmbedLayoutProps) {
  return (
    <TooltipProvider>
      <div className="embed-mode flex h-dvh flex-col overflow-hidden p-2">
        {error && (
          <div
            role="alert"
            className="mx-auto mb-6 max-w-2xl rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col">
          {hasResults ? (
            <ResultCards
              handleExportPng={handleExportPng}
              handleExportPaintFile={handleExportPaintFile}
              loading={loading}
              handleReset={handleReset}
              onToggleOriginal={onToggleOriginal}
              preview={preview}
            />
          ) : (
            <div className="flex flex-1 flex-col p-4">
              <div className="mx-auto flex max-h-[80dvh] w-full max-w-2xl flex-1 flex-col">
                <UploadDropzone onUpload={handleUpload} loading={loading} className="flex-1" />
              </div>
            </div>
          )}
        </div>
        {!hasResults && (
          <p className="shrink-0 pt-2 text-center text-xs text-muted-foreground">
            powered by{" "}
            <a
              href="https://paintcraft.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              paintcraft
            </a>
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}
