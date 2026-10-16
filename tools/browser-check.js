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

  console.log('布局');
  for (const [hash, name] of [['#/', '首页'], ['#/hangul', '字母'], ['#/phonetics', '音变'],
    ['#/grammar', '语法'], ['#/practice', '练习'], ['#/cast', '人物']]) {
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
