const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "download.html"), "utf8");
const { parseNotes, renderNotes, isBreaking } = require("../assets/release-notes.js");

function fakeDoc() {
  const make = (tag) => ({
    tag, children: [], className: "", _text: "",
    set textContent(v) { this._text = v; this.children = []; },
    get textContent() { return this._text + this.children.map((c) => c.textContent).join(""); },
    appendChild(c) { this.children.push(c); return c; },
    append(...cs) { cs.forEach((c) => this.children.push(typeof c === "string" ? { textContent: c, children: [] } : c)); },
  });
  return { createElement: make };
}

test("parses subheadings, bullets, paragraphs, bold and code", () => {
  const blocks = parseNotes("Intro **bold** text.\n\n### New\n\n- **A** one `x`\n- two\n");
  assert.deepStrictEqual(blocks.map((b) => b.type), ["p", "h", "ul"]);
  assert.strictEqual(blocks[1].text, "New");
  assert.strictEqual(blocks[2].items.length, 2);
  assert.deepStrictEqual(blocks[0].inline, [
    { text: "Intro " }, { text: "bold", bold: true }, { text: " text." },
  ]);
  assert.deepStrictEqual(blocks[2].items[0].at(-1), { text: "x", code: true });
});

test("flags a Breaking section", () => {
  const blocks = parseNotes("### ⚠️ Breaking: older versions can't open your data\n\n- x");
  assert.strictEqual(isBreaking(blocks[0]), true);
  assert.strictEqual(isBreaking(parseNotes("### New")[0]), false);
});

test("renders user text as text nodes, never as markup", () => {
  const doc = fakeDoc();
  const el = renderNotes(doc, "<img src=x onerror=alert(1)> **b**\n\n- <script>x</script>");
  assert.match(el.textContent, /<img src=x onerror=alert\(1\)>/);
  assert.match(el.textContent, /<script>x<\/script>/);
  const tags = [];
  (function walk(n) { tags.push(n.tag); (n.children || []).forEach(walk); })(el);
  assert.ok(!tags.includes("img") && !tags.includes("script"));
});

test("a Breaking section renders with the breaking class", () => {
  const el = renderNotes(fakeDoc(), "### ⚠️ Breaking: x\n\n- y\n\n### New\n\n- z");
  const sections = el.children.filter((c) => c.className.includes("notes-section"));
  assert.strictEqual(sections.length, 2);
  assert.match(sections[0].className, /breaking/);
  assert.doesNotMatch(sections[1].className, /breaking/);
});

test("download page loads changelog.json same-origin and the renderer", () => {
  assert.match(html, /fetch\(\s*['"]\/releases\/changelog\.json['"]/);
  assert.match(html, /<script src="\/assets\/release-notes\.js"><\/script>/);
  assert.match(html, /id="latest-notes"/);
  assert.match(html, /id="full-changelog"/);
  const notesFetch = html.slice(html.indexOf("fetch('/releases/changelog.json')"));
  assert.doesNotMatch(notesFetch, /innerHTML|insertAdjacentHTML/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, "assets", "release-notes.js"), "utf8"), /innerHTML|insertAdjacentHTML/);
});

test("breaking sections stand out in the page CSS", () => {
  assert.match(html, /\.notes-section\.breaking\s*\{/);
});
