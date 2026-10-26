/* ─────────────────────────────────────────────────────────────
   VILLA LUZI · api/buono.mjs — il buono «Pizza e bevanda» via email.

   /pizza-e-bevanda/ manda qui nome ed email. La funzione (Vercel,
   runtime Node, zero dipendenze: la REST di Resend con fetch) li
   controlla, calcola il codice del buono e spedisce l'email da
   buono@villaluzi1737.com. Il giovedì sera chi viene a cena la
   mostra in sala: è la prova che ha visto l'offerta.

   Variabile d'ambiente (Vercel → Settings → Environment Variables):
     RESEND_API_KEY  chiave dell'account Resend di Villa Luzi
                     (villaluzi1737@gmail.com), con villaluzi1737.com
                     verificato nella regione eu-west-1 (Irlanda).

   Risponde in JSON alla pagina (fetch) e in HTML al modulo spedito
   senza JavaScript: il buono arriva comunque.

   Piano free di Resend: 100 email al giorno (giorno UTC) e 3.000 al
   mese. Oltre, Resend risponde 429 daily_quota_exceeded e la pagina
   dice di riprovare domani o di prenotare su WhatsApp. Dalle 80
   email in un giorno il log di Vercel lo segnala.
   ───────────────────────────────────────────────────────────── */
import { createHash } from 'node:crypto';
import { emailBuono } from './_buono-email.mjs';

const RESEND = 'https://api.resend.com/emails';
const MITTENTE = 'Il Segreto di Villa Luzi <buono@villaluzi1737.com>';
const RISPOSTE = 'villaluzi1737@gmail.com';
const PAGINA = '/pizza-e-bevanda/';
const NUMERO_LEGGIBILE = '380 364 3888';
const WHATSAPP = 'https://wa.me/393803643888?text=' +
  encodeURIComponent('Buongiorno, vorrei prenotare per giovedì con il buono pizza e bevanda. Saremo in ');

// Solo il sito, le anteprime Vercel del progetto e il server locale.
// Non ferma chi scrive uno script (l'header si falsifica): ferma il
// modulo copiato su un altro sito per spedire email a nome della villa.
const ORIGINI = /^(?:https:\/\/(?:www\.villaluzi1737\.com|il-segreto-di-villa-luzi(?:-[a-z0-9-]+)?\.vercel\.app)|http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?)$/;

// Il testo che vede chi compila sta qui e solo qui: la pagina mostra
// `messaggio` così com'è, il ripiego senza JavaScript pure.
const MESSAGGI = {
  inviato: (email) => `Il buono sta arrivando a ${email}. Se tra qualche minuto non lo vedi, guarda in Spam o in Promozioni.`,
  gia_inviato: (email) => `Il buono è già partito oggi per ${email}: cercalo nella posta, anche in Spam o in Promozioni.`,
  nome: () => 'Scrivi il tuo nome, solo con lettere.',
  email: () => "Controlla l'indirizzo email: sembra incompleto.",
  email_rifiutata: () => 'Questo indirizzo email non è valido: controllalo e riprova.',
  troppe: () => 'Troppe richieste in poco tempo: riprova tra qualche minuto.',
  quota: () => `Oggi non riusciamo a mandare altri buoni via email: riprova domani, oppure prenota su WhatsApp al ${NUMERO_LEGGIBILE}.`,
  guasto: () => `Non siamo riusciti a mandare il buono. Riprova tra qualche minuto, oppure prenota su WhatsApp al ${NUMERO_LEGGIBILE}.`,
  origine: () => 'Richiesta non ammessa.',
};
const HTTP = { inviato: 200, gia_inviato: 200, nome: 400, email: 400, email_rifiutata: 400, troppe: 429, quota: 503, guasto: 502, origine: 403 };

// ── controlli ──

