/* ════════════════════════════════════════════════════════════════
   VILLA LUZI · TRANSITION.JS — transizione di pagina "boule de neige".
   Sito statico multipagina (MPA): a ogni cambio pagina la corrente si
   "chiude" in una nuvola di particelle (sfera di neve agitata) e un velo
   ottanio/verde-notte copre lo schermo; sulla pagina nuova le particelle
   si disperdono e il velo si dissolve.

   Progressive enhancement puro, zero dipendenze, IIFE come site.js.
   - A JS spento: nessun overlay, navigazione normale (l'overlay è creato
     SOLO da JS, quindi non resta mai "incollato" sullo schermo).
   - prefers-reduced-motion / Save-Data: niente particelle, solo una
     dissolvenza sobria del velo.
   - Coabita col loader della home (.home-loader, z-index 9999): sulla
     home NON suoniamo l'entrata, lascia fare al loader cinematografico.
   - Palette/densità/DPR mutuati dal sistema "wow-dust" di site.js.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── Parametri (in cima, facili da tarare) ─────────────────────
     PALETTE  — stessi RGB di wow-dust (oro / corallo / avorio).
     DUR_*    — durate percepite (uscita + entrata ≤ ~1.2s).
     CAP      — tetto particelle; DENS_DIV densità ~ area/divisor.    */
  var PALETTE = ['201,168,106', '234,114,117', '244,236,220'];
  var DUR_EXIT = 620;     // ms — chiusura (particelle + velo che entra)
  var DUR_ENTER = 600;    // ms — apertura (velo che si dissolve)
  var DUR_FADE = 280;     // ms — fallback dissolvenza (reduced-motion / save-data)
  var PARTICLE_CAP = 150; // tetto assoluto
  var DENS_DIV = 7000;    // densità: ~1 particella ogni 7000 px²
  var SAFETY_MS = 1000;   // se la navigazione non parte, forziamo location.href
  var VEIL = 'radial-gradient(125% 120% at 50% 42%, #0E3B3E 0%, #0a2d2f 46%, #081E20 100%)';
  var NAV_KEY = 'vl_nav'; // flag sessionStorage: "arrivo da navigazione interna"

  /* ─── Preferenze utente (rilette live: possono cambiare a runtime) ─ */
  function reduceNow() { return window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false; }
  function liteNow() { return reduceNow() || (navigator.connection && navigator.connection.saveData === true); }

  /* sessionStorage tollerante (private mode) ------------------------ */
  function flagSet() { try { sessionStorage.setItem(NAV_KEY, '1'); } catch (e) {} }
  function flagGet() { try { return sessionStorage.getItem(NAV_KEY) === '1'; } catch (e) { return false; } }
  function flagClear() { try { sessionStorage.removeItem(NAV_KEY); } catch (e) {} }

  /* ─── Overlay + canvas (creati una volta) ───────────────────── */
  var overlay = null, canvas = null, ctx = null;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, motes = [];
  var raf = 0, running = false, animToken = 0; // animToken invalida i loop superati

  function buildOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'vl-transition';
    overlay.setAttribute('aria-hidden', 'true');
    // Stili inline: il file non ha CSS dedicato e deve funzionare anche
    // sulle pagine standalone (che non linkano site.css).
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:950', 'pointer-events:none',
      'opacity:0', 'visibility:hidden', 'background:' + VEIL,
      'will-change:opacity', 'contain:layout paint'
    ].join(';');
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    overlay.appendChild(canvas);
    ctx = canvas.getContext('2d');
    (document.body || document.documentElement).appendChild(overlay);
  }

  function sizeCanvas() {
    if (!canvas || !ctx) return;
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(a, b) { return a + (b - a) * Math.random(); }

  // Semina la "neve": particelle sparse sullo schermo con una velocità
  // iniziale e un vortice attorno al centro (la sfera che viene agitata).
  function seed() {
    sizeCanvas();
    var n = Math.min(PARTICLE_CAP, Math.round((W * H) / DENS_DIV));
    motes = [];
    for (var i = 0; i < n; i++) {
      motes.push({
        x: Math.random() * W, y: Math.random() * H,
        r: rand(0.6, 2.6),
        vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6),
        a: rand(0.25, 0.85),
        tw: rand(0.01, 0.03), ph: Math.random() * 6.28,
        spin: rand(0.6, 1.5),                       // intensità del vortice
        t: PALETTE[(Math.random() * PALETTE.length) | 0]
      });
    }
  }

  // settle = quanto la nuvola si è "posata" (0 agitata → 1 quieta):
  // in uscita va 0→1, in entrata va 1→0. Pilota dispersione e dimensione.
  function drawParticles(settle, globalAlpha) {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    var cx = W / 2, cy = H / 2;
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      // vortice attorno al centro, intensità che svanisce mentre si posa
      var dx = m.x - cx, dy = m.y - cy;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var swirl = m.spin * (1 - settle) * 0.9;
      m.vx += (-dy / dist) * swirl;
      m.vy += (dx / dist) * swirl + 0.05 * (1 - settle); // un filo di gravità
      m.vx *= 0.94; m.vy *= 0.94;                         // attrito → si quietano
      m.x += m.vx; m.y += m.vy; m.ph += m.tw;
      // riavvolge ai bordi così la coltre resta piena
      if (m.x < -8) m.x = W + 8; else if (m.x > W + 8) m.x = -8;
      if (m.y < -8) m.y = H + 8; else if (m.y > H + 8) m.y = -8;
      var al = m.a * (0.55 + 0.45 * Math.sin(m.ph)) * globalAlpha;
      if (al <= 0.002) continue;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(' + m.t + ',' + al.toFixed(3) + ')';
      ctx.shadowBlur = m.r * 4; ctx.shadowColor = 'rgba(' + m.t + ',' + (al * 0.8).toFixed(3) + ')';
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function easeWow(t) { /* ~cubic-bezier(0.19,1,0.22,1) */ return 1 - Math.pow(1 - t, 3); }

  /* ─── Metà USCITA ───────────────────────────────────────────── */
  var leaving = false;
  function runExit(href) {
    if (leaving) return;
    leaving = true;
    flagSet(); // così la pagina nuova sa di dover suonare l'entrata

    // navighiamo una sola volta, comunque vada
    var navigated = false;
    function go() { if (navigated) return; navigated = true; window.location.href = href; }
    setTimeout(go, SAFETY_MS); // rete di sicurezza

    buildOverlay();
    overlay.style.visibility = 'visible';

    if (liteNow()) { // sobrio: solo dissolvenza del velo
      animateVeil(0, 1, DUR_FADE, function () { go(); });
      return;
    }

    seed();
    var token = ++animToken; running = true; // invalida eventuali loop precedenti
    var start = performance.now();
    function frame(now) {
      if (!running || token !== animToken) return;
      var t = Math.min(1, (now - start) / DUR_EXIT);
      var e = easeWow(t);
      overlay.style.opacity = e.toFixed(3);       // velo entra
      drawParticles(e, Math.min(1, t * 1.6));     // particelle sempre più dense
      if (t < 1) { raf = requestAnimationFrame(frame); }
      else { running = false; go(); }
    }
    raf = requestAnimationFrame(frame);
  }

  /* ─── Metà ENTRATA ──────────────────────────────────────────── */
  function runEnter() {
    buildOverlay();
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1'; // parte COPERTO (lo sfondo CSS copre subito)

    if (liteNow()) {
      animateVeil(1, 0, DUR_FADE, hideOverlay);
      return;
    }

    seed();
    var token = ++animToken; running = true;
    var start = performance.now();
    function frame(now) {
      if (!running || token !== animToken) return;
      var t = Math.min(1, (now - start) / DUR_ENTER);
      var e = easeWow(t);
      overlay.style.opacity = (1 - e).toFixed(3);     // velo si dissolve
      drawParticles(1 - e, Math.max(0, 1 - t * 1.1));  // particelle si disperdono
      if (t < 1) { raf = requestAnimationFrame(frame); }
      else { running = false; hideOverlay(); }
    }
    raf = requestAnimationFrame(frame);
  }

  // dissolvenza semplice del solo velo (modalità sobria) — interrompibile
  // come i loop pesanti: usa animToken + running così un nuovo run o un
  // hideOverlay/visibilitychange la fermano (niente loop concorrenti).
  function animateVeil(from, to, dur, done) {
    var token = ++animToken; running = true;
    var start = performance.now();
    function step(now) {
      if (!running || token !== animToken) return;
      var t = Math.min(1, (now - start) / dur);
      overlay.style.opacity = (from + (to - from) * t).toFixed(3);
      if (t < 1) { raf = requestAnimationFrame(step); }
      else { running = false; if (done) done(); }
    }
    raf = requestAnimationFrame(step);
  }

  function hideOverlay() {
    running = false; animToken++; // invalida ogni loop in corso
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (!overlay) return;
    overlay.style.opacity = '0';
    overlay.style.visibility = 'hidden';
    if (ctx) ctx.clearRect(0, 0, W, H);
  }

  /* ─── Intercettazione clic sui link interni ─────────────────── */
  function shouldIntercept(a, e) {
    if (!a || leaving) return false;
    if (e.defaultPrevented) return false;
    if (e.button !== 0) return false;                                   // solo click sinistro
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false; // apri-in-nuova-scheda
    if (a.hasAttribute('download')) return false;
    if (a.hasAttribute('data-no-transition')) return false;             // opt-out esplicito
    var target = a.getAttribute('target');
    if (target && target !== '_self') return false;                     // _blank ecc.
    var rel = (a.getAttribute('rel') || '').toLowerCase();
    if (rel.indexOf('external') !== -1) return false;
    var raw = a.getAttribute('href');
    if (!raw || raw.charAt(0) === '#') return false;                    // ancora pura
    // schemi non-http (mailto:, tel:, wa.me passa per origin)
    if (/^(mailto:|tel:|sms:|javascript:|blob:|data:)/i.test(raw)) return false;
    var url;
    try { url = new URL(a.href, window.location.href); } catch (err) { return false; }
    if (url.origin !== window.location.origin) return false;            // esterno (incl. wa.me)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    // stessa pagina (solo hash / identica): lascia il comportamento nativo
    var here = window.location.pathname.replace(/\/+$/, '');
    var there = url.pathname.replace(/\/+$/, '');
    if (there === here && url.search === window.location.search) return false;
    return true;
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!shouldIntercept(a, e)) return;
    e.preventDefault();
    runExit(a.href);
  }, false);

  /* ─── Avvio entrata sul caricamento pagina ──────────────────── */
  // La home al primo paint è coperta dal proprio loader (z-index 9999):
  // niente entrata, per non sovrapporre due veli.
  function homeLoaderActive() {
    return document.documentElement.classList.contains('has-js') &&
      document.body && document.body.classList.contains('home') &&
      document.querySelector('.home-loader') && !reduceNow();
  }

  // Appena lo script gira (defer → DOM pronto, PRIMA del 'load'): se
  // arriviamo da una navigazione interna copriamo subito e disperdiamo.
  // Non aspettiamo 'pageshow'/'load' — eviterebbe il flash "pagina già
  // visibile → coperta → svelata".
  function startEnterIfNeeded() {
    if (!flagGet()) return;          // atterraggio diretto / refresh: niente entrata
    flagClear();
    if (homeLoaderActive()) return;  // la home è coperta dal suo loader (no doppio velo)
    runEnter();
  }
  if (document.body) startEnterIfNeeded();
  else document.addEventListener('DOMContentLoaded', startEnterIfNeeded);

  // Ritorno da bfcache: la pagina è ripristinata com'era → assicura che
  // l'overlay non resti incollato sullo schermo.
  window.addEventListener('pageshow', function (e) {
    if (e && e.persisted) { leaving = false; hideOverlay(); flagClear(); }
  });

  /* ─── Pausa quando la tab è nascosta ────────────────────────── */
  // Se la tab si nasconde a metà transizione fermiamo il loop. Al ritorno,
  // se stavamo entrando (non uscendo), scopriamo subito: niente animazione
  // a scatti dopo una pausa lunga. L'uscita è coperta dal safety timeout.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; }
      // se stavamo USCENDO, tieni la pagina coperta fino al safety timeout
      // (niente velo a metà): la nuvola era già quasi piena.
      if (leaving && overlay) overlay.style.opacity = '1';
    } else if (overlay && overlay.style.visibility === 'visible' && !leaving && !running) {
      hideOverlay(); // entrata interrotta: scopri subito, niente scatti
    }
  });

  /* ─── Resize: riadatta il canvas se l'overlay è in uso ──────── */
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (overlay && overlay.style.visibility === 'visible') sizeCanvas(); }, 200);
  }, { passive: true });
})();
