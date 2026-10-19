/* Renders the teaching clusters described in js/data/clusters.js.
 *
 * Five shapes, because the vocabulary groups themselves fall into five kinds:
 * a pattern (hada), a picture (scene), a pair (pairs), a list (grid), a line
 * (scale). Keeping the shapes few is what makes the same block reusable when a
 * later lesson teaches the same pattern again.
 */
(function () {
  var YK = window.YK = window.YK || {};
  var h = YK.h;

  function popFor(node, ko, zh) {
    node.addEventListener('click', function (e) {
      e.stopPropagation();
      var hit = YK.dict.lookup(ko);
      YK.ui.popover(node, YK.ui.wordPop(hit ? hit.entry : { ko: ko, zh: zh }, ko,
        null, hit && hit.entries));
    });
    return node;
  }

  function art(ko) {
    var pic = (window.YK_PICTO || {})[ko];
    return pic ? h('img', { class: 'cl__img', src: pic, alt: '', loading: 'lazy' }) : null;
  }

  /* ------------------------------------------------------------- kinds */

  function hadaBlock(c) {
    return h('table', { class: 'cl__table cl__table--hada' },
      h('thead', {}, h('tr', {},
        h('th', {}, '名词'), h('th', {}, '意思'), h('th', {}, '+ 하다'), h('th', {}, '意思'))),
      h('tbody', {}, c.rows.map(function (r) {
        return h('tr', {},
          h('td', { class: 'cl__ko' }, r[0]), h('td', { class: 'cl__zh' }, r[1]),
          h('td', { class: 'cl__ko cl__ko--verb' }, r[2]), h('td', { class: 'cl__zh' }, r[3]));
      })));
  }

  function pairsBlock(c) {
    return h('table', { class: 'cl__table cl__table--pairs' },
      h('tbody', {}, c.rows.map(function (r) {
        return h('tr', {},
          h('td', { class: 'cl__ko' }, r[0]), h('td', { class: 'cl__zh' }, r[1]),
          h('td', { class: 'cl__arrow' }, '⇄'),
          h('td', { class: 'cl__ko' }, r[2]), h('td', { class: 'cl__zh' }, r[3]));
      })));
  }

  function gridBlock(c) {
    return h('table', { class: 'cl__table cl__table--grid' },
      h('thead', {}, h('tr', {}, c.head.map(function (x) { return h('th', {}, x); }))),
      h('tbody', {}, c.rows.map(function (r) {
        return h('tr', {}, r.map(function (cell, i) {
          return h('td', { class: i === 0 ? 'cl__ko' : '' }, cell);
        }));
      })));
  }

  function scaleBlock(c) {
    var nodes = [];
    c.steps.forEach(function (s, i) {
      if (i) nodes.push(h('span', { class: 'cl__scale-arrow' }, '→'));
      nodes.push(popFor(h('span', { class: 'cl__step' },
        h('span', { class: 'cl__ko' }, s[0]),
        h('span', { class: 'cl__zh' }, s[1])), s[0], s[1]));
    });
    return h('div', { class: 'cl__scale' }, nodes);
  }

  function sceneBlock(c) {
    return h('div', { class: 'cl__scene' },
      h('img', { class: 'cl__scene-bg', src: c.scene, alt: '' }),
      c.items.map(function (it) {
        var chip = h('div', { class: 'cl__pt' + (c.compact ? ' cl__pt--compact' : '') },
          art(it.ko),
          h('span', { class: 'cl__pt-ko' }, it.alt ? it.ko + ' · ' + it.alt : it.ko),
          h('span', { class: 'cl__pt-zh' }, it.zh));
        chip.style.left = it.x + '%';
        chip.style.top = it.y + '%';
        return popFor(chip, it.ko, it.zh);
      }));
  }

  var KINDS = { hada: hadaBlock, pairs: pairsBlock, grid: gridBlock, scale: scaleBlock, scene: sceneBlock };

  /* ------------------------------------------------------------ public */

  function render(lessonNo, sectionNo) {
    var list = (window.YK_CLUSTERS || []).filter(function (c) {
      return c.lesson === lessonNo && c.section === sectionNo;
    });
    if (!list.length) return null;
    return h('div', { class: 'cl' }, list.map(function (c) {
      var build = KINDS[c.kind];
      if (!build) return null;
      return h('section', { class: 'card cl__card' + (c.kind === 'scene' ? ' cl__card--scene' : '') },
        h('div', { class: 'cl__title' }, c.title),
        c.note ? h('p', { class: 'cl__note' }, c.note) : null,
        build(c));
    }));
  }

  YK.clusters = { render: render };
})();
