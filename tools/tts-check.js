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

  /* 1. idle engine: speak goes out straight away */
  calls.length = 0;
  now.speaking = false;
  YK.tts.speak('첫 번째 문장');
  ok('idle: speaks immediately', calls.length === 1 && calls[0].type === 'speak',
    JSON.stringify(calls.map((c) => c.type)));
  ok('idle: text passed through', calls[0] && calls[0].text === '첫 번째 문장');
  ok('idle: no cancel first', !calls.some((c) => c.type === 'cancel'));

  /* 2. busy engine: this is the bug. cancel() then a synchronous speak() in the
     same task is what made everything after the first click silent. */
  calls.length = 0;
  ok('engine is busy before the second request', synth.speaking === true);
  YK.tts.speak('두 번째 문장');
  const syncTypes = calls.map((c) => c.type);
  ok('busy: cancels the old utterance', syncTypes.includes('cancel'));
  ok('busy: does NOT speak in the same task as cancel',
    !syncTypes.includes('speak'), JSON.stringify(syncTypes));
  ok('busy: yields before speaking', YK.tts._internals().pending === true);

  await sleep(140);
  const after = calls.filter((c) => c.type === 'speak').map((c) => c.text);
  ok('busy: new utterance is spoken after the flush', after.includes('두 번째 문장'),
    JSON.stringify(after));
  const cancelAt = calls.find((c) => c.type === 'cancel').at;
  const speakAt = calls.find((c) => c.type === 'speak' && c.text === '두 번째 문장').at;
  ok('busy: speak happens strictly after cancel', speakAt > cancelAt,
    `${cancelAt} -> ${speakAt}`);

  /* 3. rapid clicking must only play the newest request */
  calls.length = 0;
  now.speaking = true;
  YK.tts.speak('클릭 A');
  YK.tts.speak('클릭 B');
  YK.tts.speak('클릭 C');
  await sleep(160);
  const spoken = calls.filter((c) => c.type === 'speak').map((c) => c.text);
  ok('rapid clicks: only the newest is spoken', spoken.length === 1 && spoken[0] === '클릭 C',
    JSON.stringify(spoken));

  /* 4. stop() silences and clears the retained utterance */
  YK.tts.stop();
  ok('stop: cancels', calls.some((c) => c.type === 'cancel'));
  ok('stop: clears the retained reference', YK.tts._internals().current === null);
  ok('stop: clears the pending flush', YK.tts._internals().pending === false);

  /* 5. no Korean voice -> silent, but never throws */
  ok('engine reports a Korean voice', YK.tts.hasKoreanVoice() === true);
  YK.tts.speak('');
  ok('empty text is a no-op', true);

  console.log('\n' + (fail ? `✗ ${fail} failed, ${pass} passed` : `✓ ${pass} checks passed`));
  process.exit(fail ? 1 : 0);
})();
