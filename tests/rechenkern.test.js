// Tests für den Rechenkern. Ausführen im Ordner web/:  node --test tests/
// Pflicht-Prüfwerte aus Skill heizkoerper-check, Abschnitt 1.5:
// Plattenheizkörper, n = 1,3, Q_N bei 75/65/20, t_i = 20 °C.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dTln,
  leistung,
  normUmrechnen,
  raumLeistung,
  benoetigteVorlauftemperatur,
  deckung,
  ampel,
  deckbareFlaechenlast,
  RechenFehler,
  NORM_EN442,
  NORM_ALT,
} from '../src/rechenkern.js';

const n = 1.3;
const ti = 20;

function nahe(ist, soll, toleranz, text) {
  assert.ok(Math.abs(ist - soll) <= toleranz, `${text}: ist ${ist}, soll ${soll} ± ${toleranz}`);
}

test('Prüfwert 75/65: ΔT_ln = 49,83 K, Q/Q_N = 1,000', () => {
  nahe(dTln(75, 65, ti), 49.83, 0.005, 'ΔT_ln');
  nahe(leistung(1000, n, 75, 65, ti) / 1000, 1.0, 0.0005, 'Q/Q_N');
});

test('Prüfwert 55/45: ΔT_ln = 29,72 K, Q/Q_N ≈ 0,511 (≈ 51 %)', () => {
  nahe(dTln(55, 45, ti), 29.72, 0.005, 'ΔT_ln');
  nahe(leistung(1000, n, 55, 45, ti) / 1000, 0.511, 0.0005, 'Q/Q_N');
  nahe(leistung(1000, n, 55, 45, ti) / 10, 51, 1, 'Anteil in %');
});

test('Prüfwert 45/35: ΔT_ln = 19,58 K, Q/Q_N ≈ 0,297 (≈ 30 %)', () => {
  nahe(dTln(45, 35, ti), 19.58, 0.005, 'ΔT_ln');
  nahe(leistung(1000, n, 45, 35, ti) / 1000, 0.297, 0.0005, 'Q/Q_N');
  nahe(leistung(1000, n, 45, 35, ti) / 10, 30, 1, 'Anteil in %');
});

test('Prüfwert 90/70: ΔT_ln = 59,44 K, Q/Q_N ≈ 1,258', () => {
  nahe(dTln(90, 70, ti), 59.44, 0.005, 'ΔT_ln');
  nahe(leistung(1000, n, 90, 70, ti) / 1000, 1.258, 0.0005, 'Q/Q_N');
});

test('Sonderfall: Spreizung < 0,01 K ergibt ΔT_ln = t_V − t_i', () => {
  nahe(dTln(50.005, 50, ti), 30.005, 1e-9, 'ΔT_ln');
});

test('Fehler: t_R ≤ t_i liefert keine Zahl', () => {
  assert.throws(() => dTln(40, 20, 20), RechenFehler);
  assert.throws(() => dTln(40, 18, 20), RechenFehler);
  assert.throws(() => leistung(1000, n, 40, 19, 20), RechenFehler);
});

test('Fehler: t_V ≤ t_R liefert keine Zahl', () => {
  assert.throws(() => dTln(45, 45, 20), RechenFehler);
  assert.throws(() => dTln(40, 45, 20), RechenFehler);
});

test('Fehler: negative oder fehlende Werte', () => {
  assert.throws(() => leistung(-500, n, 55, 45, ti), RechenFehler);
  assert.throws(() => leistung(1000, -1.3, 55, 45, ti), RechenFehler);
  assert.throws(() => leistung(1000, n, NaN, 45, ti), RechenFehler);
  assert.throws(() => leistung(undefined, n, 55, 45, ti), RechenFehler);
  assert.throws(() => benoetigteVorlauftemperatur([{ QN: 1000, n }], -100, ti), RechenFehler);
  assert.throws(() => benoetigteVorlauftemperatur([], 500, ti), RechenFehler);
  assert.throws(() => ampel(-5), RechenFehler);
});

