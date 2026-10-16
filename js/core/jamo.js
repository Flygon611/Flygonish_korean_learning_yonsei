/* ------------------------------------------------------------------ jamo
   Hangul syllable surgery. One implementation, used by the dictionary (to walk
   a conjugated form back to its base), by the conjugator, and by the animation
   that pulls a syllable apart into its letters. */
(function () {
  const YK = (window.YK = window.YK || {});

  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  const JONG = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';

  const isHangul = (c) => c >= '\uac00' && c <= '\ud7a3';

  function split(c) {
    if (!c || !isHangul(c)) return null;
    const i = c.charCodeAt(0) - 0xac00;
    const j = JONG[i % 28];
    return {
      cho: CHO[Math.floor(i / 588)],
      jung: JUNG[Math.floor((i % 588) / 28)],
      jong: j === ' ' ? '' : j,
    };
  }

  function join(cho, jung, jong) {
    const a = CHO.indexOf(cho), b = JUNG.indexOf(jung), c = JONG.indexOf(jong || ' ');
    if (a < 0 || b < 0 || c < 0) return '';
    return String.fromCharCode(0xac00 + a * 588 + b * 28 + c);
  }

  /* the final syllable of a stem, which is the one every ending touches */
  const last = (s) => (s && s.length ? s[s.length - 1] : '');
  const lastPart = (s) => split(last(s));
  const hasBatchim = (s) => { const p = lastPart(s); return !!(p && p.jong); };

  const withLast = (stem, cho, jung, jong) =>
    stem.slice(0, -1) + join(cho, jung, jong);

  /* add a final consonant to the last syllable (가 -> 갔) */
  function addJong(stem, jong) {
    const p = lastPart(stem);
    if (!p || p.jong) return stem;
    return withLast(stem, p.cho, p.jung, jong);
  }

  /* drop the final consonant (살다's 살 -> 사) */
  function dropJong(stem) {
    const p = lastPart(stem);
    if (!p || !p.jong) return stem;
    return withLast(stem, p.cho, p.jung, '');
  }

  /* vowel classes, used for the 아/어 choice and for the animation layout */
  const VERTICAL = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅣ';
  const HORIZONTAL = 'ㅗㅛㅜㅠㅡ';
  const COMPOUND = {
    'ㅑ': ['ㅣ', 'ㅏ'], 'ㅕ': ['ㅣ', 'ㅓ'], 'ㅛ': ['ㅣ', 'ㅗ'], 'ㅠ': ['ㅣ', 'ㅜ'],
    'ㅒ': ['ㅣ', 'ㅐ'], 'ㅖ': ['ㅣ', 'ㅔ'], 'ㅘ': ['ㅗ', 'ㅏ'], 'ㅙ': ['ㅗ', 'ㅐ'],
    'ㅝ': ['ㅜ', 'ㅓ'], 'ㅞ': ['ㅜ', 'ㅔ'], 'ㅢ': ['ㅡ', 'ㅣ'],
  };

  /* which way the vowel sits, so the letter animation can arrange the parts */
  function layoutOf(ch) {
    const p = split(ch);
    if (!p) return 'v';
    if (VERTICAL.includes(p.jung)) return 'v';
    if (HORIZONTAL.includes(p.jung)) return 'h';
    return 'm';
  }

  YK.jamo = {
    CHO, JUNG, JONG, isHangul, split, join,
    last, lastPart, hasBatchim, withLast, addJong, dropJong,
    layoutOf, VERTICAL, HORIZONTAL, COMPOUND,
  };
})();
