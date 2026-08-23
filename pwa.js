// Sorgt dafür, dass interne Links innerhalb der installierten Web-App bleiben.
(() => {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (!isStandalone) return;

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    if (link.hasAttribute('download')) return;
    if (link.target && link.target !== '_self') return;

    const url = new URL(link.href, window.location.href);

    // Nur interne Seiten derselben GitHub-Pages-Web-App übernehmen.
    if (url.origin !== window.location.origin) return;

    event.preventDefault();
    window.location.assign(url.href);
  });
})();
