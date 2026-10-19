#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Scene backdrops for the vocabulary clusters.

A cluster of same-kind words is easier to learn as ONE picture with labels than
as ten separate cards. These are the backdrops; the words themselves are placed
over them as HTML so they can be tapped and read aloud.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'scene')

WOOD = '#e7d4b4'
WOOD_EDGE = '#c9ae86'
WOOD_LINE = '#d8c19d'
INK = '#4a4136'


def desk():
    """A top-down desk. Items go on top of it."""
    s = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" width="1000" height="620">'
         '<rect x="0" y="0" width="1000" height="620" rx="26" fill="%s"/>' % WOOD)
    # grain
    for i, y in enumerate((70, 150, 240, 330, 430, 520)):
        s += ('<path d="M40 %d q 240 -14 460 0 t 460 0" fill="none" stroke="%s" '
              'stroke-width="1.4" opacity=".55"/>' % (y, WOOD_LINE))
    # edge highlight
    s += ('<rect x="14" y="14" width="972" height="592" rx="20" fill="none" stroke="%s" '
          'stroke-width="2.5" opacity=".7"/>' % WOOD_EDGE)
    # a faint shadow under where the items sit
    s += ('<ellipse cx="500" cy="330" rx="430" ry="235" fill="%s" opacity=".12"/>' % INK)
    return s + '</svg>'


def cube():
    """One big isometric cube: every position word points at a place on it."""
    cx, cy, s0 = 300, 300, 150
    w, h = s0 * 0.87, s0 * 0.5
    top = 'M %.1f %.1f L %.1f %.1f L %.1f %.1f L %.1f %.1f Z' % (
        cx, cy - s0, cx + w, cy - h, cx, cy, cx - w, cy - h)
    left = 'M %.1f %.1f L %.1f %.1f L %.1f %.1f L %.1f %.1f Z' % (
        cx - w, cy - h, cx, cy, cx, cy + s0, cx - w, cy + h)
    right = 'M %.1f %.1f L %.1f %.1f L %.1f %.1f L %.1f %.1f Z' % (
        cx, cy, cx + w, cy - h, cx + w, cy + h, cx, cy + s0)
    out = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">'
           '<rect width="600" height="600" fill="none"/>')
    out += '<path d="%s" fill="#dfe6f7" stroke="#5a6a94" stroke-width="2"/>' % top
    out += '<path d="%s" fill="#c3cff0" stroke="#5a6a94" stroke-width="2"/>' % left
    out += '<path d="%s" fill="#a8b8e6" stroke="#5a6a94" stroke-width="2"/>' % right
    # faint axis lines to suggest the space around it
    for x1, y1, x2, y2 in ((cx, 40, cx, 120), (cx, 480, cx, 560),
                           (40, cy + 40, 120, cy + 40), (480, cy + 40, 560, cy + 40)):
        out += ('<path d="M%d %d L%d %d" stroke="#9aa7c7" stroke-width="1.6" '
                'stroke-dasharray="5 5"/>' % (x1, y1, x2, y2))
    return out + '</svg>'



LINE = '#b9c2d6'
SMALL = '#8d99b5'


