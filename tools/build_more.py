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




# ----------------------------------------------------- numerals and days
def sino2(hanzi, colour='#b23a48'):
    """A two-character Sino numeral in the same seal frame as the generated set."""
    size = 26 if len(hanzi) <= 2 else 18
    body = (f'<rect x="12" y="12" width="48" height="48" rx="6" fill="none" stroke="{colour}" '
            f'stroke-width="2.4"/>')
    body += (f'<text x="36" y="{36 + size * 0.36:.0f}" font-size="{size}" fill="{colour}" '
             f'text-anchor="middle" font-family="Songti SC, serif">{hanzi}</text>')
    return svg(body)


def won():
    """원: a coin with the ₩ mark."""
    return svg(f'<circle cx="36" cy="36" r="22" fill="#f3e6c4" stroke="{K}" stroke-width="{W}"/>'
               + f'<text x="36" y="45" font-size="24" font-weight="700" fill="{BROWN}" '
                 f'text-anchor="middle" font-family="-apple-system,sans-serif">₩</text>')


def half():
    """반: a circle cut in half."""
    return svg(f'<circle cx="36" cy="36" r="21" fill="{WHITE}" stroke="{K}" stroke-width="{W}"/>'
               + f'<path d="M36 15 a21 21 0 0 0 0 42 z" fill="{BLUE}"/>'
               + line('M36 15 v42', 2))


def weekday(hanzi, colour):
    """A calendar tile: the day's hanja under a coloured header."""
    body = shape('M13 18 h46 v38 h-46 z', WHITE)
    body += shape('M13 18 h46 v10 h-46 z', colour)
    body += f'<circle cx="22" cy="23" r="2" fill="#fff"/><circle cx="50" cy="23" r="2" fill="#fff"/>'
    body += (f'<text x="36" y="46" font-size="22" fill="{DARK}" text-anchor="middle" '
             f'font-family="Songti SC, serif">{hanzi}</text>')
    return svg(body)


# ------------------------------------------------------------- everyday
def name_tag(text='', colour=BLUE):
    body = shape('M12 24 h48 v24 h-48 z', WHITE)
    body += shape('M12 24 h48 v7 h-48 z', colour)
    body += line('M20 40 h20', 2)
    if text:
        body += (f'<text x="36" y="45" font-size="14" fill="{DARK}" text-anchor="middle" '
                 f'font-family="Songti SC, serif">{text}</text>')
    return svg(body)


def briefcase():
    return svg(shape('M12 26 h48 v28 h-48 z', BROWN)
               + line('M28 26 v-6 h16 v6', 2.4)
               + line('M12 36 h48', 2)
               + shape('M30 36 h12 v6 h-12 z', CREAM))


def globe():
    body = f'<circle cx="36" cy="36" r="21" fill="{BLUE}" stroke="{K}" stroke-width="{W}"/>'
    body += line('M15 36 h42 M36 15 v42', 1.6)
    body += line('M21 24 q15 8 30 0 M21 48 q15 -8 30 0', 1.6)
    return svg(body)


def empty_box():
    return svg(shape('M16 22 h40 v34 h-40 z', '#f2f4f8')
               + line('M16 22 h40 v34 h-40 z')
               + line('M24 30 l24 18 M48 30 l-24 18', 2.6))


def where():
    body = shape('M36 56 q-14 -16 -14 -26 a14 14 0 0 1 28 0 q0 10 -14 26 z', RED)
    body += f'<circle cx="36" cy="30" r="6" fill="#fff"/>'
    body += (f'<text x="36" y="34.5" font-size="10" font-weight="700" fill="{RED}" '
             f'text-anchor="middle" font-family="-apple-system,sans-serif">?</text>')
    return svg(body)


def eating():
    """먹다: a spoon and chopsticks, angled the way they sit on a table."""
    body = (f'<ellipse cx="24" cy="26" rx="6" ry="8" fill="{GREY}" stroke="{K}" '
            f'stroke-width="1.8"/>')
    body += line('M24 34 v22', 3.4)
    for dx in (40, 46, 52):
        body += line('M%d 14 v42' % dx, 2.6)
    return svg(body)


