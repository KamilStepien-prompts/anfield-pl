// assets/js/app.js  (zamień istniejący)
async function loadPosts() {
  try {
    const res = await fetch("/data/posts.json");
    if (!res.ok) throw new Error("Fetch posts.json status " + res.status);
    const posts = await res.json();

    // sort (najnowsze pierwsze)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // opcjonalne filtrowanie (tak jak miałeś, 14 dni)
    const maxAgeInDays = 14;
    const today = new Date();
    const recentPosts = posts.filter((p) => {
      const pd = new Date(p.date);
      const days = (today - pd) / (1000 * 60 * 60 * 24);
      return days <= maxAgeInDays;
    });

    const container = document.getElementById("posts-container");
    if (!container) {
      console.error("Brak #posts-container w DOM.");
      return;
    }
    container.innerHTML = ""; // czyść

    const frag = document.createDocumentFragment();
    recentPosts.forEach((post, idx) => {
      const article = document.createElement("article");
      article.className = "post-card";

      // data-date attribute
      article.setAttribute("data-date", post.date);

      // content wrapper
      const content = document.createElement("div");
      content.className = "post-content";

      // meta row
      const meta = document.createElement("div");
      meta.className = "post-meta";
      const timeEl = document.createElement("time");
      timeEl.className = "post-date";
      timeEl.setAttribute("datetime", post.date);
      // format data czytelnie (pl)
      const fmt = new Intl.DateTimeFormat("pl-PL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      timeEl.textContent = fmt.format(new Date(post.date));
      meta.appendChild(timeEl);

      if (post.tag) {
        const tag = document.createElement("span");
        tag.className = "post-tag";
        tag.textContent = post.tag;
        meta.appendChild(tag);
      }

      // title
      const h3 = document.createElement("h3");
      const a = document.createElement("a");
      a.href = post.url || "#";
      a.textContent = post.title || "Brak tytułu";
      h3.appendChild(a);

      // excerpt
      const p = document.createElement("p");
      p.className = "post-excerpt";
      p.textContent = post.excerpt || "";

      // append
      content.appendChild(meta);
      content.appendChild(h3);
      content.appendChild(p);
      article.appendChild(content);

      // is-new logic (last 7 days)
      const daysDiff = Math.floor(
        (new Date() - new Date(post.date)) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff >= 0 && daysDiff <= 7) article.classList.add("is-new");

      // animation stagger
      article.classList.add("animated");
      article.style.animationDelay = idx * 60 + "ms";

      frag.appendChild(article);
    });

    container.appendChild(frag);

    // jeśli brak postów, pokaż placeholder
    if (recentPosts.length === 0) {
      container.innerHTML = '<p class="muted">Brak wpisów do wyświetlenia.</p>';
    }
  } catch (err) {
    console.error("Nie udało się załadować postów", err);
  }
}

document.addEventListener("DOMContentLoaded", loadPosts);
