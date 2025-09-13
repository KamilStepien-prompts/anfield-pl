/* assets/js/matchday.js
 * Match Day — prosty licznik z auto-trybem LIVE/FT.
 * Ustaw tylko CONFIG poniżej. Reszta działa sama.
 */

// ======== CONFIG ========
const MATCH_CFG = {
  // Data i godzina rozpoczęcia MECZU w UTC (ważne: literka "Z" na końcu!)
  // Przykład: 2025-09-14 17:00 czasu polskiego = 15:00 UTC
  kickoffUTC: "2025-09-14T13:00:00Z",

  opponentLabel: "Burnley vs Liverpool",
  venue: "Turf Moor",
  competition: "Premier League",

  // Szacowany czas trwania meczu (minuty) — dla przełączenia na FT po ostatnim gwizdku
  matchDurationMin: 115, // 90 + przerwa + doliczony czas

  // Strefa do wyświetlania daty/godziny dla użytkownika
  displayTimeZone: "Europe/Warsaw",
  locale: "pl-PL",
};
// ========================

const els = {
  days: document.getElementById("md-days"),
  hours: document.getElementById("md-hours"),
  mins: document.getElementById("md-mins"),
  secs: document.getElementById("md-secs"),
  opponent: document.getElementById("matchday-opponent"),
  meta: document.getElementById("matchday-meta"),
  box: document.getElementById("matchday"),
};

const bar = document.getElementById("matchday-bar");
function setProgress(pct) {
  if (!bar) return;
  const safe = Math.max(0, Math.min(100, pct));
  bar.style.width = safe + "%";
  bar.parentElement?.setAttribute("aria-valuenow", String(Math.round(safe)));
}

function fmtDateLocal(dt) {
  return dt.toLocaleString(MATCH_CFG.locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: MATCH_CFG.displayTimeZone,
  });
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function setCountdown(d, h, m, s) {
  if (els.days) els.days.textContent = String(d);
  if (els.hours) els.hours.textContent = pad2(h);
  if (els.mins) els.mins.textContent = pad2(m);
  if (els.secs) els.secs.textContent = pad2(s);
}

function statusBadge(text) {
  const span = document.createElement("span");
  span.textContent = text;
  span.style.display = "inline-block";
  span.style.marginLeft = ".5rem";
  span.style.padding = ".1rem .5rem";
  span.style.borderRadius = "8px";
  span.style.fontSize = ".85rem";
  span.style.letterSpacing = ".02em";
  span.style.background = text === "LIVE" ? "#c62828" : "#2e7d32";
  span.style.color = "#fff";
  span.style.verticalAlign = "middle";
  return span;
}

function updateMeta() {
  if (!els.opponent || !els.meta) return;
  els.opponent.textContent = MATCH_CFG.opponentLabel;

  const ko = new Date(MATCH_CFG.kickoffUTC);
  els.meta.textContent = `${MATCH_CFG.competition} • ${
    MATCH_CFG.venue
  } • ${fmtDateLocal(ko)}`;
}

function tick() {
  const now = new Date();
  const ko = new Date(MATCH_CFG.kickoffUTC);
  const ft = new Date(ko.getTime() + MATCH_CFG.matchDurationMin * 60 * 1000);

  const untilKOms = ko - now;
  const untilFTms = ft - now;

  function tick() {
    const now = new Date();
    const ko = new Date(MATCH_CFG.kickoffUTC);
    const ft = new Date(ko.getTime() + MATCH_CFG.matchDurationMin * 60 * 1000);

    const untilKOms = ko - now;
    const untilFTms = ft - now;

    // progress: przed meczem 0→100, w trakcie 0→100 do FT
    if (untilKOms > 0) {
      // PRZED MECZEM — ile % minęło od "dziś–7d" do KO (ładna dynamika)
      const windowStart = new Date(ko.getTime() - 7 * 24 * 3600 * 1000); // 7 dni okna
      const total = ko - windowStart;
      const elapsed = now - windowStart;
      const pct = total > 0 ? (elapsed / total) * 100 : 0;
      setProgress(pct);
      // countdown
      const totalSecs = Math.floor(untilKOms / 1000);
      const days = Math.floor(totalSecs / 86400);
      const hours = Math.floor((totalSecs % 86400) / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      setCountdown(days, hours, mins, secs);
      // remove badges
      const existing = els.opponent?.querySelector(".status-badge");
      if (existing) existing.remove();
      return;
    }

    if (untilKOms <= 0 && untilFTms > 0) {
      // LIVE
      setCountdown(0, 0, 0, 0);
      const totalLive = ft - ko;
      const elapsedLive = now - ko;
      const pctLive = totalLive > 0 ? (elapsedLive / totalLive) * 100 : 0;
      setProgress(pctLive);
      if (els.opponent && !els.opponent.querySelector(".status-badge")) {
        els.opponent.appendChild(statusBadge("LIVE"));
      }
      return;
    }

    // FT
    setCountdown(0, 0, 0, 0);
    setProgress(100);
    if (els.opponent) {
      const liveBadge = els.opponent.querySelector(".status-badge");
      if (liveBadge) liveBadge.remove();
      if (!els.opponent.querySelector(".status-badge")) {
        const ftb = statusBadge("FT");
        ftb.style.background = "#2e7d32";
        els.opponent.appendChild(ftb);
      }
    }
  }

  // PRZED MECZEM — odliczanie
  if (untilKOms > 0) {
    const totalSecs = Math.floor(untilKOms / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    setCountdown(days, hours, mins, secs);

    // Usuń ewentualne badge gdy odliczamy
    const existing = els.opponent?.querySelector("span");
    if (existing) existing.remove();
    return;
  }

  // W TRAKCIE MECZU — LIVE
  if (untilKOms <= 0 && untilFTms > 0) {
    setCountdown(0, 0, 0, 0);
    if (els.opponent && !els.opponent.querySelector("span")) {
      els.opponent.appendChild(statusBadge("LIVE"));
    }
    return;
  }

  // PO MECZU — FT (full time)
  setCountdown(0, 0, 0, 0);
  if (els.opponent) {
    const liveBadge = els.opponent.querySelector("span");
    if (liveBadge) liveBadge.remove();
    if (!els.opponent.querySelector("span")) {
      els.opponent.appendChild(statusBadge("FT"));
    }
  }
}

// Inicjalizacja
updateMeta();
tick();
setInterval(tick, 1000);
