const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "download.html"), "utf8");

test("has a How to verify section with both OS hash commands", () => {
  assert.match(html, /<h2[^>]*>How to verify<\/h2>/);
  assert.match(html, /Get-FileHash -Algorithm SHA256/);
  assert.match(html, /shasum -a 256/);
});

test("links the release SHA256SUMS and its Sigstore bundle by tag", () => {
  assert.match(html, /SHA256SUMS\.sigstore\.json/);
  assert.match(html, /release\.tag/);
  assert.match(html, /cosign verify-blob/);
});

test("shows an installer's SHA-256 only when the manifest carries one, never a hardcoded hash", () => {
  assert.match(html, /asset\.sha256/);
  assert.doesNotMatch(html, /\b[0-9a-f]{64}\b/);
});

test("says honestly that the installers are not code signed, with no bypass walkthrough", () => {
  assert.match(html, /id="unsigned-note"/);
  assert.match(html, /SmartScreen/);
  assert.match(html, /Gatekeeper/);
  assert.match(html, /not code-signed/);
  assert.doesNotMatch(html, /Run anyway|xattr|right-click/i);
});
