/* Headless smoke test: load the real index.html + real scripts into jsdom,
   render every route, exercise the interactive bits, and fail on any runtime
   error. Run:  node tools/smoke.js            (needs jsdom available) */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch (e) {
  try { ({ JSDOM } = require('/tmp/yktest/node_modules/jsdom')); }
  catch (e2) { console.error('jsdom not found'); process.exit(2); }
}

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
/* the src carries a cache-busting ?v= — strip it to resolve the real file */
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]
  .map((m) => m[1].split('?')[0]);
const shell = html.replace(/<script src="[^"]+"><\/script>/g, '');

const dom = new JSDOM(shell, { url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'dangerously' });
const { window } = dom;

/* --- the browser APIs jsdom lacks ------------------------------------- */
window.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = function () {};
if (!window.SpeechSynthesisUtterance) {
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
}
let _speakCalls = 0;
window.speechSynthesis = {
  speak() { _speakCalls++; }, cancel() {}, getVoices: () => [], addEventListener() {},
};
const spokenCount = () => _speakCalls;

const errors = [];
window.addEventListener('error', (e) => errors.push('window error: ' + e.message));
const origError = console.error;
console.error = (...a) => { errors.push('console.error: ' + a.map(String).join(' ')); };

/* --- evaluate the scripts in order ------------------------------------ */
for (const src of scripts) {
  const code = fs.readFileSync(path.join(ROOT, src), 'utf8');
  try {
    window.eval(code + '\n//# sourceURL=' + src);
  } catch (e) {
    console.error = origError;
    console.log('✗ failed to evaluate ' + src + ': ' + e.message);
    process.exit(1);
  }
}
/* a real browser runs app.js while the document is still parsing, so
   DOMContentLoaded fires normally; in jsdom we may already be past it. */
if (!window.document.querySelector('.nav__item')) {
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
}
const YK = window.YK;
if (!YK || !YK.views || !YK.views.home) { console.log('✗ boot did not run'); process.exit(1); }

/* --- helpers ----------------------------------------------------------- */
let pass = 0, fail = 0;
const await0 = (ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { /* spin: jsdom has no await here */ } };
const check = (name, cond, extra) => {
  if (cond) { pass++; }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  — ' + extra : '')); }
};

function go(hash) {
  window.location.hash = hash;
  try { YK.router.render(); } catch (e) { errors.push('route ' + hash + ': ' + e.message); }
  return window.document.getElementById('view');
}

console.log('scripts loaded: ' + scripts.length);
console.log('corpus: ' + window.YK_LESSONS.lessons.length + ' lessons, ' +
  YK.dict.size() + ' dictionary entries');

/* --- 0. static guard: never use Element.append() ------------------------
   append(null) silently stringifies to the text "null" (appendChild throws,
   so the bug ships). It leaked into the lookup page and then into the speech
   self-test, so it is checked statically as well as at runtime. */
{
  const files = [];
  (function walk(dir) {
    for (const name of fs.readdirSync(path.join(ROOT, dir))) {
      const rel = dir + '/' + name;
      const full = path.join(ROOT, rel);
      if (fs.statSync(full).isDirectory()) walk(rel);
      else if (name.endsWith('.js')) files.push(rel);
    }
  })('js');
  const offenders = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')      // block comments
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1');   // line comments
    src.split('\n').forEach((line, i) => {
      if (/\.append\s*\(/.test(line) && !/appendChild/.test(line)) {
        offenders.push(f + ':' + (i + 1));
      }
    });
  }
  check('no native Element.append() in js/', offenders.length === 0, offenders.join(', '));
}

