// === 追加：科目データの読込 =========================================
async function loadAccounts(src) {
  if (!src) return null;
  try {
    const res = await fetch(src, { cache: 'no-store' });
    const data = await res.json();
    return data && Array.isArray(data.accounts) ? data.accounts : null;
  } catch (_) {
    return null;
  }
}

function makeAccountSelect(accounts, name) {
  const sel = document.createElement('select');
  sel.name = name;
  const opt0 = document.createElement('option');
  opt0.value = '';
  opt0.textContent = '（選択）';
  sel.appendChild(opt0);
  (accounts || []).forEach((a) => {
    const o = document.createElement('option');
    o.value = a;
    o.textContent = a;
    sel.appendChild(o);
  });
  return sel;
}

function readNumber(input) {
  const n = Number(String(input.value || '').replace(/,/g, ''));
  return isFinite(n) ? n : 0;
}

// === 修正：journal_input を 4列×2段UIで描画 =========================
async function renderJournal4col(qWrap, q, options) {
  const accounts = (options && options.accounts) ||
    (await loadAccounts(options && options.accountsSrc)) || [
      '現金',
      '普通預金',
      '当座預金',
      '定期預金',
      '売掛金',
      '買掛金',
      '受取利息',
      '支払手数料',
      '備品',
      '借入金',
      '売上',
      '仕入',
      '広告宣伝費',
      '資本金',
    ];

  const table = document.createElement('table');
  table.className = 'jrnl4';
  table.innerHTML = `
    <thead>
      <tr><th>借方科目</th><th>金額</th><th>貸方科目</th><th>金額</th></tr>
    </thead>
    <tbody>
      <tr>
        <td class="dr-acc"></td>
        <td><input name="dr_amt_1" type="number" min="0" step="1" inputmode="numeric"></td>
        <td class="cr-acc"></td>
        <td><input name="cr_amt_1" type="number" min="0" step="1" inputmode="numeric"></td>
      </tr>
      <tr>
        <td class="dr-acc"></td>
        <td><input name="dr_amt_2" type="number" min="0" step="1" inputmode="numeric"></td>
        <td class="cr-acc"></td>
        <td><input name="cr_amt_2" type="number" min="0" step="1" inputmode="numeric"></td>
      </tr>
    </tbody>`;

  // 科目セレクトを設置（借方2・貸方2）
  const accCells = table.querySelectorAll('.dr-acc, .cr-acc');
  accCells.forEach((cell, idx) => {
    const side = idx % 2 === 0 ? 'dr' : 'cr'; // 0:dr,1:cr,2:dr,3:cr
    const row = idx < 2 ? 1 : 2;
    const sel = makeAccountSelect(accounts, `${side}_acc_${row}`);
    cell.appendChild(sel);
  });

  // 合計の表示
  const totalBox = document.createElement('div');
  totalBox.className = 'jrnl4-total';
  totalBox.innerHTML = `合計チェック：<span class="dr">借方 0</span> / <span class="cr">貸方 0</span>`;
  function updateTotals() {
    const dr =
      readNumber(table.querySelector('input[name="dr_amt_1"]')) +
      readNumber(table.querySelector('input[name="dr_amt_2"]'));
    const cr =
      readNumber(table.querySelector('input[name="cr_amt_1"]')) +
      readNumber(table.querySelector('input[name="cr_amt_2"]'));
    totalBox.querySelector('.dr').textContent = `借方 ${dr.toLocaleString()}`;
    totalBox.querySelector('.cr').textContent = `貸方 ${cr.toLocaleString()}`;
  }
  table.addEventListener('input', updateTotals);

  qWrap.appendChild(table);
  qWrap.appendChild(totalBox);

  return { table, accounts };
}

