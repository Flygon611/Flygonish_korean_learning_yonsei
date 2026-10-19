#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the self-hosted webfonts.

Four families, all SIL OFL, all subset to the characters this site actually
contains so the files stay small:

    pretendard-*      Hangul + Latin, interface face (was noto-kr-sans)
    noto-kr-serif-*   Hangul, reading/headline face (본문·이름)
    noto-sc-sans-*    Chinese, interface face
    noto-sc-serif-*   Chinese, headline face

Anything outside the subset (for example a word typed into the search box)
falls back to the system font, which the CSS stacks list first.

Requires fontTools. Sources are the noto-cjk SubsetOTF releases, downloaded by
tools/fetch_fonts.sh into /tmp. Run from the project root:

    /tmp/fontenv/bin/python tools/build_fonts.py
"""
import os, subprocess, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.environ.get('YK_FONT_SRC', '/tmp')
OUT = os.path.join(ROOT, 'assets', 'fonts')

# (family, noto-family-suffix, [(weight, file suffix)])
PLAN = [
    ('kr-sans',  'SansKR',  [('400', 'Regular'), ('500', 'Medium'), ('700', 'Bold')]),
    ('sc-sans',  'SansSC',  [('400', 'Regular'), ('500', 'Medium'), ('700', 'Bold')]),
    ('kr-serif', 'SerifKR', [('400', 'Regular'), ('700', 'Bold')]),
    ('sc-serif', 'SerifSC', [('400', 'Regular'), ('700', 'Bold')]),
]

# Pretendard replaces Noto Sans KR for the interface face: same OFL licence,
# but a geometric grotesque much closer to the HarmonyOS Sans look. It is
# subset with Hangul AND Latin, so digits and Latin punctuation are drawn by
# the same face and the line does not shift at the boundary.
PRETENDARD = [('400', 'Regular'), ('500', 'Medium'), ('700', 'Bold')]

EXTRA = (
    '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
    '“”‘’「」『』（）《》〈〉【】〔〕—–…·※→←↑↓↔★☆✓✗○●◇◆■□▲▼·'
    '①②③④⑤⑥⑦⑧⑨⑩⑪⑫'
    '０１２３４５６７８９'
    '。、，；：？！‥'
    '₩¥$€£'
)

HANGUL_EXTRA = (
    '안녕하세요감사합니다죄송합니다괜찮아요반갑습니다처음뵙겠습니다실례합니다'
    '네아니요맞아요틀렸어요정답문제연습문법단어발음읽기쓰기듣기말하기'
    '시험숙제수업교실선생님학생친구가족부모님아버지어머니동생언니오빠'
    '형누나할머니할아버지아들딸아이어른사람이름나이직업주소번호시간약속'
    '아침점심저녁밤오늘내일어제지금요즘주말월요일화요일수요일목요일금요일토요일일요일'
    '봄여름가을겨울날씨비눈바람하늘구름춥다덥다따뜻하다시원하다'
    '음식밥국과일채소고기생선물커피차술빵케이크맛있다맵다짜다달다쓰다'
    '학교회사은행도서관식당가게시장병원역공항지하철버스택시기차비행기자전거'
    '전화휴대폰인터넷컴퓨터영화음악노래사진운동여행휴일방학생일'
    '사다팔다주다받다만나다먹다마시다자다일어나다공부하다일하다쉬다놀다'
    '읽다쓰다듣다말하다배우다가르치다알다모르다좋아하다싫어하다살다있다없다'
    '크다작다많다적다좋다나쁘다예쁘다아름답다어렵다쉽다비싸다싸다'
    '하다되다이다아니다그렇다어떻다이렇다저렇다'
    '가나다라마바사아자차카타파하'
)

CJK_EXTRA = (
    '的一是不了在人有我他这中大来上国个到说们为子和你地出道也时年得就那要下以生会自着去之过家学对能而如然没日于起还发成事只作当想看文无开手十用主'
    '行方又如前所本见经头面公同三已老从动两长知民样现分将外但身些与高意进把法此实回二理美点月明其种声全工己话儿者向情部正名定女问力机给等几很业'
    '最间新什打便位因重被走电四第门相次东政海口使教西再平真听世气信北少关并内数您呢'
    '延世韩语学习台字母发音课文单词法练习查词人物登场首页音变规则素材与出处'
    '单元双辅紧收代连鼻送气化流口盖弱脱不规则活用动词语尾助宾格主话题'
)

def used_chars():
    chars = set()
    for pat in ('*.html', 'css/*.css', 'js/*.js', 'js/*/*.js', 'README.md'):
        for f in glob.glob(os.path.join(ROOT, pat)):
            chars |= set(open(f, encoding='utf-8').read())
    chars |= set(EXTRA) | set(HANGUL_EXTRA) | set(CJK_EXTRA)
    return {c for c in chars if c.strip() and ord(c) > 31}

def subset(src, dst, text):
    subprocess.run([sys.executable, '-m', 'fontTools.subset', src,
                    '--text=' + text,
                    '--layout-features=*',
                    '--flavor=woff',
                    '--no-hinting',
                    '--desubroutinize',
                    '--output-file=' + dst], check=True, capture_output=True)

def main():
    os.makedirs(OUT, exist_ok=True)
    chars = used_chars()
    hangul = ''.join(sorted(c for c in chars
                            if '\uac00' <= c <= '\ud7a3' or '\u1100' <= c <= '\u11ff'
                            or '\u3130' <= c <= '\u318f'))
    cjk = ''.join(sorted(c for c in chars if '\u4e00' <= c <= '\u9fff'
                         or '\u3400' <= c <= '\u4dbf'))
    print(f'characters used: {len(chars)}   hangul: {len(hangul)}   cjk: {len(cjk)}')

    total = 0
    # Pretendard: Hangul + Latin + the shared symbol set
    latin = ''.join(sorted(c for c in chars if ord(c) < 0x2500 and c.strip()))
    pd_text = ''.join(dict.fromkeys(hangul + latin + EXTRA))
    for weight, suffix in PRETENDARD:
        src = os.path.join(SRC, 'Pretendard-%s.otf' % suffix)
        if not os.path.exists(src):
            print('  ! missing %s' % src); continue
        dst = os.path.join(OUT, 'pretendard-%s.woff' % weight)
        subset(src, dst, pd_text)
        kb = os.path.getsize(dst) // 1024
        total += kb
        print('  pretendard-%s.woff  %s KB' % (weight, kb))

    for name, family, weights in PLAN:
        text = hangul if name.startswith('kr') else cjk
        if not text:
            print(f'  ! no characters for {name}'); continue
        for weight, suffix in weights:
            src = os.path.join(SRC, f'Noto{family}-{suffix}.otf')
            if not os.path.exists(src):
                print(f'  ! missing {src}'); continue
            dst = os.path.join(OUT, f'noto-{name}-{weight}.woff')
            subset(src, dst, text)
            kb = os.path.getsize(dst) // 1024
            total += kb
            print(f'  noto-{name}-{weight}.woff  {kb} KB')
    print(f'total {total} KB')

if __name__ == '__main__':
    main()
