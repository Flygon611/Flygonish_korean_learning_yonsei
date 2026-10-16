#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Stamp a version query onto every local css/js reference in index.html.

GitHub Pages serves static assets with `cache-control: max-age=600`, so after a
deploy a returning visitor can keep running the previous javascript for ten
minutes — which looks exactly like "the feature you just added is missing".
Bumping this string changes the URL and defeats the cache.

    python3 tools/bump-assets.py            # auto: today's date + counter
    python3 tools/bump-assets.py 2026-10-16-3
"""
import datetime, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, 'index.html')
LOCAL = re.compile(r'((?:href|src)=")((?:css|js)/[^"?]+)(\?v=[^"]*)?(")')


def current_version(html):
    m = re.search(r'\?v=([^"&]+)"', html)
    return m.group(1) if m else None


def next_version(old):
    today = datetime.date.today().isoformat()
    if not old or not old.startswith(today):
        return today + '-1'
    try:
        n = int(old.rsplit('-', 1)[1])
    except (IndexError, ValueError):
        n = 0
    return today + '-' + str(n + 1)


def main():
    html = open(INDEX, encoding='utf-8').read()
    old = current_version(html)
    if not old:
        version = sys.argv[1] if len(sys.argv) > 1 else next_version(None)
    else:
        version = sys.argv[1] if len(sys.argv) > 1 else next_version(old)
    html, n = LOCAL.subn(lambda m: m.group(1) + m.group(2) + '?v=' + version + m.group(4), html)
    open(INDEX, 'w', encoding='utf-8').write(html)
    print(f'{old or "(none)"} -> {version}   ({n} references stamped)')


if __name__ == '__main__':
    main()
