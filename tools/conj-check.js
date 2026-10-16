/* Conjugation reference check.

   Korean has no room for "close enough": 덥어요 is simply wrong, and shipping
   it would teach the wrong thing. So every rule in js/core/conj.js is checked
   here against spellings taken from 延世韩国语 1 and its grammar notes.

   Run:  node tools/conj-check.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) { ({ JSDOM } = require('/tmp/yktest/node_modules/jsdom')); }

const dom = new JSDOM('<!doctype html><html><body></body></html>',
  { url: 'http://localhost/', runScripts: 'dangerously' });
const { window } = dom;
for (const src of ['js/core/jamo.js', 'js/core/conj.js']) {
  window.eval(fs.readFileSync(path.join(ROOT, src), 'utf8') + '\n//# sourceURL=' + src);
}
const { conj } = window.YK;

/* id -> expected spelling. Any id left out is simply not checked for that word. */
const REFERENCE = {
  '가다':      { formal: '갑니다', formalq: '갑니까?', polite: '가요', pastpolite: '갔어요',
                 pastformal: '갔습니다', sieyo: '가세요', sipsio: '가십시오', lkka: '갈까요?',
                 neg: '가지 않아요', gosp: '가고 싶어요' },
  '먹다':      { formal: '먹습니다', formalq: '먹습니까?', polite: '먹어요', pastpolite: '먹었어요',
                 pastformal: '먹었습니다', sieyo: '먹으세요', sipsio: '먹으십시오', lkka: '먹을까요?',
                 neg: '먹지 않아요', gosp: '먹고 싶어요' },
  '살다':      { formal: '삽니다', formalq: '삽니까?', polite: '살아요', pastpolite: '살았어요',
                 pastformal: '살았습니다', sieyo: '사세요', sipsio: '사십시오', lkka: '살까요?' },
  '알다':      { formal: '압니다', polite: '알아요', pastpolite: '알았어요', sieyo: '아세요', lkka: '알까요?' },
  '만들다':    { formal: '만듭니다', polite: '만들어요', pastpolite: '만들었어요' },
  '하다':      { formal: '합니다', formalq: '합니까?', polite: '해요', pastpolite: '했어요',
                 pastformal: '했습니다', sieyo: '하세요', sipsio: '하십시오', lkka: '할까요?',
                 neg: '하지 않아요', gosp: '하고 싶어요' },
  '공부하다':  { formal: '공부합니다', polite: '공부해요', pastpolite: '공부했어요',
                 sieyo: '공부하세요', lkka: '공부할까요?' },
  '좋아하다':  { formal: '좋아합니다', polite: '좋아해요', pastpolite: '좋아했어요' },
  '좋다':      { formal: '좋습니다', polite: '좋아요', pastpolite: '좋았어요', lkka: '좋을까요?',
                 neg: '좋지 않아요' },
  '많다':      { formal: '많습니다', polite: '많아요', pastpolite: '많았어요' },
  '있다':      { formal: '있습니다', polite: '있어요', pastpolite: '있었어요', sieyo: '있으세요',
                 lkka: '있을까요?' },
  '없다':      { formal: '없습니다', polite: '없어요', pastpolite: '없었어요' },
  '맛있다':    { formal: '맛있습니다', polite: '맛있어요', pastpolite: '맛있었어요' },

  /* ㅂ irregular */
  '덥다':      { formal: '덥습니다', polite: '더워요', pastpolite: '더웠어요', lkka: '더울까요?',
                 neg: '덥지 않아요' },
  '춥다':      { formal: '춥습니다', polite: '추워요', pastpolite: '추웠어요' },
  '맵다':      { formal: '맵습니다', polite: '매워요', pastpolite: '매웠어요' },
  '어렵다':    { formal: '어렵습니다', polite: '어려워요', pastpolite: '어려웠어요', lkka: '어려울까요?' },
  '쉽다':      { formal: '쉽습니다', polite: '쉬워요', pastpolite: '쉬웠어요' },
  '아름답다':  { formal: '아름답습니다', polite: '아름다워요', pastpolite: '아름다웠어요' },
  '가깝다':    { formal: '가깝습니다', polite: '가까워요', pastpolite: '가까웠어요' },
  '반갑다':    { formal: '반갑습니다', polite: '반가워요', pastpolite: '반가웠어요' },
  '돕다':      { formal: '돕습니다', polite: '도와요', pastpolite: '도왔어요' },
  '무겁다':    { formal: '무겁습니다', polite: '무거워요', pastpolite: '무거웠어요' },
  '가볍다':    { formal: '가볍습니다', polite: '가벼워요', pastpolite: '가벼웠어요' },

  /* ㄷ irregular */
  '듣다':      { formal: '듣습니다', polite: '들어요', pastpolite: '들었어요', sieyo: '들으세요',
                 lkka: '들을까요?' },
  '걷다':      { formal: '걷습니다', polite: '걸어요', pastpolite: '걸었어요' },
  /* 묻다 "to ask" is regular; the ㄷ-irregular 묻다 means "to bury" */
  '묻다':      { formal: '묻습니다', polite: '묻어요', pastpolite: '묻었어요' },
  '싣다':      { formal: '싣습니다', polite: '실어요', pastpolite: '실었어요' },
  '깨닫다':    { polite: '깨달아요', pastpolite: '깨달았어요' },

  /* ㅅ irregular */
  '낫다':      { formal: '낫습니다', polite: '나아요', pastpolite: '나았어요', sieyo: '나으세요',
                 lkka: '나을까요?' },
  '짓다':      { formal: '짓습니다', polite: '지어요', pastpolite: '지었어요' },
  '붓다':      { formal: '붓습니다', polite: '부어요', pastpolite: '부었어요' },
  '잇다':      { formal: '잇습니다', polite: '이어요', pastpolite: '이었어요' },

  /* 르 irregular */
  '모르다':    { formal: '모릅니다', polite: '몰라요', pastpolite: '몰랐어요', sieyo: '모르세요',
                 lkka: '모를까요?' },
  '빠르다':    { formal: '빠릅니다', polite: '빨라요', pastpolite: '빨랐어요' },
  '부르다':    { formal: '부릅니다', polite: '불러요', pastpolite: '불렀어요' },
  '고르다':    { formal: '고릅니다', polite: '골라요', pastpolite: '골랐어요' },
  '흐르다':    { formal: '흐릅니다', polite: '흘러요', pastpolite: '흘렀어요' },

  /* 으 irregular */
  '쓰다':      { formal: '씁니다', polite: '써요', pastpolite: '썼어요', sieyo: '쓰세요',
                 lkka: '쓸까요?' },
  '크다':      { formal: '큽니다', polite: '커요', pastpolite: '컸어요' },
  '바쁘다':    { formal: '바쁩니다', polite: '바빠요', pastpolite: '바빴어요' },
  '예쁘다':    { formal: '예쁩니다', polite: '예뻐요', pastpolite: '예뻤어요' },
  '슬프다':    { formal: '슬픕니다', polite: '슬퍼요', pastpolite: '슬펐어요' },

  /* ㅎ irregular */
  '그렇다':    { formal: '그렇습니다', polite: '그래요', pastpolite: '그랬어요', sieyo: '그러세요',
                 lkka: '그럴까요?' },
  '파랗다':    { formal: '파랗습니다', polite: '파래요', pastpolite: '파랬어요' },
  '어떻다':    { formal: '어떻습니다', polite: '어때요', pastpolite: '어땠어요' },
  '빨갛다':    { formal: '빨갛습니다', polite: '빨개요', pastpolite: '빨갰어요' },

  /* regular vowel-final stems, and the everyday verbs */
  '오다':      { formal: '옵니다', polite: '와요', pastpolite: '왔어요', sieyo: '오세요', lkka: '올까요?' },
  '보다':      { formal: '봅니다', polite: '봐요', pastpolite: '봤어요' },
  '배우다':    { formal: '배웁니다', polite: '배워요', pastpolite: '배웠어요' },
  '마시다':    { formal: '마십니다', polite: '마셔요', pastpolite: '마셨어요', sieyo: '마시세요',
                 lkka: '마실까요?' },
  '기다리다':  { formal: '기다립니다', polite: '기다려요', pastpolite: '기다렸어요' },
  '만나다':    { formal: '만납니다', polite: '만나요', pastpolite: '만났어요', sieyo: '만나세요',
                 lkka: '만날까요?' },
  '사다':      { formal: '삽니다', polite: '사요', pastpolite: '샀어요', lkka: '살까요?' },
  '자다':      { formal: '잡니다', polite: '자요', pastpolite: '잤어요' },
  '가르치다':  { formal: '가르칩니다', polite: '가르쳐요', pastpolite: '가르쳤어요' },
  '일어나다':  { formal: '일어납니다', polite: '일어나요', pastpolite: '일어났어요' },
  '읽다':      { formal: '읽습니다', polite: '읽어요', pastpolite: '읽었어요', sieyo: '읽으세요' },
  '입다':      { formal: '입습니다', polite: '입어요', pastpolite: '입었어요' },
  '잡다':      { formal: '잡습니다', polite: '잡아요', pastpolite: '잡았어요' },
  '좁다':      { formal: '좁습니다', polite: '좁아요', pastpolite: '좁았어요' },
  '받다':      { formal: '받습니다', polite: '받아요', pastpolite: '받았어요' },
  '웃다':      { formal: '웃습니다', polite: '웃어요', pastpolite: '웃었어요' },
  '쉬다':      { formal: '쉽니다', polite: '쉬어요', pastpolite: '쉬었어요' },
  '주다':      { formal: '줍니다', polite: '줘요', pastpolite: '줬어요' },
  '이다':      { formal: '입니다', formalq: '입니까?', polite: '이에요', pastpolite: '이었어요' },
  '아니다':    { formal: '아닙니다', polite: '아니에요' },
};

let pass = 0, fail = 0;
const misses = [];

for (const [word, expected] of Object.entries(REFERENCE)) {
  const got = conj.conjugate(word);
  if (!got) { fail++; misses.push(`${word}: 无法变形`); continue; }
  const byId = {};
  for (const f of got.forms) byId[f.id] = f.text;
  for (const [id, want] of Object.entries(expected)) {
    if (byId[id] === want) { pass++; }
    else { fail++; misses.push(`${word} ${id}: 期望 ${want}，实际 ${byId[id] || '(缺失)'}`); }
  }
  // nothing should ever come out empty or containing a raw jamo
  for (const f of got.forms) {
    if (!f.text || /[\u1100-\u11ff\u3130-\u318f]/.test(f.text)) {
      fail++; misses.push(`${word} ${f.id}: 生成了残缺结果 ${JSON.stringify(f.text)}`);
    }
  }
}

console.log(`词形参考检查：${pass} 通过，${fail} 失败`);
if (misses.length) {
  console.log('\n不一致：');
  for (const m of misses) console.log('  ✗ ' + m);
}
process.exit(fail ? 1 : 0);
