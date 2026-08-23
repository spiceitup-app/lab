(() => {
  const tile = document.querySelector('#wordQuickyTile');
  const gameView = document.querySelector('#gameView');
  const frame = document.querySelector('#wordQuickyFrame');

  function openWordQuicky(event) {
    event?.preventDefault();

    if (frame.src === 'about:blank' || !frame.src) {
      frame.src = frame.dataset.src;
    }

    gameView.classList.add('is-open');
    gameView.setAttribute('aria-hidden', 'false');
    document.body.classList.add('game-is-open');

    // Die URL der Haupt-Web-App bleibt gleich, nur der sichtbare Bereich wechselt.
    history.pushState({ view: 'word-quicky' }, '', '#word-quicky');
  }

  function closeWordQuicky({ fromHistory = false } = {}) {
    gameView.classList.remove('is-open');
    gameView.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('game-is-open');

    if (!fromHistory && location.hash === '#word-quicky') {
      history.back();
    }
  }

  tile?.addEventListener('click', openWordQuicky);

  window.addEventListener('message', (event) => {
    if (event.source !== frame.contentWindow) return;
    if (event.data?.type === 'word-quicky:exit') {
      closeWordQuicky();
    }
  });

  window.addEventListener('popstate', () => {
    if (location.hash === '#word-quicky') {
      openWordQuicky();
    } else {
      closeWordQuicky({ fromHistory: true });
    }
  });

  // Falls die App mit #word-quicky neu geladen wird.
  if (location.hash === '#word-quicky') {
    openWordQuicky();
  }
})();
