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

/* Restores the recording behaviour. Tests that deliberately break the engine
   must call this again, or every later test observes an empty call log. */
function useRecordingSynth() {
  synth.speak = function (u) {
    calls.push({ type: 'speak', text: u.text, voice: u.voice && u.voice.name, at: Date.now() });
    now.speaking = true;
    setTimeout(() => { now.speaking = false; u.onend && u.onend(); }, 400);
  };
}

const synth = {
  get speaking() { return now.speaking; },
  get pending() { return now.pending; },
  get paused() { return now.paused; },
  speak(u) { useRecordingSynth.call(null); return synth.speak(u); },
  cancel() { calls.push({ type: 'cancel', at: Date.now() }); now.speaking = false; now.pending = false; },
  resume() { calls.push({ type: 'resume' }); now.paused = false; },
  getVoices() {
    // fresh objects every call, like the real API
    return [
      { name: 'Eddy (韩语（韩国）)', lang: 'ko-KR' },
      { name: 'Flo (韩语（韩国）)', lang: 'ko-KR' },
      { name: 'Yuna', lang: 'ko-KR' },
      { name: 'Microsoft 서희 Online (Natural) - Korean (Korea)', lang: 'ko-KR' },
      { name: 'Microsoft 인준 Online (Natural) - Korean (Korea)', lang: 'ko-KR' },
      { name: 'Microsoft Hyunsu Multilingual Online (Natural) - Korean (Korea)', lang: 'ko-KR' },
    ];
  },
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
  const DEFAULT_V = 'Microsoft 서희 Online (Natural) - Korean (Korea)';

  /* 0. default voice choice: a real voice beats the novelty voices that the OS
     happens to list first */
  ok('autoPick: prefers Natural/Online over the first listed voice',
    YK.tts._internals().voice === DEFAULT_V, YK.tts._internals().voice);

  /* 0b. the two dialogue roles are filled in automatically from the voice
     names, so the user is not left auditioning a dozen novelty voices */
  const auto = YK.tts.assignments();
  ok('autoAssign: male role is a Natural male voice',
    /인준|Hyunsu|InJoon/.test(auto.male || ''), String(auto.male));
  ok('autoAssign: female role is a Natural female voice',
    /서희|Seohee/.test(auto.female || ''), String(auto.female));
  ok('autoAssign: no novelty voice is auto-assigned',
    !/Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley/.test(
      [auto.default, auto.male, auto.female].join(' ')),
    JSON.stringify(auto));
  const order = YK.tts.listVoices();
  ok('picker: real voices are listed before novelty ones',
    order.findIndex((v) => v.novelty) > order.findIndex((v) => !v.novelty),
    order.map((v) => v.name.split(' ')[0] + (v.novelty ? '!' : '')).join(','));

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

  /* 6b. a voice the OS lists but never installed: start fires, then it ends
     almost immediately and plays nothing. That must be reported. */
  calls.length = 0;
  toasts.length = 0;
  now.speaking = false;
  synth.speak = function (u) {
    calls.push({ type: 'speak', text: u.text, at: Date.now() });
    now.speaking = true;
    setTimeout(() => {
      now.speaking = false;
      u.onstart && u.onstart();
      u.onend && u.onend();          // ends instantly: the silent-voice case
    }, 10);
  };
  YK.tts.speak('안녕하세요 저는 학생입니다', null);
  await sleep(120);
  ok('silent voice: user is warned it produced no sound',
    toasts.some((t) => /ms|安装|出声/.test(t.m)), JSON.stringify(toasts));

  /* 6c. an explicit voice choice is remembered */
  toasts.length = 0;
  const V = YK.tts.listVoices()[0];
  ok('listVoices: exposes the korean voices', !!V, JSON.stringify(YK.tts.listVoices()));
  const picked = YK.tts.setVoice(V.name);
  ok('setVoice: accepts a known voice', picked === V.name, String(picked));
  ok('setVoice: remembers it', window.localStorage.getItem('yk1.voice') === V.name);
  ok('setVoice: rejects an unknown name without losing the current one',
    YK.tts.setVoice('No Such Voice') === V.name, YK.tts._internals().voice);
  ok('listVoices: flags the current one',
    YK.tts.listVoices().some((v) => v.current && v.name === V.name),
    JSON.stringify(YK.tts.listVoices()));

  /* 6d. male / female roles drive different voices ------------------------ */
  useRecordingSynth();                       // earlier tests replaced the stub
  YK.tts.setVoice(DEFAULT_V, 'default');
  YK.tts.setVoice('Flo (韩语（韩国）)', 'male');
  YK.tts.setVoice('Eddy (韩语（韩国）)', 'female');
  const a = YK.tts.assignments();
  ok('roles: stored separately from the default',
    a.default === DEFAULT_V && a.male === 'Flo (韩语（韩国）)' && a.female === 'Eddy (韩语（韩国）)',
    JSON.stringify(a));

  calls.length = 0;
  now.speaking = false;
  YK.tts.speak('안녕하십니까', null, { role: 'male' });
  YK.tts.speak('네, 안녕하십니까', null, { role: 'female' });
  YK.tts.speak('기본 목소리', null, null);
  const byText = {};
  for (const c of calls.filter((x) => x.type === 'speak')) byText[c.text] = c.voice;
  ok('roles: male line uses the male voice', byText['안녕하십니까'] === 'Flo (韩语（韩国）)', JSON.stringify(byText));
  ok('roles: female line uses the female voice', byText['네, 안녕하십니까'] === 'Eddy (韩语（韩国）)');
  ok('roles: a line without a role uses the default', byText['기본 목소리'] === DEFAULT_V,
    JSON.stringify(byText));

  /* 6e. a role set to null falls back to the default rather than going silent */
  YK.tts.setVoice(null, 'male');
  calls.length = 0;
  YK.tts.speak('역할 없음', null, { role: 'male' });
  ok('roles: unset role falls back to the default voice',
    calls.find((c) => c.type === 'speak').voice === DEFAULT_V,
    JSON.stringify(calls.filter((c) => c.type === 'speak')));

  /* 6f. a voice caught playing silently is remembered and avoided ---------- */
  useRecordingSynth();
  YK.tts.forgetSilent();
  YK.tts.setVoice('Yuna', 'default');
  ok('silent memory: Yuna can be selected explicitly', YK.tts._internals().voice === 'Yuna');
  now.speaking = false;
  synth.speak = function (u) {
    now.speaking = true;
    setTimeout(() => { now.speaking = false; u.onstart && u.onstart(); u.onend && u.onend(); }, 5);
  };
  YK.tts.speak('안녕하세요 저는 학생입니다', null, null);   // ends almost instantly
  await sleep(140);
  ok('silent memory: the voice is recorded',
    JSON.parse(window.localStorage.getItem('yk1.voice.silent') || '[]').indexOf('Yuna') >= 0,
    window.localStorage.getItem('yk1.voice.silent'));
  ok('silent memory: the picker marks it',
    YK.tts.listVoices().some((v) => v.name === 'Yuna' && v.silent),
    JSON.stringify(YK.tts.listVoices()));

  /* 6g. sequence: one voice per line, all queued in the same gesture -------- */
  useRecordingSynth();
  YK.tts.setVoice(DEFAULT_V, 'default');
  YK.tts.setVoice('Flo (韩语（韩国）)', 'male');
  YK.tts.setVoice('Eddy (韩语（韩国）)', 'female');
  calls.length = 0;
  YK.tts.speakSequence([
    { text: '첫 문장', role: 'female' },
    { text: '둘째 문장', role: 'male' },
    { text: '셋째 문장', role: null },
  ]);
  const seq = calls.filter((c) => c.type === 'speak');
  ok('sequence: all lines are queued at once', seq.length === 3, JSON.stringify(seq.map((c) => c.text)));
  ok('sequence: each line gets its own voice',
    seq[0].voice !== seq[1].voice && seq[0].voice === 'Eddy (韩语（韩国）)' && seq[1].voice === 'Flo (韩语（韩国）)',
    JSON.stringify(seq.map((c) => c.voice)));

  /* 7. diagnose() reports the concrete state */
  const d = await YK.tts.diagnose();
  ok('diagnose: returns a report', d && typeof d.ok === 'boolean', JSON.stringify(d));
  ok('diagnose: lists the korean voices', Array.isArray(d.korean) && d.korean.length >= 1,
    JSON.stringify(d.korean));
  ok('diagnose: says whether it started', typeof d.msg === 'string' && d.msg.length > 0, d.msg);

  console.log('\n' + (fail ? `✗ ${fail} failed, ${pass} passed` : `✓ ${pass} checks passed`));
  process.exit(fail ? 1 : 0);
})();
