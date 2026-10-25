// Rechenkern „Heizkörper-Check für Wärmepumpen“
// Referenz für alle Produkte (Schnellcheck, Web-App, Abgleich mit der Excel-Vorlage).
// Grundlage: Skill heizkoerper-check, Abschnitt 1 (EN 442, logarithmische Übertemperatur, Exponentenansatz).
// Einheiten: Temperaturen in °C, Temperaturdifferenzen in K, Leistungen in W.
// ES-Modul ohne Abhängigkeiten.

/** Normbedingung nach EN 442 (heute): 75/65/20 °C. */
export const NORM_EN442 = Object.freeze({ tV: 75, tR: 65, ti: 20 });

/** Alte Normbedingung (vor EN 442): 90/70/20 °C. */
export const NORM_ALT = Object.freeze({ tV: 90, tR: 70, ti: 20 });

/** Standard-Spreizung für Wärmepumpen in K (bestätigt von Uwe am 24.10.2026, vom Nutzer änderbar). */
export const STANDARD_SPREIZUNG = 5;

/** Standard-Exponent für Plattenheizkörper ohne Datenblatt. [ANNAHME] – im Ergebnis kennzeichnen. */
export const STANDARD_EXPONENT_PLATTE = 1.3;

/** Ampelgrenzen in % Deckung (bestätigt von Uwe am 24.10.2026): grün ≥ 100, gelb 85 – < 100, rot < 85. */
export const AMPEL_GRENZEN = Object.freeze({ gruen: 100, gelb: 85 });

/** Weitere übliche Katalogbedingungen (Vorlauf/Rücklauf/Raum in °C). */
export const BEDINGUNGEN = Object.freeze({
  '90/70/20': NORM_ALT,
  '75/65/20': NORM_EN442,
  '70/55/20': Object.freeze({ tV: 70, tR: 55, ti: 20 }),
  '55/45/20': Object.freeze({ tV: 55, tR: 45, ti: 20 }),
  '45/40/20': Object.freeze({ tV: 45, tR: 40, ti: 20 }),
});

/** Obergrenze der Suche nach der benötigten Vorlauftemperatur in °C. */
export const MAX_VORLAUF = 75;

/**
 * Fehler bei ungültigen Eingaben. Die Meldung ist für Nutzer verständlich formuliert.
 * Rechenfunktionen werfen lieber diesen Fehler, als ein stilles Falschergebnis zu liefern.
 */
export class RechenFehler extends Error {
  constructor(meldung) {
    super(meldung);
    this.name = 'RechenFehler';
  }
}

function pruefeZahl(wert, name) {
  if (typeof wert !== 'number' || !Number.isFinite(wert)) {
    throw new RechenFehler(`${name} fehlt oder ist keine gültige Zahl.`);
  }
}

function pruefePositiv(wert, name) {
  pruefeZahl(wert, name);
  if (wert <= 0) {
    throw new RechenFehler(`${name} muss größer als 0 sein.`);
  }
}

/**
 * Logarithmische Übertemperatur ΔT_ln in K.
 * ΔT_ln = (t_V − t_R) / ln((t_V − t_i) / (t_R − t_i))
 * Sonderfall: Ist t_V − t_R kleiner als 0,01 K, gilt der Grenzwert ΔT_ln = t_V − t_i.
 * Gültig für t_V > t_R > t_i.
 * @param {number} tV Vorlauftemperatur in °C
 * @param {number} tR Rücklauftemperatur in °C
 * @param {number} ti Raumtemperatur in °C
 * @returns {number} ΔT_ln in K
 */
export function dTln(tV, tR, ti) {
  pruefeZahl(tV, 'Die Vorlauftemperatur');
  pruefeZahl(tR, 'Die Rücklauftemperatur');
  pruefeZahl(ti, 'Die Raumtemperatur');
  if (tR <= ti) {
    throw new RechenFehler('Die Rücklauftemperatur muss höher sein als die Raumtemperatur.');
  }
  if (tV <= tR) {
    throw new RechenFehler('Die Vorlauftemperatur muss höher sein als die Rücklauftemperatur.');
  }
  if (tV - tR < 0.01) {
    return tV - ti;
  }
  return (tV - tR) / Math.log((tV - ti) / (tR - ti));
}

