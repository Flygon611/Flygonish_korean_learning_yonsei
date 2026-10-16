/* ------------------------------------------------------------------ 단어
   One word, everything about it: meaning, where it comes from, the ten
   conjugations if it is a verb or adjective, and real sentences from the
   textbook that use it.

   Reachable from every word popover in the app, so tapping a word anywhere
   leads somewhere with more than a two-line gloss. */
(function () {
  const YK = (window.YK = window.YK || {});
  const { h } = YK;
  const { ui } = YK;
  const L = window.YK_LESSONS;

  /* Every sentence in the book, flattened once. */
  let SENTENCES = null;
  function sentences() {
    if (SENTENCES) return SENTENCES;
    SENTENCES = [];
    for (const lesson of L.lessons) {
      for (const sec of lesson.sections) {
        for (const d of sec.dialogue) {
          if (d.type !== 'line' || !d.ko) continue;
          SENTENCES.push({ ko: d.ko, zh: d.zh, lesson: lesson.no, section: sec.section,
            where: '课文', speaker: d.speaker || '' });
        }
        for (const g of sec.grammar) {
          for (const e of g.examples) {
            SENTENCES.push({ ko: e.ko, zh: e.zh, lesson: lesson.no, section: sec.section,
              where: g.pattern, speaker: '' });
          }
        }
      }
    }
    return SENTENCES;
  }

  /* Sentences where this exact word actually appears — checked by running the
     same analyser the lookup page uses, not by substring matching, so 먹다 does
     not match 먹습니다 by accident and does match it when it really is the verb. */
  function examplesFor(word, limit) {
    const out = [];
    for (const s of sentences()) {
      if (out.length >= (limit || 6)) break;
      const toks = YK.dict.analyze(s.ko);
      if (toks.some((t) => t.entry && t.entry.ko === word)) out.push(s);
    }
    return out;
  }

  function render(params) {
    const word = (params.w || '').trim();
    if (!word) return index();

    const hit = YK.dict.lookup(word);
    const entry = hit && hit.entry;
    const conj = YK.conj.canConjugate(entry ? entry.ko : word)
      ? YK.conj.conjugate(entry ? entry.ko : word) : null;
    const key = entry ? entry.ko : word;

    const fav = h('button', { class: 'btn btn--sm' + (YK.store.isFav(key) ? ' is-on' : ''), type: 'button' },
      YK.store.isFav(key) ? '★ 已收藏' : '☆ 收藏');
    fav.addEventListener('click', () => {
      const on = YK.store.toggleFav(key);
      fav.textContent = on ? '★ 已收藏' : '☆ 收藏';
      fav.classList.toggle('is-on', on);
    });
    const known = h('button', { class: 'btn btn--sm' + (YK.store.isKnown(key) ? ' is-on' : ''), type: 'button' },
      YK.store.isKnown(key) ? '已认识 ✓' : '标记为认识');
    known.addEventListener('click', () => {
      const on = YK.store.toggleKnown(key);
      known.textContent = on ? '已认识 ✓' : '标记为认识';
      known.classList.toggle('is-on', on);
    });

    const ex = examplesFor(key, 8);
    const sameLesson = entry && entry.lesson
      ? YK.dict.all().filter((w) => w.lesson === entry.lesson && w.ko !== key).slice(0, 18)
      : [];

    return h('div', {},
      ui.pageHead({
        title: word,
        sub: (entry ? entry.zh : '词库里没有这个词，可能是活用形或专有名词。') +
          (entry && entry.lesson ? ' · 第 ' + entry.lesson + ' 课' : ''),
        aside: [YK.tts.button(entry ? entry.ko : word)],
      }),

      h('div', { class: 'row', style: { gap: '8px', marginBottom: 'var(--s4)' } },
        fav, known,
        h('a', { class: 'btn btn--sm',
          href: '#/lookup?q=' + encodeURIComponent(word) }, '拆整句'),
        h('a', { class: 'btn btn--sm', href: '#/conj' }, '全部变形表')),

      conj
        ? h('section', { style: { marginBottom: 'var(--s5)' } },
            ui.sectionTitle('变形', '共 ' + conj.forms.length + ' 种'),
            YK.views.conj.table(key, conj))
        : null,

      h('section', { style: { marginBottom: 'var(--s5)' } },
        ui.sectionTitle('课文里的例句', ex.length ? '共 ' + ex.length + ' 句' : ''),
        ex.length
          ? h('div', { class: 'card', style: { padding: '6px' } }, ex.map((s) =>
              h('div', { class: 'word-row' },
                h('span', { class: 'chip' }, s.lesson + '과'),
                h('span', { style: { flex: '1' } },
                  h('div', { class: 'word-row__ko' }, ui.koreanWords(s.ko, (raw, anchor) => {
                    if (raw === word) return;
                    const r = YK.dict.lookup(raw);
                    ui.popover(anchor, ui.wordPop(r && r.entry, raw, null));
                  })),
                  h('div', { class: 'word-row__zh' },
                    (s.where ? s.where + ' · ' : '') + (s.zh || ''))),
                YK.tts.button(s.ko))))
          : ui.emptyState('课文里还没找到用这个词的句子。')),

      sameLesson.length
        ? h('section', {},
            ui.sectionTitle('同课的词'),
            h('div', { class: 'row', style: { gap: '6px', flexWrap: 'wrap' } },
              sameLesson.map((w) => h('a', { class: 'tagbtn',
                href: '#/word?w=' + encodeURIComponent(w.ko) }, w.ko))))
        : null);
  }

  /* no ?w= — browse every word we know */
  function index() {
    const all = YK.dict.all();
    const words = all.slice().sort((a, b) => (a.lesson || 99) - (b.lesson || 99) || a.ko.localeCompare(b.ko));
    return h('div', {},
      ui.pageHead({
        title: '词条',
        sub: '共 ' + words.length + ' 个词。点任意一个看释义、变形和课文例句。',
        aside: [ui.chip(YK.dict.all().filter((w) => YK.conj.canConjugate(w.ko)).length + ' 个可变形', 'chip--acc')],
      }),
      h('div', { class: 'card', style: { padding: '6px' } }, words.slice(0, 400).map((w) =>
        h('a', { class: 'word-row', href: '#/word?w=' + encodeURIComponent(w.ko) },
          h('span', { class: 'chip' }, w.lesson ? w.lesson + '과' : '常用'),
          h('span', { style: { flex: '1' } },
            h('div', { class: 'word-row__ko' }, w.ko),
            h('div', { class: 'word-row__zh' }, w.zh)),
          YK.conj.canConjugate(w.ko) ? h('span', { class: 'chip chip--soft' }, '可变') : null))));
  }

  YK.views = YK.views || {};
  YK.views.word = { title: '词条', label: '词条', icon: '词', render };
})();
