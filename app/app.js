/* APP chính – gắn A11Y, luôn hiện Cài đặt, SW an toàn */
window.App = {
  speak: (t)=> TTS.speak(t, AppState.learner.ttsRate || 0.9),
  nav(screen){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + screen);
    if (el) el.classList.add('active');

    if (screen==='dashboard') DashboardModule.render();
    if (screen==='pa') { PAModule.render(); if (AppState.childMode) Coach.say('Kéo các mảnh để ghép thành từ.'); }
    if (screen==='cards') { CardsModule.render(); if (AppState.childMode) Coach.say('Chạm nghe từ và chọn khó hay dễ.'); }
    if (screen==='reading') { ReadingModule.init(); if (AppState.childMode) Coach.say('Làm theo 4 bước ở trên.'); }
    if (screen==='game')   { GameModule.init(); if (AppState.childMode) Coach.say('Nhìn mục tiêu, bóng đúng có vòng sáng.'); }

    VoiceUI.attachAll(); Effects?.bindRipples?.(); A11Y.rebind?.();
  },
  init(){
    // A11Y
    A11Y.init();

    // Toolbar
    const btnSettings = document.getElementById('btnSettings'); if (btnSettings) btnSettings.onclick = ()=> App.nav('settings');
    const btnHelp = document.getElementById('btnHelp'); if (btnHelp) btnHelp.onclick = ()=>{ document.getElementById('modalHelp').classList.add('active'); VoiceUI.speak('Hướng dẫn.'); };
    const btnTheme = document.getElementById('btnTheme'); if (btnTheme) btnTheme.onclick = ()=>{ const cur=localStorage.getItem('theme')||'warm'; const nxt=cur==='warm'?'cool':(cur==='cool'?'dark':'warm'); setTheme(nxt); VoiceUI.say(nxt==='warm'?'Giao diện ấm':(nxt==='cool'?'Giao diện mát':'Giao diện tối')); };

    // Child mode – KHÔNG ẩn Cài đặt, chỉ vô hiệu hóa nút trong toolbar (đã làm bằng CSS)
    const btnChild = document.getElementById('btnChild'); const lockbar = document.getElementById('lockbar');
    const updateChildUI = ()=>{ btnChild.textContent = AppState.childMode ? '🚸 Tự học: Bật' : '🚸 Tự học: Tắt'; document.body.classList.toggle('child', AppState.childMode); if (lockbar) lockbar.style.display = AppState.childMode ? '' : 'none'; };
    if (btnChild) btnChild.onclick = ()=>{ AppState.childMode=!AppState.childMode; Store.set('childMode', AppState.childMode); updateChildUI(); if (AppState.childMode) Coach.say('Chế độ tự học đã bật.'); };
    updateChildUI();

    // Unlock
    const unlockBtn = document.getElementById('btnUnlock');
    if (unlockBtn){
      let timer; const reset=()=>unlockBtn.textContent='Giữ 3s để thoát';
      unlockBtn.addEventListener('pointerdown', ()=>{ unlockBtn.textContent='Đang mở khóa...'; timer=setTimeout(()=>{ AppState.childMode=false; Store.set('childMode', false); updateChildUI(); reset(); VoiceUI.say('Đã thoát chế độ tự học'); }, 3000); });
      ['pointerup','pointerleave'].forEach(ev=> unlockBtn.addEventListener(ev, ()=>{ clearTimeout(timer); reset(); }));
    }

    // Điền Cài đặt
    const f=id=>document.getElementById(id);
    if (f('inpName')) f('inpName').value = AppState.learner.name || '';
    if (f('dispSysId')) f('dispSysId').value = AppState.learner.sysId || '';
    if (f('inpAge')) f('inpAge').value = AppState.learner.age || '';
    if (f('inpGrade')) f('inpGrade').value = AppState.learner.grade || '';
    if (f('selFont')) f('selFont').value = AppState.learner.font || 'System Sans';
    if (f('inpRate')) f('inpRate').value = AppState.learner.ttsRate || 0.9;
    if (f('rateSlider')) f('rateSlider').value = AppState.learner.ttsRate || 0.9;
    if (f('rateVal')) f('rateVal').textContent = (AppState.learner.ttsRate || 0.9).toFixed(2)+'x';
    if (f('inpSyncUrl')) f('inpSyncUrl').value = Sync.endpoint || '';
    if (f('inpSyncSecret')) f('inpSyncSecret').value = Sync.secret || '';

    // Levels
    const levels = Array.isArray(window.PASSAGES) ? Array.from(new Set(PASSAGES.map(p=>p.level))).sort((a,b)=>a-b) : [];
    const selLevel = f('selLevel'); if (selLevel) selLevel.innerHTML = levels.map(l=> `<option value="${l}">Cấp ${l}</option>`).join('');
    const selStartLevel = f('selStartLevel'); if (selStartLevel) selStartLevel.innerHTML = selLevel ? selLevel.innerHTML : '';
    if (selLevel && AppState.learner.level) selLevel.value = AppState.learner.level;
    if (selStartLevel && AppState.learner.level) selStartLevel.value = AppState.learner.level;

    this.updateLearnerBadge(); this.updateStars();
    if (!AppState.learner.name) document.getElementById('modalOnboard').classList.add('active');

    // SW: không đăng ký trên localhost
    if (location.protocol.startsWith('http') && 'serviceWorker' in navigator && location.hostname !== 'localhost') {
      navigator.serviceWorker.register('sw.js').catch(console.warn);
    }
    window.addEventListener('online', ()=> Sync.flush());

    this.updateSyncStatus();
    Sync.flush(); Sync.startAuto?.();
    VoiceUI.attachAll(); Effects?.bindRipples?.();

    this.nav('home');
  },

  speak: t=> TTS.speak(t, AppState.learner.ttsRate || 0.9),

  updateLearnerBadge(){
    const b = document.getElementById('learnerBadge'); const L = AppState.learner;
    const shortId = (L.sysId || 'DDXXXX').slice(-6);
    if (b) b.textContent = `Mã: ${shortId}, Cấp: ${L.level || 1}`;
  },
  updateNextLevelHint(){
    const plan = adaptivePlan(AppState.logs, AppState.learner.level || 1);
    const el = document.getElementById('nextLevelHint'); if (el) el.textContent = `Cấp ${plan.nextLevel}`;
  },
  updateStars(){ const el=document.getElementById('starCount'); if (el){ el.textContent=`⭐ ${AppState.stars||0}`; Store.set('stars', AppState.stars||0); } },
  addStar(n=1){ AppState.stars=(AppState.stars||0)+n; this.updateStars(); Effects?.starPop?.(); },

  updateRateFromSlider(v){ const rate=+v; AppState.learner.ttsRate=rate; Store.set('learner', AppState.learner); const rv=document.getElementById('rateVal'); if (rv) rv.textContent=rate.toFixed(2)+'x'; VoiceUI.say(`Tốc độ ${rate.toFixed(2)} lần`, 600); },

  saveSettings(){
    const g=id=>document.getElementById(id);
    AppState.learner.name  = (g('inpName')?.value || '').trim();
    AppState.learner.age   = +(g('inpAge')?.value || '') || null;
    AppState.learner.grade = (g('inpGrade')?.value || '').trim();
    AppState.learner.font  = g('selFont')?.value || AppState.learner.font || 'System Sans';
    AppState.learner.ttsRate = +(g('inpRate')?.value || '') || AppState.learner.ttsRate || 0.9;
    AppState.learner.level = +(g('selStartLevel')?.value || '') || AppState.learner.level || 1;
    Store.set('learner', AppState.learner);
    this.init();
    alert('Đã lưu cài đặt.');
  },
  finishOnboard(){
    const name=(document.getElementById('obName')?.value||'').trim();
    const age=+(document.getElementById('obAge')?.value||'')||null;
    const grade=(document.getElementById('obGrade')?.value||'').trim();
    AppState.learner.name=name; AppState.learner.age=age; AppState.learner.grade=grade;
    Store.set('learner', AppState.learner);
    this.updateLearnerBadge();
    document.getElementById('modalOnboard').classList.remove('active');
    VoiceUI.speak('Thiết lập xong. Vào trang chính để bắt đầu.');
  },

  saveSync(){ const url=document.getElementById('inpSyncUrl').value.trim(); const secret=document.getElementById('inpSyncSecret').value.trim(); Sync.setEndpoint(url); Sync.setSecret(secret); alert('Đã lưu cài đặt đồng bộ.'); this.updateSyncStatus(); },
  async testSync(){
    try{ const txt = await Sync.ping(); alert('Kết nối OK: '+txt); }
    catch(e){ alert('Lỗi: '+e.message+'\nKiểm tra: Execute as Me • Access Anyone • URL /exec • SECRET khớp.'); }
    this.updateSyncStatus();
  },
  showSyncHelp(){ alert('Đồng bộ cần Apps Script Web App (Execute as: Me, Access: Anyone). Dán URL vào Cài đặt > Đồng bộ.'); },
  updateSyncStatus(){ const s=document.getElementById('syncStatus'); if (!s) return; const q=Sync.queue?.length||0; const status=Sync.endpoint?`Hàng đợi: ${q} • ${Sync.lastStatus||''}`:'chưa cấu hình'; s.textContent='Trạng thái: '+status; },

  // CSV CHỈ CHỨA CHỈ SỐ ĐÁNH GIÁ – KHÔNG CHỨA HỌ TÊN/tuổi/lớp
  exportCSV(){
    const rows = (AppState.logs||[]).map(x => ({
      learner_id: AppState.learner.sysId || '',
      date: new Date(x.ts).toISOString(),
      session_id: x.sessionId || '',
      type: x.type,
      level: x.level || '',
      passage_id: x.passageId || '',
      duration_ms: x.durationMs || '',
      total_words: x.totalWords || '',
      correct_words: x.correctWords || '',
      wcpm: x.wcpm || '',
      accuracy: x.accuracy || '',
      comp_correct: x.compCorrect ?? '',
      comp_total: x.compTotal ?? '',
      used_tts: x.usedTTS ?? '',
      errors_tone: x.errorsByType?.tone ?? 0,
      errors_sx: x.errorsByType?.sx ?? 0,
      errors_chtr: x.errorsByType?.chtr ?? 0,
      errors_omission: x.errorsByType?.omission ?? 0,
      errors_insertion: x.errorsByType?.insertion ?? 0,
      errors_other: x.errorsByType?.other ?? 0
    }));
    const csv = window.toCSV(rows);
    window.download(`docde_${(AppState.learner.sysId||'anon').slice(-6)}.csv`, csv);
  },

  copyCSV(){
    const rows = (AppState.logs||[]).map(x => ({
      learner_id: AppState.learner.sysId || '',
      date: new Date(x.ts).toISOString(),
      session_id: x.sessionId || '',
      type: x.type,
      level: x.level || '',
      passage_id: x.passageId || '',
      duration_ms: x.durationMs || '',
      total_words: x.totalWords || '',
      correct_words: x.correctWords || '',
      wcpm: x.wcpm || '',
      accuracy: x.accuracy || '',
      comp_correct: x.compCorrect ?? '',
      comp_total: x.compTotal ?? '',
      used_tts: x.usedTTS ?? '',
      errors_tone: x.errorsByType?.tone ?? 0,
      errors_sx: x.errorsByType?.sx ?? 0,
      errors_chtr: x.errorsByType?.chtr ?? 0,
      errors_omission: x.errorsByType?.omission ?? 0,
      errors_insertion: x.errorsByType?.insertion ?? 0,
      errors_other: x.errorsByType?.other ?? 0
    }));
  resetConfirm(){ if (confirm('XÓA TOÀN BỘ DỮ LIỆU trên thiết bị này?')){ localStorage.removeItem('logs'); AppState.logs=[]; alert('Đã xóa.'); DashboardModule.render(); } }
};

function setTheme(name){ const root=document.documentElement; const v=name==='cool'?'cool':(name==='dark'?'dark':null); if (v) root.setAttribute('data-theme', v); else root.removeAttribute('data-theme'); localStorage.setItem('theme', name); }

window.addEventListener('load', ()=>{ App.init(); });
App.pa = window.PAModule;
App.cards = window.CardsModule;
App.reading = window.ReadingModule;
App.dashboard = window.DashboardModule;
App.game = window.GameModule;
