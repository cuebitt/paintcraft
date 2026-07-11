import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SettingRow } from "@/components/SettingRow";
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
      <SettingRow
        icon={FileIcon}
        label="Format"
        tooltip={PAINT_FORMATS.find((f) => f.value === paintFormat)?.description ?? ""}
      >
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
      </SettingRow>

      <SettingRow
        icon={GlassWaterIcon}
        label="Glass Canvas"
        tooltip="Enables transparency on the canvas padding"
      >
        <Switch
          id="setting-glass-toggle"
          checked={glass}
          onCheckedChange={() => setGlass(!glass)}
          disabled={loading || paintFormat !== "jop-2x"}
        />
      </SettingRow>

      <SettingRow
        icon={BoxIcon}
        label="Paint Sides"
        tooltip="Paint the block sides with edge colors (jop-2x only)"
      >
        <Switch
          id="setting-sides-toggle"
          checked={sidesActive}
          onCheckedChange={() => setSidesActive(!sidesActive)}
          disabled={loading || paintFormat !== "jop-2x"}
        />
      </SettingRow>

      <SettingRow
        icon={PenIcon}
        label="Signed"
        tooltip="Adds author name and title metadata to the .paint file"
      >
        <Switch
          id="setting-signed-toggle"
          checked={signed}
          onCheckedChange={() => setSigned(!signed)}
          disabled={loading}
        />
      </SettingRow>

      <SettingRow
        icon={PaperclipIcon}
        label="Embed Original"
        tooltip="Embeds the original image for round-trip editing"
      >
        <Switch
          id="setting-embed-original-toggle"
          checked={embedOriginalImage}
          onCheckedChange={() => setEmbedOriginalImage(!embedOriginalImage)}
          disabled={loading}
        />
      </SettingRow>

      <SettingRow icon={TypeIcon} label="Title" tooltip="Painting title (requires Signed toggle)">
        <Input
          id="setting-painting-title"
          maxLength={64}
          value={title}
          onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
          disabled={loading || !signed}
          placeholder="Painting title"
          className="w-36"
        />
      </SettingRow>

      <SettingRow icon={UserIcon} label="Author" tooltip="Author name (requires Signed toggle)">
        <Input
          id="setting-painting-author"
          maxLength={64}
          value={author}
          onChange={(e) => setAuthor((e.target as HTMLInputElement).value)}
          disabled={loading || !signed}
          placeholder="Author name"
          className="w-36"
        />
      </SettingRow>
    </div>
  );
}
