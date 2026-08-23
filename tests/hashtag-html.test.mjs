import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(pluginDir, "main.js"), "utf8");
const start = source.indexOf("function transformHashtags(");
const end = source.indexOf("\nfunction transformRuby(", start);
assert.notEqual(start, -1, "missing transformHashtags");
assert.notEqual(end, -1, "missing transformRuby boundary");

const transformHashtags = new Function(
  "escapeHtml",
  `return (${source.slice(start, end)});`
)((value) => value);

const caption = '<p style="text-align:center;color:#64748b;font-size:0.88em">图 1｜虚拟电厂聚合分散资源</p>';
const output = transformHashtags(`${caption}\n\n#虚拟电厂`);

assert.ok(output.startsWith(caption), "hex colors inside an HTML tag must remain unchanged");
assert.ok(
  output.endsWith('<span class="wxp-tag">#虚拟电厂</span>'),
  "normal Markdown hashtags should still be rendered"
);

console.log("HTML attribute hashtag regression test passed");
