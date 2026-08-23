(() => {
  const gameView = document.querySelector('#gameView');
  const frame = document.querySelector('#gameFrame');

  const games = {
    'word-quicky': {
      tile: document.querySelector('#wordQuickyTile'),
      src: 'Word%20Quicky/index.html',
      title: 'Word Quicky',
      exitType: 'word-quicky:exit'
    },
    'drehrad': {
      tile: document.querySelector('#drehradTile'),
      src: 'Drehrad/index.html',
      title: 'Drehrad',
      exitType: 'drehrad:exit'
    }
  };

  let activeGame = null;

  function showGame(key, { pushHistory = true } = {}) {
    const game = games[key];
    if (!game) return;

    activeGame = key;
    frame.title = game.title;

    const wanted = new URL(game.src, window.location.href).href;
    if (frame.src !== wanted) frame.src = game.src;

    gameView.classList.add('is-open');
    gameView.setAttribute('aria-hidden', 'false');
    document.body.classList.add('game-is-open');

    if (pushHistory && location.hash !== `#${key}`) {
      history.pushState({ view: key }, '', `#${key}`);
    }
  }

  function hideGame({ fromHistory = false } = {}) {
    gameView.classList.remove('is-open');
    gameView.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('game-is-open');
    activeGame = null;

    if (!fromHistory && location.hash) history.back();
  }

  Object.entries(games).forEach(([key, game]) => {
    game.tile?.addEventListener('click', (event) => {
      event.preventDefault();
      showGame(key);
    });
  });

  window.addEventListener('message', (event) => {
    if (event.source !== frame.contentWindow) return;
    const game = activeGame ? games[activeGame] : null;
    if (game && event.data?.type === game.exitType) hideGame();
  });

  window.addEventListener('popstate', () => {
    const key = location.hash.replace(/^#/, '');
    if (games[key]) showGame(key, { pushHistory: false });
    else hideGame({ fromHistory: true });
  });

  const initialKey = location.hash.replace(/^#/, '');
  if (games[initialKey]) showGame(initialKey, { pushHistory: false });
})();
