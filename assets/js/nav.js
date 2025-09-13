// Mobile nav toggle + scroll lock + ESC + klik tła/linku
(() => {
  const btn   = document.querySelector('[data-nav-toggle]');
  const off   = document.querySelector('[data-offcanvas]');
  const panel = document.querySelector('[data-offcanvas-panel]');
  const close = document.querySelector('[data-nav-close]');

    const header = document.querySelector('.site-header');

  // ustaw CSS-var z wysokością headera (na load i resize)
  function setHeaderH(){
    const h = header ? header.offsetHeight : 64;
    document.documentElement.style.setProperty('--header-h', h + 'px');
  }
  setHeaderH();
  window.addEventListener('resize', setHeaderH);

  console.debug('[nav.js] init', { btn: !!btn, off: !!off, panel: !!panel, close: !!close });

  if (!btn || !off || !panel) return;

  const firstLink = panel.querySelector('a');

  function openMenu(){
    off.classList.add('is-open');
    btn.setAttribute('aria-expanded','true');
    document.documentElement.classList.add('lock');
    firstLink && firstLink.focus();
    console.debug('[nav.js] open');
  }
  function closeMenu(){
    off.classList.remove('is-open');
    btn.setAttribute('aria-expanded','false');
    document.documentElement.classList.remove('lock');
    btn.focus();
    console.debug('[nav.js] close');
  }
  function toggleMenu(){
    off.classList.contains('is-open') ? closeMenu() : openMenu();
  }

  btn.addEventListener('click', toggleMenu);
  close?.addEventListener('click', closeMenu);
  off.addEventListener('click', (e) => { if (e.target === off) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
})();
