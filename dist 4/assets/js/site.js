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

  // ─── Preferenze utente: niente moto / risparmio dati ───
  const reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  const saveData = navigator.connection && navigator.connection.saveData === true;

  // ─── Scroll reveal (+ stagger per .reveal-group) ───
  // Imposta la cadenza dei figli dei gruppi (CSS usa --reveal-i)
  document.querySelectorAll('.reveal-group').forEach((group) => {
    Array.prototype.forEach.call(group.children, (child, i) => {
      child.style.setProperty('--reveal-i', i);
    });
  });
  const revealEls = document.querySelectorAll('.reveal, .reveal-group');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('visible'));
  } else {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '-40px' }
    );
    revealEls.forEach((el) => obs.observe(el));
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
    if (burger) burger.setAttribute('aria-expanded', 'true');
  }
  function closeNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove('open');
    document.body.classList.remove('nav-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    if (burger) burger.setAttribute('aria-expanded', 'false');
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
    if (path === normalized) {
      // pagina esatta: l'unico aria-current="page"
      link.setAttribute('aria-current', 'page');
    } else if (normalized !== '/' && path.startsWith(normalized + '/')) {
      // sezione antenata della pagina corrente: evidenziata, ma non aria-current
      link.classList.add('is-section');
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

  // ─── Counter animato (stat-strip) ───
  // Il valore reale è già nel testo HTML (fallback senza JS / reduced-motion).
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const runCount = (el) => {
      const target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      if (reduceMotion) { el.textContent = String(target); return; }
      const dur = 1500;
      let startTs = null;
      const tick = (now) => {
        if (startTs === null) startTs = now;
        const t = Math.min(1, (now - startTs) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = String(target);
      };
      requestAnimationFrame(tick);
    };
    if (reduceMotion || !('IntersectionObserver' in window)) {
      counters.forEach(runCount);
    } else {
      const cObs = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { runCount(e.target); cObs.unobserve(e.target); } });
      }, { threshold: 0.5 });
      counters.forEach((el) => cObs.observe(el));
    }
  }

  // ─── Parallax leggero (solo transform, niente CLS) ───
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !reduceMotion) {
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      parallaxEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -40 || r.top > vh + 40) return;
        const speed = parseFloat(el.getAttribute('data-parallax')) || 0.12;
        const center = r.top + r.height / 2 - vh / 2;
        let shift = -center * speed;
        if (shift > 26) shift = 26; else if (shift < -26) shift = -26;
        // scale baseline 1.08 = headroom così i bordi non si scoprono mai
        el.style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0) scale(1.08)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  // ─── Marquee: duplica i nodi una volta per un loop continuo ───
  if (!reduceMotion) {
    document.querySelectorAll('.marquee-track').forEach((track) => {
      const items = Array.prototype.slice.call(track.children);
      items.forEach((node) => {
        const clone = node.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
    });
  }

  // ─── Guardia autoplay video (reduced-motion / save-data → solo poster) ───
  document.querySelectorAll('video[data-autoplay]').forEach((v) => {
    if (reduceMotion || saveData) { v.removeAttribute('autoplay'); try { v.pause(); } catch (e) {} return; }
    v.muted = true;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  });
  // Ferma anche i video con autoplay nativo (es. hero) quando si preferisce ridurre il moto
  if (reduceMotion) {
    document.querySelectorAll('video.hero-bg-img, .media-band-bg video, .editorial-feature-media video').forEach((v) => {
      try { v.pause(); v.removeAttribute('autoplay'); } catch (e) {}
    });
  }

  // ─── "WOW" layer · aurora + polvere + tilt card su tutte le pagine ───
  // (la home ha le proprie versioni in home.js: qui la saltiamo per non duplicare)
  if (!document.body.classList.contains('home')) {
    // Aurora che respira (decorativa, dietro al contenuto)
    var wowAtmos = document.createElement('div');
    wowAtmos.className = 'wow-atmos';
    wowAtmos.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(wowAtmos, document.body.firstChild);

    // Polvere luminosa (solo se non reduced-motion / save-data)
    if (!reduceMotion && !saveData) {
      var wc = document.createElement('canvas');
      wc.className = 'wow-dust';
      wc.setAttribute('aria-hidden', 'true');
      wowAtmos.appendChild(wc);
      var wctx = wc.getContext('2d');
      var wdpr = Math.min(window.devicePixelRatio || 1, 2);
      var wW = 0, wH = 0, wmotes = [];
      var WT = ['201,168,106', '234,114,117', '244,236,220'];
      var wrand = function (a, b) { return a + (b - a) * Math.random(); };
      var wbuild = function () {
        wW = window.innerWidth; wH = window.innerHeight;
        wc.width = wW * wdpr; wc.height = wH * wdpr;
        wc.style.width = wW + 'px'; wc.style.height = wH + 'px';
        wctx.setTransform(wdpr, 0, 0, wdpr, 0, 0);
        var n = Math.min(50, Math.round((wW * wH) / 30000));
        wmotes = [];
        for (var i = 0; i < n; i++) wmotes.push({ x: Math.random() * wW, y: Math.random() * wH, r: wrand(0.5, 1.7), vy: wrand(-0.14, -0.04), vx: wrand(-0.1, 0.1), a: wrand(0.1, 0.45), tw: wrand(0.004, 0.013), ph: Math.random() * 6.28, t: WT[(Math.random() * WT.length) | 0] });
      };
      var wrun = true;
      var wframe = function () {
        if (!wrun) return;
        wctx.clearRect(0, 0, wW, wH);
        for (var i = 0; i < wmotes.length; i++) {
          var m = wmotes[i];
          m.x += m.vx; m.y += m.vy; m.ph += m.tw;
          if (m.y < -6) { m.y = wH + 6; m.x = Math.random() * wW; }
          if (m.x < -6) m.x = wW + 6; else if (m.x > wW + 6) m.x = -6;
          var al = m.a * (0.55 + 0.45 * Math.sin(m.ph));
          wctx.beginPath();
          wctx.arc(m.x, m.y, m.r, 0, 6.2832);
          wctx.fillStyle = 'rgba(' + m.t + ',' + al.toFixed(3) + ')';
          wctx.shadowBlur = m.r * 4; wctx.shadowColor = 'rgba(' + m.t + ',' + (al * 0.8).toFixed(3) + ')';
          wctx.fill();
        }
        wctx.shadowBlur = 0;
        requestAnimationFrame(wframe);
      };
      wbuild();
      requestAnimationFrame(wframe);
      var wrt;
      window.addEventListener('resize', function () { clearTimeout(wrt); wrt = setTimeout(wbuild, 200); }, { passive: true });
      document.addEventListener('visibilitychange', function () { wrun = !document.hidden; if (wrun) requestAnimationFrame(wframe); });
    }

    // Tilt 3D + riflesso delle card (solo puntatore fine, no reduced-motion)
    if (!reduceMotion && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.querySelectorAll('.tile').forEach(function (card) {
        var raf = null, rect = null;
        card.addEventListener('pointerenter', function () { rect = card.getBoundingClientRect(); });
        card.addEventListener('pointermove', function (e) {
          if (!rect) rect = card.getBoundingClientRect();
          var px = (e.clientX - rect.left) / rect.width, py = (e.clientY - rect.top) / rect.height;
          if (raf) return;
          raf = requestAnimationFrame(function () {
            card.style.setProperty('--ry', ((px - 0.5) * 9).toFixed(2) + 'deg');
            card.style.setProperty('--rx', ((0.5 - py) * 9).toFixed(2) + 'deg');
            card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
            card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
            raf = null;
          });
        });
        card.addEventListener('pointerleave', function () { rect = null; card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
      });
    }
  }
})();
