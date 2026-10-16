/* ------------------------------------------------------------------- anim
   Small motion helpers. Anything that only needs CSS lives in the stylesheet;
   these exist for the few cases where JS knows the value (a new score, a
   progress ring) and the change should be readable rather than instant. */
(function () {
  const YK = (window.YK = window.YK || {});

  const reduce = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  const still = () => reduce.matches;

  /* re-trigger a CSS animation class on an element */
  function replay(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;                 // force style flush so the class re-runs
    el.classList.add(cls);
  }

  /* number that counts up to its new value — used for the dashboard stats */
  function countUp(el, to, dur) {
    if (!el) return;
    const from = Number(el.dataset.value || 0);
    el.dataset.value = String(to);
    if (still() || from === to) { el.textContent = String(to); return; }
    const d = dur || 620;
    const t0 = performance.now();
    cancelAnimationFrame(el._raf);
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / d);
      const eased = 1 - Math.pow(1 - p, 3);          // ease-out cubic
      el.textContent = String(Math.round(from + (to - from) * eased));
      if (p < 1) el._raf = requestAnimationFrame(tick);
    };
    el._raf = requestAnimationFrame(tick);
  }

  /* progress bar driven by transform: scaleX — never touches layout */
  function bar(el, ratio) {
    if (!el) return;
    const r = Math.max(0, Math.min(1, ratio || 0));
    requestAnimationFrame(() => { el.style.transform = 'scaleX(' + r + ')'; });
  }

  /* circular progress (dash offset keeps it on the compositor) */
  function ring(svg, ratio) {
    if (!svg) return;
    const c = svg.querySelector('.val');
    if (!c) return;
    const r = Number(c.getAttribute('r')) || 0;
    if (!r) return;
    const circ = 2 * Math.PI * r;
    c.style.strokeDasharray = circ;
    c.style.strokeDashoffset = circ;
    requestAnimationFrame(() => {
      c.style.strokeDashoffset = String(circ * (1 - Math.max(0, Math.min(1, ratio || 0))));
    });
  }

  /* restart a stagger animation on a freshly rendered list */
  function stagger(container) {
    if (!container) return;
    container.classList.remove('stagger');
    void container.offsetWidth;
    container.classList.add('stagger');
  }

  /* scroll a view into sight without the browser's instant jump */
  function reveal(el, opts) {
    if (!el) return;
    el.scrollIntoView(Object.assign({
      behavior: still() ? 'auto' : 'smooth',
      block: 'center',
    }, opts || {}));
  }

  /* callbacks that must run once the view is actually in the document
     (measuring, animating, focusing) */
  const readyQueue = [];
  function onReady(fn) { readyQueue.push(fn); }
  function runReady(root) {
    const q = readyQueue.splice(0);
    for (const fn of q) { try { fn(root); } catch (e) { console.error(e); } }
  }

  YK.anim = { still, replay, countUp, bar, ring, stagger, reveal, onReady, runReady };
})();
