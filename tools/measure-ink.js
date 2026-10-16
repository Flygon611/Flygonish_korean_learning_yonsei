/* Regenerate the INK table in js/core/hangul-anim.js.

   The letter animation places each jamo in a slot the size it occupies in real
   Hangul. To do that it needs to know how much of its em box a glyph actually
   inks, and those numbers are not guessable: ㅇ inks 0.57x0.51 of its box while
   ㅏ inks 0.30x0.90 and ㅡ only 0.82x0.08. Guessing produced letters that
   overflowed one slot and floated in the middle of another.

   Run the local server first, then:
     node tools/measure-ink.js            # prints the table
   and paste the values into js/core/hangul-anim.js. */
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer-core');

const URL = process.env.YK_URL || 'http://127.0.0.1:8787/index.html';
const EDGE = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const JONG = 'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForFunction(() => window.YK && window.YK.jamo, { timeout: 20000 });

  const measured = await page.evaluate((sets) => {
    const FS = 200;
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 800;
    const ctx = canvas.getContext('2d');
    const font = getComputedStyle(document.documentElement).getPropertyValue('--font-ko') || 'sans-serif';

    function ink(ch) {
      ctx.clearRect(0, 0, 800, 800);
      ctx.font = FS + 'px ' + font;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(ch, 300, 500);
      const d = ctx.getImageData(0, 0, 800, 800).data;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let y = 0; y < 800; y++) {
        for (let x = 0; x < 800; x++) {
          if (d[(y * 800 + x) * 4 + 3] > 20) {
            if (x < x0) x0 = x; if (x > x1) x1 = x;
            if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
        }
      }
      if (x1 < 0) return null;
      return [Math.round(((x1 - x0 + 1) / FS) * 1000) / 1000,
              Math.round(((y1 - y0 + 1) / FS) * 1000) / 1000];
    }

    const out = {};
    for (const [role, chars] of sets) {
      out[role] = {};
      for (const ch of chars) if (!out[role][ch]) out[role][ch] = ink(ch);
    }
    return out;
  }, [['cho', CHO], ['jung', JUNG], ['jong', JONG]]);

  await browser.close();

  let pass = 0, fail = 0;
  for (const role of ['cho', 'jung', 'jong']) {
    console.log('  const ' + role + ' = {');
    const parts = Object.entries(measured[role])
      .filter(([, v]) => v)
      .map(([ch, v]) => `'${ch}':[${v[0].toFixed(3)},${v[1].toFixed(3)}]`);
    console.log('    ' + parts.join(',\n    '));
    console.log('  };');
  }

  // A glyph with no ink, or ink bigger than its em box, would break the layout.
  for (const role of ['cho', 'jung', 'jong']) {
    for (const [ch, v] of Object.entries(measured[role])) {
      if (!v) { fail++; console.log(`  ✗ ${role} ${ch}: no ink`); continue; }
      if (v[0] > 1 || v[1] > 1) { fail++; console.log(`  ✗ ${role} ${ch}: ink exceeds the em box`); continue; }
      pass++;
    }
  }
  console.log(`\n测到 ${pass} 个字形，异常 ${fail} 个`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(2); });
