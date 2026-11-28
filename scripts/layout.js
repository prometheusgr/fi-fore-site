const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

const HEADER = `<header class="site-header">
    <nav class="site-nav" aria-label="Main">
      <a class="site-brand" href="/"><img src="/fi-fore_icon_1024x1024.png" alt="" width="28" height="28" />fi-fore</a>
      <ul class="site-links">
        <li><a href="/index.html#privacy">Privacy</a></li>
        <li><a href="/compare.html">Compare</a></li>
        <li><a href="/values.html">Values</a></li>
        <li><a href="/changelog.html">Changelog</a></li>
        <li><a class="site-download" href="/download.html">Download</a></li>
      </ul>
    </nav>
  </header>`;

const FOOTER = `<footer class="site-footer">
    <p>&copy; 2026 fi-fore. Your money plan for tomorrow, checked against today.</p>
    <p id="no-trackers">
      This site uses no trackers, cookies or analytics. Downloads are hosted on
      GitHub, which counts them. We don't read the count. GitHub Pages keeps
      its own server logs.
    </p>
    <p>
      <a href="/compare.html">How fi-fore compares</a> &middot;
      <a href="/values.html">What we won&rsquo;t trade</a> &middot;
      <a href="/ask.html">We don't track you, so tell us</a>
    </p>
  </footer>`;

const CSS = `.site-header { background: #fff; border-bottom: 1px solid #ddd; font-family: system-ui, sans-serif; }
    .site-nav { max-width: 1200px; margin: 0 auto; padding: 0.75rem 1rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem 1.5rem; }
    .site-brand { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 1.3rem; font-weight: 700; color: #1a1a1a; text-decoration: none; }
    .site-links { list-style: none; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1.25rem; margin: 0; padding: 0; }
    .site-links a { color: #444; text-decoration: none; font-weight: 500; }
    .site-links a:hover { color: #1565c0; text-decoration: underline; }
    .site-links a.site-download { background: #1565c0; color: #fff; padding: 0.45rem 1rem; border-radius: 6px; font-weight: 600; }
    .site-links a.site-download:hover { background: #0d47a1; color: #fff; text-decoration: none; }
    .site-footer { background: #1a1a1a; color: #ccc; text-align: center; padding: 2rem 1rem; margin-top: 3rem; font-family: system-ui, sans-serif; font-size: 0.9rem; line-height: 1.6; }
    .site-footer p { margin: 0 0 0.5rem; }
    .site-footer a { color: #fff; }`;

const BLOCKS = [
  ["header", "<!-- layout:header -->", "<!-- /layout:header -->", "  " + HEADER],
  ["footer", "<!-- layout:footer -->", "<!-- /layout:footer -->", "  " + FOOTER],
  ["css", "/* layout:css */", "/* /layout:css */", "    " + CSS],
];

function pages() {
  return fs.readdirSync(root).filter((f) => f.endsWith(".html"));
}

function apply(html) {
  let out = html;
  for (const [, open, close, body] of BLOCKS) {
    const a = out.indexOf(open);
    const b = out.indexOf(close);
    if (a < 0 || b < a) throw new Error(`missing ${open} ... ${close}`);
    out = out.slice(0, a + open.length) + "\n  " + body + "\n  " + out.slice(b);
  }
  return out;
}

if (require.main === module) {
  for (const page of pages()) {
    const file = path.join(root, page);
    const before = fs.readFileSync(file, "utf8");
    const after = apply(before);
    if (after !== before) fs.writeFileSync(file, after);
  }
}

module.exports = { apply, pages, BLOCKS, root };
