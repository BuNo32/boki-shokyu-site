// content/assets/js/exam.js
function startTimer(seconds, mountId, onTimeUp) {
  const el = document.getElementById(mountId);
  if (!el) return;
  let remain = seconds;
  const tick = () => {
    const m = String(Math.floor(remain / 60)).padStart(2, '0');
    const s = String(remain % 60).padStart(2, '0');
    el.textContent = `試験タイマー：${m}:${s}`;
    if (remain <= 0) {
      clearInterval(tid);
      el.textContent = `試験タイマー：00:00（時間切れ）`;
      if (onTimeUp) onTimeUp();
      return;
    }
    remain--;
  };
  tick();
  const tid = setInterval(tick, 1000);
}
