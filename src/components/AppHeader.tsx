import { PaintBucketIcon } from "lucide-react";
import { AboutDialog } from "@/components/AboutDialog";
import { ModeToggle } from "@/components/ModeToggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="rounded-lg bg-accent p-1.5 sm:p-2">
            <PaintBucketIcon
              className="size-5 text-accent-foreground sm:size-6"
              aria-hidden="true"
            />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground sm:text-xl">paintcraft</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Resize, quantize, and export images as paint files
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <AboutDialog />
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