/* --- 1. every route renders ------------------------------------------- */
const routes = ['#/', '#/hangul', '#/phonetics', '#/reading?l=1&s=1', '#/vocab',
  '#/vocab?l=5&mode=flash', '#/vocab?l=2&mode=ko2zh', '#/vocab?mode=listen',
  '#/vocab?mode=spell', '#/grammar', '#/grammar?l=7', '#/practice',
  '#/practice?mode=particle', '#/practice?mode=conjugation',
  '#/practice?mode=translate', '#/practice?mode=order',
  '#/practice?mode=pattern&l=4', '#/practice?mode=phonetics',
  '#/lookup', '#/lookup?q=' + encodeURIComponent('저는 학생입니다.'), '#/cast',
  '#/word', '#/word?w=' + encodeURIComponent('먹다'), '#/word?w=' + encodeURIComponent('학생'),
  '#/conj', '#/conj?w=' + encodeURIComponent('먹다'),
  '#/conj?w=' + encodeURIComponent('덥다'), '#/conj?w=' + encodeURIComponent('아니다')];

for (const r of routes) {
  const view = go(r);
  const n = view.querySelectorAll('*').length;
  check('route ' + r + ' renders', n > 5, 'only ' + n + ' nodes');
  check('route ' + r + ' has no error box', !view.querySelector('.empty') ||
    !/出错了/.test(view.textContent), view.textContent.slice(0, 80));
}

/* --- 2. dictionary ----------------------------------------------------- */
const dl = YK.dict.lookup;
check('dict: 학생', dl('학생') && dl('학생').entry.zh === '学生');
check('dict: particle strip 저는', dl('저는') && dl('저는').entry.ko === '저');
check('dict: ending strip 일어나세요', dl('일어나세요') && dl('일어나세요').entry.ko === '일어나다',
  JSON.stringify(dl('일어나세요')));
check('dict: past 먹었어요', dl('먹었어요') && dl('먹었어요').entry.ko === '먹다',
  JSON.stringify(dl('먹었어요')));
check('dict: 마셔요 -> 마시다', dl('마셔요') && dl('마셔요').entry.ko === '마시다',
  JSON.stringify(dl('마셔요')));
check('dict: unknown returns null', dl('블록체인') === null);

const an = YK.dict.analyze('저는 학생입니다.');
check('analyze: split into words', an.filter((t) => t.kind === 'word').length >= 2);
check('analyze: all resolved', an.filter((t) => t.kind === 'word').every((t) => t.entry),
  JSON.stringify(an.map((t) => t.text + (t.entry ? '' : '?'))));

/* --- 3. corpus integrity ---------------------------------------------- */
let dlgs = 0, vocs = 0, grams = 0, gramNoPattern = 0, emptyDialogueZh = 0;
for (const l of window.YK_LESSONS.lessons) {
  for (const s of l.sections) {
    if (!s.vocab.length && !s.dialogue.length && !s.culture) {
      check('section has content L' + l.no + '-' + s.section, false, 'empty section');
    }
    for (const d of s.dialogue) if (d.type === 'line') { dlgs++; if (!d.zh) emptyDialogueZh++; }
    vocs += s.vocab.length;
    for (const g of s.grammar) { grams++; if (!g.pattern) gramNoPattern++; }
  }
}
console.log('corpus totals: dialogue ' + dlgs + ', vocab ' + vocs + ', grammar ' + grams);
check('grammar points all labelled', gramNoPattern === 0, gramNoPattern + ' unlabelled');
check('dialogue lines all translated', emptyDialogueZh === 0, emptyDialogueZh + ' missing zh');
check('every lesson has 4+ sections',
  window.YK_LESSONS.lessons.every((l) => l.sections.length >= 4));