def family():
    """A family tree. The relations are the lesson, so the connectors carry the
    meaning and the words hang off them.

    Layout in a 1000x820 box; the chips are placed at the same percentages, so
    the wires and the words stay locked together at any width.
    """
    W, H = 1000, 820
    out = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" '
           'height="%d">' % (W, H, W, H))
    y1, y2, y3, y4 = 98, 328, 541, 705          # 12%, 40%, 66%, 86%
    # grandparents: two couples
    for a, b in ((160, 330), (670, 840)):
        out += ('<path d="M%d %d H%d" stroke="%s" stroke-width="2"/>' % (a, y1, b, LINE))
    # each couple down to their child
    out += ('<path d="M245 %d V%d H280" fill="none" stroke="%s" stroke-width="2"/>'
            % (y1, y2 - 40, LINE))
    out += ('<path d="M755 %d V%d H720" fill="none" stroke="%s" stroke-width="2"/>'
            % (y1, y2 - 40, LINE))
    # marriage line between the parents
    out += ('<path d="M280 %d H720" stroke="%s" stroke-width="2"/>' % (y2, LINE))
    out += ('<circle cx="500" cy="%d" r="5" fill="%s"/>' % (y2, SMALL))
    # down to the speaker and across to the siblings
    out += ('<path d="M500 %d V%d" stroke="%s" stroke-width="2"/>' % (y2, y3 - 60, LINE))
    out += ('<path d="M120 %d H880" stroke="%s" stroke-width="2"/>' % (y3 - 60, LINE))
    for x in (120, 380, 640, 880):
        out += ('<path d="M%d %d V%d" stroke="%s" stroke-width="2"/>'
                % (x, y3 - 60, y3 - 18, LINE))
    # the younger siblings hang under 동생
    out += ('<path d="M880 %d V%d H770" fill="none" stroke="%s" stroke-width="1.6" '
            'stroke-dasharray="4 4"/>' % (y3 + 18, y4 - 14, LINE))
    out += ('<path d="M880 %d V%d H930" fill="none" stroke="%s" stroke-width="1.6" '
            'stroke-dasharray="4 4"/>' % (y3 + 18, y4 - 14, LINE))
    return out + '</svg>'

def room():
    """A classroom wall seen from the front: for board / window / door words."""
    out = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 560" width="1000" height="560">'
           '<rect width="1000" height="560" rx="24" fill="#f4f1ea"/>'
           '<rect x="0" y="430" width="1000" height="130" fill="#e2dccf"/>')
    return out + '</svg>'



SKY = '#dceaf7'
SKY_LOW = '#c9dff2'
GRASS = '#cfe3bd'
ROAD = '#c9ccd4'
ROAD_EDGE = '#aeb3bf'
WALL = '#ece7dd'
ROOF = '#c9b79e'


def weather():
    """Sky over a bit of ground: sun, cloud, rain all have somewhere to sit."""
    out = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 560" width="1000" height="560">'
           '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">'
           '<stop offset="0" stop-color="%s"/><stop offset="1" stop-color="%s"/>'
           '</linearGradient></defs>'
           '<rect width="1000" height="560" rx="24" fill="url(#sky)"/>' % (SKY, SKY_LOW))
    # sun
    out += ('<circle cx="820" cy="110" r="52" fill="#ffd76a"/>'
            '<circle cx="820" cy="110" r="70" fill="#ffd76a" opacity=".25"/>')
    # clouds
    for cx, cy, sc in ((250, 130, 1.0), (560, 190, .78), (740, 300, .62)):
        out += ('<g transform="translate(%d %d) scale(%s)" opacity=".92">'
                '<ellipse cx="0" cy="0" rx="78" ry="38" fill="#fff"/>'
                '<ellipse cx="-46" cy="12" rx="46" ry="26" fill="#fff"/>'
                '<ellipse cx="50" cy="10" rx="52" ry="28" fill="#fff"/></g>' % (cx, cy, sc))
    # ground
    out += '<rect x="0" y="448" width="1000" height="112" fill="%s"/>' % GRASS
    out += ('<path d="M0 448 H1000" stroke="#b6d0a0" stroke-width="3"/>')
    return out + '</svg>'


