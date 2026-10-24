// Ersatz für node:assert/strict im Browser (nur die in den Tests genutzten Funktionen).
function ok(bedingung, meldung) {
  if (!bedingung) throw new Error(meldung || 'Bedingung nicht erfüllt');
}
function equal(ist, soll) {
  if (ist !== soll) throw new Error(`erwartet ${soll}, ist ${ist}`);
}
function match(text, muster) {
  if (!muster.test(text)) throw new Error(`„${text}“ passt nicht zu ${muster}`);
}
function throws(fn, erwartet) {
  try {
    fn();
  } catch (e) {
    if (typeof erwartet === 'function' && !(e instanceof erwartet)) throw new Error(`falscher Fehlertyp: ${e.name}`);
    if (erwartet && erwartet.message && e.message !== erwartet.message) throw new Error(`falsche Meldung: ${e.message}`);
    return;
  }
  throw new Error('kein Fehler geworfen');
}
export default { ok, equal, match, throws };
