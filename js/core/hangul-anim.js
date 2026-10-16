/* --------------------------------------------------------------- hangul-anim
   Watch a Korean word change, letter by letter.

   The end state is always a NORMAL WORD, not a pile of jamo — the letters only
   exist in the middle of the animation:

     1. the word sits still, with a dashed box on the syllables that change
     2. those syllables open into their letters
     3. letters the new form does not need rise or sink away and fade
     4. the letters that survive travel to their new slot, with a curved arrow
     5. everything closes back into the finished word

   Step 4 is why this exists: in 한국어 → 한구거 you can watch the 받침 ㄱ let go
   of 국 and slide across into 거. That is the rule itself, not a drawing of it. */
(function () {
  const YK = (window.YK = window.YK || {});
  const J = YK.jamo;
  if (!J) return;
  const { h } = YK;

  const W = 1.0, H = 1.32;          // one syllable box, in em

  /* a 겹받침 is two consonants in one slot — which is exactly what splits in
     앉아요 -> 안자요: the ㄴ stays as the 받침, the ㅈ leaves to become the next
     syllable's initial. Treating ㄵ as one glyph throws the rule away. */
  const DOUBLE_JONG = {
    'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'],
    'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'],
    'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'],
    'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ'],
  };

  /* Real Hangul composition geometry, as [x, y, w, h] fractions of the cell.
     Each piece is drawn centred inside its own box.

     This matters more than it looks: a jamo glyph's ink is only about half its
     em box, so a piece must be rendered at close to 1em to actually fill the
     space it occupies in a real syllable — which is why the first attempt
     (uniform 0.66em letters) read as a cramped jumble instead of 앉. */
  const BOX = {
    //                cho                    jung                    jong
    v:  { cho: [0.00, 0.06, 0.50, 0.56], jung: [0.47, 0.06, 0.53, 0.56], jong: [0.08, 0.66, 0.84, 0.30] },
    v0: { cho: [0.00, 0.16, 0.50, 0.68], jung: [0.47, 0.16, 0.53, 0.68] },
    h:  { cho: [0.06, 0.00, 0.88, 0.42], jung: [0.06, 0.38, 0.88, 0.30], jong: [0.08, 0.68, 0.84, 0.30] },
    h0: { cho: [0.06, 0.08, 0.88, 0.44], jung: [0.06, 0.46, 0.88, 0.44] },
    m:  { cho: [0.00, 0.04, 0.50, 0.54], jung: [0.48, 0.10, 0.52, 0.50], jong: [0.08, 0.66, 0.84, 0.30] },
    m0: { cho: [0.00, 0.14, 0.50, 0.62], jung: [0.46, 0.22, 0.54, 0.62] },
  };

  /* a 받침 is drawn smaller in a real syllable; the rest fill their box */
  const SIZE = { cho: 0.98, jung: 0.94, jong: 0.70 };

  const centreOf = (box) => [box[0] + box[2] / 2, box[1] + box[3] / 2];

  function boxesFor(ch) {
    const p = J.split(ch);
    if (!p) return null;
    const layout = J.layoutOf(ch);
    const set = p.jong ? BOX[layout] : BOX[layout + '0'] || BOX[layout];
    const out = [];
    if (p.cho && set.cho) out.push({ role: 'cho', glyph: p.cho, box: set.cho, size: SIZE.cho });
    if (p.jung && set.jung) out.push({ role: 'jung', glyph: p.jung, box: set.jung, size: SIZE.jung });
    if (p.jong && set.jong) {
      const pair = DOUBLE_JONG[p.jong];
      if (pair) {
        // 겹받침: two consonants sharing the final slot, side by side
        const b = set.jong;
        out.push({ role: 'jong', glyph: pair[0], box: [b[0], b[1], b[2] * 0.5, b[3]], size: SIZE.jong });
        out.push({ role: 'jong2', glyph: pair[1], box: [b[0] + b[2] * 0.5, b[1], b[2] * 0.5, b[3]], size: SIZE.jong });
      } else {
        out.push({ role: 'jong', glyph: p.jong, box: set.jong, size: SIZE.jong });
      }
    }
    return out;
  }

  /* A 겹받침 is two consonants sharing one slot — and that is the whole point of
     앉아요 -> 안자요: the ㄵ splits, the ㄴ stays as the 받침 and the ㅈ leaves to
     become the next syllable's initial. Treating ㄵ as one glyph loses the rule,
     so it is expanded here. */
  function lettersOf(ch) {
    const list = boxesFor(ch);
    if (!list) return [];
    return list.map((L) => {
      const c = centreOf(L.box);
      return { role: L.role, glyph: L.glyph, x: c[0], y: c[1], size: L.size };
    });
  }

  /* longest shared head and tail, so untouched syllables never move */
  function align(a, b) {
    let p = 0;
    while (p < a.length && p < b.length && a[p] === b[p]) p++;
    let s = 0;
    while (s < a.length - p && s < b.length - p &&
           a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
    return { prefix: p, suffix: s };
  }

  /* a plain, correctly rendered syllable — the resting state */
  const syl = (ch) => h('span', { class: 'msyl', 'data-ch': ch }, ch);

  /* One syllable opened into its letters. The composed glyph STAYS in the box
     underneath, so the letters can fade in over it — the syllable dissolves
     instead of jumping to a different-looking arrangement. */
  function openSyl(ch) {
    const box = h('span', { class: 'msyl msyl--open' });
    box.appendChild(h('span', { class: 'msyl__glyph' }, ch));
    const letters = lettersOf(ch);
    for (const L of letters) {
      const el = h('span', {
        class: 'mletter', 'data-role': L.role,
        style: { left: (L.x * W) + 'em', top: (L.y * H) + 'em',
                 fontSize: L.size.toFixed(2) + 'em' },
      }, L.glyph);
      L.el = el;
      box.appendChild(el);
    }
    return { box, letters };
  }

  /* pair the letters up: what leaves, what travels, what arrives */
  function match(oldL, newL) {
    const taken = new Set();
    const moves = [];
    for (const o of oldL) {
      let idx = newL.findIndex((n, i) => !taken.has(i) && n.glyph === o.glyph && n.role === o.role);
      if (idx < 0) idx = newL.findIndex((n, i) => !taken.has(i) && n.glyph === o.glyph);
      if (idx >= 0) { taken.add(idx); moves.push([o, newL[idx]]); }
    }
    return {
      moves,
      leaves: oldL.filter((o) => !moves.some((m) => m[0] === o)),
      arrives: newL.filter((n, i) => !taken.has(i)),
    };
  }

  const CENTRE = 'translate(-50%, -50%)';
  const rowFontSize = (row) => parseFloat(getComputedStyle(row).fontSize) || 44;

  /* Curved arrows from where a letter was to where it goes, drawn over the row
     and revealed with dash-offset so they "point" while the letter travels. */
  function drawArrows(svg, root, from, to, row) {
    const box = row.getBoundingClientRect();
    const host = root.getBoundingClientRect();
    const fs = rowFontSize(row);
    const w = box.width || 1, hgt = box.height || 1;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt);
    svg.setAttribute('width', w);
    svg.setAttribute('height', hgt);
    svg.style.left = (box.left - host.left) + 'px';
    svg.style.top = (box.top - host.top) + 'px';
    svg.innerHTML = '';
    const NS = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = '<marker id="ykarrowhead" viewBox="0 0 10 10" refX="8" refY="5" ' +
      'markerWidth="5" markerHeight="5" orient="auto-start-reverse">' +
      '<path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker>';
    svg.appendChild(defs);
    from.forEach((f, i) => {
      const g = to[i];
      const x1 = f.x * fs, y1 = f.y * fs, x2 = g.x * fs, y2 = g.y * fs;
      if (Math.hypot(x2 - x1, y2 - y1) < 8) return;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      const bow = Math.min(26, len * 0.34);
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' Q ' + (mx + (-dy / len) * bow) + ' ' +
        (my + (dx / len) * bow) + ' ' + x2 + ' ' + y2);
      path.setAttribute('class', 'marrow__path');
      path.style.strokeDasharray = '400';
      path.style.strokeDashoffset = '400';
      svg.appendChild(path);
      setTimeout(() => {
        path.style.transition = 'stroke-dashoffset 640ms var(--ease-out), opacity 320ms linear';
        path.style.strokeDashoffset = '0';
      }, 140 + i * 120);
    });
  }

  function morph(root, fromText, toText, opts) {
    const t = Object.assign({ hold: 1000, mark: 420, move: 1050, close: 460, size: 0 }, opts || {});
    const still = YK.anim && YK.anim.still && YK.anim.still();
    let timers = [];
    const clearT = () => { timers.forEach(clearTimeout); timers = []; };

    function play() {
      clearT();
      YK.clear(root);
      root.classList.add('morphroot');
      root.classList.remove('is-done');
      const stale = root.querySelector('.marrow');
      if (stale) stale.remove();

      const from = [...fromText], to = [...toText];
      const { prefix, suffix } = align(from, to);
      const midFrom = from.slice(prefix, from.length - suffix);
      const midTo = to.slice(prefix, to.length - suffix);

      const row = h('div', { class: 'mrow' });
      from.slice(0, prefix).forEach((c) => row.appendChild(syl(c)));
      const mid = h('span', { class: 'mmid' });
      row.appendChild(mid);
      to.slice(to.length - suffix).forEach((c) => row.appendChild(syl(c)));
      root.appendChild(row);
      if (t.size) row.style.fontSize = t.size + 'px';

      if (still) {                                   // reduced motion: just answer
        midTo.forEach((c) => mid.appendChild(syl(c)));
        root.classList.add('is-done');
        return;
      }

      const plain = midFrom.map((c) => {             // 1. the word as it is
        const s = syl(c);
        mid.appendChild(s);
        return s;
      });

      timers.push(setTimeout(() => {                 // 2. box the part that changes
        plain.forEach((s) => s.classList.add('is-target'));
      }, t.mark));

      timers.push(setTimeout(() => {                 // 3. open into letters
        YK.clear(mid);
        const opened = [];
        midFrom.forEach((c, idx) => {
          const { box, letters } = openSyl(c);
          box.classList.add('is-target');
          mid.appendChild(box);
          letters.forEach((L) => opened.push(Object.assign({}, L, { cell: idx })));
        });

        timers.push(setTimeout(() => {               // 3 + 4. leave / travel / arrive
          const oldL = [], newL = [];
          midFrom.forEach((c, i) => lettersOf(c).forEach((L) => oldL.push(Object.assign({}, L, { cell: i }))));
          midTo.forEach((c, i) => lettersOf(c).forEach((L) => newL.push(Object.assign({}, L, { cell: i }))));
          const { moves, leaves, arrives } = match(oldL, newL);
          const byKey = new Map();
          opened.forEach((L) => byKey.set(L.cell + ':' + L.role, L.el));

          leaves.forEach((L) => {
            const el = byKey.get(L.cell + ':' + L.role);
            if (!el) return;
            el.style.transform = CENTRE + ' translate(0, ' + (L.role === 'cho' ? -1.6 : 1.9) + 'em)';
            el.style.opacity = '0';
          });

          /* The arrow is drawn over the whole ROW, so its coordinates have to
             include the unchanged syllables that come before the mid section —
             the letters themselves are positioned inside their own box. */
          const base = prefix;
          const arrowFrom = [], arrowTo = [];
          moves.forEach(([o, n]) => {
            const el = byKey.get(o.cell + ':' + o.role);
            if (!el) return;
            const dx = (n.cell - o.cell) * W + (n.x - o.x);
            const dy = (n.y - o.y) * H;
            el.style.transform = CENTRE + ' translate(' + dx + 'em, ' + dy + 'em)';
            if (Math.hypot(dx, dy) > 0.45) {
              arrowFrom.push({ x: (base + o.cell + o.x) * W, y: o.y * H });
              arrowTo.push({ x: (base + n.cell + n.x) * W, y: n.y * H });
            }
          });

          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('class', 'marrow');
          root.appendChild(svg);
          drawArrows(svg, root, arrowFrom, arrowTo, row);

          arrives.forEach((n) => {
            const host = mid.children[n.cell] || mid;
            const el = h('span', {
              class: 'mletter is-arriving', 'data-role': n.role,
              style: { left: (n.x * W) + 'em', top: (n.y * H) + 'em',
                       fontSize: n.size.toFixed(2) + 'em' },
            }, n.glyph);
            host.appendChild(el);
            requestAnimationFrame(() => requestAnimationFrame(() => {
              el.style.opacity = '1';
              el.style.transform = CENTRE;
            }));
          });
        }, 60));
      }, t.hold));

      timers.push(setTimeout(() => {                 // 5. close into the finished word
        const svg = root.querySelector('.marrow');
        if (svg) svg.classList.add('is-out');
        const boxes = Array.from(mid.children);
        if (boxes.length === midTo.length) {
          // same syllable count: dissolve each box into its finished glyph
          boxes.forEach((box, i) => {
            const g = box.querySelector('.msyl__glyph');
            if (g) {
              g.textContent = midTo[i];
              box.classList.remove('is-target');
              box.classList.remove('msyl--open');
              box.dataset.ch = midTo[i];
            } else {
              box.textContent = midTo[i];
              box.dataset.ch = midTo[i];
              box.classList.remove('is-target');
            }
          });
          timers.push(setTimeout(() => {
            boxes.forEach((box) => box.querySelectorAll('.mletter').forEach((l) => l.remove()));
          }, t.close));
        } else {
          YK.clear(mid);
          midTo.forEach((c) => {
            const s = syl(c);
            s.classList.add('is-in');
            mid.appendChild(s);
          });
        }
        root.classList.add('is-done');
      }, t.hold + t.move));

      timers.push(setTimeout(() => {
        const svg = root.querySelector('.marrow');
        if (svg) svg.remove();
        mid.querySelectorAll('.is-target').forEach((e) => e.classList.remove('is-target'));
      }, t.hold + t.move + t.close));
    }

    play();
    return play;
  }

  /* the first implementation's per-syllable box; kept because the tests use it */
  function cell(ch) {
    const el = h('span', { class: 'hcell', 'data-ch': ch });
    const letters = lettersOf(ch);
    if (!letters.length) { el.classList.add('hcell--raw'); el.textContent = ch; return el; }
    el.classList.add('hcell--' + J.layoutOf(ch));
    for (const L of letters) {
      el.appendChild(h('span', {
        class: 'hpart hpart--' + L.role, 'data-role': L.role,
        style: { left: (L.x * 100) + '%', top: (L.y * 100) + '%',
                 fontSize: L.size.toFixed(2) + 'em' },
      }, L.glyph));
    }
    return el;
  }

  function widget(fromText, toText, opts) {
    const stage = h('div', { class: 'morph2' });
    const play = morph(stage, fromText, toText, opts);
    const btn = h('button', { class: 'btn btn--sm', type: 'button' }, '拆开看');
    btn.addEventListener('click', () => play());
    return h('div', { class: 'morphwrap' },
      h('div', { class: 'morph__label' },
        h('span', { class: 'morph__from' }, fromText),
        h('span', { class: 'morph__arrow' }, '→'),
        h('span', { class: 'morph__to' }, toText)),
      btn, stage);
  }

  YK.hangulAnim = { cell, morph, widget, align, lettersOf };
})();
