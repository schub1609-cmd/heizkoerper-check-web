// Auswahl von Bauart (mit Skizze) und Schätzung aus eigenen Richtwerten im Schnellcheck.
// Schreibt Normleistung, Normbedingung und Exponent in die vorhandenen Felder
// und merkt sich, woher die Werte stammen (für die Liste der Annahmen).

import { BAUARTEN, RICHTWERTE, QUELLEN } from './heizkoerper-daten.js';
import { skizze } from './heizkoerper-skizzen.js';
import { katalogNormleistung, STANDARD_EXPONENT_PLATTE } from './rechenkern.js';

const $ = (id) => document.getElementById(id);
const zahl = (w, s = 0) => w.toLocaleString('de-DE', { minimumFractionDigits: s, maximumFractionDigits: s });

const zustand = {
  bauart: null, // Objekt aus BAUARTEN
  modus: 'eingabe', // 'eingabe' | 'katalog' (Richtwert aus Maßen)
  exponentVonHand: false,
  katalog: null, // { tabelle, zeile, menge, QN }
};

/** Richtwert-Tabelle mit Zeilen für die gewählte Bauart (oder undefined). */
function passendeTabelle() {
  const typ = zustand.bauart?.katalogTyp;
  if (!typ) return undefined;
  return RICHTWERTE.find((t) => t.zeilen.some((z) => z[2] === typ));
}

function setzeFeld(id, wert) {
  $(id).value = wert;
}

function exponentText(n) {
  return zahl(n, 2).replace(/0$/, '');
}

/** Exponent mit Dezimalkomma, ohne überflüssige Nullen. */
function exponentGenau(n) {
  return String(n).replace('.', ',');
}

const jeGlied = (tabelle) => tabelle?.bezug === 'je_glied';

function zeichneBauarten() {
  const gruppen = new Map([
    ['Plattenheizkörper (Blick von oben, Wand oben)', BAUARTEN.filter((b) => b.platten)],
    ['Andere Bauarten', BAUARTEN.filter((b) => !b.platten)],
  ]);
  const knoten = [];
  for (const [gruppe, liste] of gruppen) {
    const titel = document.createElement('p');
    titel.className = 'bauart-gruppe';
    titel.textContent = gruppe;
    const reihe = document.createElement('div');
    reihe.className = 'bauart-reihe';
    for (const b of liste) {
      const label = document.createElement('label');
      label.className = 'bauart-kachel';
      label.innerHTML = `<input type="radio" name="bauart" value="${b.id}"><span class="bauart-bild">${skizze(b)}</span><span class="bauart-name">${b.kurz}</span>`;
      label.title = `${b.name}: ${b.beschreibung}`;
      reihe.append(label);
    }
    knoten.push(titel, reihe);
  }
  $('bauarten').replaceChildren(...knoten);
}

function zeigeBauartInfo() {
  const b = zustand.bauart;
  const info = $('bauart-info');
  if (!b) {
    info.textContent = 'Keine Bauart gewählt: Wir rechnen wie für einen Plattenheizkörper (Exponent 1,3).';
    return;
  }
  const spanne = `${exponentText(b.n_spanne[0])} bis ${exponentText(b.n_spanne[1])}`;
  info.textContent = `${b.beschreibung}. Exponent ${exponentText(b.n_standard)}`
    + (b.n_status === 'annahme' ? ' (Annahme' : ' (üblich')
    + `, laut Quellen ${spanne}).`;
}

