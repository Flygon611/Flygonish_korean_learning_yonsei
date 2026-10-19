#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Hand-drawn Korean dishes in OpenMoji's visual language.

OpenMoji has one generic soup pot, so 김치찌개 / 된장찌개 / 순두부찌개 / 삼계탕 /
갈비탕 all come out as the same picture. Those differences are the vocabulary,
so they are drawn here: same 72x72 grid, same flat fills plus 2px black
outline with round joins, so the set sits next to the OpenMoji ones without
looking foreign.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'picto')

K = '#000'
W = 2
WHITE = '#ffffff'
CREAM = '#fdf0d5'
RED = '#d22f27'
KIMCHI = '#e2603a'
BEAN = '#a9773f'
BROTH = '#eef0e6'
PORK = '#f3a3a3'
FAT = '#fff3ec'
GREEN = '#5aa02c'
YELLOW = '#f1b31c'
EGG = '#fff6d8'
BROWN = '#8b5a2b'
RICE = '#ffffff'


def svg(body):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="72" height="72">'
            + body + '</svg>')


def bowl(surface, rim=WHITE):
    """A bowl from the side: body, then the soup surface across the top."""
    body = ('<path d="M13 30 a23 15 0 0 0 46 0 z" fill="%s" stroke="%s" stroke-width="%d" '
            'stroke-linejoin="round"/>' % (rim, K, W))
    top = ('<ellipse cx="36" cy="30" rx="23" ry="6.4" fill="%s" stroke="%s" stroke-width="%d"/>'
           % (surface, K, W))
    return body + top


def chunk(x, y, w, h, fill, rot=0):
    return ('<rect x="%s" y="%s" width="%s" height="%s" rx="1.6" fill="%s" stroke="%s" '
            'stroke-width="1.4" transform="rotate(%d %.1f %.1f)"/>'
            % (x - w / 2, y - h / 2, w, h, fill, K, rot, x, y))


def kimchi_jjigae():
    s = bowl(KIMCHI)
    s += chunk(27, 27, 9, 5, RED, -12)
    s += chunk(40, 26, 10, 5, RED, 8)
    s += chunk(33, 31, 11, 4.5, RED, -4)
    s += ('<path d="M22 29 q6 -3 11 -1" fill="none" stroke="%s" stroke-width="2" '
          'stroke-linecap="round"/>' % GREEN)
    return svg(s)


def doenjang_jjigae():
    s = bowl(BEAN)
    s += chunk(27, 27, 7, 7, WHITE)
    s += chunk(40, 26, 7, 7, WHITE, 10)
    s += chunk(34, 32, 7, 7, WHITE, -6)
    s += ('<path d="M24 30 q5 -2 9 0" fill="none" stroke="%s" stroke-width="1.8" '
          'stroke-linecap="round"/>' % GREEN)
    return svg(s)


def sundubu_jjigae():
    s = bowl(KIMCHI)
    # soft tofu: rounded blobs, not cubes
    s += ('<path d="M26 26 q5 -3 8 1 q1 4 -4 4 q-5 0 -4 -5 z" fill="%s" stroke="%s" '
          'stroke-width="1.4"/>' % (CREAM, K))
    s += ('<path d="M38 27 q5 -3 8 1 q1 4 -4 4 q-5 0 -4 -5 z" fill="%s" stroke="%s" '
          'stroke-width="1.4"/>' % (WHITE, K))
    s += ('<path d="M31 32 q6 -2 9 1 q0 4 -5 3 q-5 -1 -4 -4 z" fill="%s" stroke="%s" '
          'stroke-width="1.4"/>' % (CREAM, K))
    return svg(s)


def samgyetang():
    s = bowl('#f3e6c4')
    # a small whole chicken
    s += ('<ellipse cx="36" cy="28" rx="11" ry="7" fill="#fff" stroke="%s" stroke-width="%d"/>'
          % (K, W))
    s += '<path d="M31 30 q5 3 10 0" fill="none" stroke="%s" stroke-width="1.6"/>' % K
    # ginseng
    s += ('<path d="M24 26 q-3 4 1 6 M48 26 q3 4 -1 6" fill="none" stroke="%s" '
          'stroke-width="2" stroke-linecap="round"/>' % BROWN)
    return svg(s)


