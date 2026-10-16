/* ------------------------------------------------------------------ 연습
   Seven drill modes. Four come from a hand-written bank; three are generated
   live from the textbook itself (sentence ordering and listening from the
   dialogues, pattern recognition from the grammar examples), so every lesson
   gets questions without anyone writing them by hand. */
(function () {
  const YK = (window.YK = window.YK || {});
  const { h } = YK;
  const { ui } = YK;
  const L = window.YK_LESSONS;
  const EX = window.YK_EXERCISES;

  const MODES = {
    particle:    { label: '助词填空',   zh: '은/는 · 이/가 · 을/를 · 에 · 에서', kind: 'fixed', icon: 'text_smallcaps' },
    conjugation: { label: '词尾活用',   zh: '敬语体、过去时、不规则活用',        kind: 'fixed', icon: 'wand' },
    translate:   { label: '句意选择',   zh: '读韩语句子选中文',                  kind: 'fixed', icon: 'comments' },
    order:       { label: '句子排序',   zh: '把课文的句子重新排好',              kind: 'auto',  icon: 'application_view_list' },
    listen:      { label: '听句选文',   zh: '听课文朗读，选出原句',              kind: 'auto',  icon: 'sound' },
    pattern:     { label: '语法点识别', zh: '看例句判断用了哪条语法',            kind: 'auto',  icon: 'script' },
    phonetics:   { label: '音变判断',   zh: '写出实际发音',                      kind: 'auto',  icon: 'spellcheck' },
  };

  const QUIZ_LEN = 10;

  /* ------------------------------------------------------- question widgets */
  function quizHead(state, total) {
    return h('div', { class: 'quizhead' },
      h('span', { class: 'quizhead__count' }, Math.min(state.i + 1, total) + ' / ' + total),
      ui.bar(total ? state.i / total : 0),
      h('span', { class: 'quizhead__count' }, '✓ ' + state.right));
  }

  function summary(state, total, retry) {
    const acc = total ? Math.round((state.right / total) * 100) : 0;
    return h('div', { class: 'card card--pad', style: { textAlign: 'center' } },
      h('div', { class: 'row', style: { justifyContent: 'center', marginBottom: '14px' } },
        ui.ring(total ? state.right / total : 0, acc + '%', state.right + '/' + total, 112)),
      h('p', { style: { fontSize: '14.5px' } },
        acc >= 90 ? '这一组很稳。' : acc >= 60 ? '差不多了，再走一遍。' : '先回课文里再见几面更划算。'),
      h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '16px' } },
        h('button', { class: 'btn btn--primary', type: 'button', onclick: retry }, '再来一组'),
        h('a', { class: 'btn', href: '#/practice' }, '换题型')));
  }

  /* multiple choice; options are plain strings */
  function choiceQuestion(promptNode, answer, options, opts) {
    const o = opts || {};
    return (done) => {
      const list = h('div', { class: 'opts' + (o.one ? ' opts--1' : '') });
      let settled = false;
      YK.shuffle(Array.from(new Set(options))).forEach((opt, i) => {
        const b = h('button', { class: 'opt', type: 'button' },
          h('span', { class: 'opt__key' }, String.fromCharCode(65 + i)),
          h('span', { class: o.ko ? 'ko' : '' }, opt));
        b.addEventListener('click', () => {
          if (settled) return;
          settled = true;
          const ok = opt === answer;
          list.querySelectorAll('.opt').forEach((x) => {
            x.disabled = true;
            if (x.textContent.slice(1) === answer) x.classList.add('is-good');
          });
          b.classList.add(ok ? 'is-good' : 'is-bad');
          if (!ok) b.classList.remove('is-good');
          ui.answerKey(b, ok);
          YK.anim.replay(b, ok ? 'pop-good' : 'shake');
          ui.toast(ok ? '对了' : '正确答案：' + answer, ok ? 'good' : 'bad');
          done(ok);
        });
        list.appendChild(b);
      });
      return h('div', {}, promptNode, list);
    };
  }

  /* blank in a sentence, typed answer */
  function spellQuestion(parts, answer, zh, tip) {
    return (done) => {
      const input = h('input', { type: 'text', lang: 'ko', autocomplete: 'off', spellcheck: 'false' });
      const submit = h('button', { class: 'btn btn--primary', type: 'button' }, '确认');
      const feedback = h('div', { class: 'explain', style: { display: 'none' } });
      let settled = false;
      const check = () => {
        if (settled) return;
        settled = true;
        const ok = input.value.replace(/\s/g, '') === answer.replace(/\s/g, '');
        input.style.borderColor = ok ? 'var(--good)' : 'var(--bad)';
        YK.anim.replay(input, ok ? 'pop-good' : 'shake');
        feedback.style.display = 'block';
        feedback.innerHTML = (ok ? '<b>对。</b>' : '<b>正确答案：</b>' + YK.esc(answer) + '<br>') +
          YK.esc(tip || '');
        input.disabled = submit.disabled = true;
        if (ok) YK.tts.speak(answer);
        done(ok);
      };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
      submit.addEventListener('click', check);
      setTimeout(() => input.focus(), 40);
      return h('div', {},
        h('div', { class: 'prompt' },
          h('div', { class: 'prompt__sentence' },
            parts[0], h('span', { class: 'cloze-blank is-empty' }, '____'), parts[1] || ''),
          zh ? h('div', { class: 'prompt__hint' }, zh) : null,
          h('div', { class: 'spellbox' }, input)),
        h('div', { class: 'row', style: { justifyContent: 'center' } }, submit),
        feedback);
    };
  }

  /* tap tokens into place */
  function orderQuestion(sentence, zh) {
    const core = sentence.replace(/[.?!]\s*$/, '');
    const punct = sentence.slice(core.length);
    const answer = core.split(/\s+/).filter(Boolean);
    return (done) => {
      let pool = YK.shuffle(answer.map((w, i) => ({ w, i })));
      if (pool.length > 1 && pool.map((x) => x.w).join(' ') === answer.join(' ')) {
        pool = YK.shuffle(pool);
      }
      const slot = h('div', { class: 'slot' });
      const tray = h('div', { class: 'row', style: { gap: '8px' } });
      const placed = [];
      let settled = false;

      function paint() {
        YK.clear(slot); YK.clear(tray);
        for (const p of placed) {
          const b = h('button', { class: 'tok tok--placed', type: 'button' }, p.w);
          b.addEventListener('click', () => { if (settled) return; placed.splice(placed.indexOf(p), 1); paint(); });
          slot.appendChild(b);
        }
        for (const t of pool) {
          if (placed.includes(t)) continue;
          const b = h('button', { class: 'tok', type: 'button' }, t.w);
          b.addEventListener('click', () => { if (settled) return; placed.push(t); paint(); });
          tray.appendChild(b);
        }
      }

      const confirm = h('button', { class: 'btn btn--primary', type: 'button' }, '确认');
      confirm.addEventListener('click', () => {
        if (settled) return;
        settled = true;
        const got = placed.map((p) => p.w).join(' ');
        const ok = got === answer.join(' ');
        slot.style.borderColor = ok ? 'var(--good)' : 'var(--bad)';
        YK.anim.replay(slot, ok ? 'pop-good' : 'shake');
        if (!ok) slot.appendChild(h('span', { class: 'chip chip--warm', style: { marginLeft: '8px' } },
          '正确：' + core + punct));
        YK.tts.speak(sentence);
        ui.toast(ok ? '对了' : '顺序不对', ok ? 'good' : 'bad');
        done(ok);
      });
      const reset = h('button', { class: 'btn btn--sm', type: 'button' }, '重排');
      reset.addEventListener('click', () => { if (settled) return; placed.length = 0; paint(); });

      paint();
      return h('div', { class: 'prompt' },
        h('div', { class: 'prompt__hint', style: { marginBottom: '12px' } },
          '把这些词排成一句话' + (zh ? '：' + zh : '')),
        slot,
        h('div', { style: { marginTop: '14px' } }, tray),
        h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '18px' } }, confirm, reset));
    };
  }

  /* ------------------------------------------------------------- the engine */
  function engine(mode, build, ctx) {
    const wrap = h('div', { class: 'quizwrap' });
    const state = { i: 0, right: 0, questions: [] };

    function start() {
      state.i = 0; state.right = 0;
      state.questions = (build(ctx) || []).slice(0, QUIZ_LEN);
      step();
    }

    function step() {
      YK.clear(wrap);
      const total = state.questions.length;
      if (!total) { wrap.appendChild(ui.emptyState('这个范围暂时没有题目，换一个题型或换一课。')); return; }
      if (state.i >= total) { wrap.appendChild(summary(state, total, start)); return; }
      const q = state.questions[state.i];
      const done = (ok) => {
        YK.store.recordQuiz(mode, ok);
        if (ok) state.right++;
        state.i++;
        setTimeout(step, ok ? 640 : 1280);
      };
      wrap.appendChild(quizHead(state, total));
      wrap.appendChild(q.render(done));
      YK.anim.stagger(wrap);
      if (q.play) YK.anim.onReady(() => setTimeout(() => YK.tts.speak(q.play), 200));
    }

    start();
    return wrap;
  }

  /* ------------------------------------------------------------- generators */
  function dialoguePool(lessonNo) {
    const out = [];
    for (const lesson of L.lessons) {
      if (lessonNo && lesson.no !== lessonNo) continue;
      for (const sec of lesson.sections) {
        for (const d of sec.dialogue) {
          if (d.type !== 'line' || !d.zh) continue;
          const n = d.ko.replace(/[.?!]\s*$/, '').split(/\s+/).filter(Boolean).length;
          if (n < 3 || n > 8) continue;
          out.push({ ko: d.ko, zh: d.zh, lesson: lesson.no });
        }
      }
    }
    return out;
  }

  function grammarPool(lessonNo) {
    const out = [];
    for (const lesson of L.lessons) {
      if (lessonNo && lesson.no !== lessonNo) continue;
      const patterns = [];
      for (const sec of lesson.sections)
        for (const g of sec.grammar) if (g.pattern) patterns.push(g.pattern);
      for (const sec of lesson.sections) {
        for (const g of sec.grammar) {
          if (!g.pattern) continue;
          for (const e of (g.examples || [])) {
            if (!e.ko || e.ko.length > 48) continue;
            out.push({ ko: e.ko, zh: e.zh, answer: g.pattern, patterns, lesson: lesson.no });
          }
        }
      }
    }
    return out;
  }

  function phoneticsPool() {
    const out = [];
    for (const r of window.YK_PHONETICS.rules)
      for (const it of r.items) out.push({ from: it.from, to: it.to, zh: it.zh, rule: r.zh });
    return out;
  }

  /* ---------------------------------------------------- lección filtering
     The hand-written banks were written without a lesson tag, so picking 제1과
     still served questions built from 제8과 vocabulary — material the learner
     has not met. Each question is therefore tagged with the LATEST lesson among
     the words it uses: a question is fair game once every word in it has been
     taught. Cheap to compute once, and it stays correct if the corpus changes. */
  let WORD_LESSON = null;
  function wordLesson() {
    if (WORD_LESSON) return WORD_LESSON;
    WORD_LESSON = {};
    const note = (ko, no) => { if (ko && WORD_LESSON[ko] === undefined) WORD_LESSON[ko] = no; };
    // first pass: the vocabulary lists, which are the explicit curriculum
    for (const les of L.lessons) {
      for (const sec of les.sections) {
        for (const w of sec.vocab || []) note(w.ko, les.no);
      }
    }
    // second pass: words that only ever turn up in the textbook's own sentences
    // (살다, 모르다, 예쁘다 …) still have a lesson — the first one that uses them.
    // Kept in its own try: if analysing the whole book throws for any reason,
    // the vocabulary map above is still perfectly usable, and the outer catch
    // must not silently downgrade every question to "no lesson".
    try {
    for (const les of L.lessons) {
      for (const sec of les.sections) {
        const texts = [];
        for (const d of sec.dialogue) if (d.ko) texts.push(d.ko);
        for (const g of sec.grammar) for (const e of g.examples) texts.push(e.ko);
        for (const t of texts) {
          try {
            for (const tok of YK.dict.analyze(t)) if (tok.entry) note(tok.entry.ko, les.no);
          } catch (e) { /* one odd sentence must not sink the whole map */ }
        }
      }
    }
    } catch (e) { /* keep whatever the vocabulary pass produced */ }
    return WORD_LESSON;
  }

  // prompts are sometimes ['가다 + -ㅂ니다  →  ', ''] rather than a plain string
  const asText = (v) => (Array.isArray(v) ? v.join('') : String(v == null ? '' : v));

  /* Some prompts are pure endings — 살다 + -ㅂ니다, 예쁘다 + -어요 — and their
     words never appear in the textbook, so no vocabulary can place them. The
     ending itself can: each grammar pattern carries the lesson that teaches it. */
  let ENDING_LESSON = null;
  function endingLessons() {
    if (ENDING_LESSON) return ENDING_LESSON;
    ENDING_LESSON = [];
    for (const L of L.lessons) {
      for (const sec of L.sections) {
        for (const g of sec.grammar) {
          for (const part of String(g.pattern || '').split('/')) {
            const e = part.trim();
            if (e.length > 1) ENDING_LESSON.push([e, L.no]);
          }
        }
      }
    }
    // longest first, so -습니다 is tried before 습니다
    ENDING_LESSON.sort((a, b) => b[0].length - a[0].length);
    return ENDING_LESSON;
  }

  const NEEDED = new Map();
  function lessonNeeded(text) {
    if (NEEDED.has(text)) return NEEDED.get(text);
    let need = 0;
    try {
      for (const tok of YK.dict.analyze(text)) {
        if (!tok.entry) continue;
        const ln = wordLesson()[tok.entry.ko];
        if (ln && ln > need) need = ln;
      }
      if (!need) {
        for (const [ending, no] of endingLessons()) {
          if (text.indexOf(ending) >= 0 && no > need) need = no;
        }
      }
    } catch (e) { need = 0; }
    NEEDED.set(text, need);
    return need;
  }

  /* keep a question only if everything in it has been taught by now */
  function withinLesson(items, ctx, textOf) {
    const no = ctx && ctx.lessonNo;
    if (!no) return items;
    return items.filter((q) => {
      const need = lessonNeeded(textOf(q));
      return need === 0 || need <= no;
    });
  }

  /* -------------------------------------------------------------- builders */
  const builders = {
    particle: (ctx) => YK.shuffle(withinLesson(EX.particle.items, ctx, (q) => q.s.join(''))).map((q) => ({
      render: choiceQuestion(
        h('div', { class: 'prompt' },
          h('div', { class: 'prompt__sentence' }, q.s[0],
            h('span', { class: 'cloze-blank' }, '？'), q.s[1] || ''),
          h('div', { class: 'prompt__hint' }, q.zh)),
        q.a, q.opts, { ko: true, one: true }),
    })),

    conjugation: (ctx) => YK.shuffle(withinLesson(EX.conjugation.items, ctx,
      // the content is the word before the '+'; the ending after it is a label,
      // and analysing it picked up stray matches that skewed the lesson
      (q) => asText(q.s).split('+')[0])).map((q) => ({
      render: spellQuestion(q.s, q.a, q.zh, q.tip),
    })),

    translate: (ctx) => YK.shuffle(withinLesson(EX.translate.items, ctx, (q) => q.ko)).map((q) => ({
      render: choiceQuestion(
        h('div', { class: 'prompt' },
          h('div', { class: 'prompt__sentence' }, q.ko),
          h('div', { class: 'prompt__hint' }, '这句话是什么意思？'),
          h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '12px' } },
            YK.tts.button(q.ko))),
        q.a, q.opts, { one: true }),
    })),

    order: (ctx) => {
      const pool = dialoguePool(ctx.lessonNo);
      return YK.sample(pool, QUIZ_LEN).map((d) => ({ render: orderQuestion(d.ko, d.zh) }));
    },

    listen: (ctx) => {
      const pool = dialoguePool(ctx.lessonNo);
      return YK.sample(pool, QUIZ_LEN).map((d) => {
        const wrong = YK.sample(pool.filter((x) => x.ko !== d.ko), 3).map((x) => x.ko);
        return {
          play: d.ko,
          render: choiceQuestion(
            h('div', { class: 'prompt' },
              h('div', { class: 'row', style: { justifyContent: 'center' } },
                h('button', { class: 'btn btn--primary', type: 'button',
                  onclick: () => YK.tts.speak(d.ko) }, YK.icon('sound'), '再听一次')),
              h('div', { class: 'prompt__hint', style: { marginTop: '12px' } }, '选出你听到的句子')),
            d.ko, [d.ko, ...wrong], { ko: true, one: true }),
        };
      });
    },

    pattern: (ctx) => {
      const pool = grammarPool(ctx.lessonNo);
      return YK.sample(pool, QUIZ_LEN).map((q) => {
        const wrong = YK.sample(q.patterns.filter((p) => p !== q.answer), 3);
        return {
          render: choiceQuestion(
            h('div', { class: 'prompt' },
              h('div', { class: 'prompt__sentence' }, q.ko),
              q.zh ? h('div', { class: 'prompt__hint' }, q.zh) : null,
              h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '12px' } },
                YK.tts.button(q.ko))),
            q.answer, [q.answer, ...wrong], { ko: true, one: true }),
        };
      });
    },

    phonetics: () => {
      const pool = phoneticsPool();
      return YK.sample(pool, QUIZ_LEN).map((q) => {
        const wrong = YK.sample(pool.filter((x) => x.to !== q.to), 3).map((x) => x.to);
        return {
          render: choiceQuestion(
            h('div', { class: 'prompt' },
              h('div', { class: 'prompt__ko' }, q.from),
              h('div', { class: 'prompt__hint' },
                (q.zh ? q.zh + ' · ' : '') + '实际发音是哪个？')),
            q.to, [q.to, ...wrong], { ko: true, one: true }),
        };
      });
    },
  };

  /* ------------------------------------------------------------------ page */
  function render(params) {
    const mode = MODES[params.mode] ? params.mode : null;
    const lessonNo = params.l ? Number(params.l) : 0;

    const lessonChips = h('div', { class: 'lesson-strip' },
      h('button', { class: 'tagbtn' + (!lessonNo ? ' is-on' : ''), type: 'button',
        onclick: () => YK.router.go('#/practice' + (mode ? '?mode=' + mode : '')) }, '全部课'),
      L.lessons.map((l) => h('button', {
        class: 'tagbtn' + (l.no === lessonNo ? ' is-on' : ''), type: 'button',
        onclick: () => YK.router.go('#/practice?mode=' + (mode || 'particle') + '&l=' + l.no),
      }, l.no + '과')));

    if (!mode) {
      const stats = YK.store.quizStats();
      const cards = Object.keys(MODES).map((k) => {
        const m = MODES[k];
        const st = stats.modes[k];
        return h('a', { class: 'tile', href: '#/practice?mode=' + k + (lessonNo ? '&l=' + lessonNo : '') },
          h('div', { class: 'row row--between' },
            h('span', { class: 'tile__icon' }, YK.icon(m.icon, 22)),
            ui.chip(m.kind === 'auto' ? '自动生成' : '人工题库',
              m.kind === 'auto' ? 'chip--warm' : 'chip--acc')),
          h('div', { class: 'tile__title' }, m.label),
          h('div', { class: 'tile__desc' }, m.zh),
          h('div', { class: 'tile__foot' },
            ui.chip('每组 ' + QUIZ_LEN + ' 题'),
            st ? ui.chip('已做 ' + st.seen + ' · ' + Math.round((st.right / st.seen) * 100) + '%', 'chip--good') : null));
      });

      const wrap = h('div', {},
        ui.pageHead({
          title: '练习',
          sub: '七种题型。四套题库是手写的，另外三种直接从课文和语法例句生成。',
          aside: [ui.chip('累计 ' + stats.seen + ' 题', 'chip--acc'),
                  ui.chip(stats.seen ? '正确率 ' + Math.round((stats.right / stats.seen) * 100) + '%' : '还没开始')],
        }),
        h('div', { class: 'reader-bar' },
          h('span', { class: 'faint', style: { fontSize: '11.5px' } }, '范围'), lessonChips),
        h('div', { class: 'mode-grid' }, cards));
      YK.anim.onReady((r) => YK.anim.stagger(r.querySelector('.mode-grid')));
      return wrap;
    }

    const m = MODES[mode];
    const node = engine(mode, builders[mode], { lessonNo });

    return h('div', {},
      ui.pageHead({
        title: m.label,
        sub: m.zh + (lessonNo ? ' · 只出第 ' + lessonNo + ' 课的题' : ' · 全部课程'),
        aside: [
          h('a', { class: 'btn btn--sm', href: '#/practice' + (lessonNo ? '?l=' + lessonNo : '') }, '← 换题型'),
        ],
      }),
      h('div', { class: 'reader-bar' },
        h('span', { class: 'faint', style: { fontSize: '11.5px' } }, '范围'), lessonChips),
      node);
  }

  YK.views = YK.views || {};
  YK.views.practice = { title: '练习', label: '练习', icon: '練', render , lessonNeeded, withinLesson };
})();
