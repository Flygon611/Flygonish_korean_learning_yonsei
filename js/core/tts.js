/* -------------------------------------------------------------------- tts
   Korean speech through the browser's own engine, so the site stays offline
   and dependency-free.

   Design notes, learned the hard way:

   * `speak()` is called synchronously from the click handler. Safari and
     Chrome only grant speech to an utterance issued inside the user's
     activation window, so nothing may be queued from a timer.
   * `resume()` is called first: Chrome's queue can be left in a paused state
     (after the tab is backgrounded, or the machine sleeps) and then `speak()`
     silently does nothing.
   * Failures are surfaced, not swallowed. If the engine never fires `start`,
     or reports an error, the user gets told which of the two it was instead of
     tapping a button that does nothing.
   * `diagnose()` exists so a "no sound" report can be turned into a concrete
     answer — voice list, chosen voice, error code, time to start. */
(function () {
  const YK = (window.YK = window.YK || {});
  const synth = window.speechSynthesis;

  /* Three roles. 'default' is used everywhere; 'male'/'female' override it for
     a speaker whose gender we know, so a dialogue can alternate voices. */
  const PREF = { default: 'yk1.voice', male: 'yk1.voice.male', female: 'yk1.voice.female' };
  const DEAD_KEY = 'yk1.voice.silent';
  const ROLES = ['default', 'male', 'female'];
  let voice = null;
  let ready = false;
  let current = null;        // keeps the in-flight utterance alive
  let watchdog = null;
  let lastError = null;

  function koreanVoices() {
    if (!synth) return [];
    return (synth.getVoices() || [])
      .filter((v) => /^ko/i.test(v.lang) || /korean|한국/i.test(v.name));
  }

  /* Voices the OS lists but never installed play silently. Once we have caught
     one doing that, remember it and stop offering it as a default. */
  function silentVoices() {
    try { return JSON.parse(localStorage.getItem(DEAD_KEY) || '[]'); } catch (e) { return []; }
  }
  function markSilent(name) {
    if (!name) return;
    const list = silentVoices();
    if (list.indexOf(name) >= 0) return;
    list.push(name);
    try { localStorage.setItem(DEAD_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }

  function savedName(role) {
    try { return localStorage.getItem(PREF[role] || PREF.default) || ''; } catch (e) { return ''; }
  }

  /* "never chosen" and "deliberately cleared" are different states: the first
     gets auto-filled, the second must stay on the default voice. An empty
     string in storage marks the second. */
  function hasChoice(role) {
    try { return localStorage.getItem(PREF[role]) !== null; } catch (e) { return false; }
  }

  /* macOS/Edge ship "novelty" voices (Eddy, Bells, Zarvox…) that are listed as
     ko-KR-adjacent but are not a usable reading voice. They sort first in the
     voice list, so without this they become the default. */
  const NOVELTY = /^(Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley|Albert|Bad News|Good News|Bahh|Bells|Boing|Bubbles|Cellos|Jester|Junior|Kathy|Organ|Princess|Ralph|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Zosia|Grandma|Shelley)\b/i;

  /* Voice names carry the speaker's Korean given name, which is enough to sort
     them into the two dialogue roles without asking the user to audition every
     one. Anything not listed stays unassigned rather than being guessed. */
  const FEMALE_HINT = /서희|Seohee|지민|Jimin|유나|Yuna|선희|Seonhee|소라|Sora|Heami|희준|지우|Jiwoo|수진|Sujin|Google/i;
  const MALE_HINT = /인준|InJoon|현수|Hyunsu|준호|Junho|봉수|Bongsu|광민|Gwangmin|민준|Minjun|상훈|Sanghun|재현|Jaehyun/i;

  /* Best available voice for a role: the Natural/Online cloud voices first,
     because they are the ones that actually sound like people. */
  function rankVoice(a, b) {
    // lower is better: cloud "Natural" voices sound like people, novelty
    // voices (Eddy, Bells…) sound like toys and always sort last
    const score = (v) =>
      (/Natural|Online/i.test(v.name) ? 0 : 5)
      + (/Google/i.test(v.name) ? 0 : 1)
      + (NOVELTY.test(v.name) ? 20 : 0);
    return score(a) - score(b);
  }

  function autoRole(role, ko) {
    const hint = role === 'male' ? MALE_HINT : FEMALE_HINT;
    const other = role === 'male' ? FEMALE_HINT : MALE_HINT;
    const usable = ko.filter((v) => !NOVELTY.test(v.name));
    // Only name-matched voices. Guessing would happily label a female voice
    // "男声" on a machine that has no male Korean voice at all, which is worse
    // than leaving the role on the default and letting the user choose.
    return usable.filter((v) => hint.test(v.name) && !other.test(v.name)).sort(rankVoice)[0] || null;
  }

  /* Fill in the two dialogue roles on first run. Never overwrites a choice the
     user made, and leaves the role empty when there is nothing suitable. */
  function autoAssignRoles() {
    const ko = koreanVoices();
    if (!ko.length) return;
    for (const role of ['male', 'female']) {
      if (hasChoice(role)) continue;
      const dead = silentVoices();
      const pick = autoRole(role, ko.filter((v) => dead.indexOf(v.name) < 0));
      const other = role === 'male' ? savedName('female') : savedName('male');
      // only when it is a distinct, name-matched voice
      if (pick && pick.name !== other) setVoice(pick.name, role);
    }
  }

  function pickVoice() {
    const ko = koreanVoices();
    if (!ko.length) return null;
    // An explicit choice always wins: several voices are listed by the OS
    // before their data is actually installed, and those play silently.
    return autoPick(ko);
  }

  function autoPick(ko) {
    const dead = silentVoices();
    const alive = ko.filter((v) => dead.indexOf(v.name) < 0);
    const pool = alive.length ? alive : ko;   // never end up with nothing
    const saved = savedName('default');
    const chosen = saved && pool.find((v) => v.name === saved);
    if (chosen) return chosen;
    return pool.find((v) => /Natural|Online/i.test(v.name))   // Edge's cloud voices
        || pool.find((v) => /Google/i.test(v.name))           // Chrome's built-in
        || pool.find((v) => !NOVELTY.test(v.name))            // any real system voice
        || pool[0];
  }

  function forgetSilent() {
    try { localStorage.removeItem(DEAD_KEY); } catch (e) { /* ignore */ }
  }

  /* Which voice object to use for a role. An unset gender role falls back to
     the default voice, so one picked voice still drives the whole site. */
  function voiceFor(role) {
    if (role === 'male' || role === 'female') {
      const ko = koreanVoices();
      const saved = savedName(role);
      const hit = saved && ko.find((v) => v.name === saved);
      if (hit) return hit;
    }
    return voice;
  }

  function assignments() {
    const out = {};
    for (const r of ROLES) {
      if (r === 'default') { out[r] = voice ? voice.name : null; continue; }
      const saved = savedName(r);
      const ko = koreanVoices();
      out[r] = (saved && ko.some((v) => v.name === saved)) ? saved : null;
    }
    return out;
  }

  /* Compare by name: getVoices() hands back fresh objects on every call, so
     identity comparison silently reports "none selected". */
  const isCurrent = (v) => !!voice && voice.name === v.name && voice.lang === v.lang;

  function listVoices() {
    const a = assignments();
    const dead = silentVoices();
    return koreanVoices()
      .map((v) => ({
        name: v.name, lang: v.lang,
        current: isCurrent(v),
        silent: dead.indexOf(v.name) >= 0,
        novelty: NOVELTY.test(v.name),
        roles: ROLES.filter((r) => a[r] === v.name),
      }))
      // real voices first: the OS happens to list its novelty voices first
      .sort((x, y) => (x.novelty ? 1 : 0) - (y.novelty ? 1 : 0) || rankVoice(x, y));
  }

  /* setVoice(name, role). Pass null as the name to clear a gender role. */
  function setVoice(name, role) {
    role = PREF[role] ? role : 'default';
    if (name) {
      // an explicit choice clears any "this one is silent" mark for that voice
      const list = silentVoices();
      const i = list.indexOf(name);
      if (i >= 0) { list.splice(i, 1); try { localStorage.setItem(DEAD_KEY, JSON.stringify(list)); } catch (e) {} }
    }
    if (name === null) {
      try { localStorage.setItem(PREF[role], ''); } catch (e) { /* ignore */ }
      return null;
    }
    const found = koreanVoices().find((v) => v.name === name);
    if (!found) return role === 'default' && voice ? voice.name : null;
    try { localStorage.setItem(PREF[role], name); } catch (e) { /* private mode */ }
    if (role === 'default') { voice = found; ready = true; }
    return found.name;
  }

  function refresh() {
    voice = pickVoice();
    ready = !!voice;
    autoAssignRoles();
  }

  if (synth) {
    refresh();
    synth.addEventListener?.('voiceschanged', refresh);
    setTimeout(refresh, 400);        // Safari populates late without the event
    setTimeout(refresh, 1500);
  }

  function notify(msg, kind) {
    if (YK.ui && YK.ui.toast) YK.ui.toast(msg, kind || null);
  }

  function clearMarks() {
    document.querySelectorAll('.spk.is-speaking').forEach((b) => b.classList.remove('is-speaking'));
  }

  function stop() {
    clearTimeout(watchdog);
    watchdog = null;
    current = null;
    if (synth) synth.cancel();
    clearMarks();
  }

  function speak(text, btn, opts) {
    if (!synth) { notify('这个浏览器不支持语音合成', 'bad'); return false; }
    if (!text) return false;

    refresh();                       // voices may only just have arrived

    const active = voiceFor(opts && opts.role);
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'ko-KR';
    if (active) u.voice = active;
    u.rate = 0.86;                   // beginner-friendly: slower than native
    u.pitch = 1;
    u.volume = 1;

    let started = false;
    let startedAt = 0;
    lastError = null;
    u.onstart = () => {
      started = true;
      startedAt = Date.now();
      clearTimeout(watchdog);
      if (btn) btn.classList.add('is-speaking');
    };
    u.onend = () => {
      if (btn) btn.classList.remove('is-speaking');
      // A voice the OS lists but has not downloaded starts fine and then
      // finishes almost instantly, silently. Say so instead of leaving the
      // user tapping a button that appears to work.
      const ms = startedAt ? Date.now() - startedAt : 0;
      const syllables = String(text).replace(/[^\uac00-\ud7a3]/g, '').length;
      if (started && syllables >= 3 && ms < 120 + syllables * 12) {
        const bad = active ? active.name : '';
        markSilent(bad);
        notify('这段朗读只用了 ' + ms + 'ms，几乎肯定没出声——「' + (bad || '当前语音') +
          '」没有真正安装，已记下不再默认使用。到「字母与发音」页换一个语音。', 'bad');
      }
    };
    u.onerror = (e) => {
      lastError = (e && e.error) || 'unknown';
      clearTimeout(watchdog);
      if (btn) btn.classList.remove('is-speaking');
    };

    clearMarks();
    clearTimeout(watchdog);
    current = u;                     // held until the next call or stop()

    // everything below stays inside this click's activation window
    if (synth.speaking || synth.pending) synth.cancel();
    if (synth.paused) synth.resume();
    try {
      synth.speak(u);
    } catch (err) {
      notify('朗读失败：' + err.message, 'bad');
      return false;
    }

    watchdog = setTimeout(() => {
      if (started) return;
      if (lastError) {
        notify('朗读失败：' + lastError +
          (lastError === 'not-allowed' ? '（浏览器拒绝了这次朗读）' : ''), 'bad');
      } else if (!ready) {
        notify('系统里没有韩语语音，装上「韩语（韩国）」后即可朗读', 'bad');
      } else {
        notify('浏览器没有开始朗读（已选用 ' + (active ? active.name : '默认语音') + '）', 'bad');
      }
    }, 1500);

    return true;
  }

  /* Read a whole section: items = [{ text, role }]. Every utterance is issued
     inside the same click, so the engine just queues them and each line gets
     its speaker's voice. */
  function speakSequence(items) {
    if (!synth || !items || !items.length) return false;
    clearTimeout(watchdog);
    clearMarks();
    current = null;
    if (synth.speaking || synth.pending) synth.cancel();
    if (synth.paused) synth.resume();
    for (const it of items) {
      if (!it || !it.text) continue;
      const u = new SpeechSynthesisUtterance(String(it.text));
      u.lang = 'ko-KR';
      const v = voiceFor(it.role);
      if (v) u.voice = v;
      u.rate = 0.86;
      u.pitch = 1;
      u.volume = 1;
      synth.speak(u);
    }
    return true;
  }

  /* One-shot report used by the 字母与发音 page. */
  function diagnose() {
    return new Promise((resolve) => {
      if (!synth) {
        resolve({ ok: false, msg: '这个浏览器不支持 speechSynthesis' });
        return;
      }
      refresh();
      const all = synth.getVoices() || [];
      const ko = koreanVoices();
      const base = {
        voices: all.length,
        korean: ko.map((v) => v.name + ' / ' + v.lang),
        chosen: voice ? voice.name + ' / ' + voice.lang : '(没有可用的韩语语音)',
      };
      if (!ko.length) {
        resolve(Object.assign(base, { ok: false, msg: '系统里没有韩语语音' }));
        return;
      }
      const u = new SpeechSynthesisUtterance('안녕하세요');
      u.lang = 'ko-KR';
      u.voice = voice;
      const t0 = Date.now();
      let settled = false;
      const finish = (ok, msg) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(Object.assign(base, { ok, msg }));
      };
      u.onstart = () => finish(true, '引擎已开始朗读（' + (Date.now() - t0) + ' ms）');
      u.onerror = (e) => finish(false, '引擎报错：' + ((e && e.error) || 'unknown'));
      const timer = setTimeout(() => finish(false, '1.5 秒内没有开始朗读'), 1500);
      synth.cancel();
      if (synth.paused) synth.resume();
      synth.speak(u);
    });
  }

  /* build the little speaker button used all over the app */
  function button(text, opts) {
    const b = YK.h('button', {
      class: 'spk' + ((opts && opts.cls) ? ' ' + opts.cls : ''),
      type: 'button', title: '朗读', 'aria-label': '朗读：' + text,
      html: '<span aria-hidden="true">🔊</span>',
    });
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      speak(text, b, opts && opts.role ? { role: opts.role } : null);
    });
    return b;
  }

  YK.tts = {
    speak, stop, button, diagnose, listVoices, setVoice, assignments, speakSequence,
    forgetSilent, autoAssignRoles,
    available: () => !!synth,
    hasKoreanVoice: () => ready,
    _internals: () => ({ current, voice: voice && voice.name, ready }),
  };
})();
