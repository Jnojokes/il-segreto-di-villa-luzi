/* ═══════════════════════════════════════════════════════════════════
   ORB · sfera 3D delle business unit (solo HOME)
   ZERO dipendenze. Tag-cloud sferico con CSS 3D transforms guidate
   da un singolo RAF. Auto-rotazione dolce + drag/hover per esplorare.
   - Markup statico: <ul.orb-world> con <li><a.orb-node> già nel DOM
     (quindi no-JS = lista/griglia accessibile, vedi orb.css).
   - JS = upgrade: dispone i nodi sulla sfera (distribuzione di
     Fibonacci) e li anima.
   - I nodi sono NAVIGAZIONE PURA verso le sezioni reali del sito: il
     clic naviga (con la transizione di transition.js). Nessun concierge.
   - Hover (puntatore fine): apre una "card" con l'anteprima foto della
     sezione (data-cover). Su touch / reduced-motion: solo il tap che naviga.
   - Base/piedistallo (CSS) che regge la sfera mentre ruota, e pulviscolo
     sognante attorno (canvas, stesso RAF della sfera).
   - Pausa su visibilitychange / quando fuori viewport.
   - prefers-reduced-motion / Save-Data / no-3D → resta griglia statica.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var stage = document.querySelector('.orb-stage');
  if (!stage) return;

  var world = stage.querySelector('.orb-world');
  if (!world) return;

  var nodes = Array.prototype.slice.call(world.querySelectorAll('.orb-node'));
  if (!nodes.length) return;

  /* ── 1) I nodi sono NAVIGAZIONE PURA verso le sezioni reali della villa:
     nessun trigger del concierge. Il clic naviga normalmente (con la
     transizione di pagina gestita da transition.js). ── */

  /* ── 2) Guardie: quando NON attivare la sfera (resta griglia) ── */
  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  var saveData = false;
  try {
    var conn = navigator.connection || navigator.webkitConnection;
    if (conn && conn.saveData) saveData = true;
  } catch (e) {}

  // serve il supporto a transform-style:preserve-3d
  var supports3D = false;
  try {
    supports3D = window.CSS && CSS.supports &&
      (CSS.supports('transform-style', 'preserve-3d') ||
       CSS.supports('-webkit-transform-style', 'preserve-3d'));
  } catch (e) {}

  // niente sfera su touch-coarse stretto? la teniamo: degrada bene.
  if (reduceMotion || saveData || !supports3D) {
    return; // upgrade non applicato → griglia statica del CSS
  }

  // puntatore fine (mouse/trackpad) con hover: abilita l'anteprima foto.
  var finePointer = false;
  try {
    finePointer = window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch (e) {}

  /* ── 3) Disposizione sferica (spirale di Fibonacci) ── */
  var N = nodes.length;
  var radius = 200; // px; ridotto su mobile più sotto
  function computeRadius() {
    var w = stage.clientWidth || 560;
    radius = Math.max(130, Math.min(220, w * 0.40));
  }
  computeRadius();

  var points = []; // {x,y,z} unitari sulla sfera
  var golden = Math.PI * (3 - Math.sqrt(5)); // ~2.39996, angolo aureo
  for (var i = 0; i < N; i++) {
    var y = 1 - (i / Math.max(1, (N - 1))) * 2; // da +1 a -1
    var r = Math.sqrt(Math.max(0, 1 - y * y));
    var theta = golden * i;
    points.push({
      x: Math.cos(theta) * r,
      y: y,
      z: Math.sin(theta) * r
    });
  }

  /* ── 4) Stato rotazione ── */
  var rotX = -0.18;     // leggera inclinazione iniziale
  var rotY = 0;
  var velX = 0;
  var velY = 0.0016;    // auto-rotazione dolce (rad/frame)
  var autoVelY = 0.0016;

  var dragging = false;
  var lastPX = 0, lastPY = 0;
  var pointerInside = false;

  /* ── 5) Attiva la modalità sfera (CSS) ── */
  stage.classList.add('is-orb');

  /* ── 5a) ANTEPRIMA FOTO al hover: una "card" che si apre al centro della
     sfera (scala + fade). Solo puntatore fine; su touch resta il tap. ── */
  var preview = null, previewImg = null, previewCap = null, previewKey = '';
  function showPreview(cover, label) {
    if (!preview || !cover) return;
    if (previewKey !== cover) {
      previewKey = cover;
      previewImg.src = cover;
      previewImg.alt = 'Anteprima · ' + label;
      previewCap.textContent = label;
    }
    preview.classList.add('is-on');
  }
  function hidePreview() { if (preview) preview.classList.remove('is-on'); }
  if (finePointer) {
    preview = document.createElement('div');
    preview.className = 'orb-preview';
    preview.setAttribute('aria-hidden', 'true');
    previewImg = document.createElement('img');
    previewImg.setAttribute('loading', 'lazy');
    previewImg.setAttribute('decoding', 'async');
    previewImg.alt = '';
    var pFrame = document.createElement('span');
    pFrame.className = 'orb-preview-frame';
    pFrame.setAttribute('aria-hidden', 'true');
    previewCap = document.createElement('span');
    previewCap.className = 'orb-preview-cap';
    preview.appendChild(previewImg);
    preview.appendChild(pFrame);
    preview.appendChild(previewCap);
    stage.appendChild(preview);
    nodes.forEach(function (a) {
      var cover = a.getAttribute('data-cover');
      if (!cover) return;
      var lab = (a.querySelector('.orb-label') || a).textContent;
      a.addEventListener('pointerenter', function () { showPreview(cover, lab); });
      a.addEventListener('pointerleave', hidePreview);
      a.addEventListener('focus', function () { showPreview(cover, lab); });
      a.addEventListener('blur', hidePreview);
    });
  }

  /* ── 5b) PULVISCOLO SOGNANTE attorno alla sfera: canvas decorativo dietro
     ai nodi, animato nello STESSO RAF della sfera. Cap sul numero, DPR cap 2,
     deriva lenta verso l'alto + twinkle morbido. Si crea solo qui (sfera
     attiva ⇒ già escluso reduced-motion / Save-Data). ── */
  var dust = document.createElement('canvas');
  dust.className = 'orb-dust';
  dust.setAttribute('aria-hidden', 'true');
  stage.insertBefore(dust, stage.firstChild);
  var dctx = dust.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var DW = 0, DH = 0, motes = [];
  var DUST_PALETTE = ['201,160,121', '234,114,117', '244,236,220']; // oro · corallo · avorio
  function sizeDust() {
    if (!dctx) return;
    DW = dust.clientWidth || stage.clientWidth || 560;
    DH = dust.clientHeight || stage.clientHeight || 560;
    dust.width = Math.round(DW * dpr);
    dust.height = Math.round(DH * dpr);
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function seedDust() {
    sizeDust();
    var n = Math.min(70, Math.round((DW * DH) / 6500));
    motes = [];
    for (var i = 0; i < n; i++) {
      motes.push({
        x: Math.random() * DW, y: Math.random() * DH,
        r: 0.6 + Math.random() * 2.0,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -0.04 - Math.random() * 0.15,
        a: 0.10 + Math.random() * 0.32,
        tw: 0.005 + Math.random() * 0.02, ph: Math.random() * 6.2832,
        t: DUST_PALETTE[(Math.random() * DUST_PALETTE.length) | 0]
      });
    }
  }
  function drawDust() {
    if (!dctx) return;
    dctx.clearRect(0, 0, DW, DH);
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      m.x += m.vx; m.y += m.vy; m.ph += m.tw;
      if (m.y < -6) { m.y = DH + 6; m.x = Math.random() * DW; }
      if (m.x < -6) m.x = DW + 6; else if (m.x > DW + 6) m.x = -6;
      var al = m.a * (0.55 + 0.45 * Math.sin(m.ph));
      if (al <= 0.003) continue;
      dctx.beginPath();
      dctx.arc(m.x, m.y, m.r, 0, 6.2832);
      dctx.fillStyle = 'rgba(' + m.t + ',' + al.toFixed(3) + ')';
      dctx.shadowBlur = m.r * 5;
      dctx.shadowColor = 'rgba(' + m.t + ',' + (al * 0.8).toFixed(3) + ')';
      dctx.fill();
    }
    dctx.shadowBlur = 0;
  }
  seedDust();

  /* ── 6) Interazione: drag (pointer) + hover slow-down ── */
  function onPointerDown(e) {
    dragging = true;
    stage.setPointerCapture && e.pointerId != null &&
      stage.setPointerCapture(e.pointerId);
    lastPX = e.clientX;
    lastPY = e.clientY;
  }
  function onPointerMove(e) {
    pointerInside = true;
    if (!dragging) return;
    var dx = e.clientX - lastPX;
    var dy = e.clientY - lastPY;
    lastPX = e.clientX;
    lastPY = e.clientY;
    velY = dx * 0.0009;
    velX = -dy * 0.0009;
    rotY += velY;
    rotX += velX;
  }
  function onPointerUp() {
    dragging = false;
  }
  function onEnter() { pointerInside = true; }
  function onLeave() { pointerInside = false; }

  stage.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointerenter', onEnter);
  stage.addEventListener('pointerleave', onLeave);

  // tastiera/focus: quando un nodo riceve focus, fermiamo la deriva
  // così resta leggibile (non lo "portiamo" davanti per evitare
  // movimenti bruschi/layout shift).
  var focusHeld = false;
  world.addEventListener('focusin', function () { focusHeld = true; });
  world.addEventListener('focusout', function () { focusHeld = false; });

  /* ── 7) Loop RAF unico ── */
  var running = true;
  var rafId = 0;
  var halfW = 0, halfH = 0;

  function render() {
    rafId = 0;
    if (!running) return;

    // deriva automatica quando non si interagisce
    if (!dragging) {
      if (pointerInside || focusHeld) {
        // rallenta quasi a fermo mentre si esplora/legge
        velY += (autoVelY * 0.15 - velY) * 0.06;
        velX += (0 - velX) * 0.08;
      } else {
        // torna alla velocità d'auto-rotazione
        velY += (autoVelY - velY) * 0.04;
        velX += (0 - velX) * 0.06;
      }
      rotY += velY;
      rotX += velX;
    }

    // clamp inclinazione verticale per non capovolgere la sfera
    if (rotX > 0.6) rotX = 0.6;
    if (rotX < -0.6) rotX = -0.6;

    var sinY = Math.sin(rotY), cosY = Math.cos(rotY);
    var sinX = Math.sin(rotX), cosX = Math.cos(rotX);

    for (var i = 0; i < N; i++) {
      var p = points[i];
      // rotazione attorno a Y
      var x1 = p.x * cosY - p.z * sinY;
      var z1 = p.x * sinY + p.z * cosY;
      // rotazione attorno a X
      var y2 = p.y * cosX - z1 * sinX;
      var z2 = p.y * sinX + z1 * cosX;

      var tx = x1 * radius;
      var ty = y2 * radius;
      var tz = z2 * radius;

      // profondità normalizzata: -1 (dietro) → +1 (davanti)
      var depth = z2;
      // scala e opacità per dare profondità (i dietro più piccoli/tenui)
      var scale = 0.62 + (depth + 1) * 0.5 * 0.46; // ~0.62..1.08
      var opacity = 0.34 + (depth + 1) * 0.5 * 0.66; // ~0.34..1.0

      var li = nodes[i].parentNode;
      li.style.setProperty('--tx', tx.toFixed(1) + 'px');
      li.style.setProperty('--ty', ty.toFixed(1) + 'px');
      li.style.setProperty('--tz', tz.toFixed(1) + 'px');
      // z-index per il corretto ordine di stacking del click
      li.style.zIndex = String(1000 + Math.round(tz));

      nodes[i].style.setProperty('--node-scale', scale.toFixed(3));
      nodes[i].style.setProperty('--node-opacity', opacity.toFixed(3));
      // i nodi molto dietro non catturano il puntatore
      nodes[i].style.pointerEvents = depth < -0.55 ? 'none' : 'auto';
    }

    drawDust(); // pulviscolo attorno alla sfera (stesso frame)

    rafId = requestAnimationFrame(render);
  }

  function start() {
    if (running && !rafId) rafId = requestAnimationFrame(render);
  }
  function stop() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }

  /* ── 8) Pausa: tab nascosta + fuori viewport ── */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    } else if (inView) {
      running = true; start();
    }
  });

  var inView = true;
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView && !document.hidden) { running = true; start(); }
      else { running = false; if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }
    }, { threshold: 0.05 });
    io.observe(stage);
  }

  /* ── 9) Resize: ricalcola il raggio + riadatta il pulviscolo ── */
  var rT = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () { computeRadius(); seedDust(); }, 150);
  });

  // via
  running = true;
  start();
})();
