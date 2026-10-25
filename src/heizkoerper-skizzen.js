// Einfache Skizzen der Heizkörper-Bauarten als SVG (selbst gezeichnet, keine Herstellerbilder).
// Plattenheizkörper: Blick von oben (Wand oben), daran erkennt man den Typ.
// Andere Bauarten: Vorderansicht. Farben über currentColor, damit hell und dunkel passen.

const RAHMEN = (inhalt, titel, viewBox = '0 0 120 84') =>
  `<svg viewBox="${viewBox}" role="img" aria-label="${titel}" xmlns="http://www.w3.org/2000/svg">${inhalt}</svg>`;

/** Wand als schraffierter Streifen oben (für die Draufsicht). */
function wand() {
  let s = '<rect x="6" y="6" width="108" height="6" fill="currentColor" opacity=".18"/>';
  for (let x = 8; x < 112; x += 7) s += `<line x1="${x}" y1="12" x2="${x + 5}" y2="6" stroke="currentColor" stroke-width=".8" opacity=".5"/>`;
  return s;
}

/** Lamellen (Konvektorblech) als Zickzack zwischen y und y + 7. */
function lamelle(y) {
  let d = `M16 ${y}`;
  for (let x = 16, oben = false; x < 104; x += 4, oben = !oben) d += ` L${x + 4} ${oben ? y : y + 7}`;
  return `<path d="${d}" fill="none" stroke="var(--skizze-lamelle, #d9822b)" stroke-width="1.4" stroke-linejoin="round"/>`;
}

function platte(y) {
  return `<rect x="14" y="${y}" width="92" height="4" rx="1.5" fill="var(--skizze-platte, #2f5d73)"/>`;
}

/** Reihenfolge von der Wand zum Raum: P = Platte, L = Lamellenlage. */
const PLATTEN_AUFBAU = {
  10: 'P', 11: 'LP', 12: 'LLP', 20: 'PP', 21: 'PLP', 22: 'PLLP', 30: 'PPP', 33: 'PLPLLP',
};

export function skizzePlatte(typ) {
  const aufbau = PLATTEN_AUFBAU[typ];
  if (!aufbau) return '';
  const hoehe = { P: 4, L: 7 };
  const abstand = 2.5;
  const gesamt = [...aufbau].reduce((s, t) => s + hoehe[t] + abstand, -abstand);
  let y = 18 + (44 - gesamt) / 2;
  let teile = '';
  for (const t of aufbau) {
    teile += t === 'P' ? platte(y) : lamelle(y);
    y += hoehe[t] + abstand;
  }
  return RAHMEN(wand() + teile, `Typ ${typ} von oben: ${aufbau.replaceAll('P', 'Platte ').replaceAll('L', 'Lamellen ').trim()}`, '0 2 120 64');
}

function gliederVorne({ anzahl, breite, rund }) {
  let s = '';
  const start = 60 - (anzahl * breite) / 2;
  for (let i = 0; i < anzahl; i++) {
    const x = start + i * breite + 1;
    s += `<rect x="${x}" y="10" width="${breite - 2}" height="62" rx="${rund}" fill="var(--skizze-platte, #2f5d73)" opacity="${i % 2 ? 0.85 : 1}"/>`;
  }
  return s;
}

const SKIZZEN = {
  'glieder-guss': () => RAHMEN(
    gliederVorne({ anzahl: 8, breite: 11, rund: 5 })
      + '<rect x="14" y="20" width="92" height="3" fill="currentColor" opacity=".25"/><rect x="14" y="60" width="92" height="3" fill="currentColor" opacity=".25"/>',
    'Guss-Gliederheizkörper von vorne'),
  'glieder-stahl': () => RAHMEN(
    gliederVorne({ anzahl: 10, breite: 9, rund: 2 }),
    'Stahl-Gliederheizkörper von vorne'),
  roehren: () => {
    let s = '<rect x="14" y="10" width="92" height="5" rx="2.5" fill="var(--skizze-platte, #2f5d73)"/><rect x="14" y="67" width="92" height="5" rx="2.5" fill="var(--skizze-platte, #2f5d73)"/>';
    for (let x = 17; x <= 103; x += 6) s += `<rect x="${x - 1.5}" y="12" width="3" height="58" rx="1.5" fill="var(--skizze-platte, #2f5d73)"/>`;
    return RAHMEN(s, 'Röhrenradiator von vorne');
  },
  bad: () => {
    let s = '<rect x="34" y="6" width="5" height="72" rx="2.5" fill="var(--skizze-platte, #2f5d73)"/><rect x="81" y="6" width="5" height="72" rx="2.5" fill="var(--skizze-platte, #2f5d73)"/>';
    for (let y = 12; y <= 72; y += 6) {
      if (y === 36 || y === 54) continue; // Lücken zum Aufhängen der Handtücher
      s += `<rect x="36" y="${y}" width="48" height="2.6" rx="1.3" fill="var(--skizze-platte, #2f5d73)"/>`;
    }
    return RAHMEN(s, 'Badheizkörper von vorne');
  },
  konvektor: () => {
    let s = '<rect x="8" y="34" width="104" height="2" fill="currentColor" opacity=".4"/>'
      + '<rect x="18" y="36" width="84" height="34" rx="2" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".6"/>';
    for (let x = 22; x <= 98; x += 4) s += `<line x1="${x}" y1="44" x2="${x}" y2="62" stroke="var(--skizze-lamelle, #d9822b)" stroke-width="1.2"/>`;
    s += '<rect x="20" y="50" width="80" height="3" fill="var(--skizze-platte, #2f5d73)"/>';
    s += '<path d="M40 30 q4 -8 0 -16 M60 30 q4 -8 0 -16 M80 30 q4 -8 0 -16" fill="none" stroke="currentColor" stroke-width="1" opacity=".5"/>';
    return RAHMEN(s, 'Unterflurkonvektor im Schnitt');
  },
};

/** SVG-Text der Skizze zu einer Bauart (siehe BAUARTEN in heizkoerper-daten.js). */
export function skizze(bauart) {
  if (bauart.platten) return skizzePlatte(bauart.katalogTyp);
  return SKIZZEN[bauart.id]?.() ?? '';
}
