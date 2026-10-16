#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate the pictograms no stock library can supply.

OpenMoji covers things and animals, but it has nothing for 일/이/삼 (a numeral is
not a picture of anything), nor for 앞/뒤/옆 (a relation needs a diagram). Those
are drawn here instead of being faked with whatever emoji looks closest.

Output: assets/picto/<name>.svg, one file per word.
"""
import os

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

    for ko, name, svg in made:
        open(os.path.join(OUT, name + '.svg'), 'w', encoding='utf-8').write(svg)
    print('generated %d pictograms in assets/picto' % len(made))
    for ko, name, _ in made:
        print('  %-8s assets/picto/%s.svg' % (ko, name))


if __name__ == '__main__':
    main()
