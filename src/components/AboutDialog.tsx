import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { InfoIcon, ExternalLinkIcon } from "lucide-react";
import { PaintFormatDialog } from "@/components/PaintFormatDialog";

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="min-h-9 min-w-9 sm:min-h-7 sm:min-w-7"
          />
        }
      >
        <InfoIcon className="size-4" />
        <span className="sr-only">About paintcraft</span>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] min-h-0 grid-rows-[auto_1fr] sm:max-h-[75dvh]">
        <DialogHeader>
          <DialogTitle>paintcraft</DialogTitle>
          <DialogDescription>
            Quantize images to a limited palette and save them as .paint files.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto">
          <p className="mb-3 text-sm text-muted-foreground">
            Made for the{" "}
            <a
              href="https://modrinth.com/mod/joy-of-painting"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Joy of Painting
            </a>{" "}
            mod for Minecraft.
          </p>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Import <code>.paint</code> files, or resize and quantize images into{" "}
              <code>.paint</code> files for use in paint tools. Everything runs in your browser!
              There is no back-end server, and no AI is used.
            </p>
            <h4 className="font-medium text-foreground">Resize</h4>
            <p>
              Scale images using nearest neighbor (pixelated) or high-quality <code>pica</code>{" "}
              filters with optional unsharp mask.
            </p>
            <h4 className="font-medium text-foreground">Quantize</h4>
            <p>
              Reduce colors with Median Cut, NeuQuant, or WuQuant. Configure dithering, color
              distance, and palette composition.
            </p>
            <h4 className="font-medium text-foreground">Export</h4>
            <p>
              Import and export <code>.paint</code> files, or save the result as a PNG.
            </p>
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <h4 className="mb-2 text-sm font-medium text-foreground">Keyboard Shortcuts</h4>
            <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>Undo</span>
              <KbdGroup>
                <Kbd>⌘Z</Kbd>
              </KbdGroup>
              <span>Redo</span>
              <KbdGroup>
                <Kbd>⌘⇧Z</Kbd>
              </KbdGroup>
              <span>Toggle grid</span>
              <KbdGroup>
                <Kbd>G</Kbd>
              </KbdGroup>
              <span>Toggle quantize</span>
              <KbdGroup>
                <Kbd>Q</Kbd>
              </KbdGroup>
              <span>Export .paint</span>
              <KbdGroup>
                <Kbd>⌘⇧E</Kbd>
              </KbdGroup>
              <span>Export PNG</span>
              <KbdGroup>
                <Kbd>⌘⇧P</Kbd>
              </KbdGroup>
              <span>Copy to clipboard</span>
              <KbdGroup>
                <Kbd>⌘⇧C</Kbd>
              </KbdGroup>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 pt-3">
            <PaintFormatDialog />
            <a
              href="https://github.com/cuebitt/paintcraft"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline hover:text-foreground"
            >
              View on GitHub
              <ExternalLinkIcon className="size-3.5" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
