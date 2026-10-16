/* -------------------------------------------------------------------- tts
   Korean speech through the browser's own engine, so the site stays offline
   and dependency-free.

   Two Chrome quirks drive the shape of this file:

   1. `cancel()` followed by a synchronous `speak()` inside the same task makes
      the engine drop the new utterance — the first thing you click plays, and
      everything after it is silent. So when something is already speaking we
      cancel, then speak on a short flush delay.
   2. An utterance with no live reference can be collected before it is
      spoken; the queue then goes quiet at random. `current` holds on to it.

   Everything degrades to "no sound, no error" when the platform has no
   Korean voice. */
(function () {
  const YK = (window.YK = window.YK || {});
  const synth = window.speechSynthesis;

  let voice = null;
  let ready = false;
  let current = null;          // keeps the in-flight utterance alive
  let flush = null;            // pending speak-after-cancel timer

  function pickVoice() {
    if (!synth) return null;
    const voices = synth.getVoices() || [];
    if (!voices.length) return null;
    const ko = voices.filter((v) => /^ko/i.test(v.lang) || /korean|한국/i.test(v.name));
    if (!ko.length) return null;
    // prefer the higher-quality named voices when the OS offers them
    return ko.find((v) => /Sora|Yuna|Premium|Enhanced|Google/i.test(v.name)) || ko[0];
  }

  function refresh() {
    voice = pickVoice();
    ready = !!voice;
  }

  if (synth) {
    refresh();
    synth.addEventListener?.('voiceschanged', refresh);
    // Safari sometimes populates late without firing the event
    setTimeout(refresh, 400);
  }

  function clearMarks() {
    document.querySelectorAll('.spk.is-speaking').forEach((b) => b.classList.remove('is-speaking'));
  }

  function stop() {
    clearTimeout(flush);
    flush = null;
    current = null;
    if (synth) synth.cancel();
    clearMarks();
  }

  function speak(text, btn) {
    if (!synth || !text) return false;

    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = voice ? voice.lang : 'ko-KR';
    if (voice) u.voice = voice;
    u.rate = 0.86;                       // beginner-friendly: slower than native
    u.pitch = 1;
    u.onstart = () => { if (btn) btn.classList.add('is-speaking'); };
    u.onend = u.onerror = () => { if (btn) btn.classList.remove('is-speaking'); };

    clearMarks();
    clearTimeout(flush);
    current = u;                         // held until the next call or stop()

    /* Also treat a queued flush as busy: after cancel() the engine reports
       itself idle, so trusting it alone lets the next click speak immediately
       and you hear a stutter of half-finished sentences. */
    const busy = synth.speaking || synth.pending || flush !== null;
    if (busy) {
      clearTimeout(flush);
      if (synth.speaking || synth.pending) synth.cancel();
      flush = setTimeout(() => {
        flush = null;
        if (current !== u) return;       // superseded by a newer click
        if (synth.paused) synth.resume();
        synth.speak(u);
      }, 90);
    } else {
      if (synth.paused) synth.resume();
      synth.speak(u);
    }
    return true;
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
    speak, stop, button,
    available: () => !!synth,
    hasKoreanVoice: () => ready,
    /* exposed for tests */
    _internals: () => ({ current, pending: !!flush, voice: voice && voice.name }),
  };
})();