/** Zeigt die Felder passend zur Bauart und füllt die Auswahl der Größen. */
function fuelleHoehen() {
  const tabelle = passendeTabelle();
  $('katalog-leer').hidden = Boolean(tabelle);
  $('katalog-felder').hidden = !tabelle;
  const sel = $('katalog-hoehe');
  const altText = sel.selectedOptions[0]?.textContent;
  const zeilen = tabelle ? tabelle.zeilen.map((z, i) => [z, i]).filter(([z]) => z[2] === zustand.bauart.katalogTyp) : [];
  const optionen = zeilen.map(([z, i]) => {
    let text = `${z[0]} mm`;
    if (z[1]) text += ` (Nabenabstand ${z[1]} mm)`;
    if (z[5]) text += `, Bautiefe ${z[5]} mm`;
    return new Option(text, String(i));
  });
  sel.replaceChildren(...optionen);
  const gleich = optionen.find((o) => o.textContent === altText);
  if (gleich) sel.value = gleich.value;
  else if (optionen.length) sel.value = optionen[Math.min(optionen.length - 1, jeGlied(tabelle) ? 0 : 3)].value;
  if (!tabelle) return;
  const glied = jeGlied(tabelle);
  const m = tabelle.menge;
  $('katalog-hoehe-label').textContent = glied ? 'Bauhöhe und Bautiefe' : 'Bauhöhe';
  $('katalog-menge-label').textContent = glied ? 'Anzahl der Glieder' : 'Baulänge';
  $('katalog-menge-einheit').textContent = glied ? 'Stück' : 'mm';
  $('katalog-laenge').placeholder = `${zahl(m.min)} bis ${zahl(m.max)}`;
  $('hilfe-katalog-laenge-text').textContent = glied
    ? `Zähle die Glieder (Rippen) des Heizkörpers. ${m.hinweis}.`
    : `Die Breite des Heizkörpers in Millimetern, ohne Ventile und Anschlüsse. ${m.hinweis}.`;
  $('katalog-herleitung').textContent = `So sind die Richtwerte entstanden: ${tabelle.herleitung}`;
}

/** Liest Größe und Länge bzw. Gliederzahl und schreibt den Richtwert für Q_N und n in die Felder. */
function uebernehmeKatalog() {
  const tabelle = passendeTabelle();
  $('qn').readOnly = Boolean(tabelle);
  $('norm').disabled = Boolean(tabelle);
  if (!tabelle) {
    // Für diese Bauart gibt es keine Richtwerte: Normleistung selbst eingeben.
    if (zustand.katalog) setzeFeld('qn', '');
    zustand.katalog = null;
    standardExponent(true);
    return;
  }
  const zeile = tabelle.zeilen[Number($('katalog-hoehe').value)];
  const roh = $('katalog-laenge').value.trim().replace(/\s/g, '').replace(/\.(?=\d{3}$)/, '').replace(',', '.');
  const menge = Number(roh);
  const fehler = $('fehler-katalog-laenge');
  fehler.textContent = '';
  $('katalog-laenge').setAttribute('aria-invalid', 'false');
  zustand.katalog = null;
  setzeFeld('qn', '');
  if (!zeile || zeile[2] !== zustand.bauart?.katalogTyp) return;
  const glied = jeGlied(tabelle);
  if (roh === '') {
    $('katalog-ergebnis').textContent = glied ? 'Gib die Anzahl der Glieder ein.' : 'Gib die Baulänge ein.';
    return;
  }
  const { min, max } = tabelle.menge;
  if (!Number.isFinite(menge) || menge < min || menge > max || (glied && !Number.isInteger(menge))) {
    fehler.textContent = glied
      ? `Bitte eine ganze Zahl von ${min} bis ${max} Gliedern eingeben.`
      : `Bitte eine Baulänge von ${zahl(min)} bis ${zahl(max)} mm eingeben.`;
    $('katalog-laenge').setAttribute('aria-invalid', 'true');
    $('katalog-ergebnis').textContent = '';
    return;
  }
  const [, , , n, q75] = zeile;
  const QN = katalogNormleistung(q75, tabelle.bezug, menge);
  zustand.katalog = { tabelle, zeile, menge, QN };
  setzeFeld('qn', zahl(QN));
  $('norm').value = '75/65/20';
  setzeFeld('exponent', exponentGenau(n));
  zustand.exponentVonHand = false;
  const rechnung = glied
    ? `${zahl(q75)} W je Glied × ${zahl(menge)} Glieder`
    : `${zahl(q75)} W/m × ${zahl(menge / 1000, 2)} m`;
  $('katalog-ergebnis').textContent = `Richtwert: ${rechnung} = ca. ${zahl(QN)} W bei 75/65/20 °C, Exponent ${exponentGenau(n)}.`;
}

