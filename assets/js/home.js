/* ════════════════════════════════════════════════════════════════
   VILLA LUZI · HOME.JS — "Cristallo & Tempo Sospeso"
   Caricato SOLO da index.html. Progressive enhancement puro:
   senza JS la home resta completa e leggibile. Tutto il moto è
   disattivato con prefers-reduced-motion; la polvere si spegne
   anche con Save-Data. Zero dipendenze.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData === true;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce) return; // niente moto: posters e layout statici

  // ─── Il tempo rallenta: i video di sfondo girano al ralenti ───
  function slowMo() {
    document.querySelectorAll('.hero-bg-img, .tile-vid').forEach(function (v) {
      if (v && v.tagName === 'VIDEO') { try { v.playbackRate = 0.6; } catch (e) {} }
    });
  }
  slowMo();
  document.addEventListener('loadeddata', slowMo, true);

  // ─── Loader cinematografico: conta 0→100% (il velo si solleva via CSS) ───
  var loaderCount = document.querySelector('.home-loader .loader-count');
  if (loaderCount) {
    var lStart = null;
    requestAnimationFrame(function lc(t) {
      if (lStart === null) lStart = t;
      var p = Math.min(1, (t - lStart) / 1500);
      loaderCount.textContent = Math.round(p * 100) + '%';
      if (p < 1) requestAnimationFrame(lc);
    });
  }

  // ─── Polvere luminosa (oro/corallo/avorio) sospesa nell'aria ───
  var atmos = document.querySelector('.home-atmos');
  if (atmos && !saveData) {
    var canvas = document.createElement('canvas');
    canvas.className = 'home-dust';
    canvas.setAttribute('aria-hidden', 'true');
    atmos.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, motes = [];
    var TINTS = ['201,168,106', '234,114,117', '244,236,220'];

    function rand(a, b) { return a + (b - a) * Math.random(); }

    function build() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // densità contenuta ("non troppo"): ~1 mote ogni 26k px², max 60
      var count = Math.min(60, Math.round((W * H) / 26000));
      motes = [];
      for (var i = 0; i < count; i++) {
        motes.push({
          x: Math.random() * W, y: Math.random() * H,
          r: rand(0.5, 1.9),
          vy: rand(-0.16, -0.05),       // salgono, lentissime
          vx: rand(-0.12, 0.12),
          a: rand(0.12, 0.5),
          tw: rand(0.004, 0.014),       // twinkle
          ph: Math.random() * Math.PI * 2,
          tint: TINTS[(Math.random() * TINTS.length) | 0]
        });
      }
    }

    var running = true;
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.x += m.vx; m.y += m.vy; m.ph += m.tw;
        if (m.y < -6) { m.y = H + 6; m.x = Math.random() * W; }
        if (m.x < -6) m.x = W + 6; else if (m.x > W + 6) m.x = -6;
        var tw = 0.55 + 0.45 * Math.sin(m.ph);
        var alpha = m.a * tw;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + m.tint + ',' + alpha.toFixed(3) + ')';
        ctx.shadowBlur = m.r * 4; ctx.shadowColor = 'rgba(' + m.tint + ',' + (alpha * 0.8).toFixed(3) + ')';
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      requestAnimationFrame(frame);
    }

    build();
    requestAnimationFrame(frame);
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 200); }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(frame);
    });
  }

  // ─── Card di cristallo: tilt 3D + riflesso che segue il puntatore ───
  if (finePointer) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      var raf = null, rect = null;
      function onMove(e) {
        if (!rect) rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;   // 0..1
        var py = (e.clientY - rect.top) / rect.height;   // 0..1
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var max = 5.5;
          card.style.setProperty('--ry', ((px - 0.5) * 2 * max).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - py) * 2 * max).toFixed(2) + 'deg');
          card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
          raf = null;
        });
      }
      function reset() {
        rect = null;
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      }
      card.addEventListener('pointerenter', function () { rect = card.getBoundingClientRect(); });
      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerleave', reset);
    });
  }

  // ─── Hero image-sequence: il canvas disegna i fotogrammi reali sullo scroll ───
  // (frame estratti dal video reale → scrub affidabile, ripinge sempre, 60fps)
  var heroCanvas = document.querySelector('.hero-canvas');
  var heroSec = document.querySelector('.hero');
  var heroInner = document.querySelector('.hero .hero-inner');
  var heroPoster = document.querySelector('.hero-poster');
  var FRAMES = 60, imgs = [], cctx = null, cW = 0, cH = 0, drawn = false;
  var cdpr = Math.min(window.devicePixelRatio || 1, 2);
  var natW = 1152, natH = 648;
  if (heroCanvas) {
    cctx = heroCanvas.getContext('2d');
    for (var fi = 1; fi <= FRAMES; fi++) {
      var im = new Image();
      im.decoding = 'async';
      im.src = '/assets/img/hero-frames/f' + String(fi).padStart(3, '0') + '.webp';
      im.onload = function () { if (this.naturalWidth) { natW = this.naturalWidth; natH = this.naturalHeight; } drawHeroFrame(); };
      imgs.push(im);
    }
    sizeHeroCanvas();
    window.addEventListener('resize', function () { sizeHeroCanvas(); drawHeroFrame(); }, { passive: true });
  }
  function sizeHeroCanvas() {
    if (!heroCanvas || !cctx) return;
    var r = heroCanvas.getBoundingClientRect();
    cW = Math.max(1, r.width); cH = Math.max(1, r.height);
    heroCanvas.width = Math.round(cW * cdpr); heroCanvas.height = Math.round(cH * cdpr);
    cctx.setTransform(cdpr, 0, 0, cdpr, 0, 0);
  }
  function heroProgress() {
    if (!heroSec) return 0;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var total = heroSec.offsetHeight - vh;
    return total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
  }
  function drawHeroFrame() {
    if (!cctx) return;
    if (cW < 2 || cH < 2) sizeHeroCanvas();
    var p = heroProgress();
    if (heroInner) heroInner.style.opacity = Math.max(0, 1 - p * 1.25).toFixed(2); /* fade sempre, anche se i frame non sono pronti */
    var idx = Math.min(FRAMES - 1, Math.max(0, Math.round(p * (FRAMES - 1))));
    var img = imgs[idx];
    if (!img || !img.complete || !img.naturalWidth) {
      for (var k = idx; k >= 0; k--) { if (imgs[k] && imgs[k].complete && imgs[k].naturalWidth) { img = imgs[k]; break; } }
    }
    if (!img || !img.naturalWidth) return;
    var zoom = 1 + p * 0.14;
    var scale = Math.max(cW / natW, cH / natH) * zoom;
    var dw = natW * scale, dh = natH * scale;
    cctx.clearRect(0, 0, cW, cH);
    cctx.drawImage(img, (cW - dw) / 2, (cH - dh) / 2, dw, dh);
    /* il poster resta come base sotto: il canvas opaco lo copre quando disegna,
       così non si vede mai "vuoto" se i frame sono lenti a caricare. */
  }

  // ─── Tempo sospeso: drift parallasse + scroll-cue + sezione pinned ───
  var drifts = document.querySelectorAll('[data-drift]');
  var cue = document.querySelector('.home-scrollcue');
  var pin = document.querySelector('.home-pin');
  var pinStage = pin && pin.querySelector('.home-pin-stage');
  var pinWords = pin ? pin.querySelectorAll('.home-pin-line span') : [];

  function updatePin() {
    if (!pin || !pinStage) return;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var total = pin.offsetHeight - vh;
    var p = total > 0 ? Math.min(1, Math.max(0, -pin.getBoundingClientRect().top / total)) : 0;
    pinStage.style.setProperty('--p', p.toFixed(3));
    var active = Math.round(p * pinWords.length);
    for (var i = 0; i < pinWords.length; i++) pinWords[i].classList.toggle('on', i < active);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || 0;
      drifts.forEach(function (el) {
        var f = parseFloat(el.getAttribute('data-drift')) || 0.12;
        el.style.transform = 'translate3d(0,' + (y * f).toFixed(1) + 'px,0)';
      });
      if (cue) cue.style.opacity = String(Math.max(0, 1 - y / 260));
      updatePin();
      drawHeroFrame();
      ticking = false;
    });
  }
  if (drifts.length || cue || pin || heroCanvas) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }
})();

/* ─── CONCIERGE INVITE · le bolle aprono il concierge con l'intento giusto ───
   Le bolle sono <a> con href reale: senza JS (o senza concierge) navigano;
   con VLConcierge disponibile il click apre il dock con l'intento
   preselezionato. Il link di chiusura (data-concierge-open) apre lo Step 0. */
(function () {
  var invite = document.querySelector('.concierge-invite');
  if (!invite) return;
  invite.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-intent], [data-concierge-open]');
    if (!trigger || !window.VLConcierge) return;
    e.preventDefault();
    window.VLConcierge.open(trigger.getAttribute('data-intent') || null);
  });
})();
