/* Actual pronunciation and Revised Romanization.
 *
 *   say('좋다')   -> '조타'   what the word actually sounds like
 *   roman('좋다') -> 'jota'   the Revised Romanization of that sound
 *
 * Romanization runs AFTER the sound changes on purpose: the official system
 * romanizes pronunciation, not spelling, so 좋다 is jota rather than johda.
 *
 * Covers the changes that appear in this textbook. It is not a full phonology
 * engine — ㄴ-addition in compounds and rare contractions are left out, and
 * input it does not recognise is returned unchanged rather than guessed at.
 */
(function () {
  var YK = window.YK = window.YK || {};
  var J = YK.jamo;
  if (!J) return;
  /* jamo.js keeps its tables private and its split() returns an object, so the
     tables are repeated here rather than reached into. */
  var CHO = '\u3131\u3132\u3134\u3137\u3138\u3139\u3141\u3142\u3143\u3145\u3146\u3147\u3148\u3149\u314A\u314B\u314C\u314D\u314E';
  var JUNG = '\u314F\u3150\u3151\u3152\u3153\u3154\u3155\u3156\u3157\u3158\u3159\u315A\u315B\u315C\u315D\u315E\u315F\u3160\u3161\u3162\u3163';
  var JONG = ' \u3131\u3132\u3133\u3134\u3135\u3136\u3137\u3139\u313A\u313B\u313C\u313D\u313E\u313F\u3140\u3141\u3142\u3144\u3145\u3146\u3147\u3148\u314A\u314B\u314C\u314D\u314E';
  var IEUNG = '\u3147', NIEUN = '\u3134', RIEUL = '\u3139', HIEUT = '\u314E';

  var NASAL = { '\u3131': IEUNG, '\u3137': NIEUN, '\u3142': '\u3141' };      // ㄱ→ㅇ ㄷ→ㄴ ㅂ→ㅁ
  var TENSE = { '\u3131': '\u3132', '\u3137': '\u3138', '\u3142': '\u3143',
                '\u3145': '\u3146', '\u3148': '\u3149' };                    // →ㄲ ㄸ ㅃ ㅆ ㅉ
  var ASPIRATE = { '\u3131': '\u314B', '\u3137': '\u314C', '\u3148': '\u314A' }; // →ㅋ ㅌ ㅊ

  function cellsOf(text) {
    var out = [], s = text.split('');
    for (var i = 0; i < s.length; i++) {
      var p = J.split(s[i]);
      out.push(p ? { cho: p.cho, jung: p.jung, jong: p.jong, on: true } : { raw: s[i], on: false });
    }
    return out;
  }

  /* Double final consonants (겹받침). Before a vowel the second letter moves to
     the next syllable; before a consonant — or at the end of a word — the word
     keeps only one of them. Without this, 값 / 닭 / 없어요 / 앉아요 / 읽다 all
     come out unchanged, which is simply the wrong sound. */
  var TWIN = {
    '\u3133': ['\u3131', '\u3145'], // ㄳ
    '\u3135': ['\u3134', '\u3148'], // ㄵ
    '\u3136': ['\u3134', '\u314E'], // ㄶ
    '\u313A': ['\u3139', '\u3131'], // ㄺ
    '\u313B': ['\u3139', '\u3141'], // ㄻ
    '\u313C': ['\u3139', '\u3142'], // ㄼ
    '\u313D': ['\u3139', '\u3145'], // ㄽ
    '\u313E': ['\u3139', '\u314C'], // ㄾ
    '\u313F': ['\u3139', '\u314D'], // ㄿ
    '\u3140': ['\u3139', '\u314E'], // ㅀ
    '\u3144': ['\u3142', '\u3145'], // ㅄ
  };
  /* what survives in front of a consonant */
  var TWIN_KEEP = { '\u3133': '\u3131', '\u3135': '\u3134', '\u3136': '\u3134',
                    '\u313A': '\u3131', '\u313B': '\u3141', '\u313C': '\u3139',
                    '\u313D': '\u3139', '\u313E': '\u3139', '\u313F': '\u3142',
                    '\u3140': '\u3139', '\u3144': '\u3142' };

  function say(text, plain) {
    if (!text) return '';
    var c = cellsOf(text);
    var vowelStart = function (x) { return x && x.on && x.cho === IEUNG; };
    var nasalStart = function (x) { return x && x.on && (x.cho === NIEUN || x.cho === '\u3141'); };

    /* double finals first: split before a vowel, simplify elsewhere */
    for (var d = 0; d < c.length; d++) {
      var dc = c[d];
      if (!dc.on || !TWIN[dc.jong]) continue;
      var dn = c[d + 1], pair = TWIN[dc.jong];
      if (dn && dn.on && dn.cho === IEUNG) {
        dc.jong = pair[0];
        dn.cho = pair[1];
      } else {
        dc.jong = TWIN_KEEP[dc.jong];
      }
    }

    for (var i = 0; i < c.length; i++) {
      var a = c[i];
      if (!a.on || !a.jong) continue;
      var b = c[i + 1], j = a.jong;

      /* ㅎ + plain stop -> aspirate (좋다 -> 조타); ㅎ + ㅅ -> ㅆ */
      if (j === HIEUT && b && b.on) {
        if (ASPIRATE[b.cho]) { a.jong = ''; b.cho = ASPIRATE[b.cho]; continue; }
        if (b.cho === '\u3145') { a.jong = ''; b.cho = '\u3146'; continue; }
      }
      if (!b || !b.on) continue;
      /* 받침 ㅆ before ㅅ tenses the ㅅ too: 있습니다 -> 읻씀니다 */
      if (!plain && j === '\u3146' && b.cho === '\u3145') { a.jong = '\u3137'; b.cho = '\u3146'; continue; }

      /* nasalisation: ㄱ/ㄷ/ㅂ before ㄴ/ㅁ */
      if (nasalStart(b) && NASAL[j]) a.jong = NASAL[j];
      /* ㄹ with ㄴ either way -> ㄹㄹ */
      if (j === RIEUL && b.cho === NIEUN) b.cho = RIEUL;
      if (j === NIEUN && b.cho === RIEUL) a.jong = RIEUL;
      /* tensification: a stop final before ㄱ ㄷ ㅂ ㅅ ㅈ */
      /* Tensification is skipped for romanisation: the Revised Romanization
         does not write a consonant hardened by the one before it, so 학교 is
         hakgyo and 읽다 is ikda, not hakkkyo / iktta. */
      if (!plain && !vowelStart(b) && TENSE[b.cho] && /[\u3131\u3137\u3142]/.test(j)) b.cho = TENSE[b.cho];
    }

    /* 구개음화: ㄷ/ㅌ + 이 -> 지/치 */
    for (var k = 0; k < c.length - 1; k++) {
      var p = c[k], q = c[k + 1];
      if (!p.on || !q.on || !vowelStart(q) || q.jung !== '\u3163') continue;
      if (p.jong === '\u3137') { p.jong = ''; q.cho = '\u3148'; }
      else if (p.jong === '\u314C') { p.jong = ''; q.cho = '\u314A'; }
    }

    /* 연음: a final consonant that moved into a following empty initial
       belongs to that syllable when the word is actually said
       (한국어 -> 한구거). */
    for (var r = 0; r < c.length - 1; r++) {
      var ra = c[r], rb = c[r + 1];
      if (ra.on && ra.jong && rb.on && rb.cho === IEUNG) { rb.cho = ra.jong; ra.jong = ''; }
    }

    return c.map(function (x) { return x.on ? J.join(x.cho, x.jung, x.jong) : x.raw; }).join('');
  }

  var R_CHO = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
  var R_JUNG = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe',
                'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
  var R_JONG = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'p', 'l', 'l', 'l', 'l',
                'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];
  var CARRY = { '\u3131': 'g', '\u3132': 'kk', '\u3134': 'n', '\u3137': 'd', '\u3139': 'r',
                '\u3141': 'm', '\u3142': 'b', '\u3145': 's', '\u3146': 'ss', '\u3148': 'j',
                '\u314A': 'ch', '\u314B': 'k', '\u314C': 't', '\u314D': 'p', '\u314E': 'h' };

  function roman(text) {
    var c = cellsOf(say(text, true)), out = '';
    for (var i = 0; i < c.length; i++) {
      var x = c[i];
      if (!x.on) { out += x.raw; continue; }
      if (x.carryIn) out += x.carryIn;
      out += R_CHO[CHO.indexOf(x.cho)] + R_JUNG[JUNG.indexOf(x.jung)];
      if (x.jong) {
        var n = c[i + 1];
        if (n && n.on && n.cho === IEUNG) n.carryIn = CARRY[x.jong];  // carried into the next syllable
        else out += R_JONG[JONG.indexOf(x.jong)];
      }
    }
    return out;
  }

  YK.pron = { say: say, roman: roman };
})();
