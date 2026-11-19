/* ==========================================================================
   ELLIS'S MAIN EVENT (EWF UNIVERSE) - MODULE 9: js/9-commissioner.js
   BATCH 13
   - Stephanie McMahon, EWF Commissioner (Level 12): unlock moment, GM Office,
     "Stephanie's Orders", guest referee, helping Triple H, power couple
   - Christmas presents unlocked by code card (CASHIN / NEENAW)
   - Titantron TEXT SIZE setting
   ========================================================================== */

(function () {
  const STATE_KEY = 'ewf_commissioner';
  const STEPH = {
    id: 'stephanie', name: 'Stephanie McMahon', image: 'stephanie.png', poseImage: 'stephanie_pose.png',
    youtubeUrl: 'https://www.youtube.com/watch?v=K6ycDLE16Bc', isDefault: true, isCommissioner: true
  };
  window.EWF_STEPHANIE = STEPH;
  const HHH = 'default-tripleh';

  const level = () => (typeof getGMLevel === 'function' ? getGMLevel() : 1);
  const unlocked = () => level() >= ((window.EWF_UNLOCK_LEVELS || {}).stephanie || 13);
  const P = () => window.EWFP || {};
  const roster = () => (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : []).filter(Boolean);
  const injured = (id) => typeof getInjuryRecord === 'function' && !!getInjuryRecord(id);
  const fit = () => roster().filter(w => !injured(w.id));
  const byId = (id) => roster().find(w => w.id === id) || null;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const NM = (w) => (w && w.name ? w.name.toUpperCase() : 'A SUPERSTAR');
  const bret = (k, html, d) => { try { if (typeof window.ewfBretCut === 'function') window.ewfBretCut(k, html, d); } catch (e) {} };
  const log = (t, type) => { try { if (typeof saveHistoryLog === 'function') saveHistoryLog(t, type || 'match'); } catch (e) {} };
  const host = () => { const fs = document.fullscreenElement || document.webkitFullscreenElement; return (fs && getComputedStyle(fs).display !== 'none') ? fs : document.body; };

  function load() { try { return Object.assign({ showsSince: 0, quickSince: 0, helped: 0 }, JSON.parse(localStorage.getItem(STATE_KEY) || '{}')); } catch (e) { return { showsSince: 0, quickSince: 0, helped: 0 }; } }
  function save(st) { try { localStorage.setItem(STATE_KEY, JSON.stringify(st)); } catch (e) {} }

  /* ======================================================================
     1. CHRISTMAS PRESENTS BY CODE CARD
     ====================================================================== */
  window.ewfRevealGift = function (gift) {
    try { if (typeof stopBGMForAction === 'function') stopBGMForAction(); } catch (e) {}
    const done = () => {
      const tier = { level: 0, unlockType: gift.unlockType, unlockKey: gift.unlockKey, unlockName: gift.name, unlockImg: gift.img, giftFrom: window.EWF_GIFT_FROM || 'Grandma & Grandad' };
      window.activeShowcaseTier = tier;
      if (typeof showUnlockShowcase === 'function') {
        showUnlockShowcase(tier, null, () => {
          if (typeof renderGrid === 'function') renderGrid();
          bret('gift_' + gift.id, gift.id === 'gift-mitb'
            ? `<b>MONEY IN THE BANK</b> is open, GM! Set up the ladder and hang the briefcase. Whoever grabs it can <b>cash in</b> for a title shot ANY time they like!`
            : `The <b>SLAMBULANCE</b> has arrived! In a Slambulance match you win by getting your opponent <b>into the back</b> and shutting the doors. Nee-naw!`, 700);
        });
      }
      try { if (typeof playOhMyGodSting === 'function') playOhMyGodSting(); } catch (e) {}
    };
    if (P()._blackout) {
      P()._blackout(() => {
        try {
          if (gift.id === 'gift-slambulance' && typeof playSlambulanceAudio === 'function') playSlambulanceAudio();
          else if (typeof window.playMitbSirenAudio === 'function') { window.playMitbSirenAudio(); setTimeout(() => { try { window.stopMitbSirenAudio(); } catch (e) {} }, 3000); }
        } catch (e) {}
        done();
      }, gift.id === 'gift-slambulance' ? '#ff1744' : '#ffd700');
    } else done();
    log(`🎁 PRESENT UNLOCKED: ${gift.name.toUpperCase()} (a present from ${window.EWF_GIFT_FROM || 'Grandma & Grandad'})!`, 'match');
  };

  /* ======================================================================
     2. STEPHANIE McMAHON, EWF COMMISSIONER
     ====================================================================== */

  // --- her big arrival, straight after the Level 12 unlock screen
  const origCloseShowcase = window.closeUnlockShowcase;
  if (typeof origCloseShowcase === 'function') {
    window.closeUnlockShowcase = function (...a) {
      const tier = window.activeShowcaseTier;
      const r = origCloseShowcase.apply(this, a);
      if (tier && tier.unlockType === 'commissioner') setTimeout(stephanieArrives, 400);
      return r;
    };
    try { closeUnlockShowcase = window.closeUnlockShowcase; } catch (e) {}
  }
  function stephanieArrives() {
    const go = () => {
      try {
        currentPlayingWrestler = STEPH;
        if (typeof loadAndPlayYouTube === 'function') loadAndPlayYouTube(STEPH.youtubeUrl, false, true, false, false);
      } catch (e) {}
      const banner = document.getElementById('superstarDebutBanner');
      setTimeout(() => {
        if (!banner) return;
        banner.innerHTML = `<span style="flex:1;">👑 STEPHANIE McMAHON IS THE NEW EWF COMMISSIONER! 👑</span>`;
        banner.style.background = 'linear-gradient(180deg, #8e24aa 0%, #1a0026 100%)';
        banner.style.boxShadow = '0 0 50px #e040fb, 0 0 20px #ffd700';
        banner.style.color = '#fff';
        banner.style.display = 'flex'; banner.style.alignItems = 'center'; banner.style.justifyContent = 'center';
        banner.style.zIndex = '2147483645';
        if (banner.parentElement !== host()) host().appendChild(banner);
        try { if (typeof playOhMyGodSting === 'function') playOhMyGodSting(); } catch (e) {}
        setTimeout(() => { banner.style.display = 'none'; }, 7000);
      }, 4000);
      log(`👑 NEW COMMISSIONER: STEPHANIE McMAHON has taken charge of the EWF!`, 'match');
      setTimeout(() => bret('stephArrives', `Uh oh, GM... <b>the boss's daughter is here!</b> Stephanie is the new <b>COMMISSIONER</b>. She'll turn up with orders now and then, and she'll ALWAYS look after <b>Triple H</b>. Put her figure on the stage when she comes out!`, 0), 12000);
    };
    if (P()._blackout) P()._blackout(go, '#e040fb'); else go();
  }

  // --- GM Office: the Commissioner sits with the commentary team
  const origOffice = window.openGMOffice;
  if (typeof origOffice === 'function') {
    window.openGMOffice = function (...a) {
      const r = origOffice.apply(this, a);
      try {
        const row = document.querySelector('#gmOfficeModal .commentators-icons-row');
        let chip = document.getElementById('ewfStephChip');
        if (row && unlocked() && !chip) {
          chip = document.createElement('div');
          chip.id = 'ewfStephChip'; chip.className = 'commentator-chip'; chip.title = 'Stephanie McMahon, Commissioner';
          chip.innerHTML = `<div style="position:relative;"><img src="stephanie.png" class="commentator-avatar" alt="Stephanie McMahon" style="border-color:#e040fb;" onerror="this.src='logo_notext.png'"><span class="commentator-mic-icon">👑</span></div><span class="commentator-name" style="color:#e040fb;">COMMISSIONER</span>`;
          chip.onclick = (e) => { e.stopPropagation(); try { currentPlayingWrestler = STEPH; loadAndPlayYouTube(STEPH.youtubeUrl, false, true, false, false); } catch (er) {} };
          row.appendChild(chip);
        } else if (chip && !unlocked()) chip.remove();
      } catch (e) {}
      return r;
    };
    try { openGMOffice = window.openGMOffice; } catch (e) {}
  }

  // --- she can be the Special Guest Referee
  const origRefPicker = window.openSuperstarPickerForRef;
  if (typeof origRefPicker === 'function') {
    window.openSuperstarPickerForRef = function (...a) {
      const r = origRefPicker.apply(this, a);
      try {
        const list = document.getElementById('slotPickerList');
        if (list && unlocked()) {
          const card = document.createElement('div');
          card.className = 'vs-wrestler'; card.style.animationDelay = '0s';
          card.innerHTML = `<img src="${STEPH.image}" alt="${STEPH.name}" style="border-color:#e040fb;" onerror="this.src='logo_notext.png'"><div>👑 ${STEPH.name}</div>`;
          card.onclick = () => {
            pickedReferee = STEPH;
            if (typeof window.closeSlotPickerModal === 'function') window.closeSlotPickerModal();
            if (typeof renderHandpickSlotsUI === 'function') renderHandpickSlotsUI();
          };
          list.insertBefore(card, list.firstChild);
        }
      } catch (e) {}
      return r;
    };
  }
  // ...and Book a Show sometimes makes her the guest referee
  const origPost = window.ewfPostProcessShowCard;
  window.ewfPostProcessShowCard = function (showKey, bouts, activeW) {
    bouts = origPost ? origPost(showKey, bouts, activeW) : bouts;
    try {
      if (unlocked()) (bouts || []).forEach(b => { if (b && b.matchType === 'Special Guest Referee' && Math.random() < 0.35) b.referee = STEPH; });
    } catch (e) {}
    return bouts;
  };

  // --- power couple in the SUPERSTARS tab
  window.ewfProfileExtra = function (w) {
    if (!w || w.id !== HHH || !unlocked()) return '';
    return `<div class="ewfp-rel"><span><b style="color:#e040fb">💍 POWER COUPLE</b> Stephanie McMahon</span><span style="color:#aaa; font-size:0.75rem; text-align:right;">the Commissioner always looks after him</span></div>`;
  };

  // --- she runs in to help Triple H during his matches
  let helpAt = null, helpDone = false;
  window.ewfCommissionerTick = function (sec) {
    try {
      if (sec <= 1) {
        helpDone = false; helpAt = null;
        const parts = (typeof activeBookedMatch !== 'undefined' && activeBookedMatch.participants) || [];
        if (unlocked() && parts.some(p => p && p.id === HHH) && Math.random() < 0.18) helpAt = 75 + Math.floor(Math.random() * 150);
      }
      if (helpAt !== null && !helpDone && sec >= helpAt) {
        helpDone = true;
        if (typeof executeLightsOutAmbush === 'function') {
          executeLightsOutAmbush(STEPH, false, '👑 STEPHANIE IS HELPING HER MAN! 👑');
          log(`👑 STEPHANIE'S HELPING HAND: The Commissioner got involved to help TRIPLE H!`, 'interference');
          bret('stephHelps', `Stephanie's out here to help <b>TRIPLE H</b>! She'll do anything for her man. Put her figure at ringside, GM!`, 1500);
          return true;
        }
      }
    } catch (e) {}
    return false;
  };

  // --- STEPHANIE'S ORDERS
  // Book a Show: after 3 completed shows, a 1 in 5 chance between matches. Quick matches: once every 10 matches.
  const origArchive = window.finishAndArchiveShowToHistory;
  if (typeof origArchive === 'function') {
    window.finishAndArchiveShowToHistory = function (...a) {
      if (unlocked()) { const st = load(); st.showsSince = (st.showsSince || 0) + 1; save(st); }
      return origArchive.apply(this, a);
    };
  }
  window.ewfCommissionerHook = function (ctx, go) {
    if (!unlocked() || !P()._scene) return false;
    const st = load();
    let due = false;
    if (ctx.inShow) {
      if (ctx.ongoing && (st.showsSince || 0) >= 3 && Math.random() < 0.2) due = true;
    } else {
      st.quickSince = (st.quickSince || 0) + 1;
      if (st.quickSince >= 10) due = true;
      save(st);
    }
    if (!due) return false;
    st.showsSince = 0; st.quickSince = 0; save(st);
    return go(() => stephanieOrders(ctx));
  };
  window.ewfStephanieOrders = (ctx) => stephanieOrders(ctx || { inShow: !!window.activeShowSession, ongoing: true, done: () => {} });

  function rivalOfHHH() {
    try {
      const st = P().load ? P().load() : { rel: {} };
      const rel = (P().relsOf ? P().relsOf(HHH, st) : []).find(r => r.t === 'badblood' && byId(r.other) && !injured(r.other));
      if (rel) return byId(rel.other);
      const riv = (typeof getRivalries === 'function' ? getRivalries() : []).find(r => r && (r.w1 === HHH || r.w2 === HHH));
      if (riv) { const o = byId(riv.w1 === HHH ? riv.w2 : riv.w1); if (o && !injured(o.id)) return o; }
    } catch (e) {}
    return null;
  }
  function titleHolders() { return typeof getTitleHolders === 'function' ? (getTitleHolders() || {}) : {}; }

  function stephanieOrders(ctx) {
    const done = ctx.done || (() => {});
    const inShow = !!window.activeShowSession;
    const ws = fit();
    const hhh = ws.find(w => w.id === HHH) || null;
    const rival = hhh ? rivalOfHHH() : null;
    const isBad = (id) => P().isBad ? P().isBad(id) : false;
    const orders = [];
    // title shot (Triple H first in line)
    const h = titleHolders();
    for (const code of ['whc', 'ic', 'hardcore']) {
      const champ = h[code] ? ws.find(w => w.id === h[code]) : null;
      if (!champ) continue;
      const challenger = (hhh && champ.id !== HHH && Math.random() < 0.65) ? hhh : pick(ws.filter(w => w.id !== champ.id));
      if (challenger) { orders.push({ type: 'title', code, champ, challenger, w: challenger.id === HHH ? 4 : 2 }); break; }
    }
    // handicap match (shows only): Triple H's rival, otherwise a bad guy
    if (inShow && ws.length >= 3) {
      const target = rival || pick(ws.filter(w => isBad(w.id) && w.id !== HHH)) || null;
      if (target) {
        const others = ws.filter(w => w.id !== target.id && w.id !== HHH).sort(() => Math.random() - 0.5);
        const pair = hhh && target.id === (rival && rival.id) ? [hhh, others[0]] : others.slice(0, 2);
        if (pair[0] && pair[1]) orders.push({ type: 'handicap', target, pair, w: rival ? 4 : 2 });
      }
    }
    // forced team-up of two superstars with bad blood
    if (ws.length >= 4) {
      let a = null, b = null;
      try {
        const st = P().load(); const k = Object.keys(st.rel).filter(k => st.rel[k].t === 'badblood').map(k => k.split('|').map(byId)).filter(p => p[0] && p[1] && !injured(p[0].id) && !injured(p[1].id));
        if (k.length) [a, b] = pick(k);
      } catch (e) {}
      if (!a) { const s = ws.slice().sort(() => Math.random() - 0.5); a = s[0]; b = s[1]; }
      const opp = ws.filter(w => w.id !== a.id && w.id !== b.id).sort(() => Math.random() - 0.5).slice(0, 2);
      if (opp.length === 2) orders.push({ type: 'teamup', a, b, opp, w: 2 });
    }
    // the slap (never Triple H)
    const slapPool = ws.filter(w => w.id !== HHH);
    if (slapPool.length) {
      const victim = (rival && Math.random() < 0.6) ? rival : pick(slapPool);
      orders.push({ type: 'slap', victim, w: rival && victim.id === rival.id ? 3 : 2 });
    }
    if (!orders.length) return done();
    const tot = orders.reduce((s, o) => s + o.w, 0);
    let r = Math.random() * tot, o = orders[0];
    for (const x of orders) { r -= x.w; if (r <= 0) { o = x; break; } }

    const p = P();
    const scene = (text, buttons, extra) => p._scene(Object.assign({
      bg: 'gm_office_bg.png', title: "👑 STEPHANIE'S ORDERS! 👑", titleBg: 'linear-gradient(180deg,#8e24aa,#1a0026)', center: STEPH, text, buttons
    }, extra || {}));
    const cont = (fn) => [{ label: '😬 YES, MA\'AM! ➔', cls: 'gold', fn: () => { p._closeScene2(); fn(); } }];
    try { if (p._sfx) { const a = p._sfx('crowd_boo.mp3', 0.45); setTimeout(() => { try { a && a.pause(); } catch (e) {} }, 2500); } } catch (e) {}
    bret('stephOrders', `When <b>STEPHANIE</b> gives an order, even the GM has to listen! Put her figure on the stage, GM.`, 1300);

    if (o.type === 'title') {
      const tn = { whc: 'World Heavyweight Championship', ic: 'Intercontinental Championship', hardcore: 'Hardcore Championship' }[o.code];
      const fav = o.challenger.id === HHH;
      scene(`<b>Stephanie McMahon</b> walks out to the stage: <i>"As your Commissioner, I've decided that <b>${o.champ.name}</b> will defend the <b>${tn}</b> against <b>${o.challenger.name}</b>!${fav ? ' And I think we ALL know who deserves it most..."' : '"'}</i>`,
        p._whenButtons(when => {
          p._closeScene2();
          log(`👑 STEPHANIE'S ORDERS: ${NM(o.champ)} must defend the ${tn} against ${NM(o.challenger)}!`, 'match');
          p._bookMatch(o.challenger, o.champ, { titleCode: o.code, stake: "👑 STEPHANIE'S ORDERS" }, when === 'no' ? 'next' : when, done);
        }, { ongoing: ctx.ongoing }), { left: o.champ, right: o.challenger, center: null, leftStyle: 'left: 1%; height: 76%;', rightStyle: 'right: 1%; height: 76%;', objects: [{ src: 'stephanie_pose.png', style: 'left: 50%; bottom: 0; height: 80%; transform: translateX(-50%); z-index: 3;', cls: 'pop' }] });
    } else if (o.type === 'handicap') {
      scene(`<i>"<b>${o.target.name}</b>, you've been a real pain in my backside. So tonight, it's a <b>HANDICAP MATCH</b>: you against <b>${o.pair[0].name} AND ${o.pair[1].name}</b>!"</i>${o.pair[0].id === HHH ? '<br>She gives Triple H a wink...' : ''}`,
        cont(() => {
          log(`👑 STEPHANIE'S ORDERS: ${NM(o.target)} faces ${NM(o.pair[0])} & ${NM(o.pair[1])} in a handicap match!`, 'match');
          if (typeof window.queueCutsceneBoutIntoShow === 'function' && window.activeShowSession) {
            window.queueCutsceneBoutIntoShow({ participants: [o.target, o.pair[0], o.pair[1]], formatKey: 'triple', matchType: 'No Disqualification', storyBypass: true, feudStake: "👑 STEPHANIE'S ORDERS: 1 VS 2 HANDICAP MATCH" });
          } else done();
        }));
    } else if (o.type === 'teamup') {
      scene(`<i>"I'm sick of <b>${o.a.name}</b> and <b>${o.b.name}</b> fighting. So tonight you're <b>TAG TEAM PARTNERS</b>, against <b>${o.opp[0].name} & ${o.opp[1].name}</b>. And if you can't get along... you're both fired!"</i>`,
        cont(() => {
          log(`👑 STEPHANIE'S ORDERS: Bitter rivals ${NM(o.a)} & ${NM(o.b)} were forced to team up!`, 'match');
          if (window.activeShowSession && typeof window.queueCutsceneBoutIntoShow === 'function') {
            window.queueCutsceneBoutIntoShow({ participants: [o.a, o.b, o.opp[0], o.opp[1]], formatKey: 'tag', matchType: 'Normal Match', storyBypass: true, feudStake: "👑 STEPHANIE'S ORDERS: ENEMIES TEAM UP" });
          } else {
            try {
              activeStoryline = { id: 0, type: 'feud', matchMatch: 'Normal Match', formatKey: 'tag', logText: '' };
              activeStoryWrestlerA = o.a; activeStoryWrestlerB = o.b;
              if (typeof launchStorylineMatch === 'function') launchStorylineMatch();
              activeBookedMatch.participants = [o.a, o.b, o.opp[0], o.opp[1]];
              quickMatchQueue = [...activeBookedMatch.participants];
            } catch (e) { done(); }
          }
        }), { left: o.a, right: o.b, center: null, leftStyle: 'left: 1%; height: 76%;', rightStyle: 'right: 1%; height: 76%;', objects: [{ src: 'stephanie_pose.png', style: 'left: 50%; bottom: 0; height: 80%; transform: translateX(-50%); z-index: 3;', cls: 'pop' }] });
    } else if (o.type === 'slap') {
      const el = scene(`<b>${o.victim.name}</b> has a go at Stephanie on the mic: <i>"You only got the job because of your dad!"</i>`, [], { left: STEPH, right: o.victim, center: null });
      setTimeout(() => {
        if (!el || !document.body.contains(el) && !(host() && host().contains(el))) return;
        try { p._flash(el); p._shake(el); p._sfx('ambush_hit.mp3', 0.9); } catch (e) {}
        const v = el.querySelector('.ewfp-pose.right'); if (v) v.classList.add('hurt');
        try {
          const st = p.load();
          st.furious[o.victim.id] = { vs: null, why: 'Slapped by Stephanie McMahon', until: (st.matchNo || 0) + 4 };
          p.save(st);
        } catch (e) {}
        log(`👋 SLAPPED: STEPHANIE McMAHON slapped ${NM(o.victim)} across the face! They're FURIOUS!`, 'interference');
        p._update(`<b>SLAP!!!</b> Stephanie slaps <b>${o.victim.name}</b> right across the face! The crowd can't believe it. <b>${o.victim.name}</b> is 🌋 <b>FURIOUS</b>!`, cont(done));
      }, 2200);
    }
  }

  /* ======================================================================
     3. TITANTRON TEXT SIZE (kept on this tablet only, survives Reset Universe)
     ====================================================================== */
  const TS_KEY = 'ewf_text_size';
  function applyTextSize(v) {
    document.documentElement.classList.remove('ts-large', 'ts-xl');
    if (v === 'large') document.documentElement.classList.add('ts-large');
    if (v === 'xl') document.documentElement.classList.add('ts-xl');
  }
  function ensureTsStyles() {
    if (document.getElementById('ewfTextSizeStyles')) return;
    const css = document.createElement('style');
    css.id = 'ewfTextSizeStyles';
    // Only the small text grows. Big titles and banners already use their own sizes.
    css.textContent = `
      html.ts-large { font-size: 112.5%; }
      html.ts-xl { font-size: 125%; }
      html.ts-large .ewf-tut-text, html.ts-large .ewfp-text { font-size: 1.12rem; }
      html.ts-xl .ewf-tut-text, html.ts-xl .ewfp-text { font-size: 1.2rem; }
      html.ts-large .rival-badge, html.ts-large .mandatory-badge, html.ts-large .defense-counter-pill { font-size: 0.7rem; }
      html.ts-xl .rival-badge, html.ts-xl .mandatory-badge, html.ts-xl .defense-counter-pill { font-size: 0.72rem; }
      html.ts-large .bsb-fighter-name { max-width: 170px; }
      html.ts-xl .bsb-fighter-name { max-width: 190px; }
      .ewf-ts-row { display: flex; gap: 6px; align-items: center; margin-top: 8px; flex-wrap: wrap; }
      .ewf-ts-row span { font-family: 'Russo One', sans-serif; font-size: 0.75rem; color: #ffd700; letter-spacing: 1px; }
      .ewf-ts-row button { font-family: 'Russo One', sans-serif; font-size: 0.75rem; padding: 6px 10px; border: 1px solid #888; background: #111; color: #fff; cursor: pointer; }
      .ewf-ts-row button.on { border-color: #ffd700; color: #000; background: #ffd700; }
    `;
    document.head.appendChild(css);
  }
  ensureTsStyles();
  try { applyTextSize(localStorage.getItem(TS_KEY) || 'normal'); } catch (e) {}
  window.ewfSetTextSize = function (v) { try { localStorage.setItem(TS_KEY, v); } catch (e) {} applyTextSize(v); drawTsRow(); };
  function drawTsRow() {
    const modal = document.getElementById('gmOfficeModal');
    if (!modal) return;
    const devBtn = [...modal.querySelectorAll('button')].find(x => /devCheatLevelUp/.test(x.getAttribute('onclick') || ''));
    if (!devBtn) return;
    let row = document.getElementById('ewfTextSizeRow');
    if (!row) {
      row = document.createElement('div');
      row.id = 'ewfTextSizeRow'; row.className = 'ewf-ts-row';
      devBtn.parentElement.insertAdjacentElement('afterend', row);
    }
    const cur = (() => { try { return localStorage.getItem(TS_KEY) || 'normal'; } catch (e) { return 'normal'; } })();
    row.innerHTML = `<span>🔠 TEXT SIZE (THIS SCREEN):</span>` + [['normal', 'NORMAL'], ['large', 'LARGE'], ['xl', 'EXTRA LARGE']]
      .map(([v, l]) => `<button type="button" class="${cur === v ? 'on' : ''}" onclick="ewfSetTextSize('${v}')">${l}</button>`).join('');
  }
  const office2 = window.openGMOffice;
  if (typeof office2 === 'function') {
    window.openGMOffice = function (...a) { const r = office2.apply(this, a); try { drawTsRow(); } catch (e) {} return r; };
    try { openGMOffice = window.openGMOffice; } catch (e) {}
  }

  // reset + backup lists know about the Commissioner's counters
  try { if (typeof EWF_BACKUP_KEYS !== 'undefined' && !EWF_BACKUP_KEYS.includes(STATE_KEY)) EWF_BACKUP_KEYS.push(STATE_KEY); } catch (e) {}
})();
