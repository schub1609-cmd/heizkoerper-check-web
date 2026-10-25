// Heizkörper-Daten: Bauarten mit Exponent und eigene Richtwert-Tabellen.
// Grundlage: docs/recherche-heizkoerpertypen-katalog.md. Nichts erfinden: jeder Wert ist aus Quellen hergeleitet.
// Keine Herstellertabellen (Entscheidung Uwe 25.10.2026, Datenbankrecht § 87b UrhG): Die Richtwerte sind
// Mittelwerte aus mehreren Herstellerangaben, gerundet, nur für gängige Größen. Leistungen in W bei 75/65/20 °C (EN 442).
// ES-Modul ohne Abhängigkeiten.

/** Quellen. Schlüssel werden in BAUARTEN und KATALOG verwendet. */
export const QUELLEN = Object.freeze({
  recknagel: {
    titel: 'Recknagel/Sprenger: Heizflächenauslegung bei Heizkörperheizungen, Abschnitt 2 (Heizkörperexponent)',
    stand: 'ohne Datum',
  },
  'buderus-2009': {
    titel: 'Buderus: Planungsunterlage Flachheizkörper Logatrend, Tab. 4–9',
    stand: '07/2009',
  },
  'kermi-hygiene': {
    titel: 'Kermi: Flachheizkörper Technik therm-x2 Profil Hygiene (Exponenten Typ 10/20/30)',
    stand: 'ohne Datum, abgerufen 25.10.2026',
    url: 'https://assets.heizung-billiger.de/documents/kermi-profil-k-v-vplus-hygiene-technik.pdf',
  },
  'kermi-2018': {
    titel: 'Kermi: Technik therm-x2 Flachheizkörper, Tabellen „Registrierte Leistungsdaten“ (W/m und n nach EN 442)',
    stand: '2018',
    url: 'https://www.alternative-haustechnik.de/media/8d/23/30/1682398475/db-kermi-x2-fhk.pdf',
  },
  'zehnder-charleston-2020': {
    titel: 'Zehnder: Documentation technique Zehnder Charleston (Exponenten je Säulenzahl und Höhe)',
    stand: '08/2020',
    url: 'https://newsletter.zehnder-systems.com/upload/prj/datasheet/Zehnder-DocumentationTechnique-ZehnderCharleston-202008-fr.pdf',
  },
  'hgtec-guss-2012': {
    titel: 'HG-tec: Gussradiatoren nach DIN 4703 / EN 442, Technische Daten (Leistung je Glied bei 75/65, 70/55, 55/45; passt auf ±1 W zu n = 1,3)',
    stand: '11/2012',
    url: 'https://www.gussradiatoren.info/downloads/guradiatoren-technische-daten.pdf',
  },
  'kermi-basic50': {
    titel: 'Kermi Basic-50 bei megabad (Exponent aus 75/65 und 55/45 zurückgerechnet, eine Stichprobe)',
    stand: 'abgerufen 25.10.2026',
    url: 'https://www.megabad.com/hersteller-kermi-badheizkoerper-basic-50-gerade-a-391301.htm',
  },
});

/**
 * Bauarten. n_standard wird verwendet, wenn kein Katalog- oder Datenblattwert vorliegt.
 * n_status: 'belegt' (Quelle nennt den Wert), 'annahme' (fachlicher Richtwert, im Ergebnis kennzeichnen).
 * platten/lagen: nur für Plattenheizkörper (Typ = Platten und Konvektorlagen, z. B. 22).
 * katalogTyp: Schlüssel für die Katalogzeilen (Spalte Typ), fehlt, wenn es noch keine Katalogdaten gibt.
 */
