/* ==========================================================================
   ELLIS'S MAIN EVENT (EWF UNIVERSE) - MODULAR ENGINE
   MODULE 5 OF 5: js/5-match-engine.js (PART 1 OF 4)
   Match Booking, Fullscreen, Show Generator, Roulette & Match Cards
   ========================================================================== */

/* --------------------------------------------------------------------------
   0. POST-MATCH FIFO MODAL QUEUE, SHOW SESSION GUARD & FULLSCREEN
   -------------------------------------------------------------------------- */
window.postMatchEventQueue = window.postMatchEventQueue || [];
window.isProcessingPostMatchQueue = false;

// THE SESSION GUARD: Locks out non-priority cutscenes while a show is running
window.activeShowSession = null; 
window.showDeferredFalloutQueue = [];
window.armedAmbushWrestler = null;
window.pendingMediaScrum = null;
window.pendingEightLossRedemption = null;

if (typeof window.setElDisplay !== 'function') {
  window.setElDisplay = function(idOrEl, displayVal) {
    if (!idOrEl) return;
    const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
    if (el && el.style) {
      el.style.display = displayVal;
    }
  };
}

if (typeof window.getShowLogo !== 'function') {
  window.getShowLogo = function(showKey) {
    if (!showKey || showKey === 'none') return 'logo_notext.png';
    return `${showKey}_logo.png`;
  };
}

function enqueuePostMatchEvent(eventFn, bypassShowDefer = false) {
  if (window.activeShowSession && !bypassShowDefer) {
    window.showDeferredFalloutQueue.push(eventFn);
    return;
  }
  window.postMatchEventQueue.push(eventFn);
  if (!window.isProcessingPostMatchQueue) {
    processNextPostMatchEvent();
  }
}

function processNextPostMatchEvent() {
  if (window.postMatchEventQueue.length > 0) {
    window.isProcessingPostMatchQueue = true;
    const nextEvent = window.postMatchEventQueue.shift();
    if (typeof nextEvent === 'function') nextEvent();
  } else {
    window.isProcessingPostMatchQueue = false;
  }
}
window.enqueuePostMatchEvent = enqueuePostMatchEvent;
window.processNextPostMatchEvent = processNextPostMatchEvent;

let hasRequestedInitialFullscreen = false;
function requestAppFullscreen() {
  if (hasRequestedInitialFullscreen) return;
  hasRequestedInitialFullscreen = true;
  try {
    const el = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    }
  } catch (e) {}
}
document.body.addEventListener('click', requestAppFullscreen, { once: true });
document.body.addEventListener('touchstart', requestAppFullscreen, { once: true });

function toggleAppFullscreen() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
}
window.toggleAppFullscreen = toggleAppFullscreen;

function ensureSkipIntroBtnPosition() {
  const skipBtn = document.getElementById('skipIntroOverlayBtn');
  if (skipBtn) {
    skipBtn.style.setProperty('position', 'fixed', 'important');
    skipBtn.style.setProperty('bottom', '30px', 'important');
    skipBtn.style.setProperty('right', '30px', 'important');
    skipBtn.style.setProperty('top', 'auto', 'important');
    skipBtn.style.setProperty('left', 'auto', 'important');
    skipBtn.style.setProperty('z-index', '2147483647', 'important');
  }
}

/* --------------------------------------------------------------------------
   1. BOOK A SHOW: GENERATOR & BROADCAST HUB
   -------------------------------------------------------------------------- */
window.openBookShowModal = function() {
  if (typeof ensureRosterReady === 'function' && !ensureRosterReady(2)) return; // BATCH 7 ITEM 14
  const modal = document.getElementById('bookShowModal');
  const grid = document.getElementById('bookShowGrid');
  if (!modal || !grid) return;

  // BATCH 6 ITEM 3: Hide top-left home button in Book a Show mode
  setElDisplay('gmHeaderHomeBtn', 'none');

  grid.innerHTML = '';
  const gmLevel = (typeof getGMLevel === 'function') ? getGMLevel() : 1;
  
  showKeys.forEach(key => {
    const lock = (typeof isShowLocked === 'function') ? isShowLocked(key) : { locked: false };
    const tile = document.createElement('div');
    tile.className = lock.locked ? 'book-show-brand-tile is-locked' : 'book-show-brand-tile';
    
    let tierText = '';
    if (key === 'raw' || key === 'smackdown') tierText = '📺 TV SPECIAL (2 BOUTS)';
    else if (key === 'summerslam' || key === 'mania') tierText = '🔥 HUGE EVENT (4 BOUTS)';
    else if (key === 'kotr') tierText = '👑 KOTR TOURNAMENT (4 BOUTS)';
    else if (key === 'rumble') tierText = '🥊 ROYAL RUMBLE (2 BOUTS)';
    else if (key === 'badblood') tierText = '💢 GRUDGE NIGHT (3 BOUTS)';
    else if (key === 'judgmentday') tierText = '⚖️ GOOD VS BAD (3 BOUTS)';
    else if (key === 'nomercy') tierText = '🚫 NO DQ NIGHT (3 BOUTS)';
    else tierText = '🌐 BIG EVENT (3 BOUTS)';

    const showLabel = (typeof getShowName === 'function') ? getShowName(key) : key;
    // BATCH 11 ITEM 3: locked shows are a mystery - no name, no logo
    tile.innerHTML = lock.locked ? `
      <div style="height:70px; display:flex; align-items:center; justify-content:center; font-family:'Russo One', sans-serif; font-size:2.6rem; color:#ffd700; text-shadow:0 0 18px rgba(255,215,0,0.6);">❓</div>
      <div style="text-align:center;">
        <div class="book-show-brand-name">???</div>
        <div class="book-show-brand-tier">${lock.code ? '🎁 NEEDS A SPECIAL CODE' : '🔒 TOP SECRET: LVL ' + lock.req}</div>
      </div>
    ` : `
      <img src="${(typeof getShowLogo === 'function') ? getShowLogo(key) : key + '_logo.png'}" alt="${showLabel}" onerror="this.outerHTML='<div style=\\'height:70px; display:flex; align-items:center; justify-content:center; font-family:Russo One; font-size:1.3rem; color:#fff;\\'>${showLabel}</div>'">
      <div style="text-align:center;">
        <div class="book-show-brand-name">${showLabel}</div>
        <div class="book-show-brand-tier">${tierText}</div>
      </div>
    `;

    if (!lock.locked) {
      tile.onclick = () => window.generateShowCard(key);
    } else {
      tile.onclick = () => {
        try { const audio = typeof anvilSlamSound !== 'undefined' ? anvilSlamSound : new Audio('anvil.mp3'); audio.currentTime = 0; audio.play().catch(() => {}); } catch(e){}
        alert(lock.code ? `🎁 TOP SECRET SHOW!\n\nThis one needs a special code. Maybe it comes with a present...` : `🔒 TOP SECRET SHOW!\n\nThis show unlocks at Level ${lock.req}. What could it be?`);
      };
    }
    grid.appendChild(tile);
  });

  modal.style.display = 'flex';
};

window.closeBookShowModal = function() {
  setElDisplay('bookShowModal', 'none');
  // BATCH 6 ITEM 3: Restore top-left home button when closing Book a Show modal (unless an active show is running)
  if (!window.activeShowSession) {
    setElDisplay('gmHeaderHomeBtn', 'flex');
  }
};

// AUTO-BOOKING ENGINE
window.generateShowCard = function(showKey) {
  try { const audio = typeof titleClinkSound !== 'undefined' ? titleClinkSound : new Audio('title_clink.mp3'); audio.currentTime = 0; audio.play().catch(() => {}); } catch(e){}
  setElDisplay('bookShowModal', 'none');
  setElDisplay('gmHeaderHomeBtn', 'none');

  const allW = (typeof getUnlockedWrestlers === 'function') ? getUnlockedWrestlers() : (typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : []);
  const activeW = allW.filter(w => !(typeof getInjuryRecord === 'function' && getInjuryRecord(w.id)));
  const contenderLocks = (typeof getContenderTitleShotLocks === 'function') ? getContenderTitleShotLocks() : [];
  
  let isTv = (showKey === 'raw' || showKey === 'smackdown');
  let isBig = (showKey === 'summerslam' || showKey === 'mania');
  let isKotr = (showKey === 'kotr');
  let isRumble = (showKey === 'rumble');
  let isMitb = (showKey === 'mitb');

  let targetMatchCount = isTv ? 2 : (isBig ? 4 : (isKotr ? 4 : (isRumble ? 2 : 3)));
  let availableMatches = Math.floor(activeW.length / 2);
  let actualMatchCount = Math.min(targetMatchCount, availableMatches);

  // BATCH 7 ITEM 9: KOTR unlocks at Level 8 but the roster is only 5 until Kane arrives at Level 10,
  // so it could never be booked. It now needs 4 (the tournament); the opener is added when there are 6+.
  if (isKotr && activeW.length < 4) {
    if (!window.activeShowSession) setElDisplay('gmHeaderHomeBtn', 'flex');
    alert("King of the Ring requires at least 4 active, uninjured superstars for the tournament. Check the Medical Ward.");
    return;
  }
  
  if (isMitb && activeW.length < 4) {
    if (!window.activeShowSession) setElDisplay('gmHeaderHomeBtn', 'flex');
    alert("Money in the Bank requires at least 4 active superstars to generate the card.");
    return;
  }
  
  if (isRumble && activeW.length < 4) {
    if (!window.activeShowSession) setElDisplay('gmHeaderHomeBtn', 'flex');
    alert("The Royal Rumble requires at least 4 active, uninjured superstars. Check the Medical Ward.");
    return;
  }

  if (actualMatchCount < 1) {
    if (!window.activeShowSession) setElDisplay('gmHeaderHomeBtn', 'flex');
    alert("Not enough active superstars to book a show! Check the Medical Ward.");
    return;
  }

  let bouts = [];
  let draftedIds = [];
  let rivalries = (typeof getRivalries === 'function') ? getRivalries() : [];
  rivalries = [...rivalries].sort(() => Math.random() - 0.5);
  
  const titles = (typeof getTitleHolders === 'function') ? getTitleHolders() : {};
  const alliances = (typeof getAlliances === 'function') ? getAlliances() : [];

  const getStip = (isTvFlag, isMainEventFlag) => {
    let roll = Math.random();
    if (isTvFlag) {
      if (roll < 0.80) return 'Normal Match';
      if (roll < 0.85) return 'Submission Match';
      if (roll < 0.90) return 'Special Guest Referee';
      if (roll < 0.95) return 'Ladder Match';
      return 'Tables Match';
    } else if (isBig) {
      if (roll < 0.30) return Math.random() < 0.5 ? 'TLC Match' : 'Ladder Match';
      if (roll < 0.60) return Math.random() < 0.5 ? 'Ambulance Match' : 'Last Man Standing';
      if (roll < 0.85) return Math.random() < 0.5 ? 'No Disqualification' : 'Falls Count Anywhere';
      return '2 out of 3 Falls';
    } else {
      if (roll < 0.30) return 'Normal Match';
      if (roll < 0.55) return 'No Disqualification';
      if (roll < 0.75) return 'Falls Count Anywhere';
      return 'Tables Match';
    }
  };

  let scheduledStory = null;
  let reservedStoryBout = null;
  try {
    const raw = localStorage.getItem('ewf_scheduled_story_match');
    if (raw) scheduledStory = JSON.parse(raw);
  } catch(e){}

  // BATCH 7 ITEM 9: With fewer than 6 superstars, KOTR and the Rumble skip the opener, so keep any
  // scheduled storyline contract for the next show instead of using it up here.
  const skipOpener = (isKotr || isRumble) && activeW.length < 6;
  if (skipOpener) scheduledStory = null;

  if (scheduledStory && scheduledStory.w1 && scheduledStory.w2) {
    const sw1 = activeW.find(w => w.id === scheduledStory.w1.id);
    const sw2 = activeW.find(w => w.id === scheduledStory.w2.id);
    if (sw1 && sw2) {
      draftedIds.push(sw1.id, sw2.id);
      reservedStoryBout = {
        order: 'MAIN EVENT',
        matchType: scheduledStory.matchType || 'Normal Match',
        formatKey: scheduledStory.formatKey || '1v1',
        participants: [sw1, sw2],
        isTitleMatch: !!scheduledStory.isTitleMatch,
        titleCode: scheduledStory.isTitleMatch ? (scheduledStory.titleCode || 'whc') : null,
        titleName: scheduledStory.isTitleMatch ? (scheduledStory.titleName || 'World Heavyweight Championship') : null,
        titleImg: scheduledStory.isTitleMatch ? (scheduledStory.titleImg || 'whc.png') : null,
        isCareerMatch: !!scheduledStory.isCareerMatch,
        feudStake: scheduledStory.feudStake || '📋 STORYLINE GRUDGE MATCH',
        isSanctionedContract: true,
        referee: null,
        status: 'pending',
        rating: 0
      };
      localStorage.removeItem('ewf_scheduled_story_match');
    } else {
      localStorage.removeItem('ewf_scheduled_story_match');
    }
  }

  let surplus = Math.max(0, activeW.length - (actualMatchCount * 2));
  
  // SPECIAL FORMATTING FOR ROYAL RUMBLE
  if (isRumble) {
    let bout1 = null;
    if (skipOpener) {
      bout1 = null;
    } else if (reservedStoryBout) {
      reservedStoryBout.order = 'OPENER';
      bout1 = reservedStoryBout;
    } else {
      let pool = activeW.filter(w => !draftedIds.includes(w.id));
      bout1 = { order: 'OPENER', matchType: 'Normal Match', formatKey: '1v1', participants: [], isTitleMatch: false, titleCode: null, titleName: null, titleImg: null, status: 'pending', rating: 0 };
      let p1 = null, p2 = null;
      
      if (titles.whc && pool.some(w => w.id === titles.whc)) {
        p1 = pool.find(w => w.id === titles.whc);
        p2 = pool.find(w => w.id !== p1.id && contenderLocks.includes(w.id));
        if (!p2) p2 = pool.find(w => w.id !== p1.id && (typeof getWrestlerMomentum === 'function' && getWrestlerMomentum(w.id).status === 'fire'));
        if (!p2) p2 = pool.find(w => w.id !== p1.id && (typeof getWrestlerMomentum === 'function' && getWrestlerMomentum(w.id).status !== 'ice'));
        
        if (p1 && p2) {
          bout1.isTitleMatch = true; bout1.titleCode = 'whc'; bout1.titleName = 'World Heavyweight Championship'; bout1.titleImg = 'whc.png';
          if (contenderLocks.includes(p2.id) && typeof clearContenderTitleShotLock === 'function') {
            clearContenderTitleShotLock(p2.id);
            bout1.feudStake = '⭐ #1 CONTENDER LOCK CASH-IN';
          }
        } else { p1 = null; p2 = null; }
      }
      
      if (!p1 && titles.ic && pool.some(w => w.id === titles.ic)) {
        p1 = pool.find(w => w.id === titles.ic);
        p2 = pool.find(w => w.id !== p1.id && contenderLocks.includes(w.id));
        if (!p2) p2 = pool.find(w => w.id !== p1.id && (typeof getWrestlerMomentum === 'function' && getWrestlerMomentum(w.id).status === 'fire'));
        if (!p2) p2 = pool.find(w => w.id !== p1.id && (typeof getWrestlerMomentum === 'function' && getWrestlerMomentum(w.id).status !== 'ice'));
        
        if (p1 && p2) {
          bout1.isTitleMatch = true; bout1.titleCode = 'ic'; bout1.titleName = 'Intercontinental Championship'; bout1.titleImg = 'ic_title.png';
          if (contenderLocks.includes(p2.id) && typeof clearContenderTitleShotLock === 'function') {
            clearContenderTitleShotLock(p2.id);
            bout1.feudStake = '⭐ #1 CONTENDER LOCK CASH-IN';
          }
        } else { p1 = null; p2 = null; }
      }
      
      if (!p1) {
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        p1 = shuffled[0]; p2 = shuffled[1];
      }
      
      bout1.participants = [p1, p2];
      draftedIds.push(p1.id, p2.id);
    }
    if (bout1) bouts.push(bout1);
    
    let pool = activeW.filter(w => !draftedIds.includes(w.id));
    let rumbleBout = { order: 'MAIN EVENT', matchType: 'Royal Rumble Match', formatKey: 'rumble', participants: pool, isTitleMatch: false, status: 'pending', rating: 0 };
    bouts.push(rumbleBout);
    actualMatchCount = bouts.length;
  }
  // SPECIAL FORMATTING FOR KING OF THE RING
  else if (isKotr) {
    let bout1 = null;
    if (skipOpener) {
      bout1 = null;
    } else if (reservedStoryBout) {
      reservedStoryBout.order = 'OPENER';
      bout1 = reservedStoryBout;
    } else {
      let pool = activeW.filter(w => !draftedIds.includes(w.id));
      let shuffled = [...pool].sort(() => Math.random() - 0.5);
      let p1 = null, p2 = null;
      if (titles.ic && pool.some(w => w.id === titles.ic)) {
        p1 = pool.find(w => w.id === titles.ic);
        p2 = pool.find(w => w.id !== p1.id && contenderLocks.includes(w.id));
        if (!p2) p2 = pool.find(w => w.id !== p1.id && (typeof getWrestlerMomentum === 'function' && getWrestlerMomentum(w.id).status === 'fire'));
        if (!p2) p2 = pool.find(w => w.id !== p1.id && (typeof getWrestlerMomentum === 'function' && getWrestlerMomentum(w.id).status !== 'ice'));
      }
      if (!p1 || !p2) { p1 = shuffled[0]; p2 = shuffled[1]; }
      const isIcDef = (titles.ic === p1.id);
      bout1 = { order: 'OPENER', matchType: 'Normal Match', formatKey: '1v1', participants: [p1, p2], isTitleMatch: isIcDef, titleCode: 'ic', titleName: 'Intercontinental Championship', titleImg: 'ic_title.png', status: 'pending', rating: 0 };
      if (isIcDef && contenderLocks.includes(p2.id) && typeof clearContenderTitleShotLock === 'function') {
        clearContenderTitleShotLock(p2.id);
        bout1.feudStake = '⭐ #1 CONTENDER LOCK CASH-IN';
      }
      draftedIds.push(p1.id, p2.id);
    }
    if (bout1) bouts.push(bout1);
    
    let pool = activeW.filter(w => !draftedIds.includes(w.id));
    let shuffled = [...pool].sort(() => Math.random() - 0.5);
    let sf1P1 = shuffled[0], sf1P2 = shuffled[1];
    let sf2P1 = shuffled[2], sf2P2 = shuffled[3];
    
    bouts.push({ order: 'SEMI-FINAL', matchType: 'Normal Match', formatKey: '1v1', participants: [sf1P1, sf1P2], isTitleMatch: false, status: 'pending', rating: 0 });
    bouts.push({ order: 'SEMI-FINAL', matchType: 'Normal Match', formatKey: '1v1', participants: [sf2P1, sf2P2], isTitleMatch: false, status: 'pending', rating: 0 });
    bouts.push({ order: 'MAIN EVENT', matchType: 'Normal Match', formatKey: '1v1', participants: [], isTitleMatch: false, feudStake: '👑 KOTR TOURNAMENT FINAL', status: 'pending', rating: 0 });
    actualMatchCount = bouts.length;
  }
  // STANDARD TV / PLE / MITB BOOKING LOOP
  else {
    let titlesToBook = [];
    // BATCH 9 ITEM 6: about 1 in 3 Raw/SmackDown cards get a title defence, mostly midcard/tag gold,
    // with a small chance of the World title for a TV shock. Vacant titles can be crowned on TV too.
    if (isTv && ((typeof getGMLevel === 'function') ? getGMLevel() : 1) >= 2 && Math.random() < 0.34) {
      const tvPool = [];
      const tvTitle = (code, name, img, holderId) => holderId ? { code, name, img, id: holderId, format: '1v1' } : { code, name, img, id: null, format: '1v1', vacant: true };
      tvPool.push(tvTitle('ic', 'Intercontinental Championship', 'ic_title.png', titles.ic));
      tvPool.push(tvTitle('hardcore', 'Hardcore Championship', 'hardcore.png', titles.hardcore));
      if (titles.tag1 && titles.tag2) tvPool.push({ code: 'tag', name: 'World Tag Team Championship', img: 'tag_title.png', id: [titles.tag1, titles.tag2], format: 'tag' });
      else if (!titles.tag1 && !titles.tag2) tvPool.push({ code: 'tag', name: 'World Tag Team Championship', img: 'tag_title.png', id: null, format: 'tag', vacant: true });
      if (Math.random() < 0.12) tvPool.push(tvTitle('whc', 'World Heavyweight Championship', 'whc.png', titles.whc));
      titlesToBook.push(tvPool[Math.floor(Math.random() * tvPool.length)]);
    }
    if (!isTv) {
      // BATCH 7 ITEM 8: Vacant titles (no champion yet) are now booked too, once championships unlock at GM Level 2,
      // so a Book a Show career can crown its first champions instead of never having belts on the line.
      const titlesUnlocked = ((typeof getGMLevel === 'function') ? getGMLevel() : 1) >= 2;
      if (titles.whc) titlesToBook.push({code: 'whc', name: 'World Heavyweight Championship', img: 'whc.png', id: titles.whc, format: '1v1'});
      else if (titlesUnlocked) titlesToBook.push({code: 'whc', name: 'World Heavyweight Championship', img: 'whc.png', id: null, format: '1v1', vacant: true});
      if (titles.ic) titlesToBook.push({code: 'ic', name: 'Intercontinental Championship', img: 'ic_title.png', id: titles.ic, format: '1v1'});
      else if (titlesUnlocked) titlesToBook.push({code: 'ic', name: 'Intercontinental Championship', img: 'ic_title.png', id: null, format: '1v1', vacant: true});
      if (titles.hardcore) titlesToBook.push({code: 'hardcore', name: 'Hardcore Championship', img: 'hardcore.png', id: titles.hardcore, format: '1v1'});
      else if (titlesUnlocked) titlesToBook.push({code: 'hardcore', name: 'Hardcore Championship', img: 'hardcore.png', id: null, format: '1v1', vacant: true});
      if (titles.tag1 && titles.tag2) titlesToBook.push({code: 'tag', name: 'World Tag Team Championship', img: 'tag_title.png', id: [titles.tag1, titles.tag2], format: 'tag'});
      else if (titlesUnlocked && !titles.tag1 && !titles.tag2) titlesToBook.push({code: 'tag', name: 'World Tag Team Championship', img: 'tag_title.png', id: null, format: 'tag', vacant: true});
    }

    const slotArray = new Array(actualMatchCount).fill(null);
    const getOrderLabel = (slotIdx) => {
      if (slotIdx === actualMatchCount - 1) return 'MAIN EVENT';
      if (slotIdx === actualMatchCount - 2 && actualMatchCount >= 3) return 'CO-MAIN';
      if (slotIdx === 0) return 'OPENER';
      return 'MIDCARD';
    };

    if (isMitb) {
      const meIdx = actualMatchCount - 1;
      let pool = activeW.filter(w => !draftedIds.includes(w.id));
      
      if (pool.length >= 5 && !reservedStoryBout) {
        let opP1 = null, opP2 = null;
        if (titles.ic && pool.some(w => w.id === titles.ic)) {
          opP1 = pool.find(w => w.id === titles.ic);
          opP2 = pool.find(w => w.id !== opP1.id && contenderLocks.includes(w.id));
          if (!opP2) opP2 = pool.find(w => w.id !== opP1.id && (typeof getWrestlerMomentum === 'function' && getWrestlerMomentum(w.id).status === 'fire'));
          if (!opP2) opP2 = pool.find(w => w.id !== opP1.id && (typeof getWrestlerMomentum === 'function' && getWrestlerMomentum(w.id).status !== 'ice'));
        }
        if (!opP1 || !opP2) {
          const shuf = [...pool].sort(() => Math.random() - 0.5);
          opP1 = shuf[0];
          opP2 = shuf[1];
        }
        
        const isIcDef = (titles.ic === opP1.id);
        slotArray[0] = {
          order: 'OPENER',
          matchType: 'Normal Match',
          formatKey: '1v1',
          participants: [opP1, opP2],
          isTitleMatch: isIcDef,
          titleCode: isIcDef ? 'ic' : null,
          titleName: isIcDef ? 'Intercontinental Championship' : null,
          titleImg: isIcDef ? 'ic_title.png' : null,
          referee: null,
          status: 'pending',
          rating: 0
        };
        if (isIcDef && contenderLocks.includes(opP2.id) && typeof clearContenderTitleShotLock === 'function') {
          clearContenderTitleShotLock(opP2.id);
          slotArray[0].feudStake = '⭐ #1 CONTENDER LOCK CASH-IN';
        }
        draftedIds.push(opP1.id, opP2.id);
        pool = activeW.filter(w => !draftedIds.includes(w.id));
      }
      
      let mitbSize = Math.min(6, pool.length);
      if (mitbSize < 3) {
        if (!window.activeShowSession) setElDisplay('gmHeaderHomeBtn', 'flex');
        alert("Not enough uninjured superstars to book the Money in the Bank match. Consider healing some roster members.");
        return;
      }
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const champIds = [titles.whc, titles.ic, titles.hardcore, titles.tag1, titles.tag2].filter(Boolean);
      const contenders = shuffled.filter(w => !champIds.includes(w.id));
      const finalPool = contenders.length >= mitbSize ? contenders : shuffled;
      const mitbParticipants = finalPool.slice(0, mitbSize);
      mitbParticipants.forEach(p => draftedIds.push(p.id));

      slotArray[meIdx] = {
        order: 'MAIN EVENT',
        matchType: 'Money in the Bank',
        formatKey: 'mitb',
        participants: mitbParticipants,
        isTitleMatch: false,
        titleCode: null,
        titleName: null,
        titleImg: null,
        feudStake: '💼 MONEY IN THE BANK LADDER MATCH',
        referee: null,
        status: 'pending',
        rating: 0
      };
    }

    if (reservedStoryBout) {
      for (let s = actualMatchCount - 1; s >= 0; s--) {
        if (!slotArray[s]) {
          reservedStoryBout.order = getOrderLabel(s);
          slotArray[s] = reservedStoryBout;
          break;
        }
      }
    }

    for (let i = actualMatchCount - 1; i >= 0; i--) {
      if (slotArray[i]) continue;

      const isMainEvent = (i === actualMatchCount - 1);
      let bout = {
        order: getOrderLabel(i),
        matchType: getStip(isTv, isMainEvent),
        formatKey: '1v1',
        participants: [],
        isTitleMatch: false,
        titleCode: null,
        titleName: null,
        titleImg: null,
        referee: null,
        status: 'pending',
        rating: 0
      };

      let p1 = null, p2 = null, p3 = null, p4 = null;
      let pool = activeW.filter(w => !draftedIds.includes(w.id));

      if (!p1 && !p2 && titlesToBook.length > 0) {
        while (titlesToBook.length > 0 && !p1) {
          const nextTitle = titlesToBook.shift();
          // BATCH 7 ITEM 8: Vacant title, book the two hottest available superstars (or two teams) for it
          if (nextTitle.vacant) {
            const notIce = (w) => (typeof getWrestlerMomentum === 'function') ? getWrestlerMomentum(w.id).status !== 'ice' : true;
            const byMomentum = (a, b) => (typeof calculateMomentum === 'function') ? calculateMomentum(b.id) - calculateMomentum(a.id) : 0;
            if (nextTitle.format === '1v1' && pool.length >= 2) {
              let top = pool.filter(notIce).sort(byMomentum).slice(0, 4);
              if (top.length < 2) top = [...pool].sort(() => Math.random() - 0.5);
              top = top.sort(() => Math.random() - 0.5);
              p1 = top[0]; p2 = top[1];
              bout.isTitleMatch = true;
              bout.titleCode = nextTitle.code;
              bout.titleName = nextTitle.name;
              bout.titleImg = nextTitle.img;
            } else if (nextTitle.format === 'tag' && pool.length >= 4 && (!isMainEvent || isTv)) {
              // Prefer real alliances as the teams, then fill with random pairs
              const inPool = id => pool.some(w => w.id === id);
              const teams = alliances.filter(al => inPool(al.p1) && inPool(al.p2)).sort(() => Math.random() - 0.5)
                .map(al => [pool.find(w => w.id === al.p1), pool.find(w => w.id === al.p2)]);
              const used = new Set();
              const picked = [];
              teams.forEach(t => { if (picked.length < 2 && !used.has(t[0].id) && !used.has(t[1].id)) { picked.push(t); used.add(t[0].id); used.add(t[1].id); } });
              const rest = pool.filter(w => !used.has(w.id)).sort(() => Math.random() - 0.5);
              while (picked.length < 2 && rest.length >= 2) picked.push([rest.shift(), rest.shift()]);
              p1 = picked[0][0]; p2 = picked[0][1]; p3 = picked[1][0]; p4 = picked[1][1];
              bout.formatKey = 'tag';
              bout.matchType = 'Normal Tag Match';
              bout.isTitleMatch = true;
              bout.titleCode = nextTitle.code;
              bout.titleName = nextTitle.name;
              bout.titleImg = nextTitle.img;
            }
            continue;
          }
          if (nextTitle.format === '1v1' && pool.some(w => w.id === nextTitle.id)) {
            p1 = pool.find(w => w.id === nextTitle.id);
            const locks = typeof getMandatoryLocks === 'function' ? getMandatoryLocks() : {};
            
            // Prioritize #1 Contender Title Shot Locks, then Rumble/KOTR locks, then On Fire streaks
            p2 = pool.find(w => w.id !== p1.id && contenderLocks.includes(w.id));
            if (!p2) p2 = pool.find(w => w.id !== p1.id && ((nextTitle.code === 'whc' && locks.rumbleWhc === w.id) || (nextTitle.code === 'ic' && locks.kotrIc === w.id)));
            if (!p2) p2 = pool.find(w => w.id !== p1.id && typeof getWrestlerMomentum === 'function' && getWrestlerMomentum(w.id).status === 'fire');
            
            if (!p2) {
              const validContenders = pool.filter(w => w.id !== p1.id && (typeof getWrestlerMomentum === 'function' ? getWrestlerMomentum(w.id).status !== 'ice' : true));
              if (validContenders.length > 0) {
                p2 = validContenders.sort((a,b) => calculateMomentum(b.id) - calculateMomentum(a.id))[0];
              }
            }
            
            if (p1 && p2) {
              bout.isTitleMatch = true;
              bout.titleCode = nextTitle.code;
              bout.titleName = nextTitle.name;
              bout.titleImg = nextTitle.img;
              if (contenderLocks.includes(p2.id) && typeof clearContenderTitleShotLock === 'function') {
                clearContenderTitleShotLock(p2.id);
                bout.feudStake = '⭐ #1 CONTENDER LOCK CASH-IN';
              }
            } else {
              p1 = null; p2 = null;
            }
          } else if (nextTitle.format === 'tag' && pool.some(w => w.id === nextTitle.id[0]) && pool.some(w => w.id === nextTitle.id[1])) {
            let team1 = [pool.find(w => w.id === nextTitle.id[0]), pool.find(w => w.id === nextTitle.id[1])];
            let team2 = null;
            
            if (alliances.length > 0) {
              const validAlliances = alliances.filter(al => pool.some(w => w.id === al.p1) && pool.some(w => w.id === al.p2) && al.p1 !== team1[0].id && al.p2 !== team1[0].id);
              if (validAlliances.length > 0) {
                const chosenAl = validAlliances[Math.floor(Math.random() * validAlliances.length)];
                team2 = [pool.find(w => w.id === chosenAl.p1), pool.find(w => w.id === chosenAl.p2)];
              }
            }
            
            if (!team2) {
              const oppPool = pool.filter(w => w.id !== team1[0].id && w.id !== team1[1].id).sort(() => Math.random() - 0.5);
              if (oppPool.length >= 2) team2 = [oppPool[0], oppPool[1]];
            }
            
            if (team1 && team2) {
              p1 = team1[0]; p2 = team1[1]; p3 = team2[0]; p4 = team2[1];
              bout.formatKey = 'tag';
              bout.matchType = 'Normal Tag Match';
              bout.isTitleMatch = true;
              bout.titleCode = nextTitle.code;
              bout.titleName = nextTitle.name;
              bout.titleImg = nextTitle.img;
            } else {
              p1 = null; p2 = null; p3 = null; p4 = null;
            }
          }
        }
      }

      if (!p1 || !p2) {
        const skipRivalry = (isTv && Math.random() < 0.35);
        if (!skipRivalry) {
          const heatThreshold = isMainEvent ? 2 : 1;
          const validRivalries = rivalries.filter(r => r.heat >= heatThreshold && pool.some(w => w.id === r.w1) && pool.some(w => w.id === r.w2));
          if (validRivalries.length > 0) {
            const riv = validRivalries[0];
            const cornerRoll = Math.random() < 0.5;
            p1 = pool.find(w => w.id === (cornerRoll ? riv.w1 : riv.w2));
            p2 = pool.find(w => w.id === (cornerRoll ? riv.w2 : riv.w1));
            
            if (riv.heat === 3) bout.feudStake = '💀 TIER 3 BLOOD FEUD BLOWOFF';
            else bout.feudStake = '🔥 GRUDGE MATCH';
          }
        }
      }

      if (!p1 && !p2 && surplus >= 2 && !isMainEvent && Math.random() < 0.40) {
        let team1 = null; let team2 = null;
        if (alliances.length > 0) {
          const validAlliances = alliances.filter(al => pool.some(w => w.id === al.p1) && pool.some(w => w.id === al.p2));
          if (validAlliances.length > 0) {
            const chosenAl = validAlliances[Math.floor(Math.random() * validAlliances.length)];
            team1 = [pool.find(w => w.id === chosenAl.p1), pool.find(w => w.id === chosenAl.p2)];
          }
        }
        
        const poolShuffled = [...pool].sort(() => Math.random() - 0.5);
        if (!team1 && poolShuffled.length >= 2) { team1 = [poolShuffled[0], poolShuffled[1]]; }
        
        if (team1) {
          const oppPool = poolShuffled.filter(w => w.id !== team1[0].id && w.id !== team1[1].id);
          if (oppPool.length >= 2) {
            team2 = [oppPool[0], oppPool[1]];
            p1 = team1[0]; p2 = team1[1]; p3 = team2[0]; p4 = team2[1];
            bout.formatKey = 'tag';
            bout.matchType = 'Normal Tag Match';
            surplus -= 2;
          }
        }
      }

      if (!p1 && pool.length >= 2) {
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        p1 = shuffled[0];
        p2 = shuffled[1];
      }

      if (p1 && p2 && bout.formatKey === '1v1' && surplus > 0 && !isMainEvent && !bout.isTitleMatch && !bout.isSanctionedContract) {
        const oppPool = pool.filter(w => w.id !== p1.id && w.id !== p2.id);
        if (surplus >= 2 && oppPool.length >= 2 && Math.random() < 0.60) {
          p3 = oppPool[0]; p4 = oppPool[1];
          bout.formatKey = 'fatal';
          bout.matchType = `Fatal 4-Way ${bout.matchType}`;
          surplus -= 2;
        } 
        else if (oppPool.length >= 1) {
          p3 = oppPool[0];
          bout.formatKey = 'triple';
          bout.matchType = `Triple Threat ${bout.matchType}`;
          surplus -= 1;
        }
      }

      if (p1 && p2) {
        bout.participants = [p1, p2];
        draftedIds.push(p1.id, p2.id);
        
        if (p3) { bout.participants.push(p3); draftedIds.push(p3.id); }
        if (p4) { bout.participants.push(p4); draftedIds.push(p4.id); }
        
        if (bout.matchType === 'Special Guest Referee' && bout.formatKey === '1v1') {
          const refs = allW.filter(w => !draftedIds.includes(w.id));
          if (refs.length > 0) {
            bout.referee = refs[Math.floor(Math.random() * refs.length)];
            draftedIds.push(bout.referee.id);
          }
        }

        slotArray[i] = bout;
      }
    }

    bouts = slotArray.filter(Boolean);
    bouts.forEach((b, idx) => {
      if (idx === bouts.length - 1) b.order = 'MAIN EVENT';
      else if (idx === bouts.length - 2 && bouts.length >= 3) b.order = 'CO-MAIN';
      else if (idx === 0) b.order = 'OPENER';
      else b.order = 'MIDCARD';
    });
  }

  // BATCH 11: locked match types can't sneak onto a card, and the new shows get their themes
  if (typeof window.ewfPostProcessShowCard === 'function') {
    try { bouts = window.ewfPostProcessShowCard(showKey, bouts, activeW) || bouts; } catch (e) { console.warn(e); }
  }

  const showTitle = (typeof getShowName === 'function') ? getShowName(showKey) : showKey.toUpperCase();

  window.activeShowSession = {
    showKey: showKey,
    showName: showTitle,
    bouts: bouts,
    currentBoutIdx: 0,
    cumulativeStars: 0,
    completedBouts: 0,
    showFalloutLog: []
  };

  setElDisplay('gmProfileWidget', 'none');
  setElDisplay('bgmToggleBtn', 'none');
  setElDisplay('gmHeaderHomeBtn', 'none');

  try { const audio = typeof matchCardSlamSound !== 'undefined' ? matchCardSlamSound : new Audio('match_card_slam.mp3'); audio.currentTime = 0; audio.volume = 0.8; audio.play().catch(() => {}); } catch(e){}
  renderBookShowCardModal();
};