def street():
    """A street seen head-on: pavement, road, buildings. Direction words point
    along it, transport words sit on it."""
    out = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 560" width="1000" height="560">'
           '<rect width="1000" height="560" rx="24" fill="#eef1f6"/>')
    # buildings
    for x, w, h, c in ((30, 150, 190, '#dfe6f2'), (200, 120, 150, '#e6ebf5'),
                       (340, 160, 210, '#d8e0f0'), (640, 140, 170, '#e3e9f4'),
                       (800, 170, 220, '#d9e2f1')):
        out += ('<rect x="%d" y="%d" width="%d" height="%d" rx="6" fill="%s" stroke="%s" '
                'stroke-width="2"/>' % (x, 300 - h // 2, w, h, c, '#b9c2d6'))
        for wy in range(300 - h // 2 + 22, 300 + h // 2 - 20, 34):
            for wx in range(x + 16, x + w - 16, 34):
                out += '<rect x="%d" y="%d" width="16" height="18" rx="3" fill="#fff" opacity=".8"/>' % (wx, wy)
    # road
    out += '<rect x="0" y="340" width="1000" height="150" fill="%s"/>' % ROAD
    out += '<path d="M0 340 H1000 M0 490 H1000" stroke="%s" stroke-width="4"/>' % ROAD_EDGE
    for x in range(30, 1000, 130):
        out += '<rect x="%d" y="412" width="70" height="8" rx="4" fill="#fff" opacity=".85"/>' % x
    # pavement
    out += '<rect x="0" y="490" width="1000" height="70" fill="#e7e3da"/>'
    for x in range(0, 1000, 90):
        out += '<path d="M%d 490 V560" stroke="#d3cdc0" stroke-width="2"/>' % x
    return out + '</svg>'


def town():
    """A small map: blocks for the places in 2-4."""
    out = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" width="1000" height="620">'
           '<rect width="1000" height="620" rx="24" fill="#eef2e8"/>')
    # roads as a grid
    out += '<rect x="0" y="196" width="1000" height="54" fill="#d9dbd4"/>'
    out += '<rect x="0" y="420" width="1000" height="54" fill="#d9dbd4"/>'
    out += '<rect x="300" y="0" width="54" height="620" fill="#d9dbd4"/>'
    out += '<rect x="666" y="0" width="54" height="620" fill="#d9dbd4"/>'
    for x in (120, 480, 850):
        for y in (100, 330, 520):
            out += ('<rect x="%d" y="%d" width="120" height="80" rx="8" fill="#e4ead9" '
                    'stroke="#c8d3b6" stroke-width="2"/>' % (x - 60, y - 40))
    return out + '</svg>'


def clock():
    """One big clock face: 시 / 분 / 오전 / 오후 all point at a part of it."""
    cx = cy = 300
    out = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">'
           '<circle cx="%d" cy="%d" r="250" fill="#fff" stroke="#c3ccdf" stroke-width="10"/>'
           % (cx, cy))
    for i in range(60):
        import math
        a = math.radians(i * 6 - 90)
        r1 = 214 if i % 5 == 0 else 226
        r2 = 236
        out += ('<path d="M%.1f %.1f L%.1f %.1f" stroke="%s" stroke-width="%s"/>'
                % (cx + r1 * math.cos(a), cy + r1 * math.sin(a),
                   cx + r2 * math.cos(a), cy + r2 * math.sin(a),
                   '#8894b0', 4 if i % 5 == 0 else 2))
    out += '<circle cx="%d" cy="%d" r="9" fill="#4c6ef5"/>' % (cx, cy)
    return out + '</svg>'


def table():
    """A dining table from above, for the dishes in 4-3 and the counters 4-4."""
    out = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" width="1000" height="620">'
           '<rect width="1000" height="620" rx="26" fill="#efe3d2"/>'
           '<rect x="14" y="14" width="972" height="592" rx="20" fill="none" '
           'stroke="#d9c7ae" stroke-width="2.5"/>'
           '<ellipse cx="500" cy="330" rx="430" ry="230" fill="#e2d2bb" opacity=".45"/>')
    return out + '</svg>'

def main():
    os.makedirs(OUT, exist_ok=True)
    files = {'desk.svg': desk(), 'cube.svg': cube(), 'room.svg': room(),
             'family.svg': family(), 'weather.svg': weather(), 'street.svg': street(),
             'town.svg': town(), 'clock.svg': clock(), 'table.svg': table()}
    for name, svg in files.items():
        open(os.path.join(OUT, name), 'w', encoding='utf-8').write(svg)
    print('scenes:', ', '.join(files))


if __name__ == '__main__':
    main()
