/* MODULE: GAME – Bóng bay âm vị (có log) */
window.GameModule = (function(){
  const cfg = { duration:60, spawnEvery:900, minSpeed:35, maxSpeed:70, targetRatio:0.55, maxBalloons:12 };
  let state = { running:false, lives:3, score:0, timeLeft:cfg.duration, lastTS:0, spawnT:0, balloons:[], effects:[], mode:'tone', tone:'sắc', tag:'sx', canvas:null, ctx:null, W:900, H:420 };
  function qSel(id){ return document.getElementById(id); }
  function updateHUD(){ qSel('gScore').textContent=state.score; qSel('gTime').textContent=Math.max(0,Math.ceil(state.timeLeft)); qSel('gLives').textContent=state.lives; qSel('btnGameStart').disabled=state.running; qSel('btnGameStop').disabled=!state.running; }
  function reset(){ state.running=false; state.lives=3; state.score=0; state.timeLeft=cfg.duration; state.lastTS=0; state.spawnT=0; state.balloons=[]; state.effects=[]; updateHUD(); drawStatic(); }
  function initCanvas(){ const c=qSel('gameCanvas'); state.canvas=c; const rect=c.getBoundingClientRect(); state.W=c.width=Math.round(rect.width); state.H=c.height=Math.max(320,Math.round(rect.width*0.45)); state.ctx=c.getContext('2d'); c.onpointerdown=(e)=>{const box=c.getBoundingClientRect(); handleClick(e.clientX-box.left,e.clientY-box.top);}; drawStatic(); window.addEventListener('resize', ()=> initCanvas(), { once:true }); }
  function drawSky(ctx,W,H){ const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#cfe9ff'); g.addColorStop(0.6,'#eaf6ff'); g.addColorStop(1,'#ffffff'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
  function drawCloud(ctx,x,y,s){ ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x,y,s*0.7,0,Math.PI*2); ctx.arc(x+s*0.6,y-s*0.2,s*0.8,0,Math.PI*2); ctx.arc(x+s*1.2,y,s*0.6,0,Math.PI*2); ctx.fill(); }
  function drawStatic(){ const {ctx,W,H}=state; if(!ctx) return; drawSky(ctx,W,H); for(let i=0;i<6;i++){ drawCloud(ctx,(i*W/5+(i%2?80:40))%W,50+(i%3)*30,28+(i%3)*10);} ctx.fillStyle='#E2F7DE'; ctx.beginPath(); ctx.moveTo(0,H); ctx.quadraticCurveTo(W*0.25,H-40,W*0.5,H-10); ctx.quadraticCurveTo(W*0.75,H-40,W,H-5); ctx.lineTo(W,H); ctx.closePath(); ctx.fill(); }
  function balloonColor(t){ return t ? '#FF6F61' : '#6EC6FF'; }
  function spawnBalloon(){ const cards=Array.isArray(window.CARDS)?window.CARDS:[]; if(!cards.length) return; const dict=pools(); const pool=(Math.random()<cfg.targetRatio)?dict.targets:dict.others; if(!pool.length) return; const w=pool[Math.floor(Math.random()*pool.length)].text; const r=26+Math.random()*9; const x=r+Math.random()*(state.W-2*r); const y=state.H+r+10; const vy=-(cfg.minSpeed+Math.random()*(cfg.maxSpeed-cfg.minSpeed)); const isT=isTarget(w); state.balloons.push({x,y,r,vy,word:w,target:isT}); if(state.balloons.length>cfg.maxBalloons) state.balloons.shift(); }
  function pools(){ const cards=Array.isArray(window.CARDS)?window.CARDS:[]; const targets=cards.filter(c=>isTarget(c.text,c.tags)); const others=cards.filter(c=>!isTarget(c.text,c.tags)); return {targets,others}; }
  function isTarget(word,tags){ if(state.mode==='tone'){ return (window.detectTone?window.detectTone(word):'ngang')===state.tone; } else { return Array.isArray(tags)&&tags.includes(state.tag); } }
  function drawBalloon(ctx,b){ const {x,y,r}=b; const g=ctx.createRadialGradient(x-r*0.4,y-r*0.6,r*0.1,x,y,r); const base=balloonColor(b.target); g.addColorStop(0, lighten(base,0.35)); g.addColorStop(1, base); ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x,y,r*0.9,r,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(x-r*0.25,y-r*0.4,r*0.18,r*0.28,-0.3,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#999'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(x,y+r*0.95); for(let i=1;i<=3;i++){ ctx.quadraticCurveTo(x+(i%2?6:-6),y+r*0.95+i*8,x,y+r*0.95+i*10);} ctx.stroke(); ctx.fillStyle='#fff'; ctx.font=`${Math.max(12,r*0.78)}px system-ui, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(b.word,x,y+1);}
  function lighten(hex,p){ const c=hex.replace('#',''); const n=parseInt(c,16); let r=(n>>16)&255,g=(n>>8)&255,b=n&255; r=Math.min(255,Math.round(r+(255-r)*p)); g=Math.min(255,Math.round(g+(255-g)*p)); b=Math.min(255,Math.round(b+(255-b)*p)); return `rgb(${r},${g},${b})`; }
  function handleClick(x,y){ if(!state.running) return; let hit=null, idx=-1, mind=1e9; for(let i=state.balloons.length-1;i>=0;i--){ const b=state.balloons[i]; const dx=x-b.x, dy=y-b.y; const d=Math.hypot(dx,dy); if(d<b.r && d<mind){ mind=d; hit=b; idx=i; } } if(!hit) return; if(VoiceUI.enabled) TTS.speak(hit.word, AppState.learner.ttsRate || 0.9); popEffect(hit.x,hit.y, hit.target?balloonColor(true):'#888'); state.balloons.splice(idx,1); if(hit.target){ state.score+=10; VoiceUI.say('Đúng rồi'); } else { state.lives-=1; state.score=Math.max(0,state.score-5); VoiceUI.say('Sai rồi'); } updateHUD(); if(state.lives<=0){ endGame('out_of_lives'); } }
  function popEffect(x,y,color){ const p=[]; const n=10; for(let i=0;i<n;i++){ const a=(Math.PI*2*i)/n+Math.random()*0.4; const v=60+Math.random()*60; p.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:600,color}); } state.effects.push({type:'confetti',parts:p}); }
  function drawEffects(dt){ const {ctx}=state; const keep=[]; for(const ef of state.effects){ if(ef.type==='confetti'){ for(const p of ef.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=160*dt; p.life-=dt*1000; ctx.fillStyle=ef.color; ctx.fillRect(p.x,p.y,3,3); } if(ef.parts.some(p=>p.life>0)) keep.push(ef); } } state.effects=keep; }
  function step(ts){ if(!state.running) return; if(!state.lastTS) state.lastTS=ts; const dt=Math.min(0.05,(ts-state.lastTS)/1000); state.lastTS=ts; state.timeLeft-=dt; if(state.timeLeft<=0){ endGame('time_up'); return; } state.spawnT+=dt*1000; if(state.spawnT>=cfg.spawnEvery){ state.spawnT=0; spawnBalloon(); } for(const b of state.balloons){ b.y+=b.vy*dt; } state.balloons=state.balloons.filter(b=>b.y+b.r>-10); const {ctx,W,H}=state; drawSky(ctx,W,H); for(let i=0;i<5;i++){ drawCloud(ctx,(i*160+(ts/40)%W),50+(i%3)*20,24+(i%3)*8); } for(const b of state.balloons) drawBalloon(ctx,b); drawEffects(dt); ctx.fillStyle='#E2F7DE'; ctx.fillRect(0,H-16,W,24); ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.fillRect(8,8,130,54); ctx.strokeStyle='#e0d4a5'; ctx.strokeRect(8,8,130,54); ctx.fillStyle='#333'; ctx.font='12px system-ui, sans-serif'; ctx.fillText(`🎯 ${state.mode==='tone'?('Thanh: '+state.tone):('Nhóm: '+state.tag)}`,16,24); ctx.fillText(`🏆 ${state.score}  ⏱ ${Math.ceil(state.timeLeft)}s  ❤️ ${state.lives}`,16,44); updateHUD(); requestAnimationFrame(step); }
  function endGame(reason){
    state.running=false; updateHUD();
    const stars = state.score>=100 ? 2 : (state.score>=60 ? 1 : 0);
    if (stars>0 && window.App) App.addStar(stars);

    // Gửi log game
    const log = {
      type:'game', learnerId: AppState.learner.id || '',
      sessionId: 'game_' + Math.random().toString(36).slice(2,8),
      ts: window.__now(),
      gameMode: state.mode, gameTone: state.tone, gameTag: state.tag,
      gameScore: state.score, gameDuration: (cfg.duration - Math.max(0,state.timeLeft))*1000, livesLeft: state.lives
    };
    Sync.enqueue(log);

    const dlg=document.createElement('div');
    dlg.className='modal active';
    dlg.innerHTML = `
      <div class="dialog">
        <h3>🎉 Hoàn thành game</h3>
        <div>Điểm: <b>${state.score}</b> • Còn: <b>${Math.ceil(Math.max(0,state.timeLeft))}s</b> ${stars?`• Thưởng sao: ${'⭐'.repeat(stars)}`:''}</div>
        <div class="sticker-grid" style="margin-top:10px;" id="stickerGrid"></div>
        <div class="row" style="margin-top:10px;">
          <button class="primary" onclick="document.body.removeChild(this.closest('.modal')); GameModule.start();">Chơi lại</button>
          <div class="spacer"></div>
          <button class="ghost" onclick="document.body.removeChild(this.closest('.modal'))">Đóng</button>
        </div>
      </div>`;
    document.body.appendChild(dlg);
    const grid = dlg.querySelector('#stickerGrid');
    const icons=['star','heart','flower','kite','fish','bird','book','leaf'];
    for(let i=0;i<8;i++){ const s=document.createElement('div'); s.className='sticker'; s.innerHTML=stickerSVG(icons[i%icons.length]); grid.appendChild(s); }
  }
  function stickerSVG(type){
    const svg=(b)=>`<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
    if(type==='star')  return svg(`<polygon points="32,6 39,24 58,24 42,36 48,54 32,44 16,54 22,36 6,24 25,24" fill="#FFD54F" stroke="#F9A825" stroke-width="2"/>`);
    if(type==='heart') return svg(`<path d="M32 55 C10 40 6 26 16 18 c6-5 13-3 16 3 c3-6 10-8 16-3 c10 8 6 22 -16 37 z" fill="#EF5350" stroke="#C62828" stroke-width="2"/>`);
    if(type==='flower')return svg(`<circle cx="32" cy="32" r="6" fill="#FDD835"/><g fill="#AB47BC"><circle cx="20" cy="20" r="10"/><circle cx="44" cy="20" r="10"/><circle cx="20" cy="44" r="10"/><circle cx="44" cy="44" r="10"/></g>`);
    if(type==='kite')  return svg(`<polygon points="32,6 54,28 32,58 10,28" fill="#4FC3F7" stroke="#0288D1" stroke-width="2"/><path d="M32 58 Q20 48 14 56" stroke="#8D6E63" stroke-width="2" fill="none"/>`);
    if(type==='fish')  return svg(`<ellipse cx="28" cy="32" rx="16" ry="10" fill="#4DB6AC" stroke="#00796B" stroke-width="2"/><polygon points="42,32 56,24 56,40" fill="#4DB6AC" stroke="#00796B" stroke-width="2"/><circle cx="22" cy="30" r="2" fill="#000"/>`);
    if(type==='bird')  return svg(`<path d="M10 38 C22 14, 42 14, 54 38 Q42 32 32 40 Q22 32 10 38 z" fill="#90CAF9" stroke="#1E88E5" stroke-width="2"/>`);
    if(type==='book')  return svg(`<rect x="12" y="16" width="40" height="32" rx="4" fill="#FFCC80" stroke="#FB8C00" stroke-width="2"/><path d="M32 16 v32" stroke="#FB8C00" stroke-width="2"/>`);
    if(type==='leaf')  return svg(`<path d="M12 42 C12 22, 42 10, 52 22 C52 42, 22 54, 12 42 z" fill="#81C784" stroke="#2E7D32" stroke-width="2"/>`);
    return svg('');
  }

  function start(){ state.mode=qSel('selGameMode').value; state.tone=qSel('selGameTone').value; state.tag=qSel('selGameTag').value || 'sx'; state.running=true; state.lives=3; state.score=0; state.timeLeft=cfg.duration; state.lastTS=0; state.spawnT=0; state.balloons=[]; state.effects=[]; updateHUD(); requestAnimationFrame(step); if(AppState.childMode) Coach.say('Bắt đầu!'); }
  function stop(){ if(!state.running) return; state.running=false; updateHUD(); if(AppState.childMode) Coach.say('Đã dừng.'); }
  function init(){ const modeSel=qSel('selGameMode'); const paneTone=qSel('paneTone'), paneTag=qSel('paneTag'); modeSel.onchange=()=>{ const m=modeSel.value; paneTone.style.display=(m==='tone')?'':'none'; paneTag.style.display=(m==='tag')?'':'none'; }; const selTag=qSel('selGameTag'); const cards=Array.isArray(window.CARDS)?window.CARDS:[]; const tagSet=new Set(); cards.forEach(c => (c.tags||[]).forEach(t=> tagSet.add(t))); const tags=Array.from(tagSet).sort(); selTag.innerHTML=tags.map(t=>`<option value="${t}">${t}</option>`).join(''); selTag.value=state.tag; if(!state.canvas) initCanvas(); reset(); VoiceUI.attachAll(); }
  return { init, start, stop };
})();