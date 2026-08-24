(() => {
  const gameView = document.querySelector('#gameView');
  const frame = document.querySelector('#gameFrame');

  const games = {
    'word-quicky': {
      tile: document.querySelector('#wordQuickyTile'),
      src: 'Games/Word%20Quicky/index.html',
      title: 'Word Quicky',
      exitType: 'word-quicky:exit'
    },
    'drehrad': {
      tile: document.querySelector('#drehradTile'),
      src: 'Games/Drehrad/index.html',
      title: 'Drehrad',
      exitType: 'drehrad:exit'
    },
    '2-dumme-1-gedanke': {
      tile: document.querySelector('#zweiDummeEinGedankeTile'),
      src: 'Games/2%20Dumme%201%20Gedanke/index.html',
      title: '2 Dumme 1 Gedanke',
      exitType: '2-dumme-1-gedanke:exit'
    },
    'mystery-cards': {
      tile: document.querySelector('#mysteryCardsTile'),
      src: 'Games/Mystery%20Cards/index.html',
      title: 'Mystery Cards',
      exitType: 'mystery-cards:exit'
    }
  };

  let activeGame = null;
  let navigationLocked = false;

  function cleanUrl() {
    return `${window.location.pathname}${window.location.search}`;
  }

  function showGame(key, { pushHistory = true } = {}) {
    const game = games[key];
    if (!game || navigationLocked) return;

    activeGame = key;
    frame.title = game.title;

    const wanted = new URL(game.src, window.location.href).href;
    if (frame.src !== wanted) {
      frame.src = game.src;
    }

    gameView.classList.add('is-open');
    gameView.setAttribute('aria-hidden', 'false');
    document.body.classList.add('game-is-open');

    if (pushHistory) {
      history.pushState({ view: key }, '', `#${key}`);
    }
  }

  function hideGame({ updateHistory = true } = {}) {
    if (!activeGame && !gameView.classList.contains('is-open')) return;

    navigationLocked = true;

    gameView.classList.remove('is-open');
    gameView.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('game-is-open');
    activeGame = null;

    // Wichtig: nicht history.back() verwenden.
    // Dadurch kann kein zuvor geöffnetes Spiel wieder "hochpoppen".
    if (updateHistory) {
      history.replaceState({ view: 'games' }, '', cleanUrl());
    }

    // Das alte Spiel bleibt nicht als aktive Seite im iframe hängen.
    // Kurze Verzögerung verhindert ein sichtbares Flackern beim Schließen.
    window.setTimeout(() => {
      frame.src = 'about:blank';
      frame.title = 'Spiel';
      navigationLocked = false;
    }, 80);
  }

  Object.entries(games).forEach(([key, game]) => {
    game.tile?.addEventListener('click', (event) => {
      // Lokal per file:// normal navigieren, da iframe/file-Sicherheitsregeln
      // je nach Browser unterschiedlich sind.
      if (window.location.protocol === 'file:') return;

      event.preventDefault();

      if (activeGame || navigationLocked) return;
      showGame(key);
    });
  });

  window.addEventListener('message', (event) => {
    if (event.source !== frame.contentWindow) return;

    const current = activeGame ? games[activeGame] : null;
    if (!current) return;

    if (event.data?.type === current.exitType) {
      hideGame({ updateHistory: true });
    }
  });

  window.addEventListener('popstate', () => {
    const key = window.location.hash.replace(/^#/, '');

    if (games[key]) {
      // Browser-Zurück/Vorwärts auf einen Spielzustand.
      if (activeGame !== key) {
        navigationLocked = false;
        showGame(key, { pushHistory: false });
      }
      return;
    }

    // Zur Spieleübersicht zurück.
    hideGame({ updateHistory: false });
  });

  // Beim Laden immer einen definierten Grundzustand setzen.
  const initialKey = window.location.hash.replace(/^#/, '');
  if (games[initialKey]) {
    showGame(initialKey, { pushHistory: false });
  } else {
    history.replaceState({ view: 'games' }, '', cleanUrl());
  }
})();
