// assets/js/newsroom.js
// Render newsroom from JSON and ensure all newsroom links open in a new tab (secure rel).
const NEWSROOM_SRC = "data/newsroom.json"; // bez wiodącego slash
const NEWSROOM_LIMIT = 6;

function timeAgoPL(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "przed chwilą";
  const min = Math.floor(diff / 60);
  if (min < 60) return `${min} min temu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h temu`;
  const days = Math.floor(h / 24);
  return `${days} d temu`;
}

function escapeHTML(s = "") {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function createAnchor(href, text, cls = "") {
  const a = document.createElement("a");
  a.href = href;
  a.textContent = text;
  if (cls) a.className = cls;
  // ensure new tab + security
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  // optional click tracking for debugging / analytics
  a.addEventListener("click", (e) => {
    try {
      console.log("newsroom click:", href);
    } catch (err) {}
  });
  return a;
}

function renderNewsroom(items) {
  const root = document.getElementById("newsroom-list");
  if (!root) return;

  root.innerHTML = "";
  if (!items || items.length === 0) {
    const li = document.createElement("li");
    li.className = "newsroom__item";
    li.innerHTML = `<div class="newsroom__meta">—</div><h3 class="newsroom__title">Brak nowych informacji.</h3>`;
    root.appendChild(li);
    return;
  }

  items.slice(0, NEWSROOM_LIMIT).forEach((item) => {
    const title = item.title ? String(item.title) : "";
    const tag = item.tag ? String(item.tag) : "Update";
    const time = item.time ? timeAgoPL(item.time) : "";
    const excerpt = item.excerpt ? String(item.excerpt) : "";
    const source = item.source ? String(item.source) : "";
    const url = item.url && typeof item.url === "string" ? item.url : "";

    const li = document.createElement("li");
    li.className = "newsroom__item";

    const metaWrap = document.createElement("div");
    metaWrap.className = "newsroom__meta";
    metaWrap.innerHTML = `<span class="newsroom__tag">${escapeHTML(
      tag
    )}</span>&nbsp;•&nbsp;<span>${escapeHTML(time)}</span>`;
    if (source) {
      const srcSpan = document.createElement("span");
      srcSpan.className = "newsroom__source";
      srcSpan.innerHTML = `&nbsp;•&nbsp;${escapeHTML(source)}`;
      metaWrap.appendChild(srcSpan);
    }

    const h3 = document.createElement("h3");
    h3.className = "newsroom__title";
    if (url) {
      const a = createAnchor(url, title, "newsroom__link");
      h3.appendChild(a);
    } else {
      h3.textContent = title;
    }

    li.appendChild(metaWrap);
    li.appendChild(h3);

    if (excerpt) {
      const p = document.createElement("p");
      p.className = "newsroom__excerpt";
      p.innerHTML = escapeHTML(excerpt);
      li.appendChild(p);
    }

    if (url && source) {
      const srcLine = document.createElement("div");
      srcLine.className = "newsroom__srcline";
      srcLine.appendChild(document.createTextNode("→ Źródło: "));
      srcLine.appendChild(createAnchor(url, source, "newsroom__link"));
      li.appendChild(srcLine);
    }

    root.appendChild(li);
  });
}

// fetch and render
fetch(NEWSROOM_SRC)
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((data) => {
    const items = Array.isArray(data) ? data.slice() : [];
    items.sort((a, b) => new Date(b.time) - new Date(a.time));
    renderNewsroom(items);
  })
  .catch((err) => {
    console.error("Newsroom error:", err);
    renderNewsroom([]);
  });
