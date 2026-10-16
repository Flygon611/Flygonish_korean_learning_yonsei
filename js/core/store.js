/* ------------------------------------------------------------------ store
   Everything the user accumulates lives in one localStorage blob: which words
   they know, which words they starred, which sections they read, and how they
   did on quizzes. Nothing leaves the browser. */
(function () {
  const YK = (window.YK = window.YK || {});
  const KEY = 'yk1.progress.v1';

  const blank = () => ({
    v: 1,
    known: {},      // word -> 1
    fav: {},        // word -> 1
    read: {},       // "lesson-section" -> timestamp
    quiz: {},       // mode -> { seen, right }
    days: {},       // "YYYY-MM-DD" -> answers that day
    streak: 0,
    lastDay: '',
    lastRoute: '#/',
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const parsed = JSON.parse(raw);
      return Object.assign(blank(), parsed);
    } catch (e) { return blank(); }
  }

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota / private mode */ }
    }, 120);
  }

  const todayKey = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };

  const dayDiff = (a, b) => {
    if (!a || !b) return 99;
    const ms = new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00');
    return Math.round(ms / 86400000);
  };

  const api = {
    all: () => state,

    bumpStreak() {
      const t = todayKey();
      if (state.lastDay === t) return;
      state.streak = dayDiff(state.lastDay, t) === 1 ? state.streak + 1 : 1;
      state.lastDay = t;
      save();
    },

    isKnown: (w) => !!state.known[w],
    markKnown(w, on) {
      if (on === false) delete state.known[w]; else state.known[w] = 1;
      save();
    },
    toggleKnown(w) { api.markKnown(w, !state.known[w]); return !!state.known[w]; },
    knownCount: () => Object.keys(state.known).length,

    isFav: (w) => !!state.fav[w],
    toggleFav(w) {
      if (state.fav[w]) delete state.fav[w]; else state.fav[w] = 1;
      save(); return !!state.fav[w];
    },
    favCount: () => Object.keys(state.fav).length,

    markRead(lesson, section) {
      state.read[lesson + '-' + section] = Date.now();
      save();
    },
    isRead: (lesson, section) => !!state.read[lesson + '-' + section],
    readCount: () => Object.keys(state.read).length,

    recordQuiz(mode, right) {
      const q = state.quiz[mode] || (state.quiz[mode] = { seen: 0, right: 0 });
      q.seen++; if (right) q.right++;
      const t = todayKey();
      state.days[t] = (state.days[t] || 0) + 1;
      api.bumpStreak();
      save();
    },
    quizStats() {
      let seen = 0, right = 0;
      for (const k in state.quiz) { seen += state.quiz[k].seen; right += state.quiz[k].right; }
      return { seen, right, modes: state.quiz };
    },
    todayCount: () => state.days[todayKey()] || 0,
    streak: () => state.streak,

    setLastRoute(r) { state.lastRoute = r; save(); },
    lastRoute: () => state.lastRoute || '#/',

    reset() { state = blank(); save(); },
  };

  YK.store = api;
})();
