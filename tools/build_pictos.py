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
    """The 태극, built from four primitives rather than arc flags.

    The first attempt used two arcs with hand-computed sweep flags and produced
    a red blob with a blue smear — the maths was simply wrong. This construction
    cannot go wrong: fill the disc red, lay a blue half over the bottom, then
    drop a blue disc into the top half and a red one into the bottom. Where the
    two small discs cross the dividing line IS the S-curve.
    """
    h = r / 2
    return (
        '<circle cx="%.2f" cy="%.2f" r="%.2f" fill="%s"/>' % (cx, cy, r, RED)
        + '<path d="M %.2f %.2f A %.2f %.2f 0 0 0 %.2f %.2f Z" fill="%s"/>'
          % (cx - r, cy, r, r, cx + r, cy, BLUE)
        + '<circle cx="%.2f" cy="%.2f" r="%.2f" fill="%s"/>' % (cx, cy - h, h, BLUE)
        + '<circle cx="%.2f" cy="%.2f" r="%.2f" fill="%s"/>' % (cx, cy + h, h, RED)
    )


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


BOX = '<rect x="18" y="22" width="28" height="20" rx="3" fill="%s" stroke="%s" stroke-width="1.6"/>' % (SOFT, INK)
DOT = '<circle cx="32" cy="32" r="4.2" fill="%s"/>' % ACCENT
UP = '<path d="M32 12 l6 8 h-12 z" fill="%s"/>' % ACCENT
DOWN = '<path d="M32 52 l6 -8 h-12 z" fill="%s"/>' % ACCENT


def direction(name, kind):
    if kind == 'front':
        b = ('<rect x="20" y="30" width="24" height="18" rx="3" fill="%s" stroke="%s" stroke-width="1.6"/>'
             % (SOFT, INK) + '<path d="M32 8 l7 10 h-14 z" fill="%s"/>' % ACCENT
             + '<circle cx="32" cy="24" r="3.6" fill="%s"/>' % ACCENT)
    elif kind == 'back':
        b = (BOX + DOT + '<path d="M32 56 l7 -10 h-14 z" fill="%s"/>' % ACCENT)
    elif kind == 'above':
        b = (BOX + DOT + '<circle cx="32" cy="13" r="4.2" fill="%s"/>' % ACCENT
             + '<path d="M32 20 l4 5 h-8 z" fill="%s"/>' % ACCENT)
    elif kind == 'below':
        b = (BOX + DOT + '<circle cx="32" cy="53" r="4.2" fill="%s"/>' % ACCENT
             + '<path d="M32 46 l4 -5 h-8 z" fill="%s"/>' % ACCENT)
    elif kind == 'side':
        b = (BOX + DOT + '<circle cx="53" cy="32" r="4.2" fill="%s"/>' % ACCENT
             + '<path d="M46 32 l-5 4 v-8 z" fill="%s"/>' % ACCENT)
    elif kind == 'inside':
        b = (BOX + '<circle cx="32" cy="32" r="5" fill="%s"/>' % ACCENT)
    elif kind == 'outside':
        b = (BOX + '<circle cx="55" cy="15" r="5" fill="%s"/>' % ACCENT
             + '<path d="M49 21 l-4 4 6 -1 z" fill="%s"/>' % ACCENT)
    elif kind == 'near':
        b = (BOX + '<circle cx="52" cy="32" r="4.2" fill="%s"/>' % ACCENT
             + '<path d="M45 32 h-6" stroke="%s" stroke-width="1.6" stroke-dasharray="2 2"/>' % ACCENT)
    elif kind == 'left':
        b = ('<path d="M50 32 H16" stroke="%s" stroke-width="2.4"/>' % ACCENT
             + '<path d="M18 32 l9 -6 v12 z" fill="%s"/>' % ACCENT)
    elif kind == 'right':
        b = ('<path d="M14 32 H48" stroke="%s" stroke-width="2.4"/>' % ACCENT
             + '<path d="M46 32 l-9 -6 v12 z" fill="%s"/>' % ACCENT)
    else:
        b = BOX
    return diagram(name, b)


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
            ('왼쪽', 'left'), ('오른쪽', 'right'), ('이쪽', 'front'), ('그쪽', 'side'),
            ('저쪽', 'back'), ('앞쪽', 'front'), ('뒤쪽', 'back')]

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
