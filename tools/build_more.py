#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""More pictograms, hand-drawn to match OpenMoji.

Same grid and same vocabulary of shapes as OpenMoji — 72x72, flat fill, 2px
black outline with round joins — so the drawn ones and the downloaded ones can
sit side by side without one looking like a placeholder.

Three groups: things in a classroom, people in the family, and the abstract
vocabulary that only a diagram can carry (academic subjects, tastes, verbs).
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'picto')
K, W = '#000', 2
WHITE = '#ffffff'
CREAM = '#fdf0d5'
BLUE = '#5b8dd6'
DARK = '#3f4a5a'
GREEN = '#2f6f3e'
CHALK = '#f4f4ee'
WOOD = '#c99b62'
RED = '#d22f27'
YELLOW = '#f1b31c'
ORANGE = '#e2603a'
PINK = '#f5a3a3'
BROWN = '#8b5a2b'
GREY = '#cfd6e4'


def svg(body):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="72" height="72">'
            + body + '</svg>')


def line(d, w=W, cap='round'):
    return ('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="%s" '
            'stroke-linejoin="round"/>' % (d, K, w, cap))


def shape(d, fill, w=W):
    return ('<path d="%s" fill="%s" stroke="%s" stroke-width="%s" stroke-linejoin="round"/>'
            % (d, fill, K, w))


# ------------------------------------------------------------- classroom
def blackboard():
    return svg(shape('M10 16 h52 v34 h-52 z', GREEN)
               + line('M10 16 h52', 3)
               + line('M18 28 h18 M18 35 h12 M48 28 h8 M48 35 h12', 2)
               + shape('M10 50 h52 v6 h-52 z', WOOD))


def chalk():
    return svg(shape('M22 26 h26 l4 22 h-34 z', WHITE)
               + line('M24 34 h22', 1.6)
               + line('M26 41 h18', 1.6)
               + shape('M18 50 h36 v5 h-36 z', GREEN))


def desk():
    return svg(shape('M8 30 h56 v8 h-56 z', WOOD)
               + shape('M13 38 h5 v22 h-5 z', WOOD)
               + shape('M54 38 h5 v22 h-5 z', WOOD)
               + line('M8 30 h56', 2.4))


def reading_book():
    return svg(shape('M12 20 q12 -4 24 2 q12 -6 24 -2 v32 q-12 -4 -24 2 q-12 -6 -24 -2 z', WHITE)
               + line('M36 22 v32', 1.8)
               + line('M18 28 h12 M18 35 h12 M42 28 h12 M42 35 h12', 1.6))


def handkerchief():
    return svg(shape('M14 22 h44 v28 h-44 z', '#f6d6dd')
               + line('M14 22 h44 v28 h-44 z')
               + line('M24 30 l6 6 M34 30 l-6 6', 1.6)
               + line('M18 44 h36', 1.4))


def station():
    return svg(shape('M12 18 h48 v30 h-48 z', BLUE)
               + shape('M18 24 h16 v10 h-16 z', CHALK)
               + shape('M40 24 h14 v8 h-14 z', CHALK)
               + line('M20 48 v10 M52 48 v10', 3)
               + line('M14 58 h44', 3))


# ---------------------------------------------------------------- people
def person(age='adult', extra='', colour=BLUE):
    """A head-and-shoulders figure; the little marks tell the variants apart."""
    body = (f'<circle cx="36" cy="26" r="11" fill="{CREAM}" stroke="{K}" stroke-width="{W}"/>'
            + shape('M20 62 q0 -16 16 -16 t16 16 z', colour))
    if age == 'old':
        body += line('M27 20 q9 -5 18 0', 2)
        body += line('M30 34 q6 3 12 0', 1.6)
    if age == 'young':
        body += line('M32 32 q4 3 8 0', 1.6)
    return svg(body + extra)


def badge(text, cx=55, cy=52, colour=RED):
    return (f'<circle cx="{cx}" cy="{cy}" r="10" fill="{colour}" stroke="{K}" stroke-width="1.6"/>'
            + f'<text x="{cx}" y="{cy + 4.5}" font-size="12" font-weight="700" fill="#fff" '
              f'text-anchor="middle" font-family="-apple-system,sans-serif">{text}</text>')


def gender(symbol, colour):
    head = (f'<circle cx="32" cy="30" r="16" fill="{colour}" stroke="{K}" stroke-width="{W}"/>'
            + f'<text x="32" y="40" font-size="22" font-weight="700" fill="#fff" '
              f'text-anchor="middle" font-family="-apple-system,sans-serif">{symbol}</text>')
    return svg(head + line('M32 46 v14', 3) + line('M22 60 h20', 3))


def me():
    return svg(person().replace('</svg>', '')
               + f'<circle cx="36" cy="26" r="15" fill="none" stroke="{ORANGE}" '
                 f'stroke-width="2.4" stroke-dasharray="4 3"/></svg>')


# ------------------------------------------------------------ subjects
def subject(mark, colour):
    """A book with a subject mark on the cover — one shape, nine subjects."""
    body = shape('M16 18 h34 a6 6 0 0 1 6 6 v34 h-34 a6 6 0 0 1 -6 -6 z', colour)
    body += line('M16 18 h34 a6 6 0 0 1 6 6 v34', 2)
    body += (f'<text x="38" y="46" font-size="20" font-weight="700" fill="#fff" '
             f'text-anchor="middle" font-family="-apple-system,sans-serif">{mark}</text>')
    return svg(body)


