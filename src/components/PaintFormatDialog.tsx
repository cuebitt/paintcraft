import { useState } from "preact/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileTextIcon } from "lucide-react";
import DOMPurify from "dompurify";
import "highlight.js/styles/github-dark.css";
import rawHtml from "@/content/paint_file_format.md?html";

const html = DOMPurify.sanitize(rawHtml);

export function PaintFormatDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground" />}
      >
        <FileTextIcon data-icon="inline-start" />
        File format
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>.paint File Format</DialogTitle>
          <DialogDescription>
            NBT schema and canvas types for the Joy of Painting mod.
          </DialogDescription>
        </DialogHeader>
        <article
          className="prose prose-sm max-h-[60vh] max-w-none overflow-y-auto dark:prose-invert prose-headings:text-foreground prose-strong:text-foreground prose-th:text-foreground"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </DialogContent>
    </Dialog>
  );
}
