import { existsSync, readFileSync } from "node:fs";

export const STRENGTH_SNAPSHOT_PATH = "assets/data/strength.json";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

function validSet(set) {
  return set === null || (set && validDate(set.performedOn)
    && Number.isFinite(set.weightKg) && set.weightKg >= 0
    && Number.isInteger(set.reps) && set.reps > 0
    && Number.isFinite(set.estimated1RMKg) && set.estimated1RMKg >= 0);
}

export function validateStrengthSnapshot(snapshot) {
  if (!snapshot || typeof snapshot.generatedAt !== "string" || !Number.isFinite(Date.parse(snapshot.generatedAt))
    || snapshot.weightUnit !== "kg" || snapshot.loadBasis !== "external_load"
    || !Array.isArray(snapshot.exercises) || snapshot.exercises.length === 0 || snapshot.exercises.length > 20
    || snapshot.exercises.some((exercise) => !exercise || typeof exercise.exerciseId !== "string"
      || typeof exercise.name !== "string" || !validSet(exercise.allTimeBest)
      || (exercise.latestSession !== null && (!exercise.latestSession
        || !validDate(exercise.latestSession.performedOn) || !validSet(exercise.latestSession.bestSet))))
    || new Set(snapshot.exercises.map((exercise) => exercise.exerciseId)).size !== snapshot.exercises.length) {
    throw new Error("Invalid strength statistics snapshot. Keep the previous successful snapshot and refresh again.");
  }
  return snapshot;
}

export function readStrengthSnapshot(path = STRENGTH_SNAPSHOT_PATH) {
  return existsSync(path) ? validateStrengthSnapshot(JSON.parse(readFileSync(path, "utf8"))) : null;
}

function dateLabel(date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(date));
}

function time(date) {
  return `<time datetime="${escapeHtml(date)}">${escapeHtml(dateLabel(date))}</time>`;
}

function setLabel(set) {
  return set
    ? `<span class="strength-load">${escapeHtml(set.weightKg)} kg × ${escapeHtml(set.reps)} reps</span>`
    : '<span class="strength-empty-set">No working set logged</span>';
}

export function renderStrengthContent(snapshot) {
  if (snapshot) validateStrengthSnapshot(snapshot);
  const records = snapshot ? `<table class="strength-table" aria-label="Exercise records">
      <thead>
        <tr><th scope="col">Exercise</th><th scope="col">Best</th><th scope="col">Latest</th></tr>
      </thead>
      <tbody>
      ${snapshot.exercises.map((exercise) => `<tr>
        <th scope="row">${escapeHtml(exercise.name)}</th>
        <td>
          <p class="strength-set">${setLabel(exercise.allTimeBest)}</p>
          ${exercise.allTimeBest ? `<p class="strength-date">${time(exercise.allTimeBest.performedOn)}</p>` : ""}
        </td>
        <td>
          <p class="strength-set">${exercise.latestSession ? setLabel(exercise.latestSession.bestSet) : '<span class="strength-empty-set">Never logged</span>'}</p>
          ${exercise.latestSession ? `<p class="strength-date">${time(exercise.latestSession.performedOn)}</p>` : ""}
        </td>
      </tr>`).join("\n      ")}
      </tbody>
    </table>` : `<section class="strength-empty" aria-labelledby="strength-empty-title">
      <h2 id="strength-empty-title">Training stats are on their way.</h2>
      <p>My best sets and latest sessions will appear here after the first update.</p>
    </section>`;

  return `<main class="area-page-main">
    <div class="pb-container travel-shell strength-shell">
      <section class="travel-hero strength-hero">
        <h1>My strength stats</h1>
        <div class="area-page-intro">
          <p>My all-time best sets and latest sessions, logged in <a href="https://liftlytics.de/" target="_blank" rel="noopener noreferrer">Liftlytics</a>.</p>
        </div>
        ${snapshot ? `<p class="strength-updated">Stats last updated <time datetime="${escapeHtml(snapshot.generatedAt)}">${escapeHtml(dateLabel(snapshot.generatedAt))}, ${escapeHtml(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(snapshot.generatedAt)))} UTC</time></p>` : ""}
      </section>
      ${records}
    </div>
  </main>`;
}
