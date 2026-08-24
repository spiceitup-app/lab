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


  function applyGameViewportFix() {
    try {
      const doc = frame.contentDocument;
      if (!doc || !doc.documentElement) return;

      let style = doc.querySelector('#spice-ios-viewport-fix');
      if (!style) {
        style = doc.createElement('style');
        style.id = 'spice-ios-viewport-fix';
        style.textContent = `
          html,
          body {
            margin: 0 !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
            background: #00198C !important;
          }

          body {
            overflow-x: hidden !important;
          }

          .app-shell {
            width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
            background:
              radial-gradient(
                60.37% 60.37% at 50% 50%,
                #005FF3 0%,
                #0046CB 40%,
                #0028AD 74.58%,
                #00198C 100%
              ) !important;
          }

          .game-stage {
            min-height: calc(100% - 120px) !important;
          }
        `;
        (doc.head || doc.documentElement).appendChild(style);
      }

      // Direkt zusätzlich setzen, damit auch der iOS-Safe-Area-Bereich
      // nie auf den weißen Standard-Hintergrund zurückfällt.
      doc.documentElement.style.setProperty('background', '#00198C', 'important');
      if (doc.body) {
        doc.body.style.setProperty('background', '#00198C', 'important');
      }
    } catch (_) {
      // Same-origin ist im normalen Hub gegeben.
      // Bei file:// oder restriktiven Browsern bleibt die Spiel-CSS aktiv.
    }
  }

  frame?.addEventListener('load', () => {
    applyGameViewportFix();

    // iOS kann nach dem ersten Layout noch einmal die Viewport-Höhe ändern.
    requestAnimationFrame(applyGameViewportFix);
    window.setTimeout(applyGameViewportFix, 120);
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
