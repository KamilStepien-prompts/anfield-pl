/* assets/js/matchday.js
 * MatchDay: dane z /data/matches.json + countdown + progres + LIVE/FT
 */
(function () {
  // ---- helpers / DOM ----
  const $ = (s) => document.querySelector(s);
  const el = {
    type: $("#matchday-type"),
    badge: $("#matchday-badge"),
    opp: $("#matchday-opponent"),
    meta: $("#matchday-meta"),
    d: $("#md-days"),
    h: $("#md-hours"),
    m: $("#md-mins"),
    s: $("#md-secs"),
    bar: $("#matchday-bar"),
    progress: $(".matchday__progress"),
  };
  if (
    !el.type ||
    !el.badge ||
    !el.opp ||
    !el.meta ||
    !el.d ||
    !el.h ||
    !el.m ||
    !el.s ||
    !el.bar
  )
    return;

  // Ustaw aria dla paska
  if (el.progress) {
    el.progress.setAttribute("role", "progressbar");
    el.progress.setAttribute("aria-valuemin", "0");
    el.progress.setAttribute("aria-valuemax", "100");
    el.progress.setAttribute("aria-valuenow", "100");
  }

  const LOCALE = "pl-PL";
  const TZONE = "Europe/Warsaw";
  const MATCH_DURATION_MIN = 115; // 90 + przerwy + doliczony

  const dni = ["niedz.", "pon.", "wt.", "śr.", "czw.", "pt.", "sob."];
  const mies = [
    "sty",
    "lut",
    "mar",
    "kwi",
    "maj",
    "cze",
    "lip",
    "sie",
    "wrz",
    "paź",
    "lis",
    "gru",
  ];

  const pad2 = (n) => String(n).padStart(2, "0");

  const fmtDateShort = (iso) => {
    const d = new Date(iso);
    const dz = dni[d.getDay()];
    const dd = pad2(d.getDate());
    const mm = mies[d.getMonth()];
    const hh = pad2(d.getHours());
    const mi = pad2(d.getMinutes());
    return `${dz}, ${dd} ${mm} • ${hh}:${mi}`;
  };

  const setProgress = (pct) => {
    const safe = Math.max(0, Math.min(100, pct));
    el.bar.style.width = safe.toFixed(3) + "%";
    if (el.progress)
      el.progress.setAttribute("aria-valuenow", String(Math.round(safe)));
  };

  const clearStatusBadges = () => {
    el.opp.querySelectorAll(".status-badge").forEach((n) => n.remove());
  };

  const addStatusBadge = (txt, bg) => {
    const span = document.createElement("span");
    span.className = "status-badge";
    span.textContent = txt;
    span.style.display = "inline-block";
    span.style.marginLeft = ".5rem";
    span.style.padding = ".1rem .5rem";
    span.style.borderRadius = "8px";
    span.style.fontSize = ".85rem";
    span.style.letterSpacing = ".02em";
    span.style.background = bg;
    span.style.color = "#fff";
    span.style.verticalAlign = "middle";
    el.opp.appendChild(span);
  };

  // ---- render + timers ----
  const applyMatch = (m) => {
    // label ligi
    el.type.textContent = m.competition || "";

    // kto vs kto (home decyduje o kolejności)
    const title = m.home
      ? `Liverpool vs ${m.opponent}`
      : `${m.opponent} vs Liverpool`;
    el.opp.textContent = title;

    // stadion (fallback: Anfield przy home true)
    const place = m.stadium || (m.home ? "Anfield" : "Wyjazd");
    el.badge.textContent = `Najbliższe starcie - ${place}`;

    // meta: liga • stadion • data (PL)
    el.meta.textContent = `${m.competition} • ${place} • ${fmtDateShort(
      m.date
    )}`;

    // timery
    startTimers(new Date(m.date));
  };

  const startTimers = (ko) => {
    const ft = new Date(ko.getTime() + MATCH_DURATION_MIN * 60 * 1000);

    // Pasek ma się ZWĘŻAĆ do 0 dokładnie o KO — liczymy od momentu załadowania.
    const startTs = Date.now();
    const untilKO0 = Math.max(ko.getTime() - startTs, 1);

    const tick = () => {
      const now = new Date();
      const toKO = ko - now;
      const toFT = ft - now;

      // COUNTDOWN do KO
      const left = Math.max(toKO, 0);
      const totalSecs = Math.floor(left / 1000);
      const days = Math.floor(totalSecs / 86400);
      const hours = Math.floor((totalSecs % 86400) / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      el.d.textContent = String(days);
      el.h.textContent = pad2(hours);
      el.m.textContent = pad2(mins);
      el.s.textContent = pad2(secs);

      clearStatusBadges();

      if (toKO > 0) {
        // PRZED MECZEM — bar 100% -> 0% liniowo do KO
        const elapsed = Date.now() - startTs;
        const pct = 100 - (elapsed / untilKO0) * 100;
        setProgress(pct);
        return;
      }

      if (toKO <= 0 && toFT > 0) {
        // W TRAKCIE MECZU — LIVE, bar 0% -> 100% do FT
        setProgress(
          ((ft - now) / (ft - ko)) * 0 + ((now - ko) / (ft - ko)) * 100
        ); // 0→100
        addStatusBadge("LIVE", "#c62828");
        return;
      }

      // PO MECZU — FT
      setProgress(100);
      addStatusBadge("FT", "#2e7d32");
      clearInterval(tmr);
    };

    tick();
    const tmr = setInterval(tick, 1000);
  };

  // ---- choose upcoming ----
  const pickUpcoming = (arr) => {
    const now = Date.now();
    return arr
      .map((x) => ({ ...x, ts: new Date(x.date).getTime() }))
      .filter((x) => x.ts > now)
      .sort((a, b) => a.ts - b.ts)[0];
  };

  // ---- fetch data ----
  fetch("/data/matches.json", { cache: "no-store" })
    .then((r) => r.json())
    .then((list) => {
      if (!Array.isArray(list) || list.length === 0) return;
      const m = pickUpcoming(list);
      if (m) applyMatch(m);
    })
    .catch(() => {
      /* fallback: zostaw statyczny HTML */
    });
})();
