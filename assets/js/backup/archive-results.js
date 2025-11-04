// archive-results.js
// Render listy meczów + ładuje logotypy z /assets/logos/<canonical-name>.svg
// Jeśli logo nie istnieje -> fallback data-uri z inicjałami

/* ---------- Matches data (example Liverpool fixtures) ----------
// You can edit this data as needed. Each match can have multiple related articles. ---------- */

const matches = [
  {
    id: "m001",
    date: "2025-08-25",
    comp: "Premier League",
    home: { name: "Newcastle United" },
    away: { name: "Liverpool" },
    score: { home: 2, away: 3 },
    articles: [
      {
        title: "Relacja: Newcastle 2-3 Liverpool — dramat w końcówce",
        url: "/felieton/2025/08/newcastle-liv-relacja.html",
      },
      {
        title: "Analiza: jak Liverpool odwrócił losy meczu",
        url: "/analizy/2025/08/taktyka-new-liv.html",
      },
    ],
  },
  {
    id: "m002",
    date: "2025-08-31",
    comp: "Premier League",
    home: { name: "Liverpool" },
    away: { name: "Arsenal" },
    score: { home: 1, away: 0 },
    articles: [
      {
        title: "Liverpool 1-0 Arsenal — Gol Szoboszlaia decyduje",
        url: "/felieton/wrzesien25/felieton-02-dominik-szoboszlai-oczekiwania/index.html",
      },
    ],
  },
  {
    id: "m003",
    date: "2025-09-14",
    comp: "Premier League",
    home: { name: "Burnley" },
    away: { name: "Liverpool" },
    score: { home: 0, away: 1 },
    articles: [
      {
        title: "Burnley 0-1 Liverpool — relacja",
        url: "/felieton/2025/09/bur-liv.html",
      },
    ],
  },
  {
    id: "m004",
    date: "2025-09-17",
    comp: "Liga Mistrzów",
    home: { name: "Liverpool" },
    away: { name: "Atletico Madrid" },
    score: { home: 3, away: 2 },
    articles: [
      {
        title: "Liverpool 3-2 Atletico — zwycięstwo w LM",
        url: "/felieton/2025/09/liv-atm.html",
      },
    ],
  },
  {
    id: "m005",
    date: "2025-09-20",
    comp: "Premier League",
    home: { name: "Liverpool" },
    away: { name: "Everton" },
    score: { home: 2, away: 1 },
    articles: [
      {
        title: "Liverpool 2-1 Everton — derby",
        url: "/felieton/2025/09/liv-eve.html",
      },
    ],
  },
  {
    id: "m006",
    date: "2025-09-23",
    comp: "EFL Cup",
    home: { name: "Liverpool" },
    away: { name: "Southampton" },
    score: { home: 2, away: 1 },
    articles: [
      {
        title: "Puchar: Liverpool 2-1 Southampton",
        url: "/felieton/2025/09/liv-sou-cup.html",
      },
    ],
  },
  {
    id: "m007",
    date: "2025-09-27",
    comp: "Premier League",
    home: { name: "Crystal Palace" },
    away: { name: "Liverpool" },
    score: { home: 2, away: 1 },
    articles: [
      {
        title: "Crystal Palace 2-1 Liverpool — omówienie",
        url: "/felieton/2025/09/crp-liv.html",
      },
    ],
  },
  {
    id: "m008",
    date: "2025-09-30",
    comp: "Liga Mistrzów",
    home: { name: "Galatasaray" },
    away: { name: "Liverpool" },
    score: { home: 1, away: 0 },
    articles: [
      {
        title: "Galatasaray 1-0 Liverpool — trudny wyjazd",
        url: "/felieton/2025/09/gal-liv.html",
      },
    ],
  },
  {
    id: "m009",
    date: "2025-10-04",
    comp: "Premier League",
    home: { name: "Chelsea" },
    away: { name: "Liverpool" },
    score: { home: 2, away: 1 },
    articles: [
      {
        title: "Chelsea 2-1 Liverpool — analiza",
        url: "/felieton/2025/10/che-liv.html",
      },
    ],
  },
  {
    id: "m010",
    date: "2025-10-19",
    comp: "Premier League",
    home: { name: "Liverpool" },
    away: { name: "Man United" },
    score: { home: 1, away: 2 },
    articles: [
      {
        title: "Liverpool 1-2 Man United — reperkusje",
        url: "/felieton/2025/10/liv-mun.html",
      },
    ],
  },
  {
    id: "m011",
    date: "2025-11-xx",
    comp: "Friendly",
    home: { name: "Eintracht Frankfurt" },
    away: { name: "Liverpool" },
    score: { home: 1, away: 5 },
    articles: [
      {
        title: "Frankfurt 1-5 Liverpool — show strzelecki",
        url: "/felieton/2025/11/frank-liv.html",
      },
    ],
  },
];

