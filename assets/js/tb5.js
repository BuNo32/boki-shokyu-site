
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

  function getRowMap(rows){
    const m = {}; rows.forEach(r=>{ m[r.account]=r; }); return m;
  }
  function balanceOf(row){
    const D = row.debit_total||0, C=row.credit_total||0;
    if(row.nature==='D'){ return Math.max(D-C,0); }
    return Math.max(C-D,0);
  }

  function buildTB(container, data){
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

      let td = document.createElement('td');
      if(readonly){
        const bal = (row.nature==='D') ? Math.max((row.debit_total||0)-(row.credit_total||0),0) : 0;
        td.textContent = bal?fmt(bal):'';
      }else{
        const inDrBal = document.createElement('input'); inDrBal.type='number'; inDrBal.inputMode='numeric'; inDrBal.step='1';
        td.appendChild(inDrBal);
        inputs.push({row,inDrBal});
      }
      tr.appendChild(td);

      td = document.createElement('td'); td.textContent = fmt(row.debit_total||0); tr.appendChild(td);

      td = document.createElement('td'); td.textContent = row.account; td.className='account'; tr.appendChild(td);

      td = document.createElement('td'); td.textContent = fmt(row.credit_total||0); tr.appendChild(td);

      td = document.createElement('td');
      if(readonly){
        const bal = (row.nature==='C') ? Math.max((row.credit_total||0)-(row.debit_total||0),0) : 0;
        td.textContent = bal?fmt(bal):'';
      }else{
        const inCrBal = document.createElement('input'); inCrBal.type='number'; inCrBal.inputMode='numeric'; inCrBal.step='1';
        td.appendChild(inCrBal);
        inputs[inputs.length-1].inCrBal = inCrBal;
      }
      tr.appendChild(td);

      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);

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
        const dr = parseNum(inDrBal);
        const cr = parseNum(inCrBal);
        debitSum += D; creditSum += C;
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

  // QA builder (sample problem (2) style)
  function buildQA(container, qa, tb){
    const map = getRowMap(tb.rows||[]);
    const wrap = document.createElement('div');
    const title = document.createElement('div'); title.textContent = qa.title || '読み取り演習'; title.style.margin='0 0 .5rem'; wrap.appendChild(title);

    const tbl = document.createElement('table');
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    ['設問','解答欄'].forEach(h=>{ const th=document.createElement('th'); th.textContent=h; trh.appendChild(th); });
    thead.appendChild(trh); tbl.appendChild(thead);
    const tbody = document.createElement('tbody');

    const rows = [];
    (qa.questions||[]).forEach((q,i)=>{
      const tr = document.createElement('tr');
      const tdq = document.createElement('td'); tdq.textContent = (i+1)+'. '+q.label; tr.appendChild(tdq);
      const tda = document.createElement('td');
      const inp = document.createElement('input'); inp.type='number'; inp.inputMode='numeric'; inp.step='1'; inp.style.width='10em';
      tda.appendChild(inp); tr.appendChild(tda);
      tbody.appendChild(tr);
      rows.push({q, inp});
    });
    tbl.appendChild(tbody);
    wrap.appendChild(tbl);

    const status = document.createElement('div'); status.className='tb5-badge'; status.style.display='inline-block'; status.style.marginTop='.5rem'; status.textContent='未採点';
    wrap.appendChild(status);

    function calc(q){
      const type = q.formula && q.formula.type;
      const f = q.formula || {};
      const g = (name)=> map[name] || {debit_total:0, credit_total:0, nature:'D'};
      switch(type){
        case 'credit_total': return (g(f.account).credit_total||0);
        case 'debit_total': return (g(f.account).debit_total||0);
        case 'balance': {
          const r = g(f.account);
          return balanceOf(r);
        }
        case 'book_value': {
          const a = g(f.asset), c = g(f.contra);
          const aBal = (a.debit_total||0) - (a.credit_total||0); // asset is D-nature
          const cBal = (c.credit_total||0) - (c.debit_total||0); // contra asset is C-nature
          return Math.max(aBal,0) - Math.max(cBal,0);
        }
        case 'sum_balance': {
          const side = f.side || 'C';
          const accs = f.accounts||[];
          let s = 0;
          accs.forEach(name=>{
            const r = g(name);
            const bal = balanceOf(r);
            if(side==='D' && r.nature==='D') s+=bal;
            if(side==='C' && r.nature==='C') s+=bal;
          });
          return s;
        }
        case 'sum_debit_total': {
          let s=0; (f.accounts||[]).forEach(name=>{ s += (g(name).debit_total||0); }); return s;
        }
        case 'sum_credit_total': {
          let s=0; (f.accounts||[]).forEach(name=>{ s += (g(name).credit_total||0); }); return s;
        }
      }
      return 0;
    }

    function evaluate(){
      let ok=true;
      rows.forEach(({q,inp})=>{
        const ans = calc(q);
        const v = Number((inp.value||'').replace(/,/g,''));
        const good = (String(v) !== 'NaN') && (v===ans);
        if(!good) ok=false;
      });
      status.textContent = ok ? '✔ すべて正解' : '× 未正解あり';
      status.style.borderColor = ok ? '#34d399' : '#fca5a5';
      status.style.background = ok ? '#ecfdf5' : '#fef2f2';
      status.style.color = ok ? '#065f46' : '#991b1b';
    }
    wrap.addEventListener('input', evaluate);
    container.appendChild(wrap);
  }

  function init(){
    // TB builders
    document.querySelectorAll('.tb5-wrap[id]').forEach(function(el){
      const src = el.getAttribute('data-tb-src');
      if(!src) return;
      fetch(src).then(r=>r.json()).then(data=>buildTB(el,data)).catch(err=>{
        el.innerHTML = '<p class="tb5-ng">データの読み込みに失敗しました。</p>';
        console.error(err);
      });
    });
    // QA builders
    document.querySelectorAll('.tb5-qa').forEach(function(el){
      const tbSrc = el.getAttribute('data-tb-src');
      const qaSrc = el.getAttribute('data-qa-src');
      if(!tbSrc || !qaSrc) return;
      Promise.all([fetch(tbSrc).then(r=>r.json()), fetch(qaSrc).then(r=>r.json())])
        .then(([tb,qa])=>buildQA(el,qa,tb))
        .catch(err=>{ el.innerHTML = '<p class="tb5-ng">QAの読み込みに失敗しました。</p>'; console.error(err); });
    });
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
