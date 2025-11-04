/* Anfield.PL – Wyniki (mobile-first)
 * Render listy meczów z JSON + filtry + paginacja (najnowsze -> najstarsze)
 */

(() => {
  const cfg = Object.assign(
    { season: "2025-26", perPage: 20 },
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

  // ------- render -------
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
            <img class="logo" src="${home.logo || ""}" alt="${
      home.name || ""
    } logo" width="24" height="24">
            <span class="name">
              <span class="full-name">${homeName}</span>
              <span class="short-name">${homeShort}</span>
            </span>
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
          <div class="comp">${metaComp}</div>
          <div class="date">${dateTxt}</div>
        </div>
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
/* ===== nadchodzące mecze – belka przewijana ===== */
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
        .map(
          (m) => `
        <div class="upcoming-card" title="${m.competition}">
          <div class="upcoming-teams">
            <img src="${m.home.logo}" alt="${m.home.name}">
            <span>vs</span>
            <img src="${m.away.logo}" alt="${m.away.name}">
          </div>
          <div class="upcoming-date">${m.date}${
            m.kickoff ? `, ${m.kickoff}` : ""
          }</div>
          <div class="upcoming-comp">${m.competition}</div>
        </div>
      `
        )
        .join("");
    } catch (e) {
      console.error(e);
      $wrap.innerHTML =
        '<p style="color:var(--muted);padding:0 1rem;">Nie udało się wczytać terminarza.</p>';
    }
  }
})();
