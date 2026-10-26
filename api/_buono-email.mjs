/* ─────────────────────────────────────────────────────────────
   VILLA LUZI · api/_buono-email.mjs — l'email del buono
   «Pizza e bevanda». Il trattino basso tiene il file fuori dalle
   funzioni di Vercel: lo importa solo api/buono.mjs.

   L'email È il buono: il giovedì sera si mostra in sala dal
   telefono. Perciò il buono sta in cima, leggibile a colpo d'occhio
   da chi serve ai tavoli, e il resto (come si prenota, dove siamo)
   viene dopo. HTML da email: tabelle, stili in riga, Georgia di
   ripiego (Gmail non carica i webfont) e nessuna immagine necessaria
   per capire il buono, che si legge anche con le immagini bloccate.

   Solo fatti confermati da Luana il 23/10/2026: pizza e bevanda a
   18 €, il giovedì, a cena, solo con prenotazione. Quali pizze, quali
   bevande, se vale a persona e fino a quando non ci è stato detto:
   qui non si scrive.
   ───────────────────────────────────────────────────────────── */

const SITO = 'https://www.villaluzi1737.com';
const LOGO = SITO + '/assets/pizza-e-bevanda/email-logo-il-segreto.png';
const NUMERO = '393803643888';
const NUMERO_LEGGIBILE = '380 364 3888';
const MAPPA = 'https://maps.google.com/?q=Contrada+Chiaravalle+49,+62010+Treia+MC';

const INCHIOSTRO = '#0E3B3E';   // ottanio del brand
const INCHIOSTRO_TENUE = '#3E5F61';
const CARTA = '#F4ECDC';        // avorio
const BUONO = '#FBF7EE';

const SERIF = "Georgia,'Times New Roman',serif";
const TITOLO = "'Playfair Display',Georgia,'Times New Roman',serif";

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Il testo precompilato porta il codice: in chat si riconosce subito
// chi prenota col buono. Finisce aperto, con lo spazio, come sulle
// landing: chi scrive completa col numero di persone.
export function linkWhatsApp(codice) {
  const testo = `Buongiorno, ho il buono pizza e bevanda (codice ${codice}) e vorrei prenotare per giovedì. Saremo in `;
  return `https://wa.me/${NUMERO}?text=${encodeURIComponent(testo)}`;
}

