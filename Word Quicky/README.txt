WORD QUICKY
===========

Projektstruktur:
- index.html                Hauptseite
- styles.css                Design und Animationen
- app.js                    Spielmechanik
- content/spicy-level-1.js  Spicy-Texte Level 1
- content/spicy-level-2.js  Spicy-Texte Level 2
- content/spicy-level-3.js  Spicy-Texte Level 3
- content/suff-normal.js    Normale Suff-Wahrscheinlichkeiten
- content/suff-experimental.js  Experimentelle Suff-Wahrscheinlichkeiten
- Assets/                   Hier kommt dein bestehender Assets-Ordner hinein

Die beiden Suff-Dateien sind Bestandteil dieses ZIPs und werden direkt von index.html geladen.
Die experimentelle Suff Intensity ist nach jedem Neustart ausgeschaltet.

Header:
Der Header nutzt wieder die ursprüngliche 120-px-Geometrie. game_header.svg wird auf eine Fläche von mindestens 520 px bzw. 120vw gezogen und mittig über den Bildschirm gelegt. So kann die SVG seitlich überstehen wie im ursprünglichen Entwurf.
