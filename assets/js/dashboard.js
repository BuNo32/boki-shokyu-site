// content/assets/js/dashboard.js
async function renderDashboard(indexJsonPath, mountId) {
  const root = document.getElementById(mountId);
  if (!root) return;

  let idx;
  try {
    const res = await fetch(indexJsonPath, { cache: 'no-store' });
    idx = await res.json();
  } catch (e) {
    root.innerHTML = `<p style="color:red">ダッシュボードの読み込みに失敗：${e}</p>`;
    return;
  }

  const quizzes = idx.quizzes || [];
  const table = document.createElement('table');
  table.className = 'trial-balance';
  table.innerHTML = `<thead><tr><th>章 / セクション</th><th>進捗</th><th>達成率</th><th>リンク</th></tr></thead>`;
  const tbody = document.createElement('tbody');

  // 先頭スラッシュの絶対表記を現在パス相対に直す
  const toRel = (p) =>
    p && p.startsWith('/') ? location.pathname.replace(/[^/]+$/, '') + p.replace(/^\//, '') : p;

  for (const q of quizzes) {
    const keyBase = `quiz:${q.quizId}`;
    let score = Number(localStorage.getItem(`${keyBase}:score`) || 0);
    let total = Number(localStorage.getItem(`${keyBase}:total`) || 0);

    // 未訪問でも合計問数が分かるよう、JSON を読んで補完
    if (!total && q.file) {
      try {
        const base = q.basePath ? toRel(q.basePath) : '';
        const res = await fetch(base ? base + q.file : q.file, { cache: 'no-store' });
        const arr = await res.json();
        if (Array.isArray(arr)) total = arr.length;
      } catch (_) {
        void 0;
      }
    }

    const pct = total ? Math.round((100 * Math.min(score, total)) / total) : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align:left">${q.title || q.quizId}</td>
      <td>${score} / ${total || '?'}</td>
      <td>${pct}%</td>
      <td><a href="${q.page ? toRel(q.page) : '#'}">開く</a></td>`;
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  root.appendChild(table);
}