test('Fehlermeldungen sind verständlich formuliert', () => {
  assert.throws(() => dTln(40, 20, 20), {
    message: 'Die Rücklauftemperatur muss höher sein als die Raumtemperatur.',
  });
  assert.throws(() => dTln(40, 45, 20), {
    message: 'Die Vorlauftemperatur muss höher sein als die Rücklauftemperatur.',
  });
});

test('Rückrechnung: berechnete Vorlauftemperatur ergibt die Heizlast (± 1 W)', () => {
  const liste = [{ QN: 1500, n }];
  for (const heizlast of [400, 600, 900, 1200, 1500]) {
    const erg = benoetigteVorlauftemperatur(liste, heizlast, ti, 5);
    assert.equal(erg.erreichbar, true);
    assert.equal(erg.untereGrenze, false);
    const q = raumLeistung(liste, erg.tV, erg.tV - 5, ti);
    nahe(q, heizlast, 1, `Heizlast ${heizlast} W`);
  }
});

test('Rückrechnung mit mehreren Heizkörpern und alter Norm', () => {
  const liste = [
    { QN: 800, n },
    { QN: 1200, n: 1.25, norm: NORM_ALT },
  ];
  const erg = benoetigteVorlauftemperatur(liste, 1100, ti, 5);
  const q = raumLeistung(liste, erg.tV, erg.tV - 5, ti);
  nahe(q, 1100, 1, 'Raumleistung');
});

test('Heizkörper reicht auch bei 75 °C nicht: Meldung statt Zahl', () => {
  const erg = benoetigteVorlauftemperatur([{ QN: 1000, n }], 1200, ti, 5);
  assert.equal(erg.erreichbar, false);
  assert.equal(erg.tV, null);
  assert.match(erg.meldung, /auch bei 75 °C/);
});

test('Sehr kleine Heizlast: untere Intervallgrenze reicht', () => {
  const erg = benoetigteVorlauftemperatur([{ QN: 2000, n }], 20, ti, 5);
  assert.equal(erg.erreichbar, true);
  assert.equal(erg.untereGrenze, true);
  assert.equal(erg.tV, 25.5);
});

test('Umrechnung 90/70/20 → 75/65/20 und zurück ergibt den Ausgangswert', () => {
  const qAlt = 1258;
  const qNeu = normUmrechnen(qAlt, NORM_ALT, NORM_EN442, n);
  nahe(qNeu, 1000, 1, 'umgerechnet');
  nahe(normUmrechnen(qNeu, NORM_EN442, NORM_ALT, n), qAlt, 1e-9, 'zurück');
});

test('Deckung und Ampel mit den bestätigten Grenzen (≥ 100 / 85 – < 100 / < 85 %)', () => {
  const liste = [{ QN: 1000, n }];
  nahe(deckung(liste, 511, 55, 45, ti), 100, 0.1, 'Deckung');
  assert.equal(ampel(100), 'gruen');
  assert.equal(ampel(130), 'gruen');
  assert.equal(ampel(99.9), 'gelb');
  assert.equal(ampel(85), 'gelb');
  assert.equal(ampel(84.9), 'rot');
  assert.equal(ampel(0), 'rot');
});

test('Umkehrrechnung: deckbare Heizlast in W/m²', () => {
  const q45 = leistung(1000, n, 45, 40, ti);
  nahe(deckbareFlaechenlast(q45, 10), q45 / 10, 1e-9, 'W/m²');
  assert.equal(deckbareFlaechenlast(600, 15), 40);
  assert.throws(() => deckbareFlaechenlast(600, 0), RechenFehler);
  assert.throws(() => deckbareFlaechenlast(600, -5), RechenFehler);
  assert.throws(() => deckbareFlaechenlast(-1, 10), RechenFehler);
});