window.renderBookShowCardModal = function() {
  const modal = document.getElementById('bookShowCardModal');
  const container = document.getElementById('bookShowBoutsContainer');
  if (!modal || !container || !window.activeShowSession) return;

  setElDisplay('gmHeaderHomeBtn', 'none');
  const session = window.activeShowSession;
  
  const logoEl = document.getElementById('bookShowLogoImg');
  if (logoEl) logoEl.src = (typeof getShowLogo === 'function') ? getShowLogo(session.showKey) : session.showKey + '_logo.png';
  
  const titleEl = document.getElementById('bookShowTitleText');
  if (titleEl) titleEl.innerText = session.showName;
  
  const venueEl = document.getElementById('bookShowVenueSubtitle');
  if (venueEl) venueEl.innerText = `${session.bouts.length}-MATCH EVENT`;
  
  const progressEl = document.getElementById('bookShowProgressText');
  if (progressEl) progressEl.innerText = `BOUT ${Math.min(session.currentBoutIdx + 1, session.bouts.length)} OF ${session.bouts.length}`;
  
  const ratingEl = document.getElementById('bookShowLiveRating');
  if (ratingEl) {
    if (session.completedBouts === 0) {
      ratingEl.innerText = '★ 0.0 / 5.0 (0 RATED)';
    } else {
      const avg = (session.cumulativeStars / session.completedBouts).toFixed(1);
      ratingEl.innerText = `★ ${avg} / 5.0 (${session.completedBouts} RATED)`;
    }
  }

  const brandColors = {
    raw: { primary: '#d32f2f', secondary: '#7f0000' },
    smackdown: { primary: '#0066ff', secondary: '#002171' },
    summerslam: { primary: '#00e5ff', secondary: '#ff6600' },
    survivor: { primary: '#ff6600', secondary: '#990000' },
    kotr: { primary: '#9933ff', secondary: '#ffd700' },
    mania: { primary: '#ffd700', secondary: '#ffffff' },
    mitb: { primary: '#00cc66', secondary: '#ffd700' },
    backlash: { primary: '#ff2222', secondary: '#333344' },
    badblood: { primary: '#b71c1c', secondary: '#1a0000' },
    judgmentday: { primary: '#e0e0e0', secondary: '#4a148c' },
    nomercy: { primary: '#ff6d00', secondary: '#212121' }
  };
  const theme = (typeof window.ewfShowTheme === 'function' && window.ewfShowTheme(session.showKey)) || brandColors[session.showKey] || brandColors.raw; // BATCH 12: custom show colours
  
  const backdrop = document.getElementById('bookShowAmbientBackdrop');
  if (backdrop) {
    if (session.showKey === 'mania') backdrop.style.backgroundImage = `url('mania_bg.png'), url('show_bg.png')`;
    else if (session.showKey === 'summerslam') backdrop.style.backgroundImage = `url('summerslam_bg.png'), url('show_bg.png')`;
    else backdrop.style.backgroundImage = `url('show_bg.png')`;
    backdrop.style.boxShadow = `inset 0 0 150px ${theme.secondary}`;
  }

  container.innerHTML = '';
  session.bouts.forEach((bout, idx) => {
    const row = document.createElement('div');
    const isActive = idx === session.currentBoutIdx;
    const isCompleted = idx < session.currentBoutIdx;
    
    if (isCompleted) row.className = 'bs-bout-strip is-completed';
    else if (isActive) row.className = 'bs-bout-strip is-active';
    else row.className = 'bs-bout-strip is-locked';

    let orderClass = 'bsb-order-badge';
    if (bout.order === 'OPENER') orderClass += ' opener';
    else if (bout.order === 'MAIN EVENT') orderClass += ' mainevent';
    else if (bout.order === 'CO-MAIN') orderClass += ' comain';
    else orderClass += ' midcard';

    let stakeHtml = '';
    if (bout.isTitleMatch) stakeHtml = `<div class="bsb-stake-ribbon"><img src="${bout.titleImg}" style="height:14px; filter:drop-shadow(0 0 4px #000);"> ${bout.titleName} ON LINE</div>`;
    else if (bout.feudStake) stakeHtml = `<div class="bsb-stake-ribbon" style="color:#ff3333;">💀 ${bout.feudStake}</div>`;
    else if (bout.referee) stakeHtml = `<div class="bsb-stake-ribbon" style="color:#00ffcc;">👔 GUEST REF: ${bout.referee.name.toUpperCase()}</div>`;
    else if (bout.isSanctionedContract) stakeHtml = `<div class="bsb-stake-ribbon" style="color:#ffd700;">📋 BOOKED BY GM ELLIS</div>`;

    let p1Status = '', p2Status = '', p3Status = '', p4Status = '', p5Status = '', p6Status = '';
    let hasW1 = bout.participants.length > 0 && bout.participants[0];
    let hasW2 = bout.participants.length > 1 && bout.participants[1];
    let hasW3 = bout.participants.length > 2 && bout.participants[2];
    let hasW4 = bout.participants.length > 3 && bout.participants[3];
    let hasW5 = bout.participants.length > 4 && bout.participants[4];
    let hasW6 = bout.participants.length > 5 && bout.participants[5];
    
    if (hasW1 && isCompleted && bout.winnerId === bout.participants[0].id) p1Status = `<div style="color:#00ff66; font-size:0.6rem; font-weight:bold; position:absolute; top:-8px;">WINNER</div>`;
    if (hasW2 && isCompleted && bout.winnerId === bout.participants[1].id) p2Status = `<div style="color:#00ff66; font-size:0.6rem; font-weight:bold; position:absolute; top:-8px;">WINNER</div>`;
    if (hasW3 && isCompleted && bout.winnerId === bout.participants[2].id) p3Status = `<div style="color:#00ff66; font-size:0.6rem; font-weight:bold; position:absolute; top:-8px;">WINNER</div>`;
    if (hasW4 && isCompleted && bout.winnerId === bout.participants[3].id) p4Status = `<div style="color:#00ff66; font-size:0.6rem; font-weight:bold; position:absolute; top:-8px;">WINNER</div>`;
    if (hasW5 && isCompleted && bout.winnerId === bout.participants[4].id) p5Status = `<div style="color:#00ff66; font-size:0.6rem; font-weight:bold; position:absolute; top:-8px;">WINNER</div>`;
    if (hasW6 && isCompleted && bout.winnerId === bout.participants[5].id) p6Status = `<div style="color:#00ff66; font-size:0.6rem; font-weight:bold; position:absolute; top:-8px;">WINNER</div>`;

    let actionHtml = '';
    if (isCompleted) {
      actionHtml = `
        <div class="bsb-result-stamp">
          <div>✓ BOUT CONCLUDED</div>
          <div class="bsb-rating-stars">${'★'.repeat(bout.rating)}${'☆'.repeat(5-bout.rating)}</div>
        </div>
      `;
    } else if (isActive) {
      actionHtml = `
        <button class="action-btn btn-gold" style="font-size:0.8rem; padding:8px 12px; margin-bottom:4px;" onclick="window.launchActiveShowBout(${idx})">▶ START BOUT ➔</button>
        ${(idx < session.bouts.length - 1 && bout.formatKey !== 'rumble' && bout.participants.filter(Boolean).length >= 2) ? `<button class="action-btn btn-red" style="font-size:0.68rem; padding:6px 10px; margin-bottom:4px;" onclick="window.openSimMatchChoice(${idx})">⚡ SIM MATCH</button>` : ''}
        ${bout.isSanctionedContract ? `<div style="font-size:0.65rem; color:#ffd700; margin-top:4px;">🔒 CONTRACT LOCKED</div>` : `<button class="action-btn btn-blue" style="font-size:0.68rem; padding:6px 10px;" onclick="window.shuffleBout(${idx})">🎲 REROLL BOUT</button>`}
      `;
    } else {
      actionHtml = `
        <div style="font-family:'Russo One', sans-serif; font-size:0.75rem; color:#888;">
          🔒 ON DECK (AWAITING BOUT ${idx + 1})
        </div>
        ${bout.isSanctionedContract ? `<div style="font-size:0.65rem; color:#ffd700; margin-top:4px;">🔒 CONTRACT LOCKED</div>` : `<button class="action-btn" style="font-size:0.68rem; padding:6px 10px; margin-top:6px; opacity:0.6;" onclick="window.shuffleBout(${idx})">🎲 REROLL</button>`}
      `;
    }

    let avatarsHtml = '';
    if (bout.formatKey === 'rumble') {
      avatarsHtml = `<div class="bsb-fighter-name" style="color:#ffd700; font-size:1.15rem; text-shadow:0 0 10px #ffd700; white-space:nowrap;">THE ROYAL RUMBLE</div>`;
    } else if (bout.formatKey === 'mitb') {
      avatarsHtml = `<div class="bsb-fighter-thumb-wrap">${p1Status}<img src="${bout.participants[0].image}" class="bsb-fighter-thumb" style="${isCompleted && bout.winnerId !== bout.participants[0].id ? 'filter:grayscale(1) brightness(0.4);' : ''}"></div>`;
      for(let i=1; i<bout.participants.length; i++) {
        const pStat = [p1Status, p2Status, p3Status, p4Status, p5Status, p6Status][i];
        avatarsHtml += `
          <div class="bsb-vs-badge" style="font-size:0.75rem; margin:0 2px;">VS</div>
          <div class="bsb-fighter-thumb-wrap">${pStat}<img src="${bout.participants[i].image}" class="bsb-fighter-thumb" style="${isCompleted && bout.winnerId !== bout.participants[i].id ? 'filter:grayscale(1) brightness(0.4);' : ''}"></div>
        `;
      }
    } else if (bout.formatKey === 'tag' && hasW4) {
      avatarsHtml = `
        <div class="bsb-fighter" style="margin-right:-8px;">
          <div class="bsb-fighter-thumb-wrap" style="z-index:2;">${p1Status}<img src="${bout.participants[0].image}" class="bsb-fighter-thumb" style="${isCompleted && bout.winnerId !== bout.participants[0].id ? 'filter:grayscale(1) brightness(0.4);' : ''}"></div>
          <div class="bsb-fighter-thumb-wrap" style="margin-left:-25px; z-index:1;">${p2Status}<img src="${bout.participants[1].image}" class="bsb-fighter-thumb" style="${isCompleted && bout.winnerId !== bout.participants[1].id ? 'filter:grayscale(1) brightness(0.4);' : ''}"></div>
        </div>
        <div class="bsb-vs-badge" style="margin: 0 4px;">VS</div>
        <div class="bsb-fighter right-side" style="margin-left:-8px;">
          <div class="bsb-fighter-thumb-wrap" style="z-index:2;">${p3Status}<img src="${bout.participants[2].image}" class="bsb-fighter-thumb" style="${isCompleted && bout.winnerId !== bout.participants[2].id ? 'filter:grayscale(1) brightness(0.4);' : ''}"></div>
          <div class="bsb-fighter-thumb-wrap" style="margin-right:-25px; z-index:1;">${p4Status}<img src="${bout.participants[3].image}" class="bsb-fighter-thumb" style="${isCompleted && bout.winnerId !== bout.participants[3].id ? 'filter:grayscale(1) brightness(0.4);' : ''}"></div>
        </div>
      `;
    } else if (bout.formatKey === 'fatal' && hasW4) {
      avatarsHtml = `
        <div class="bsb-fighter-thumb-wrap">${p1Status}<img src="${bout.participants[0].image}" class="bsb-fighter-thumb" style="${isCompleted && bout.winnerId !== bout.participants[0].id ? 'filter:grayscale(1) brightness(0.4);' : ''}"></div>
        <div class="bsb-vs-badge" style="font-size:0.9rem;">VS</div>
        <div class="bsb-fighter-thumb-wrap">${p2Status}<img src="${bout.participants[1].image}" class="bsb-fighter-thumb" style="${isCompleted && bout.winnerId !== bout.participants[1].id ? 'filter:grayscale(1) brightness(0.4);' : ''}"></div>
        <div class="bsb-vs-badge" style="font-size:0.9rem;">VS</div>
        <div class="bsb-fighter-thumb-wrap">${p3Status}<img src="${bout.participants[2].image}" class="bsb-fighter-thumb" style="${isCompleted && bout.winnerId !== bout.participants[2].id ? 'filter:grayscale(1) brightness(0.4);' : ''}"></div>
        <div class="bsb-vs-badge" style="font-size:0.9rem;">VS</div>
        <div class="bsb-fighter-thumb-wrap">${p4Status}<img src="${bout.participants[3].image}" class="bsb-fighter-thumb" style="${isCompleted && bout.winnerId !== bout.participants[3].id ? 'filter:grayscale(1) brightness(0.4);' : ''}"></div>
      `;
    } else if (bout.formatKey === 'triple' && hasW3) {
      avatarsHtml = `
        <div class="bsb-fighter-thumb-wrap">${p1Status}<img src="${bout.participants[0].image}" class="bsb-fighter-thumb" style="${isCompleted && bout.winnerId !== bout.participants[0].id ? 'filter:grayscale(1) brightness(0.4);' : ''}"></div>
        <div class="bsb-vs-badge" style="margin: 0 4px;">VS</div>
        <div class="bsb-fighter-thumb-wrap">${p2Status}<img src="${bout.participants[1].image}" class="bsb-fighter-thumb" style="${isCompleted && bout.winnerId !== bout.participants[1].id ? 'filter:grayscale(1) brightness(0.4);' : ''}"></div>
        <div class="bsb-vs-badge" style="margin: 0 4px;">VS</div>
        <div class="bsb-fighter-thumb-wrap">${p3Status}<img src="${bout.participants[2].image}" class="bsb-fighter-thumb" style="${isCompleted && bout.winnerId !== bout.participants[2].id ? 'filter:grayscale(1) brightness(0.4);' : ''}"></div>
      `;
    } else if (hasW1 && hasW2) {
      avatarsHtml = `
        <div class="bsb-fighter">
          <div class="bsb-fighter-thumb-wrap">${p1Status}<img src="${bout.participants[0].image}" class="bsb-fighter-thumb" style="${isCompleted && bout.winnerId !== bout.participants[0].id ? 'filter:grayscale(1) brightness(0.4);' : ''}"></div>
          <div class="bsb-fighter-name" style="${isCompleted && bout.winnerId !== bout.participants[0].id ? 'color:#888; text-decoration:line-through;' : (isCompleted && bout.winnerId===bout.participants[0].id ? 'color:#00ff66;' : '')}">${bout.participants[0].name}</div>
        </div>
        <div class="bsb-vs-badge">VS</div>
        <div class="bsb-fighter right-side">
          <div class="bsb-fighter-thumb-wrap">${p2Status}<img src="${bout.participants[1].image}" class="bsb-fighter-thumb" style="${isCompleted && bout.winnerId !== bout.participants[1].id ? 'filter:grayscale(1) brightness(0.4);' : ''}"></div>
          <div class="bsb-fighter-name" style="text-align:right; ${isCompleted && bout.winnerId !== bout.participants[1].id ? 'color:#888; text-decoration:line-through;' : (isCompleted && bout.winnerId===bout.participants[1].id ? 'color:#00ff66;' : '')}">${bout.participants[1].name}</div>
        </div>
      `;
    } else if (!hasW1 && !hasW2 && bout.order === 'MAIN EVENT') {
      avatarsHtml = `<div class="bsb-fighter-name" style="color:#aaa; font-style:italic;">TO BE DETERMINED</div>`;
    }

    row.innerHTML = `
      <div class="bsb-left-meta">
        <div class="${orderClass}">${bout.order}</div>
        <div class="bsb-stipulation-label">${bout.matchType.toUpperCase()}</div>
        ${stakeHtml}
      </div>
      <div class="bsb-faceoff-col">
        ${avatarsHtml}
      </div>
      <div class="bsb-action-col">
        ${actionHtml}
      </div>
    `;

    container.appendChild(row);
  });

  setElDisplay('bookShowFinaleOverlay', 'none');
  modal.style.display = 'flex';
};

window.shuffleBout = function(idx) {
  if (!window.activeShowSession) return;
  const bout = window.activeShowSession.bouts[idx];
  
  const gmLevel = (typeof getGMLevel === 'function') ? getGMLevel() : 1;
  const allW = (typeof getUnlockedWrestlers === 'function') ? getUnlockedWrestlers() : (typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : []);
  const activeW = allW.filter(w => !(typeof getInjuryRecord === 'function' && getInjuryRecord(w.id)));
  
  const draftedIds = window.activeShowSession.bouts
    .filter((b, i) => i !== idx)
    .flatMap(b => b.participants.map(p => p && p.id));
    
  let pool = activeW.filter(w => !draftedIds.includes(w.id));
  
  if (pool.length < 2) {
    alert(`Not enough free superstars left to reroll this match! You need at least 2.`);
    return;
  }
  
  const isTv = (window.activeShowSession.showKey === 'raw' || window.activeShowSession.showKey === 'smackdown');
  const isBig = (window.activeShowSession.showKey === 'summerslam' || window.activeShowSession.showKey === 'mania');
  
  let stipRoll = Math.random();
  let newStip = 'Normal Match';
  
  if (isTv) {
    if (stipRoll > 0.90) newStip = 'Special Guest Referee';
    else if (stipRoll > 0.85 && gmLevel >= 4) newStip = 'Tables Match';
    else if (stipRoll > 0.80) newStip = 'Submission Match';
  } else if (isBig) {
    if (stipRoll > 0.80 && !isMatchTypeLocked('TLC Match').locked) newStip = 'TLC Match';
    else if (stipRoll > 0.60 && !isMatchTypeLocked('Ambulance Match').locked) newStip = 'Ambulance Match';
    else if (stipRoll > 0.40) newStip = 'Last Man Standing';
    else if (stipRoll > 0.20) newStip = 'Ladder Match';
    else newStip = '2 out of 3 Falls';
  } else {
    if (stipRoll > 0.70) newStip = 'Falls Count Anywhere';
    else if (stipRoll > 0.40) newStip = 'No Disqualification';
    else if (stipRoll > 0.20 && gmLevel >= 4) newStip = 'Tables Match';
  }
  
  const wasTitleMatch = !!bout.isTitleMatch;
  const origMatchType = bout.matchType;

  bout.matchType = newStip;
  bout.isTitleMatch = false;
  bout.titleCode = null;
  bout.titleName = null;
  bout.titleImg = null;
  bout.feudStake = null;
  bout.referee = null;

  // BATCH 7 ITEM 5: Rerolling keeps title matches as title matches, and can offer other titles.
  // A title bout rerolls into a title bout (same or another free title). A non-title bout on a
  // non-TV show has a 35% chance of becoming a title match if a title isn't already on the card.
  const isSpecialBout = (window.activeShowSession.showKey === 'kotr' || bout.formatKey === 'rumble' || origMatchType === 'Royal Rumble Match' || origMatchType === 'Money in the Bank');
  if (!isSpecialBout && (wasTitleMatch || Math.random() < (isTv ? 0.15 : 0.35))) { // BATCH 9 ITEM 6: TV rerolls can offer a title now too
    const titles = (typeof getTitleHolders === 'function') ? getTitleHolders() : {};
    const bookedCodes = window.activeShowSession.bouts
      .filter((b, i) => i !== idx && b.isTitleMatch && b.titleCode)
      .map(b => b.titleCode);
    const inPool = (id) => pool.some(w => w.id === id);
    const options = [];
    if (titles.whc && inPool(titles.whc)) options.push({code: 'whc', name: 'World Heavyweight Championship', img: 'whc.png', id: titles.whc, format: '1v1'});
    if (titles.ic && inPool(titles.ic)) options.push({code: 'ic', name: 'Intercontinental Championship', img: 'ic_title.png', id: titles.ic, format: '1v1'});
    if (titles.hardcore && inPool(titles.hardcore)) options.push({code: 'hardcore', name: 'Hardcore Championship', img: 'hardcore.png', id: titles.hardcore, format: '1v1'});
    if (titles.tag1 && titles.tag2 && inPool(titles.tag1) && inPool(titles.tag2) && pool.length >= 4) options.push({code: 'tag', name: 'World Tag Team Championship', img: 'tag_title.png', id: [titles.tag1, titles.tag2], format: 'tag'});

    let freeTitles = options.filter(t => !bookedCodes.includes(t.code));
    // BATCH 9 ITEM 6: on TV the World title is rare
    if (isTv && !wasTitleMatch && Math.random() > 0.12) freeTitles = freeTitles.filter(t => t.code !== 'whc');
    if (freeTitles.length > 0) {
      const pick = freeTitles[Math.floor(Math.random() * freeTitles.length)];
      const notIce = (w) => (typeof getWrestlerMomentum === 'function') ? getWrestlerMomentum(w.id).status !== 'ice' : true;
      const byMomentum = (a, b) => (typeof calculateMomentum === 'function') ? calculateMomentum(b.id) - calculateMomentum(a.id) : 0;

      if (pick.format === '1v1') {
        const champ = pool.find(w => w.id === pick.id);
        let contenders = pool.filter(w => w.id !== champ.id && notIce(w)).sort(byMomentum).slice(0, 3);
        if (contenders.length === 0) contenders = pool.filter(w => w.id !== champ.id);
        if (contenders.length > 0) {
          const challenger = contenders[Math.floor(Math.random() * contenders.length)];
          bout.formatKey = '1v1';
          bout.participants = [champ, challenger];
          if (bout.matchType === 'Special Guest Referee') {
            const refPool = pool.filter(w => w.id !== champ.id && w.id !== challenger.id);
            if (refPool.length > 0) bout.referee = refPool[Math.floor(Math.random() * refPool.length)];
            else bout.matchType = 'Normal Match';
          }
          bout.isTitleMatch = true;
          bout.titleCode = pick.code;
          bout.titleName = pick.name;
          bout.titleImg = pick.img;
        }
      } else {
        const team1 = [pool.find(w => w.id === pick.id[0]), pool.find(w => w.id === pick.id[1])];
        let team2 = null;
        const alliances = typeof getAlliances === 'function' ? getAlliances() : [];
        const validAl = alliances.filter(al => inPool(al.p1) && inPool(al.p2) && ![al.p1, al.p2].some(id => id === team1[0].id || id === team1[1].id));
        if (validAl.length > 0) {
          const al = validAl[Math.floor(Math.random() * validAl.length)];
          team2 = [pool.find(w => w.id === al.p1), pool.find(w => w.id === al.p2)];
        } else {
          const opp = pool.filter(w => w.id !== team1[0].id && w.id !== team1[1].id).sort(() => Math.random() - 0.5);
          if (opp.length >= 2) team2 = [opp[0], opp[1]];
        }
        if (team2) {
          bout.formatKey = 'tag';
          bout.matchType = 'Normal Tag Match';
          bout.participants = [team1[0], team1[1], team2[0], team2[1]];
          bout.isTitleMatch = true;
          bout.titleCode = pick.code;
          bout.titleName = pick.name;
          bout.titleImg = pick.img;
        }
      }

      if (bout.isTitleMatch) {
        try { const audio = typeof titleClinkSound !== 'undefined' ? titleClinkSound : new Audio('title_clink.mp3'); audio.currentTime = 0; audio.play().catch(() => {}); } catch(e){}
        renderBookShowCardModal();
        return;
      }
    }
  }

  let newFormat = '1v1';
  let pCount = 2;
  let isMainEvent = (idx === window.activeShowSession.bouts.length - 1);
  
  if (window.activeShowSession.showKey === 'kotr' || (bout.matchType === 'Royal Rumble Match' || bout.matchType === 'Money in the Bank')) {
    pCount = bout.participants.length;
    newFormat = bout.formatKey;
  } else {
    let formatRoll = Math.random();
    if (!isMainEvent && pool.length >= 4 && formatRoll > 0.75) {
      newFormat = 'tag'; pCount = 4;
    } else if (!isMainEvent && pool.length >= 4 && formatRoll > 0.60) {
      newFormat = 'fatal'; pCount = 4;
    } else if (!isMainEvent && pool.length >= 3 && formatRoll > 0.45) {
      newFormat = 'triple'; pCount = 3;
    }
  }

  bout.formatKey = newFormat;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  
  if (newFormat === 'tag' && pCount === 4) {
    let team1 = null; let team2 = null;
    const alliances = typeof getAlliances === 'function' ? getAlliances() : [];
    if (alliances.length > 0) {
      const validAl = alliances.filter(al => pool.some(w => w.id === al.p1) && pool.some(w => w.id === al.p2));
      if (validAl.length > 0) {
        const pick = validAl[Math.floor(Math.random() * validAl.length)];
        team1 = [pool.find(w => w.id === pick.p1), pool.find(w => w.id === pick.p2)];
      }
    }
    if (!team1) { team1 = [shuffled[0], shuffled[1]]; }
    
    const oppPool = pool.filter(w => w.id !== team1[0].id && w.id !== team1[1].id).sort(() => Math.random() - 0.5);
    team2 = [oppPool[0], oppPool[1]];
    bout.participants = [team1[0], team1[1], team2[0], team2[1]];
  } else {
    bout.participants = shuffled.slice(0, pCount);
  }
  
  if (bout.matchType === 'Special Guest Referee' && pool.length >= pCount + 1) {
    bout.referee = shuffled[pCount];
  }

  if (bout.formatKey === '1v1' && !bout.isSanctionedContract) {
    const rivalries = (typeof getRivalries === 'function') ? getRivalries() : [];
    const p1Id = bout.participants[0].id;
    const p2Id = bout.participants[1].id;
    const riv = rivalries.find(r => (r.w1 === p1Id && r.w2 === p2Id) || (r.w2 === p1Id && r.w1 === p2Id));
    if (riv) {
      bout.feudStake = (riv.heat >= 3) ? '💀 TIER 3 BLOOD FEUD BLOWOFF' : '🔥 GRUDGE MATCH';
    }
  }

  try { const audio = typeof titleClinkSound !== 'undefined' ? titleClinkSound : new Audio('title_clink.mp3'); audio.currentTime = 0; audio.play().catch(() => {}); } catch(e){}
  renderBookShowCardModal();
};

/* --------------------------------------------------------------------------
   BATCH 9 ITEM 5: SIM MATCH (Book a Show). Skip acting out a bout but still get a result.
   PICK THE WINNER or LET FATE DECIDE (weighted by form, titles and contender locks; upsets
   possible). The result then runs through the normal results pipeline so History, titles,
   rivalries and momentum all update. Simmed bouts get 2-3 stars, so playing stays best.
   -------------------------------------------------------------------------- */
function simWeight(w) {
  if (!w) return 1;
  let wt = 1;
  try {
    const st = (typeof getWrestlerMomentum === 'function') ? getWrestlerMomentum(w.id).status : 'normal';
    wt = st === 'fire' ? 2.2 : st === 'ice' ? 0.55 : 1;
    const t = (typeof getTitleHolders === 'function') ? getTitleHolders() : {};
    if (Object.values(t || {}).includes(w.id)) wt *= 1.35;
    const locks = (typeof getContenderTitleShotLocks === 'function') ? getContenderTitleShotLocks() : [];
    if (locks.includes(w.id)) wt *= 1.25;
  } catch (e) {}
  return wt;
}

function simSides(bout) {
  const p = bout.participants.filter(Boolean);
  if (bout.formatKey === 'tag' && p.length === 4) {
    return [
      { members: [p[0], p[1]], label: `${p[0].name} & ${p[1].name}`, result: { isTagTeam: true, teamIndex: 1, winners: [p[0], p[1]], losers: [p[2], p[3]], teamName: `${p[0].name} & ${p[1].name}` } },
      { members: [p[2], p[3]], label: `${p[2].name} & ${p[3].name}`, result: { isTagTeam: true, teamIndex: 2, winners: [p[2], p[3]], losers: [p[0], p[1]], teamName: `${p[2].name} & ${p[3].name}` } }
    ];
  }
  return p.map(w => ({ members: [w], label: w.name, result: { isTagTeam: false, winner: w, losers: p.filter(x => x.id !== w.id) } }));
}

function ensureSimModal() {
  let m = document.getElementById('simMatchModal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'simMatchModal';
    m.style.cssText = 'position:fixed; inset:0; z-index:2147483000; background:rgba(5,5,10,0.94); display:none; flex-direction:column; align-items:center; justify-content:center; padding:24px; box-sizing:border-box; text-align:center;';
    (document.fullscreenElement || document.body).appendChild(m);
  }
  return m;
}

window.openSimMatchChoice = function(idx) {
  const session = window.activeShowSession; if (!session) return;
  const bout = session.bouts[idx]; if (!bout) return;
  const sides = simSides(bout);
  const m = ensureSimModal();
  const title = bout.isTitleMatch ? `<div style="color:#ffd700; font-family:'Russo One'; margin-bottom:6px;">🏆 ${bout.titleName} ON THE LINE</div>` : '';
  m.innerHTML = `
    <div style="font-family:'Russo One'; color:#ff3333; font-size:clamp(1.6rem,4vw,2.4rem); letter-spacing:2px; margin-bottom:6px;">⚡ SIM MATCH</div>
    ${title}
    <div style="color:#ccc; margin-bottom:22px;">${bout.matchType}: ${sides.map(x => x.label).join(' vs ')}</div>
    <div id="simStage" style="display:flex; flex-direction:column; gap:12px; align-items:center;">
      <button class="action-btn btn-gold" style="flex:none; width:auto; min-width:300px;" onclick="window.showSimPicker(${idx})">👆 PICK THE WINNER</button>
      <button class="action-btn btn-blue" style="flex:none; width:auto; min-width:300px;" onclick="window.runSimMatch(${idx}, null)">🎲 LET FATE DECIDE</button>
      <button class="btn-cancel" style="margin-top:10px;" onclick="document.getElementById('simMatchModal').style.display='none'">Cancel</button>
    </div>`;
  m.style.display = 'flex';
};

window.showSimPicker = function(idx) {
  const bout = window.activeShowSession && window.activeShowSession.bouts[idx]; if (!bout) return;
  const sides = simSides(bout);
  const stage = document.getElementById('simStage'); if (!stage) return;
  stage.innerHTML = `<div style="color:#ffd700; font-family:'Russo One'; margin-bottom:6px;">WHO WINS?</div>
    <div style="display:flex; gap:16px; flex-wrap:wrap; justify-content:center;">
      ${sides.map((sd, i) => `<div class="vs-wrestler" style="cursor:pointer; border:2px solid #ffd700; padding:10px; background:rgba(20,20,30,0.9);" onclick="window.runSimMatch(${idx}, ${i})">
        <div style="display:flex; gap:6px; justify-content:center;">${sd.members.map(w => `<img src="${w.image}" style="width:80px; height:80px; object-fit:cover;" onerror="handleImgError(this, '${w.id}')">`).join('')}</div>
        <div style="margin-top:6px;">${sd.label}</div></div>`).join('')}
    </div>
    <button class="btn-cancel" style="margin-top:14px;" onclick="document.getElementById('simMatchModal').style.display='none'">Cancel</button>`;
};

window.runSimMatch = function(idx, pickedIdx) {
  const session = window.activeShowSession; if (!session) return;
  const bout = session.bouts[idx]; if (!bout) return;
  const sides = simSides(bout);
  let winIdx = pickedIdx;
  let upset = false;
  if (winIdx === null || winIdx === undefined) {
    const weights = sides.map(sd => sd.members.reduce((a, w) => a + simWeight(w), 0));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    winIdx = 0;
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { winIdx = i; break; } }
    const best = Math.max(...weights);
    upset = weights[winIdx] < best * 0.7;
  }
  const winner = sides[winIdx];
  const losers = sides.filter((_, i) => i !== winIdx).map(x => x.label).join(' & ');
  const rating = 2 + Math.floor(Math.random() * 2);

  const m = ensureSimModal();
  const titleLine = bout.isTitleMatch ? `<div style="color:#ffd700; margin-top:8px;">🏆 ${bout.titleName}</div>` : '';
  m.innerHTML = `
    <div style="font-family:'Russo One'; color:${upset ? '#ff3333' : '#ffd700'}; font-size:clamp(1.4rem,4vw,2.2rem); letter-spacing:2px;">${upset ? '😱 UPSET!' : '⚡ SIMULATED RESULT'}</div>
    <div style="display:flex; gap:8px; justify-content:center; margin:16px 0;">${winner.members.map(w => `<img src="${w.image}" style="width:120px; height:120px; object-fit:cover; border:3px solid #ffd700;" onerror="handleImgError(this, '${w.id}')">`).join('')}</div>
    <div style="font-family:'Russo One'; color:#fff; font-size:clamp(1.1rem,3vw,1.6rem); text-transform:uppercase;">${winner.label} ${upset ? (winner.members.length > 1 ? 'STUN' : 'STUNS') : (winner.members.length > 1 ? 'defeat' : 'defeats')} ${losers}!</div>
    ${titleLine}
    <div style="color:#ffd700; margin-top:8px; font-size:1.3rem;">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
    <button class="action-btn btn-gold" style="flex:none; width:auto; min-width:280px; margin-top:22px;" id="simContinueBtn">CONTINUE SHOW ➔</button>`;
  m.style.display = 'flex';
  try { const a = typeof bellSound !== 'undefined' ? bellSound : new Audio('bell.mp3'); a.currentTime = 0; a.play().catch(() => {}); } catch (e) {}

  document.getElementById('simContinueBtn').onclick = () => {
    m.style.display = 'none';
    commitSimResult(idx, winner.result, rating, upset);
  };
};

function commitSimResult(idx, resultData, rating, upset) {
  const session = window.activeShowSession; if (!session) return;
  const bout = session.bouts[idx];
  // Same booking setup as a played bout, then run the normal results pipeline without the videos
  activeBookedMatch = {
    showKey: session.showKey, matchType: bout.matchType, formatKey: bout.formatKey, formatCount: bout.participants.length,
    participants: [...bout.participants], referee: bout.referee, refereeId: bout.referee ? bout.referee.id : null,
    isTitleMatch: bout.isTitleMatch, titleCode: bout.titleCode, titleName: bout.titleName, titleImg: bout.titleImg,
    isCareerMatch: bout.isCareerMatch || false
  };
  pickedParticipants = [...bout.participants];
  pickedReferee = bout.referee;
  quickMatchQueue = [...bout.participants];
  isBloodFeudBlowoff = !!bout.isBloodFeudBlowoff;
  storyBypassIds = bout.storyBypass ? bout.participants.map(w => w.id) : [];
  currentMatchSummary = { rating: 0, interference: upset ? '🎲 Simulated result (upset!)' : '🎲 Simulated result', titleChange: false, winner: null, losers: [] };
  bout.simulated = true;

  setElDisplay('bookShowCardModal', 'none');
  // BATCH 10 FIX: no fullscreen request for a sim (it finished after the modal closed and left a hidden screen fullscreen)
  setElDisplay('videoModal', 'flex');
  setElDisplay('quickMatchBox', 'none');
  liveMatchElapsedSeconds = 240 + Math.floor(Math.random() * 600);
  window.declareMatchWinner(resultData);
  if (typeof window.skipToMatchSummary === 'function') window.skipToMatchSummary();
  window.selectSummaryRating(rating);
  if (typeof window.confirmAndLogMatchSummary === 'function') window.confirmAndLogMatchSummary();
}

window.launchActiveShowBout = function(idx) {
  if (!window.activeShowSession) return;
  const bout = window.activeShowSession.bouts[idx];

  if (bout.order === 'MAIN EVENT' && bout.participants.length === 0 && window.activeShowSession.showKey === 'kotr') {
    const sf1 = window.activeShowSession.bouts.find(b => b.order === 'SEMI-FINAL' && b.status === 'completed');
    const sf2 = window.activeShowSession.bouts.slice().reverse().find(b => b.order === 'SEMI-FINAL' && b.status === 'completed' && b !== sf1);
    
    if (sf1 && sf2 && sf1.winnerObj && sf2.winnerObj) {
      bout.participants = [sf1.winnerObj, sf2.winnerObj];
    } else {
      alert("Error: Cannot start the Tournament Final until both Semi-Final matches have been completed!");
      return;
    }
  }
  
  activeBookedMatch = {
    showKey: window.activeShowSession.showKey,
    matchType: bout.matchType,
    formatKey: bout.formatKey,
    formatCount: bout.participants.length,
    participants: [...bout.participants],
    referee: bout.referee,
    refereeId: bout.referee ? bout.referee.id : null,
    isTitleMatch: bout.isTitleMatch,
    titleCode: bout.titleCode,
    titleName: bout.titleName,
    titleImg: bout.titleImg,
    isCareerMatch: bout.isCareerMatch || false
  };

  pickedParticipants = [...bout.participants];
  pickedReferee = bout.referee;
  quickMatchQueue = [...bout.participants];
  // BATCH 7 ITEM 16: cutscene bouts keep their special rules inside a show
  isBloodFeudBlowoff = !!bout.isBloodFeudBlowoff;
  storyBypassIds = bout.storyBypass ? bout.participants.map(w => w.id) : [];

  setElDisplay('bookShowCardModal', 'none');

  if (bout.formatKey === 'rumble' || bout.matchType === 'Royal Rumble Match') {
    const rumblePool = [...bout.participants].sort(() => Math.random() - 0.5);
    rumbleEntrantCount = rumblePool.length;
    rumbleUnenteredQueue = [...rumblePool];
    rumbleInRingList = [];
    rumbleEliminatedList = [];
    window.rumbleConcluded = false; // BATCH 7 ITEM 6
    rumbleEntrant1 = rumbleUnenteredQueue.shift();
    rumbleEntrant2 = rumbleUnenteredQueue.shift();

    openVideoModal();
    setElDisplay('quickMatchBox', 'none');
    if (activeBookedMatch.showKey && activeBookedMatch.showKey !== 'none' && typeof showIntros !== 'undefined' && showIntros[activeBookedMatch.showKey]) {
      ensureSkipIntroBtnPosition();
      setElDisplay('skipIntroOverlayBtn', 'block');
      setElDisplay('rushRingOverlayBtn', 'block');
      loadAndPlayYouTube(showIntros[activeBookedMatch.showKey], false, true, false, true);
    } else {
      launchRumbleEntrants();
    }
    return;
  }
  
  checkAndTriggerContractSigning(() => {
    executeMatchEntrancesSequence();
  });
};

// BATCH 7 ITEM 16: "Fight right now" from a cutscene during Book a Show used to wipe the whole show
// (or hijack the next bout's result). Now the cutscene match is slotted in as the NEXT bout of the
// running show and Ellis is taken back to the show card. Returns true if it handled it.
window.queueCutsceneBoutIntoShow = function(cfg) {
  const s = window.activeShowSession;
  if (!s || !Array.isArray(s.bouts) || !cfg || !Array.isArray(cfg.participants) || cfg.participants.length < 2) return false;
  const bout = {
    order: 'BREAKING NEWS',
    matchType: cfg.matchType || 'Normal Match',
    formatKey: cfg.formatKey || '1v1',
    participants: [...cfg.participants],
    isTitleMatch: !!cfg.isTitleMatch,
    titleCode: cfg.isTitleMatch ? (cfg.titleCode || 'whc') : null,
    titleName: cfg.isTitleMatch ? (cfg.titleName || 'World Heavyweight Championship') : null,
    titleImg: cfg.isTitleMatch ? (cfg.titleImg || 'whc.png') : null,
    isCareerMatch: !!cfg.isCareerMatch,
    isBloodFeudBlowoff: !!cfg.isBloodFeudBlowoff,
    storyBypass: !!cfg.storyBypass,
    feudStake: cfg.feudStake || '🚨 BREAKING: BOOKED BY GM ELLIS',
    isSanctionedContract: true,
    referee: null,
    status: 'pending',
    rating: 0
  };
  const at = Math.min(s.currentBoutIdx || 0, s.bouts.length);
  s.bouts.splice(at, 0, bout);
  if (typeof logShowFalloutEvent === 'function') {
    logShowFalloutEvent('cutscene', `🚨 BREAKING: ${bout.participants.map(w => w.name.toUpperCase()).join(' vs ')} added to tonight's card!`);
  }
  if (typeof closeVideoModal === 'function') { try { closeVideoModal(); } catch (e) {} }
  setElDisplay('quickMatchBox', 'none');
  setElDisplay('bookShowCardModal', 'flex');
  renderBookShowCardModal();
  return true;
};

window.abandonActiveShow = function() {
  if (confirm("Are you sure you want to abandon this broadcast? Unfinished matches will be discarded.")) {
    const container = document.getElementById('bookShowBoutsContainer');
    if (container) container.innerHTML = '';
    
    window.activeShowSession = null;
    window.showDeferredFalloutQueue = [];
    setElDisplay('bookShowCardModal', 'none');
    
    setElDisplay('gmProfileWidget', 'flex');
    setElDisplay('bgmToggleBtn', 'inline-flex');
    setElDisplay('gmHeaderHomeBtn', 'flex');
    
    if (typeof resumeBGM === 'function') resumeBGM();
  }
};

/* --------------------------------------------------------------------------
   2. MATCH ENGINE OPEN, RESET & NAVIGATION
   -------------------------------------------------------------------------- */