// Lettere (anche accentate), spazi, apostrofi, trattini e punti, ma mai
// un punto attaccato a una lettera: il nome finisce in un'email spedita
// dal dominio della villa e Gmail trasforma «premio.it» in un link.
function pulisciNome(valore) {
  const nome = String(valore ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
  if (nome.length < 1 || nome.length > 40) return null;
  if (!/^[\p{L}\p{M}][\p{L}\p{M}'’ .-]*$/u.test(nome)) return null;
  if (/\.[\p{L}\p{M}]/u.test(nome)) return null;
  return nome;
}

function pulisciEmail(valore) {
  const email = String(valore ?? '').trim().toLowerCase();
  if (email.length < 6 || email.length > 254) return null;
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,24}$/.test(email)
    ? email
    : null;
}

function origineAmmessa(request) {
  const origine = request.headers.get('origin');
  if (origine) return ORIGINI.test(origine);
  const da = request.headers.get('referer');
  if (!da) return false;
  try { return ORIGINI.test(new URL(da).origin); } catch { return false; }
}

// Freno per indirizzo IP, in memoria: Fluid compute riusa l'istanza, quindi
// tiene finché l'istanza vive. Largo apposta (dieci richieste in dieci
// minuti): sotto la stessa rete mobile possono stare persone diverse.
const FINESTRA = 10 * 60 * 1000;
const MASSIMO = 10;
const richieste = new Map();
function troppe(request) {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'ignoto';
  const ora = Date.now();
  const recenti = (richieste.get(ip) || []).filter((t) => ora - t < FINESTRA);
  recenti.push(ora);
  if (richieste.size > 5000) richieste.clear();
  richieste.set(ip, recenti);
  return recenti.length > MASSIMO;
}

// ── il buono ──

const impronta = (s) => createHash('sha256').update(s).digest();

// Sei caratteri da un alfabeto senza sosia (niente 0/O, 1/I/L, 2/Z, 5/S,
// 8/B, 6/G), ricavati dall'email: chi chiede il buono due volte ritrova lo
// stesso codice, e in sala si legge senza dubbi anche da uno schermo piccolo.
const ALFABETO = 'ACDEFHJKMNPRTUVWXY34679';
function codiceBuono(email) {
  const h = impronta('pizza-e-bevanda\n' + email);
  let c = '';
  for (let i = 0; i < 6; i++) c += ALFABETO[h[i] % ALFABETO.length];
  return c.slice(0, 3) + '-' + c.slice(3);
}

function giornoDiRoma() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// Una email al giorno per indirizzo: la chiave di idempotenza è email +
// giorno di Roma. Resend la ricorda 24 ore: lo stesso invio ripetuto
// (doppio tocco, rete che ritenta) non parte due volte; lo stesso
// indirizzo con un nome diverso risponde 409 ed è «già partito oggi».
// Così il modulo non diventa un modo per riempire la casella di qualcuno.
async function spedisci(nome, email) {
  const chiave = process.env.RESEND_API_KEY;
  if (!chiave) {
    console.error('[buono] RESEND_API_KEY mancante');
    return 'guasto';
  }
  const { oggetto, html, testo } = emailBuono({ nome, codice: codiceBuono(email) });
  const corpo = JSON.stringify({
    from: MITTENTE,
    to: [email],
    reply_to: RISPOSTE,
    subject: oggetto,
    html,
    text: testo,
    tags: [{ name: 'campagna', value: 'pizza-e-bevanda' }],
  });
  const idempotenza = `pizza-e-bevanda/${impronta(email).toString('hex').slice(0, 40)}/${giornoDiRoma()}`;

  for (let tentativo = 1; tentativo <= 2; tentativo++) {
    let r;
    try {
      r = await fetch(RESEND, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${chiave}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotenza,
        },
        body: corpo,
        signal: AbortSignal.timeout(10000),
      });
    } catch (e) {
      console.error(`[buono] Resend non raggiungibile (${e.name})`);
      if (tentativo === 1) { await pausa(700); continue; }
      return 'guasto';
    }

    if (r.ok) {
      const usate = Number(r.headers.get('x-resend-daily-quota'));
      if (usate >= 80) console.warn(`[buono] quota giornaliera Resend: ${usate} email su 100`);
      return 'inviato';
    }

    const errore = await r.json().catch(() => ({}));
    const tipo = String(errore.name || '');
    if (r.status === 409) return tipo === 'invalid_idempotent_request' ? 'gia_inviato' : 'inviato';
    if (r.status === 429 && /quota/.test(tipo)) {
      console.error(`[buono] Resend ${tipo}`);
      return 'quota';
    }
    if ((r.status === 429 || r.status >= 500) && tentativo === 1) { await pausa(1100); continue; }
    console.error(`[buono] Resend ${r.status} ${tipo}: ${String(errore.message || '').slice(0, 200)}`);
    if (r.status === 422 && /\bto\b/i.test(String(errore.message || ''))) return 'email_rifiutata';
    return 'guasto';
  }
  return 'guasto';
}

