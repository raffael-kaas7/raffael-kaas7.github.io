// Copy this dependency-free script into your website repository. Requires Node 20+.
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

function validSet(set) {
  return set === null || (set && typeof set === "object"
    && /^\d{4}-\d{2}-\d{2}$/.test(set.performedOn)
    && Number.isFinite(set.weightKg) && set.weightKg >= 0
    && Number.isInteger(set.reps) && set.reps > 0
    && Number.isFinite(set.estimated1RMKg) && set.estimated1RMKg >= 0);
}

export async function fetchAndSaveStats({ baseUrl, token, exerciseIds, outputPath }, fetcher = fetch) {
  if (!baseUrl || !token || !exerciseIds || !outputPath) {
    throw new Error("Set LIFTLYTICS_URL, LIFTLYTICS_API_TOKEN and LIFTLYTICS_EXERCISE_IDS, and provide an output path.");
  }
  const url = new URL("/api/v1/stats/exercises", baseUrl);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) {
    throw new Error("Use an HTTPS Liftlytics URL (HTTP is allowed for localhost development).");
  }
  if (url.username || url.password) throw new Error("Provide the API token through LIFTLYTICS_API_TOKEN only.");
  const ids = [...new Set(exerciseIds.split(",").map((id) => id.trim()))];
  url.searchParams.set("exerciseIds", ids.join(","));
  const response = await fetcher(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Liftlytics returned HTTP ${response.status}; the existing snapshot was kept.`);
  const snapshot = await response.json();
  if (snapshot.weightUnit !== "kg" || snapshot.loadBasis !== "external_load"
    || !Number.isFinite(Date.parse(snapshot.generatedAt))
    || !Array.isArray(snapshot.exercises) || snapshot.exercises.length !== ids.length
    || snapshot.exercises.some((exercise, index) => exercise.exerciseId !== ids[index]
      || typeof exercise.name !== "string" || !validSet(exercise.allTimeBest)
      || (exercise.latestSession !== null && (!exercise.latestSession
        || !/^\d{4}-\d{2}-\d{2}$/.test(exercise.latestSession.performedOn)
        || !validSet(exercise.latestSession.bestSet))))) {
    throw new Error("Invalid statistics response; the existing snapshot was kept.");
  }
  await mkdir(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, JSON.stringify(snapshot, null, 2) + "\n", { flag: "wx" });
    await rename(temporaryPath, outputPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
  return snapshot;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const snapshot = await fetchAndSaveStats({
      baseUrl: process.env.LIFTLYTICS_URL || "https://liftlytics.de",
      token: process.env.LIFTLYTICS_API_TOKEN,
      exerciseIds: process.env.LIFTLYTICS_EXERCISE_IDS,
      outputPath: resolve(process.argv[2] || "assets/data/strength.json")
    });
    console.log(`Updated ${snapshot.exercises.length} exercises at ${snapshot.generatedAt}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unable to fetch statistics.");
    process.exitCode = 1;
  }
}
