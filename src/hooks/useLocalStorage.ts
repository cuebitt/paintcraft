import { useEffect, useRef } from "preact/hooks";
import { useAppStore } from "@/app/store";
import { savePreferences } from "@/hooks/preferences";

export function useLocalStorage(theme: string, disabled?: boolean) {
  const prevRef = useRef("");

  useEffect(() => {
    if (disabled) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const unsub = useAppStore.subscribe((s) => {
      const key = `${s.quantMethod}\0${s.fitMode}\0${s.resizeFilter}\0${s.paintFormat}`;
      if (key === prevRef.current) return;
      prevRef.current = key;
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        savePreferences(
          {
            quantMethod: s.quantMethod,
            fitMode: s.fitMode,
            resizeFilter: s.resizeFilter,
            paintFormat: s.paintFormat,
          },
          theme,
        );
      }, 500);
    });

    return () => {
      unsub();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [theme, disabled]);
}