function setzeModus(modus) {
  zustand.modus = modus;
  const katalog = modus === 'katalog';
  $('katalog').hidden = !katalog;
  if (katalog) {
    fuelleHoehen();
    uebernehmeKatalog();
  } else {
    if (zustand.katalog) setzeFeld('qn', '');
    zustand.katalog = null;
    $('qn').readOnly = false;
    $('norm').disabled = false;
    standardExponent();
  }
}

function standardExponent(auchImKatalog = false) {
  if (zustand.exponentVonHand || (zustand.modus === 'katalog' && !auchImKatalog)) return;
  const n = zustand.bauart ? zustand.bauart.n_standard : STANDARD_EXPONENT_PLATTE;
  setzeFeld('exponent', zahl(n, 2).replace(/0$/, ''));
}

/**
 * Hinweise zur Herkunft von Normleistung und Exponent für die Annahmen-Liste.
 * @param {number} nAktuell aktuell verwendeter Exponent
 * @returns {string[]}
 */
export function herkunftHinweise(nAktuell) {
  const punkte = [];
  const k = zustand.katalog;
  if (k) {
    const groesse = jeGlied(k.tabelle)
      ? `Bauhöhe ${k.zeile[0]} mm, Bautiefe ${k.zeile[5]} mm, ${zahl(k.menge)} Glieder`
      : `Typ ${k.zeile[2]}, Bauhöhe ${k.zeile[0]} mm, ${zahl(k.menge)} mm lang`;
    const quellen = k.tabelle.quellen.map((q) => QUELLEN[q].titel.split(':')[0]).join(', ');
    punkte.push(`Normleistung und Exponent geschätzt aus Bauart und Maßen (${groesse}): eigener Richtwert, hergeleitet aus Angaben von ${quellen}.`
      + (k.zeile[6] > 0 ? ` Die einzelnen Herstellerangaben weichen bis zu ${zahl(k.zeile[6])} % davon ab.` : '')
      + ' Dein Heizkörper kann davon abweichen. Mit dem Wert vom Typenschild oder Datenblatt wird das Ergebnis genauer.');
    return punkte;
  }
  const b = zustand.bauart;
  if (zustand.exponentVonHand) {
    punkte.push(`Exponent ${zahl(nAktuell, 2)} von dir eingegeben.`);
  } else if (b) {
    punkte.push(`Exponent ${exponentText(b.n_standard)} für ${b.name} ${b.n_status === 'annahme' ? 'angenommen (Richtwert, wenig belegt)' : 'angenommen (üblicher Wert laut Fachliteratur und Herstellern)'}. Mit dem Wert aus dem Datenblatt wird das Ergebnis genauer.`);
  } else {
    punkte.push('Exponent 1,3 angenommen (üblich für Plattenheizkörper). Mit dem Wert aus dem Datenblatt wird das Ergebnis genauer.');
  }
  return punkte;
}

/**
 * Baut die Auswahl auf. `geaendert` wird nach jeder Änderung aufgerufen, damit neu gerechnet wird.
 * @param {() => void} geaendert
 */
export function initAuswahl(geaendert) {
  zeichneBauarten();
  zeigeBauartInfo();

  $('bauarten').addEventListener('change', (e) => {
    zustand.bauart = BAUARTEN.find((b) => b.id === e.target.value) ?? null;
    zeigeBauartInfo();
    if (zustand.modus === 'katalog') {
      fuelleHoehen();
      uebernehmeKatalog();
    } else {
      standardExponent();
    }
    geaendert();
  });

  for (const r of document.querySelectorAll('input[name="leistung-quelle"]')) {
    r.addEventListener('change', () => {
      setzeModus(r.value);
      geaendert();
    });
  }
  $('katalog-hoehe').addEventListener('change', () => { uebernehmeKatalog(); geaendert(); });
  $('katalog-laenge').addEventListener('input', () => { uebernehmeKatalog(); geaendert(); });
  $('exponent').addEventListener('input', () => { zustand.exponentVonHand = $('exponent').value.trim() !== ''; });
}
