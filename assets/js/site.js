/* ─────────────────────────────────────────────────────────
   VILLA LUZI · SITE.JS
   Comportamenti condivisi tra le pagine nuove.
   - Le pagine bloccate (/il-segreto e /esperienze/aperitivi-erba)
     hanno i loro script inline e NON usano questo file.
   - NB: nessun contenuto testuale viene iniettato qui — solo
     comportamenti (reveal, header state, menu mobile, sticky CTA).
   ───────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // ─── Scroll reveal ───
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '-50px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
  }

  // ─── Topbar scrolled state ───
  const topbar = document.getElementById('topbar');
  if (topbar) {
    const onScroll = () => topbar.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ─── Mobile nav ───
  const burger = document.getElementById('nav-burger');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileClose = document.getElementById('mobile-nav-close');

  function openNav() {
    if (!mobileNav) return;
    mobileNav.classList.add('open');
    document.body.classList.add('nav-open');
    mobileNav.setAttribute('aria-hidden', 'false');
  }
  function closeNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove('open');
    document.body.classList.remove('nav-open');
    mobileNav.setAttribute('aria-hidden', 'true');
  }

  if (burger) burger.addEventListener('click', openNav);
  if (mobileClose) mobileClose.addEventListener('click', closeNav);
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeNav));
    // Esc per chiudere
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeNav();
    });
  }

  // ─── Sticky mobile CTA ───
  const sticky = document.getElementById('sticky-cta');
  if (sticky) {
    const onStickyScroll = () => sticky.classList.toggle('visible', window.scrollY > 320);
    window.addEventListener('scroll', onStickyScroll, { passive: true });
    onStickyScroll();
  }

  // ─── Marca la voce di menu corrispondente alla pagina corrente ───
  // Confronta il pathname (senza trailing slash) con il data-route di ogni link
  const path = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
  document.querySelectorAll('[data-route]').forEach((link) => {
    const route = link.getAttribute('data-route');
    if (!route) return;
    const normalized = route.replace(/\/$/, '') || '/';
    if (path === normalized || (normalized !== '/' && path.startsWith(normalized + '/'))) {
      link.setAttribute('aria-current', 'page');
    }
  });

  // ─── Newsletter signup: TODO (provider non scelto) ───
  // Mostra un messaggio di conferma stub finché l'integrazione non è cablata.
  document.querySelectorAll('form[data-newsletter]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = form.querySelector('[data-newsletter-msg]');
      if (msg) msg.textContent = 'Grazie. Le scriveremo presto.';
    });
  });
})();
