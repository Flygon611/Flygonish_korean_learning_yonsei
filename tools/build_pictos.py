#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate the pictograms no stock library can supply.

OpenMoji covers things and animals, but it has nothing for 일/이/삼 (a numeral is
not a picture of anything), nor for 앞/뒤/옆 (a relation needs a diagram). Those
are drawn here instead of being faked with whatever emoji looks closest.

Output: assets/picto/<name>.svg, one file per word.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'picto')

INK = '#3a3a3a'
PAPER = '#ffffff'
RED = '#c8102e'
BLUE = '#003478'
SEAL = '#b23a48'
ACCENT = '#4c6ef5'
SOFT = '#e8ecf7'

HEAD = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">'
        '<rect width="64" height="64" rx="8" fill="%s"/>' % PAPER)
TAIL = '</svg>'


def card(body):
    return HEAD + body + TAIL


def taegeuk(cx, cy, r):
    """The 태극: two interlocking fish, drawn as closed paths.

    Three wrong versions came before this one, every one of them caught by
    LOOKING at the render rather than by reading the code:
      1. two arcs with hand-computed sweep flags -> a red blob with a blue smear
      2. full discs instead of half-arcs -> two tangent circles, i.e. "two balls"
      3. sweeps 1/1 instead of 1/0 -> the blue fish swallowed the red one
    The path below is copied from the variant that was checked on screen.
    No eyes: the dots belong to the Chinese taijitu, the Korean 태극 has none,
    and with them the mark read as two round lobes at 44px.
    The 45 degree rotation matches the angle used on the flag.
    """
    h = r / 2
    left = ('M %.2f %.2f A %.2f %.2f 0 0 0 %.2f %.2f '
            'A %.2f %.2f 0 0 1 %.2f %.2f A %.2f %.2f 0 0 0 %.2f %.2f Z' % (
                cx, cy - r, r, r, cx, cy + r, h, h, cx, cy, h, h, cx, cy - r))
    right = ('M %.2f %.2f A %.2f %.2f 0 0 1 %.2f %.2f '
             'A %.2f %.2f 0 0 1 %.2f %.2f A %.2f %.2f 0 0 0 %.2f %.2f Z' % (
                 cx, cy - r, r, r, cx, cy + r, h, h, cx, cy, h, h, cx, cy - r))
    return ('<g transform="rotate(45 %.2f %.2f)">' % (cx, cy)
            + '<path d="%s" fill="%s"/>' % (left, RED)
            + '<path d="%s" fill="%s"/>' % (right, BLUE)
            + '<circle cx="%.2f" cy="%.2f" r="%.2f" fill="none" stroke="%s" stroke-width="0.9"/>'
              % (cx, cy, r, INK)
            + '</g>')


def taegeuk_mark(cx, cy, r):
    """Just the 태극, without the four trigrams.

    The full flag was tried first and at 20-24px its trigrams collapsed into a
    smear — worse than no mark. A two-colour circle is the part that still reads.
    """
    return ('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#fff" stroke="%s" stroke-width="0.9"/>'
            % (cx, cy, r, INK) + taegeuk(cx, cy, r * 0.82))


def sino(name, hanzi):
    """A Sino-Korean numeral: the character itself, in a seal-like frame."""
    return card(
        '<rect x="17" y="12" width="30" height="40" rx="4" fill="none" stroke="%s" stroke-width="1.6"/>' % SEAL
        + '<text x="32" y="39" font-size="22" font-family="Songti SC, serif" fill="%s" '
          'text-anchor="middle">%s</text>' % (SEAL, hanzi))


def native(name, digit):
    """A native Korean numeral: the digit, marked as the native series."""
    return card(
        '<text x="30" y="44" font-size="34" font-family="-apple-system, Helvetica, sans-serif" '
        'font-weight="600" fill="%s" text-anchor="middle">%s</text>' % (INK, digit)
        + taegeuk_mark(48, 40, 11))


def diagram(name, body):
    return card(body)


# ---------------------------------------------------------------- a cube
# A flat rectangle could not tell 안 from 옆 — a dot in a box and a dot beside a
# box look nearly the same. An isometric cube gives the ball somewhere to be:
# on top, underneath, in front, behind, inside, beside.

TOP_FILL = '#dfe6f7'
LEFT_FILL = '#c3cff0'
RIGHT_FILL = '#a8b8e6'
EDGE = '#5a6a94'


