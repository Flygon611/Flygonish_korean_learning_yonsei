/* ------------------------------------------------------------------ 문법
   Every grammar point in the book, in teaching order. Each card carries the
   connection rule, the explanation as written in the textbook, and the example
   sentences — all speakable. */
(function () {
  const YK = (window.YK = window.YK || {});
  const { h } = YK;
  const { ui } = YK;
  const L = window.YK_LESSONS;

  function allPoints() {
    const out = [];
    for (const lesson of L.lessons) {
      for (const sec of lesson.sections) {
        for (const g of sec.grammar) {
          out.push({ lesson: lesson.no, section: sec.section, ...g });
        }
      }
    }
    return out;
  }

  /* one example sentence, with every word tappable */
  function exRow(e) {
    return h('div', { class: 'gex' },
      h('div', {},
        h('div', { class: 'gex__ko' }, ui.koreanWords(e.ko, (raw, anchor) => {
          const hit = YK.dict.lookup(raw);
          const entry = hit && hit.entry;
          ui.popover(anchor, ui.wordPop(entry, raw, h('a', {
            class: 'btn btn--sm', href: '#/lookup?q=' + encodeURIComponent(e.ko),
          }, '拆整句')));
        })),
        e.zh ? h('div', { class: 'gex__zh' }, e.zh) : null),
      YK.tts.button(e.ko));
  }

  /* A pattern is explained in up to three numbered points and each point has
     its own examples — losing that structure is what made point 2 vanish and
     point 3 turn up as an example sentence. */
  function pointCard(p, index) {
    const pts = (p.points && p.points.length)
      ? p.points
      : [{ n: null, label: null, explain: p.explain, examples: p.examples || [] }];

    const ex = h('div', { class: 'gcard__ex' }, pts.map((pt) => {
      const tag = pt.n ? String(pt.n) + '.' : (pt.label || '');
      return h('div', { class: 'gpoint' },
        pt.explain
          ? h('p', { class: 'gpoint__h' }, tag ? h('b', { class: 'gpoint__n' }, tag) : null, pt.explain)
          : null,
        (pt.examples || []).map(exRow));
    }));

    const lead = (pts.find((pt) => pt.explain) || {}).explain || '';

    const body = h('div', { class: 'rule__body' }, h('div', { class: 'rule__inner' },
      h('div', { class: 'rule__pad' },
        ex,
        h('div', { class: 'row', style: { marginTop: '16px', gap: '8px' } },
          h('a', { class: 'btn btn--sm', href: '#/reading?l=' + p.lesson + '&s=' + p.section }, '去课文里看'),
          h('a', { class: 'btn btn--sm', href: '#/practice?mode=pattern&l=' + p.lesson }, '练这一课')))));

    const card = h('section', { class: 'card rule' },
      h('button', { class: 'rule__head', type: 'button', 'aria-expanded': 'false' },
        h('span', {},
          h('div', { class: 'row', style: { gap: '8px', alignItems: 'baseline' } },
            h('span', { class: 'gcard__pat' }, p.pattern || '（未标注）'),
            ui.chip('第 ' + p.lesson + ' 课 · ' + p.section + ' 节', 'chip--acc'),
            pts.filter((pt) => pt.n || pt.label).length > 1
              ? ui.chip(pts.filter((pt) => pt.n || pt.label).length + ' 个用法', 'chip--soft')
              : null),
          h('p', { style: { fontSize: '13px', lineHeight: '1.75', color: 'var(--muted)', marginTop: '8px' } },
            lead.length > 96 ? lead.slice(0, 96) + '…' : lead)),
        h('span', { class: 'rule__chev' }, '›')),
      body);

    const head = card.querySelector('.rule__head');
    head.addEventListener('click', () => {
      const open = card.classList.toggle('is-open');
      head.setAttribute('aria-expanded', String(open));
    });
    if (index === 0) { card.classList.add('is-open'); head.setAttribute('aria-expanded', 'true'); }
    return card;
  }

  function render(params) {
    const lessonNo = params.l ? Number(params.l) : 0;
    const points = allPoints();
    const shown = lessonNo ? points.filter((p) => p.lesson === lessonNo) : points;

    const chips = h('div', { class: 'lesson-strip' },
      h('button', { class: 'tagbtn' + (!lessonNo ? ' is-on' : ''), type: 'button',
        onclick: () => YK.router.go('#/grammar') }, '全部'),
      L.lessons.map((l) => h('button', {
        class: 'tagbtn' + (l.no === lessonNo ? ' is-on' : ''), type: 'button', title: l.zh,
        onclick: () => YK.router.go('#/grammar?l=' + l.no),
      }, l.no + '과')));

    const jump = lessonNo ? h('a', { class: 'btn btn--primary btn--sm',
      href: '#/practice?mode=pattern&l=' + lessonNo }, '做这一课的语法练习') : null;

    const wrap = h('div', {},
      ui.pageHead({
        title: '语法库',
        sub: '共 ' + points.length + ' 条语法点' +
          (lessonNo ? '，第 ' + lessonNo + ' 课有 ' + shown.length + ' 条。' : '。点开卡片看接续、说明和例句。'),
        aside: jump ? [jump] : null,
      }),
      h('div', { class: 'reader-bar' },
        h('span', { class: 'faint', style: { fontSize: '11.5px' } }, '课'), chips),
      h('div', { class: 'grid', style: { gap: '12px' } }, shown.map(pointCard)));

    YK.anim.onReady(() => YK.anim.stagger(wrap.querySelector('.grid')));
    return wrap;
  }

  YK.views = YK.views || {};
  YK.views.grammar = { title: '语法库', label: '语法', icon: '法', render, allPoints };
})();
