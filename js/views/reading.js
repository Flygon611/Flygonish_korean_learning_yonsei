/* ------------------------------------------------------------------ 본문
   The reader. Korean on top, translation below, every word tappable — the
   point is that a beginner should never have to leave the sentence to look
   something up. */
(function () {
  const YK = (window.YK = window.YK || {});
  const { h } = YK;
  const { ui } = YK;
  const L = window.YK_LESSONS;

  const castFor = (name) => (window.YK_CAST || []).find((c) => c.short === name || c.ko === name);
  const castColor = (name) => (castFor(name) || {}).color || 'var(--accent)';

  /* A dialogue alternates voices when male/female voices are set in 发音自检;
     otherwise everything uses the one default voice. */
  function role(name) {
    if (!name) return null;
    const c = castFor(name);
    if (c && c.gender) return c.gender === 'm' ? 'male' : 'female';
    const g = (window.YK_SPEAKER_GENDER || {})[name];
    return g ? (g === 'm' ? 'male' : 'female') : null;
  }

  let prefs = { zh: true, ko: true };

  function wordTap(raw, anchor) {
    const hit = YK.dict.lookup(raw);
    const entry = hit && hit.entry;
    const markBtn = h('button', { class: 'btn btn--sm' + (entry && YK.store.isKnown(entry.ko) ? ' is-on' : ''), type: 'button' },
      entry && YK.store.isKnown(entry.ko) ? '已认识 ✓' : '标记为认识');
    markBtn.addEventListener('click', () => {
      if (!entry) return;
      const on = YK.store.toggleKnown(entry.ko);
      markBtn.textContent = on ? '已认识 ✓' : '标记为认识';
      markBtn.classList.toggle('is-on', on);
      YK.ui.toast(on ? '已加入认识的词' : '已移出', on ? 'good' : null);
    });
    const favBtn = h('button', { class: 'btn btn--sm', type: 'button' },
      entry && YK.store.isFav(entry.ko) ? '★ 已收藏' : '☆ 收藏');
    favBtn.addEventListener('click', () => {
      if (!entry) return;
      const on = YK.store.toggleFav(entry.ko);
      favBtn.textContent = on ? '★ 已收藏' : '☆ 收藏';
    });
    ui.popover(anchor, ui.wordPop(entry, raw,
      h('div', { class: 'row', style: { gap: '6px' } }, markBtn, favBtn)));
  }

  function lineRow(d) {
    if (d.type === 'heading') {
      return h('div', { class: 'dlg__heading' },
        h('div', { class: 'ko row', style: { gap: '10px' } },
          ui.koreanWords(d.ko, wordTap), YK.tts.button(d.ko, { role: role(d.speaker) })),
        d.zh ? h('div', { class: 'zh', style: { marginTop: '4px' } }, d.zh) : null);
    }
    const right = d.speaker && ['리에', '마리아', '미선', '정희'].includes(d.speaker);
    const face = ui.castPhoto(d.speaker, 40, true);
    const avatar = face
      ? h('div', { class: 'dlg__avatar dlg__avatar--img',
          style: { boxShadow: '0 0 0 2px ' + castColor(d.speaker) } }, face)
      : h('div', {
          class: 'dlg__avatar',
          style: { background: 'color-mix(in srgb, ' + castColor(d.speaker) + ' 14%, transparent)',
                   color: castColor(d.speaker) },
        }, d.speaker ? d.speaker.slice(0, 1) : '·');

    return h('div', { class: 'dlg__row' + (right ? ' dlg__row--right' : '') },
      h('div', { class: 'dlg__who' }, avatar,
        h('div', { class: 'dlg__name' }, d.speaker || '')),
      h('div', { class: 'dlg__bubble' },
        h('div', { class: 'dlg__ko' }, ui.koreanWords(d.ko, wordTap)),
        d.zh ? h('div', { class: 'dlg__zh' }, d.zh) : null,
        h('div', { class: 'dlg__tools' },
          YK.tts.button(d.ko, { role: role(d.speaker) }),
          h('button', { class: 'btn btn--ghost btn--sm', type: 'button',
            onclick: () => { YK.tts.speak(d.ko, null, { role: role(d.speaker) }); } },
            YK.icon('sound'), '整句朗读'),
          h('button', { class: 'btn btn--ghost btn--sm', type: 'button',
            onclick: () => YK.router.go('#/lookup?q=' + encodeURIComponent(d.ko)) },
            YK.icon('magnifier'), '拆句'))));
  }

  function sectionOf(lessonNo, sectionNo) {
    const lesson = L.lessons.find((x) => x.no === lessonNo) || L.lessons[0];
    const sec = lesson.sections.find((x) => x.section === sectionNo) || lesson.sections[0];
    return { lesson, sec };
  }

  function render(params) {
    let lessonNo = Number(params.l) || 1;
    let sectionNo = Number(params.s) || 1;
    let { lesson, sec } = sectionOf(lessonNo, sectionNo);

    /* the strip that switches lesson */
    const strip = h('div', { class: 'lesson-strip' }, L.lessons.map((l) =>
      h('button', {
        class: 'tagbtn' + (l.no === lesson.no ? ' is-on' : ''),
        type: 'button', title: l.zh,
        onclick: () => YK.router.go('#/reading?l=' + l.no + '&s=1'),
      }, l.no + '과')));

    const usable = lesson.sections.filter((s) => s.dialogue.length || s.vocab.length || s.culture);
    const secStrip = h('div', { class: 'lesson-strip' }, usable.map((s) =>
      h('button', {
        class: 'tagbtn' + (s.section === sec.section ? ' is-on' : ''),
        type: 'button',
        onclick: () => YK.router.go('#/reading?l=' + lesson.no + '&s=' + s.section),
      }, s.section + '절')));

    const modeBtn = (label, on, toggle) => {
      const b = h('button', { class: 'btn btn--sm' + (on ? ' is-on' : ''), type: 'button' }, label);
      b.addEventListener('click', () => { toggle(); YK.router.render(); });
      return b;
    };

    const list = h('div', { class: 'dlg' }, sec.dialogue.map(lineRow));

    /* ------------------------------------------------------- section tail */
    const tail = [];

    if (sec.vocab.length) {
      tail.push(ui.sectionTitle('本节的词 · ' + sec.vocab.length + ' 个'));
      tail.push(h('div', { class: 'card', style: { padding: '8px 6px' } },
        sec.vocab.map((v) => {
          const known = YK.store.isKnown(v.ko);
          const row = h('div', { class: 'word-row' },
            h('span', { style: { width: '8px', height: '8px', borderRadius: '50%',
              background: known ? 'var(--good)' : 'var(--line-2)', flex: 'none' } }),
            h('span', {},
              h('div', { class: 'word-row__ko' }, v.ko),
              h('div', { class: 'word-row__zh' }, v.zh)),
            h('button', { class: 'word-row__star' + (known ? ' is-on' : ''), type: 'button',
              'aria-label': '标记认识', onclick: (e) => {
                e.stopPropagation();
                const on = YK.store.toggleKnown(v.ko);
                e.currentTarget.classList.toggle('is-on', on);
                e.currentTarget.textContent = on ? '✓' : '○';
              } }, known ? '✓' : '○'));
          row.addEventListener('click', (e) => {
            e.stopPropagation();
            const hit = YK.dict.lookup(v.ko);
            ui.popover(row, ui.wordPop(hit ? hit.entry : { ko: v.ko, zh: v.zh, lesson: lesson.no },
              v.ko));
          });
          return row;
        })));
    }

    if (sec.grammar.length) {
      tail.push(ui.sectionTitle('本节的语法 · ' + sec.grammar.length + ' 条'));
      tail.push(h('div', { class: 'grid grid--2' }, sec.grammar.map((g) => {
        const card = h('a', { class: 'card gcard', href: '#/grammar?l=' + lesson.no,
          style: { textDecoration: 'none', color: 'inherit' } },
          h('div', { class: 'gcard__pat' }, g.pattern || '（未标注）'),
          h('div', { class: 'gcard__exp' }, g.explain.length > 120 ? g.explain.slice(0, 120) + '…' : g.explain),
          h('div', { class: 'gex' },
            h('div', {},
              h('div', { class: 'gex__ko' }, (g.examples[0] || {}).ko || ''),
              h('div', { class: 'gex__zh' }, (g.examples[0] || {}).zh || '')),
            ui.speakBtn((g.examples[0] || {}).ko || '')));
        return card;
      })));
    }

    if (sec.culture) {
      tail.push(ui.sectionTitle('문화 · ' + sec.culture.zhTitle));
      tail.push(h('section', { class: 'card card--pad' },
        h('div', { class: 'row row--between', style: { alignItems: 'flex-start' } },
          h('div', { style: { maxWidth: '64ch' } },
            h('h3', { class: 'ko', style: { marginBottom: '10px' } }, sec.culture.title),
            sec.culture.paras.map((p) => h('p', {
              style: { fontSize: '13.5px', lineHeight: '1.9', color: 'var(--ink-2)', marginBottom: '8px' } }, p))),
          h('div', { style: { width: '96px', flex: 'none' } }, ui.artImg('travel', 0)))));
    }

    const curIdx = L.lessons.findIndex((x) => x.no === lesson.no);
    const navBar = h('div', { class: 'row', style: { marginTop: '32px', gap: '10px' } },
      h('button', { class: 'btn', type: 'button', disabled: curIdx <= 0,
        onclick: () => YK.router.go('#/reading?l=' + L.lessons[curIdx - 1].no + '&s=1') }, '← 上一课'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn btn--primary', type: 'button',
        onclick: () => YK.router.go('#/practice?mode=particle&l=' + lesson.no) }, '练这一课 →'),
      h('button', { class: 'btn', type: 'button', disabled: curIdx >= L.lessons.length - 1,
        onclick: () => YK.router.go('#/reading?l=' + L.lessons[curIdx + 1].no + '&s=1') }, '下一课 →'));

    const body = h('div', { class: ('reader' + (prefs.zh ? '' : ' reader-hide-zh') + (prefs.ko ? '' : ' reader-hide-ko')) },
      sec.dialogue.length ? list :
        ui.emptyState(sec.culture ? '这一节是文化阅读，往下看中文专栏。' : '这一节暂时没有抓到课文内容。'),
      ...tail,
      navBar);

    const wrap = h('div', {},
      ui.pageHead({
        title: '第 ' + lesson.no + ' 课 · ' + lesson.zh,
        sub: lesson.ko + ' · 第 ' + sec.section + ' 节 · 共 ' + sec.dialogue.filter((d) => d.type === 'line').length + ' 句',
        aside: [
          modeBtn('中文对照', prefs.zh, () => { prefs.zh = !prefs.zh; }),
          modeBtn('韩文原文', prefs.ko, () => { prefs.ko = !prefs.ko; }),
          h('button', { class: 'btn btn--sm', type: 'button',
            onclick: () => {
              const lines = sec.dialogue.filter((d) => d.type === 'line')
                .map((d) => ({ text: d.ko, role: role(d.speaker) }));
              if (lines.length) YK.tts.speakSequence(lines);
            } }, YK.icon('control_play'), '连读全节'),
        ],
      }),
      h('div', { class: 'reader-bar' },
        h('span', { class: 'faint', style: { fontSize: '11.5px' } }, '课'),
        strip,
        h('span', { style: { width: '1px', height: '20px', background: 'var(--line)' } }),
        h('span', { class: 'faint', style: { fontSize: '11.5px' } }, '节'),
        secStrip),
      body);

    YK.store.markRead(lesson.no, sec.section);
    YK.store.bumpStreak();

    YK.anim.onReady(() => {
      YK.anim.stagger(wrap.querySelector('.dlg'));
      YK.anim.stagger(wrap.querySelector('.lesson-strip'));
    });
    return wrap;
  }

  YK.views = YK.views || {};
  YK.views.reading = { title: '课文精读', label: '课文', icon: '文', render };
})();
