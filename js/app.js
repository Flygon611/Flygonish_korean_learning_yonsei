/* ------------------------------------------------------------------- app
   Wires the shell: navigation, theme, mobile drawer, and the route table. */
(function () {
  const YK = (window.YK = window.YK || {});
  const { h } = YK;

  const NAV = [
    { path: '/',          label: '首页', view: 'home',      icon: 'house' },
    { path: '/hangul',    label: '字母', view: 'hangul',    icon: 'font',         zh: '字母与发音' },
    { path: '/phonetics', label: '音变', view: 'phonetics', icon: 'sound',        zh: '音变规则' },
    { path: '/reading',   label: '课文', view: 'reading',   icon: 'book_open',    zh: '课文精读' },
    { path: '/vocab',     label: '单词', view: 'vocab',     icon: 'tag',          zh: '单词训练' },
    { path: '/grammar',   label: '语法', view: 'grammar',   icon: 'script',       zh: '语法库' },
    { path: '/practice',  label: '练习', view: 'practice',  icon: 'pencil',       zh: '练习' },
    { path: '/lookup',    label: '查词', view: 'lookup',    icon: 'magnifier',    zh: '句子查词' },
    { path: '/cast',      label: '人物', view: 'cast',      icon: 'group',        zh: '登场人物' },
  ];

  /* ------------------------------------------------------------------ icon */
  function icon(name, size) {
    const s = size || 16;
    return h('img', {
      src: 'assets/silk/' + name + '.png',
      width: s, height: s, alt: '', 'aria-hidden': 'true',
      class: 'ico', loading: 'lazy', decoding: 'async',
      style: { width: s + 'px', height: s + 'px' },
    });
  }
  YK.icon = icon;

  /* ----------------------------------------------------------------- theme */
  function initTheme() {
    const q = new URLSearchParams((location.hash.split('?')[1] || ''));
    const forced = q.get('theme');
    if (forced === 'dark' || forced === 'light') {
      try { localStorage.setItem('yk1.theme', forced); } catch (e) { /* ignore */ }
    }
    const saved = (() => { try { return localStorage.getItem('yk1.theme'); } catch (e) { return null; } })();
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;

    const btn = document.getElementById('themeBtn');
    btn.querySelector('.themebtn__label').textContent = theme === 'dark' ? '浅色模式' : '深色模式';
    btn.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      btn.querySelector('.themebtn__label').textContent = next === 'dark' ? '浅色模式' : '深色模式';
      try { localStorage.setItem('yk1.theme', next); } catch (e) { /* ignore */ }
    });
  }

  /* ------------------------------------------------------------------- nav */
  function buildNav() {
    const nav = document.getElementById('nav');
    const pill = document.getElementById('navPill');
    for (const item of NAV) {
      const a = h('a', { class: 'nav__item', href: '#' + item.path, 'data-path': item.path },
        h('span', { class: 'nav__icon' }, icon(item.icon)),
        h('span', {}, item.label));
      nav.appendChild(a);
    }
    document.getElementById('nav').appendChild(pill);
    pill.classList.add('is-ready');
    return { nav, pill };
  }

  function syncNav(path) {
    const items = YK.qsa('.nav__item');
    let active = null;
    for (const a of items) {
      const on = a.dataset.path === path;
      a.classList.toggle('is-active', on);
      if (on) active = a;
    }
    const pill = document.getElementById('navPill');
    if (active && pill) {
      const top = active.offsetTop;
      const hgt = active.offsetHeight;
      pill.style.height = hgt + 'px';
      pill.style.transform = 'translateY(' + top + 'px)';
    }
    const meta = NAV.find((n) => n.path === path);
    document.getElementById('pageTitle').textContent = meta ? (meta.zh || meta.label) : '学习台';
  }

  /* --------------------------------------------------------------- drawer */
  function initDrawer() {
    const sidebar = document.getElementById('sidebar');
    const scrim = document.getElementById('scrim');
    const btn = document.getElementById('menuBtn');
    const set = (on) => {
      sidebar.classList.toggle('is-open', on);
      btn.setAttribute('aria-expanded', String(on));
      if (on) {
        scrim.hidden = false;
        requestAnimationFrame(() => scrim.classList.add('is-on'));
      } else {
        scrim.classList.remove('is-on');
        setTimeout(() => { if (!sidebar.classList.contains('is-open')) scrim.hidden = true; }, 240);
      }
    };
    btn.addEventListener('click', () => set(!sidebar.classList.contains('is-open')));
    scrim.addEventListener('click', () => set(false));
    document.getElementById('nav').addEventListener('click', (e) => {
      if (e.target.closest('.nav__item') && window.innerWidth <= 900) set(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { set(false); YK.closeAll(); }
    });
  }

  /* ------------------------------------------------------------------ boot */
  function boot() {
    initTheme();
    buildNav();
    initDrawer();

    /* popovers bind their own outside-click / scroll dismissal (see core/ui.js),
       so the opening click never closes what it just opened. */

    YK.onRouteChange = (path) => {
      syncNav(path);
      const s = document.getElementById('streakNum');
      s.textContent = String(YK.store.streak());
      document.getElementById('streakChip').title =
        '连续学习 ' + YK.store.streak() + ' 天 · 今天 ' + YK.store.todayCount() + ' 题 · 已知单词 ' +
        YK.store.knownCount() + ' 个';
    };

    const routes = {};
    for (const item of NAV) routes[item.path] = YK.views[item.view];
    YK.router.register(routes);
    YK.router.start(document.getElementById('view'));
    YK.store.bumpStreak();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