def cube(cx, cy, s, open_=False):
    """An isometric cube. `open_` leaves the solid faces off so a ball drawn
    inside it still shows — that is the whole picture for 안."""
    w, h = s * 0.87, s * 0.5
    top = 'M %.1f %.1f L %.1f %.1f L %.1f %.1f L %.1f %.1f Z' % (
        cx, cy - s, cx + w, cy - h, cx, cy, cx - w, cy - h)
    left = 'M %.1f %.1f L %.1f %.1f L %.1f %.1f L %.1f %.1f Z' % (
        cx - w, cy - h, cx, cy, cx, cy + s, cx - w, cy + h)
    right = 'M %.1f %.1f L %.1f %.1f L %.1f %.1f L %.1f %.1f Z' % (
        cx, cy, cx + w, cy - h, cx + w, cy + h, cx, cy + s)
    if open_:
        return ('<path d="%s" fill="none" stroke="%s" stroke-width="1.2"/>' % (top, EDGE)
                + '<path d="%s" fill="none" stroke="%s" stroke-width="1.2"/>' % (left, EDGE)
                + '<path d="%s" fill="none" stroke="%s" stroke-width="1.2"/>' % (right, EDGE))
    return ('<path d="%s" fill="%s" stroke="%s" stroke-width="1"/>' % (top, TOP_FILL, EDGE)
            + '<path d="%s" fill="%s" stroke="%s" stroke-width="1"/>' % (left, LEFT_FILL, EDGE)
            + '<path d="%s" fill="%s" stroke="%s" stroke-width="1"/>' % (right, RIGHT_FILL, EDGE))


def ball(cx, cy, r, fill=None):
    return '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s" stroke="#fff" stroke-width="0.8"/>' % (
        cx, cy, r, fill or ACCENT)


def direction(name, kind):
    cx, cy, s, r = 33, 33, 13, 6.2
    w, h = s * 0.87, s * 0.5
    if kind == 'above':                       # on top of the cube
        b = cube(cx, cy + 3, s) + ball(cx, cy + 3 - s - r + 1, r)
    elif kind == 'below':                     # underneath
        b = cube(cx, cy - 3, s) + ball(cx, cy - 3 + s + r - 1, r)
    elif kind == 'front':                     # towards the viewer, lower left
        b = cube(cx + 4, cy - 2, s) + ball(cx + 4 - w - r, cy - 2 + h + r, r)
    elif kind == 'back':                      # peeking out from behind
        b = ball(cx + 4 + w * 0.55, cy - 2 - h * 1.5, r, '#8d9bd0') + cube(cx + 4, cy - 2, s)
    elif kind == 'side':                      # right of the cube, same level
        b = cube(cx - 5, cy, s) + ball(cx - 5 + w + r + 1, cy + h * 0.4, r)
    elif kind == 'inside':                    # the cube drawn open, ball within
        b = cube(cx, cy, s, open_=True) + ball(cx, cy - s * 0.15, r)
    elif kind == 'outside':                   # clearly away from it
        b = cube(cx - 6, cy + 4, s) + ball(cx + 15, cy - 15, r)
    elif kind == 'near':                      # in the vicinity, not touching
        b = (cube(cx - 9, cy, s)
             + '<path d="M %.1f %.1f a 13 13 0 0 1 13 8" fill="none" stroke="%s" '
               'stroke-width="1.3" stroke-dasharray="2.5 2.5"/>'
               % (cx - 9 + w, cy - 2, EDGE)
             + ball(cx + 15, cy + 6, r))
    elif kind.startswith('dist-'):            # 이쪽 / 그쪽 / 저쪽 differ by DISTANCE
        d = {'dist-this': 9, 'dist-that': 17, 'dist-yon': 24}[kind]
        b = (cube(cx - 16, cy, s * 0.8)
             + '<path d="M %.1f 46 H %.1f" stroke="%s" stroke-width="1" '
               'stroke-dasharray="2 2"/>' % (cx - 6, cx - 6 + d, EDGE)
             + ball(cx - 6 + d, 46, r - 1 if d < 20 else r - 2))
    elif kind == 'left':
        b = ('<path d="M50 32 H16" stroke="%s" stroke-width="2.4"/>' % ACCENT
             + '<path d="M18 32 l9 -6 v12 z" fill="%s"/>' % ACCENT)
    elif kind == 'right':
        b = ('<path d="M14 32 H48" stroke="%s" stroke-width="2.4"/>' % ACCENT
             + '<path d="M46 32 l-9 -6 v12 z" fill="%s"/>' % ACCENT)
    else:
        b = cube(cx, cy, s)
    return card(b)


