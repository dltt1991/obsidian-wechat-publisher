import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(pluginDir, "main.js"), "utf8");

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing function ${name}`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`unterminated function ${name}`);
}

const offsetWechatEm = new Function(`return (${extractFunction("offsetWechatEm")});`)();
const buildCss = new Function(
  "resolvePalette",
  "resolveFontFamily",
  "GITHUB_HIGHLIGHT_CSS",
  "GITHUB_DARK_HIGHLIGHT_CSS",
  "offsetWechatEm",
  `return (${extractFunction("buildCss")});`
)((theme) => theme.palette, (theme) => theme.typography.fontFamily, "", "", offsetWechatEm);

const theme = {
  palette: {
    primary: "#2563eb", primarySoft: "#dbeafe", secondary: "#334155", text: "#111827",
    muted: "#64748b", border: "#cbd5e1", background: "#ffffff", codeBackground: "#f8fafc"
  },
  typography: { fontFamily: "sans-serif" },
  radius: "8px",
  cssOverrides: ""
};
const styleProfile = {
  headingTopMargin: "2.6em", headingBottomMargin: "1.15em", h1Style: "underline",
  h2Style: "solid", h3Style: "plain", h4Style: "plain", paragraphMargin: "1em 8px",
  codeTheme: "github"
};

const css = buildCss(theme, styleProfile);
const h2Rule = css.match(/\.wxp-root h2 \{([\s\S]*?)\}/)?.[1] ?? "";
const h3Rule = css.match(/\.wxp-root h3 \{([\s\S]*?)\}/)?.[1] ?? "";
assert.ok(h2Rule.includes("margin: 3.1em auto 1.35em"));
assert.ok(h3Rule.includes("margin: 2.4em 8px 1.15em"));

const buildWechatHeadingHtml = new Function(
  "offsetWechatEm",
  `return (${extractFunction("buildWechatHeadingHtml")});`
)(offsetWechatEm);
const h2Html = buildWechatHeadingHtml(2, "一、虚拟电厂为什么会出现", styleProfile);
assert.match(h2Html, /<section[^>]*style="[^"]*margin:3\.1em 8px 1\.35em[^"]*"/);
assert.match(h2Html, /<h2 style="display:inline-block;margin:0">/);

console.log("heading spacing regression test passed");
