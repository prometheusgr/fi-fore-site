const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const pages = fs.readdirSync(root).filter((f) => f.endsWith(".html"));

const TRACKERS = /goatcounter|gc\.zgo\.at|google-analytics|googletagmanager|plausible|matomo|segment\.|mixpanel|hotjar|clarity\.ms|fathom/i;

test("site has pages to scan", () => {
  assert.ok(pages.length >= 3);
});

for (const page of pages) {
  test(`${page} loads no analytics`, () => {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    assert.doesNotMatch(html, TRACKERS);
  });
}
