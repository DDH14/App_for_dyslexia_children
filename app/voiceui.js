/* VOICE UI */
window.VoiceUI = {
  enabled: JSON.parse(localStorage.getItem('voice_enabled') || 'true'),
  cooldownUntil: 0,
  rate(){ return (AppState?.learner?.ttsRate) || 0.9; },
  speak(msg){ if (!this.enabled) return; TTS.speak(msg, this.rate()); },
  say(msg, cd=700){
    const t = Date.now();
    if (t < this.cooldownUntil) return;
    this.cooldownUntil = t + cd;
    this.speak(msg);
  },
  toggle(on){ this.enabled = (on ?? !this.enabled); localStorage.setItem('voice_enabled', JSON.stringify(this.enabled)); return this.enabled; },
  attachButtonVoice(el){
    if (!el) return;
    const label = el.getAttribute('data-voice') || el.innerText?.trim() || 'nút';
    let timer;
    const readLabel = ()=> window.VoiceUI.speak(label);
    el.addEventListener('pointerdown', ()=> { timer = setTimeout(readLabel, 400); });
    el.addEventListener('pointerup', ()=> { clearTimeout(timer); });
    el.addEventListener('pointerleave', ()=> { clearTimeout(timer); });
    el.addEventListener('focus', ()=> { if (window.VoiceUI.enabled) setTimeout(readLabel, 80); });
  },
  attachAll(){
    document.querySelectorAll('button, [role="button"]').forEach(btn => window.VoiceUI.attachButtonVoice(btn));
    const rateSlider = document.getElementById('rateSlider');
    if (rateSlider && !rateSlider._voiceBound){
      rateSlider.addEventListener('focus', ()=> window.VoiceUI.speak('Thanh tốc độ giọng đọc'));
      rateSlider._voiceBound = true;
    }
  }
};

window.speakFeedback = function(msg){ window.VoiceUI.say(msg); };