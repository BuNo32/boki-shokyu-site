// content/assets/js/quiz.js
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

  items.forEach((q, i) => {
    const qWrap = document.createElement('section');
    qWrap.className = 'q';
    const h = document.createElement('h3');
    h.textContent = `Q${i + 1}. ${q.prompt_ja}`;
    qWrap.appendChild(h);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `［${q.difficulty || '-'} / ${q.question_type || '-'}］`;
    qWrap.appendChild(meta);

    let inputArea = document.createElement('div');

    if (q.question_type === 'term_mcq' || q.question_type === 'journal_mcq') {
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
      inputArea.innerHTML = `
        <table class="jrnl">
          <tr><th>借方科目</th><th>借方金額</th><th>貸方科目</th><th>貸方金額</th></tr>
          <tr>
            <td><input name="dr_acc" placeholder="例：現金"></td>
            <td><input name="dr_amt" type="number" min="0" step="1"></td>
            <td><input name="cr_acc" placeholder="例：普通預金"></td>
            <td><input name="cr_amt" type="number" min="0" step="1"></td>
          </tr>`;
    } else {
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
        const drAcc = inputArea.querySelector('input[name="dr_acc"]').value.trim();
        const crAcc = inputArea.querySelector('input[name="cr_acc"]').value.trim();
        const drAmt = Number(inputArea.querySelector('input[name="dr_amt"]').value);
        const crAmt = Number(inputArea.querySelector('input[name="cr_amt"]').value);
        const ans = q.answer || [];
        const drOk = ans.some(
          (x) => x.side === 'Dr' && x.account === drAcc && Number(x.amount) === drAmt,
        );
        const crOk = ans.some(
          (x) => x.side === 'Cr' && x.account === crAcc && Number(x.amount) === crAmt,
        );
        correct = drOk && crOk && drAmt === crAmt && drAmt > 0;
      }
      fb.textContent = correct ? '✅ 正解！' : `❌ 不正解。ヒント：${q.explanation_ja || ''}`;

      // 二重加点防止
      if (correct && fb.dataset.answeredCorrect !== '1') {
        fb.dataset.answeredCorrect = '1';
        score++;
        localStorage.setItem(`${keyBase}:score`, String(score));
        updateSummary();
      }
    };
    qWrap.appendChild(btn);
    qWrap.appendChild(fb);
    el.appendChild(qWrap);
  });
}