def bowing():
    """인사하다: a person bending forward."""
    body = f'<circle cx="26" cy="26" r="9" fill="{CREAM}" stroke="{K}" stroke-width="{W}"/>'
    body += shape('M18 50 q8 -14 22 -8 q8 4 -2 12 z', BLUE)
    body += line('M46 34 q8 6 6 14', 3)
    return svg(body)


def happy_greet():
    body = f'<circle cx="30" cy="28" r="13" fill="{CREAM}" stroke="{K}" stroke-width="{W}"/>'
    body += line('M24 24 q6 5 12 0', 1.8)
    body += f'<circle cx="25" cy="26" r="1.6" fill="{K}"/><circle cx="35" cy="26" r="1.6" fill="{K}"/>'
    body += shape('M18 62 q0 -14 12 -14 t12 14 z', BLUE)
    body += line('M48 40 q6 -8 4 -14', 2.6)
    body += line('M52 26 l6 -4 M52 26 l-7 -1', 2)
    return svg(body)


def handshake():
    body = shape('M6 40 q10 -8 20 -2 l8 6 q-6 8 -14 6 z', CREAM)
    body += shape('M66 40 q-10 -8 -20 -2 l-8 6 q6 8 14 6 z', CREAM)
    body += line('M6 40 q10 -8 20 -2 M66 40 q-10 -8 -20 -2', 2)
    body += line('M26 44 l8 6 M46 44 l-8 6', 1.8)
    return svg(body)


def doing_hand():
    body = shape('M24 34 q-6 -2 -6 -8 q0 -6 6 -6 q-4 -8 4 -8 q6 0 7 6 q4 -4 8 0 q3 5 -2 9 '
                 'l-4 14 q-2 12 -14 10 q-10 -2 -9 -12 z', CREAM)
    body += line('M24 34 q-6 -2 -6 -8 q0 -6 6 -6 q-4 -8 4 -8 q6 0 7 6 q4 -4 8 0 q3 5 -2 9',
                 1.8)
    return svg(body)


def no():
    return svg(f'<circle cx="36" cy="36" r="21" fill="{WHITE}" stroke="{RED}" stroke-width="3"/>'
               + line('M22 22 l28 28', 4))


def homeland():
    house = shape('M22 34 l14 -12 l14 12 v22 h-28 z', CREAM)
    house += line('M22 34 l14 -12 l14 12 v22 h-28 z')
    heart = (f'<path d="M36 60 q-9 -7 -9 -13 a5 5 0 0 1 9 -3 a5 5 0 0 1 9 3 q0 6 -9 13 z" '
             f'fill="{RED}" stroke="{K}" stroke-width="1.6"/>')
    return svg(house + heart)





# ------------------------------------------------------ movement and deixis
def arrow(d, colour=BLUE, w=3.4):
    return ('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round"/>'
            % (d, colour, w))


def door_out():
    """나가다: a figure heading out through the doorway."""
    body = shape('M40 16 h20 v40 h-20 z', '#e9edf5')
    body += line('M40 16 h20 v40 h-20 z')
    body += f'<circle cx="24" cy="26" r="6.4" fill="{CREAM}" stroke="{K}" stroke-width="1.8"/>'
    body += line('M24 34 v12', 3)
    body += arrow('M14 48 q10 4 18 0')
    body += arrow('M32 46 l-5 -3 v6 z', BLUE, 1)
    return svg(body)


def door_in():
    """들어오다: a figure arriving through the doorway."""
    body = shape('M12 16 h20 v40 h-20 z', '#e9edf5')
    body += line('M12 16 h20 v40 h-20 z')
    body += f'<circle cx="48" cy="26" r="6.4" fill="{CREAM}" stroke="{K}" stroke-width="1.8"/>'
    body += line('M48 34 v12', 3)
    body += arrow('M58 48 q-10 4 -18 0')
    body += arrow('M40 46 l5 -3 v6 z', BLUE, 1)
    return svg(body)


