#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fetch the famfamfam Silk icon set (Mark James, CC BY 2.5) and keep only the
~60 icons this site actually uses, in assets/silk/.

Upstream: https://github.com/legacy-icons/famfamfam-silk
"""
import io, os, sys, tarfile, urllib.request

PROXY = os.environ.get('YK_PROXY', 'http://127.0.0.1:7890')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'silk')
TARBALL = ('https://codeload.github.com/legacy-icons/famfamfam-silk/'
           'tar.gz/refs/heads/master')

WANT = """
house book book_open book_addresses
tag tags
pencil wand
magnifier zoom page_white_text
user user_go group user_comment
font text_dropcaps text_smallcaps
sound music volume
chart_bar chart_line chart_pie
medal rosette award_star_2
tick cross accept cancel
star star_bronze heart
arrow_right arrow_left arrow_refresh
clock calendar
comment comments
weather_sun weather_clouds weather_snow weather_rain
cart basket
telephone phone
camera picture
lightbulb cog wrench
world map flag_green
exclamation information help
bullet_go control_play control_pause
tables layout
key lock
folder page
note book_red
cup coffee
cake
car bus
email
spellcheck
time
zoom_in zoom_out
text_align_left
script
palette
ruby
application_view_list
"""


def opener():
    if PROXY:
        return urllib.request.build_opener(
            urllib.request.ProxyHandler({'http': PROXY, 'https': PROXY}))
    return urllib.request.build_opener()


def main():
    os.makedirs(OUT, exist_ok=True)
    want = set(WANT.split())
    print('downloading', TARBALL)
    blob = opener().open(urllib.request.Request(
        TARBALL, headers={'User-Agent': 'Mozilla/5.0'}), timeout=180).read()
    print('  %.1f MB' % (len(blob) / 1e6))
    kept = 0
    with tarfile.open(fileobj=io.BytesIO(blob), mode='r:gz') as tf:
        for m in tf.getmembers():
            if not m.isfile() or not m.name.endswith('.png'):
                continue
            base = os.path.basename(m.name)
            stem = base[:-4]
            if stem not in want:
                continue
            data = tf.extractfile(m).read()
            open(os.path.join(OUT, base), 'wb').write(data)
            kept += 1
    print(f'kept {kept} icons in {OUT}')
    missing = want - {f[:-4] for f in os.listdir(OUT) if f.endswith('.png')}
    if missing:
        print('not found:', ' '.join(sorted(missing)))


if __name__ == '__main__':
    main()
