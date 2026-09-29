import assert from "node:assert/strict";
import { it } from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fetchAndSaveStats } from "./fetch-liftlytics-stats.mjs";

it("saves successful snapshots without credentials and preserves them on HTTP or validation failure", async () => {
  const dir = await mkdtemp(join(tmpdir(), "liftlytics-snapshot-"));
  const outputPath = join(dir, "strength.json");
  const options = { baseUrl: "https://lift.test", token: "private-secret", exerciseIds: "bench", outputPath };
  const snapshot = { generatedAt: "2026-09-28T00:00:00Z", weightUnit: "kg", loadBasis: "external_load", exercises: [{ exerciseId: "bench", name: "Bench", allTimeBest: null, latestSession: null }] };
  try {
    await writeFile(outputPath, "previous");
    await assert.rejects(fetchAndSaveStats(options, async () => new Response("unavailable", { status: 503 })), /HTTP 503/);
    assert.equal(await readFile(outputPath, "utf8"), "previous");
    await assert.rejects(fetchAndSaveStats(options, async () => Response.json({ ...snapshot, exercises: [] })), /Invalid statistics/);
    assert.equal(await readFile(outputPath, "utf8"), "previous");
    await fetchAndSaveStats(options, async (url, init) => {
      assert.equal(url.searchParams.get("exerciseIds"), "bench");
      assert.equal(init.headers.Authorization, "Bearer private-secret");
      assert.equal(init.redirect, "error");
      return Response.json(snapshot);
    });
    const saved = await readFile(outputPath, "utf8");
    assert.deepEqual(JSON.parse(saved), snapshot);
    assert.equal(saved.includes("private-secret"), false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
