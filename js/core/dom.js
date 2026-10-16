/* ---------------------------------------------------------------- dom util
   Tiny helpers. Views mostly build HTML strings and wire behaviour with
   delegated listeners, which keeps the code short and the DOM cheap. */
(function () {
  const YK = (window.YK = window.YK || {});

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs && (typeof attrs !== 'object' || attrs.nodeType || Array.isArray(attrs))) {
      kids.unshift(attrs); attrs = null;
    }
    for (const k in (attrs || {})) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    add(el, kids);
    return el;
  }

  function add(parent, kids) {
    for (const kid of kids) {
      if (kid == null || kid === false) continue;
      if (Array.isArray(kid)) add(parent, kid);
      else if (kid.nodeType) parent.appendChild(kid);
      else parent.appendChild(document.createTextNode(String(kid)));
    }
  }

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const qs = (sel, root) => (root || document).querySelector(sel);
  const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function delegate(root, type, sel, fn) {
    root.addEventListener(type, (e) => {
      const t = e.target.closest(sel);
      if (t && root.contains(t)) fn(e, t);
    });
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  /* Same child handling as h(), for the places that build a node and then fill
     it. Element.append() stringifies null/false into "null"/"false" and turns
     an array into "[object HTMLElement],…", so never call it directly. */
  function mount(parent, ...kids) { add(parent, kids); return parent; }

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const sample = (arr, n) => shuffle(arr).slice(0, n);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  /* split a korean sentence into clickable word spans, keeping punctuation */
  const HANGUL = /[\uac00-\ud7a3]/;
  function tokens(sentence) {
    const out = [];
    const parts = String(sentence).split(/(\s+)/);
    for (const p of parts) {
      if (!p) continue;
      if (/^\s+$/.test(p)) { out.push({ kind: 'space', text: p }); continue; }
      let buf = '';
      for (const ch of p) {
        const isWord = /[\uac00-\ud7a3\u3131-\u318e\u1100-\u11ff0-9A-Za-z]/.test(ch);
        if (isWord) buf += ch;
        else { if (buf) { out.push({ kind: 'word', text: buf }); buf = ''; }
               out.push({ kind: 'punct', text: ch }); }
      }
      if (buf) out.push({ kind: 'word', text: buf });
    }
    return out;
  }

  YK.h = h; YK.esc = esc; YK.qs = qs; YK.qsa = qsa; YK.delegate = delegate;
  YK.clear = clear; YK.mount = mount; YK.shuffle = shuffle; YK.sample = sample; YK.pick = pick;
  YK.clamp = clamp; YK.pct = pct; YK.tokens = tokens; YK.HANGUL = HANGUL;
  YK.frag = (kids) => { const f = document.createDocumentFragment(); add(f, [].concat(kids)); return f; };
})();
