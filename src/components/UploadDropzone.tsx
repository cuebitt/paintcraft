import { useRef, useState } from "preact/hooks";
import type { TargetedKeyboardEvent } from "preact";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2Icon, UploadIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

const SOFT_LIMIT = 100 * 1024 * 1024;

function confirmLargeFile(file: File): boolean {
  if (file.size <= SOFT_LIMIT) return true;
  return window.confirm(
    `The file "${file.name}" is ${formatSize(file.size)}. Loading very large files may cause performance issues. Do you want to continue?`,
  );
}

interface UploadDropzoneProps {
  onUpload: (file: File) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function UploadDropzone({
  onUpload,
  loading = false,
  disabled = false,
  className,
}: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer?.files[0];
    if (file && confirmLargeFile(file)) onUpload(file);
  };

  const handleFileChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file && confirmLargeFile(file)) onUpload(file);
  };

  const handleKeyDown = (e: TargetedKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <Card
      className={cn(
        "relative cursor-pointer flex-col justify-center border-2 border-dashed transition-colors",
        isDragActive ? "border-accent bg-accent/5" : "border-border hover:border-accent/50",
        (disabled || loading) && "pointer-events-none opacity-50",
        className,
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Upload image"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.paint,.ase,.aseprite,.psd,.svg,.piskel,.pixil"
        onChange={handleFileChange}
        className="pointer-events-none absolute inset-0 cursor-pointer opacity-0"
        disabled={disabled || loading}
        aria-label="Upload image"
      />

      <CardHeader className="items-center text-center">
        <div
          className={cn(
            "mx-auto mb-2 w-fit rounded-full p-3 sm:p-4",
            isDragActive ? "bg-accent/20" : "bg-accent/10",
          )}
        >
          <UploadIcon className="size-6 text-accent sm:size-8" />
        </div>
        <CardTitle className="text-base sm:text-lg">
          {isDragActive ? "Drop image here" : "Upload an image"}
        </CardTitle>
        <CardDescription>
          {isDragActive ? "Release to upload" : "Drag & drop or click to browse"}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center text-center">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {["PNG", "JPG", "WEBP", "GIF", "PAINT", "ASE", "PSD", "SVG", "PISKEL", "PIXIL"].map(
            (ext) => (
              <span
                key={ext}
                className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:px-2 sm:py-1"
              >
                {ext}
              </span>
            ),
          )}
        </div>

        {loading && (
          <div className="mt-6 flex items-center gap-3">
            <Loader2Icon className="size-5 animate-spin text-accent" />
            <span className="text-sm text-muted-foreground">Processing...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
