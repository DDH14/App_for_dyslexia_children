/* Hiệu ứng giao diện: ripple, confetti, star pop */
(function(){
  const fx = document.getElementById('fxLayer');

  function randomColor(){
    const colors = ['#FFD54F','#FF6F61','#4DB6AC','#64B5F6','#BA68C8','#81C784','#FF8A65','#4FC3F7'];
    return colors[Math.floor(Math.random()*colors.length)];
  }
  function randomDir(){ const a = Math.random()*Math.PI*2; return { dx: Math.cos(a), dy: Math.sin(a) }; }

  function confetti(count=80, opts={}){
    if (!fx) return;
    const rect = (opts.anchorEl || document.body).getBoundingClientRect();
    const cx = (rect.left + rect.right)/2;
    const cy = (rect.top + rect.bottom)/2;

    for(let i=0;i<count;i++){
      const el = document.createElement('div');
      el.className = 'fx-piece';
      const {dx, dy} = randomDir();
      el.style.setProperty('--dx', `${dx.toFixed(3)}px`);
      el.style.setProperty('--dy', `${dy.toFixed(3)}px`);
      el.style.left = (cx + (Math.random()*40-20)) + 'px';
      el.style.top = (cy + (Math.random()*10-5)) + 'px';
      el.style.background = randomColor();
      el.style.animation = `burst ${700+Math.random()*600}ms ease-out forwards`;
      fx.appendChild(el);
      setTimeout(()=> el.remove(), 1400);
    }
  }

  function bindRipples(){
    const attach = (btn)=>{
      if (btn._rippleBound) return;
      btn.style.overflow = 'hidden';
      btn.addEventListener('pointerdown', (e)=>{
        const r = btn.getBoundingClientRect();
        const d = Math.max(r.width, r.height);
        const x = e.clientX - r.left - d/2;
        const y = e.clientY - r.top - d/2;
        const span = document.createElement('span');
        span.className = 'ripple';
        span.style.width = span.style.height = d + 'px';
        span.style.left = x + 'px'; span.style.top = y + 'px';
        btn.appendChild(span);
        setTimeout(()=> span.remove(), 600);
      });
      btn._rippleBound = true;
    };
    document.querySelectorAll('button, [role="button"]').forEach(attach);
  }

  function starPop(){
    const el = document.getElementById('starCount');
    if (!el) return;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    confetti(60, { anchorEl: el });
  }

  window.Effects = { confetti, bindRipples, starPop };
})();