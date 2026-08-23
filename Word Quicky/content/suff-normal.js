/*
  NORMALE SUFF INTENSITY
  ----------------------
  Hier kannst du die Wahrscheinlichkeiten sehr einfach anpassen.
  weight ist ein relatives Gewicht. Du kannst z. B. 55, 30, 15 oder 0.55, 0.30, 0.15 verwenden.
  Die Werte müssen nicht exakt 100 ergeben, sie werden automatisch relativ zueinander ausgewertet.

  sips  = Strafschlücke
  shots = Shots
*/
window.SUFF_NORMAL = {
  1: {
    sips:  [{ value: 0, weight: 100 }],
    shots: [{ value: 0, weight: 100 }]
  },
  2: {
    sips: [
      { value: 1, weight: 55 },
      { value: 2, weight: 30 },
      { value: 3, weight: 15 }
    ],
    shots: [{ value: 0, weight: 100 }]
  },
  3: {
    sips: [
      { value: 1, weight: 3 },
      { value: 2, weight: 7 },
      { value: 3, weight: 15 },
      { value: 4, weight: 45 },
      { value: 5, weight: 20 },
      { value: 6, weight: 10 }
    ],
    shots: [
      { value: 0, weight: 60 },
      { value: 1, weight: 40 }
    ]
  },
  4: {
    sips: [
      { value: 3, weight: 3 },
      { value: 4, weight: 3 },
      { value: 5, weight: 6 },
      { value: 6, weight: 10 },
      { value: 7, weight: 20 },
      { value: 8, weight: 35 },
      { value: 9, weight: 13 },
      { value: 10, weight: 10 }
    ],
    shots: [
      { value: 0, weight: 15 },
      { value: 1, weight: 25 },
      { value: 2, weight: 45 },
      { value: 3, weight: 15 }
    ]
  }
};
