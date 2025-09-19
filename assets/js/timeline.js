(function () {
  // Kickoff time (use absolute ISO with timezone)
  const kickoffISO = "2025-09-20T13:30:00+02:00"; // 20 września 2025, 13:30 CEST (Europe/Warsaw)
  const target = new Date(kickoffISO).getTime();
  const el = document.getElementById("kickoff-countdown");
  const timeNode = el && el.querySelector(".countdown__time");

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function update() {
    const now = Date.now();
    const diff = target - now;

    if (!timeNode) return;

    if (diff <= 0) {
      timeNode.textContent = "Kick-off — trwa transmisja / relacja na żywo";
      // option: add "live" class to the Live link
      const liveLink = document.getElementById("live-link");
      if (liveLink) liveLink.classList.add("is-live");
      clearInterval(interval);
      return;
    }

    const secs = Math.floor(diff / 1000);
    const days = Math.floor(secs / 86400);
    const hours = Math.floor((secs % 86400) / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    let display = "";
    if (days > 0) display += days + "d ";
    display += pad(hours) + "h " + pad(minutes) + "m " + pad(seconds) + "s";
    timeNode.textContent = display;
  }

  // initial
  update();
  const interval = setInterval(update, 1000);
})();

(function () {
  const el = document.getElementById("match-countdown");
  if (!el) return;
  // preferuj data-kickoff z HTML; fallback: ręcznie ustawiona data
  const iso = el.getAttribute("data-kickoff"); // np. "2025-09-20T11:30:00Z"
  const KO = iso ? new Date(iso) : new Date(Date.now() + 60 * 60 * 1000); // fallback: +1h
  const MS_45 = 45 * 60 * 1000,
    MS_90 = 90 * 60 * 1000;

  function fmt(n) {
    return n.toString().padStart(2, "0");
  }
  function tick() {
    const now = new Date();
    const diff = KO - now;
    if (diff > 0) {
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      el.textContent = `Start za ${h}h ${fmt(m)}m ${fmt(s)}s`;
      return;
    }
    // mecz trwa: pokaż status wg czasu od KO
    const since = now - KO;
    if (since <= MS_45) el.textContent = "Gramy! 1. połowa";
    else if (since <= MS_45 + 900000) el.textContent = "Przerwa";
    else if (since <= MS_90) el.textContent = "Gramy! 2. połowa";
    else el.textContent = "Koniec meczu";
  }
  tick();
  setInterval(tick, 1000);
})();
