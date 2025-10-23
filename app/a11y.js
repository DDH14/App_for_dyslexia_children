/* A11Y: Dễ đọc, phóng to chữ, con trỏ đọc theo dòng */
(function(){
  const root = document.documentElement;

  // Dễ đọc
  const keyDys = 'a11y_dys';
  function setDys(on){
    root.setAttribute('data-dys', on ? 'on' : 'off');
    localStorage.setItem(keyDys, on ? 'on':'off');
    const btn = document.getElementById('btnDys');
    if (btn) btn.textContent = `👁‍🗨 Dễ đọc: ${on?'Bật':'Tắt'}`;
  }

  // Font scale
  const keyScale = 'a11y_font_scale';
  function setScale(v){
    v = Math.max(0.9, Math.min(1.6, v));
    root.style.setProperty('--font-scale', String(v));
    localStorage.setItem(keyScale, String(v));
    const el = document.getElementById('fontPct'); if (el) el.textContent = Math.round(v*100)+'%';
  }

  // Con trỏ đọc (đánh dấu dòng)
  const keyFocus = 'a11y_focus';
  let focusOn = false, lastY = 0;
  function enableFocus(on){
    focusOn = !!on;
    localStorage.setItem(keyFocus, focusOn?'on':'off');
    document.body.classList.toggle('read-focus-on', focusOn);
    const btn = document.getElementById('btnFocusLine');
    if (btn) btn.textContent = `🔎 Con trỏ: ${focusOn?'Bật':'Tắt'}`;
  }
  function bindFocusLayer(){
    const pv = document.getElementById('passageView');
    if (!pv) return;
    pv.addEventListener('pointermove', (e)=>{
      if (!focusOn) return;
      const rect = pv.getBoundingClientRect();
      const y = e.clientY - rect.top - 18; // căn giữa dòng
      pv.style.setProperty('--focus-y', y+'px');
    });
  }

  window.A11Y = {
    init(){
      setDys((localStorage.getItem(keyDys)||'off')==='on');
      setScale(parseFloat(localStorage.getItem(keyScale)||'1'));
      enableFocus((localStorage.getItem(keyFocus)||'off')==='on');

      const btnDys = document.getElementById('btnDys');
      if (btnDys) btnDys.onclick = ()=> setDys(root.getAttribute('data-dys')!=='on');

      const btnDown = document.getElementById('btnFontDown');
      const btnUp   = document.getElementById('btnFontUp');
      if (btnDown) btnDown.onclick = ()=> setScale(parseFloat(getComputedStyle(root).getPropertyValue('--font-scale')) - 0.1);
      if (btnUp)   btnUp.onclick   = ()=> setScale(parseFloat(getComputedStyle(root).getPropertyValue('--font-scale')) + 0.1);

      const btnFocus = document.getElementById('btnFocusLine');
      if (btnFocus) btnFocus.onclick = ()=> enableFocus(!focusOn);

      bindFocusLayer();
    },
    rebind(){ bindFocusLayer(); }
  };
})();