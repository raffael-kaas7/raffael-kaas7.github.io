# Strength statistics on rkaas.de

The Health page links to `/health/strength/` within its room description. The normal blog generator builds that page from `assets/data/strength.json`, using the same header, footer and light/dark themes as the rest of the site. Statistics are embedded in the HTML, so visitors do not need JavaScript or access to Liftlytics.

Each exercise occupies one full-width table row with Exercise, Best and Latest columns. Sets display weight, reps and date:

**80 kg × 8 reps** · 27 Sept 2026

Liftlytics selects sets by the highest estimated 1RM, excludes warm-ups, and uses logged external weight only. Body weight is never added. If the latest session has only warm-ups, its date is still shown with “No working set logged”. No history is shown as “Never logged”. Before the first import, the page shows a simple empty state with no sample statistics or fabricated update date.

## One-time setup

First deploy the Liftlytics statistics API and its token-table migration. In Liftlytics, use **Account → API tokens** to create a read-only token named `rkaas.de`. It expires after one year; create a replacement and update the secret before then.

Find the exercise IDs for your exact variants (Weighted Pull-Up or your custom Pull-Up, Bench Press, Deadlift and Back Squat):

```bash
read -r -s -p 'Liftlytics token: ' LIFTLYTICS_API_TOKEN
export LIFTLYTICS_API_TOKEN
curl --fail-with-body \
  -H "Authorization: Bearer $LIFTLYTICS_API_TOKEN" \
  https://liftlytics.de/api/v1/exercises
```

The IDs are specific to your Liftlytics installation. Copy them in the order you want the exercises displayed.

In this GitHub repository, open **Settings → Secrets and variables → Actions**:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `LIFTLYTICS_API_TOKEN` | The token from Liftlytics |
| Variable | `LIFTLYTICS_EXERCISE_IDS` | Four comma-separated exercise IDs |
| Variable, optional | `LIFTLYTICS_URL` | Defaults to `https://liftlytics.de` |

Then set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The new workflow replaces branch-based publishing and runs on pushes to `master`, every Monday, Wednesday and Friday at 05:17 UTC, and manually through **Actions → Build and publish website → Run workflow**. Each scheduled run fetches the latest statistics and builds and deploys the entire website without requiring a new commit. The schedule uses the default branch, so keep `master` as the default or update the workflow if you rename it.

The workflow follows [GitHub's custom Pages workflow setup](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). It deploys an artifact directly; no bot commits or personal GitHub access token are required. Keep the `github-pages` environment allowed to deploy from `master` if branch restrictions are enabled.

Configure the token, IDs and Pages source before relying on the workflow. If the API has not been deployed, credentials are missing, or a refresh fails, the build fails before deployment and the existing live site stays in place with its previous statistics. Fix the configuration and rerun the workflow. There is no silent deployment of empty stats after a failed refresh.

## Local use

Node 22 is used in CI. No package installation or third-party dependencies are needed.

```bash
# Keep the token in your environment; never paste it into a tracked file.
export LIFTLYTICS_EXERCISE_IDS='PULL_UP_ID,BENCH_ID,DEADLIFT_ID,SQUAT_ID'
npm run stats:refresh
npm run build
```

Replace the ID placeholders with the values returned by the exercise catalog. `npm run stats:refresh` uses the exported token from the setup step and defaults to `https://liftlytics.de`.

`stats:refresh` writes `assets/data/strength.json` only after a valid complete response, using an atomic replacement. Failed requests preserve the previous local snapshot. The snapshot is ignored by git and contains only intentionally public training statistics, never the credential. The API token is only sent in an Authorization header; no token is embedded in the resulting page or deployment artifact.

`npm run build` works offline, using the latest local snapshot, or showing the empty state if none exists. Normal builds never call the API. `npm run build:pages` additionally packages public content into `_site/` for GitHub Pages, preserving `CNAME`, `.nojekyll`, existing articles, images, travel pages and other public sections. Source scripts, documentation, local credentials and previews are not deployed.

To preview locally:

```bash
npm run build:pages
python3 -m http.server 8080 --directory _site
# Open http://localhost:8080/health/strength/
```

The timestamp comes from the successful API response. Merely rebuilding the website does not make old stats look freshly updated.

## Files and checks

- `scripts/build-blog.mjs`: the Health link, stats page shell and sitemap entry.
- `scripts/strength-stats.mjs`: snapshot validation and HTML rendering.
- `scripts/fetch-liftlytics-stats.mjs`: authenticated server-side retrieval.
- `css/strength.css`: responsive table using existing theme variables.
- `.github/workflows/pages.yml`: refresh, build and deploy.
- `npm test`: rendering, empty/null cases, HTML escaping, malformed responses, build integration and snapshot failure handling.

To publish a different set of exercises, update `LIFTLYTICS_EXERCISE_IDS` and rerun the workflow. If you change the focus beyond the initial four exercises, also update the introductory text in `scripts/strength-stats.mjs`.
