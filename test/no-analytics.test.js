const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const pages = fs.readdirSync(root).filter((f) => f.endsWith(".html"));

const TRACKERS = /goatcounter|gc\.zgo\.at|google-analytics|googletagmanager|plausible|matomo|segment\.|mixpanel|hotjar|clarity\.ms|fathom/i;

function thirdPartyScripts(html) {
  const srcs = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  return srcs.filter((s) => /^(https?:)?\/\//i.test(s));
}

function thirdPartyFetches(html) {
  const urls = [...html.matchAll(/\bfetch\(\s*["'](\S+?)["']/gi)].map((m) => m[1]);
  return urls.filter((u) => /^(https?:)?\/\//i.test(u));
}

test("site has pages to scan", () => {
  assert.ok(pages.length >= 3);
});

test("guard flags a tracker script (negative control)", () => {
  const bad = '<script async src="//gc.zgo.at/count.js"></script>';
  assert.match(bad, TRACKERS);
  assert.deepStrictEqual(thirdPartyScripts(bad), ["//gc.zgo.at/count.js"]);
  assert.deepStrictEqual(thirdPartyScripts('<script src="https://cdn.example.com/a.js"></script>'), ["https://cdn.example.com/a.js"]);
  assert.deepStrictEqual(thirdPartyScripts('<script src="/local.js"></script>'), []);
  assert.deepStrictEqual(thirdPartyFetches("fetch('https://api.github.com/x')"), ["https://api.github.com/x"]);
  assert.deepStrictEqual(thirdPartyFetches("fetch('/releases/latest.json')"), []);
});

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  test(`${page} loads no analytics or third-party scripts`, () => {
    assert.doesNotMatch(html, TRACKERS);
    assert.deepStrictEqual(thirdPartyScripts(html), []);
  });
  test(`${page} fetches only same-origin`, () => {
    assert.deepStrictEqual(thirdPartyFetches(html), []);
  });
}

test("index footer says the site has no trackers", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const footer = html.match(/<footer>[\s\S]*<\/footer>/)[0].replace(/\s+/g, " ");
  assert.ok(footer.includes("This site uses no trackers, cookies or analytics."));
  assert.ok(footer.includes("Downloads are hosted on GitHub, which counts them. We don't read the count."));
  assert.ok(footer.includes("GitHub Pages keeps its own server logs."));
});