def composite(src, symbol, colour):
    """An OpenMoji drawing plus a ♂/♀ badge.

    형 and 오빠 are the same person — an older brother. What differs is the
    SPEAKER: a man says 형, a woman says 오빠. No picture of a person can show
    that, so the drawing is shared and the badge carries the distinction.
    """
    raw = open(src, encoding='utf-8').read()
    body = re.sub(r'^[\s\S]*?<svg[^>]*>', '', raw)
    body = body[:body.rfind('</svg>')]
    badge = ('<circle cx="53" cy="51" r="11" fill="%s" stroke="#fff" stroke-width="1.4"/>'
             '<text x="53" y="56.5" font-size="14" font-weight="700" fill="#fff" '
             'text-anchor="middle" font-family="-apple-system, Helvetica, sans-serif">%s</text>'
             % (colour, symbol))
    return card('<g transform="scale(0.84) translate(1.5 1)">%s</g>' % body + badge)



# ---------------------------------------------------------------- schematic
# Concepts a picture of an object cannot express: how often, how much, in what
# order, with whom. One grammar throughout — marks on a track — so 자주 vs 가끔
# reads as a scale instead of three unrelated drawings.

def _marks(filled, total=5, colour=ACCENT, faded=False):
    w, gap, y = 7.2, 3.4, 26
    span = total * w + (total - 1) * gap
    x0 = (64 - span) / 2
    out = ''
    for i in range(total):
        lit = i < filled
        c = colour if lit else '#c3cfe0'
        op = '' if lit else ' opacity=".30"'
        out += ('<rect x="%.1f" y="%d" width="%.1f" height="11" rx="3.4" fill="%s"%s/>'
                % (x0 + i * (w + gap), y, w, c, op))
    return out


def _track(y=43):
    return '<path d="M9 %d H55" stroke="%s" stroke-width="1.5" stroke-linecap="round"/>' % (y, INK)


def _bar(pct, colour=ACCENT, warn=False):
    inner = 44 * max(0.0, min(1.0, pct))
    body = ('<rect x="10" y="24" width="44" height="16" rx="8" fill="%s" stroke="%s" '
            'stroke-width="1.4"/>' % (SOFT, INK))
    fill = ('<rect x="10" y="24" width="%.1f" height="16" rx="8" fill="%s"/>' % (inner, colour)
            if inner > 0 else '')
    mark = ('<path d="M47 15 v6" stroke="%s" stroke-width="2.4" stroke-linecap="round"/>'
            % RED if warn else '')
    return card(body + fill + mark)


def _dot_track(pos):
    xs = [16, 32, 48]
    out = '<path d="M10 32 H54" stroke="%s" stroke-width="1.5"/>' % INK
    for i, x in enumerate(xs):
        out += ('<circle cx="%d" cy="32" r="%s" fill="%s"%s/>'
                % (x, 6 if i == pos else 3, ACCENT if i == pos else '#c3cfe0',
                   '' if i == pos else ' opacity=".45"'))
    return card(out)


def _company(two):
    def person(x):
        return ('<circle cx="%d" cy="24" r="5.2" fill="%s"/>' % (x, ACCENT)
                + '<path d="M%d 31 v10" stroke="%s" stroke-width="2.4" stroke-linecap="round"/>'
                  % (x, ACCENT)
                + '<path d="M%d 35 l-5 5 M%d 35 l5 5" stroke="%s" stroke-width="2" '
                  'stroke-linecap="round"/>' % (x, x, ACCENT))
    return card(person(24) + person(42) if two else person(32))


def _clock(angle, dashed, bang=False):
    import math
    cx, cy, r = 32, 30, 14
    out = '<circle cx="%d" cy="%d" r="%d" fill="none" stroke="%s" stroke-width="1.6"/>' % (
        cx, cy, r, INK)
    ax = cx + 8 * math.cos(math.radians(angle - 90))
    ay = cy + 8 * math.sin(math.radians(angle - 90))
    out += '<path d="M%d %d L%.1f %.1f" stroke="%s" stroke-width="1.8" stroke-linecap="round"/>' % (
        cx, cy, ax, ay, ACCENT)
    if dashed:
        out += ('<path d="M%d %d a%d %d 0 0 1 %d 0" fill="none" stroke="#c3cfe0" '
                'stroke-width="2" stroke-dasharray="3 3"/>' % (cx - r, cy, r, r, 2 * r))
    out += '<path d="M10 52 H54" stroke="%s" stroke-width="1.5"/>' % INK
    if bang:
        out += ('<text x="51" y="18" font-size="13" font-weight="700" fill="%s" '
                'font-family="-apple-system,sans-serif">!</text>' % RED)
    return card(out)


def _order(pos, total=3):
    out = ''
    for i in range(total):
        y = 20 + i * 12
        lit = i == pos
        out += ('<rect x="14" y="%d" width="%d" height="8" rx="2.5" fill="%s"%s/>'
                % (y, 36 - i * 6, ACCENT if lit else '#c3cfe0', '' if lit else ' opacity=".35"'))
        out += '<circle cx="8" cy="%d" r="2.6" fill="%s"/>' % (y + 4, ACCENT if lit else '#c3cfe0')
    return card(out)


