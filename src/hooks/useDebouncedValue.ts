import { useState, useEffect, useRef } from "preact/hooks";

export function useDebouncedValue<T>(value: T, delay: number): [T, (next: T) => void] {
  const [pending, setPending] = useState<T | null>(null);
  const lastSetRef = useRef<T | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = pending ?? value;

  useEffect(() => {
    const id = timeoutRef.current;
    return () => {
      if (id) clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (lastSetRef.current !== null && value !== lastSetRef.current) {
      setPending(null);
    }
  }, [value]);

  const set = (next: T) => {
    lastSetRef.current = next;
    setPending(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setPending(null);
    }, delay);
  };

  return [current, set];
}
