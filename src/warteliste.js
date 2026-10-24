// Wartelisten-Formular: noch an keinen Dienst angebunden (Entscheidung Uwe, DSGVO + Double-Opt-in).
// Die Adresse wird weder gespeichert noch gesendet.
const formular = document.getElementById('warteliste');
const meldung = document.getElementById('warteliste-meldung');

formular?.addEventListener('submit', (e) => {
  e.preventDefault();
  meldung.textContent = 'Die Warteliste ist noch nicht freigeschaltet. Deine Adresse wurde nicht gespeichert und nicht gesendet.';
});
