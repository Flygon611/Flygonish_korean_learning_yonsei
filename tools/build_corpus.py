#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parse the cached 延世韩国语 1 lesson pages into a clean structured corpus.

Input : /tmp/ys/raw/*.html    (mirror pages, cached by tools/fetch_pages.sh)
Output: js/data/lessons.js    (window.YK_LESSONS = {...})

Nothing here runs at page load; this is a build-time helper.
"""
import re, html, json, glob, os, sys, collections

RAW_GLOB = sys.argv[1] if len(sys.argv) > 1 else '/tmp/ys/raw/*.html'
# "@tools/corpus-sources.txt" pins the exact set of mirror pages to use: the cache
# holds two different editions under identical titles, so "which files happen to
# be present" must not decide the output.
SOURCE_LIST = (sys.argv[1][1:] if len(sys.argv) > 1 and sys.argv[1].startswith('@') else None)
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'js', 'data', 'lessons.js')

# ---------------------------------------------------------------- text helpers

CJK = r'\u4e00-\u9fff\u3000-\u303f\uff00-\uffef'

def div_lines(raw_html):
    """Split the article into one logical line per <div>/<p>/<br>."""
    s = re.sub(r'<script.*?</script>', '', raw_html, flags=re.S)
    s = re.sub(r'<style.*?</style>', '', s, flags=re.S)
    s = re.sub(r'<(object|embed|audio)[^>]*>.*?</\1>', '', s, flags=re.S | re.I)
    # the article body is the reliable start marker: some mirror pages have no
    # 【课文原文】 label, the dialogue just opens the article div.
    s = re.sub(r'<div[^>]*id="article"[^>]*>', '\n@@ARTICLE@@\n', s, flags=re.I)
    s = re.sub(r'<br\s*/?>', '\n', s, flags=re.I)
    s = re.sub(r'</(div|p|li|h\d|td|tr)>', '\n', s, flags=re.I)
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s).replace('\u00a0', '  ')
    out = []
    for ln in s.split('\n'):
        ln = ln.strip()
        if not ln:
            continue
        if re.match(r'^(autostart|src=|style=|class=|width=|height=)', ln):
            continue
        out.append(ln)
    return out

NOISE = re.compile(r'^(上|下)一篇|^Tag\s*[:：]|^相关|^热点|^论坛|^第\s*\d+\s*节|'
                    r'^第\s*\d+\s*课|^延世韩国语|^\[|^←|^当前位置|^\d{4}-\d{2}-\d{2}|'
                    r'^发布时间|^来源|双击|进入韩语论坛|^\d+\s*/\s*\d+$')

def is_noise(line):
    return bool(NOISE.search(line)) or '延世韩国语新版' in line


def slice_between(lines, start, ends):
    try:
        i = next(k for k, l in enumerate(lines) if start in l)
    except StopIteration:
        return []
    out = []
    for l in lines[i + 1:]:
        if any(e in l for e in ends):
            break
        out.append(l)
    return out

def split_ko_zh(line):
    """'이를 닦다 刷牙' -> ('이를 닦다', '刷牙');  '잠 (睡)觉' -> ('잠', '(睡)觉')."""
    m = re.search('[' + CJK + ']', line)
    if not m:
        return line, ''
    i = m.start()
    left, right = line[:i], line[i:]
    t = re.search(r'[\s()\[\]（）【】·、,，]*$', left)
    if t and t.start() > 0:
        left, right = left[:t.start()], left[t.start():] + right
    return left.strip(), right.strip()

def norm(s):
    return re.sub(r'\s+', ' ', s).strip()

def looks_like_sentence(ko):
    """Is this the Korean half of an example, or a quoted word inside a Chinese
    explanation? Both split at the first Chinese character, so the shape of the
    Korean half has to decide:

        이 책이 사전입니까? 这本书是词典吗？   -> example
        “이다”不可以单独放在句子的末尾…        -> explanation (ko half is “이다”)
    """
    if not ko or not HANGUL.search(ko):
        return False
    if ko[0] in '\u201c\u201d"\'\u300c\u300e':
        return False
    return (' ' in ko.strip()) or ko.rstrip()[-1:] in '.!?'

HANGUL = re.compile(r'[\uac00-\ud7a3]')