/**
 * Leistung eines Heizkörpers bei Betriebsbedingungen in W.
 * Q = Q_N · (ΔT_ln / ΔT_ln,N)^n
 * @param {number} QN Normwärmeleistung in W (bei der Normbedingung `norm`)
 * @param {number} n Heizkörperexponent (ohne Datenblatt: 1,3 für Plattenheizkörper, [ANNAHME])
 * @param {number} tV Vorlauftemperatur in °C
 * @param {number} tR Rücklauftemperatur in °C
 * @param {number} ti Raumtemperatur in °C
 * @param {{tV:number,tR:number,ti:number}} [norm=NORM_EN442] Normbedingung, auf die sich Q_N bezieht
 * @returns {number} Leistung in W
 */
export function leistung(QN, n, tV, tR, ti, norm = NORM_EN442) {
  pruefePositiv(QN, 'Die Normleistung');
  pruefePositiv(n, 'Der Heizkörperexponent');
  const dtN = dTln(norm.tV, norm.tR, norm.ti);
  const dt = dTln(tV, tR, ti);
  return QN * Math.pow(dt / dtN, n);
}

/**
 * Rechnet eine Normleistung von einer Normbedingung auf eine andere um, z. B. 90/70/20 → 75/65/20.
 * @param {number} QN Normleistung in W bei `normAlt`
 * @param {{tV:number,tR:number,ti:number}} normAlt Normbedingung des gegebenen Werts
 * @param {{tV:number,tR:number,ti:number}} normNeu gewünschte Normbedingung
 * @param {number} n Heizkörperexponent
 * @returns {number} Normleistung in W bei `normNeu`
 */
export function normUmrechnen(QN, normAlt, normNeu, n) {
  return leistung(QN, n, normNeu.tV, normNeu.tR, normNeu.ti, normAlt);
}

/**
 * Summe der Leistungen mehrerer Heizkörper in einem Raum in W.
 * @param {Array<{QN:number,n:number,norm?:{tV:number,tR:number,ti:number}}>} heizkoerperListe
 * @param {number} tV Vorlauftemperatur in °C
 * @param {number} tR Rücklauftemperatur in °C
 * @param {number} ti Raumtemperatur in °C
 * @returns {number} Leistung in W
 */
export function raumLeistung(heizkoerperListe, tV, tR, ti) {
  if (!Array.isArray(heizkoerperListe) || heizkoerperListe.length === 0) {
    throw new RechenFehler('Im Raum ist kein Heizkörper eingetragen.');
  }
  return heizkoerperListe.reduce(
    (summe, hk) => summe + leistung(hk.QN, hk.n, tV, tR, ti, hk.norm ?? NORM_EN442),
    0
  );
}

/**
 * Benötigte Vorlauftemperatur eines Raums in °C, damit die Heizkörper die Raumheizlast decken.
 * Gesucht ist t_V mit Q(t_V, t_V − σ, t_i) = Φ_HL.
 * Verfahren: Bisektion im Intervall [t_i + σ + 0,5 K; 75 °C],
 * Abbruch bei |ΔQ| < 1 W oder nach 60 Iterationen.
 * @param {Array<{QN:number,n:number,norm?:object}>} heizkoerperListe Heizkörper im Raum
 * @param {number} heizlast Raumheizlast Φ_HL in W
 * @param {number} ti Raumtemperatur in °C
 * @param {number} [spreizung=5] Spreizung σ = t_V − t_R in K
 * @returns {{erreichbar:boolean, tV:number|null, untereGrenze:boolean, meldung:string}}
 *   erreichbar = false: auch bei 75 °C reicht die Leistung nicht (tV = null).
 *   untereGrenze = true: schon die kleinste geprüfte Vorlauftemperatur reicht aus (tV = untere Intervallgrenze).
 */
