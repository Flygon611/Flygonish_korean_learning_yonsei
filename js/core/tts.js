/* -------------------------------------------------------------------- tts
   Korean speech through the browser's own engine, so the site stays offline
   and dependency-free. Voice availability varies a lot between systems, so
   everything degrades to "no sound, no error". */
(function () {
  const YK = (window.YK = window.YK || {});
  const synth = window.speechSynthesis;

  let voice = null;
  let ready = false;

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

  function stop() {
    if (synth) synth.cancel();
    document.querySelectorAll('.spk.is-speaking').forEach((b) => b.classList.remove('is-speaking'));
  }

  function speak(text, btn) {
    if (!synth || !text) return false;
    stop();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = voice ? voice.lang : 'ko-KR';
    if (voice) u.voice = voice;
    u.rate = 0.86;                       // beginner-friendly: slower than native
    u.pitch = 1;
    if (btn) {
      u.onstart = () => btn.classList.add('is-speaking');
      u.onend = u.onerror = () => btn.classList.remove('is-speaking');
    }
    synth.speak(u);
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
  };
})();
