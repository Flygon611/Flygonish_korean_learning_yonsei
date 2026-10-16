/* ------------------------------------------------------------------ router
   Hash routing keeps the site openable straight from the file system (no
   server, no build step). Each view returns a DOM node; the outgoing view is
   removed immediately and the incoming one plays a short ease-out entrance, so
   navigation reads as a cut with a settle rather than a wait. */
(function () {
  const YK = (window.YK = window.YK || {});
  const routes = new Map();
  let mount = null;
  let current = null;
  /* Where the reader has been. Tapping a word in a dialogue leads to the word
     page, and that page needs a way back to the sentence it came from. */
  let trail = [];

  function parse(hash) {
    const raw = (hash || location.hash || '#/').replace(/^#/, '') || '/';
    const [path, query] = raw.split('?');
    const params = {};
    for (const kv of (query || '').split('&')) {
      if (!kv) continue;
      const i = kv.indexOf('=');
      const k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i));
      const v = i < 0 ? '' : decodeURIComponent(kv.slice(i + 1));
      params[k] = v;
    }
    return { path: path || '/', params };
  }

  function register(map) { for (const k in map) routes.set(k, map[k]); }

  const go = (to) => { location.hash = to.startsWith('#') ? to : '#' + to; };

  function render() {
    if (!mount) return;
    const { path, params } = parse();
    const view = routes.get(path) || routes.get('/');
    if (!view) return;

    YK.tts && YK.tts.stop();
    YK.closeAll && YK.closeAll();

    let node;
    try {
      node = view.render(params);
    } catch (err) {
      node = YK.h('div', { class: 'empty' },
        YK.h('p', {}, '这个页面出错了：' + err.message));
      console.error(err);
    }

    YK.clear(mount);
    if (node) {
      node.classList.add('view-enter');
      mount.appendChild(node);
    }
    const here = location.hash || '#/';
    if (current && current.hash && current.hash !== here) {
      trail.push(current.hash);
      if (trail.length > 24) trail.shift();
    }
    current = { path, params, view, hash: here };
    YK.anim.runReady(mount);

    window.scrollTo({ top: 0, behavior: 'auto' });
    document.title = (view.title || '学习台') + ' · 延世韩国语 1';
    YK.onRouteChange && YK.onRouteChange(path, params, view);
    YK.store.setLastRoute(location.hash || '#/');
  }

  /* Step back one page. `fallback` is used when there is nothing to go back to
     — a word page opened straight from a link has no history behind it. */
  function back(fallback) {
    const here = location.hash || '#/';
    while (trail.length) {
      const to = trail.pop();
      if (to && to !== here) { go(to); return true; }
    }
    if (fallback) { go(fallback); return false; }
    return false;
  }

  function start(target) {
    mount = target;
    window.addEventListener('hashchange', render);
    render();
  }

  YK.router = { register, start, go, render, parse, back, current: () => current };
})();
