import fs from "node:fs";
import path from "node:path";
import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";

hljs.registerLanguage("json", json);

const LANG_MAP: Record<string, string> = {
  jsonc: "json",
};

function highlightHtml(html: string): string {
  return html.replace(
    /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
    (_, lang, code) => {
      const hljsLang = LANG_MAP[lang] ?? lang;
      const decoded = code
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&");
      try {
        const highlighted = hljs.highlight(decoded, { language: hljsLang }).value;
        return `<pre><code class="language-${lang}">${highlighted}</code></pre>`;
      } catch {
        return `<pre><code class="language-${lang}">${code}</code></pre>`;
      }
    },
  );
}

interface Plugin {
  name: string;
  enforce?: "pre" | "post";
  resolveId?(id: string): string | null | void;
  load?(id: string): string | { code: string; map: null } | null | void;
}

export function markdownHtml(): Plugin {
  const suffix = "?html";

  return {
    name: "vite-plugin-markdown-html",
    enforce: "pre",

    resolveId(id) {
      if (id.endsWith(suffix)) {
        return id;
      }
    },

    load(id) {
      if (!id.endsWith(suffix)) return;

      const filePath = id.slice(0, -suffix.length);
      const resolved = path.normalize(filePath);
      const content = fs.readFileSync(resolved, "utf-8");
      const html = micromark(content, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
      return {
        code: `export default ${JSON.stringify(highlightHtml(html))}`,
        map: null,
      };
    },
  };
}
