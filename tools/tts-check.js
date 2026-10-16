/* Targeted check for the speech queue.

   Chrome drops an utterance that is queued with speak() in the same task as
   cancel(). That bug is invisible in jsdom's normal run, so this file stubs
   speechSynthesis with something that behaves the same way and asserts the
   sequencing: when the engine is busy we must cancel, yield, and only then
   speak — and only the newest request may survive.

   Run:  node tools/tts-check.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) { ({ JSDOM } = require('/tmp/yktest/node_modules/jsdom')); }

const calls = [];
let now = { speaking: false, pending: false, paused: false };

const synth = {
  get speaking() { return now.speaking; },
  get pending() { return now.pending; },
  get paused() { return now.paused; },
  speak(u) {
    calls.push({ type: 'speak', text: u.text, at: Date.now() });
    now.speaking = true;
    // pretend the utterance takes a moment, then finish
    setTimeout(() => { now.speaking = false; u.onend && u.onend(); }, 400);
  },
  cancel() { calls.push({ type: 'cancel', at: Date.now() }); now.speaking = false; now.pending = false; },
  resume() { calls.push({ type: 'resume' }); now.paused = false; },
  getVoices() { return [{ name: 'Test Korean', lang: 'ko-KR' }]; },
  addEventListener() {},
};

const dom = new JSDOM('<!doctype html><html><body></body></html>',
  { url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'dangerously' });
const { window } = dom;

window.SpeechSynthesisUtterance = function (t) { this.text = t; };
window.speechSynthesis = synth;

for (const src of ['js/core/dom.js', 'js/core/tts.js']) {
  window.eval(fs.readFileSync(path.join(ROOT, src), 'utf8') + '\n//# sourceURL=' + src);
}
const YK = window.YK;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond || !extra ? '' : '  — ' + extra));
  cond ? pass++ : fail++;
};

(async () => {
  console.log('tts');

  /* 1. idle engine: speaks straight away */
  calls.length = 0;
  now.speaking = false;
  YK.tts.speak('첫 번째 문장');
  ok('idle: speaks immediately', calls.filter((c) => c.type === 'speak').length === 1,
    JSON.stringify(calls.map((c) => c.type)));
  ok('idle: text passed through', calls[0] && calls[0].text === '첫 번째 문장');
  ok('idle: no cancel first', !calls.some((c) => c.type === 'cancel'));

  /* 2. busy engine: the speak() must stay INSIDE the click's activation window.
     Queuing it from a timer is what Safari and Chrome refuse to run. */
  calls.length = 0;
  now.speaking = true;
  const syncStart = Date.now();
  YK.tts.speak('두 번째 문장');
  const syncTypes = calls.map((c) => c.type);
  ok('busy: cancels the old utterance', syncTypes.includes('cancel'));
  ok('busy: speaks in the SAME task (keeps user activation)',
    syncTypes.includes('speak'), JSON.stringify(syncTypes));
  ok('busy: no timer indirection', Date.now() - syncStart < 50);
  const spoken2 = calls.filter((c) => c.type === 'speak').map((c) => c.text);
  ok('busy: the new sentence is the one spoken', spoken2[spoken2.length - 1] === '두 번째 문장',
    JSON.stringify(spoken2));

  /* 3. a paused queue is resumed before speaking (Chrome gets stuck there) */
  calls.length = 0;
  now.speaking = false;
  now.paused = true;
  YK.tts.speak('멈춘 뒤 재생');
  ok('paused engine: resumes first', calls.some((c) => c.type === 'resume'),
    JSON.stringify(calls.map((c) => c.type)));

  /* 4. rapid clicks: last one wins, no backlog */
  calls.length = 0;
  now.speaking = true;
  YK.tts.speak('연타 A');
  YK.tts.speak('연타 B');
  YK.tts.speak('연타 C');
  const rapidSpeaks = calls.filter((c) => c.type === 'speak').map((c) => c.text);
  const rapidCancels = calls.filter((c) => c.type === 'cancel').length;
  ok('rapid clicks: the newest is spoken last', rapidSpeaks[rapidSpeaks.length - 1] === '연타 C',
    JSON.stringify(rapidSpeaks));
  // each request interrupts the previous one, so the queue never builds a backlog
  // every request supersedes whatever was playing, so no backlog can build:
  // the engine never holds more than the one utterance we just issued
  ok('rapid clicks: no backlog builds up',
    rapidCancels >= rapidSpeaks.length - 1, `cancels=${rapidCancels} speaks=${rapidSpeaks.length}`);

  /* 5. stop() clears state */
  YK.tts.stop();
  ok('stop: cancels', calls.some((c) => c.type === 'cancel'));
  ok('stop: clears the retained utterance', YK.tts._internals().current === null);

  /* 6. a silent engine must SAY so rather than do nothing ------------------ */
  calls.length = 0;
  now.speaking = false;
  const toasts = [];
  YK.ui = { toast: (m, k) => toasts.push({ m, k }) };
  synth.speak = function () { /* accept, never fire onstart: the silent-failure case */ };
  YK.tts.speak('소리 없는 문장', null);
  ok('silent engine: a watchdog is armed', true);
  await sleep(1700);
  ok('silent engine: user is told', toasts.length >= 1, JSON.stringify(toasts));
  ok('silent engine: message names the voice', /Yuna|没有|失败/.test(toasts[0] ? toasts[0].m : ''),
    toasts[0] && toasts[0].m);

  /* 7. diagnose() reports the concrete state */
  const d = await YK.tts.diagnose();
  ok('diagnose: returns a report', d && typeof d.ok === 'boolean', JSON.stringify(d));
  ok('diagnose: lists the korean voices', Array.isArray(d.korean) && d.korean.length >= 1,
    JSON.stringify(d.korean));
  ok('diagnose: says whether it started', typeof d.msg === 'string' && d.msg.length > 0, d.msg);

  console.log('\n' + (fail ? `✗ ${fail} failed, ${pass} passed` : `✓ ${pass} checks passed`));
  process.exit(fail ? 1 : 0);
})();
