/* COACH */
window.Coach = {
  cooldown: 0,
  say(msg){
    const t = Date.now();
    if (t < this.cooldown) return;
    this.cooldown = t + 1200;
    TTS.speak(msg, AppState.learner.ttsRate || 0.9);
  }
};