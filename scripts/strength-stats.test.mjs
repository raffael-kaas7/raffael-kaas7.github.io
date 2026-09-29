import assert from "node:assert/strict";
import { it } from "node:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderStrengthContent, readStrengthSnapshot, validateStrengthSnapshot } from "./strength-stats.mjs";

const snapshot = {
  generatedAt: "2026-09-28T05:17:00.000Z", weightUnit: "kg", loadBasis: "external_load",
  exercises: [{
    exerciseId: "bench", name: "Bench Press",
    allTimeBest: { weightKg: 85, reps: 8, estimated1RMKg: 107.7, performedOn: "2026-09-20" },
    latestSession: { performedOn: "2026-09-27", bestSet: { weightKg: 80, reps: 8, estimated1RMKg: 101.3, performedOn: "2026-09-27" } },
  }],
};

it("renders weight, reps and distinct performance dates without displaying e1RM", () => {
  const html = renderStrengthContent(snapshot);
  assert.match(html, /85 kg × 8 reps/);
  assert.match(html, /80 kg × 8 reps/);
  assert.doesNotMatch(html, /e1RM|one-rep max|strength-explainer/);
  assert.match(html, /20 Sept 2026/);
  assert.match(html, /27 Sept 2026/);
  assert.match(html, /05:17 UTC/);
  assert.equal(html.includes("fetch("), false);
});

it("handles never-logged exercises and warmup-only latest sessions without invented numbers", () => {
  const html = renderStrengthContent({ ...snapshot, exercises: [
    { exerciseId: "pullup", name: "Pull-Up", allTimeBest: null, latestSession: null },
    { ...snapshot.exercises[0], latestSession: { performedOn: "2026-09-27", bestSet: null } },
  ] });
  assert.match(html, /Never logged/);
  assert.match(html, /No working set logged/);
  assert.match(html, /27 Sept 2026/);
  const empty = renderStrengthContent(null);
  assert.match(empty, /after the first update/);
  assert.equal(empty.includes("Stats last updated"), false);
  assert.equal(empty.includes("kg ×"), false);
});

it("escapes exercise names and refuses malformed snapshots instead of publishing bad stats", () => {
  const html = renderStrengthContent({ ...snapshot, exercises: [{ ...snapshot.exercises[0], name: '<img src=x onerror="alert(1)">' }] });
  assert.match(html, /&lt;img/);
  assert.equal(html.includes("<img"), false);
  for (const invalid of [null, {}, { ...snapshot, generatedAt: "never" }, { ...snapshot, loadBasis: "effective_load" },
    { ...snapshot, exercises: [{ ...snapshot.exercises[0], allTimeBest: { ...snapshot.exercises[0].allTimeBest, weightKg: -10 } }] },
    { ...snapshot, exercises: [{ ...snapshot.exercises[0], latestSession: { performedOn: "2026-02-31", bestSet: null } }] }]) {
    assert.throws(() => validateStrengthSnapshot(invalid), /Invalid strength/);
  }
});

it("builds the new page, health link and sitemap entry on every normal blog build", async () => {
  const dir = mkdtempSync(join(tmpdir(), "strength-blog-test-"));
  const previousDirectory = process.cwd();
  try {
    mkdirSync(join(dir, "assets/blog"), { recursive: true });
    assert.equal(readStrengthSnapshot(join(dir, "assets/data/strength.json")), null);
    process.chdir(dir);
    await import(new URL("./build-blog.mjs?empty", import.meta.url));
    assert.match(readFileSync(join(dir, "health/strength/index.html"), "utf8"), /after the first update/);
    mkdirSync(join(dir, "assets/data"));
    writeFileSync(join(dir, "assets/data/strength.json"), JSON.stringify(snapshot));
    await import(new URL("./build-blog.mjs?populated", import.meta.url));
    const html = readFileSync(join(dir, "health/strength/index.html"), "utf8");
    assert.match(html, /canonical" href="https:\/\/rkaas.de\/health\/strength\//);
    assert.match(html, /80 kg × 8 reps/);
    assert.match(readFileSync(join(dir, "health/index.html"), "utf8"), /href="\/health\/strength\/"/);
    assert.match(readFileSync(join(dir, "sitemap.xml"), "utf8"), /<loc>https:\/\/rkaas.de\/health\/strength\/<\/loc>\s+<lastmod>2026-09-28<\/lastmod>/);
  } finally { process.chdir(previousDirectory); rmSync(dir, { recursive: true, force: true }); }
});
