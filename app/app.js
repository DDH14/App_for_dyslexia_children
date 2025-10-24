/* ỨNG DỤNG CHÍNH (bảo mật – dùng sysId ẩn danh) */
window.App = {
  speak: (t)=> TTS.speak(t, AppState.learner.ttsRate || 0.9),
  nav(screen){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + screen);
    if (el) el.classList.add('active');

    if (screen==='dashboard') DashboardModule.render();
    if (screen==='pa') { PAModule.render(); if (AppState.childMode) Coach.say('Kéo các mảnh để ghép thành từ.'); }
    if (screen==='cards') { CardsModule.render(); if (AppState.childMode) Coach.say('Chạm nghe từ và chọn khó hay dễ.'); }
    if (screen==='reading') { ReadingModule.init(); if (AppState.childMode) Coach.say('Nhấn bắt đầu rồi đọc to. Gặp từ khó thì chạm để đánh dấu.'); }
    if (screen==='game')   { GameModule.init(); if (AppState.childMode) Coach.say('Pop bóng đúng theo yêu cầu để ghi điểm.'); }

    if (screen==='home') VoiceUI.speak('Trang chính. Chọn luyện âm vị, thẻ từ, đọc đoạn, trò chơi, hoặc bảng điều khiển.');
    if (screen==='pa') VoiceUI.speak('Luyện âm vị. Kéo hoặc chạm để ghép âm. Nhấn giữ nút để nghe tên chức năng.');
    if (screen==='cards') VoiceUI.speak('Thẻ từ. Chạm nghe từ, chọn dễ, vừa hoặc khó.');
    if (screen==='reading') VoiceUI.speak('Đọc đoạn. Nhấn Bắt đầu để tính giờ. Có thanh trượt tốc độ giọng đọc.');
    if (screen==='game') VoiceUI.speak('Trò chơi. Chọn chế độ theo thanh điệu hoặc nhóm lỗi, sau đó bấm Bắt đầu.');
    if (screen==='dashboard') VoiceUI.speak('Bảng điều khiển. Xem tiến bộ và đồng bộ dữ liệu.');
    if (screen==='settings') VoiceUI.speak('Cài đặt. Chỉ nhập Họ tên (lưu tại máy). Mã ẩn danh tự cấp.');
    if (screen==='export') VoiceUI.speak('Xuất dữ liệu. Tải CSV hoặc sao chép.');

    VoiceUI.attachAll();
    Effects?.bindRipples?.();
  },
  toast(msg){ console.log('[Toast]', msg); },
  init(){
    // Theme (nếu có)
    const savedTheme = localStorage.getItem('theme') || 'warm';
    setTheme(savedTheme);

    document.body.style.fontFamily = {
      'Lexend': '"Lexend", var(--font-body)',
      'OpenDyslexic': '"OpenDyslexic", var(--font-body)',
      'System Sans': 'var(--font-body)'
    }[AppState.learner.font || 'System Sans'];

    AppState.srInit();

    // Toolbar
    const btnSettings = document.getElementById('btnSettings');
    if (btnSettings) btnSettings.onclick = ()=> App.nav('settings');
    const btnHelp = document.getElementById('btnHelp');
    if (btnHelp) btnHelp.onclick = ()=>{
      document.getElementById('modalHelp').classList.add('active');
      VoiceUI.speak('Hướng dẫn. Nhấn giữ nút để nghe tên trước khi chọn.');
    };

    const btnTheme = document.getElementById('btnTheme');
    if (btnTheme){
      btnTheme.onclick = ()=>{
        const cur = localStorage.getItem('theme') || 'warm';
        const next = cur==='warm' ? 'cool' : (cur==='cool' ? 'dark' : 'warm');
        setTheme(next);
        VoiceUI.say(next==='warm'?'Giao diện ấm':(next==='cool'?'Giao diện mát':'Giao diện tối'));
      };
    }

    // Child mode
    const btnChild = document.getElementById('btnChild');
    const lockbar = document.getElementById('lockbar');
    const updateChildUI = ()=> {
      if (!btnChild) return;
      btnChild.textContent = AppState.childMode ? '🚸 Tự học: Bật' : '🚸 Tự học: Tắt';
      document.body.classList.toggle('child', AppState.childMode);
      if (lockbar) lockbar.style.display = AppState.childMode ? '' : 'none';
    };
    if (btnChild){
      btnChild.onclick = ()=>{
        AppState.childMode = !AppState.childMode;
        Store.set('childMode', AppState.childMode);
        updateChildUI();
        if (AppState.childMode) Coach.say('Chế độ tự học đã bật. Con làm theo hướng dẫn nhé.');
      };
    }
    updateChildUI();

    // Unlock long press
    const unlockBtn = document.getElementById('btnUnlock');
    if (unlockBtn){
      let pressTimer;
      const resetTxt = ()=> unlockBtn.textContent = 'Giữ 3s để thoát';
      unlockBtn.addEventListener('pointerdown', ()=>{
        unlockBtn.textContent = 'Đang mở khóa...';
        pressTimer = setTimeout(()=>{
          AppState.childMode = false; Store.set('childMode', false);
          updateChildUI(); resetTxt();
          VoiceUI.say('Đã thoát chế độ tự học');
        }, 3000);
      });
      unlockBtn.addEventListener('pointerup', ()=>{ clearTimeout(pressTimer); resetTxt(); });
      unlockBtn.addEventListener('pointerleave', ()=>{ clearTimeout(pressTimer); resetTxt(); });
    }

    // Levels
    const levels = Array.isArray(window.PASSAGES) ? Array.from(new Set(window.PASSAGES.map(p=>p.level))).sort((a,b)=>a-b) : [];
    const selLevel = document.getElementById('selLevel');
    if (selLevel) selLevel.innerHTML = levels.map(l=> `<option value="${l}">Cấp ${l}</option>`).join('');
    const selStartLevel = document.getElementById('selStartLevel');
    if (selStartLevel) selStartLevel.innerHTML = selLevel ? selLevel.innerHTML : '';

    if (selLevel && AppState.learner.level) selLevel.value = AppState.learner.level;
    if (selStartLevel && AppState.learner.level) selStartLevel.value = AppState.learner.level;
    const f = (id)=> document.getElementById(id);

    // Điền Cài đặt (không gửi đi)
    if (f('inpName')) f('inpName').value = AppState.learner.name || '';
    if (f('dispSysId')) f('dispSysId').value = AppState.learner.sysId || '';
    if (f('inpAge')) f('inpAge').value = AppState.learner.age || '';
    if (f('inpGrade')) f('inpGrade').value = AppState.learner.grade || '';
    if (f('selFont')) f('selFont').value = AppState.learner.font || 'System Sans';
    if (f('inpRate')) f('inpRate').value = AppState.learner.ttsRate || 0.9;
    if (f('rateSlider')) f('rateSlider').value = AppState.learner.ttsRate || 0.9;
    if (f('rateVal')) f('rateVal').textContent = (AppState.learner.ttsRate || 0.9).toFixed(2)+'x';

    // Sync settings
    if (f('inpSyncUrl')) f('inpSyncUrl').value = Sync.endpoint || '';
    if (f('inpSyncSecret')) f('inpSyncSecret').value = Sync.secret || '';

    App.updateLearnerBadge();
    App.updateStars();

    // Onboarding nếu chưa có name (tùy chọn)
    if (!AppState.learner.name) document.getElementById('modalOnboard').classList.add('active');

    App.updateNextLevelHint();

    const btnVoice = document.getElementById('btnVoice');
    const updateVoiceBtn = ()=> { if (btnVoice) btnVoice.textContent = (VoiceUI.enabled ? '🔊 Giọng nói: Bật' : '🔇 Giọng nói: Tắt'); };
    if (btnVoice){
      btnVoice.onclick = ()=> { VoiceUI.toggle(); updateVoiceBtn(); VoiceUI.speak(VoiceUI.enabled ? 'Đã bật giọng nói trợ giúp' : 'Đã tắt giọng nói trợ giúp'); };
      updateVoiceBtn();
    }

    if (location.protocol.startsWith('http') && 'serviceWorker' in navigator && location.hostname !== 'localhost') {
      navigator.serviceWorker.register('sw.js').catch(err=>console.warn('[SW]', err));
    }
    window.addEventListener('online', ()=> Sync.flush());

    App.updateSyncStatus();
    Sync.flush();
    Sync.startAuto?.();

    VoiceUI.attachAll();
    Effects?.bindRipples?.();

    App.nav('home');
  },
  updateLearnerBadge(){
    const b = document.getElementById('learnerBadge'); const L = AppState.learner;
    // Hiển thị mã ẩn danh rút gọn 6 ký tự cuối
    const shortId = (L.sysId || 'DDXXXX').slice(-6);
    if (b) b.textContent = `Mã: ${shortId}, Cấp: ${L.level || 1}`;
  },
  updateNextLevelHint(){
    const plan = window.adaptivePlan(AppState.logs, AppState.learner.level || 1);
    const el = document.getElementById('nextLevelHint');
    if (el) el.textContent = `Cấp ${plan.nextLevel}`;
  },
  updateStars(){
    const el = document.getElementById('starCount');
    if (!el) return;
    el.textContent = `⭐ ${AppState.stars||0}`;
    Store.set('stars', AppState.stars||0);
  },
  addStar(n=1){
    AppState.stars = (AppState.stars||0) + n;
    this.updateStars();
    Effects?.starPop?.();
  },

  updateRateFromSlider(v){
    const rate = +v;
    AppState.learner.ttsRate = rate; Store.set('learner', AppState.learner);
    const rv = document.getElementById('rateVal'); if (rv) rv.textContent = rate.toFixed(2)+'x';
    VoiceUI.say(`Tốc độ ${rate.toFixed(2)} lần`, 600);
  },

  saveSettings(){
    const g = (id)=> document.getElementById(id);
    AppState.learner.name  = (g('inpName')?.value || '').trim();
    AppState.learner.age   = +(g('inpAge')?.value || '') || null;
    AppState.learner.grade = (g('inpGrade')?.value || '').trim();
    AppState.learner.font  = g('selFont')?.value || AppState.learner.font || 'System Sans';
    AppState.learner.ttsRate = +(g('inpRate')?.value || '') || AppState.learner.ttsRate || 0.9;
    AppState.learner.level = +(g('selStartLevel')?.value || '') || AppState.learner.level || 1;
    // sysId giữ nguyên (ẩn danh)
    Store.set('learner', AppState.learner);
    App.init();
    alert('Đã lưu cài đặt.');
  },
  finishOnboard(){
    const name = (document.getElementById('obName')?.value || '').trim();
    const age  = +(document.getElementById('obAge')?.value || '') || null;
    const grade= (document.getElementById('obGrade')?.value || '').trim();
    // Không bắt buộc Họ tên; nếu trống vẫn tiếp tục
    AppState.learner.name = name; AppState.learner.age = age; AppState.learner.grade = grade;
    if (!AppState.learner.sysId) AppState.learner.sysId = 'DD' + Math.random().toString(36).slice(2,12).toUpperCase();
    Store.set('learner', AppState.learner);
    App.updateLearnerBadge();
    document.getElementById('modalOnboard').classList.remove('active');
    VoiceUI.speak('Thiết lập xong. Vào trang chính để bắt đầu.');
  },

  saveSync(){
    const url = document.getElementById('inpSyncUrl').value.trim();
    const secret = document.getElementById('inpSyncSecret').value.trim();
    Sync.setEndpoint(url); Sync.setSecret(secret);
    alert('Đã lưu cài đặt đồng bộ.');
    App.updateSyncStatus();
  },
  async testSync(){
    if (!Sync.endpoint || !Sync.secret) { alert('Chưa cấu hình URL/SECRET.'); return; }
    try{
      const res = await fetch(Sync.endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ secret: Sync.secret, ping:true }) });
      const js = await res.json();
      alert('Kết nối OK: ' + JSON.stringify(js));
    }catch(e){ alert('Không kết nối được. Kiểm tra URL hoặc quyền Web App.'); }
    App.updateSyncStatus();
  },
  showSyncHelp(){
    alert('Đồng bộ cần Google Apps Script Web App (Execute as: Me, Access: Anyone). Dán URL vào phần Cài đặt > Đồng bộ.');
  },
  updateSyncStatus(){
    const s = document.getElementById('syncStatus');
    if (!s) return;
    const q = Sync.queue?.length || 0;
    const status = Sync.endpoint ? `Hàng đợi: ${q} • ${Sync.lastStatus || ''}` : 'chưa cấu hình';
    s.textContent = 'Trạng thái: ' + status;
  },

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
    const csv = window.toCSV(rows);
    navigator.clipboard?.writeText(csv).then(()=> alert('Đã sao chép CSV.')).catch(()=> alert('Không sao chép được. Hãy dùng nút Tải CSV.'));
  },
  resetConfirm(){
    if (confirm('XÓA TOÀN BỘ DỮ LIỆU trên thiết bị này?')) {
      localStorage.removeItem('logs'); AppState.logs = [];
      alert('Đã xóa.'); DashboardModule.render();
    }
  }
};

function setTheme(name){
  const root = document.documentElement;
  const v = name==='cool' ? 'cool' : (name==='dark' ? 'dark' : null);
  if (v) root.setAttribute('data-theme', v); else root.removeAttribute('data-theme');
  localStorage.setItem('theme', name);
}

window.addEventListener('load', () => { 
  App.init();
  Sync.startAuto?.();
});
App.pa = window.PAModule;
App.cards = window.CardsModule;
App.reading = window.ReadingModule;
App.dashboard = window.DashboardModule;
App.game = window.GameModule;