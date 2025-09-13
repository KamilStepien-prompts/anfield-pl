// funkcja do ładowania i wyświetlania wszystkich felietonów na stronie archiwum
async function loadArchivePosts() {
  try {
    const response = await fetch("/data/posts.json");
    if (!response.ok) {
      throw new Error(`Błąd HTTP: ${response.status}`);
    }
    const posts = await response.json();

    // Sortujemy felietony od najnowszych do najstarszych
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    const container = document.getElementById("archive-container");
    if (!container) {
      console.error(
        "Brak elementu o ID 'archive-container'. Upewnij się, że istnieje w HTML."
      );
      return;
    }

    // Generujemy HTML dla WSZYSTKICH felietonów
    const postsHtml = posts
      .map(
        (post) => `
      <article class="post-card">
        <div class="post-content">
          <div class="post-meta">
            <span class="post-date">${post.date}</span>
            <span class="post-tag">${post.tag}</span>
          </div>
          <h3><a href="${post.url}">${post.title}</a></h3>
          <p class="post-excerpt">${post.excerpt}</p>
        </div>
      </article>
    `
      )
      .join("");

    container.innerHTML = postsHtml;
  } catch (error) {
    console.error("Nie udało się załadować felietonów:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadArchivePosts);
