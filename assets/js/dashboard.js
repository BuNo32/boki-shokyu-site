// content/assets/js/dashboard.js (v2: Pages-safe links, History, Reset)
async function renderDashboard(indexJsonPath, mountId) {
  const root = document.getElementById(mountId);
  if (!root) return;

  // --- helper: resolve path under GitHub Pages subpath (/<repo>/...) ---
  function repoRoot() {
    // e.g. /boki-shokyu-site/ from /boki-shokyu-site/prototypes/dashboard.html
    const segs = location.pathname.split('/').filter(Boolean);
    return segs.length ? '/' + segs[0] + '/' : '/';
  }
  function sitePath(p) {
    if (!p) return '';
    if (/^https?:\/\//.test(p)) return p;
    const root = repoRoot();
    if (p.startsWith('/')) {
      // ensure it starts with /<repo>/
      return p.startsWith(root) ? p : root + p.replace(/^\//, '');
    }
    // treat as site-root relative if it's not starting with './' or '../'
    //  - 'ch05/99-quiz.html' -> '/<repo>/ch05/99-quiz.html'
    //  - 'prototypes/quiz-sample.html' -> '/<repo>/prototypes/quiz-sample.html'
    if (!p.startsWith('./') && !p.startsWith('../')) {
      return root + p.replace(/^\/+/, '');
    }
    // otherwise, resolve against current path (rare)
    const a = document.createElement('a');
    a.href = p;
    return a.pathname;
  }

  // --- load index.json ---
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
  table.innerHTML = `<thead><tr>
    <th style="text-align:left">章 / セクション</th>
    <th>進捗</th><th>達成率</th><th>最終更新</th><th>操作</th></tr></thead>`;
  const tbody = document.createElement('tbody');

  function lsKey(qid, suffix) {
    return `quiz:${qid}${suffix ? ':' + suffix : ''}`;
  }
  function fmtDate(ms) {
    if (!ms) return '-';
    const d = new Date(Number(ms));
    const z = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
  }
  function clearProgress(quizId) {
    localStorage.removeItem(lsKey(quizId, 'score'));
    localStorage.removeItem(lsKey(quizId, 'total'));
    localStorage.removeItem(lsKey(quizId, 'updatedAt'));
  }

  // Top-level clear all
  const controls = document.createElement('div');
  const btnAll = document.createElement('button');
  btnAll.textContent = 'すべての進捗をリセット（この端末のみ）';
  btnAll.onclick = () => {
    if (!confirm('この端末の学習進捗（全クイズ）をリセットしますか？')) return;
    const keys = Object.keys(localStorage);
    keys.forEach((k) => {
      if (k.startsWith('quiz:')) localStorage.removeItem(k);
    });
    location.reload();
  };
  controls.appendChild(btnAll);
  root.appendChild(controls);

  for (const q of quizzes) {
    const qid = q.quizId;
    const keyScore = Number(localStorage.getItem(lsKey(qid, 'score')) || 0);
    let total = Number(localStorage.getItem(lsKey(qid, 'total')) || 0);
    let updatedAt = localStorage.getItem(lsKey(qid, 'updatedAt'));

    // Try to infer total if missing
    let jsonUrl = '';
    try {
      const base = q.basePath ? sitePath(q.basePath) : '';
      jsonUrl = base ? base.replace(/\/?$/, '/') + q.file : sitePath(q.file);
      if (!total) {
        const res = await fetch(jsonUrl, { cache: 'no-store' });
        const arr = await res.json();
        if (Array.isArray(arr)) total = arr.length;
      }
    } catch (_) {
      void 0;
    }

    const pct = total ? Math.round((100 * Math.min(keyScore, total)) / total) : 0;

    const tr = document.createElement('tr');
    const pageHref = sitePath(q.page || '#');

    const tdTitle = document.createElement('td');
    tdTitle.style.textAlign = 'left';
    tdTitle.textContent = q.title || q.quizId;
    const tdProg = document.createElement('td');
    tdProg.textContent = `${keyScore} / ${total || '?'}`;
    const tdPct = document.createElement('td');
    tdPct.textContent = `${pct}%`;
    const tdUpd = document.createElement('td');
    tdUpd.textContent = fmtDate(updatedAt);

    const tdOps = document.createElement('td');
    const aOpen = document.createElement('a');
    aOpen.href = pageHref;
    aOpen.textContent = '開く';
    const btnInfo = document.createElement('button');
    btnInfo.textContent = '詳細';
    const btnReset = document.createElement('button');
    btnReset.textContent = 'リセット';

    btnInfo.onclick = async () => {
      alert(
        [
          `クイズID: ${qid}`,
          `進捗: ${keyScore} / ${total || '?'}（${pct}%）`,
          `最終更新: ${fmtDate(updatedAt)}`,
          jsonUrl ? `問題データ: ${jsonUrl}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      );
    };
    btnReset.onclick = () => {
      if (!confirm(`${q.title || qid} の進捗をリセットしますか？（この端末のみ）`)) return;
      clearProgress(qid);
      location.reload();
    };

    tdOps.appendChild(aOpen);
    tdOps.appendChild(document.createTextNode(' / '));
    tdOps.appendChild(btnInfo);
    tdOps.appendChild(document.createTextNode(' / '));
    tdOps.appendChild(btnReset);

    tr.appendChild(tdTitle);
    tr.appendChild(tdProg);
    tr.appendChild(tdPct);
    tr.appendChild(tdUpd);
    tr.appendChild(tdOps);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  root.appendChild(table);
}
