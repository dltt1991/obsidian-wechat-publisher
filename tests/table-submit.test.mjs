import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(pluginDir, "main.js"), "utf8");

function functionSource(name, nextName) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf(`\nfunction ${nextName}(`, start);
  assert.notEqual(start, -1, `missing ${name}`);
  assert.notEqual(end, -1, `missing boundary after ${name}`);
  return source.slice(start, end);
}

const appendWechatInlineStyle = new Function(
  `return (${functionSource("appendWechatInlineStyle", "optimizeWechatTables")});`
)();
const measureWechatTableText = new Function(
  "stripHtmlTags",
  `return (${functionSource("measureWechatTableText", "appendWechatInlineStyle")});`
)((value) => value.replace(/<[^>]*>/g, ""));
const optimizeWechatTables = new Function(
  "measureWechatTableText",
  "appendWechatInlineStyle",
  `return (${functionSource("optimizeWechatTables", "normalizeWechatHtml")});`
)(measureWechatTableText, appendWechatInlineStyle);
const compactWechatHtmlForSubmit = new Function(
  `return (${functionSource("compactWechatHtmlForSubmit", "countRemainingDataImages")});`
)();

const input = [
  "<table>",
  "<thead><tr><th>资源</th><th>能力</th></tr></thead>",
  "<tbody><tr><td>电池</td><td>放电</td></tr><tr><td>空调</td><td>削减负荷</td></tr></tbody>",
  "</table>"
].join("");
const output = compactWechatHtmlForSubmit(optimizeWechatTables(input));

assert.doesNotMatch(output, /<colgroup\b|<col\b/i);
assert.equal((output.match(/<(?:th|td)\b[^>]*style="[^"]*width:[\d.]+%/gi) ?? []).length, 6);
assert.match(output, /<table\b[^>]*width="100%"/i);
assert.match(output, /<table\b[^>]*style="[^"]*margin-top:0/i);
assert.doesNotMatch(output, /<table\b[^>]*>(?:(?!<th\b|<td\b)[\s\S])*?<\/table>/i);

console.log("Wechat table submission regression test passed");