function openMatchEngine(isMystery = false) {
  if (typeof ensureRosterReady === 'function' && !ensureRosterReady(2)) return; // BATCH 7 ITEM 14
  isMysteryMatchMode = isMystery;
  if (typeof turnOffOtherModes === 'function') turnOffOtherModes('');
  openVideoModal();
  if (typeof hideNameplate === 'function') hideNameplate();

  setElDisplay('beltEntranceOverlay', 'none');
  setElDisplay('titleMatchBanner', 'none');
  setElDisplay('victoryTitleChyron', 'none');
  setElDisplay('mitbBtn', 'none');
  setElDisplay('player-container', 'none');
  setElDisplay('skipIntroOverlayBtn', 'none');
  setElDisplay('rushRingOverlayBtn', 'none');
  setElDisplay('skipToSummaryBtn', 'none');
  setElDisplay('universalSummaryOverlay', 'none');
  setElDisplay('mitbStrobeOverlay', 'none');
  setElDisplay('ambulanceStrobeOverlay', 'none');
  setElDisplay('rumbleHoldingScreen', 'none');
  setElDisplay('rumbleCoronationOverlay', 'none');
  setElDisplay('mitbCoronationOverlay', 'none');
  setElDisplay('matchCardOverlay', 'none');
  setElDisplay('contractSigningModal', 'none');
  setElDisplay('specialRefBanner', 'none');
  setElDisplay('videoCloseBtn', 'flex');

  const qmBox = document.getElementById('quickMatchBox');
  if (qmBox) {
    if (isMysteryMatchMode) {
      qmBox.classList.add('roulette-active-mode');
      qmBox.style.removeProperty('background-image');
      qmBox.style.setProperty('background-image', "url('slot_machine_frame.png')", 'important');
      qmBox.style.setProperty('background-color', "transparent", 'important');
    } else {
      qmBox.classList.remove('roulette-active-mode');
      qmBox.style.setProperty('background-image', 'none', 'important');
      qmBox.style.setProperty('background-color', 'transparent', 'important');
    }
  }

  setElDisplay('quickMatchBox', 'flex');
  resetQuickMatch();
  
  if (isMysteryMatchMode) {
    navGoToStep(7);
  } else {
    navGoToStep(0);
    setElDisplay('qmStepShow', 'flex');
  }
}
window.openMatchEngine = openMatchEngine;

function resetQuickMatch() {
  if (typeof window.stopMysteryRoulette === 'function') window.stopMysteryRoulette(); // BATCH 8 ITEM 2
  clearTimeout(qmSpinTimeout);
  clearTimeout(runInAutoTimeout);
  clearTimeout(victoryTimeout);
  clearTimeout(cashInTimeout);
  clearTimeout(rumbleEntranceDurationTimeout);
  clearTimeout(unpromptedAmbushTimer);
  clearTimeout(rumbleEntrantTimeout);
  clearTimeout(matchCardTimeout);
  clearTimeout(matchCardDelayTimeout);
  clearInterval(rouletteInterval);
  clearInterval(rumbleTimerInterval);
  contractSigningCallback = null;
  window.pendingMediaScrum = null;
  stopLiveMatchStopwatch();
  if (typeof stopMatchCrowd === 'function') stopMatchCrowd();
  if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd();
  try { if (typeof slotSpinSound !== 'undefined') slotSpinSound.pause(); } catch (e) {}

  isRunInActive = false;
  isSlotSpinning = false;
  isBloodFeudBlowoff = false;
  storyBypassIds = [];
  quickMatchQueue = [];
  rumbleUnenteredQueue = [];
  rumbleInRingList = [];
  rumbleEliminatedList = [];
  window.rumbleConcluded = false; // BATCH 7 ITEM 6
  window.postMatchEventQueue = [];
  window.isProcessingPostMatchQueue = false;

  activeBookedMatch = {
    showKey: "raw", matchType: "Normal Match", formatKey: "1v1", formatCount: 2,
    participants: [], referee: null, refereeId: null, isTitleMatch: false,
    titleCode: "", titleName: "", titleImg: "", mitbCoronationShown: false, isCareerMatch: false
  };

  currentMatchSummary = {
    rating: 0, interference: null, titleChange: false, winner: null,
    losers: [], injuryInflicted: null, feudStatus: null
  };

  currentShowIdx = 0; currentFormatIdx = 0; currentTypeIdx = 0;
  pickedParticipants = []; pickedReferee = null; lastMatchLoser = null;
  ambushTriggeredThisMatch = false;

  const modalEl = document.getElementById('videoModal');
  if (modalEl) modalEl.classList.remove('split-screen-mode');

  setElDisplay('qmTitle', 'block');
  setElDisplay('skipToSummaryBtn', 'none');
  setElDisplay('universalSummaryOverlay', 'none');
  setElDisplay('rumbleCoronationOverlay', 'none');
  setElDisplay('mitbCoronationOverlay', 'none');
  setElDisplay('matchCardOverlay', 'none');
  setElDisplay('contractSigningModal', 'none');
  setElDisplay('specialRefBanner', 'none');
  setElDisplay('victoryTitleChyron', 'none');
  setElDisplay('settleRivalryBtn', 'none');

  try { updateTitleStakeBtnUI(); } catch(e){}
  try { updateShowCarouselUI(); } catch(e){}
  
  if (!isMysteryMatchMode) {
    const qmBox = document.getElementById('quickMatchBox');
    if (qmBox) qmBox.style.setProperty('background-image', 'none', 'important');
    navGoToStep(0);
    setElDisplay('qmStepShow', 'flex');
  }
}

function navGoToStep(stepNum) {
  const steps = [
    'qmStepShow', 'qmStepFormat', 'qmStepRumbleCount', 'qmStepMitbCount',
    'qmStepPicker', 'qmStepHandPick', 'qmStepResult', 'qmStepMysteryRoulette',
    'qmStepWinner', 'qmStepInterference', 'qmStepRumbleHud'
  ];
  steps.forEach((s, idx) => { setElDisplay(s, (idx === stepNum) ? 'flex' : 'none'); });

  if (stepNum === 0) {
    setElDisplay('qmStepShow', 'flex');
  }

  const qmBox = document.getElementById('quickMatchBox');
  if (qmBox) {
    if (stepNum === 7) {
      qmBox.classList.add('roulette-active-mode');
      qmBox.style.removeProperty('background-image');
      qmBox.style.setProperty('background-image', "url('slot_machine_frame.png')", 'important');
    } else {
      qmBox.classList.remove('roulette-active-mode');
      qmBox.style.setProperty('background-image', 'none', 'important');
    }
  }

  const titleEl = document.getElementById('qmTitle');
  if (titleEl) {
    if (stepNum >= 8) {
      titleEl.style.display = 'none';
    } else {
      titleEl.style.display = 'block';
      if (stepNum === 0) titleEl.innerText = "SELECT SHOW INTRO";
      else if (stepNum === 1) titleEl.innerText = "SELECT MATCH FORMAT";
      else if (stepNum === 2) titleEl.innerText = "ROYAL RUMBLE ENTRANTS";
      else if (stepNum === 3) titleEl.innerText = "MONEY IN THE BANK ENTRANTS";
      else if (stepNum === 4) titleEl.innerText = "SELECT MATCH TYPE";
      else if (stepNum === 5) titleEl.innerText = "HAND-PICK SUPERSTARS";
      else if (stepNum === 6) titleEl.innerText = "MATCH PREVIEW";
      else if (stepNum === 7) titleEl.innerText = "MYSTERY MATCH ROULETTE";
    }
  }
}
window.navGoToStep = navGoToStep;

/* --------------------------------------------------------------------------
   3. CAROUSEL CONTROLS, SELECTION & GATING
   -------------------------------------------------------------------------- */
/* BATCH 13: ONE PLACE FOR EVERY UNLOCK
   Levels: 4 Undertaker, 5 TLC, 6 King of the Ring, 7 Royal Rumble, 8 Kane, 9 Bad Blood, 10 Create Your Own Show,
   11 Judgment Day, 12 Stephanie McMahon, 13 No Mercy. Money in the Bank and the Slambulance unlock with code cards. */
window.EWF_UNLOCK_LEVELS = { undertaker: 4, tlc: 5, kotr: 6, rumble: 7, kane: 8, badblood: 9, custom: 10, judgmentday: 11, stephanie: 12, nomercy: 13 };
window.ewfHasGift = function(id) { try { return (typeof getUnlockedVaultIds === 'function' ? getUnlockedVaultIds() : []).includes(id); } catch (e) { return false; } };
const EWF_GIFT_LOCKS = { mitb: { gift: 'gift-mitb', name: 'Money in the Bank' }, 'Ambulance Match': { gift: 'gift-slambulance', name: 'Slambulance Match' } };
function ewfLevelLock(key, name) {
  const lvl = (typeof getGMLevel === 'function') ? getGMLevel() : 1;
  const req = window.EWF_UNLOCK_LEVELS[key];
  return (req && lvl < req) ? { locked: true, req, name } : { locked: false };
}
function ewfGiftLock(key) {
  const g = EWF_GIFT_LOCKS[key];
  return (g && !window.ewfHasGift(g.gift)) ? { locked: true, code: true, req: null, name: g.name } : { locked: false };
}

function isShowLocked(showKey) {
  if (showKey === 'mitb') return ewfGiftLock('mitb');
  if (showKey === 'kotr') return ewfLevelLock('kotr', "King of the Ring");
  if (showKey === 'rumble') return ewfLevelLock('rumble', "Royal Rumble");
  if (showKey === 'badblood') return ewfLevelLock('badblood', "Bad Blood");
  if (showKey === 'judgmentday') return ewfLevelLock('judgmentday', "Judgment Day");
  if (showKey === 'nomercy') return ewfLevelLock('nomercy', "No Mercy");
  return { locked: false };
}

function isFormatLocked(formatKey) {
  const lvl = (typeof getGMLevel === 'function') ? getGMLevel() : 1;
  if (formatKey === 'mitb') return ewfGiftLock('mitb');
  if (formatKey === 'kotr') return ewfLevelLock('kotr', "King of the Ring");
  if (formatKey === 'rumble') return ewfLevelLock('rumble', "Royal Rumble");
  return { locked: false };
}

function isMatchTypeLocked(matchType) {
  const lvl = (typeof getGMLevel === 'function') ? getGMLevel() : 1;
  if (matchType === 'TLC Match') return ewfLevelLock('tlc', "TLC Match");
  if (matchType === 'Ambulance Match') return ewfGiftLock('Ambulance Match');
  return { locked: false };
}

window.randomiseCarousel = function(carouselType) {
  try {
    const audio = typeof titleClinkSound !== 'undefined' ? titleClinkSound : new Audio('title_clink.mp3');
    audio.currentTime = 0; audio.play().catch(() => {});
  } catch (e) {}

  const gmLevel = (typeof getGMLevel === 'function') ? getGMLevel() : 1;

  if (carouselType === 'show') {
    const eligibleShows = showKeys.filter(k => !isShowLocked(k).locked);
    const chosen = eligibleShows[Math.floor(Math.random() * eligibleShows.length)];
    currentShowIdx = showKeys.indexOf(chosen);
    updateShowCarouselUI();
  } else if (carouselType === 'format') {
    const eligibleFormats = formatKeys.filter(fmt => {
      if (isFormatLocked(fmt).locked) return false;
      return true;
    });
    const chosenFormat = eligibleFormats[Math.floor(Math.random() * eligibleFormats.length)];
    currentFormatIdx = formatKeys.indexOf(chosenFormat);
    updateFormatCarouselUI();
  } else if (carouselType === 'type') {
    const eligibleTypes = activeMatchTypesList.filter(type => {
      if (isMatchTypeLocked(type).locked) return false;
      return true;
    });
    const chosenType = eligibleTypes[Math.floor(Math.random() * eligibleTypes.length)];
    currentTypeIdx = activeMatchTypesList.indexOf(chosenType);
    updateTypeCarouselUI();
  } else if (carouselType === 'mitb') {
    window.selectMitbEntrantCount(Math.floor(Math.random() * 4) + 3);
  }
};

window.autoFillSuperstars = function() {
  try {
    const audio = typeof titleClinkSound !== 'undefined' ? titleClinkSound : new Audio('title_clink.mp3');
    audio.currentTime = 0; audio.play().catch(() => {});
  } catch (e) {}

  const unlocked = getUnlockedWrestlers().filter(w => !getInjuryRecord(w.id));
  const count = activeBookedMatch.formatCount || 2;
  if (unlocked.length < count) { alert(`Need at least ${count} uninjured, unlocked superstars to auto-fill!`); return; }

  const shuffled = [...unlocked].sort(() => Math.random() - 0.5);
  pickedParticipants = shuffled.slice(0, count);

  if (activeBookedMatch.matchType === 'Special Guest Referee') {
    const remaining = shuffled.slice(count);
    pickedReferee = remaining.length > 0 ? remaining[0] : null;
  }

  renderHandpickSlotsUI();
};

window.prevShowCarousel = function() { currentShowIdx = (currentShowIdx - 1 + showKeys.length) % showKeys.length; updateShowCarouselUI(); };
window.nextShowCarousel = function() { currentShowIdx = (currentShowIdx + 1) % showKeys.length; updateShowCarouselUI(); };

function updateShowCarouselUI() {
  const display = document.getElementById('showCarouselDisplay');
  if (!display) return;
  const key = (typeof showKeys !== 'undefined' && showKeys[currentShowIdx]) ? showKeys[currentShowIdx] : 'raw';
  const logoFile = (typeof getShowLogo === 'function') ? getShowLogo(key) : `${key}_logo.png`;
  const lock = isShowLocked(key);

  if (lock && lock.locked) {
    display.innerHTML = `
      <div style="position:relative; display:flex; align-items:center; justify-content:center;">
        <div class="show-logo-img" style="display:flex; align-items:center; justify-content:center; font-size:4rem; color:#ffd700; min-height:120px;">❓</div>
        <div class="locked-dossier-overlay">
          <div style="font-size:2rem; margin-bottom:4px;">🔒</div>
          <div>TOP SECRET SHOW</div>
          <div style="font-size:0.8rem; color:#ffd700; margin-top:4px;">${lock.code ? '🎁 NEEDS A SPECIAL CODE' : 'REQUIRES LEVEL ' + lock.req}</div>
        </div>
      </div>
    `;
  } else {
    const lbl = (typeof getShowName === 'function') ? getShowName(key) : key.toUpperCase();
    display.innerHTML = `<img src="${logoFile}" alt="${lbl}" class="show-logo-img" onerror="this.outerHTML='<h2 style=\\'color:#fff; font-family:Russo One;\\'>${lbl}</h2>'">`;
  }
}

window.confirmShowCarouselChoice = function() {
  const key = showKeys[currentShowIdx];
  const lock = isShowLocked(key);
  if (lock.locked) {
    try { const audio = typeof anvilSlamSound !== 'undefined' ? anvilSlamSound : new Audio('anvil.mp3'); audio.currentTime = 0; audio.play().catch(() => {}); } catch (e) {}
    alert(lock.code ? `🎁 TOP SECRET SHOW!\n\nThis one needs a special code. Maybe it comes with a present...` : `🔒 TOP SECRET SHOW!\n\nThis show unlocks at Level ${lock.req}. What could it be?`);
    return;
  }
  activeBookedMatch.showKey = key;
  updateFormatCarouselUI();
  navGoToStep(1);
};

window.selectMatchShow = function(showKey) {
  const lock = isShowLocked(showKey);
  if (lock.locked) {
    try { const audio = typeof anvilSlamSound !== 'undefined' ? anvilSlamSound : new Audio('anvil.mp3'); audio.currentTime = 0; audio.play().catch(() => {}); } catch (e) {}
    alert(lock.code ? `🎁 TOP SECRET SHOW!\n\nThis one needs a special code. Maybe it comes with a present...` : `🔒 TOP SECRET SHOW!\n\nThis show unlocks at Level ${lock.req}. What could it be?`);
    return;
  }
  activeBookedMatch.showKey = showKey;
  updateFormatCarouselUI();
  navGoToStep(1);
};

window.prevFormatCarousel = function() { currentFormatIdx = (currentFormatIdx - 1 + formatKeys.length) % formatKeys.length; updateFormatCarouselUI(); };
window.nextFormatCarousel = function() { currentFormatIdx = (currentFormatIdx + 1) % formatKeys.length; updateFormatCarouselUI(); };

function updateFormatCarouselUI() {
  const display = document.getElementById('formatCarouselDisplay');
  if (!display) return;
  const currentFormat = formatKeys[currentFormatIdx];
  const logoFile = formatLogos[currentFormatIdx];
  const label = formatLabels[currentFormatIdx];
  const lockStatus = isFormatLocked(currentFormat);

  if (lockStatus.locked) {
    display.innerHTML = `
      <div style="position:relative; display:flex; align-items:center; justify-content:center;">
        <div class="qm-format-img" style="display:flex; align-items:center; justify-content:center; font-size:4rem; color:#ffd700; min-height:110px;">❓</div>
        <div class="locked-dossier-overlay">
          <div style="font-size:2rem; margin-bottom:4px;">🔒</div>
          <div>TOP SECRET</div>
          <div style="font-size:0.8rem; color:#ffd700; margin-top:4px;">${lockStatus.code ? '🎁 NEEDS A SPECIAL CODE' : 'REQUIRES LEVEL ' + lockStatus.req}</div>
        </div>
      </div>
    `;
  } else {
    display.innerHTML = `<img src="${logoFile}" alt="${label}" class="qm-format-img" onerror="this.outerHTML='<h3 style=\\'color:#fff\\'>${label}</h3>'">`;
  }
}

window.confirmFormatCarouselChoice = function() {
  const selectedFormat = formatKeys[currentFormatIdx];
  const lockStatus = isFormatLocked(selectedFormat);

  if (lockStatus.locked) {
    try {
      const audio = typeof anvilSlamSound !== 'undefined' ? anvilSlamSound : new Audio('anvil.mp3');
      audio.currentTime = 0; audio.play().catch(() => {});
    } catch (e) {}
    alert(lockStatus.code ? `🎁 TOP SECRET!\n\nThis one needs a special code. Maybe it comes with a present...` : `🔒 TOP SECRET!\n\nThis unlocks at Level ${lockStatus.req}. What could it be?`);
    return;
  }

  activeBookedMatch.formatKey = selectedFormat;

  if (selectedFormat === 'rumble') {
    navGoToStep(2);
  } else if (selectedFormat === 'mitb') {
    navGoToStep(3);
  } else if (selectedFormat === 'kotr') {
    closeVideoModal();
    if (typeof openKotrHub === 'function') openKotrHub();
  } else {
    if (selectedFormat === 'tag') {
      activeMatchTypesList = [...tagMatchTypes];
      activeBookedMatch.formatCount = 4;
    } else if (selectedFormat === '1v1') {
      activeMatchTypesList = [...allMatchTypes];
      activeBookedMatch.formatCount = 2;
    } else if (selectedFormat === 'triple') {
      activeMatchTypesList = [...allMatchTypes];
      activeBookedMatch.formatCount = 3;
    } else if (selectedFormat === 'fatal') {
      activeMatchTypesList = [...allMatchTypes];
      activeBookedMatch.formatCount = 4;
    }
    currentTypeIdx = 0;
    updateTypeCarouselUI();
    navGoToStep(4);
  }
};

window.prevTypeCarousel = function() { currentTypeIdx = (currentTypeIdx - 1 + activeMatchTypesList.length) % activeMatchTypesList.length; updateTypeCarouselUI(); };
window.nextTypeCarousel = function() { currentTypeIdx = (currentTypeIdx + 1) % activeMatchTypesList.length; updateTypeCarouselUI(); };

function updateTypeCarouselUI() {
  const display = document.getElementById('typeCarouselDisplay');
  if (!display) return;
  const matchType = activeMatchTypesList[currentTypeIdx];
  const lockStatus = isMatchTypeLocked(matchType);

  if (lockStatus.locked) {
    display.innerHTML = `
      <div style="position:relative; display:flex; align-items:center; justify-content:center;">
        <div style="display:flex; align-items:center; justify-content:center; font-size:4rem; color:#ffd700; min-height:110px; min-width:160px;">❓</div>
        <div class="locked-dossier-overlay">
          <div style="font-size:2rem; margin-bottom:4px;">🔒</div>
          <div>TOP SECRET MATCH</div>
          <div style="font-size:0.8rem; color:#ffd700; margin-top:4px;">${lockStatus.code ? '🎁 NEEDS A SPECIAL CODE' : 'REQUIRES LEVEL ' + lockStatus.req}</div>
        </div>
      </div>
    `;
  } else {
    display.innerHTML = renderMatchLogoHTML(matchType, '');
  }
}

window.confirmTypeCarouselChoice = function() {
  const chosenType = activeMatchTypesList[currentTypeIdx];
  const lockStatus = isMatchTypeLocked(chosenType);

  if (lockStatus.locked) {
    try {
      const audio = typeof anvilSlamSound !== 'undefined' ? anvilSlamSound : new Audio('anvil.mp3');
      audio.currentTime = 0; audio.play().catch(() => {});
    } catch (e) {}
    alert(lockStatus.code ? `🎁 TOP SECRET MATCH!\n\nThis one needs a special code. Maybe it comes with a present...` : `🔒 TOP SECRET MATCH!\n\nThis unlocks at Level ${lockStatus.req}. What could it be?`);
    return;
  }

  activeBookedMatch.matchType = chosenType;
  pickedReferee = null;
  initHandpickSlots(activeBookedMatch.formatCount);
  navGoToStep(5);
};

/* --------------------------------------------------------------------------
   4. TITLE STAKE VERIFICATION & STIPULATION SANCTIONING
   -------------------------------------------------------------------------- */
function checkTitleChallengerEligibility(titleCode, participants, champId) {
  if (!champId) return true;
  if (titleCode === 'tag') return true;
  if (activeMatchMode === 'mitb-cashin' || (activeBookedMatch.matchType && activeBookedMatch.matchType.includes('Cash-In'))) return true;

  const locks = typeof getMandatoryLocks === 'function' ? getMandatoryLocks() : {};
  const contenderLocks = typeof getContenderTitleShotLocks === 'function' ? getContenderTitleShotLocks() : [];
  const challengers = (participants || []).filter(p => p && p.id !== champId);
  if (challengers.length === 0) return false;

  return challengers.some(c => {
    if (contenderLocks.includes(c.id)) return true;
    if (titleCode === 'whc' && locks.rumbleWhc === c.id) return true;
    if (titleCode === 'ic' && locks.kotrIc === c.id) return true;
    if (typeof getWrestlerMomentum === 'function' && getWrestlerMomentum(c.id).status === 'fire') return true;
    if (storyBypassIds && storyBypassIds.includes(c.id)) return true;
    return false;
  });
}

function renderTitleStakeModal() {
  const container = document.getElementById('titleStakeOptionsList');
  if (!container) return;
  container.innerHTML = '';

  const titles = typeof getTitleHolders === 'function' ? getTitleHolders() : {};
  const allWrestlers = getUnlockedWrestlers();
  const participantIds = (activeBookedMatch.participants || []).map(p => p.id);
  const isTagMatch = activeBookedMatch.formatKey === 'tag';

  const championshipRoster = [
    { code: 'whc', name: 'World Heavyweight Championship', img: 'whc.png', holderId: titles.whc, isTag: false },
    { code: 'ic', name: 'Intercontinental Championship', img: 'ic_title.png', holderId: titles.ic, isTag: false },
    { code: 'hardcore', name: 'Hardcore Championship', img: 'hardcore.png', holderId: titles.hardcore, isTag: false },
    { code: 'tag', name: 'World Tag Team Championship', img: 'tag_title.png', holderId: [titles.tag1, titles.tag2], isTag: true }
  ];

  championshipRoster.forEach(title => {
    const btn = document.createElement('button');
    btn.style.width = '100%';
    btn.style.padding = '12px 14px';
    btn.style.fontFamily = "'Russo One', sans-serif";
    btn.style.fontSize = '0.82rem';
    btn.style.textTransform = 'uppercase';
    btn.style.textAlign = 'center';
    btn.style.transition = 'all 0.2s';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'space-between';

    if (title.isTag) {
      const h1 = allWrestlers.find(w => w.id === titles.tag1);
      const h2 = allWrestlers.find(w => w.id === titles.tag2);
      const isVacant = !titles.tag1 && !titles.tag2;
      const champNames = (h1 && h2) ? `${h1.name} & ${h2.name}` : (h1 ? h1.name : (h2 ? h2.name : 'Vacant'));
      const champInMatch = participantIds.includes(titles.tag1) || participantIds.includes(titles.tag2);

      if (!isTagMatch) {
        btn.className = 'action-btn'; btn.disabled = true; btn.style.opacity = '0.4'; btn.style.cursor = 'not-allowed';
        btn.innerHTML = `<span>🔒 ${title.name}</span> <span style="font-size:0.7rem; color:#aaa;">(TAG MATCH ONLY)</span>`;
      } else if (isVacant) {
        btn.className = 'action-btn btn-blue'; btn.style.borderColor = '#00ff66';
        btn.innerHTML = `<span>🏆 ${title.name}</span> <span style="font-size:0.7rem; color:#00ff66;">(VACANT - SANCTIONED)</span>`;
        btn.onclick = () => confirmTitleStake(title.code, title.name, title.img);
      } else if (champInMatch) {
        btn.className = 'action-btn btn-blue'; btn.style.borderColor = '#ffd700';
        btn.innerHTML = `<span>🏆 ${title.name}</span> <span style="font-size:0.7rem; color:#ffd700;">(CHAMP: ${champNames})</span>`;
        btn.onclick = () => confirmTitleStake(title.code, title.name, title.img);
      } else {
        btn.className = 'action-btn'; btn.disabled = true; btn.style.opacity = '0.4'; btn.style.cursor = 'not-allowed';
        btn.innerHTML = `<span>🔒 ${title.name}</span> <span style="font-size:0.7rem; color:#ff6666;">(CHAMPS NOT IN MATCH)</span>`;
      }
    } else {
      const holder = allWrestlers.find(w => w.id === title.holderId);
      const isVacant = !title.holderId;
      const champInMatch = participantIds.includes(title.holderId);
      const isSanctioned = isVacant || checkTitleChallengerEligibility(title.code, activeBookedMatch.participants, title.holderId);

      if (isVacant) {
        btn.className = 'action-btn btn-blue'; btn.style.borderColor = '#00ff66';
        btn.innerHTML = `<span>🏆 ${title.name}</span> <span style="font-size:0.7rem; color:#00ff66;">(VACANT - SANCTIONED)</span>`;
        btn.onclick = () => confirmTitleStake(title.code, title.name, title.img);
      } else if (champInMatch && isSanctioned) {
        btn.className = 'action-btn btn-blue'; btn.style.borderColor = '#ffd700';
        btn.innerHTML = `<span>🏆 ${title.name}</span> <span style="font-size:0.7rem; color:#ffd700;">(DEFENDING: ${holder.name.toUpperCase()})</span>`;
        btn.onclick = () => confirmTitleStake(title.code, title.name, title.img);
      } else if (champInMatch && !isSanctioned) {
        btn.className = 'action-btn'; btn.disabled = true; btn.style.opacity = '0.5'; btn.style.cursor = 'not-allowed';
        btn.innerHTML = `<span>🔒 ${title.name}</span> <span style="font-size:0.68rem; color:#ff4444;">(WRESTLER HAS NOT EARNED RIGHT TO TITLE SHOT)</span>`;
      } else {
        btn.className = 'action-btn'; btn.disabled = true; btn.style.opacity = '0.4'; btn.style.cursor = 'not-allowed';
        btn.innerHTML = `<span>🔒 ${title.name}</span> <span style="font-size:0.7rem; color:#ff6666;">(HELD BY ${holder ? holder.name.toUpperCase() : 'CHAMP'})</span>`;
      }
    }
    container.appendChild(btn);
  });
}

function confirmTitleStake(code, name, img) {
  try { const audio = typeof titleClinkSound !== 'undefined' ? titleClinkSound : new Audio('title_clink.mp3'); audio.currentTime = 0; audio.play().catch(() => {}); } catch(e){}
  activeBookedMatch.isTitleMatch = true;
  activeBookedMatch.titleCode = code;
  activeBookedMatch.titleName = name;
  activeBookedMatch.titleImg = img;
  window.closeTitleStakeModal();
  updateTitleStakeBtnUI();
}

window.closeTitleStakeModal = function() { setElDisplay('titleStakeModal', 'none'); };

function toggleTitleStakesInEngine() {
  const currentLevel = (typeof getGMLevel === 'function') ? getGMLevel() : 1;
  if (currentLevel < 2) {
    try { const audio = typeof anvilSlamSound !== 'undefined' ? anvilSlamSound : new Audio('anvil.mp3'); audio.currentTime = 0; audio.play().catch(() => {}); } catch(e){}
    alert("🔒 TITLE MATCHES ARE LOCKED!\n\nReach Level 2 to put a title on the line.");
    return;
  }

  if (activeBookedMatch.isTitleMatch) {
    activeBookedMatch.isTitleMatch = false;
    activeBookedMatch.titleCode = null;
    activeBookedMatch.titleName = null;
    activeBookedMatch.titleImg = null;
    updateTitleStakeBtnUI();
  } else {
    renderTitleStakeModal();
    setElDisplay('titleStakeModal', 'flex');
  }
}
window.toggleTitleStakesInEngine = toggleTitleStakesInEngine;

function updateTitleStakeBtnUI() {
  const btn = document.getElementById('titleToggleBtnInEngine');
  const banner = document.getElementById('titleMatchBanner');
  const previewWrapper = document.getElementById('qmTitlePreviewDisplay');
  const previewImg = document.getElementById('titlePreviewImg');

  if (btn) {
    if (getGMLevel() < 2) {
      btn.innerText = `🔒 TITLE MATCHES (LEVEL 2)`;
      btn.className = "action-btn";
      btn.style.opacity = '0.5';
    } else {
      btn.style.opacity = '1';
      if (activeBookedMatch.isTitleMatch) {
        btn.innerText = `🏆 ${activeBookedMatch.titleName.toUpperCase()} ON LINE!`;
        btn.className = "action-btn btn-red";
        btn.style.boxShadow = "0 0 20px #ffffff, inset 0 0 10px #ffffff";
      } else {
        btn.innerText = "PUT TITLE ON LINE";
        btn.className = "action-btn btn-blue";
        btn.style.boxShadow = "";
      }
    }
  }

  if (activeBookedMatch.isTitleMatch && activeMatchMode === 'quickMatch') {
    if (banner) banner.style.display = 'block';
    if (previewImg && previewWrapper) { previewImg.src = activeBookedMatch.titleImg; previewWrapper.style.display = 'block'; }
  } else {
    if (banner) banner.style.display = 'none';
    if (previewWrapper && !activeBookedMatch.isTitleMatch) previewWrapper.style.display = 'none';
  }
}

/* --------------------------------------------------------------------------
   5. MANDATORY CONTRACT SIGNING AT DAIS
   -------------------------------------------------------------------------- */
function checkAndTriggerContractSigning(onComplete) {
  const p = activeBookedMatch.participants || [];

  if (activeBookedMatch.isTitleMatch && p.length === 2 && activeBookedMatch.formatKey === '1v1') {
    const titles = typeof getTitleHolders === 'function' ? getTitleHolders() : {};
    const titleCode = activeBookedMatch.titleCode || 'whc';
    let champId = titles[titleCode];

    let champ = p.find(w => w.id === champId);
    let challenger = p.find(w => w.id !== champId);

    if (!champ) { champ = p[0]; challenger = p[1]; }

    const contenderLocks = typeof getContenderTitleShotLocks === 'function' ? getContenderTitleShotLocks() : [];
    const hasContenderLock = challenger && contenderLocks.includes(challenger.id);

    if (typeof getWrestlerMomentum === 'function') {
      const challengerMom = getWrestlerMomentum(challenger.id);
      if (challengerMom.status !== 'fire' && !hasContenderLock) {
        if (typeof onComplete === 'function') onComplete();
        return;
      }
    }

    if (typeof stopBGMForAction === 'function') stopBGMForAction();
    contractSigningCallback = onComplete;
    currentContractChamp = champ;
    currentContractChallenger = challenger;

    const modal = document.getElementById('contractSigningModal');
    const champImg = document.getElementById('contractChampImg');
    const challengerImg = document.getElementById('contractChallengerImg');
    const champName = document.getElementById('contractChampName');
    const challengerName = document.getElementById('contractChallengerName');
    const beltImg = document.getElementById('contractTitleBeltImg');
    const tableImg = document.getElementById('contractTableImg');
    const banner = document.getElementById('contractBannerText');
    const subText = document.getElementById('contractSubText');
    const actionArea = document.getElementById('contractActionArea');

    if (!modal || !champImg || !challengerImg) {
      contractSigningCallback = null;
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    openVideoModal();
    setElDisplay('player-container', 'none');
    setElDisplay('quickMatchBox', 'none');
    setElDisplay('liveBroadcastBug', 'none');
    setElDisplay('mitbBtn', 'none');

    champImg.src = (typeof getWrestlerPosePath === 'function') ? getWrestlerPosePath(champ) : champ.image;
    challengerImg.src = (typeof getWrestlerPosePath === 'function') ? getWrestlerPosePath(challenger) : challenger.image;
    if (champName) champName.innerText = champ.name.toUpperCase();
    if (challengerName) challengerName.innerText = challenger.name.toUpperCase();
    if (beltImg) beltImg.src = activeBookedMatch.titleImg || 'whc.png';

    if (tableImg) {
      tableImg.src = 'contract_table.png';
      tableImg.classList.remove('table-shake');
      tableImg.style.display = 'block';
    }

    if (banner) banner.innerText = `${activeBookedMatch.titleName.toUpperCase()} CONTRACT SIGNING`;
    const earnedWay = hasContenderLock ? 'A TITLE SHOT FROM GM ELLIS' : 'A WIN STREAK';
    if (subText) subText.innerText = `${champ.name.toUpperCase()} DEFENDS THE TITLE AGAINST #1 CONTENDER ${challenger.name.toUpperCase()}, WHO EARNED THE SHOT WITH ${earnedWay}. THE CONTRACT IS ON THE TABLE!`;
    if (actionArea) actionArea.innerHTML = `<button id="contractSignBtn" class="contract-action-btn" onclick="executeContractAction()">✍️ SIGN CONTRACT</button>`;

    modal.style.setProperty('z-index', '2147483646', 'important');
    modal.style.display = 'flex';
  } else {
    if (typeof onComplete === 'function') onComplete();
  }
}

window.executeContractAction = function() {
  const tableImg = document.getElementById('contractTableImg');
  const banner = document.getElementById('contractBannerText');
  const subText = document.getElementById('contractSubText');
  const actionArea = document.getElementById('contractActionArea');

  const champ = currentContractChamp || activeBookedMatch.participants[0];
  const challenger = currentContractChallenger || activeBookedMatch.participants[1];

  if (actionArea) actionArea.innerHTML = '';

  const isBrawl = Math.random() < 0.30;

  if (!isBrawl) {
    try { const audio = typeof penSignSound !== 'undefined' ? penSignSound : new Audio('pen_sign.mp3'); audio.currentTime = 0; audio.play().catch(() => {}); } catch (e) {}
    if (banner) banner.innerText = "CONTRACT SIGNED!";
    if (subText) subText.innerText = `✍️ Both superstars ink the contract without throwing hands! Intense venom in the stare-down, but officials maintain order. This championship main event is locked in!`;

    if (typeof logShowFalloutEvent === 'function') {
      logShowFalloutEvent('signing', `✍️ CONTRACT SIGNED: ${champ.name.toUpperCase()} and ${challenger.name.toUpperCase()} made the Title Match official!`);
    }

    if (actionArea) {
      actionArea.innerHTML = `<button class="contract-action-btn" onclick="finishContractSigning()">PROCEED TO RINGSIDE ➔</button>`;
    }

  } else {
    try { const audio = typeof tableCrashSound !== 'undefined' ? tableCrashSound : new Audio('table.mp3'); audio.currentTime = 0; audio.play().catch(() => {}); } catch (e) {}
    try { if (typeof playSubBassBoom === 'function') playSubBassBoom(); } catch(e){}

    if (tableImg) {
      tableImg.classList.add('table-shake');
      tableImg.src = 'table_broken.png';
    }

    if (typeof addOrUpdateRivalry === 'function') {
      addOrUpdateRivalry(champ.id, challenger.id, "Contract Signing Table Brawl", 2);
    }

    const brawler = Math.random() > 0.5 ? champ : challenger;
    const victim = brawler.id === champ.id ? challenger : champ;

    if (banner) banner.innerText = "💥 TOTAL BACKSTAGE CARNAGE!";
    if (subText) subText.innerText = `🚨 THE SIGNING EXPLODED INTO VIOLENCE! ${brawler.name.toUpperCase()} flipped the heavy oak table and smashed ${victim.name.toUpperCase()} through the splintered wood! Rivalry heat escalated to BOILING!`;

    if (typeof logShowFalloutEvent === 'function') {
      logShowFalloutEvent('brawl', `💥 TABLE BRAWL: ${brawler.name.toUpperCase()} drove ${victim.name.toUpperCase()} through the table at the Contract Signing!`);
    }

    if (actionArea) {
      actionArea.innerHTML = `<button class="contract-action-btn" style="background:#ff3333; color:#fff;" onclick="finishContractSigning()">RUSH TO RINGSIDE ➔</button>`;
    }
  }

  if (typeof unlockAchievement === 'function') unlockAchievement('dotted_line');
};

window.finishContractSigning = function() {
  const modal = document.getElementById('contractSigningModal');
  if (modal) modal.style.display = 'none';
  setElDisplay('player-container', 'block');
  const cb = contractSigningCallback;
  contractSigningCallback = null;
  if (typeof cb === 'function') cb();
};

/* --------------------------------------------------------------------------
   6. HANDPICK COMPETITORS & SPECIAL REFEREE SELECTION
   -------------------------------------------------------------------------- */
window.selectMitbEntrantCount = function(count) {
  mitbEntrantCount = count;
  activeBookedMatch.formatCount = count;
  activeBookedMatch.formatKey = "mitb";
  activeBookedMatch.matchType = "Money in the Bank";
  initHandpickSlots(count);
  navGoToStep(5);
};

window.selectRumbleEntrantCount = function(count) {
  const unlockedWrestlers = (typeof window.wrestlers !== 'undefined' && Array.isArray(window.wrestlers) && window.wrestlers.length > 0)
    ? window.wrestlers.filter(w => !(typeof getInjuryRecord === 'function' && getInjuryRecord(w.id)))
    : (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers().filter(w => !(typeof getInjuryRecord === 'function' && getInjuryRecord(w.id))) : defaultWrestlers);

  if (unlockedWrestlers.length < 2) {
    alert("You need at least 2 unlocked, active superstars to host a Royal Rumble!");
    return;
  }

  const safeCount = Math.min(count, unlockedWrestlers.length);
  if (safeCount < count) {
    alert(`Your roster currently has ${safeCount} active superstars. Draft adjusted to ${safeCount} entrants!`);
  }

  rumbleEntrantCount = safeCount;
  activeBookedMatch.formatCount = safeCount;
  activeBookedMatch.formatKey = "rumble";
  activeBookedMatch.matchType = "Royal Rumble Match";
  
  const shuffled = [...unlockedWrestlers].sort(() => Math.random() - 0.5);
  pickedParticipants = shuffled.slice(0, safeCount);
  activeBookedMatch.participants = [...pickedParticipants];
  quickMatchQueue = [...pickedParticipants];
  
  rumbleUnenteredQueue = [...activeBookedMatch.participants];
  rumbleInRingList = [];
  rumbleEliminatedList = [];
  window.rumbleConcluded = false; // BATCH 7 ITEM 6
  rumbleEntrant1 = rumbleUnenteredQueue.shift();
  rumbleEntrant2 = rumbleUnenteredQueue.shift();

  if (activeBookedMatch.showKey && activeBookedMatch.showKey !== 'none' && showIntros[activeBookedMatch.showKey]) {
    setElDisplay('quickMatchBox', 'none');
    ensureSkipIntroBtnPosition();
    setElDisplay('skipIntroOverlayBtn', 'block');
    setElDisplay('rushRingOverlayBtn', 'block');
    
    loadAndPlayYouTube(showIntros[activeBookedMatch.showKey], false, true, false, true);
  } else {
    launchRumbleEntrants();
  }
};

function initHandpickSlots(count) {
  pickedParticipants = new Array(count).fill(null);
  pickedReferee = null;
  renderHandpickSlotsUI();
}

function renderHandpickSlotsUI() {
  const grid = document.getElementById('handpickSlotsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  pickedParticipants.forEach((w, idx) => {
    const slot = document.createElement('div');
    let labelText = `SLOT ${idx+1}`;
    if (activeBookedMatch.formatKey === 'tag') {
      labelText = idx < 2 ? `TEAM 1 - #${idx+1}` : `TEAM 2 - #${idx-1}`;
    }
    if (w) {
      slot.className = 'handpick-slot-card filled';
      slot.innerHTML = `<img src="${w.image}" alt="${w.name}" onerror="handleImgError(this, '${w.id}')"><div style="font-family:'Russo One'; font-size:0.75rem; text-align:center; color:#fff;">${w.name}</div>`;
    } else {
      slot.className = 'handpick-slot-card';
      slot.innerHTML = `<div style="font-family:'Russo One'; font-size:1.8rem; color:#ffffff;">+</div><div style="font-size:0.68rem; color:#aaa;">${labelText}</div>`;
    }
    slot.onclick = () => window.openSlotPickerModal(idx);
    grid.appendChild(slot);
  });

  const refContainer = document.getElementById('qmSlotRefContainer');
  const refName = document.getElementById('qmRefSlotName');
  const refBox = document.getElementById('qmRefSlotBox');
  if (refContainer && refName && refBox) {
    if (activeBookedMatch.matchType === 'Special Guest Referee') {
      refContainer.style.display = 'flex';
      if (pickedReferee) {
        refName.innerText = pickedReferee.name.toUpperCase();
        refBox.classList.add('filled');
      } else {
        refName.innerText = 'CHOOSE REF';
        refBox.classList.remove('filled');
      }
    } else {
      refContainer.style.display = 'none';
      pickedReferee = null;
    }
  }

  const confirmBtn = document.getElementById('confirmHandpickBtn');
  const allFilled = pickedParticipants.every(w => w !== null);
  const refOk = (activeBookedMatch.matchType !== 'Special Guest Referee') || (pickedReferee !== null);
  const canConfirm = allFilled && refOk;

  if (confirmBtn) {
    confirmBtn.style.opacity = canConfirm ? '1' : '0.5';
    confirmBtn.style.pointerEvents = canConfirm ? 'auto' : 'none';
  }
}