export function benoetigteVorlauftemperatur(heizkoerperListe, heizlast, ti, spreizung = STANDARD_SPREIZUNG) {
  pruefePositiv(heizlast, 'Die Raumheizlast');
  pruefeZahl(ti, 'Die Raumtemperatur');
  pruefePositiv(spreizung, 'Die Spreizung');

  const unten = ti + spreizung + 0.5;
  const oben = MAX_VORLAUF;
  if (unten >= oben) {
    throw new RechenFehler('Raumtemperatur und Spreizung zusammen sind zu hoch für eine Berechnung bis 75 °C.');
  }
  const differenz = (tV) => raumLeistung(heizkoerperListe, tV, tV - spreizung, ti) - heizlast;

  if (differenz(oben) < 0) {
    return {
      erreichbar: false,
      tV: null,
      untereGrenze: false,
      meldung: 'Die Heizkörper reichen auch bei 75 °C Vorlauf nicht aus.',
    };
  }
  if (differenz(unten) >= 0) {
    return {
      erreichbar: true,
      tV: unten,
      untereGrenze: true,
      meldung: `Die Heizkörper reichen schon bei ${unten} °C Vorlauf.`,
    };
  }

  let a = unten;
  let b = oben;
  let mitte = (a + b) / 2;
  for (let i = 0; i < 60; i++) {
    mitte = (a + b) / 2;
    const d = differenz(mitte);
    if (Math.abs(d) < 1) break;
    if (d < 0) a = mitte;
    else b = mitte;
  }
  return {
    erreichbar: true,
    tV: mitte,
    untereGrenze: false,
    meldung: `Benötigte Vorlauftemperatur: ca. ${mitte.toFixed(1)} °C.`,
  };
}

/**
 * Deckungsgrad in %: Leistung der Heizkörper im Raum geteilt durch die Raumheizlast.
 * Deckung = Q_Raum(t_V) / Φ_HL · 100 %
 * @param {Array<{QN:number,n:number,norm?:object}>} heizkoerperListe Heizkörper im Raum
 * @param {number} heizlast Raumheizlast Φ_HL in W
 * @param {number} tV Vorlauftemperatur in °C
 * @param {number} tR Rücklauftemperatur in °C
 * @param {number} ti Raumtemperatur in °C
 * @returns {number} Deckung in %
 */
export function deckung(heizkoerperListe, heizlast, tV, tR, ti) {
  pruefePositiv(heizlast, 'Die Raumheizlast');
  return (raumLeistung(heizkoerperListe, tV, tR, ti) / heizlast) * 100;
}

/**
 * Umkehrrechnung: Welche flächenbezogene Heizlast kann eine Leistung decken?
 * Ergebnis = Leistung / Raumfläche. Für den Fall, dass die Raumheizlast unbekannt ist.
 * Beispiel: Der Heizkörper schafft bei 45 °C Vorlauf 600 W, der Raum hat 15 m² → deckt bis 40 W/m².
 * @param {number} leistungW Leistung in W (z. B. aus raumLeistung)
 * @param {number} flaeche Raumfläche in m²
 * @returns {number} deckbare Heizlast in W/m²
 */
export function deckbareFlaechenlast(leistungW, flaeche) {
  pruefeZahl(leistungW, 'Die Leistung');
  if (leistungW < 0) {
    throw new RechenFehler('Die Leistung darf nicht negativ sein.');
  }
  pruefePositiv(flaeche, 'Die Raumfläche');
  return leistungW / flaeche;
}

/**
 * Ampel zum Deckungsgrad.
 * @param {number} deckungProzent Deckung in %
 * @param {{gruen:number, gelb:number}} [grenzen=AMPEL_GRENZEN] grün ab `gruen` %, gelb ab `gelb` %, darunter rot
 * @returns {'gruen'|'gelb'|'rot'}
 */
