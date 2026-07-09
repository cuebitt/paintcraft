import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { PaintFormat } from "@/types";
import { PAINT_FORMATS } from "@/types";
import {
  FileIcon,
  GlassWaterIcon,
  BoxIcon,
  PenIcon,
  PaperclipIcon,
  TypeIcon,
  UserIcon,
} from "lucide-react";

type ExportSettingsProps = {
  paintFormat: PaintFormat;
  glass: boolean;
  sidesActive: boolean;
  signed: boolean;
  embedOriginalImage: boolean;
  title: string;
  author: string;
  showTooltips: boolean;
  loading: boolean;
  setPaintFormat: (format: PaintFormat) => void;
  setGlass: (glass: boolean) => void;
  setSidesActive: (active: boolean) => void;
  setSigned: (signed: boolean) => void;
  setEmbedOriginalImage: (embed: boolean) => void;
  setTitle: (title: string) => void;
  setAuthor: (author: string) => void;
};

export function ExportSettings({
  paintFormat,
  glass,
  sidesActive,
  signed,
  embedOriginalImage,
  title,
  author,
  showTooltips,
  loading,
  setPaintFormat,
  setGlass,
  setSidesActive,
  setSigned,
  setEmbedOriginalImage,
  setTitle,
  setAuthor,
}: ExportSettingsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <FileIcon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Format</span>
        </span>
        <Tooltip disabled={!showTooltips}>
          <TooltipTrigger
            render={
              <Select
                value={paintFormat}
                onValueChange={(v) => setPaintFormat(v as PaintFormat)}
                disabled={loading}
              >
                <SelectTrigger className="w-36">
                  <span className="flex flex-1 text-left">
                    {PAINT_FORMATS.find((f) => f.value === paintFormat)?.label ?? paintFormat}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PAINT_FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            }
          />
          <TooltipContent side="bottom" sideOffset={8}>
            {PAINT_FORMATS.find((f) => f.value === paintFormat)?.description}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <GlassWaterIcon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Glass Canvas</span>
        </span>
        <Switch
          id="setting-glass-toggle"
          checked={glass}
          onCheckedChange={() => setGlass(!glass)}
          disabled={loading || paintFormat !== "jop-2x"}
        />
      </div>

      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <BoxIcon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Paint Sides</span>
        </span>
        <Switch
          id="setting-sides-toggle"
          checked={sidesActive}
          onCheckedChange={() => setSidesActive(!sidesActive)}
          disabled={loading || paintFormat !== "jop-2x"}
        />
      </div>

      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <PenIcon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">
            {signed ? "Signed" : "Unsigned"}
          </span>
        </span>
        <Switch
          id="setting-signed-toggle"
          checked={signed}
          onCheckedChange={() => setSigned(!signed)}
          disabled={loading}
        />
      </div>

      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <PaperclipIcon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Embed Original</span>
        </span>
        <Switch
          id="setting-embed-original-toggle"
          checked={embedOriginalImage}
          onCheckedChange={() => setEmbedOriginalImage(!embedOriginalImage)}
          disabled={loading}
        />
      </div>

      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <TypeIcon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Title</span>
        </span>
        <Input
          id="setting-painting-title"
          type="text"
          maxLength={64}
          value={title}
          onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
          disabled={loading || !signed}
          placeholder="Painting title"
          className="w-36"
        />
      </div>

      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <UserIcon className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-medium text-foreground">Author</span>
        </span>
        <Input
          id="setting-painting-author"
          type="text"
          maxLength={64}
          value={author}
          onChange={(e) => setAuthor((e.target as HTMLInputElement).value)}
          disabled={loading || !signed}
          placeholder="Author name"
          className="w-36"
        />
      </div>
    </div>
  );
}