def galbitang():
    s = bowl('#f6ead2')
    # ribs sticking out
    for dx in (-7, 0, 7):
        s += ('<path d="M%d 30 q0 -9 2 -12" fill="none" stroke="%s" stroke-width="3.2" '
              'stroke-linecap="round"/>' % (36 + dx, BROWN))
    s += ('<ellipse cx="36" cy="29" rx="10" ry="4.6" fill="%s" stroke="%s" stroke-width="1.4"/>'
          % ('#f3e0c0', K))
    return svg(s)


def tteokbokki():
    s = bowl('#c8352b')
    # rice cakes: white cylinders
    for x, y, r in ((29, 27, -14), (36, 25, 4), (43, 27, 16), (32, 32, -6), (41, 32, 8)):
        s += chunk(x, y, 9, 4.6, WHITE, r)
    s += ('<path d="M23 30 q6 -2 10 0" fill="none" stroke="%s" stroke-width="1.8" '
          'stroke-linecap="round"/>' % GREEN)
    return svg(s)


def naengmyeon():
    s = bowl('#e6d3a3')
    # noodles
    for i in range(5):
        s += ('<path d="M%d 27 q3 3 0 6" fill="none" stroke="%s" stroke-width="1.2" '
              'stroke-linecap="round"/>' % (26 + i * 4, '#d8c48f'))
    # half egg
    s += ('<path d="M44 24 a5 5 0 0 1 0 10 z" fill="%s" stroke="%s" stroke-width="1.4"/>'
          % (WHITE, K))
    s += ('<circle cx="46.5" cy="29" r="2.4" fill="%s" stroke="%s" stroke-width="1.1"/>'
          % (YELLOW, K))
    return svg(s)


def gimbap():
    """Three slices seen from above — the classic 김밥 picture."""
    s = ''
    for cx, cy in ((24, 30), (40, 26), (34, 40)):
        s += ('<circle cx="%d" cy="%d" r="11" fill="#2f2a26" stroke="%s" stroke-width="%d"/>'
              % (cx, cy, K, W))
        s += '<circle cx="%d" cy="%d" r="8.4" fill="%s"/>' % (cx, cy, RICE)
        s += '<circle cx="%d" cy="%d" r="3.4" fill="%s"/>' % (cx, cy, GREEN)
        s += '<circle cx="%d" cy="%d" r="1.6" fill="%s"/>' % (cx, cy, '#e2603a')
    return svg(s)


def samgyeopsal():
    """Strips of pork on a grill."""
    s = ('<rect x="10" y="20" width="52" height="34" rx="5" fill="#4a4a4a" stroke="%s" '
         'stroke-width="%d"/>' % (K, W))
    for i, y in enumerate((26, 32, 38, 44)):
        s += ('<rect x="15" y="%d" width="42" height="4.6" rx="2.2" fill="%s" stroke="%s" '
              'stroke-width="1.2"/>' % (y, PORK, K))
        s += ('<path d="M17 %d H55" stroke="%s" stroke-width="1" opacity=".8"/>'
              % (y + 2.3, FAT))
    return svg(s)


DISHES = [
    ('김치찌개', 'dish-kimchi-jjigae', kimchi_jjigae()),
    ('된장찌개', 'dish-doenjang-jjigae', doenjang_jjigae()),
    ('순두부찌개', 'dish-sundubu-jjigae', sundubu_jjigae()),
    ('삼계탕', 'dish-samgyetang', samgyetang()),
    ('갈비탕', 'dish-galbitang', galbitang()),
    ('떡볶이', 'dish-tteokbokki', tteokbokki()),
    ('냉면', 'dish-naengmyeon', naengmyeon()),
    ('김밥', 'dish-gimbap', gimbap()),
    ('삼겹살', 'dish-samgyeopsal', samgyeopsal()),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    for ko, stem, svg_text in DISHES:
        open(os.path.join(OUT, stem + '.svg'), 'w', encoding='utf-8').write(svg_text)
    print('dished drawn:', len(DISHES))


if __name__ == '__main__':
    main()
