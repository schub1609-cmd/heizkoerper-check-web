// Ersatz für node:test im Browser (nur test(name, fn)), damit die Tests ohne Node.js laufen.
export const ergebnisse = [];
export function test(name, fn) {
  try {
    fn();
    ergebnisse.push({ ok: true, name });
  } catch (e) {
    ergebnisse.push({ ok: false, name, meldung: e.message });
  }
}
