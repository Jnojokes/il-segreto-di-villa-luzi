/* ════════════════════════════════════════════════════════════════
   VILLA LUZI · LEAD-FORM.JS — raccolta contatti per EVENTI e MATRIMONI.
   Vanilla, zero dipendenze, IIFE. Stesso pattern "zero-backend" della
   pagina White Party: endpoint configurabile (Google Apps Script o
   Formspree) in UN solo punto qui sotto.

   - Funziona per ogni <form class="lead-form"> presente nella pagina.
   - Validazione lato client, honeypot anti-spam, stati successo/errore.
   - Il ristorante NON usa questo form: resta su WhatsApp (vedi concierge).
   - Il lead non deve MAI bloccare l'utente: se l'invio fallisce o
     l'endpoint è vuoto, la conferma appare comunque e restano WhatsApp/email.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ══════════════ CONFIGURAZIONE — UNICO PUNTO DA EDITARE ══════════════
     Incolla qui l'endpoint del servizio scelto. I lead arrivano a
     villaluzi1737@gmail.com tramite quel servizio.
       Google Apps Script:  'https://script.google.com/macros/s/XXXX/exec'
       Formspree:           'https://formspree.io/f/XXXX'
     Se resta vuoto, il form mostra comunque la conferma (canale di
     riserva: WhatsApp / email mostrati sotto al form).            */
  var LEAD_ENDPOINT = '';
  /* ════════════════════════════════════════════════════════════════ */

  var forms = document.querySelectorAll('form.lead-form');
  if (!forms.length) return;

  function emailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function telOk(v) { return /^[+\d][\d\s.\/()-]{5,}$/.test(v); }

  function send(endpoint, data) {
    if (!endpoint) return;
    try {
      // text/plain evita il preflight CORS (compatibile con Google Apps Script)
      fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      }).catch(function () { /* il lead non blocca mai l'utente */ });
    } catch (e) { /* idem */ }
  }

  Array.prototype.forEach.call(forms, function (form) {
    var status = form.querySelector('.lead-status');
    function get(name) { var f = form.querySelector('[name="' + name + '"]'); return f ? String(f.value).trim() : ''; }
    function fail(msg, name) {
      if (status) { status.className = 'lead-status is-error'; status.textContent = msg; }
      var f = name && form.querySelector('[name="' + name + '"]');
      if (f && f.focus) f.focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // honeypot: se compilato, è un bot → finta conferma, nessun invio
      var hp = form.querySelector('.lead-hp input');
      if (hp && hp.value) return;

      var nome = get('nome'), email = get('email'), tel = get('telefono');
      var consenso = form.querySelector('[name="consenso"]');

      if (!nome) return fail('Ci serve il vostro nome.', 'nome');
      if (!emailOk(email)) return fail('Controllate l’indirizzo email.', 'email');
      if (!telOk(tel)) return fail('Controllate il numero di telefono.', 'telefono');
      if (consenso && !consenso.checked) { return fail('Serve il consenso per potervi ricontattare.', 'consenso'); }

      if (status) { status.className = 'lead-status'; status.textContent = ''; }

      send(LEAD_ENDPOINT, {
        context: form.getAttribute('data-lead-context') || 'evento',
        pagina: location.pathname,
        nome: nome,
        email: email,
        telefono: tel,
        data_periodo: get('data'),
        tipo: get('tipo'),
        ospiti: get('ospiti'),
        messaggio: get('messaggio'),
        consenso: true,
        inviato: new Date().toISOString()
      });

      // conferma all'utente + blocco campi
      var ok = form.getAttribute('data-lead-success') ||
        'Grazie: la vostra richiesta è arrivata. Vi ricontattiamo al più presto.';
      Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea, button'),
        function (el) { el.disabled = true; });
      if (status) { status.className = 'lead-status is-ok'; status.textContent = ok; }
    });
  });
})();
