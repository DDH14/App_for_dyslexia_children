/* LƯU TRỮ & TRẠNG THÁI (bảo mật – tự cấp mã ẩn danh) */
window.Store = {
  get(k, d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d; }catch{ return d; } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
};
const now = () => Date.now();

function genSysId(){
  // Mã ẩn danh: DD + 10 ký tự base36
  return 'DD' + Math.random().toString(36).slice(2,12).toUpperCase();
}

window.AppState = {
  // name/age/grade chỉ lưu cục bộ. sysId là mã ẩn danh gửi kèm log.
  learner: Store.get('learner', { sysId:'', name:'', age:null, grade:'', level:1, ttsRate:0.9, font:"System Sans" }),
  logs: Store.get('logs', []),
  cardDeck: Store.get('cards', null),
  childMode: Store.get('childMode', false),
  stars: Store.get('stars', 0),
  srInit(){
    if (!this.cardDeck){
      this.cardDeck = {};
      const src = Array.isArray(window.CARDS) ? window.CARDS : [];
      for (const c of src) {
        this.cardDeck[c.id] = { id:c.id, easiness:2.5, interval:0, due: now() };
      }
      Store.set('cards', this.cardDeck);
    }
  }
};
window.__now = now;

// Đảm bảo có sysId ngay khi tải
(function ensureSysId(){
  if (!AppState.learner.sysId){
    AppState.learner.sysId = genSysId();
    Store.set('learner', AppState.learner);
  }
})();