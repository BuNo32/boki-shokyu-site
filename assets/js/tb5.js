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

  function buildTable(container, data){
    const readonly = !!data.readonly;
    const tbl = document.createElement('table');
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    (data.columns||["借方残高","借方合計","勘定科目","貸方合計","貸方残高"]).forEach(c=>{
      const th=document.createElement('th'); th.textContent=c; trh.appendChild(th);
    });
    thead.appendChild(trh);
    tbl.appendChild(thead);

    const tbody = document.createElement('tbody');
    const inputs = [];
    (data.rows||[]).forEach(row=>{
      const tr = document.createElement('tr');
      // 借方残高
      let td = document.createElement('td');
      if(readonly){
        const D = row.debit_total||0, C=row.credit_total||0;
        td.textContent = (row.nature==='D') ? fmt(Math.max(D-C,0)) : '';
      }else{
        const inDrBal = document.createElement('input');
        inDrBal.type='number'; inDrBal.inputMode='numeric'; inDrBal.step='1';
        td.appendChild(inDrBal);
        inputs.push({row, inDrBal});
      }
      tr.appendChild(td);

      // 借方合計
      td = document.createElement('td'); td.textContent = fmt(row.debit_total||0); tr.appendChild(td);

      // 科目
      td = document.createElement('td'); td.textContent = row.account; td.className='account'; tr.appendChild(td);

      // 貸方合計
      td = document.createElement('td'); td.textContent = fmt(row.credit_total||0); tr.appendChild(td);

      // 貸方残高
      td = document.createElement('td');
      if(readonly){
        const D = row.debit_total||0, C=row.credit_total||0;
        td.textContent = (row.nature==='C') ? fmt(Math.max(C-D,0)) : '';
      }else{
        const inCrBal = document.createElement('input');
        inCrBal.type='number'; inCrBal.inputMode='numeric'; inCrBal.step='1';
        td.appendChild(inCrBal);
        // pair it with the same index object
        const last = inputs[inputs.length-1];
        last.inCrBal = inCrBal;
      }
      tr.appendChild(td);

      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);

    // Footer: totals & status
    const tfoot = document.createElement('tfoot');
    const trf = document.createElement('tr');
    const td1 = document.createElement('td'); td1.colSpan=5;
    const badge = document.createElement('span'); badge.className='tb5-badge'; badge.textContent= readonly ? '閲覧モード（読み取り）' : '未チェック';
    td1.appendChild(badge);
    trf.appendChild(td1);
    tfoot.appendChild(trf);
    tbl.appendChild(tfoot);

    container.classList.add('tb5-wrap');
    container.innerHTML = '';
    const h = document.createElement('div'); h.style.marginBottom='.5rem'; h.textContent = data.title || (readonly?'TB5（閲覧）':'TB5ドリル');
    container.appendChild(h);
    container.appendChild(tbl);

    if(readonly) return; // no evaluation in read-only

    function evaluate(){
      let ok = true;
      let debitSum = 0, creditSum = 0;
      inputs.forEach(({row,inDrBal,inCrBal})=>{
        const D = row.debit_total||0, C = row.credit_total||0;
        const expectedDr = (row.nature==='D') ? Math.max(D-C,0) : 0;
        const expectedCr = (row.nature==='C') ? Math.max(C-D,0) : 0;

        // user inputs (no comma formatting for number type)
        const dr = parseNum(inDrBal);
        const cr = parseNum(inCrBal);

        // Count totals
        debitSum += D;
        creditSum += C;

        // Rule: fill exactly one side with exact expected
        const filledDr = !isNaN(dr) && inDrBal.value!=='';
        const filledCr = !isNaN(cr) && inCrBal.value!=='';
        let rowOk = false;
        if(row.nature==='D'){
          rowOk = filledDr && !filledCr && (dr===expectedDr);
        }else{
          rowOk = filledCr && !filledDr && (cr===expectedCr);
        }
        if(!rowOk) ok=false;
      });
      const totalsOk = (debitSum===creditSum);
      if(ok && totalsOk){
        badge.textContent = '✔ 合計一致／行ごと正解';
        badge.style.borderColor='#34d399'; badge.style.background='#ecfdf5'; badge.style.color='#065f46';
      }else if(totalsOk){
        badge.textContent = '△ 合計一致（行に未正解あり）';
        badge.style.borderColor='#fbbf24'; badge.style.background='#fffbeb'; badge.style.color='#92400e';
      }else{
        badge.textContent = '× 合計不一致（データ合計の確認が必要）';
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
