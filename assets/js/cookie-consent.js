// assets/js/cookie-consent.js
(function () {
  if (localStorage.getItem("cookieConsent") === "accepted") {
    loadGA();
    return;
  }
  if (localStorage.getItem("cookieConsent") === "rejected") {
    return;
  }
  if (location.hostname === "127.0.0.1" || location.hostname === "localhost") {
    localStorage.removeItem("cookieConsent");
  }
  console.log(
    "🍪 Cookie consent status:",
    localStorage.getItem("cookieConsent")
  );

  const banner = document.createElement("div");
  banner.innerHTML = `
  <div style="
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: #0d0d0e;
    color: #e5e5e5;
    padding: 22px 20px;
    font-size: 15px;
    font-family: 'Poppins', system-ui, sans-serif;
    box-shadow: 0 -2px 18px rgba(0,0,0,0.6);
    z-index: 9999;
    animation: fadeIn 0.4s ease-out;
  " id="cookie-banner">
    <div style="max-width: 680px; margin: 0 auto; text-align: center; line-height: 1.5;">
      <strong style="font-size: 16px;">🍪 Anfield.PL — nowe, niezależne miejsce dla fanów Liverpoolu.</strong><br>
      Używamy cookies do analizy ruchu — by wiedzieć, które treści Cię naprawdę obchodzą.<br>
      Zgadzasz się?
      <div style="margin-top: 16px; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
        <button id="cookie-accept" style="
          padding: 10px 18px;
          background: linear-gradient(90deg, #e31b23, #ff3b30);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        "> ⚽ Gol !!!</button>
        <button id="cookie-reject" style="
          padding: 10px 18px;
          background: rgba(255,255,255,0.08);
          color: #aaa;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        ">Offside 😥 </button>
      </div>
    </div>
  </div>

  <style>
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(40px); }
    }
  </style>
`;

  document.body.appendChild(banner);

  document.getElementById("cookie-accept").onclick = () => {
    localStorage.setItem("cookieConsent", "accepted");
    banner.style.animation = "fadeOut 0.8s ease-in forwards";
    setTimeout(() => banner.remove(), 400);
    loadGA();
  };

  document.getElementById("cookie-reject").onclick = () => {
    localStorage.setItem("cookieConsent", "rejected");
    banner.style.animation = "fadeOut 0.8s ease-in forwards";
    setTimeout(() => banner.remove(), 400);
  };

  function loadGA() {
    const gtagScript = document.createElement("script");
    gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=G-6WX8HTYXM2";
    gtagScript.async = true;
    document.head.appendChild(gtagScript);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", "G-6WX8HTYXM2", { anonymize_ip: true });
  }
})();
