/* GAME – Mục tiêu rõ ràng, vòng sáng bóng đúng, Tập thử */
window.GameModule = (function(){
  const cfg = { duration:60, spawnEvery:900, minSpeed:35, maxSpeed:70, targetRatio:0.55, maxBalloons:12 };
  let state = { running:false, train:false, lives:3, score:0, timeLeft:cfg.duration, lastTS:0, spawnT:0, balloons:[], effects:[], mode:'tone', tone:'sắc', tag:'sx', canvas:null, ctx:null, W:900, H:420 };

  function q(id){ return document.getElementById(id); }
  function setTargetText(){
    const box = q('gameTargetText');
    if (state.mode==='tone') box.textContent = 'Tìm bóng có thanh: ' + state.tone.toUpperCase();
    else box.textContent = 'Tìm bóng theo nhóm: ' + state.tag;
  }
  function targetCheck(word, tags){
    if (state.mode==='tone') return (window.detectTone?detectTone(word):'ngang') === state.tone;
    return Array.isArray(tags) && tags.includes(state.tag);
  }

  function initCanvas(){
    const c = q('gameCanvas'); state.canvas=c;
    const rect = c.getBoundingClientRect();
    state.W = c.width = Math.round(rect.width); state.H = c.height = Math.max(320, Math.round(rect.width*0.45));
    state.ctx = c.getContext('2d');
    c.onpointerdown = (e)=>{
      const r=c.getBoundingClientRect(); hit(e.clientX-r.left, e.clientY-r.top);
    };
    drawStatic();
    window.addEventListener('resize', ()=> initCanvas(), { once:true });
  }

  function drawSky(ctx,W,H){
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#cfe9ff'); g.addColorStop(0.6,'#eaf6ff'); g.addColorStop(1,'#ffffff');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }
  function cloud(ctx,x,y,s){ ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x,y,s*0.7,0,Math.PI*2); ctx.arc(x+s*0.6,y-s*0.2,s*0.8,0,Math.PI*2); ctx.arc(x+s*1.2,y,s*0.6,0,Math.PI*2); ctx.fill(); }
  function drawStatic(){
    const {ctx,W,H}=state; if(!ctx) return; drawSky(ctx,W,H);
    for (let i=0;i<6;i++) cloud(ctx,(i*W/5+(i%2?80:40))%W,50+(i%3)*30,28+(i%3)*10);
    ctx.fillStyle='#E2F7DE'; ctx.beginPath(); ctx.moveTo(0,H); ctx.quadraticCurveTo(W*0.25,H-40,W*0.5,H-10); ctx.quadraticCurveTo(W*0.75,H-40,W,H-5); ctx.lineTo(W,H); ctx.fill();
  }

  function spawn(){
    const cards = Array.isArray(window.CARDS)?CARDS:[];
    if (!cards.length) return;
    const targets = cards.filter(c => targetCheck(c.text, c.tags));
    const others  = cards.filter(c => !targetCheck(c.text, c.tags));
    const pool = (Math.random()<cfg.targetRatio && targets.length)?targets:others;
    const it = pool[Math.floor(Math.random()*pool.length)];
    const r = 26 + Math.random()*9;
    const x = r + Math.random()*(state.W - 2*r);
    const y = state.H + r + 10;
    const vy = -(cfg.minSpeed + Math.random()*(cfg.maxSpeed-cfg.minSpeed));
    const isT = targetCheck(it.text, it.tags);
    state.balloons.push({x,y,r,vy,word:it.text,tags:it.tags,target:isT});
    if (state.balloons.length>cfg.maxBalloons) state.balloons.shift();
  }

  function haloOn(){
    // gắn class halo cho bóng đúng (chỉ hiển thị khi train=true)
    if (!state.train) return;
    // vẽ bằng ring khi draw
  }

  function drawBalloon(ctx,b){
    const x=b.x,y=b.y,r=b.r;
    const grad=ctx.createRadialGradient(x-r*0.4,y-r*0.6,r*0.1,x,y,r);
    const base = b.target? '#FF6F61' : '#6EC6FF';
    grad.addColorStop(0,'rgba(255,255,255,0.9)'); grad.addColorStop(1, base);
    ctx.fillStyle=grad; ctx.beginPath(); ctx.ellipse(x,y,r*0.9,r,0,0,Math.PI*2); ctx.fill();
    if (state.train && b.target){
      ctx.strokeStyle='rgba(255,193,7,.9)'; ctx.lineWidth=4; ctx.beginPath(); ctx.ellipse(x,y,r*1.05,r*1.05,0,0,Math.PI*2); ctx.stroke();
    }
    ctx.fillStyle='#fff'; ctx.font=`${Math.max(12, r*0.78)}px system-ui, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(b.word, x, y+1);
    // dây
    ctx.strokeStyle='#999'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(x,y+r*0.95); for (let i=1;i<=3;i++){ ctx.quadraticCurveTo(x+(i%2?6:-6),y+r*0.95+i*8,x,y+r*0.95+i*10);} ctx.stroke();
  }

  function hit(x,y){
    if (!state.running) return;
    let idx=-1, b=null, min=1e9;
    for (let i=state.balloons.length-1;i>=0;i--){
      const it=state.balloons[i]; const d = Math.hypot(x-it.x, y-it.y);
      if (d<it.r && d<min){ min=d; idx=i; b=it; }
    }
    if (!b) return;
    if (VoiceUI.enabled) TTS.speak(b.word, AppState.learner.ttsRate || 0.9);
    state.balloons.splice(idx,1);
    if (b.target){ state.score+=10; VoiceUI.say('Đúng'); }
    else{ state.lives-=1; state.score=Math.max(0,state.score-5); VoiceUI.say(state.mode==='tone' ? `Sai thanh. Đang tìm thanh ${state.tone}` : `Sai nhóm. Đang tìm ${state.tag}`); }
    updateHUD();
    if (state.lives<=0) end('out_of_lives');
  }

  function updateHUD(){
    q('gScore').textContent=state.score;
    q('gTime').textContent=Math.max(0,Math.ceil(state.timeLeft));
    q('gLives').textContent=state.lives;
    q('btnGameStart').disabled = state.running;
    q('btnGameStop').disabled  = !state.running;
  }

  function step(ts){
    if (!state.running) return;
    if (!state.lastTS) state.lastTS=ts;
    const dt=Math.min(0.05,(ts-state.lastTS)/1000); state.lastTS=ts;
    state.timeLeft -= dt; if (state.timeLeft<=0){ end('time_up'); return; }
    state.spawnT+=dt*1000; if (state.spawnT>=cfg.spawnEvery){ state.spawnT=0; spawn(); }
    for (const b of state.balloons) b.y += b.vy*dt;
    state.balloons = state.balloons.filter(b=> b.y + b.r > -10);
    const {ctx,W,H}=state; drawSky(ctx,W,H);
    for (let i=0;i<5;i++) cloud(ctx,(i*160+(ts/40)%W),50+(i%3)*20,24+(i%3)*8);
    for (const b of state.balloons) drawBalloon(ctx,b);
    ctx.fillStyle='#E2F7DE'; ctx.fillRect(0,H-16,W,24);
    requestAnimationFrame(step);
  }

  function end(reason){
    state.running=false; updateHUD();
    const stars = state.score>=100 ? 2 : (state.score>=60 ? 1 : 0);
    if (stars>0 && window.App) App.addStar(stars);

    const log = {
      type:'game', learnerId: AppState.learner.sysId || '',
      sessionId: 'game_' + Math.random().toString(36).slice(2,8),
      ts: window.__now(),
      gameMode: state.mode, gameTone: state.tone, gameTag: state.tag,
      gameScore: state.score, gameDuration: (cfg.duration - Math.max(0,state.timeLeft))*1000, livesLeft: state.lives
    };
    Sync.enqueue(log);

    alert(`Kết thúc. Điểm: ${state.score}. ${stars?`Thưởng ${'⭐'.repeat(stars)}`:''}`);
  }

  function start(){
    state.running=true; state.timeLeft=cfg.duration; state.score=0; state.lives=3; state.balloons=[]; state.effects=[]; state.lastTS=0; state.spawnT=0;
    updateHUD(); requestAnimationFrame(step);
    VoiceUI.say('Bắt đầu. Hãy tìm đúng theo mục tiêu và vòng sáng.');
  }
  function stop(){ state.running=false; updateHUD(); }

  function init(){
    // Tag options
    const cards = Array.isArray(window.CARDS) ? CARDS : [];
    const tagSet = new Set(); cards.forEach(c => (c.tags||[]).forEach(t=> tagSet.add(t)));
    q('selGameTag').innerHTML = Array.from(tagSet).sort().map(t=>`<option value="${t}">${t}</option>`).join('');

    // UI bindings
    const modeSel = q('selGameMode'); const paneTone=q('paneTone'), paneTag=q('paneTag');
    modeSel.onchange = ()=>{ const m = modeSel.value; state.mode=m; paneTone.style.display=(m==='tone')?'':'none'; paneTag.style.display=(m==='tag')?'':'none'; setTargetText(); };
    q('selGameTone').onchange = (e)=> { state.tone=e.target.value; setTargetText(); };
    q('selGameTag').onchange  = (e)=> { state.tag=e.target.value; setTargetText(); };

    q('btnGameStart').onclick = start;
    q('btnGameStop').onclick  = stop;
    q('btnGameTrain').onclick = ()=>{ state.train = !state.train; q('btnGameTrain').textContent = state.train ? '👟 Tập thử: Bật' : '👟 Tập thử'; };
    q('btnGameSample').onclick= ()=> {
      const sample = (state.mode==='tone') ? (state.tone==='sắc'?'má': state.tone==='huyền'?'mà': state.tone==='hỏi'?'mả': state.tone==='ngã'?'mã': state.tone==='nặng'?'mạ':'ma') : (state.tag==='sx'?'sông':'tranh');
      TTS.speak(sample, AppState.learner.ttsRate || 0.9);
    };
    q('btnGameExplain').onclick = ()=> {
      const msg = (state.mode==='tone') ? `Hãy tìm bóng có từ mang thanh ${state.tone.toUpperCase()}.`
                                        : `Hãy tìm bóng thuộc nhóm ${state.tag} (ví dụ từ có s/x, ch/tr...).`;
      alert(msg);
      VoiceUI.say(msg);
    };

    setTargetText();
    if (!state.canvas) initCanvas();
  }

  return { init, start, stop };
})();