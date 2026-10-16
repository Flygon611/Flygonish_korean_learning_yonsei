/* ------------------------------------------------------------------ 사전
   Paste any Korean sentence and get it broken into words, each resolved back
   to its dictionary form where possible. The analyser is honest about what it
   cannot resolve rather than inventing a parse. */
(function () {
  const YK = (window.YK = window.YK || {});
  const { h } = YK;
  const { ui } = YK;
  const L = window.YK_LESSONS;

  const SAMPLES = [
    '저는 학생입니다.',
    '이름이 무엇입니까?',
    '아침에 몇 시에 일어나세요?',
    '주말에 친구하고 영화를 봤어요.',
    '날씨가 추우니까 안으로 들어가세요.',
    '도서관에서 책을 읽고 숙제를 했어요.',
  ];

  function tokenCard(t, onTap) {
    if (t.kind === 'space') return h('span', { style: { width: '6px' } });
    if (t.kind === 'punct') return h('span', { class: 'tokcard is-punct' }, t.text);
    const cls = 'tokcard' + (t.unknown ? ' is-unknown' : '');
    const card = h('button', { class: cls, type: 'button' },
      h('span', { class: 'tokcard__ko' }, t.text),
      h('span', { class: 'tokcard__zh' },
        t.entry ? t.entry.zh : '词库未收录'));
    card.addEventListener('click', (e) => { e.stopPropagation(); onTap(t, card); });
    return card;
  }

  function render(params) {
    const area = h('textarea', { class: 'lookup-input', lang: 'ko', rows: '3',
      placeholder: '把一句韩语粘进来，例如：저는 학생입니다.' });

    const result = h('div', {});
    const stats = h('div', { class: 'row', style: { marginTop: '14px', gap: '8px' } });

    function analyse() {
      const text = area.value.trim();
      YK.clear(result); YK.clear(stats);
      if (!text) { result.appendChild(ui.emptyState('上面输入一句话，这里会逐词拆开。')); return; }
      const toks = YK.dict.analyze(text);
      const words = toks.filter((t) => t.kind === 'word');
      const known = words.filter((t) => t.entry).length;
      const wrap = h('div', { class: 'analysis' });
      for (const t of toks) {
        wrap.appendChild(tokenCard(t, (tok, node) => {
          const entry = tok.entry;
          const mark = h('button', { class: 'btn btn--sm' + (entry && YK.store.isKnown(entry.ko) ? ' is-on' : ''), type: 'button' },
            entry && YK.store.isKnown(entry.ko) ? '已认识 ✓' : '标记为认识');
          mark.addEventListener('click', () => {
            if (!entry) return;
            const on = YK.store.toggleKnown(entry.ko);
            mark.textContent = on ? '已认识 ✓' : '标记为认识';
            mark.classList.toggle('is-on', on);
          });
          ui.popover(node, ui.wordPop(entry, tok.text, mark));
        }));
      }
      result.appendChild(wrap);
      YK.mount(stats, 
        ui.chip(words.length + ' 个词'),
        ui.chip('识别出 ' + known + ' 个', 'chip--good'),
        words.length - known ? ui.chip((words.length - known) + ' 个没收录', 'chip--warm') : null,
        h('button', { class: 'btn btn--sm', type: 'button',
          onclick: () => YK.tts.speak(text) }, YK.icon('sound'), '朗读整句'),
        h('button', { class: 'btn btn--sm', type: 'button',
          onclick: () => { area.value = ''; analyse(); } }, '清空'));
    }

    let timer = null;
    area.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(analyse, 260);
    });

    area.value = params.q || '';

    const samples = h('div', { class: 'row', style: { gap: '8px', marginTop: '12px' } },
      h('span', { class: 'faint', style: { fontSize: '12px' } }, '试试：'),
      SAMPLES.map((s) => h('button', { class: 'tagbtn', type: 'button',
        onclick: () => { area.value = s; analyse(); area.focus(); } }, s)));

    /* ------------------------------------------------------ word search box */
    const search = h('input', { type: 'search', placeholder: '也可以直接查一个词…', lang: 'ko',
      style: { width: '100%', padding: '12px 16px', borderRadius: '12px',
        border: '1.5px solid var(--line-2)', background: 'var(--surface)', color: 'var(--ink)',
        fontFamily: 'var(--font-ko)', fontSize: '16px' } });
    const searchOut = h('div', { class: 'card', style: { marginTop: '12px', padding: '6px', display: 'none' } });
    function doSearch() {
      const q = search.value.trim();
      YK.clear(searchOut);
      if (!q) { searchOut.style.display = 'none'; return; }
      searchOut.style.display = 'block';
      const flat = YK.dict.all();
      const hits = flat.filter((w) => w.ko.includes(q) || w.zh.includes(q)).slice(0, 40);
      if (!hits.length) { searchOut.appendChild(ui.emptyState('没有找到。试试去掉助词，只输入词干。')); return; }
      for (const w of hits) {
        const row = h('div', { class: 'word-row' },
          h('span', { class: 'chip' }, w.lesson ? w.lesson + '과' : '常用'),
          h('span', {},
            h('div', { class: 'word-row__ko' }, w.ko),
            h('div', { class: 'word-row__zh' }, w.zh)),
          YK.tts.button(w.ko));
        searchOut.appendChild(row);
      }
    }
    search.addEventListener('input', doSearch);

    const wrap = h('div', {},
      ui.pageHead({
        title: '句子查词',
        sub: '逐词拆开一句话，告诉你每个词的原形和意思。词库覆盖课文全部单词加常用词，共 ' +
          YK.dict.size() + ' 条。',
        aside: [ui.chip('支持助词剥离', 'chip--acc'), ui.chip('如实标注未收录')],
      }),
      h('div', { class: 'card card--pad' }, area, samples, stats, h('div', { style: { marginTop: '14px' } }, result)),
      ui.sectionTitle('词库搜索'),
      search,
      searchOut);

    YK.anim.onReady(() => { analyse(); area.focus(); });
    return wrap;
  }

  YK.views = YK.views || {};
  YK.views.lookup = { title: '句子查词', label: '查词', icon: '辞', render };
})();
