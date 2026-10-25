// Oberfläche des kostenlosen Schnellchecks: ein Heizkörper in einem Raum.
// Gerechnet wird ausschließlich mit rechenkern.js. Keine Daten verlassen den Browser.

import {
  NORM_EN442,
  NORM_ALT,
  raumLeistung,
  benoetigteVorlauftemperatur,
  deckung,
  ampel,
  deckbareFlaechenlast,
  RechenFehler,
} from './rechenkern.js';
import './warteliste.js';
import { initAuswahl, herkunftHinweise } from './heizkoerper-auswahl.js';

const VORLAUF_STUFEN = [35, 45, 55];
const WP_GRENZE_VORLAUF = 55; // Skill 1.6: darüber Hinweis auf Effizienzverlust

const AMPEL_TEXT = {
  gruen: 'reicht',
  gelb: 'knapp',
  rot: 'reicht nicht',
};

const $ = (id) => document.getElementById(id);

/** Liest eine Zahl mit Dezimalkomma oder -punkt. Leer → null. Ungültig → RechenFehler. */
function leseZahl(id, name, { pflicht = false } = {}) {
  const roh = $(id).value.trim().replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  if (roh === '') {
    if (pflicht) throw new FeldFehler(id, `Bitte gib ${name} ein.`);
    return null;
  }
  const wert = Number(roh);
  if (!Number.isFinite(wert)) throw new FeldFehler(id, 'Das ist keine gültige Zahl. Bitte nur Ziffern und Komma verwenden.');
  return wert;
}

class FeldFehler extends Error {
  constructor(feld, meldung) {
    super(meldung);
    this.feld = feld;
  }
}

