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

  /* The cell is SQUARE, and that is not cosmetic: a real syllable's ink measures
     about 0.83 x 0.89 em (see tools/measure-ink.js), so a 1.32em-tall cell
     stretched every decomposition ~25% too tall — which is what "缩放和位置
     不太对" was. */
  const W = 1.0, H = 1.0;           // one syllable box, in em

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
    // a vertical vowel is a full-height stroke, so it gets most of the height
    // while the initial only occupies the upper part once a 받침 is present
    v:  { cho: [0.02, 0.02, 0.46, 0.52], jung: [0.46, 0.02, 0.44, 0.86], jong: [0.10, 0.70, 0.80, 0.28] },
    v0: { cho: [0.02, 0.16, 0.46, 0.62], jung: [0.46, 0.04, 0.44, 0.90] },
    // a horizontal vowel is a wide stroke, so IT needs the width and the
    // initial/vowel/final stack instead
    h:  { cho: [0.06, 0.00, 0.88, 0.34], jung: [0.04, 0.28, 0.92, 0.48], jong: [0.10, 0.74, 0.80, 0.26] },
    h0: { cho: [0.06, 0.04, 0.88, 0.40], jung: [0.04, 0.44, 0.92, 0.52] },
    m:  { cho: [0.02, 0.02, 0.44, 0.50], jung: [0.46, 0.06, 0.44, 0.80], jong: [0.10, 0.70, 0.80, 0.28] },
    m0: { cho: [0.02, 0.14, 0.44, 0.60], jung: [0.46, 0.16, 0.44, 0.80] },
  };

  /* Measured ink of each jamo as a fraction of its em box (canvas, 200px).
     The numbers differ wildly — ㅇ is 0.57 wide by 0.51 tall, ㅏ is 0.30 by
     0.90, ㄹ is 0.59 by 0.50 — so one font-size for every piece cannot work:
     one part overflows its slot while another floats in the middle of it.
     Sizes are derived from this table instead. */
  const INK = {
    cho: {
    'ㄱ':[0.570,0.480],
    'ㄲ':[0.680,0.480],
    'ㄴ':[0.580,0.475],
    'ㄷ':[0.570,0.485],
    'ㄸ':[0.620,0.480],
    'ㄹ':[0.590,0.500],
    'ㅁ':[0.570,0.480],
    'ㅂ':[0.570,0.495],
    'ㅃ':[0.630,0.485],
    'ㅅ':[0.650,0.510],
    'ㅆ':[0.745,0.475],
    'ㅇ':[0.570,0.505],
    'ㅈ':[0.615,0.495],
    'ㅉ':[0.755,0.510],
    'ㅊ':[0.615,0.570],
    'ㅋ':[0.585,0.505],
    'ㅌ':[0.580,0.485],
    'ㅍ':[0.620,0.490],
    'ㅎ':[0.610,0.590]
    },
    jung: {
    'ㅏ':[0.300,0.895],
    'ㅐ':[0.325,0.895],
    'ㅑ':[0.295,0.895],
    'ㅒ':[0.320,0.895],
    'ㅓ':[0.300,0.895],
    'ㅔ':[0.430,0.895],
    'ㅕ':[0.305,0.895],
    'ㅖ':[0.435,0.895],
    'ㅗ':[0.820,0.450],
    'ㅘ':[0.825,0.895],
    'ㅙ':[0.765,0.895],
    'ㅚ':[0.700,0.900],
    'ㅛ':[0.820,0.470],
    'ㅜ':[0.820,0.465],
    'ㅝ':[0.750,0.895],
    'ㅞ':[0.775,0.895],
    'ㅟ':[0.735,0.895],
    'ㅠ':[0.820,0.465],
    'ㅡ':[0.820,0.075],
    'ㅢ':[0.730,0.895],
    'ㅣ':[0.090,0.895]
    },
    jong: {
    'ㄱ':[0.570,0.480],
    'ㄲ':[0.680,0.480],
    'ㄳ':[0.715,0.495],
    'ㄴ':[0.580,0.475],
    'ㄵ':[0.655,0.495],
    'ㄶ':[0.635,0.520],
    'ㄷ':[0.570,0.485],
    'ㄹ':[0.590,0.500],
    'ㄺ':[0.640,0.485],
    'ㄻ':[0.655,0.485],
    'ㄼ':[0.655,0.485],
    'ㄽ':[0.705,0.495],
    'ㄾ':[0.660,0.485],
    'ㄿ':[0.665,0.485],
    'ㅀ':[0.660,0.520],
    'ㅁ':[0.570,0.480],
    'ㅂ':[0.570,0.495],
    'ㅄ':[0.700,0.495],
    'ㅅ':[0.650,0.510],
    'ㅆ':[0.745,0.475],
    'ㅇ':[0.570,0.505],
    'ㅈ':[0.615,0.495],
    'ㅊ':[0.615,0.570],
    'ㅋ':[0.585,0.505],
    'ㅌ':[0.580,0.485],
    'ㅍ':[0.620,0.490],
    'ㅎ':[0.610,0.590]
    },
  };

  /* the largest size at which this glyph's ink still fits its slot */
  function fit(glyph, role, boxW, boxH) {
    const table = INK[role] || INK.cho;
    const ink = table[glyph] || INK.cho[glyph] || [0.60, 0.50];
    return Math.min(boxW / ink[0], boxH / ink[1]) * 0.94;
  }

  /* Measured by rendering both into the real DOM and diffing the ink boxes, the
     decomposition already lines up with the composed glyph, so no correction. */
  const Y_SHIFT = 0;

  /* slot sizes are fractions of the cell; the cell is W em wide, H em tall */
  const slotSize = (b) => [b[2] * W, b[3] * H];

  const centreOf = (box) => [box[0] + box[2] / 2, box[1] + box[3] / 2 + Y_SHIFT];

  function boxesFor(ch) {
    const p = J.split(ch);
    if (!p) return null;
    const layout = J.layoutOf(ch);
    const set = p.jong ? BOX[layout] : BOX[layout + '0'] || BOX[layout];
    const out = [];
    const push = (role, glyph, box) => {
      const sz = slotSize(box);
      out.push({ role, glyph, box, size: fit(glyph, role === 'jong2' ? 'jong' : role, sz[0], sz[1]) });
    };
    if (p.cho && set.cho) push('cho', p.cho, set.cho);
    if (p.jung && set.jung) push('jung', p.jung, set.jung);
    if (p.jong && set.jong) {
      const pair = DOUBLE_JONG[p.jong];
      if (pair) {
        // 겹받침: two consonants sharing the final slot, side by side
        const b = set.jong;
        push('jong', pair[0], [b[0], b[1], b[2] * 0.5, b[3]]);
        push('jong2', pair[1], [b[0] + b[2] * 0.5, b[1], b[2] * 0.5, b[3]]);
      } else {
        push('jong', p.jong, set.jong);
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

  const CENTRE = 'translate(-50%, -50%)';
  const rowFontSize = (row) => parseFloat(getComputedStyle(row).fontSize) || 44;

  /* Curved arrows from where a letter was to where it goes, drawn over the row
     and revealed with dash-offset so they point while the letter travels. */
  function drawArrows(svg, root, pairs, rowBox, fs) {
    const host = root.getBoundingClientRect();
    const w = rowBox.width || 1, hgt = rowBox.height || 1;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt);
    svg.setAttribute('width', w);
    svg.setAttribute('height', hgt);
    svg.style.left = (rowBox.left - host.left) + 'px';
    svg.style.top = (rowBox.top - host.top) + 'px';
    svg.innerHTML = '';
    const NS = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = '<marker id="ykarrowhead" viewBox="0 0 10 10" refX="8" refY="5" ' +
      'markerWidth="5" markerHeight="5" orient="auto-start-reverse">' +
      '<path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker>';
    svg.appendChild(defs);
    pairs.forEach((p, i) => {
      const x1 = p.x1, y1 = p.y1, x2 = p.x2, y2 = p.y2;
      if (Math.hypot(x2 - x1, y2 - y1) < 8) return;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      const bow = Math.min(30, len * 0.34);
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' Q ' + (mx + (-dy / len) * bow) + ' ' +
        (my + (dx / len) * bow) + ' ' + x2 + ' ' + y2);
      path.setAttribute('class', 'marrow__path');
      path.style.strokeDasharray = '500';
      path.style.strokeDashoffset = '500';
      svg.appendChild(path);
      setTimeout(() => {
        path.style.transition = 'stroke-dashoffset 700ms var(--ease-out), opacity 320ms linear';
        path.style.strokeDashoffset = '0';
      }, 140 + i * 120);
    });
  }

  /* Where each letter of `text` sits, in row coordinates (em from the row's
     top-left). Only used to launch and land the letters that actually travel. */
  function positionsIn(text, offset) {
    const out = [];
    [...text].forEach((ch, i) => {
      for (const L of lettersOf(ch)) {
        out.push({ role: L.role, glyph: L.glyph, cell: i + offset, x: L.x, y: L.y, size: L.size });
      }
    });
    return out;
  }

  /* Pair up the letters of the old and new middle sections. Whatever cannot be
     paired either leaves or arrives — and only the ones that genuinely MOVE are
     ever drawn as free letters. */
  /* Pair the old letters with the new ones.

     Only two things may pair up:
       1. the same letter in the same slot — it did not move at all
       2. a 받침 that becomes the initial of the FOLLOWING syllable

     (2) is 연음화, and it is the only cross-syllable move Korean makes:
     앉아요 -> 안자요, where the ㅈ of ㄵ leaves 앉 and takes over as the initial
     of 자. Anything looser is wrong — matching "the same shape anywhere" sent
     the ㅏ of 가다's 다 flying into the ㅏ of 않은, which means nothing. */
  function planMoves(oldL, newL) {
    const taken = new Set();
    const used = new Set();
    const moves = [];

    function claim(matches) {
      for (const o of oldL) {
        if (used.has(o)) continue;
        const idx = newL.findIndex((n, i) => !taken.has(i) && matches(o, n));
        if (idx >= 0) { taken.add(idx); used.add(o); moves.push([o, newL[idx]]); }
      }
    }

    claim((o, n) => n.cell === o.cell && n.role === o.role && n.glyph === o.glyph);
    claim((o, n) => (o.role === 'jong' || o.role === 'jong2') && n.role === 'cho' &&
                    n.cell === o.cell + 1 && n.glyph === o.glyph);

    return {
      moves,
      gone: oldL.filter((o) => !used.has(o)),
      added: newL.filter((n, i) => !taken.has(i)),
    };
  }

  const glyphed = (ch) => h('span', { class: 'msyl', 'data-ch': ch }, ch);
  const rowOf = (text, targets) => {
    const row = h('div', { class: 'mrow' });
    [...text].forEach((ch, i) => {
      const s = glyphed(ch);
      if (targets && targets.indexOf(i) >= 0) s.classList.add('is-target');
      row.appendChild(s);
    });
    return row;
  };

  function morph(root, fromText, toText, opts) {
    const t = Object.assign({
      hold: 780,      // the word sits still before anything happens
      mark: 420,      // when the dashed boxes appear
      size: 0,
    }, opts || {});
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
      const changed = [];
      for (let i = 0; i < Math.max(midFrom.length, midTo.length); i++) changed.push(prefix + i);

      /* Two rows, but only the old one is on screen while things move. The
         finished word waits underneath, transparent, and takes over at the very
         end — fading it in early meant you saw 배웁니다 spelled out while the
         letters were still in the air. */
      const stage = h('div', { class: 'mstage' });
      const toRow = rowOf(toText, changed);
      toRow.style.cssText = 'position:absolute;left:0;top:0;opacity:0';
      // the dashed boxes belong on the word the reader is LOOKING at
      const fromRow = rowOf(fromText, changed);
      stage.appendChild(toRow);
      stage.appendChild(fromRow);
      root.appendChild(stage);
      if (t.size) stage.style.fontSize = t.size + 'px';

      // what travels, what disappears and what is new — decided letter by letter
      const oldL = positionsIn(midFrom.join(''), prefix);
      const newL = positionsIn(midTo.join(''), prefix);
      const { moves, gone, added } = planMoves(oldL, newL);

      if (still) {                                   // reduced motion: just answer
        fromRow.remove();
        toRow.style.cssText = '';
        root.classList.add('is-done');
        return;
      }

      timers.push(setTimeout(() => {                 // box the part that changes
        fromRow.querySelectorAll('.is-target').forEach((e) => e.classList.add('is-marked'));
      }, t.mark));

      timers.push(setTimeout(() => {                 // the letters set off
        const host = root.getBoundingClientRect();
        const rowBox = fromRow.getBoundingClientRect();
        const fs = rowFontSize(fromRow);
        const ox = rowBox.left - host.left, oy = rowBox.top - host.top;
        // how many syllables the word gains; the tail shifts by that much
        const delta = to.length - from.length;
        const opening = delta !== 0 ? 280 : 0;
        // how many of the middle syllables are shared positionally
        const paired = Math.min(midFrom.length, midTo.length);
        const moveMs = 560, dropMs = 520;
        const newCount = midTo.length - paired;
        const moveDone = Math.max(1150, opening + Math.max(0, newCount - 1) * 90 + dropMs);

        const place = (L) => ({
          left: (ox + (L.cell + L.x) * W * fs) + 'px',
          top: (oy + L.y * H * fs) + 'px',
          fontSize: (L.size * fs) + 'px',
        });
        /* A flyer has done its job the moment it arrives: the composed glyph
           underneath already shows that letter, so leaving the accent-coloured
           copy sitting on top just looks like a stray blue letter. */
        const make = (L, cls) => {
          const el = h('span', { class: 'mflyer ' + cls, 'data-role': L.role }, L.glyph);
          Object.assign(el.style, place(L));
          stage.appendChild(el);
          return el;
        };
        const retire = (el, after) => {
          timers.push(setTimeout(() => {
            el.style.transition = 'opacity 180ms var(--ease-soft)';
            el.style.opacity = '0';
            timers.push(setTimeout(() => el.remove(), 240));
          }, after));
        };

        /* Which syllables may be taken apart at all.
           Only ones that survive into the new word AND still share a letter with
           their old self: 우 -> 웁 keeps ㅇ and ㅜ and merely gains a 받침, which
           is worth showing. 다 -> 세 shares nothing — that syllable was simply
           replaced, and splitting it would put a pile of loose jamo on screen,
           which is exactly what we ruled out earlier. */
        const taken = [];      // old glyph stays; only a letter or two changes
        const replaced = [];   // the syllable itself is swapped for another one
        for (let i = 0; i < paired; i++) {
          const cell = prefix + i;
          const o = oldL.filter((L) => L.cell === cell);
          const n = newL.filter((L) => L.cell === cell);
          const shared = o.filter((a) => n.some((b) => b.role === a.role && b.glyph === a.glyph));
          const churn = o.filter((L) => !moves.some((m) => m[0] === L)).length +
                        n.filter((L) => !moves.some((m) => m[1] === L)).length;
          if (shared.length && churn <= 2) taken.push(cell);
          else replaced.push(cell);
        }

        const travel = ([o, n]) =>
          Math.hypot((n.cell - o.cell) * W + (n.x - o.x), (n.y - o.y) * H) > 0.42;
        // a letter that keeps its slot is already drawn by both words — a flyer
        // for it would just be a ghost sitting on top of the syllable
        const mover = moves.filter(travel).map(([o, n]) => {
          const el = make(o, 'is-moving');
          retire(el, 1150 + 90);
          return { el, o, n };
        });
        const leaving = gone.filter((o) => taken.indexOf(o.cell) >= 0).map((o) => {
          const el = make(o, 'is-out');
          retire(el, 560 + 120);
          return { el, o };
        });
        const entering = added.filter((n) => taken.indexOf(n.cell) >= 0)
          .sort((a, b) => (a.cell + a.x) - (b.cell + b.x))
          .map((n, i) => {
            const el = make(n, 'is-add');
            retire(el, opening + i * 90 + 520 + 100);
            return { el, n, i };
          });

        /* Whole syllables move as wholes, ON THE OLD ROW, which stays visible
           throughout. Inserting 니 into 배우다 pushes the trailing 다 right, so
           it starts where it already is and slides over; a syllable that did not
           exist before drops in from above in one piece — never taken apart. */
        /* Which old syllables have to go: the ones whose slot was swapped for a
           different syllable (가다 → 갑니까? replaces 다 with 니까?), and any left
           over when the new form is shorter. Leaving 다 on screen let it sit on
           top of the syllable that should own that position. */
        const goneCells = replaced.concat(
          Array.from({ length: Math.max(0, midFrom.length - paired) },
                     (_, k) => prefix + paired + k));

        const fromSyls = Array.from(fromRow.children);
        fromSyls.forEach((el, i) => {
          if (i >= from.length - suffix && suffix > 0 && delta !== 0) {
            el.style.transition = 'transform ' + moveMs + 'ms var(--ease-in-out)';
            el.style.transform = 'translateX(' + (delta * W * fs) + 'px)';
            el.style.willChange = 'transform';
          } else if (goneCells.indexOf(i) >= 0) {
            el.style.transition = 'transform 420ms var(--ease-out), opacity 340ms var(--ease-soft)';
            el.style.transform = 'translateY(' + (i < prefix + midTo.length ? 1.15 : -1.15) + 'em) scale(.72)';
            el.style.opacity = '0';
          }
        });

        // absolutely positioned, so they do not reflow the row before the tail
        // has had a chance to move out of the way
        fromRow.style.position = 'relative';
        const dropped = [];
        for (let i = 0; i < midTo.length; i++) {
          const idx = prefix + i;
          if (i < paired && replaced.indexOf(idx) < 0) continue;  // the old glyph carries it
          const el = h('span', { class: 'msyl is-new', 'data-ch': toText[idx] }, toText[idx]);
          el.style.cssText = 'position:absolute;left:' + (idx * W) + 'em;top:0;opacity:0;' +
            'transform:translateY(-1.15em) scale(.72);will-change:transform,opacity';
          fromRow.appendChild(el);
          dropped.push(el);
        }

        /* A syllable that only changes by one letter keeps its old glyph until
           that letter has actually landed, and only then becomes the new one. */
        timers.push(setTimeout(() => {
          for (const cell of taken) {
            const el = fromSyls[cell];
            if (!el || toText[cell] === undefined) continue;
            el.textContent = toText[cell];
            el.dataset.ch = toText[cell];
          }
        }, Math.max(0, moveDone - 260)));

        /* …and only once everything has come to rest does the old word hand over
           to the finished one. By then the two look the same, so it reads as the
           letters settling rather than as a separate fade. */
        timers.push(setTimeout(() => {
          fromRow.style.transition = 'opacity 240ms var(--ease-soft)';
          fromRow.style.opacity = '0';
          toRow.style.transition = 'opacity 240ms var(--ease-soft) 40ms';
          toRow.style.opacity = '1';
        }, moveDone));

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'marrow');
        root.appendChild(svg);
        const arrows = mover.map(({ o, n }) => ({
          x1: (o.cell + o.x) * W * fs, y1: o.y * H * fs,
          x2: (n.cell + n.x) * W * fs, y2: n.y * H * fs,
        }));
        if (arrows.length) drawArrows(svg, root, arrows, rowBox, fs);
        else svg.remove();

        requestAnimationFrame(() => requestAnimationFrame(() => {
          /* the tail slides out of the way first, then the new syllable drops
             into the gap — doing both at once made them overlap in a blur */
          dropped.forEach((el, i) => {
            const delay = opening + i * 90;
            el.style.transition = 'transform ' + dropMs + 'ms var(--ease-back) ' + delay + 'ms, ' +
              'opacity 360ms var(--ease-soft) ' + delay + 'ms';
            el.style.transform = '';
            el.style.opacity = '1';
          });
          for (const { el, o, n } of mover) {
            const dx = ((n.cell + n.x) - (o.cell + o.x)) * W * fs;
            const dy = ((n.y - o.y) * H) * fs;
            el.style.transform = 'translate(-50%, -50%) translate(' + dx + 'px, ' + dy + 'px)';
          }
          for (const { el, o } of leaving) {
            el.style.transform = 'translate(-50%, -50%) translate(' +
              (o.role === 'jong' || o.role === 'jong2' ? 0 : -0.5 * fs) + 'px, ' +
              (o.role === 'cho' ? -0.9 : 0.9) * fs + 'px) scale(.7)';
            el.style.opacity = '0';
          }
          /* added letters drop in one after another, left to right */
          for (const { el, i } of entering) {
            el.style.transition = 'transform 560ms var(--ease-back) ' + (i * 80) + 'ms, ' +
              'opacity 340ms var(--ease-soft) ' + (i * 80) + 'ms';
            el.style.transform = 'translate(-50%, -50%)';
            el.style.opacity = '1';
          }
        }));
      }, t.hold));

      timers.push(setTimeout(() => {                 // tidy up
        fromRow.remove();
        toRow.style.cssText = '';
        const svg = root.querySelector('.marrow');
        if (svg) svg.classList.add('is-out');
        root.classList.add('is-done');
        root.querySelectorAll('.mflyer').forEach((e) => e.remove());
        root.querySelectorAll('.is-target').forEach((e) => e.classList.remove('is-target', 'is-marked'));
      }, t.hold + 2600));

      timers.push(setTimeout(() => {
        const svg = root.querySelector('.marrow');
        if (svg) svg.remove();
      }, t.hold + 3200));
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

  /* Where the decomposition's ink actually lands, in cell em. Exposed so the
     layout can be checked against the font's own composition (and so
     tools/measure-ink.js has something to calibrate against). */
  function inkBox(ch) {
    const list = boxesFor(ch);
    if (!list) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of list) {
      const role = p.role === 'jong2' ? 'jong' : p.role;
      const ink = (INK[role] || INK.cho)[p.glyph] || [0.6, 0.5];
      const iw = ink[0] * p.size, ih = ink[1] * p.size;
      const c = centreOf(p.box);
      const cx = c[0] * W, cy = c[1] * H;
      x0 = Math.min(x0, cx - iw / 2); x1 = Math.max(x1, cx + iw / 2);
      y0 = Math.min(y0, cy - ih / 2); y1 = Math.max(y1, cy + ih / 2);
    }
    return { l: x0, r: x1, t: y0, b: y1 };
  }

  YK.hangulAnim = { cell, morph, widget, align, lettersOf, inkBox, INK, BOX };
})();