# ------------------------------------------------------------- tastes
def chilli():
    return svg(shape('M22 30 q10 -10 24 2 q4 16 -10 24 q-14 2 -16 -12 q-2 -10 2 -14 z', RED)
               + line('M28 24 q4 -8 12 -8', 3)
               + line('M40 26 q6 -2 8 2', 2))


def lemon():
    return svg(f'<circle cx="36" cy="38" r="18" fill="{YELLOW}" stroke="{K}" stroke-width="{W}"/>'
               + line('M36 20 q6 -8 12 -6', 2.4)
               + line('M20 36 q0 12 12 16 M52 36 q0 12 -12 16', 1.6))


def salt():
    return svg(shape('M22 30 h28 v26 h-28 z', GREY)
               + line('M22 30 h28', 2)
               + f'<circle cx="30" cy="24" r="2.2" fill="{WHITE}" stroke="{K}" stroke-width="1.2"/>'
               + f'<circle cx="38" cy="21" r="2.2" fill="{WHITE}" stroke="{K}" stroke-width="1.2"/>'
               + f'<circle cx="44" cy="25" r="2.2" fill="{WHITE}" stroke="{K}" stroke-width="1.2"/>')


def sugar():
    """A wrapped candy: 달다 is sweet, and a cube of sugar read as a box."""
    body = f'<circle cx="36" cy="36" r="15" fill="{PINK}" stroke="{K}" stroke-width="{W}"/>'
    body += line('M22 32 l-8 -5 M22 40 l-8 5 M50 32 l8 -5 M50 40 l8 5', 2)
    body += line('M28 30 q6 6 0 12', 1.6)
    return svg(body)


def bland():
    return svg(shape('M16 34 a20 12 0 0 0 40 0 z', WHITE)
               + line('M16 34 a20 12 0 0 0 40 0')
               + line('M24 28 q12 -6 24 0', 1.6)
               + line('M30 22 q6 -4 12 0', 1.6))


# -------------------------------------------------------------- shops
def shop(colour, dish):
    body = shape('M14 26 h44 v30 h-44 z', WHITE)
    body += shape('M10 26 l4 -10 h44 l4 10 z', colour)
    body += line('M10 26 h52', 2)
    body += shape('M26 40 h20 v16 h-20 z', '#eef1f6')
    body += dish
    return svg(body)


def main():
    os.makedirs(OUT, exist_ok=True)
    made = [
        # classroom
        ('칠판', 'more-blackboard', blackboard()),
        ('분필', 'more-chalk', chalk()),
        ('책상', 'more-desk', desk()),
        ('읽기책', 'more-reading-book', reading_book()),
        ('손수건', 'more-handkerchief', handkerchief()),
        ('역', 'more-station', station()),
        # people
        ('외할아버지', 'more-grandpa-maternal', person('old', badge('外'))),
        ('외할머니', 'more-grandma-maternal', person('old', badge('外'), PINK)),
        ('언니', 'more-older-sister-f', person('young', badge('女', colour=PINK), PINK)),
        ('나', 'more-me', me()),
        ('남', 'more-male', gender('♂', BLUE)),
        ('여', 'more-female', gender('♀', PINK)),
        # subjects
        ('경제학', 'more-econ', subject('₩', '#3f7a3f')),
        ('역사학', 'more-history', subject('史', '#8b6b3a')),
        ('컴퓨터공학', 'more-cs', subject('&lt;/&gt;', '#3a5f8b')),
        ('정치학', 'more-politics', subject('§', '#8b3a3a')),
        ('법학', 'more-law', subject('⚖', '#4a4a6b')),
        ('경영학', 'more-business', subject('▲', '#3a6b5f')),
        ('영문학', 'more-english', subject('A', '#5b5b8b')),
        ('생물학', 'more-biology', subject('✿', '#3f8b4a')),
        ('전공', 'more-major', subject('★', '#6b5b9b')),
        # tastes
        ('맵다', 'more-spicy', chilli()),
        ('달다', 'more-sweet', sugar()),
        ('시다', 'more-sour', lemon()),
        ('짜다', 'more-salty', salt()),
        ('싱겁다', 'more-bland', bland()),
        # shops
        ('한식집', 'more-shop-korean', shop('#c8102e', shape('M28 46 a8 6 0 0 0 16 0 z', WHITE)
                                          + line('M28 46 a8 6 0 0 0 16 0'))),
        ('중국집', 'more-shop-chinese', shop('#f1b31c', line('M30 50 q6 -10 12 0', 2)
                                           + line('M28 44 h16', 2))),
        ('일식집', 'more-shop-japanese', shop('#3a5f8b', shape('M28 46 h16 v6 h-16 z', '#fff')
                                            + line('M36 40 v6'))),
        ('양식집', 'more-shop-western', shop('#3f7a3f', line('M30 56 v-12 M42 56 v-12', 2.4)
                                            + line('M30 44 q6 -4 12 0', 2))),
    ]
    for ko, stem, text in made:
        open(os.path.join(OUT, stem + '.svg'), 'w', encoding='utf-8').write(text)
    print('drawn', len(made))


if __name__ == '__main__':
    main()