window.openSlotPickerModal = function(slotIdx) {
  activeSlotIdx = slotIdx;
  const list = document.getElementById('slotPickerList');
  const title = document.getElementById('slotPickerTitle');
  if (title) title.innerText = `Select Superstar for Slot #${slotIdx + 1}`;
  if (!list) return;
  list.innerHTML = '';

  const allWrestlers = typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers().filter(w => typeof getInjuryRecord === 'function' && !getInjuryRecord(w.id)) : defaultWrestlers;
  allWrestlers.forEach(w => {
    const isAlreadyPicked = pickedParticipants.some((p, i) => p && p.id === w.id && i !== activeSlotIdx);
    const isChosenRef = pickedReferee && pickedReferee.id === w.id;
    if (!isAlreadyPicked && !isChosenRef) {
      const card = document.createElement('div');
      card.className = 'vs-wrestler';
      card.style.animationDelay = '0s';
      card.innerHTML = `<img src="${w.image}" alt="${w.name}" onerror="handleImgError(this, '${w.id}')"><div>${w.name}</div>`;
      card.onclick = () => {
        pickedParticipants[activeSlotIdx] = w;
        window.closeSlotPickerModal();
        renderHandpickSlotsUI();
      };
      list.appendChild(card);
    }
  });
  setElDisplay('slotPickerModal', 'flex');
};

window.openSuperstarPickerForRef = function() {
  const list = document.getElementById('slotPickerList');
  const title = document.getElementById('slotPickerTitle');
  if (title) title.innerText = 'SELECT GUEST REFEREE';
  if (!list) return;
  list.innerHTML = '';

  const allWrestlers = typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers().filter(w => typeof getInjuryRecord === 'function' && !getInjuryRecord(w.id)) : defaultWrestlers;

  allWrestlers.forEach(w => {
    const card = document.createElement('div');
    card.className = 'vs-wrestler';
    card.style.animationDelay = '0s';
    card.innerHTML = `<img src="${w.image}" alt="${w.name}" onerror="handleImgError(this, '${w.id}')"><div>${w.name}</div>`;
    card.onclick = () => {
      pickedReferee = w;
      window.closeSlotPickerModal();
      if (title) title.innerText = 'Select Superstar';
      renderHandpickSlotsUI();
    };
    list.appendChild(card);
  });
  setElDisplay('slotPickerModal', 'flex');
};

window.closeSlotPickerModal = function() { setElDisplay('slotPickerModal', 'none'); };

window.confirmHandpickLineup = function() {
  if (pickedParticipants.some(w => w === null)) { alert("Please fill all superstar competitor slots!"); return; }
  if (activeBookedMatch.matchType === 'Special Guest Referee' && !pickedReferee) { alert("Please assign a Special Guest Referee for this match!"); return; }

  activeBookedMatch.participants = [...pickedParticipants];
  activeBookedMatch.referee = pickedReferee;
  activeBookedMatch.refereeId = pickedReferee ? pickedReferee.id : null;
  quickMatchQueue = [...activeBookedMatch.participants];

  const matchTypeEl = document.getElementById('qmMatchType');
  if (matchTypeEl) matchTypeEl.innerHTML = renderMatchLogoHTML(activeBookedMatch.matchType, 'locked-blue');

  const listContainer = document.getElementById('qmWrestlersList');
  if (listContainer) {
    listContainer.innerHTML = '';
    quickMatchQueue.forEach((w, idx) => {
      const wBlock = document.createElement('div');
      wBlock.className = 'vs-wrestler';
      wBlock.style.animationDelay = `${idx * 0.8}s`;
      wBlock.innerHTML = `<img src="${w.image}" alt="${w.name}" onerror="handleImgError(this, '${w.id}')"><div>${w.name}</div>`;
      listContainer.appendChild(wBlock);
      
      setTimeout(() => {
        try {
          const slam = typeof matchCardSlamSound !== 'undefined' ? matchCardSlamSound : new Audio('match_card_slam.mp3');
          slam.currentTime = 0; slam.volume = 0.75; slam.play().catch(() => {});
        } catch (e) {}
      }, idx * 800);

      if (idx < quickMatchQueue.length - 1) {
        const vsBlock = document.createElement('div');
        vsBlock.className = 'vs-divider';
        vsBlock.style.animationDelay = `${(idx * 0.8) + 0.4}s`;
        vsBlock.innerText = (activeBookedMatch.formatKey === 'tag' && idx === 1) ? 'VS (TAG TEAM)' : 'VS';
        listContainer.appendChild(vsBlock);
      }
    });

    if (pickedReferee) {
      const refBlock = document.createElement('div');
      refBlock.className = 'vs-wrestler';
      refBlock.style.animationDelay = `${quickMatchQueue.length * 0.8}s`;
      refBlock.innerHTML = `<div style="font-size:1.6rem;">👔</div><div style="color:#ffd700; font-size:0.75rem;">REF: ${pickedReferee.name}</div>`;
      listContainer.appendChild(refBlock);
      
      setTimeout(() => {
        try {
          const slam = typeof matchCardSlamSound !== 'undefined' ? matchCardSlamSound : new Audio('match_card_slam.mp3');
          slam.currentTime = 0; slam.volume = 0.75; slam.play().catch(() => {});
        } catch (e) {}
      }, quickMatchQueue.length * 800);
    }
  }

  navGoToStep(6);
  setTimeout(() => { setElDisplay('qmButtons', 'flex'); }, (quickMatchQueue.length * 0.8) * 1000);
};
/* ==========================================================================
   ELLIS'S MAIN EVENT (EWF UNIVERSE) - MODULAR ENGINE
   MODULE 5 OF 5: js/5-match-engine.js (PART 2 OF 4)
   Mystery Roulette, Match Card Matrix, Entrances, Royal Rumble & Telemetry HUD
   ========================================================================== */

/* --------------------------------------------------------------------------
   7. MYSTERY MATCH ROULETTE & SPECIAL REFEREE AUTO-DRAFT
   -------------------------------------------------------------------------- */
window.launchMysteryMatchDirect = function() {
  if (typeof ensureRosterReady === 'function' && !ensureRosterReady(2)) return; // BATCH 7 ITEM 14
  isMysteryMatchMode = true;
  openMatchEngine(true);
  navGoToStep(7);

  const slotContainer = document.getElementById('mysterySlotContainer');
  if (slotContainer) {
    slotContainer.style.background = "url('slot_machine_frame.png') no-repeat center center / contain";
    slotContainer.style.padding = "25px";
  }

  spinMysteryRouletteStaged();
};

window.pullSlotLever = function() {
  if (isSlotSpinning) return;
  const leverContainer = document.getElementById('slotLeverContainer');
  if (leverContainer) {
    leverContainer.classList.add('pulled');
    try { const audio = typeof slotLockSound !== 'undefined' ? slotLockSound : new Audio('slot_lock.mp3'); audio.currentTime = 0; audio.play().catch(() => {}); } catch (e) {}
    setTimeout(() => { leverContainer.classList.remove('pulled'); spinMysteryRouletteStaged(); }, 380);
  } else { spinMysteryRouletteStaged(); }
};

function triggerChassisShake() {
  const wrapper = document.getElementById('slotCabinetWrapper');
  if (wrapper) {
    wrapper.classList.remove('shake');
    void wrapper.offsetWidth;
    wrapper.classList.add('shake');
  }
}

// BATCH 8 ITEM 2: stop the Mystery Match reels, timers and spin/lock sounds
window.mysteryRouletteTimers = [];
window.stopMysteryRoulette = function() {
  try { (window.mysteryRouletteTimers || []).forEach(id => clearTimeout(id)); } catch (e) {}
  window.mysteryRouletteTimers = [];
  try { if (typeof rouletteInterval !== 'undefined') clearInterval(rouletteInterval); } catch (e) {}
  try { if (typeof slotSpinSound !== 'undefined') { slotSpinSound.pause(); slotSpinSound.currentTime = 0; } } catch (e) {}
  try { if (typeof slotLockSound !== 'undefined') { slotLockSound.pause(); slotLockSound.currentTime = 0; } } catch (e) {}
  try { if (typeof isSlotSpinning !== 'undefined') isSlotSpinning = false; } catch (e) {}
};

function spinMysteryRouletteStaged() {
  // BATCH 8 ITEM 2: track every reel timer so leaving early stops the reels and their sounds
  if (typeof window.stopMysteryRoulette === 'function') window.stopMysteryRoulette();
  const T = (fn, ms) => { const id = setTimeout(fn, ms); window.mysteryRouletteTimers.push(id); return id; };
  const gmLevel = (typeof getGMLevel === 'function') ? getGMLevel() : 1;
  const allWrestlers = typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers().filter(w => typeof getInjuryRecord === 'function' && !getInjuryRecord(w.id)) : defaultWrestlers;
  if (allWrestlers.length < 2) { alert("Add at least 2 active, uninjured wrestlers!"); window.closeVideoModal(); return; }

  const eligibleTypes = allMatchTypes.filter(type => {
    if (isMatchTypeLocked(type).locked) return false;
    return true;
  });

  isSlotSpinning = true;
  setElDisplay('rouletteStartBtn', 'none');
  setElDisplay('rouletteRespinBtn', 'none');
  const ticker = document.getElementById('slotLedTicker');
  if (ticker) ticker.innerText = "*** SELECTING HIGH STAKES MATCHUP... ***";

  const reelShow = document.getElementById('reelShow');
  const reelFormat = document.getElementById('reelFormat');
  const reelType = document.getElementById('reelType');
  const showText = document.getElementById('rouletteShowText');
  const formatText = document.getElementById('rouletteFormatText');
  const typeText = document.getElementById('rouletteTypeText');
  const listContainer = document.getElementById('rouletteWrestlersList');

  const eligibleShows = showKeys.filter(k => !isShowLocked(k).locked);

  [reelShow, reelFormat, reelType].forEach(r => { if (r) r.className = 'roulette-reel spinning'; });
  if (listContainer) listContainer.innerHTML = '';
  try { if (typeof slotSpinSound !== 'undefined') { slotSpinSound.currentTime = 0; slotSpinSound.play().catch(() => {}); } } catch (e) {}

  clearInterval(rouletteInterval);
  rouletteInterval = setInterval(() => {
    if (showText && reelShow.classList.contains('spinning')) {
      const key = eligibleShows[Math.floor(Math.random() * eligibleShows.length)];
      showText.innerHTML = `<img src="${getShowLogo(key)}" style="max-height: 56px; max-width: 90%; object-fit: contain;">`;
    }
    if (formatText && reelFormat.classList.contains('spinning')) {
      const fmtLogo = mysteryFormatLogos[Math.floor(Math.random() * mysteryFormatLogos.length)];
      formatText.innerHTML = `<img src="${fmtLogo}" style="max-height: 56px; max-width: 90%; object-fit: contain;">`;
    }
    if (typeText && reelType.classList.contains('spinning')) {
      const mt = eligibleTypes[Math.floor(Math.random() * eligibleTypes.length)];
      if (mt === 'Special Guest Referee') {
        typeText.innerHTML = `<img src="special_referee.png" style="max-height: 56px; max-width: 90%; object-fit: contain;">`;
      } else {
        typeText.innerHTML = renderMatchLogoHTML(mt, '', true);
      }
    }
  }, 70);

  T(() => {
    const randomShow = eligibleShows[Math.floor(Math.random() * eligibleShows.length)];
    activeBookedMatch.showKey = randomShow;
    if (reelShow) reelShow.className = `roulette-reel locked-blue`;
    if (showText) showText.innerHTML = `<img src="${getShowLogo(randomShow)}" style="max-height: 56px; max-width: 90%; object-fit: contain;">`;
    triggerChassisShake();
    try { if(typeof slotLockSound !== 'undefined') { slotLockSound.currentTime = 0; slotLockSound.play().catch(() => {}); } } catch (e) {}
  }, 5000);

  T(() => {
    const possibleFormats = [2, 3, 4];
    const randomCount = possibleFormats[Math.floor(Math.random() * possibleFormats.length)];
    activeBookedMatch.formatCount = randomCount;
    activeBookedMatch.formatKey = randomCount === 2 ? '1v1' : randomCount === 3 ? 'triple' : 'fatal';
    const fIdx = formatKeys.indexOf(activeBookedMatch.formatKey);
    if (reelFormat) reelFormat.className = `roulette-reel locked-red`;
    if (formatText) formatText.innerHTML = `<img src="${formatLogos[fIdx]}" style="max-height: 56px; max-width: 90%; object-fit: contain;">`;
    triggerChassisShake();
    try { if(typeof slotLockSound !== 'undefined') { slotLockSound.currentTime = 0; slotLockSound.play().catch(() => {}); } } catch (e) {}
  }, 10000);

  T(() => {
    const randomType = eligibleTypes[Math.floor(Math.random() * eligibleTypes.length)];
    activeBookedMatch.matchType = randomType;
    if (reelType) reelType.className = `roulette-reel locked-blue`;

    if (typeText) {
      if (randomType === 'Special Guest Referee') {
        typeText.innerHTML = `<img src="special_referee.png" style="max-height: 40px; max-width: 90%; object-fit: contain; margin-bottom:4px;">`;
      } else {
        typeText.innerHTML = renderMatchLogoHTML(randomType, 'locked-blue', true);
      }
    }

    triggerChassisShake();
    try { if (typeof slotSpinSound !== 'undefined') slotSpinSound.pause(); } catch (e) {}
    try { if (typeof slotLockSound !== 'undefined') { slotLockSound.currentTime = 0; slotLockSound.play().catch(() => {}); } } catch (e) {}
    clearInterval(rouletteInterval);
  }, 15000);

  T(() => {
    if (typeof triggerCameraFlash === 'function') triggerCameraFlash();
    const shuffled = [...allWrestlers].sort(() => Math.random() - 0.5);
    activeBookedMatch.participants = shuffled.slice(0, activeBookedMatch.formatCount);
    quickMatchQueue = [...activeBookedMatch.participants];

    if (activeBookedMatch.matchType === 'Special Guest Referee') {
      const participantIds = activeBookedMatch.participants.map(p => p.id);
      const eligibleRefs = allWrestlers.filter(w => !participantIds.includes(w.id));
      if (eligibleRefs.length > 0) {
        const chosenRef = eligibleRefs[Math.floor(Math.random() * eligibleRefs.length)];
        activeBookedMatch.referee = chosenRef;
        activeBookedMatch.refereeId = chosenRef.id;
        pickedReferee = chosenRef;
        if (typeText) {
          typeText.innerHTML = `
            <img src="special_referee.png" style="max-height: 38px; max-width: 90%; object-fit: contain; margin-bottom:4px;">
            <div style="font-size:0.65rem; color:#000; background:#ffd700; padding:2px 8px; border-radius:12px; font-weight:bold;">ZEBRA: ${chosenRef.name.toUpperCase()}</div>
          `;
        }
      }
    } else {
      activeBookedMatch.referee = null;
      activeBookedMatch.refereeId = null;
      pickedReferee = null;
    }

    if (listContainer) {
      listContainer.innerHTML = '';
      activeBookedMatch.participants.forEach((w, idx) => {
        const card = document.createElement('div');
        card.className = 'vs-wrestler';
        card.style.animationDelay = `${idx * 0.8}s`;
        card.innerHTML = `<img src="${w.image}" alt="${w.name}" onerror="handleImgError(this, '${w.id}')"><div>${w.name}</div>`;
        listContainer.appendChild(card);
        
        T(() => {
          try {
            const slam = typeof matchCardSlamSound !== 'undefined' ? matchCardSlamSound : new Audio('match_card_slam.mp3');
            slam.currentTime = 0; slam.volume = 0.75; slam.play().catch(() => {});
          } catch (e) {}
        }, idx * 800);
      });

      if (pickedReferee) {
        const refCard = document.createElement('div');
        refCard.className = 'vs-wrestler';
        refCard.style.animationDelay = `${activeBookedMatch.participants.length * 0.8}s`;
        refCard.innerHTML = `<div style="font-size:1.6rem;">👔</div><div style="color:#00ff66; font-size:0.72rem;">REF: ${pickedReferee.name}</div>`;
        listContainer.appendChild(refCard);
        
        T(() => {
          try {
            const slam = typeof matchCardSlamSound !== 'undefined' ? matchCardSlamSound : new Audio('match_card_slam.mp3');
            slam.currentTime = 0; slam.volume = 0.75; slam.play().catch(() => {});
          } catch (e) {}
        }, activeBookedMatch.participants.length * 800);
      }
    }

    isSlotSpinning = false;
    setElDisplay('rouletteStartBtn', 'inline-block');
    setElDisplay('rouletteRespinBtn', 'inline-block');
    if (ticker) ticker.innerText = "*** MAIN EVENT LOCKED 🚨 PRESS START ENTRANCES ***";
  }, 16000);
}

/* --------------------------------------------------------------------------
   8. BROADCAST MATCH CARD MATRIX
   -------------------------------------------------------------------------- */
function ensureMatchCardStyles() {
  if (document.getElementById('ewf-tot-dynamic-css')) return;
  const style = document.createElement('style');
  style.id = 'ewf-tot-dynamic-css';
  style.textContent = `
    .tot-fatal-four {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      grid-template-rows: 1fr 1fr !important;
      gap: 10px 24px !important;
      width: 100% !important;
      height: 78vh !important;
      max-width: 1100px !important;
      margin: auto !important;
      position: relative !important;
      padding: 10px 20px 45px 20px !important;
      z-index: 5 !important;
    }
    .tot-six-man-mitb {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      grid-template-rows: 1fr 1fr !important;
      gap: 8px 14px !important;
      width: 100% !important;
      height: 78vh !important;
      max-width: 1150px !important;
      margin: auto !important;
      position: relative !important;
      padding: 10px 15px 45px 15px !important;
      z-index: 5 !important;
    }
    .tot-center-emblem {
      position: absolute !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 82px !important;
      height: 82px !important;
      background: radial-gradient(circle, #ffd700 0%, #b8860b 100%) !important;
      color: #000 !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-family: 'Russo One', sans-serif !important;
      font-size: 1.1rem !important;
      box-shadow: 0 0 25px rgba(255, 215, 0, 0.9) !important;
      border: 3px solid #ffffff !important;
      z-index: 50 !important;
      text-shadow: none !important;
    }
    .tot-mitb-briefcase-center {
      position: absolute !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 105px !important;
      height: 85px !important;
      object-fit: contain !important;
      pointer-events: none !important;
      z-index: 50 !important;
      filter: drop-shadow(0 0 25px rgba(255, 215, 0, 0.95)) !important;
    }
    .tot-cutout-stage-cell {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      overflow: visible !important;
    }
    .tot-hero-cutout {
      width: auto !important;
      max-width: 95% !important;
      object-fit: contain !important;
      object-position: bottom center !important;
      filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.95)) !important;
      transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1);
      margin-bottom: -6px;
      z-index: 2;
    }
    .tot-anchor-nameplate {
      position: relative;
      z-index: 10;
      width: 90%;
      max-width: 260px;
      background: linear-gradient(135deg, rgba(14, 16, 24, 0.95) 0%, rgba(24, 26, 38, 0.95) 100%);
      border: 1.5px solid rgba(255, 255, 255, 0.35);
      border-radius: 0px;
      clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
      padding: 6px 12px;
      text-align: center;
      box-shadow: 0 6px 18px rgba(0,0,0,0.9);
    }
    .tot-anchor-nameplate .tot-name {
      font-family: 'Russo One', sans-serif;
      font-size: clamp(0.95rem, 1.8vw, 1.15rem);
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tot-anchor-nameplate .tot-substat {
      font-family: 'Russo One', sans-serif;
      font-size: 0.68rem;
      letter-spacing: 0.5px;
      margin-top: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
  `;
  document.head.appendChild(style);
}

function ensureMatchCardOverlayInDOM() {
  let overlay = document.getElementById('matchCardOverlay');
  if (overlay) return overlay;

  const host = document.querySelector('.video-wrapper') || document.getElementById('videoModal') || document.body;
  overlay = document.createElement('div');
  overlay.id = 'matchCardOverlay';
  overlay.className = 'match-card-overlay';
  overlay.innerHTML = `
    <button class="skip-match-card-btn" id="skipMatchCardBtn" onclick="window.startMatchFromCard()">⏩ Skip Entrances</button>
    <div class="mc-slash mc-slash-blue"></div>
    <div class="mc-slash mc-slash-red"></div>
    <div class="mc-stage" id="mcStageInject"></div>
    <div class="mc-stipulation-banner" id="mcStipulationBanner"></div>
    <div class="mc-progress-track"><div class="mc-progress-bar" id="mcProgressBar"></div></div>
  `;
  host.appendChild(overlay);
  return overlay;
}

function launchMatchCardOverlay() {
  try {
    if (activeBookedMatch.formatKey === 'rumble' || (activeBookedMatch.matchType && activeBookedMatch.matchType.includes("Rumble"))) {
      return;
    }

    ensureMatchCardStyles();
    const overlay = ensureMatchCardOverlayInDOM();
    if (!overlay) return;
    clearTimeout(matchCardTimeout);

    const p = activeBookedMatch.participants || [];
    const format = activeBookedMatch.formatKey || '1v1';
    const showKey = activeBookedMatch.showKey || 'raw';

    const isMitbMatrix = (format === 'mitb' || p.length >= 6) && format !== 'rumble';
    const isFatalQuad = !isMitbMatrix && (format === 'fatal' || (format !== 'tag' && p.length === 4));
    const isTriple = !isMitbMatrix && !isFatalQuad && (format === 'triple' || p.length === 3);
    const isTagTeamDuo = !isMitbMatrix && !isFatalQuad && !isTriple && (format === 'tag' && p.length >= 4);

    const historyList = (typeof getHistory === 'function') ? getHistory() : [];
    const getWins = (id) => id ? historyList.filter(item => item && item.type === 'match' && item.winnerId === id).length : 0;

    const resolvePose = (w) => {
      if (!w) return 'logo_notext.png';
      if (w.poseImage) return w.poseImage;
      const cleanId = (w.id || '').replace('default-', '');
      return `${cleanId}_pose.png`;
    };

    const brandColors = {
      raw: { primary: '#d32f2f', secondary: '#7f0000' },
      smackdown: { primary: '#0066ff', secondary: '#002171' },
      summerslam: { primary: '#00e5ff', secondary: '#ff6600' },
      survivor: { primary: '#ff6600', secondary: '#990000' },
      kotr: { primary: '#9933ff', secondary: '#ffd700' },
      mania: { primary: '#ffd700', secondary: '#ffffff' },
      mitb: { primary: '#00cc66', secondary: '#ffd700' },
      backlash: { primary: '#ff2222', secondary: '#333344' },
      badblood: { primary: '#b71c1c', secondary: '#1a0000' },
      judgmentday: { primary: '#e0e0e0', secondary: '#4a148c' },
      nomercy: { primary: '#ff6d00', secondary: '#212121' }
    };
    const currentTheme = (typeof window.ewfShowTheme === 'function' && window.ewfShowTheme(showKey)) || brandColors[showKey] || brandColors.raw;

    const slashBlue = overlay.querySelector('.mc-slash-blue');
    const slashRed = overlay.querySelector('.mc-slash-red');
    if (slashBlue) slashBlue.style.background = `linear-gradient(115deg, ${currentTheme.primary} 0%, transparent 70%)`;
    if (slashRed) slashRed.style.background = `linear-gradient(295deg, ${currentTheme.secondary} 0%, transparent 70%)`;

    const eventLogoSrc = (showKey !== 'none') ? ((typeof getShowLogo === 'function') ? getShowLogo(showKey) : `${showKey}_logo.png`) : 'logo_notext.png';
    const titleImgHtml = activeBookedMatch.isTitleMatch ? `<img src="${activeBookedMatch.titleImg || 'whc.png'}" class="mc-title-belt" alt="Title">` : '';

    let refHtml = '';
    if (pickedReferee && pickedReferee.name) {
      refHtml = `<div class="mc-referee-badge" style="display:flex;"><span>👔 REFEREE:</span> <strong>${pickedReferee.name.toUpperCase()}</strong></div>`;
    }

    const stipBanner = document.getElementById('mcStipulationBanner');
    if (stipBanner) {
      const matchTypeStr = (activeBookedMatch.matchType || 'NORMAL MATCH').toUpperCase();
      let formatHeader = isMitbMatrix ? `MITB LADDER // ` : (isFatalQuad ? 'FATAL 4-WAY // ' : (isTriple ? 'TRIPLE THREAT // ' : (isTagTeamDuo ? 'TAG TEAM // ' : '')));
      const careerHeader = activeBookedMatch.isCareerMatch ? 'LOSER LEAVES EWF: ' : '';
      stipBanner.innerText = `// EWF MAIN EVENT // ${formatHeader}${careerHeader}${matchTypeStr} //`;
    }

    const stage = document.getElementById('mcStageInject');
    if (!stage) return;
    let revealSteps = [];

    const buildNameplateHTML = (w) => {
      let momText = '❄️ MOMENTUM: STABLE';
      let momColor = '#00e5ff';
      if (typeof getWrestlerMomentum === 'function') {
        const mom = getWrestlerMomentum(w.id);
        if (mom.status === 'fire') { momText = '🔥 ON FIRE'; momColor = '#ff5500'; }
        else if (mom.status === 'ice') { momText = '❄️ ICE COLD'; momColor = '#aaaaaa'; }
      }
      return `
        <div class="tot-anchor-nameplate">
          <div class="tot-name">${w.name.toUpperCase()}</div>
          <div class="tot-substat">
            <span style="color:#ffd700;">CAREER: ${getWins(w.id)} WINS</span>
            <span style="color:#666;">•</span>
            <span style="color:${momColor}; font-weight:bold;">${momText}</span>
          </div>
        </div>
      `;
    };

    if (isMitbMatrix) {
      stage.className = 'mc-stage';
      stage.innerHTML = `
        <div class="tot-six-man-mitb">
          <img src="mitb_briefcase.png" class="tot-mitb-briefcase-center" alt="Briefcase">
          ${p.slice(0, 6).map((w, idx) => `
            <div class="tot-cutout-stage-cell mc-reveal" id="mcReveal${idx+1}">
              <img src="${resolvePose(w)}" class="tot-hero-cutout" style="max-height:26vh;" alt="${w.name}" onerror="handleImgError(this, '${w.id}')">
              ${buildNameplateHTML(w)}
            </div>
          `).join('')}
        </div>
      `;
      revealSteps = p.slice(0, 6).map((_, idx) => `mcReveal${idx+1}`);

    } else if (isFatalQuad) {
      stage.className = 'mc-stage';
      stage.innerHTML = `
        <div class="tot-fatal-four">
          <div class="tot-center-emblem">4-WAY</div>
          ${p.slice(0, 4).map((w, idx) => `
            <div class="tot-cutout-stage-cell mc-reveal" id="mcReveal${idx+1}">
              <img src="${resolvePose(w)}" class="tot-hero-cutout" style="max-height:29vh;" alt="${w.name}" onerror="handleImgError(this, '${w.id}')">
              ${buildNameplateHTML(w)}
            </div>
          `).join('')}
        </div>
      `;
      revealSteps = ['mcReveal1', 'mcReveal2', 'mcReveal3', 'mcReveal4'];

    } else if (isTriple) {
      stage.className = 'mc-stage is-triple';
      stage.innerHTML = `
        <div class="mc-flank mc-reveal" id="mcReveal1">
          <div class="mc-pose-wrap"><img src="${resolvePose(p[0])}" class="mc-pose-img" alt="${p[0]?.name || ''}" onerror="handleImgError(this, '${p[0]?.id || ''}')"></div>
          <div class="mc-nameplate mc-nameplate-left" style="position:relative; bottom:0;"><div class="mc-name">${p[0]?.name?.toUpperCase()}</div><div class="mc-substat">${getWins(p[0]?.id)} WINS</div></div>
        </div>
        <div class="mc-flank mc-reveal" id="mcReveal2">
          <div class="mc-pose-wrap"><img src="${resolvePose(p[1])}" class="mc-pose-img" alt="${p[1]?.name || ''}" onerror="handleImgError(this, '${p[1]?.id || ''}')"></div>
          <div class="mc-nameplate" style="position:relative; bottom:0; border-color:#ffd700; box-shadow:0 0 16px rgba(255,215,0,0.6);"><div class="mc-name" style="color:#ffd700;">${p[1]?.name?.toUpperCase()}</div><div class="mc-substat">${getWins(p[1]?.id)} WINS</div></div>
        </div>
        <div class="mc-flank mc-reveal" id="mcReveal3">
          <div class="mc-pose-wrap"><img src="${resolvePose(p[2])}" class="mc-pose-img" alt="${p[2]?.name || ''}" onerror="handleImgError(this, '${p[2]?.id || ''}')"></div>
          <div class="mc-nameplate mc-nameplate-right" style="position:relative; bottom:0;"><div class="mc-name">${p[2]?.name?.toUpperCase()}</div><div class="mc-substat">${getWins(p[2]?.id)} WINS</div></div>
        </div>
        <div class="mc-center-col" style="position:absolute; bottom:20px; left:50%; transform:translateX(-50%); height:auto; padding-bottom:0; z-index:25;">
          <div class="mc-event-logo-box"><img src="${eventLogoSrc}" class="mc-event-logo" alt="Logo"></div>
          ${titleImgHtml} ${refHtml}
          <div class="mc-vs-badge" style="font-size:1.8rem; margin-top:2px; text-shadow:0 0 15px #ffd700; display:block !important;">TRIPLE THREAT</div>
        </div>
      `;
      revealSteps = ['mcReveal1', 'mcReveal2', 'mcReveal3'];

    } else if (isTagTeamDuo) {
      stage.className = 'mc-stage';
      stage.innerHTML = `
        <div class="mc-flank mc-flank-left mc-reveal" id="mcReveal1">
          <div class="mc-tag-team-flank">
            <img src="${resolvePose(p[0])}" class="mc-tag-partner-lead" alt="${p[0]?.name || ''}" onerror="handleImgError(this, '${p[0]?.id || ''}')">
            <img src="${resolvePose(p[1])}" class="mc-tag-partner-trail" alt="${p[1]?.name || ''}" onerror="handleImgError(this, '${p[1]?.id || ''}')">
          </div>
          <div class="mc-nameplate mc-nameplate-left mc-tag-dual-nameplate">
            <div style="display:flex; flex-direction:column; align-items:flex-end;">
              <div class="mc-name" style="font-size:1.15rem;">${p[0]?.name?.toUpperCase() || ''}</div>
              <div class="mc-substat">${getWins(p[0]?.id)} WINS</div>
            </div>
            <div style="font-family:'Russo One'; font-size:1.2rem; color:#0070f3; align-self:center;">&</div>
            <div style="display:flex; flex-direction:column; align-items:flex-start;">
              <div class="mc-name" style="font-size:1.15rem; color:#bbb;">${p[1]?.name?.toUpperCase() || ''}</div>
              <div class="mc-substat">${getWins(p[1]?.id)} WINS</div>
            </div>
          </div>
        </div>
        
        <div class="mc-center-col" style="z-index:25;">
          <div class="mc-event-logo-box"><img src="${eventLogoSrc}" class="mc-event-logo" alt="Logo"></div>
          ${titleImgHtml} ${refHtml}
          <div class="mc-vs-badge">VS</div>
        </div>

        <div class="mc-flank mc-flank-right mc-reveal" id="mcReveal2">
          <div class="mc-tag-team-flank" style="flex-direction:row-reverse;">
            <img src="${resolvePose(p[2])}" class="mc-tag-partner-lead" alt="${p[2]?.name || ''}" onerror="handleImgError(this, '${p[2]?.id || ''}')">
            <img src="${resolvePose(p[3])}" class="mc-tag-partner-trail" style="margin-right:-65px; margin-left:0;" alt="${p[3]?.name || ''}" onerror="handleImgError(this, '${p[3]?.id || ''}')">
          </div>
          <div class="mc-nameplate mc-nameplate-right mc-tag-dual-nameplate" style="flex-direction:row-reverse;">
            <div style="display:flex; flex-direction:column; align-items:flex-start;">
              <div class="mc-name" style="font-size:1.15rem;">${p[2]?.name?.toUpperCase() || ''}</div>
              <div class="mc-substat">${getWins(p[2]?.id)} WINS</div>
            </div>
            <div style="font-family:'Russo One'; font-size:1.2rem; color:#e50914; align-self:center;">&</div>
            <div style="display:flex; flex-direction:column; align-items:flex-end;">
              <div class="mc-name" style="font-size:1.15rem; color:#bbb;">${p[3]?.name?.toUpperCase() || ''}</div>
              <div class="mc-substat">${getWins(p[3]?.id)} WINS</div>
            </div>
          </div>
        </div>
      `;
      revealSteps = ['mcReveal1', 'mcReveal2'];

    } else {
      stage.className = 'mc-stage';
      stage.innerHTML = `
        <div class="mc-flank mc-flank-left mc-reveal" id="mcReveal1">
          <div class="mc-pose-wrap"><img src="${resolvePose(p[0])}" class="mc-pose-img" alt="${p[0]?.name || ''}" onerror="handleImgError(this, '${p[0]?.id || ''}')"></div>
          <div class="mc-nameplate mc-nameplate-left"><div class="mc-name">${p[0]?.name?.toUpperCase() || 'SUPERSTAR A'}</div><div class="mc-substat">${getWins(p[0]?.id)} CAREER WINS</div></div>
        </div>
        <div class="mc-center-col">
          <div class="mc-event-logo-box"><img src="${eventLogoSrc}" class="mc-event-logo" alt="Logo"></div>
          ${titleImgHtml} ${refHtml}
          <div class="mc-vs-badge">VS</div>
        </div>
        <div class="mc-flank mc-flank-right mc-reveal" id="mcReveal2">
          <div class="mc-pose-wrap"><img src="${resolvePose(p[1])}" class="mc-pose-img" alt="${p[1]?.name || ''}" onerror="handleImgError(this, '${p[1]?.id || ''}')"></div>
          <div class="mc-nameplate mc-nameplate-right"><div class="mc-name">${p[1]?.name?.toUpperCase() || 'SUPERSTAR B'}</div><div class="mc-substat">${getWins(p[1]?.id)} CAREER WINS</div></div>
        </div>
      `;
      revealSteps = ['mcReveal1', 'mcReveal2'];
    }

    const progressBar = document.getElementById('mcProgressBar');
    if (progressBar) {
      progressBar.classList.remove('animating');
      void progressBar.offsetWidth;
      progressBar.classList.add('animating');
    }

    overlay.style.display = 'flex';

    revealSteps.forEach((id, index) => {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.classList.add('revealed');
        try { const audio = typeof matchCardSlamSound !== 'undefined' ? matchCardSlamSound : new Audio('match_card_slam.mp3'); audio.currentTime = 0; audio.play().catch(() => {}); } catch(e){}
      }, 400 + (index * 800));
    });

    matchCardTimeout = setTimeout(() => { window.dismissMatchCardOverlay(); }, 14000);

  } catch (err) {
    console.error("Match card display error:", err);
  }
}

window.dismissMatchCardOverlay = function() {
  clearTimeout(matchCardTimeout);
  const overlay = document.getElementById('matchCardOverlay');
  if (overlay) overlay.style.display = 'none';
};

window.startMatchFromCard = function() {
  window.dismissMatchCardOverlay();
  if (activeBookedMatch.formatKey === 'rumble' || (activeBookedMatch.matchType && activeBookedMatch.matchType === 'Royal Rumble Match')) {
    launchRumbleEntrants();
  } else {
    playNextQuickMatchEntrant();
  }
};

/* --------------------------------------------------------------------------
   9. ENTRANCES & SPECIAL GUEST REFEREE INTRO
   -------------------------------------------------------------------------- */
window.startBookedMatchEntrances = function() {
  checkAndTriggerContractSigning(() => {
    executeMatchEntrancesSequence();
  });
};

function executeMatchEntrancesSequence() {
  activeMatchMode = 'quickMatch';
  if (typeof stopBGMForAction === 'function') stopBGMForAction();

  const isSpecialRefMatch = activeBookedMatch.matchType === 'Special Guest Referee';
  const refObj = activeBookedMatch.referee || (activeBookedMatch.refereeId ? (typeof getWrestlerById === 'function' ? getWrestlerById(activeBookedMatch.refereeId) : pickedReferee) : pickedReferee);

  if (isSpecialRefMatch && refObj && activeBookedMatch.formatKey !== 'rumble') {
    if (!quickMatchQueue.some(q => q.id === refObj.id)) {
      quickMatchQueue.unshift({
        ...refObj,
        isSpecialReferee: true
      });
    }
  }

  const names = (activeBookedMatch.participants || []).map(w => w.name).join(' vs ');
  const titleText = activeBookedMatch.isTitleMatch ? ` [${activeBookedMatch.titleName.toUpperCase()} ON LINE]` : "";
  const careerText = activeBookedMatch.isCareerMatch ? ` [CAREER TERMINATION MATCH]` : "";
  if (typeof saveHistoryLog === 'function') saveHistoryLog(`🥊 MATCH BOOKED: ${(activeBookedMatch.matchType || 'MATCH').toUpperCase()} (${names})${titleText}${careerText}`, 'booking');
  setElDisplay('quickMatchBox', 'none');

  clearTimeout(matchCardDelayTimeout);
  clearTimeout(matchCardTimeout);

  if (activeBookedMatch.showKey && activeBookedMatch.showKey !== 'none' && typeof showIntros !== 'undefined' && showIntros[activeBookedMatch.showKey]) {
    ensureSkipIntroBtnPosition();
    setElDisplay('skipIntroOverlayBtn', 'block');
    setElDisplay('rushRingOverlayBtn', 'block');
    loadAndPlayYouTube(showIntros[activeBookedMatch.showKey], false, true, false, true);
    
    matchCardDelayTimeout = setTimeout(() => { launchMatchCardOverlay(); }, 3000);
  } else {
    if (activeBookedMatch.formatKey === 'rumble' || (activeBookedMatch.matchType && activeBookedMatch.matchType === 'Royal Rumble Match')) {
      launchRumbleEntrants();
    } else {
      playNextQuickMatchEntrant();
    }
  }
}