// === 既存 loadQuiz を編集：journal_input で上のUIを使い、厳密採点に対応 ===
async function loadQuiz(jsonPath, mountId, options) {
  const el = document.getElementById(mountId);
  if (!el) {
    console.warn('mount element not found:', mountId);
    return;
  }

  let items;
  try {
    const res = await fetch(jsonPath, { cache: 'no-store' });
    items = await res.json();
  } catch (e) {
    el.innerHTML = `<p style="color:red">クイズの読み込みに失敗しました: ${e}</p>`;
    return;
  }
  if (!Array.isArray(items)) {
    el.textContent = 'クイズJSONは配列形式である必要があります。';
    return;
  }

  const keyBase =
    options && options.quizId ? `quiz:${options.quizId}` : location.pathname + ':' + mountId;
  let score = Number(localStorage.getItem(`${keyBase}:score`) || 0);
  const total = items.length;
  localStorage.setItem(`${keyBase}:total`, String(total));

  // 要約（スコアバー）
  const summary = document.createElement('div');
  const summaryText = document.createElement('div');
  const bar = document.createElement('div');
  bar.className = 'progress';
  const barInner = document.createElement('span');
  bar.appendChild(barInner);
  summary.appendChild(summaryText);
  summary.appendChild(bar);
  el.appendChild(summary);
  function updateSummary() {
    summaryText.textContent = `現在の正解数: ${score} / 全${total}問`;
    barInner.style.width = `${Math.round((100 * Math.min(score, total)) / Math.max(total, 1))}%`;
  }
  updateSummary();

  items.forEach(async (q, i) => {
    const qWrap = document.createElement('section');
    qWrap.className = 'q';
    const h = document.createElement('h3');
    h.textContent = `Q${i + 1}. ${q.prompt_ja}`;
    qWrap.appendChild(h);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `［${q.difficulty || '-'} / ${q.question_type || '-'}］`;
    qWrap.appendChild(meta);

    let inputArea;
    let ctx = null;

    if (q.question_type === 'term_mcq' || q.question_type === 'journal_mcq') {
      inputArea = document.createElement('div');
      (q.choices || []).forEach((ch, idx) => {
        const id = `q${i}_${idx}`;
        const lab = document.createElement('label');
        lab.htmlFor = id;
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `q${i}`;
        radio.value = ch;
        radio.id = id;
        lab.appendChild(radio);
        lab.appendChild(document.createTextNode(' ' + ch));
        inputArea.appendChild(lab);
        inputArea.appendChild(document.createElement('br'));
      });
    } else if (q.question_type === 'journal_input') {
      inputArea = document.createElement('div');
      ctx = await renderJournal4col(inputArea, q, options || {});
    } else {
      inputArea = document.createElement('div');
      inputArea.textContent = '未対応形式';
    }
    qWrap.appendChild(inputArea);

    const btn = document.createElement('button');
    btn.textContent = '採点';
    const fb = document.createElement('p');
    fb.className = 'fb';
    fb.dataset.answeredCorrect = '0';
    btn.onclick = () => {
      let correct = false;
      if (q.question_type && q.question_type.endsWith('mcq')) {
        const sel = inputArea.querySelector('input[type="radio"]:checked');
        correct = sel && String(sel.value) === String(q.answer);
      } else if (q.question_type === 'journal_input') {
        // 入力値を4列×2段から収集
        const entries = [];
        [1, 2].forEach((row) => {
          const drAcc = inputArea.querySelector(`select[name="dr_acc_${row}"]`)?.value || '';
          const crAcc = inputArea.querySelector(`select[name="cr_acc_${row}"]`)?.value || '';
          const drAmt = Number(inputArea.querySelector(`input[name="dr_amt_${row}"]`)?.value || 0);
          const crAmt = Number(inputArea.querySelector(`input[name="cr_amt_${row}"]`)?.value || 0);
          if (drAcc && drAmt > 0) {
            entries.push({ side: 'Dr', account: drAcc, amount: drAmt });
          }
          if (crAcc && crAmt > 0) {
            entries.push({ side: 'Cr', account: crAcc, amount: crAmt });
          }
        });
        // 借貸一致
        const drSum = entries.filter((x) => x.side === 'Dr').reduce((a, b) => a + b.amount, 0);
        const crSum = entries.filter((x) => x.side === 'Cr').reduce((a, b) => a + b.amount, 0);
        if (drSum !== crSum) {
          fb.textContent = '❌ 借貸が一致していません。';
          return;
        }

        // 正答との厳密照合（順不同・重複可）
        const expected = Array.isArray(q.answer) ? q.answer.slice() : [];
        const used = new Array(entries.length).fill(false);
        let matched = 0;
        expected.forEach((exp) => {
          const idx = entries.findIndex(
            (e, j) =>
              !used[j] &&
              e.side === exp.side &&
              e.account === exp.account &&
              Number(e.amount) === Number(exp.amount),
          );
          if (idx >= 0) {
            used[idx] = true;
            matched++;
          }
        });
        correct = matched === expected.length && used.filter((x) => x).length === expected.length;
        if (!correct && q.explanation_ja) {
          fb.textContent = `❌ 不正解。ヒント：${q.explanation_ja}`;
        }
      }
      if (correct && fb.dataset.answeredCorrect !== '1') {
        fb.dataset.answeredCorrect = '1';
        fb.textContent = '✅ 正解！';
        score++;
        localStorage.setItem(`${keyBase}:score`, String(score));
        updateSummary();
      } else if (correct) {
        fb.textContent = '✅ 正解！（既に加点済み）';
      }
    };
    qWrap.appendChild(btn);
    qWrap.appendChild(fb);
    el.appendChild(qWrap);
  });
}
