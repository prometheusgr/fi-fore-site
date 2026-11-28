const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { apply, pages, BLOCKS, root } = require("../scripts/layout");

const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

function block(html, open, close) {
  const a = html.indexOf(open);
  const b = html.indexOf(close);
  return a < 0 || b < a ? null : html.slice(a + open.length, b);
}

test("site has a 404 page", () => {
  assert.ok(pages().includes("404.html"));
});

for (const page of pages()) {
  test(`${page} header, footer and css match the shared layout`, () => {
    const html = read(page);
    assert.strictEqual(apply(html), html, `run: node scripts/layout.js (${page} is out of date)`);
  });

  test(`${page} has exactly one header, one footer and one main nav`, () => {
    const html = read(page);
    assert.strictEqual((html.match(/<header\b/g) || []).length, 1);
    assert.strictEqual((html.match(/<footer\b/g) || []).length, 1);
    assert.strictEqual((html.match(/<nav\b/g) || []).length, 1);
  });
}

test("every page carries byte-identical header and footer", () => {
  for (const [name, open, close] of BLOCKS) {
    const bodies = pages().map((p) => block(read(p), open, close));
    assert.ok(bodies.every((b) => b !== null), `${name} marker missing`);
    assert.strictEqual(new Set(bodies).size, 1, `${name} differs between pages`);
  }
});

test("header links Privacy to the home page section from any page", () => {
  const header = block(read("download.html"), "<!-- layout:header -->", "<!-- /layout:header -->");
  assert.match(header, /href="\/index\.html#privacy"/);
  for (const href of ["/compare.html", "/values.html", "/changelog.html", "/download.html"]) {
    assert.ok(header.includes(`href="${href}"`), href);
  }
  assert.match(header, /class="site-download"/);
});

test("footer carries compare, values, ask and the no-trackers line", () => {
  const footer = block(read("values.html"), "<!-- layout:footer -->", "<!-- /layout:footer -->").replace(/\s+/g, " ");
  for (const href of ["/compare.html", "/values.html", "/ask.html"]) assert.ok(footer.includes(`href="${href}"`), href);
  assert.ok(footer.includes("This site uses no trackers, cookies or analytics."));
});

test("404 page says what happened and links home and to Download", () => {
  const html = read("404.html");
  assert.match(html, /<h1>[^<]*(not found|404)[^<]*<\/h1>/i);
  const main = html.match(/<main>[\s\S]*<\/main>/)[0];
  assert.match(main, /href="\/"/);
  assert.match(main, /href="\/download\.html"/);
  assert.doesNotMatch(html, /<script\b/i);
});