function zahl(wert, stellen = 0) {
  return wert.toLocaleString('de-DE', { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
}

function setzeFehler(feld, meldung) {
  const el = $(`fehler-${feld}`);
  if (el) el.textContent = meldung;
  $(feld)?.setAttribute('aria-invalid', meldung ? 'true' : 'false');
}

function leseEingaben() {
  const fehler = [];
  const werte = {};
  const felder = [
    ['qn', 'die Normleistung', true],
    ['heizlast', 'die Heizlast', false],
    ['flaeche', 'die Raumfläche', false],
    ['exponent', 'den Exponenten', true],
    ['ti', 'die Raumtemperatur', true],
    ['spreizung', 'die Spreizung', true],
  ];
  for (const [id, name, pflicht] of felder) {
    setzeFehler(id, '');
    try {
      werte[id] = leseZahl(id, name, { pflicht });
      if (werte[id] !== null && werte[id] <= 0 && id !== 'ti') {
        throw new FeldFehler(id, 'Der Wert muss größer als 0 sein.');
      }
    } catch (e) {
      fehler.push(e);
    }
  }
  if (werte.ti !== null && werte.ti !== undefined && (werte.ti < 5 || werte.ti > 30)) {
    fehler.push(new FeldFehler('ti', 'Bitte eine Raumtemperatur zwischen 5 und 30 °C eingeben.'));
  }
  werte.norm = $('norm').value === '90/70/20' ? NORM_ALT : NORM_EN442;
  return { werte, fehler };
}

function zeigeLeer(text) {
  $('fazit').textContent = text;
  $('fazit').className = 'fazit';
  $('spalten').replaceChildren();
  $('vorlauf').textContent = '';
  $('annahmen').replaceChildren();
}

function berechne() {
  const { werte, fehler } = leseEingaben();
  const qnLeer = $('qn').value.trim() === '';
  for (const f of fehler) {
    // Leere Normleistung erst nach dem ersten Tippen als Fehler zeigen
    if (!(f.feld === 'qn' && qnLeer)) setzeFehler(f.feld, f.message);
  }
  if (fehler.length > 0) {
    zeigeLeer(qnLeer && fehler.length === 1
      ? 'Gib die Normleistung ein, dann erscheint hier das Ergebnis.'
      : 'Bitte prüfe die markierten Eingaben.');
    return;
  }

  const { qn, heizlast, flaeche, exponent: n, ti, spreizung } = werte;
  const liste = [{ QN: qn, n, norm: werte.norm }];
  const spalten = [];

  for (const tV of VORLAUF_STUFEN) {
    const tR = tV - spreizung;
    const spalte = { tV, tR };
    try {
      spalte.leistung = raumLeistung(liste, tV, tR, ti);
      if (heizlast) {
        spalte.deckung = deckung(liste, heizlast, tV, tR, ti);
        spalte.ampel = ampel(spalte.deckung);
      }
      if (flaeche) spalte.wm2 = deckbareFlaechenlast(spalte.leistung, flaeche);
    } catch (e) {
      if (!(e instanceof RechenFehler)) throw e;
      spalte.fehler = e.message;
    }
    spalten.push(spalte);
  }

  let vorlauf = null;
  if (heizlast) {
    try {
      vorlauf = benoetigteVorlauftemperatur(liste, heizlast, ti, spreizung);
    } catch (e) {
      if (!(e instanceof RechenFehler)) throw e;
      vorlauf = { fehler: e.message };
    }
  }

  zeigeSpalten(spalten);
  zeigeFazit(spalten, vorlauf, werte);
  zeigeAnnahmen(werte);
}

function zeigeSpalten(spalten) {
  const knoten = spalten.map((s) => {
    const div = document.createElement('div');
    div.className = `spalte ${s.ampel ? `ampel-${s.ampel}` : 'ohne-ampel'}`;
    const kopf = document.createElement('p');
    kopf.className = 'spalte-kopf';
    kopf.textContent = `${zahl(s.tV)} °C Vorlauf`;
    div.append(kopf);

    if (s.fehler) {
      const p = document.createElement('p');
      p.className = 'spalte-fehler';
      p.textContent = s.fehler;
      div.append(p);
      return div;
    }
    if (s.ampel) {
      const a = document.createElement('p');
      a.className = 'ampel-text';
      a.innerHTML = `<span class="punkt" aria-hidden="true"></span>${AMPEL_TEXT[s.ampel]}`;
      div.append(a);
      const d = document.createElement('p');
      d.className = 'wert-gross';
      d.textContent = `${zahl(s.deckung)} %`;
      div.append(d);
      const dl = document.createElement('p');
      dl.className = 'wert-klein';
      dl.textContent = 'der Heizlast gedeckt';
      div.append(dl);
    }
    const l = document.createElement('p');
    l.className = s.ampel ? 'wert-mittel' : 'wert-gross';
    l.textContent = `${zahl(s.leistung)} W`;
    div.append(l);
    if (s.wm2 !== undefined) {
      const w = document.createElement('p');
      w.className = 'wert-klein';
      w.textContent = `deckt bis ${zahl(s.wm2)} W/m²`;
      div.append(w);
    }
    return div;
  });
  $('spalten').replaceChildren(...knoten);
}

function zeigeFazit(spalten, vorlauf, werte) {
  const fazit = $('fazit');
  const vl = $('vorlauf');
  vl.textContent = '';

  if (!werte.heizlast) {
    const s45 = spalten.find((s) => s.tV === 45);
    fazit.className = 'fazit';
    if (s45 && !s45.fehler) {
      fazit.textContent = `Dein Heizkörper gibt bei 45 °C Vorlauf etwa ${zahl(s45.leistung)} W ab`
        + (s45.wm2 !== undefined ? `, das sind ${zahl(s45.wm2)} W/m² für deinen Raum.` : '.')
        + ' Ob das reicht, hängt von der Heizlast des Raums ab. Trägst du sie ein, siehst du die Ampel.';
    } else {
      fazit.textContent = 'Mit diesen Eingaben lässt sich bei 45 °C nicht rechnen. Prüfe Raumtemperatur und Spreizung.';
    }
    return;
  }

  if (vorlauf?.fehler) {
    fazit.className = 'fazit';
    fazit.textContent = vorlauf.fehler;
    return;
  }
  if (!vorlauf.erreichbar) {
    fazit.className = 'fazit fazit-rot';
    fazit.textContent = 'Der Heizkörper schafft die Heizlast auch bei 75 °C Vorlauf nicht. Für eine Wärmepumpe braucht dieser Raum mehr Heizfläche, zum Beispiel einen größeren Heizkörper.';
    return;
  }

  const t = vorlauf.tV;
  if (vorlauf.untereGrenze) {
    fazit.className = 'fazit fazit-gruen';
    fazit.textContent = `Der Heizkörper schafft die Heizlast schon bei ${zahl(t, 1)} °C Vorlauf, der niedrigsten Temperatur, die wir prüfen.`;
  } else if (t <= WP_GRENZE_VORLAUF) {
    fazit.className = t <= 45 ? 'fazit fazit-gruen' : 'fazit fazit-gelb';
    fazit.textContent = `Der Heizkörper schafft die Heizlast ab etwa ${zahl(t, 1)} °C Vorlauf.`;
  } else {
    fazit.className = 'fazit fazit-rot';
    fazit.textContent = `Der Heizkörper braucht etwa ${zahl(t, 1)} °C Vorlauf. Über 55 °C arbeitet eine Wärmepumpe deutlich weniger effizient.`;
  }
  vl.textContent = `Benötigte Vorlauftemperatur: ca. ${zahl(t, 1)} °C (Rücklauf ${zahl(t - werte.spreizung, 1)} °C).`;
}

function zeigeAnnahmen(werte) {
  const punkte = herkunftHinweise(werte.exponent);
  punkte.push(`Raumtemperatur ${zahl(werte.ti, 1)} °C, Spreizung ${zahl(werte.spreizung, 1)} K.`);
  if (!werte.heizlast) punkte.push('Ohne Heizlast keine Ampel: Die W/m²-Angabe ist eine Umrechnung, keine Schätzung der Heizlast.');
  $('annahmen').replaceChildren(...punkte.map((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    return li;
  }));
}

// Hilfetexte auf- und zuklappen
for (const knopf of document.querySelectorAll('.hilfe-knopf')) {
  knopf.addEventListener('click', () => {
    const ziel = $(knopf.getAttribute('aria-controls'));
    const offen = knopf.getAttribute('aria-expanded') === 'true';
    knopf.setAttribute('aria-expanded', String(!offen));
    ziel.hidden = offen;
  });
}

initAuswahl(berechne);
$('eingaben').addEventListener('input', berechne);
$('eingaben').addEventListener('submit', (e) => e.preventDefault());


berechne();