def stairs(up=True):
    """올라가다 / 내려오다: steps with the direction drawn on them."""
    body = ''
    for i in range(4):
        x, y = 16 + i * 10, 46 - i * 9
        body += shape('M%d %d h10 v9 h-10 z' % (x, y), '#dfe6f2')
    body += arrow('M18 50 L52 22' if up else 'M18 20 L52 50', BLUE, 3.4)
    if up:
        body += arrow('M52 22 l-8 1 4 7 z', BLUE, 1)
    else:
        body += arrow('M52 50 l-8 -1 4 -7 z', BLUE, 1)
    return svg(body)


def this_thing(near=True):
    """이것 / 저것: a hand pointing at an object, close or far."""
    body = shape('M14 30 h20 v16 h-20 z', WHITE if near else '#eef1f6')
    body += line('M14 30 h20 v16 h-20 z')
    if not near:
        body = '<g transform="scale(.72) translate(30 14)">' + body + '</g>'
    hand = (f'<circle cx="{"34" if near else "50"}" cy="{"34" if near else "30"}" r="5" '
            f'fill="{CREAM}" stroke="{K}" stroke-width="1.6"/>')
    hand += arrow('M48 44 q-8 -3 -12 -6' if near else 'M62 40 q-6 -2 -10 -4', CREAM, 3)
    body += hand
    body += (f'<text x="24" y="60" font-size="14" font-weight="700" fill="{DARK}" '
             f'text-anchor="middle" font-family="-apple-system,sans-serif">'
             f'{"이" if near else "저"}</text>')
    return svg(body)


# --------------------------------------------------------------- time
def clock(angle, colour=BLUE, big=None):
    import math
    body = f'<circle cx="36" cy="36" r="21" fill="#fff" stroke="{K}" stroke-width="{W}"/>'
    for i in range(12):
        a = math.radians(i * 30 - 90)
        body += ('<path d="M%.1f %.1f L%.1f %.1f" stroke="%s" stroke-width="%s"/>'
                 % (36 + 16 * math.cos(a), 36 + 16 * math.sin(a),
                    36 + 19 * math.cos(a), 36 + 19 * math.sin(a), GREY, 1.6))
    a = math.radians(angle - 90)
    body += ('<path d="M36 36 L%.1f %.1f" stroke="%s" stroke-width="4" stroke-linecap="round"/>'
             % (36 + 13 * math.cos(a), 36 + 13 * math.sin(a), colour))
    body += f'<circle cx="36" cy="36" r="2.6" fill="{K}"/>'
    return svg(body)


def now():
    """지금: a clock with the moment marked on the outside."""
    return svg(clock(60).replace('</svg>', '')
               + f'<circle cx="36" cy="36" r="26" fill="none" stroke="{ORANGE}" '
                 f'stroke-width="2.4" stroke-dasharray="5 4"/></svg>')


def date_ask():
    """며칠: a calendar page with a question mark."""
    body = shape('M14 18 h44 v40 h-44 z', WHITE)
    body += shape('M14 18 h44 v9 h-44 z', '#6b5b9b')
    body += line('M14 18 h44 v40 h-44 z')
    body += (f'<text x="36" y="49" font-size="20" font-weight="700" fill="{DARK}" '
             f'text-anchor="middle" font-family="-apple-system,sans-serif">?</text>')
    return svg(body)


def weather_icon():
    body = f'<circle cx="28" cy="28" r="9" fill="{YELLOW}" stroke="{K}" stroke-width="1.8"/>'
    body += shape('M22 46 q0 -8 8 -8 q2 -7 10 -5 q7 2 6 9 q6 1 6 6 h-30 z', '#fff')
    body += line('M22 46 q0 -8 8 -8 q2 -7 10 -5 q7 2 6 9 q6 1 6 6', 1.8)
    body += line('M36 50 q-6 6 -10 2 M46 50 q3 6 7 3', 1.8)
    return svg(body)


