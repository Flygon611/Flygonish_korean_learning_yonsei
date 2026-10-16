/* ------------------------------------------------------------------ 홈
   Dashboard: where am I, what should I do next. Nothing here animates for
   show — the numbers count to their value and the progress bars grow once, so
   the state is legible at a glance. */
(function () {
  const YK = (window.YK = window.YK || {});
  const { h } = YK;
  const { ui } = YK;

  const TOTAL_SECTIONS = () => {
    let n = 0;
    for (const l of window.YK_LESSONS.lessons) n += l.sections.filter(
      (s) => s.dialogue.length || s.vocab.length).length;
    return n;
  };

  function totalWords() {
    const seen = new Set();
    for (const l of window.YK_LESSONS.lessons)
      for (const s of l.sections) for (const v of s.vocab) seen.add(v.ko);
    return seen.size;
  }

  function grammarCount() {
    let n = 0;
    for (const l of window.YK_LESSONS.lessons)
      for (const s of l.sections) n += s.grammar.length;
    return n;
  }

  function lessonProgress(lesson) {
    const sections = lesson.sections.filter((s) => s.dialogue.length || s.vocab.length);
    const read = sections.filter((s) => YK.store.isRead(lesson.no, s.section)).length;
    const words = sections.reduce((n, s) => n + s.vocab.length, 0);
    return { read, total: sections.length, words, ratio: sections.length ? read / sections.length : 0 };
  }

  const GREETINGS = ['안녕하세요', '오늘도 화이팅', '좋은 아침이에요', '천천히 가도 괜찮아요'];

  function render() {
    const store = YK.store;
    const stats = store.quizStats();
    const words = totalWords();
    const known = store.knownCount();
    const read = store.readCount();
    const total = TOTAL_SECTIONS();
    const acc = stats.seen ? Math.round((stats.right / stats.seen) * 100) : 0;

    const hour = new Date().getHours();
    const greet = hour < 11 ? '좋은 아침이에요' : hour < 18 ? '안녕하세요' : '좋은 저녁이에요';

    /* ------------------------------------------------------------- hero */
    const hero = h('section', { class: 'hero' },
      h('div', {},
        h('p', { class: 'hero__greet' }, greet),
        h('h1', {}, '延世韩国语 1 · 学习台'),
        h('p', {}, '十课课文、' + words + ' 个单词、' + grammarCount() + ' 条语法点，配音变规则与练习。' +
          '先挑一课读课文，点不认识的词，再去做对应的练习。'),
        h('div', { class: 'hero__cta' },
          h('a', { class: 'btn btn--primary', href: '#/reading' }, '开始读课文'),
          h('a', { class: 'btn', href: '#/practice' }, '直接练题'),
          h('a', { class: 'btn btn--ghost', href: '#/phonetics' }, '先学音变'))),
      h('div', { class: 'hero__art' }, ui.artImg('study', 0) || ui.artImg('greeting', 0)));

    /* ------------------------------------------------------------ stats */
    const statCards = [
      { n: known, d: words, label: '已认识单词', sub: '单词本里的词', icon: 'tag' },
      { n: read, d: total, label: '已读课文节数', sub: '点开课文即算读过', icon: 'book_open' },
      { n: stats.seen, label: '累计答题', sub: acc ? '正确率 ' + acc + '%' : '还没开始', icon: 'chart_bar' },
      { n: store.streak(), label: '连续学习天数', sub: store.todayCount() + ' 题 · 今天', icon: 'weather_sun' },
    ].map((s) => {
      const num = h('span', { class: 'stat__num' }, '0');
      setTimeout(() => YK.anim.countUp(num, s.n), 40);
      return h('div', { class: 'stat' },
        h('div', { class: 'row row--between' },
          h('span', { class: 'stat__num' }, num,
            s.d ? h('small', {}, ' / ' + s.d) : null),
          YK.icon(s.icon, 20)),
        h('div', { class: 'stat__label' }, s.label),
        h('div', { class: 'stat__sub' }, ui.bar(s.d ? s.n / s.d : Math.min(1, s.n / 20), 'is-warm')),
        h('div', { class: 'stat__label', style: { marginTop: '6px' } }, s.sub));
    });

    /* ------------------------------------------------------------ roadmap */
    const road = h('div', { class: 'road' }, window.YK_LESSONS.lessons.map((l) => {
      const p = lessonProgress(l);
      const cls = p.read >= p.total ? 'is-done' : (p.read > 0 ? 'is-started' : '');
      return h('a', { class: 'road__item ' + cls, href: '#/reading?l=' + l.no + '&s=1' },
        h('span', { class: 'road__no' }, String(l.no)),
        h('span', {},
          h('div', { class: 'road__title' }, '第 ' + l.no + ' 课 · ' + l.zh),
          h('div', { class: 'road__sub' }, l.ko)),
        h('div', { class: 'road__prog' },
          ui.bar(p.ratio, cls === 'is-done' ? 'is-good' : ''),
          h('div', { class: 'stat__label', style: { marginTop: '5px', textAlign: 'right' } },
            p.read + '/' + p.total + ' 节 · ' + p.words + ' 词')));
    }));

    /* ------------------------------------------------------------- tiles */
    const tiles = [
      { href: '#/hangul', icon: 'font', title: '字母与发音', desc: '21 个元音、19 个辅音、7 个收音代表音，点开就能听。', slug: 'study' },
      { href: '#/phonetics', icon: 'sound', title: '音变规则', desc: '连音、鼻音化、紧音化、送气化……每条规则配例子和专项练习。', slug: 'music' },
      { href: '#/reading', icon: 'book_open', title: '课文精读', desc: '韩中对照，点任意单词查词义与读音，可整句朗读。', slug: 'school' },
      { href: '#/vocab', icon: 'tag', title: '单词训练', desc: '抽认卡、拼写、听音选词，按课分组，可收藏生词。', slug: 'cafe' },
      { href: '#/grammar', icon: 'script', title: '语法库', desc: '76 条语法点的接续、说明与例句，按课排序。', slug: 'teacher' },
      { href: '#/lookup', icon: 'magnifier', title: '句子查词', desc: '粘一句韩语进去，逐词拆开，告诉你原形和意思。', slug: 'map' },
    ].map((t) => h('a', { class: 'tile', href: t.href },
      h('div', { class: 'row row--between' },
        h('span', { class: 'tile__icon' }, YK.icon(t.icon, 22)),
        h('span', { style: { width: '46px', flex: 'none', opacity: '.9' } }, ui.artImg(t.slug, 0))),
      h('div', { class: 'tile__title' }, t.title),
      h('div', { class: 'tile__desc' }, t.desc)));

    const credits = h('section', { class: 'card card--pad credits' },
      h('div', { class: 'credits__item' },
        YK.icon('book_open', 16),
        h('div', {},
          h('div', { class: 'credits__title' }, '课文与词汇'),
          h('div', { class: 'credits__body' },
            '整理自《延世韩国语 1》的公开课页镜像（沪江韩语 / kr.tingroom.com）：' +
            '10 课 42 节、217 句对话、514 个单词、76 条语法点。仅供个人学习，请勿公开传播。'))),
      h('div', { class: 'credits__item' },
        YK.icon('palette', 16),
        h('div', {},
          h('div', { class: 'credits__title' }, '插画'),
          h('div', { class: 'credits__body' },
            'いらすとや（',
            h('a', { href: 'https://www.irasutoya.com/', target: '_blank', rel: 'noopener' }, 'irasutoya.com'),
            '）的免费插画，已下载到本地，不直接外链。'))),
      h('div', { class: 'credits__item' },
        YK.icon('palette', 16),
        h('div', {},
          h('div', { class: 'credits__title' }, '图标'),
          h('div', { class: 'credits__body' },
            'famfamfam Silk（Mark James，CC BY 2.5），来自 ',
            h('a', { href: 'https://github.com/legacy-icons/famfamfam-silk', target: '_blank', rel: 'noopener' },
              'legacy-icons/famfamfam-silk'), '。'))),
      h('div', { class: 'credits__item' },
        YK.icon('sound', 16),
        h('div', {},
          h('div', { class: 'credits__title' }, '发音'),
          h('div', { class: 'credits__body' },
            '用浏览器自带的语音合成（ko-KR）朗读，不依赖任何在线服务。' +
            '系统里没有韩语语音时，点喇叭不会出声 —— 装上「韩语（韩国）」语音即可。'))));

    const wrap = h('div', {},
      hero,
      ui.sectionTitle('我的进度'),
      h('div', { class: 'grid', style: { gridTemplateColumns: 'auto 1fr', alignItems: 'stretch' } },
        h('div', { class: 'card card--pad', style: { display: 'grid', placeItems: 'center' } },
          ui.ring(words ? known / words : 0, known + '', '已认识 / ' + words, 104)),
        h('div', { class: 'grid grid--4' }, statCards)),
      ui.sectionTitle('课程路线'),
      road,
      ui.sectionTitle('去哪儿'),
      h('div', { class: 'grid grid--3' }, tiles),
      ui.sectionTitle('素材与出处'),
      credits);

    YK.anim.onReady((root) => {
      YK.anim.stagger(root.querySelector('.grid--3'));
      YK.anim.stagger(root.querySelector('.road'));
    });
    return wrap;
  }

  YK.views = YK.views || {};
  YK.views.home = { title: '首页', label: '首页', icon: '홈', render };
})();
