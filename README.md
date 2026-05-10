# Laufziel_26

Mobile-first responsive web app to log runs and track yearly progress against a km goal. Data lives in a Google Sheet that the app reads and writes directly via the Sheets API.

## Live URL

`https://benvonlinde.github.io/laufziel/`

(Goes live once GitHub Pages is enabled on the repo.)

## First-time setup

Three one-time steps wire the app to your Google account.

### 1. Google Sheet

Create a new Google Sheet named **Laufziel** with two tabs:

- Tab `Runs`, header row: `id | date | distanceKm | createdAt | source`
- Tab `Goals`, header row: `year | kmGoal`. Add a row: `2026 | 1000`.

Copy the spreadsheet ID from the URL (the long string between `/d/` and `/edit`).

### 2. Google Cloud OAuth

At https://console.cloud.google.com:

- Create a project named "Laufziel"
- APIs & Services → Library → enable **Google Sheets API**
- OAuth consent screen → External, app name "Laufziel", add yourself as **Test user**
- Add scopes: `openid`, `…/auth/userinfo.email`, `…/auth/userinfo.profile`, `…/auth/spreadsheets`
- Credentials → Create OAuth client ID → Web application
- Authorized JavaScript origins: `https://<github-username>.github.io`
- Copy the Client ID

### 3. Plug in the IDs

Edit [`script.js`](script.js) and replace the two placeholders at the top:

```js
const GOOGLE_OAUTH_CLIENT_ID = "your-client-id.apps.googleusercontent.com";
const SPREADSHEET_ID         = "your-spreadsheet-id";
```

### 4. Push to GitHub Pages

```sh
git init
git remote add origin git@github.com:<github-username>/laufziel.git
git add . && git commit -m "Initial Laufziel"
git push -u origin main
```

In the GitHub repo: Settings → Pages → Source: branch `main`, folder `/ (root)`.

## On iPhone

1. Open the GitHub Pages URL in Safari.
2. Tap **Mit Google anmelden**, complete consent.
3. Share → Add to Home Screen for one-tap access.

## Architecture

- Vanilla HTML + CSS + ES6 module-style IIFE in `script.js`. No build.
- Google Identity Services (GIS) for OAuth, scope `…/auth/spreadsheets`.
- Google Sheets API v4 for reads/writes, called directly with `fetch` + Bearer token.
- localStorage cache (`laufziel.cache.v2`) for offline-first paint.
- Mutation queue (`laufziel.queue.v2`) for offline writes that retry on next online tick.
- Pull from Sheets every 60 s while tab is visible; push queue on every mutation and on tab focus.

## One-time historical import

If you have the seed file `data/seed.json` from the v1 prototype, sign in to the deployed app and paste this in the browser DevTools console once:

```js
const seed = await (await fetch("data/seed.json")).json();
for (const r of seed) {
  await window.__laufzielDebug?.appendRun?.({
    id: crypto.randomUUID(),
    date: r.date,
    distanceKm: r.distanceKm,
    createdAt: new Date().toISOString(),
    source: "seed",
  });
}
```

(A small `window.__laufzielDebug` shim can be added before import.)

After verifying the runs appear in the sheet, delete `data/` and `scripts/` from the repo.

## Files

```
index.html       Layout, GIS script tag, sign-in section
styles.css       Theme + responsive layout + status indicator
script.js        Auth / Sheets / cache / sync / render / events
data/seed.json   Historical export (delete after one-time import)
scripts/         Old Numbers dumper (delete after import)
```
