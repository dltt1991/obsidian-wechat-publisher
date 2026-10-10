import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(pluginDir, "main.js"), "utf8");
const start = source.indexOf("function transformCjkAdjacentStrong(");
const end = source.indexOf("\nfunction preprocessWechatMarkdown(", start);

assert.notEqual(start, -1, "missing transformCjkAdjacentStrong");
assert.notEqual(end, -1, "missing preprocessWechatMarkdown boundary");

const transformCjkAdjacentStrong = new Function(
  `return (${source.slice(start, end)});`
)();

assert.equal(
  transformCjkAdjacentStrong("- **SDO（Service Data Object，服务数据对象）**用于配置。"),
  "- <strong>SDO（Service Data Object，服务数据对象）</strong>用于配置。",
  "bold followed immediately by CJK text must not leak Markdown markers"
);

assert.equal(
  transformCjkAdjacentStrong(
    "**Heartbeat** 周期上报，**EMCY（Emergency，紧急报文）**在故障时发送，**SYNC（Synchronization，同步对象）**提供同步基准。"
  ),
  "**Heartbeat** 周期上报，<strong>EMCY（Emergency，紧急报文）</strong>在故障时发送，<strong>SYNC（Synchronization，同步对象）</strong>提供同步基准。",
  "a valid bold span must not be paired with the next opening marker"
);

assert.equal(
  transformCjkAdjacentStrong("**普通粗体**。"),
  "**普通粗体**。",
  "already valid Markdown must remain unchanged"
);

assert.equal(
  transformCjkAdjacentStrong("`**代码**后接中文`"),
  "`**代码**后接中文`",
  "inline code must not be rewritten"
);

assert.equal(
  transformCjkAdjacentStrong("```md\n**代码块**后接中文\n```"),
  "```md\n**代码块**后接中文\n```",
  "fenced code must not be rewritten"
);

assert.match(
  source,
  /function preprocessWechatMarkdown\(markdown2\)[\s\S]*?transformCjkAdjacentStrong,/,
  "the compatibility transform must run in the publish pipeline"
);

console.log("CJK-adjacent strong regression test passed");
