/* ------------------------------------------------------------------ 활용
   Conjugation view. Every row can be taken apart letter by letter: the syllable
   that carries the ending opens up, the letters that change are swapped, and it
   closes again — so 덥다 → 더워요 shows the ㅂ leaving rather than just asserting
   the answer. */
(function () {
  const YK = (window.YK = window.YK || {});
  const { h } = YK;
  const { ui } = YK;

  function render(params) {
    const word = (params.w || '').trim();
    const entry = word ? (YK.dict.lookup(word) || {}).entry : null;
    const conj = word ? YK.conj.conjugate(word) : null;

    if (!word) {
      /* a small index so the page is reachable without coming from a popover */
      const words = YK.dict.all()
        .filter((w) => YK.conj.canConjugate(w.ko))
        .filter((w) => w.lesson)
        .slice(0, 240);
      return h('div', {},
        ui.pageHead({
          title: '动词 · 形容词变形',
          sub: '挑一个词看它的活用；每一行都能拆开看字母怎么换。',
          aside: [ui.chip(words.length + ' 个词条', 'chip--acc')],
        }),
        h('div', { class: 'card', style: { padding: '8px 6px' } },
          words.map((w) => {
            const row = h('div', { class: 'word-row' },
              h('span', { class: 'chip' }, w.lesson + '과'),
              h('span', {},
                h('div', { class: 'word-row__ko' }, w.ko),
                h('div', { class: 'word-row__zh' }, w.zh)),
              h('a', { class: 'btn btn--sm', href: '#/conj?w=' + encodeURIComponent(w.ko) }, '看变形'));
            return row;
          })));
    }

    if (!conj) {
      return h('div', {},
        ui.pageHead({ title: '变形', sub: '“' + word + '” 不是动词或形容词（不以 다 结尾）。' }),
        h('a', { class: 'btn', href: '#/conj' }, '← 回到词表'));
    }

    const rows = conj.forms.map((f) => {
      const stage = h('div', { class: 'conj__stage' });
      let play = null;
      const btn = h('button', { class: 'btn btn--sm', type: 'button', title: '拆开看字母怎么变' }, '拆开看');
      btn.addEventListener('click', () => {
        if (!play) play = YK.hangulAnim.morph(stage, word, f.text);
        else play();
      });
      return h('div', { class: 'conj__row' + (f.verbOnly ? ' is-verbonly' : '') },
        h('div', { class: 'conj__head' },
          h('div', {},
            h('div', { class: 'conj__label' }, f.label,
              f.verbOnly ? h('span', { class: 'faint', style: { fontSize: '11px', marginLeft: '5px' } }, '动词') : null),
            h('div', { class: 'conj__zh' }, f.zh)),
          h('div', { class: 'conj__form' }, f.text),
          YK.tts.button(f.text),
          btn),
        stage);
    });

    return h('div', {},
      ui.pageHead({
        title: word,
        sub: (entry ? entry.zh + ' · ' : '') + '词干 ' + conj.stem +
          (conj.irregular ? ' · ' + conj.irregular : ' · 规则变化'),
        aside: [
          YK.tts.button(word),
          h('a', { class: 'btn btn--sm', href: '#/conj' }, '← 词表'),
        ],
      }),
      conj.irregular
        ? h('div', { class: 'explain', style: { marginTop: 0, marginBottom: 'var(--s4)' } },
            h('b', {}, '不规则活用：'), conj.irregular + '。下面的变换会把这个过程拆开给你看。')
        : null,
      h('div', { class: 'card conj' },
        h('div', { class: 'conj__hint faint' },
          '点「拆开看」把词拆成字母：虚线框里是发生变化的部分，字母会散开、换掉、再拼回去。'),
        rows));
  }

  YK.views = YK.views || {};
  YK.views.conj = { title: '动词变形', label: '变形', icon: '活', render };
})();
