/* Real-browser interaction check: drives Edge through the popover flows that a
   jsdom test cannot fully prove (layout, paint, the actual click, dismissal).
   Run:  NODE_PATH=/tmp/yktest/node_modules node tools/browser-check.js [baseUrl] */
const puppeteer = require('puppeteer-core');
const BASE = process.argv[2] || 'http://127.0.0.1:8787';
const EDGE = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const fails = [];
  const ok = (name, cond, extra) => {
    console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond || !extra ? '' : '  — ' + extra));
    if (!cond) fails.push(name);
  };

  /* The first load of a cold browser is slow (fonts, 200+ local images), and a
     fixed short wait makes this suite flaky rather than informative. */
  async function go(hash) {
    await page.goto(BASE + '/index.html' + hash, { waitUntil: 'networkidle2', timeout: 45000 });
    await page.waitForFunction(() => window.YK && window.YK.router && window.YK.router.current(),
      { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 700));
  }

  const popState = () => page.evaluate(() => {
    const p = document.querySelector('#popLayer .pop');
    return p ? { connected: true, text: p.textContent.trim().slice(0, 40),
                 w: p.offsetWidth, h: p.offsetHeight,
                 left: p.style.left, top: p.style.top } : null;
  });
  const click = async (sel) => {
    await page.waitForSelector(sel, { timeout: 20000 });
    await page.click(sel);
    await new Promise((r) => setTimeout(r, 400));
  };

  console.log('查词页');
  await go('#/lookup?q=' + encodeURIComponent('저는 학생입니다.'));
  await page.waitForSelector('#view .tokcard', { timeout: 20000 });
  await page.click('#view .tokcard');
  await new Promise((r) => setTimeout(r, 500));
  let pop = await popState();
  ok('点词后弹窗仍存在', !!pop, JSON.stringify(pop));
  ok('弹窗有尺寸', !!pop && pop.w > 80 && pop.h > 60, pop && `${pop.w}x${pop.h}`);
  await page.screenshot({ path: '/tmp/shots/live-lookup-pop.png' });

  // click a different token: the popover should switch, not vanish
  const toks = await page.$$('#view .tokcard');
  if (toks[3]) {
    await toks[3].click();
    await new Promise((r) => setTimeout(r, 400));
    pop = await popState();
    ok('点另一个词弹窗切换', !!pop);
  }

  // outside click dismisses
  await page.mouse.click(1200, 900);
  await new Promise((r) => setTimeout(r, 400));
  pop = await popState();
  ok('点击外部后关闭', !pop);

  console.log('单词页');
  await go('#/vocab?l=1&mode=list');
  await page.waitForSelector('#view .word-row', { timeout: 20000 });
  await page.click('#view .word-row');
  await new Promise((r) => setTimeout(r, 500));
  pop = await popState();
  ok('单词行弹窗仍存在', !!pop, JSON.stringify(pop));
  await page.screenshot({ path: '/tmp/shots/live-vocab-pop.png' });

  console.log('课文页');
  await go('#/reading?l=1&s=1');
  await page.waitForSelector('#view .dlg__ko .w', { timeout: 20000 });
  const wordBox = await page.$eval('#view .dlg__ko .w', (el) => {
    const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  await page.mouse.click(wordBox.x + wordBox.w / 2, wordBox.y + wordBox.h / 2);
  await new Promise((r) => setTimeout(r, 500));
  pop = await popState();
  ok('课文点词弹窗仍存在', !!pop, JSON.stringify(pop));
  ok('弹窗在视口内', !!pop && parseFloat(pop.left) >= 0, pop && pop.left);
  await page.screenshot({ path: '/tmp/shots/live-reading-pop.png' });

  /* The grammar examples on the reading page used to be plain text, so the
     words in the very sentence being studied were the one place you could not
     tap. Checked in a real browser because tappability is the point. */
  console.log('课文页语法例句');
  await go('#/reading?l=1&s=2');
  const rg = await page.evaluate(() => {
    const el = document.querySelector('#view .gcard .gex__ko .w');
    if (!el) return { words: 0, hit: false };
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return { words: document.querySelectorAll('#view .gcard .gex__ko .w').length,
             hit: top === el, word: el.textContent };
  });
  ok('课文页语法例句被切成可点的词', rg.words > 0, JSON.stringify(rg));
  ok('语法例句里的词真的能点到', !!rg.hit, JSON.stringify(rg));

  console.log('词条页');
  await go('#/word?w=' + encodeURIComponent('배우다'));
  const wd = await page.evaluate(() => ({
    rows: document.querySelectorAll('#view .conj__row').length,
    ex: document.querySelectorAll('#view .gex').length,
  }));
  ok('词条页有十种变形', wd.rows === 10, String(wd.rows));
  ok('词条页有课文例句', wd.ex > 0, String(wd.ex));
  await click('#view .conj__morph');
  await new Promise((r) => setTimeout(r, 900));
  const anim = await page.evaluate(() => {
    const st = document.querySelector('#view .conj__stage');
    return {
      rows: st.querySelectorAll('.mrow').length,
      marked: st.querySelectorAll('.is-marked').length,
      added: st.querySelectorAll('.mflyer.is-add').length,
      ghosts: st.querySelectorAll('.mflyer.is-moving').length,
    };
  });
  ok('变形动画有两行词', anim.rows === 2, JSON.stringify(anim));
  ok('变化音节被框出', anim.marked > 0, JSON.stringify(anim));
  /* 배우다 -> 배웁니다 adds a 받침: it must drop in, not just appear */
  ok('新加的字母有滑入', anim.added > 0, JSON.stringify(anim));
  /* letters that keep their slot must NOT get a flyer ghost */
  ok('未移动的字母没有多余替身', anim.ghosts === 0, JSON.stringify(anim));
  await page.screenshot({ path: '/tmp/shots/live-word.png' });

  /* Matching "the same shape anywhere" once sent the ㅏ of 가다's 다 flying into
     the ㅏ of 않은 — a movement that means nothing. Only a 받침 becoming the next
     syllable's initial may travel. */
  console.log('变形：不能凭空搬家');
  await go('#/word?w=' + encodeURIComponent('가다'));
  const gRows = await page.$$('#view .conj__row');
  let negRow = null;
  for (const r of gRows) {
    const t = await page.evaluate((el) => el.querySelector('.conj__label').textContent, r);
    if (t.indexOf('-지 않아요') >= 0) { negRow = r; break; }
  }
  ok('找到「-지 않아요」一行', !!negRow);
  if (negRow) {
    await page.evaluate((el) => el.querySelector('.conj__morph').click(), negRow);
    await new Promise((r) => setTimeout(r, 1400));
    const n = await page.evaluate((el) => {
      const st = el.querySelector('.conj__stage');
      return { arrows: st.querySelectorAll('.marrow__path').length,
               movers: st.querySelectorAll('.mflyer.is-moving').length };
    }, negRow);
    ok('无关音节之间不产生搬家', n.arrows === 0 && n.movers === 0, JSON.stringify(n));
  }

  /* The hand-written banks had no lesson tags, so 제1과 served questions built
     from 제8과 vocabulary. Checked here rather than in jsdom, where the
     dictionary analyser does not behave the same. */
  console.log('练习：按课过滤');
  await go('#/practice?mode=particle&l=1');
  const pool = await page.evaluate(() => {
    const need = window.YK.views.practice.lessonNeeded;
    const asText = (v) => (Array.isArray(v) ? v.join('') : String(v == null ? '' : v));
    const banks = {
      particle: (q) => asText(q.s),
      conjugation: (q) => asText(q.s).split('+')[0],
      translate: (q) => asText(q.ko),
    };
    let late = 0, kept = 0, total = 0;
    for (const [mode, textOf] of Object.entries(banks)) {
      for (const q of window.YK_EXERCISES[mode].items) {
        total++;
        if (need(textOf(q)) > 1) late++; else kept++;
      }
    }
    return { late, kept, total };
  });
  ok('后面课次的题被识别出来', pool.late > 0, JSON.stringify(pool));
  ok('第1课只留已学过的题', pool.kept > 0 && pool.kept < pool.total, JSON.stringify(pool));

  console.log('布局');
  for (const [hash, name] of [['#/', '首页'], ['#/hangul', '字母'], ['#/phonetics', '音变'],
    ['#/grammar', '语法'], ['#/practice', '练习'], ['#/cast', '人物'],
    ['#/word?w=' + encodeURIComponent('좋다'), '词条'], ['#/conj', '变形表']]) {
    await go(hash);
    const info = await page.evaluate(() => ({
      h: document.documentElement.scrollHeight,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      title: document.getElementById('pageTitle').textContent,
    }));
    ok(`${name} 无横向溢出`, !info.overflow);
    ok(`${name} 有内容`, info.h > 600);
  }

  await browser.close();
  console.log('\n' + (fails.length ? `✗ ${fails.length} 项失败: ` + fails.join(', ') : '✓ 全部通过'));
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('运行失败:', e.message); process.exit(2); });
