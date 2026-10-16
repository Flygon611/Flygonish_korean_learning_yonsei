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

  /* A picture is chosen from what the word MEANS, not from which lesson it is
     in. Picking by lesson put a woman with shopping bags next to 배우다 "to
     learn" — worse than no picture at all. No confident match, no picture. */
  const THEME_RULES = [
    [/学|教|课|读|写|作业|练习|问|答|意思/, 'study'],
    [/学生|学校|大学|教室|图书馆|课本/, 'school'],
    [/老师|先生|教师/, 'teacher'],
    [/吃|饭|食|菜|味|喝|茶|酒|水果|点心|面条|汤/, 'food'],
    [/买|卖|钱|商店|市场|百货|价钱|购物/, 'shopping'],
    [/咖啡/, 'cafe'],
    [/电话|通话|手机|号码|留言/, 'phone'],
    [/天气|雨|雪|风|晴|阴|冷|热|暖|凉|季节|春|夏|秋|冬|气温/, 'weather'],
    [/旅行|旅游|出发|到达|飞机|机场|票|休假|假期|放假/, 'travel'],
    [/地铁|换乘/, 'subway'],
    [/出租车/, 'taxi'],
    [/火车|列车/, 'train'],
    [/医院|医生|药|病|疼|感冒/, 'hospital'],
    [/音乐|歌|唱|钢琴/, 'music'],
    [/电影|演出|表演/, 'movie'],
    [/生日|祝贺|快乐/, 'birthday'],
    [/聚会|派对/, 'party'],
    [/信|邮|寄|明信片/, 'letter'],
    [/地图|位置|方向|在哪/, 'map'],
    [/韩国|首尔|韩语|韩文/, 'korea'],
    [/爸|妈|哥|姐|弟|妹|父母|孩子|家人|结婚/, 'family'],
    [/时间|小时|分钟|星期|月|年|今天|明天|昨天|日历/, 'calendar'],
    [/运动|球|跑|游泳|爬山/, 'sports'],
    [/人|朋友|见面|介绍/, 'people'],
    [/你好|问候|初次|高兴|再见/, 'hello'],
  ];

  /* null means there is no honest picture for this word.
     Only the hand-checked illustrations are wired up here. An automatically
     fetched batch was tried and withdrawn: searching irasutoya for 手 returned
     typhoons and for ノート returned laptops, and an unverified picture is
     worse than none — 歌手 was showing a tornado because 手 matched inside it. */
  function themeOf(entry) {
    const zh = (entry && entry.zh) || '';
    for (const [re, slug] of THEME_RULES) if (re.test(zh)) return slug;
    return null;
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

    /* Left: a picture for the lesson and the word itself, large. Right: what it
       means and how the textbook uses it. */
    const theme = themeOf(entry);
    const left = h('div', { class: 'wordcard__side' },
      theme ? h('div', { class: 'wordcard__art' }, ui.artImg(theme, 0, 'wordcard__img')) : null,
      h('div', { class: 'wordcard__big' }, entry ? entry.ko : word),
      h('div', { class: 'wordcard__zh' }, entry ? entry.zh : '词库里没有这个词'),
      entry && entry.lesson ? ui.chip('第 ' + entry.lesson + ' 课', 'chip--acc') : null,
      YK.tts.button(entry ? entry.ko : word));

    const right = h('div', { class: 'wordcard__main' },
      h('div', { class: 'wordcard__block' },
        h('h3', { class: 'wordcard__label' }, '释义'),
        h('p', { style: { fontSize: '15px', lineHeight: '1.9', color: 'var(--ink-2)' } },
          entry ? entry.zh : '词库里没有这个词，可能是活用形或专有名词。')),
      h('div', { class: 'wordcard__block' },
        h('h3', { class: 'wordcard__label' }, '课文里的例句',
          ex.length ? h('span', { class: 'faint', style: { marginLeft: '6px', fontSize: '12px' } },
            ex.length + ' 句') : null),
        ex.length
          ? ex.map((s2) => h('div', { class: 'gex gex--roomy' },
              h('div', {},
                h('div', { class: 'gex__ko' }, ui.koreanWords(s2.ko, (raw, anchor) => {
                  if (raw === word) return;
                  const r = YK.dict.lookup(raw);
                  ui.popover(anchor, ui.wordPop(r && r.entry, raw, null));
                })),
                h('div', { class: 'gex__zh' }, (s2.where ? s2.where + ' · ' : '') + (s2.zh || ''))),
              YK.tts.button(s2.ko)))
          : h('p', { class: 'faint', style: { fontSize: '13px' } },
              '课本里没有出现这个词的句子。')));

    return h('div', {},
      ui.pageHead({
        title: word,
        sub: (entry ? entry.zh : '词库里没有这个词，可能是活用形或专有名词。') +
          (entry && entry.lesson ? ' · 第 ' + entry.lesson + ' 课' : ''),
        aside: [ui.backBtn('#/word')],
      }),

      h('div', { class: 'row', style: { gap: '8px', marginBottom: 'var(--s4)', flexWrap: 'wrap' } },
        fav, known,
        h('a', { class: 'btn btn--sm',
          href: '#/lookup?q=' + encodeURIComponent(word) }, '拆整句'),
        h('a', { class: 'btn btn--sm', href: '#/conj' }, '全部变形表')),

      h('section', { class: 'card wordcard' }, left, right),

      conj
        ? h('section', { style: { marginTop: 'var(--s5)' } },
            ui.sectionTitle('变形', '共 ' + conj.forms.length + ' 种'),
            YK.views.conj.table(key, conj))
        : null,

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
