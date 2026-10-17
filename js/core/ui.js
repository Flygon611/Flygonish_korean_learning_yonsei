/* ------------------------------------------------------------------- ui
   Shared chrome: page headers, progress rings, popovers, toasts, artwork. */
(function () {
  const YK = (window.YK = window.YK || {});
  const { h } = YK;

  /* ---------------------------------------------------------- page header */
  function pageHead(opts) {
    return h('header', { class: 'page-head' },
      h('div', { class: 'page-head__main' },
        h('h1', {}, opts.title),
        opts.sub ? h('p', { class: 'sub' }, opts.sub) : null),
      opts.aside ? h('div', { class: 'page-head__aside' }, opts.aside) : null);
  }

  function sectionTitle(text, aside) {
    return h('div', { class: 'section-title' }, h('span', {}, text), aside || null);
  }

  /* -------------------------------------------------------------- progress */
  function ring(ratio, label, sub, size) {
    const s = size || 92;
    const r = (s - 14) / 2;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', s); svg.setAttribute('height', s);
    svg.setAttribute('aria-hidden', 'true');
    const mk = (cls) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', s / 2); c.setAttribute('cy', s / 2); c.setAttribute('r', r);
      c.setAttribute('class', cls);
      return c;
    };
    svg.appendChild(mk('trk'));
    svg.appendChild(mk('val'));
    const el = h('div', { class: 'ring', style: { width: s + 'px', height: s + 'px' } }, svg,
      h('div', { class: 'ring__label' }, h('span', {}, label), sub ? h('small', {}, sub) : null));
    requestAnimationFrame(() => YK.anim.ring(svg, ratio));
    return el;
  }

  function bar(ratio, cls) {
    const fill = h('div', { class: 'bar__fill' + (cls ? ' ' + cls : '') });
    const wrap = h('div', { class: 'bar', role: 'progressbar' }, fill);
    requestAnimationFrame(() => YK.anim.bar(fill, ratio));
    return wrap;
  }

  /* -------------------------------------------------------------- popovers */
  const layer = () => document.getElementById('popLayer');
  let open = null;

  /* Dismissal belongs to the popover, not to every caller. A trigger click
     still bubbles to the document after the popover opens, so the outside
     listeners are attached one macrotask later — otherwise the opening click
     closes what it just opened. */
  function onOutside(e) {
    if (!open) return;
    if (e && e.target && open.node.contains(e.target)) return;
    closeAll();
  }
  function bindDismiss() {
    document.addEventListener('click', onOutside);
    window.addEventListener('scroll', onOutside, { passive: true });
    window.addEventListener('resize', onOutside);
  }
  function unbindDismiss() {
    document.removeEventListener('click', onOutside);
    window.removeEventListener('scroll', onOutside);
    window.removeEventListener('resize', onOutside);
  }

  function closeAll() {
    if (!open) return;
    const { node, anchor, timer } = open;
    clearTimeout(timer);
    open = null;
    unbindDismiss();
    anchor && anchor.classList.remove('is-pinged');
    if (!node.isConnected) return;
    node.classList.add('is-out');
    setTimeout(() => node.remove(), 130);
  }

  function popover(anchor, content, opts) {
    const wasSame = open && open.anchor === anchor;
    closeAll();
    if (wasSame) return null;

    const node = h('div', { class: 'pop', role: 'dialog' }, content);
    node.addEventListener('click', (e) => e.stopPropagation());
    layer().appendChild(node);

    const r = anchor.getBoundingClientRect();
    const w = node.offsetWidth, hgt = node.offsetHeight;
    const scrollY = window.scrollY, scrollX = window.scrollX;
    let left = r.left + scrollX + r.width / 2 - w / 2;
    left = YK.clamp(left, 10 + scrollX, window.innerWidth + scrollX - w - 10);
    let top = r.bottom + scrollY + 8;
    let origin = 'top center';
    if (top + hgt > window.innerHeight + scrollY - 8) {
      top = r.top + scrollY - hgt - 8;
      origin = 'bottom center';
    }
    node.style.left = left + 'px';
    node.style.top = Math.max(8 + scrollY, top) + 'px';
    node.style.setProperty('--pop-origin', origin);

    anchor.classList.remove('is-pinged');
    void anchor.offsetWidth;
    anchor.classList.add('is-pinged');
    open = { node, anchor, timer: setTimeout(bindDismiss, 0) };
    if (opts && opts.focus) node.focus();
    return node;
  }

  /* ---------------------------------------------------------------- toasts */
  function toast(msg, kind) {
    const ico = kind === 'good' ? YK.icon('tick') : kind === 'bad' ? YK.icon('cross') : null;
    const el = h('div', { class: 'toast' + (kind ? ' is-' + kind : '') },
      ico ? h('span', { class: 'row', style: { gap: '6px' } }, ico) : null, msg);
    document.getElementById('toastLayer').appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 260);
    }, 1700);
  }

  /* --------------------------------------------------------------- artwork */
  function art(slug, i) {
    const list = (window.YK_ART || {})[slug] || [];
    if (!list.length) return null;
    const pickIndex = (i == null) ? Math.floor(Math.random() * list.length) : i % list.length;
    return list[pickIndex];
  }
  function artImg(slug, i, cls) {
    const src = art(slug, i);
    if (!src) return null;
    return h('img', { src, alt: '', class: cls, loading: 'lazy', decoding: 'async' });
  }

  /* -------------------------------------------------------- cast portraits
     Cropped from the textbook's 「나오는 사람」 page (see the site credits). */
  function castOf(name) {
    if (!name) return null;
    const list = window.YK_CAST || [];
    return list.find((c) => c.short === name || c.ko === name || c.id === name) || null;
  }
  function castPhoto(name, size, face) {
    const c = castOf(name);
    if (!c || !c.id) return null;
    return h('img', {
      src: 'assets/cast/' + (face ? 'face-' : '') + c.id + '.png',
      alt: '', width: size, height: size,
      class: 'castimg', loading: 'lazy', decoding: 'async',
      style: { width: size + 'px', height: size + 'px' },
    });
  }

  /* ------------------------------------------------------------ speaker btn */
  const speakBtn = (text) => YK.tts.button(text);

  /* --------------------------------------------------------------- helpers */
  function chip(text, cls) { return h('span', { class: 'chip' + (cls ? ' ' + cls : '') }, text); }

  function emptyState(text) { return h('div', { class: 'empty' }, text); }

  function options(list, cls) {
    return h('div', { class: 'opts' + (cls ? ' ' + cls : '') }, list);
  }

  /* turn an option's A/B/C key into a tick or a cross once it is graded */
  function answerKey(btn, ok) {
    const key = btn && btn.querySelector('.opt__key');
    if (!key) return;
    YK.clear(key);
    const ico = YK.icon(ok ? 'tick' : 'cross');
    ico.style.filter = 'brightness(0) invert(1)';
    key.appendChild(ico);
  }

  /* korean sentence rendered word by word, each word tappable */
  function koreanWords(sentence, onWord) {
    const wrap = h('span', { class: 'kwrap' });
    for (const t of YK.tokens(sentence)) {
      if (t.kind === 'space') { wrap.appendChild(document.createTextNode(' ')); continue; }
      if (t.kind === 'punct') { wrap.appendChild(document.createTextNode(t.text)); continue; }
      const span = h('span', { class: 'w', role: 'button', tabindex: '0', text: t.text });
      const fire = (e) => { e.stopPropagation(); onWord(t.text, span); };
      span.addEventListener('click', fire);
      span.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(e); } });
      wrap.appendChild(span);
    }
    return wrap;
  }

  /* A way back. Uses the router's own trail rather than history.back(), which
     would walk out of the site when a deep link is opened in a fresh tab. */
  function backBtn(fallback, label) {
    return h('button', {
      class: 'btn btn--sm', type: 'button',
      onclick: () => YK.router.back(fallback),
    }, label || '← 返回');
  }

  /* The small grey line under a word: the sound in brackets when it differs
     from the spelling, then the romanisation. Never invented — if the module
     is missing it renders nothing. */
  function pronLine(word) {
    if (!YK.pron || !word) return null;
    var said = YK.pron.say(word), rom = YK.pron.roman(word);
    if (!rom) return null;
    return h('div', { class: 'pron' },
      said && said !== word ? '[' + said + '] ' : '', rom);
  }

  function wordPop(entry, raw, extra) {
    return h('div', {},
      h('div', { class: 'pop__ko' }, entry ? entry.ko : raw),
      pronLine(entry ? entry.ko : raw),
      entry
        ? h('div', { class: 'pop__zh' }, entry.zh)
        : h('div', { class: 'pop__zh', style: { color: 'var(--warm)' } },
            '词库里没有这个词，可能是活用形或专有名词。'),
      h('div', { class: 'pop__meta' },
        entry && entry.lesson ? chip('第 ' + entry.lesson + ' 课', 'chip--acc') : null,
        entry && entry.src === 'extra' ? chip('常用词') : null,
        chip(raw)),
      h('div', { class: 'pop__row' },
        YK.tts.button(entry ? entry.ko : raw),
        h('a', { class: 'btn btn--sm btn--primary',
          href: '#/word?w=' + encodeURIComponent(entry ? entry.ko : raw) }, '详细 →'),
        YK.conj && YK.conj.canConjugate(entry ? entry.ko : raw)
          ? h('a', { class: 'btn btn--sm', href: '#/conj?w=' + encodeURIComponent(entry.ko) }, '变形')
          : null,
        extra || null));
  }

  YK.ui = {
    pageHead, sectionTitle, ring, bar, popover, closeAll, toast, backBtn,
    art, artImg, speakBtn, chip, emptyState, options, koreanWords, wordPop, answerKey,
    castOf, castPhoto, pronLine,
  };
  YK.closeAll = closeAll;
})();