window.skipShowIntroToEntrances = function() {
  clearTimeout(matchCardDelayTimeout);
  window.dismissMatchCardOverlay();
  setElDisplay('skipIntroOverlayBtn', 'none');
  
  if (activeBookedMatch.formatKey === 'rumble' || (activeBookedMatch.matchType && activeBookedMatch.matchType === 'Royal Rumble Match')) {
    launchRumbleEntrants();
  } else {
    playNextQuickMatchEntrant();
  }
};

window.skipDirectlyToMatchSimulation = function() {
  clearTimeout(matchCardDelayTimeout);
  window.dismissMatchCardOverlay();
  setElDisplay('skipIntroOverlayBtn', 'none');
  setElDisplay('rushRingOverlayBtn', 'none');
  
  if (activeBookedMatch.formatKey === 'rumble' || (activeBookedMatch.matchType && activeBookedMatch.matchType === 'Royal Rumble Match')) {
    launchRumbleEntrants();
  } else {
    quickMatchQueue = [];
    playNextQuickMatchEntrant();
  }
};

function playNextQuickMatchEntrant() {
  clearTimeout(matchCardDelayTimeout);
  window.dismissMatchCardOverlay();
  setElDisplay('skipIntroOverlayBtn', 'none');
  clearTimeout(rumbleEntrantTimeout);
  clearTimeout(rumbleEntranceDurationTimeout);
  let btn = document.getElementById('nextEntrantBtn');

  if (quickMatchQueue.length === 0) {
    showMatchInProgressWinnerScreen();
    return;
  }

  const nextWrestler = quickMatchQueue.shift();
  currentPlayingWrestler = nextWrestler;

  const refBanner = document.getElementById('specialRefBanner');
  const refName = document.getElementById('specialRefBannerName');
  if (nextWrestler.isSpecialReferee) {
    if (refName) refName.innerText = nextWrestler.name.toUpperCase();
    if (refBanner) refBanner.style.display = 'block';
  } else {
    if (refBanner) refBanner.style.display = 'none';
  }

  const closeBtn = document.getElementById('videoCloseBtn');
  const skipBtn = document.getElementById('skipIntroOverlayBtn');
  if (closeBtn) {
    closeBtn.style.setProperty('display', 'flex', 'important');
    closeBtn.style.setProperty('z-index', '2147483647', 'important');
  }
  if (skipBtn) {
    ensureSkipIntroBtnPosition();
    skipBtn.style.setProperty('z-index', '2147483647', 'important');
  }

  if (btn) {
    if (nextWrestler.isSpecialReferee) {
      btn.innerText = "Entrant 1 Entrance ➔";
      btn.onclick = playNextQuickMatchEntrant;
    } else if (quickMatchQueue.length > 0) {
      btn.innerText = `Next Competitor (${quickMatchQueue.length} Left) ➔`;
      btn.onclick = playNextQuickMatchEntrant;
    } else {
      btn.innerText = `RING THE BELL 🔔`;
      btn.onclick = () => {
        try {
          const audio = typeof bellSound !== 'undefined' ? bellSound : new Audio('bell.mp3');
          audio.currentTime = 0;
          audio.volume = 1.0;
          audio.play().catch(() => {});
        } catch (e) {}
        startLiveMatchStopwatch(true);
        showMatchInProgressWinnerScreen();
      };
    }
    btn.style.display = 'block';
  }
  loadAndPlayYouTube(nextWrestler.youtubeUrl, true, false, false, false);
}

/* --------------------------------------------------------------------------
   10. ROYAL RUMBLE MATCH ENGINE & INTERVAL TIMING
   -------------------------------------------------------------------------- */
window.launchRumbleEntrants = function() {
  activeMatchMode = 'rumble';
  if (typeof stopBGMForAction === 'function') stopBGMForAction();
  if (typeof stopMatchCrowd === 'function') stopMatchCrowd();
  
  if (!rumbleEntrant1 || !rumbleEntrant2) {
    startRumbleTimer();
    return;
  }
  
  setElDisplay('quickMatchBox', 'none');
  setElDisplay('player-container', 'block');
  setElDisplay('rumbleHoldingScreen', 'none');
  
  setElDisplay('skipIntroOverlayBtn', 'none');
  setElDisplay('beltEntranceOverlay', 'none');
  setElDisplay('titleMatchBanner', 'none');

  let btn = document.getElementById('nextEntrantBtn');
  if (btn) {
    btn.innerText = "Entrant 2 Entrance ➔";
    btn.onclick = playEntrant2;
    btn.style.display = 'block';
  }
  
  currentPlayingWrestler = rumbleEntrant1;
  loadAndPlayYouTube(rumbleEntrant1.youtubeUrl, true, true);
};

function playEntrant2() {
  let btn = document.getElementById('nextEntrantBtn');
  if (btn) {
    btn.innerText = "RING THE BELL 🔔";
    btn.onclick = startRumbleMatch;
  }
  currentPlayingWrestler = rumbleEntrant2;
  if (!rumbleInRingList.some(w => w.id === rumbleEntrant1.id)) rumbleInRingList.push(rumbleEntrant1);
  
  setElDisplay('skipIntroOverlayBtn', 'none');
  setElDisplay('beltEntranceOverlay', 'none');
  setElDisplay('titleMatchBanner', 'none');

  loadAndPlayYouTube(rumbleEntrant2.youtubeUrl, true, true);
}

function startRumbleMatch() {
  try {
    const audio = typeof bellSound !== 'undefined' ? bellSound : new Audio('bell.mp3');
    audio.currentTime = 0; audio.volume = 1.0;
    audio.play().catch(() => {});
  } catch (e) {}
  
  if (!rumbleInRingList.some(w => w.id === rumbleEntrant2.id)) rumbleInRingList.push(rumbleEntrant2);
  currentPlayingWrestler = null;
  startRumbleTimer();
}

window.triggerNextRumbleEntrantNow = function() {
  if (window.rumbleConcluded) return; // BATCH 7 ITEM 6
  clearInterval(rumbleTimerInterval);
  clearTimeout(rumbleEntrantTimeout);
  clearTimeout(rumbleEntranceDurationTimeout);

  if (!Array.isArray(rumbleUnenteredQueue) || rumbleUnenteredQueue.length === 0) {
    updateRumbleTimerUI();
    renderRumbleHudDOM();
    return;
  }

  const nextEntrant = rumbleUnenteredQueue.shift();
  if (!nextEntrant) return;

  if (!rumbleInRingList.some(w => w.id === nextEntrant.id)) {
    rumbleInRingList.push(nextEntrant);
  }

  if (typeof saveHistoryLog === 'function') {
    saveHistoryLog(`⏱️ ROYAL RUMBLE ENTRANT: ${nextEntrant.name.toUpperCase()} entered the Royal Rumble!`, 'match');
  }

  isMatchInProgressLooping = false;
  isPlayingCountdown = true;
  currentPlayingWrestler = nextEntrant;

  if (typeof stopMatchCrowd === 'function') stopMatchCrowd();
  if (typeof triggerCameraFlash === 'function') triggerCameraFlash();

  const modalEl = document.getElementById('videoModal');
  if (modalEl) modalEl.classList.remove('split-screen-mode');

  setElDisplay('quickMatchBox', 'none');
  setElDisplay('player-container', 'block');
  setElDisplay('rumbleHoldingScreen', 'none');
  setElDisplay('skipIntroOverlayBtn', 'none');
  setElDisplay('rushRingOverlayBtn', 'none');
  setElDisplay('beltEntranceOverlay', 'none');
  setElDisplay('titleMatchBanner', 'none');

  const btn = document.getElementById('nextEntrantBtn');

  const launchEntrantTheme = () => {
    clearTimeout(rumbleEntrantTimeout);
    isPlayingCountdown = false;

    if (btn) {
      btn.innerText = 'Return to Rumble Ring ➔';
      btn.style.display = 'block';
      btn.onclick = () => {
        clearTimeout(rumbleEntranceDurationTimeout);
        startRumbleTimer();
      };
    }

    if (typeof loadAndPlayYouTube === 'function' && nextEntrant.youtubeUrl) {
      loadAndPlayYouTube(nextEntrant.youtubeUrl, true, true, false, false);
      if (typeof triggerNameplate === 'function') {
        triggerNameplate(nextEntrant.name);
      }
    }

    rumbleEntranceDurationTimeout = setTimeout(() => {
      startRumbleTimer();
    }, 20000);
  };

  if (btn) {
    btn.innerText = '⏩ Skip Countdown ➔';
    btn.style.display = 'block';
    btn.onclick = launchEntrantTheme;
  }

  const countdownUrl = 'https://www.youtube.com/watch?v=3p9qUWS7EvQ';
  if (typeof loadAndPlayYouTube === 'function') {
    loadAndPlayYouTube(countdownUrl, false, true, false, true);
  }

  rumbleEntrantTimeout = setTimeout(() => {
    launchEntrantTheme();
  }, 11000);
};

function attachBackgroundLoopFallback(iframe, bgVideoId) {
  if (window._bgVideoLoopListener) {
    window.removeEventListener('message', window._bgVideoLoopListener);
    window._bgVideoLoopListener = null;
  }
  if (!iframe || !bgVideoId) return;

  const loopListener = (e) => {
    try {
      if (!isMatchInProgressLooping || isRunInActive) return;
      const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (data && data.event === 'onStateChange' && data.info === 0 && iframe.contentWindow) {
        iframe.contentWindow.postMessage('{"event":"command","func":"seekTo","args":[0,true]}', '*');
        iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      }
    } catch (_) {}
  };
  window._bgVideoLoopListener = loopListener;
  window.addEventListener('message', loopListener);
}

function startRumbleTimer() {
  // BATCH 7 ITEM 6: Once the Rumble has a winner, nothing may re-open the Rumble HUD
  if (window.rumbleConcluded) return;
  if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd(true);
  if (typeof enableWakeLock === 'function') enableWakeLock();
  isMatchInProgressLooping = true;
  activeMatchMode = 'rumble';
  
  let bgShowUrl = (activeBookedMatch.showKey && typeof showIntros !== 'undefined' && showIntros[activeBookedMatch.showKey]) ? showIntros[activeBookedMatch.showKey] : ((typeof showIntros !== 'undefined' && showIntros.raw) ? showIntros.raw : '');
  { const opts = String(bgShowUrl || '').split(',').map(u => u.trim()).filter(Boolean); bgShowUrl = opts[Math.floor(Math.random() * opts.length)] || bgShowUrl; } // pick one of the show's intros
  const bgVideoId = typeof extractVideoID === 'function' ? extractVideoID(bgShowUrl) : null;
  const iframe = document.getElementById('youtubeIframe');
  // BATCH 6 ITEM 8: Include &playlist=${bgVideoId}&enablejsapi=1 so background show intro loops continuously
  if (iframe && bgVideoId) {
    iframe.src = `https://www.youtube.com/embed/${bgVideoId}?autoplay=1&mute=1&loop=1&playlist=${bgVideoId}&enablejsapi=1&playsinline=1&controls=0&rel=0`;
    attachBackgroundLoopFallback(iframe, bgVideoId);
  }

  const modalEl = document.getElementById('videoModal');
  if (modalEl) {
    modalEl.classList.add('split-screen-mode');
    modalEl.style.setProperty('background-image', "linear-gradient(rgba(10, 10, 16, 0.65), rgba(10, 10, 16, 0.85)), url('rumble_bg.png')", 'important');
    modalEl.style.setProperty('background-size', 'cover', 'important');
    modalEl.style.setProperty('background-position', 'center center', 'important');
  }

  setElDisplay('player-container', 'block');
  setElDisplay('nextEntrantBtn', 'none');
  setElDisplay('skipIntroOverlayBtn', 'none');
  setElDisplay('videoCloseBtn', 'none');
  if (typeof hideNameplate === 'function') hideNameplate();
  setElDisplay('beltEntranceOverlay', 'none');
  setElDisplay('titleMatchBanner', 'none');

  const qmBox = document.getElementById('quickMatchBox');
  if (qmBox) {
    qmBox.classList.remove('roulette-active-mode');
    qmBox.style.setProperty('background-image', `radial-gradient(circle at top right, rgba(32, 44, 76, 0.45) 0%, rgba(14, 18, 30, 0.72) 100%), url('rumble_bg.png')`, 'important');
    qmBox.style.setProperty('background-size', 'cover', 'important');
    qmBox.style.setProperty('background-position', 'center center', 'important');
  }

  setElDisplay('quickMatchBox', 'flex');
  navGoToStep(10);
  
  renderRumbleHudDOM();

  if (typeof playRandomMatchCrowd === 'function') playRandomMatchCrowd(0.25);
  startLiveMatchStopwatch(true);

  rumbleTimerSeconds = 110;
  clearInterval(rumbleTimerInterval);

  if (rumbleUnenteredQueue.length > 0) {
    rumbleTimerInterval = setInterval(() => {
      rumbleTimerSeconds--;
      updateRumbleTimerUI();
      if (rumbleTimerSeconds <= 10 && rumbleTimerSeconds > 0) {
        if (typeof triggerCameraFlash === 'function') triggerCameraFlash();
      }
      if (rumbleTimerSeconds <= 0) {
        clearInterval(rumbleTimerInterval);
        triggerNextRumbleEntrantNow();
      }
    }, 1000);
  } else {
    const timerBox = document.getElementById('rumbleTimerContainer');
    const text = document.getElementById('rumbleUnenteredCountText');
    if (timerBox) timerBox.style.display = 'none';
    if (text) text.innerText = "🔥 ALL ENTRANTS IN THE RING!";
  }
}

function updateRumbleTimerUI() {
  const timerDisplay = document.getElementById('rumbleTimerDisplay');
  const timerContainer = document.getElementById('rumbleTimerContainer');
  
  if (rumbleUnenteredQueue.length > 0) {
    if (timerContainer) timerContainer.style.display = 'flex';
    if (timerDisplay) {
      const mins = Math.floor(rumbleTimerSeconds / 60);
      const secs = rumbleTimerSeconds % 60;
      timerDisplay.innerText = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
      
      if (rumbleTimerSeconds <= 10) {
        timerDisplay.style.color = '#ff3333';
        timerDisplay.style.textShadow = '0 0 15px #ff0000';
        timerDisplay.style.transform = (rumbleTimerSeconds % 2 === 0) ? 'scale(1.1)' : 'scale(1)';
      } else {
        timerDisplay.style.color = '#ffcc00';
        timerDisplay.style.textShadow = 'none';
        timerDisplay.style.transform = 'scale(1)';
      }
    }
  } else {
    if (timerContainer) timerContainer.style.display = 'none';
  }
}

function renderRumbleHudDOM() {
  const countText = document.getElementById('rumbleUnenteredCountText');
  if (countText) countText.innerText = `Entrants remaining in back: ${rumbleUnenteredQueue.length}`;
  
  const inRingGrid = document.getElementById('rumbleInRingList');
  if (inRingGrid) {
    inRingGrid.innerHTML = '';
    rumbleInRingList.forEach(w => {
      const card = document.createElement('div');
      card.className = 'vs-wrestler';
      card.style.setProperty('animation', 'none', 'important');
      card.style.setProperty('transform', 'none', 'important');
      card.innerHTML = `
        <img src="${w.image}" style="width:75px; height:75px; border-color:#00ffcc;" onerror="handleImgError(this, '${w.id}')">
        <div style="font-size:0.8rem;">${w.name}</div>
        <div style="font-size:0.65rem; color:#ff3333; margin-top:4px;">TAP TO ELIMINATE ✖</div>
      `;
      card.onclick = () => eliminateFromRumble(w);
      inRingGrid.appendChild(card);
    });
  }
  
  const elimSec = document.getElementById('rumbleEliminatedSection');
  const elimList = document.getElementById('rumbleEliminatedList');
  if (rumbleEliminatedList.length > 0) {
    if (elimSec) elimSec.style.display = 'block';
    if (elimList) {
      elimList.innerHTML = '';
      rumbleEliminatedList.forEach(w => {
        const card = document.createElement('div');
        card.className = 'vs-wrestler eliminated';
        card.style.opacity = '0.7';
        card.style.setProperty('animation', 'none', 'important');
        card.style.setProperty('transform', 'none', 'important');
        card.innerHTML = `<img src="${w.image}" style="width:60px; height:60px;" onerror="handleImgError(this, '${w.id}')"><div style="font-size:0.7rem;">${w.name}</div>`;
        elimList.appendChild(card);
      });
    }
  } else {
    if (elimSec) elimSec.style.display = 'none';
  }
}

// BATCH 6 ITEM 7: ROYAL RUMBLE FINALE STATE CLEANUP & WINNER NAMEPLATE LOCK
function eliminateFromRumble(wrestler) {
  if (rumbleUnenteredQueue.length === 0 && rumbleInRingList.length <= 1) return;
  
  if (typeof playEliminationAudio === 'function') playEliminationAudio();
  if (typeof triggerCameraFlash === 'function') triggerCameraFlash();
  
  rumbleInRingList = rumbleInRingList.filter(w => w.id !== wrestler.id);
  rumbleEliminatedList.unshift(wrestler);
  
  if (typeof saveHistoryLog === 'function') saveHistoryLog(`✖ ROYAL RUMBLE ELIMINATION: ${wrestler.name.toUpperCase()} was thrown over the top rope!`, 'match');
  renderRumbleHudDOM();

  if (rumbleUnenteredQueue.length === 0 && rumbleInRingList.length === 1) {
    const winner = rumbleInRingList[0];
    // BATCH 7 ITEM 6: Lock the Rumble as finished and kill any pending entrance timers
    window.rumbleConcluded = true;
    clearTimeout(rumbleEntrantTimeout);
    clearTimeout(rumbleEntranceDurationTimeout);
    setElDisplay('nextEntrantBtn', 'none');
    currentPlayingWrestler = winner;
    isMatchInProgressLooping = false;
    window.isMatchInProgressLooping = false;
    rumbleInRingList = [];

    clearInterval(rumbleTimerInterval);
    stopLiveMatchStopwatch();
    if (typeof stopMatchCrowd === 'function') stopMatchCrowd();
    if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd();

    if (typeof playEliminationAudio === 'function') playEliminationAudio();
    if (typeof saveHistoryLog === 'function') saveHistoryLog(`🏆 ROYAL RUMBLE WINNER: ${winner.name.toUpperCase()} survived the Royal Rumble Match!`, 'rumble', winner.id, 5);
    if (typeof unlockAchievement === 'function') unlockAchievement('iron_gauntlet');
    
    setTimeout(() => {
      currentPlayingWrestler = winner;
      setElDisplay('quickMatchBox', 'none');
      setElDisplay('rumbleTimerContainer', 'none');
      if (typeof showRumbleCoronationOverlay === 'function') showRumbleCoronationOverlay(winner);
    }, 1500);
  }
}

/* --------------------------------------------------------------------------
   11. LIVE MATCH STOPWATCH & TELEMETRY HUD
   -------------------------------------------------------------------------- */
function startLiveMatchStopwatch(reset = false) {
  clearInterval(liveMatchTimerInterval);
  if (reset) {
    liveMatchElapsedSeconds = 0;
  }
  updateLiveMatchClockUI();

  liveMatchTimerInterval = setInterval(() => {
    liveMatchElapsedSeconds++;
    updateLiveMatchClockUI();
    // BATCH 6 ITEM 9: Give armed injury comeback priority at 02:00 (120s)
    if (liveMatchElapsedSeconds === 120 && window.armedAmbushWrestler && !ambushTriggeredThisMatch) {
      executePendingReturnAmbushIfArmed();
    } else if (window.EWFP && typeof EWFP.tick === 'function') {
      // BATCH 10: random run-in time between 1:30 and 5:00, evening the odds, fake-outs, bad guy cheating
      EWFP.tick(liveMatchElapsedSeconds);
    } else if (liveMatchElapsedSeconds === 120 || liveMatchElapsedSeconds === 180) {
      checkUnpromptedAmbush();
    }
  }, 1000);
}

function stopLiveMatchStopwatch() {
  clearInterval(liveMatchTimerInterval);
}

function updateLiveMatchClockUI() {
  const clockEl = document.getElementById('telemetryMatchClock');
  if (!clockEl) return;
  const mins = Math.floor(liveMatchElapsedSeconds / 60);
  const secs = liveMatchElapsedSeconds % 60;
  clockEl.innerText = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  clockEl.style.setProperty('font-family', "'Orbitron', 'Share Tech Mono', monospace, sans-serif", 'important');
  clockEl.style.setProperty('font-size', "2.2rem", 'important');
  clockEl.style.setProperty('font-weight', "900", 'important');
  clockEl.style.setProperty('color', "#ff1111", 'important');
  clockEl.style.setProperty('text-shadow', "0 0 14px rgba(255, 0, 0, 0.9), 0 0 28px rgba(255, 0, 0, 0.6)", 'important');
}

function populateMatchTelemetry() {
  const typeEl = document.getElementById('telemetryMatchType');
  if (typeEl) {
    const careerHeader = activeBookedMatch.isCareerMatch ? 'LOSER LEAVES EWF: ' : '';
    const stip = activeBookedMatch.matchType || 'Normal Match';
    typeEl.innerText = `⚡ ${careerHeader}${stip.toUpperCase()}`;
  }

  const titleStrip = document.getElementById('telemetryTitleStrip');
  const beltImg = document.getElementById('telemetryBeltImg');
  const titleName = document.getElementById('telemetryTitleName');
  if (titleStrip && activeBookedMatch.isTitleMatch) {
    if (beltImg) beltImg.src = activeBookedMatch.titleImg || 'whc.png';
    const defCount = typeof getTitleDefenseCount === 'function' ? getTitleDefenseCount(activeBookedMatch.titleCode) : 0;
    const defTag = defCount > 0 ? ` (DEFENSE #${defCount + 1})` : ' (VACANT / FIRST DEFENSE)';
    if (titleName) titleName.innerText = `${(activeBookedMatch.titleName || 'CHAMPIONSHIP').toUpperCase()}${defTag}`;
    titleStrip.style.display = 'flex';
  } else if (titleStrip) {
    titleStrip.style.display = 'none';
  }

  const allianceStrip = document.getElementById('telemetryAllianceStrip');
  const allianceName = document.getElementById('telemetryAllianceName');
  const alliances = typeof getAlliances === 'function' ? getAlliances() : [];
  let foundAlliance = null;

  if (Array.isArray(alliances) && alliances.length > 0 && activeBookedMatch.participants) {
    const participantIds = activeBookedMatch.participants.map(p => p.id);
    foundAlliance = alliances.find(al => al && (participantIds.includes(al.p1) || participantIds.includes(al.p2)));
  } else if (alliances && typeof alliances === 'object' && !Array.isArray(alliances)) {
    const participantIds = (activeBookedMatch.participants || []).map(p => p.id);
    if (alliances.p1 && (participantIds.includes(alliances.p1) || participantIds.includes(alliances.p2))) {
      foundAlliance = alliances;
    }
  }

  if (allianceStrip && foundAlliance && foundAlliance.name) {
    if (allianceName) {
      allianceName.innerText = foundAlliance.name.toUpperCase();
      if (foundAlliance.color) {
        allianceName.style.color = foundAlliance.color;
        allianceStrip.style.borderColor = foundAlliance.color;
        allianceStrip.style.boxShadow = `0 0 10px ${foundAlliance.color}`;
      }
    }
    allianceStrip.style.display = 'flex';
  } else if (allianceStrip) {
    allianceStrip.style.display = 'none';
  }

  startLiveMatchStopwatch(false);
}

function showMatchInProgressWinnerScreen() {
  if (activeBookedMatch.formatKey === 'rumble' || activeBookedMatch.matchType === 'Royal Rumble Match' || (activeBookedMatch.matchType && activeBookedMatch.matchType.includes("Rumble"))) {
    if (window.rumbleConcluded) return; // BATCH 7 ITEM 6: Rumble already won, don't re-open the HUD
    startRumbleTimer();
    return;
  }

  window.dismissMatchCardOverlay();
  if (typeof enableWakeLock === 'function') enableWakeLock();
  isMatchInProgressLooping = true;
  isRunInActive = false;
  clearTimeout(runInAutoTimeout);
  clearTimeout(rumbleEntranceDurationTimeout);
  
  let bgShowUrl = (activeBookedMatch.showKey && typeof showIntros !== 'undefined' && showIntros[activeBookedMatch.showKey]) ? showIntros[activeBookedMatch.showKey] : ((typeof showIntros !== 'undefined' && showIntros.raw) ? showIntros.raw : '');
  { const opts = String(bgShowUrl || '').split(',').map(u => u.trim()).filter(Boolean); bgShowUrl = opts[Math.floor(Math.random() * opts.length)] || bgShowUrl; } // pick one of the show's intros
  const bgVideoId = typeof extractVideoID === 'function' ? extractVideoID(bgShowUrl) : null;

  const iframe = document.getElementById('youtubeIframe');
  // BATCH 6 ITEM 8: Include &playlist=${bgVideoId}&enablejsapi=1 so background show intro loops continuously
  if (iframe && bgVideoId) {
    iframe.src = `https://www.youtube.com/embed/${bgVideoId}?autoplay=1&mute=1&loop=1&playlist=${bgVideoId}&enablejsapi=1&playsinline=1&controls=0&rel=0`;
    attachBackgroundLoopFallback(iframe, bgVideoId);
  }

  const modalEl = document.getElementById('videoModal');
  if (modalEl) modalEl.classList.add('split-screen-mode');

  setElDisplay('player-container', 'block');
  setElDisplay('nextEntrantBtn', 'none');
  setElDisplay('skipIntroOverlayBtn', 'none');
  setElDisplay('rushRingOverlayBtn', 'none');
  setElDisplay('mitbBtn', 'none');

  const closeBtn = document.getElementById('videoCloseBtn');
  if (closeBtn) {
    closeBtn.style.setProperty('display', 'flex', 'important');
    closeBtn.style.setProperty('z-index', '2147483647', 'important');
    closeBtn.style.setProperty('pointer-events', 'auto', 'important');
  }

  setElDisplay('specialRefBanner', 'none');
  if (typeof hideNameplate === 'function') hideNameplate();
  setElDisplay('beltEntranceOverlay', 'none');
  setElDisplay('skipToSummaryBtn', 'none');
  setElDisplay('qmTitle', 'none');

  const qmBox = document.getElementById('quickMatchBox');
  if (qmBox) {
    qmBox.classList.remove('roulette-active-mode');
    let dynamicBg = "show_bg.png";
    if (activeBookedMatch.formatKey === 'mitb' || (activeBookedMatch.matchType && activeBookedMatch.matchType.includes("Money in the Bank"))) dynamicBg = "mitb_bg.png";
    else if (activeBookedMatch.showKey === 'kotr' || activeBookedMatch.formatKey === 'kotr' || (activeBookedMatch.matchType && activeBookedMatch.matchType.includes("King of the Ring"))) dynamicBg = "kotr_bg.png";
    
    qmBox.style.setProperty('background-image', `radial-gradient(circle at top right, rgba(32, 44, 76, 0.45) 0%, rgba(14, 18, 30, 0.72) 100%), url('${dynamicBg}')`, 'important');
    qmBox.style.setProperty('background-size', 'cover', 'important');
    qmBox.style.setProperty('background-position', 'center center', 'important');
  }

  const refDisplay = document.getElementById('qmRefereeDisplay');
  const refName = document.getElementById('qmRefereeName');
  const activeRef = activeBookedMatch.referee || pickedReferee;
  if (refDisplay && refName) {
    if (activeRef) {
      refDisplay.style.display = 'block';
      refName.innerText = activeRef.name.toUpperCase();
    } else {
      refDisplay.style.display = 'none';
    }
  }

  setElDisplay('quickMatchBox', 'flex');
  navGoToStep(8);
  populateMatchTelemetry();
  renderWinnerSelectionList();
  if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd(true);
  if (typeof playRandomMatchCrowd === 'function') playRandomMatchCrowd(0.25);

  checkPendingReturnAmbush();
}
/* ==========================================================================
   ELLIS'S MAIN EVENT (EWF UNIVERSE) - MODULAR ENGINE
   MODULE 5 OF 5: js/5-match-engine.js (PART 3 OF 4)
   Ambush Engine, Direct MITB Cash-In & Siren, Winner Celebrations & Summary
   ========================================================================== */

function checkUnpromptedAmbush() {
  if (!isMatchInProgressLooping || isRunInActive) return;
  // BATCH 9 ITEM 7: automatic run-ins quietly skip when every fit superstar is already in the match
  try {
    const inMatch = (activeBookedMatch.participants || []).map(w => w && w.id);
    const free = (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : [])
      .filter(w => !(typeof getInjuryRecord === 'function' && getInjuryRecord(w.id)) && !inMatch.includes(w.id));
    if (free.length === 0) return;
  } catch (e) {}
  if (Math.random() <= 0.30 && (activeBookedMatch.participants || []).length >= 2) {
    window.triggerManualLightsOutAmbush();
  }
}

function checkPendingReturnAmbush() {
  const pendingId = localStorage.getItem('ewf_pending_return_ambush');
  if (!pendingId) return;

  const allW = (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : (typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : []));
  const returningStar = allW.find(w => w.id === pendingId);
  if (!returningStar) return;

  window.armedAmbushWrestler = returningStar;
}

// BATCH 6 ITEM 9: LAUNCH RETURNING SUPERSTAR'S ENTRANCE VIDEO ON SHOCK COMEBACK
function executePendingReturnAmbushIfArmed() {
  if (!window.armedAmbushWrestler) return;
  ambushTriggeredThisMatch = true;

  const wrestler = window.armedAmbushWrestler;
  window.armedAmbushWrestler = null;
  localStorage.removeItem('ewf_pending_return_ambush');

  if (typeof getInjuries === 'function' && typeof saveInjuries === 'function') {
    let injuries = getInjuries().filter(i => i.id !== wrestler.id);
    saveInjuries(injuries);
  }

  if (typeof stopMatchCrowd === 'function') stopMatchCrowd();
  if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd();
  isRunInActive = true;
  isMatchInProgressLooping = false;
  if (typeof hideNameplate === 'function') hideNameplate();

  let blackout = document.getElementById('lightsOutOverlay');
  if (!blackout) {
    blackout = document.createElement('div');
    blackout.id = 'lightsOutOverlay';
    blackout.className = 'lights-out-overlay';
    document.body.appendChild(blackout);
  }

  const host = document.fullscreenElement || document.webkitFullscreenElement || document.getElementById('videoModal') || document.body;
  if (blackout.parentElement !== host) { host.appendChild(blackout); }

  blackout.style.setProperty('position', 'fixed', 'important');
  blackout.style.setProperty('inset', '0', 'important');
  blackout.style.setProperty('width', '100vw', 'important');
  blackout.style.setProperty('height', '100vh', 'important');
  blackout.style.setProperty('background-color', '#000000', 'important');
  blackout.style.setProperty('z-index', '2147483647', 'important');
  blackout.style.setProperty('display', 'block', 'important');

  if (typeof playLightsOutAudio === 'function') playLightsOutAudio();

  setTimeout(() => {
    let pulses = 0;
    const strobe = setInterval(() => {
      pulses++;
      blackout.style.setProperty('background-color', (pulses % 2 === 1) ? '#ff0000' : '#000000', 'important');
      if (typeof playPyroBlast === 'function') playPyroBlast();

      if (pulses >= 6) {
        clearInterval(strobe);
        blackout.style.setProperty('display', 'none', 'important');
        if (typeof playSubBassBoom === 'function') playSubBassBoom();
        if (typeof triggerCameraFlash === 'function') triggerCameraFlash();
        if (typeof playOhMyGodSting === 'function') playOhMyGodSting();

        const logText = `⚡ SHOCK RETURN: ${wrestler.name.toUpperCase()} made a surprise return from hospital and ambushed the match!`;
        if (typeof saveHistoryLog === 'function') saveHistoryLog(logText, 'interference');
        if (typeof logShowFalloutEvent === 'function') {
          logShowFalloutEvent('return', `🚨 SHOCK RETURN: ${wrestler.name.toUpperCase()} returned from the Medical Ward during the broadcast!`);
        }
        currentMatchSummary.interference = `${wrestler.name} (RETURN)`;

        const banner = document.getElementById('ambushBanner');
        if (banner) {
          const msgText = `🚨 OH MY GOD! THEY'RE BACK! ${wrestler.name.toUpperCase()} HAS RETURNED! 🚨`;
          const commIcon = (typeof getRandomCommentatorOverlayIcon === 'function') ? getRandomCommentatorOverlayIcon() : '';
          banner.innerHTML = commIcon ? `${commIcon} <span style="flex:1;">${msgText}</span>` : msgText;
          banner.style.background = 'linear-gradient(180deg, #ff0000, #800000)';
          banner.style.color = '#ffffff';
          banner.style.boxShadow = '0 0 45px #ff0000, 0 0 25px #ff9900';
          banner.style.display = 'flex';
          banner.style.alignItems = 'center';
          banner.style.justifyContent = 'center';
          banner.style.gap = '14px';
        }

        const returnToMatchAfterComeback = () => {
          clearTimeout(runInAutoTimeout);
          if (banner) banner.style.display = 'none';
          if (isRunInActive) {
            showMatchInProgressWinnerScreen();
            if (typeof unlockAchievement === 'function') unlockAchievement('back_from_dead');
          }
        };

        // Hide split-screen match HUD & launch returning superstar's entrance video fullscreen
        const modalEl = document.getElementById('videoModal');
        if (modalEl) modalEl.classList.remove('split-screen-mode');
        setElDisplay('videoCloseBtn', 'flex');
        setElDisplay('quickMatchBox', 'none');
        setElDisplay('player-container', 'block');

        currentPlayingWrestler = wrestler;
        window.isCommentatorVideoActive = false;

        let btn = document.getElementById('nextEntrantBtn');
        if (btn) {
          btn.innerText = "Return to Fight ➔";
          btn.style.display = 'block';
          btn.onclick = returnToMatchAfterComeback;
        }

        if (typeof loadAndPlayYouTube === 'function' && wrestler.youtubeUrl) {
          loadAndPlayYouTube(wrestler.youtubeUrl, true, false);
          if (typeof triggerNameplate === 'function') {
            triggerNameplate(`${wrestler.name.toUpperCase()} // BACK FROM INJURY`);
          }
        }

        if (typeof renderGrid === 'function') renderGrid();

        clearTimeout(runInAutoTimeout);
        runInAutoTimeout = setTimeout(() => {
          returnToMatchAfterComeback();
        }, 20000);
      }
    }, 120);
  }, 1200);
}

/* --------------------------------------------------------------------------
   12. IN-MATCH INTERFERENCE, LIGHTS OUT & DIRECT MITB CASH-IN
   -------------------------------------------------------------------------- */
window.triggerManualLightsOutAmbush = function() {
  const allWrestlers = typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers().filter(w => typeof getInjuryRecord === 'function' && !getInjuryRecord(w.id)) : defaultWrestlers;
  const matchIds = (activeBookedMatch.participants || []).map(w => w.id);
  const freeWrestlers = allWrestlers.filter(w => !matchIds.includes(w.id));
  if (freeWrestlers.length === 0) { alert("No outside superstars available for an ambush!"); return; }

  const rivalries = typeof getRivalries === 'function' ? getRivalries() : [];
  let targetRival = null;
  for (let w of (activeBookedMatch.participants || [])) {
    const riv = rivalries.find(r => r && (r.w1 === w.id || r.w2 === w.id));
    if (riv) {
      const opponentId = riv.w1 === w.id ? riv.w2 : riv.w1;
      const foundFree = freeWrestlers.find(fw => fw && fw.id === opponentId);
      if (foundFree) { targetRival = foundFree; break; }
    }
  }

  let attacker = targetRival || freeWrestlers[Math.floor(Math.random() * freeWrestlers.length)];
  // BATCH 10: bad guys, furious superstars and bad blood rivals are the likeliest to run in
  let victimId = null;
  if (window.EWFP && typeof EWFP.pickRunIn === 'function') {
    const p = EWFP.pickRunIn(freeWrestlers, activeBookedMatch.participants || []);
    if (p && p.attacker) { attacker = (targetRival && Math.random() < 0.5) ? targetRival : p.attacker; victimId = p.victimId; }
  }
  if (window.EWFP && typeof EWFP.onRunIn === 'function') { try { EWFP.onRunIn(attacker, victimId); } catch (e) {} }
  executeLightsOutAmbush(attacker, false);
};

function executeLightsOutAmbush(attacker, isReturn = false, customMsg = null) {
  if (!attacker) return;
  if (typeof stopMatchCrowd === 'function') stopMatchCrowd();
  if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd();
  isRunInActive = true;
  if (typeof hideNameplate === 'function') hideNameplate();

  if (typeof playLightsOutAudio === 'function') {
    playLightsOutAudio();
  } else {
    try { const lights = new Audio('lightsout.mp3'); lights.play().catch(()=>{}); } catch(e){}
  }

  let blackout = document.getElementById('lightsOutOverlay');
  if (!blackout) {
    blackout = document.createElement('div');
    blackout.id = 'lightsOutOverlay';
    blackout.className = 'lights-out-overlay';
    document.body.appendChild(blackout);
  }

  const host = document.fullscreenElement || document.webkitFullscreenElement || document.getElementById('videoModal') || document.body;
  if (blackout.parentElement !== host) {
    host.appendChild(blackout);
  }

  blackout.style.setProperty('position', 'absolute', 'important');
  blackout.style.setProperty('inset', '0', 'important');
  blackout.style.setProperty('width', '100%', 'important');
  blackout.style.setProperty('height', '100%', 'important');
  blackout.style.setProperty('background-color', '#000000', 'important');
  blackout.style.setProperty('z-index', '999999999', 'important');
  blackout.style.setProperty('display', 'block', 'important');

  setTimeout(() => {
    let pulses = 0;
    const strobeInt = setInterval(() => {
      pulses++;
      blackout.style.setProperty('background-color', (pulses % 2 === 1) ? '#ffffff' : '#000000', 'important');

      if (typeof playPyroBlast === 'function') {
        playPyroBlast();
      }

      if (pulses >= 6) {
        clearInterval(strobeInt);
        blackout.style.setProperty('display', 'none', 'important');

        if (typeof triggerCameraFlash === 'function') triggerCameraFlash();
        if (typeof playOhMyGodSting === 'function') playOhMyGodSting();

        const logText = isReturn
          ? `🔥 SHOCKING RETURN: ${attacker.name.toUpperCase()} IS BACK FROM INJURY and ambushed the match!`
          : `🚨 LIGHTS OUT AMBUSH: ${attacker.name.toUpperCase()} crashed the match at ringside!`;
        if (typeof saveHistoryLog === 'function') saveHistoryLog(logText, 'interference');
        if (typeof logShowFalloutEvent === 'function') {
          logShowFalloutEvent(isReturn ? 'return' : 'ambush', logText);
        }
        currentMatchSummary.interference = isReturn ? `${attacker.name} (RETURN)` : attacker.name;

        if (typeof unlockAchievement === 'function') {
          if (isReturn) unlockAchievement('back_from_dead');
          else unlockAchievement('calling_backup');
        }

        const banner = document.getElementById('ambushBanner');
        if (banner) {
          const commIcon = (typeof getRandomCommentatorOverlayIcon === 'function') ? getRandomCommentatorOverlayIcon() : '';
          let msgText = '';
          if (isReturn) {
            msgText = `🚨 ${attacker.name.toUpperCase()} IS BACK! 🚨`;
            banner.style.background = 'linear-gradient(180deg, #ffd700 0%, #d32f2f 100%)';
            banner.style.boxShadow = '0 0 35px #ffd700, 0 0 20px #ff0000';
          } else if (customMsg) {
            msgText = customMsg;
            banner.style.background = 'linear-gradient(180deg, #1565c0, #0d2a5c)';
            banner.style.boxShadow = '0 0 30px #2196f3';
          } else {
            msgText = `🚨 RINGSIDE CHAOS: ${attacker.name.toUpperCase()} CRASHED THE BOUT! 🚨`;
            banner.style.background = 'linear-gradient(180deg, #d32f2f, #990000)';
            banner.style.boxShadow = '0 0 30px #ff0000';
          }
          banner.innerHTML = commIcon ? `${commIcon} <span style="flex:1;">${msgText}</span>` : msgText;
          banner.style.display = 'flex';
          banner.style.alignItems = 'center';
          banner.style.justifyContent = 'center';
          banner.style.gap = '14px';
        }

        setElDisplay('videoCloseBtn', 'flex');
        setElDisplay('quickMatchBox', 'none');

        currentPlayingWrestler = attacker;
        isMatchInProgressLooping = false;
        let btn = document.getElementById('nextEntrantBtn');
        if (btn) { btn.innerText = "Return to Fight ➔"; btn.style.display = 'block'; btn.onclick = showMatchInProgressWinnerScreen; }

        if (typeof loadAndPlayYouTube === 'function') loadAndPlayYouTube(attacker.youtubeUrl, true, false);

        clearTimeout(runInAutoTimeout);
        runInAutoTimeout = setTimeout(() => {
          if (banner) banner.style.display = 'none';
          if (isRunInActive) { showMatchInProgressWinnerScreen(); }
        }, 20000);
      }
    }, 130);
  }, 1500);
}

