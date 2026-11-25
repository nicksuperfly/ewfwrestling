/* ==========================================================================
   ELLIS'S MAIN EVENT (EWF UNIVERSE) - BATCH 15
   js/11-batch15.js
   - Pad results on the match screen (banners, MATCH DRAMA, star rating, how it ended)
   - CROWN YOUR WINNER after a deciding pad result (with KEEP FIGHTING)
   - 2 out of 3 Falls counter
   - Pad test readout + Dad tools in the GM Office
   - EWF-styled pop-ups instead of the plain browser ones
   ========================================================================== */
(function () {
  'use strict';

  const host = () => {
    const fs = document.fullscreenElement || document.webkitFullscreenElement;
    if (fs && getComputedStyle(fs).display === 'none') return document.body;
    return fs || document.body;
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function ensureStyles() {
    if (document.getElementById('ewfB15Styles')) return;
    const css = document.createElement('style');
    css.id = 'ewfB15Styles';
    css.textContent = `
      .ewf15-toast { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%); z-index: 2147483647;
        max-width: min(92vw, 640px); box-sizing: border-box; background: #0b0b10; color: #fff; border: 2px solid #ffd700;
        box-shadow: 0 0 25px rgba(255,215,0,0.45); padding: 10px 16px; font-family: 'Russo One', sans-serif; font-size: 0.95rem;
        text-align: center; line-height: 1.35; animation: ewf15in .25s ease-out; }
      @keyframes ewf15in { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
      .ewf15-padbanner { position: fixed; left: 50%; top: 14%; transform: translateX(-50%) scale(1); z-index: 2147483600;
        max-width: 92vw; box-sizing: border-box; text-align: center; padding: 14px 26px; font-family: 'Russo One', sans-serif;
        font-size: clamp(1.6rem, 5vw, 3.2rem); color: #fff; letter-spacing: 1px; text-shadow: 0 4px 0 #000, 0 0 24px rgba(0,0,0,0.9);
        border: 3px solid #fff; pointer-events: none; animation: ewf15pop .35s cubic-bezier(.2,1.6,.4,1); }
      @keyframes ewf15pop { from { transform: translateX(-50%) scale(.4); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }
      .ewf15-overlay { position: fixed; inset: 0; z-index: 2147483640; background: rgba(0,0,0,0.88); display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 16px; padding: 18px; box-sizing: border-box; overflow-y: auto; }
      .ewf15-overlay h1 { margin: 0; font-family: 'Russo One', sans-serif; font-size: clamp(2rem, 6vw, 3.6rem); color: #ffd700;
        text-shadow: 0 0 30px rgba(255,215,0,0.8), 0 4px 0 #000; text-align: center; animation: ewf15flash .6s ease-in-out 3; }
      @keyframes ewf15flash { 50% { opacity: .35; } }
      @keyframes ewf15fade { from { opacity: 0; } to { opacity: 1; } }
      .ewf15-overlay .sub { font-family: 'Russo One', sans-serif; color: #fff; font-size: 1rem; text-align: center; }
      .ewf15-cards { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; }
      .ewf15-card { background: #121424; border: 3px solid #ffd700; padding: 10px; width: 150px; display: flex; flex-direction: column;
        align-items: center; cursor: pointer; box-shadow: 0 0 18px rgba(255,215,0,0.35); }
      .ewf15-card img { width: 100px; height: 100px; object-fit: cover; margin-bottom: 6px; }
      .ewf15-card .nm { font-family: 'Russo One', sans-serif; color: #fff; font-size: 0.95rem; text-align: center; }
      .ewf15-card .go { font-family: 'Russo One', sans-serif; color: #00ffcc; font-size: 0.72rem; margin-top: 4px; }
      .ewf15-btn { font-family: 'Russo One', sans-serif; font-size: 1rem; padding: 12px 20px; border: 2px solid #fff; color: #fff;
        background: linear-gradient(180deg, #333, #111); cursor: pointer; }
      .ewf15-btn.gold { background: linear-gradient(180deg, #ffd700, #b8860b); color: #000; border-color: #fff3b0; }
      .ewf15-btn.red { background: linear-gradient(180deg, #e50914, #7a0008); }
      .ewf15-falls { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 4px 6px; margin-top: 6px; font-family: 'Russo One', sans-serif; font-size: 0.72rem; color: #ffd700; }
      .ewf15-falls button { flex-basis: 100%; white-space: nowrap; }
      .ewf15-falls .dot { font-size: 1.1rem; cursor: pointer; line-height: 1; }
      .ewf15-falls button { font-family: 'Russo One', sans-serif; font-size: 0.7rem; padding: 4px 7px; border: 1px solid #ffd700; background: #222; color: #ffd700; cursor: pointer; }
      .ewf15-pop { position: fixed; inset: 0; z-index: 2147483645; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; }
      .ewf15-pop .box { width: min(520px, 100%); max-height: 90vh; overflow-y: auto; background: linear-gradient(180deg, #14151f, #08080d);
        border: 3px solid #ffd700; box-shadow: 0 0 40px rgba(255,215,0,0.35); padding: 18px 18px 14px; text-align: center; box-sizing: border-box; }
      .ewf15-pop .msg { font-family: 'Russo One', sans-serif; color: #fff; font-size: 1.05rem; line-height: 1.45; white-space: pre-line; word-wrap: break-word; }
      .ewf15-pop .msg b { color: #ffd700; }
      .ewf15-pop .ewf15-btn { margin-top: 14px; min-width: 140px; }
      #ewfPadTest table { width: 100%; border-collapse: collapse; font-size: 0.8rem; color: #fff; }
      #ewfPadTestBtns .ewf15-btn { width: 100%; min-width: 0; box-sizing: border-box; padding: 8px 2px; font-size: 0.8rem; }
      /* Bret's speech bubble inside Batch 15 screens (same look as the tutorial) */
      .ewf15-overlay .ewf-tut-bubble { position: relative; z-index: 1; box-sizing: border-box; background: linear-gradient(160deg, #15151f, #08080c);
        border: 2px solid #ffd700; border-radius: 6px; box-shadow: 0 0 30px rgba(255,215,0,0.45); color: #fff; padding: 14px 16px; display: flex; gap: 12px; text-align: left;
        font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .ewf15-overlay .ewf-tut-bubble > img { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid #ffd700; flex: none; background: #222; }
      .ewf15-overlay .ewf-tut-name { font-family: 'Russo One', sans-serif; color: #ffd700; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 4px; }
      .ewf15-overlay .ewf-tut-text { font-size: 1rem; line-height: 1.35; }
      .ewf15-overlay .ewf-tut-text b { color: #ffd700; }
      .ewf15-overlay .ewf-tut-btns { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; gap: 10px; }
      .ewf15-overlay .ewf-tut-next { font-family: 'Russo One', sans-serif; background: linear-gradient(180deg, #d4af37, #b8860b); color: #000; border: 2px solid #fff; padding: 10px 18px; font-size: 1rem; cursor: pointer; }
      #ewfPadTest td, #ewfPadTest th { border-bottom: 1px solid #333; padding: 4px; text-align: left; }
    `;
    document.head.appendChild(css);
  }
  ensureStyles();

  /* ---------- small helpers ---------- */
  window.ewfToast = function (msg, ms) {
    ensureStyles();
    const t = document.createElement('div');
    t.className = 'ewf15-toast';
    t.innerHTML = msg;
    t.onclick = () => t.remove();
    host().appendChild(t);
    setTimeout(() => t.remove(), ms || 4000);
    return t;
  };

  function playSfx(src, vol) {
    try { const a = new Audio(src); a.volume = vol == null ? 0.8 : vol; a.play().catch(() => {}); } catch (e) {}
  }

  /* ==========================================================================
     1. PAD RESULTS ON THE MATCH SCREEN (items 1, 2, 26)
     ========================================================================== */
  function matchState() {
    if (typeof activeBookedMatch === 'undefined' || !activeBookedMatch) return null;
    if (!activeBookedMatch.__pad || activeBookedMatch.__padType !== activeBookedMatch.matchType) {
      activeBookedMatch.__pad = { kickout: 0, ropes: 0, saved: 0, eliminated: 0, miss: 0, dragged: 0, table: 0, chair: 0, omg: 0, cage: 0, used: false, method: null };
      activeBookedMatch.__padType = activeBookedMatch.matchType;
    }
    return activeBookedMatch.__pad;
  }
  function falls() {
    if (typeof activeBookedMatch === 'undefined' || !activeBookedMatch) return {};
    activeBookedMatch.__falls = activeBookedMatch.__falls || {};
    return activeBookedMatch.__falls;
  }
  const type = () => String((typeof activeBookedMatch !== 'undefined' && activeBookedMatch && activeBookedMatch.matchType) || '');
  const fmt = () => String((typeof activeBookedMatch !== 'undefined' && activeBookedMatch && activeBookedMatch.formatKey) || '');
  const isFallsMatch = () => /2 out of 3 Falls/i.test(type()) && !['tag', 'handicap', 'rumble', 'mitb'].includes(fmt());
  const isLadderish = () => fmt() === 'mitb' || /Money in the Bank|Ladder|TLC|Cash-In/i.test(type());
  const isCage = () => /Steel Cage/i.test(type());
  const isRumble = () => fmt() === 'rumble' || /Rumble/i.test(type());

  function banner(text, bg) {
    ensureStyles();
    document.querySelectorAll('.ewf15-padbanner').forEach(b => b.remove());
    const b = document.createElement('div');
    b.className = 'ewf15-padbanner';
    b.style.background = bg || 'linear-gradient(180deg,#e50914,#5a0006)';
    b.textContent = text;
    host().appendChild(b);
    setTimeout(() => b.remove(), 1900);
  }

  const BANNERS = {
    'pinfall:kickout': ['KICK OUT AT TWO!', 'linear-gradient(180deg,#0070f3,#002a66)'],
    'pinfall:win': ['1... 2... 3! IT\'S OVER!', 'linear-gradient(180deg,#e50914,#5a0006)'],
    'submission:ropes': ['ROPE BREAK!', 'linear-gradient(180deg,#0070f3,#002a66)'],
    'submission:tapout': ['HE TAPS OUT!', 'linear-gradient(180deg,#e50914,#5a0006)'],
    'ladder:miss': ['KNOCKED OFF THE LADDER!', 'linear-gradient(180deg,#0070f3,#002a66)'],
    'ladder:win': ['HE\'S GRABBED IT!', 'linear-gradient(180deg,#00a152,#00381c)'],
    'rumble:saved': ['HE HANGS ON!', 'linear-gradient(180deg,#0070f3,#002a66)'],
    'rumble:eliminated': ['OVER THE TOP ROPE!', 'linear-gradient(180deg,#e50914,#5a0006)'],
    'cage:dragged': ['DRAGGED BACK IN!', 'linear-gradient(180deg,#0070f3,#002a66)'],
    'cage:escape': ['HE\'S ESCAPED THE CAGE!', 'linear-gradient(180deg,#00a152,#00381c)']
  };

  window.ewfPadEffect = function (fx) {
    const st = matchState(); if (!st) return;
    st.used = true;
    if (fx && st[fx] !== undefined) st[fx]++;
    if (fx === 'table') banner('THROUGH THE TABLE!', 'linear-gradient(180deg,#ff6d00,#5a2600)');
    if (fx === 'chair') banner('STEEL CHAIR SHOT!', 'linear-gradient(180deg,#9e9e9e,#2b2b2b)');
    if (fx === 'omg') banner('OH MY GOD!', 'linear-gradient(180deg,#aa00ff,#2e0047)');
    if (fx === 'cage') banner('INTO THE STEEL!', 'linear-gradient(180deg,#9e9e9e,#2b2b2b)');
  };

  window.ewfPadResult = function (name, result) {
    const st = matchState(); if (!st) return;
    st.used = true;
    const key = name + ':' + result;
    const b = BANNERS[key];
    if (key === 'ladder:win' && !isLadderish()) b && (b[0] = 'HE\'S GRABBED IT!');
    if (b) banner(b[0], b[1]);
    if (st[result] !== undefined) st[result]++;

    let method = null;
    if (key === 'pinfall:win') method = 'Pinfall';
    else if (key === 'submission:tapout') method = 'Submission';
    else if (key === 'ladder:win' && isLadderish()) method = fmt() === 'mitb' || /Money in the Bank/i.test(type()) ? 'Grabbing the Briefcase' : 'Climbing the Ladder';
    else if (key === 'cage:escape' && isCage()) method = 'Escaping the Cage';
    if (!method || isRumble()) return;               // the Rumble has its own elimination screen

    setTimeout(() => {
      if (isFallsMatch()) whoWonTheFall(method);
      else crownYourWinner(method);
    }, 1300);
  };

  function crownOptions() {
    const p = (activeBookedMatch.participants || []).filter(Boolean);
    const list = document.getElementById('qmWinnerSelectionList');
    // reuse the real winner buttons so tag teams / handicap sides work too
    const real = list ? [...list.children].filter(c => typeof c.onclick === 'function') : [];
    if (real.length && fmt() !== '1v1' && fmt() !== 'triple' && fmt() !== 'fatal') {
      return real.map(el => ({
        label: [...el.querySelectorAll('div')].map(d => (d.childElementCount ? '' : d.innerText || '').trim()).find(t => t && !/★|TAP TO|CROWN/i.test(t)) || 'TEAM',
        img: (el.querySelector('img') || {}).src, fire: () => el.onclick() }));
    }
    return p.map(w => ({ label: w.name, img: w.image, w, fire: () => window.declareMatchWinner({ isTagTeam: false, winner: w, losers: p.filter(x => x.id !== w.id) }) }));
  }

  function overlay(title, sub, options, onPick, extraButtons) {
    ensureStyles();
    const old = document.getElementById('ewfCrownOverlay'); if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'ewfCrownOverlay';
    ov.className = 'ewf15-overlay';
    ov.innerHTML = `<h1>${title}</h1><div class="sub">${sub}</div><div class="ewf15-cards"></div><div class="ewf15-actions" style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;"></div>`;
    const cards = ov.querySelector('.ewf15-cards');
    options.forEach(o => {
      const c = document.createElement('div');
      c.className = 'ewf15-card';
      c.innerHTML = `${o.img ? `<img src="${esc(o.img)}" onerror="this.style.display='none'">` : ''}<div class="nm">${esc(o.label)}</div><div class="go">TAP TO PICK ➔</div>`;
      c.onclick = () => { ov.remove(); onPick(o); };
      cards.appendChild(c);
    });
    const acts = ov.querySelector('.ewf15-actions');
    (extraButtons || []).forEach(b => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'ewf15-btn ' + (b.cls || '');
      btn.textContent = b.label;
      btn.onclick = () => { ov.remove(); b.fn(); };
      acts.appendChild(btn);
    });
    host().appendChild(ov);
    return ov;
  }

  function crownYourWinner(method) {
    if (typeof isMatchInProgressLooping !== 'undefined' && !isMatchInProgressLooping) return;
    const st = matchState();
    playSfx('bell.mp3', 0.9);
    overlay('👑 CROWN YOUR WINNER!', `Who won by ${method.toUpperCase()}?`, crownOptions(), o => {
      st.method = method;
      o.fire();
    }, [{ label: '↩ KEEP FIGHTING (PRESSED BY ACCIDENT)', cls: '', fn: () => { st.method = null; } }]);
  }

  function whoWonTheFall(method) {
    const p = (activeBookedMatch.participants || []).filter(Boolean);
    const f = falls();
    overlay('🔔 WHO WON THAT FALL?', `${method.toUpperCase()}! First to 2 falls wins.`, p.map(w => ({ label: w.name, img: w.image, w })), o => {
      addFall(o.w.id, method);
    }, [{ label: '↩ KEEP FIGHTING (PRESSED BY ACCIDENT)', cls: '', fn: () => {} }]);
  }

  function addFall(id, method) {
    const f = falls();
    f[id] = (f[id] || 0) + 1;
    const p = (activeBookedMatch.participants || []).filter(Boolean);
    const w = p.find(x => x.id === id);
    if (f[id] >= 2 && w) {
      const st = matchState();
      const others = p.filter(x => x.id !== id).map(x => f[x.id] || 0);
      st.method = `${f[id]} Falls to ${Math.max(0, ...others)}`;
      banner(`${w.name.toUpperCase()} WINS 2 FALLS!`, 'linear-gradient(180deg,#ffd700,#7a5a00)');
      setTimeout(() => window.declareMatchWinner({ isTagTeam: false, winner: w, losers: p.filter(x => x.id !== id) }), 900);
    } else {
      if (w) banner(`${w.name.toUpperCase()} WINS A FALL!`, 'linear-gradient(180deg,#ffd700,#7a5a00)');
      drawFalls();
    }
  }
  window.ewfAddFall = addFall;
  // BATCH 16: shared with js/12 (elimination matches, tables wins, banner styles)
  window.EWF15 = { matchState, banner, overlay, crownYourWinner, crownOptions, playSfx: (f, v) => playSfx(f, v), host: () => host(), drawFalls };

  function drawFalls() {
    const list = document.getElementById('qmWinnerSelectionList');
    if (!list || !isFallsMatch()) return;
    const p = (activeBookedMatch.participants || []).filter(Boolean);
    const f = falls();
    [...list.children].forEach((card, i) => {
      const w = p[i]; if (!w) return;
      let row = card.querySelector('.ewf15-falls');
      if (!row) { row = document.createElement('div'); row.className = 'ewf15-falls'; card.appendChild(row); }
      const n = f[w.id] || 0;
      row.innerHTML = `FALLS <span class="dot" data-d="0">${n >= 1 ? '●' : '○'}</span><span class="dot" data-d="1">${n >= 2 ? '●' : '○'}</span>`;
      const plus = document.createElement('button');
      plus.type = 'button'; plus.textContent = '+1 FALL';
      plus.onclick = (e) => { e.stopPropagation(); addFall(w.id, 'Pinfall'); };
      row.appendChild(plus);
      row.querySelectorAll('.dot').forEach(d => d.onclick = (e) => { e.stopPropagation(); if ((f[w.id] || 0) > 0) { f[w.id]--; drawFalls(); } });
      row.onclick = e => e.stopPropagation();
    });
  }

  // draw the falls counter whenever the winner list is drawn
  const origRender = window.renderWinnerSelectionList;
  if (typeof origRender === 'function') {
    window.renderWinnerSelectionList = function (...a) { const r = origRender.apply(this, a); try { drawFalls(); } catch (e) {} return r; };
    try { renderWinnerSelectionList = window.renderWinnerSelectionList; } catch (e) {}
  }

  function dramaText(st) {
    const bits = [];
    const add = (n, one, many) => { if (n) bits.push(`${n} ${n === 1 ? one : many}`); };
    add(st.kickout, 'kick-out', 'kick-outs');
    add(st.ropes, 'rope break', 'rope breaks');
    add(st.miss, 'near miss on the ladder', 'near misses on the ladder');
    add(st.dragged, 'cage escape stopped', 'cage escapes stopped');
    add(st.saved, 'Rumble save', 'Rumble saves');
    add(st.table, 'table smashed', 'tables smashed');
    add(st.chair, 'chair or steps shot', 'chair and steps shots');
    add(st.cage, 'slam into the cage', 'slams into the cage');
    add(st.omg, '"Oh my god!" moment', '"Oh my god!" moments');
    return bits.join(', ');
  }
  function dramaStars(st) {
    const score = st.kickout + st.ropes + st.miss + st.dragged + st.saved + 0.5 * (st.table + st.chair + st.cage + st.omg);
    return Math.max(1, Math.min(4, 1 + Math.round(score * 0.75)));
  }

  // after the winner is crowned: how it ended, MATCH DRAMA and a pre-set star rating
  function wrapDeclareForPads() {
    const orig = window.declareMatchWinner;
    if (typeof orig !== 'function' || orig.__b15) return;
    const wrapped = function (resultData) {
      try { window.__ewfPendingAttacker = resultData && (resultData.winner ? resultData.winner.id : (resultData.winners && resultData.winners[0] ? resultData.winners[0].id : (resultData.id || null))); } catch (e) {}
      try { plan = null; } catch (e) {}
      const st = activeBookedMatch && activeBookedMatch.__pad;
      const fl = activeBookedMatch && activeBookedMatch.__falls;
      const r = orig.apply(this, arguments);
      try {
        document.querySelectorAll('#ewfCrownOverlay').forEach(o => o.remove());
        if (typeof currentMatchSummary !== 'undefined' && currentMatchSummary) {
          if (st && st.method) currentMatchSummary.method = st.method;
          else if (isCage() && !currentMatchSummary.method) currentMatchSummary.method = 'Pinfall / Escape';
          if (fl && isFallsMatch() && !currentMatchSummary.method && currentMatchSummary.winner) {
            const w = fl[currentMatchSummary.winner.id] || 0;
            const others = Math.max(0, ...Object.keys(fl).filter(k => k !== currentMatchSummary.winner.id).map(k => fl[k]));
            if (w || others) currentMatchSummary.method = `${Math.max(w, 2)} Falls to ${others}`;
          }
          if (st && st.used) {
            const d = dramaText(st);
            if (d) currentMatchSummary.padDrama = d;
            if (typeof window.selectSummaryRating === 'function') window.selectSummaryRating(dramaStars(st));
          }
        }
      } catch (e) { console.warn('b15 declare', e); }
      window.__ewfPendingAttacker = null;
      return r;
    };
    wrapped.__b15 = true;
    window.declareMatchWinner = wrapped;
  }

  /* ==========================================================================
     2. PAD TEST READOUT + DAD TOOLS IN THE GM OFFICE (item 5)
     ========================================================================== */
  function openPadTest() {
    ensureStyles();
    const old = document.getElementById('ewfPadTest'); if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'ewfPadTest';
    ov.className = 'ewf15-pop';
    ov.innerHTML = `<div class="box" style="text-align:left;">
      <div style="font-family:'Russo One',sans-serif; color:#ffd700; font-size:1.2rem; text-align:center;">🎹 PAD TEST</div>
      <div style="color:#ccc; font-size:0.85rem; margin:6px 0 10px; text-align:center;">Press any pad. Outside a match it shows "ignored". Tap a number to test a pad's sound here.</div>
      <div id="ewfPadTestBtns" style="display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-bottom:10px;"></div>
      <div id="ewfPadTestLog"></div>
      <div style="text-align:center;"><button type="button" class="ewf15-btn gold" id="ewfPadTestClose">CLOSE</button></div>
    </div>`;
    host().appendChild(ov);
    const btns = ov.querySelector('#ewfPadTestBtns');
    [13, 14, 15, 16, 9, 10, 11, 12, 5, 6, 7, 8, 1, 2, 3, 4].forEach(n => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ewf15-btn'; b.style.padding = '8px 4px'; b.style.fontSize = '0.85rem';
      b.textContent = 'PAD ' + n;
      b.onclick = () => window.EWF_PAD && EWF_PAD.handlePad(n);
      btns.appendChild(b);
    });
    ov.querySelector('#ewfPadTestClose').onclick = () => { ov.remove(); window.ewfPadTestRefresh = null; };
    window.ewfPadTestRefresh = () => {
      const el = document.getElementById('ewfPadTestLog'); if (!el || !window.EWF_PAD) return;
      const rows = EWF_PAD.log.map(e => `<tr><td>${esc(e.t)}</td><td>${e.pad ? 'PAD ' + e.pad : '-'}</td><td>${e.note || (e.pad ? EWF_PAD.FIRST_NOTE + e.pad - 1 : '')}</td><td>${esc(e.result || '')}</td><td>${esc(e.file || '')}</td></tr>`).join('');
      el.innerHTML = `<table><tr><th>TIME</th><th>PAD</th><th>NOTE</th><th>RESULT</th><th>SOUND</th></tr>${rows || '<tr><td colspan="5">Nothing yet</td></tr>'}</table>`;
    };
    window.ewfPadTestRefresh();
  }
  window.ewfOpenPadTest = openPadTest;

  function dadOnly(title, text, fn) {
    if (window.EWFP && typeof EWFP.pinPad === 'function') EWFP.pinPad({ title, text, cancelLabel: '✋ CANCEL' }, fn);
    else fn();
  }

  function drawDadRow() {
    const modal = document.getElementById('gmOfficeModal');
    if (!modal) return;
    const anchor = document.getElementById('ewfTextSizeRow');
    if (!anchor) return;
    let row = document.getElementById('ewfDadToolsRow');
    if (!row) {
      row = document.createElement('div');
      row.id = 'ewfDadToolsRow'; row.className = 'ewf-ts-row';
      anchor.insertAdjacentElement('afterend', row);
    }
    row.innerHTML = `<span>🔐 DAD TOOLS:</span>
      <button type="button" id="ewfDadPadTest">🎹 PAD TEST</button>
      <button type="button" id="ewfDadWalkDown">🎙️ REPLAY WALK DOWN</button>`;
    row.querySelector('#ewfDadPadTest').onclick = () => dadOnly('🎹 PAD TEST', 'Shows every pad press, the note it sends and the sound it plays.', openPadTest);
    row.querySelector('#ewfDadWalkDown').onclick = () => dadOnly('🎙️ REPLAY WALK DOWN', 'Plays the commentary team walk downs again.', () => {
      if (typeof window.closeGMOffice === 'function') window.closeGMOffice();
      if (typeof window.ewfStartWalkDowns === 'function') window.ewfStartWalkDowns(true);
    });
  }
  window.ewfDrawDadRow = drawDadRow;

  /* ==========================================================================
     3. EWF-STYLED POP-UPS (item 16d) - replaces the plain grey browser alert().
        Yes/no questions (confirm) stay as they are: they pause the app until answered.
     ========================================================================== */
  const nativeAlert = window.alert.bind(window);
  const queue = [];
  function showNext() {
    if (document.getElementById('ewfPopup') || !queue.length) return;
    const msg = queue.shift();
    ensureStyles();
    const ov = document.createElement('div');
    ov.id = 'ewfPopup';
    ov.className = 'ewf15-pop';
    const lines = String(msg).split('\n');
    const first = lines.shift();
    ov.innerHTML = `<div class="box"><div class="msg"><b>${esc(first)}</b>${lines.length ? '\n' + esc(lines.join('\n')) : ''}</div>
      <button type="button" class="ewf15-btn gold">OK ➔</button></div>`;
    const close = () => { ov.remove(); setTimeout(showNext, 60); };
    ov.querySelector('button').onclick = close;
    host().appendChild(ov);
    try { ov.querySelector('button').focus(); } catch (e) {}
  }
  window.ewfAlert = function (msg) { queue.push(msg); showNext(); };
  window.alert = function (msg) {
    try { window.ewfAlert(msg); } catch (e) { nativeAlert(msg); }
  };
  window.ewfNativeAlert = nativeAlert;

  /* ==========================================================================
     4. RUN-IN BANNER + BRET'S TIPS STAY ON SCREEN (items 7, 23)
     ========================================================================== */
  function watchAmbushBanner() {
    const b = document.getElementById('ambushBanner');
    if (!b || b.__b15) return;
    b.__b15 = true;
    let timer = null;
    b.addEventListener('click', () => { b.style.display = 'none'; });
    new MutationObserver(() => {
      const shown = b.style.display && b.style.display !== 'none';
      clearTimeout(timer);
      if (shown) timer = setTimeout(() => { b.style.display = 'none'; }, 4500);
    }).observe(b, { attributes: true, attributeFilter: ['style'] });
  }
  function clampIntoView(el) {
    try {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      const pad = 12;
      if (r.right > innerWidth - pad) { el.style.left = Math.max(pad, innerWidth - r.width - pad) + 'px'; el.style.right = 'auto'; el.style.transform = 'none'; }
      if (r.left < pad) { el.style.left = pad + 'px'; el.style.transform = 'none'; }
      const r2 = el.getBoundingClientRect();
      if (r2.bottom > innerHeight - pad) el.style.top = Math.max(pad, innerHeight - r2.height - pad) + 'px';
    } catch (e) {}
  }
  function watchBubbles() {
    new MutationObserver(muts => {
      muts.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1 && (n.classList.contains('ewf-tut-bubble') || n.classList.contains('ewf15-toast'))) {
          requestAnimationFrame(() => requestAnimationFrame(() => clampIntoView(n)));
        }
      }));
    }).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', () => document.querySelectorAll('.ewf-tut-bubble').forEach(clampIntoView));
  }

  /* ==========================================================================
     5. WAIT YOUR TURN (item 9): run something once no storyline, cutscene or unlock is on screen
     ========================================================================== */
  function screenBusy() {
    const vis = el => el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
    if (typeof window.ewfUnlockBusy === 'function' && window.ewfUnlockBusy()) return true;
    if (vis(document.getElementById('storylineModal'))) return true;
    if (document.querySelector('.ewfp-scene, #ewfCrownOverlay, #ewfPopup, #ewfWalkDown')) return true;
    if ([...document.querySelectorAll('[id$="CutsceneModal"]')].some(vis)) return true;
    const lo = document.getElementById('lightsOutOverlay');
    if (vis(lo)) return true;
    // BATCH 16 ITEMS 6-7: also wait for videos (unlock reveals, entrances, promos), coronations,
    // the Hall of Fame and the other big overlays. The live match itself lives in the video
    // modal, so that only counts as busy when no match is looping.
    if (window.ewfVideoPlaying && window.ewfVideoPlaying()) return true;
    if (vis(document.getElementById('debutSkipIntroBtn'))) return true;
    if (['hofCeremonyOverlay', 'kotrCoronationOverlay', 'mitbCoronationOverlay', 'rumbleCoronationOverlay',
      'bloodFeudAlertModal', 'universeBulletinOverlay', 'contractSigningModal', 'ambulanceStrobeOverlay',
      'mitbStrobeOverlay', 'stingerOverlay', 'beltEntranceOverlay', 'bookShowFinaleOverlay', 'ewfTease16', 'ewfStephMic16', 'ewfTrophy16']
      .some(id => vis(document.getElementById(id)))) return true;
    return false;
  }
  window.ewfVideoPlaying = function () {
    const vm = document.getElementById('videoModal');
    if (!vm || getComputedStyle(vm).display === 'none') return false;
    try { if (isMatchInProgressLooping) return false; } catch (e) {}
    return true;
  };
  window.ewfScreenBusy = screenBusy;
  window.ewfWhenScreenFree = function (fn, maxMs) {
    const started = Date.now();
    const tick = () => {
      if (screenBusy() && Date.now() - started < (maxMs || 180000)) return setTimeout(tick, 500);
      fn();
    };
    setTimeout(tick, 250);
  };

  /* ==========================================================================
     6. LEGENDARY TAG TEAMS (items 12, 13)
     A team name Ellis gave an alliance wins; otherwise the legendary name; otherwise nothing.
     ========================================================================== */
  const LEGENDS = [
    { key: 'shield', name: 'THE SHIELD', ids: ['vault-romanreigns', 'default-sethrollins'],
      bret: `GM, look who's together again... <b>THE SHIELD</b>! Believe in it, because these two hunt as a pack!` },
    { key: 'rocknsock', name: "ROCK 'N' SOCK", ids: ['default-therock', 'default-mankind'],
      bret: `I can't believe it! The Rock and Mankind, <b>ROCK 'N' SOCK</b>, back as a team! Somebody hide the sock!` },
    { key: 'powertrip', name: 'THE POWER TRIP', ids: ['default-tripleh', 'default-stonecold'],
      bret: `Triple H and Stone Cold together? <b>THE POWER TRIP</b> is back, and nobody in that ring is safe!` },
    { key: 'bod', name: 'BROTHERS OF DESTRUCTION', ids: ['default-kane', 'default-theundertaker'],
      bret: `The lights are flickering, GM... the <b>BROTHERS OF DESTRUCTION</b> are side by side again. Heaven help their opponents!` },
    { key: 'bloodline', name: 'THE BLOODLINE', ids: ['vault-romanreigns', 'default-therock'],
      bret: `Roman and The Rock... family! <b>THE BLOODLINE</b> has reunited, and they want everyone to acknowledge them!` }
  ];
  const LEG_KEY = 'ewf_legends_reunited';
  const legendFor = (a, b) => {
    if (!a || !b) return null;
    const pair = [a.id || a, b.id || b];
    return LEGENDS.find(l => l.ids.includes(pair[0]) && l.ids.includes(pair[1]) && pair[0] !== pair[1]) || null;
  };
  function allianceName(a, b) {
    try {
      const al = (typeof getAlliances === 'function' ? getAlliances() : []) || [];
      const list = Array.isArray(al) ? al : [al];
      const ida = a.id || a, idb = b.id || b;
      const hit = list.find(x => x && ((x.p1 === ida && x.p2 === idb) || (x.p1 === idb && x.p2 === ida)));
      return hit && hit.name && String(hit.name).trim() ? String(hit.name).trim().toUpperCase() : null;
    } catch (e) { return null; }
  }
  window.ewfTeamName = function (a, b) {
    if (!a || !b) return null;
    return allianceName(a, b) || ((legendFor(a, b) || {}).name) || null;
  };
  window.EWF_LEGENDS = LEGENDS;
  function legendsSeen() { try { return JSON.parse(localStorage.getItem(LEG_KEY) || '[]'); } catch (e) { return []; } }

  function sidesOf(m) {
    const p = (m && m.participants || []).filter(Boolean);
    if (m.formatKey === 'tag' && p.length >= 4) return [[p[0], p[1]], [p[2], p[3]]];
    if (m.formatKey === 'handicap' && p.length >= 3) return [[p[1], p[2]]];
    return [];
  }
  function checkLegends() {
    if (typeof activeBookedMatch === 'undefined' || !activeBookedMatch || activeBookedMatch.__legendsChecked) return;
    activeBookedMatch.__legendsChecked = true;
    const seen = legendsSeen();
    const fresh = sidesOf(activeBookedMatch).map(([a, b]) => legendFor(a, b)).filter(l => l && !seen.includes(l.key));
    if (!fresh.length) return;
    const show = (i) => {
      const l = fresh[i]; if (!l) return;
      const now = legendsSeen(); if (!now.includes(l.key)) { now.push(l.key); localStorage.setItem(LEG_KEY, JSON.stringify(now)); }
      legendMoment(l, () => {
        try {
          if (typeof unlockAchievement === 'function' && !unlockAchievement('legends_reunited') && typeof addXP === 'function') addXP(150, `Legends Reunited: ${l.name}`);
          if (typeof saveHistoryLog === 'function') saveHistoryLog(`🤝 LEGENDS REUNITED: ${l.name} are back together!`, 'match');
          if (legendsSeen().length >= LEGENDS.length && typeof unlockAchievement === 'function') unlockAchievement('tag_historian');
        } catch (e) {}
        show(i + 1);
      });
    };
    show(0);
  }
  function legendMoment(l, done) {
    ensureStyles();
    const ws = (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : []);
    const mem = l.ids.map(id => ws.find(w => w.id === id)).filter(Boolean);
    const ov = document.createElement('div');
    ov.id = 'ewfLegendOverlay';
    ov.className = 'ewf15-overlay';
    ov.innerHTML = `<h1>🤝 LEGENDS REUNITED!</h1>
      <div class="ewf15-cards">${mem.map(w => `<div class="ewf15-card" style="cursor:default;"><img src="${esc(w.image)}"><div class="nm">${esc(w.name)}</div></div>`).join('')}</div>
      <div style="font-family:'Russo One',sans-serif; color:#ffd700; font-size:clamp(1.4rem,4vw,2.4rem); text-align:center; text-shadow:0 0 18px rgba(255,215,0,0.7);">${esc(l.name)}</div>
      <div class="ewf-tut-bubble" style="position:relative; inset:auto; transform:none; width:min(560px,100%);">
        <img src="brethart.png" alt="Bret">
        <div><div class="ewf-tut-name">BRET "THE HITMAN" HART</div><div class="ewf-tut-text">${l.bret}</div>
        <div class="ewf-tut-btns"><span></span><button class="ewf-tut-next" type="button">LET'S GO! ➔</button></div></div>
      </div>`;
    host().appendChild(ov);
    playSfx('crowd.mp3', 0.9);
    try { if (typeof playOhMyGodSting === 'function') playOhMyGodSting(); } catch (e) {}
    ov.querySelector('.ewf-tut-next').onclick = () => { ov.remove(); done(); };
  }
  window.ewfCheckLegends = checkLegends;

  // trophy cabinet: the Tag Historian trophy (hidden until earned)
  function wrapTrophies() {
    const orig = window.renderTrophyCabinetUI;
    if (typeof orig === 'function' && !orig.__b15) {
      const w = function (...a) {
        const r = orig.apply(this, a);
        try {
          const done = legendsSeen().length >= LEGENDS.length;
          const card = document.getElementById('trophyCard9');
          if (card) {
            card.classList.toggle('is-locked', !done); card.classList.toggle('is-unlocked', done);
            document.getElementById('trophyTitle9').innerText = done ? 'TAG HISTORIAN' : '???';
            document.getElementById('trophyProg9').innerText = done ? 'UNLOCKED 🤝' : '???';
          }
        } catch (e) {}
        return r;
      };
      w.__b15 = true;
      window.renderTrophyCabinetUI = w;
      try { renderTrophyCabinetUI = w; } catch (e) {}
    }
    const origDetail = window.showTrophyDetail;
    if (typeof origDetail === 'function' && !origDetail.__b15) {
      const d = function (num) {
        if (num === 9) {
          const done = legendsSeen().length >= LEGENDS.length;
          return alert(done ? `🏆 HALL OF FAME TAG HISTORIAN\n\nYou reunited all five legendary tag teams!` : `🏆 ???\n\nA secret trophy. Keep booking tag teams and you might find out...`);
        }
        return origDetail.apply(this, arguments);
      };
      d.__b15 = true;
      window.showTrophyDetail = d;
      try { showTrophyDetail = d; } catch (e) {}
    }
  }

  // live match starts: check for legends (once per match)
  function wrapLiveStart() {
    const orig = window.showMatchInProgressWinnerScreen;
    if (typeof orig !== 'function' || orig.__b15) return;
    const w = function (...a) {
      const r = orig.apply(this, a);
      try { setTimeout(checkLegends, 400); } catch (e) {}
      try { if (typeof window.ewfInjuryInterferenceArm === 'function') window.ewfInjuryInterferenceArm(); } catch (e) {}
      return r;
    };
    w.__b15 = true;
    window.showMatchInProgressWinnerScreen = w;
    try { showMatchInProgressWinnerScreen = w; } catch (e) {}
  }

  /* ==========================================================================
     7. COMMENTATOR PACK WALK DOWNS (item 14)
     ========================================================================== */
  const COMMS = [
    { who: 'bret', name: 'BRET "THE HITMAN" HART', role: 'LEAD COLOUR ANALYST', img: 'brethart.png' },
    { who: 'corbin', name: 'HAPPY CORBIN', role: 'BROADCAST ANALYST', img: 'corbin.png' }
  ];
  let walkDone = null;
  function walkScreen(html) {
    ensureStyles();
    let ov = document.getElementById('ewfWalkDown');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'ewfWalkDown';
      ov.className = 'ewf15-overlay';
      ov.style.background = "linear-gradient(rgba(5,5,10,0.55), rgba(5,5,10,0.9)), url('commentary_desk_bg.png') center/cover no-repeat, #000";
      host().appendChild(ov);
    }
    ov.style.display = 'flex';
    ov.innerHTML = html;
    return ov;
  }
  function bretBubble(text, btn) {
    return `<div class="ewf-tut-bubble" style="position:relative; inset:auto; transform:none; width:min(600px,100%);">
      <img src="brethart.png" alt="Bret"><div style="flex:1;"><div class="ewf-tut-name">BRET "THE HITMAN" HART</div><div class="ewf-tut-text">${text}</div>
      ${btn ? `<div class="ewf-tut-btns"><span></span>${btn}</div>` : ''}</div></div>`;
  }
  window.ewfStartWalkDowns = function (replay, onDone) {
    walkDone = onDone || null;
    const ov = walkScreen(`
      <h1>🎙️ YOUR BROADCAST TEAM HAS ARRIVED!</h1>
      ${bretBubble(`GM, every great show needs great commentary! <b>Go and grab your commentator pack from Dad</b>, and set up the <b>commentary table</b> next to the ring.<br><br>When the figures are out of the box and the table's ready, press the button and we'll make our entrances!`)}
      <button type="button" class="ewf15-btn gold" id="ewfWalkStart" style="font-size:1.2rem; padding:16px 26px;">▶ START WALK DOWN INTRO</button>`);
    try { playSfx('title_clink.mp3', 0.8); } catch (e) {}
    ov.querySelector('#ewfWalkStart').onclick = () => walkDown(0);
  };
  function walkDown(i) {
    const c = COMMS[i];
    if (!c) return walkFinish();
    // lights down
    const ov = walkScreen(`<div style="position:absolute; inset:0; background:#000; animation: ewf15fade 1.2s ease-out forwards;"></div>`);
    try { if (typeof playLightsOutAudio === 'function') playLightsOutAudio(); } catch (e) {}
    setTimeout(() => {
      const ov2 = walkScreen(`
        <div style="font-family:'Russo One',sans-serif; color:#fff; font-size:clamp(1rem,2.6vw,1.4rem); letter-spacing:2px;">MAKING HIS WAY TO THE COMMENTARY TABLE...</div>
        <img src="${c.img}" style="width:min(36vh,280px); height:min(36vh,280px); object-fit:cover; border:4px solid #ffd700; box-shadow:0 0 40px rgba(255,215,0,0.6);">
        <h1 style="animation:none;">${esc(c.name)}</h1>
        <div style="font-family:'Russo One',sans-serif; color:#ffd700; letter-spacing:2px;">${c.role}</div>
        <div class="sub">Walk ${i === 0 ? 'Bret' : 'Corbin'} down to the commentary table while his music plays!</div>
        <button type="button" class="ewf15-btn gold" id="ewfWalkMusic" style="font-size:1.1rem;">🎵 PLAY HIS MUSIC</button>`);
      ov2.querySelector('#ewfWalkMusic').onclick = () => {
        ov2.style.display = 'none';
        window.ewfWalkReturn = () => walkAtDesk(i);
        if (typeof window.playCommentatorIntro === 'function') window.playCommentatorIntro(c.who);
        else walkAtDesk(i);
      };
    }, 1300);
  }
  function walkAtDesk(i) {
    const c = COMMS[i];
    const last = i >= COMMS.length - 1;
    const ov = walkScreen(`
      <img src="${c.img}" style="width:min(28vh,220px); height:min(28vh,220px); object-fit:cover; border:4px solid #00ff66;">
      <h1 style="animation:none; color:#00ff66; text-shadow:0 0 20px rgba(0,255,102,0.6);">✓ ${esc(c.name.split(' ')[0] === 'BRET' ? 'BRET' : 'CORBIN')} IS AT THE DESK!</h1>
      <button type="button" class="ewf15-btn gold" id="ewfWalkNext" style="font-size:1.1rem;">${last ? "WE'RE ALL SET ➔" : 'NEXT COMMENTATOR ▶'}</button>
      <button type="button" class="ewf15-btn" id="ewfWalkAgain">↺ PLAY HIS MUSIC AGAIN</button>`);
    ov.querySelector('#ewfWalkNext').onclick = () => walkDown(i + 1);
    ov.querySelector('#ewfWalkAgain').onclick = () => { ov.style.display = 'none'; window.ewfWalkReturn = () => walkAtDesk(i); window.playCommentatorIntro(c.who); };
  }
  function walkFinish() {
    const ov = walkScreen(`
      <h1>🔴 WE'RE LIVE!</h1>
      <div style="display:flex; gap:18px;">${COMMS.map(c => `<img src="${c.img}" style="width:140px; height:140px; object-fit:cover; border:3px solid #ffd700;">`).join('')}</div>
      ${bretBubble(`Corbin, we're <b>LIVE</b>! Welcome to the <b>Ellis Wrestling Federation</b>, everybody. Let's get this show on the road!`, `<button class="ewf-tut-next" type="button" id="ewfWalkEnd">LET'S GO! ➔</button>`)}`);
    try { if (typeof playPyroBlast === 'function') playPyroBlast(); } catch (e) {}
    playSfx('crowd.mp3', 0.7);
    ov.querySelector('#ewfWalkEnd').onclick = () => {
      ov.remove();
      try {
        const k = 'ewf_walkdown_xp';
        if (!localStorage.getItem(k) && typeof addXP === 'function') { localStorage.setItem(k, '1'); addXP(100, 'Broadcast team in position'); }
        if (typeof saveHistoryLog === 'function') saveHistoryLog('🎙️ BROADCAST TEAM: Bret Hart and Happy Corbin took their seats at the commentary table!', 'match');
      } catch (e) {}
      const d = walkDone; walkDone = null;
      if (d) d();
    };
  }
  // bring the walk down back after a commentator's music video is closed
  function wrapCloseVideo() {
    const orig = window.closeVideoModal;
    if (typeof orig !== 'function' || orig.__b15) return;
    const w = function (...a) {
      const r = orig.apply(this, a);
      if (typeof window.ewfWalkReturn === 'function') { const f = window.ewfWalkReturn; window.ewfWalkReturn = null; setTimeout(f, 150); }
      return r;
    };
    w.__b15 = true;
    window.closeVideoModal = w;
    try { closeVideoModal = w; } catch (e) {}
  }

  /* ==========================================================================
     8. INJURY REVENGE INTERFERENCE (item 27)
     Every major (5 match) injury remembers who caused it. In any match the attacker is in,
     the injured superstar might turn up: 4 left 20%, 3 left 35%, 2 left 55%, 1 left 90%.
     Always the red lights-out strobe, then either:
       CAN'T STAY AWAY (still hurt, medics drag them off) or
       ROGUE DISCHARGE (hospital cutscene, entrance video, injury cleared)
     ========================================================================== */
  const ATT_KEY = 'ewf_injury_attackers';
  const CHANCE = { 4: 0.20, 3: 0.35, 2: 0.55, 1: 0.90 };
  const ROGUE = { 4: 0.20, 3: 0.20, 2: 0.50, 1: 0.70 };
  const attackers = () => { try { return JSON.parse(localStorage.getItem(ATT_KEY) || '{}'); } catch (e) { return {}; } };
  const saveAttackers = m => { try { localStorage.setItem(ATT_KEY, JSON.stringify(m)); } catch (e) {} };
  const wById = id => (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : []).find(w => w.id === id) || null;
  window.ewfInjuryAttackers = attackers;
  // BATCH 16 ITEM 9: each injury only gets ONE interference, whichever way it goes
  const DONE_KEY = 'ewf_injury_interfered';
  const interfered = () => { try { return JSON.parse(localStorage.getItem(DONE_KEY) || '{}'); } catch (e) { return {}; } };
  const markInterfered = id => { const m = interfered(); m[id] = Date.now(); try { localStorage.setItem(DONE_KEY, JSON.stringify(m)); } catch (e) {} };
  window.ewfInjuryInterfered = interfered;
  // BATCH 16 ITEM 8: what happened is revealed after the match, back on the home screen
  const REVEAL_KEY = 'ewf_injury_reveal';

  function wrapInflict() {
    const orig = window.inflictInjury;
    if (typeof orig !== 'function' || orig.__b15) return;
    const w = function (victimId) {
      const r = orig.apply(this, arguments);
      try {
        if (r && r.severity === 'major') {
          let att = window.__ewfPendingAttacker || null;
          if (!att && window.EWFP) { try { att = (EWFP.load().injuredBy || {})[victimId] || null; } catch (e) {} }
          if (!att && typeof activeStoryWrestlerB !== 'undefined' && activeStoryWrestlerB && activeStoryWrestlerB.id === victimId && typeof activeStoryWrestlerA !== 'undefined' && activeStoryWrestlerA) att = activeStoryWrestlerA.id;
          if (att && att !== victimId) { const m = attackers(); m[victimId] = att; saveAttackers(m); }
          { const d = interfered(); if (d[victimId]) { delete d[victimId]; try { localStorage.setItem(DONE_KEY, JSON.stringify(d)); } catch (e) {} } } // a new injury, a new story
        }
      } catch (e) {}
      return r;
    };
    w.__b15 = true;
    window.inflictInjury = w;
    try { inflictInjury = w; } catch (e) {}
  }

  let plan = null;   // { victim, attacker, at, rogue, match }
  function arm() {
    // BATCH 16: the quick-match object is reused, so remember which match was armed (not just "armed once")
    const serial16 = window.__ewfMatchSerial || 0;
    if (typeof activeBookedMatch === 'undefined' || !activeBookedMatch || activeBookedMatch.__b15Interf === serial16) return;
    activeBookedMatch.__b15Interf = serial16;
    plan = null;
    if (fmt() === 'rumble') return;
    const ids = (activeBookedMatch.participants || []).filter(Boolean).map(p => p.id);
    const map = attackers();
    const injuries = (typeof getInjuries === 'function' ? getInjuries() : []) || [];
    const doneMap = interfered();
    const cands = injuries.filter(i => i && i.severity === 'major' && map[i.id] && ids.includes(map[i.id]) && !ids.includes(i.id) && CHANCE[i.remaining] && !doneMap[i.id]); // BATCH 16 ITEM 9: once per injury
    for (const inj of cands.sort(() => Math.random() - 0.5)) {
      if (Math.random() < CHANCE[inj.remaining]) {
        plan = { victimId: inj.id, attackerId: map[inj.id], remaining: inj.remaining, at: 30 + Math.floor(Math.random() * 31), rogue: Math.random() < ROGUE[inj.remaining], match: activeBookedMatch };
        break;
      }
    }
  }
  window.ewfInjuryInterferenceArm = arm;
  window.ewfInjuryPlan = () => plan;

  function wrapTick() {
    if (!window.EWFP || typeof EWFP.tick !== 'function' || EWFP.tick.__b15) return;
    const orig = EWFP.tick;
    const t = function (sec) {
      if (plan && plan.match === activeBookedMatch) {
        if (!plan.fired && sec >= plan.at && isMatchInProgressLooping && !isRunInActive && !screenBusy()) { plan.fired = true; fire(plan); }
        return; // nothing else runs in while this revenge is coming
      }
      return orig.apply(this, arguments);
    };
    t.__b15 = true;
    EWFP.tick = t;
  }

  function strobe(done) {
    try { if (typeof stopMatchCrowd === 'function') stopMatchCrowd(); } catch (e) {}
    try { if (typeof playLightsOutAudio === 'function') playLightsOutAudio(); } catch (e) {}
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed; inset:0; z-index:2147483646; background:#000;';
    host().appendChild(ov);
    let n = 0;
    setTimeout(() => {
      const iv = setInterval(() => {
        n++;
        ov.style.background = n % 2 ? '#ff0000' : '#000';
        try { if (typeof playPyroBlast === 'function') playPyroBlast(); } catch (e) {}
        if (n >= 6) { clearInterval(iv); ov.remove(); try { if (typeof playOhMyGodSting === 'function') playOhMyGodSting(); } catch (e) {} done(); }
      }, 260);
    }, 1400);
  }

  function badBlood(v, a, why) {
    try { if (window.EWFP) { const st = EWFP.load(); EWFP.setRel(v.id, a.id, 'badblood', why, null, st); EWFP.save(st); } } catch (e) {}
  }

  function fire(pl) {
    const v = wById(pl.victimId), a = wById(pl.attackerId);
    if (!v || !a) return;
    isRunInActive = true;
    markInterfered(v.id);
    try { if (typeof currentMatchSummary !== 'undefined' && currentMatchSummary) currentMatchSummary.interference = `${v.name} (REVENGE)`; } catch (e) {}
    try { localStorage.setItem(REVEAL_KEY, JSON.stringify({ v: v.id, a: a.id, rogue: !!pl.rogue })); } catch (e) {}
    badBlood(v, a, 'came back from injury to get revenge');
    try { if (typeof saveHistoryLog === 'function') saveHistoryLog(`🩼 REVENGE RUN-IN: ${v.name.toUpperCase()} left the Medical Ward to attack ${a.name.toUpperCase()}!`, 'interference'); } catch (e) {}
    try { if (typeof logShowFalloutEvent === 'function') logShowFalloutEvent('ambush', `🩼 ${v.name.toUpperCase()} came for ${a.name.toUpperCase()}!`); } catch (e) {}
    // BATCH 16 ITEM 8: no scene and no buttons mid-match: the red strobe, then their music like any run-in
    strobe(() => {
      const banner = document.getElementById('ambushBanner');
      if (banner) {
        banner.innerHTML = `🚨 OH MY GOD! ${esc(v.name.toUpperCase())} IS HERE... AND HE'S COMING FOR ${esc(a.name.toUpperCase())}! 🚨`;
        banner.style.background = 'linear-gradient(180deg, #ff0000, #800000)';
        banner.style.display = 'flex';
      }
      try {
        const modalEl = document.getElementById('videoModal');
        if (modalEl) modalEl.classList.remove('split-screen-mode');
        setElDisplay('videoCloseBtn', 'flex');
        setElDisplay('quickMatchBox', 'none');
        setElDisplay('player-container', 'block');
        currentPlayingWrestler = v;
        isMatchInProgressLooping = false;
        isRunInActive = true;
        const back = () => { if (banner) banner.style.display = 'none'; if (isRunInActive) showMatchInProgressWinnerScreen(); };
        const btn = document.getElementById('nextEntrantBtn');
        if (btn) { btn.innerText = 'Return to Fight ➔'; btn.style.display = 'block'; btn.onclick = back; }
        if (typeof loadAndPlayYouTube === 'function') loadAndPlayYouTube(v.youtubeUrl, true, false);
        try { clearTimeout(runInAutoTimeout); runInAutoTimeout = setTimeout(back, 20000); } catch (e) { setTimeout(back, 20000); }
      } catch (e) { console.warn('revenge run-in', e); try { showMatchInProgressWinnerScreen(); } catch (e2) {} }
    });
  }

  // after the match, once the screen is free: did they come back early?
  function revealPoll() {
    let r = null;
    try { r = JSON.parse(localStorage.getItem(REVEAL_KEY) || 'null'); } catch (e) {}
    if (!r) return;
    try { if (isMatchInProgressLooping || isRunInActive) return; } catch (e) {}
    if (screenBusy() || (window.ewfVideoPlaying && window.ewfVideoPlaying())) return;
    const vis = id => { const el = document.getElementById(id); return el && getComputedStyle(el).display !== 'none'; };
    if (vis('universalSummaryOverlay') || vis('matchCardOverlay') || document.querySelector('.ewf-tut-bubble, .ewfp-scene')) return;
    try { localStorage.removeItem(REVEAL_KEY); } catch (e) {}
    const v = wById(r.v), a = wById(r.a);
    if (!v || !a) return;
    const stillHurt = typeof getInjuryRecord === 'function' && !!getInjuryRecord(v.id);
    if (r.rogue && stillHurt) {
      window.__ewfRogueInMatch = { v, a, home: true };
      if (typeof window.openHospitalEscapeModal === 'function') window.openHospitalEscapeModal(v, a); else afterDischarge();
    }
    else cantStayAway(v, a);
  }
  setInterval(revealPoll, 1500);

  function cantStayAway(v, a) {
    const P = window.EWFP;
    if (!P || !P._scene) return;
    P._scene({
      bg: 'hospital_escape_bg.png', title: `🩼 ${v.name.toUpperCase()} COULDN'T STAY AWAY!`, titleBg: 'linear-gradient(180deg,#d50000,#3d0000)',
      left: v, right: a,
      text: (typeof getInjuryRecord === 'function' && getInjuryRecord(v.id))
        ? `<b>Bret:</b> "<b>${v.name}</b> wasn't cleared, but he couldn't stay away from <b>${a.name}</b>! The medics dragged him out. He's <b>still injured</b>... but he's sent a message!"`
        : `<b>Bret:</b> "<b>${v.name}</b> wasn't cleared, but he couldn't stay away from <b>${a.name}</b>! The medics dragged him out... and now he's <b>fit and back on the roster</b>. ${a.name} had better watch out!"`,
      buttons: [{ label: 'GOT IT ➔', cls: 'gold', fn: () => { try { P._closeScene(); } catch (e) {} } }]
    });
    try { P._sfx('ambush_hit.mp3', 0.6); } catch (e) {}
    try { if (typeof saveHistoryLog === 'function') saveHistoryLog(`🩼 CAN'T STAY AWAY: ${v.name.toUpperCase()} attacked ${a.name.toUpperCase()} but is still injured!`, 'interference'); } catch (e) {}
  }

  function rogueDischarge(v, a) {
    window.__ewfRogueInMatch = { v, a };
    if (typeof window.openHospitalEscapeModal === 'function') window.openHospitalEscapeModal(v, a);
    else afterDischarge();
  }
  function wrapDischarge() {
    const orig = window.confirmHospitalEscapeClearance;
    if (typeof orig !== 'function' || orig.__b15) return;
    const w = function () {
      const r = orig.apply(this, arguments);
      if (window.__ewfRogueInMatch) setTimeout(afterDischarge, 200);
      return r;
    };
    w.__b15 = true;
    window.confirmHospitalEscapeClearance = w;
    try { confirmHospitalEscapeClearance = w; } catch (e) {}
  }
  function afterDischarge() {
    const ctx = window.__ewfRogueInMatch; window.__ewfRogueInMatch = null;
    if (!ctx) return;
    const { v, a } = ctx;
    try { if (typeof clearInjury === 'function') clearInjury(v.id); } catch (e) {}
    if (ctx.home) {
      // BATCH 16 ITEM 8: revealed after the match, so no entrance video, just back on the roster
      const m0 = attackers(); delete m0[v.id]; saveAttackers(m0);
      try { if (window.EWFP) { const st = EWFP.load(); delete st.injuredBy[v.id]; st.pendingReturn = (st.pendingReturn || []).filter(p => p.id !== v.id); EWFP.save(st); } } catch (e) {}
      badBlood(v, a, 'came back early to get revenge');
      try { if (typeof unlockAchievement === 'function') unlockAchievement('back_from_dead'); } catch (e) {}
      try { if (typeof saveHistoryLog === 'function') saveHistoryLog(`🏥 BACK EARLY: ${v.name.toUpperCase()} is cleared and coming for ${a.name.toUpperCase()}!`, 'interference'); } catch (e) {}
      try { window.ewfToast && window.ewfToast(`🚨 ${v.name.toUpperCase()} IS BACK ON THE ROSTER... AND HE'S COMING FOR ${a.name.toUpperCase()}!`, 5000); } catch (e) {}
      try { if (typeof renderGrid === 'function') renderGrid(); } catch (e) {}
      return;
    }
    const m = attackers(); delete m[v.id]; saveAttackers(m);
    try { if (window.EWFP) { const st = EWFP.load(); delete st.injuredBy[v.id]; st.pendingReturn = (st.pendingReturn || []).filter(p => p.id !== v.id); EWFP.save(st); } } catch (e) {}
    badBlood(v, a, 'came back early to get revenge');
    try { if (typeof unlockAchievement === 'function') unlockAchievement('back_from_dead'); } catch (e) {}
    // their entrance video, then back to the fight
    const banner = document.getElementById('ambushBanner');
    if (banner) {
      banner.innerHTML = `🚨 OH MY GOD! ${esc(v.name.toUpperCase())} IS BACK... AND HE'S COMING FOR ${esc(a.name.toUpperCase())}! 🚨`;
      banner.style.background = 'linear-gradient(180deg, #ff0000, #800000)';
      banner.style.display = 'flex';
    }
    try {
      const modalEl = document.getElementById('videoModal');
      if (modalEl) modalEl.classList.remove('split-screen-mode');
      setElDisplay('videoCloseBtn', 'flex');
      setElDisplay('quickMatchBox', 'none');
      setElDisplay('player-container', 'block');
      currentPlayingWrestler = v;
      isMatchInProgressLooping = false;
      isRunInActive = true;
      const btn = document.getElementById('nextEntrantBtn');
      if (btn) { btn.innerText = 'Return to Fight ➔'; btn.style.display = 'block'; btn.onclick = () => { if (banner) banner.style.display = 'none'; showMatchInProgressWinnerScreen(); }; }
      if (typeof loadAndPlayYouTube === 'function') loadAndPlayYouTube(v.youtubeUrl, true, false);
    } catch (e) { console.warn('rogue entrance', e); try { showMatchInProgressWinnerScreen(); } catch (e2) {} }
  }

  // Medical Ward hint
  function wrapInjuriesTab() {
    const orig = window.renderUniverseInjuriesTab;
    if (typeof orig !== 'function' || orig.__b15) return;
    const w = function (...a) {
      const r = orig.apply(this, a);
      try {
        const map = attackers();
        const inj = (typeof getInjuries === 'function' ? getInjuries() : []) || [];
        const box = document.getElementById('hospitalizedRosterListContainer');
        if (box) inj.filter(i => i.severity === 'major' && map[i.id] && i.remaining <= 4).forEach(i => {
          const w8 = wById(i.id); if (!w8) return;
          const card = [...box.querySelectorAll('.feud-card')].find(c => c.innerText.includes(w8.name));
          if (card && !card.querySelector('.ewf15-hint')) {
            const d = document.createElement('div'); d.className = 'ewf15-hint';
            d.style.cssText = 'font-size:0.72rem; color:#ffd700; margin-top:3px;';
            d.textContent = '👀 Watch out, they could come back early!';
            const info = card.querySelector('div > div:last-child') || card; info.appendChild(d);
          }
        });
      } catch (e) {}
      return r;
    };
    w.__b15 = true;
    window.renderUniverseInjuriesTab = w;
    try { renderUniverseInjuriesTab = w; } catch (e) {}
  }

  /* ---------- start-up ---------- */
  function init() {
    wrapDeclareForPads();
    try { watchAmbushBanner(); watchBubbles(); wrapTrophies(); wrapLiveStart(); wrapCloseVideo(); wrapInflict(); wrapTick(); wrapDischarge(); wrapInjuriesTab(); } catch (e) { console.warn('b15 init', e); }
    const office = window.openGMOffice;
    if (typeof office === 'function' && !office.__b15) {
      const w = function (...a) { const r = office.apply(this, a); try { drawDadRow(); } catch (e) {} return r; };
      w.__b15 = true;
      window.openGMOffice = w;
      try { openGMOffice = window.openGMOffice; } catch (e) {}
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));
  else setTimeout(init, 0);
})();