# common sentence-initial words that must never be mistaken for a speaker label
NOT_A_NAME = {
    '네', '예', '아니요', '아니오', '여기', '저기', '거기', '오늘', '내일', '어제',
    '지금', '우리', '저는', '제가', '제', '이것', '그것', '저것', '무슨', '어떤',
    '어디', '언제', '누구', '얼마', '몇', '그럼', '그래서', '그리고', '하지만',
    '그런데', '그러면', '잘', '아주', '많이', '조금', '정말', '진짜', '감사합니다',
    '미안합니다', '실례합니다', '안녕하세요', '안녕하십니까', '죄송합니다',
    '괜찮아요', '이거', '그거', '저거', '이분', '그분', '저분', '이쪽', '저쪽',
    '한국', '중국', '일본', '미국', '학생', '선생님', '회사원', '저도', '저희',
}
CAST = ['제임스', '리에', '마리아', '웨이', '미선', '민철', '영수', '정희',
        '기사', '점원', '직원', '사장', '의사', '친구']


def heads_of(line):
    """Yield (head, rest) for 1..3 leading whitespace-separated tokens."""
    toks = re.split(r'\s+', line)
    for n in range(1, 4):
        if len(toks) <= n:
            break
        head = ''.join(toks[:n])
        rest = ' '.join(toks[n:])
        if re.fullmatch(r'[\uac00-\ud7a3]{1,3}', head) and HANGUL.search(rest):
            yield head, rest


def detect_speakers(ko_lines):
    """A speaker is a short hangul head that opens at least two lines."""
    counts = collections.Counter()
    for ln in ko_lines:
        for head, _ in heads_of(ln):
            counts[head] += 1
    return {h for h, c in counts.items() if c >= 2 and h not in NOT_A_NAME}


def split_speaker(line, speakers):
    """Return (speaker_or_None, sentence). Prefer the longest plausible head."""
    toks = re.split(r'\s+', line)
    best = None
    for n in range(1, 4):
        if len(toks) <= n:
            break
        head = ''.join(toks[:n])
        if not re.fullmatch(r'[\uac00-\ud7a3]{1,3}', head):
            break
        if head in speakers or head in CAST:
            best = (head, ' '.join(toks[n:]))
    if best and best[1].strip():
        return best
    return None, line


def strip_zh_name(zh, speaker):
    """'정 희' + '政 喜 你每天...' -> '你每天...'

    The mirror splits some name syllables with spaces, and the Chinese
    transliteration does not always have the same length as the Korean name
    ('리에' 2 syllables vs '理惠' 2 chars, but '웨이' 2 syllables vs '伟' 1 char).
    So consume whole CJK runs while they fit inside the Korean name length.
    """
    if not speaker:
        return zh
    toks, want, got, i = re.split(r'\s+', zh), len(speaker), 0, 0
    while i < len(toks):
        t = toks[i]
        if t and all('\u4e00' <= c <= '\u9fff' for c in t) and got + len(t) <= want:
            got += len(t)
            i += 1
            continue
        break
    if got == 0:
        return zh
    return ''.join(toks[i:]).strip() or zh


# ---------------------------------------------------------------- dialogue

def parse_dialogue(raw_lines):
    # keep korean lines and the chinese lines that translate them
    lines = [l for l in raw_lines
             if (HANGUL.search(l) or re.search('[' + CJK + ']', l))
             and '【' not in l and not is_noise(l)]
    speakers = detect_speakers([l for l in lines if HANGUL.search(l)])
    entries, i = [], 0
    while i < len(lines):
        ln = lines[i]
        if not HANGUL.search(ln):
            i += 1
            continue
        nxt = lines[i + 1] if i + 1 < len(lines) else ''
        has_zh = bool(nxt) and not HANGUL.search(nxt) and bool(re.search('[' + CJK + ']', nxt))
        # a heading line such as "4 과일 가게 앞에 세워 주십시오"
        if re.match(r'^\d+\s', ln) and has_zh:
            entries.append({'type': 'heading',
                            'ko': norm(re.sub(r'^\d+\s*', '', ln)),
                            'zh': norm(re.sub(r'^\d+\s*', '', nxt))})
            i += 2
            continue
        sp, ko = split_speaker(ln, speakers)
        zh = strip_zh_name(norm(nxt), sp) if (has_zh and sp) else (norm(nxt) if has_zh else '')
        entries.append({'type': 'line', 'speaker': sp, 'ko': norm(ko), 'zh': zh})
        i += 2 if has_zh else 1
    return entries