window.toggleMatchProgressHud = function(e) {
  if (e && e.target && e.target.closest('.action-btn')) return;
  const overlay = document.getElementById('matchCardOverlay');
  if (overlay && overlay.style.display !== 'none') return;
  
  const btn = document.getElementById('videoCloseBtn');
  if (btn) {
    if (btn.style.display === 'none' && !isRunInActive) {
      btn.style.display = 'flex';
    } else if (btn.style.display === 'flex' && activeMatchMode === 'normal') {
      btn.style.display = 'none';
    }
  }
};

// MITB Arena Siren Audio Engine
window.playMitbSirenAudio = function() {
  window.stopMitbSirenAudio();
  try {
    const siren = new Audio('cashin_siren.mp3');
    siren.volume = 0.9;
    window.activeMitbSirenAudio = siren;
    siren.play().catch(() => {
      playSynthesizedArenaSiren();
    });
  } catch (e) {
    playSynthesizedArenaSiren();
  }
};

function playSynthesizedArenaSiren() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(920, ctx.currentTime + 0.55);
    osc.frequency.linearRampToValueAtTime(520, ctx.currentTime + 1.1);
    osc.frequency.linearRampToValueAtTime(920, ctx.currentTime + 1.65);
    osc.frequency.linearRampToValueAtTime(520, ctx.currentTime + 2.2);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 2.45);
    window.activeMitbSirenCtx = ctx;
  } catch (e) {}
}

window.stopMitbSirenAudio = function() {
  if (window.activeMitbSirenAudio) {
    try {
      window.activeMitbSirenAudio.pause();
      window.activeMitbSirenAudio.currentTime = 0;
    } catch (e) {}
    window.activeMitbSirenAudio = null;
  }
  if (window.activeMitbSirenCtx) {
    try { window.activeMitbSirenCtx.close(); } catch (e) {}
    window.activeMitbSirenCtx = null;
  }
};

// Direct On-Screen Champion Targeting for MITB Cash-In
window.handleMitbCashInClick = function() {
  if (typeof playMitbSlamAudio === 'function') playMitbSlamAudio();
  const holder = typeof getMitbHolder === 'function' ? getMitbHolder() : null;
  if (!holder) return;

  const targetChamp = currentPlayingWrestler;
  if (!targetChamp) return;

  const titles = typeof getTitleHolders === 'function' ? getTitleHolders() : {};
  const heldTitles = [];
  if (titles.whc === targetChamp.id) heldTitles.push({ key: 'whc', name: 'World Heavyweight Championship', holderId: targetChamp.id, img: 'whc.png' });
  if (titles.ic === targetChamp.id) heldTitles.push({ key: 'ic', name: 'Intercontinental Championship', holderId: targetChamp.id, img: 'ic_title.png' });
  if (titles.hardcore === targetChamp.id) heldTitles.push({ key: 'hardcore', name: 'Hardcore Championship', holderId: targetChamp.id, img: 'hardcore.png' });

  if (heldTitles.length === 1) {
    window.executeMitbCashInTarget(holder, heldTitles[0], targetChamp);
    return;
  }

  if (heldTitles.length === 0) {
    window.executeMitbCashInTarget(holder, { key: 'whc', name: 'World Heavyweight Championship', holderId: targetChamp.id, img: 'whc.png' }, targetChamp);
    return;
  }

  const modal = document.getElementById('mitbTargetModal');
  const list = document.getElementById('mitbTargetOptionsList');
  if (!modal || !list) {
    window.executeMitbCashInTarget(holder, heldTitles[0], targetChamp);
    return;
  }

  const host = document.fullscreenElement || document.webkitFullscreenElement || document.getElementById('videoModal') || document.body;
  if (modal.parentElement !== host) {
    host.appendChild(modal);
  }
  modal.style.setProperty('z-index', '2147483647', 'important');
  modal.style.setProperty('position', 'fixed', 'important');
  modal.style.setProperty('inset', '0', 'important');

  list.innerHTML = '';
  heldTitles.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'action-btn btn-blue';
    btn.style.width = '100%';
    btn.innerHTML = `${t.name.toUpperCase()} (CHAMP: ${targetChamp.name.toUpperCase()})`;
    btn.onclick = () => window.executeMitbCashInTarget(holder, t, targetChamp);
    list.appendChild(btn);
  });

  modal.style.display = 'flex';
};

window.executeMitbCashInTarget = function(holder, titleObj, champObj) {
  setElDisplay('mitbTargetModal', 'none');
  setElDisplay('mitbBtn', 'none');
  setElDisplay('quickMatchBox', 'none');
  setElDisplay('universalSummaryOverlay', 'none');
  setElDisplay('victoryTitleChyron', 'none');
  setElDisplay('beltEntranceOverlay', 'none');
  setElDisplay('skipToSummaryBtn', 'none');

  const modalEl = document.getElementById('videoModal');
  if (modalEl) modalEl.classList.remove('split-screen-mode');

  if (typeof victorySound !== 'undefined') {
    try { victorySound.pause(); victorySound.currentTime = 0; } catch (e) {}
  }
  if (window.activeVictoryAudio) {
    try { window.activeVictoryAudio.pause(); window.activeVictoryAudio.currentTime = 0; } catch (e) {}
  }

  const lockedChamp = champObj || currentPlayingWrestler;
  if (!lockedChamp) return;

  if (typeof getTitleHolders === 'function' && typeof setTitleHolders === 'function' && titleObj && titleObj.key) {
    const holders = getTitleHolders();
    if (holders[titleObj.key] !== lockedChamp.id) {
      holders[titleObj.key] = lockedChamp.id;
      setTitleHolders(holders);
    }
  }

  if (typeof setMitbHolder === 'function') setMitbHolder(null);

  if (typeof playMitbSlamAudio === 'function') playMitbSlamAudio();
  if (typeof window.playMitbSirenAudio === 'function') window.playMitbSirenAudio();
  setElDisplay('mitbStrobeOverlay', 'flex');

  setTimeout(() => {
    window.stopMitbSirenAudio();
    setElDisplay('mitbStrobeOverlay', 'none');
    
    clearTimeout(matchCardTimeout);
    clearTimeout(matchCardDelayTimeout);
    clearTimeout(fadeTimeout);
    window.dismissMatchCardOverlay();
    quickMatchQueue = [];

    const wasMidShow = !!window.activeShowSession;
    const existingLineup = Array.isArray(activeBookedMatch.participants)
      ? activeBookedMatch.participants.filter(Boolean)
      : [];

    const isConvertingActiveBout = !isMatchPostScreenActive
      && (activeMatchMode === 'quickMatch' || isMatchInProgressLooping)
      && existingLineup.length >= 2
      && existingLineup.some(w => w.id === lockedChamp.id);

    let finalParticipants = [lockedChamp, holder];
    let cashInFormatKey = "1v1";
    let cashInMatchType = "Cash-In Match";

    if (isConvertingActiveBout) {
      finalParticipants = [...existingLineup];
      if (!finalParticipants.some(w => w.id === holder.id)) {
        finalParticipants.push(holder);
      }
      if (finalParticipants.length === 3) {
        cashInFormatKey = "triple";
        cashInMatchType = "Triple Threat Cash-In Match";
      } else if (finalParticipants.length >= 4) {
        cashInFormatKey = "fatal";
        cashInMatchType = "Fatal 4-Way Cash-In Match";
      }
    }

    activeBookedMatch.matchType = cashInMatchType;
    activeBookedMatch.formatKey = cashInFormatKey;
    activeBookedMatch.formatCount = finalParticipants.length;
    activeBookedMatch.isTitleMatch = true;
    activeBookedMatch.titleCode = titleObj.key;
    activeBookedMatch.titleName = titleObj.name;
    activeBookedMatch.titleImg = titleObj.img;
    activeBookedMatch.participants = finalParticipants;
    activeBookedMatch.isImpromptuCashIn = wasMidShow && !isConvertingActiveBout;

    if (wasMidShow && isConvertingActiveBout && Array.isArray(window.activeShowSession.bouts)) {
      const curBout = window.activeShowSession.bouts[window.activeShowSession.currentBoutIdx];
      if (curBout) {
        curBout.participants = [...finalParticipants];
        curBout.formatKey = cashInFormatKey;
        curBout.matchType = cashInMatchType;
        curBout.isTitleMatch = true;
        curBout.titleCode = titleObj.key;
        curBout.titleName = titleObj.name;
        curBout.titleImg = titleObj.img;
        curBout.feudStake = `💼 ${cashInMatchType.toUpperCase()}`;
      }
    }
    
    currentMatchSummary.interference = `MITB Cash-In by ${holder.name}`;
    const cashInHeadline = isConvertingActiveBout
      ? `💼 CASH-IN ALERT: ${holder.name.toUpperCase()} cashed in mid-bout, converting the ${titleObj.name} clash into a ${cashInMatchType.toUpperCase()}!`
      : `💼 CASH-IN ALERT: ${holder.name.toUpperCase()} cashed in on ${lockedChamp.name.toUpperCase()} for the ${titleObj.name}!`;

    if (typeof saveHistoryLog === 'function') {
      saveHistoryLog(cashInHeadline, 'title-change');
    }
    if (typeof logShowFalloutEvent === 'function') {
      logShowFalloutEvent('cashin', cashInHeadline);
    }
    
    activeMatchMode = 'mitb-cashin';
    isMatchInProgressLooping = false;
    isMatchPostScreenActive = false;
    currentPlayingWrestler = holder;

    let btn = document.getElementById('nextEntrantBtn');
    if (btn) {
      btn.innerText = "RING THE BELL 🔔";
      btn.style.display = 'block';
      btn.onclick = () => {
        try {
          const audio = typeof bellSound !== 'undefined' ? bellSound : new Audio('bell.mp3');
          audio.currentTime = 0;
          audio.volume = 1.0;
          audio.play().catch(() => {});
        } catch (e) {}
        startLiveMatchStopwatch(true);
        showMatchInProgressWinnerScreen();
      };
    }

    if (typeof loadAndPlayYouTube === 'function') {
      loadAndPlayYouTube(holder.youtubeUrl, true, true);
    }
  }, 2500);
};

window.closeMitbTargetModal = function() {
  setElDisplay('mitbTargetModal', 'none');
};

function renderWinnerSelectionList() {
  const container = document.getElementById('qmWinnerSelectionList');
  if (!container) return;
  container.innerHTML = '';

  const p = activeBookedMatch.participants || [];

  if (activeBookedMatch.formatKey === 'tag' && p.length >= 4) {
    const alliances = typeof getAlliances === 'function' ? getAlliances() : [];
    const customAl = (Array.isArray(alliances) && alliances.length > 0) ? alliances[0] : (typeof alliances === 'object' && alliances.name ? alliances : null);

    const team1Name = (customAl && ((customAl.p1 === p[0].id && customAl.p2 === p[1].id) || (customAl.p1 === p[1].id && customAl.p2 === p[0].id)))
      ? customAl.name.toUpperCase() : `${p[0].name.toUpperCase()} & ${p[1].name.toUpperCase()}`;

    const team2Name = (customAl && ((customAl.p1 === p[2].id && customAl.p2 === p[3].id) || (customAl.p1 === p[3].id && customAl.p2 === p[2].id)))
      ? customAl.name.toUpperCase() : `${p[2].name.toUpperCase()} & ${p[3].name.toUpperCase()}`;

    const team1Pod = document.createElement('div');
    team1Pod.style.cssText = `
      background: linear-gradient(135deg, rgba(0, 40, 100, 0.9), rgba(5, 10, 25, 0.95));
      border: 2px solid #0070f3; border-radius: 8px; padding: 14px; display: flex;
      flex-direction: column; align-items: center; cursor: pointer; min-width: 260px;
      box-shadow: 0 0 20px rgba(0, 112, 243, 0.4);
    `;
    team1Pod.innerHTML = `
      <div style="font-family:'Russo One', sans-serif; font-size:0.8rem; color:#66b2ff; margin-bottom:8px;">★ BLUE CORNER // TEAM 1 ★</div>
      <div style="display:flex; gap:10px; margin-bottom:10px;">
        <img src="${p[0].image}" style="width:75px; height:75px; object-fit:cover; border-radius:4px; border:1.5px solid #0070f3;" onerror="handleImgError(this, '${p[0].id}')">
        <img src="${p[1].image}" style="width:75px; height:75px; object-fit:cover; border-radius:4px; border:1.5px solid #0070f3;" onerror="handleImgError(this, '${p[1].id}')">
      </div>
      <div style="font-family:'Russo One', sans-serif; font-size:1.05rem; color:#fff; text-align:center;">${team1Name}</div>
      <div style="font-family:'Russo One', sans-serif; font-size:0.75rem; color:#ffd700; margin-top:6px;">TAP TO DECLARE WINNERS ➔</div>
    `;
    team1Pod.onclick = () => window.declareMatchWinner({ isTagTeam: true, teamIndex: 1, winners: [p[0], p[1]], losers: [p[2], p[3]], teamName: team1Name });
    container.appendChild(team1Pod);

    const team2Pod = document.createElement('div');
    team2Pod.style.cssText = `
      background: linear-gradient(135deg, rgba(100, 10, 20, 0.9), rgba(25, 5, 10, 0.95));
      border: 2px solid #e50914; border-radius: 8px; padding: 14px; display: flex;
      flex-direction: column; align-items: center; cursor: pointer; min-width: 260px;
      box-shadow: 0 0 20px rgba(229, 9, 20, 0.4);
    `;
    team2Pod.innerHTML = `
      <div style="font-family:'Russo One', sans-serif; font-size:0.8rem; color:#ff6666; margin-bottom:8px;">★ RED CORNER // TEAM 2 ★</div>
      <div style="display:flex; gap:10px; margin-bottom:10px;">
        <img src="${p[2].image}" style="width:75px; height:75px; object-fit:cover; border-radius:4px; border:1.5px solid #e50914;" onerror="handleImgError(this, '${p[2].id}')">
        <img src="${p[3].image}" style="width:75px; height:75px; object-fit:cover; border-radius:4px; border:1.5px solid #e50914;" onerror="handleImgError(this, '${p[3].id}')">
      </div>
      <div style="font-family:'Russo One', sans-serif; font-size:1.05rem; color:#fff; text-align:center;">${team2Name}</div>
      <div style="font-family:'Russo One', sans-serif; font-size:0.75rem; color:#ffd700; margin-top:6px;">TAP TO DECLARE WINNERS ➔</div>
    `;
    team2Pod.onclick = () => window.declareMatchWinner({ isTagTeam: true, teamIndex: 2, winners: [p[2], p[3]], losers: [p[0], p[1]], teamName: team2Name });
    container.appendChild(team2Pod);

  } else {
    p.forEach(w => {
      const card = document.createElement('div');
      card.style.cssText = `
        width: 140px; background: #121424; border: 2px solid #ffd700; border-radius: 6px;
        padding: 10px; display: flex; flex-direction: column; align-items: center; cursor: pointer;
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.25);
      `;
      card.innerHTML = `
        <img src="${w.image}" style="width:90px; height:90px; object-fit:cover; border-radius:4px; margin-bottom:8px;" onerror="handleImgError(this, '${w.id}')">
        <div style="font-family:'Russo One', sans-serif; font-size:0.9rem; color:#fff; text-align:center;">${w.name}</div>
        <div style="font-family:'Russo One', sans-serif; font-size:0.68rem; color:#00ffcc; margin-top:4px;">CROWN VICTOR ➔</div>
      `;
      card.onclick = () => window.declareMatchWinner({ isTagTeam: false, winner: w, losers: p.filter(x => x.id !== w.id) });
      container.appendChild(card);
    });
  }
}

window.showInterferenceMenu = function() {
  if (typeof stopMatchCrowd === 'function') stopMatchCrowd();
  if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd();
  navGoToStep(9);
  setElDisplay('chooseAttackerContainer', 'none');
  const titles = typeof getTitleHolders === 'function' ? getTitleHolders() : {};
  const allWrestlers = typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers().filter(w => typeof getInjuryRecord === 'function' && !getInjuryRecord(w.id)) : defaultWrestlers;
  const alliances = typeof getAlliances === 'function' ? getAlliances() : [];
  const currentAlliance = (Array.isArray(alliances) && alliances.length > 0) ? alliances[0] : (typeof alliances === 'object' && alliances.name ? alliances : null);
  const matchIds = (activeBookedMatch.participants || []).map(w => w.id);
  const freeWrestlers = allWrestlers.filter(w => !matchIds.includes(w.id));

  const rivalBtn = document.getElementById('sendInRivalBtn');
  const rivalries = typeof getRivalries === 'function' ? getRivalries() : [];
  let freeRival = null;
  for (let p of (activeBookedMatch.participants || [])) {
    const riv = rivalries.find(r => r && (r.w1 === p.id || r.w2 === p.id));
    if (riv) {
      const rivalId = riv.w1 === p.id ? riv.w2 : riv.w1;
      const found = freeWrestlers.find(fw => fw && fw.id === rivalId);
      if (found) { freeRival = found; break; }
    }
  }

  if (rivalBtn) {
    if (freeRival) {
      rivalBtn.style.display = 'block';
      rivalBtn.innerText = `SEND IN RIVAL (${freeRival.name.toUpperCase()}) 💥`;
      rivalBtn.onclick = () => executeInterference(freeRival);
    } else {
      rivalBtn.style.display = 'none';
    }
  }

  const slambBtn = document.getElementById('slambulanceInterferenceBtn') || document.querySelector('[onclick*="triggerSlambulanceInterference"]');
  if (slambBtn) {
    const isSlambUnlocked = (typeof getGMLevel === 'function' ? getGMLevel() : 1) >= 5;
    slambBtn.style.display = isSlambUnlocked ? 'block' : 'none';
  }

  const tagBtn = document.getElementById('tagPartnerInterferenceBtn');
  let tagPartner = null;
  if (titles.tag1 && matchIds.includes(titles.tag1) && !matchIds.includes(titles.tag2)) { tagPartner = allWrestlers.find(w => w && w.id === titles.tag2); }
  else if (titles.tag2 && matchIds.includes(titles.tag2) && !matchIds.includes(titles.tag1)) { tagPartner = allWrestlers.find(w => w && w.id === titles.tag1); }
  else if (currentAlliance) {
    if (matchIds.includes(currentAlliance.p1) && !matchIds.includes(currentAlliance.p2)) { tagPartner = allWrestlers.find(w => w && w.id === currentAlliance.p2); }
    else if (matchIds.includes(currentAlliance.p2) && !matchIds.includes(currentAlliance.p1)) { tagPartner = allWrestlers.find(w => w && w.id === currentAlliance.p1); }
  }

  if (tagBtn) {
    if (tagPartner) {
      tagBtn.innerText = `CALL TAG PARTNER (${tagPartner.name.toUpperCase()})`;
      tagBtn.disabled = false;
      tagBtn.style.opacity = '1';
      tagBtn.onclick = () => executeInterference(tagPartner);
    } else {
      tagBtn.innerText = `CALL TAG PARTNER (NONE)`;
      tagBtn.disabled = true;
      tagBtn.style.opacity = '0.5';
      tagBtn.onclick = null;
    }
  }
};

window.triggerSlambulanceInterference = function() {
  const allWrestlers = typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers().filter(w => typeof getInjuryRecord === 'function' && !getInjuryRecord(w.id)) : defaultWrestlers;
  const matchIds = (activeBookedMatch.participants || []).map(w => w.id);
  const availableAttackers = allWrestlers.filter(w => !matchIds.includes(w.id));
  if (availableAttackers.length === 0) { alert("No outside superstars available!"); return; }
  const attacker = availableAttackers[Math.floor(Math.random() * availableAttackers.length)];

  if (typeof hideNameplate === 'function') hideNameplate();
  setElDisplay('quickMatchBox', 'none');
  setElDisplay('ambulanceStrobeOverlay', 'flex');
  if (typeof playSlambulanceAudio === 'function') playSlambulanceAudio();

  setTimeout(() => { setElDisplay('ambulanceStrobeOverlay', 'none'); executeInterference(attacker); }, 2500);
};

window.triggerRandomInterference = function() {
  const allWrestlers = typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers().filter(w => typeof getInjuryRecord === 'function' && !getInjuryRecord(w.id)) : defaultWrestlers;
  const matchIds = (activeBookedMatch.participants || []).map(w => w.id);
  const availableAttackers = allWrestlers.filter(w => !matchIds.includes(w.id));
  if (availableAttackers.length === 0) { alert("No outside superstars available!"); return; }
  executeInterference(availableAttackers[Math.floor(Math.random() * availableAttackers.length)]);
};

window.showChooseAttackerList = function() {
  const container = document.getElementById('chooseAttackerList');
  const wrapper = document.getElementById('chooseAttackerContainer');
  const allWrestlers = typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers().filter(w => typeof getInjuryRecord === 'function' && !getInjuryRecord(w.id)) : defaultWrestlers;
  const matchIds = (activeBookedMatch.participants || []).map(w => w.id);
  const availableAttackers = allWrestlers.filter(w => !matchIds.includes(w.id));
  if (availableAttackers.length === 0) { alert("No outside superstars available!"); return; }

  if (container) {
    container.innerHTML = '';
    availableAttackers.forEach(w => {
      const card = document.createElement('div');
      card.className = 'vs-wrestler';
      card.style.animationDelay = '0s';
      card.innerHTML = `<img src="${w.image}" alt="${w.name}" onerror="handleImgError(this, '${w.id}')"><div>${w.name}</div>`;
      card.onclick = () => executeInterference(w);
      container.appendChild(card);
    });
  }
  if (wrapper) wrapper.style.display = 'block';
};

function executeInterference(attacker) {
  executeLightsOutAmbush(attacker, false);
}

window.backToWinnerScreen = function() { navGoToStep(8); if (typeof playRandomMatchCrowd === 'function') playRandomMatchCrowd(0.25); };

window.settleCurrentRivalry = function() {
  if (!lastMatchLoser || !currentPlayingWrestler) return;
  const rivalries = typeof getRivalries === 'function' ? getRivalries() : [];
  const currentRiv = lastMatchLoser ? rivalries.find(r => r && ((r.w1 === currentPlayingWrestler.id && r.w2 === lastMatchLoser.id) || (r.w2 === currentPlayingWrestler.id && r.w1 === lastMatchLoser.id))) : null;
  if (currentRiv) {
    if (currentRiv.heat >= 3) {
      if (typeof openBloodFeudShowdown === 'function') openBloodFeudShowdown(currentPlayingWrestler, lastMatchLoser, currentRiv);
    } else {
      if (typeof removeRivalry === 'function') removeRivalry(currentRiv.id);
      if (typeof saveHistoryLog === 'function') saveHistoryLog(`🔥 FEUD SETTLED: ${currentPlayingWrestler.name.toUpperCase()} defeated ${lastMatchLoser.name.toUpperCase()} to end their rivalry!`, 'match');
      currentMatchSummary.feudStatus = "🔥 RIVALRY SETTLED";
      if (typeof unlockAchievement === 'function') unlockAchievement('grudge_settler');
      setElDisplay('settleRivalryBtn', 'none');
      alert(`🔥 The feud between ${currentPlayingWrestler.name} and ${lastMatchLoser.name} is officially settled!`);
    }
  }
};

/* --------------------------------------------------------------------------
   13. MATCH SUMMARY, FIVE-STAR RATINGS, SHOW HIGHLIGHTS & FINALE
   -------------------------------------------------------------------------- */
window.selectSummaryRating = function(rating) {
  if (!currentMatchSummary) currentMatchSummary = {};
  currentMatchSummary.rating = parseInt(rating, 10) || 0;

  const stars = document.querySelectorAll('#summaryRatingBar .star-btn');
  stars.forEach((star) => {
    const starVal = parseInt(star.getAttribute('data-rating'), 10);
    if (starVal <= currentMatchSummary.rating && currentMatchSummary.rating > 0) {
      star.classList.add('active');
      star.style.color = '#ffd700';
      star.style.textShadow = '0 0 12px #ffd700';
      star.style.transform = 'scale(1.18)';
    } else {
      star.classList.remove('active');
      star.style.color = '#555566';
      star.style.textShadow = '0 0 4px #000000';
      star.style.transform = 'scale(1)';
    }
  });

  if (currentMatchSummary.rating === 5 && typeof unlockAchievement === 'function') {
    unlockAchievement('five_star_standard');
  }
};

function evaluatePostMatchRivalry(participants) {
  if (!participants || participants.length < 2) return null;
  const rivalries = typeof getRivalries === 'function' ? getRivalries() : [];
  const participantIds = participants.map(p => p.id);

  const existing = rivalries.find(r => r && participantIds.includes(r.w1) && participantIds.includes(r.w2));
  if (existing) {
    if (Math.random() < 0.50) {
      const oldHeat = existing.heat || 1;
      existing.heat = Math.min(3, oldHeat + 1);
      if (typeof saveRivalries === 'function') saveRivalries(rivalries);
      const w1 = participants.find(p => p.id === existing.w1) || { name: 'Superstar' };
      const w2 = participants.find(p => p.id === existing.w2) || { name: 'Superstar' };
      const heatLabel = existing.heat === 2 ? 'BOILING' : 'BLOOD FEUD';
      const logMsg = `🔥 RIVALRY ESCALATED: Bad blood between ${w1.name} and ${w2.name} is now ${heatLabel}!`;
      if (typeof saveHistoryLog === 'function') saveHistoryLog(logMsg, 'feud');

      if (existing.heat === 3 && oldHeat < 3) {
        if (typeof checkBloodFeudActivation === 'function') {
          checkBloodFeudActivation(existing);
        }
      }

      return logMsg;
    }
  } else {
    if (Math.random() < 0.30) {
      let pA, pB;
      if (participants.length === 2) {
        pA = participants[0]; pB = participants[1];
      } else if (activeBookedMatch.formatKey === 'tag' && participants.length >= 4) {
        pA = participants[Math.floor(Math.random() * 2)];
        pB = participants[2 + Math.floor(Math.random() * 2)];
      } else {
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        pA = shuffled[0]; pB = shuffled[1];
      }

      if (pA && pB && pA.id !== pB.id && !(typeof areInSameAlliance === 'function' && areInSameAlliance(pA.id, pB.id))) {
        if (typeof addOrUpdateRivalry === 'function') addOrUpdateRivalry(pA.id, pB.id, `${activeBookedMatch.matchType} Bad Blood`, 1);
        const logMsg = `🔥 RIVALRY IGNITED: Tensions boiled over between ${pA.name} and ${pB.name}!`;
        if (typeof saveHistoryLog === 'function') saveHistoryLog(logMsg, 'feud');
        return logMsg;
      }
    }
  }
  return null;
}

window.declareMatchWinner = function(resultData) {
  window.postMatchEventQueue = [];

  isMatchInProgressLooping = false;
  isRunInActive = false;
  isMatchPostScreenActive = true;
  if (typeof stopMatchCrowd === 'function') stopMatchCrowd();
  if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd();
  clearTimeout(runInAutoTimeout);
  clearTimeout(victoryTimeout);
  clearTimeout(cashInTimeout);
  clearTimeout(rumbleEntranceDurationTimeout);
  clearTimeout(unpromptedAmbushTimer);
  clearTimeout(rumbleEntrantTimeout);
  clearInterval(rumbleTimerInterval);
  if (typeof disableWakeLock === 'function') disableWakeLock();
  stopLiveMatchStopwatch();
  if (typeof tickDownInjuriesAfterMatch === 'function') tickDownInjuriesAfterMatch();
  setElDisplay('quickMatchBox', 'none');

  let winnerHeadline = "";
  let logText = "";
  let primaryWinnerImg = "";
  let primaryWinnerName = "";
  let primaryWinnerObj = null;
  let titleChangedHands = false; // BATCH 9 ITEM 8

  const mins = Math.floor(liveMatchElapsedSeconds / 60);
  const secs = liveMatchElapsedSeconds % 60;
  const durationStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
  const profile = typeof getGMProfile === 'function' ? getGMProfile() : { stats: { matches: 0, furnitureMatches: 0 } };

  if (resultData.isTagTeam) {
    const w1 = resultData.winners[0];
    const w2 = resultData.winners[1];
    const l1 = resultData.losers[0];
    const l2 = resultData.losers[1];
    primaryWinnerObj = w1;
    lastMatchLoser = l1;

    primaryWinnerImg = w1.image;
    primaryWinnerName = `${w1.name.toUpperCase()} & ${w2.name.toUpperCase()}`;
    winnerHeadline = `${w1.name.toUpperCase()} & ${w2.name.toUpperCase()} def. ${l1.name.toUpperCase()} & ${l2.name.toUpperCase()} by Pinfall / Decision`;
    logText = `🤝 TAG MATCH: ${winnerHeadline} (${durationStr})`;

    if (activeBookedMatch.isTitleMatch && activeBookedMatch.titleCode === 'tag') {
      const holders = typeof getTitleHolders === 'function' ? getTitleHolders() : {};
      titleChangedHands = !([w1.id, w2.id].includes(holders.tag1) && [w1.id, w2.id].includes(holders.tag2));
      holders.tag1 = w1.id;
      holders.tag2 = w2.id;
      if (typeof setTitleHolders === 'function') setTitleHolders(holders);
      if (typeof resetTitleDefense === 'function') resetTitleDefense('tag');
      if (typeof unlockAchievement === 'function') unlockAchievement('double_trouble');
    }

    if (activeBookedMatch.formatKey === 'tag' && l1 && l2 && !window.activeShowSession) {
      const m1 = (typeof getWrestlerMomentum === 'function') ? getWrestlerMomentum(l1.id).status : 'neutral';
      const m2 = (typeof getWrestlerMomentum === 'function') ? getWrestlerMomentum(l2.id).status : 'neutral';
      const hasDisparity = (m1 === 'fire' && m2 === 'ice') || (m1 === 'ice' && m2 === 'fire') || (m1 === 'neutral' && m2 === 'ice') || (m1 === 'ice' && m2 === 'neutral');
      const lastScrum = parseInt(localStorage.getItem('ewf_last_media_scrum_match') || '-8', 10);
      
      if (hasDisparity && ((profile.stats.matches || 0) - lastScrum >= 8)) {
        let pA = l1; let pB = l2;
        if (m2 === 'fire' || (m2 === 'neutral' && m1 === 'ice')) { pA = l2; pB = l1; }
        window.pendingMediaScrum = { partnerA: pA, partnerB: pB };
      }
    }

  } else {
    primaryWinnerObj = resultData.winner ? resultData.winner : resultData;
    const losers = (activeBookedMatch.participants || []).filter(w => w.id !== primaryWinnerObj.id);
    lastMatchLoser = losers.length > 0 ? losers[0] : null;

    primaryWinnerImg = primaryWinnerObj.image;
    primaryWinnerName = primaryWinnerObj.name.toUpperCase();
    winnerHeadline = `${primaryWinnerObj.name.toUpperCase()} def. ${lastMatchLoser ? lastMatchLoser.name.toUpperCase() : "OPPONENT"} by Pinfall / Decision`;
    logText = `⚡ ${(activeBookedMatch.matchType || 'MATCH').toUpperCase()}: ${winnerHeadline} (${durationStr})`;

    let titleWon = false;
    let finalDefenseCount = 0;
    const titleCode = activeBookedMatch.titleCode || 'whc';
    let isVacant = false;

    if (activeBookedMatch.isTitleMatch && activeBookedMatch.titleCode) {
      const holders = typeof getTitleHolders === 'function' ? getTitleHolders() : {};
      const previousHolderId = holders[activeBookedMatch.titleCode];
      
      if (!previousHolderId) isVacant = true;
      
      if (previousHolderId !== primaryWinnerObj.id) {
        titleWon = true;
        finalDefenseCount = 0;
      } else {
        if (typeof incrementTitleDefense === 'function') finalDefenseCount = incrementTitleDefense(titleCode);
      }

      titleChangedHands = titleWon;
      holders[activeBookedMatch.titleCode] = primaryWinnerObj.id;
      if (typeof setTitleHolders === 'function') setTitleHolders(holders);
      if (typeof resetTitleDefense === 'function' && titleWon) resetTitleDefense(activeBookedMatch.titleCode);

      if (activeBookedMatch.titleCode === 'whc' && typeof unlockAchievement === 'function') unlockAchievement('the_holy_grail');
      if (activeBookedMatch.titleCode === 'ic' && typeof unlockAchievement === 'function') unlockAchievement('workhorse_heritage');
      if (activeBookedMatch.titleCode === 'hardcore' && typeof unlockAchievement === 'function') unlockAchievement('hardcore_havoc');
      
      const tName = activeBookedMatch.titleName || 'CHAMPIONSHIP';
      displayVictoryTitleChyron(primaryWinnerObj, titleWon, tName, isVacant, activeBookedMatch.titleCode);
    }

    if (activeBookedMatch.isCareerMatch) {
      if (lastMatchLoser) {
        let banished = JSON.parse(localStorage.getItem('ewf_vault_banished') || '[]');
        if (!banished.includes(lastMatchLoser.id)) banished.push(lastMatchLoser.id);
        localStorage.setItem('ewf_vault_banished', JSON.stringify(banished));
        logText += ` 💀 CAREER TERMINATED: ${lastMatchLoser.name.toUpperCase()} has been forced out of EWF!`;
        if (typeof logShowFalloutEvent === 'function') {
          logShowFalloutEvent('cutscene', `💀 CAREER TERMINATED: ${lastMatchLoser.name.toUpperCase()} lost the Loser Leaves EWF bout and was banished!`);
        }
      }
    }
  }

  const rivalries = typeof getRivalries === 'function' ? getRivalries() : [];
  const currentRiv = lastMatchLoser ? rivalries.find(r => r && ((r.w1 === primaryWinnerObj.id && r.w2 === lastMatchLoser.id) || (r.w2 === primaryWinnerObj.id && r.w1 === lastMatchLoser.id))) : null;

  if (isBloodFeudBlowoff) {
    const p = activeBookedMatch.participants || [];
    let filteredRiv = rivalries.filter(r => {
      const isPair = (r.w1 === p[0]?.id && r.w2 === p[1]?.id) || (r.w1 === p[1]?.id && r.w2 === p[0]?.id);
      return !isPair;
    });
    if (typeof saveRivalries === 'function') saveRivalries(filteredRiv);
    if (typeof unlockAchievement === 'function') unlockAchievement('grudge_settler');
    logText += ` 💀 BLOOD FEUD SETTLED!`;
    if (typeof logShowFalloutEvent === 'function') {
      logShowFalloutEvent('feud', `💀 BLOOD FEUD SETTLED: ${primaryWinnerName} ended the war!`);
    }
  }

  const allowInjuries = (typeof isMedicalWardUnlocked === 'function')
    ? isMedicalWardUnlocked()
    : (typeof getGMLevel === 'function' ? getGMLevel() >= 3 : true);

  let slambulanceCasualty = null;
  if (allowInjuries && activeBookedMatch.matchType === "Ambulance Match" && lastMatchLoser) {
    if (typeof processSlambulanceCasualty === 'function') {
      slambulanceCasualty = processSlambulanceCasualty(lastMatchLoser.id);
    } else if (typeof inflictInjury === 'function') {
      slambulanceCasualty = inflictInjury(lastMatchLoser.id, Math.random() < 0.50 ? 'major' : 'minor');
    }
  }

  let hardcoreInjury = null;
  const currentStip = (activeBookedMatch.matchType || '').toLowerCase();
  if (allowInjuries && (currentStip === 'tlc match' || currentStip === 'no disqualification') && lastMatchLoser) {
    if (Math.random() < 0.50) {
      const isMajor = Math.random() < 0.50;
      let injResult = { severity: isMajor ? 'major' : 'minor', matchesRemaining: isMajor ? 5 : 1 };
      if (typeof inflictInjury === 'function') {
        injResult = inflictInjury(lastMatchLoser.id, isMajor ? 'major' : 'minor');
      }
      hardcoreInjury = {
        victim: lastMatchLoser,
        isMajor: isMajor,
        severity: injResult ? injResult.severity : (isMajor ? 'major' : 'minor'),
        matches: injResult ? injResult.matchesRemaining : (isMajor ? 5 : 1),
        isHardcore: true
      };
    }
  }

  profile.stats = profile.stats || { matches: 0, furnitureMatches: 0 };
  profile.stats.matches = (profile.stats.matches || 0) + 1;
  const furnitureTypes = ['Tables Match', 'Ladder Match', 'TLC Match'];
  if (furnitureTypes.includes(activeBookedMatch.matchType)) {
    profile.stats.furnitureMatches = (profile.stats.furnitureMatches || 0) + 1;
  }
  if (typeof saveGMProfile === 'function') saveGMProfile(profile);

  enqueuePostMatchEvent(() => {
    if (typeof addXP === 'function') addXP(35, "Match Completed");
    if (typeof unlockAchievement === 'function') {
      unlockAchievement('first_bell');
      if (profile.stats.matches >= 5) unlockAchievement('workhorse_promoter');
      if (profile.stats.matches >= 10) unlockAchievement('television_mogul');
      if (isMysteryMatchMode) unlockAchievement('roulette_gambler');
      if (activeBookedMatch.matchType === 'Submission Match') unlockAchievement('tap_out');
      if (profile.stats.furnitureMatches >= 3) unlockAchievement('broken_furniture');
    }
    processNextPostMatchEvent();
  });

  if ((activeBookedMatch.formatKey === 'mitb' || activeBookedMatch.matchType === 'Money in the Bank') && !activeBookedMatch.mitbCoronationShown) {
    activeBookedMatch.mitbCoronationShown = true;
    if (typeof saveHistoryLog === 'function') saveHistoryLog(`💼 MONEY IN THE BANK WINNER: ${primaryWinnerObj.name.toUpperCase()} secured the briefcase!`, 'match', primaryWinnerObj.id, 5);
    if (typeof unlockAchievement === 'function') unlockAchievement('contract_in_hand');
    if (typeof setMitbHolder === 'function') setMitbHolder(primaryWinnerObj);

    enqueuePostMatchEvent(() => {
      const pContainer = document.getElementById('player-container');
      if (pContainer) pContainer.style.display = 'none';
      if (typeof showMitbCoronationOverlay === 'function') showMitbCoronationOverlay(primaryWinnerObj);
    });
  }

  setElDisplay('videoCloseBtn', 'flex');

  const settleBtn = document.getElementById('settleRivalryBtn');
  if (settleBtn && currentRiv && !isBloodFeudBlowoff) {
    settleBtn.style.display = 'inline-block';
    if (currentRiv.heat >= 3) {
      settleBtn.innerText = "💀 SETTLE BLOOD FEUD BLOWOFF";
      settleBtn.onclick = () => { if (typeof openBloodFeudShowdown === 'function') openBloodFeudShowdown(primaryWinnerObj, lastMatchLoser, currentRiv); };
    } else {
      settleBtn.innerText = "🔥 Settle Rivalry";
      settleBtn.onclick = window.settleCurrentRivalry;
    }
  } else if (settleBtn) {
    settleBtn.style.display = 'none';
  }

  const locks = typeof getMandatoryLocks === 'function' ? getMandatoryLocks() : {};
  if (activeBookedMatch.isTitleMatch && activeBookedMatch.titleCode === 'ic' && locks.kotrIc) { if (typeof clearMandatoryLock === 'function') clearMandatoryLock('ic'); }
  if (activeBookedMatch.isTitleMatch && activeBookedMatch.titleCode === 'whc' && locks.rumbleWhc) { if (typeof clearMandatoryLock === 'function') clearMandatoryLock('whc'); }

  // Clear #1 Contender Title Shot Lock if the lock-holder just competed in a championship match
  if (activeBookedMatch.isTitleMatch && typeof clearContenderTitleShotLock === 'function') {
    (activeBookedMatch.participants || []).forEach(p => {
      if (p && p.id) clearContenderTitleShotLock(p.id);
    });
  }

  try {
    const audioBell = typeof bellSound !== 'undefined' ? bellSound : new Audio('bell.mp3');
    audioBell.onended = null;
    audioBell.volume = 1.0;
    audioBell.play().catch(() => {});
  } catch (e) {}

  victoryTimeout = setTimeout(() => {
    try {
      const vicAudio = typeof victorySound !== 'undefined' ? victorySound : new Audio('victory.mp3');
      window.activeVictoryAudio = vicAudio;
      vicAudio.currentTime = 0;
      vicAudio.volume = 0.30;
      vicAudio.play().catch(() => {});
    } catch (e) {}
  }, 1200);

  const rivalryEscalationResult = evaluatePostMatchRivalry(activeBookedMatch.participants);

  let bloodFeudInjury = null;
  if (allowInjuries && isBloodFeudBlowoff && lastMatchLoser) {
    const rollInjury = Math.random() < 0.75;
    if (rollInjury) {
      const isMajor = Math.random() < 0.20;
      let injResult = { severity: 'critical', matchesRemaining: isMajor ? 5 : 1 };
      if (typeof inflictInjury === 'function') {
        injResult = inflictInjury(lastMatchLoser.id, isMajor);
      }
      bloodFeudInjury = { victim: lastMatchLoser, isMajor: isMajor, severity: injResult.severity, matches: injResult.matchesRemaining };
    }
  }

  let ambulanceInjury = null;
  if (slambulanceCasualty && lastMatchLoser) {
    ambulanceInjury = { victim: lastMatchLoser, isMajor: slambulanceCasualty.severity === 'major', severity: slambulanceCasualty.severity, matches: slambulanceCasualty.matchesRemaining, isAmbulance: true };
  }

  if (window.activeShowSession) {
    if (slambulanceCasualty && lastMatchLoser) {
      window.activeShowSession.showFalloutLog.push({ type: 'injury', text: `🚑 SLAMBULANCE: ${lastMatchLoser.name.toUpperCase()} was rushed to the Medical Ward!` });
    } else if (hardcoreInjury && lastMatchLoser) {
      window.activeShowSession.showFalloutLog.push({ type: 'injury', text: `🩹 MEDICAL WARD: ${lastMatchLoser.name.toUpperCase()} suffered trauma in the weapon clash!` });
    }
    if (rivalryEscalationResult) {
      window.activeShowSession.showFalloutLog.push({ type: 'feud', text: rivalryEscalationResult });
    }
  }

  const resolvedShowName = (typeof getShowName === 'function' && activeBookedMatch.showKey && activeBookedMatch.showKey !== 'none') ? getShowName(activeBookedMatch.showKey) : (activeBookedMatch.showKey && typeof showIntros !== 'undefined' && showIntros[activeBookedMatch.showKey] && showIntros[activeBookedMatch.showKey].name)
    ? showIntros[activeBookedMatch.showKey].name
    : (activeBookedMatch.showKey || 'RAW').toUpperCase();

  currentMatchSummary = {
    winner: primaryWinnerObj,
    losers: resultData.isTagTeam ? resultData.losers : (activeBookedMatch.participants || []).filter(w => w.id !== primaryWinnerObj.id),
    matchType: activeBookedMatch.matchType,
    showName: resolvedShowName,
    titleName: activeBookedMatch.isTitleMatch ? activeBookedMatch.titleName : "",
    titleWon: false,
    titleImg: activeBookedMatch.titleImg || 'whc.png',
    referee: pickedReferee ? pickedReferee.name : null,
    interference: currentMatchSummary.interference || null,
    injuryInflicted: ambulanceInjury || bloodFeudInjury || hardcoreInjury || null,
    feudStatus: rivalryEscalationResult || (currentRiv ? (currentRiv.heat === 3 ? "💀 BLOOD FEUD BOUT" : "🔥 ACTIVE RIVALRY") : null),
    matchTime: durationStr,
    rating: 0,
    defenseCount: 0 
  };
  
  // BATCH 9 ITEM 8: only a real title change counts as a NEW champion (defences were logged as "captured")
  if (activeBookedMatch.isTitleMatch) {
    currentMatchSummary.titleWon = titleChangedHands;
  }

  window.selectSummaryRating(0);

  const modalEl = document.getElementById('videoModal');
  if (modalEl) modalEl.classList.remove('split-screen-mode');
  setElDisplay('quickMatchBox', 'none');
  setElDisplay('player-container', 'block');

  const skipBtn = document.getElementById('skipToSummaryBtn');
  if (skipBtn) {
    skipBtn.style.setProperty('position', 'fixed', 'important');
    skipBtn.style.setProperty('bottom', '30px', 'important');
    skipBtn.style.setProperty('right', '30px', 'important');
    skipBtn.style.setProperty('top', 'auto', 'important');
    skipBtn.style.setProperty('left', 'auto', 'important');
    skipBtn.style.setProperty('z-index', '2147483647', 'important');

    // BATCH 7 ITEM 10: Inside Book a Show, KOTR bouts use the normal summary flow (the show tracks the bracket).
    // Previously this sent show bouts to the standalone KOTR bracket and the show could never finish.
    if (!window.activeShowSession && (activeBookedMatch.showKey === 'kotr' || activeBookedMatch.formatKey === 'kotr')) {
      const finalMatchIdx = (typeof kotrMatches !== 'undefined' ? kotrMatches.length : 1) - 1;
      const isFinal = (typeof kotrCurrentMatchIdx !== 'undefined' && kotrCurrentMatchIdx === finalMatchIdx);
      
      if (isFinal) {
        skipBtn.innerText = '👑 CORONATION CEREMONY ➔';
        skipBtn.onclick = () => {
          clearTimeout(fadeTimeout);
          setElDisplay('skipToSummaryBtn', 'none');
          setElDisplay('player-container', 'none');
          setElDisplay('victoryTitleChyron', 'none');
          setElDisplay('beltEntranceOverlay', 'none');
          if (typeof recordKotrWinner === 'function') recordKotrWinner(primaryWinnerObj);
        };
      } else {
        skipBtn.innerText = '📊 VIEW BRACKET ➔';
        skipBtn.onclick = () => {
          clearTimeout(fadeTimeout);
          if (typeof closeVideoModal === 'function') closeVideoModal();
          if (typeof recordKotrWinner === 'function') recordKotrWinner(primaryWinnerObj);
        };
      }
    } else {
      skipBtn.innerText = '📊 Skip to Summary ➔';
      skipBtn.onclick = window.skipToMatchSummary;
    }
    skipBtn.style.display = 'block';
  }

  currentPlayingWrestler = primaryWinnerObj;
  if (typeof loadAndPlayYouTube === 'function') {
    loadAndPlayYouTube(primaryWinnerObj.youtubeUrl, false, false, true);
  }

  processNextPostMatchEvent();

  clearTimeout(fadeTimeout);
  fadeTimeout = setTimeout(() => { window.skipToMatchSummary(); }, 25000);
};