export const BAUARTEN = Object.freeze([
  {
    id: 'platte-10', kurz: 'Typ 10', gruppe: 'Plattenheizkörper', name: 'Typ 10', beschreibung: 'Eine Platte, ohne Lamellen',
    platten: 1, lagen: 0, katalogTyp: '10', bezug: 'je_meter',
    n_standard: 1.3, n_spanne: [1.2, 1.34], n_status: 'belegt', quellen: ['recknagel', 'buderus-2009', 'kermi-2018'],
  },
  {
    id: 'platte-11', kurz: 'Typ 11', gruppe: 'Plattenheizkörper', name: 'Typ 11', beschreibung: 'Eine Platte mit einer Lage Lamellen',
    platten: 1, lagen: 1, katalogTyp: '11', bezug: 'je_meter',
    n_standard: 1.3, n_spanne: [1.2, 1.34], n_status: 'belegt', quellen: ['recknagel', 'buderus-2009', 'kermi-2018'],
  },
  {
    id: 'platte-12', kurz: 'Typ 12', gruppe: 'Plattenheizkörper', name: 'Typ 12', beschreibung: 'Eine Platte mit zwei Lagen Lamellen',
    platten: 1, lagen: 2, katalogTyp: '12', bezug: 'je_meter',
    n_standard: 1.3, n_spanne: [1.2, 1.34], n_status: 'belegt', quellen: ['recknagel', 'kermi-2018'],
  },
  {
    id: 'platte-20', kurz: 'Typ 20', gruppe: 'Plattenheizkörper', name: 'Typ 20', beschreibung: 'Zwei Platten, ohne Lamellen',
    platten: 2, lagen: 0, katalogTyp: '20', bezug: 'je_meter',
    n_standard: 1.3, n_spanne: [1.2, 1.34], n_status: 'belegt', quellen: ['recknagel', 'buderus-2009', 'kermi-2018'],
  },
  {
    id: 'platte-21', kurz: 'Typ 21', gruppe: 'Plattenheizkörper', name: 'Typ 21', beschreibung: 'Zwei Platten, eine Lage Lamellen dazwischen',
    platten: 2, lagen: 1, katalogTyp: '21', bezug: 'je_meter',
    n_standard: 1.3, n_spanne: [1.2, 1.34], n_status: 'belegt', quellen: ['recknagel', 'buderus-2009', 'kermi-2018'],
  },
  {
    id: 'platte-22', kurz: 'Typ 22', gruppe: 'Plattenheizkörper', name: 'Typ 22', beschreibung: 'Zwei Platten, zwei Lagen Lamellen',
    platten: 2, lagen: 2, katalogTyp: '22', bezug: 'je_meter',
    n_standard: 1.3, n_spanne: [1.2, 1.34], n_status: 'belegt', quellen: ['recknagel', 'buderus-2009', 'kermi-2018'],
  },
  {
    id: 'platte-30', kurz: 'Typ 30', gruppe: 'Plattenheizkörper', name: 'Typ 30', beschreibung: 'Drei Platten, ohne Lamellen',
    platten: 3, lagen: 0, katalogTyp: '30', bezug: 'je_meter',
    n_standard: 1.3, n_spanne: [1.2, 1.34], n_status: 'belegt', quellen: ['recknagel', 'buderus-2009', 'kermi-2018'],
  },
  {
    id: 'platte-33', kurz: 'Typ 33', gruppe: 'Plattenheizkörper', name: 'Typ 33', beschreibung: 'Drei Platten, drei Lagen Lamellen',
    platten: 3, lagen: 3, katalogTyp: '33', bezug: 'je_meter',
    n_standard: 1.3, n_spanne: [1.2, 1.34], n_status: 'belegt', quellen: ['recknagel', 'buderus-2009', 'kermi-2018'],
  },
  {
    id: 'glieder-guss', kurz: 'Guss-Glieder', gruppe: 'Gliederheizkörper', name: 'Guss-Gliederheizkörper', beschreibung: 'Einzelne Glieder aus Gusseisen, schwer, meist mit Säulen',
    katalogTyp: 'guss', bezug: 'je_glied', n_standard: 1.3, n_spanne: [1.3, 1.32], n_status: 'belegt', quellen: ['recknagel', 'hgtec-guss-2012'],
  },
  {
    id: 'glieder-stahl', kurz: 'Stahl-Glieder', gruppe: 'Gliederheizkörper', name: 'Stahl-Gliederheizkörper', beschreibung: 'Einzelne Glieder aus Stahlblech, leichter als Guss',
    bezug: 'je_glied', n_standard: 1.3, n_spanne: [1.25, 1.33], n_status: 'belegt', quellen: ['recknagel'],
  },
  {
    id: 'roehren', kurz: 'Röhren', gruppe: 'Röhrenheizkörper', name: 'Röhrenradiator', beschreibung: 'Senkrechte runde Röhren, 2 bis 6 Säulen hintereinander',
    bezug: 'je_glied', n_standard: 1.25, n_spanne: [1.21, 1.33], n_status: 'belegt', quellen: ['recknagel', 'zehnder-charleston-2020'],
  },
  {
    id: 'bad', kurz: 'Bad', gruppe: 'Badheizkörper', name: 'Bad- / Handtuchheizkörper', beschreibung: 'Waagerechte Rohre wie eine Leiter',
    bezug: 'je_stueck', n_standard: 1.25, n_spanne: [1.2, 1.3], n_status: 'annahme', quellen: ['kermi-basic50'],
  },
  {
    id: 'konvektor', kurz: 'Konvektor', gruppe: 'Konvektor', name: 'Konvektor', beschreibung: 'Lamellenpaket in einem Gehäuse oder im Boden (Unterflurkonvektor), gibt die Wärme fast nur über die Luft ab',
    bezug: 'je_stueck', n_standard: 1.4, n_spanne: [1.25, 1.45], n_status: 'annahme', quellen: ['recknagel'],
  },
]);

/**
 * Richtwert-Tabellen. Zeilen kompakt:
 * [Bauhöhe mm, Nabenabstand mm | null, Typ, n, Q 75/65/20, Bautiefe mm | null, Streuung %]
 * Q in W/m (bezug 'je_meter') bzw. W je Glied (bezug 'je_glied').
 * Streuung: größte Abweichung der einzelnen Herstellerangaben vom Richtwert.
 * menge: erlaubte Baulänge in mm bzw. Gliederzahl.
 */
