/* ------------------------------------------------------------- 등장인물
   The eight people the textbook introduces, plus how much each of them
   actually says in the dialogues we have — a small but genuinely useful fact
   when you are deciding whose lines to shadow. */
(function () {
  const YK = (window.YK = window.YK || {});
  const { h } = YK;
  const { ui } = YK;
  const L = window.YK_LESSONS;

  function lineCounts() {
    const counts = {};
    for (const lesson of L.lessons)
      for (const sec of lesson.sections)
        for (const d of sec.dialogue)
          if (d.type === 'line' && d.speaker) counts[d.speaker] = (counts[d.speaker] || 0) + 1;
    return counts;
  }

  function firstLesson(name) {
    for (const lesson of L.lessons)
      for (const sec of lesson.sections)
        for (const d of sec.dialogue)
          if (d.speaker === name) return lesson.no;
    return 0;
  }

  function render() {
    const counts = lineCounts();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    const cards = (window.YK_CAST || []).map((p) => {
      const n = counts[p.short] || counts[p.ko] || 0;
      const lesson = firstLesson(p.short);
      const card = h('section', { class: 'card person' },
        h('div', { class: 'person__top' },
          ui.castPhoto(p.id, 92) ||
            h('div', { class: 'person__avatar', style: { background: p.color } }, p.short.slice(0, 1)),
          h('div', {},
            h('div', { class: 'person__name' }, p.short),
            h('div', { class: 'person__zh' }, p.ko + ' · ' + p.zh))),
        h('p', { style: { fontSize: '13px', color: 'var(--ink-2)', lineHeight: '1.75' } }, p.about),
        h('div', { class: 'person__meta' },
          h('div', {}, h('span', {}, '国籍'), h('span', {}, p.fromZh + ' ' + p.from)),
          h('div', {}, h('span', {}, '职业'), h('span', {}, p.jobZh + ' ' + p.job)),
          h('div', {}, h('span', {}, '关系'), h('span', {}, p.noteZh)),
          h('div', {}, h('span', {}, '台词'), h('span', {},
            n ? n + ' 句（共 ' + total + ' 句）' : '没有台词'))),
        h('div', { class: 'row', style: { gap: '8px', marginTop: '4px' } },
          lesson ? h('a', { class: 'btn btn--sm', href: '#/reading?l=' + lesson + '&s=1' },
            '第一次出场 · 第 ' + lesson + ' 课') : null,
          YK.tts.button(p.short)));
      return card;
    });

    return h('div', {},
      ui.pageHead({
        title: '登场人物',
        sub: '课文里有八个固定角色，十课的故事都围着他们转。认住人，对话就好读很多。',
        aside: [ui.chip((window.YK_CAST || []).length + ' 个人物', 'chip--acc'),
                ui.chip('共 ' + total + ' 句台词')],
      }),
      h('section', { class: 'card card--pad' },
        h('div', { class: 'row row--between', style: { alignItems: 'flex-start' } },
          h('div', { style: { maxWidth: '62ch' } },
            h('p', { style: { fontSize: '13.5px', lineHeight: '1.85', color: 'var(--ink-2)' } },
              '詹姆斯的寄宿家庭、延世大学的同一个班、同事和室友——课本用这几条关系把不同场景串起来。' +
              '对话里的说话人名字，就是下面这几个。'),
            h('p', { class: 'muted', style: { fontSize: '12.5px', marginTop: '10px' } },
              '名字写法以课本人物页为准：톰슨 제임스、요시다 리에、크로베토바 마리아、왕 웨이、' +
              '김미선、정민철、이영수、오정희。')),
          h('div', { style: { width: '120px', flex: 'none' } }, ui.artImg('people', 0))),
        h('div', { class: 'row', style: { gap: '10px', marginTop: '16px', flexWrap: 'wrap' } },
          (window.YK_CAST || []).map((p) => h('span', { class: 'chip',
            style: { background: 'color-mix(in srgb, ' + p.color + ' 15%, transparent)',
                     color: p.color } }, p.short)))),
      h('div', { class: 'grid grid--2', style: { marginTop: '18px' } }, cards));
  }

  YK.views = YK.views || {};
  YK.views.cast = { title: '登场人物', label: '人物', icon: '人', render };
})();