export function ampel(deckungProzent, grenzen = AMPEL_GRENZEN) {
  pruefeZahl(deckungProzent, 'Die Deckung');
  if (deckungProzent < 0) {
    throw new RechenFehler('Die Deckung darf nicht negativ sein.');
  }
  if (deckungProzent >= grenzen.gruen) return 'gruen';
  if (deckungProzent >= grenzen.gelb) return 'gelb';
  return 'rot';
}

/**
 * Heizkörperexponent aus zwei Katalogwerten zurückrechnen.
 * n = ln(Q₂ / Q₁) / ln(ΔT_ln,2 / ΔT_ln,1)
 * Beispiel Buderus K-Profil 600/22: 1682 W/m bei 75/65/20 und 855 W/m bei 55/45/20 → n ≈ 1,31.
 * @param {number} Q1 Leistung bei Bedingung 1 in W
 * @param {{tV:number,tR:number,ti:number}} bed1 Bedingung 1
 * @param {number} Q2 Leistung bei Bedingung 2 in W
 * @param {{tV:number,tR:number,ti:number}} bed2 Bedingung 2
 * @returns {number} Exponent n
 */
export function exponentAusZweiWerten(Q1, bed1, Q2, bed2) {
  pruefePositiv(Q1, 'Die erste Leistung');
  pruefePositiv(Q2, 'Die zweite Leistung');
  const dt1 = dTln(bed1.tV, bed1.tR, bed1.ti);
  const dt2 = dTln(bed2.tV, bed2.tR, bed2.ti);
  if (Math.abs(Math.log(dt2 / dt1)) < 1e-6) {
    throw new RechenFehler('Die beiden Temperaturbedingungen sind zu ähnlich, um den Exponenten zu bestimmen.');
  }
  return Math.log(Q2 / Q1) / Math.log(dt2 / dt1);
}

/**
 * Normleistung aus einem Katalogwert je Meter, je Glied oder je Stück.
 * je_meter: Q_N = Wert · Baulänge / 1000 · je_glied: Q_N = Wert · Gliederzahl · je_stueck: Q_N = Wert
 * @param {number} wert Katalogleistung in W/m, W/Glied oder W
 * @param {'je_meter'|'je_glied'|'je_stueck'} bezug
 * @param {number} [menge] Baulänge in mm (je_meter) bzw. Gliederzahl (je_glied)
 * @returns {number} Normleistung in W
 */
export function katalogNormleistung(wert, bezug, menge) {
  pruefePositiv(wert, 'Der Katalogwert');
  if (bezug === 'je_stueck') return wert;
  if (bezug === 'je_meter') {
    pruefePositiv(menge, 'Die Baulänge');
    return (wert * menge) / 1000;
  }
  if (bezug === 'je_glied') {
    pruefePositiv(menge, 'Die Gliederzahl');
    if (!Number.isInteger(menge)) throw new RechenFehler('Die Gliederzahl muss eine ganze Zahl sein.');
    return wert * menge;
  }
  throw new RechenFehler('Unbekannter Bezug des Katalogwerts.');
}

/**
 * Prüft, ob Katalogwerte bei mehreren Bedingungen zur Rechnung mit Q_N und n passen.
 * Liefert die größte relative Abweichung (0,02 = 2 %). Über 2 % sollte eine Warnung erscheinen.
 * Kataloge runden auf ganze Watt; 1 W Abweichung wird deshalb nicht gezählt.
 * @param {number} QN Leistung bei 75/65/20 in W
 * @param {number} n Exponent laut Katalog
 * @param {Array<{bed:{tV:number,tR:number,ti:number}, Q:number}>} weitere weitere Katalogwerte
 * @returns {number} größte relative Abweichung
 */
export function katalogAbweichung(QN, n, weitere) {
  let max = 0;
  for (const { bed, Q } of weitere) {
    pruefePositiv(Q, 'Der Katalogwert');
    const gerechnet = leistung(QN, n, bed.tV, bed.tR, bed.ti);
    max = Math.max(max, Math.max(0, Math.abs(gerechnet - Q) - 1) / Q);
  }
  return max;
}
