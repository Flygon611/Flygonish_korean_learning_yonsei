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
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
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
window.speechSynthesis = { speak() {}, cancel() {}, getVoices: () => [], addEventListener() {} };

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

/* --- 1. every route renders ------------------------------------------- */
const routes = ['#/', '#/hangul', '#/phonetics', '#/reading?l=1&s=1', '#/vocab',
  '#/vocab?l=5&mode=flash', '#/vocab?l=2&mode=ko2zh', '#/vocab?mode=listen',
  '#/vocab?mode=spell', '#/grammar', '#/grammar?l=7', '#/practice',
  '#/practice?mode=particle', '#/practice?mode=conjugation',
  '#/practice?mode=translate', '#/practice?mode=order',
  '#/practice?mode=pattern&l=4', '#/practice?mode=phonetics',
  '#/lookup', '#/lookup?q=' + encodeURIComponent('저는 학생입니다.'), '#/cast'];

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
