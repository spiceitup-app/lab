(() => {
  /*
    Die Spiele werden bewusst als normale Seiten innerhalb desselben
    PWA-Scopes geöffnet. Dadurch gibt es auf iOS nur EINEN Viewport
    und nicht zusätzlich einen zweiten Viewport im iframe.

    Die <a href="...">-Links in index.html übernehmen die Navigation.
  */

  const legacyRoutes = {
    '#word-quicky': 'Games/Word%20Quicky/index.html',
    '#drehrad': 'Games/Drehrad/index.html',
    '#mystery-cards': 'Games/Mystery%20Cards/index.html',
    '#2-dumme-1-gedanke': 'Games/2%20Dumme%201%20Gedanke/index.html'
  };

  // Alte gespeicherte Hash-Zustände aus der früheren iframe-Version
  // werden einmal sauber in die echte Spielseite überführt.
  const legacyTarget = legacyRoutes[window.location.hash];
  if (legacyTarget) {
    window.location.replace(legacyTarget);
  }
})();
