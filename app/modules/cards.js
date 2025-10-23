/* MODULE: CARDS (thẻ từ + lọc theo tag + log ẩn danh bằng sysId) */
(function(){
  const TAG_KEY = 'cards_filter_tag';

  function uniqueTags(cards){
    const set = new Set();
    for (const c of cards) (c.tags||[]).forEach(t=> set.add(t));
    return Array.from(set).sort();
  }

  function tagsLabel(tag){
    const map = {
      all: 'Tất cả',
      basic: 'Cơ bản',
      tone: 'Thanh điệu',
      sx: 's/x',
      chtr: 'ch/tr',
      nl: 'n/l',
      ngngh: 'ng/ngh',
      ckqu: 'c/k/qu',
      ghg: 'gh/g'
    };
    return map[tag] || tag;
  }

  window.CardsModule = {
    current:null,
    _filter: localStorage.getItem(TAG_KEY) || 'all',

    setTag(tag){
      this._filter = tag || 'all';
      localStorage.setItem(TAG_KEY, this._filter);
      this.render();
    },

    reconcile(){
      // Cập nhật deck với dữ liệu mới
      if (!AppState.cardDeck) AppState.cardDeck = {};
      const src = Array.isArray(window.CARDS) ? window.CARDS : [];
      for (const c of src) {
        if (!AppState.cardDeck[c.id]) {
          AppState.cardDeck[c.id] = { id:c.id, easiness:2.5, interval:0, due: window.__now() };
        }
      }
      Store.set('cards', AppState.cardDeck);
      this.render();
      VoiceUI.say('Đã cập nhật thẻ mới');
    },

    populateTagOptions(){
      const sel = document.getElementById('selCardTag');
      if (!sel) return;
      const cards = Array.isArray(window.CARDS) ? window.CARDS : [];
      const tags = ['all', ...uniqueTags(cards)];
      sel.innerHTML = tags.map(t => `<option value="${t}">${tagsLabel(t)}</option>`).join('');
      sel.value = this._filter;
    },

    dueList(){
      const deck = AppState.cardDeck || {};
      const cards = Array.isArray(window.CARDS) ? window.CARDS : [];
      const filtered = this._filter==='all'
        ? cards
        : cards.filter(c => (c.tags||[]).includes(this._filter));
      return filtered.map(c => ({...c, _deck: deck[c.id]}))
                     .sort((a,b) => (a._deck?.due ?? 0) - (b._deck?.due ?? 0));
    },

    stats(){
      const deck = AppState.cardDeck || {};
      const nowMs = window.__now();
      let total=0, due=0;
      for (const c of (Array.isArray(window.CARDS)? window.CARDS: [])) {
        total++;
        if ((deck[c.id]?.due ?? 0) <= nowMs) due++;
      }
      return { total, due };
    },

    render(){
      this.populateTagOptions();

      const wrap = document.getElementById('cards-container');
      if (!wrap) return;

      AppState.srInit();

      const list = this.dueList();
      const next = list[0];
      this.current = next || null;

      const s = this.stats();
      const statsEl = document.getElementById('cardStats');
      if (statsEl) statsEl.textContent = `Đến hạn hôm nay: ${s.due}/${s.total}`;

      if (!next){
        wrap.innerHTML = '<div class="help">Không có thẻ nào khớp bộ lọc này. Hãy chọn “Tất cả” hoặc nhóm khác.</div>';
        VoiceUI.attachAll();
        return;
      }

      const cls = (window.toneClass ? window.toneClass(next.text) : '');
      const dueIn = Math.max(0, (next._deck?.due ?? window.__now()) - window.__now());
      const dueStr = dueIn ? 'chưa đến hạn' : 'đã đến';
      wrap.innerHTML = `
        <div class="big-text"><span class="token ${cls}">${next.text}</span></div>
        <div class="inline-buttons" style="margin-top:10px;">
          <button class="tts" data-voice="Nghe từ" onclick="TTS.speak('${next.text}', ${AppState.learner.ttsRate || 0.9})">🔊 Nghe</button>
          <button class="ghost" data-voice="Bỏ qua thẻ này" onclick="CardsModule.nextCard()">Bỏ qua</button>
          <span class="note">(${tagsLabel(this._filter)})</span>
        </div>
        <div class="row" style="margin-top:12px;">
          <div class="spacer"></div>
          <button onclick="CardsModule.grade(5)" class="primary" data-voice="Đánh giá dễ">Dễ</button>
          <button onclick="CardsModule.grade(3)" data-voice="Đánh giá vừa">Vừa</button>
          <button onclick="CardsModule.grade(1)" class="danger" data-voice="Đánh giá khó">Khó</button>
        </div>
        <div class="note" style="margin-top:10px;">Thời điểm ôn tiếp: ${dueStr}</div>
      `;
      VoiceUI.attachAll();
      if (AppState.childMode) setTimeout(()=> TTS.speak(next.text, AppState.learner.ttsRate || 0.9), 300);
    },

    grade(q){
      const c = this.current; if (!c) return;
      const prev = AppState.cardDeck[c.id] || { id:c.id, easiness:2.5, interval:0, due: window.__now() };
      const updated = window.srReview(prev, q);
      AppState.cardDeck[c.id] = updated;
      Store.set('cards', AppState.cardDeck);

      // Ghi log (ẩn danh)
      const log = {
        type: 'cards',
        learnerId: AppState.learner.sysId || '',
        sessionId: 'cards_' + Math.random().toString(36).slice(2,8),
        ts: window.__now(),
        cardId: c.id,
        cardText: c.text,
        cardTags: c.tags || [],
        quality: q,
        easiness: updated.easiness,
        interval: updated.interval,
        due: updated.due,
        filterTag: this._filter
      };
      window.Sync.enqueue(log);

      VoiceUI.say(q>=5 ? 'Dễ' : (q>=3 ? 'Vừa' : 'Khó'));
      this.nextCard();
    },

    nextCard(){ this.render(); }
  };
})();