# ---------------------------------------------------------------- vocab / grammar

def parse_vocab(lines):
    out = []
    for ln in lines:
        if not HANGUL.search(ln) or is_noise(ln):
            continue
        ko, zh = split_ko_zh(ln)
        if ko and zh and len(ko) < 30:
            out.append({'ko': norm(ko), 'zh': norm(zh)})
    return out

# the number must be a label prefix ('01 -고', '1. 에 ~쯤'), never a counter
# glued to a noun ('1년 전에', '10분 전에') -- those are example sentences.
NUM_HEAD = re.compile(r'^(\d{1,2})(?:\s*[.)]\s*|\s+)(\S.*)$')
DASH_HEAD = re.compile(r'^([-~][^\s].*)$')
NUM_POINT = re.compile(r'^(\d{1,2})\s*[.、)]\s*(.+)$')
# a sub-point can also be a lone starred label: "*이" / "*그" / "*저"
STAR_POINT = re.compile(r'^\*\s*(\S{1,6})\s*$')
# "나--＞내+가  내가 말했습니다. 我说了。" is a form note, not an example
FORM_NOTE = re.compile(r'(--?[>＞]|→|⇒)')

def is_grammar_head(ln):
    """A block opener is short: a numbered label or a '-pattern'."""
    if len(ln) > 34 or any(c in ln for c in '。，；：？！'):
        return False
    m = NUM_HEAD.match(ln)
    if m:
        rest = m.group(2).strip()
        # "1. 에 ~쯤", "02 ㅂ特殊音变" are labels;
        # "10분 전에 전화가 왔어요." is an example sentence that merely starts with a digit
        # example sentences may start with a number ("10분 전에 ...") -- a label
        # either has no internal space or does not read as a full clause
        return len(rest.split(' ')) <= 4
    return bool(DASH_HEAD.match(ln))

def grammar_head_pattern(ln):
    m = NUM_HEAD.match(ln)
    return (m.group(2) if m else ln).strip()

def parse_grammar(lines):
    """Split a grammar block into its numbered sub-points.

    The textbook explains a pattern in up to three numbered points, and EACH
    point has its own 例句 list:

        -은/는
        1. 用于体词后面的助词…          <- point 1 explanation
        例句： 서울은 한국의 수도입니다…
        2. 有时，表示对比或强调。        <- point 2 explanation
        例句： 동생은 키가 큽니다…
        3. “은/는”可以和所有助词结合…    <- point 3 explanation
        例句： 도서관에는 언제 갔습니까?

    Treating the body as one flat "explain + examples" pair swallowed points 2
    and 3: point 3 was spliced into an example whose Korean half read
    `3. “은/는”`. Hence the sub-points.
    """
    blocks, cur = [], None
    for ln in lines:
        if is_grammar_head(ln):
            if cur:
                blocks.append(cur)
            cur = {'pattern': grammar_head_pattern(ln), 'body': []}
        elif cur is not None:
            cur['body'].append(ln)
        else:
            cur = {'pattern': '', 'body': [ln]}
    if cur:
        blocks.append(cur)

    out = []
    for b in blocks:
        segments, lead = [], {'n': None, 'label': None, 'explain': [], 'ex': [], 'seen_ex': False}
        active = lead
        for ln in b['body']:
            m = NUM_POINT.match(ln)
            star = STAR_POINT.match(ln)
            if star:
                segments.append(active)
                active = {'n': None, 'label': star.group(1), 'explain': [], 'ex': [], 'seen_ex': False}
                continue
            if m and re.search('[' + CJK + ']', m.group(2)):
                segments.append(active)
                active = {'n': int(m.group(1)), 'label': None,
                          'explain': [m.group(2)], 'ex': [], 'seen_ex': False}
                continue
            if FORM_NOTE.search(ln):
                # a note about how a form is built, not a sentence to learn
                active['explain'].append(ln)
                continue
            lbl = re.match(r'^例\s*句\s*[:：]?', ln)
            if lbl:
                active['seen_ex'] = True
                rest = re.sub(r'^例\s*句\s*[:：]?', '', ln).strip()
                if rest:
                    active['ex'].append(rest)
                continue
            # Some blocks (e.g. -이/그/저) have no 例句 label at all: a line that
            # splits cleanly into Korean + Chinese IS an example.
            ko, zh = split_ko_zh(ln)
            if ko and zh and looks_like_sentence(ko):
                active['seen_ex'] = True
                active['ex'].append(ln)
                continue
            if not active['seen_ex'] and HANGUL.search(ln) and not re.search('[' + CJK + ']', ln):
                # otherwise examples start at the first korean-only line
                active['seen_ex'] = True
            (active['ex'] if active['seen_ex'] else active['explain']).append(ln)
        segments.append(active)

        points = []
        for seg in segments:
            ex = pairs_to_examples(seg['ex'])
            text = norm(' '.join(seg['explain']))
            if not text and not ex:
                continue
            points.append({'n': seg['n'], 'label': seg.get('label'),
                           'explain': text, 'examples': ex})

        pattern = b['pattern']
        all_ex = [e for pt in points for e in pt['examples']]
        out.append({
            'pattern': re.sub(r'\d+$', '', pattern).strip() or pattern,
            'explain': norm(' '.join(pt['explain'] for pt in points if pt['explain'])),
            'points': points,
            'examples': all_ex,
        })
    return [b for b in out if b['pattern'] or b['examples']]


