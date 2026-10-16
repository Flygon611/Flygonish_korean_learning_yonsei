#!/usr/bin/env python3
"""Fetch illustration CANDIDATES for review.

The first attempt took the first in-article PNG of whatever post the feed
returned, which is how 手 ended up as a typhoon. Two rules now:
  1. the post TITLE must contain the search term
  2. the image must not look like site chrome
Nothing is wired into the site here; candidates go to a folder for a human to
look at.
"""
import json, os, re, sys, urllib.parse, urllib.request

PROXY = urllib.request.ProxyHandler({'https': 'http://127.0.0.1:7890',
                                     'http': 'http://127.0.0.1:7890'})
OP = urllib.request.build_opener(PROXY)
OP.addheaders = [('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                                'AppleWebKit/537.36 Chrome/120 Safari/537.36')]

BAD = re.compile(r'twitter_card|background|/s0/menu|premium|profile|favicon|'
                 r'comment|logo|banner|ad_|amazon|rakuten|pyoko|navigation|'
                 r'icon|button|/s1600/[a-z_]+\.(?:png|jpg)$', re.I)
IMG = re.compile(r'https://blogger\.googleusercontent\.com/img/[^"\'\s]+?\.(?:png|jpg)')


def get(url, timeout=30):
    return OP.open(url, timeout=timeout).read()


def posts(term, n=25):
    q = urllib.parse.quote(term)
    url = ('https://www.irasutoya.com/feeds/posts/default'
           f'?alt=json&max-results={n}&q={q}')
    data = json.loads(get(url).decode('utf-8', 'replace'))
    out = []
    for e in data.get('feed', {}).get('entry', []):
        title = e.get('title', {}).get('$t', '')
        html = ''
        for k in ('content', 'summary'):
            if e.get(k, {}).get('$t'):
                html = e[k]['$t']
                break
        out.append((title, html))
    return out


def candidates(term, want=3):
    got = []
    for title, html in posts(term):
        # rule 1: the post must be ABOUT the term, not merely mention it.
        # "自転車用ヘルメットのイラスト" is a helmet and "ノートパソコン" is a
        # laptop; both contain the term. The subject before のイラスト has to BE
        # the term, give or take a generic modifier.
        subject = re.sub(r'のイラスト.*$', '', title).strip()
        subject = re.sub(r'^(いろいろな|かわいい|簡単な|手描きの)', '', subject).strip()
        if subject != term:
            continue
        for u in IMG.findall(re.sub(r'<script.*?</script>', ' ', html, flags=re.S)):
            if BAD.search(u):
                continue
            big = re.sub(r'/s\d+(-c)?/', '/s800/', u)
            if big in got:
                continue
            got.append(big)
            if len(got) >= want:
                return title, got
    return ('', got)


if __name__ == '__main__':
    outdir = sys.argv[1]
    pairs = [tuple(x.split('=', 1)) for x in sys.argv[2:]]
    os.makedirs(outdir, exist_ok=True)
    manifest = []
    for slug, term in pairs:
        title, urls = candidates(term)
        saved = []
        for i, u in enumerate(urls):
            try:
                data = get(u, 40)
                if len(data) < 3000:
                    continue
                fn = os.path.join(outdir, '%s-%d.png' % (slug, i + 1))
                open(fn, 'wb').write(data)
                saved.append(os.path.basename(fn))
            except Exception as e:
                print('  !', slug, i, e)
        print('%-12s %-16s title=%-34s %d saved' % (slug, term, title[:34], len(saved)))
        manifest.append({'slug': slug, 'term': term, 'title': title, 'files': saved})
    json.dump(manifest, open(os.path.join(outdir, 'manifest.json'), 'w'),
              ensure_ascii=False, indent=1)
