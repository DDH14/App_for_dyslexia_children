/* VẼ BIỂU ĐỒ CANVAS */
window.drawLineChart = function(canvas, xs, ys, color='#2E7D32', yLabel=''){
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#ddd'; ctx.beginPath();
  const pl=40, pr=10, pt=10, pb=30;
  ctx.moveTo(pl, pt); ctx.lineTo(pl, H-pb); ctx.lineTo(W-pr, H-pb); ctx.stroke();
  if (!ys.length) return;
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const y0 = (yMin===yMax) ? yMin-1 : yMin;
  const y1 = (yMin===yMax) ? yMax+1 : yMax;
  const xScale = (i) => pl + (i/(Math.max(1, ys.length-1))) * (W-pl-pr);
  const yScale = (v) => H - pb - ((v - y0)/(y1 - y0)) * (H - pt - pb);
  ctx.strokeStyle='#eee';
  for (let i=0; i<=4; i++){ const ty = pt + i*(H-pt-pb)/4; ctx.beginPath(); ctx.moveTo(pl, ty); ctx.lineTo(W-pr, ty); ctx.stroke(); }
  ctx.strokeStyle=color; ctx.lineWidth=2; ctx.beginPath();
  ys.forEach((v,i)=>{ const x=xScale(i), y=yScale(v); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
  ctx.fillStyle=color; ys.forEach((v,i)=>{ const x=xScale(i), y=yScale(v); ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill(); });
  ctx.fillStyle='#666'; ctx.font='12px system-ui'; ctx.fillText(yLabel, 6, 14);
};