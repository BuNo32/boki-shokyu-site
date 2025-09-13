// PATCH for content/assets/js/quiz.js: record updatedAt when score increments
(function () {
  const orig = window.loadQuiz;
  if (typeof orig !== 'function') return;
  window.loadQuiz = function (jsonPath, mountId, options) {
    const wrapped = options || {};
    const keyBase = wrapped.quizId ? `quiz:${wrapped.quizId}` : null;

    function stamp() {
      if (!keyBase) return;
      try {
        localStorage.setItem(`${keyBase}:updatedAt`, String(Date.now()));
      } catch (_) {
        void 0;
      }
    }

    // Monkey-patch score increment inside result handling by wrapping console.log
    // Since we cannot easily hook the internal increment from here,
    // we re-wrap after a microtask to find buttons and hook success messages.
    const p = orig.apply(window, arguments);
    Promise.resolve().then(() => {
      // Observe DOM changes under mount to catch "✅ 正解！" and then stamp time.
      const el = document.getElementById(mountId);
      if (!el) return;
      const mo = new MutationObserver((mut) => {
        for (const m of mut) {
          if (m.type === 'childList') {
            // heuristic: when feedback text contains "正解" we stamp
            el.querySelectorAll('.fb').forEach((fb) => {
              if (/\u6b63\u89e3/.test(fb.textContent || '')) stamp(); // "正解"
            });
          }
        }
      });
      mo.observe(el, { childList: true, subtree: true, characterData: true });
    });
    return p;
  };
})();
