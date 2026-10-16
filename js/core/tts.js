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

  function pickVoice() {
    const ko = koreanVoices();
    if (!ko.length) return null;
    // prefer a real local voice over the novelty ones Edge ships
    return ko.find((v) => /Yuna|Sora|Google|Premium|Enhanced/i.test(v.name)) || ko[0];
  }

  function refresh() {
    voice = pickVoice();
    ready = !!voice;
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

  function speak(text, btn) {
    if (!synth) { notify('这个浏览器不支持语音合成', 'bad'); return false; }
    if (!text) return false;

    refresh();                       // voices may only just have arrived

    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'ko-KR';
    if (voice) u.voice = voice;
    u.rate = 0.86;                   // beginner-friendly: slower than native
    u.pitch = 1;

    let started = false;
    lastError = null;
    u.onstart = () => {
      started = true;
      clearTimeout(watchdog);
      if (btn) btn.classList.add('is-speaking');
    };
    u.onend = () => { if (btn) btn.classList.remove('is-speaking'); };
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
        notify('浏览器没有开始朗读（已选用 ' + voice.name + '）', 'bad');
      }
    }, 1500);

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
    b.addEventListener('click', (e) => { e.stopPropagation(); speak(text, b); });
    return b;
  }

  YK.tts = {
    speak, stop, button, diagnose,
    available: () => !!synth,
    hasKoreanVoice: () => ready,
    _internals: () => ({ current, voice: voice && voice.name, ready }),
  };
})();