function displayVictoryTitleChyron(winner, isNew, titleName, isVacant = false, titleCode = 'whc') {
  let chyron = document.getElementById('victoryTitleChyron');
  if (!chyron) return;

  currentMatchSummary.titleWon = isNew || isVacant;
  
  let text = "";
  let borderCol = "";
  let textCol = "";
  let shadowCol = "";

  if (isVacant) {
    text = `★ NEW CHAMPION CROWNED // VACANT ${titleName.toUpperCase()} CLAIMED! ★`;
    borderCol = '#ffd700';
    textCol = '#ffffff';
    shadowCol = 'rgba(255, 215, 0, 0.9)';
  } else if (isNew) {
    text = `★ ...AND NEW ${titleName.toUpperCase()}! ★`;
    borderCol = '#ffd700';
    textCol = '#ffd700';
    shadowCol = 'rgba(255, 215, 0, 0.75)';
  } else {
    const defenseCount = typeof getTitleDefenseCount === 'function' ? getTitleDefenseCount(titleCode) : 0;
    text = `★ ...AND STILL ${titleName.toUpperCase()}! (DEFENSE #${defenseCount}) ★`;
    
    if (titleCode === 'whc') { borderCol = '#ffd700'; textCol = '#ffd700'; shadowCol = 'rgba(255, 215, 0, 0.75)'; }
    else if (titleCode === 'ic') { borderCol = '#0088ff'; textCol = '#0088ff'; shadowCol = 'rgba(0, 136, 255, 0.75)'; }
    else if (titleCode === 'hardcore') { borderCol = '#ff3300'; textCol = '#ff3300'; shadowCol = 'rgba(255, 51, 0, 0.75)'; }
    else if (titleCode === 'tag') { borderCol = '#e0e0e0'; textCol = '#ffffff'; shadowCol = 'rgba(224, 224, 224, 0.75)'; }
    else { borderCol = '#00ffcc'; textCol = '#00ffcc'; shadowCol = 'rgba(0, 255, 204, 0.75)'; }
  }

  chyron.style.cssText = `
    position: absolute !important;
    top: 96px !important;
    right: 22px !important;
    z-index: 99999 !important;
    display: flex !important;
    align-items: center !important;
    background: rgba(10, 12, 20, 0.94) !important;
    border: 2px solid ${borderCol} !important;
    box-shadow: 0 0 18px ${shadowCol} !important;
    padding: 8px 18px !important;
    clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%) !important;
    pointer-events: none !important;
  `;
  chyron.innerHTML = `
    <div style="font-family:'Russo One', sans-serif; font-size:clamp(0.85rem, 1.6vw, 1.05rem); letter-spacing:1.5px; color:${textCol}; text-shadow:0 0 12px ${shadowCol}; text-transform:uppercase; white-space:nowrap;">
      ${text}
    </div>
  `;

  const overlay = document.getElementById('beltEntranceOverlay');
  const img = document.getElementById('beltOverlayImg');
  const label = document.getElementById('beltTitleLabel');
  if (overlay && img) {
    img.src = activeBookedMatch.titleImg || 'whc.png';
    if (label) label.innerText = activeBookedMatch.titleName || 'CHAMPIONSHIP';
    overlay.style.display = 'flex';
  }
}

window.skipToMatchSummary = function() {
  clearTimeout(fadeTimeout);
  clearTimeout(victoryTimeout);
  try {
    if (typeof victorySound !== 'undefined') { victorySound.pause(); victorySound.currentTime = 0; }
    if (window.activeVictoryAudio) { window.activeVictoryAudio.pause(); window.activeVictoryAudio.currentTime = 0; }
  } catch (e) {}

  if (typeof stopCurrentVideo === 'function') stopCurrentVideo();
  setElDisplay('skipToSummaryBtn', 'none');
  setElDisplay('player-container', 'none');
  setElDisplay('victoryTitleChyron', 'none');
  setElDisplay('beltEntranceOverlay', 'none');
  setElDisplay('mitbBtn', 'none');

  const modalEl = document.getElementById('videoModal');
  if (modalEl) modalEl.classList.remove('split-screen-mode');

  const overlay = document.getElementById('universalSummaryOverlay');
  const visualContainer = document.getElementById('summaryWinnerVisualsContainer');
  const winnerImg = document.getElementById('summaryWinnerImg');
  const winnerName = document.getElementById('summaryWinnerName');
  const beltImg = document.getElementById('summaryBeltImg');
  const resultHeadline = document.getElementById('summaryResultHeadline');
  const recapBox = document.getElementById('summaryRecapBox');

  if (!overlay || !resultHeadline || !recapBox) return;

  if (activeBookedMatch.formatKey === 'rumble' || activeBookedMatch.matchType === 'Royal Rumble Match') {
    overlay.style.background = "linear-gradient(rgba(10, 10, 16, 0.85), rgba(10, 10, 16, 0.95)), url('rumble_bg.png') center / cover no-repeat";
  } else {
    overlay.style.background = "rgba(10, 10, 16, 0.96)";
  }

  if (winnerImg) {
    winnerImg.style.setProperty('animation', 'none', 'important');
    winnerImg.style.setProperty('transform', 'none', 'important');
  }

  const s = currentMatchSummary;
  const finalDefenseCount = (activeBookedMatch.isTitleMatch && typeof getTitleDefenseCount === 'function') ? getTitleDefenseCount(activeBookedMatch.titleCode) : 0;
  const loserNames = (s.losers && s.losers.length > 0) ? s.losers.map(l => l.name).join(' & ') : 'Opponents';

  const isTag = activeBookedMatch && (activeBookedMatch.formatKey === 'tag');
  let winnersList = [s.winner];
  if (isTag && activeBookedMatch.participants) {
    const parts = activeBookedMatch.participants;
    if (s.winner.id === parts[0].id || s.winner.id === parts[1].id) {
      winnersList = [parts[0], parts[1]];
    } else {
      winnersList = [parts[2], parts[3]];
    }
  }

  if (visualContainer) {
    if (isTag && winnersList.length === 2 && winnersList[0] && winnersList[1]) {
      visualContainer.innerHTML = `
        <div class="tag-podium-pair">
          <img src="${winnersList[0].image}" class="tag-podium-photo" onerror="handleImgError(this, '${winnersList[0].id}')">
          <div class="tag-podium-amp">&</div>
          <img src="${winnersList[1].image}" class="tag-podium-photo" onerror="handleImgError(this, '${winnersList[1].id}')">
        </div>
        <div style="font-family: 'Russo One', sans-serif; font-size: clamp(1.4rem, 3.5vw, 2.2rem); color: #ffffff; text-transform: uppercase; text-shadow: 0 4px 12px #000; margin-bottom: 2px;">
          ${winnersList[0].name.toUpperCase()} & ${winnersList[1].name.toUpperCase()}
        </div>
      `;
    } else {
      const wImg = s.winner ? s.winner.image : 'stonecold.png';
      const wName = s.winner ? s.winner.name.toUpperCase() : 'WINNER';
      visualContainer.innerHTML = `
        <img src="${wImg}" style="width: 125px; height: 125px; object-fit: cover; border: 3px solid #d4af37; box-shadow: 0 0 30px rgba(212, 175, 55, 0.6); margin-bottom: 6px;" alt="Winner">
        <div style="font-family: 'Russo One', sans-serif; font-size: clamp(1.8rem, 4.5vw, 2.5rem); color: #ffffff; text-transform: uppercase; text-shadow: 0 4px 12px #000; margin-bottom: 2px;">
          ${wName}
        </div>
      `;
    }
  } else if (winnerImg && winnerName) {
    winnerImg.src = s.winner ? s.winner.image : 'stonecold.png';
    winnerName.innerText = s.winner ? s.winner.name.toUpperCase() : 'WINNER';
  }

  if (s.titleName && beltImg) {
    beltImg.src = s.titleImg;
    beltImg.style.display = 'block';
  } else if (beltImg) {
    beltImg.style.display = 'none';
  }

  resultHeadline.innerText = `def. ${loserNames} by Pinfall / Decision`;

  const careerHeader = activeBookedMatch.isCareerMatch ? 'LOSER LEAVES EWF: ' : '';
  let recapHTML = `
    <div>🥊 <strong>STIPULATION:</strong> ${careerHeader}${s.matchType ? s.matchType.toUpperCase() : 'MATCH'}</div>
    <div>⏱️ <strong>MATCH DURATION:</strong> ${s.matchTime || '00:00'}</div>
  `;

  if (s.titleName) {
    if (s.titleWon) recapHTML += `<div style="color:#ffd700;">🏆 <strong>AND NEW:</strong> ${s.titleName.toUpperCase()}! (Reign Begins)</div>`;
    else recapHTML += `<div style="color:#00ff66;">🏆 <strong>AND STILL:</strong> ${s.titleName.toUpperCase()}! (Defense #${finalDefenseCount})</div>`;
  }
  if (s.referee) recapHTML += `<div>👔 <strong>SPECIAL GUEST REFEREE:</strong> ${s.referee}</div>`;
  if (s.interference) recapHTML += `<div style="color:#ff4444;">🚨 <strong>RINGSIDE INCIDENT:</strong> Ambush by ${s.interference.toUpperCase()}!</div>`;
  if (s.injuryInflicted) recapHTML += `<div style="color:#ff3333;">🚑 <strong>MEDICAL BULLETIN:</strong> ${s.injuryInflicted.victim.name.toUpperCase()} suffered ${s.injuryInflicted.severity.toUpperCase()} trauma (${s.injuryInflicted.matches} match shelf)!</div>`;
  if (s.feudStatus) recapHTML += `<div style="color:#ffd700;">🔥 <strong>FEUD UPDATE:</strong> ${s.feudStatus}</div>`;
  if (activeBookedMatch.isCareerMatch) recapHTML += `<div style="color:#ff3333;">💀 <strong>CAREER OVER:</strong> ${loserNames} has been terminated from EWF!</div>`;

  recapBox.innerHTML = recapHTML;
  overlay.style.display = 'flex';
};

window.confirmAndLogMatchSummary = function() {
  try {
    const s = currentMatchSummary;
    if (!s) return;
    try { if (window.EWFP) EWFP.onMatchResult(s, activeBookedMatch); } catch (e) {} // BATCH 10

    const finalDefenseCount = (activeBookedMatch.isTitleMatch && typeof getTitleDefenseCount === 'function') ? getTitleDefenseCount(activeBookedMatch.titleCode) : 0;
    const savedLosers = Array.isArray(s.losers) ? [...s.losers] : [];
    const loserNames = (savedLosers.length > 0) ? savedLosers.map(l => l.name).join(' & ') : 'Opponents';
    // BATCH 11 ITEM 4: tag team winners are both partners, not just the first one
    let winnerTeam = s.winner ? [s.winner] : [];
    if (s.winner && activeBookedMatch && activeBookedMatch.formatKey === 'tag' && Array.isArray(activeBookedMatch.participants)) {
      const loserIdsT = savedLosers.map(l => l && l.id);
      const team = activeBookedMatch.participants.filter(p => p && !loserIdsT.includes(p.id));
      if (team.length === 2) winnerTeam = team.some(p => p.id === s.winner.id) ? [s.winner, team.find(p => p.id !== s.winner.id)] : team;
    }
    const winnerName = winnerTeam.length ? winnerTeam.map(w => w.name.toUpperCase()).join(' & ') : 'A SUPERSTAR';
    const winnerId = s.winner ? s.winner.id : null;
    const matchDurationText = s.matchTime ? ` (Time: ${s.matchTime})` : '';
    const matchQuality = s.rating || 0;

    if (s.titleName && s.titleWon && finalDefenseCount >= 5) {
      if (typeof getMilestones === 'function' && typeof saveMilestones === 'function') {
        let m = getMilestones();
        if (!m.slayer_giants) {
          m.slayer_giants = { unlocked: true, holder: winnerId };
          saveMilestones(m);
        }
      }
    }

    if (s.titleName && s.titleWon) {
      if (typeof saveHistoryLog === 'function') saveHistoryLog(`🏆 NEW CHAMPION: ${winnerName} captured the ${s.titleName}!${matchDurationText}`, 'title-change', null, matchQuality);
    } else if (s.titleName) {
      if (typeof saveHistoryLog === 'function') saveHistoryLog(`🏆 TITLE RETAINED: ${winnerName} retained the ${s.titleName}! (Defense #${finalDefenseCount || 0})${matchDurationText}`, 'title-change', null, matchQuality);
    }

    const refTag = s.referee ? ` (Ref: ${s.referee})` : '';
    const careerHeader = activeBookedMatch.isCareerMatch ? 'LOSER LEAVES EWF: ' : '';
    const stipulation = s.matchType || 'Normal Match';
    if (typeof saveHistoryLog === 'function') saveHistoryLog(`🥊 ${winnerName} def. ${loserNames} [${careerHeader}${stipulation}]${refTag}${matchDurationText}`, 'match', winnerId, matchQuality);

    // Clear 8-loss redemption seen flag if the winner snapped their slump
    if (winnerId) {
      try {
        const seenMap = JSON.parse(localStorage.getItem('ewf_eight_loss_redemption_seen') || '{}');
        if (seenMap[winnerId]) {
          delete seenMap[winnerId];
          localStorage.setItem('ewf_eight_loss_redemption_seen', JSON.stringify(seenMap));
        }
      } catch (e) {}
    }

    // Sync Five-Star General stat & enforce 10/10 Classics unlock threshold
    if (matchQuality === 5 && typeof getGMProfile === 'function' && typeof saveGMProfile === 'function') {
      const prof = getGMProfile();
      prof.stats = prof.stats || {};
      const confirmedFiveStars = (typeof getHistory === 'function')
        ? getHistory().filter(h => h && (h.rating === 5 || (h.text && h.text.includes('★★★★★')))).length
        : ((prof.stats.fiveStars || 0) + 1);
      prof.stats.fiveStars = confirmedFiveStars;
      saveGMProfile(prof);
      if (confirmedFiveStars >= 10 && typeof unlockAchievement === 'function') {
        unlockAchievement('five_star_general');
      }
    }

    if (typeof evaluateAllMilestones === 'function') evaluateAllMilestones();

    const overlay = document.getElementById('universalSummaryOverlay');
    if (overlay) overlay.style.display = 'none';

    // SHOW SESSION PROGRESSION ENGINE
    if (window.activeShowSession) {
      const wasImpromptuCashIn = !!activeBookedMatch.isImpromptuCashIn;
      activeBookedMatch.isImpromptuCashIn = false;

      if (!wasImpromptuCashIn) {
        const curIdx = window.activeShowSession.currentBoutIdx;
        const curBout = window.activeShowSession.bouts[curIdx];

        if (curBout) {
          curBout.winnerId = winnerId;
          curBout.winnerName = winnerName;
          curBout.winnerObj = s.winner;
          curBout.winnerObjs = winnerTeam;
          curBout.titleWon = !!(s.titleName && s.titleWon);
          curBout.titleRetained = !!(s.titleName && !s.titleWon);
          curBout.loserName = loserNames;
          curBout.rating = matchQuality;
          curBout.status = 'completed';
          curBout.matchTime = s.matchTime;
        }

        if (window.activeShowSession.showKey === 'kotr' && curBout && curBout.order === 'SEMI-FINAL') {
          const finalBout = window.activeShowSession.bouts.find(b => b.order === 'MAIN EVENT');
          if (finalBout && s.winner) {
            finalBout.participants.push(s.winner);
          }
        }
        
        if (window.activeShowSession.showKey === 'kotr' && curBout && curBout.order === 'MAIN EVENT') {
          if (typeof setKotrHolder === 'function') setKotrHolder(winnerId);
          if (typeof unlockAchievement === 'function') unlockAchievement('crown_the_king');
          if (typeof saveHistoryLog === 'function') saveHistoryLog(`👑 KING OF THE RING: ${winnerName} won the tournament!`, 'match', winnerId, 5);
        }

        window.activeShowSession.cumulativeStars += matchQuality;
        window.activeShowSession.completedBouts++;
        window.activeShowSession.currentBoutIdx++;
      }

      // BATCH 6 ITEM 2: Check for 8-loss streak redemption during Book a Show (queues for show sign-off)
      if (savedLosers.length > 0 && typeof window.checkEightLossRedemptionTrigger === 'function') {
        window.checkEightLossRedemptionTrigger(savedLosers);
      }

      const isShowOngoing = window.activeShowSession.currentBoutIdx < window.activeShowSession.bouts.length;
      const savedInjury = s.injuryInflicted;
      const rollWinner = s.winner;
      const rollLoser = (savedLosers.length > 0) ? savedLosers[0] : null;

      currentMatchSummary = { rating: 0, interference: null, titleChange: false, winner: null, losers: [] };

      if (typeof closeVideoModal === 'function') closeVideoModal();

      const proceedBackToShowHub = () => {
        if (isShowOngoing) {
          setElDisplay('bookShowCardModal', 'flex');
          renderBookShowCardModal();
        } else {
          openEventHighlightsModal();
        }
      };

      if (savedInjury && savedInjury.isAmbulance) {
        if (typeof triggerSlambulanceEvacuation === 'function') {
          triggerSlambulanceEvacuation(savedInjury.victim, savedInjury.isMajor);
        } else {
          proceedBackToShowHub();
        }
        return;
      } else if (savedInjury) {
        const customReason = savedInjury.isHardcore ? `CRITICAL TRAUMA IN ${s.matchType.toUpperCase()}!` : `CRITICAL INJURY IN BOUT!`;
        if (typeof triggerUniversalInjuryBulletin === 'function') {
          triggerUniversalInjuryBulletin(savedInjury.victim, savedInjury.isMajor, customReason);
        } else {
          proceedBackToShowHub();
        }
        return;
      }

      // BATCH 10: turns, post-match angles and callouts between bouts
      if (window.EWFP && EWFP.afterBout({ inShow: true, ongoing: isShowOngoing, isMain: !isShowOngoing, winner: rollWinner, losers: savedLosers, summary: s, match: activeBookedMatch, done: proceedBackToShowHub })) return;

      if (isShowOngoing && Math.random() < 0.30 && rollWinner && rollLoser && typeof openStorylineModal === 'function') {
        setTimeout(() => { openStorylineModal(rollWinner, rollLoser, true); }, 350);
        return;
      }

      // BATCH 10: backstage segments (never straight after another cutscene)
      if (isShowOngoing && window.EWFP && EWFP.maybeBackstage(rollWinner, rollLoser, proceedBackToShowHub)) return;

      proceedBackToShowHub();
      return;
    }

    currentMatchSummary = { rating: 0, interference: null, titleChange: false, winner: null, losers: [] };

    if (activeBookedMatch.showKey === 'kotr' || activeBookedMatch.formatKey === 'kotr') {
      const finalMatchIdx = (typeof kotrMatches !== 'undefined' ? kotrMatches.length : 1) - 1;
      const isFinal = (typeof kotrCurrentMatchIdx !== 'undefined' && kotrCurrentMatchIdx === finalMatchIdx);

      if (isFinal) {
        if (typeof recordKotrWinner === 'function') recordKotrWinner(s.winner);
      } else {
        if (typeof closeVideoModal === 'function') closeVideoModal();
        if (typeof recordKotrWinner === 'function') recordKotrWinner(s.winner);
      }
      return;
    }

    if (s.injuryInflicted && s.injuryInflicted.isAmbulance) {
      if (typeof closeVideoModal === 'function') closeVideoModal();
      if (typeof triggerSlambulanceEvacuation === 'function') triggerSlambulanceEvacuation(s.injuryInflicted.victim, s.injuryInflicted.isMajor);
      return;
    } else if (s.injuryInflicted) {
      if (typeof closeVideoModal === 'function') closeVideoModal();
      const customReason = s.injuryInflicted.isHardcore ? `CRITICAL TRAUMA IN ${s.matchType.toUpperCase()}!` : `CRITICAL INJURY IN BLOOD FEUD BLOWOFF!`;
      if (typeof triggerUniversalInjuryBulletin === 'function') triggerUniversalInjuryBulletin(s.injuryInflicted.victim, s.injuryInflicted.isMajor, customReason);
      return;
    }

    // BATCH 6 ITEM 2: Trigger 8-Loss Streak Commentary Desk Cutscene in Standalone/Quick Match Mode
    if (savedLosers.length > 0 && typeof window.checkEightLossRedemptionTrigger === 'function') {
      if (typeof closeVideoModal === 'function') closeVideoModal();
      if (window.checkEightLossRedemptionTrigger(savedLosers)) {
        return;
      }
    }

    // BATCH 7 ITEM 19: Hospital Escape / MITB Stalking chance after a quick match
    if (typeof window.checkSpecialAngleTriggers === 'function') {
      if (typeof closeVideoModal === 'function') closeVideoModal();
      if (window.checkSpecialAngleTriggers()) return;
    }

    // BATCH 10: turns, post-match angles, return from exile and callouts after a quick match
    if (window.EWFP && s.winner) {
      if (typeof closeVideoModal === 'function') closeVideoModal();
      if (EWFP.afterBout({ inShow: false, ongoing: true, isMain: false, winner: s.winner, losers: savedLosers, summary: s, match: activeBookedMatch, done: () => {} })) return;
    }

    if (Math.random() < 0.30) {
      const rollWinner = s.winner;
      const rollLoser = (savedLosers.length > 0) ? savedLosers[0] : null;
      if (typeof closeVideoModal === 'function') closeVideoModal();
      if (rollWinner && rollLoser && typeof openStorylineModal === 'function') {
        setTimeout(() => { openStorylineModal(rollWinner, rollLoser, true); }, 350);
        return;
      }
    }

    if (typeof closeVideoModal === 'function') closeVideoModal();

  } catch (err) {
    console.error("Error committing history log:", err);
    if (typeof closeVideoModal === 'function') closeVideoModal();
  }
};
/* ==========================================================================
   ELLIS'S MAIN EVENT (EWF UNIVERSE) - MODULAR ENGINE
   MODULE 5 OF 5: js/5-match-engine.js (PART 4 OF 4)
   Event Highlights Showcase, Multi-Video Engine, Medical Bulletins & Bootstrap
   ========================================================================== */

/* --------------------------------------------------------------------------
   CINEMATIC EVENT HIGHLIGHTS CREDITS ROLL SHOWCASE
   -------------------------------------------------------------------------- */
function openEventHighlightsModal() {
  const modal = document.getElementById('eventHighlightsModal');
  if (!modal || !window.activeShowSession) return;
  const session = window.activeShowSession;
  const bouts = session.bouts;
  const mainEvent = bouts[bouts.length - 1];

  const heroStage = document.getElementById('ehHeroStage');
  const heroPoseImg = document.getElementById('ehHeroPoseImg');
  const heroNameEl = document.getElementById('ehHeroName');
  const heroSubEl = document.getElementById('ehHeroSub');
  const heroBeltImg = document.getElementById('ehHeroBeltImg');

  const winner = mainEvent.winnerObj || mainEvent.participants[0];
  const loserName = mainEvent.loserName || 'Opponents';

  const resolveHeroPose = (w) => {
    if (!w) return 'logo_notext.png';
    if (w.poseImage) return w.poseImage;
    const cleanId = (w.id || '').replace('default-', '');
    return `${cleanId}_pose.png`;
  };

  if (heroStage) {
    const showKey = session.showKey || 'raw';
    const bgImg = `${showKey}_highlights_bg.png`;
    heroStage.style.backgroundImage = `linear-gradient(rgba(10, 12, 20, 0.25), rgba(10, 12, 20, 0.65)), url('${bgImg}'), url('show_bg.png')`;
    heroStage.style.backgroundSize = 'cover';
    heroStage.style.backgroundPosition = 'center center';
    heroStage.style.paddingBottom = '0px';
    heroStage.style.display = 'flex';
    heroStage.style.alignItems = 'center';
    heroStage.style.overflow = 'hidden';
  }

  // BATCH 11 ITEM 4: tag team main event winners stand side by side
  const oldPartner = document.getElementById('ehHeroPartnerPoseImg');
  if (oldPartner) oldPartner.remove();
  if (heroPoseImg && Array.isArray(mainEvent.winnerObjs) && mainEvent.winnerObjs.length === 2) {
    const partner = mainEvent.winnerObjs.find(w => w && winner && w.id !== winner.id) || mainEvent.winnerObjs[1];
    if (partner) {
      const pImg = heroPoseImg.cloneNode(false);
      pImg.id = 'ehHeroPartnerPoseImg';
      pImg.src = resolveHeroPose(partner);
      pImg.onerror = function () { this.onerror = null; this.src = partner.image; };
      pImg.style.marginLeft = '-6%';
      heroPoseImg.insertAdjacentElement('afterend', pImg);
    }
  }

  if (heroPoseImg) {
    heroPoseImg.src = resolveHeroPose(winner);
    heroPoseImg.style.marginBottom = '0px';
    heroPoseImg.style.display = 'block';
    heroPoseImg.style.verticalAlign = 'bottom';
    heroPoseImg.style.alignSelf = 'flex-end';
  }

  if (heroNameEl && heroNameEl.parentElement) {
    heroNameEl.parentElement.style.alignSelf = 'center';
    heroNameEl.parentElement.style.display = 'flex';
    heroNameEl.parentElement.style.flexDirection = 'column';
    heroNameEl.parentElement.style.justifyContent = 'center';
  }

  if (heroNameEl) heroNameEl.innerText = (mainEvent.winnerName || (winner ? winner.name : 'WINNER')).toUpperCase();
  if (heroSubEl) heroSubEl.innerText = `DEF. ${loserName.toUpperCase()} IN THE MAIN EVENT (${mainEvent.matchTime || 'PINFALL'})`;

  if (heroBeltImg) {
    if (mainEvent.isTitleMatch && mainEvent.titleImg) {
      heroBeltImg.src = mainEvent.titleImg;
      heroBeltImg.style.display = 'block';
    } else {
      heroBeltImg.style.display = 'none';
    }
  }

  const undercardDeck = document.getElementById('ehUndercardDeck');
  if (undercardDeck) {
    undercardDeck.innerHTML = '';
    const undercardBouts = bouts.slice(0, bouts.length - 1);

    if (undercardBouts.length === 0) {
      const strip = document.createElement('div');
      strip.className = 'eh-undercard-strip';
      strip.innerHTML = `
        <div style="font-family:'Russo One', sans-serif; font-size:0.75rem; color:#ffd700; min-width:110px;">
          MAIN SHOWCASE
        </div>
        <div class="eh-undercard-fighter" style="flex-wrap:wrap;">
          <span style="font-family:'Russo One'; font-size:0.85rem; color:#00ff66;">${(mainEvent.winnerName || 'WINNER').toUpperCase()}</span>
          <span style="font-family:'Russo One'; font-size:0.8rem; color:#ff3333; margin:0 6px;">DEF.</span>
          <span style="font-family:'Russo One'; font-size:0.85rem; color:#aaa;">${(mainEvent.loserName || 'OPPONENTS').toUpperCase()}</span>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end;">
          <span style="font-size:0.72rem; color:#00e5ff; font-family:'Russo One';">${(mainEvent.matchType || 'MAIN EVENT').toUpperCase()}</span>
          <span style="color:#ffd700; font-size:0.85rem;">${'★'.repeat(mainEvent.rating || 0)}${'☆'.repeat(Math.max(0, 5 - (mainEvent.rating || 0)))}</span>
        </div>
      `;
      undercardDeck.appendChild(strip);
    } else {
      undercardBouts.forEach((b, idx) => {
        const strip = document.createElement('div');
        strip.className = 'eh-undercard-strip';
        const parts = Array.isArray(b.participants) ? b.participants.filter(Boolean) : [];
        let matchupHtml = '';

        if (b.formatKey === 'tag' && parts.length >= 4) {
          const team1Won = b.winnerId === parts[0].id || b.winnerId === parts[1].id;
          const t1Style = team1Won ? 'color:#00ff66;' : 'color:#888; text-decoration:line-through;';
          const t2Style = !team1Won ? 'color:#00ff66;' : 'color:#888; text-decoration:line-through;';
          const t1ImgStyle = !team1Won ? 'filter:grayscale(1) brightness(0.4);' : 'border-color:#00ff66;';
          const t2ImgStyle = team1Won ? 'filter:grayscale(1) brightness(0.4);' : 'border-color:#00ff66;';

          matchupHtml = `
            <div class="eh-undercard-fighter" style="flex-wrap:wrap; gap:6px;">
              <img src="${parts[0].image}" class="eh-undercard-thumb" style="${t1ImgStyle}" onerror="handleImgError(this, '${parts[0].id}')">
              <img src="${parts[1].image}" class="eh-undercard-thumb" style="margin-left:-10px; ${t1ImgStyle}" onerror="handleImgError(this, '${parts[1].id}')">
              <span style="font-family:'Russo One'; font-size:0.8rem; ${t1Style}">${parts[0].name} & ${parts[1].name}</span>
              <span style="font-family:'Russo One'; font-size:0.85rem; color:#ff3333; margin:0 4px;">VS</span>
              <span style="font-family:'Russo One'; font-size:0.8rem; ${t2Style}">${parts[2].name} & ${parts[3].name}</span>
              <img src="${parts[2].image}" class="eh-undercard-thumb" style="${t2ImgStyle}" onerror="handleImgError(this, '${parts[2].id}')">
              <img src="${parts[3].image}" class="eh-undercard-thumb" style="margin-left:-10px; ${t2ImgStyle}" onerror="handleImgError(this, '${parts[3].id}')">
            </div>
          `;
        } else if (parts.length >= 3) {
          const thumbsHtml = parts.map(p => {
            const isWin = b.winnerId === p.id;
            return `<img src="${p.image}" class="eh-undercard-thumb" style="${!isWin ? 'filter:grayscale(1) brightness(0.4);' : 'border-color:#00ff66;'}" onerror="handleImgError(this, '${p.id}')">`;
          }).join('');
          matchupHtml = `
            <div class="eh-undercard-fighter" style="flex-wrap:wrap; gap:6px;">
              <div style="display:flex; align-items:center; gap:4px;">${thumbsHtml}</div>
              <span style="font-family:'Russo One'; font-size:0.82rem; color:#00ff66;">${(b.winnerName || 'WINNER').toUpperCase()}</span>
              <span style="font-family:'Russo One'; font-size:0.78rem; color:#ff3333; margin:0 3px;">DEF.</span>
              <span style="font-family:'Russo One'; font-size:0.78rem; color:#aaa;">${(b.loserName || 'FIELD').toUpperCase()}</span>
            </div>
          `;
        } else {
          const p1 = parts[0];
          const p2 = parts[1];
          const isP1Winner = b.winnerId === (p1 ? p1.id : null);
          matchupHtml = `
            <div class="eh-undercard-fighter">
              <img src="${p1 ? p1.image : 'logo_notext.png'}" class="eh-undercard-thumb" style="${!isP1Winner ? 'filter:grayscale(1) brightness(0.4);' : 'border-color:#00ff66;'}" onerror="handleImgError(this, '${p1 ? p1.id : ''}')">
              <span style="font-family:'Russo One'; font-size:0.85rem; ${isP1Winner ? 'color:#00ff66;' : 'color:#888; text-decoration:line-through;'}">${p1 ? p1.name : 'Superstar'}</span>
              <span style="font-family:'Russo One'; font-size:0.9rem; color:#ff3333; margin:0 4px;">VS</span>
              <span style="font-family:'Russo One'; font-size:0.85rem; ${!isP1Winner ? 'color:#00ff66;' : 'color:#888; text-decoration:line-through;'}">${p2 ? p2.name : 'Superstar'}</span>
              <img src="${p2 ? p2.image : 'logo_notext.png'}" class="eh-undercard-thumb" style="${isP1Winner ? 'filter:grayscale(1) brightness(0.4);' : 'border-color:#00ff66;'}" onerror="handleImgError(this, '${p2 ? p2.id : ''}')">
            </div>
          `;
        }

        strip.innerHTML = `
          <div style="font-family:'Russo One', sans-serif; font-size:0.75rem; color:#ffd700; min-width:90px;">
            BOUT ${idx + 1} [${b.order}]
          </div>
          ${matchupHtml}
          <div style="display:flex; flex-direction:column; align-items:flex-end;">
            <span style="font-size:0.72rem; color:#00e5ff; font-family:'Russo One';">${b.matchType.toUpperCase()}</span>
            <span style="color:#ffd700; font-size:0.85rem;">${'★'.repeat(b.rating || 0)}${'☆'.repeat(Math.max(0, 5 - (b.rating || 0)))}</span>
          </div>
        `;
        undercardDeck.appendChild(strip);
      });
    }
  }

  const falloutList = document.getElementById('ehFalloutList');
  if (falloutList) {
    falloutList.innerHTML = '';
    const falloutItems = session.showFalloutLog || [];

    const iconMap = {
      alliance: '🤝',
      breakup: '💔',
      cutscene: '🎬',
      signing: '✍️',
      brawl: '💥',
      cashin: '💼',
      injury: '🚨',
      ambush: '🚨',
      return: '🚨',
      rumble: '🏆',
      feud: '🔥'
    };

    if (falloutItems.length === 0) {
      falloutList.innerHTML = `
        <div class="eh-fallout-row">
          <span>✔️</span>
          <span>Clean broadcast card. No medical evacuations recorded tonight. Roster status steady.</span>
        </div>
      `;
    } else {
      falloutItems.forEach(item => {
        const row = document.createElement('div');
        row.className = 'eh-fallout-row';
        const badgeIcon = iconMap[item.type] || '🔥';
        const cleanText = String(item.text || '').replace(/^[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F\s]+/u, '');
        row.innerHTML = `<span>${badgeIcon}</span><span>${cleanText || item.text}</span>`;
        falloutList.appendChild(row);
      });
    }
  }

  setElDisplay('bookShowCardModal', 'none');
  modal.style.display = 'flex';
  modal.scrollTop = 0;
}
window.openEventHighlightsModal = openEventHighlightsModal;