def who():
    body = f'<circle cx="28" cy="28" r="9" fill="{CREAM}" stroke="{K}" stroke-width="1.8"/>'
    body += shape('M14 56 q0 -14 14 -14 t14 14 z', BLUE)
    body += (f'<text x="52" y="46" font-size="22" font-weight="700" fill="{DARK}" '
             f'text-anchor="middle" font-family="-apple-system,sans-serif">?</text>')
    return svg(body)


def taste():
    """맛: a tongue, which is what "taste" literally is."""
    body = shape('M24 18 q24 0 24 22 q0 22 -12 22 q-12 0 -12 -22 q0 -22 0 -22 z', PINK)
    body += line('M36 20 v34', 1.6)
    body += line('M28 26 q8 4 16 0', 1.4)
    return svg(body)


def tasteless():
    body = f'<circle cx="34" cy="34" r="18" fill="{CREAM}" stroke="{K}" stroke-width="{W}"/>'
    body += line('M26 30 q4 -3 8 0 M42 30 q4 -3 8 0', 1.8)
    body += line('M26 44 q8 -6 16 0', 2)
    body += line('M10 10 l52 52', 3.2)
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
    made += [
        ('이십', 'n-20', sino2('二十')), ('삼십', 'n-30', sino2('三十')),
        ('사십', 'n-40', sino2('四十')), ('오십', 'n-50', sino2('五十')),
        ('육십', 'n-60', sino2('六十')), ('칠십', 'n-70', sino2('七十')),
        ('팔십', 'n-80', sino2('八十')), ('구십', 'n-90', sino2('九十')),
        ('원', 'n-won', won()), ('반', 'n-half', half()),
        ('요일', 'd-weekday', weekday('曜', '#6b5b9b')),
        ('월요일', 'd-mon', weekday('月', '#4c6ef5')),
        ('화요일', 'd-tue', weekday('火', '#e8590c')),
        ('수요일', 'd-wed', weekday('水', '#3a5f8b')),
        ('목요일', 'd-thu', weekday('木', '#3f7a3f')),
        ('금요일', 'd-fri', weekday('金', '#b8860b')),
        ('토요일', 'd-sat', weekday('土', '#8b6b3a')),
        ('일요일', 'd-sun', weekday('日', '#c8102e')),
        ('이름', 'e-name', name_tag()),
        ('성', 'e-surname', name_tag('姓', '#8b6b3a')),
        ('직업', 'e-job', briefcase()),
        ('나라', 'e-country', globe()),
        ('외국인', 'e-foreigner', person('adult', badge('他', colour='#3f7a3f'))),
        ('고향', 'e-hometown', homeland()),
        ('없다', 'e-none', empty_box()),
        ('어디', 'e-where', where()),
        ('먹다', 'e-eat', eating()),
        ('인사하다', 'e-bow', bowing()),
        ('반갑다', 'e-glad', happy_greet()),
        ('처음 뵙겠습니다', 'e-meet', handshake()),
        ('하다', 'e-do', doing_hand()),
        ('아니요', 'e-no', no()),
    ]
    made += [
        ('나가다', 'v-out', door_out()),
        ('들어오다', 'v-in', door_in()),
        ('올라가다', 'v-up', stairs(True)),
        ('내려오다', 'v-down', stairs(False)),
        ('이것', 'x-this', this_thing(True)),
        ('저것', 'x-that', this_thing(False)),
        ('지금', 't-now', now()),
        ('시', 't-hour', clock(0)),
        ('분', 't-minute', clock(90)),
        ('며칠', 't-which-day', date_ask()),
        ('날씨', 'w-weather', weather_icon()),
        ('누구', 'q-who', who()),
        ('맛', 'm-taste', taste()),
        ('맛없다', 'm-tasteless', tasteless()),
    ]
    for ko, stem, text in made:
        open(os.path.join(OUT, stem + '.svg'), 'w', encoding='utf-8').write(text)
    print('drawn', len(made))


if __name__ == '__main__':
    main()
