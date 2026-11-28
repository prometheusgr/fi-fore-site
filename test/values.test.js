const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

const VALUES = [
  "Your data, your machine",
  "Facts, not prescriptions",
  "Honest labels",
  "The free core is the product",
  "Leaving is trivial",
  "Open by default",
  "AI serves, never decides",
  "We ask, we don't watch",
];

test("values.html exists", () => {
  assert.ok(fs.existsSync(path.join(root, "values.html")));
});

test("lists exactly the eight values, each with a proof link", () => {
  const html = read("values.html");
  const items = html.match(/<li class="value">[\s\S]*?<\/li>/g) || [];
  assert.strictEqual(items.length, 8);
  VALUES.forEach((name, i) => {
    assert.ok(items[i].replace(/&rsquo;/g, "'").includes(`<h2>${name}</h2>`), name);
    assert.match(items[i], /<a class="proof" href="[^"#][^"]*"/, `${name} proof link`);
  });
});

test("every local proof link points at a real file and anchor", () => {
  const html = read("values.html");
  for (const [, file, anchor] of html.matchAll(/class="proof" href="([^"#]+\.html)(?:#([^"]+))?"/g)) {
    assert.ok(fs.existsSync(path.join(root, file)), file);
    if (anchor) assert.match(read(file), new RegExp(`id="${anchor}"`), `${file}#${anchor}`);
  }
});

test("home nav, message-3 section and footer link to the values", () => {
  const html = read("index.html");
  assert.match(html.match(/<nav class="nav">[\s\S]*?<\/nav>/)[0], /href="values\.html"/);
  assert.match(html.match(/<footer>[\s\S]*<\/footer>/)[0], /href="values\.html"/);
  assert.match(html.match(/<section class="privacy-banner">[\s\S]*?<\/section>/)[0], /href="values\.html"/);
});

test("values page has no images, no prescriptive words, no open-source claim as fact", () => {
  const html = read("values.html");
  assert.doesNotMatch(html, /<img\b|<svg\b|url\(|<script\b/i);
  const text = html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");
  assert.doesNotMatch(text, /\b(should|must|best|worst|avoid|beats)\b/i);
  assert.match(text, /not public yet/);
});
