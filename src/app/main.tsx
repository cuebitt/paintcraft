import { render } from "preact";
import "./index.tailwind.css";
import App from "@/app/App";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const params = new URLSearchParams(window.location.search);
const isEmbedded =
  window.self !== window.top || window.location.pathname.includes("embed") || params.has("embed");

const embedTheme = params.get("theme") as "dark" | "light" | "system" | null;
const embedAccent = params.get("accent") ?? null;

if (import.meta.env.DEV) {
  void import("preact-devtools");
}

render(
  <ErrorBoundary>
    <ThemeProvider
      defaultTheme="dark"
      storageKey="vite-ui-theme"
      embedTheme={isEmbedded ? embedTheme : undefined}
      embedAccent={isEmbedded ? embedAccent : undefined}
      embedMode={isEmbedded}
    >
      <App />
    </ThemeProvider>
  </ErrorBoundary>,
  document.getElementById("root")!,
);
