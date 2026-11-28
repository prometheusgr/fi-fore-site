const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const body = html.split("<!-- /layout:header -->")[1].split("<!-- layout:footer -->")[0];
const textOf = (h) => h.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/&rsquo;/g, "'").replace(/\s+/g, " ");
const hero = (body.match(/<section class="hero"[\s\S]*?<\/section>/) || [""])[0];

// fi-fore src/utils/voiceGuard.ts VOICE_BANNED_PHRASES, plus the site's own prescriptive words.
const BANNED = /(?<![\w.-])(should(n['’]t)?|try|consider(ing)?|cut(ting)?|reduce|save on|percentiles?|overspen(t|d|ding)|wasted?|splurg(e|ed|ing)|blew|guilt(y)?|irresponsible|bad|must|best|worst|avoid|beats)(?![\w-])/i;

test("hero names the weekly plan check, the ratio on the future, and free on your machine", () => {
  const text = textOf(hero);
  assert.match(text, /checked every week/i);
  assert.match(text, /50\/30\/20/);
  assert.match(text, /on the future|months ahead/i);
  assert.match(text, /your (own )?(machine|computer)/i);
  assert.match(text, /\bfree\b/i);
});

test("hero has one primary CTA to download and a secondary to the weekly check-in", () => {
  const primary = hero.match(/class="btn btn-primary"/g) || [];
  assert.strictEqual(primary.length, 1);
  assert.match(hero, /<a href="download\.html" class="btn btn-primary">/);
  assert.match(hero, /<a href="#weekly-check-in" class="btn btn-secondary">See the weekly check-in<\/a>/);
});

test("sections follow the message order: plan, ratio, your machine, then who can read it", () => {
  const order = ['id="weekly-check-in"', 'id="ratio"', 'class="privacy-banner"', 'id="privacy"'].map((m) => body.indexOf(m));
  assert.ok(order.every((i) => i > 0), `missing section: ${order}`);
  assert.deepStrictEqual([...order].sort((a, b) => a - b), order);
});

test("Days and Months are the horizons shown; Years is not a feature card", () => {
  const text = textOf(body);
  assert.match(text, /\bDays\b/);
  assert.match(text, /\bMonths?\b/);
  assert.ok((text.match(/\bYears?\b/g) || []).length <= 1, "Years mentioned at most once");
  assert.doesNotMatch(body, /class="(job|feature)-card"/);
});

test("anchors other pages link to stay", () => {
  assert.match(html, /<section\b[^>]*id="privacy"/);
  assert.match(html, /id="no-trackers"/);
});

test("home copy passes the voice guard and makes no unmeasured claims", () => {
  const text = textOf(body);
  assert.doesNotMatch(text, BANNED);
  assert.doesNotMatch(text, /\bthe only\b|forever|end-to-end|open source today|code-signed installer/i);
});

test("home body carries no screenshots or third-party images", () => {
  for (const [, src] of body.matchAll(/<img\b[^>]*src="([^"]+)"/g)) {
    assert.strictEqual(src, "fi-fore_icon_1024x1024.png");
  }
});
