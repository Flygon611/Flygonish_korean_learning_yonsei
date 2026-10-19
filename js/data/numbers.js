/* Two numeral systems, side by side.
 *
 * 延世韩国语1 第3课第2节 introduces both and warns that some numbers are read
 * differently. The trap is not the numbers themselves but what happens in front
 * of a counter: 하나 becomes 한, 둘 becomes 두, 셋 becomes 세, 넷 becomes 네.
 */
(function () {
  window.YK_NUMBERS = {
    lesson: 3,
    section: 2,
    title: '두 가지 수사 · 两套数词',
    note: '同一个数字有两套说法。汉字数词用于钱、日期、分钟、楼层；固有数词用于个数、人数、年龄、点钟。',

    /* 1-10, then the tens that have their own word */
    sino: [
      ['1', '일', 'il'], ['2', '이', 'i'], ['3', '삼', 'sam'], ['4', '사', 'sa'],
      ['5', '오', 'o'], ['6', '육', 'yuk'], ['7', '칠', 'chil'], ['8', '팔', 'pal'],
      ['9', '구', 'gu'], ['10', '십', 'sip'],
      ['20', '이십', 'isip'], ['30', '삼십', 'samsip'], ['40', '사십', 'sasip'],
      ['50', '오십', 'osip'], ['60', '육십', 'yuksip'], ['70', '칠십', 'chilsip'],
      ['80', '팔십', 'palsip'], ['90', '구십', 'gusip'], ['100', '백', 'baek'],
    ],
    native: [
      ['1', '하나', 'hana'], ['2', '둘', 'dul'], ['3', '셋', 'set'], ['4', '넷', 'net'],
      ['5', '다섯', 'daseot'], ['6', '여섯', 'yeoseot'], ['7', '일곱', 'ilgop'],
      ['8', '여덟', 'yeodeol'], ['9', '아홉', 'ahop'], ['10', '열', 'yeol'],
      ['20', '스물', 'seumul'], ['30', '서른', 'seoreun'], ['40', '마흔', 'maheun'],
      ['50', '쉰', 'swin'], ['60', '예순', 'yesun'], ['70', '일흔', 'ilheun'],
      ['80', '여든', 'yeodeun'], ['90', '아흔', 'aheun'], ['100', '온', 'on'],
    ],

    /* the reading that actually changes in front of a counter */
    beforeCounter: [
      ['하나 → 한', '한 개', '一个'],
      ['둘 → 두', '두 명', '两个人'],
      ['셋 → 세', '세 시', '三点'],
      ['넷 → 네', '네 살', '四岁'],
      ['스물 → 스무', '스무 개', '二十个'],
    ],

    /* 21 and up: there is no single word for "twenty-one". You glue the tens
       word to the ones word, and in front of a counter only the LAST digit
       changes. This is the part the table above leaves out. */
    combine: {
      note: '固有数词没有「二十几」这样的单词，就是「十位 + 个位」连写。量词前的变音只看最后一位。',
      stuck: '20 单独用时会变成 스무（스무 개 / 스무 살），但 21 以上变回 스물（스물한 개）。',
      rows: [
        ['11', '열하나', '열한 명', '11 人'],
        ['12', '열둘', '열두 명', '12 人'],
        ['19', '열아홉', '열아홉 명', '19 人'],
        ['20', '스물', '스무 개', '20 个'],
        ['21', '스물하나', '스물한 개', '21 个'],
        ['22', '스물둘', '스물두 명', '22 人'],
        ['23', '스물셋', '스물세 개', '23 个'],
        ['24', '스물넷', '스물네 살', '24 岁'],
        ['25', '스물다섯', '스물다섯 개', '25 个'],
        ['31', '서른하나', '서른한 개', '31 个'],
        ['42', '마흔둘', '마흔두 살', '42 岁'],
        ['99', '아흔아홉', '아흔아홉 개', '99 个'],
      ],
    },

    usedWith: {
      sino: ['원（钱）', '월·일（月·日）', '분·초（分·秒）', '층（层）', '번（号）', '호선（号线）', '以上 100 全部用汉字数词'],
      native: ['개（个）', '명·사람（人）', '마리（只）', '살（岁）', '시（点）', '시간（小时）', '권（本）', '잔（杯）'],
    },
  };
})();
