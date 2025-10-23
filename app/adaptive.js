/* ADAPTIVE ENGINE */
window.adaptivePlan = function(logs, currentLevel=1){
  const recent = logs.filter(x=>x.type==='reading').slice(-3);
  if (!recent.length) return { nextLevel: currentLevel, scaffolds:['hint-on-demand'] };
  const acc3 = recent.reduce((s,x)=> s + (x.accuracy||0), 0)/recent.length;
  const wcpmTrend = recent[recent.length-1].wcpm - recent[0].wcpm;
  let nextLevel = currentLevel; let scaffolds = ['hint-on-demand'];
  if (acc3 >= 0.9 && wcpmTrend >= 10) nextLevel = currentLevel + 1;
  else if (acc3 < 0.75) { nextLevel = Math.max(1, currentLevel - 1); scaffolds = ['tts-per-syllable','one-line-mode','pointer']; }
  return { nextLevel, scaffolds, acc3, wcpmTrend };
};