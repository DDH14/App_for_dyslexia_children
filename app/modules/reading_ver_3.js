/* READING – Tự lưu nếu không có câu hỏi, luồng 4 bước rõ ràng, ẩn danh sysId */
window.ReadingModule = {
  level: AppState.learner.level || 1,
  passage: null,
  started:false, startTime:0, timerId:null, usedTTS:0,
  markMode:'normal', errors:{}, tokenElems:[], _errTarget:null, _sessionTemp:null,

  wordSplit(t){ return (window.wordsOf?wordsOf(t):String(t||'').trim().split(/\s+/).filter(Boolean)); },

  goStep(n){
    const ids=['readStep1','readStep2','readStep3','readStep4'];
    ids.forEach((id,i)=>{ const el=document.getElementById(id); if(el) el.style.display=(i===(n-1))?'':'none'; });
    document.querySelectorAll('#readSteps .step').forEach((el,i)=> el.classList.toggle('active', i===(n-1)));
    if (n===3){ this.renderPassage(); A11Y.rebind?.(); }
  },

  init(){
    // Đổ cấp độ
    const src = Array.isArray(window.PASSAGES) ? window.PASSAGES : [];
    const sel = document.getElementById('selLevel');
    if (sel){
      if (src.length){
        const levels = Array.from(new Set(src.map(p=>p.level))).sort((a,b)=>a-b);
        sel.innerHTML = levels.map(l=> `<option value="${l}">Cấp ${l}</option>`).join('');
        if (!this.level) this.level = levels[0];
        sel.value = String(this.level);
      }else sel.innerHTML = '<option value="">—</option>';
      this.chooseLevel(this.level);
    }
    // Reset chỉ số
    this.markMode = AppState.childMode ? 'error' : 'normal';
    this.errors = {};
    const sW = document.getElementById('statWCPM'); if (sW) sW.textContent='—';
    const sA = document.getElementById('statAcc'); if (sA) sA.textContent='—';
    const t  = document.getElementById('timer');   if (t)  t.textContent='00:00';
    this.goStep(1);
  },

  listByLevel(lv){ const src=Array.isArray(window.PASSAGES)?window.PASSAGES:[]; return src.filter(p=>p.level===+lv); },
  chooseLevel(lv){
    this.level = +lv || this.level || 1;
    const list = this.listByLevel(this.level);
    const selP = document.getElementById('selPassage');
    if (selP){
      selP.innerHTML = list.map(p => `<option value="${p.id}">${p.id}</option>`).join('');
      if (list[0]) selP.value = list[0].id;
    }
    this.choosePassage(selP?.value || (list[0]?.id) || null);
  },
  choosePassage(id){
    const list = this.listByLevel(this.level);
    this.passage = list.find(p => p.id===id) || list[0] || (window.PASSAGES && PASSAGES[0]) || { id:'p_na', level:this.level, text:'', questions:[] };
    // Chỉ render chữ ở Bước 3 – là bước đánh dấu lỗi
    if (document.getElementById('readStep3')?.style.display!=='none') this.renderPassage();
  },
  randomPassage(){
    const list = this.listByLevel(this.level); if (!list.length) return;
    let pick = list[Math.floor(Math.random()*list.length)];
    if (this.passage && list.length>1){ for (let i=0;i<5 && pick.id===this.passage.id;i++) pick = list[Math.floor(Math.random()*list.length)]; }
    this.passage = pick;
    const selP = document.getElementById('selPassage'); if (selP) selP.value = pick.id;
    if (document.getElementById('readStep3')?.style.display!=='none') this.renderPassage();
  },

  renderPassage(){
    const view = document.getElementById('passageView'); if (!view) return;
    view.innerHTML = '';
    const tokens = this.wordSplit(this.passage.text);
    if (!tokens.length) view.innerHTML = '<div class="help">Không có đoạn đọc ở cấp này.</div>';
    this.tokenElems = tokens.map((w,i)=>{
      const span = document.createElement('span');
      span.className = 'token ' + (window.toneClass ? toneClass(w) : '');
      span.textContent = w + ' ';
      span.dataset.idx = i;
      span.onclick = () => this.onTokenClick(i, span);
      span.oncontextmenu = (e)=> { e.preventDefault(); this.openErrMenu(i); };
      span.onpointerdown = ()=> { if (VoiceUI.enabled) TTS.speak(w, AppState.learner.ttsRate || 0.9); };
      view.appendChild(span);
      return span;
    });
    VoiceUI.attachAll();
    A11Y.rebind?.();
  },

  clearMarks(){
    this.errors = {};
    for (const el of this.tokenElems) el.style.outline = 'none';
    const sW=document.getElementById('statWCPM'); if(sW) sW.textContent='—';
    const sA=document.getElementById('statAcc'); if(sA) sA.textContent='—';
  },
  onTokenClick(i, el){
    if (this.markMode!=='error') return;
    if (this.errors[i]) { delete this.errors[i]; el.style.outline='none'; }
    else { this.errors[i]={ type:'other' }; el.style.outline='3px solid var(--danger)'; }
    this.updateStatsLive();
  },
  openErrMenu(i){ if (this.markMode!=='error') return; this._errTarget=i; document.getElementById('errorMenu').classList.add('active'); },
  setErrType(t){
    if (this._errTarget==null) return;
    this.errors[this._errTarget]={ type:t };
    const el=this.tokenElems[this._errTarget]; if(el) el.style.outline='3px solid var(--danger)';
    document.getElementById('errorMenu').classList.remove('active');
    this.updateStatsLive();
  },
  markMode(mode){
    this.markMode=mode;
    const be=document.getElementById('btnErr'); const bn=document.getElementById('btnNorm');
    if (be) be.className=mode==='error'?'hint':'ghost';
    if (bn) bn.className=mode==='normal'?'hint':'ghost';
    VoiceUI.say(mode==='error'?'Đang ở chế độ đánh dấu lỗi':'Đang ở chế độ bình thường');
  },

  speakPassage(){ this.usedTTS++; TTS.speak(this.passage.text || '', AppState.learner.ttsRate || 0.9); },

  start(){
    if (this.started) return;
    this.started=true; this.startTime=window.__now(); this.errors={};
    this.updateTimer();
    const bs=document.getElementById('btnStartRead'); const be=document.getElementById('btnStopRead');
    if (bs) bs.disabled=true; if (be) be.disabled=false;
    this.markMode='error';
    VoiceUI.say('Bắt đầu. Khi xong bấm Kết thúc.');
  },
  stop(){
    if (!this.started) return;
    this.started=false; clearTimeout(this.timerId);
    const bs=document.getElementById('btnStartRead'); const be=document.getElementById('btnStopRead');
    if (bs) bs.disabled=false; if (be) be.disabled=true;

    const dur=window.__now()-this.startTime;
    const total=this.wordSplit(this.passage.text).length;
    const wrong=Object.keys(this.errors).length;
    const correct=Math.max(0,total-wrong);
    const minutes=Math.max(0.5,dur/60000);
    const wcpm=Math.round(correct/minutes);
    const acc= total ? +(correct/total).toFixed(3) : 0;

    this._sessionTemp={ dur,total,correct,wcpm,acc };
    document.getElementById('statWCPM').textContent = wcpm;
    document.getElementById('statAcc').textContent  = (acc*100).toFixed(0)+'%';

    // Nếu không có câu hỏi → tự lưu ngay
    const hasQ = (this.passage.questions||[]).length>0;
    if (!hasQ){
      this.commitLog(0,0, /*auto*/true);
      alert(`Đã lưu: WCPM ${wcpm}, Chính xác ${(acc*100).toFixed(0)}%`);
      this.goStep(1);
      return;
    }
    // Có câu hỏi → sang bước đánh dấu rồi bước 4
    this.goStep(3);
    VoiceUI.say('Đánh dấu từ sai nếu có. Sau đó sang bước 4 để trả lời câu hỏi.');
  },

  updateTimer(){
    if (!this.started) return;
    const t=window.__now()-this.startTime; const el=document.getElementById('timer'); if(el) el.textContent=fmtTime(t);
    this.timerId=setTimeout(()=>this.updateTimer(),200); this.updateStatsLive();
  },
  updateStatsLive(){
    if (!this.started) return;
    const dur=window.__now()-this.startTime; const total=this.wordSplit(this.passage.text).length;
    const wrong=Object.keys(this.errors).length; const correct=Math.max(0,total-wrong);
    const minutes=Math.max(0.5,dur/60000); const wcpm=Math.round(correct/minutes);
    const acc= total ? +(correct/total).toFixed(3) : 0;
    const sW=document.getElementById('statWCPM'); if (sW) sW.textContent=wcpm;
    const sA=document.getElementById('statAcc'); if (sA) sA.textContent=(acc*100).toFixed(0)+'%';
  },

  // Lưu log (dùng cho finishComp và auto-save)
  commitLog(compCorrect, compTotal, autoSave=false){
    const temp=this._sessionTemp||{ dur:0,total:0,correct:0,wcpm:0,acc:0 };
    const errorsByType={ tone:0, sx:0, chtr:0, omission:0, insertion:0, other:0 };
    Object.values(this.errors).forEach(e=>{ if(e&&errorsByType[e.type]!=null) errorsByType[e.type]++; else errorsByType.other++; });

    const log={
      type:'reading',
      learnerId: AppState.learner.sysId || '',
      sessionId: Math.random().toString(36).slice(2,10),
      ts: window.__now(),
      passageId: this.passage.id,
      level: this.level,
      durationMs: temp.dur,
      totalWords: temp.total,
      correctWords: temp.correct,
      wcpm: temp.wcpm,
      accuracy: temp.acc,
      compCorrect, compTotal,
      errorsByType, usedTTS: this.usedTTS||0, scaffolds:[]
    };
    AppState.logs.push(log); Store.set('logs', AppState.logs);
    window.Sync.enqueue(log);

    // Cập nhật gợi ý cấp độ
    AppState.learner.level = adaptivePlan(AppState.logs, AppState.learner.level).nextLevel; Store.set('learner', AppState.learner);
    App.updateLearnerBadge?.(); App.updateNextLevelHint?.();

    if (!autoSave){
      // thưởng sao (tùy điều kiện)
      const recent=AppState.logs.filter(x=>x.type==='reading').slice(-2);
      const lastW=recent.length>=2 ? recent[recent.length-2].wcpm : 0;
      if (log.accuracy>=0.9 || (lastW && log.wcpm>lastW)) App.addStar?.(1);
    }
    // Reset
    this.usedTTS=0; this._sessionTemp=null; this.errors={};
  },

  toggleRec(){
    const btn=document.getElementById('btnRec');
    if (!Recorder.recording && !Recorder.lastBlob){ Recorder.toggle(); if(btn) btn.textContent='Đang ghi... Nhấn để dừng'; }
    else if (Recorder.recording){ Recorder.stop(); if(btn) btn.textContent='Nghe lại bản ghi'; }
    else Recorder.play();
  },

  renderQuestions(){
    const qWrap=document.getElementById('questions'); if (!qWrap) return;
    qWrap.innerHTML='';
    for (const [i,q] of (this.passage.questions||[]).entries()){
      const div=document.createElement('div'); div.className='question';
      div.innerHTML=`<div><b>Câu ${i+1}:</b> ${q.q}</div>`;
      const opts=document.createElement('div'); opts.className='inline-buttons';
      q.choices.forEach((c,idx)=>{
        const b=document.createElement('button'); b.textContent=c; b.setAttribute('data-voice',`Chọn đáp án ${c}`);
        b.onclick=()=>{ div.dataset.sel=idx; Array.from(opts.children).forEach(ch=>ch.style.outline='none'); b.style.outline='2px solid var(--primary)'; };
        opts.appendChild(b);
      });
      div.appendChild(opts); qWrap.appendChild(div);
    }
  },

  finishComp(){
    // Đọc kết quả câu hỏi
    const qList=this.passage.questions||[];
    const chosen=Array.from(document.querySelectorAll('#questions .question')).map((div,i)=>{
      const sel=+(div.dataset.sel ?? -1); const correct=qList[i]?.ans ?? -1;
      return { sel, correct };
    });
    const compCorrect=chosen.filter(x=>x.sel===x.correct).length; const compTotal=qList.length;

    this.commitLog(compCorrect, compTotal);
    alert(`Đã lưu! Hiểu nội dung: ${compCorrect}/${compTotal}.`);
    VoiceUI.say('Hoàn thành. Dữ liệu đã được lưu.');
    this.goStep(1);
  }
};