def pairs_to_examples(lines):
    ex, i = [], 0
    while i < len(lines):
        ln = lines[i]
        nxt = lines[i + 1] if i + 1 < len(lines) else ''
        # korean on one line, translation on the next
        if (HANGUL.search(ln) and not re.search('[' + CJK + ']', ln)
                and nxt and not HANGUL.search(nxt) and re.search('[' + CJK + ']', nxt)):
            ex.append({'ko': norm(ln), 'zh': norm(nxt)})
            i += 2
            continue
        ko, zh = split_ko_zh(ln)
        if ko and zh and HANGUL.search(ko):
            ex.append({'ko': norm(ko), 'zh': norm(zh)})
        i += 1
    return ex

def parse_culture(lines):
    """'【제임스가 본 한국】---詹姆斯眼中的韩国' culture columns (lessons 6-8 s5)."""
    for i, l in enumerate(lines):
        if re.match(r'^【.*가 본 한국.*】', l):
            title = re.sub(r'^【(.*?)】.*$', r'\1', l).strip()
            zh_title = l.split('---')[-1].strip() if '---' in l else ''
            paras = []
            for x in lines[i + 1:]:
                if '轻松学韩语' in x or x.startswith('Tag'):
                    break
                if not is_noise(x) and not HANGUL.search(x) and len(x) > 20:
                    paras.append(x)
            if paras:
                return {'title': title, 'zhTitle': zh_title, 'paras': paras}
    return None


# ---------------------------------------------------------------- lessons

LESSON_TITLES = {
    1: ('인사', '问候'),
    2: ('학교와 집', '学校和家'),
    3: ('가족과 친구', '家人和朋友'),
    4: ('음식', '饮食'),
    5: ('하루 생활', '一天的生活'),
    6: ('물건 사기', '购物'),
    7: ('교통', '交通'),
    8: ('전화', '电话'),
    9: ('날씨와 계절', '天气和季节'),
    10: ('휴일과 방학', '节假日'),
}

TITLE_RE = re.compile(r'延世韩国语新版1\s*第\s*(\d+)\s*课\s*[- ]?\s*([^_]*?)\s*(\d)?\s*_延世')

def repair_merged_vocab(out):
    """Split vocabulary rows the parser merged together.

    A meaning cell that spanned into the next row produced entries like
    아버지 | 爸爸 어머니 妈妈 and the word 어머니 disappeared entirely. Each such
    gloss has one shape — Chinese text, a Hangul word, that word's own gloss —
    so it can be split and the lost word restored.
    """
    import re as _re
    split = _re.compile(r'^([^\uac00-\ud7af]*?)\s*([\uac00-\ud7af]+)\s*(.*)$')
    fixed = 0
    for lesson in out.get('lessons', []):
        for sec in lesson.get('sections', []):
            rows, changed = [], False
            for v in sec.get('vocab', []):
                zh, ko = v.get('zh') or '', v.get('ko') or ''
                while True:
                    m = split.match(zh)
                    if not m or not m.group(1).strip():
                        rows.append({'ko': ko, 'zh': zh})
                        break
                    changed = True
                    fixed += 1
                    rows.append({'ko': ko, 'zh': m.group(1).strip()})
                    ko, zh = m.group(2), m.group(3).strip()
            if changed:
                sec['vocab'] = rows
    return fixed