// ── risposte ──

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inJson(stato, email) {
  const ok = stato === 'inviato' || stato === 'gia_inviato';
  return Response.json(
    { ok, stato, messaggio: MESSAGGI[stato](email) },
    { status: HTTP[stato], headers: { 'Cache-Control': 'no-store' } },
  );
}

// Ripiego per il modulo spedito senza JavaScript: una pagina sola, sobria,
// con la stessa frase che la landing mostrerebbe sotto il bottone.
function inHtml(stato, email) {
  const ok = stato === 'inviato' || stato === 'gia_inviato';
  const titolo = ok ? 'Il buono è in arrivo' : 'Il buono non è partito';
  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${titolo} | Il Segreto di Villa Luzi</title>
<style>
body{margin:0;background:#F4ECDC;color:#0E3B3E;font:18px/1.55 Georgia,'Times New Roman',serif}
main{max-width:520px;margin:0 auto;padding:56px 22px;text-align:center}
.occhiello{font-size:12px;letter-spacing:.3em;text-transform:uppercase}
h1{font-size:30px;line-height:1.2;margin:14px 0 16px;font-weight:normal}
.wa{display:inline-block;margin-top:24px;padding:15px 26px;border-radius:999px;background:#25D366;color:#05301A;
  font:600 13px/1 system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.14em;text-transform:uppercase;text-decoration:none}
.torna{display:inline-block;margin-top:22px;color:#0E3B3E}
</style>
</head>
<body>
<main>
<p class="occhiello">Il Segreto di Villa Luzi</p>
<h1>${titolo}</h1>
<p>${esc(MESSAGGI[stato](email))}</p>
<a class="wa" href="${esc(WHATSAPP)}">Prenota su WhatsApp</a><br>
<a class="torna" href="${PAGINA}">${ok ? 'Torna alla pagina del buono' : 'Torna al modulo'}</a>
</main>
</body>
</html>`;
  return new Response(html, {
    status: HTTP[stato],
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// Il modulo pesa poche centinaia di byte: oltre gli 8 KB non viene dalla
// pagina, e si scarta. Si misura il testo letto e non l'header
// content-length, che con un invio a pezzi manca.
async function leggiCampi(request, json) {
  const testo = await request.text();
  if (testo.length > 8192) return {};
  if (json) {
    const dati = JSON.parse(testo);
    return dati && typeof dati === 'object' && !Array.isArray(dati) ? dati : {};
  }
  return Object.fromEntries(new URLSearchParams(testo));
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Solo POST.', { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
    }
    const json = (request.headers.get('content-type') || '').toLowerCase().includes('application/json');
    const rispondi = json ? inJson : inHtml;

    if (!origineAmmessa(request)) return rispondi('origine', '');

    let campi;
    try { campi = await leggiCampi(request, json); } catch { campi = {}; }

    const nome = pulisciNome(campi.nome);
    const email = pulisciEmail(campi.email);
    if (!nome) return rispondi('nome', '');
    if (!email) return rispondi('email', '');

    // Trappole per i bot: il campo «sito» è nascosto alle persone, e un
    // umano non apre la pagina e spedisce il modulo in meno di un secondo
    // (soglia bassa apposta: con l'autocompilazione del telefono si fa in
    // fretta, e chi ci cade crede di aver ricevuto il buono). Chi ci casca
    // riceve la stessa risposta di un invio riuscito, e nessuna email
    // parte. «t» manca solo nel modulo senza JavaScript.
    const tempo = campi.t == null || campi.t === '' ? null : Number(campi.t);
    if (String(campi.sito ?? '').trim() !== '' || (tempo !== null && !(tempo >= 1000))) {
      return rispondi('inviato', email);
    }

    if (troppe(request)) return rispondi('troppe', email);
    return rispondi(await spedisci(nome, email), email);
  },
};
