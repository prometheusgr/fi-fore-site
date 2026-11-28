const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const section = (html.match(/<section\b[^>]*id="privacy"[\s\S]*?<\/section>/) || [""])[0].replace(/\s+/g, " ");

test("index has a privacy section", () => {
  assert.ok(section.length > 0);
});

test("nav links to the privacy section", () => {
  const nav = html.match(/<nav[\s\S]*?<\/nav>/)[0];
  assert.ok(nav.includes('href="/index.html#privacy"'));
});

test("two-row tier table names both tiers", () => {
  assert.strictEqual((section.match(/<tr>/g) || []).length, 3);
  assert.ok(section.includes("Desktop / self-host"));
  assert.ok(section.includes("Can't read it."));
  assert.ok(section.includes("Hosted"));
  assert.ok(section.includes("Won't read it."));
  assert.ok(section.includes("not available yet"));
});

test("answers who can read it and for how long", () => {
  assert.ok(section.includes("Who can read it"));
  assert.ok(section.includes("For how long"));
});

test("SimpleFIN line", () => {
  assert.ok(section.includes("your own token"));
  assert.ok(section.includes("you pay SimpleFIN directly"));
  assert.ok(section.includes("never sees your bank login"));
});

test("no end-to-end encryption claim on the site", () => {
  assert.doesNotMatch(html, /end-to-end/i);
});
