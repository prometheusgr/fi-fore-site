const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const textOf = (html) => html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

test("ask.html exists", () => {
  assert.ok(fs.existsSync(path.join(root, "ask.html")));
});

test("home footer links to the ask page", () => {
  const footer = read("index.html").match(/<footer>[\s\S]*<\/footer>/)[0];
  assert.match(footer, /href="ask\.html"/);
});

test("ask page says nobody is counted and a feature is built because someone asked", () => {
  const text = textOf(read("ask.html"));
  assert.match(text, /We don't track you, so tell us/);
  assert.match(text, /count(s)? nobody/i);
  assert.match(text, /someone asked/i);
  assert.match(text, /trust/i);
});

test("ask page asks by mailto only, with the in-app subject", () => {
  const html = read("ask.html");
  assert.match(html, /href="mailto:alex@fi-fore\.com\?subject=fi-fore%3A%20request%20or%20problem"/);
  assert.doesNotMatch(html, /<form\b|<script\b|<iframe\b|<img\b/i);
  assert.doesNotMatch(html, /href="https?:\/\/[^"]*issues/i);
});

test("ask page is honest about mail routing and download counts", () => {
  const text = textOf(read("ask.html"));
  assert.match(text, /Cloudflare Email Routing/);
  assert.match(text, /GitHub counts (release )?downloads/i);
  assert.match(text, /don't read the count/i);
  assert.match(text, /no (public )?(list|vote)/i);
});

test("ask page has no prescriptive words", () => {
  assert.doesNotMatch(textOf(read("ask.html")), /\b(should|must|best|worst|avoid|beats)\b/i);
});