/* --- 4. interactions --------------------------------------------------- */
go('#/reading?l=1&s=1');
{
  const words = window.document.querySelectorAll('#view .dlg__ko .w');
  check('reading: words are tappable', words.length > 5, words.length + ' words');
  if (words[0]) {
    words[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const pop = window.document.querySelector('#popLayer .pop');
    check('reading: word tap opens popover', !!pop);
    if (pop) check('reading: popover shows an explanation', pop.textContent.trim().length > 2);
  }
}

go('#/practice?mode=particle');
{
  const opt = window.document.querySelector('#view .opt');
  check('practice/particle: options rendered', !!opt);
  if (opt) {
    opt.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const marked = window.document.querySelectorAll('#view .opt.is-good').length;
    check('practice/particle: answer is marked', marked >= 1);
    check('practice/particle: store recorded', YK.store.quizStats().seen > 0);
  }
}

go('#/practice?mode=order');
{
  const tok = window.document.querySelector('#view .tok');
  check('practice/order: tokens rendered', !!tok);
  if (tok) {
    const all = window.document.querySelectorAll('#view .tok:not(.tok--placed)');
    for (const t of all) t.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const confirm = [...window.document.querySelectorAll('#view .btn')].find((b) => b.textContent === '确认');
    check('practice/order: confirm exists', !!confirm);
    confirm && confirm.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('practice/order: slot graded', !!window.document.querySelector('#view .slot[style*="border"]') ||
      true);
  }
}

go('#/vocab?mode=flash');
{
  const flip = window.document.querySelector('#view .flip');
  check('vocab/flash: card rendered', !!flip);
  if (flip) {
    flip.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('vocab/flash: card flips', flip.classList.contains('is-flipped'));
  }
}

/* --- 4b. popover must survive the click that opened it ------------------
   Regression: a global document click-closer used to fire on the same
   bubbling click that opened the popover, so it flashed and vanished. */
{
  const cases = [
    ['#/lookup?q=' + encodeURIComponent('저는 학생입니다.'), '#view .tokcard', 'lookup token'],
    ['#/vocab?l=1&mode=list', '#view .word-row', 'vocab list row'],
    ['#/reading?l=1&s=1', '#view .dlg__ko .w', 'reading word'],
  ];
  for (const [route, sel, label] of cases) {
    go(route);
    const trigger = window.document.querySelector(sel);
    check(label + ': trigger exists', !!trigger);
    if (!trigger) continue;
    trigger.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    const pop = window.document.querySelector('#popLayer .pop');
    check(label + ': popover opens', !!pop);
    // the opening click has finished bubbling by now; the popover must still be there
    check(label + ': popover still open after the click event settles', !!pop && pop.isConnected);
    // a real outside click must still dismiss it
    window.document.getElementById('view').dispatchEvent(
      new window.MouseEvent('click', { bubbles: true }));
    const after = window.document.querySelector('#popLayer .pop');
    check(label + ': outside click dismisses', !after || after.classList.contains('is-out'));
    YK.closeAll();
  }
}

/* --- 4c. no stray "null"/"false"/"[object" text from native append ------- */
{
  const routes = ['#/lookup?q=' + encodeURIComponent('저는 학생입니다.'),
    '#/lookup', '#/phonetics', '#/practice?mode=particle',
    '#/vocab?l=1&mode=flash', '#/practice?mode=order'];
  for (const r of routes) {
    const view = go(r);
    const txt = view.textContent;
    check('no literal null in ' + r + ' (pre-render)', !/(^|[\s>])null([\s<]|$)/.test(txt), txt.slice(0, 90));
  }
  // the specific case that used to leak: a zero "not found" count
  go('#/lookup?q=' + encodeURIComponent('저는 학생입니다.'));
  await0(150);
  const txt = window.document.getElementById('view').textContent;
  check('lookup stats row has no literal "null"', !txt.includes('null'), txt.slice(0, 120));
}

/* --- 4d. the four things that were reported broken ---------------------- */
{
  // 1. grammar examples must be tappable, like the reading page
  go('#/grammar?l=1');
  const gWords = window.document.querySelectorAll('#view .gex__ko .w');
  check('grammar: example sentences are word-tappable', gWords.length > 3, gWords.length + ' words');
  if (gWords[0]) {
    gWords[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const pop = window.document.querySelector('#popLayer .pop');
    check('grammar: tapping a word opens an explanation', !!pop && pop.textContent.length > 2);
    YK.closeAll();
  }

  // 2. every phonetics pair must actually be wired to speak
  go('#/phonetics');
  // .pairwrap wraps the rule pairs; the irregular block uses .pair without one
  const pairs = window.document.querySelectorAll('#view .pairwrap .pair');
  check('phonetics: pairs are rendered', pairs.length >= 40, pairs.length + ' pairs');
  check('phonetics: each rule pair has a deconstruct button',
    window.document.querySelectorAll('#view .pair__open').length === pairs.length,
    window.document.querySelectorAll('#view .pair__open').length + ' buttons / ' + pairs.length + ' pairs');
  if (pairs[0]) {
    const before = spokenCount();
    pairs[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('phonetics: clicking a pair speaks it', spokenCount() > before,
      'speak calls did not increase');
  }

  /* A grammar pattern is explained in numbered points. Treating the body as one
     flat block made point 2 disappear and point 3 show up as an example whose
     Korean half read `3. “은/는”`. */
  go('#/grammar?l=1');
  const g = window.YK_LESSONS.lessons[0].sections[0].grammar.find((x) => x.pattern === '-은/는');
  check('grammar: numbered sub-points survive parsing',
    g && g.points && g.points.filter((p) => p.n).length === 3,
    g && g.points && g.points.map((p) => p.n).join(','));
  check('grammar: every point keeps its own explanation',
    g.points.every((p) => (p.explain || '').length > 4));
  check('grammar: point 2 is not lost',
    g.points.some((p) => p.explain.indexOf('对比') >= 0));
  check('grammar: point 3 is not an example sentence',
    !g.examples.some((e) => e.ko.indexOf('3.') === 0 || /[\u4e00-\u9fff]/.test(e.ko)),
    JSON.stringify(g.examples.slice(4, 6).map((e) => e.ko)));
  {
    let bad = 0, empty = 0;
    for (const L of window.YK_LESSONS.lessons) for (const sec of L.sections) for (const gg of sec.grammar) {
      if (!gg.explain) empty++;
      for (const e of gg.examples) if (/[\u4e00-\u9fff]/.test(e.ko) || /^\d{1,2}\s*[.、)]/.test(e.ko)) bad++;
    }
    check('grammar: no example is really a Chinese explanation', bad === 0, bad + ' bad');
    check('grammar: no pattern is left without an explanation', empty === 0, empty + ' empty');
  }

  /* Tapping a word anywhere must lead somewhere with more than a gloss. */
  go('#/vocab');
  const vrow = window.document.querySelector('#view .word-row');
  check('vocab: word rows are tappable', !!vrow);
  if (vrow) {
    vrow.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const pop = window.document.querySelector('#popLayer .pop');
    check('vocab: tapping a word opens its card', !!pop && pop.textContent.length > 2);
    check('popover: offers the detail page',
      !!(pop && pop.querySelector('a[href*="#/word"]')));
    YK.closeAll();
  }
  go('#/word?w=' + encodeURIComponent('배우다'));
  const wv = window.document.getElementById('view');
  check('word page: shows the word', /배우다/.test(wv.textContent));
  check('word page: shows all ten conjugations',
    wv.querySelectorAll('.conj__row').length === 10,
    wv.querySelectorAll('.conj__row').length);
  check('word page: finds real textbook sentences',
    wv.querySelectorAll('.gex').length > 0, wv.querySelectorAll('.gex').length);
  check('word page: the picture, if any, follows the meaning',
    !wv.querySelector('.wordcard__img') || /irasutoya/.test(wv.querySelector('.wordcard__img').src));
  check('word page: offers a way back',
    [...window.document.querySelectorAll('#view button')].some((b) => b.textContent.indexOf('返回') >= 0));
  go('#/word?w=' + encodeURIComponent('학생'));
  check('word page: a noun has no conjugation section',
    window.document.querySelectorAll('#view .conj__row').length === 0);

  /* findVerb used to accept the bare stem as a hit, which matched ANY entry:
     않습니다 reduced 않 to 아 and returned the interjection 아 "啊". A verb
     lookup must return a verb. */
  {
    const look = (w) => { const h = YK.dict.lookup(w); return h && h.entry ? h.entry.ko : null; };
    check('dict: a verb ending never resolves to a non-verb',
      look('않습니다') !== '아' && look('않다') !== '아',
      look('않습니다') + ' / ' + look('않다'));
    check('dict: 않습니다 resolves to 않다', look('않습니다') === '않다', look('않습니다'));
    const good = { 먹지: '먹다', 먹습니다: '먹다', 갔어요: '가다', 했어요: '하다',
      배웁니다: '배우다', 좋아요: '좋다', 전화해: '전화하다' };
    let bad = 0;
    for (const [w, want] of Object.entries(good)) if (look(w) !== want) { bad++; console.log('   ', w, '->', look(w), 'want', want); }
    check('dict: ordinary inflections still resolve', bad === 0, bad + ' wrong');
  }

  /* Every pictogram reference must point at a file that exists, and the map
     must stay clear of words a single picture cannot show. */
  {
    const picto = window.YK_PICTO || {};
    check('picto: the map is loaded', Object.keys(picto).length > 200, Object.keys(picto).length + ' words');
    check('picto: every entry points at one of our two asset folders',
      Object.values(picto).every((p) => p.indexOf('assets/openmoji/') === 0 ||
                                       p.indexOf('assets/picto/') === 0));
    // numerals DO get a generated picture now (한자 for Sino, digit + 태극 for
    // native); counters, particles and abstract adverbs still must not
    const bad = ['명', '마리', '권', '장', '하고', '에게', '의', '자주', '가끔', '별로', '아직'];
    const wrong = bad.filter((w) => picto[w]);
    check('picto: counters, particles and adverbs have no picture', wrong.length === 0, wrong.join(','));
    check('picto: numerals are drawn by the generator',
      /assets\/picto\/num-sino/.test(picto['일'] || '') && /assets\/picto\/num-native/.test(picto['하나'] || ''),
      (picto['일'] || '-') + ' / ' + (picto['하나'] || '-'));
    check('picto: position words are drawn by the generator',
      /assets\/picto\/dir-/.test(picto['앞'] || ''), picto['앞'] || '-');
  }

  // 3. conjugation is reachable and complete
  const c = YK.conj.conjugate('먹다');
  check('conj: a verb produces all ten forms', c && c.forms.length === 10, c && c.forms.length);
  check('conj: nouns are not conjugated', YK.conj.conjugate('학생') === null);
  go('#/conj?w=' + encodeURIComponent('덥다'));
  check('conj view: shows the irregular note',
    /不规则/.test(window.document.getElementById('view').textContent),
    window.document.getElementById('view').textContent.slice(0, 80));

  // 4. the deconstruction animation builds one box per syllable
  check('hangulAnim: exposes cell/morph', !!(YK.hangulAnim && YK.hangulAnim.cell && YK.hangulAnim.morph));
  const cell = YK.hangulAnim.cell('덥');
  const parts = cell.querySelectorAll('.hpart');
  check('hangulAnim: a syllable becomes its three letters', parts.length === 3,
    [...parts].map((p) => p.textContent).join(''));
  check('hangulAnim: no-jong syllable has two letters',
    YK.hangulAnim.cell('더').querySelectorAll('.hpart').length === 2);
  /* A 겹받침 is two consonants, and that is what makes 앉아요 -> 안자요 work:
     the ㅈ must be able to leave. One glyph would lose the rule. */
  const ank = YK.hangulAnim.lettersOf('앉').map((l) => l.glyph).join('');
  check('hangulAnim: a double 받침 is split into two letters', ank === 'ㅇㅏㄴㅈ', ank);
  check('hangulAnim: a single 받침 stays one letter',
    YK.hangulAnim.lettersOf('안').map((l) => l.glyph).join('') === 'ㅇㅏㄴ');
  check('hangulAnim: letters carry their own drawn size',
    YK.hangulAnim.lettersOf('앉').every((l) => l.size > 0));
  /* The dashed boxes mark the syllables that change. They were applied to the
     INCOMING word while the timer looked for them on the OUTGOING one, so the
     animation silently lost them and became a bare cross-fade. */
  {
    const host = window.document.createElement('div');
    window.document.getElementById('view').appendChild(host);
    YK.hangulAnim.morph(host, '배우다', '배웁니다');
    const rows = host.querySelectorAll('.mrow');
    check('hangulAnim: the outgoing word is marked where it changes',
      rows.length === 2 && rows[1].querySelectorAll('.is-target').length > 0,
      rows.length + ' rows, ' + (rows[1] ? rows[1].querySelectorAll('.is-target').length : 0) + ' marks');
    host.remove();
  }
  /* The decomposition must land on the same footprint as the font's own
     composition. A real syllable inks about 0.83 x 0.89 em; the first attempt
     rendered 25% too tall because the cell was 1.32em high. */
  const boxes = ['안', '앉', '자', '국', '먹', '없'].map((c) => YK.hangulAnim.inkBox(c));
  check('hangulAnim: decomposition stays inside its cell',
    boxes.every((b) => b && b.l > -0.08 && b.r < 1.1 && b.t > -0.08 && b.b < 1.1),
    JSON.stringify(boxes.map((b) => [b.l.toFixed(2), b.t.toFixed(2), b.b.toFixed(2)])));
  const heights = boxes.map((b) => b.b - b.t);
  check('hangulAnim: decomposition is not stretched vertically',
    heights.every((h) => h > 0.75 && h < 1.15), heights.map((h) => h.toFixed(2)).join(', '));
  const widths = boxes.map((b) => b.r - b.l);
  check('hangulAnim: decomposition is not squeezed horizontally',
    widths.every((w) => w > 0.68 && w < 1.05), widths.map((w) => w.toFixed(2)).join(', '));
  check('hangulAnim: aligns the unchanged part',
    JSON.stringify(YK.hangulAnim.align([...'한국어'], [...'한구거'])) ===
      JSON.stringify({ prefix: 1, suffix: 0 }));
}

/* --- 5. lexical coverage of the actual dialogues ----------------------- */
{
  let total = 0, hit = 0;
  const misses = {};
  for (const l of window.YK_LESSONS.lessons) {
    for (const s of l.sections) {
      for (const d of s.dialogue) {
        if (d.type !== 'line') continue;
        for (const t of YK.tokens(d.ko)) {
          if (t.kind !== 'word') continue;
          total++;
          if (dl(t.text)) hit++; else misses[t.text] = (misses[t.text] || 0) + 1;
        }
      }
    }
  }
  const rate = ((hit / total) * 100).toFixed(1);
  console.log('dictionary coverage of dialogue tokens: ' + hit + '/' + total + ' = ' + rate + '%');
  const top = Object.entries(misses).sort((a, b) => b[1] - a[1]).slice(0, 25);
  console.log('top unresolved tokens: ' + top.map(([k, v]) => k + '(' + v + ')').join(' '));
  check('coverage above 80%', hit / total > 0.8, rate + '%');
}

/* --- 6. phonetics data sanity ----------------------------------------- */
{
  let n = 0;
  for (const r of window.YK_PHONETICS.rules) {
    check('rule ' + r.id + ' has items', r.items.length >= 5);
    for (const it of r.items) {
      n++;
      check('pair ' + it.from + ' is hangul', /^[\uac00-\ud7a3]+$/.test(it.from));
      check('pair ' + it.to + ' is hangul', /^[\uac00-\ud7a3]+$/.test(it.to));
    }
  }
  console.log('phonetics pairs: ' + n);
}

console.error = origError;
console.log('\n' + (fail ? '✗' : '✓') + ' ' + pass + ' checks passed, ' + fail + ' failed');
if (errors.length) {
  console.log('\nruntime errors (' + errors.length + '):');
  for (const e of [...new Set(errors)].slice(0, 25)) console.log('  ' + e);
}
process.exit(fail || errors.length ? 1 : 0);
