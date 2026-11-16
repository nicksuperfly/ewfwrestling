/* ==========================================================================
   ELLIS'S MAIN EVENT (EWF UNIVERSE) - MODULE 6: js/6-tutorial.js
   BATCH 8 ITEMS 1 & 3: Meet Your Broadcast Team + Bret Hart tutorial
   - Broadcast team intro after the 2nd superstar is signed
   - Home screen tour (spotlight + speech bubble)
   - Guided first match (tips at each step of Choose Your Match)
   - One-off tips the first time each other section is opened
   - Replay Tutorial button in the GM Office
   ========================================================================== */

(function () {
  const STATE_KEY = 'ewf_tutorial_state';

  function getState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveState(st) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(st)); } catch (e) {}
  }
  function patchState(patch) { const st = getState(); Object.assign(st, patch); saveState(st); return st; }

  const BRET_IMG = 'brethart.png';

  /* ---------- Styles ---------- */
  function ensureStyles() {
    if (document.getElementById('ewfTutorialStyles')) return;
    const css = document.createElement('style');
    css.id = 'ewfTutorialStyles';
    css.textContent = `
      .ewf-tut-spot { position: fixed; z-index: 2147483600; border: 3px solid #ffd700; border-radius: 6px;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.78), 0 0 25px #ffd700; pointer-events: none;
        transition: all 0.35s ease; animation: ewfTutPulse 1.6s infinite; }
      .ewf-tut-dim { position: fixed; inset: 0; z-index: 2147483600; background: rgba(0,0,0,0.78); }
      @keyframes ewfTutPulse { 0%,100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.78), 0 0 18px #ffd700; } 50% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.78), 0 0 38px #ffd700; } }
      .ewf-tut-bubble { position: fixed; z-index: 2147483647; max-width: 460px; width: calc(100vw - 40px);
        background: linear-gradient(160deg, #15151f, #08080c); border: 2px solid #ffd700; border-radius: 6px;
        box-shadow: 0 0 30px rgba(255,215,0,0.45); color: #fff; padding: 14px 16px; display: flex; gap: 12px;
        font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .ewf-tut-bubble img { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid #ffd700; flex: none; background: #222; }
      .ewf-tut-name { font-family: 'Russo One', sans-serif; color: #ffd700; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 4px; }
      .ewf-tut-text { font-size: 1rem; line-height: 1.35; }
      .ewf-tut-btns { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; gap: 10px; }
      .ewf-tut-next { font-family: 'Russo One', sans-serif; background: linear-gradient(180deg, #d4af37, #b8860b); color: #000;
        border: 2px solid #fff; padding: 10px 18px; font-size: 1rem; cursor: pointer; }
      .ewf-tut-skip { background: none; border: none; color: #999; font-size: 0.8rem; text-decoration: underline; cursor: pointer; }
      .ewf-tut-step { color: #888; font-size: 0.7rem; font-family: 'Russo One', sans-serif; }
      .ewf-tut-tip { top: 16px; left: 50%; transform: translateX(-50%); }
      .ewf-tut-tip.in-scene { top: 96px; left: auto; right: 16px; transform: none; max-width: 400px; }
      #ewfBroadcastIntro { position: fixed; inset: 0; z-index: 2147483500; display: flex; flex-direction: column; align-items: center;
        justify-content: center; padding: 24px; box-sizing: border-box; text-align: center;
        background: linear-gradient(rgba(5,5,10,0.55), rgba(5,5,10,0.85)), url('commentary_desk_bg.png') center/cover no-repeat, #000; }
      #ewfBroadcastIntro h1 { font-family: 'Russo One', sans-serif; color: #ffd700; font-size: clamp(1.6rem, 4.5vw, 2.8rem);
        letter-spacing: 2px; text-shadow: 0 0 20px rgba(255,215,0,0.7); margin: 0 0 6px 0; }
      #ewfBroadcastIntro .sub { color: #fff; font-size: clamp(0.95rem, 2.2vw, 1.2rem); max-width: 720px; margin-bottom: 22px; }
      .ewf-bt-cards { display: flex; gap: 28px; justify-content: center; flex-wrap: wrap; margin-bottom: 26px; }
      .ewf-bt-card { background: rgba(10,10,16,0.85); border: 2px solid #ffd700; padding: 16px; width: 230px; box-shadow: 0 0 25px rgba(255,215,0,0.35); }
      .ewf-bt-card img { width: 150px; height: 150px; object-fit: cover; border: 2px solid #fff; background: #222; }
      .ewf-bt-card .nm { font-family: 'Russo One', sans-serif; color: #fff; font-size: 1.05rem; margin-top: 10px; }
      .ewf-bt-card .rl { color: #ffd700; font-size: 0.8rem; margin: 4px 0 12px 0; letter-spacing: 1px; }
      .ewf-bt-card .done { color: #00ff66; font-family: 'Russo One', sans-serif; font-size: 0.8rem; margin-top: 8px; display: none; }
    `;
    document.head.appendChild(css);
  }

  /* ---------- Speech bubble ---------- */
  let bubbleEl = null, spotEl = null, blockEl = null;
  function clearUI() {
    if (bubbleEl) { bubbleEl.remove(); bubbleEl = null; }
    if (spotEl) { spotEl.remove(); spotEl = null; }
    if (blockEl) { blockEl.remove(); blockEl = null; }
  }

  // Fullscreen mode only shows what's inside the fullscreen element, so mount there when it's active
  const host = () => {
    const fs = document.fullscreenElement || document.webkitFullscreenElement;
    return (fs && getComputedStyle(fs).display !== 'none') ? fs : document.body;
  };

  function showBubble({ text, target = null, nextLabel = 'NEXT ➔', onNext, onSkip, stepText = '', dim = true, tipMode = false }) {
    ensureStyles();
    clearUI();

    if (!tipMode) {
      // invisible layer so taps during the tour don't fall through to the buttons behind
      blockEl = document.createElement('div');
      blockEl.style.cssText = 'position:fixed; inset:0; z-index:2147483601; background:transparent;';
      host().appendChild(blockEl);
    }
    if (!tipMode && dim) {
      const el = target ? (typeof target === 'string' ? document.querySelector(target) : target) : null;
      if (el && el.getBoundingClientRect().width > 0) {
        el.scrollIntoView({ block: 'center', behavior: 'auto' });
        const r = el.getBoundingClientRect();
        spotEl = document.createElement('div');
        spotEl.className = 'ewf-tut-spot';
        const pad = 8;
        Object.assign(spotEl.style, { left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
        host().appendChild(spotEl);
      } else {
        spotEl = document.createElement('div');
        spotEl.className = 'ewf-tut-dim';
        host().appendChild(spotEl);
      }
    }

    bubbleEl = document.createElement('div');
    bubbleEl.className = 'ewf-tut-bubble' + (tipMode ? ' ewf-tut-tip' : '') + (tipMode && document.querySelector('.ewfp-scene') ? ' in-scene' : '');
    bubbleEl.innerHTML = `
      <img src="${BRET_IMG}" alt="Bret Hart" onerror="this.style.display='none'">
      <div style="flex:1;">
        <div class="ewf-tut-name">BRET "THE HITMAN" HART</div>
        <div class="ewf-tut-text">${text}</div>
        <div class="ewf-tut-btns">
          ${onSkip ? '<button class="ewf-tut-skip" type="button">Skip tutorial</button>' : `<span class="ewf-tut-step">${stepText}</span>`}
          <button class="ewf-tut-next" type="button">${nextLabel}</button>
        </div>
      </div>`;
    host().appendChild(bubbleEl);

    // Position: under/over the highlighted element, otherwise centred
    if (!tipMode) {
      const el = spotEl && spotEl.className === 'ewf-tut-spot' ? spotEl : null;
      const bw = bubbleEl.offsetWidth, bh = bubbleEl.offsetHeight;
      let left = (window.innerWidth - bw) / 2, top = (window.innerHeight - bh) / 2;
      if (el) {
        const r = el.getBoundingClientRect();
        left = Math.min(Math.max(12, r.left + r.width / 2 - bw / 2), window.innerWidth - bw - 12);
        top = (r.bottom + 14 + bh < window.innerHeight) ? r.bottom + 14 : Math.max(12, r.top - bh - 14);
      }
      bubbleEl.style.left = left + 'px';
      bubbleEl.style.top = top + 'px';
    }

    bubbleEl.querySelector('.ewf-tut-next').onclick = () => { clearUI(); if (onNext) onNext(); };
    const skip = bubbleEl.querySelector('.ewf-tut-skip');
    if (skip) skip.onclick = () => { clearUI(); if (onSkip) onSkip(); };
  }

  /* ---------- 1. Meet Your Broadcast Team ---------- */
  function openBroadcastIntro() {
    ensureStyles();
    let ov = document.getElementById('ewfBroadcastIntro');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'ewfBroadcastIntro';
      ov.innerHTML = `
        <h1>🎙️ MEET YOUR BROADCAST TEAM 🎙️</h1>
        <div class="sub">Every great show needs great commentary! Set up Bret and Corbin's figures at the commentary desk next to the ring, then tap PLAY INTRO to welcome each one.</div>
        <div class="ewf-bt-cards">
          <div class="ewf-bt-card"><img src="brethart.png" alt="Bret Hart" onerror="this.src='logo_notext.png'">
            <div class="nm">BRET "THE HITMAN" HART</div><div class="rl">LEAD COLOUR ANALYST</div>
            <button class="action-btn btn-gold" style="flex:none; width:auto; height:auto;" type="button" data-who="bret">▶ PLAY INTRO</button><div class="done" data-done="bret">✓ AT THE DESK</div></div>
          <div class="ewf-bt-card"><img src="corbin.png" alt="Happy Corbin" onerror="this.src='logo_notext.png'">
            <div class="nm">HAPPY CORBIN</div><div class="rl">BROADCAST ANALYST</div>
            <button class="action-btn btn-gold" style="flex:none; width:auto; height:auto;" type="button" data-who="corbin">▶ PLAY INTRO</button><div class="done" data-done="corbin">✓ AT THE DESK</div></div>
        </div>
        <button class="action-btn btn-red" type="button" id="ewfBroadcastReady" style="flex:none; width:auto; height:auto; max-width:none; min-width:320px; font-size:1.1rem; padding:14px 24px;">COMMENTARY TEAM IN POSITION ➔</button>`;
      document.body.appendChild(ov);
      ov.querySelectorAll('[data-who]').forEach(btn => {
        btn.onclick = () => {
          const who = btn.getAttribute('data-who');
          const st = getState(); st.introsPlayed = st.introsPlayed || {}; st.introsPlayed[who] = true; saveState(st);
          ov.style.display = 'none';
          window.ewfReturnToBroadcastIntro = true;
          if (typeof playCommentatorIntro === 'function') playCommentatorIntro(who);
          else { window.ewfReturnToBroadcastIntro = false; ov.style.display = 'flex'; }
          refreshBroadcastTicks();
        };
      });
      ov.querySelector('#ewfBroadcastReady').onclick = () => {
        ov.style.display = 'none';
        window.ewfReturnToBroadcastIntro = false;
        patchState({ broadcastIntroDone: true });
        if (typeof resumeBGM === 'function') resumeBGM();
        setTimeout(startTour, 400);
      };
    }
    refreshBroadcastTicks();
    ov.style.display = 'flex';
    try { if (typeof stopBGMForAction === 'function') stopBGMForAction(); } catch (e) {}
    try { if (typeof playTitleClinkAudio === 'function') playTitleClinkAudio(); } catch (e) {}
  }
  function refreshBroadcastTicks() {
    const ov = document.getElementById('ewfBroadcastIntro'); if (!ov) return;
    const played = getState().introsPlayed || {};
    ['bret', 'corbin'].forEach(w => { const d = ov.querySelector(`[data-done="${w}"]`); if (d) d.style.display = played[w] ? 'block' : 'none'; });
  }

  // Bring the broadcast screen back after a commentator's intro video is closed
  const origCloseVideo = window.closeVideoModal;
  if (typeof origCloseVideo === 'function') {
    window.closeVideoModal = function (...args) {
      const r = origCloseVideo.apply(this, args);
      if (window.ewfReturnToBroadcastIntro) {
        window.ewfReturnToBroadcastIntro = false;
        const ov = document.getElementById('ewfBroadcastIntro');
        if (ov) { refreshBroadcastTicks(); ov.style.display = 'flex'; }
      }
      return r;
    };
  }

  // Called by confirmSuperstarInduction() after every signing
  window.ewfTutorialAfterSigning = function () {
    const st = getState();
    if (st.broadcastIntroDone) return;
    const count = (typeof getUnlockedWrestlers === 'function') ? getUnlockedWrestlers().length : 0;
    if (count >= 2) setTimeout(openBroadcastIntro, 900);
    else if (count === 1 && st.xmasDone) setTimeout(() => {
      const addCard = document.querySelector('#wrestler-grid .add-card');
      showBubble({ text: `One down, one to go! Tap the <b>+</b> card again and enter the code of your <b>second</b> favourite superstar.`, target: addCard, nextLabel: `ON IT! ➔` });
    }, 900);
  };

  /* ---------- 0. Batch 11: Christmas morning welcome ---------- */
  function openChristmasWelcome(after) {
    ensureStyles();
    if (!document.getElementById('ewfXmasStyles')) {
      const css = document.createElement('style');
      css.id = 'ewfXmasStyles';
      css.textContent = `
        #ewfXmas { position: fixed; inset: 0; z-index: 2147483500; display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 24px; box-sizing: border-box; overflow: hidden;
          background: radial-gradient(ellipse at center, rgba(120,0,0,0.55), rgba(0,0,0,0.95) 70%), url('show_bg.png') center/cover no-repeat, #000; animation: ewfXmasIn .6s ease-out; }
        #ewfXmas .logo { width: min(240px, 40vw); filter: drop-shadow(0 0 25px rgba(255,215,0,0.6)); margin-bottom: 10px; animation: ewfXmasPop .8s .2s both cubic-bezier(.3,1.5,.6,1); }
        #ewfXmas h1 { font-family: 'Russo One', sans-serif; font-size: clamp(2rem, 6.5vw, 4.4rem); margin: 0; color: #fff; letter-spacing: 2px;
          text-shadow: 0 0 12px #ff1744, 0 0 30px #ff1744, 0 4px 0 #7f0000; animation: ewfXmasPop .8s .5s both cubic-bezier(.3,1.5,.6,1); }
        #ewfXmas h2 { font-family: 'Russo One', sans-serif; font-size: clamp(1.1rem, 3.2vw, 2rem); margin: 10px 0 26px 0; color: #ffd700; letter-spacing: 3px;
          text-shadow: 0 0 18px rgba(255,215,0,0.7); animation: ewfXmasPop .8s .9s both cubic-bezier(.3,1.5,.6,1); }
        #ewfXmas button { font-family: 'Russo One', sans-serif; font-size: clamp(1.1rem, 2.6vw, 1.5rem); padding: 16px 38px; border: 3px solid #fff; color: #000; cursor: pointer;
          background: linear-gradient(180deg, #ffe066, #d4af37 55%, #b8860b); box-shadow: 0 0 30px rgba(255,215,0,0.7); animation: ewfXmasPop .8s 1.3s both cubic-bezier(.3,1.5,.6,1), ewfXmasGlow 1.6s 2s infinite; z-index: 3; }
        #ewfXmas .flake { position: absolute; top: -20px; color: #fff; opacity: 0.85; pointer-events: none; animation: ewfXmasSnow linear infinite; text-shadow: 0 0 6px rgba(255,255,255,0.8); }
        @keyframes ewfXmasIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ewfXmasPop { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes ewfXmasGlow { 0%,100% { box-shadow: 0 0 20px rgba(255,215,0,0.6); } 50% { box-shadow: 0 0 45px rgba(255,215,0,1); } }
        @keyframes ewfXmasSnow { to { transform: translateY(110vh) translateX(40px) rotate(360deg); } }
      `;
      document.head.appendChild(css);
    }
    let ov = document.getElementById('ewfXmas');
    if (ov) ov.remove();
    ov = document.createElement('div');
    ov.id = 'ewfXmas';
    ov.innerHTML = `
      <img class="logo" src="logo.png" alt="EWF" onerror="this.src='logo_notext.png'">
      <h1>🎄 MERRY CHRISTMAS ELLIS! 🎄</h1>
      <h2>WELCOME TO THE EWF</h2>
      <button type="button" id="ewfXmasGo">GET STARTED ➔</button>`;
    for (let i = 0; i < 40; i++) {
      const f = document.createElement('div');
      f.className = 'flake';
      f.textContent = i % 3 ? '❄' : '•';
      f.style.left = (Math.random() * 100) + 'vw';
      f.style.fontSize = (8 + Math.random() * 18) + 'px';
      f.style.animationDuration = (6 + Math.random() * 8) + 's';
      f.style.animationDelay = (-Math.random() * 10) + 's';
      ov.appendChild(f);
    }
    (host() || document.body).appendChild(ov);
    try { if (typeof stopBGMForAction === 'function') stopBGMForAction(); } catch (e) {}
    setTimeout(() => {
      try { if (typeof playPyroBlast === 'function') playPyroBlast(); } catch (e) {}
      try { const c = new Audio('crowd.mp3'); c.volume = 0.6; c.play().catch(() => {}); setTimeout(() => { let v = 0.6; const iv = setInterval(() => { v -= 0.05; if (v <= 0) { clearInterval(iv); c.pause(); } else c.volume = v; }, 150); }, 3500); } catch (e) {}
    }, 500);
    ov.querySelector('#ewfXmasGo').onclick = () => {
      ov.remove();
      patchState({ xmasDone: true });
      try { if (typeof resumeBGM === 'function') resumeBGM(); } catch (e) {}
      setTimeout(after || bretCodeMessage, 350);
    };
  }
  function bretCodeMessage() {
    const count = (typeof getUnlockedWrestlers === 'function') ? getUnlockedWrestlers().length : 0;
    if (count >= 2) { openBroadcastIntro(); return; }
    window.scrollTo(0, 0);
    const addCard = document.querySelector('#wrestler-grid .add-card');
    if (addCard) addCard.scrollIntoView({ block: 'center' });
    showBubble({
      text: `Merry Christmas Ellis. I'm Bret. But enough about me, let's get this show on the road. Enter the codes of your <b>2 favourite wrestlers</b> you got for Christmas and I'll show you how this all works.<br><br>There's a lot to it, so <b>buckle in!</b>`,
      target: addCard,
      nextLabel: `LET'S DO IT ➔`
    });
  }
  window.ewfOpenChristmasWelcome = openChristmasWelcome;
  function maybeChristmas() {
    const st = getState();
    if (st.xmasDone || st.broadcastIntroDone) return;
    const count = (typeof getUnlockedWrestlers === 'function') ? getUnlockedWrestlers().length : 0;
    if (count >= 2) return;
    openChristmasWelcome();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(maybeChristmas, 600));
  else setTimeout(maybeChristmas, 600);

  /* ---------- 2. Home screen tour ---------- */
  const btnByText = (txt) => [...document.querySelectorAll('.control-panel button')].find(b => (b.innerText || '').trim().toUpperCase() === txt);

  const TOUR = [
    { target: null, text: `Right then, <b>GM Ellis</b>! The commentary team is ready, so let me show you how to run the hottest promotion on the planet. Remember, you're learning from the best there is, the best there was and the best there ever will be!` },
    { target: () => document.getElementById('wrestler-grid'), text: `This is your <b>locker room</b>. Every figure you sign shows up here. Got a new figure? Tap the <b>+</b> card and enter its contract code to bring them into the EWF!` },
    { target: () => document.getElementById('wrestler-grid'), text: `Watch the <b>corners</b> of each card! <b>Top left:</b> any title they hold (the little number is how many times they've defended it). <b>Top right:</b> 🔥 on fire or ❄️ ice cold. <b>Bottom left:</b> ⚔️ a rivalry, or 💀 a Blood Feud! <b>Bottom right:</b> their <b>mood</b>. And a <b style="color:#ff1744;">red name</b> means they're a <b>BAD GUY</b>!` },
    { target: () => btnByText('CHOOSE YOUR MATCH'), text: `<b>CHOOSE YOUR MATCH</b>: pick the show, the superstars and the rules. Then watch the entrances and act out the match with your figures in the ring!` },
    { target: () => btnByText('MYSTERY MATCH'), text: `Can't decide? <b>MYSTERY MATCH</b> spins the reels and picks the show, the match type AND the superstars for you. Anything can happen!` },
    { target: () => btnByText('BOOK A SHOW'), text: `<b>BOOK A SHOW</b>: build a whole night of action, from Raw to WrestleMania! Title matches, feuds and a main event, all graded at the end of the night.` },
    { target: () => document.getElementById('gmProfileWidget') || btnByText('GM OFFICE'), text: `Every match earns you <b>XP</b>. Level up as GM to unlock new match types, huge events and... maybe a surprise or two. Check the <b>GM OFFICE</b> to see what's next!` },
    { target: () => btnByText('EWF UNIVERSE'), text: `The <b>EWF UNIVERSE</b> is where you manage your champions, rivalries, alliances and injuries. And <b>HISTORY</b> next to it keeps every result and title change. Legends are made here!` },
    { target: () => btnByText('STORY LINE'), text: `<b>STORY LINE</b> stirs up drama between two superstars: sneak attacks, betrayals, challenges! Sometimes it ends in a grudge match. Storylines can also kick off on their own after matches!` },
    { target: () => btnByText('PROMO MODE'), text: `<b>PROMO MODE</b>: switch it on, then tap a superstar to play their promo. Grab the figure and do the trash talk yourself!` },
    { target: null, text: `That's the tour, GM! Now for the fun part. Let's have your <b>FIRST MATCH</b>. I'll be right here at ringside to help.`, nextLabel: `LET'S GO! ➔`, last: true }
  ];

  function startTour() {
    const run = (i) => {
      if (i >= TOUR.length) return;
      const step = TOUR[i];
      const target = typeof step.target === 'function' ? step.target() : null;
      showBubble({
        text: step.text,
        target,
        nextLabel: step.nextLabel || 'NEXT ➔',
        stepText: `${i + 1} / ${TOUR.length}`,
        onSkip: i === 0 ? () => { patchState({ tourDone: true, guidedMatch: false, guidedDone: true }); } : null,
        onNext: () => {
          if (step.last) {
            patchState({ tourDone: true, guidedMatch: true });
            startGuidedMatch();
          } else run(i + 1);
        }
      });
    };
    window.scrollTo(0, 0);
    run(0);
  }

  /* ---------- 3. Guided first match ---------- */
  const GUIDE = [
    { key: 'show',    test: () => vis('qmStepShow'),    text: `First, pick the <b>SHOW</b>. Use the arrows to choose Raw, SmackDown or another brand, then tap <b>SELECT SHOW</b>. Or tap SKIP INTRO to jump straight in.` },
    { key: 'format',  test: () => vis('qmStepFormat'),  text: `Now the <b>FORMAT</b>. 1 vs 1 is a classic singles match. Want more chaos? Try a Triple Threat or Fatal 4-Way!` },
    { key: 'type',    test: () => vis('qmStepPicker'),  text: `Pick the <b>MATCH TYPE</b>. A Normal Match is a great start. Tables, Ladders and more unlock as you level up!` },
    { key: 'pick',    test: () => vis('qmStepHandPick'), text: `Choose your <b>SUPERSTARS</b>! Tap each slot to pick who's fighting, or hit AUTO-FILL. Grab those figures and get them ready!` },
    { key: 'preview', test: () => vis('qmStepResult'),  text: `Here's your <b>MATCH CARD</b>. Happy? Tap <b>START ENTRANCES</b> and get your superstars walking to the ring!` },
    { key: 'entrance', test: () => { const b = document.getElementById('nextEntrantBtn'); return b && b.offsetParent !== null && !/BELL/i.test(b.innerText || ''); },
      text: `Entrance time! Walk each figure down to the ring while their music plays. Tap <b>NEXT</b> when they're in the ring.` },
    { key: 'bell',    test: () => { const b = document.getElementById('nextEntrantBtn'); return b && b.offsetParent !== null && /BELL/i.test(b.innerText || ''); },
      text: `Everyone's in the ring. <b>RING THE BELL</b> and let's get it on! Now wrestle with your figures!` },
    { key: 'winner',  test: () => vis('qmStepWinner'),  text: `The match is ON! When it's over in the ring, <b>tap the WINNER here</b>. They'll get the glory, the momentum and maybe the gold!` },
    { key: 'summary', test: () => vis('universalSummaryOverlay'), text: `What a match! Give it a <b>STAR RATING</b> (5 stars for a classic!) and tap <b>CONFIRM</b> to put it in the history books.` }
  ];
  function vis(id) { const el = document.getElementById(id); return !!(el && el.offsetParent !== null && getComputedStyle(el).display !== 'none'); }

  let guideTimer = null;
  function startGuidedMatch() {
    const st = getState();
    if (!st.guidedMatch) return;
    st.guidedSeen = {}; saveState(st);
    if (typeof triggerLogoStinger === 'function' && typeof openMatchEngine === 'function') triggerLogoStinger(openMatchEngine);
    else if (typeof openMatchEngine === 'function') openMatchEngine();
    clearInterval(guideTimer);
    guideTimer = setInterval(guideTick, 700);
  }
  function guideTick() {
    const st = getState();
    if (!st.guidedMatch) { clearInterval(guideTimer); return; }
    st.guidedSeen = st.guidedSeen || {};
    for (const g of GUIDE) {
      if (st.guidedSeen[g.key]) continue;
      let on = false; try { on = g.test(); } catch (e) {}
      if (on) {
        st.guidedSeen[g.key] = true; saveState(st);
        showBubble({ text: g.text, tipMode: true, nextLabel: 'GOT IT ➔' });
        if (g.key === 'summary') finishGuidedLater();
        return;
      }
    }
  }
  function finishGuidedLater() {
    // Once the summary closes, wrap up the guided match
    const wait = setInterval(() => {
      if (!vis('universalSummaryOverlay')) {
        clearInterval(wait);
        clearInterval(guideTimer);
        patchState({ guidedMatch: false, guidedDone: true });
        setTimeout(() => {
          if (document.querySelector('.ewf-tut-bubble')) return;
          showBubble({ text: `YOU'RE A NATURAL, GM ELLIS! That match is in the record books. The EWF is all yours now. I'll pop up with tips the first time you try something new. Now go make some history!`, nextLabel: 'THANKS, BRET! ➔', tipMode: true });
        }, 1500);
      }
    }, 800);
  }
  // If the page reloads mid-guided-match, carry on giving tips
  if (getState().guidedMatch) { clearInterval(guideTimer); guideTimer = setInterval(guideTick, 700); }

  /* ---------- 4. First-visit tips ---------- */
  const TIPS = {
    bookShow: `Welcome to <b>BOOK A SHOW</b>! Pick a brand and I'll build the card. Play the matches in order, then <b>SIGN OFF</b> at the end to get your show grade and XP. Big shows like SummerSlam have titles on the line!`,
    gmOffice: `This is your <b>GM OFFICE</b>. See your level, the next unlock, and all the achievements you've earned. Watch Bret and Corbin's intros here any time too!`,
    universe: `The <b>EWF UNIVERSE</b>: crown champions, start rivalries, form tag team alliances and check the Medical Ward. You're the boss!`,
    storyline: `<b>STORY LINE</b> creates drama between two superstars: attacks, betrayals, challenges! Sometimes it leads to a grudge match. Storylines can also kick off on their own after matches!`,
    promo: `<b>PROMO MODE</b> is on! Tap a superstar to play their promo, then do the talking with your figure. Tap PROMO MODE again to switch it off.`,
    history: `<b>HISTORY</b> keeps every match, title change and big moment. Check the leaderboard to see who's the top dog in the EWF!`,
    mitb: `<b>MONEY IN THE BANK!</b> Climb the ladder and grab the briefcase. Whoever wins can cash it in for a title shot ANY TIME, even right after someone else's match!`,
    kotr: `<b>KING OF THE RING!</b> A knockout tournament: win the semi-final, then win the final to be crowned King!`,
    rumble: `<b>THE ROYAL RUMBLE!</b> Superstars enter one by one. Throw them over the top rope and tap them to eliminate. Last one standing wins a World title shot!`
  };
  function tipOnce(key) {
    const st = getState();
    if (!st.tourDone) return;          // don't overlap the main tour
    st.tipsSeen = st.tipsSeen || {};
    if (st.tipsSeen[key]) return;
    st.tipsSeen[key] = true; saveState(st);
    setTimeout(() => {
      if (document.querySelector('.ewf-tut-bubble')) return;
      showBubble({ text: TIPS[key], nextLabel: 'GOT IT ➔', tipMode: true });
    }, 700);
  }
  function wrap(name, key, cond) {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function (...args) {
      const r = orig.apply(this, args);
      try { if (!cond || cond(args)) tipOnce(typeof key === 'function' ? key(args) : key); } catch (e) {}
      return r;
    };
  }
  wrap('openStorylineModal', 'storyline', args => !args[0]);
  wrap('togglePromoMode', 'promo', () => typeof isPromoMode !== 'undefined' ? isPromoMode : true);
  wrap('generateShowCard', args => args[0], args => ['mitb', 'kotr', 'rumble'].includes(args[0]) && !!window.activeShowSession);

  /* ---------- 6. Section walkthroughs (Batch 9 items 1-3) ---------- */
  const $ = sel => document.querySelector(sel);
  const byOnclick = frag => [...document.querySelectorAll('button,[onclick]')].find(b => (b.getAttribute('onclick') || '').includes(frag) && b.offsetParent !== null);
  const byText = (re, root) => [...(root || document).querySelectorAll('button')].find(b => re.test(b.innerText || '') && b.offsetParent !== null);

  function walkthroughOnce(key, steps, delay = 650) {
    const st = getState();
    if (!st.tourDone) return;
    st.walkSeen = st.walkSeen || {};
    if (st.walkSeen[key]) return;
    st.walkSeen[key] = true; saveState(st);
    setTimeout(() => {
      const list = steps.filter(sp => !sp.when || sp.when());
      const run = i => {
        if (i >= list.length) return;
        const sp = list[i];
        let target = null; try { target = sp.target ? sp.target() : null; } catch (e) {}
        if (sp.target && !target && !sp.always) return run(i + 1);
        showBubble({ text: sp.text, target, stepText: `${i + 1} / ${list.length}`, nextLabel: i === list.length - 1 ? 'GOT IT ➔' : 'NEXT ➔', onNext: () => run(i + 1) });
      };
      if (document.querySelector('.ewf-tut-bubble')) { st.walkSeen[key] = false; saveState(st); return; }
      run(0);
    }, delay);
  }

  const WALK = {
    bookMenu: [
      { target: () => $('#bookShowGrid'), text: `Welcome to <b>BOOK A SHOW</b>, GM! Pick a brand: TV specials like Raw and SmackDown have 2 matches, big events like SummerSlam and WrestleMania have up to 4.` },
      { target: () => $('#bookShowGrid .is-locked'), text: `See the 🔒 ❓ tiles? Those shows unlock as you level up. What's behind them? You'll have to find out!` }
    ],
    bookCard: [
      { target: () => $('#bookShowBoutsContainer'), text: `This is tonight's <b>CARD</b>. The matches go from the opener at the top to the <b>MAIN EVENT</b> at the bottom. Play them in order!` },
      { target: () => byText(/START BOUT/, $('#bookShowBoutsContainer')), text: `Tap <b>START BOUT</b> to play the next match: entrances, the bell, then act it out with your figures.` },
      { target: () => byText(/SIM MATCH/, $('#bookShowBoutsContainer')), text: `In a hurry? <b>SIM MATCH</b> skips a match and still gives you a winner. Pick it yourself or let fate decide! (The main event always needs to be played.)` },
      { target: () => byText(/REROLL/, $('#bookShowBoutsContainer')), text: `Don't like a match? <b>REROLL</b> it for a different one. Title matches stay title matches!` },
      { target: () => $('#bookShowLiveRating'), text: `Every match gets a <b>STAR RATING</b>. The better your matches, the better your show grade, and the more XP you earn!` },
      { target: () => byOnclick('abandonActiveShow'), text: `Need to stop? <b>ABANDON</b> ends the show, but unfinished matches won't count. Finish the show to get your grade!` }
    ],
    highlights: [
      { target: () => $('#ehSignOffBtn'), always: true, text: `That's the show! Here are the highlights. Tap <b>SIGN OFF THE AIR</b> to reveal your show grade and collect your XP!` }
    ],
    gmOffice: [
      { target: () => $('#gmOfficeRankTitle') && $('#gmOfficeRankTitle').parentElement, text: `Welcome to your <b>GM OFFICE</b>! This is your rank. Every match and show fills your <b>XP bar</b>.` },
      { target: () => $('#gmNextUnlockText'), text: `Here's your <b>NEXT UNLOCK</b>. Tap it to see the full roadmap of rewards: new matches, huge events and surprise superstars!` },
      { target: () => byOnclick("playCommentatorIntro('bret')"), text: `Watch me and Corbin's <b>INTROS</b> any time. Great for setting up the commentary desk!` },
      { target: () => $('#gmAchievementsGrid'), text: `Your <b>ACHIEVEMENTS</b>. Do big things in the EWF and they light up, each one worth bonus XP!` },
      { target: () => byOnclick('exportGMSaveData'), text: `<b>SAVE FILE</b> makes a backup of your whole universe, and <b>RESTORE</b> brings it back. Ask a grown-up to keep your backup safe!` },
      { target: () => byOnclick('ewfReplayTutorial'), text: `And if you ever want me to show you around again, tap <b>REPLAY TUTORIAL</b>!` }
    ],
    history: [
      { target: () => $('#histTabAll'), text: `This is <b>HISTORY</b>. ALL shows everything that's happened in the EWF, newest first.` },
      { target: () => $('#histTabTitles'), text: `<b>TITLES</b> lists every title change and defence. Who's held the gold?` },
      { target: () => $('#histTabClassics'), text: `<b>CLASSICS</b> is your hall of 5-star matches. Can you fill it up?` },
      { target: () => $('#histTabVictories'), text: `<b>VICTORIES</b> is the leaderboard: total wins, or switch to see who's on the hottest winning run!` },
      { target: () => $('#histTabRecords'), text: `The <b>RECORD BOOK</b> tracks the biggest milestones in EWF history.` },
      { target: () => $('#histTabTrophies'), text: `And the <b>TROPHY CABINET</b>: special trophies to unlock. Tap one to see how to win it!` }
    ],
    universe: [
      { target: () => $('#tabBtnSuperstars'), text: `Welcome to the <b>EWF UNIVERSE</b>, where you're the boss! <b>SUPERSTARS</b> is where your figures come alive. Tap anyone to see if they're a good guy or a bad guy, their form, their <b>mood</b> and why, and who their <b>MATES</b>, <b>BAD BLOOD</b>, <b>JEALOUS</b> and <b>RESPECT</b> are. You can even make them mates, start bad blood, squash it, or turn them good or bad!` },
      { target: () => $('#tabBtnTitles'), text: `<b>TITLES</b> lets you choose who holds each championship.` },
      { target: () => $('#tabBtnAlliances'), text: `<b>ALLIANCES</b>: team two superstars up as a tag team with their own name and colour.` },
      { target: () => $('#tabBtnFeuds'), text: `<b>FEUDS</b>: start a rivalry! The hotter it gets, the closer they get to a Blood Feud.` },
      { target: () => $('#tabBtnInjuries'), text: `<b>INJURIES</b> is the Medical Ward: see who's hurt and how many matches until they're back.` }
    ]
  };

  // replace the old single tips for these sections with walkthroughs
  delete TIPS.bookShow; delete TIPS.gmOffice; delete TIPS.universe; delete TIPS.history;
  function wrapWalk(name, key) {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function (...args) {
      const r = orig.apply(this, args);
      try { walkthroughOnce(key, WALK[key]); } catch (e) {}
      return r;
    };
  }
  wrapWalk('openBookShowModal', 'bookMenu');
  wrapWalk('renderBookShowCardModal', 'bookCard');
  wrapWalk('openGMOffice', 'gmOffice');
  wrapWalk('openHistoryModal', 'history');
  wrapWalk('openUniverseModal', 'universe');
  (function () {
    const orig = window.openEventHighlightsModal || (typeof openEventHighlightsModal === 'function' ? openEventHighlightsModal : null);
    if (!orig) return;
    window.openEventHighlightsModal = function (...a) { const r = orig.apply(this, a); try { walkthroughOnce('highlights', WALK.highlights, 1200); } catch (e) {} return r; };
    try { openEventHighlightsModal = window.openEventHighlightsModal; } catch (e) {}
  })();

  /* ---------- 7. Surprise cutscenes: Bret cuts in the first time (Batch 9 item 4) ---------- */
  const CUT = {
    autoStory: `BREAKING NEWS, GM! A <b>STORYLINE</b> just kicked off between these two. Read what happened, then decide: <b>fight right now</b> or <b>save it for the next show</b>!`,
    feudAlert: `Uh oh, this rivalry has boiled over into a <b>BLOOD FEUD</b>! You can settle it now in a brutal blowoff match, or keep it simmering. Your call, GM!`,
    feudShowdown: `It's a <b>BLOOD FEUD SHOWDOWN</b>! Fight it out in the blowoff match, book it for the next show, or settle the rivalry and archive the score.`,
    career: `This is serious, GM: <b>LOSER LEAVES THE EWF</b>! These two have fought too many times. If they sign, whoever loses is GONE. Fight now, save it for the next show, or let one back down.`,
    mediaScrum: `<b>PRESS CONFERENCE!</b> This tag team keeps losing and the media want answers. Do they stick together, or does someone drop a pipebomb and throw their partner under the bus?`,
    boardroom: `<b>BOARDROOM DECREE!</b> A champion can't defend their title. As GM, you decide: give them time to recover, or strip the title and make it vacant!`,
    limo: `A <b>SECRET MEETING</b>! Two red-hot superstars could join forces as an alliance. Enter the limo to make the deal, or dismiss it.`,
    staredown: `<b>ROAD TO WRESTLEMANIA!</b> The Royal Rumble winner is coming for the World champion. Fast-track the match for tonight, or build the tension?`,
    commentary: `I've got news, GM! This superstar has had a rough run, so Corbin and I have got them a <b>#1 CONTENDER</b> title shot. Book it now, add it to the next card, or save it for later!`,
    hospital: `Look who's broken out of the <b>HOSPITAL</b>! They're hunting their rival and want back in. Let them back and they're cleared to wrestle!`,
    mitbStalk: `The <b>MONEY IN THE BANK</b> holder is lurking around the champion! Rattle the champ to knock their confidence, or call your shot for a title match?`
  };
  function cutOnce(key) {
    const st = getState();
    if (!st.tourDone) return;
    st.cutSeen = st.cutSeen || {};
    if (st.cutSeen[key]) return;
    st.cutSeen[key] = true; saveState(st);
    setTimeout(() => {
      if (document.querySelector('.ewf-tut-bubble')) return;
      showBubble({ text: CUT[key], nextLabel: 'GOT IT ➔', tipMode: true });
    }, 1400);
  }
  function wrapCut(name, key, cond) {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function (...args) {
      const r = orig.apply(this, args);
      try { if (!cond || cond(args)) cutOnce(key); } catch (e) {}
      return r;
    };
  }
  wrapCut('openStorylineModal', 'autoStory', a => !!a[0]);
  wrapCut('checkBloodFeudActivation', 'feudAlert');
  wrapCut('openBloodFeudShowdown', 'feudShowdown');
  wrapCut('openCareerContractModal', 'career');
  wrapCut('openMediaScrumModal', 'mediaScrum');
  wrapCut('openBoardroomDecreeModal', 'boardroom');
  wrapCut('openLimoSummitModal', 'limo');
  wrapCut('showUniverseBulletin', 'limo', a => a[0] && /LIMOUSINE/i.test(a[0].confirmBtn || ''));
  wrapCut('openManiaStaredownModal', 'staredown');
  wrapCut('openCommentaryRedemptionModal', 'commentary');
  wrapCut('openHospitalEscapeModal', 'hospital');
  wrapCut('openMitbStalkingModal', 'mitbStalk');

  /* ---------- 8. Batch 10: Bret cuts in the first time each new thing happens ---------- */
  window.ewfBretCut = function (key, html, delay) {
    const st = getState();
    if (!st.tourDone) return;
    st.cutSeen = st.cutSeen || {};
    if (st.cutSeen[key]) return;
    st.cutSeen[key] = true; saveState(st);
    setTimeout(() => {
      if (document.querySelector('.ewf-tut-bubble')) return;
      showBubble({ text: html, nextLabel: 'GOT IT ➔', tipMode: true });
    }, delay === undefined ? 1400 : delay);
  };

  /* ---------- 5. Replay ---------- */
  window.ewfReplayTutorial = function () {
    saveState({ broadcastIntroDone: false });
    if (typeof closeGMOffice === 'function') closeGMOffice();
    setTimeout(() => openChristmasWelcome(bretCodeMessage), 300);
  };
})();
