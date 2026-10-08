import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const match = source.match(/function renderPortableMathHtml\(expression, display\) \{[\s\S]*?\n\}/);

test('math fallback converts common inline LaTeX to portable HTML', () => {
  assert.ok(match, 'renderPortableMathHtml function not found');
  const renderPortableMathHtml = vm.runInNewContext(`(${match[0]})`);
  const html = renderPortableMathHtml(String.raw`\Delta C_{input}`, false);

  assert.match(html, /wxp-math-inline/);
  assert.match(html, /ΔC<sub>input<\/sub>/);
  assert.doesNotMatch(html, /\\Delta|[{}]/);
});

test('math fallback converts fractions and subscripts in block formulas', () => {
  assert.ok(match, 'renderPortableMathHtml function not found');
  const renderPortableMathHtml = vm.runInNewContext(`(${match[0]})`);
  const html = renderPortableMathHtml(String.raw`t_{available}=\frac{d}{v}`, true);

  assert.match(html, /wxp-math-block/);
  assert.match(html, /t<sub>available<\/sub>/);
  assert.match(html, /border-top:1px solid currentColor/);
  assert.doesNotMatch(html, /\\frac|[{}]/);
});
