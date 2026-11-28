const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const SITE = "https://fi-fore.com";
const IMAGE = `${SITE}/fi-fore_icon_1024x1024.png`;
const pages = fs.readdirSync(root).filter((f) => f.endsWith(".html") && f !== "404.html");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const head = (f) => read(f).split("</head>")[0];
const meta = (h, attr, name) => {
  const m = h.match(new RegExp(`<meta\s+${attr}="${name}"\s+content="([^"]*)"`, "i"));
  return m && m[1];
};
const urlFor = (f) => (f === "index.html" ? `${SITE}/` : `${SITE}/${f}`);

test("site has pages to check", () => {
  assert.ok(pages.length >= 6);
});

for (const page of pages) {
  test(`${page} has description, canonical, Open Graph and Twitter tags`, () => {
    const h = head(page);
    const desc = meta(h, "name", "description");
    assert.ok(desc && desc.length >= 40 && desc.length <= 200, "description 40-200 chars");
    assert.match(h, new RegExp(`<link rel="canonical" href="${urlFor(page)}"`));
    assert.strictEqual(meta(h, "property", "og:title"), (h.match(/<title>([^<]*)<\/title>/) || [])[1]);
    assert.strictEqual(meta(h, "property", "og:description"), desc);
    assert.strictEqual(meta(h, "property", "og:url"), urlFor(page));
    assert.strictEqual(meta(h, "property", "og:image"), IMAGE);
    assert.strictEqual(meta(h, "property", "og:type"), "website");
    assert.strictEqual(meta(h, "name", "twitter:card"), "summary");
  });
}

test("descriptions and canonicals are unique", () => {
  const descs = pages.map((p) => meta(head(p), "name", "description"));
  assert.strictEqual(new Set(descs).size, pages.length);
  const urls = pages.map(urlFor);
  assert.strictEqual(new Set(urls).size, pages.length);
});

test("social image is a file in the repo", () => {
  assert.ok(fs.existsSync(path.join(root, "fi-fore_icon_1024x1024.png")));
});

test("sitemap.xml lists every page except 404", () => {
  const xml = read("sitemap.xml");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  assert.deepStrictEqual(locs, pages.map(urlFor).sort());
});

test("robots.txt allows crawling and points at the sitemap", () => {
  const txt = read("robots.txt");
  assert.match(txt, /^User-agent: \*$/m);
  assert.match(txt, new RegExp(`^Sitemap: ${SITE}/sitemap.xml$`, "m"));
  assert.doesNotMatch(txt, /^Disallow: \/\s*$/m);
});

test("404 stays out of search results", () => {
  assert.match(head("404.html"), /name="robots" content="noindex"/);
});