def schema_pictos():
    """Returns [(korean word, file stem, svg)]."""
    good = '#2f9e44'
    items = [
        ('항상', 'sch-always', card(_marks(5) + _track())),
        ('자주', 'sch-often', card(_marks(3) + _track())),
        ('가끔', 'sch-sometimes', card(_marks(1) + _track())),
        ('별로', 'sch-notmuch', card(_marks(1, 5, '#c3cfe0') + _track())),
        ('전혀', 'sch-never', card(_marks(0) + _track())),
        ('주로', 'sch-mainly', card(_marks(4) + _track())),
        ('아주', 'sch-very', _bar(0.9)),
        ('조금', 'sch-a-little', _bar(0.25)),
        ('많이', 'sch-much', _bar(0.7)),
        ('너무', 'sch-too-much', _bar(1.0, RED, warn=True)),
        ('모두', 'sch-all', card(_marks(5, 5, good) + _track())),
        ('몇', 'sch-how-many', card(_marks(0) + _track()
            + '<text x="32" y="21" font-size="15" font-weight="700" fill="%s" '
              'text-anchor="middle" font-family="-apple-system,sans-serif">?</text>' % INK)),
        ('한번', 'sch-once', card(_marks(1) + _track())),
        ('두번', 'sch-twice', card(_marks(2) + _track())),
        ('같이', 'sch-together', _company(True)),
        ('혼자', 'sch-alone', _company(False)),
        ('먼저', 'sch-first', _order(0)),
        ('나중에', 'sch-later', _order(2)),
        ('지난', 'sch-last', _dot_track(0)),
        ('이번', 'sch-this', _dot_track(1)),
        ('아직', 'sch-yet', _clock(300, True)),
        ('벌써', 'sch-already', _clock(60, False, bang=True)),
    ]
    return items


def main():
    os.makedirs(OUT, exist_ok=True)
    made = []

    sino_nums = [('일', '一'), ('이', '二'), ('삼', '三'), ('사', '四'), ('오', '五'),
                 ('육', '六'), ('칠', '七'), ('팔', '八'), ('구', '九'), ('십', '十'),
                 ('백', '百'), ('천', '千'), ('만', '萬')]
    native_nums = [('하나', '1'), ('둘', '2'), ('셋', '3'), ('넷', '4'), ('다섯', '5'),
                   ('여섯', '6'), ('일곱', '7'), ('여덟', '8'), ('아홉', '9'), ('열', '10')]
    dirs = [('앞', 'front'), ('뒤', 'back'), ('위', 'above'), ('밑', 'below'), ('아래', 'below'),
            ('옆', 'side'), ('안', 'inside'), ('밖', 'outside'), ('근처', 'near'),
            ('왼쪽', 'left'), ('오른쪽', 'right'), ('앞쪽', 'front'), ('뒤쪽', 'back'),
            # 이쪽 / 그쪽 / 저쪽 are about DISTANCE from the speaker, not about
            # which side of something — drawn as near / mid / far from the cube
            ('이쪽', 'dist-this'), ('그쪽', 'dist-that'), ('저쪽', 'dist-yon')]

    for ko, hz in sino_nums:
        made.append((ko, 'num-sino-' + hz, sino(ko, hz)))
    for ko, d in native_nums:
        made.append((ko, 'num-native-' + d, native(ko, d)))
    for ko, kind in dirs:
        made.append((ko, 'dir-' + ko, direction(ko, kind)))

    # 형/오빠 and 누나/여동생 are drawn the same; the badge says who says it
    om = os.path.join(ROOT, 'assets', 'openmoji')
    fam = [('형', '1f466', '\u2642', '#4c6ef5'),    # older brother, male speaker
           ('오빠', '1f466', '\u2640', '#e64980'),   # older brother, female speaker
           ('누나', '1f467', '\u2642', '#4c6ef5'),   # older sister, male speaker
           ('여동생', '1f467', '\u2640', '#e64980')]  # younger sister
    for ko, hexc, sym, col in fam:
        src = os.path.join(om, hexc + '.svg')
        if os.path.exists(src):
            made.append((ko, 'fam-' + ko, composite(src, sym, col)))

    made.extend(schema_pictos())

    for ko, name, svg in made:
        open(os.path.join(OUT, name + '.svg'), 'w', encoding='utf-8').write(svg)
    print('generated %d pictograms in assets/picto' % len(made))
    for ko, name, _ in made:
        print('  %-8s assets/picto/%s.svg' % (ko, name))


if __name__ == '__main__':
    main()
