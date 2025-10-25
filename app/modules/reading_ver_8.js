/* MODULE: READING – 4 bước, ghi âm tự động, tắt âm khác khi ghi,
   hiển thị đoạn dễ đọc (B2), đánh dấu từ (B3), và ước tính tự động WCPM/% đúng (nếu có ASR). */
window.ReadingModule = {
  // Trạng thái chung
  level: AppState.learner.level || 1,
  passage: null,

  // Phiên đọc
  started: false,
  startTime: 0,
  timerId: null,
  usedTTS: 0,

  // Đánh dấu thủ công
  markMode: 'normal',
  errors: {},               // { idx: {type: 'tone'|'sx'|'chtr'|'omission'|'insertion'|'other'} }
  tokenElems: [],

  // Nhận dạng & chính sách âm thanh
  asr: null,
  asrText: '',
  asrAvailable: ('webkitSpeechRecognition' in window),
  audioMutedDuringRec: false,
  prevVoiceUIEnabled: true,

  // Lưu tạm kết quả phiên (dùng khi gửi log)
  _sessionTemp: null,
  _errTarget: null,
  _currentStep: 1,

  // Tiện ích
  wordSplit(text){ return (window.wordsOf ? window.wordsOf(text) : String(text||'').trim().split(/\s+/).filter(Boolean)); },

  /* ========== Khởi tạo màn hình Luyện đọc ========== */
  init(){
    // Đổ danh sách cấp độ
    const src = Array.isArray(window.PASSAGES) ? window.PASSAGES : [];
    const sel = document.getElementById('selLevel');

    if (sel) {
      if (src.length){
        const levels = Array.from(new Set(src.map(p=>p.level))).sort((a,b)=>a-b);
        sel.innerHTML = levels.map(l=> `<option value="${l}">Cấp ${l}</option>`).join('');
        if (!this.level) this.level = levels[0];
        sel.value = String(this.level);
      }else{
        sel.innerHTML = '<option value="">—</option>';
      }
    }

    this.chooseLevel(this.level);
    this.goStep(1);

    // Reset chỉ số
    this.errors = {};
    const sW = document.getElementById('statWCPM'); if (sW) sW.textContent='—';
    const sA = document.getElementById('statAcc'); if (sA) sA.textContent='—';
    const t = document.getElementById('timer'); if (t) t.textContent='00:00';

    // Child mode → bật “1 dòng”
    if (AppState.childMode) this.ensureFocusOn(true);
    this.markMode = AppState.childMode ? 'error' : 'normal';
  },

  /* ========== Điều hướng 4 bước ========== */
  goStep(n){
    if ((n===3 || n===4) && this.started){
      alert('Hãy bấm “Kết thúc” trước khi sang bước tiếp theo.');
      return;
    }
    const ids = ['readStep1','readStep2','readStep3','readStep4'];
    ids.forEach((id,idx)=>{
      const el = document.getElementById(id);
      if (el) el.style.display = (idx===(n-1)) ? '' : 'none';
    });
    this._currentStep = n; this.updateStepper(n);

    if (n===2) this.renderPlainPassage();     // Đoạn dễ đọc
    if (n===3) this.renderPassageTokens();    // Đoạn bấm‑được để đánh dấu
    if (n===4) this.renderQuestions();        // Câu hỏi

    const msg = {1:'Chọn cấp độ và bài, rồi bấm Tiếp tục.',
                 2:'Bấm Bắt đầu để tính giờ. Đọc to, sau đó bấm Kết thúc.',
                 3:'Đánh dấu từ sai hoặc chọn loại lỗi.',
                 4:'Chọn đáp án rồi bấm Hoàn tất.'}[n];
    VoiceUI.say(msg || '');
  },
  updateStepper(step){
    const box = document.getElementById('readSteps');
    if (!box) return;
    Array.from(box.querySelectorAll('.step')).forEach(el=>{
      el.classList.toggle('active', String(el.getAttribute('data-step'))===String(step));
    });
  },

  /* ========== B1: chọn cấp/bài ========== */
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
    this.renderPlainPassage();
    this.renderPassageTokens();
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
    this.renderPlainPassage(); this.renderPassageTokens();
  },

  /* ========== B2: hiển thị đoạn dễ đọc ========== */
  renderPlainPassage(){
    const el = document.getElementById('passageText');
    if (!el) return;
    const text = String(this.passage?.text || '').trim();
    const parts = text.split(/([.!?…]+)\s+/u).filter(Boolean); // tách câu
    el.innerHTML = '';
    for (let i=0;i<parts.length;i+=2){
      const line = (parts[i]||'') + (parts[i+1]||'');
      const p = document.createElement('div');
      p.textContent = line;
      p.className = 'reading-line';
      el.appendChild(p);
    }
    this.applyFocusMask();
  },

  /* ========== B3: hiển thị đoạn bấm‑được ========== */
  renderPassageTokens(){
    const view = document.getElementById('passageView');
    if (!view) return;
    view.innerHTML = '';
    const tokens = this.wordSplit(this.passage.text);
    this.tokenElems = tokens.map((w,i)=>{
      const span = document.createElement('span');
      span.className = 'token ' + (window.toneClass ? window.toneClass(w) : '');
      span.textContent = w + ' ';
      span.dataset.idx = i;
      span.onclick = () => this.onTokenClick(i, span);
      span.oncontextmenu = (e)=> { e.preventDefault(); this.openErrMenu(i); };
      span.onpointerdown = ()=> { if (!this.audioMutedDuringRec && VoiceUI.enabled) TTS.speak(w, AppState.learner.ttsRate || 0.9); };
      view.appendChild(span);
      return span;
    });
    this.applyFocusMask();
  },

  /* ========== Chế độ 1 dòng cho B2 & B3 ========== */
  ensureFocusOn(forceOn){
    const apply = (el)=>{
      if (!el) return;
      el.style.maxHeight = '3.4em';
      el.style.overflow = 'hidden';
      el.style.maskImage = 'linear-gradient(180deg, black 60%, transparent 100%)';
    };
    if (forceOn){
      apply(document.getElementById('passageText'));
      apply(document.getElementById('passageView'));
    }
  },
  applyFocusMask(){
    // nếu nút 1 dòng (ở UI cũ) đang bật thì áp dụng cho cả hai vùng
    const btnF = document.getElementById('btnFocus');
    const isOn = btnF && /Bật$/.test(btnF.textContent || '');
    if (isOn) this.ensureFocusOn(true);
  },

  /* ========== Đánh dấu lỗi thủ công (B3) ========== */
  clearMarks(){
    this.errors = {};
    for (const el of this.tokenElems) el.style.outline = 'none';
    const sW = document.getElementById('statWCPM'); if (sW) sW.textContent='—';
    const sA = document.getElementById('statAcc'); if (sA) sA.textContent='—';
  },
  onTokenClick(i, el){
    if (this.markMode!=='error') return;
    if (this.errors[i]) { delete this.errors[i]; el.style.outline = 'none'; }
    else { this.errors[i] = { type: 'other' }; el.style.outline = '3px solid var(--danger)'; }
    this.updateStatsLive();
  },
  openErrMenu(i){
    if (this.markMode!=='error') return;
    this._errTarget = i; document.getElementById('errorMenu').classList.add('active');
  },
  setErrType(t){
    if (this._errTarget==null) return;
    this.errors[this._errTarget] = { type: t };
    const el = this.tokenElems[this._errTarget]; if (el) el.style.outline = '3px solid var(--danger)';
    document.getElementById('errorMenu').classList.remove('active');
    this.updateStatsLive();
  },
  markMode(mode){
    this.markMode = mode;
    const be = document.getElementById('btnErr'); const bn = document.getElementById('btnNorm');
    if (be) be.className = mode==='error'? 'hint' : 'ghost';
    if (bn) bn.className = mode==='normal'? 'hint' : 'ghost';
    VoiceUI.say(mode==='error' ? 'Đang ở chế độ đánh dấu lỗi' : 'Đang ở chế độ bình thường');
  },

  /* ========== Ghi âm & tắt âm khác khi ghi ========== */
  muteAllAudio(on){
    this.audioMutedDuringRec = !!on;
    // Tắt TTS chồng âm
    try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch(_){}
    // Tắt VoiceUI tạm thời khi ghi
    if (on){
      this.prevVoiceUIEnabled = VoiceUI.enabled;
      VoiceUI.enabled = false;
    }else{
      VoiceUI.enabled = this.prevVoiceUIEnabled;
    }
  },

  /* ========== Bắt đầu/Kết thúc ========== */
  start(){
    if (this.started) return;
    this.started = true; this.startTime = window.__now(); this.errors = {};
    this.updateTimer();

    // UI nút
    const bs = document.getElementById('btnStartRead'); const be = document.getElementById('btnStopRead'); const br = document.getElementById('btnRec');
    if (bs) bs.disabled = true; if (be) be.disabled = false;

    // Tắt mọi nguồn âm khác khi ghi
    this.muteAllAudio(true);

    // Tự ghi âm (nếu chưa ghi)
    if (!window.Recorder?.recording) {
      try{
        Recorder.toggle(600); // tối đa 10 phút
        if (br) br.textContent = 'Đang ghi... Nhấn để dừng';
      }catch(_){ /* nếu không ghi được cũng không lỗi màn hình */ }
    }

    // Bật nhận dạng giọng nói (ASR) nếu khả dụng
    this.asrText = '';
    if (this.asrAvailable){
      try{
        const SR = window.webkitSpeechRecognition;
        this.asr = new SR();
        this.asr.lang = 'vi-VN';
        this.asr.interimResults = true;
        this.asr.continuous = true;
        this.asr.onresult = (e)=>{
          for (let i=e.resultIndex;i<e.results.length;i++){
            if (e.results[i].isFinal) this.asrText += (e.results[i][0].transcript + ' ');
          }
        };
        // Tránh lỗi kết thúc sớm: tự khởi động lại khi còn đang ghi
        this.asr.onend = ()=>{
          if (this.started && this.asr) { try{ this.asr.start(); }catch(_){ } }
        };
        this.asr.start();
      }catch(_){ /* bỏ qua nếu bị chặn */ }
    }

    this.markMode = 'error';
    const b1 = document.getElementById('btnErr'); const b2 = document.getElementById('btnNorm');
    if (b1) b1.className = 'hint'; if (b2) b2.className = 'ghost';
    VoiceUI.say('Bắt đầu tính giờ. Cố gắng đọc đều nhé.');
  },

  stop(){
    if (!this.started) return;
    this.started = false; clearTimeout(this.timerId);

    // Dừng ghi âm
    try{
      if (window.Recorder?.recording) {
        Recorder.stop();
        const br = document.getElementById('btnRec'); if (br) br.textContent = 'Nghe lại bản ghi';
      }
    }catch(_){}

    // Dừng ASR
    try{ if (this.asr){ this.asr.onend=null; this.asr.stop(); this.asr=null; } }catch(_){}

    // Bật lại âm thanh
    this.muteAllAudio(false);

    const bs = document.getElementById('btnStartRead'); const be = document.getElementById('btnStopRead');
    if (bs) bs.disabled = false; if (be) be.disabled = true;

    // Tính toán tự động nếu có ASR, ngược lại để B3 đánh dấu thủ công
    const dur = window.__now() - this.startTime;
    const expected = this.wordSplit(this.passage.text);
    let correct = null;

    if (this.asrText.trim()){
      const rec = this.wordSplit(this.normalizeText(this.asrText));
      const matched = this.lcsLength(expected.map(this.normalizeText), rec);
      correct = matched; // ước lượng đúng
    }

    // Nếu chưa có ASR → để người dùng sang B3 đánh dấu, stats tạm để “—”
    if (correct==null){
      const sW = document.getElementById('statWCPM'); if (sW) sW.textContent = '—';
      const sA = document.getElementById('statAcc'); if (sA) sA.textContent = '—';
      this._sessionTemp = { dur, total: expected.length, correct: expected.length, wcpm: 0, acc: 0 };
      VoiceUI.say('Đã dừng. Hãy sang bước 3 để đánh dấu lỗi.');
      return;
    }

    const total = expected.length;
    const minutes = Math.max(0.25, dur/60000);
    const wcpm = Math.round(correct / minutes);
    const acc = total ? +(correct/total).toFixed(3) : 0;

    this._sessionTemp = { dur, total, correct, wcpm, acc, auto:true, asrText: this.asrText };

    const sW = document.getElementById('statWCPM'); if (sW) sW.textContent = wcpm;
    const sA = document.getElementById('statAcc'); if (sA) sA.textContent = (acc*100).toFixed(0) + '%';
    VoiceUI.say(`Đã dừng. Tốc độ ${wcpm} từ một phút. Chính xác ${Math.round(acc*100)} phần trăm.`);
  },

  // Chuẩn hoá văn bản (hỗ trợ so khớp)
  normalizeText(s){ return String(s||'').toLowerCase().replace(/[.,!?;:"“”()…]/g,'').trim(); },

  // Độ dài LCS (Longest Common Subsequence) đơn giản để ước lượng số từ đúng
  lcsLength(a, b){
    const n=a.length, m=b.length;
    const dp = Array.from({length:n+1}, ()=> Array(m+1).fill(0));
    for (let i=1;i<=n;i++){
      for (let j=1;j<=m;j++){
        if (a[i-1]===b[j-1]) dp[i][j] = dp[i-1][j-1] + 1;
        else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
    return dp[n][m];
  },

  /* ========== Đồng bộ cập nhật chỉ số tạm thời khi đánh dấu thủ công (nếu không có ASR) ========== */
  updateStatsLive(){
    if (!this.started && (!this._sessionTemp || !this._sessionTemp.auto)){
      // tính theo đánh dấu thủ công
      const expected = this.wordSplit(this.passage.text);
      const wrong = Object.keys(this.errors).length;
      const correct = Math.max(0, expected.length - wrong);
      const dur = this._sessionTemp ? this._sessionTemp.dur : 60000; // giả định 1 phút nếu chưa biết
      const minutes = Math.max(0.25, dur/60000);
      const wcpm = Math.round(correct / minutes);
      const acc = expected.length ? +(correct/expected.length).toFixed(3) : 0;

      const sW = document.getElementById('statWCPM'); if (sW) sW.textContent = wcpm;
      const sA = document.getElementById('statAcc'); if (sA) sA.textContent = (acc*100).toFixed(0) + '%';
      this._sessionTemp = { dur, total: expected.length, correct, wcpm, acc };
    }

    if (!this.started) return;
    // Khi đang đọc: hiển thị tức thời theo số từ chưa đánh dấu (không dùng ASR realtime)
    const dur = window.__now() - this.startTime;
    const expected = this.wordSplit(this.passage.text).length;
    const wrong = Object.keys(this.errors).length;
    const correct = Math.max(0, expected - wrong);
    const minutes = Math.max(0.25, dur/60000);
    const wcpm = Math.round(correct / minutes);
    const acc = expected ? +(correct/expected).toFixed(3) : 0;
    const sW = document.getElementById('statWCPM'); if (sW) sW.textContent = wcpm;
    const sA = document.getElementById('statAcc'); if (sA) sA.textContent = (acc*100).toFixed(0) + '%';
  },

  toggleRec(){
    const btn = document.getElementById('btnRec');
    // Sau khi Stop(), cho phép nghe lại
    if (!this.started && window.Recorder?.lastBlob){
      Recorder.play();
      return;
    }
    // Trong lúc đọc, đã tự ghi âm ở start(); nút này chỉ hiển thị trạng thái
    if (this.started && window.Recorder?.recording){
      Recorder.stop();
      if (btn) btn.textContent = 'Nghe lại bản ghi';
    }
  },

  /* ========== B4: câu hỏi & gửi log ========== */
  renderQuestions(){
    const sec = document.getElementById('readStep4');
    const qWrap = document.getElementById('questions'); if (!qWrap || !sec) return;
    qWrap.innerHTML = '';
    const qs = this.passage.questions || [];
    for (let i=0;i<qs.length;i++){
      const q = qs[i];
      const div = document.createElement('div'); div.className = 'question';
      div.innerHTML = `<div><b>Câu ${i+1}:</b> ${q.q}</div>`;
      const opts = document.createElement('div'); opts.className='inline-buttons';
      (q.choices||[]).forEach((c, idx)=>{
        const b = document.createElement('button');
        b.textContent = c;
        b.setAttribute('data-voice', `Chọn đáp án ${c}`);
        b.onclick = ()=> { div.dataset.sel = idx; Array.from(opts.children).forEach(ch => ch.style.outline='none'); b.style.outline = '2px solid var(--primary)'; };
        opts.appendChild(b);
      });
      div.appendChild(opts); qWrap.appendChild(div);
    }
    sec.style.display = qs.length ? '' : 'none';
    VoiceUI.attachAll();
  },

  finishComp(){
    const qList = this.passage.questions || [];
    const chosen = Array.from(document.querySelectorAll('#questions .question')).map((div,i)=>{
      const sel = +(div.dataset.sel ?? -1); const correct = qList[i]?.ans ?? -1;
      return { sel, correct };
    });
    const compCorrect = chosen.filter(x=>x.sel===x.correct).length;
    const compTotal = qList.length;

    const tmp = this._sessionTemp || { dur:0,total:0,correct:0,wcpm:0,acc:0 };
    const errorsByType = { tone:0, sx:0, chtr:0, omission:0, insertion:0, other:0 };
    Object.values(this.errors).forEach(e => { if (e && errorsByType[e.type]!=null) errorsByType[e.type]++; else errorsByType.other++; });

    const log = {
      type: 'reading',
      learnerId: AppState.learner.sysId || '',
      sessionId: Math.random().toString(36).slice(2,10),
      ts: window.__now(),
      passageId: this.passage.id,
      level: this.level,
      durationMs: tmp.dur,
      totalWords: tmp.total,
      correctWords: tmp.correct,
      wcpm: tmp.wcpm,
      accuracy: tmp.acc,
      compCorrect, compTotal,
      errorsByType, usedTTS: this.usedTTS || 0, scaffolds: [],
      autoAnalysis: this.asrText ? { engine:'webkitSpeechRecognition', text: this.asrText.trim() } : null
    };

    AppState.logs.push(log); Store.set('logs', AppState.logs);

    const recent = AppState.logs.filter(x=>x.type==='reading').slice(-2);
    const lastW = recent.length>=2 ? recent[recent.length-2].wcpm : 0;
    if (log.accuracy >= 0.9 || (lastW && log.wcpm > lastW)) { if (window.App) App.addStar(1); }

    alert(`Hoàn tất! WCPM: ${log.wcpm}, Chính xác: ${(log.accuracy*100).toFixed(0)}%, Hiểu: ${compCorrect}/${compTotal}`);
    VoiceUI.say(`Hoàn thành bài đọc. Trả lời đúng ${compCorrect} trên ${compTotal}.`);

    AppState.learner.level = window.adaptivePlan(AppState.logs, AppState.learner.level).nextLevel; Store.set('learner', AppState.learner);
    if (window.App){ App.updateLearnerBadge(); App.updateNextLevelHint(); }

    window.Sync.enqueue(log);

    // Reset & về bước 1
    this.usedTTS = 0; this._sessionTemp = null; this.errors = {};
    this.goStep(1);
  },

  /* ========== TTS toàn đoạn: chặn khi đang ghi ========== */
  speakPassage(){
    if (this.audioMutedDuringRec) return;
    this.usedTTS++;
    TTS.speak(this.passage.text || '', AppState.learner.ttsRate || 0.9);
  }
};