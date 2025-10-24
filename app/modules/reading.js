/* MODULE: READING (UX cải tiến • ẩn danh sysId • chỉ gửi chỉ số đánh giá) */
window.ReadingModule = {
  // Trạng thái phiên
  level: AppState.learner.level || 1,
  passage: null,
  state: 'idle', // idle | running | paused | ended
  startTime: 0,
  pauseStart: 0,
  pausedMs: 0,
  timerId: null,
  usedTTS: 0,

  // Đánh dấu lỗi
  errors: {},              // { tokenIdx: { type: 'tone'|'sx'|'chtr'|'omission'|'insertion'|'other' } }
  tokenElems: [],
  activeErrType: 'other',
  lastMarked: null,
  _errTarget: null,
  _sessionTemp: null,

  // Tiện ích
  words(text){ return (window.wordsOf ? window.wordsOf(text) : String(text||'').trim().split(/\s+/).filter(Boolean)); },

  // CSS bổ sung (tiêm 1 lần)
  _styled: false,
  _ensureStyle(){
    if (this._styled) return;
    const css = `
      .rd-stepper{display:flex;gap:8px;align-items:center;margin:6px 0 10px;flex-wrap:wrap}
      .rd-step{display:flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--border);border-radius:999px;padding:6px 10px;font-size:12px;opacity:.7}
      .rd-step.active{opacity:1;box-shadow:var(--shadow)}
      .rd-dot{width:8px;height:8px;border-radius:50%;background:#bbb}
      .rd-step.active .rd-dot{background:var(--primary)}
      .rd-palette{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:8px 0}
      .rd-palette button{border:1px solid var(--border);background:#fff;border-radius:999px;padding:8px 10px}
      .rd-palette button.active{outline:3px solid var(--primary)}
      .rd-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0}
      .rd-prog{position:relative;flex:1;height:10px;background:#f1e8d2;border:1px solid var(--border);border-radius:999px;overflow:hidden;min-width:120px}
      .rd-prog>span{position:absolute;left:0;top:0;bottom:0;background:var(--primary);width:0%}
      .rd-help{font-size:13px;color:var(--muted);padding:6px 8px;border:1px dashed var(--border);border-radius:10px;background:var(--panel);margin:6px 0}
      .rd-badge{display:inline-flex;gap:6px;align-items:center;padding:6px 10px;border:1px solid var(--border);border-radius:999px;background:#fff}
      .token.err{outline:3px solid var(--danger)}
      .token.focused{box-shadow:0 0 0 3px rgba(21,101,192,.2)}
      @media (max-width:560px){
        .rd-palette button{padding:7px 9px;font-size:12px}
      }
    `;
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    this._styled = true;
  },

  // Tạo phần UI bổ trợ (stepper, palette, nút tạm dừng/hoàn tác)
  _ensureScaffold(){
    const host = document.getElementById('screen-reading'); if (!host) return;
    // Stepper
    if (!host.querySelector('.rd-stepper')){
      const s = document.createElement('div');
      s.className = 'rd-stepper';
      s.innerHTML = `
        <div class="rd-step" data-step="1"><span class="rd-dot"></span><b>1</b> Chọn bài</div>
        <div class="rd-step" data-step="2"><span class="rd-dot"></span><b>2</b> Đọc</div>
        <div class="rd-step" data-step="3"><span class="rd-dot"></span><b>3</b> Câu hỏi</div>
      `;
      host.querySelector('.section')?.prepend(s);
    }
    // Dải tiến độ + nút bổ sung
    const barWrapId = 'rd-bar-wrap';
    if (!document.getElementById(barWrapId)){
      const bar = document.createElement('div');
      bar.id = barWrapId; bar.className='rd-bar';
      bar.innerHTML = `
        <span class="rd-badge">⏱ <span id="rdTime">00:00</span></span>
        <span class="rd-badge">WCPM: <b id="rdW">—</b></span>
        <span class="rd-badge">% đúng: <b id="rdA">—</b></span>
        <div class="rd-prog" aria-label="Tiến độ đọc"><span id="rdProg"></span></div>
        <button class="ghost" id="btnPause" style="display:none">⏸️ Tạm dừng</button>
        <button class="ghost" id="btnResume" style="display:none">▶️ Tiếp tục</button>
        <button class="ghost" id="btnUndo" title="Hoàn tác lỗi gần nhất">↩️ Hoàn tác</button>
        <button class="danger" id="btnFinish" style="display:none">✔️ Hoàn tất</button>
      `;
      // chèn sau khối nút start/stop
      const sections = host.querySelectorAll('.section');
      if (sections[1]) sections[1].appendChild(bar);
      // gán sự kiện
      document.getElementById('btnPause').onclick = ()=> this.pause();
      document.getElementById('btnResume').onclick = ()=> this.resume();
      document.getElementById('btnUndo').onclick = ()=> this.undo();
      document.getElementById('btnFinish').onclick = ()=> this.stopThenQuestion();
    }
    // Palette chọn lỗi
    const palId = 'rdPalette';
    if (!document.getElementById(palId)){
      const pal = document.createElement('div');
      pal.id = palId; pal.className='rd-palette';
      pal.innerHTML = `
        <span class="rd-badge">🖊️ Loại lỗi:</span>
        <button data-t="tone">Thanh điệu</button>
        <button data-t="sx">s/x</button>
        <button data-t="chtr">ch/tr</button>
        <button data-t="omission">Bỏ âm/từ</button>
        <button data-t="insertion">Thêm âm/từ</button>
        <button data-t="other" class="active">Khác</button>
        <span class="rd-help" id="rdMiniHelp">Chọn loại lỗi rồi chạm vào từ để gán. Chạm lại để bỏ.</span>
      `;
      const targetSec = host.querySelector('#passageView')?.parentElement;
      if (targetSec) targetSec.insertBefore(pal, targetSec.querySelector('.inline-buttons') || null);
      pal.querySelectorAll('button[data-t]').forEach(b=>{
        b.onclick = ()=>{
          pal.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
          b.classList.add('active');
          this.activeErrType = b.getAttribute('data-t');
          VoiceUI.say('Đã chọn ' + b.textContent);
        };
      });
    }
  },

  // Cập nhật stepper
  _setStep(n){
    document.querySelectorAll('.rd-step').forEach(el=>{
      el.classList.toggle('active', Number(el.getAttribute('data-step'))===n);
    });
  },

  // Khởi tạo khi mở tab
  init(){
    this._ensureStyle();
    this._ensureScaffold();

    const src = Array.isArray(window.PASSAGES) ? window.PASSAGES : [];
    const sel = document.getElementById('selLevel');

    // Đổ danh sách cấp độ
    if (sel) {
      if (src.length){
        const levels = Array.from(new Set(src.map(p=>p.level))).sort((a,b)=>a-b);
        sel.innerHTML = levels.map(l=> `<option value="${l}">Cấp ${l}</option>`).join('');
        if (!this.level) this.level = levels[0];
        sel.value = String(this.level);
      }else{
        sel.innerHTML = '<option value="">—</option>';
      }
      this.chooseLevel(this.level);
    }

    // Reset trạng thái
    this.setState('idle');
    this.errors = {};
    this.activeErrType = 'other';
    const sW = document.getElementById('statWCPM'); if (sW) sW.textContent='—';
    const sA = document.getElementById('statAcc'); if (sA) sA.textContent='—';
    const t = document.getElementById('timer'); if (t) t.textContent='00:00';
    document.getElementById('rdW').textContent = '—';
    document.getElementById('rdA').textContent = '—';
    document.getElementById('rdTime').textContent = '00:00';
    document.getElementById('rdProg').style.width = '0%';

    // Hướng dẫn ngắn
    const help = document.getElementById('rdMiniHelp');
    if (help) help.textContent = 'Bấm “Bắt đầu đọc”. Trong khi đọc: chọn loại lỗi rồi chạm vào từ để gán; chạm lại để bỏ. Có thể “Tạm dừng”.';

    // Nếu đang ở Child Mode, đọc gợi ý to
    if (AppState.childMode) Coach.say('Chọn cấp độ rồi bấm Bắt đầu. Chạm vào từ sai để đánh dấu.');
    VoiceUI.attachAll();
    this._setStep(1);
  },

  ensureFocusOn(){
    const pv = document.getElementById('passageView');
    pv.style.maxHeight = '3.4em'; pv.style.overflow = 'hidden';
    pv.style.maskImage = 'linear-gradient(180deg, black 60%, transparent 100%)';
    const btnF = document.getElementById('btnFocus');
    if (btnF) btnF.textContent = 'Chế độ 1 dòng: Bật';
  },

  listByLevel(lv){
    const src = Array.isArray(window.PASSAGES) ? window.PASSAGES : [];
    return src.filter(p=>p.level===+lv);
  },

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
    this.passage = list.find(p => p.id===id) || list[0] || (window.PASSAGES && window.PASSAGES[0]) || { id:'p_na', level:this.level, text:'', questions:[] };
    this.renderPassage();
  },

  randomPassage(){
    const list = this.listByLevel(this.level);
    if (!list.length) return;
    let pick = list[Math.floor(Math.random()*list.length)];
    if (this.passage && list.length>1){
      for (let i=0;i<5 && pick.id===this.passage.id;i++) pick = list[Math.floor(Math.random()*list.length)];
    }
    this.passage = pick;
    const selP = document.getElementById('selPassage'); if (selP) selP.value = pick.id;
    this.renderPassage();
  },

  renderPassage(){
    const view = document.getElementById('passageView');
    if (!view) return;
    view.innerHTML = '';

    const tokens = this.words(this.passage.text);
    if (!tokens.length){
      view.innerHTML = '<div class="help">Không có đoạn đọc ở cấp này.</div>';
    }
    this.tokenElems = tokens.map((w,i)=>{
      const span = document.createElement('span');
      span.className = 'token ' + (window.toneClass ? window.toneClass(w) : '');
      span.textContent = w + ' ';
      span.dataset.idx = i;
      span.onclick = () => this.onToken(i, span);
      span.oncontextmenu = (e)=> { e.preventDefault(); this.openErrMenu(i); };
      span.onpointerdown = ()=> { if (VoiceUI.enabled && this.state!=='running') TTS.speak(w, AppState.learner.ttsRate || 0.9); };
      view.appendChild(span);
      return span;
    });

    const sec = document.getElementById('compSection');
    const qWrap = document.getElementById('questions');
    if (sec) sec.style.display='none';
    if (qWrap) qWrap.innerHTML='';
    VoiceUI.attachAll();
  },

  onToken(i, el){
    // Nếu đang chạy: đánh dấu/bỏ lỗi theo loại đang chọn. Nếu đang tạm dừng/nhàn: phát âm từ.
    if (this.state==='running'){
      if (this.errors[i]) {
        delete this.errors[i];
        el.classList.remove('err');
      } else {
        this.errors[i] = { type: this.activeErrType || 'other' };
        el.classList.add('err');
        this.lastMarked = i;
      }
      this.updateStatsLive();
    } else {
      if (VoiceUI.enabled) TTS.speak((el.textContent||'').trim(), AppState.learner.ttsRate || 0.9);
    }
  },

  openErrMenu(i){
    // Vẫn hỗ trợ menu “nhấn giữ → chọn loại lỗi” như cũ
    if (this.state!=='running') return;
    this._errTarget = i; document.getElementById('errorMenu').classList.add('active');
  },

  setErrType(t){
    if (this._errTarget==null) return;
    const el = this.tokenElems[this._errTarget];
    if (!this.errors[this._errTarget]) this.errors[this._errTarget] = { type: t }; else this.errors[this._errTarget].type = t;
    if (el) el.classList.add('err');
    document.getElementById('errorMenu').classList.remove('active');
    this.updateStatsLive();
  },

  undo(){
    if (this.lastMarked==null) { VoiceUI.say('Không có gì để hoàn tác'); return; }
    const i = this.lastMarked; const el = this.tokenElems[i];
    delete this.errors[i]; if (el) el.classList.remove('err');
    this.lastMarked = null;
    this.updateStatsLive();
  },

  // Điều khiển trạng thái
  setState(st){
    this.state = st;
    const startBtn = document.getElementById('btnStartRead');
    const stopBtn  = document.getElementById('btnStopRead');
    const pauseBtn = document.getElementById('btnPause');
    const resumeBtn= document.getElementById('btnResume');
    const finishBtn= document.getElementById('btnFinish');

    if (st==='idle'){
      if (startBtn) { startBtn.disabled = false; startBtn.textContent='Bắt đầu đọc'; }
      if (stopBtn)  { stopBtn.disabled = true;  stopBtn.textContent='Kết thúc'; }
      if (pauseBtn) pauseBtn.style.display='none';
      if (resumeBtn) resumeBtn.style.display='none';
      if (finishBtn) finishBtn.style.display='none';
      this.pausedMs = 0;
    }
    if (st==='running'){
      if (startBtn) startBtn.disabled = true;
      if (stopBtn)  { stopBtn.disabled = false; stopBtn.textContent='Kết thúc'; }
      if (pauseBtn) { pauseBtn.style.display=''; }
      if (resumeBtn) resumeBtn.style.display='none';
      if (finishBtn) finishBtn.style.display='';
      this._setStep(2);
    }
    if (st==='paused'){
      if (startBtn) startBtn.disabled = true;
      if (stopBtn)  { stopBtn.disabled = false; stopBtn.textContent='Kết thúc'; }
      if (pauseBtn) pauseBtn.style.display='none';
      if (resumeBtn) resumeBtn.style.display='';
      if (finishBtn) finishBtn.style.display='';
    }
    if (st==='ended'){
      if (startBtn) startBtn.disabled = false;
      if (stopBtn)  { stopBtn.disabled = true; }
      if (pauseBtn) pauseBtn.style.display='none';
      if (resumeBtn) resumeBtn.style.display='none';
      if (finishBtn) finishBtn.style.display='none';
      this._setStep(3);
    }
  },

  speakPassage(){ this.usedTTS++; TTS.speak(this.passage.text || '', AppState.learner.ttsRate || 0.9); },

  start(){
    if (this.state==='running') return;
    if (this.state==='paused'){ this.resume(); return; }
    this.errors = {};
    this.tokenElems.forEach(el=> el.classList.remove('err','focused'));
    this.startTime = window.__now(); this.pausedMs = 0;
    this.setState('running');
    this.updateTimer();
    VoiceUI.say('Bắt đầu tính giờ. Cố gắng đọc đều nhé.');
  },

  pause(){
    if (this.state!=='running') return;
    this.pauseStart = window.__now();
    this.setState('paused');
    clearTimeout(this.timerId);
    VoiceUI.say('Đã tạm dừng.');
  },

  resume(){
    if (this.state!=='paused') return;
    const elapsedPause = window.__now() - (this.pauseStart||window.__now());
    this.pausedMs += elapsedPause;
    this.pauseStart = 0;
    this.setState('running');
    this.updateTimer();
    VoiceUI.say('Tiếp tục.');
  },

  stopThenQuestion(){
    if (this.state==='idle') return;
    this.setState('ended');
    clearTimeout(this.timerId);

    // Tính số liệu
    const dur = (window.__now() - this.startTime) - (this.pausedMs||0);
    const total = this.words(this.passage.text).length;
    const wrong = Object.keys(this.errors).length;
    const correct = Math.max(0, total - wrong);
    const minutes = Math.max(0.5, dur/60000);
    const wcpm = Math.round(correct / minutes);
    const acc = total ? +(correct/total).toFixed(3) : 0;

    // Hiển thị lên UI chính
    const sW = document.getElementById('statWCPM'); if (sW) sW.textContent = wcpm;
    const sA = document.getElementById('statAcc'); if (sA) sA.textContent = (acc*100).toFixed(0) + '%';
    document.getElementById('rdW').textContent = wcpm;
    document.getElementById('rdA').textContent = (acc*100).toFixed(0) + '%';

    // Lưu tạm để gửi sau khi làm câu hỏi
    this._sessionTemp = { dur, total, correct, wcpm, acc };

    // Render câu hỏi
    this.renderQuestions();
    VoiceUI.say('Dừng đọc. Trả lời câu hỏi nhé.');
  },

  updateTimer(){
    if (this.state!=='running') return;
    const now = window.__now();
    const elapsed = (now - this.startTime) - (this.pausedMs||0);
    const el = document.getElementById('timer'); if (el) el.textContent = window.fmtTime(elapsed);
    const el2= document.getElementById('rdTime'); if (el2) el2.textContent = window.fmtTime(elapsed);

    // Tiến độ (ước lượng theo thời gian / 90s hoặc theo số từ đánh dấu)
    const estTotalMs = Math.max(60000, this.words(this.passage.text).length * 1000); // mốc ước lượng
    const p = Math.max(0, Math.min(100, Math.round(elapsed/estTotalMs*100)));
    const bar = document.getElementById('rdProg'); if (bar) bar.style.width = p + '%';

    this.timerId = setTimeout(()=> this.updateTimer(), 200);
    this.updateStatsLive();
  },

  updateStatsLive(){
    if (this.state!=='running') return;
    const dur = (window.__now() - this.startTime) - (this.pausedMs||0);
    const total = this.words(this.passage.text).length;
    const wrong = Object.keys(this.errors).length;
    const correct = Math.max(0, total - wrong);
    const minutes = Math.max(0.5, dur/60000);
    const wcpm = Math.round(correct / minutes);
    const acc = total ? +(correct/total).toFixed(3) : 0;
    const sW = document.getElementById('statWCPM'); if (sW) sW.textContent = wcpm;
    const sA = document.getElementById('statAcc'); if (sA) sA.textContent = (acc*100).toFixed(0) + '%';
    const sW2 = document.getElementById('rdW'); if (sW2) sW2.textContent = wcpm;
    const sA2 = document.getElementById('rdA'); if (sA2) sA2.textContent = (acc*100).toFixed(0) + '%';
  },

  toggleRec(){
    const btn = document.getElementById('btnRec');
    if (!Recorder.recording && !Recorder.lastBlob){
      Recorder.toggle(); if (btn) btn.textContent = 'Đang ghi... Nhấn để dừng';
    } else if (Recorder.recording){
      Recorder.stop(); if (btn) btn.textContent = 'Nghe lại bản ghi';
    } else { Recorder.play(); }
  },

  renderQuestions(){
    const sec = document.getElementById('compSection');
    const qWrap = document.getElementById('questions');
    if (!sec || !qWrap) return;
    qWrap.innerHTML = '';
    for (const [i,q] of (this.passage.questions || []).entries()){
      const div = document.createElement('div'); div.className = 'question';
      div.innerHTML = `<div><b>Câu ${i+1}:</b> ${q.q}</div>`;
      const opts = document.createElement('div'); opts.className='inline-buttons';
      q.choices.forEach((c, idx)=>{
        const b = document.createElement('button');
        b.textContent = c;
        b.setAttribute('data-voice', `Chọn đáp án ${c}`);
        b.onclick = ()=> { div.dataset.sel = idx; Array.from(opts.children).forEach(ch => ch.style.outline='none'); b.style.outline = '2px solid var(--primary)'; };
        opts.appendChild(b);
      });
      div.appendChild(opts); qWrap.appendChild(div);
    }
    sec.style.display = (this.passage.questions || []).length ? '' : 'none';
    VoiceUI.attachAll();
    this._setStep(3);
  },

  finishComp(){
    const qList = this.passage.questions || [];
    const chosen = Array.from(document.querySelectorAll('#questions .question')).map((div,i)=>{
      const sel = +(div.dataset.sel ?? -1); const correct = qList[i]?.ans ?? -1;
      return { sel, correct };
    });
    const compCorrect = chosen.filter(x=>x.sel===x.correct).length;
    const compTotal = qList.length;

    const temp = this._sessionTemp || { dur:0,total:0,correct:0,wcpm:0,acc:0 };

    // Đếm lỗi theo loại
    const errorsByType = { tone:0, sx:0, chtr:0, omission:0, insertion:0, other:0 };
    Object.values(this.errors).forEach(e => {
      if (e && errorsByType.hasOwnProperty(e.type)) errorsByType[e.type]++; else errorsByType.other++;
    });

    // Log ẩn danh
    const log = {
      type: 'reading',
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
      errorsByType, usedTTS: this.usedTTS || 0, scaffolds: []
    };

    AppState.logs.push(log); Store.set('logs', AppState.logs);

    // Thưởng sao
    const recent = AppState.logs.filter(x=>x.type==='reading').slice(-2);
    const lastW = recent.length>=2 ? recent[recent.length-2].wcpm : 0;
    if (log.accuracy >= 0.9 || (lastW && log.wcpm > lastW)) { if (window.App) App.addStar(1); }

    alert(`Hoàn tất! WCPM: ${log.wcpm}, Chính xác: ${(log.accuracy*100).toFixed(0)}%, Hiểu: ${compCorrect}/${compTotal}`);
    VoiceUI.say(`Hoàn thành bài đọc. Trả lời đúng ${compCorrect} trên ${compTotal}.`);

    // Adaptive và UI
    AppState.learner.level = window.adaptivePlan(AppState.logs, AppState.learner.level).nextLevel; Store.set('learner', AppState.learner);
    if (window.App){ App.updateLearnerBadge(); App.updateNextLevelHint(); }

    // Đồng bộ
    window.Sync.enqueue(log);

    // Reset về bước chọn bài
    this.usedTTS = 0; this._sessionTemp = null; this.setState('idle');
    const sec = document.getElementById('compSection'); if (sec) sec.style.display='none';
    this._setStep(1);
    if (AppState.childMode) Coach.say('Con làm tốt lắm! Chọn bài tiếp theo nhé.');
  }
};