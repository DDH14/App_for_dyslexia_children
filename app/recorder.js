/* GHI ÂM */
window.Recorder = {
  stream: null, rec: null, chunks: [], recording:false, lastBlob: null,
  async toggle(seconds=60){
    if (this.recording) { this.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia) { alert('Thiết bị không hỗ trợ ghi âm'); return; }
    this.stream = await navigator.mediaDevices.getUserMedia({audio:true});
    this.rec = new MediaRecorder(this.stream);
    this.chunks = [];
    this.rec.ondataavailable = (e)=> this.chunks.push(e.data);
    this.rec.onstop = ()=>{
      this.lastBlob = new Blob(this.chunks, { type: 'audio/webm' });
      this.stream.getTracks().forEach(t=>t.stop());
      this.recording=false;
      window.speakFeedback('Đã dừng ghi. Nhấn để nghe lại.');
    };
    this.rec.start(); this.recording = true;
    setTimeout(()=>{ if(this.recording) this.stop(); }, seconds*1000);
  },
  stop(){ if(this.rec && this.recording){ this.rec.stop(); } },
  async play(){
    if (!this.lastBlob) { alert('Chưa có bản ghi'); return; }
    const url = URL.createObjectURL(this.lastBlob); const a = new Audio(url); a.play();
  }
};