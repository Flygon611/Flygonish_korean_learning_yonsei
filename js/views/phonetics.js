/* ------------------------------------------------------------------ 음운
   Sound-change rules as an accordion, each with its own drill. The drill shows
   the written form and asks for the way it is actually pronounced — that is
   the only question that matters for this material. */
(function () {
  const YK = (window.YK = window.YK || {});
  const { h } = YK;
  const { ui } = YK;
  const D = window.YK_PHONETICS;

  function pairRow(it) {
    return h('button', { class: 'pair', type: 'button', title: '点击朗读' },
      h('span', { class: 'pair__from' }, it.from),
      h('span', { class: 'pair__arrow' }, '→'),
      h('span', { class: 'pair__to' }, '[' + it.to + ']'),
      it.zh ? h('span', { class: 'faint', style: { fontSize: '11.5px', marginLeft: 'auto' } }, it.zh) : null);
  }

  /* ------------------------------------------------------------- the drill */
  function drill(rule) {
    const box = h('div', { class: 'explain', style: { display: 'none' } });
    const state = { i: 0, right: 0, done: 0, order: YK.shuffle(rule.items) };

    function step() {
      if (state.i >= state.order.length) {
        const acc = state.done ? Math.round((state.right / state.done) * 100) : 0;
        YK.clear(box);
        box.appendChild(h('div', { class: 'row row--between' },
          h('b', {}, '这一组做完了：' + state.right + ' / ' + state.done + '（' + acc + '%）'),
          h('button', { class: 'btn btn--sm', type: 'button',
            onclick: () => { state.i = 0; state.right = 0; state.done = 0;
              state.order = YK.shuffle(rule.items); step(); } }, '再做一遍')));
        return;
      }
      const it = state.order[state.i];
      const wrongs = YK.sample(rule.items.filter((x) => x.to !== it.to), 2).map((x) => x.to);
      const opts = YK.shuffle([it.to, ...wrongs]);

      YK.clear(box);
      box.append(
        h('div', { class: 'row row--between' },
          h('span', { class: 'quizhead__count' }, (state.i + 1) + ' / ' + state.order.length),
          h('span', { class: 'quizhead__count' }, rule.zh + ' 专项')),
        h('div', { style: { textAlign: 'center', margin: '10px 0 14px' } },
          h('div', { class: 'prompt__ko' }, it.from),
          h('div', { class: 'prompt__hint' }, it.zh ? it.zh + ' —— 实际怎么读？' : '实际怎么读？')),
        h('div', { class: 'opts opts--1', style: { gridTemplateColumns: 'repeat(3,1fr)' } },
          opts.map((o) => {
            const b = h('button', { class: 'opt', type: 'button', style: { justifyContent: 'center' } },
              h('span', { class: 'ko--lg ko' }, '[' + o + ']'));
            b.addEventListener('click', () => {
              const ok = o === it.to;
              box.querySelectorAll('.opt').forEach((x) => { x.disabled = true; });
              b.classList.add(ok ? 'is-good' : 'is-bad');
              YK.anim.replay(b, ok ? 'pop-good' : 'shake');
              if (!ok) {
                const good = Array.from(box.querySelectorAll('.opt'))
                  .find((x) => x.textContent.includes('[' + it.to + ']'));
                good && good.classList.add('is-good');
              }
              YK.store.recordQuiz('phonetics', ok);
              state.done++; if (ok) state.right++;
              setTimeout(() => { state.i++; step(); }, ok ? 620 : 1150);
            });
            return b;
          })));
    }

    const btn = h('button', { class: 'btn btn--sm', type: 'button' }, '练这条规则 →');
    btn.addEventListener('click', () => {
      box.style.display = 'block';
      btn.style.display = 'none';
      state.i = 0; state.right = 0; state.done = 0;
      state.order = YK.shuffle(rule.items);
      step();
    });
    return h('div', {}, h('div', { class: 'row', style: { marginBottom: '10px' } }, btn), box);
  }

  /* ------------------------------------------------------------ the rules */
  function ruleCard(rule, index) {
    const inner = h('div', { class: 'rule__inner' },
      h('div', { class: 'rule__pad' },
        h('p', { style: { fontSize: '13.5px', lineHeight: '1.8', color: 'var(--ink-2)' } }, rule.explain),
        h('div', { class: 'grid grid--2', style: { marginTop: '14px' } },
          rule.items.map(pairRow)),
        h('div', { style: { marginTop: '18px' } }, drill(rule))));

    const card = h('section', { class: 'card rule' },
      h('button', { class: 'rule__head', type: 'button', 'aria-expanded': 'false' },
        h('span', {},
          h('span', { class: 'rule__ko' }, rule.ko),
          h('div', { class: 'rule__name' }, rule.zh),
          h('span', { class: 'rule__formula' }, rule.formula)),
        h('span', { class: 'rule__chev' }, '›')),
      h('div', { class: 'rule__body' }, inner));

    const head = card.querySelector('.rule__head');
    head.addEventListener('click', () => {
      const open = card.classList.toggle('is-open');
      head.setAttribute('aria-expanded', String(open));
    });
    if (index === 0) { card.classList.add('is-open'); head.setAttribute('aria-expanded', 'true'); }
    return card;
  }

  function irregularBlock() {
    const G = D.irregular;
    return h('section', { class: 'card card--pad' },
      h('p', { style: { fontSize: '13.5px', color: 'var(--ink-2)' } }, G.zh),
      h('div', { class: 'grid grid--2', style: { marginTop: '16px' } },
        G.groups.map((g) => h('div', {},
          h('div', { class: 'row', style: { gap: '8px', marginBottom: '8px' } },
            h('b', { class: 'ko' }, g.ko),
            ui.chip(g.zh, 'chip--acc')),
          h('p', { class: 'muted', style: { fontSize: '12px', marginBottom: '10px' } }, g.note),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
            g.items.map((it) => h('div', { class: 'pair', style: { cursor: 'pointer' },
              onclick: (e) => YK.tts.speak(it.to, null) && YK.anim.replay(e.currentTarget, 'rise') },
              h('span', { class: 'pair__from' }, it.from),
              h('span', { class: 'pair__arrow' }, '→'),
              h('span', { class: 'pair__to' }, it.to))))))));
  }

  let activeRule = null;

  function render(params) {
    const wrap = h('div', {},
      ui.pageHead({
        title: '音变规则',
        sub: '韩语写出来和读出来常常不一样。这里是 8 条主线规则，加上 6 组不规则活用。',
        aside: [ui.chip('先学连音化', 'chip--acc'), ui.chip('每条都能练')],
      }),
      h('div', { class: 'grid', style: { gap: '12px' } },
        D.rules.map((r, i) => ruleCard(r, i))),
      ui.sectionTitle('不规则活用'),
      irregularBlock());

    if (activeRule) {
      const cards = wrap.querySelectorAll('.rule');
      const idx = D.rules.findIndex((r) => r.id === activeRule);
      if (idx >= 0 && cards[idx]) {
        cards[idx].classList.add('is-open');
        YK.anim.reveal(cards[idx], { block: 'start' });
      }
      activeRule = null;
    }
    return wrap;
  }

  YK.views = YK.views || {};
  YK.views.phonetics = {
    title: '音变规则', label: '音变', icon: '変', render,
    focusRule: (id) => { activeRule = id; },
  };
})();
