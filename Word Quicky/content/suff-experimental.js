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
  => Anzeige: 1–4 Strafschlücke
*/
window.SUFF_EXPERIMENTAL = {
  1: {
    sips:  [{ value: 0, weight: 100 }],
    shots: [{ value: 0, weight: 100 }]
  },
  2: {
    sips: [
      { value: 1, weight: 40 },
      { value: 2, weight: 30 },
      { value: 3, weight: 20 },
      { value: 4, weight: 10 }
    ],
    shots: [{ value: 0, weight: 100 }]
  },
  3: {
    sips: [
      { value: 1, weight: 10 },
      { value: 2, weight: 15 },
      { value: 3, weight: 20 },
      { value: 4, weight: 25 },
      { value: 5, weight: 20 },
      { value: 6, weight: 10 }
    ],
    shots: [
      { value: 0, weight: 50 },
      { value: 1, weight: 50 }
    ]
  },
  4: {
    sips: [
      { value: 3, weight: 5 },
      { value: 4, weight: 8 },
      { value: 5, weight: 10 },
      { value: 6, weight: 12 },
      { value: 7, weight: 15 },
      { value: 8, weight: 20 },
      { value: 9, weight: 15 },
      { value: 10, weight: 15 }
    ],
    shots: [
      { value: 0, weight: 10 },
      { value: 1, weight: 25 },
      { value: 2, weight: 40 },
      { value: 3, weight: 25 }
    ]
  }
};
