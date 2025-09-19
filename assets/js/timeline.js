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
