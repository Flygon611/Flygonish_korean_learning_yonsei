#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Download a small set of irasutoya illustrations into assets/irasutoya/.

irasutoya is a Blogger site. Its /search page is not scriptable, but the GData
feed supports full-text search, so we go feed -> post -> first in-article PNG.

Illustrations on irasutoya are free to use (see www.irasutoya.com/p/terms.html);
we keep them locally rather than hot-linking.
"""
import json, os, re, sys, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'irasutoya')
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'}

PAIRS = [
    ('greeting', 'お辞儀'), ('greet2', 'あいさつ'), ('school', '学校'),
    ('family', '家族団らん'), ('family2', 'お母さん'), ('food', 'ご飯'),
    ('shopping', 'スーパーマーケット'), ('shopping2', 'レジ'), ('phone', '電話をかける'),
    ('weather', '天気'), ('weather2', '天気予報'), ('train', '電車に乗る'),
    ('study', '勉強'), ('study2', '図書館'), ('teacher', '先生'),
    ('student', '学生'), ('korea', '韓国'), ('calendar', 'カレンダー'),
    ('cafe', '喫茶店'), ('travel', '旅行'), ('people', '人々'),
    ('hospital', '病院'), ('cooking', '食べる'), ('season', '四季'),
    ('station', '駅'), ('market', '商店街'), ('home', '一戸建て'),
    ('map', '地図'), ('clock', '時計'), ('classroom', '教室'),
    ('restaurant', '食堂'), ('subway', '地下鉄'), ('smile', '笑顔'),
    ('sports', '運動'), ('music', '音楽'), ('movie', '映画'),
    ('birthday', '誕生日'), ('holiday', '休日'), ('spring', '春'),
    ('summer', '夏'), ('autumn', '秋'), ('winter', '冬'),
    ('airport', '空港'), ('bus', 'バス'), ('taxi', 'タクシー'),
    ('book', '本'), ('letter', '手紙'), ('party', 'パーティー'),
    # everyday objects: a word page needs a picture of the THING, and the first
    # round of themes only covered broad situations
    ('umbrella', '傘'), ('bag', 'かばん'), ('bicycle', '自転車'),
    ('glasses', '眼鏡'), ('hat', '帽子'), ('shoes', '靴'),
    ('watch', '腕時計'), ('desk', '机'), ('chair', '椅子'),
    ('computer', 'パソコン'), ('camera', 'カメラ'), ('key', '鍵'),
    ('gift', 'プレゼント'), ('flower', '花'), ('dog', '犬'),
    ('cat', '猫'), ('window', '窓'), ('door', 'ドア'),
    ('money', 'お金'), ('ticket', '切符'), ('passport', 'パスポート'),
    ('medicine', '薬'), ('bread', 'パン'), ('fruit', '果物'),
    ('coffee', 'コーヒー'), ('water', '水'), ('rice', 'ご飯茶碗'),
    ('pencil', '鉛筆'), ('notebook', 'ノート'), ('clothes', '服'),
    ('hair', '髪'), ('hand', '手'), ('weather3', '雨'),
    ('snow', '雪'), ('hot', '暑い'), ('cold', '寒い'),
]

BAD = re.compile(r'pyoko|navigation|default|icon|button|favicon|profile|comment|'
                 r'logo|banner|ad_|amazon|rakuten', re.I)
IMG = re.compile(r'https://blogger\.googleusercontent\.com/img/[^"\'\s]+?\.(?:png|jpg)')


def get(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=timeout).read()


def feed_urls(term, n=6):
    q = urllib.parse.quote(term)
    url = ('https://www.irasutoya.com/feeds/posts/default'
           f'?alt=json&max-results={n}&q={q}')
    try:
        data = json.loads(get(url).decode('utf-8', 'ignore'))
    except Exception as e:
        print(f'  ! feed failed for {term}: {e}')
        return []
    urls = []
    for entry in data.get('feed', {}).get('entry', []):
        for link in entry.get('link', []):
            if link.get('rel') == 'alternate':
                urls.append(link['href'])
                break
    return urls


def post_image(url):
    try:
        html = get(url).decode('utf-8', 'ignore')
    except Exception:
        return None
    for m in IMG.finditer(html):
        u = m.group(0)
        if BAD.search(u):
            continue
        return re.sub(r'/s\d+/', '/s400/', u)
    return None


def main():
    os.makedirs(OUT, exist_ok=True)
    got = 0
    for slug, term in PAIRS:
        n = 0
        for post in feed_urls(term):
            if n >= 2:
                break
            img = post_image(post)
            if not img:
                continue
            dest = os.path.join(OUT, f'{slug}-{n + 1}.png')
            try:
                blob = get(img)
                if len(blob) < 2000:
                    continue
                open(dest, 'wb').write(blob)
                print(f'  {slug}-{n + 1}  {len(blob) // 1024}KB  <- {post}')
                n += 1
                got += 1
            except Exception as e:
                print(f'  ! download failed {img}: {e}')
    print(f'--- {got} images in {OUT}')


if __name__ == '__main__':
    main()
