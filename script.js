(() => {
  "use strict";

  // ====== CONFIG ======================================================
  // Fill these in once your Google Cloud project + Sheet exist.
  const GOOGLE_OAUTH_CLIENT_ID = "399137703553-27oui7niagtoje9m8uvipb8tj7pio0f5.apps.googleusercontent.com";
  const SPREADSHEET_ID         = "1OeQ953XA3MM48kpcmqm4XJifhwgCot_41rXukU9fC3k";
  const SCOPES = "openid email profile https://www.googleapis.com/auth/spreadsheets";
  const POLL_INTERVAL_MS = 60_000;
  const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
  const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
  // ====================================================================

  const CACHE_KEY = "laufziel.cache.v2";
  const SETTINGS_KEY = "laufziel.settings.v2";
  const QUEUE_KEY = "laufziel.queue.v2";
  const TOKEN_KEY = "laufziel.token.v2"; // sessionStorage
  const USER_KEY = "laufziel.user.v2";   // localStorage

  const I18N = {
    de: {
      ahead: "im Vorsprung",
      behind: "im Rückstand",
      onPace: "auf Kurs",
      weekReached: "Wochenziel erreicht",
      remainingPrefix: "noch",
      goalReached: "Ziel erreicht",
      kmUnderGoal: (n) => `${formatKm(n)} km unter Ziel`,
      kmOverGoal: (n) => `+${formatKm(n)} km über Ziel`,
      startsInDays: (n) => n === 1 ? "beginnt morgen" : `beginnt in ${n} Tagen`,
      startsToday: "beginnt heute",
      kw: "KW",
      kwShort: "KW",
      goalPrefix: "Ziel",
      runDeleted: "Lauf gelöscht",
      runAdded: "Eingetragen",
      goalUpdated: "Ziel aktualisiert",
      cleared: "Alle Daten gelöscht",
      confirmDelete: "Diesen Lauf löschen?",
      formErrInvalid: "Bitte eine gültige Distanz eingeben (z. B. 8,4)",
      noGoalSet: "Kein Ziel gesetzt",
      onlineSynced: "synchronisiert",
      onlineSyncing: "synchronisiere…",
      offlinePending: (n) => `offline · ${n} ausstehend`,
      offline: "offline",
      signedOut: "Abgemeldet",
      signInFailed: "Anmeldung fehlgeschlagen",
      configMissing: "OAuth-Client-ID und Spreadsheet-ID müssen in script.js gesetzt werden.",
      // static UI strings
      yearPrev: "Vorheriges Jahr",
      yearNext: "Nächstes Jahr",
      account: "Konto",
      welcomeTitle: "Willkommen",
      welcomeBody: "Melde dich mit Google an, um deine Läufe zu sehen und einzutragen.",
      signInWithGoogle: "Mit Google anmelden",
      signOut: "Abmelden",
      newRun: "Neuer Lauf",
      distanceLabel: "Distanz (km)",
      distancePlaceholder: "z. B. 8,4",
      dateLabel: "Datum",
      submitRun: "Lauf eintragen",
      thisWeek: "Diese Woche",
      yearGoal: "Jahresziel",
      history: "Verlauf",
      threeMonths: "3 Monate",
      yearTab: "Jahr",
      recentRuns: "Letzte Läufe",
      showAllN: (n) => `Alle anzeigen (${n})`,
      showFewer: "Weniger anzeigen",
      settingsTitle: "Einstellungen",
      goalForYear: "Ziel",
      goalForNextYear: "Ziel nächstes Jahr",
      notSetYet: "noch nicht gesetzt",
      languageLabel: "Sprache",
      langDe: "Deutsch",
      langEn: "English",
      exportJson: "JSON exportieren",
      deleteAria: "löschen",
    },
    en: {
      ahead: "ahead of pace",
      behind: "behind pace",
      onPace: "on pace",
      weekReached: "weekly goal reached",
      remainingPrefix: "remaining",
      goalReached: "Goal reached",
      kmUnderGoal: (n) => `${formatKm(n)} km below goal`,
      kmOverGoal: (n) => `+${formatKm(n)} km above goal`,
      startsInDays: (n) => n === 1 ? "starts tomorrow" : `starts in ${n} days`,
      startsToday: "starts today",
      kw: "Week",
      kwShort: "Wk",
      goalPrefix: "Goal",
      runDeleted: "Run deleted",
      runAdded: "Logged",
      goalUpdated: "Goal updated",
      cleared: "All data cleared",
      confirmDelete: "Delete this run?",
      formErrInvalid: "Please enter a valid distance (e.g. 8.4)",
      noGoalSet: "No goal set",
      onlineSynced: "synced",
      onlineSyncing: "syncing…",
      offlinePending: (n) => `offline · ${n} pending`,
      offline: "offline",
      signedOut: "Signed out",
      signInFailed: "Sign-in failed",
      configMissing: "OAuth client ID and spreadsheet ID must be set in script.js.",
      // static UI strings
      yearPrev: "Previous year",
      yearNext: "Next year",
      account: "Account",
      welcomeTitle: "Welcome",
      welcomeBody: "Sign in with Google to view and log your runs.",
      signInWithGoogle: "Sign in with Google",
      signOut: "Sign out",
      newRun: "New run",
      distanceLabel: "Distance (km)",
      distancePlaceholder: "e.g. 8.4",
      dateLabel: "Date",
      submitRun: "Log run",
      thisWeek: "This week",
      yearGoal: "Yearly goal",
      history: "Trend",
      threeMonths: "3 Months",
      yearTab: "Year",
      recentRuns: "Recent runs",
      showAllN: (n) => `Show all (${n})`,
      showFewer: "Show fewer",
      settingsTitle: "Settings",
      goalForYear: "Goal",
      goalForNextYear: "Goal next year",
      notSetYet: "not set yet",
      languageLabel: "Language",
      langDe: "German",
      langEn: "English",
      exportJson: "Export JSON",
      deleteAria: "delete",
    },
  };

  function applyStaticI18n() {
    const dict = I18N[state.language];
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const v = dict[key];
      if (typeof v === "string") el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const spec = el.getAttribute("data-i18n-attr"); // "attr|key,attr|key"
      for (const pair of spec.split(",")) {
        const [attr, key] = pair.split("|").map((s) => s.trim());
        const v = dict[key];
        if (attr && typeof v === "string") el.setAttribute(attr, v);
      }
    });
    document.title = "Laufziel";
    document.documentElement.lang = state.language;
  }

  // ====== utilities ====================================================
  const uuid = () =>
    (crypto.randomUUID && crypto.randomUUID()) ||
    "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);

  const todayISO = () => {
    const d = new Date();
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
  };

  const parseISO = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysInYear = (y) => (isLeap(y) ? 366 : 365);

  const dayOfYear = (date) => {
    const start = Date.UTC(date.getFullYear(), 0, 0);
    const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((today - start) / 86400000);
  };

  const isoWeeksInYear = (y) => {
    const jan1 = new Date(y, 0, 1).getDay();
    if (jan1 === 4) return 53;
    if (jan1 === 3 && isLeap(y)) return 53;
    return 52;
  };

  const isoWeek = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  };

  const isoWeekYear = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    return d.getUTCFullYear();
  };

  function formatKm(n)  { return n.toLocaleString(localeTag(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function formatKm1(n) { return n.toLocaleString(localeTag(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function formatPercent(n) { return n.toLocaleString(localeTag(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " %"; }
  function formatDateShort(iso) {
    return parseISO(iso).toLocaleDateString(localeTag(), { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  function formatDateLong(iso) {
    return parseISO(iso).toLocaleDateString(localeTag(), { day: "numeric", month: "short", year: "2-digit" });
  }
  function updateDateDisplay() {
    if (!els.dateDisplayText || !els.dateInput) return;
    const v = els.dateInput.value;
    els.dateDisplayText.textContent = v ? formatDateLong(v) : "—";
  }
  function localeTag() { return state.language === "en" ? "en-US" : "de-DE"; }

  function parseDistance(raw) {
    if (typeof raw !== "string") raw = String(raw);
    const cleaned = raw.replace(/\s|km/gi, "").replace(",", ".");
    const num = Number(cleaned);
    if (!isFinite(num) || num <= 0 || num > 500) return null;
    return Math.round(num * 100) / 100;
  }

  // ====== state ========================================================
  const defaultSettings = () => ({
    activeYear: new Date().getFullYear(),
    language: "de",
  });

  const state = {
    runs: [],          // [{ id, date, distanceKm, createdAt, source }]
    goals: {},         // { "2026": 1000 }
    activeYear: defaultSettings().activeYear,
    language: defaultSettings().language,
    fetchedAt: null,
    online: false,
    syncing: false,
  };

  function loadCacheAndSettings() {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (c) {
        state.runs = Array.isArray(c.runs) ? c.runs : [];
        state.goals = c.goals && typeof c.goals === "object" ? c.goals : {};
        state.fetchedAt = c.fetchedAt || null;
      }
    } catch (e) { console.warn("cache parse failed", e); }
    try {
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
      if (s) {
        if (typeof s.activeYear === "number") state.activeYear = s.activeYear;
        if (s.language === "de" || s.language === "en") state.language = s.language;
      }
    } catch (e) { console.warn("settings parse failed", e); }
  }

  function saveCache() {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      runs: state.runs,
      goals: state.goals,
      fetchedAt: state.fetchedAt,
    }));
  }
  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      activeYear: state.activeYear,
      language: state.language,
    }));
  }

  function activeGoal() {
    const g = state.goals[String(state.activeYear)];
    return typeof g === "number" && g > 0 ? g : null;
  }
  function runsForYear(y) {
    return state.runs.filter((r) => r.date.startsWith(String(y) + "-"));
  }
  function cumulativeUpTo(y, throughIso) {
    return runsForYear(y).filter((r) => r.date <= throughIso).reduce((s, r) => s + r.distanceKm, 0);
  }

  // ====== auth (Google Identity Services) ==============================
  const auth = (() => {
    let tokenClient = null;
    let token = null;
    let expiresAt = 0;
    let user = null; // { name, email, picture }

    function loadStoredToken() {
      try {
        const raw = sessionStorage.getItem(TOKEN_KEY);
        if (!raw) return;
        const obj = JSON.parse(raw);
        if (obj && obj.token && obj.expiresAt > Date.now() + 30_000) {
          token = obj.token;
          expiresAt = obj.expiresAt;
        }
      } catch {}
    }
    function persistToken() {
      sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token, expiresAt }));
    }
    function loadStoredUser() {
      try {
        const raw = localStorage.getItem(USER_KEY);
        if (raw) user = JSON.parse(raw);
      } catch {}
    }
    function persistUser() {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else      localStorage.removeItem(USER_KEY);
    }

    function gisReady() {
      return !!(window.google && google.accounts && google.accounts.oauth2);
    }
    function whenGisReady(timeoutMs = 4000) {
      return new Promise((resolve, reject) => {
        if (gisReady()) { resolve(); return; }
        const start = Date.now();
        const iv = setInterval(() => {
          if (gisReady()) { clearInterval(iv); resolve(); }
          else if (Date.now() - start > timeoutMs) { clearInterval(iv); reject(new Error("GIS load timeout")); }
        }, 50);
      });
    }

    function ensureClient() {
      if (tokenClient) return tokenClient;
      if (!gisReady()) return null;
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        scope: SCOPES,
        callback: () => {}, // overridden per request
      });
      return tokenClient;
    }

    function requestToken({ interactive }) {
      return new Promise((resolve, reject) => {
        const client = ensureClient();
        if (!client) { reject(new Error("GIS not loaded")); return; }
        client.callback = (resp) => {
          if (resp.error) { reject(new Error(resp.error)); return; }
          token = resp.access_token;
          expiresAt = Date.now() + (resp.expires_in - 60) * 1000;
          persistToken();
          resolve(token);
        };
        try {
          client.requestAccessToken({ prompt: interactive ? "consent" : "" });
        } catch (e) { reject(e); }
      });
    }

    async function fetchUserInfo() {
      if (!token) return null;
      try {
        const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return null;
        const data = await res.json();
        user = {
          name: data.name || data.given_name || data.email || "",
          email: data.email || "",
          picture: data.picture || "",
        };
        persistUser();
        return user;
      } catch { return null; }
    }

    return {
      init() { loadStoredToken(); loadStoredUser(); },
      hasToken: () => !!(token && expiresAt > Date.now() + 30_000),
      getToken: async () => {
        if (token && expiresAt > Date.now() + 30_000) return token;
        return await requestToken({ interactive: false });
      },
      signIn: () => requestToken({ interactive: true }),
      signOut: () => {
        if (token && gisReady()) {
          try { google.accounts.oauth2.revoke(token, () => {}); } catch {}
        }
        token = null; expiresAt = 0; user = null;
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      },
      getUser: () => user,
      ensureUser: async () => {
        if (user) return user;
        return await fetchUserInfo();
      },
      refreshUser: async () => {
        user = null;
        return await fetchUserInfo();
      },
      // Try to get a fresh access token without UI. Returns true on success.
      trySilentRefresh: async () => {
        try { await whenGisReady(); } catch { return false; }
        try {
          await requestToken({ interactive: false });
          return true;
        } catch { return false; }
      },
      whenReady: whenGisReady,
    };
  })();

  // ====== sheets API wrapper ==========================================
  const sheets = (() => {
    async function call(method, path, body) {
      const t = await auth.getToken();
      const res = await fetch(`${SHEETS_API}/${SPREADSHEET_ID}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Sheets ${method} ${path} → ${res.status}: ${text}`);
      }
      return res.status === 204 ? null : res.json();
    }

    async function getSheetMeta() {
      // Cached map of sheet titles to gid (sheet IDs needed for batchUpdate row deletes).
      if (getSheetMeta._cache) return getSheetMeta._cache;
      const data = await call("GET", `?fields=sheets.properties(sheetId,title)`);
      const map = {};
      for (const s of data.sheets || []) map[s.properties.title] = s.properties.sheetId;
      getSheetMeta._cache = map;
      return map;
    }

    async function fetchAll() {
      const data = await call(
        "GET",
        `/values:batchGet?ranges=Runs!A2:E&ranges=Goals!A2:B&majorDimension=ROWS`
      );
      const runsRows = (data.valueRanges?.[0]?.values) || [];
      const goalRows = (data.valueRanges?.[1]?.values) || [];
      const runs = runsRows
        .filter((row) => row && row[0] && row[1] && row[2])
        .map((row) => ({
          id: row[0],
          date: row[1],
          distanceKm: parseFloat(String(row[2]).replace(",", ".")) || 0,
          createdAt: row[3] || null,
          source: row[4] || "web",
        }));
      const goals = {};
      for (const row of goalRows) {
        if (!row || !row[0]) continue;
        const yr = String(row[0]).trim();
        const km = parseFloat(String(row[1] || "").replace(",", "."));
        if (yr && isFinite(km) && km > 0) goals[yr] = km;
      }
      return { runs, goals };
    }

    async function appendRun(run) {
      await call(
        "POST",
        `/values/Runs!A:E:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        { values: [[run.id, run.date, run.distanceKm, run.createdAt, run.source]] }
      );
    }

    async function deleteRunById(id) {
      const meta = await getSheetMeta();
      const sheetId = meta["Runs"];
      if (sheetId == null) throw new Error("Runs sheet not found");
      // Find the row index by reading column A (id column).
      const data = await call("GET", `/values/Runs!A:A?majorDimension=COLUMNS`);
      const col = (data.values && data.values[0]) || [];
      const idx = col.indexOf(id);
      if (idx === -1) return false; // Already gone — treat as success.
      // idx is 0-based including header (row 1 = header). The row to delete is `idx` 0-based in API terms.
      await call("POST", `:batchUpdate`, {
        requests: [{
          deleteDimension: {
            range: { sheetId, dimension: "ROWS", startIndex: idx, endIndex: idx + 1 },
          },
        }],
      });
      return true;
    }

    async function upsertGoal(year, kmGoalOrNull) {
      const meta = await getSheetMeta();
      const sheetId = meta["Goals"];
      if (sheetId == null) throw new Error("Goals sheet not found");
      const data = await call("GET", `/values/Goals!A:B`);
      const rows = (data.values && data.values.slice(1)) || [];
      const yrStr = String(year);
      const idx = rows.findIndex((r) => r && String(r[0]).trim() === yrStr);
      if (kmGoalOrNull == null || kmGoalOrNull === "" || Number(kmGoalOrNull) <= 0) {
        if (idx === -1) return;
        await call("POST", `:batchUpdate`, {
          requests: [{
            deleteDimension: {
              range: { sheetId, dimension: "ROWS", startIndex: idx + 1, endIndex: idx + 2 },
            },
          }],
        });
      } else {
        const km = Math.round(Number(kmGoalOrNull));
        if (idx === -1) {
          await call("POST", `/values/Goals!A:B:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
            { values: [[yrStr, km]] });
        } else {
          await call("PUT", `/values/Goals!A${idx + 2}:B${idx + 2}?valueInputOption=RAW`,
            { values: [[yrStr, km]] });
        }
      }
    }

    return { fetchAll, appendRun, deleteRunById, upsertGoal };
  })();

  // ====== mutation queue (offline resilience) =========================
  const queue = (() => {
    let items = [];

    function load() {
      try { items = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); }
      catch { items = []; }
    }
    function persist() { localStorage.setItem(QUEUE_KEY, JSON.stringify(items)); }
    function size() { return items.length; }

    function enqueue(op) {
      items.push({ ...op, qid: uuid(), tries: 0 });
      persist();
    }

    async function flush() {
      if (!items.length) return;
      const remaining = [];
      for (const op of items) {
        try {
          if (op.kind === "appendRun") await sheets.appendRun(op.run);
          else if (op.kind === "deleteRun") await sheets.deleteRunById(op.id);
          else if (op.kind === "upsertGoal") await sheets.upsertGoal(op.year, op.km);
        } catch (e) {
          op.tries = (op.tries || 0) + 1;
          remaining.push(op);
          console.warn("queue op failed; will retry", op, e);
        }
      }
      items = remaining;
      persist();
    }

    load();
    return { enqueue, flush, size };
  })();

  // ====== sync orchestration ==========================================
  const sync = (() => {
    let pollTimer = null;

    async function pullOnce() {
      if (!auth.hasToken()) return;
      state.syncing = true; renderStatus();
      try {
        const { runs, goals } = await sheets.fetchAll();
        state.runs = runs;
        state.goals = goals;
        state.fetchedAt = new Date().toISOString();
        state.online = true;
        saveCache();
        render();
      } catch (e) {
        state.online = false;
        console.warn("pull failed", e);
      } finally {
        state.syncing = false;
        renderStatus();
      }
    }

    async function pushQueue() {
      if (!auth.hasToken()) return;
      if (!queue.size()) { state.online = true; renderStatus(); return; }
      state.syncing = true; renderStatus();
      try {
        await queue.flush();
        state.online = true;
      } catch (e) {
        state.online = false;
      } finally {
        state.syncing = false;
        renderStatus();
      }
    }

    async function tick() {
      await pushQueue();
      await pullOnce();
    }

    function start() {
      stop();
      pollTimer = setInterval(tick, POLL_INTERVAL_MS);
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) tick();
      });
      window.addEventListener("online", tick);
    }
    function stop() { if (pollTimer) clearInterval(pollTimer); pollTimer = null; }

    return { tick, pullOnce, pushQueue, start, stop };
  })();

  // ====== DOM refs =====================================================
  const $ = (id) => document.getElementById(id);
  const els = {
    yearLabel: $("yearLabel"), yearPrev: $("yearPrev"), yearNext: $("yearNext"),
    goalChip: $("goalChip"), goalLabel: $("goalLabel"),
    signInBtn: $("signInBtn"), signInError: $("signInError"),
    kmNow: $("kmNow"), kmGoal: $("kmGoal"),
    progressBar: $("progressBar"),
    percentLabel: $("percentLabel"), remainingLabel: $("remainingLabel"),
    diffLine: $("diffLine"), diffValue: $("diffValue"), diffText: $("diffText"), diffDot: $("diffDot"),
    paceTarget: $("paceTarget"),
    heroCard: document.querySelector(".hero[data-signed-in-only]"),
    weekCard: document.querySelector(".card.week"),
    chartTitle: $("chartTitle"),
    runForm: $("runForm"), distInput: $("distInput"), dateInput: $("dateInput"),
    dateDisplayText: $("dateDisplayText"),
    formError: $("formError"),
    kwLabel: $("kwLabel"), weekKm: $("weekKm"), weekTarget: $("weekTarget"), weekBar: $("weekBar"),
    weekDiffLine: $("weekDiffLine"), weekDiffValue: $("weekDiffValue"), weekDiffText: $("weekDiffText"), weekDiffDot: $("weekDiffDot"),
    runsList: $("runsList"), showAllRuns: $("showAllRuns"),
    langSelect: $("langSelect"),
    exportBtn: $("exportBtn"),
    statusDot: $("statusDot"), statusText: $("statusText"),
    toast: $("toast"),
    // user chip + popover
    userChip: $("userChip"), userChipBtn: $("userChipBtn"),
    userChipAvatar: $("userChipAvatar"), userChipName: $("userChipName"),
    userPopover: $("userPopover"), userPopoverName: $("userPopoverName"),
    userPopoverEmail: $("userPopoverEmail"), userPopoverSignOut: $("userPopoverSignOut"),
    // chart tabs
    chartTab3m: $("chartTab3m"), chartTabYear: $("chartTabYear"),
    // empty-state hero (signed-out)
    signedOutHero: $("signedOutHero"),
    // collection of sections that should hide when signed out
    signedInOnly: Array.from(document.querySelectorAll("[data-signed-in-only]")),
  };

  // ====== toast ========================================================
  let toastTimer = null;
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, 2200);
  }

  // ====== rendering ====================================================
  let showAllRunsFlag = false;
  let chart = null;

  // diff variant: "ahead" | "behind" | "onpace"
  function setDiffVariant(line, dotEl, variant) {
    if (!line) return;
    line.classList.remove("diff--behind", "diff--onpace");
    if (variant === "behind") line.classList.add("diff--behind");
    else if (variant === "onpace") line.classList.add("diff--onpace");
    if (dotEl) {
      dotEl.textContent = variant === "behind" ? "↓" : variant === "onpace" ? "→" : "↑";
    }
  }

  function renderHeroCurrent(t, goal, todayDate) {
    const referenceISO = todayISO();
    const cum = cumulativeUpTo(state.activeYear, referenceISO);
    els.kmNow.textContent = formatKm1(cum);

    if (goal) {
      els.kmGoal.textContent = goal;
      els.goalLabel.textContent = goal;
      const pct = Math.max(0, Math.min(100, (cum / goal) * 100));
      els.progressBar.style.width = pct.toFixed(2) + "%";
      els.percentLabel.textContent = formatPercent((cum / goal) * 100);
      const remaining = Math.max(0, goal - cum);
      els.remainingLabel.textContent = `${t.remainingPrefix} ${formatKm1(remaining)} km`;

      const weeksInActive = isoWeeksInYear(state.activeYear);
      const weeklyTargetKm = goal / weeksInActive;
      const currentKw = isoWeek(todayDate);
      const targetSoFar = currentKw * weeklyTargetKm;
      const diff = Math.round((cum - targetSoFar) * 100) / 100;
      const sign = diff > 0 ? "+" : (diff < 0 ? "-" : "±");
      els.diffValue.textContent = `${sign}${formatKm(Math.abs(diff))} km`;
      const variant = diff > 0.05 ? "ahead" : diff < -0.05 ? "behind" : "onpace";
      setDiffVariant(els.diffLine, els.diffDot, variant);
      els.diffText.textContent = variant === "ahead" ? t.ahead : variant === "behind" ? t.behind : t.onPace;
      els.diffLine.hidden = false;

      // Pace tick on the bar: where the user "should be" today, as a percentage of goal.
      if (els.paceTarget) {
        const pacePct = Math.max(0, Math.min(100, (targetSoFar / goal) * 100));
        els.paceTarget.style.left = pacePct.toFixed(2) + "%";
        els.paceTarget.hidden = false;
      }

      // Stateful surface: green when the year total is ahead of the expected pace
      // (mirror of the week card's weekKm > weekTarget rule).
      if (els.heroCard) {
        els.heroCard.classList.toggle("hero--ahead", cum > targetSoFar);
      }
    } else {
      els.kmGoal.textContent = "—";
      els.goalLabel.textContent = "—";
      els.progressBar.style.width = "0%";
      els.percentLabel.textContent = "—";
      els.remainingLabel.textContent = t.noGoalSet;
      els.diffLine.hidden = true;
      setDiffVariant(els.diffLine, els.diffDot, "ahead");
      if (els.paceTarget) els.paceTarget.hidden = true;
      if (els.heroCard) els.heroCard.classList.remove("hero--ahead");
    }
  }

  function renderHeroPast(t, goal) {
    const cum = runsForYear(state.activeYear).reduce((s, r) => s + r.distanceKm, 0);
    els.kmNow.textContent = formatKm1(cum);

    if (goal) {
      els.kmGoal.textContent = goal;
      els.goalLabel.textContent = goal;
      const pct = Math.max(0, Math.min(100, (cum / goal) * 100));
      els.progressBar.style.width = pct.toFixed(2) + "%";
      els.percentLabel.textContent = formatPercent((cum / goal) * 100);
      const remaining = Math.max(0, goal - cum);
      els.remainingLabel.textContent = remaining > 0
        ? `${t.remainingPrefix} ${formatKm1(remaining)} km`
        : "";

      const delta = Math.round((cum - goal) * 100) / 100;
      if (delta >= 0) {
        setDiffVariant(els.diffLine, els.diffDot, "ahead");
        els.diffValue.textContent = `+${formatKm(delta)} km`;
        els.diffText.textContent = t.goalReached;
      } else {
        setDiffVariant(els.diffLine, els.diffDot, "behind");
        els.diffValue.textContent = `${formatKm(delta)} km`;
        els.diffText.textContent = "";
      }
      els.diffLine.hidden = false;
      if (els.paceTarget) els.paceTarget.hidden = true;

      // Stateful surface for closed years: green only if the goal was hit.
      if (els.heroCard) {
        els.heroCard.classList.toggle("hero--ahead", cum >= goal);
      }
    } else {
      els.kmGoal.textContent = "—";
      els.goalLabel.textContent = "—";
      els.progressBar.style.width = "0%";
      els.percentLabel.textContent = "—";
      els.remainingLabel.textContent = t.noGoalSet;
      els.diffLine.hidden = true;
      setDiffVariant(els.diffLine, els.diffDot, "ahead");
      if (els.paceTarget) els.paceTarget.hidden = true;
      if (els.heroCard) els.heroCard.classList.remove("hero--ahead");
    }
  }

  function renderHeroFuture(t, goal, todayDate) {
    els.kmNow.textContent = goal ? String(goal) : "—";
    els.kmGoal.textContent = goal || "—";
    els.goalLabel.textContent = goal || "—";
    els.progressBar.style.width = "0%";
    els.percentLabel.textContent = "—";
    const startDate = new Date(state.activeYear, 0, 1);
    const days = Math.max(0, Math.ceil((startDate - todayDate) / 86_400_000));
    els.remainingLabel.textContent = days === 0 ? t.startsToday : t.startsInDays(days);
    els.diffLine.hidden = true;
    setDiffVariant(els.diffLine, els.diffDot, "ahead");
    if (els.paceTarget) els.paceTarget.hidden = true;
    if (els.heroCard) els.heroCard.classList.remove("hero--ahead");
  }

  function renderWeekCurrent(t, goal, todayDate) {
    const refKw = isoWeek(todayDate);
    const refKwYear = isoWeekYear(todayDate);
    els.kwLabel.textContent = `${t.kw} ${refKw}`;
    const weekRuns = state.runs.filter((r) => {
      const d = parseISO(r.date);
      return isoWeek(d) === refKw && isoWeekYear(d) === refKwYear;
    });
    const weekKm = weekRuns.reduce((s, r) => s + r.distanceKm, 0);
    const weekTarget = goal ? goal / isoWeeksInYear(state.activeYear) : 0;
    els.weekKm.textContent = formatKm1(weekKm);
    els.weekTarget.textContent = goal ? formatKm(weekTarget) : "—";
    els.weekBar.style.width = goal
      ? Math.max(0, Math.min(100, (weekKm / weekTarget) * 100)).toFixed(2) + "%"
      : "0%";

    if (els.weekDiffLine && els.weekDiffValue && els.weekDiffText) {
      if (goal) {
        const wDiff = Math.round((weekKm - weekTarget) * 100) / 100;
        if (wDiff >= 0) {
          setDiffVariant(els.weekDiffLine, els.weekDiffDot, "ahead");
          els.weekDiffValue.textContent = `+${formatKm(wDiff)} km`;
          els.weekDiffText.textContent = t.weekReached;
        } else {
          setDiffVariant(els.weekDiffLine, els.weekDiffDot, "behind");
          els.weekDiffValue.textContent = `${formatKm(wDiff)} km`;
          els.weekDiffText.textContent = t.behind;
        }
        els.weekDiffLine.hidden = false;

        // Stateful surface: green only when the week total has actually surpassed the weekly target.
        if (els.weekCard) {
          els.weekCard.classList.toggle("card--ahead", weekKm > weekTarget);
        }
      } else {
        els.weekDiffLine.hidden = true;
        if (els.weekCard) els.weekCard.classList.remove("card--ahead");
      }
    }
  }

  function render() {
    const t = I18N[state.language];
    document.documentElement.lang = state.language;

    els.yearLabel.textContent = String(state.activeYear).slice(-2);

    const goal = activeGoal();
    const today = todayISO();
    const todayDate = parseISO(today);
    const todayYear = todayDate.getFullYear();
    const yearMode =
      state.activeYear < todayYear ? "past" :
      state.activeYear > todayYear ? "future" : "current";
    document.body.dataset.yearMode = yearMode;

    if (yearMode === "current") renderHeroCurrent(t, goal, todayDate);
    else if (yearMode === "past") renderHeroPast(t, goal);
    else renderHeroFuture(t, goal, todayDate);

    if (yearMode === "current") renderWeekCurrent(t, goal, todayDate);
    else if (els.weekCard) els.weekCard.classList.remove("card--ahead");

    if (!els.dateInput.value) els.dateInput.value = today;
    updateDateDisplay();

    if (els.langSelect.value !== state.language) els.langSelect.value = state.language;

    applyStaticI18n();
    renderRuns();
    renderChart();
    renderStatus();
  }

  const RUNS_DEFAULT_LIMIT = 5;

  function renderRuns() {
    const t = I18N[state.language];
    const yearStr = String(state.activeYear) + "-";
    const all = state.runs
      .filter((r) => r.date.startsWith(yearStr))
      .sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 :
        ((a.createdAt || "") < (b.createdAt || "") ? 1 : -1)
      );
    const visible = showAllRunsFlag ? all : all.slice(0, RUNS_DEFAULT_LIMIT);
    els.runsList.innerHTML = "";
    for (const r of visible) {
      const li = document.createElement("li");
      li.className = "run";
      const dateBlock = document.createElement("div");
      dateBlock.className = "run__date";
      const day = document.createElement("div");
      day.className = "run__day tnum";
      day.textContent = formatDateShort(r.date);
      const sub = document.createElement("div");
      sub.className = "run__kw tnum";
      sub.textContent = `${t.kw} ${isoWeek(parseISO(r.date))}`;
      dateBlock.append(day, sub);
      const km = document.createElement("div");
      km.className = "run__km tnum";
      km.innerHTML = `${formatKm(r.distanceKm)}<span>km</span>`;
      const del = document.createElement("button");
      del.className = "run__del"; del.type = "button";
      del.setAttribute("aria-label", t.deleteAria || "delete");
      del.textContent = "×";
      del.addEventListener("click", () => {
        if (confirm(t.confirmDelete)) {
          state.runs = state.runs.filter((x) => x.id !== r.id);
          saveCache();
          queue.enqueue({ kind: "deleteRun", id: r.id });
          render();
          sync.pushQueue();
          toast(t.runDeleted);
        }
      });
      li.append(dateBlock, km, del);
      els.runsList.appendChild(li);
    }
    els.showAllRuns.hidden = all.length <= RUNS_DEFAULT_LIMIT;
    els.showAllRuns.textContent = showAllRunsFlag
      ? t.showFewer
      : t.showAllN(all.length);
  }

  function renderStatus() {
    const t = I18N[state.language];
    const pending = queue.size();
    if (state.syncing) {
      els.statusDot.dataset.state = "syncing";
      els.statusText.textContent = t.onlineSyncing;
    } else if (!state.online) {
      els.statusDot.dataset.state = "offline";
      els.statusText.textContent = pending > 0 ? t.offlinePending(pending) : t.offline;
    } else if (pending > 0) {
      els.statusDot.dataset.state = "syncing";
      els.statusText.textContent = t.offlinePending(pending);
    } else {
      els.statusDot.dataset.state = "online";
      els.statusText.textContent = t.onlineSynced;
    }
  }

  let chartView = "3m"; // "3m" | "year"

  function setChartView(v) {
    chartView = v;
    if (els.chartTab3m) {
      els.chartTab3m.setAttribute("aria-pressed", String(v === "3m"));
      els.chartTab3m.classList.toggle("seg__item--on", v === "3m");
    }
    if (els.chartTabYear) {
      els.chartTabYear.setAttribute("aria-pressed", String(v === "year"));
      els.chartTabYear.classList.toggle("seg__item--on", v === "year");
    }
    renderChart();
  }

  function renderChart() {
    const goal = activeGoal();
    const dayCount = daysInYear(state.activeYear);
    const fullLabels = Array.from({ length: dayCount }, (_, i) => i + 1);

    const today = new Date();
    const sameYear = today.getFullYear() === state.activeYear;
    const todayDoy = sameYear ? dayOfYear(today) : dayCount;

    const yearRuns = runsForYear(state.activeYear)
      .map((r) => ({ doy: dayOfYear(parseISO(r.date)), km: r.distanceKm }))
      .sort((a, b) => a.doy - b.doy);

    const fullActual = new Array(dayCount).fill(null);
    let acc = 0, ri = 0;
    for (let d = 1; d <= dayCount; d++) {
      while (ri < yearRuns.length && yearRuns[ri].doy <= d) { acc += yearRuns[ri].km; ri++; }
      if (d <= todayDoy) fullActual[d - 1] = Math.round(acc * 100) / 100;
    }

    const fullTarget = goal
      ? fullLabels.map((d) => Math.round((goal * (d / dayCount)) * 100) / 100)
      : fullLabels.map(() => null);

    // Slice to active view window.
    let startDoy = 1, endDoy = dayCount;
    if (chartView === "3m") {
      const refMonth = sameYear ? today.getMonth() : 5; // mid-year fallback for non-current years
      const startDate = new Date(state.activeYear, refMonth - 1, 1);
      const endDate   = new Date(state.activeYear, refMonth + 2, 0); // last day of refMonth+1
      startDoy = Math.max(1, dayOfYear(startDate));
      endDoy   = Math.min(dayCount, dayOfYear(endDate));
    }
    const labels = fullLabels.slice(startDoy - 1, endDoy);
    const actual = fullActual.slice(startDoy - 1, endDoy);
    const target = fullTarget.slice(startDoy - 1, endDoy);

    const monthStartTicks = [];
    for (let m = 0; m < 12; m++) monthStartTicks.push(dayOfYear(new Date(state.activeYear, m, 1)));

    const ctx = document.getElementById("progressChart").getContext("2d");
    // Read colors from CSS tokens so the chart inherits the active theme.
    const css = getComputedStyle(document.documentElement);
    const tok = (name, fallback) => (css.getPropertyValue(name).trim() || fallback);
    const colLine   = tok("--chart-line",   "#FF5C42");
    const colTarget = tok("--chart-target", "rgba(244,240,232,0.40)");

    const data = {
      labels,
      datasets: [
        { label: state.language === "de" ? "Ziel" : "Target",
          data: target, borderColor: colTarget,
          borderDash: [3, 5], borderWidth: 1.5, borderCapStyle: "round",
          pointRadius: 0, tension: 0, fill: false },
        { label: state.language === "de" ? "Ist" : "Actual",
          data: actual, borderColor: colLine,
          borderWidth: 2.5, tension: 0.35, fill: false,
          pointRadius: 0, pointHoverRadius: 0 },
      ],
    };

    const monthLabels = state.language === "de"
      ? ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"]
      : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const opts = {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: tok("--surface-1", "#181B22"),
          titleColor: tok("--text", "#F4F0E8"),
          bodyColor: tok("--text", "#F4F0E8"),
          borderColor: tok("--border-strong", "rgba(244,240,232,0.16)"),
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12,
          callbacks: {
            title: (items) => {
              if (!items.length) return "";
              const doy = items[0].label;
              const d = new Date(state.activeYear, 0, Number(doy));
              return d.toLocaleDateString(localeTag(), { day: "2-digit", month: "long" });
            },
            label: (item) => item.parsed.y == null ? null : `${item.dataset.label}: ${formatKm(item.parsed.y)} km`,
          },
        },
      },
      scales: { x: { display: false }, y: { display: false } },
    };

    // Dynamic title: "Verlauf · Apr–Jun" (3M view) or "Verlauf · 2026" (year view).
    if (els.chartTitle) {
      const histLabel = (I18N[state.language] || {}).history || "Verlauf";
      let range;
      if (chartView === "3m") {
        const startMonth = parseISO(`${state.activeYear}-01-01`);
        startMonth.setMonth(0); // dummy, then use startDoy/endDoy to derive
        const startDate = new Date(state.activeYear, 0, startDoy);
        const endDate   = new Date(state.activeYear, 0, endDoy);
        const sM = monthLabels[startDate.getMonth()];
        const eM = monthLabels[endDate.getMonth()];
        range = sM === eM ? sM : `${sM}–${eM}`;
      } else {
        range = String(state.activeYear);
      }
      els.chartTitle.textContent = `${histLabel} · ${range}`;
    }

    if (chart) { chart.data = data; chart.options = opts; chart.update(); }
    else { chart = new Chart(ctx, { type: "line", data, options: opts }); }
  }

  function renderSignedInVisibility() {
    const signedIn = auth.hasToken();
    renderUserChip(signedIn);
    if (els.signedInOnly) els.signedInOnly.forEach((el) => { el.hidden = !signedIn; });
    if (els.signedOutHero) els.signedOutHero.hidden = signedIn;
  }

  function renderUserChip(signedIn) {
    if (!els.userChip) return;
    const user = auth.getUser();
    if (signedIn) {
      els.userChip.hidden = false;
      const firstName = (user && user.name) ? user.name.split(/\s+/)[0] : "";
      els.userChipName.textContent = firstName;
      if (user && user.picture) {
        els.userChipAvatar.style.backgroundImage = `url("${user.picture}")`;
        els.userChipAvatar.textContent = "";
      } else {
        els.userChipAvatar.style.backgroundImage = "";
        els.userChipAvatar.textContent = (firstName[0] || "?").toUpperCase();
      }
      if (els.userPopoverEmail) els.userPopoverEmail.textContent = (user && user.email) || "";
      if (els.userPopoverName)  els.userPopoverName.textContent  = (user && user.name)  || "";
    } else {
      els.userChip.hidden = true;
      hideUserPopover();
    }
  }

  function toggleUserPopover() {
    if (!els.userPopover) return;
    els.userPopover.hidden = !els.userPopover.hidden;
  }
  function hideUserPopover() {
    if (els.userPopover) els.userPopover.hidden = true;
  }

  // ====== mutations =====================================================
  function addRun(distanceKm, dateISO) {
    const run = {
      id: uuid(),
      date: dateISO,
      distanceKm,
      createdAt: new Date().toISOString(),
      source: "web",
    };
    state.runs.push(run);
    saveCache();
    queue.enqueue({ kind: "appendRun", run });
    return run;
  }

  function setGoal(year, kmOrNull) {
    const yrStr = String(year);
    if (kmOrNull == null || kmOrNull === "" || Number(kmOrNull) <= 0) {
      delete state.goals[yrStr];
    } else {
      state.goals[yrStr] = Math.round(Number(kmOrNull));
    }
    saveCache();
    queue.enqueue({ kind: "upsertGoal", year: yrStr, km: state.goals[yrStr] || null });
  }

  function setLanguage(lang) {
    if (!I18N[lang]) return;
    state.language = lang;
    saveSettings();
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ runs: state.runs, goals: state.goals }, null, 2)],
      { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `laufziel-backup-${todayISO()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // ====== events =======================================================
  function wire() {
    els.yearPrev.addEventListener("click", () => { state.activeYear -= 1; saveSettings(); render(); });
    els.yearNext.addEventListener("click", () => { state.activeYear += 1; saveSettings(); render(); });

    els.goalChip.addEventListener("click", () => {
      const t = I18N[state.language];
      const cur = state.goals[String(state.activeYear)] || "";
      const ans = prompt(`${t.goalPrefix} ${state.activeYear} (km):`, cur);
      if (ans === null) return;
      setGoal(state.activeYear, ans.trim());
      render();
      sync.pushQueue();
      toast(t.goalUpdated);
    });

    if (els.dateInput) {
      els.dateInput.addEventListener("change", updateDateDisplay);
      els.dateInput.addEventListener("input", updateDateDisplay);
    }

    els.runForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const t = I18N[state.language];
      els.formError.hidden = true;
      const km = parseDistance(els.distInput.value);
      if (!km) {
        els.formError.textContent = t.formErrInvalid;
        els.formError.hidden = false;
        return;
      }
      const dateISO = els.dateInput.value || todayISO();
      const yr = Number(dateISO.slice(0, 4));
      if (!state.goals[String(yr)] && yr !== state.activeYear) state.activeYear = yr;
      addRun(km, dateISO);
      els.distInput.value = "";
      els.dateInput.value = todayISO();
      updateDateDisplay();
      render();
      sync.pushQueue();
      toast(t.runAdded);
    });

    els.langSelect.addEventListener("change", () => { setLanguage(els.langSelect.value); render(); });

    els.exportBtn.addEventListener("click", exportJSON);

    function bindSignIn(btn) {
      if (!btn) return;
      btn.addEventListener("click", async () => {
        if (els.signInError) els.signInError.hidden = true;
        try {
          await auth.signIn();
          await auth.refreshUser();
          renderSignedInVisibility();
          await sync.tick();
        } catch (e) {
          if (els.signInError) {
            els.signInError.textContent = `${I18N[state.language].signInFailed}: ${e.message}`;
            els.signInError.hidden = false;
          }
        }
      });
    }
    bindSignIn(els.signInBtn);

    function doSignOut() {
      auth.signOut();
      renderSignedInVisibility();
      hideUserPopover();
      toast(I18N[state.language].signedOut);
    }
    if (els.userPopoverSignOut) els.userPopoverSignOut.addEventListener("click", doSignOut);

    if (els.userChipBtn) {
      els.userChipBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleUserPopover();
      });
      document.addEventListener("click", (e) => {
        if (!els.userPopover || els.userPopover.hidden) return;
        if (!els.userChip.contains(e.target)) hideUserPopover();
      });
    }

    if (els.chartTab3m) els.chartTab3m.addEventListener("click", () => setChartView("3m"));
    if (els.chartTabYear) els.chartTabYear.addEventListener("click", () => setChartView("year"));

    els.showAllRuns.addEventListener("click", () => { showAllRunsFlag = !showAllRunsFlag; renderRuns(); });
  }

  // ====== boot ==========================================================
  function checkConfig() {
    if (GOOGLE_OAUTH_CLIENT_ID.startsWith("REPLACE_") || SPREADSHEET_ID.startsWith("REPLACE_")) {
      const t = I18N[state.language];
      els.signInError.textContent = t.configMissing;
      els.signInError.hidden = false;
      els.signInBtn.disabled = true;
      return false;
    }
    return true;
  }

  async function boot() {
    loadCacheAndSettings();
    auth.init();
    wire();
    render();
    renderSignedInVisibility();
    if (!checkConfig()) return;
    sync.start();

    // If we have a token already (same tab session), proceed.
    // Otherwise attempt a silent refresh — works when Google still has the user's session.
    if (!auth.hasToken()) {
      try {
        const ok = await auth.trySilentRefresh();
        if (ok) {
          await auth.ensureUser();
          renderSignedInVisibility();
        }
      } catch { /* user will see sign-in prompt */ }
    } else {
      await auth.ensureUser();
      renderSignedInVisibility();
    }
    if (auth.hasToken()) {
      sync.tick();
    }
  }

  // GIS may load after our script; defer until DOM + GIS both ready.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