export function emailBuono({ nome, codice }) {
  const oggetto = 'Il tuo buono: pizza e bevanda a 18 €';
  const anteprima = `Il giovedì sera mostra questa email in sala. Si prenota su WhatsApp al ${NUMERO_LEGGIBILE}.`;
  const wa = linkWhatsApp(codice);

  const testo = [
    `Ciao ${nome},`,
    'ecco il tuo buono.',
    '',
    'IL SEGRETO DI VILLA LUZI',
    'PIZZA E BEVANDA, 18 €',
    'Ogni giovedì, a cena. Solo con prenotazione.',
    `Codice del buono: ${codice}`,
    '',
    'Come si usa',
    `1. Prenota un giovedì su WhatsApp, al ${NUMERO_LEGGIBILE}:`,
    `   ${wa}`,
    '2. Il giovedì sera mostra questa email in sala.',
    '',
    'Il Segreto di Villa Luzi',
    'Contrada Chiaravalle, Passo di Treia (MC)',
    MAPPA,
    '',
    'Hai ricevuto questa email perché hai chiesto il buono su villaluzi1737.com.',
    'Per qualsiasi domanda rispondi a questa email.',
    'Villa Luzi, P.IVA 02184340434',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${esc(oggetto)}</title>
<!-- Playfair arriva solo nei client che caricano i webfont (Mail di
     Apple, iOS); altrove resta Georgia, scelta per reggere da sola. -->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&amp;display=swap" rel="stylesheet">
<style>
  :root { color-scheme: light only; supported-color-schemes: light only; }
  body { margin: 0; padding: 0; background: ${CARTA}; }
  a { color: ${INCHIOSTRO}; }
  @media (max-width: 480px) {
    .ai-lati { padding-left: 18px !important; padding-right: 18px !important; }
    .parola { font-size: 36px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${CARTA};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${esc(anteprima)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CARTA};">
<tr><td align="center" style="padding:28px 12px 36px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

  <tr><td align="center" style="padding:0 0 18px;">
    <img src="${LOGO}" width="104" height="112" alt="Il Segreto, Villa Luzi" style="display:block;border:0;outline:none;width:104px;height:auto;">
  </td></tr>

  <tr><td class="ai-lati" style="padding:0 26px 20px;font-family:${SERIF};font-size:18px;line-height:1.5;color:${INCHIOSTRO};">
    Ciao ${esc(nome)},<br>ecco il tuo buono.
  </td></tr>

  <!-- IL BUONO: doppia cornice come sulla stampa, il codice sotto la linea tratteggiata -->
  <tr><td style="padding:0 0 26px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BUONO};border:2px solid ${INCHIOSTRO};">
    <tr><td style="padding:5px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${INCHIOSTRO};">
        <tr><td align="center" style="padding:24px 16px 4px;font-family:${SERIF};font-size:12px;line-height:1.4;letter-spacing:4px;text-transform:uppercase;color:${INCHIOSTRO};">Il Segreto di Villa Luzi</td></tr>
        <tr><td align="center" class="parola" style="padding:12px 10px 0;font-family:${TITOLO};font-weight:900;font-size:42px;line-height:1.05;letter-spacing:1px;color:${INCHIOSTRO};">PIZZA</td></tr>
        <tr><td align="center" style="padding:2px 0 1px;font-family:${SERIF};font-style:italic;font-size:19px;line-height:1.2;color:${INCHIOSTRO};">e</td></tr>
        <tr><td align="center" class="parola" style="padding:0 10px 18px;font-family:${TITOLO};font-weight:900;font-size:42px;line-height:1.05;letter-spacing:1px;color:${INCHIOSTRO};">BEVANDA</td></tr>
        <tr><td align="center" style="padding:0 0 18px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="background:${INCHIOSTRO};border-radius:999px;padding:7px 28px 8px;font-family:${TITOLO};font-weight:900;font-size:30px;line-height:1.1;color:${CARTA};white-space:nowrap;">18&nbsp;€</td>
          </tr></table>
        </td></tr>
        <tr><td align="center" style="padding:0 12px 5px;font-family:${SERIF};font-size:14px;line-height:1.4;letter-spacing:3px;text-transform:uppercase;color:${INCHIOSTRO};">Ogni giovedì, a cena</td></tr>
        <tr><td align="center" style="padding:0 12px 22px;font-family:${SERIF};font-size:11px;line-height:1.4;letter-spacing:3px;text-transform:uppercase;color:${INCHIOSTRO_TENUE};">Solo con prenotazione</td></tr>
        <tr><td style="padding:0 16px;"><div style="border-top:1px dashed ${INCHIOSTRO};height:0;line-height:0;font-size:0;">&nbsp;</div></td></tr>
        <tr><td align="center" style="padding:14px 12px 20px;font-family:${SERIF};font-size:13px;line-height:1.5;color:${INCHIOSTRO_TENUE};">
          Codice del buono<br>
          <span style="font-family:'Courier New',Courier,monospace;font-size:24px;line-height:1.4;letter-spacing:4px;font-weight:bold;color:${INCHIOSTRO};">${esc(codice)}</span>
        </td></tr>
      </table>
    </td></tr>
    </table>
  </td></tr>

  <tr><td class="ai-lati" style="padding:0 26px;font-family:${SERIF};font-size:17px;line-height:1.55;color:${INCHIOSTRO};">
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Come si usa</p>
    <p style="margin:0 0 6px;">1. Prenota un giovedì su WhatsApp, al <span style="white-space:nowrap;">${NUMERO_LEGGIBILE}</span>.</p>
    <p style="margin:0 0 22px;">2. Il giovedì sera mostra questa email in sala.</p>
  </td></tr>

  <tr><td align="center" style="padding:0 0 30px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background:#25D366;border-radius:999px;">
        <a href="${esc(wa)}" style="display:inline-block;padding:14px 28px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#05301A;text-decoration:none;">Prenota su WhatsApp</a>
      </td>
    </tr></table>
  </td></tr>

  <tr><td align="center" class="ai-lati" style="padding:0 26px 26px;font-family:${SERIF};font-size:15px;line-height:1.6;color:${INCHIOSTRO};">
    Il Segreto di Villa Luzi<br>
    Contrada Chiaravalle, Passo di Treia (MC)<br>
    <a href="${MAPPA}" style="color:${INCHIOSTRO};">Apri in Google Maps</a>
  </td></tr>

  <tr><td align="center" class="ai-lati" style="padding:18px 26px 0;border-top:1px solid #D9CBAE;font-family:${SERIF};font-size:12px;line-height:1.6;color:${INCHIOSTRO_TENUE};">
    Hai ricevuto questa email perché hai chiesto il buono su villaluzi1737.com.<br>
    Per qualsiasi domanda rispondi a questa email.<br>
    Villa Luzi, P.IVA 02184340434
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  return { oggetto, html, testo };
}
