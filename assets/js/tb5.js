(function(){
  function fmt(n){
    if(n===null||n===undefined||n==='') return '';
    const s = String(n).replace(/,/g,'');
    if(s==='') return '';
    const v = Number(s);
    if(!isFinite(v)) return s;
    return v.toLocaleString('ja-JP');
  }
  function parseNum(el){
    const s = (el.value||'').replace(/,/g,'');
    const v = Number(s);
    return isFinite(v)?v:NaN;
  }
  function natureSign(nature){ return nature==='D'?1:-1; }

  function buildTable(container, data){
    const tbl = document.createElement('table');
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    data.columns.forEach(c=>{ const th=document.createElement('th'); th.textContent=c; trh.appendChild(th); });
    thead.appendChild(trh);
    tbl.appendChild(thead);

    const tbody = document.createElement('tbody');
    const inputs = [];
    data.rows.forEach(row=>{
      const tr = document.createElement('tr');
      // 借方残高 input
      let td = document.createElement('td');
      const inDrBal = document.createElement('input'); inDrBal.type='number'; inDrBal.inputMode='numeric';
      td.appendChild(inDrBal); tr.appendChild(td);
      // 借方合計 fixed
      td = document.createElement('td'); td.textContent = fmt(row.debit_total); tr.appendChild(td);
      // 科目
      td = document.createElement('td'); td.textContent = row.account; td.className='account'; tr.appendChild(td);
      // 貸方合計 fixed
      td = document.createElement('td'); td.textContent = fmt(row.credit_total); tr.appendChild(td);
      // 貸方残高 input
      td = document.createElement('td');
      const inCrBal = document.createElement('input'); inCrBal.type='number'; inCrBal.inputMode='numeric';
      td.appendChild(inCrBal); tr.appendChild(td);

      tbody.appendChild(tr);
      inputs.push({row, inDrBal, inCrBal});
    });
    tbl.appendChild(tbody);

    // Footer: totals & status
    const tfoot = document.createElement('tfoot');
    const trf = document.createElement('tr');
    const td1 = document.createElement('td'); td1.colSpan=5;
    const badge = document.createElement('span'); badge.className='tb5-badge'; badge.textContent='未チェック';
    td1.appendChild(badge);
    trf.appendChild(td1);
    tfoot.appendChild(trf);
    tbl.appendChild(tfoot);

    container.classList.add('tb5-wrap');
    container.innerHTML = '';
    const h = document.createElement('div'); h.style.marginBottom='.5rem'; h.textContent = data.title || 'TB5ドリル';
    container.appendChild(h);
    container.appendChild(tbl);

    function evaluate(){
      let ok = true;
      let debitSum = 0, creditSum = 0;
      inputs.forEach(({row,inDrBal,inCrBal})=>{
        const D = row.debit_total||0, C = row.credit_total||0;
        const expected = (row.nature==='D') ? Math.max(D-C,0) : Math.max(C-D,0);
        // user inputs
        const dr = parseNum(inDrBal); const cr = parseNum(inCrBal);
        // normalize display with commas
        if(inDrBal===document.activeElement || inCrBal===document.activeElement){/*don't format while typing*/}
        else{
          if(inDrBal.value) inDrBal.value = fmt(inDrBal.value);
          if(inCrBal.value) inCrBal.value = fmt(inCrBal.value);
        }
        // check one-side fill rule
        const filledDr = !isNaN(dr) && inDrBal.value!=='';
        const filledCr = !isNaN(cr) && inCrBal.value!=='';
        // compute totals (合計は固定セルの合計。ここでは左右一致のみ判定）
        debitSum += D;
        creditSum += C;
        // per-row check: exactly one side, and equals expected
        let rowOk = false;
        if(row.nature==='D'){
          rowOk = filledDr && !filledCr && (dr===expected);
        }else{
          rowOk = filledCr && !filledDr && (cr===expected);
        }
        if(!rowOk) ok=false;
      });
      // Check totals equality
      const totalsOk = (debitSum===creditSum);
      if(ok && totalsOk){
        badge.textContent = '✔ 合計一致／行ごと正解';
        badge.style.borderColor='#34d399'; badge.style.background='#ecfdf5'; badge.style.color='#065f46';
      }else if(totalsOk){
        badge.textContent = '△ 合計一致（行に未正解あり）';
        badge.style.borderColor='#fbbf24'; badge.style.background='#fffbeb'; badge.style.color='#92400e';
      }else{
        badge.textContent = '× 合計不一致（入力前でも発生合計が合わないデータもあり得ます）';
        badge.style.borderColor='#fca5a5'; badge.style.background='#fef2f2'; badge.style.color='#991b1b';
      }
    }

    container.addEventListener('input', evaluate);
    evaluate();
  }

  function init(){
    document.querySelectorAll('.tb5-wrap[id]').forEach(function(el){
      const src = el.getAttribute('data-tb-src');
      if(!src) return;
      fetch(src).then(r=>r.json()).then(data=>buildTable(el,data)).catch(err=>{
        el.innerHTML = '<p class="tb5-ng">データの読み込みに失敗しました。</p>';
        console.error(err);
      });
    });
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
