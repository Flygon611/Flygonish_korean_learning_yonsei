/* ------------------------------------------------------------------ conj
   Korean conjugation for the dictionary popover.

   Scope is deliberate: the ten forms a beginner meets in 延世韩国语 1, for any
   word that ends in 다. Irregular stems are handled by an explicit switch on
   the stem type rather than by one general rule — the ㅅ and ㄷ types drop the
   consonant and keep the 으, the ㅂ type turns it into 우 and *then* contracts,
   the ㅎ type contracts with a ㅣ. A single rule gets those wrong.

   Every form here is checked against textbook spellings in tools/conj-check.js,
   because teaching 더워요 as 덥어요 would be worse than not shipping this. */
(function () {
  const YK = (window.YK = window.YK || {});
  const J = YK.jamo;
  if (!J) return;

  /* stems that look irregular but are not */
  const REGULAR = {
    ㅂ: ['입', '잡', '씹', '좁', '넓', '뽑', '덮', '업'],
    ㄷ: ['받', '묻', '닫', '믿', '얻', '쏟'],
    ㅅ: ['벗', '웃', '씻', '빗'],
    르: ['따르', '다다르', '들르', '치르'],
  };

  /* ㅎ-irregular is a closed set of mostly colour/state adjectives. 좋다, 많다,
     괜찮다, 싫다, 놓다 all end in ㅎ and are perfectly regular, so this cannot
     be decided from the final consonant alone. */
  const HIEUT_IRREGULAR = new Set([
    '그렇', '이렇', '저렇', '어떻', '파랗', '빨갛', '노랗', '하얗', '까맣',
    '동그랗', '조그맣', '누렇', '허옇', '시커멓', '발갛', '뿌옇', '거멓', '퍼렇',
  ]);

  /* a couple of copulas the rules genuinely do not cover */
  const OVERRIDE = {
    '이다': { formal: '입니다', formalq: '입니까?', polite: '이에요', pastpolite: '이었어요',
              pastformal: '이었습니다', lkka: '일까요?' },
    '아니다': { formal: '아닙니다', formalq: '아닙니까?', polite: '아니에요', pastpolite: '아니었어요',
                pastformal: '아니었습니다', lkka: '아닐까요?' },
  };

  const stemOf = (word) => word.slice(0, -1);

  function analyse(word) {
    const stem = stemOf(word);
    const p = J.lastPart(stem);
    const info = { stem, kind: 'regular', irregular: null };
    if (!p) return info;
    if (stem.endsWith('르') && !REGULAR.르.includes(stem)) {
      return Object.assign(info, { kind: 'reu', irregular: '르 不规则（르 → ㄹㄹ）' });
    }
    if (stem.endsWith('하')) return Object.assign(info, { kind: 'hada' });
    if (p.jong === 'ㅂ' && !REGULAR.ㅂ.includes(stem)) {
      return Object.assign(info, { kind: 'bieup', irregular: 'ㅂ 不规则（ㅂ → 우）' });
    }
    if (p.jong === 'ㄷ' && !REGULAR.ㄷ.includes(stem)) {
      return Object.assign(info, { kind: 'digeut', irregular: 'ㄷ 不规则（ㄷ → ㄹ）' });
    }
    if (p.jong === 'ㅅ' && !REGULAR.ㅅ.includes(stem)) {
      return Object.assign(info, { kind: 'siot', irregular: 'ㅅ 不规则（ㅅ 脱落）' });
    }
    if (p.jung === 'ㅡ' && !p.jong) {
      return Object.assign(info, { kind: 'eu', irregular: '으 不规则（으 脱落）' });
    }
    if (p.jong === 'ㅎ' && HIEUT_IRREGULAR.has(stem)) {
      return Object.assign(info, { kind: 'hieut', irregular: 'ㅎ 不规则（ㅎ 脱落并缩合）' });
    }
    if (p.jong === 'ㄹ') return Object.assign(info, { kind: 'rieul' });
    return info;
  }

  /* two vowels meeting and shrinking */
  const CONTRACTIONS = {
    'ㅏㅏ': 'ㅏ', 'ㅗㅏ': 'ㅘ', 'ㅓㅓ': 'ㅓ', 'ㅜㅓ': 'ㅝ', 'ㅜㅏ': 'ㅘ',
    'ㅣㅓ': 'ㅕ', 'ㅣㅏ': 'ㅑ', 'ㅐㅓ': 'ㅐ', 'ㅔㅓ': 'ㅔ', 'ㅚㅓ': 'ㅙ',
  };
  /* null means "these two vowels do not merge": the ending then keeps its own
     syllable, which is why 쉬 + 어 is 쉬어 and not 셔. */
  function contract(a, b) {
    return CONTRACTIONS[a + b] || null;
  }

  /* ㅎ irregular: the vowel takes a ㅣ (그렇 + 어 -> 그래, 파랗 + 아 -> 파래) */
  const HIEUT_MERGE = {
    'ㅏ': 'ㅐ', 'ㅓ': 'ㅐ', 'ㅑ': 'ㅒ', 'ㅕ': 'ㅖ',
    'ㅗ': 'ㅙ', 'ㅜ': 'ㅞ', 'ㅡ': 'ㅔ', 'ㅣ': 'ㅔ', 'ㅐ': 'ㅐ', 'ㅔ': 'ㅔ',
  };

  /* 아 or 어 */
  function harmony(k) {
    if (k.kind === 'hada') return 'ㅐ';                       // 하 + 여 -> 해
    /* 으 and 르 irregulars look at the vowel BEFORE the one being dropped:
       바쁘 + 아 -> 바빠 (ㅏ), but 예쁘 + 어 -> 예뻐 (ㅖ), 쓰 + 어 -> 써. */
    const base = (k.kind === 'reu' || k.kind === 'eu') ? k.stem.slice(0, -1) : k.stem;
    const p = J.lastPart(base);
    if (!p) return 'ㅓ';
    if (k.kind === 'hieut') return 'ㅓ';
    return 'ㅏㅗ'.includes(p.jung) ? 'ㅏ' : 'ㅓ';
  }

  /* the -아요/-어요 form with the 요 taken off: 가, 먹어, 마셔, 더워, 그래 */
  function presentStem(k) {
    const stem = k.stem;
    const p = J.lastPart(stem);
    if (!p) return stem;
    const v = harmony(k);

    switch (k.kind) {
      case 'hada':
        return J.withLast(stem, 'ㅎ', 'ㅐ', '');                    // 하 -> 해

      case 'eu':
        return J.withLast(stem, p.cho, v, '');                     // 쓰 -> 써

      case 'hieut': {
        const base = J.dropJong(stem);                             // 그렇 -> 그러
        const bp = J.lastPart(base);
        return J.withLast(base, bp.cho, HIEUT_MERGE[bp.jung] || v, '');
      }

      case 'siot':
        // ㅅ drops, the ending keeps its own syllable: 낫다 -> 나아
        return J.dropJong(stem) + J.join('ㅇ', v, '');

      case 'digeut':
        // ㄷ -> ㄹ, ending keeps its own syllable: 듣다 -> 들어
        return J.withLast(stem, p.cho, p.jung, 'ㄹ') + J.join('ㅇ', v, '');

      case 'bieup': {
        // ㅂ -> 우 and the ending is ALWAYS 어: 아름답다 -> 아름다워요.
        // Two words ride the older 오 + 아 pattern instead: 도와요, 고와요.
        const og = (stem === '돕' || stem === '곱');
        const base = J.withLast(stem, p.cho, p.jung, '') + J.join('ㅇ', og ? 'ㅗ' : 'ㅜ', '');
        const bp = J.lastPart(base);
        return J.withLast(base, bp.cho, contract(bp.jung, og ? 'ㅏ' : 'ㅓ'), '');
      }

      case 'reu': {
        // 르 -> ㄹㄹ: 모르다 -> 몰라
        const head = stem.slice(0, -1);
        return J.addJong(head, 'ㄹ') + J.join('ㄹ', v, '');
      }

      default: {
        if (p.jong) return stem + J.join('ㅇ', v, '');              // 먹 -> 먹어
        const merged = contract(p.jung, v);
        if (!merged) return stem + J.join('ㅇ', v, '');             // 쉬 -> 쉬어
        return J.withLast(stem, p.cho, merged, '');                 // 가 -> 가, 오 -> 와
      }
    }
  }

  /* past is the contracted stem with ㅆ closing its last syllable */
  const pastStem = (k) => J.addJong(presentStem(k), 'ㅆ');

  /* ---- endings that depend on whether the stem ends in a consonant ---- */

  /* the ㅂ/ㄹ of these endings goes INSIDE the last syllable */
  const withB = (s) => J.addJong(s, 'ㅂ') + '니다';
  const withR = (s) => J.addJong(s, 'ㄹ') + '까요?';

  function formal(k) {
    const p = J.lastPart(k.stem);
    if (!p) return withB(k.stem);
    if (k.kind === 'rieul') return withB(J.dropJong(k.stem));          // 살다 -> 삽니다
    if (!p.jong) return withB(k.stem);                                 // 가다 -> 갑니다
    /* ㅂ-irregular does NOT apply here: the textbook writes 춥습니다, 덥습니다,
       반갑습니다 — never 추웁니다. -습니다 starts with a consonant. */
    return k.stem + '습니다';                                          // 먹다 -> 먹습니다
  }
  const formalQ = (k) => formal(k).replace(/니다$/, '니까?');

  /* -(으)X: 으 survives for ㅅ/ㄷ (the consonant left a gap) but not for ㅂ/ㅎ */
  function euX(k, tail) {
    const p = J.lastPart(k.stem);
    if (!p) return k.stem + tail;
    if (!p.jong) return k.stem + tail;                                 // 가다 -> 가세요
    switch (k.kind) {
      case 'rieul': return J.dropJong(k.stem) + tail;                  // 살다 -> 사세요
      case 'bieup': {
        const b = J.withLast(k.stem, p.cho, p.jung, '') + J.join('ㅇ', 'ㅜ', '');
        return b + tail;                                               // 덥다 -> 더우세요
      }
      case 'digeut':                                                     // 듣다 -> 들으세요
        return J.withLast(k.stem, p.cho, p.jung, 'ㄹ') + '으' + tail;
      case 'siot':                                                       // 낫다 -> 나으세요
        return J.dropJong(k.stem) + '으' + tail;
      case 'hieut':                                                      // 그렇다 -> 그러세요
        return J.dropJong(k.stem) + tail;
      default:
        return k.stem + '으' + tail;                                   // 먹다 -> 먹으세요
    }
  }
  const sieyo = (k) => euX(k, '세요');
  const sipsio = (k) => euX(k, '십시오');

  function lkka(k) {
    const p = J.lastPart(k.stem);
    if (!p) return withR(k.stem);
    if (!p.jong) return withR(k.stem);                                 // 가다 -> 갈까요?
    switch (k.kind) {
      case 'rieul': return k.stem + '까요?';                           // 살다 -> 살까요?
      case 'bieup': {
        /* this ending does start with a vowel (으), so the ㅂ does become 우 */
        const b = J.withLast(k.stem, p.cho, p.jung, '') + J.join('ㅇ', 'ㅜ', '');
        return withR(b);                                               // 덥다 -> 더울까요?
      }
      case 'digeut':                                                     // 듣다 -> 들을까요?
        return J.withLast(k.stem, p.cho, p.jung, 'ㄹ') + '을까요?';
      case 'siot':                                                       // 낫다 -> 나을까요?
        return J.dropJong(k.stem) + '을까요?';
      case 'hieut':                                                      // 그렇다 -> 그럴까요?
        return withR(J.dropJong(k.stem));
      default:
        return k.stem + '을까요?';                                     // 먹다 -> 먹을까요?
    }
  }

  const FORMS = [
    { id: 'formal',     label: '-ㅂ니다 / -습니다',      zh: '正式敬语 · 陈述',  build: formal },
    { id: 'formalq',    label: '-ㅂ니까? / -습니까?',    zh: '正式敬语 · 疑问',  build: formalQ },
    { id: 'polite',     label: '-아요 / -어요',          zh: '非正式敬语 · 现在', build: (k) => presentStem(k) + '요' },
    { id: 'pastpolite', label: '-았어요 / -었어요',      zh: '非正式敬语 · 过去', build: (k) => pastStem(k) + '어요' },
    { id: 'pastformal', label: '-았습니다 / -었습니다',  zh: '正式敬语 · 过去',  build: (k) => pastStem(k) + '습니다' },
    { id: 'sieyo',      label: '-(으)세요',              zh: '请求（动词）',      verbOnly: true, build: sieyo },
    { id: 'sipsio',     label: '-(으)십시오',            zh: '正式请求（动词）',  verbOnly: true, build: sipsio },
    { id: 'lkka',       label: '-(으)ㄹ까요?',           zh: '提议 / 征询',       build: lkka },
    { id: 'neg',        label: '-지 않아요',             zh: '否定',              build: (k) => k.stem + '지 않아요' },
    { id: 'gosp',       label: '-고 싶어요',             zh: '想做…（动词）',     verbOnly: true, build: (k) => k.stem + '고 싶어요' },
  ];

  function canConjugate(word) {
    return typeof word === 'string' && word.length > 1 && /다$/.test(word);
  }

  function conjugate(word) {
    if (!canConjugate(word)) return null;
    const k = analyse(word);
    const over = OVERRIDE[word] || null;
    const forms = [];
    for (const f of FORMS) {
      let text = over ? over[f.id] : null;
      if (!text) {
        try { text = f.build(k); } catch (e) { text = null; }
      }
      if (!text || text === word) continue;
      forms.push({ id: f.id, label: f.label, zh: f.zh, text, verbOnly: !!f.verbOnly });
    }
    return { word, stem: k.stem, irregular: k.irregular, forms };
  }

  YK.conj = { conjugate, canConjugate, analyse, contract };
})();
