import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(pluginDir, "main.js"), "utf8");
const start = source.indexOf("function stripMarkdownLinkTarget(");
const end = source.indexOf("\nfunction normalizeLookupKey(", start);
assert.notEqual(start, -1, "missing stripMarkdownLinkTarget");
assert.notEqual(end, -1, "missing normalizeLookupKey boundary");

const stripMarkdownLinkTarget = new Function(
  `return (${source.slice(start, end)});`
)();

assert.equal(
  stripMarkdownLinkTarget("<folder with spaces/image.png>"),
  "folder with spaces/image.png",
  "angle-bracket image paths must preserve spaces"
);
assert.equal(
  stripMarkdownLinkTarget('folder/image.png "optional title"'),
  "folder/image.png",
  "non-angle target titles must still be stripped"
);

console.log("image path with spaces regression test passed");
