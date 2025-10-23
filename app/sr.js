/* SPACED REPETITION (SM-2 giản lược) */
window.srReview = function(card, quality, nowMs=window.__now()){
  let e = Math.max(1.3, (card.easiness ?? 2.5) + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  let i = quality < 3 ? 1 : (card.interval === 0 ? 1 : Math.round(card.interval * e));
  return { ...card, easiness: +e.toFixed(2), interval: i, due: nowMs + i * 24*3600*1000 };
};