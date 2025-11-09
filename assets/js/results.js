/* Anfield.PL – Wyniki (mobile-first)
 * Render listy meczów z JSON + filtry + paginacja (najnowsze -> najstarsze)
 */

(() => {
  // -----------------------------
  // Config & DOM
  // -----------------------------
  const cfg = Object.assign(
    { season: "2025-26", perPage: 5 },
    window.ANFLD_RESULTS || {}
  );

  // --- state ---
  const state = {
    season: cfg.season,
    all: [],
    view: [],
    page: 1,
    perPage: cfg.perPage,
    filters: {
      comp: "all",
      result: "all",
      q: "",
    },
  };

  // --- els ---
  const $list = document.getElementById("results-list");
  const $season = document.getElementById("season-select");
  const $seasonLabel = document.getElementById("season-label");
  const $chipsComp = document.querySelectorAll(".chips [data-comp]");
  const $chipsRes = document.querySelectorAll(".chips [data-result]");
  const $search = document.getElementById("search-input");
  const $more = document.getElementById("load-more");

  // ------- utils -------
  const qs = new URLSearchParams(location.search);
  function setQS(params) {
    const url = new URL(location.href);
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "" || v === "all")
        url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    });
    history.replaceState(null, "", url);
  }

  function parseDateTime(d, t) {
    // ex: "2024-12-26", "16:00" -> Date
    const [hh = "00", mm = "00"] = (t || "00:00").split(":");
    return new Date(`${d}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00`);
  }

  function isLFCHome(m) {
    return (m.home?.name || "").toLowerCase().includes("liverpool");
  }

  function computeResult(m) {
    if (m.status && m.status.toLowerCase() === "upcoming") return "upcoming";
    const hs = Number(m.home?.score ?? NaN);
    const as = Number(m.away?.score ?? NaN);
    if (Number.isNaN(hs) || Number.isNaN(as)) return "unknown";

    const weHome = isLFCHome(m);
    const lfc = weHome ? hs : as;
    const opp = weHome ? as : hs;
    if (lfc > opp) return "win";
    if (lfc < opp) return "lose";
    return "draw";
  }

  function normalize(matches) {
    return matches
      .map((m) => {
        const dt = parseDateTime(m.date, m.kickoff);
        const res = m.result || computeResult(m);
        const weHome = isLFCHome(m);
        const opponent = weHome ? m.away?.name : m.home?.name;
        const lfcScore = weHome ? m.home?.score : m.away?.score;
        const oppScore = weHome ? m.away?.score : m.home?.score;
        return Object.assign({}, m, {
          _dt: dt,
          _res: res,
          _weHome: weHome,
          _opponent: opponent,
          _lfcScore: lfcScore,
          _oppScore: oppScore,
        });
      })
      .sort((a, b) => b._dt - a._dt); // DESC (najnowsze -> najstarsze)
  }

  function badgeClass(res) {
    if (res === "win") return "win";
    if (res === "lose") return "lose";
    if (res === "draw") return "draw";
    return ""; // upcoming/unknown bez koloru
  }

  function fmtDate(d) {
    // pl-PL, krótko (np. 26 gru 2024, 16:00)
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(d)
      .replace(".", "");
  }
  function fmtWeekdayPL(d) {
    const s = new Intl.DateTimeFormat("pl-PL", { weekday: "long" }).format(d);
    return s.charAt(0).toUpperCase() + s.slice(1); // „Wtorek”
  }
  function abbrWeekdayPL(full) {
    // Wtorek -> Wt, Niedziela -> Nd, Środa -> Śr
    const map = {
      Poniedziałek: "Pn",
      Wtorek: "Wt",
      Środa: "Śr",
      Czwartek: "Cz",
      Piątek: "Pt",
      Sobota: "Sb",
      Niedziela: "Nd",
    };
    return map[full] || full.slice(0, 2);
  }

  // ------- render -------
  // DODAJ u góry pliku:
  const COMP_ABBR = {
    "Premier League": "PL",
    "Liga Mistrzów": "CL",
    "EFL Cup": "EFL",
    "FA Cup": "FA",
  };
  function shortRound(comp, roundText = "") {
    // wyciągnij numer kolejki
    const m = /(\d+)/.exec(roundText || "");
    const n = m ? m[1] : "";
    if (comp === "Premier League") return n ? `GW ${n}` : "";
    if (/Liga Mistrzów/i.test(comp)) return n ? `MD ${n}` : roundText; // Matchday
    return n ? `R${n}` : roundText; // Runda 3 itd.
  }
  function fmtDateShort(d) {
    // 04.10.25
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}.${mm}.${yy}`;
  }

  function renderOne(m) {
    const resClass =
      m._res && ["win", "lose", "draw", "upcoming"].includes(m._res)
        ? m._res
        : "unknown";

    const home = m.home || {};
    const away = m.away || {};

    const homeName = home.name || "";
    const homeShort = home.short || homeName;
    const awayName = away.name || "";
    const awayShort = away.short || awayName;

    const metaComp = [m.competition, m.round].filter(Boolean).join(" • ");
    const dateTxt = `${fmtDate(m._dt)}${m.kickoff ? `, ${m.kickoff}` : ""}`;
    // W renderOne(), po metaComp i dateTxt:
    const compShort = COMP_ABBR[m.competition] || m.competition;
    const roundShort = shortRound(m.competition, m.round);
    const dateShort = `${fmtDateShort(m._dt)}${
      m.kickoff ? `, ${m.kickoff}` : ""
    }`;
    const dayFull = m.day || fmtWeekdayPL(m._dt);
    const dayShort = abbrWeekdayPL(dayFull);

    // pełne i skrócone wersje (z dniem)
    const metaFull = [m.competition, m.round, `${dayFull}, ${dateTxt}`]
      .filter(Boolean)
      .join(" • ");
    const metaCompact = [
      COMP_ABBR[m.competition] || m.competition,
      shortRound(m.competition, m.round),
      `${dayShort} • ${fmtDateShort(m._dt)}${
        m.kickoff ? `, ${m.kickoff}` : ""
      }`,
    ]
      .filter(Boolean)
      .join(" • ");

    const detailsId = `details-${m.id}`;

    const stdLinks = `

    
    ${
      m.links?.preview
        ? `<a class="pill" href="${m.links.preview}">Zapowiedź</a>`
        : ""
    }
    ${
      m.links?.report
        ? `<a class="pill" href="${m.links.report}">Relacja</a>`
        : ""
    }
  `;

    const articles = Array.isArray(m.articles) ? m.articles : [];
    const articlesBlock = articles.length
      ? `
    <div class="articles">
      <div class="articles-head">Powiązane artykuły (${articles.length})</div>
      <ul class="articles-list">
        ${articles
          .map(
            (a) => `
          <li>
            <a href="${a.url}">
              <span class="type">${a.type || "artykuł"}</span>
              <span class="title">${a.title || a.url}</span>
            </a>
          </li>`
          )
          .join("")}
      </ul>
    </div>`
      : "";

    const notes = m.notes ? `<p class="notes">${m.notes}</p>` : "";
    const venue = m.venue ? `<p class="venue">Stadion: ${m.venue}</p>` : "";

    return `
    <article class="match ${resClass}" tabindex="0" aria-expanded="false">
      <div class="match-head" role="button" aria-controls="${detailsId}" aria-label="Pokaż szczegóły meczu ${
      home.name ?? ""
    } – ${away.name ?? ""}">
        <div class="teams">
          <div class="team">
           <span class="name">
              <span class="full-name">${homeName}</span>
              <span class="short-name">${homeShort}</span>
            </span>
            <img class="logo" src="${home.logo || ""}" alt="${
      home.name || ""
    } logo" width="32" height="32">
           
          </div>
          <div class="score">
            <span>${home.score ?? "-"}</span>
            <span class="vs">:</span>
            <span>${away.score ?? "-"}</span>
          </div>
          <div class="team right">
            <img class="logo" src="${away.logo || ""}" alt="${
      away.name || ""
    } logo" width="24" height="24">
            <span class="name">
              <span class="full-name">${awayName}</span>
              <span class="short-name">${awayShort}</span>
            </span>
          </div>
        </div>

    <div class="meta">
  <div class="meta-row meta--full">${metaFull}</div>
  <div class="meta-row meta--compact">${metaCompact}</div>
