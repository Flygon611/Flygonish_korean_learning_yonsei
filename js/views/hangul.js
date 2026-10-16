/* ------------------------------------------------------------------ 한글
   Alphabet reference. Every jamo is a button: tapping it speaks the letter and
   its example word, which is the fastest way to fix a sound in the ear. */
(function () {
  const YK = (window.YK = window.YK || {});
  const { h } = YK;
  const { ui } = YK;
  const D = window.YK_HANGUL;

  /* Tapping the letter reads the LETTER (vowels as their own syllable,
     consonants by name: ㅂ -> 비읍). The example word gets its own small
     button, so the two are never confused. */
  function jamoButton(j, onTap) {
    /* Tapping the letter plays the SOUND of the letter on its own. A Korean
       consonant cannot be voiced without a vowel, so the isolated sound is the
       consonant with ㅡ (ㄱ -> 그); the letter's name (기역) has its own button,
       because "name" and "sound" are two different things to learn. */
    const spoken = j.sound || j.say || j.ch;
    const letter = h('button', { class: 'jamo__main', type: 'button',
      'aria-label': '读字母 ' + j.ch + ' ' + j.ro },
      h('span', { class: 'jamo__ch' }, j.ch),
      h('span', { class: 'jamo__ro' }, j.ro),
      j.zh ? h('span', { class: 'jamo__zh' }, j.zh) : null);
    letter.addEventListener('click', () => {
      YK.tts.speak(spoken, letter);
      YK.anim.replay(letter, 'pop-good');
      onTap && onTap(j, letter);
    });

    const tools = [];
    if (j.name) {
      const nameBtn = h('button', { class: 'jamo__ex', type: 'button',
        title: '字母名称：' + j.name, 'aria-label': '读字母名称 ' + j.name },
        h('span', { class: 'faint' }, '名 '), j.name);
      nameBtn.addEventListener('click', () => YK.tts.speak(j.name, nameBtn));
      tools.push(nameBtn);
    }
    const ex = j.ex && j.ex[0];
    if (ex) {
      const exBtn = h('button', { class: 'jamo__ex', type: 'button',
        title: '例词：' + ex, 'aria-label': '读例词 ' + ex },
        h('span', { class: 'faint' }, '例 '), ex);
      exBtn.addEventListener('click', () => YK.tts.speak(ex, exBtn));
      tools.push(exBtn);
    }

    return h('div', { class: 'jamo' }, letter, tools.length ? h('div', { class: 'jamo__tools' }, tools) : null);
  }

  function jamoSection(title, sub, list, slug) {
    return h('section', { class: 'card card--pad' },
      h('div', { class: 'row row--between' },
        h('div', {},
          h('h2', { style: { fontSize: '16px' } }, title),
          h('p', { class: 'sub', style: { color: 'var(--muted)', fontSize: '12.5px', marginTop: '3px' } }, sub)),
        slug ? h('div', { style: { width: '42px', opacity: '.85' } }, ui.artImg(slug, 0)) : null),
      h('div', { class: 'jamo-grid', style: { marginTop: '16px' } }, list.map((j) => jamoButton(j))));
  }

  /* Speech is the one thing this site cannot verify on the user's behalf:
     the OS either has a Korean voice or it does not. So instead of failing
     silently, measure it and show the result. */
  function selfTest() {
    const out = h('div', { class: 'explain', style: { display: 'none' } });
    const btn = h('button', { class: 'btn btn--sm btn--primary', type: 'button' },
      YK.icon('sound'), '测一下发音');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = '正在检测…';
      const r = await YK.tts.diagnose();
      YK.clear(out);
      out.style.display = 'block';
      const voices = YK.tts.listVoices();
      const assign = YK.tts.assignments();

      /* One <select> per role. 男声/女声 are optional: leave them on 跟随默认 and
         the whole site uses the one default voice. */
      function roleRow(label, roleKey, hint) {
        const sel = h('select', { class: 'vsel', 'aria-label': label },
          h('option', { value: '' }, roleKey === 'default' ? '（自动）' : '跟随默认'),
          voices.map((v) => h('option', { value: v.name, selected: assign[roleKey] === v.name },
            v.name.replace(/\s*\(.*?\)/g, '')
            + (v.silent ? '（无声）' : '') + (v.novelty ? '（趣味）' : ''))));
        sel.value = assign[roleKey] || '';
        const test = h('button', { class: 'btn btn--sm', type: 'button' }, YK.icon('sound'), '试听');
        test.addEventListener('click', () => {
          YK.tts.setVoice(sel.value || null, roleKey);
          const r = roleKey === 'default' ? null : roleKey;
          YK.tts.speak('안녕하세요. 저는 학생입니다.', null, r ? { role: r } : null);
        });
        sel.addEventListener('change', () => {
          YK.tts.setVoice(sel.value || null, roleKey);
          YK.tts.speak('안녕하세요. 저는 학생입니다.', null,
            roleKey === 'default' ? null : { role: roleKey });
        });
        return h('div', { class: 'vrow' },
          h('span', { class: 'vrow__label' }, label),
          sel, test,
          hint ? h('span', { class: 'faint', style: { fontSize: '11px' } }, hint) : null);
      }

      const picker = h('div', { style: { marginTop: '12px' } },
        h('div', { class: 'muted', style: { fontSize: '12px', marginBottom: '8px' } },
          voices.length > 1
            ? '男声/女声已按语音名自动分配，可随时改；点「试听」逐个试。留空则跟随默认。'
            : '当前系统里只有这一个韩语语音：'),
        roleRow('默认朗读', 'default', '课文、单词、练习都用它'),
        roleRow('男声', 'male', '제임스 · 웨이 · 민철 · 영수'),
        roleRow('女声', 'female', '리에 · 마리아 · 미선 · 정희'),
        h('div', { class: 'row', style: { gap: '8px', marginTop: '4px' } },
          h('button', { class: 'btn btn--sm', type: 'button', onclick: () => {
            try { localStorage.removeItem('yk1.voice.male'); localStorage.removeItem('yk1.voice.female'); } catch (e) {}
            YK.tts.autoAssignRoles();
            YK.router.render();
          } }, '重新自动分配'),
          h('span', { class: 'faint', style: { fontSize: '11.5px' } },
            '带「趣味」标记的是系统自带的搞怪语音，不适合学发音')));

      YK.mount(out,
        h('div', { class: 'row', style: { gap: '8px', marginBottom: '8px' } },
          YK.icon(r.ok ? 'tick' : 'cross'),
          h('b', { style: { color: r.ok ? 'var(--good)' : 'var(--bad)' } }, r.ok ? '引擎已响应' : '发音不可用'),
          h('span', { class: 'muted' }, r.msg)),
        h('div', { class: 'muted', style: { fontSize: '12px', lineHeight: '1.8' } },
          h('div', {}, '系统语音总数：' + (r.voices == null ? '—' : r.voices)),
          h('div', {}, '可用韩语语音：' + ((r.korean && r.korean.length) ? r.korean.length + ' 个' : '（没有）')),
          h('div', {}, '本次选用：' + (r.chosen || '—'))),
        voices.length ? picker : null,
        h('p', { class: 'muted', style: { fontSize: '12px', marginTop: '10px', lineHeight: '1.75' } },
          r.ok
            ? '「引擎已响应」只说明浏览器接受了朗读请求。如果标签页出现喇叭图标却听不到声音，' +
              '多半是这个语音在系统里没有真正安装——上面的列表换一个试。'
            : '系统里没有韩语语音。macOS：系统设置 → 辅助功能 → 朗读内容 → 系统声音 → 管理声音 → 添加「韩语（韩国）」。'),
        h('p', { class: 'muted', style: { fontSize: '12px', marginTop: '6px' } },
          '全部韩语语音：' + ((r.korean && r.korean.length) ? r.korean.join('、') : '（没有）')));

      btn.disabled = false;
      YK.clear(btn);
      YK.mount(btn, YK.icon('sound'), '再测一次');
    });
    return h('section', { class: 'card card--pad' },
      h('div', { class: 'row row--between', style: { alignItems: 'flex-start' } },
        h('div', { style: { maxWidth: '58ch' } },
          h('h2', { style: { fontSize: '15px' } }, '发音自检'),
          h('p', { class: 'muted', style: { fontSize: '12.5px', marginTop: '4px', lineHeight: '1.7' } },
            '整站朗读用的是浏览器自带的语音合成，不依赖任何在线服务。' +
            '如果点喇叭没声音，先在这里测——它会告出系统里到底有没有韩语语音、' +
            '这次选中了哪一个、以及引擎有没有真的开始读。')),
        btn),
      out);
  }

  function render() {
    const compose = h('div', { class: 'compose' },
      h('div', { class: 'compose__item' }, h('span', { class: 'compose__ch' }, 'ㅂ'),
        h('span', { class: 'compose__lbl' }, '初声')),
      h('span', { class: 'compose__arrow' }, '+'),
      h('div', { class: 'compose__item' }, h('span', { class: 'compose__ch' }, 'ㅏ'),
        h('span', { class: 'compose__lbl' }, '中声')),
      h('span', { class: 'compose__arrow' }, '→'),
      h('div', { class: 'compose__item' }, h('span', { class: 'compose__ch', style: { color: 'var(--accent)' } }, '바'),
        h('span', { class: 'compose__lbl' }, 'CV')),
      h('span', { class: 'compose__arrow' }, '+'),
      h('div', { class: 'compose__item' }, h('span', { class: 'compose__ch' }, 'ㄹ'),
        h('span', { class: 'compose__lbl' }, '收音')),
      h('span', { class: 'compose__arrow' }, '→'),
      h('div', { class: 'compose__item' }, h('span', { class: 'compose__ch', style: { color: 'var(--accent)' } }, '발'),
        h('span', { class: 'compose__lbl' }, 'CVC')));

    const triples = h('table', { class: 'tbl' },
      h('thead', {}, h('tr', {},
        D.triples.head.map((x) => h('th', {}, x)))),
      h('tbody', {}, D.triples.rows.map((r) => h('tr', {},
        h('td', { class: 'muted' }, r[0]),
        ['1', '2', '3'].map((k) => h('td', { class: 'ko' },
          r[k] ? h('button', { class: 'w', type: 'button', style: { border: 0, background: 'none', cursor: 'pointer', font: 'inherit' },
            onclick: (e) => YK.tts.speak(r[k], e.currentTarget) }, r[k]) : '—'))))));

    const batchim = h('table', { class: 'tbl' },
      h('thead', {}, h('tr', {},
        ['收音发音', '作为收音的辅音', '例'].map((x) => h('th', {}, x)))),
      h('tbody', {}, D.batchim.map((b) => h('tr', {},
        h('td', {}, h('span', { class: 'ko', style: { fontSize: '19px' } }, b.ch),
          h('span', { class: 'chip', style: { marginLeft: '7px' } }, '[' + b.ro + ']')),
        h('td', { class: 'muted' }, b.from),
        h('td', { class: 'ko' }, b.ex)))));

    const dbl = h('div', { class: 'grid grid--2' },
      ['first', 'second'].map((k) => {
        const g = D.doubleBatchim[k];
        return h('div', { class: 'card card--pad' },
          h('h3', { style: { fontSize: '14px' } }, g.label),
          h('div', { class: 'row', style: { marginTop: '10px', gap: '8px' } },
            g.items.map((it) => h('button', {
              class: 'jamo', type: 'button', style: { width: '86px' },
              onclick: (e) => YK.tts.speak(it.ex, e.currentTarget),
            }, h('span', { class: 'jamo__ch' }, it.ch),
               h('span', { class: 'jamo__ro' }, '[' + it.ro + ']'),
               h('span', { class: 'jamo__zh' }, it.ex)))));
      }));

    const intro = h('section', { class: 'card card--pad' },
      h('div', { class: 'row row--between', style: { alignItems: 'flex-start' } },
        h('div', { style: { maxWidth: '60ch' } },
          D.intro.lines.map((l) => h('p', { style: { fontSize: '13.5px', lineHeight: '1.8', color: 'var(--ink-2)' } }, l)),
          h('p', { class: 'muted', style: { fontSize: '12.5px', marginTop: '10px' } }, D.intro.zh)),
        h('div', { style: { width: '104px', flex: 'none' } }, ui.artImg('korea', 0))),
      compose);

    return h('div', {},
      ui.pageHead({
        title: '字母与发音',
        sub: '一个音节 = 初声 + 中声 (+ 收音)。点任意字母听发音。',
        aside: [ui.chip(D.vowels.length + D.diphthongs.length + ' 个元音', 'chip--acc'),
                ui.chip((D.consonants.length + D.tense.length) + ' 个辅音', 'chip--warm'),
                ui.chip('7 个收音代表音')],
      }),
      intro,
      selfTest(),
      ui.sectionTitle('元音 · 모음'),
      jamoSection('单元音 10 个', '开口度和舌位固定不变，叫单元音。', D.vowels, 'student'),
      h('div', { style: { height: '16px' } }),
      jamoSection('二合元音 11 个', '由两个元音合成，读的时候口型会滑过去。', D.diphthongs, 'travel'),
      ui.sectionTitle('辅音 · 자음'),
      jamoSection('基本辅音 14 个', '名称是字母本身的名字，例如 기역、니은。', D.consonants, 'teacher'),
      h('div', { style: { height: '16px' } }),
      jamoSection('紧音 5 个', '喉部绷紧、不送气，和平时的松音要分清楚。', D.tense, 'shopping'),
      ui.sectionTitle('松音 · 送气音 · 紧音'),
      h('section', { class: 'card card--pad' },
        triples,
        h('p', { class: 'muted', style: { fontSize: '12.5px', marginTop: '12px' } }, D.triples.note)),
      ui.sectionTitle('收音 · 받침'),
      h('section', { class: 'card card--pad' },
        h('p', { class: 'sub', style: { color: 'var(--muted)', fontSize: '13px', marginBottom: '14px' } },
          '收音写法很多，实际只读七个音；其余的都要先归到其中一个。'),
        batchim),
      h('div', { style: { height: '16px' } }),
      dbl);
  }

  YK.views = YK.views || {};
  YK.views.hangul = { title: '字母与发音', label: '字母', icon: '한', render };
})();