window.signOffHighlightsToShowGrade = function() {
  const highlightsModal = document.getElementById('eventHighlightsModal');
  if (highlightsModal) highlightsModal.style.display = 'none';

  try {
    const pyroAudio = new Audio('pyro_blast.mp3');
    pyroAudio.currentTime = 0;
    pyroAudio.volume = 0.9;
    pyroAudio.play().catch(() => {});
  } catch (e) {
    if (typeof playPyroBlast === 'function') playPyroBlast();
  }
  if (typeof playSubBassBoom === 'function') playSubBassBoom();

  triggerShowFinaleCelebration();
};

function triggerShowFinaleCelebration() {
  if (!window.activeShowSession) return;
  const session = window.activeShowSession;
  const totalBouts = session.bouts.length;
  const avg = (session.cumulativeStars / totalBouts).toFixed(1);
  const avgNum = parseFloat(avg);

  let grade = 'B';
  let desc = 'SOLID EVENT! An entertaining card with steady crowd reaction.';
  let tierColor = '#ffd700';
  let tierGlow = 'rgba(255, 215, 0, 0.45)';

  if (avgNum >= 4.5) {
    grade = 'A+';
    desc = 'LEGENDARY SUPER-CARD! Promoters around the world are applauding Ellis’s masterpiece.';
    tierColor = '#00e5ff';
    tierGlow = 'rgba(0, 229, 255, 0.55)';
  } else if (avgNum >= 3.8) {
    grade = 'A';
    desc = 'STELLAR BROADCAST! Electric energy and incredible in-ring action from top to bottom.';
    tierColor = '#00ff66';
    tierGlow = 'rgba(0, 255, 102, 0.5)';
  } else if (avgNum < 3.0) {
    grade = 'C';
    desc = 'CONTROVERSIAL CARD! The critics have questions, but the federation moves forward.';
    tierColor = '#ff3333';
    tierGlow = 'rgba(255, 51, 51, 0.5)';
  }

  const isTv = (session.showKey === 'raw' || session.showKey === 'smackdown');
  const isBig = (session.showKey === 'summerslam' || session.showKey === 'mania');
  const xpReward = session.customXp || (isTv ? 150 : (isBig ? 600 : 350)); // BATCH 12: custom shows set their own XP

  session.finalGrade = grade;
  session.finalRating = avg;
  session.finalXp = xpReward;

  document.getElementById('bsfCelebrateShowName').innerText = session.showName.toUpperCase();

  const gradeBadge = document.getElementById('bsfCelebrateGradeBadge');
  if (gradeBadge) {
    gradeBadge.innerText = `${grade} (${avg} ★)`;
    gradeBadge.style.setProperty('color', tierColor, 'important');
    gradeBadge.style.setProperty('border-color', tierColor, 'important');
    gradeBadge.style.setProperty('box-shadow', `0 0 22px ${tierGlow}`, 'important');
    gradeBadge.style.setProperty('text-shadow', `0 0 12px ${tierGlow}`, 'important');
  }

  document.getElementById('bsfCelebrateGradeDesc').innerText = desc;
  document.getElementById('bsfCelebrateXpText').innerText = `+${xpReward} PROMOTER XP AWARDED`;

  const list = document.getElementById('bsfCelebrateScorecardList');
  if (list) {
    list.innerHTML = session.bouts.map((b, idx) => `
      <div class="bsf-scorecard-row">
        <span>Bout ${idx+1} [${b.order}]: ${b.winnerName} def. ${b.loserName}</span>
        <span style="color:#ffd700;">${'★'.repeat(b.rating)}${'☆'.repeat(5-b.rating)}</span>
      </div>
    `).join('');
  }

  setElDisplay('bookShowCardModal', 'flex');
  setElDisplay('bookShowFinaleOverlay', 'flex');
}

window.finishAndArchiveShowToHistory = function() {
  if (!window.activeShowSession) return;
  const session = window.activeShowSession;
  const showBoutsSnapshot = Array.isArray(session.bouts) ? [...session.bouts] : [];
  
  if (typeof addXP === 'function') {
    addXP(session.finalXp, `${session.showName} Broadcast`);
  }

  const profile = typeof getGMProfile === 'function' ? getGMProfile() : { stats: {} };
  profile.stats = profile.stats || {};
  profile.stats.showsCompleted = (profile.stats.showsCompleted || 0) + 1;
  profile.stats.showBrands = profile.stats.showBrands || [];
  if (!profile.stats.showBrands.includes(session.showKey)) {
    profile.stats.showBrands.push(session.showKey);
  }
  if (typeof saveGMProfile === 'function') saveGMProfile(profile);

  if (typeof unlockAchievement === 'function') {
    unlockAchievement('first_broadcast');
    if (profile.stats.showsCompleted >= 5) unlockAchievement('the_showrunner');
    if ((session.showKey === 'mania' || session.showKey === 'summerslam') && parseFloat(session.finalRating) >= 4.5) {
      unlockAchievement('megalomaniac');
    }
    const allBrands = ['raw', 'smackdown', 'backlash', 'kotr', 'mitb', 'summerslam', 'survivor', 'mania'];
    if (allBrands.every(b => profile.stats.showBrands.includes(b))) {
      unlockAchievement('grand_tour_promoter');
    }
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ', ' + 
                  now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });

  const archiveEntry = {
    id: 'show-' + Date.now(),
    showKey: session.showKey,
    showName: session.showName,
    date: dateStr,
    grade: session.finalGrade,
    rating: session.finalRating,
    xpEarned: session.finalXp,
    bouts: session.bouts.map(b => ({
      orderName: b.order,
      stipulation: b.matchType,
      winnerName: b.winnerName,
      loserName: b.loserName,
      rating: b.rating
    }))
  };

  if (typeof getShowHistory === 'function' && typeof saveShowHistory === 'function') {
    const hist = getShowHistory();
    hist.push(archiveEntry);
    saveShowHistory(hist);
  }

  if (typeof saveHistoryLog === 'function') {
    saveHistoryLog(`📺 ${session.showName.toUpperCase()} BROADCAST SIGN-OFF: Overall Grade ${session.finalGrade} (${session.finalRating} ★) [+${session.finalXp} XP]`, 'show', null, Math.round(parseFloat(session.finalRating)));
  }

  const boutsContainer = document.getElementById('bookShowBoutsContainer');
  if (boutsContainer) boutsContainer.innerHTML = '';

  window.activeShowSession = null;
  setElDisplay('bookShowFinaleOverlay', 'none');
  setElDisplay('bookShowCardModal', 'none');

  // BATCH 6 ITEM 3: Restore top-left home button upon signing off the broadcast
  setElDisplay('gmProfileWidget', 'flex');
  setElDisplay('bgmToggleBtn', 'inline-flex');
  setElDisplay('gmHeaderHomeBtn', 'flex');

  if (typeof renderBookShowAccordionArchives === 'function') {
    renderBookShowAccordionArchives();
  }

  function triggerPostShowFalloutAngle() {
    // BATCH 6 ITEM 2: Fire queued 8-loss streak Commentary Desk Redemption cutscene after show sign-off
    if (window.pendingEightLossRedemption) {
      const star = window.pendingEightLossRedemption;
      window.pendingEightLossRedemption = null;
      if (typeof window.openCommentaryRedemptionModal === 'function') {
        window.openCommentaryRedemptionModal(star);
        return;
      }
    }

    if (window.pendingMediaScrum) {
      const pA = window.pendingMediaScrum.partnerA;
      const pB = window.pendingMediaScrum.partnerB;
      window.pendingMediaScrum = null;
      if (typeof openMediaScrumModal === 'function') {
        openMediaScrumModal(pA, pB, currentMatchSummary);
      }
      return;
    }

    // BATCH 7 ITEM 19: Hospital Escape / MITB Stalking after a show signs off
    if (typeof window.checkSpecialAngleTriggers === 'function' && window.checkSpecialAngleTriggers()) {
      return;
    }

    if (typeof window.checkMidnightSyndicateTrigger === 'function' && window.checkMidnightSyndicateTrigger()) {
      return;
    }

    if (typeof openStorylineModal === 'function') {
      const allW = (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : defaultWrestlers)
        .filter(w => !(typeof getInjuryRecord === 'function' && getInjuryRecord(w.id)));

      const mainEvent = showBoutsSnapshot[showBoutsSnapshot.length - 1];
      let starA = null;
      let starB = null;

      if (mainEvent && Array.isArray(mainEvent.participants) && mainEvent.participants.length >= 2) {
        const winnerStar = mainEvent.winnerObj && allW.some(w => w.id === mainEvent.winnerObj.id)
          ? mainEvent.winnerObj
          : allW.find(w => mainEvent.participants.some(p => p && p.id === w.id));
        const otherShowStars = showBoutsSnapshot
          .flatMap(b => Array.isArray(b.participants) ? b.participants : [])
          .filter(p => p && winnerStar && p.id !== winnerStar.id && allW.some(w => w.id === p.id));

        if (winnerStar && otherShowStars.length > 0) {
          starA = winnerStar;
          starB = otherShowStars[Math.floor(Math.random() * otherShowStars.length)];
        }
      }

      if (!starA || !starB) {
        const shuffled = [...allW].sort(() => Math.random() - 0.5);
        starA = shuffled[0];
        starB = shuffled[1];
      }

      if (starA && starB) {
        openStorylineModal(starA, starB, true);
      }
    }
  }

  function processDeferredQueue() {
    if (window.showDeferredFalloutQueue && window.showDeferredFalloutQueue.length > 0) {
      const drained = window.showDeferredFalloutQueue.splice(0, window.showDeferredFalloutQueue.length);
      drained.forEach(fn => {
        if (typeof fn === 'function') enqueuePostMatchEvent(fn);
      });
    }

    // BATCH 7 ITEM 12: The post-show storyline used to keep waiting in the background and could fire in the
    // middle of the NEXT show (or over its grade screen). Now it's dropped if a new show has started, and it
    // stops waiting on a stuck event queue after ~12 seconds.
    let fallbackTries = 0;
    const waitForPopupsAndFire = () => {
      if (window.activeShowSession) return;
      // ...and dropped if Ellis has already moved on into a quick match or the Book a Show menu
      const busy = ['videoModal', 'bookShowModal', 'bookShowCardModal'].some(id => { const el = document.getElementById(id); return el && getComputedStyle(el).display !== 'none'; });
      if (busy) return;
      fallbackTries++;
      const queueBusy = window.postMatchEventQueue && window.postMatchEventQueue.length > 0;
      if (isAchievementShowing || (queueBusy && fallbackTries < 30)) {
        setTimeout(waitForPopupsAndFire, 400);
      } else {
        triggerPostShowFalloutAngle();
      }
    };

    setTimeout(waitForPopupsAndFire, 250);
  }

  setTimeout(processDeferredQueue, 350);

  if (typeof resumeBGM === 'function') resumeBGM();
};

/* --------------------------------------------------------------------------
   HELPER UTILITIES: VIDEO MANAGEMENT & LOGO RENDERING
   -------------------------------------------------------------------------- */
function stopCurrentVideo() {
  const iframe = document.getElementById('youtubeIframe');
  if (iframe) iframe.src = '';
}

function renderMatchLogoHTML(matchName, lockClass = '', isSlotReel = false) {
  const fileName = typeof matchTypeLogos !== 'undefined' ? matchTypeLogos[matchName] : null;
  const inlineStyle = isSlotReel ? 'max-height: 56px; max-width: 90%; object-fit: contain;' : '';
  if (fileName) { 
    return `<img src="${fileName}" alt="${matchName}" class="match-type-logo ${lockClass}" style="${inlineStyle}" onerror="this.outerHTML='<span style=\\'color:#ffffff\\'>${matchName}</span>'">`; 
  }
  return `<span style="color: #ffffff">${matchName}</span>`;
}

function turnOffOtherModes(exceptMode) {
  if (exceptMode !== 'promo' && typeof isPromoMode !== 'undefined' && isPromoMode) {
    isPromoMode = false;
    const btn = document.getElementById('promoToggleBtn');
    if (btn) btn.classList.remove('active');
  }
}

/* --------------------------------------------------------------------------
   14. MULTI-VIDEO ENGINE, YOUTUBE EMBEDS & BROADCAST OVERLAYS
   -------------------------------------------------------------------------- */
function extractVideoInfo(url) {
  if (!url) return { id: null, start: null };
  let regex = /(youtu\.be\/|youtube\.com\/(watch\?(.*&)?v=|(embed|v)\/))([^\?&"'>]+)/;
  let matches = url.match(regex);
  let id = matches ? matches[5] : null;

  let startTimeMatch = url.match(/[?&](t|start)=(\w+)/);
  let startSeconds = null;
  if (startTimeMatch) {
    let timeStr = startTimeMatch[2];
    if (/^\d+$/.test(timeStr)) {
      startSeconds = timeStr;
    } else {
      let mMatch = timeStr.match(/(\d+)m/);
      let sMatch = timeStr.match(/(\d+)s/);
      let hMatch = timeStr.match(/(\d+)h/);

      let totalSeconds = 0;
      if (hMatch) totalSeconds += parseInt(hMatch[1]) * 3600;
      if (mMatch) totalSeconds += parseInt(mMatch[1]) * 60;
      if (sMatch) totalSeconds += parseInt(sMatch[1]);

      if (totalSeconds > 0) startSeconds = totalSeconds.toString();
    }
  }
  return { id: id, start: startSeconds };
}

function extractVideoID(url) {
  return extractVideoInfo(url).id;
}

function sanitizeYouTubeEmbedUrl(url) {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&enablejsapi=1&rel=0&controls=0`;
  }
  return url;
}

function openVideoModal() {
  const modal = document.getElementById('videoModal');
  if (!modal) return;
  modal.style.display = 'flex';
  
  setElDisplay('videoCloseBtn', 'flex');
  
  try { 
    if (modal.requestFullscreen && typeof modal.requestFullscreen === 'function') { 
      modal.requestFullscreen().catch(() => {}); 
    } 
  } catch (e) {}
}

window.loadAndPlayYouTube = function(url, isCashIn = false, hideMITB = false, isVictory = false, isShowIntro = false) {
  if (typeof stopBGMForAction === 'function') stopBGMForAction();
  
  let selectedUrl = url;
  if (typeof url === 'string' && url.includes(',')) {
    const urlArray = url.split(',').map(u => u.trim()).filter(u => u !== "");
    if (urlArray.length > 0) {
      selectedUrl = urlArray[Math.floor(Math.random() * urlArray.length)];
    }
  }

  const isCommUrl = typeof selectedUrl === 'string' && (selectedUrl.includes('3KhudlnBhfw') || selectedUrl.includes('BMnVE6Jznvg'));
  const isCommStar = currentPlayingWrestler && typeof currentPlayingWrestler.name === 'string' && /bret|corbin/i.test(currentPlayingWrestler.name);
  window.isCommentatorVideoActive = Boolean(isCommUrl || isCommStar);

  const videoInfo = extractVideoInfo(selectedUrl);
  currentVideoId = videoInfo.id;
  currentVideoStartTime = videoInfo.start;

  if (!currentVideoId) { window.open(selectedUrl, '_blank'); return; }

  const modalEl = document.getElementById('videoModal');
  if (modalEl) modalEl.classList.remove('split-screen-mode');

  setElDisplay('quickMatchBox', 'none');
  setElDisplay('mitbStrobeOverlay', 'none');
  setElDisplay('ambulanceStrobeOverlay', 'none');
  setElDisplay('rumbleHoldingScreen', 'none');
  setElDisplay('player-container', 'block');

  if (modalEl) {
    if (activeBookedMatch.formatKey === 'rumble' || activeBookedMatch.matchType === 'Royal Rumble Match' || (activeBookedMatch.matchType && activeBookedMatch.matchType.includes("Rumble"))) {
      modalEl.style.setProperty('background-image', "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.75)), url('rumble_bg.png')", 'important');
      modalEl.style.setProperty('background-size', 'cover', 'important');
      modalEl.style.setProperty('background-position', 'center center', 'important');
    } else if (activeBookedMatch.showKey === 'kotr' || activeBookedMatch.formatKey === 'kotr') {
      modalEl.style.backgroundImage = "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7)), url('kotr_bg.png')";
    } else {
      modalEl.style.backgroundImage = "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7)), url('show_bg.png')";
    }
  }

  let iframeUrl = sanitizeYouTubeEmbedUrl(selectedUrl);
  if (currentVideoStartTime) {
    iframeUrl += `&start=${currentVideoStartTime}`;
  }

  const iframe = document.getElementById('youtubeIframe');
  if (iframe) { iframe.src = iframeUrl; }

  const isCountdownOrIntro = hideMITB || isShowIntro || selectedUrl.includes("3p9qUWS7EvQ");

  if (isCountdownOrIntro) {
    if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd(false);
  } else if (!isVictory) {
    if (typeof playEntranceCrowd === 'function') playEntranceCrowd();
  } else {
    if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd(false);
    if (typeof stopMatchCrowd === 'function') stopMatchCrowd();
  }

  const liveBug = document.getElementById('liveBroadcastBug');
  if (liveBug) liveBug.style.display = (typeof isPromoMode !== 'undefined' && isPromoMode) ? 'none' : 'flex';

  const mitbHolder = typeof getMitbHolder === 'function' ? getMitbHolder() : null;
  const titles = typeof getTitleHolders === 'function' ? getTitleHolders() : {};
  const activeChampIds = [titles.whc, titles.ic, titles.hardcore, titles.tag1, titles.tag2].filter(Boolean);
  const isPlayingActiveChamp = !!(currentPlayingWrestler && activeChampIds.includes(currentPlayingWrestler.id));

  const mitbUiBtn = document.getElementById('mitbBtn');
  const skipBtn = document.getElementById('skipIntroOverlayBtn');
  const rushBtn = document.getElementById('rushRingOverlayBtn');

  if (mitbUiBtn) {
    if (!hideMITB && mitbHolder && isPlayingActiveChamp && currentPlayingWrestler.id !== mitbHolder.id) {
      mitbUiBtn.style.display = 'block';
      mitbUiBtn.innerText = `💼 CASH IN (${mitbHolder.name.toUpperCase()})!`;
      mitbUiBtn.onclick = (e) => {
        if (e) e.stopPropagation();
        window.handleMitbCashInClick();
      };
    } else {
      mitbUiBtn.style.display = 'none';
      mitbUiBtn.onclick = null;
    }
  }

  const closeBtn = document.getElementById('videoCloseBtn');
  if (closeBtn) {
    if (!isRunInActive) {
      closeBtn.style.setProperty('display', 'flex', 'important');
    }
    closeBtn.style.setProperty('z-index', '2147483647', 'important');
    closeBtn.style.setProperty('pointer-events', 'auto', 'important');
  }

  if (isCashIn && skipBtn) {
    skipBtn.style.display = "none";
    if (rushBtn) {
      rushBtn.innerText = "⏩ Rush the Ring!";
      rushBtn.style.display = "block";
      rushBtn.onclick = () => { clearTimeout(cashInTimeout); showMatchInProgressWinnerScreen(); };
    }
    clearTimeout(cashInTimeout);
    cashInTimeout = setTimeout(() => { showMatchInProgressWinnerScreen(); }, 30000);
  } else if (isShowIntro) {
    if (skipBtn) {
      ensureSkipIntroBtnPosition();
      skipBtn.style.display = 'block';
    }
    if (rushBtn) rushBtn.style.display = 'block';
  } else if (!isVictory && !isCountdownOrIntro && activeMatchMode === 'quickMatch') {
    if (skipBtn) skipBtn.style.display = 'none';
    if (rushBtn) rushBtn.style.display = 'block';
  }

  openVideoModal();
  if (!isRunInActive && (typeof isPromoMode === 'undefined' || !isPromoMode) && !isCountdownOrIntro && currentPlayingWrestler) {
    if (typeof triggerNameplate === 'function') triggerNameplate(currentPlayingWrestler.name);
    if (typeof checkAndShowBeltOverlay === 'function') checkAndShowBeltOverlay(currentPlayingWrestler);
  } else {
    if (typeof hideNameplate === 'function') hideNameplate();
    setElDisplay('beltEntranceOverlay', 'none');
    setElDisplay('titleMatchBanner', 'none');
  }
};

window.triggerNameplate = function(name) {
  if (typeof isPromoMode !== 'undefined' && isPromoMode) return;
  const container = document.getElementById('nameplateContainer');
  const text = document.getElementById('nameplateText');
  if (!container || !text || !name) return;
  text.innerText = name;
  clearTimeout(nameplateTimeout);
  clearTimeout(nameplateDelayTimeout);
  nameplateDelayTimeout = setTimeout(() => {
    container.classList.add('active');
    nameplateTimeout = setTimeout(() => { container.classList.remove('active'); }, 6000);
  }, 5000);
};

window.hideNameplate = function() {
  const container = document.getElementById('nameplateContainer');
  if (container) container.classList.remove('active');
  clearTimeout(nameplateTimeout);
  clearTimeout(nameplateDelayTimeout);
};

window.checkAndShowBeltOverlay = function(wrestler) {
  if (typeof isPromoMode !== 'undefined' && isPromoMode) return;
  if (activeMatchMode === 'rumble' || activeBookedMatch.formatKey === 'rumble' || (activeBookedMatch.matchType && activeBookedMatch.matchType.includes("Rumble"))) {
    setElDisplay('beltEntranceOverlay', 'none');
    setElDisplay('titleMatchBanner', 'none');
    return;
  }

  const overlay = document.getElementById('beltEntranceOverlay');
  const img = document.getElementById('beltOverlayImg');
  const label = document.getElementById('beltTitleLabel');
  const banner = document.getElementById('titleMatchBanner');

  if (banner) {
    banner.style.display = (activeMatchMode === 'quickMatch' && activeBookedMatch.isTitleMatch) ? 'block' : 'none';
  }

  if (!wrestler || !overlay || !img || !label) { if (overlay) overlay.style.display = 'none'; return; }

  const titles = typeof getTitleHolders === 'function' ? getTitleHolders() : {};
  const mitbHolder = typeof getMitbHolder === 'function' ? getMitbHolder() : null;
  let beltImgSrc = '';
  let titleName = '';

  if (mitbHolder && mitbHolder.id === wrestler.id) { beltImgSrc = 'mitb_briefcase.png'; titleName = 'Money in the Bank Holder'; }
  else if (titles.whc === wrestler.id) { beltImgSrc = 'whc.png'; titleName = 'World Heavyweight Champion'; }
  else if (titles.ic === wrestler.id) { beltImgSrc = 'ic_title.png'; titleName = 'Intercontinental Champion'; }
  else if (titles.hardcore === wrestler.id) { beltImgSrc = 'hardcore.png'; titleName = 'Hardcore Champion'; }
  else if (titles.tag1 === wrestler.id || titles.tag2 === wrestler.id) { beltImgSrc = 'tag_title.png'; titleName = 'World Tag Team Champion'; }

  if (beltImgSrc !== '') {
    img.src = beltImgSrc;
    img.onerror = () => { overlay.style.display = 'none'; };
    label.innerText = titleName;
    overlay.style.display = 'flex';
  } else {
    overlay.style.display = 'none';
  }
};

window.closeVideoModal = function() {
  if (typeof window.stopMysteryRoulette === 'function') window.stopMysteryRoulette(); // BATCH 8 ITEM 2
  if (typeof disableWakeLock === 'function') disableWakeLock();
  isMatchInProgressLooping = false;
  isRunInActive = false;
  isMatchPostScreenActive = false;
  window.isCommentatorVideoActive = false;

  // BATCH 6 ITEM 8: Clean up background video loop listener
  if (window._bgVideoLoopListener) {
    window.removeEventListener('message', window._bgVideoLoopListener);
    window._bgVideoLoopListener = null;
  }

  // BATCH 6 ITEM 5: Clean up exiled reinstatement overlays if closed via X
  if (typeof window.cleanupReinstatementOverlays === 'function') {
    window.cleanupReinstatementOverlays();
  } else {
    setElDisplay('reinstatementNewsBanner', 'none');
    setElDisplay('reinstatementSkipIntroBtn', 'none');
  }

  if (typeof stopMatchCrowd === 'function') stopMatchCrowd();
  if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd(false);
  if (typeof window.stopMitbSirenAudio === 'function') window.stopMitbSirenAudio();
  stopLiveMatchStopwatch();
  clearTimeout(matchCardDelayTimeout);
  window.dismissMatchCardOverlay();

  const iframe = document.getElementById('youtubeIframe');
  if (iframe) iframe.src = '';
  activeMatchMode = 'normal';
  isPlayingCountdown = false;
  currentPlayingWrestler = null;
  quickMatchQueue = [];
  window.hideNameplate();
  const vicOverlay = document.getElementById('titleVictoryOverlay');
  if (vicOverlay) vicOverlay.classList.remove('active');

  const modalEl = document.getElementById('videoModal');
  if (modalEl) modalEl.classList.remove('split-screen-mode');

  const qmBox = document.getElementById('quickMatchBox');
  if (qmBox) qmBox.style.setProperty('background-image', 'none', 'important');

  activeBookedMatch.isTitleMatch = false;
  activeBookedMatch.isCareerMatch = false;
  setElDisplay('beltEntranceOverlay', 'none');
  setElDisplay('titleMatchBanner', 'none');
  setElDisplay('victoryTitleChyron', 'none');

  setElDisplay('nextEntrantBtn', 'none');
  setElDisplay('skipIntroOverlayBtn', 'none');
  setElDisplay('rushRingOverlayBtn', 'none');
  setElDisplay('skipToSummaryBtn', 'none');
  setElDisplay('universalSummaryOverlay', 'none');
  setElDisplay('mitbBtn', 'none');
  setElDisplay('videoModal', 'none');
  setElDisplay('mitbStrobeOverlay', 'none');
  setElDisplay('ambulanceStrobeOverlay', 'none');
  setElDisplay('quickMatchBox', 'none');
  setElDisplay('rumbleHoldingScreen', 'none');
  setElDisplay('rumbleCoronationOverlay', 'none');
  setElDisplay('mitbCoronationOverlay', 'none');
  setElDisplay('matchCardOverlay', 'none');
  setElDisplay('contractSigningModal', 'none');
  setElDisplay('videoCloseBtn', 'none');
  setElDisplay('titleStakeModal', 'none');
  setElDisplay('mitbTargetModal', 'none');
  setElDisplay('liveBroadcastBug', 'none');
  setElDisplay('specialRefBanner', 'none');

  const blackout = document.getElementById('lightsOutOverlay');
  if (blackout) blackout.style.display = 'none';
  const ambushBanner = document.getElementById('ambushBanner');
  if (ambushBanner) ambushBanner.style.display = 'none';
  const debutBanner = document.getElementById('superstarDebutBanner');
  if (debutBanner) debutBanner.style.display = 'none';

  clearInterval(fadeInterval);
  clearTimeout(fadeTimeout);
  clearTimeout(rumbleEntrantTimeout);
  clearTimeout(qmSpinTimeout);
  clearTimeout(runInAutoTimeout);
  clearTimeout(victoryTimeout);
  clearTimeout(cashInTimeout);
  clearTimeout(rumbleEntranceDurationTimeout);
  clearTimeout(unpromptedAmbushTimer);
  clearTimeout(matchCardTimeout);
  clearTimeout(matchCardDelayTimeout);
  clearInterval(rouletteInterval);
  clearInterval(rumbleTimerInterval);
  contractSigningCallback = null;
  window.pendingMediaScrum = null;
  window.postMatchEventQueue = [];

  try { if (typeof slotSpinSound !== 'undefined') slotSpinSound.pause(); } catch (e) {}
  try {
    if (typeof bellSound !== 'undefined') {
      bellSound.pause();
      bellSound.currentTime = 0;
      bellSound.onended = null;
    }
    if (typeof victorySound !== 'undefined') {
      victorySound.pause();
      victorySound.currentTime = 0;
    }
    if (window.activeVictoryAudio) {
      window.activeVictoryAudio.pause();
      window.activeVictoryAudio.currentTime = 0;
    }
  } catch (e) {}

  if (document.fullscreenElement) { try { document.exitFullscreen().catch(() => {}); } catch (e) {} }
  turnOffOtherModes('');
  if (typeof renderGrid === 'function') renderGrid();
  if (typeof resumeBGM === 'function') resumeBGM();

  if (typeof checkNextQueuedLevelUp === 'function') checkNextQueuedLevelUp();
};

/* --------------------------------------------------------------------------
   15. MEDICAL EVACUATIONS & INJURY BULLETINS
   -------------------------------------------------------------------------- */
function checkPostInjuryBoardroomDispatch() {
  setTimeout(() => {
    const titles = typeof getTitleHolders === 'function' ? getTitleHolders() : {};
    const injuries = typeof getInjuries === 'function' ? getInjuries() : [];
    const injuredChamps = [titles.whc, titles.ic, titles.hardcore, titles.tag1, titles.tag2].filter(Boolean);
    const hasInjuredChamp = injuredChamps.some(id => injuries.some(inj => inj.id === id && inj.severity === 'major'));

    if (hasInjuredChamp) {
      if (typeof checkEmergencyBoardroomBanner === 'function') checkEmergencyBoardroomBanner();
      if (typeof showUniverseBulletin === 'function') {
        showUniverseBulletin({
          icon: '⚖️',
          kicker: 'BOARDROOM CRISIS',
          title: 'TITLE IN JEOPARDY',
          body: 'A reigning champion has suffered critical trauma and is hospitalized. The Board of Directors must review the title status.',
          confirmBtn: 'CONVENE BOARD ➔',
          tab: 'titles'
        });
      }
    }
  }, 400);
}

window.triggerSlambulanceEvacuation = function(loser, isMajor) {
  if (typeof playSlambulanceAudio === 'function') playSlambulanceAudio();
  const modal = document.getElementById('slambulanceEvacModal');
  const card = document.getElementById('slambulanceVictimCard');
  const diag = document.getElementById('slambulanceDiagnosisText');

  if (card) {
    card.innerHTML = `
      <div class="vs-wrestler">
        <img src="${loser.image}" style="filter:grayscale(0.7) brightness(0.6); border-color:#ff0000; box-shadow:0 0 25px #ff0000;" onerror="handleImgError(this, '${loser.id}')">
        <div style="font-size:1.2rem; margin-top:8px;">${loser.name}</div>
      </div>
    `;
  }

  if (diag) {
    const duration = isMajor ? '5 MATCHES' : '1 MATCH';
    diag.innerHTML = `
      CLASSIFICATION: ${isMajor ? 'CRITICAL TRAUMA' : 'MINOR INJURY'}<br>
      OFFICIAL MEDICAL SHELF: HOSPITALIZED FOR ${duration}!
    `;
  }

  if (modal) modal.style.display = 'flex';
};

window.closeSlambulanceEvacModal = function() {
  setElDisplay('slambulanceEvacModal', 'none');
  if (window.activeShowSession) {
    if (window.activeShowSession.currentBoutIdx < window.activeShowSession.bouts.length) {
      setElDisplay('bookShowCardModal', 'flex');
      if (typeof renderBookShowCardModal === 'function') renderBookShowCardModal();
    } else {
      openEventHighlightsModal();
    }
  } else {
    if (typeof renderGrid === 'function') renderGrid();
    checkPostInjuryBoardroomDispatch();
  }
};

window.triggerUniversalInjuryBulletin = function(superstar, isMajor, customDetails = '') {
  const modal = document.getElementById('universalInjuryModal');
  const graphic = document.getElementById('universalInjuryGraphic');
  const card = document.getElementById('universalInjuryVictimCard');
  const details = document.getElementById('universalInjuryDetails');

  if (graphic && typeof INJURY_GRAPHIC_ASSETS !== 'undefined') {
    const randomAsset = INJURY_GRAPHIC_ASSETS[Math.floor(Math.random() * INJURY_GRAPHIC_ASSETS.length)];
    graphic.src = randomAsset;
  }

  if (card) {
    card.innerHTML = `
      <div class="vs-wrestler">
        <img src="${superstar.image}" style="filter:grayscale(0.8) brightness(0.5); border-color:#ff3333; box-shadow:0 0 25px #ff0000;" onerror="handleImgError(this, '${superstar.id}')">
        <div style="font-size:1.1rem; margin-top:6px;">${superstar.name}</div>
      </div>
    `;
  }

  if (details) {
    details.innerHTML = `
      ${customDetails ? customDetails + '<br>' : ''}
      DIAGNOSIS: ${isMajor ? 'CRITICAL TRAUMA (5 MATCHES INACTIVE)' : 'MINOR INJURY (1 MATCH INACTIVE)'}
    `;
  }

  if (modal) modal.style.display = 'flex';
};

window.closeUniversalInjuryModal = function() {
  setElDisplay('universalInjuryModal', 'none');
  if (window.activeShowSession) {
    if (window.activeShowSession.currentBoutIdx < window.activeShowSession.bouts.length) {
      setElDisplay('bookShowCardModal', 'flex');
      if (typeof renderBookShowCardModal === 'function') renderBookShowCardModal();
    } else {
      openEventHighlightsModal();
    }
  } else {
    if (typeof renderGrid === 'function') renderGrid();
    checkPostInjuryBoardroomDispatch();
  }
};

/* --------------------------------------------------------------------------
   16. CUSTOM SUPERSTAR SIGNINGS & APPLICATION BOOTSTRAP
   -------------------------------------------------------------------------- */
const formEl = document.getElementById('wrestlerForm');
if (formEl) {
  formEl.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('wrestlerName').value;
    const url = document.getElementById('youtubeUrl').value;
    const promoUrl = document.getElementById('promoUrlInput').value;
    const fileInput = document.getElementById('wrestlerImage');
    const file = fileInput ? fileInput.files[0] : null;

    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        const newWrestler = {
          id: 'wrestler-' + Date.now(),
          name: name,
          image: evt.target.result,
          youtubeUrl: url,
          promoUrl: promoUrl,
          isDefault: false,
          unlockLevel: 1,
          heelTendency: (document.getElementById('heelTendencyInput') || {}).value || 'neutral' // BATCH 13
        };

        if (typeof saveCustomWrestler === 'function') {
          saveCustomWrestler(newWrestler);
        } else {
          ensureWrestlerInRoster(newWrestler.id);
        }

        if (typeof closeModal === 'function') closeModal();
        formEl.reset();

        if (typeof executeSuperstarBlackoutDebut === 'function') {
          executeSuperstarBlackoutDebut({ level: 1, unlockName: newWrestler.name, unlockType: 'wrestler', fromCode: true }, newWrestler);
        } else {
          if (typeof renderGrid === 'function') renderGrid();
          if (typeof renderRoster === 'function') renderRoster();
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

function initEwfApp() {
  if (typeof initBGM === 'function') initBGM();
  if (typeof updateGMHeaderWidget === 'function') updateGMHeaderWidget();
  if (typeof renderGrid === 'function') renderGrid();
  try {
    const sirenPreload = new Audio('cashin_siren.mp3');
    sirenPreload.preload = 'auto';
  } catch (e) {}
  try {
    const preloadImages = [
      ...(typeof matchTypeLogos !== 'undefined' ? Object.values(matchTypeLogos) : []),
      ...(typeof formatLogos !== 'undefined' ? formatLogos : []),
      'ambulance.png', 'whc.png', 'ic_title.png', 'hardcore.png', 'tag_title.png', 'mitb_briefcase.png',
      'kotr_crown.png', 'kotr_crown_roster.png', 'kotr_logo.png', 'kotr_bg.png', 'rumble_bg.png', 'mitb_bg.png', 'show_bg.png',
      'survivor_logo.png', 'brethart.png', 'corbin.png', 'ellis_avatar.png', 'commentary_desk_bg.png',
      'mankind_pose.png', 'stonecold_pose.png', 'tripleh_pose.png', 'therock_pose.png', 'theundertaker_pose.png', 'romanreigns_pose.png', 'kane_pose.png',
      'cmpunk.png', 'cmpunk_pose.png',
      'contract_bg.png', 'contract_table.png', 'table_broken.png', 'hof_bg.png', 'hof_plaque.png', 'hof_crest.png',
      'trophy_1.png', 'trophy_2.png', 'trophy_3.png', 'trophy_4.png', 'trophy_5.png', 'trophy_6.png', 'trophy_7.png', 'trophy_8.png',
      'career_contract_bg.png', 'career_contract_table.png', 'stamp_terminated.png',
      'media_scrum_bg.png', 'media_scrum_table.png', 'stamp_shattered.png',
      'boardroom_decree_bg.png', 'title_pedestal.png', 'stamp_vacated.png',
      'raw_highlights_bg.png', 'smackdown_highlights_bg.png', 'summerslam_highlights_bg.png', 
      'survivor_highlights_bg.png', 'kotr_highlights_bg.png', 'mitb_highlights_bg.png', 
      'backlash_highlights_bg.png', 'mania_highlights_bg.png', 'rumble_highlights_bg.png'
    ];
    preloadImages.forEach(fileName => { const img = new Image(); img.src = fileName; });
  } catch (e) {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEwfApp);
} else {
  initEwfApp();
}