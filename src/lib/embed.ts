export function detectEmbedMode(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return (
    window.self !== window.top || window.location.pathname.includes("embed") || params.has("embed")
  );
}
