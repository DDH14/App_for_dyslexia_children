/* TTS */
window.TTS = {
  supported: 'speechSynthesis' in window,
  speak(text, rate=0.9){
    if (!this.supported) { return; }
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = 'vi-VN';
    ut.rate = rate;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ut);
  }
};