/* ---------- Helpers: canonicalize, logo URL, fallback ---------- */

function canonicalizeTeamName(name) {
  if (!name) return "";
  let s = String(name).trim();
  // normalize diacritics
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // lowercase
  s = s.toLowerCase();
  // replace ampersand with 'and'
  s = s.replace(/\s*&\s*/g, " and ");
  // remove punctuation except spaces and hyphens
  s = s.replace(/[^a-z0-9\s-]/g, "");
  // collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  // spaces -> hyphens
  s = s.replace(/\s+/g, "-");
  return s; // e.g. "manchester-united"
}

function getLogoUrl(teamName) {
  const fn = canonicalizeTeamName(teamName);
  if (!fn) return "";
  return `/assets/logos/${fn}.svg`;
}

function initialsFromName(name, maxLetters = 2) {
  if (!name) return "";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, maxLetters).toUpperCase();
  return (parts[0][0] + (parts[1] ? parts[1][0] : ""))
    .slice(0, maxLetters)
    .toUpperCase();
}
function makeInitialsSVGDataURI(initials, bg = "#444") {
  const w = 44,
    h = 44,
    r = 8;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>
    <rect width='100%' height='100%' rx='${r}' fill='${bg}'/>
    <text x='50%' y='50%' font-family='system-ui, Arial, sans-serif' font-size='14' fill='#fff' dominant-baseline='middle' text-anchor='middle'>${initials}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// optional: small fallback color map for nicer initials background (keys are canonical)
const fallbackColorMap = {
  liverpool: "#c8102e",
  "newcastle-united": "#1d1d1b",
  arsenal: "#ef0107",
  burnley: "#6c1e66",
  "atletico-madrid": "#d40000",
  everton: "#003399",
  southampton: "#d71920",
  "crystal-palace": "#1b458f",
  chelsea: "#034694",
  "man-united": "#da291c",
  "eintracht-frankfurt": "#e31b23",
  "manchester-city": "#6caefb",
  "tottenham-hotspur": "#132257",
  "brighton-and-hove-albion": "#0057b7",
  "west-ham-united": "#7a263a",
  wolves: "#ffb400",
  "nottingham-forest": "#9b1020",
  fulham: "#000000",
  bournemouth: "#be0017",
  brentford: "#e41f26",
  "luton-town": "#ff7f00",
};

function getFallbackLogo(teamName) {
  const key = canonicalizeTeamName(teamName);
  const color = fallbackColorMap[key] || "#444";
  const initials = initialsFromName(teamName, 2);
  return makeInitialsSVGDataURI(initials, color);
}
/* ---------- Preload logos ---------- */

// List of Premier League clubs (canonicalization will be applied).
// You can edit this list if your season differs.
const premierLeagueTeams = [
  "Arsenal",
  "Aston Villa",
  "Bournemouth",
  "Brentford",
  "Brighton and Hove Albion",
  "Burnley",
  "Chelsea",
  "Crystal Palace",
  "Everton",
  "Fulham",
  "Liverpool",
  "Luton Town",
  "Manchester City",
  "Manchester United",
  "Newcastle United",
  "Nottingham Forest",
  "Sheffield United",
  "Tottenham Hotspur",
  "West Ham United",
  "Wolves",
  "Leeds United",
  "Leicester City",
];

// Non-blocking preload: attempt to load each logo; if fails, nothing bad happens.
// This also warms the browser cache.
function preloadLogos(teamList) {
  if (!Array.isArray(teamList)) return;
  teamList.forEach((name) => {
    const img = new Image();
    img.src = getLogoUrl(name);
    img.onload = () => {
      /* ok */
    };
    img.onerror = () => {
      /* fallback will be used later */
    };
  });
}
// start preload (runs quickly, not required)
preloadLogos(premierLeagueTeams);

/* ---------- DOM rendering ---------- */

// helper: parse date to timestamp (safe)
function parseDateToTime(dStr) {
  if (!dStr) return 0;
  const t = Date.parse(dStr);
  if (!isNaN(t)) return t;
  // try more permissive parsing: swap dots/slashes (dd.mm.yyyy -> yyyy-mm-dd)
  // detect dd.mm.yyyy
  const m = dStr.match(/^(\d{2})[.\-\/](\d{2})[.\-\/](\d{4})$/);
  if (m) {
    return Date.parse(`${m[3]}-${m[2]}-${m[1]}`);
  }
  return 0; // fallback: unknown date -> treated as oldest
}

function createMatchNode(match) {
  const wrap = document.createElement("div");
  wrap.className = "match";
  wrap.id = match.id;

  // ROW
  const row = document.createElement("button");
  row.className = "match-row";
  row.type = "button";
  row.setAttribute("aria-expanded", "false");
  row.setAttribute("aria-controls", `${match.id}-details`);

  /* --- HOME logo (left) --- */
  const logoHome = document.createElement("div");
  logoHome.className = "logo";
  const imgHome = document.createElement("img");
  imgHome.alt = match.home.name + " logo";
  imgHome.width = 44;
  imgHome.height = 44;
  imgHome.style.display = "block";
  imgHome.style.borderRadius = "8px";

  const candidateHome = match.home.logo
    ? match.home.logo
    : getLogoUrl(match.home.name);
  imgHome.src = candidateHome;
  imgHome.onerror = function () {
    this.onerror = null;
    this.src = getFallbackLogo(match.home.name);
  };
  logoHome.appendChild(imgHome);

  /* --- teams cell: show home name + vs + away name with away logo --- */
  const teams = document.createElement("div");
  teams.className = "teams";

  // home team name block
  const home = document.createElement("div");
  home.className = "team team-home";

  // separator
  const vs = document.createElement("div");
  vs.className = "vs";
  vs.textContent = "—";

  // away team block with small logo
  const away = document.createElement("div");
  away.className = "team team-away";
  const imgAwayMini = document.createElement("img");
  imgAwayMini.alt = match.away.name + " logo";
  imgAwayMini.width = 44;
  imgAwayMini.height = 44;
  imgAwayMini.style.display = "block";
  imgAwayMini.style.borderRadius = "8px";

  const candidateAway = match.away.logo
    ? match.away.logo
    : getLogoUrl(match.away.name);
  imgAwayMini.src = candidateAway;
  imgAwayMini.onerror = function () {
    this.onerror = null;
    this.src = getFallbackLogo(match.away.name);
  };

  // away name text
  const awayNameSpan = document.createElement("span");
  awayNameSpan.className = "name";

  // append mini logo + name into away block
  away.appendChild(imgAwayMini);
  away.appendChild(awayNameSpan);

  teams.appendChild(home);
  teams.appendChild(vs);
  teams.appendChild(away);

  /* --- score cell --- */
  const scoreWrap = document.createElement("div");
  scoreWrap.className = "score";
  const badge = document.createElement("div");
  badge.className = "badge";
  const hS = Number(match.score.home || 0),
    aS = Number(match.score.away || 0);
  if (hS > aS) badge.classList.add("lose");
  else if (hS < aS) badge.classList.add("win");
  else badge.classList.add("draw");
  badge.textContent = `${hS} : ${aS}`;
  scoreWrap.appendChild(badge);

  /* --- meta --- */
  const meta = document.createElement("div");
  meta.className = "meta";
  const d = new Date(match.date);
  meta.innerHTML = `<div>${
    isNaN(d.getTime()) ? match.date : d.toLocaleDateString("pl-PL")
  }</div><div class="comp">${match.comp}</div>`;

  // append cells to row: logo / teams / score / meta
  row.appendChild(logoHome);
  row.appendChild(teams);
  row.appendChild(scoreWrap);
  row.appendChild(meta);

  /* --- details panel (unchanged) --- */
  const details = document.createElement("div");
  details.className = "match-details";
  details.id = `${match.id}-details`;
  details.setAttribute("aria-hidden", "true");
  if (match.articles && match.articles.length) {
    const ul = document.createElement("ul");
    match.articles.forEach((a) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = a.url;
      link.textContent = a.title;
      link.title = a.title;
      li.appendChild(link);
      ul.appendChild(li);
    });
    details.appendChild(ul);
  } else {
    details.textContent = "Brak powiązanych artykułów.";
  }

  row.addEventListener("click", () => {
    const isOpen = details.classList.toggle("open");
    details.setAttribute("aria-hidden", String(!isOpen));
    row.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      const sh = details.scrollHeight;
      details.style.maxHeight = sh + 24 + "px";
      // close others
      document.querySelectorAll(".match-details.open").forEach((el) => {
        if (el !== details) {
          el.classList.remove("open");
          el.style.maxHeight = "0";
          el.setAttribute("aria-hidden", "true");
          el.previousElementSibling?.setAttribute("aria-expanded", "false");
        }
      });
    } else {
      details.style.maxHeight = "0";
    }
  });

  wrap.appendChild(row);
  wrap.appendChild(details);
  return wrap;
}

// renderMatches with sorting newest -> oldest
function renderMatches() {
  const root = document.getElementById("archive-results");
  if (!root) return;
  root.innerHTML = "";

  // copy + sort by date descending
  const sorted = Array.from(matches)
    .slice()
    .sort((a, b) => {
      const ta = parseDateToTime(a.date || "");
      const tb = parseDateToTime(b.date || "");
      return tb - ta; // newest first
    });

  sorted.forEach((m) => {
    root.appendChild(createMatchNode(m));
  });
}
document.addEventListener("DOMContentLoaded", renderMatches);