</div>

      <div id="${detailsId}" class="match-details">
        ${notes}
        ${venue}
        <div class="details-links">
          ${stdLinks}
        </div>
        ${articlesBlock}
      </div>
    </article>`;
  }

  function render() {
    $list.setAttribute("aria-busy", "true");

    // filtry
    const comp = state.filters.comp;
    const res = state.filters.result;
    const q = state.filters.q.trim().toLowerCase();

    let filtered = state.all.filter((m) => {
      const okComp = comp === "all" ? true : m.competition === comp;
      const okRes = res === "all" ? true : m._res === res;
      const okQ =
        q === "" ? true : (m._opponent?.toLowerCase() || "").includes(q);
      return okComp && okRes && okQ;
    });

    // paginacja
    const start = 0;
    const end = state.page * state.perPage;
    const slice = filtered.slice(start, end);

    state.view = slice;

    // render
    $list.innerHTML = slice.map(renderOne).join("");

    // toggle detali
    $list.querySelectorAll(".match").forEach((card) => {
      card.addEventListener("click", toggleDetails);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleDetails.call(card, e);
        }
      });
    });

    // load more visibility
    if (filtered.length > slice.length) {
      $more.hidden = false;
    } else {
      $more.hidden = true;
    }

    $seasonLabel.textContent = `(${
      $season.options[$season.selectedIndex].text
    })`;
    $list.setAttribute("aria-busy", "false");
  }

  // Linia ~300
  function toggleDetails(e) {
    // POPRAWKA: Zatrzymujemy propagację, aby kliknięcie linku nie było traktowane jako kliknięcie karty
    if (e.target.closest(".match-details a")) {
      e.stopPropagation();
      return;
    }

    const card = this; // <article.match>
    const details = card.querySelector(".match-details");
    const expanded = card.getAttribute("aria-expanded") === "true";

    if (!expanded) {
      // OTWARCIE

      // *** MODYFIKACJA: Ustawienie atrybutu PRZED pomiarem, aby aktywować CSSowy padding. ***
      card.setAttribute("aria-expanded", "true");

      // Reset height to auto to get proper scrollHeight (teraz z uwzględnieniem paddingu)
      details.style.height = "auto";
      const targetHeight = details.scrollHeight;

      // Set initial height and trigger animation
      details.style.height = "0px";
      details.offsetHeight; // force reflow
      details.style.height = targetHeight + "px";

      details.addEventListener(
        "transitionend",
        function onEnd(ev) {
          if (ev.propertyName === "height") {
            details.style.height = "auto";
            details.removeEventListener("transitionend", onEnd);
          }
        },
        { once: true }
      );
    } else {
      // ZAMKNIĘCIE
      // Set fixed height before animation
      const currentHeight = details.scrollHeight;
      details.style.height = currentHeight + "px";
      details.offsetHeight; // force reflow

      // Start animation
      details.style.height = "0";
      // *** MODYFIKACJA: Przeniesienie usunięcia atrybutu (i paddingu) na sam koniec animacji. ***
      card.setAttribute("aria-expanded", "false");
    }
  }

  // auto-resize dla otwartych paneli
  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target;
      const card = el.closest(".match");
      if (card?.getAttribute("aria-expanded") === "true") {
        el.style.height = "auto";
        const h = el.scrollHeight;
        el.style.height = h + "px";
      }
    }
  });
  // Wpierw sprawdzamy czy lista istnieje przed próbą querySelectorAll
  if ($list) {
    $list.querySelectorAll(".match-details").forEach((d) => ro.observe(d));
  }

  // ------- data -------
  async function loadData(season) {
    try {
      $list.setAttribute("aria-busy", "true");
      // try primary path first, then fallback to /data/ (older project layout)
      async function fetchWithFallback(season) {
        const candidates = [
          `/assets/data/results_lfc_${season}.json`,
          `/data/results_lfc_${season}.json`,
        ];
        for (const url of candidates) {
          try {
            const r = await fetch(url, { cache: "no-store" });
            if (r.ok) return r;
          } catch (e) {
            // ignore and try next
          }
        }
        throw new Error("Błąd pobierania danych");
      }

      const resp = await fetchWithFallback(season);
      if (!resp.ok) throw new Error("Błąd pobierania danych");
      const data = await resp.json();
      state.all = normalize(data);
      state.page = 1;
      render();
    } catch (err) {
      console.error(err);
      $list.innerHTML = `
        <div class="match">
          <div class="match-head">
            <div class="team"><span class="name">Nie udało się wczytać danych.</span></div>
          </div>
          <div class="match-details">
            <div class="details-links">
              <a href="#" id="retry-load">Spróbuj ponownie</a>
            </div>
          </div>
        </div>`;
      $list.querySelector("#retry-load")?.addEventListener("click", (e) => {
        e.preventDefault();
        loadData(state.season);
      });
      $list.setAttribute("aria-busy", "false");
    }
  }

  // ------- events / init -------
  function bindUI() {
    // sezon
    $season.addEventListener("change", () => {
      state.season = $season.value;
      setQS({ season: state.season });
      loadData(state.season);
    });

    // filtry rozgrywek
    $chipsComp.forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll("[data-comp].is-active")
          .forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        state.filters.comp = btn.dataset.comp;
        state.page = 1;
        setQS({ comp: state.filters.comp });
        render();
      });
    });

    // filtry wyniku
    $chipsRes.forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll("[data-result].is-active")
          .forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        state.filters.result = btn.dataset.result;
        state.page = 1;
        setQS({ result: state.filters.result });
        render();
      });
    });

    // search
    let t;
    $search.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        state.filters.q = $search.value;
        state.page = 1;
        setQS({ q: state.filters.q || null });
        render();
      }, 150);
    });

    // load more
    $more.addEventListener("click", () => {
      state.page += 1;
      render();
    });
  }

  function bootFromQS() {
    const season = qs.get("season");
    const comp = qs.get("comp");
    const result = qs.get("result");
    const q = qs.get("q");

    if (season) {
      state.season = season;
      const opt = [...$season.options].find((o) => o.value === season);
      if (opt) $season.value = season;
    }
    if (comp) {
      state.filters.comp = comp;
      document.querySelectorAll("[data-comp]").forEach((b) => {
        b.classList.toggle("is-active", b.dataset.comp === comp);
      });
    }
    if (result) {
      state.filters.result = result;
      document.querySelectorAll("[data-result]").forEach((b) => {
        b.classList.toggle("is-active", b.dataset.result === result);
      });
    }
    if (q) {
      state.filters.q = q;
      $search.value = q;
    }
  }

  function init() {
    bindUI();
    bootFromQS();
    loadData(state.season);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
/* ===== details (accordion) ===== */

// === NADCHODZĄCE MECZE – belka przewijana ===
async function loadUpcoming() {
  const $wrap = document.getElementById("upcoming-scroll");
  if (!$wrap) return;

  try {
    const res = await fetch("/data/fixtures_lfc_2025-26.json", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Błąd wczytywania terminarza");
    const data = await res.json();

    // sortuj rosnąco (najbliższe pierwsze)
    const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    const next5 = sorted.slice(0, 10);

    $wrap.innerHTML = next5
      .map(
        (m) => `
        <div class="upcoming-card">
          <div class="upcoming-teams">
            <img src="${m.home.logo}" alt="${m.home.name}">
            <span>vs</span>
            <img src="${m.away.logo}" alt="${m.away.name}">
          </div>
          <div class="upcoming-date">${m.date}, ${m.kickoff || ""}</div>
          <div class="upcoming-comp">${m.competition}</div>
        </div>`
      )
      .join("");
  } catch (err) {
    console.error(err);
    $wrap.innerHTML =
      '<p style="color:var(--muted);padding:0 1rem;">Nie udało się wczytać terminarza.</p>';
  }
}
document.addEventListener("DOMContentLoaded", loadUpcoming);
/* ===== nadchodzące mecze belka przewijana ===== */

// === NADCHODZĄCE MECZE — autofiltr po czasie ===
(function setupUpcomingBar() {
  const FILE = "/assets/data/fixtures_lfc_2025-26.json";
  const FINISHED_OFFSET_MIN = 150; // po tylu minutach od kickoff uznajemy mecz za zakończony

  const $wrap = document.getElementById("upcoming-scroll");
  if (!$wrap) return; // jeśli nie ma belki na tej podstronie

  function parseDT(d, t) {
    const [hh = "00", mm = "00"] = (t || "00:00").split(":");
    // Date w strefie użytkownika (PL ok) – wystarczy do naszego porównania
    return new Date(`${d}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00`);
  }
  function fmtWeekdayPL(d) {
    const s = new Intl.DateTimeFormat("pl-PL", { weekday: "long" }).format(d);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function getDayLabel(m) {
    return m.day || fmtWeekdayPL(parseDT(m.date, m.kickoff));
  }

  function isFutureOrLive(m, now = new Date()) {
    const dt = parseDT(m.date, m.kickoff);
    const end = new Date(dt.getTime() + FINISHED_OFFSET_MIN * 60 * 1000);
    // pokaż gdy mecz jeszcze się nie rozpoczął lub wciąż trwa (przed „end”)
    return now < end;
  }

  async function loadUpcoming() {
    try {
      const res = await fetch(FILE, { cache: "no-store" });
      if (!res.ok) throw new Error("fixtures fetch failed");
      const data = await res.json();

      // zostaw tylko przyszłe / trwające, posortuj rosnąco i weź 5
      const now = new Date();
      const next = data
        .filter((m) => isFutureOrLive(m, now))
        .sort((a, b) => parseDT(a.date, a.kickoff) - parseDT(b.date, b.kickoff))
        .slice(0, 5);

      if (next.length === 0) {
        // nic do pokazania – schowaj cały pasek
        document.getElementById("upcoming-bar")?.setAttribute("hidden", "");
        return;
      } else {
        document.getElementById("upcoming-bar")?.removeAttribute("hidden");
      }

      $wrap.innerHTML = next
        .map((m) => {
          // używamy parseDT dostępnego w tej funkcji
          const dt = parseDT(m.date, m.kickoff);
          const iso = dt && !isNaN(dt) ? dt.toISOString().slice(0, 19) : "";
          const dateText = `${m.date}${m.kickoff ? `, ${m.kickoff}` : ""}`;
          const dayLabel = getDayLabel(m); // funkcja już masz w scope

          return `
      <div class="upcoming-card" title="${m.competition}">
        <div class="upcoming-teams">
          <img src="${m.home.logo}" alt="${m.home.name}">
          <span>vs</span>
          <img src="${m.away.logo}" alt="${m.away.name}">
        </div>

        <div class="upcoming-date" data-datetime="${iso}">
          <span class="upcoming-day">${dayLabel}</span>
          <span class="upcoming-datestring">${dateText}</span>
        </div>

        <div class="upcoming-comp">${m.competition}</div>
      </div>
    `;
        })
        .join("");
    } catch (e) {
      console.error(e);
      $wrap.innerHTML =
        '<p style="color:var(--muted);padding:0 1rem;">Nie udało się wczytać terminarza.</p>';
    }
  }
})();

/* === League table loader (manual JSON) ===
   Expects files:
   /assets/data/table_premier_2025-26.json
   /assets/data/table_cl_2025-26.json
*/
(function () {
  const tableRoot = document.getElementById("league-table");
  const switchBtns = document.querySelectorAll(".table-switch [data-table]");
  const season =
    (window.ANFLD_RESULTS && window.ANFLD_RESULTS.season) || "2025-26";

  async function fetchTable(kind) {
    const paths = [
      `/assets/data/table_${kind}_${season}.json`,
      `/data/table_${kind}_${season}.json`,
    ];
    for (const p of paths) {
      try {
        const r = await fetch(p, { cache: "no-store" });
        if (!r.ok) continue;
        return r.json();
      } catch (e) {
        /* ignore */
      }
    }
    return null;
  }

  function renderTable(data) {
    if (!data || !Array.isArray(data.rows)) {
      tableRoot.innerHTML = `<div class="empty">Brak danych tabeli. Wgraj JSON do /assets/data/</div>`;
      return;
    }

    const header = `
      <div class="row head" style="font-weight:800; padding:0.35rem 0.4rem; color:var(--muted);">
        <div class="pos">#</div>
        <div style="flex:1">Drużyna</div>
        <div class="p">M</div>
        <div class="p">W</div>
        <div class="p">R</div>
        <div class="p">P</div>
        <div class="gd">+/-</div>
        <div class="pts">Pkt</div>
      </div>
    `;

    // W funkcji renderTable() zmień renderowanie wiersza:

    const rows = data.rows
      .map((r) => {
        const cls =
          r.pos <= (data.highlightTop || 4)
            ? "row top"
            : r.pos > (data.relegationStart || 17)
            ? "row releg"
            : "row";
        return `
      <div class="${cls}" title="${r.team}">
        <div class="pos">${r.pos}</div>
        <div class="team">
          <img class="logo" src="${r.logo || ""}" alt="${
          r.team
        } logo" width="20" height="20">
          <div class="name">
            <span class="full-name">${r.team}</span>
            <span class="short-name">${r.short || r.team}</span>
          </div>
        </div>
        <div class="p">${r.played ?? "-"}</div>
        <div class="p">${r.won ?? "-"}</div>
        <div class="p">${r.draw ?? "-"}</div>
        <div class="p">${r.lost ?? "-"}</div>
        <div class="gd">${r.gd != null ? r.gd : "-"}</div>
        <div class="pts">${r.points ?? "-"}</div>
      </div>
    `;
      })
      .join("");

    tableRoot.innerHTML = header + rows;
  }

  // handle clicks on switch
  switchBtns.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const kind = btn.dataset.table;
      switchBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      tableRoot.innerHTML = `<div class="loading">Ładowanie…</div>`;
      const data = await fetchTable(kind === "cl" ? "cl" : "premier");
      renderTable(data);
    });
  });

  // initial load (premier)
  document.addEventListener("DOMContentLoaded", async () => {
    const initial =
      document.querySelector(".table-switch .tab.is-active")?.dataset.table ||
      "premier";
    const data = await fetchTable(initial === "cl" ? "cl" : "premier");
    renderTable(data);
  });
})();

// === RENDER MOBILE TABLE ===
function renderLeagueTableMobile(data) {
  const container = document.getElementById("league-table");
  const top5 = data.rows.slice(0, 5); // pokazujemy tylko 5 pierwszych

  const html = `
    <table class="table table--mobile">
      <thead>
        <tr>
          <th>#</th>
          <th>Drużyna</th>
          <th>M</th>
          <th>+/-</th>
          <th>Pkt</th>
        </tr>
      </thead>
      <tbody>
        ${top5
          .map(
            (t) => `
          <tr>
            <td>${t.pos}</td>
            <td class="team-cell">
              <img src="${t.logo}" alt="${t.team}" />
              <span>${t.short}</span>
            </td>
            <td>${t.played}</td>
            <td>${t.gd > 0 ? `+${t.gd}` : t.gd}</td>
            <td>${t.points}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
  container.innerHTML = html;
}

// Mobile: klik/tap na wiersz rozwija szersze statystyki.
// Bez biblioteki — lekki, uniwersalny.
(function () {
  function isMobile() {
    return window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  }

  function attach() {
    const rows = document.querySelectorAll(".league-table tbody tr");
    rows.forEach((tr) => {
      // jeśli details nie istnieje, zbuduj go z ukrytych kolumn (jeśli tabela jest w <table>)
      if (!tr.querySelector(".details")) {
        // pobierz staty z komórek o klasach lub z atrybutów data-*
        const stats = [];
        const m = tr.querySelector("td.matches, .matches")?.textContent?.trim();
        const w = tr.querySelector("td.wins, .wins")?.textContent?.trim();
        const d = tr.querySelector("td.draws, .draws")?.textContent?.trim();
        const l = tr.querySelector("td.losses, .losses")?.textContent?.trim();
        const gd = tr
          .querySelector("td.gd, .gd, .plusminus")
          ?.textContent?.trim();

        // build string only from available values
        if (m) stats.push(`M: ${m}`);
        if (w) stats.push(`W: ${w}`);
        if (d) stats.push(`R: ${d}`);
        if (l) stats.push(`L: ${l}`);
        if (gd) stats.push(`+/-: ${gd}`);

        const details = document.createElement("div");
        details.className = "details";
        details.innerHTML = stats
          .map((s) => `<span class="stat">${s}</span>`)
          .join("");
        tr.appendChild(details);
      }

      // click handler (toggle)
      tr.addEventListener("click", function (e) {
        // ignore clicks on links inside row
        if (e.target.tagName.toLowerCase() === "a") return;
        // only on mobile
        if (!isMobile()) return;
        this.classList.toggle("expanded");
      });
    });
  }

  // reattach on load and on resize (debounced)
  window.addEventListener("load", attach);
  let t;
  window.addEventListener("resize", function () {
    clearTimeout(t);
    t = setTimeout(attach, 250);
  });
})();

// Responsive: move league-sidebar under results-list on small screens, restore on desktop.
// Debounce helper
function debounce(fn, wait) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

(function () {
  const aside = document.querySelector("aside.league-sidebar");
  const resultsList = document.querySelector(
    "section#results-list, .results-list, #results-list"
  );
  if (!aside || !resultsList) return;

  const originalParent = aside.parentNode;
  const originalNextSibling = aside.nextElementSibling; // where it was

  function moveAside() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // if not already after resultsList -> move it
      if (resultsList && resultsList.nextElementSibling !== aside) {
        resultsList.parentNode.insertBefore(
          aside,
          resultsList.nextElementSibling
        );
        // small hint for accessibility
        aside.setAttribute("data-moved", "mobile");
      }
    } else {
      // restore to original place if needed
      if (originalParent && originalParent !== aside.parentNode) {
        if (
          originalNextSibling &&
          originalNextSibling.parentNode === originalParent
        ) {
          originalParent.insertBefore(aside, originalNextSibling);
        } else {
          originalParent.appendChild(aside);
        }
        aside.removeAttribute("data-moved");
      }
    }
  }

  // run on load & resize (debounced)
  window.addEventListener("load", moveAside);
  window.addEventListener("resize", debounce(moveAside, 180));
})();

// Usuwa powszechne ukrycia na mobile
(function () {
  const aside = document.querySelector("aside.league-sidebar");
  if (!aside) return;
  function clearHiding() {
    if (window.innerWidth <= 768) {
      aside.classList.remove("is-hidden", "hidden", "collapsed");
      aside.removeAttribute("aria-hidden");
      aside.style.transform = "";
      aside.style.left = "";
      aside.style.right = "";
      aside.style.visibility = "visible";
      aside.style.opacity = "1";
      aside.style.display = "block";
    }
  }
  window.addEventListener("load", clearHiding);
  window.addEventListener("resize", debounce(clearHiding, 150));
})();

// ROWIŃ widget: pobiera fixtures i table, renderuje 5 ostatnich meczów i top5 drużyn
(async function buildRowinWidget() {
  const root = document.getElementById("rowin-root");
  if (!root) return;

  // helper: bezpieczne fetch + json
  async function loadJSON(url) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn("Rowin: fetch error", url, e);
      return null;
    }
  }

  // helper: parsuj datę z różnych formatów
  function parseDate(s) {
    if (!s) return null;
    // jeśli już ISO:
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return new Date(s);
    // "YYYY-MM-DD" + optional time
    const m = s.match(/(\d{4}-\d{2}-\d{2})(?:[ T,]+(\d{1,2}:\d{2}))?/);
    if (m) {
      const t = m[2] ? m[2].padStart(5, "0") : "00:00";
      return new Date(`${m[1]}T${t}:00`);
    }
    const d = new Date(s);
    return isNaN(d) ? null : d;
  }

  function formatShortDate(d) {
    if (!d) return "";
    // "09.11 17:30" short polish format
    try {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${dd}.${mm} ${hh}:${min}`;
    } catch (e) {
      return d.toLocaleString();
    }
  }

  // załaduj pliki (ścieżki: dostosuj jeśli inne)
  const fixtures = (await loadJSON("/data/fixtures_lfc_2025-26.json")) || [];
  const table = (await loadJSON("/data/table_premier_2025-26.json")) || [];

  // wybierz 5 ostatnich spotkań (filtrujemy te z datą, sort malejąco)
  const matchesWithDate = fixtures
    .map((f) => ({
      ...f,
      _dt: parseDate(f.date || f.datetime || f.kickoff || f.matchDate || ""),
    }))
    .filter((x) => x._dt)
    .sort((a, b) => b._dt - a._dt);

  const last5 = matchesWithDate.slice(0, 5);

  // top5 z tabeli — zakładamy plik jest posortowany (najwyżej najlepsze)
  const top5 = Array.isArray(table)
    ? table.slice(0, 5)
    : table.rows
    ? table.rows.slice(0, 5)
    : [];

  // render HTML
  const html = `
    <div class="rowin-widget" role="region" aria-label="Rowiń summary">
      <div class="rowin-head">
        <h4>Rowiń</h4>
        <div class="muted">5 ostatnich / Top 5</div>
      </div>

      <div class="rowin-grid">
        <div class="mini-card matches-list" aria-live="polite">
          <strong style="display:block;margin-bottom:0.45rem;font-size:0.92rem;color:var(--muted,#f1f1f1)">Ostatnie mecze</strong>
          ${
            last5.length
              ? last5
                  .map((m) => {
                    const homeLogo =
                      m.home?.logo ||
                      m.home?.crest ||
                      "/assets/default-team.png";
                    const awayLogo =
                      m.away?.logo ||
                      m.away?.crest ||
                      "/assets/default-team.png";
                    const homeName = m.home?.name || m.home?.team || "Home";
                    const awayName = m.away?.name || m.away?.team || "Away";
                    const score = m.score
                      ? m.score
                      : m.ft
                      ? m.ft
                      : m.result
                      ? m.result
                      : "–";
                    const dt = m._dt
                      ? formatShortDate(m._dt)
                      : m.date || m.datetime || "";
                    return `
              <div class="match" title="${homeName} vs ${awayName}">
                <img src="${homeLogo}" alt="${homeName}">
                <div style="min-width:8px"></div>
                <div style="flex:0 0 auto;font-weight:600;color:rgba(255,255,255,0.95);width:80px;overflow:hidden;text-overflow:ellipsis">
                  ${homeName}
                </div>
                <div class="vs"> ${score || "vs"} </div>
                <div style="flex:0 0 auto;font-weight:600;color:rgba(255,255,255,0.95);width:80px;overflow:hidden;text-overflow:ellipsis">
                  ${awayName}
                </div>
                <img src="${awayLogo}" alt="${awayName}" style="margin-left:6px">
                <div class="meta">${dt}</div>
              </div>
            `;
                  })
                  .join("")
              : '<div class="muted">Brak danych</div>'
          }
        </div>

        <div class="mini-card table-list" aria-live="polite">
          <strong style="display:block;margin-bottom:0.45rem;font-size:0.92rem;color:var(--muted,#f1f1f1)">Top 5 tabeli</strong>
          ${
            top5.length
              ? top5
                  .map((t, idx) => {
                    // t może mieć różne pola (name, team, club), score/points jako pts / points
                    const logo =
                      t.logo ||
                      t.crest ||
                      `/assets/logos/${(t.code || t.name || "team")
                        .toLowerCase()
                        .replace(/\s+/g, "-")}.svg`;
                    const name =
                      t.name || t.team || t.club || t.clubName || "Team";
                    const pts =
                      t.pts ?? t.points ?? t.Pkt ?? t.points_total ?? "";
                    const pos = t.position ?? t.pos ?? idx + 1;
                    return `
              <div class="team" title="${name}">
                <div class="pos">${pos}</div>
                <img src="${logo}" alt="${name}">
                <div class="name">${name}</div>
                <div class="pts">${pts}</div>
              </div>
            `;
                  })
                  .join("")
              : '<div class="muted">Brak tabeli</div>'
          }
        </div>
      </div>
    </div>
  `;

  root.innerHTML = html;
})();
