/* --------------------------------------------------------------- hangul-anim
   Pull a syllable apart into its letters, swap the letters that change, then
   put it back together.

   A syllable is rendered as three absolutely positioned pieces (초성/중성/종성)
   inside a fixed box, arranged by the shape of the vowel. The animation moves
   those pieces rather than cross-fading whole glyphs, which is the point: you
   can see that 덥 becomes 더워 because the ㅂ leaves and a 우 takes its place. */
(function () {
  const YK = (window.YK = window.YK || {});
  const J = YK.jamo;
  if (!J) return;
  const { h } = YK;

  /* Where each piece's CENTRE sits, as a percentage of the cell. Centres, not
     corners: a jamo glyph has its own height, and positioning by top-left made
     the final consonant hang out of the box. */
  const SLOTS = {
    // with a final consonant the two upper pieces sit higher to make room
    v: { cho: [28, 34], jung: [74, 34], jong: [50, 74] },  // ㅏㅓㅣ… : side by side
    h: { cho: [50, 22], jung: [50, 52], jong: [50, 78] },  // ㅗㅜㅡ : stacked
    m: { cho: [26, 32], jung: [74, 54], jong: [50, 78] },  // ㅘㅝㅢ : mixed
  };
  const SLOTS_NO_JONG = {
    v: { cho: [28, 48], jung: [74, 48] },                  // centred when there is no 받침
    h: { cho: [50, 36], jung: [50, 64] },
    m: { cho: [26, 46], jung: [74, 62] },
  };
  const CENTRE = 'translate(-50%, -50%)';
  const FLY = {
    cho: [-0.22, -0.18], jung: [0.24, -0.12], jong: [0, 0.24],
  };

  function piecesOf(ch) {
    const p = J.split(ch);
    if (!p) return null;
    return { cho: p.cho, jung: p.jung, jong: p.jong, layout: J.layoutOf(ch) };
  }

  /* one syllable, as a box with its letters placed inside */
  function cell(ch) {
    const p = piecesOf(ch);
    const el = h('span', { class: 'hcell' + (p ? ' hcell--' + p.layout : ''), 'data-ch': ch });
    if (!p) { el.classList.add('hcell--raw'); el.textContent = ch; return el; }
    const slots = p.jong ? SLOTS[p.layout] : SLOTS_NO_JONG[p.layout];
    for (const role of ['cho', 'jung', 'jong']) {
      const g = p[role];
      if (!g || !slots[role]) continue;
      el.appendChild(h('span', {
        class: 'hpart hpart--' + role, 'data-role': role,
        style: { left: slots[role][0] + '%', top: slots[role][1] + '%' },
      }, g));
    }
    return el;
  }

  const partsOf = (c) => Array.from(c.querySelectorAll('.hpart'));

  function fly(cellEl, on, instant) {
    if (instant) cellEl.classList.add('is-instant');
    for (const p of partsOf(cellEl)) {
      const d = FLY[p.dataset.role] || [0, 0];
      p.style.transform = on
        ? `${CENTRE} translate(${d[0]}em, ${d[1]}em)`
        : CENTRE;
      p.style.opacity = on ? '0.25' : '';
    }
    if (instant) requestAnimationFrame(() => cellEl.classList.remove('is-instant'));
  }

  /* longest shared head and tail, so untouched syllables stay put */
  function align(a, b) {
    let p = 0;
    while (p < a.length && p < b.length && a[p] === b[p]) p++;
    let s = 0;
    while (s < a.length - p && s < b.length - p &&
           a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
    return { prefix: p, suffix: s };
  }

  /* Animate fromText into toText inside `root`.
     Returns a function that plays it again. */
  function morph(root, fromText, toText, opts) {
    const timing = Object.assign({ explode: 230, assemble: 340, hold: 1200 }, opts || {});
    const still = YK.anim && YK.anim.still && YK.anim.still();

    function play() {
      YK.clear(root);
      root.classList.remove('is-done');
      const from = [...fromText];
      const to = [...toText];
      const { prefix, suffix } = align(from, to);
      const fromMid = from.slice(prefix, from.length - suffix);
      const toMid = to.slice(prefix, to.length - suffix);

      const row = h('div', { class: 'mrow' });
      from.slice(0, prefix).forEach((s) => row.appendChild(cell(s)));
      const mid = h('span', { class: 'mmid' });
      fromMid.forEach((s) => mid.appendChild(cell(s)));
      row.appendChild(mid);
      to.slice(to.length - suffix).forEach((s) => row.appendChild(cell(s)));
      root.appendChild(row);

      const oldCells = Array.from(mid.querySelectorAll('.hcell'));

      // reduced motion: swap the letters, skip the flight
      if (still) {
        YK.clear(mid);
        toMid.forEach((s) => mid.appendChild(cell(s)));
        root.classList.add('is-done');
        return;
      }

      requestAnimationFrame(() => oldCells.forEach((c) => fly(c, true)));

      setTimeout(() => {
        YK.clear(mid);
        const fresh = toMid.map((s) => {
          const c = cell(s);
          fly(c, true, true);              // start apart, without animating
          return c;
        });
        fresh.forEach((c) => mid.appendChild(c));
        // two frames so the browser has committed the exploded position
        requestAnimationFrame(() => requestAnimationFrame(() => {
          fresh.forEach((c) => fly(c, false));
        }));
      }, timing.explode);

      setTimeout(() => root.classList.add('is-done'), timing.explode + timing.assemble);
    }

    play();
    return play;
  }

  /* A small self-contained widget: the word, a play button, and the animation. */
  function widget(fromText, toText, opts) {
    const stage = h('div', { class: 'morph' });
    const label = h('div', { class: 'morph__label' },
      h('span', { class: 'morph__from' }, fromText),
      h('span', { class: 'morph__arrow' }, '→'),
      h('span', { class: 'morph__to' }, toText));
    let play = null;
    const btn = h('button', { class: 'btn btn--sm', type: 'button' }, '拆开看');
    btn.addEventListener('click', () => { if (play) play(); });
    const wrap = h('div', { class: 'morphwrap' }, label, stage, btn);
    if (opts && opts.auto) YK.anim && YK.anim.onReady(() => { play = morph(stage, fromText, toText); });
    else play = morph(stage, fromText, toText);
    YK.anim && YK.anim.onReady(() => {});
    return wrap;
  }

  YK.hangulAnim = { cell, morph, widget, align };
})();