def main():
    best = {}
    if SOURCE_LIST:
        base = os.path.dirname(os.path.abspath(__file__))
        names = [l.strip() for l in open(os.path.join(base, os.path.basename(SOURCE_LIST)), encoding='utf-8')
                 if l.strip() and not l.startswith('#')]
        files = ['/tmp/ys/raw/' + n for n in names]
    else:
        files = glob.glob(RAW_GLOB)
    for fn in sorted(files, key=lambda f: int(re.sub(r'\D', '', os.path.basename(f)) or 0)):
        raw = open(fn, 'rb').read()
        if len(raw) < 3000:
            continue
        s = None
        for enc in ('utf-8', 'gbk'):
            try:
                s = raw.decode(enc); break
            except Exception:
                pass
        if s is None:
            s = raw.decode('gbk', 'ignore')
        t = re.search(r'<title>(.*?)</title>', s, re.S)
        title = html.unescape(t.group(1)) if t else ''
        m = TITLE_RE.search(title)
        if not m:
            continue
        lesson = int(m.group(1))
        sec = int(m.group(3)) if m.group(3) else 1
        lines = div_lines(s)
        flat = ' '.join(lines)
        if '【课文原文】' in flat:
            head = slice_between(lines, '【课文原文】', ['【单词学习】', '【语法学习】'])
        else:
            head = slice_between(lines, '@@ARTICLE@@', ['【单词学习】', '【语法学习】'])
        vocab = slice_between(lines, '【单词学习】', ['【语法学习】'])
        gram = slice_between(lines, '【语法学习】', ['轻松学韩语', 'Tag：', 'Tag:', '[挑错]'])
        if not head:
            continue
        culture = parse_culture(lines)
        rec = {
            'lesson': lesson, 'section': sec,
            'culture': culture,
            'dialogue': parse_dialogue(head),
            'vocab': parse_vocab(vocab),
            'grammar': parse_grammar(gram),
            'src': os.path.basename(fn),
        }
        key = (lesson, sec)
        score = len(json.dumps(rec, ensure_ascii=False))
        if key not in best or score > best[key][0]:
            best[key] = (score, rec)
    lessons = {}
    for (lesson, sec), (_, rec) in sorted(best.items()):
        lessons.setdefault(lesson, []).append(rec)
    out = {
        'meta': {
            'title': '延世韩国语 1',
            'source': '沪江韩语 / kr.tingroom.com 镜像',
            'note': '仅供个人学习使用',
        },
        'lessons': [
            {'no': no, 'ko': LESSON_TITLES.get(no, ('', ''))[0],
             'zh': LESSON_TITLES.get(no, ('', ''))[1], 'sections': secs}
            for no, secs in sorted(lessons.items())
        ],
    }
    with open(OUT, 'w', encoding='utf-8') as f:
        repair_merged_vocab(out)
        f.write('/* generated by tools/build_corpus.py -- do not edit by hand */\n')
        f.write('window.YK_LESSONS = ')
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')
    # report
    n_v = sum(len(s['vocab']) for l in out['lessons'] for s in l['sections'])
    n_g = sum(len(s['grammar']) for l in out['lessons'] for s in l['sections'])
    n_d = sum(len(s['dialogue']) for l in out['lessons'] for s in l['sections'])
    print(f'lessons: {len(out["lessons"])}')
    for l in out['lessons']:
        print('  %2d %-14s %-10s sections=%d dialogue=%2d vocab=%3d grammar=%d' % (
            l['no'], l['ko'], l['zh'], len(l['sections']),
            sum(len(s['dialogue']) for s in l['sections']),
            sum(len(s['vocab']) for s in l['sections']),
            sum(len(s['grammar']) for s in l['sections'])))
    print(f'total dialogue={n_d} vocab={n_v} grammar={n_g}')
    print('written ->', OUT)

if __name__ == '__main__':
    main()
