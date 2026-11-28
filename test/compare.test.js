const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

test("compare.html exists", () => {
  assert.ok(fs.existsSync(path.join(root, "compare.html")));
});

test("home nav and footer link to the comparison", () => {
  const html = read("index.html");
  const nav = html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)[0];
  const footer = html.match(/<footer class="site-footer">[\s\S]*<\/footer>/)[0];
  assert.match(nav, /href="\/compare\.html"/);
  assert.match(footer, /href="\/compare\.html"/);
});

test("comparison names every product and the required rows", () => {
  const text = read("compare.html").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  for (const name of ["Spreadsheet", "Empower", "Mint", "Monarch", "YNAB", "Actual Budget", "fi-fore"]) {
    assert.ok(text.includes(name), name);
  }
  for (const row of [
    "Looks forward or back",
    "Ratio on the forecast",
    "Reconciles transactions to the plan",
    "Scenarios",
    "Bank sync",
    "Where your data lives",
    "Price",
    "Open source",
  ]) {
    assert.ok(text.includes(row), row);
  }
});

test("comparison carries a checked-on date and sources", () => {
  const html = read("compare.html");
  assert.match(html, /Checked on \d{1,2} [A-Z][a-z]+ 2026/);
  const sources = html.match(/<section[^>]*id="sources"[\s\S]*?<\/section>/)[0];
  assert.ok((sources.match(/href="https:\/\//g) || []).length >= 6);
});

test("comparison says where others win", () => {
  const text = read("compare.html").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  assert.match(text, /Where others do better/);
  assert.match(text, /end-to-end encryption/);
  assert.match(text, /mobile/i);
});

test("comparison has no logos, images or prescriptive words", () => {
  const html = read("compare.html").replace(/<!-- layout:header -->[\s\S]*?<!-- \/layout:header -->|\/\* layout:css \*\/[\s\S]*?\/\* \/layout:css \*\//g, "");
  assert.doesNotMatch(html, /<img\b|<svg\b|url\(/i);
  const text = html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");
  assert.doesNotMatch(text, /\b(should|must|best|worst|avoid|beats)\b/i);
});
