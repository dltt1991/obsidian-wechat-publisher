import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(pluginDir, "main.js"), "utf8");
const match = source.match(/var ARTICLE_MAX_BYTES = ([^;]+);/);

assert.ok(match, "missing ARTICLE_MAX_BYTES");
assert.equal(
  Number(match[1]),
  1_000_000,
  "article images should use WeChat's 1 MB upload limit"
);

console.log("article image size limit regression test passed");
