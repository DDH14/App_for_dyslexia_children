/* MODULE: PA (âm vị) – ẩn danh bằng sysId, log mỗi tương tác */
window.PAModule = {
  idx: 0,
  _startTs: 0,

  render(){
    const wrap = document.getElementById('pa-container');
    if (!wrap) return;
    const src = Array.isArray(window.PA_ITEMS) ? window.PA_ITEMS : [];
    if (!src.length){
      wrap.innerHTML = '<div class="help">Chưa tải được dữ liệu Âm vị (app/data.js).</div>';
      return;
    }
    wrap.innerHTML = '';
    const item = src[this.idx % src.length];
    this._startTs = window.__now();

    if (item.type === 'segment'){
      const cls = (window.toneClass ? window.toneClass(item.target) : '');
      const box = document.createElement('div');
      box.className = 'section';
      box.innerHTML = `
        <div class="row">
          <div style="font-weight:700;">Ghép âm/tiếng thành từ</div>
          <div class="spacer"></div>
          <button class="tts" data-voice="Nghe mẫu" onclick="TTS.speak('${item.speak || item.target}', ${AppState.learner.ttsRate || 0.9})">🔊</button>
        </div>
        <div class="big-text" style="margin-top:8px;">
          <span class="token ${cls}">${item.target}</span>
        </div>
        <div style="margin:8px 0 4px;">Kéo các mảnh bên dưới vào khung theo thứ tự đúng:</div>
        <div class="dropzone" id="dz"></div>
        <div class="inline-buttons" id="parts"></div>
        <div class="row" style="margin-top:10px;">
          <button class="primary" data-voice="Kiểm tra đáp án" onclick="PAModule.checkSegment()">Kiểm tra</button>
          <div class="spacer"></div>
          <button class="ghost" data-voice="Bài khác" onclick="PAModule.next()">Bài khác</button>
        </div>
      `;
      wrap.appendChild(box);

      // Mảnh kéo/thả
      const shuffled = [...item.parts].sort(()=>Math.random()-0.5);
      const partsDiv = box.querySelector('#parts');
      shuffled.forEach((p)=>{
        const el = document.createElement('div');
        el.className='chip'; el.draggable = true; el.textContent = p; el.dataset.value = p;
        el.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', p));
        el.addEventListener('click', ()=> {
          const dz = box.querySelector('#dz'); const chip = document.createElement('div');
          chip.className='chip'; chip.textContent = p; chip.dataset.value=p; chip.onclick = ()=> chip.remove(); dz.appendChild(chip);
        });
        partsDiv.appendChild(el);
      });
      const dz = box.querySelector('#dz');
      dz.addEventListener('dragover', e => e.preventDefault());
      dz.addEventListener('drop', e => { e.preventDefault(); const val = e.dataTransfer.getData('text/plain'); const chip = document.createElement('div'); chip.className='chip'; chip.textContent = val; chip.dataset.value = val; chip.onclick = () => chip.remove(); dz.appendChild(chip); });

      if (AppState.childMode) Coach.say('Kéo hoặc chạm để đưa mảnh vào khung. Ráp thành từ ở trên.');
    }
    else if (item.type === 'tone'){
      const box = document.createElement('div');
      box.className = 'section';
      box.innerHTML = `
        <div class="row">
          <div style="font-weight:700;">Chọn thanh điệu đúng</div>
          <div class="spacer"></div>
          <button class="tts" data-voice="Nghe mẫu đúng" onclick="TTS.speak('${item.correct}', ${AppState.learner.ttsRate || 0.9})">🔊</button>
        </div>
        <div class="big-text" style="margin-top:8px;">Gốc: <span class="token">${item.base}</span></div>
        <div class="inline-buttons" id="toneOps" style="margin-top:8px;"></div>
        <div class="row" style="margin-top:10px;">
          <button class="ghost" data-voice="Bài khác" onclick="PAModule.next()">Bài khác</button>
        </div>
      `;
      wrap.appendChild(box);

      const ops = box.querySelector('#toneOps');
      item.options.forEach(opt=>{
        const btn = document.createElement('button');
        btn.textContent = opt;
        btn.setAttribute('data-voice', `Chọn ${opt}`);
        btn.onclick = ()=>{
          const ok = opt===item.correct;
          VoiceUI.say(ok ? 'Đúng rồi' : 'Chưa đúng, con thử lại');

          // Log
          const log = {
            type:'pa',
            learnerId: AppState.learner.sysId || '',
            sessionId: 'pa_' + Math.random().toString(36).slice(2,8),
            ts: window.__now(),
            paType:'tone', paTarget:item.correct,
            paCorrect: ok, paResponseMs: window.__now() - this._startTs,
            paMeta: { base: item.base, choice: opt, options: item.options }
          };
          Sync.enqueue(log);

          if (ok) this.next();
        };
        btn.className = 'token ' + (window.toneClass ? window.toneClass(opt) : '');
        ops.appendChild(btn);
      });

      if (AppState.childMode) Coach.say('Chọn từ có thanh đúng.');
    }
    else if (item.type === 'pair'){
      const target = item.pair[item.correctIndex];
      const box = document.createElement('div');
      box.className = 'section';
      box.dataset.correct = String(item.correctIndex);
      box.innerHTML = `
        <div class="row">
          <div style="font-weight:700;">Cặp tối thiểu (${item.focus || ''}) – Nghe và chọn đúng</div>
          <div class="spacer"></div>
          <button class="tts" data-voice="Nghe từ cần chọn" onclick="TTS.speak('${target}', ${AppState.learner.ttsRate || 0.9})">🔊</button>
        </div>
        <div class="inline-buttons" style="margin-top:8px;">
          <button data-voice="Chọn ${item.pair[0]}" onclick="PAModule.answerPair(0)">${item.pair[0]}</button>
          <button data-voice="Chọn ${item.pair[1]}" onclick="PAModule.answerPair(1)">${item.pair[1]}</button>
        </div>
        <div class="row" style="margin-top:10px;">
          <button class="ghost" data-voice="Bài khác" onclick="PAModule.next()">Bài khác</button>
        </div>
      `;
      wrap.appendChild(box);

      if (AppState.childMode) Coach.say('Nghe và chạm vào từ con nghe được.');
    }

    VoiceUI.attachAll();
  },

  checkSegment(){
    const src = Array.isArray(window.PA_ITEMS) ? window.PA_ITEMS : [];
    if (!src.length) return;
    const item = src[this.idx % src.length];
    const vals = Array.from(document.querySelectorAll('#dz .chip')).map(x=>x.dataset.value);
    const ok = vals.join('') === item.parts.join('');
    VoiceUI.say(ok ? 'Đúng rồi' : 'Chưa đúng, con thử sắp xếp lại');

    // Log
    const log = {
      type:'pa',
      learnerId: AppState.learner.sysId || '',
      sessionId: 'pa_' + Math.random().toString(36).slice(2,8),
      ts: window.__now(),
      paType:'segment', paTarget:item.target,
      paCorrect: ok, paResponseMs: window.__now() - this._startTs,
      paMeta: { parts: item.parts, attempt: vals }
    };
    Sync.enqueue(log);

    if (ok) this.next();
  },

  answerPair(i){
    const container = document.getElementById('pa-container');
    const box = container?.querySelector('[data-correct]');
    const correct = box ? +box.dataset.correct : null;

    const src = Array.isArray(window.PA_ITEMS) ? window.PA_ITEMS : [];
    const item = src[this.idx % src.length];

    const ok = i===correct;
    VoiceUI.say(ok ? 'Đúng' : 'Chưa đúng, thử nghe lại nhé');

    // Log
    const log = {
      type:'pa',
      learnerId: AppState.learner.sysId || '',
      sessionId: 'pa_' + Math.random().toString(36).slice(2,8),
      ts: window.__now(),
      paType:'pair', paTarget:item.pair[correct],
      paCorrect: ok, paResponseMs: window.__now() - this._startTs,
      paMeta: { pair: item.pair, choiceIndex: i, correctIndex: correct, focus:item.focus || '' }
    };
    Sync.enqueue(log);

    if (ok) this.next();
  },

  next(){
    const src = Array.isArray(window.PA_ITEMS) ? window.PA_ITEMS : [];
    this.idx = src.length ? (this.idx+1)%src.length : 0;
    this.render();
  }
};