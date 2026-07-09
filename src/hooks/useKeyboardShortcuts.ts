import { useHotkeys } from "@mantine/hooks";
import type { HotkeyItem } from "@mantine/hooks";
import { useMemo } from "preact/hooks";

type ShortcutMap = Record<string, () => void>;

function toMantineHotkeys(shortcuts: ShortcutMap): HotkeyItem[] {
  const seen = new Set<string>();
  return Object.entries(shortcuts).flatMap(([combo, handler]) => {
    const entries: HotkeyItem[] = [];

    const normalized = combo
      .replace(/\bcmd\b/g, "mod")
      .split("+")
      .map((part) => {
        if (part === "mod" || part === "ctrl" || part === "shift" || part === "alt") return part;
        if (part.length === 1) return part.toUpperCase();
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join("+");

    if (!seen.has(normalized)) {
      seen.add(normalized);
      entries.push([normalized, handler]);
    }

    return entries;
  });
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const hotkeys = useMemo(() => toMantineHotkeys(shortcuts), [shortcuts]);
  useHotkeys(hotkeys);
}
