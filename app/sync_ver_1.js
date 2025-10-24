/* Đồng bộ (Apps Script) – tránh CORS preflight */
const DEFAULT_SYNC_ENDPOINT = '';   // có thể điền sẵn URL /exec của bạn
const DEFAULT_SYNC_SECRET   = 'docde-secret-2025';

window.Sync = {
  endpoint: Store.get('syncEndpoint', DEFAULT_SYNC_ENDPOINT || ''),
  secret:   Store.get('syncSecret',   DEFAULT_SYNC_SECRET   || ''),
  queue: Store.get('outbox', []),
  lastStatus: Store.get('syncLastStatus', 'chưa cấu hình'),
  _timer: null,

  setEndpoint(url){ this.endpoint = (url||'').trim(); Store.set('syncEndpoint', this.endpoint); if (window.App) App.updateSyncStatus(); },
  setSecret(s){ this.secret = (s||'').trim(); Store.set('syncSecret', this.secret); },

  enqueue(obj){
    this.queue.push({ url:this.endpoint, payload: obj, secret: this.secret });
    Store.set('outbox', this.queue);
    this.flush();
  },

  async flush(){
    if (window.App) App.updateSyncStatus();
    if (!this.endpoint || !this.secret) { this.lastStatus='chưa cấu hình'; Store.set('syncLastStatus', this.lastStatus); if (window.App) App.updateSyncStatus(); return; }
    if (!this.queue.length) { this.lastStatus='hàng đợi trống'; Store.set('syncLastStatus', this.lastStatus); if (window.App) App.updateSyncStatus(); return; }

    const newQueue = [];
    for (const item of this.queue){
      try{
        // Không đặt Content-Type để tránh preflight
        const res = await fetch(this.endpoint, {
          method:'POST',
          body: JSON.stringify({ secret: this.secret, data: item.payload })
        });
        if (!res.ok) throw new Error('HTTP '+res.status);
        this.lastStatus = 'đã gửi ' + (item.payload?.sessionId || '');
      }catch(e){
        newQueue.push(item);
        this.lastStatus = 'lỗi, sẽ thử lại';
      }
    }
    this.queue = newQueue;
    Store.set('outbox', this.queue);
    Store.set('syncLastStatus', this.lastStatus);
    if (window.App) App.updateSyncStatus();
  },

  async ping(){
    if (!this.endpoint || !this.secret) throw new Error('Chưa cấu hình URL/SECRET.');
    const url = this.endpoint + '?ping=1&secret=' + encodeURIComponent(this.secret);
    const res = await fetch(url, { method:'GET' });
    const txt = await res.text();
    if (!res.ok) throw new Error('HTTP '+res.status+': '+txt);
    return txt;
  },

  startAuto(){
    if (this._timer) return;
    this._timer = setInterval(()=> this.flush(), 20000);
    window.addEventListener('online', ()=> this.flush());
    document.addEventListener('visibilitychange', ()=> { if (document.visibilityState === 'hidden') this.flush(); });
    window.addEventListener('beforeunload', ()=> this.flush());
  }
};