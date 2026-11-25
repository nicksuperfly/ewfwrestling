/* ==========================================================================
   BATCH 16 (25 Nov 2026)
   Loaded after js/11-batch15.js. Each section says which BATCHES.md item it covers.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const vis = el => !!el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
  const byIdW = id => {
    const all = (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : []) || [];
    return all.find(w => w && w.id === id) || null;
  };
  const injuredId = id => { try { return typeof getInjuryRecord === 'function' && !!getInjuryRecord(id); } catch (e) { return false; } };
  const popup = msg => { try { alert(msg); } catch (e) {} };
  const bret = (k, html, d) => { try { if (typeof window.ewfBretCut === 'function') window.ewfBretCut(k, html, d); } catch (e) {} };
  const histLog = (txt, type) => { try { if (typeof saveHistoryLog === 'function') saveHistoryLog(txt, type || 'booking'); } catch (e) {} };

  function ensureStyles() {
    if (document.getElementById('ewf16-styles')) return;
    const st = document.createElement('style');
    st.id = 'ewf16-styles';
    st.textContent = `
      .ewf16-booked { margin: 4px 0 14px; padding: 10px 12px; border: 2px solid #ffd700; border-radius: 8px; background: rgba(40,30,0,0.55); text-align: left; }
      .ewf16-booked h3 { margin: 0 0 6px; font-family: 'Russo One', sans-serif; color: #ffd700; font-size: 0.95rem; letter-spacing: 1px; }
      .ewf16-booked .row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-top: 1px solid rgba(255,215,0,0.25); font-size: 0.85rem; color: #fff; }
      .ewf16-booked .row:first-of-type { border-top: 0; }
      .ewf16-booked .row b { font-family: 'Russo One', sans-serif; }
      .ewf16-booked .row .meta { color: #cbd5e1; font-size: 0.75rem; }
      .ewf16-booked .row .grow { flex: 1; }
      .ewf16-booked .row button { background: #5a0000; color: #fff; border: 1px solid #ff5252; border-radius: 5px; font-family: 'Russo One', sans-serif; font-size: 0.72rem; padding: 6px 9px; cursor: pointer; }
      .ewf16-booked .empty { color: #cbd5e1; font-size: 0.8rem; }
      .ewf16-full { opacity: 0.55 !important; pointer-events: none !important; filter: grayscale(0.6); }
      .ewf16-trophy { position: fixed; inset: 0; z-index: 2147483630; background: rgba(0,0,0,0.88); display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; }
      .ewf16-trophy .card { background: radial-gradient(circle at 50% 30%, #3a2c00, #0b0b10 70%); border: 3px solid #ffd700; border-radius: 12px; box-shadow: 0 0 50px rgba(255,215,0,.5);
        padding: 18px 26px; max-width: min(92vw, 560px); max-height: 92vh; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
      .ewf16-trophy .lbl { font-family: 'Russo One', sans-serif; color: #ffd700; letter-spacing: 2px; font-size: 0.9rem; }
      .ewf16-trophy .tr { max-height: min(42vh, 300px); max-width: 80%; object-fit: contain; filter: drop-shadow(0 0 24px rgba(255,215,0,.7)); animation: ewf15pop .5s cubic-bezier(.2,1.6,.4,1); }
      .ewf16-trophy h2 { margin: 0; font-family: 'Russo One', sans-serif; color: #fff; font-size: clamp(1.4rem, 4vw, 2.2rem); text-shadow: 0 0 16px rgba(255,215,0,.7); }
      .ewf16-trophy .who { display: flex; align-items: center; gap: 10px; font-family: 'Russo One', sans-serif; color: #00e676; font-size: 1.1rem; }
      .ewf16-trophy .who img { width: 54px; height: 54px; object-fit: cover; border-radius: 50%; border: 2px solid #ffd700; }
      .ewf16-trophy button { margin-top: 6px; font-family: 'Russo One', sans-serif; font-size: 1rem; padding: 12px 22px; border-radius: 6px; border: 2px solid #fff; background: linear-gradient(180deg,#ffd700,#b8860b); color: #000; cursor: pointer; }
      /* item 2: the new superstar card is landscape on the tablet (pose left, words right) */
      @media (min-aspect-ratio: 1/1) {
        #welcomeInductionModal .welcome-modal-card { max-width: min(94vw, 900px) !important; width: 94% !important; display: grid !important;
          grid-template-columns: minmax(0, 42%) minmax(0, 1fr); grid-template-areas: "img label" "img title" "img name" "img sub" "img btn";
          align-content: center; align-items: center; column-gap: 26px; row-gap: 4px; text-align: left; max-height: 92vh; box-sizing: border-box; padding: 18px 26px !important; }
        #welcomeInductionModal .welcome-modal-card > :first-child { grid-area: label; }
        #welcomeInductionTitle { grid-area: title; margin: 2px 0 6px !important; font-size: clamp(1.3rem, 3.2vw, 2.3rem) !important; line-height: 1.12; }
        #welcomeInductionImg { grid-area: img; max-height: min(78vh, 560px) !important; max-width: 100% !important; margin: 0 !important; justify-self: center; align-self: center; }
        #welcomeInductionName { grid-area: name; margin-bottom: 6px !important; }
        #welcomeInductionSubtext { grid-area: sub; margin-bottom: 14px !important; }
        #welcomeInductionConfirmBtn { grid-area: btn; justify-self: start; }
      }
    `;
    document.head.appendChild(st);
  }

  /* ==========================================================================
     1. BOOKED MATCHES LIST (item 18)
     ========================================================================== */
  const BK_KEY = 'ewf_booked_matches';
  const OLD_KEY = 'ewf_scheduled_story_match';
  const BK_CAP = 6;
  const idOf = w => (w && typeof w === 'object') ? w.id : w;

  function migrateOld(list) {
    try {
      const raw = localStorage.getItem(OLD_KEY);
      if (raw) {
        const m = JSON.parse(raw);
        if (m && (m.w1 || m.participants)) list.push(normalise(m));
        localStorage.removeItem(OLD_KEY);
        save(list);
      }
    } catch (e) {}
    return list;
  }
  function load() {
    let list = [];
    try { list = JSON.parse(localStorage.getItem(BK_KEY) || '[]') || []; } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];
    return migrateOld(list);
  }
  function save(list) { try { localStorage.setItem(BK_KEY, JSON.stringify(list)); } catch (e) {} }
  function normalise(m) {
    const ids = (Array.isArray(m.participants) && m.participants.length ? m.participants : [m.w1, m.w2]).map(idOf).filter(Boolean);
    return Object.assign({}, m, {
      bid: m.bid || ('b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      ids,
      at: m.at || Date.now(),
      w1: undefined, w2: undefined, participants: undefined
    });
  }
  function priority(b) {
    if (b.isCareerMatch) return 4;
    if (/BLOOD FEUD|FINAL SHOWDOWN/i.test(b.feudStake || '') || b.storyType === 'feud_showdown') return 3;
    if (b.isTitleMatch) return 2;
    return 1;
  }
  function namesOf(b) { return (b.ids || []).map(id => { const w = byIdW(id); return w ? w.name : '???'; }); }

  window.ewfGetBookings = load;
  window.ewfBookingsFull = () => load().length >= BK_CAP;
  window.ewfQueueBooking = function (m) {
    const list = load();
    if (list.length >= BK_CAP) {
      popup(`📋 CARD'S FULL!\n\nThere are already ${BK_CAP} matches booked for the next shows. Fight it now, or let it go!`);
      return false;
    }
    list.push(normalise(m));
    save(list);
    if (list.length >= 3) bret('bookedList', `You've got <b>${list.length} matches booked</b>, GM! They'll play over the next shows: the biggest one headlines. See them all in <b>BOOK A SHOW</b>. You can book up to <b>${BK_CAP}</b>.`, 600);
    return true;
  };
  window.ewfCancelBooking = function (bid) {
    const list = load();
    const b = list.find(x => x.bid === bid);
    if (!b) return;
    if (!confirm(`Cancel ${namesOf(b).join(' vs ')}?\n\nThis match won't happen.`)) return;
    save(list.filter(x => x.bid !== bid));
    histLog(`🗑️ BOOKING CANCELLED: ${namesOf(b).join(' vs ').toUpperCase()}`);
    renderBookedPanel();
  };
  // Called by generateShowCard (js/5). Returns bouts (biggest first) and removes them from the list.
  window.ewfTakeBookingsForShow = function (activeW, maxTake) {
    const list = load();
    if (!list.length || maxTake <= 0) return [];
    const order = list.map((b, i) => ({ b, i })).sort((x, y) => (priority(y.b) - priority(x.b)) || (x.i - y.i));
    const used = new Set();
    const usedBids = [];
    const out = [];
    for (const { b } of order) {
      if (out.length >= maxTake) break;
      const ws = (b.ids || []).map(id => activeW.find(w => w.id === id));
      if (ws.length < 2 || ws.some(w => !w)) continue;            // someone's hurt or gone: wait
      if (ws.some(w => used.has(w.id))) continue;                  // already on this card: next show
      ws.forEach(w => used.add(w.id));
      usedBids.push(b.bid);
      let isTitle = !!b.isTitleMatch;
      // BATCH 16 ITEM 20: an ICE COLD challenger can't take a belt someone else holds
      if (isTitle && typeof window.ewfIceColdBlocksTitle === 'function' && window.ewfIceColdBlocksTitle(ws.map(w => w.id), b.titleCode, b)) isTitle = false;
      out.push({
        order: 'MAIN EVENT',
        matchType: b.matchType || 'Normal Match',
        formatKey: b.formatKey || (ws.length === 2 ? '1v1' : b.formatKey),
        participants: ws,
        isTitleMatch: isTitle,
        titleCode: isTitle ? (b.titleCode || 'whc') : null,
        titleName: isTitle ? (b.titleName || 'World Heavyweight Championship') : null,
        titleImg: isTitle ? (b.titleImg || 'whc.png') : null,
        isCareerMatch: !!b.isCareerMatch,
        feudStake: b.feudStake || (b.isCareerMatch ? '📜 LOSER LEAVES THE EWF' : '📋 STORYLINE GRUDGE MATCH'),
        isSanctionedContract: true,
        referee: null,
        status: 'pending',
        rating: 0
      });
    }
    if (usedBids.length) save(load().filter(x => !usedBids.includes(x.bid)));
    return out;
  };

  function renderBookedPanel() {
    ensureStyles();
    const modal = document.getElementById('bookShowModal');
    const grid = document.getElementById('bookShowGrid');
    if (!modal || !grid) return;
    let box = document.getElementById('ewf16BookedPanel');
    const list = load();
    if (!list.length) { if (box) box.remove(); return; }
    if (!box) {
      box = document.createElement('div');
      box.id = 'ewf16BookedPanel';
      box.className = 'ewf16-booked';
      grid.parentElement.insertBefore(box, grid);
    }
    const rows = list.map(b => {
      const names = namesOf(b).join(' vs ');
      const hurt = (b.ids || []).filter(injuredId).map(id => (byIdW(id) || {}).name).filter(Boolean);
      const extra = [b.matchType && b.matchType !== 'Normal Match' ? b.matchType : '', b.isTitleMatch ? '🏆 ' + (b.titleName || 'Title') : '', b.isCareerMatch ? '📜 Loser Leaves' : '']
        .filter(Boolean).join(' • ');
      return `<div class="row"><div class="grow"><b>${names}</b><div class="meta">${extra || 'Normal Match'}${hurt.length ? ` • 🩼 waiting for ${hurt.join(' & ')} to be fit` : ''}</div></div>
        <button type="button" onclick="ewfCancelBooking('${b.bid}')">✖ CANCEL</button></div>`;
    }).join('');
    box.innerHTML = `<h3>📋 BOOKED MATCHES (${list.length}/${BK_CAP})</h3>${rows}`;
  }
  window.ewfRenderBookedPanel = renderBookedPanel;
  function wrapBookShow() {
    const orig = window.openBookShowModal;
    if (typeof orig !== 'function' || orig.__b16) return;
    const w = function (...a) { const r = orig.apply(this, a); try { renderBookedPanel(); } catch (e) {} return r; };
    w.__b16 = true;
    window.openBookShowModal = w;
    try { openBookShowModal = w; } catch (e) {}
  }

  // When the list is full, every "save it for the next show" button says so and can't be pressed.
  const SAVE_RX = /SAVE IT FOR THE NEXT SHOW|^📋 NEXT SHOW/i;
  function relabelSaveButtons() {
    const full = window.ewfBookingsFull();
    document.querySelectorAll('button').forEach(btn => {
      if (!btn.offsetParent && !btn.closest('.ewfp-scene')) return;
      const t = (btn.dataset.ewf16Label || btn.textContent || '').trim();
      if (!btn.dataset.ewf16Label && !SAVE_RX.test(t)) return;
      if (full) {
        if (!btn.dataset.ewf16Label) btn.dataset.ewf16Label = btn.textContent;
        if (!btn.classList.contains('ewf16-full')) {
          btn.textContent = "📋 CARD'S FULL! FIGHT IT NOW OR LET IT GO";
          btn.classList.add('ewf16-full');
          bret('cardFull', `Whoa, GM! You've already booked <b>${BK_CAP} matches</b> for the next shows. Fight this one <b>right now</b>, or let it go. You can see and cancel bookings in <b>BOOK A SHOW</b>.`, 500);
        }
      } else if (btn.dataset.ewf16Label) {
        btn.textContent = btn.dataset.ewf16Label;
        delete btn.dataset.ewf16Label;
        btn.classList.remove('ewf16-full');
      }
    });
  }
  // the save functions refuse when full (the popup tells Ellis why) and the modal stays open
  function guard(name) {
    const orig = window[name];
    if (typeof orig !== 'function' || orig.__b16) return;
    const w = function (...a) {
      if (name === 'resolveCommentaryRedemptionChoice' && a[0] !== 'next_card') return orig.apply(this, a);
      if (window.ewfBookingsFull()) { popup(`📋 CARD'S FULL!\n\nThere are already ${BK_CAP} matches booked for the next shows. Fight it now, or let it go!`); return; }
      return orig.apply(this, a);
    };
    w.__b16 = true;
    window[name] = w;
  }

  /* ==========================================================================
     2. MATCH TYPES (items 14, 15, 16, 17, 25)
     ========================================================================== */
  const ELIM = 'Elimination Match';
  const baseType = t => String(t || '').replace(/^(Triple Threat |Fatal 4-Way )/, '');
  const curMatch = () => (typeof activeBookedMatch !== 'undefined' && activeBookedMatch) ? activeBookedMatch : null;
  const isTitleOnly = t => /^(TLC Match|Ladder Match)$/.test(baseType(t));

  // item 15: old saves keep working ("No Disqualification" is now "Hardcore Match")
  function migrateHardcore() {
    ['ewf_booked_matches', 'ewf_custom_shows', 'ewf_personality', 'ewf_scheduled_story_match', 'ewf_commissioner'].forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        if (raw && raw.indexOf('No Disqualification') >= 0) localStorage.setItem(k, raw.split('No Disqualification').join('Hardcore Match'));
      } catch (e) {}
    });
  }
  // item 15 / 14: use Nicko's new tiles once they're in the folder, otherwise the stand-ins
  function probeLogo(type, file) {
    const img = new Image();
    img.onload = () => { try { matchTypeLogos[type] = file; } catch (e) {} if (window.EWF_GIFT_CODES && type === 'Hardcore Match') window.EWF_GIFT_CODES.XTREME.img = file; };
    img.src = file;
  }

  // item 17: TLC and Ladder are only for a title. Swap them out wherever no belt hangs above the ring.
  function noTitleSwap(t, showKey) {
    const pre = (String(t).match(/^(Triple Threat |Fatal 4-Way )/) || [''])[0];
    const b = baseType(t);
    const opts = b === 'TLC Match' ? ['Tables Match', 'Hardcore Match', 'Falls Count Anywhere'] : ['Steel Cage Match', 'Hardcore Match', 'Falls Count Anywhere'];
    const ok = opts.find(x => !(typeof isMatchTypeLocked === 'function' && isMatchTypeLocked(x).locked)) || 'Normal Match';
    return pre + ok;
  }
  function fixTitleOnly(bout) {
    if (!bout || bout.isTitleMatch || bout.formatKey === 'mitb') return;
    if (isTitleOnly(bout.matchType)) bout.matchType = noTitleSwap(bout.matchType);
  }
  window.ewfFixTitleOnly = fixTitleOnly;

  // item 14: SURVIVOR SERIES loves elimination matches; other shows now and then
  function survivorSeries(showKey, bouts, activeW) {
    const special = ['rumble', 'kotr', 'mitb'];
    const ok = b => b && !b.isSanctionedContract && !special.includes(b.formatKey) && !b.isCareerMatch;
    if (showKey === 'survivor') {
      const main = bouts[bouts.length - 1];
      if (ok(main)) {
        const onCard = new Set();
        bouts.forEach(b => (b.participants || []).forEach(p => p && onCard.add(p.id)));
        let free = activeW.filter(w => !onCard.has(w.id));
        const need = Math.max(0, 4 - (main.participants || []).length);
        while (free.length < need && bouts.length > 1) {
          const dropIdx = bouts.findIndex((b, i) => i < bouts.length - 1 && ok(b));
          if (dropIdx < 0) break;
          const dropped = bouts.splice(dropIdx, 1)[0];
          free = free.concat((dropped.participants || []).filter(Boolean));
        }
        if (free.length >= need && (main.participants || []).length + need >= 4) {
          main.participants = (main.participants || []).filter(Boolean).concat(free.splice(0, need)).slice(0, 4);
          const singlesTitle = main.isTitleMatch && main.titleCode !== 'tag';
          main.formatKey = singlesTitle ? 'fatal' : (Math.random() < 0.5 ? 'tag' : 'fatal');
          if (main.formatKey === 'tag' && main.isTitleMatch && main.titleCode !== 'tag') { main.isTitleMatch = false; main.titleCode = main.titleName = main.titleImg = null; }
          if (main.formatKey === 'fatal' && main.titleCode === 'tag') { main.isTitleMatch = false; main.titleCode = main.titleName = main.titleImg = null; }
          main.matchType = ELIM;
          main.referee = null;
          main.feudStake = main.formatKey === 'tag' ? '🍂 SURVIVOR SERIES: TRADITIONAL ELIMINATION TAG' : '🍂 SURVIVOR SERIES: LAST ONE STANDING';
        }
      }
      // ...and at least one more elimination match on the card
      if (!bouts.slice(0, -1).some(b => b.matchType === ELIM)) {
        const multi = bouts.slice(0, -1).find(b => ok(b) && (b.participants || []).length >= 3 && b.formatKey !== 'handicap');
        if (multi) { multi.matchType = ELIM; if (multi.formatKey === '1v1') multi.formatKey = multi.participants.length >= 4 ? 'fatal' : 'triple'; }
        else {
          const onCard = new Set(); bouts.forEach(b => (b.participants || []).forEach(p => p && onCard.add(p.id)));
          const free = activeW.filter(w => !onCard.has(w.id));
          const one = bouts.slice(0, -1).find(b => ok(b) && b.formatKey === '1v1' && b.titleCode !== 'tag');
          if (one && free.length) { one.participants = one.participants.concat(free.slice(0, 1)); one.formatKey = 'triple'; one.matchType = ELIM; one.referee = null; }
        }
      }
    } else {
      bouts.forEach(b => {
        if (ok(b) && ['triple', 'fatal'].includes(b.formatKey) && !b.isTitleMatch && Math.random() < 0.12) b.matchType = ELIM;
      });
    }
    bouts.forEach(b => { if (b.matchType === ELIM && !['triple', 'fatal', 'tag'].includes(b.formatKey)) b.matchType = 'Normal Match'; });
    return bouts;
  }

  function wrapPostProcess() {
    const orig = window.ewfPostProcessShowCard;
    window.ewfPostProcessShowCard = function (showKey, bouts, activeW) {
      bouts = orig ? orig(showKey, bouts, activeW) : bouts;
      try {
        bouts = survivorSeries(showKey, (bouts || []).filter(Boolean), activeW || []);
        bouts.forEach(fixTitleOnly);
        bouts.forEach(b => { if (b && b.matchType && typeof window.ewfSafeMatchType === 'function') b.matchType = window.ewfSafeMatchType(b.matchType); });
      } catch (e) { console.warn('b16 post', e); }
      return bouts;
    };
  }
  function wrapCutsceneQueue() {
    const orig = window.queueCutsceneBoutIntoShow;
    if (typeof orig !== 'function' || orig.__b16) return;
    const w = function (cfg) { try { if (cfg) fixTitleOnly(cfg); } catch (e) {} return orig.apply(this, arguments); };
    w.__b16 = true;
    window.queueCutsceneBoutIntoShow = w;
  }
  // Choose Your Match: ask for a belt before a TLC/Ladder match starts
  function wrapStartEntrances() {
    const orig = window.startBookedMatchEntrances;
    if (typeof orig !== 'function' || orig.__b16) return;
    const w = function (...a) {
      const m = curMatch();
      if (m && !m.isTitleMatch && m.formatKey !== 'mitb' && isTitleOnly(m.matchType) && !/Cash-In/i.test(m.matchType)) {
        if (window.activeShowSession) { fixTitleOnly(m); }
        else {
          popup(`🪜 ONLY FOR A TITLE!\n\n${baseType(m.matchType)}es need something hanging above the ring. Tap PUT TITLE ON LINE, or pick another match type.`);
          return;
        }
      }
      return orig.apply(this, a);
    };
    w.__b16 = true;
    window.startBookedMatchEntrances = w;
  }

  /* ---------- item 14: ELIMINATION MATCH ---------- */
  const isElim = () => { const m = curMatch(); return !!m && baseType(m.matchType) === ELIM && ['triple', 'fatal', 'tag'].includes(m.formatKey); };
  function elimList() { const m = curMatch(); if (!m) return []; m.__elim = m.__elim || []; return m.__elim; }
  function alive() { const out = elimList(); return (curMatch().participants || []).filter(p => p && !out.includes(p.id)); }
  function teamsOf() {
    const p = (curMatch().participants || []).filter(Boolean);
    return [p.slice(0, 2), p.slice(2, 4)];
  }
  function elimWinnerCheck() {
    const m = curMatch(); if (!m) return;
    const out = elimList();
    const E15 = window.EWF15;
    const names = out.map(id => ((m.participants || []).find(p => p && p.id === id) || {}).name).filter(Boolean);
    if (m.formatKey === 'tag') {
      const [t1, t2] = teamsOf();
      const t1Out = t1.every(p => out.includes(p.id)), t2Out = t2.every(p => out.includes(p.id));
      if (!t1Out && !t2Out) return;
      const winners = t1Out ? t2 : t1, losers = t1Out ? t1 : t2;
      const teamName = (typeof window.ewfTeamName === 'function' && window.ewfTeamName(winners[0], winners[1])) || `${winners[0].name.toUpperCase()} & ${winners[1].name.toUpperCase()}`;
      const survivors = winners.filter(p => !out.includes(p.id)).map(p => p.name);
      finishElim(`${survivors.join(' & ').toUpperCase()} SURVIVE${survivors.length > 1 ? '' : 'S'}!`, names, teamName, winners.find(p => !out.includes(p.id)).image,
        () => window.declareMatchWinner({ isTagTeam: true, teamIndex: t1Out ? 2 : 1, winners, losers, teamName }));
      return;
    }
    const left = alive();
    if (left.length !== 1) return;
    const w = left[0];
    finishElim(`${w.name.toUpperCase()} IS THE SOLE SURVIVOR!`, names, w.name, w.image,
      () => window.declareMatchWinner({ isTagTeam: false, winner: w, losers: (m.participants || []).filter(p => p && p.id !== w.id) }));
  }
  function finishElim(title, order, label, img, declare) {
    const E15 = window.EWF15; const m = curMatch();
    const st = E15 && E15.matchState();
    if (st) st.method = `Elimination (out: ${order.join(', then ')})`;
    if (m) m.__elimOrder = order.slice();
    if (E15) { E15.banner(title, 'linear-gradient(180deg,#ffd700,#7a5a00)'); E15.playSfx('bell.mp3', 0.9); }
    setTimeout(() => {
      if (!E15) return declare();
      E15.overlay('👑 CROWN YOUR WINNER!', title, [{ label, img }], () => declare(),
        [{ label: '↩ UNDO THE LAST ELIMINATION', cls: '', fn: () => { const l = elimList(); l.pop(); if (st) st.method = null; drawElim(); } }]);
    }, 1100);
  }
  function eliminate(id) {
    const l = elimList();
    if (l.includes(id)) return;
    l.push(id);
    const w = (curMatch().participants || []).find(p => p && p.id === id);
    if (w && window.EWF15) { window.EWF15.banner(`${w.name.toUpperCase()} IS ELIMINATED!`, 'linear-gradient(180deg,#e50914,#5a0006)'); }
    try { const a = new Audio('elimination.mp3'); a.volume = 0.8; a.play().catch(() => {}); } catch (e) {}
    drawElim();
    setTimeout(elimWinnerCheck, 700);
  }
  window.ewfEliminate = eliminate;
  function whoGotEliminated(method) {
    const E15 = window.EWF15; if (!E15) return;
    const opts = alive().map(w => ({ label: w.name, img: w.image, w }));
    E15.overlay('❌ WHO GOT ELIMINATED?', `${method.toUpperCase()}! Tap who's out.`, opts, o => eliminate(o.w.id),
      [{ label: '↩ KEEP FIGHTING (PRESSED BY ACCIDENT)', cls: '', fn: () => {} }]);
  }
  function drawElim() {
    ensureStyles();
    const list = document.getElementById('qmWinnerSelectionList');
    if (!list || !isElim()) return;
    const m = curMatch(); const out = elimList();
    let bar = document.getElementById('ewf16ElimBar');
    if (!bar) { bar = document.createElement('div'); bar.id = 'ewf16ElimBar'; bar.className = 'ewf16-elimbar'; list.parentElement.insertBefore(bar, list); }
    bar.innerHTML = `<div class="ttl">❌ ELIMINATION MATCH: tap <b>ELIMINATED</b> when someone's pinned or taps out. Last one standing wins!</div>` +
      `<div class="row">${(m.participants || []).filter(Boolean).map(w => {
        const isOut = out.includes(w.id);
        return `<div class="who ${isOut ? 'out' : ''}"><img src="${w.image}" onerror="this.style.display='none'"><span>${w.name}</span>
          <button type="button" data-id="${w.id}">${isOut ? '↩ UNDO' : '❌ ELIMINATED'}</button></div>`;
      }).join('')}</div>`;
    bar.querySelectorAll('button').forEach(btn => btn.onclick = e => {
      e.stopPropagation();
      const id = btn.dataset.id; const l = elimList();
      if (l.includes(id)) { l.splice(l.indexOf(id), 1); drawElim(); } else eliminate(id);
    });
  }
  function wrapWinnerList() {
    const orig = window.renderWinnerSelectionList;
    if (typeof orig !== 'function' || orig.__b16) return;
    const w = function (...a) {
      const r = orig.apply(this, a);
      try { const bar = document.getElementById('ewf16ElimBar'); if (bar && !isElim()) bar.remove(); drawElim(); } catch (e) {}
      return r;
    };
    w.__b16 = true;
    window.renderWinnerSelectionList = w;
    try { renderWinnerSelectionList = w; } catch (e) {}
  }

  /* ---------- items 14 + 16: pads ---------- */
  function wrapPads() {
    const origR = window.ewfPadResult;
    if (typeof origR === 'function' && !origR.__b16) {
      const w = function (name, result) {
        const key = name + ':' + result;
        if (isElim() && (key === 'pinfall:win' || key === 'submission:tapout')) {
          const E15 = window.EWF15; const st = E15 && E15.matchState();
          if (st) { st.used = true; }
          if (E15) E15.banner(key === 'pinfall:win' ? "1... 2... 3! HE'S OUT!" : 'HE TAPS OUT!', key === 'pinfall:win' ? 'linear-gradient(180deg,#ffd700,#7a5a00)' : 'linear-gradient(180deg,#e50914,#5a0006)');
          setTimeout(() => whoGotEliminated(key === 'pinfall:win' ? 'Pinfall' : 'Submission'), 1300);
          return;
        }
        return origR.apply(this, arguments);
      };
      w.__b16 = true;
      window.ewfPadResult = w;
    }
    const origE = window.ewfPadEffect;
    if (typeof origE === 'function' && !origE.__b16) {
      const w = function (fx) {
        const m = curMatch();
        if (fx === 'table' && m && /Tables Match$/.test(baseType(m.matchType)) && typeof isMatchInProgressLooping !== 'undefined' && isMatchInProgressLooping) {
          const E15 = window.EWF15; const st = E15 && E15.matchState();
          if (st) { st.used = true; st.table = (st.table || 0) + 1; }
          if (E15) {
            E15.banner("THROUGH THE TABLE! IT'S OVER!", 'linear-gradient(180deg,#ff6d00,#5a2600)');
            setTimeout(() => {
              if (m.formatKey === 'tag' || m.formatKey === 'handicap') E15.crownYourWinner('Through the Table');
              else E15.crownYourWinner('Through the Table');
            }, 1300);
          }
          return;
        }
        return origE.apply(this, arguments);
      };
      w.__b16 = true;
      window.ewfPadEffect = w;
    }
  }

  /* ---------- item 13: a look for every pad result ---------- */
  const BANNER_STYLES = [
    [/^KICK OUT AT TWO!$/, 'kick'],
    [/^ROPE BREAK!$/, 'rope'],
    [/IT'S OVER!$/, 'win'],
    [/^HE TAPS OUT!$/, 'tap'],
    [/GRABBED IT!$/, 'ladder'],
    [/KNOCKED OFF THE LADDER/, 'ladder'],
    [/ESCAPED THE CAGE/, 'cage'],
    [/DRAGGED BACK IN/, 'dragged'],
    [/OVER THE TOP ROPE/, 'over'],
    [/HANGS ON/, 'hang'],
    [/HE'S OUT!$|IS ELIMINATED!$/, 'tap'],
    [/SOLE SURVIVOR|SURVIVES?!$/, 'win'],
    [/THROUGH THE TABLE/, 'kick']
  ];
  function styleBanner(b) {
    if (!b || b.dataset.ewf16) return;
    b.dataset.ewf16 = '1';
    let t = b.textContent.trim();
    if (t === 'KICK OUT AT TWO!') {
      const r = Math.random();
      if (r < 0.25) { b.textContent = 'SO CLOSE! KICKED OUT AT 2.9!'; b.classList.add('ewf16-b-close'); flashScreen(); return; }
      if (r < 0.40) { b.textContent = 'KICK OUT AT ONE!'; }
    }
    t = b.textContent.trim();
    const hit = BANNER_STYLES.find(([rx]) => rx.test(t));
    if (hit) b.classList.add('ewf16-b-' + hit[1]);
  }
  function flashScreen() {
    const f = document.createElement('div');
    f.className = 'ewf16-flash';
    (window.EWF15 ? window.EWF15.host() : document.body).appendChild(f);
    setTimeout(() => f.remove(), 450);
  }
  function watchBanners() {
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType === 1 && n.classList && n.classList.contains('ewf15-padbanner')) styleBanner(n);
    }))).observe(document.documentElement, { childList: true, subtree: true });
  }

  function matchStyles() {
    if (document.getElementById('ewf16-styles-b')) return;
    const st = document.createElement('style');
    st.id = 'ewf16-styles-b';
    st.textContent = `
      .ewf16-elimbar { margin: 6px auto 12px; max-width: 900px; padding: 10px; border: 2px solid #e50914; border-radius: 8px; background: rgba(40,0,0,0.75); }
      .ewf16-elimbar .ttl { font-family: 'Russo One', sans-serif; color: #fff; font-size: 0.85rem; margin-bottom: 8px; text-align: center; }
      .ewf16-elimbar .row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
      .ewf16-elimbar .who { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 120px; padding: 6px; background: #121424; border: 2px solid #ffd700; border-radius: 6px; position: relative; }
      .ewf16-elimbar .who img { width: 70px; height: 70px; object-fit: cover; border-radius: 4px; }
      .ewf16-elimbar .who span { font-family: 'Russo One', sans-serif; font-size: 0.78rem; color: #fff; text-align: center; }
      .ewf16-elimbar .who button { font-family: 'Russo One', sans-serif; font-size: 0.72rem; padding: 7px 8px; border-radius: 5px; border: 2px solid #fff; background: #b71c1c; color: #fff; cursor: pointer; }
      .ewf16-elimbar .who.out { filter: grayscale(1); opacity: 0.55; border-color: #555; }
      .ewf16-elimbar .who.out::after { content: '❌'; position: absolute; top: 18px; font-size: 3rem; }
      .ewf16-elimbar .who.out button { background: #333; }
      .ewf15-padbanner.ewf16-b-kick { background: linear-gradient(180deg,#ff8f00,#7a3300) !important; animation: ewf15pop .35s cubic-bezier(.2,1.6,.4,1), ewf16shake .4s .35s 1 !important; }
      .ewf15-padbanner.ewf16-b-close { background: linear-gradient(180deg,#ff6d00,#c62828 55%,#5a0006) !important; font-size: clamp(1.9rem, 6vw, 3.8rem) !important; animation: ewf15pop .35s cubic-bezier(.2,1.6,.4,1), ewf16shake .5s .3s 2 !important; }
      .ewf15-padbanner.ewf16-b-rope { background: linear-gradient(180deg,#00c853,#00451d) !important; animation: ewf16slide .4s ease-out !important; }
      .ewf15-padbanner.ewf16-b-win { background: linear-gradient(180deg,#ffd700,#8a6500) !important; color: #fff !important; box-shadow: 0 0 40px #ffd700, 0 0 80px rgba(255,215,0,.6) !important; }
      .ewf15-padbanner.ewf16-b-tap { background: linear-gradient(180deg,#e50914,#5a0006) !important; animation: ewf15pop .35s cubic-bezier(.2,1.6,.4,1), ewf16pulse .5s .35s 3 !important; }
      .ewf15-padbanner.ewf16-b-ladder { background: linear-gradient(180deg,#ffd700 0%,#c0c0c0 50%,#8a6500 100%) !important; color: #fff !important; }
      .ewf15-padbanner.ewf16-b-cage { background: repeating-linear-gradient(90deg, rgba(0,0,0,.35) 0 4px, transparent 4px 26px), repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0 4px, transparent 4px 26px), linear-gradient(180deg,#9e9e9e,#424242) !important; }
      .ewf15-padbanner.ewf16-b-dragged { background: repeating-linear-gradient(90deg, rgba(0,0,0,.4) 0 4px, transparent 4px 26px), linear-gradient(180deg,#455a64,#101820) !important; animation: ewf15pop .35s cubic-bezier(.2,1.6,.4,1), ewf16rattle .12s .35s 5 !important; }
      .ewf15-padbanner.ewf16-b-over { background: linear-gradient(180deg,#e50914,#5a0006) !important; animation: ewf16drop .5s cubic-bezier(.3,1.4,.5,1) !important; }
      .ewf15-padbanner.ewf16-b-hang { background: linear-gradient(180deg,#00c853,#00451d) !important; animation: ewf15pop .35s cubic-bezier(.2,1.6,.4,1), ewf16wobble .5s .35s 2 !important; }
      @keyframes ewf16shake { 0%,100% { transform: translateX(-50%); } 20% { transform: translateX(calc(-50% - 14px)) rotate(-2deg); } 40% { transform: translateX(calc(-50% + 14px)) rotate(2deg); } 60% { transform: translateX(calc(-50% - 9px)); } 80% { transform: translateX(calc(-50% + 9px)); } }
      @keyframes ewf16slide { from { transform: translateX(-160%); } to { transform: translateX(-50%); } }
      @keyframes ewf16pulse { 50% { transform: translateX(-50%) scale(1.08); filter: brightness(1.35); } }
      @keyframes ewf16rattle { 50% { transform: translateX(calc(-50% + 6px)); } }
      @keyframes ewf16drop { from { transform: translate(-50%, -220%); } to { transform: translate(-50%, 0); } }
      @keyframes ewf16wobble { 25% { transform: translateX(-50%) rotate(-4deg); } 75% { transform: translateX(-50%) rotate(4deg); } }
      .ewf16-flash { position: fixed; inset: 0; background: #fff; z-index: 2147483599; pointer-events: none; animation: ewf16flashout .45s ease-out forwards; }
      @keyframes ewf16flashout { from { opacity: .85; } to { opacity: 0; } }
    `;
    document.head.appendChild(st);
  }

  /* ==========================================================================
     3. IN-MATCH MOMENTS (items 21, 22, 23, 24)
     ========================================================================== */
  const TAKER = 'default-theundertaker', KANE = 'default-kane', HHH = 'default-tripleh';
  const KANE_TEASE_URL = 'https://www.youtube.com/watch?v=GdwhlKKw0Lc';
  const unlockedIds = () => ((typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : []) || []).map(w => w.id);
  const looping = () => { try { return !!isMatchInProgressLooping; } catch (e) { return false; } };
  const runIn = () => { try { return !!isRunInActive; } catch (e) { return false; } };
  const hostEl = () => document.fullscreenElement || document.webkitFullscreenElement || document.getElementById('videoModal') || document.body;
  const gmLevel = () => (typeof getGMLevel === 'function' ? getGMLevel() : 1);
  function xpToNext() {
    try {
      const prof = getGMProfile();
      const next = LEVEL_LADDER.find(t => t.level === gmLevel() + 1);
      return next ? next.xpReq - (prof.xp || 0) : Infinity;
    } catch (e) { return Infinity; }
  }

  // ---------- item 21: STEPHANIE HIJACKS THE MIC ----------
  const BRUTAL = ['Falls Count Anywhere', 'Hardcore Match', 'Tables Match', 'Last Man Standing', 'Ambulance Match', 'Steel Cage Match'];
  const TAG_BRUTAL = ['Hardcore Match', 'Tables Match'];
  const STEPH_URL = 'https://www.youtube.com/watch?v=K6ycDLE16Bc';
  const unlockedType = t => !(typeof isMatchTypeLocked === 'function' && isMatchTypeLocked(t).locked);
  let quickSinceSteph = 99;
  function stephUpgradeFor(m) {
    const fk = m.formatKey;
    if (['rumble', 'mitb', 'kotr'].includes(fk)) return null;
    const base = baseType(m.matchType);
    if (/Rumble|Money in the Bank|Cash-In|King of the Ring|Elimination|TLC|Ladder|2 out of 3 Falls|Special Guest Referee/i.test(base)) return null;
    if (m.isCareerMatch) return null;
    const pool = (fk === 'tag' ? TAG_BRUTAL : BRUTAL).filter(unlockedType).filter(t => !(fk === 'tag' && t === 'Falls Count Anywhere'));
    if (!pool.length) return null;
    const ids = (m.participants || []).filter(Boolean).map(p => p.id);
    const forHunter = ids.includes(HHH);
    const idx = BRUTAL.indexOf(base);
    let choices = idx >= 0 ? pool.filter(t => BRUTAL.indexOf(t) > idx) : pool.filter(t => t !== 'Falls Count Anywhere');
    if (!choices.length) return null;
    let pick = choices[Math.floor(Math.random() * choices.length)];
    if (forHunter) pick = choices.includes('Steel Cage Match') ? 'Steel Cage Match' : (choices.includes('Hardcore Match') ? 'Hardcore Match' : pick);
    return { type: pick, forHunter };
  }
  function stephEligible(m) {
    if (!m || gmLevel() < ((window.EWF_UNLOCK_LEVELS || {}).stephanie || 13)) return false;
    const sess = window.activeShowSession;
    if (sess) {
      if (sess.__stephMic16) return false;
      const bout = sess.bouts && sess.bouts[sess.currentBoutIdx];
      const big = ['mania', 'summerslam', 'survivor', 'rumble', 'kotr', 'mitb', 'badblood', 'judgmentday', 'nomercy', 'backlash'].includes(sess.showKey);
      if (big && bout && bout.order === 'MAIN EVENT') return false;
    } else if (quickSinceSteph < 3) return false;
    return true;
  }
  function stephHijack(m, up, goLive) {
    ensureStyles();
    try { if (window.activeShowSession) window.activeShowSession.__stephMic16 = true; } catch (e) {}
    quickSinceSteph = 0;
    const before = m.matchType;
    const pre = (String(before).match(/^(Triple Threat |Fatal 4-Way )/) || [''])[0];
    const newType = pre + up.type;
    const names = (m.participants || []).filter(Boolean).map(p => p.name).join(' vs ');
    try { runIn(); isRunInActive = true; } catch (e) {}
    const banner = document.getElementById('ambushBanner');
    const show = (html, bg) => { if (!banner) return; banner.innerHTML = html; banner.style.background = bg; banner.style.display = 'flex'; };
    // lights dip
    const dip = document.createElement('div');
    dip.id = 'ewfStephMic16';
    dip.style.cssText = 'position:fixed; inset:0; z-index:2147483600; background:#000; opacity:0; transition:opacity .5s; pointer-events:none;';
    hostEl().appendChild(dip);
    requestAnimationFrame(() => { dip.style.opacity = '0.92'; });
    try { if (typeof stopMatchCrowd === 'function') stopMatchCrowd(); } catch (e) {}
    setTimeout(() => {
      dip.remove();
      try {
        currentPlayingWrestler = { id: 'commissioner-stephanie', name: 'Stephanie McMahon', youtubeUrl: STEPH_URL };
        const modalEl = document.getElementById('videoModal');
        if (modalEl) { modalEl.style.display = 'flex'; modalEl.classList.remove('split-screen-mode'); }
        try { setElDisplay('quickMatchBox', 'none'); setElDisplay('player-container', 'block'); setElDisplay('videoCloseBtn', 'flex'); } catch (e) {}
        if (typeof loadAndPlayYouTube === 'function') loadAndPlayYouTube(STEPH_URL, true, false);
      } catch (e) {}
      show(`🎤 STEPHANIE McMAHON HAS HIJACKED THE MIC!`, 'linear-gradient(180deg,#6a1b9a,#1a0033)');
      setTimeout(() => {
        m.matchType = newType;
        try {
          const sess = window.activeShowSession;
          const bout = sess && sess.bouts && sess.bouts[sess.currentBoutIdx];
          if (bout && bout !== m) bout.matchType = newType;
        } catch (e) {}
        m.__stephUpgraded = before;
        m.feudStake = `🎤 UPGRADED BY STEPHANIE${up.forHunter ? ' (FOR HUNTER)' : ''}`;
        show(`BY ORDER OF THE COMMISSIONER... THIS IS NOW ${/^[AEIOU]/i.test(up.type) ? 'AN' : 'A'} ${up.type.toUpperCase()}!${up.forHunter ? '<br>...and she\'s doing it for HUNTER!' : ''}`, 'linear-gradient(180deg,#d50000,#3d0000)');
        try { const a = new Audio('gavel.mp3'); a.volume = 0.9; a.play().catch(() => {}); } catch (e) {}
        histLog(`🎤 STEPHANIE HIJACKED THE MIC: ${names.toUpperCase()} is now ${/^[AEIOU]/i.test(up.type) ? 'an' : 'a'} ${up.type.toUpperCase()}!`, 'interference');
        try { if (typeof logShowFalloutEvent === 'function') logShowFalloutEvent('cutscene', `🎤 STEPHANIE made ${names.toUpperCase()} ${/^[AEIOU]/i.test(up.type) ? 'an' : 'a'} ${up.type.toUpperCase()}!`); } catch (e) {}
      }, 4500);
      const back = () => {
        clearTimeout(backT);
        if (banner) banner.style.display = 'none';
        try { isRunInActive = false; } catch (e) {}
        goLive();
      };
      const btn = document.getElementById('nextEntrantBtn');
      if (btn) { btn.innerText = 'RING THE BELL ➔'; btn.style.display = 'block'; btn.onclick = back; }
      const backT = setTimeout(back, 14000);
      bret('stephMic', `It's <b>STEPHANIE</b>! When the Commissioner grabs the mic she can change the match to anything she likes. Set up the new match, GM!`, 2500);
    }, 900);
  }
  window.ewfStephHijackTest = () => { const m = curMatch(); const up = stephUpgradeFor(m); if (up) stephHijack(m, up, () => window.showMatchInProgressWinnerScreen()); return up; };

  // ---------- items 22-24: UNDERTAKER GONG / KANE PYRO teases ----------
  let tease = null; // { kind:'gong'|'kane', at, fired, active, match, torment, attacker }
  function teaseFor(m) {
    const ids = (m.participants || []).filter(Boolean).map(p => p.id);
    if (['rumble'].includes(m.formatKey)) return null;
    const have = unlockedIds();
    const lvl = gmLevel(), toNext = xpToNext();
    const UL = window.EWF_UNLOCK_LEVELS || {};
    // item 22 / 24a: the last match or two before the unlock (no name, no text)
    if (lvl === (UL.undertaker || 5) - 1 && !have.includes(TAKER) && toNext <= 260 && Math.random() < 0.7) return { kind: 'gong' };
    if (lvl === (UL.kane || 9) - 1 && !have.includes(KANE) && toNext <= 260 && Math.random() < 0.7) return { kind: 'kane' };
    // item 23 / 24b: torment the superstar who hurt them (only when the revenge run-in isn't coming this match)
    try {
      if (typeof window.ewfInjuryPlan === 'function' && window.ewfInjuryPlan()) return null;
      const att = typeof window.ewfInjuryAttackers === 'function' ? window.ewfInjuryAttackers() : {};
      const inj = (typeof getInjuries === 'function' ? getInjuries() : []) || [];
      for (const who of [TAKER, KANE]) {
        const rec = inj.find(i => i && i.id === who && i.severity === 'major');
        if (rec && att[who] && ids.includes(att[who]) && !ids.includes(who) && Math.random() < 1 / 3) return { kind: who === TAKER ? 'gong' : 'kane', torment: true, attacker: att[who] };
      }
    } catch (e) {}
    return null;
  }
  function blackOverlay() {
    let ov = document.getElementById('ewfTease16');
    if (!ov) { ov = document.createElement('div'); ov.id = 'ewfTease16'; }
    ov.style.cssText = 'position:fixed; inset:0; z-index:2147483645; background:#000; pointer-events:none; transition: background .12s;';
    hostEl().appendChild(ov);
    return ov;
  }
  function gongTease(done) {
    const ov = blackOverlay();
    try { if (typeof stopMatchCrowd === 'function') stopMatchCrowd(); } catch (e) {}
    const gong = () => {
      try { const a = new Audio('gong.mp3'); a.volume = 1; a.play().catch(() => {}); } catch (e) {}
      ov.style.background = '#7b1fa2';
      setTimeout(() => { ov.style.background = '#2a0040'; }, 160);
      setTimeout(() => { ov.style.background = '#000'; }, 650);
    };
    setTimeout(gong, 500);
    setTimeout(gong, 3300);
    setTimeout(() => {
      ov.remove();
      try { if (typeof playRandomMatchCrowd === 'function') playRandomMatchCrowd(0.25); } catch (e) {}
      done();
    }, 6600);
  }
  function kaneTease(done) {
    const ov = blackOverlay();
    try { if (typeof stopMatchCrowd === 'function') stopMatchCrowd(); } catch (e) {}
    setTimeout(() => { ov.style.background = '#d50000'; }, 350);
    setTimeout(() => {
      ov.remove();
      let finished = false;
      const back = () => {
        if (finished) return; finished = true;
        window.removeEventListener('message', onMsg);
        clearInterval(listen); clearTimeout(cap);
        try { isRunInActive = false; } catch (e) {}
        const btn = document.getElementById('nextEntrantBtn'); if (btn) btn.style.display = 'none';
        try { window.showMatchInProgressWinnerScreen(); } catch (e) {}
        done();
      };
      const onMsg = ev => {
        try {
          if (!/youtube/.test(ev.origin || '')) return;
          const d = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
          if (d && d.info && d.info.playerState === 0) back();
        } catch (e) {}
      };
      window.addEventListener('message', onMsg);
      try {
        isRunInActive = true;
        isMatchInProgressLooping = false;
        const modalEl = document.getElementById('videoModal');
        if (modalEl) modalEl.classList.remove('split-screen-mode');
        setElDisplay('quickMatchBox', 'none');
        setElDisplay('player-container', 'block');
        if (typeof loadAndPlayYouTube === 'function') loadAndPlayYouTube(KANE_TEASE_URL, true, true);
        const btn = document.getElementById('nextEntrantBtn');
        if (btn) { btn.innerText = 'Return to Fight ➔'; btn.style.display = 'block'; btn.onclick = back; }
      } catch (e) { back(); return; }
      const iframe = document.getElementById('youtubeIframe');
      const listen = setInterval(() => { try { iframe.contentWindow.postMessage('{"event":"listening","id":1}', '*'); } catch (e) {} }, 700);
      const cap = setTimeout(back, 22000); // the video is under 20 seconds
    }, 900);
  }
  function fireTease(t) {
    t.fired = true; t.active = true;
    const att = t.attacker && byIdW(t.attacker);
    if (t.torment && att) {
      histLog(t.kind === 'gong'
        ? `🔔 A GONG HAUNTED ${att.name.toUpperCase()}... the Deadman is coming!`
        : `🔥 KANE'S PYRO WENT OFF ON ${att.name.toUpperCase()}... the Big Red Machine is coming!`, 'interference');
    }
    (t.kind === 'gong' ? gongTease : kaneTease)(() => { t.active = false; });
  }
  window.ewfTeaseTest = kind => fireTease({ kind, torment: false });

  function wrapLive() {
    const orig = window.showMatchInProgressWinnerScreen;
    if (typeof orig !== 'function' || orig.__b16) return;
    const w = function (...a) {
      const m = curMatch();
      const serial = window.__ewfMatchSerial || 0;
      let early = true; try { early = liveMatchElapsedSeconds <= 3; } catch (e) {}
      if (m && m.__b16Live !== serial) {
        m.__b16Live = serial;
        if (!window.activeShowSession) quickSinceSteph++;
        try {
          const up = early && stephEligible(m) && Math.random() < 1 / 6 ? stephUpgradeFor(m) : null;
          if (up) { stephHijack(m, up, () => window.showMatchInProgressWinnerScreen(...a)); return; }
        } catch (e) { console.warn('steph mic', e); }
        const r = orig.apply(this, a);
        try {
          const t = teaseFor(m);
          tease = t ? Object.assign(t, { at: 20 + Math.floor(Math.random() * 26), match: m }) : null;
        } catch (e) { tease = null; }
        return r;
      }
      return orig.apply(this, a);
    };
    w.__b16 = true;
    window.showMatchInProgressWinnerScreen = w;
    try { showMatchInProgressWinnerScreen = w; } catch (e) {}
  }
  // a fresh match starts when the live stopwatch is reset (the quick-match object is reused between matches)
  function wrapStopwatch() {
    const orig = window.startLiveMatchStopwatch;
    if (typeof orig !== 'function' || orig.__b16) return;
    const w = function (reset) { if (reset) window.__ewfMatchSerial = (window.__ewfMatchSerial || 0) + 1; return orig.apply(this, arguments); };
    w.__b16 = true;
    window.startLiveMatchStopwatch = w;
    try { startLiveMatchStopwatch = w; } catch (e) {}
  }
  function wrapTick16() {
    if (!window.EWFP || typeof EWFP.tick !== 'function' || EWFP.tick.__b16) return;
    const orig = EWFP.tick;
    const t = function (sec) {
      if (tease && tease.match === curMatch()) {
        if (tease.active) return;
        if (!tease.fired && sec >= tease.at && looping() && !runIn() && !(window.ewfScreenBusy && window.ewfScreenBusy())) { fireTease(tease); return; }
      }
      return orig.apply(this, arguments);
    };
    t.__b16 = true;
    EWFP.tick = t;
  }
  window.ewfTeasePlan = () => tease;

  /* ==========================================================================
     4. ROSTER CARD ICONS IN A NEAT ROW (item 10): MITB, KOTR crown, ON FIRE / ICE COLD
     ========================================================================== */
  function tidyCardIcons() {
    document.querySelectorAll('#wrestler-grid .card').forEach(card => {
      const icons = [
        card.querySelector('.mitb-badge-img, .mitb-badge'),
        card.querySelector('.kotr-badge-img, .kotr-badge'),
        card.querySelector('.momentum-badge')
      ].filter(Boolean);
      let right = 6;
      icons.forEach(el => {
        el.style.setProperty('position', 'absolute', 'important');
        el.style.setProperty('top', '6px', 'important');
        el.style.setProperty('right', right + 'px', 'important');
        el.style.setProperty('left', 'auto', 'important');
        el.style.setProperty('width', '28px', 'important');
        el.style.setProperty('height', '28px', 'important');
        el.style.setProperty('max-height', '28px', 'important');
        if (el.tagName === 'IMG') el.style.setProperty('object-fit', 'contain', 'important');
        right += 32;
      });
    });
  }
  window.ewfTidyCardIcons = tidyCardIcons;
  function wrapGridIcons() {
    const orig = window.renderGrid;
    if (typeof orig !== 'function' || orig.__b16) return;
    const w = function (...a) { const r = orig.apply(this, a); try { tidyCardIcons(); } catch (e) {} return r; };
    w.__b16 = true;
    window.renderGrid = w;
    try { renderGrid = w; } catch (e) {}
  }

  /* ==========================================================================
     5. CROWN YOUR FIRST CHAMPION (item 4)
     Straight after the Level 2 belts unlock, Bret walks Ellis through putting a belt on the line
     in Choose Your Match. The first champion crowned gets a one-off moment and bonus XP.
     ========================================================================== */
  const FC_KEY = 'ewf_first_champ';
  const fcLoad = () => { try { return JSON.parse(localStorage.getItem(FC_KEY) || 'null'); } catch (e) { return null; } };
  const fcSave = v => { try { localStorage.setItem(FC_KEY, JSON.stringify(v)); } catch (e) {} };
  const BELTS = { whc: ['World Heavyweight Championship', 'whc.png'], ic: ['Intercontinental Championship', 'ic_title.png'], hardcore: ['Hardcore Championship', 'hardcore.png'], tag1: ['World Tag Team Championship', 'tag_title.png'] };
  const holders = () => { try { return getTitleHolders() || {}; } catch (e) { return {}; } };
  function fcOffer(isReminder) {
    const P = window.EWFP;
    if (!P || !P._scene) return;
    P._scene({
      bg: 'boardroom_decree_bg.png', title: '🏆 THE GOLD IS HERE, GM!', titleBg: 'linear-gradient(180deg,#ffd700,#7a5a00)',
      objects: [{ src: 'whc.png', style: 'left: 50%; bottom: 14%; height: 46%; transform: translateX(-50%);', cls: 'still' }],
      text: isReminder
        ? `<b>Bret:</b> "Hey GM, those belts are still <b>EMPTY: UP FOR GRABS</b>! Shall we crown your first champion now?"`
        : `<b>Bret:</b> "You've got the gold now, GM! Every belt is <b>EMPTY: UP FOR GRABS</b>. Let's crown your <b>first champion</b>!"`,
      buttons: [
        { label: "🏆 LET'S DO IT ➔", cls: 'gold', fn: () => { try { P._closeScene(); } catch (e) {} fcStartTour(); } },
        { label: 'LATER', cls: '', fn: () => { try { P._closeScene(); } catch (e) {} const st = fcLoad() || {}; st.state = 'later'; fcSave(st); } }
      ]
    });
    try { P._sfx('title_clink.mp3', 0.8); } catch (e) {}
  }
  function fcStartTour() {
    const st = fcLoad() || {};
    st.state = 'tour'; st.shown = {};
    fcSave(st);
    try { if (typeof openMatchEngine === 'function') openMatchEngine(); } catch (e) {}
  }
  const FC_STEPS = [
    { k: 'format', test: () => visId('qmStepFormat'), text: `Pick <b>1 VS 1</b> for your first title match, GM. One superstar, one belt!` },
    { k: 'type', test: () => visId('qmStepPicker'), text: `Any <b>MATCH TYPE</b> you like! A Normal Match is a great way to crown a champion.` },
    { k: 'pick', test: () => visId('qmStepHandPick'), text: `Now pick the <b>TWO SUPERSTARS</b> fighting for the gold. Grab their figures!` },
    { k: 'title', test: () => visId('qmStepResult') && !(curMatch() || {}).isTitleMatch, text: `This is the big one! Tap <b>PUT TITLE ON LINE</b> and pick a belt. The winner walks out as the <b>CHAMPION</b>!` },
    { k: 'start', test: () => visId('qmStepResult') && !!(curMatch() || {}).isTitleMatch, text: `The gold is on the line! Now tap <b>START ENTRANCES</b>... let's crown a champion!` }
  ];
  function visId(id) { const el = document.getElementById(id); return !!(el && el.offsetParent !== null && getComputedStyle(el).display !== 'none'); }
  function fcPoll() {
    const st = fcLoad();
    if (!st || st.state === 'done') return;
    const h = holders();
    const newChamp = Object.keys(BELTS).find(k => h[k] && !(st.before || {})[k]);
    if (newChamp && !looping() && !runIn() && !(window.ewfScreenBusy && window.ewfScreenBusy()) && !(window.ewfVideoPlaying && window.ewfVideoPlaying())
        && !visId('universalSummaryOverlay') && !document.querySelector('.ewf-tut-bubble, .ewfp-scene')) {
      st.state = 'done'; fcSave(st);
      return fcCelebrate(newChamp, h[newChamp]);
    }
    if (st.state !== 'tour') return;
    if (document.querySelector('.ewf-tut-bubble')) return;
    st.shown = st.shown || {};
    for (const step of FC_STEPS) {
      if (!st.shown[step.k] && step.test()) {
        if (typeof window.ewfShowTip === 'function' && window.ewfShowTip(step.text)) { st.shown[step.k] = 1; fcSave(st); }
        break;
      }
    }
  }
  function fcCelebrate(code, id) {
    const w = byIdW(id); const P = window.EWFP;
    if (!w || !P || !P._scene) return;
    const [belt, img] = BELTS[code];
    P._scene({
      bg: 'title_pedestal.png', title: '👑 YOUR FIRST EVER EWF CHAMPION!', titleBg: 'linear-gradient(180deg,#ffd700,#7a5a00)',
      center: w,
      objects: [{ src: img, style: 'right: 6%; bottom: 10%; height: 34%;', cls: 'still' }],
      text: `<b>Bret:</b> "History, GM! <b>${w.name}</b> is the first ever <b>${belt.replace(/ship$/, '').toUpperCase()}</b>! Remember this day... and get that belt on the figure!" <b style="color:#00e676;">+200 XP</b>`,
      buttons: [{ label: 'WHAT A MOMENT! ➔', cls: 'gold', fn: () => { try { P._closeScene(); } catch (e) {} } }]
    });
    try { P._sfx('victory.mp3', 0.8); P._flash(); } catch (e) {}
    try { if (typeof addXP === 'function') addXP(200, 'First ever champion'); } catch (e) {}
    histLog(`👑 FIRST EVER CHAMPION: ${w.name.toUpperCase()} won the ${belt.toUpperCase()}!`, 'title-change');
  }
  function wrapFirstChamp() {
    const orig = window.closeUnlockShowcase;
    if (typeof orig === 'function' && !orig.__b16) {
      const w = function (...a) {
        const tier = window.activeShowcaseTier;
        const r = orig.apply(this, a);
        try {
          if (tier && tier.unlockType === 'titles' && !fcLoad()) {
            const h = holders();
            fcSave({ state: 'offered', before: { whc: h.whc || null, ic: h.ic || null, hardcore: h.hardcore || null, tag1: h.tag1 || null } });
            (window.ewfWhenScreenFree || (f => f()))(() => setTimeout(() => fcOffer(false), 500));
          }
        } catch (e) {}
        return r;
      };
      w.__b16 = true;
      window.closeUnlockShowcase = w;
      try { closeUnlockShowcase = w; } catch (e) {}
    }
    const open = window.openMatchEngine;
    if (typeof open === 'function' && !open.__b16) {
      const w = function (...a) {
        const r = open.apply(this, a);
        try {
          const st = fcLoad();
          if (st && st.state === 'later' && !window.activeShowSession && !Object.keys(BELTS).some(k => holders()[k])) {
            st.state = 'reminded'; fcSave(st);
            setTimeout(() => { try { if (typeof closeVideoModal === 'function') closeVideoModal(); } catch (e) {} fcOffer(true); }, 300);
          }
        } catch (e) {}
        return r;
      };
      w.__b16 = true;
      window.openMatchEngine = w;
      try { openMatchEngine = w; } catch (e) {}
    }
    setInterval(() => { try { fcPoll(); } catch (e) {} }, 900);
  }
  window.ewfFirstChampOffer = fcOffer;

  /* ==========================================================================
     6. NEW TROPHY FOR THE CABINET (item 19)
     A newly won trophy now gets its own moment (once), and the GM's trophies go straight into the
     Hall of Fame ceremony. The chip on the card is still there to replay it.
     ========================================================================== */
  const TROPHIES = [
    { n: 1, key: 'grand_slam', title: 'THE GRAND SLAM', who: m => m.grand_slam && m.grand_slam.holder },
    { n: 2, key: 'heist_century', title: 'HEIST OF THE CENTURY', who: m => m.heist_century && m.heist_century.holder },
    { n: 3, key: 'iron_man', title: 'THE IRON MAN', who: m => m.iron_man && m.iron_man.holder },
    { n: 4, key: 'the_streak', title: 'THE STREAK', who: m => m.the_streak && m.the_streak.holder },
    { n: 5, key: 'five_star_general', title: 'FIVE-STAR GENERAL', gm: true },
    { n: 6, key: 'slayer_giants', title: 'SLAYER OF GIANTS', who: m => m.slayer_giants && m.slayer_giants.holder },
    { n: 7, key: 'tag_team_kings', title: 'TAG TEAM KINGS', gm: true },
    { n: 8, key: 'fan_favourite', title: 'FAN FAVOURITE', who: m => m.fan_favourite && m.fan_favourite.firstWrestler },
    { n: 9, key: 'tag_historian', title: 'HALL OF FAME TAG HISTORIAN', gm: true }
  ];
  const TR_KEY = 'ewf_trophies_seen';
  function earnedTrophies() {
    let m = {};
    try { m = (typeof getMilestones === 'function' ? getMilestones() : {}) || {}; } catch (e) {}
    const out = TROPHIES.filter(t => {
      if (t.key === 'tag_historian') { try { return (JSON.parse(localStorage.getItem('ewf_legends_reunited') || '[]') || []).length >= 5; } catch (e) { return false; } }
      if (t.key === 'five_star_general') { try { return !!(m.five_star_general && m.five_star_general.unlocked) && getHistory().filter(h => h.rating === 5).length >= 10; } catch (e) { return false; } }
      return !!(m[t.key] && m[t.key].unlocked);
    });
    return { m, out };
  }
  function trophyPoll() {
    if (looping() || runIn()) return;
    if ((window.ewfScreenBusy && window.ewfScreenBusy()) || (window.ewfVideoPlaying && window.ewfVideoPlaying())) return;
    if (visId('universalSummaryOverlay') || document.querySelector('.ewf-tut-bubble, .ewfp-scene') || document.getElementById('ewfTrophy16')) return;
    const ach = document.getElementById('achievementPopup'); if (ach && ach.classList.contains('show')) return;
    const { m, out } = earnedTrophies();
    let seen = null;
    try { seen = JSON.parse(localStorage.getItem(TR_KEY) || 'null'); } catch (e) {}
    if (!Array.isArray(seen)) { try { localStorage.setItem(TR_KEY, JSON.stringify(out.map(t => t.key))); } catch (e) {} return; } // existing saves: no flood
    const fresh = out.find(t => !seen.includes(t.key));
    if (!fresh) return;
    seen.push(fresh.key);
    try { localStorage.setItem(TR_KEY, JSON.stringify(seen)); } catch (e) {}
    showTrophy(fresh, fresh.who ? byIdW(fresh.who(m)) : null);
  }
  function showTrophy(t, w) {
    ensureStyles();
    const ov = document.createElement('div');
    ov.id = 'ewfTrophy16';
    ov.className = 'ewf16-trophy';
    const whoName = t.gm ? 'GENERAL MANAGER ELLIS' : (w ? w.name.toUpperCase() : '');
    const whoImg = t.gm ? (typeof getGmEllisAvatarSrc === 'function' ? getGmEllisAvatarSrc() : 'ellis_avatar.png') : (w ? w.image : '');
    ov.innerHTML = `<div class="card"><div class="lbl">🏆 NEW TROPHY FOR THE CABINET!</div>
      <img class="tr" src="trophy_${t.n}.png" onerror="this.src='logo_notext.png'">
      <h2>${t.title}</h2>
      ${whoName ? `<div class="who"><img src="${whoImg}" onerror="this.style.display='none'"><span>${whoName}</span></div>` : ''}
      <button type="button">${t.gm ? '🏛️ TO THE HALL OF FAME ➔' : 'AWESOME! ➔'}</button></div>`;
    ov.querySelector('button').onclick = () => {
      ov.remove();
      if (t.gm && typeof window.launchHofCeremony === 'function') { try { window.launchHofCeremony('gm-ellis', t.title); } catch (e) {} }
      else { try { if (typeof resumeBGM === 'function') resumeBGM(); } catch (e) {} }
    };
    document.body.appendChild(ov);
    try { const a = new Audio('hof_fanfare.mp3'); a.volume = 0.8; a.play().catch(() => {}); } catch (e) {}
    histLog(`🏆 NEW TROPHY: ${t.title}${whoName ? ' for ' + whoName : ''}!`, 'title-change');
  }
  window.ewfTrophyTest = n => showTrophy(TROPHIES.find(t => t.n === n), byIdW('default-therock'));

  /* ==========================================================================
     INIT
     ========================================================================== */
  function init() {
    ensureStyles();
    load(); // migrate the old single slot straight away
    wrapBookShow();
    ['sanctionStorylineForNextBroadcast', 'sanctionBloodFeudForNextBroadcast', 'executeCareerContractSanction', 'resolveCommentaryRedemptionChoice'].forEach(guard);
    setInterval(() => { try { relabelSaveButtons(); } catch (e) {} }, 700);
    migrateHardcore();
    probeLogo('Hardcore Match', 'hardcorematch.png');
    probeLogo(ELIM, 'elimination_match.png');
    try { if (!matchTypeLogos[ELIM]) matchTypeLogos[ELIM] = 'survivor_logo.png'; } catch (e) {}
    matchStyles();
    wrapPostProcess();
    wrapCutsceneQueue();
    wrapStartEntrances();
    wrapWinnerList();
    wrapPads();
    watchBanners();
    wrapGridIcons();
    wrapFirstChamp();
    setInterval(() => { try { trophyPoll(); } catch (e) {} }, 2000);
    try { tidyCardIcons(); } catch (e) {}
    wrapStopwatch();
    wrapLive();
    wrapTick16();
    if (typeof window.ewf16Init === 'function') window.ewf16Init();
  }
  window.EWF16 = { load, save, priority, BK_CAP };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));
  else setTimeout(init, 0);
})();