export const RICHTWERTE = Object.freeze([
  {
    name: 'Richtwerte Plattenheizkörper', gruppe: 'Plattenheizkörper', bezug: 'je_meter',
    herleitung: 'Mittelwert der Normwärmeleistung je Meter und des Exponenten aus Buderus Logatrend K-Profil und K-Plan (07/2009) sowie Kermi therm-x2 Profil-K und Plan/Line-K (2018), gleiche Bauhöhe und gleicher Typ; Leistung auf 10 W/m, Exponent auf 0,01 gerundet. Typ 20, 21, 30 nur aus Buderus, Typ 12 nur aus Kermi.',
    quellen: ['buderus-2009', 'kermi-2018'],
    menge: { min: 400, max: 3000, schritt: 100, hinweis: 'Übliche Baulängen liegen zwischen 400 und 3000 mm' },
    zeilen: [
      [300, null, '10', 1.28, 330, null, 13],
      [400, null, '10', 1.29, 420, null, 12],
      [500, null, '10', 1.29, 510, null, 12],
      [600, null, '10', 1.29, 600, null, 13],
      [900, null, '10', 1.29, 860, null, 13],
      [300, null, '11', 1.26, 510, null, 8],
      [400, null, '11', 1.28, 650, null, 7],
      [500, null, '11', 1.28, 790, null, 6],
      [600, null, '11', 1.28, 920, null, 6],
      [900, null, '11', 1.29, 1310, null, 6],
      [300, null, '12', 1.29, 690, null, 5],
      [400, null, '12', 1.3, 850, null, 5],
      [500, null, '12', 1.31, 1010, null, 6],
      [600, null, '12', 1.32, 1170, null, 5],
      [900, null, '12', 1.34, 1660, null, 4],
      [300, null, '20', 1.27, 570, null, 1],
      [400, null, '20', 1.27, 730, null, 1],
      [500, null, '20', 1.27, 890, null, 1],
      [600, null, '20', 1.27, 1040, null, 1],
      [900, null, '20', 1.3, 1460, null, 1],
      [300, null, '21', 1.29, 710, null, 1],
      [400, null, '21', 1.29, 900, null, 1],
      [500, null, '21', 1.3, 1090, null, 0],
      [600, null, '21', 1.3, 1260, null, 0],
      [900, null, '21', 1.32, 1720, null, 1],
      [300, null, '22', 1.29, 940, null, 4],
      [400, null, '22', 1.29, 1180, null, 5],
      [500, null, '22', 1.3, 1420, null, 6],
      [600, null, '22', 1.31, 1640, null, 6],
      [900, null, '22', 1.32, 2250, null, 4],
      [300, null, '30', 1.29, 810, null, 1],
      [400, null, '30', 1.3, 1020, null, 1],
      [500, null, '30', 1.3, 1230, null, 1],
      [600, null, '30', 1.31, 1440, null, 1],
      [900, null, '30', 1.33, 2010, null, 0],
      [300, null, '33', 1.28, 1300, null, 3],
      [400, null, '33', 1.29, 1650, null, 3],
      [500, null, '33', 1.29, 1970, null, 3],
      [600, null, '33', 1.3, 2280, null, 3],
      [900, null, '33', 1.32, 3100, null, 4],
    ],
  },
  {
    name: 'Richtwerte Guss-Gliederheizkörper', gruppe: 'Gliederheizkörper', bezug: 'je_glied',
    herleitung: 'Leistung je Glied für gängige Maße im alten DIN-Raster (DIN 4703), hergeleitet aus HG-tec (11/2012, heutige Fertigung), auf 5 W gerundet. Exponent 1,3 (Recknagel; passt auf ±1 W zu den Angaben bei 70/55 und 55/45). Alte Glieder gleicher Maße können abweichen.',
    quellen: ['hgtec-guss-2012', 'recknagel'],
    menge: { min: 3, max: 40, schritt: 1, hinweis: 'Ein Gussglied ist etwa 60 mm breit' },
    zeilen: [
      [980, 900, 'guss', 1.3, 205, 220, 0],
      [980, 900, 'guss', 1.3, 165, 160, 1],
      [980, 900, 'guss', 1.3, 90, 70, 2],
      [680, 600, 'guss', 1.3, 110, 160, 1],
      [580, 500, 'guss', 1.3, 120, 220, 2],
      [580, 500, 'guss', 1.3, 95, 160, 1],
      [580, 500, 'guss', 1.3, 70, 110, 3],
      [580, 500, 'guss', 1.3, 50, 70, 4],
      [430, 350, 'guss', 1.3, 95, 220, 2],
      [430, 350, 'guss', 1.3, 75, 160, 0],
      [430, 350, 'guss', 1.3, 45, 70, 4],
      [280, 200, 'guss', 1.3, 75, 250, 0],
    ],
  },
]);
