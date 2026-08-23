/*
  EXPERIMENTELLE SUFF INTENSITY
  -----------------------------
  Diese Datei funktioniert exakt wie suff-normal.js.
  Ändere einfach value und weight. Die Range im Einstellungsmenü wird automatisch
  aus allen Einträgen mit weight > 0 berechnet.

  Beispiel:
  sips: [
    { value: 1, weight: 50 },
    { value: 2, weight: 30 },
    { value: 4, weight: 20 }
  ]
  => Anzeige: 1–4 Strafschlucke
*/
window.SUFF_EXPERIMENTAL = {
  1: {
    sips:  [{ value: 0, weight: 100 }],
    shots: [{ value: 0, weight: 100 }]
  },
  2: {
    sips: [
      { value: 1, weight: 60 },
      { value: 2, weight: 40 },
    ],
    shots: [{ value: 0, weight: 100 }]
  },
  3: {
    sips: [
      { value: 1, weight: 10 },
      { value: 2, weight: 35 },
      { value: 3, weight: 45 },
      { value: 4, weight: 10 },
    ],
    shots: [
      { value: 0, weight: 100 },
    ]
  },
  4: {
    sips: [
      { value: 3, weight: 30 },
      { value: 4, weight: 35 },
      { value: 5, weight: 25 },
      { value: 6, weight: 10 },
    ],
    shots: [
      { value: 0, weight: 70 },
      { value: 1, weight: 30 },
    ]
  }
};
