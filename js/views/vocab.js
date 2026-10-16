/* ------------------------------------------------------------------ 단어
   Six ways to meet the same 500 words: browse, flip, choose either direction,
   spell, and listen. All of them pull from one pool so progress is comparable. */
(function () {
  const YK = (window.YK = window.YK || {});
  const { h } = YK;
  const { ui } = YK;
  const L = window.YK_LESSONS;

  /* --------------------------------------------------------------- the pool */
  let pool = null;
  function allWords() {
    if (pool) return pool;
    pool = [];
    const seen = new Set();
    for (const lesson of L.lessons) {
      for (const sec of lesson.sections) {
        for (const v of sec.vocab) {
          if (seen.has(v.ko)) continue;
          seen.add(v.ko);
          pool.push({ ko: v.ko, zh: v.zh, lesson: lesson.no });
        }
      }
    }
    return pool;
  }

  const byLesson = (no) => (no ? allWords().filter((w) => w.lesson === Number(no)) : allWords());

  const MODES = [
    { id: 'list', label: '单词表', zh: '按课浏览，标星收藏', icon: 'application_view_list' },
    { id: 'flash', label: '抽认卡', zh: '翻卡回忆，自己判断对错', icon: 'note' },
    { id: 'ko2zh', label: '看韩选中', zh: '给韩语选意思', icon: 'comments' },
    { id: 'zh2ko', label: '看中选韩', zh: '给意思选韩语', icon: 'text_dropcaps' },
    { id: 'spell', label: '拼写', zh: '看意思写出韩语', icon: 'spellcheck' },
    { id: 'listen', label: '听音选词', zh: '听发音选单词', icon: 'sound' },
  ];

  /* ------------------------------------------------------------- list mode */
  function listMode(lessonNo) {
    const words = byLesson(lessonNo);
    const box = h('div', { class: 'card', style: { padding: '8px 6px' } });
    const search = h('input', { type: 'search', placeholder: '搜韩语或中文…',
      style: { flex: '1', minWidth: '180px', padding: '9px 14px', borderRadius: '10px',
        border: '1.5px solid var(--line-2)', background: 'var(--surface)', color: 'var(--ink)' } });

    function paint() {
      const q = search.value.trim().toLowerCase();
      const list = words.filter((w) => !q || w.ko.includes(q) || w.zh.toLowerCase().includes(q));
      YK.clear(box);
      if (!list.length) { box.appendChild(ui.emptyState('没有匹配的词。')); return; }
      for (const w of list) {
        const known = YK.store.isKnown(w.ko);
        const fav = YK.store.isFav(w.ko);
        const row = h('div', { class: 'word-row' },
          h('span', { class: 'chip', style: { minWidth: '34px', justifyContent: 'center' } }, w.lesson),
          h('span', {},
            h('div', { class: 'word-row__ko' }, w.ko),
            h('div', { class: 'word-row__zh' }, w.zh)),
          h('span', { class: 'row', style: { gap: '2px' } },
            YK.tts.button(w.ko),
            h('button', { class: 'word-row__star' + (fav ? ' is-on' : ''), type: 'button',
              'aria-label': '收藏', onclick: (e) => {
                e.stopPropagation();
                const on = YK.store.toggleFav(w.ko);
                e.currentTarget.classList.toggle('is-on', on);
              } }, fav ? '★' : '☆'),
            h('button', { class: 'word-row__star' + (known ? ' is-on' : ''), type: 'button',
              'aria-label': '标记认识', onclick: (e) => {
                e.stopPropagation();
                const on = YK.store.toggleKnown(w.ko);
                e.currentTarget.classList.toggle('is-on', on);
                e.currentTarget.textContent = on ? '✓' : '○';
              } }, known ? '✓' : '○')));
        row.addEventListener('click', () => {
          const hit = YK.dict.lookup(w.ko);
          ui.popover(row, ui.wordPop(hit ? hit.entry : w, w.ko + '  ← ' + w.zh));
        });
        box.appendChild(row);
      }
    }
    search.addEventListener('input', paint);
    paint();
    return h('div', {}, h('div', { class: 'row', style: { marginBottom: '14px' } }, search), box);
  }

  /* --------------------------------------------------- generic quiz engine */
  function quiz(words, mode, makeQuestion) {
    const wrap = h('div', { class: 'quizwrap' });
    const state = { i: 0, right: 0, order: YK.shuffle(words).slice(0, Math.min(12, words.length)) };

    function next() {
      if (!state.order.length) {
        YK.clear(wrap);
        wrap.appendChild(ui.emptyState('这个范围里没有单词。'));
        return;
      }
      if (state.i >= state.order.length) {
        const acc = Math.round((state.right / state.order.length) * 100);
        YK.clear(wrap);
        wrap.append(
          h('div', { class: 'card card--pad', style: { textAlign: 'center' } },
            h('div', { class: 'row', style: { justifyContent: 'center', marginBottom: '14px' } },
              ui.ring(state.right / state.order.length, acc + '%', state.right + '/' + state.order.length, 108)),
            h('p', { style: { fontSize: '14px' } }, acc >= 90 ? '很稳，这组可以过了。' :
              acc >= 60 ? '差不多了，再来一遍巩固。' : '这组还有点生，先回课文里再见几面。'),
            h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '16px' } },
              h('button', { class: 'btn btn--primary', type: 'button',
                onclick: () => { state.i = 0; state.right = 0;
                  state.order = YK.shuffle(words).slice(0, Math.min(12, words.length)); next(); } }, '再来一组'),
              h('a', { class: 'btn', href: '#/vocab' }, '换模式'))));
        YK.anim.stagger(wrap);
        return;
      }
      const q = makeQuestion(state.order[state.i], words, onResult);
      YK.clear(wrap);
      wrap.append(
        h('div', { class: 'quizhead' },
          h('span', { class: 'quizhead__count' }, (state.i + 1) + ' / ' + state.order.length),
          ui.bar(state.i / state.order.length),
          h('span', { class: 'quizhead__count' }, '✓ ' + state.right)),
        q.node);
      YK.anim.stagger(wrap);
    }

    const onResult = (ok) => {
      YK.store.recordQuiz(mode, ok);
      if (ok) state.right++;
      state.i++;
      setTimeout(next, ok ? 560 : 1200);
    };
    const engine = { next, onResult, state };
    next();
    return { node: wrap, engine };
  }

  function optionQuestion(promptNode, answer, options, onResult) {
    const list = h('div', { class: 'opts' });
    options.forEach((o, i) => {
      const b = h('button', { class: 'opt', type: 'button' },
        h('span', { class: 'opt__key' }, String.fromCharCode(65 + i)),
        h('span', { class: o.kind || '' }, o.label));
      b.addEventListener('click', () => {
        const ok = o.value === answer;
        list.querySelectorAll('.opt').forEach((x) => { x.disabled = true; });
        b.classList.add(ok ? 'is-good' : 'is-bad');
        YK.anim.replay(b, ok ? 'pop-good' : 'shake');
        YK.ui.answerKey(b, ok);
        if (!ok) {
          const good = Array.from(list.querySelectorAll('.opt'))
            .find((x) => x.dataset.v === String(answer));
          good && good.classList.add('is-good');
        }
        YK.ui.toast(ok ? '对了' : '正确答案：' + answer, ok ? 'good' : 'bad');
        onResult(ok);
      });
      b.dataset.v = o.value;
      list.appendChild(b);
    });
    return h('div', {}, promptNode, list);
  }

  function distractors(words, word, n) {
    return YK.sample(words.filter((w) => w.ko !== word.ko && w.zh !== word.zh), n);
  }

  /* ---------------------------------------------------------- quiz builders */
  function runQuiz(mode, words) {
    if (!words.length) return ui.emptyState('这个范围里没有单词。');

    if (mode === 'flash') {
      return flashQuiz(words);
    }

    const make = (word, words, result) => {
      if (mode === 'ko2zh') {
        const wrong = distractors(words, word, 3);
        const opts = YK.shuffle([word, ...wrong]).map((w) => ({ value: w.zh, label: w.zh }));
        return { node: optionQuestion(
          h('div', { class: 'prompt' },
            h('div', { class: 'prompt__ko' }, word.ko),
            h('div', { class: 'prompt__hint' }, '这是什么意思？'),
            h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '12px' } },
              YK.tts.button(word.ko))), word.zh, opts, result) };
      }
      if (mode === 'zh2ko') {
        const wrong = distractors(words, word, 3);
        const opts = YK.shuffle([word, ...wrong]).map((w) => ({ value: w.ko, label: w.ko, kind: 'ko' }));
        return { node: optionQuestion(
          h('div', { class: 'prompt' },
            h('div', { style: { fontSize: '22px', fontWeight: '620' } }, word.zh),
            h('div', { class: 'prompt__hint' }, '哪一个是它？')), word.ko, opts, result) };
      }
      if (mode === 'listen') {
        const wrong = distractors(words, word, 3);
        const opts = YK.shuffle([word, ...wrong]).map((w) => ({ value: w.ko, label: w.ko, kind: 'ko' }));
        const node = optionQuestion(
          h('div', { class: 'prompt' },
            h('div', { class: 'row', style: { justifyContent: 'center' } },
              h('button', { class: 'btn btn--primary', type: 'button',
                onclick: () => YK.tts.speak(word.ko) }, YK.icon('sound'), '再听一次')),
            h('div', { class: 'prompt__hint', style: { marginTop: '12px' } }, '听发音，选出对应的词')), word.ko, opts, result);
        setTimeout(() => YK.tts.speak(word.ko), 80);
        return { node };
      }
      /* spell */
      const input = h('input', { type: 'text', lang: 'ko', autocomplete: 'off',
        spellcheck: 'false', placeholder: '在这里输入韩语' });
      const submit = h('button', { class: 'btn btn--primary', type: 'button' }, '确认');
      const feedback = h('div', { class: 'explain', style: { display: 'none' } });
      let settled = false;
      const check = () => {
        if (settled) return;
        settled = true;
        const got = input.value.replace(/\s+/g, '').trim();
        const ok = got === word.ko.replace(/\s+/g, '');
        input.style.borderColor = ok ? 'var(--good)' : 'var(--bad)';
        YK.anim.replay(input, ok ? 'pop-good' : 'shake');
        feedback.style.display = 'block';
        feedback.innerHTML = ok ? '<b>对。</b>' + word.ko + ' = ' + YK.esc(word.zh)
          : '<b>正确答案：</b>' + YK.esc(word.ko) + '（' + YK.esc(word.zh) + '）';
        input.disabled = true; submit.disabled = true;
        YK.tts.speak(word.ko);
        result(ok);
      };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
      submit.addEventListener('click', check);
      setTimeout(() => input.focus(), 40);
      return { node: h('div', {},
        h('div', { class: 'prompt' },
          h('div', { style: { fontSize: '21px', fontWeight: '600' } }, word.zh),
          h('div', { class: 'prompt__hint' }, '写出对应的韩语'),
          h('div', { class: 'spellbox' }, input)),
        h('div', { class: 'row', style: { justifyContent: 'center' } }, submit),
        feedback) };
    };

    return quiz(words, mode, make).node;
  }

  function flashQuiz(words) {
    const wrap = h('div', { class: 'quizwrap' });
    const state = { i: 0, right: 0, order: YK.shuffle(words).slice(0, Math.min(15, words.length)) };
    function next() {
      if (state.i >= state.order.length) {
        YK.clear(wrap);
        wrap.appendChild(h('div', { class: 'card card--pad', style: { textAlign: 'center' } },
          h('p', { style: { fontSize: '15px' } }, '这一轮翻完了：' + state.right + ' 个认识。'),
          h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '14px' } },
            h('button', { class: 'btn btn--primary', type: 'button', onclick: render0 }, '重新加载'))));
        return;
      }
      const w = state.order[state.i];
      const flip = h('div', { class: 'flip' },
        h('div', { class: 'flip__inner' },
          h('div', { class: 'flip__face' },
            h('div', { class: 'ko--xl ko' }, w.ko),
            YK.tts.button(w.ko),
            h('div', { class: 'faint', style: { fontSize: '12px' } }, '点卡片看意思')),
          h('div', { class: 'flip__face flip__face--back' },
            h('div', { class: 'ko', style: { fontSize: '24px' } }, w.ko),
            h('div', { style: { fontSize: '15px' } }, w.zh),
            h('div', { class: 'chip chip--acc' }, '第 ' + w.lesson + ' 课'))));
      flip.addEventListener('click', () => flip.classList.toggle('is-flipped'));

      const judged = h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '18px' } },
        h('button', { class: 'btn', type: 'button', onclick: () => grade(false) }, '还不熟'),
        h('button', { class: 'btn btn--primary', type: 'button', onclick: () => grade(true) }, '认识了'));

      function grade(ok) {
        YK.store.recordQuiz('vocab-flash', ok);
        if (ok) { state.right++; YK.store.markKnown(w.ko, true); }
        state.i++;
        setTimeout(next, 180);
      }

      YK.clear(wrap);
      wrap.append(
        h('div', { class: 'quizhead' },
          h('span', { class: 'quizhead__count' }, (state.i + 1) + ' / ' + state.order.length),
          ui.bar(state.i / state.order.length),
          h('span', { class: 'quizhead__count' }, '✓ ' + state.right)),
        flip, judged);
      YK.anim.stagger(wrap);
    }
    function render0() { state.i = 0; state.right = 0;
      state.order = YK.shuffle(words).slice(0, Math.min(15, words.length)); next(); }
    next();
    return wrap;
  }

  /* -------------------------------------------------------------- page shell */
  function render(params) {
    const lessonNo = params.l ? Number(params.l) : 0;
    const mode = params.mode || 'list';
    const words = byLesson(lessonNo);

    const lessonChips = h('div', { class: 'lesson-strip' },
      h('button', { class: 'tagbtn' + (!lessonNo ? ' is-on' : ''), type: 'button',
        onclick: () => YK.router.go('#/vocab?mode=' + mode) }, '全部'),
      L.lessons.map((l) => h('button', {
        class: 'tagbtn' + (l.no === lessonNo ? ' is-on' : ''), type: 'button',
        onclick: () => YK.router.go('#/vocab?l=' + l.no + '&mode=' + mode),
      }, l.no + '과')));

    const modeChips = h('div', { class: 'lesson-strip' }, MODES.map((m) =>
      h('button', {
        class: 'tagbtn' + (m.id === mode ? ' is-on' : ''), type: 'button', title: m.zh,
        onclick: () => YK.router.go('#/vocab' + (lessonNo ? '?l=' + lessonNo + '&' : '?') + 'mode=' + m.id),
      }, m.label)));

    let body;
    if (mode === 'list') body = listMode(lessonNo);
    else body = runQuiz(mode, words);

    const known = YK.store.knownCount();
    const total = allWords().length;

    const wrap = h('div', {},
      ui.pageHead({
        title: '单词训练',
        sub: '共 ' + total + ' 个词，已标记认识 ' + known + ' 个。' +
          (lessonNo ? '当前：第 ' + lessonNo + ' 课，' + words.length + ' 词。' : '当前：全部课程。'),
        aside: [ui.chip((MODES.find((m) => m.id === mode) || {}).zh || '', 'chip--acc')],
      }),
      h('div', { class: 'reader-bar' },
        h('span', { class: 'faint', style: { fontSize: '11.5px' } }, '范围'), lessonChips,
        h('span', { style: { width: '1px', height: '20px', background: 'var(--line)' } }),
        h('span', { class: 'faint', style: { fontSize: '11.5px' } }, '模式'), modeChips),
      body);

    YK.anim.onReady(() => {
      YK.anim.stagger(wrap.querySelector('.card'));
      YK.anim.stagger(wrap.querySelector('.quizwrap'));
    });
    return wrap;
  }

  YK.views = YK.views || {};
  YK.views.vocab = { title: '单词训练', label: '单词', icon: '単', render };
})();
