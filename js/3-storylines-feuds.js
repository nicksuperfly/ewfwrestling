/* ==========================================================================
   ELLIS'S MAIN EVENT (EWF UNIVERSE) - MODULAR ENGINE
   MODULE 3 OF 5: js/3-storylines-feuds.js (PART 1 OF 2)
   Injuries, Exiled Roster, Feuds & Alliances, Cinematic Cutscenes (Sections 1-6)
   ========================================================================== */

window.activeStagedFeud = window.activeStagedFeud || null;

// --- BATCH 5 ITEM 10 HELPER: FEDERATION FALLOUT LOGGER ---
function logShowFalloutEvent(type, text) {
  try {
    if (window.activeShowSession && Array.isArray(window.activeShowSession.showFalloutLog)) {
      const cleanText = String(text || '').trim();
      if (!cleanText) return;
      const alreadyLogged = window.activeShowSession.showFalloutLog.some(entry => entry && entry.text === cleanText);
      if (!alreadyLogged) {
        window.activeShowSession.showFalloutLog.push({ type: type || 'cutscene', text: cleanText });
      }
    }
  } catch (e) {}
}
window.logShowFalloutEvent = logShowFalloutEvent;

/* --------------------------------------------------------------------------
   1. INJURIES, EXILED ROSTER & HOSPITAL WARD SUBSYSTEM
   -------------------------------------------------------------------------- */
function getInjuries() {
  try {
    const stored = localStorage.getItem('ewf_injuries');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

function saveInjuries(list) {
  try {
    localStorage.setItem('ewf_injuries', JSON.stringify(list));
  } catch (e) {}
}

function getInjuryRecord(wrestlerId) {
  const injuries = getInjuries();
  return injuries.find(i => i.id === wrestlerId) || null;
}

function replaceInjuredWrestlerInActiveShow(injuredId) {
  if (!window.activeShowSession || !Array.isArray(window.activeShowSession.bouts)) return [];
  const injuredW = getWrestlerById(injuredId);
  if (!injuredW) return [];

  const allUnlocked = getUnlockedWrestlers().filter(w => !getInjuryRecord(w.id) && w.id !== injuredId);
  if (allUnlocked.length === 0) return [];

  let replacementsMade = [];

  window.activeShowSession.bouts.forEach((bout, bIdx) => {
    if (bIdx > window.activeShowSession.currentBoutIdx && Array.isArray(bout.participants)) {
      const pIdx = bout.participants.findIndex(p => p && p.id === injuredId);
      if (pIdx >= 0) {
        const availableForBout = allUnlocked.filter(w => !bout.participants.some(p => p && p.id === w.id));
        const sub = availableForBout.length > 0 
          ? availableForBout[Math.floor(Math.random() * availableForBout.length)]
          : allUnlocked[Math.floor(Math.random() * allUnlocked.length)];

        bout.participants[pIdx] = sub;

        if (bout.isTitleMatch && bout.titleCode) {
          const titles = getTitleHolders();
          if (titles[bout.titleCode] === injuredId) {
            bout.isTitleMatch = false;
            bout.feudStake = `⚠️ TITLE VACATED (SUBSTITUTE: ${sub.name.toUpperCase()})`;
          }
        }

        replacementsMade.push({ boutIndex: bIdx, order: bout.order, sub: sub, original: injuredW });

        logShowFalloutEvent(
          'injury',
          `🚨 EMERGENCY MEDICAL SUB: ${sub.name.toUpperCase()} replaced hospitalized ${injuredW.name.toUpperCase()} in ${bout.order}!`
        );
      }
    }
  });

  if (replacementsMade.length > 0 && typeof renderBookShowCardModal === 'function') {
    renderBookShowCardModal();
  }
  return replacementsMade;
}

function inflictInjury(wrestlerId, forcedSeverity = null) {
  const gmLevel = typeof getGMLevel === 'function' ? getGMLevel() : 1;
  if (gmLevel < 3) return null;

  let severity = 'minor';
  let matchesRemaining = 1;

  if (forcedSeverity === 'major' || forcedSeverity === true) {
    severity = 'major';
    matchesRemaining = 5;
  } else if (forcedSeverity === 'minor' || forcedSeverity === false) {
    severity = 'minor';
    matchesRemaining = 1;
  } else {
    const isMinor = Math.random() < 0.75;
    severity = isMinor ? 'minor' : 'major';
    matchesRemaining = isMinor ? 1 : 5;
  }

  let injuries = getInjuries().filter(i => i.id !== wrestlerId);
  injuries.push({ id: wrestlerId, remaining: matchesRemaining, severity: severity });
  saveInjuries(injuries);
  if (typeof renderGrid === 'function') renderGrid();
  renderUniverseInjuriesTab();

  if (window.activeShowSession) {
    replaceInjuredWrestlerInActiveShow(wrestlerId);
  }

  return { severity, matchesRemaining };
}

// Slambulance 50/50 Severity Coin Flip
function processSlambulanceCasualty(wrestlerId) {
  const isMajor = Math.random() < 0.50;
  return inflictInjury(wrestlerId, isMajor ? 'major' : 'minor');
}

function clearInjury(wrestlerId) {
  const target = getInjuries().find(i => i.id === wrestlerId);
  if (target && target.severity === 'major') {
    localStorage.setItem('ewf_pending_return_ambush', wrestlerId);
  }
  let injuries = getInjuries().filter(i => i.id !== wrestlerId);
  saveInjuries(injuries);
  if (typeof renderGrid === 'function') renderGrid();
  renderUniverseInjuriesTab();
}

function tickDownInjuriesAfterMatch() {
  let injuries = getInjuries();
  if (injuries.length === 0) return;

  let updated = [];
  const allWrestlers = getUnlockedWrestlers();

  injuries.forEach(inj => {
    if (!activeBookedMatch.participants.some(c => c.id === inj.id)) {
      inj.remaining -= 1;
    }

    if (inj.severity === 'major' && inj.remaining === 2) {
      localStorage.setItem('ewf_pending_return_ambush', inj.id);
    }

    if (inj.remaining <= 0) {
      const w = allWrestlers.find(item => item.id === inj.id);
      const name = w ? w.name.toUpperCase() : "A SUPERSTAR";
      if (typeof saveHistoryLog === 'function') {
        saveHistoryLog(`🏥 MEDICAL CLEARANCE: ${name} is medically cleared to return to the ring!`, 'medical');
      }
    } else {
      updated.push(inj);
    }
  });

  saveInjuries(updated);
  if (typeof renderGrid === 'function') renderGrid();
  renderUniverseInjuriesTab();
}

// --- BATCH 6 ITEM 5: EXILED SUPERSTARS LIGHTS-OUT COMEBACK & TOP-LAYER VIDEO MOUNT ---
function getBanishedWrestlerIds() {
  try {
    const raw = JSON.parse(localStorage.getItem('ewf_vault_banished') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    return [];
  }
}

window.cleanupReinstatementOverlays = function() {
  const banner = document.getElementById('reinstatementNewsBanner');
  const skipBtn = document.getElementById('reinstatementSkipIntroBtn');
  if (banner) banner.style.display = 'none';
  if (skipBtn) skipBtn.style.display = 'none';
  if (window._activeReinstatementFsSync) {
    document.removeEventListener('fullscreenchange', window._activeReinstatementFsSync);
    document.removeEventListener('webkitfullscreenchange', window._activeReinstatementFsSync);
    window._activeReinstatementFsSync = null;
  }
  if (window._activeReinstatementYtListener) {
    window.removeEventListener('message', window._activeReinstatementYtListener);
    window._activeReinstatementYtListener = null;
  }
  if (window._activeReinstatementTimer) {
    clearTimeout(window._activeReinstatementTimer);
    window._activeReinstatementTimer = null;
  }
};

window.reinstateBanishedWrestler = function(wrestlerId) {
  if (!wrestlerId) return;

  let banished = getBanishedWrestlerIds().filter(id => id !== wrestlerId);
  localStorage.setItem('ewf_vault_banished', JSON.stringify(banished));

  if (typeof ensureWrestlerInRoster === 'function') {
    ensureWrestlerInRoster(wrestlerId);
  }

  const wrestler = getWrestlerById(wrestlerId);
  if (!wrestler) {
    renderUniverseInjuriesTab();
    if (typeof renderGrid === 'function') renderGrid();
    return;
  }

  const msgText = `🚨 BREAKING NEWS: ${wrestler.name.toUpperCase()} HAS BEEN REINSTATED BY GM ELLIS AND IS BACK IN EWF! 🚨`;

  if (typeof saveHistoryLog === 'function') {
    saveHistoryLog(`✍️ EXECUTIVE PARDON: ${wrestler.name.toUpperCase()} was reinstated by GM Ellis and returned to EWF!`, 'match', wrestler.id);
  }
  logShowFalloutEvent('return', msgText);

  closeUniverseModal();
  if (typeof renderUniverseInjuriesTab === 'function') renderUniverseInjuriesTab();
  if (typeof renderGrid === 'function') renderGrid();

  if (typeof stopBGMForAction === 'function') stopBGMForAction();
  if (typeof stopMatchCrowd === 'function') stopMatchCrowd();
  if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd(false);

  // 1. Lights-Out Blackout & 7-Pulse Strobe Sequence
  if (typeof playLightsOutAudio === 'function') {
    playLightsOutAudio();
  }

  let blackout = document.getElementById('lightsOutOverlay');
  if (!blackout) {
    blackout = document.createElement('div');
    blackout.id = 'lightsOutOverlay';
    blackout.className = 'lights-out-overlay';
    document.body.appendChild(blackout);
  }

  const initialHost = document.fullscreenElement || document.webkitFullscreenElement || document.body;
  if (blackout.parentElement !== initialHost) initialHost.appendChild(blackout);

  blackout.style.setProperty('position', 'fixed', 'important');
  blackout.style.setProperty('inset', '0', 'important');
  blackout.style.setProperty('width', '100vw', 'important');
  blackout.style.setProperty('height', '100vh', 'important');
  blackout.style.setProperty('background-color', '#000000', 'important');
  blackout.style.setProperty('z-index', '2147483647', 'important');
  blackout.style.setProperty('display', 'block', 'important');

  setTimeout(() => {
    let pulses = 0;
    const strobeInt = setInterval(() => {
      pulses++;
      blackout.style.setProperty('background-color', (pulses % 2 === 1) ? '#ffffff' : '#000000', 'important');

      if (typeof playPyroBlast === 'function') {
        playPyroBlast();
      } else if (typeof playSynthesizedFlash === 'function') {
        playSynthesizedFlash();
      }

      if (pulses >= 7) {
        clearInterval(strobeInt);
        blackout.style.setProperty('display', 'none', 'important');

        if (typeof triggerCameraFlash === 'function') triggerCameraFlash();
        if (typeof playSubBassBoom === 'function') playSubBassBoom();
        if (typeof playOhMyGodSting === 'function') playOhMyGodSting();

        window.cleanupReinstatementOverlays();

        const finishReinstatementIntro = () => {
          window.cleanupReinstatementOverlays();
          if (typeof stopCurrentVideo === 'function') stopCurrentVideo();
          if (typeof closeVideoModal === 'function') closeVideoModal();
          if (typeof renderGrid === 'function') renderGrid();
          if (typeof resumeBGM === 'function') resumeBGM();
        };

        // 2. Launch entrance video FIRST so #videoModal opens & enters fullscreen
        currentPlayingWrestler = wrestler;
        window.isCommentatorVideoActive = false;

        if (typeof loadAndPlayYouTube === 'function' && wrestler.youtubeUrl) {
          loadAndPlayYouTube(wrestler.youtubeUrl, false, false, false, false);
          if (typeof triggerNameplate === 'function') {
            setTimeout(() => {
              triggerNameplate(`${wrestler.name.toUpperCase()} // REINSTATED TO EWF`);
            }, 600);
          }
          window._activeReinstatementTimer = setTimeout(finishReinstatementIntro, 35000);
        } else {
          window._activeReinstatementTimer = setTimeout(finishReinstatementIntro, 5000);
        }

        // 3. Mount banner & skip button INSIDE #videoModal / active fullscreen layer so they stay on top
        const getActiveVideoHost = () => {
          return document.fullscreenElement ||
                 document.webkitFullscreenElement ||
                 document.getElementById('videoModal') ||
                 document.body;
        };

        const activeHost = getActiveVideoHost();

        let banner = document.getElementById('reinstatementNewsBanner');
        if (!banner) {
          banner = document.createElement('div');
          banner.id = 'reinstatementNewsBanner';
        }
        if (banner.parentElement !== activeHost) activeHost.appendChild(banner);

        const commIcon = (typeof getRandomCommentatorOverlayIcon === 'function')
          ? getRandomCommentatorOverlayIcon()
          : '';

        banner.innerHTML = `
          ${commIcon}
          <span style="flex:1; text-align:center;">${msgText}</span>
        `;
        banner.style.cssText = `
          position: fixed !important;
          top: 24px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: min(92vw, 960px) !important;
          background: linear-gradient(180deg, #d32f2f 0%, #6b0000 100%) !important;
          border: 2px solid #ffd700 !important;
          border-radius: 8px !important;
          padding: 12px 18px !important;
          color: #ffffff !important;
          font-family: 'Russo One', sans-serif !important;
          font-size: clamp(0.95rem, 1.8vw, 1.35rem) !important;
          letter-spacing: 1px !important;
          box-shadow: 0 0 40px rgba(255, 0, 0, 0.85), 0 0 20px rgba(255, 215, 0, 0.5) !important;
          z-index: 2147483647 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 14px !important;
          text-shadow: 0 2px 6px #000 !important;
          pointer-events: none !important;
        `;

        let skipBtn = document.getElementById('reinstatementSkipIntroBtn');
        if (!skipBtn) {
          skipBtn = document.createElement('button');
          skipBtn.id = 'reinstatementSkipIntroBtn';
          skipBtn.innerText = '⏩ SKIP INTRO';
        }
        if (skipBtn.parentElement !== activeHost) activeHost.appendChild(skipBtn);

        skipBtn.style.cssText = `
          position: fixed !important;
          bottom: 30px !important;
          right: 30px !important;
          top: auto !important;
          left: auto !important;
          z-index: 2147483647 !important;
          background: rgba(229, 9, 20, 0.94) !important;
          border: 2px solid #ffffff !important;
          color: #ffffff !important;
          font-family: 'Russo One', sans-serif !important;
          font-size: 0.95rem !important;
          padding: 10px 22px !important;
          cursor: pointer !important;
          border-radius: 4px !important;
          letter-spacing: 1px !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.85) !important;
          text-transform: uppercase !important;
          display: block !important;
          pointer-events: auto !important;
        `;
        skipBtn.onclick = finishReinstatementIntro;

        // Re-sync parent if browser fullscreen transitions asynchronously after mount
        const syncFullscreenHost = () => {
          const newHost = getActiveVideoHost();
          if (banner && banner.style.display !== 'none' && banner.parentElement !== newHost) {
            newHost.appendChild(banner);
          }
          if (skipBtn && skipBtn.style.display !== 'none' && skipBtn.parentElement !== newHost) {
            newHost.appendChild(skipBtn);
          }
        };
        window._activeReinstatementFsSync = syncFullscreenHost;
        document.addEventListener('fullscreenchange', syncFullscreenHost);
        document.addEventListener('webkitfullscreenchange', syncFullscreenHost);
        setTimeout(syncFullscreenHost, 150);

        const ytEndListener = (e) => {
          try {
            const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
            if (data && data.event === 'onStateChange' && data.info === 0) {
              finishReinstatementIntro();
            }
          } catch (_) {}
        };
        window._activeReinstatementYtListener = ytEndListener;
        window.addEventListener('message', ytEndListener);
      }
    }, 120);
  }, 1500);
};

/* --------------------------------------------------------------------------
   2. ROSTER VAULT, ALLIANCES, KOTR & TITLEHOLDERS STORAGE
   -------------------------------------------------------------------------- */
function getTitleHolders() {
  try {
    const stored = localStorage.getItem('championship_holders');
    return stored ? JSON.parse(stored) : { whc: null, ic: null, hardcore: null, tag1: null, tag2: null };
  } catch (e) {
    return { whc: null, ic: null, hardcore: null, tag1: null, tag2: null };
  }
}

function setTitleHolders(holdersObj) {
  try {
    localStorage.setItem('championship_holders', JSON.stringify(holdersObj));
  } catch (e) {}
}

function getAlliances() {
  try {
    const stored = localStorage.getItem('custom_alliances');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

function saveAlliance(a1, a2, name, color) {
  try {
    let alliances = getAlliances();
    const existingIdx = alliances.findIndex(a => (a.p1 === a1 && a.p2 === a2) || (a.p1 === a2 && a.p2 === a1));
    if (existingIdx >= 0) {
      alliances[existingIdx] = { p1: a1, p2: a2, name: name, color: color };
    } else {
      alliances.push({ p1: a1, p2: a2, name: name, color: color });
    }
    localStorage.setItem('custom_alliances', JSON.stringify(alliances));

    const w1 = getWrestlerById(a1);
    const w2 = getWrestlerById(a2);
    if (w1 && w2) {
      const teamLabel = (name && name.trim()) ? name.trim().toUpperCase() : `${w1.name.toUpperCase()} & ${w2.name.toUpperCase()}`;
      logShowFalloutEvent('alliance', `🤝 ALLIANCE FORMED: ${w1.name.toUpperCase()} & ${w2.name.toUpperCase()} united as ${teamLabel}!`);
    }
  } catch (e) {}
}

function disbandAlliance(p1Id, p2Id) {
  let alliances = getAlliances();
  if (p1Id && p2Id) {
    const hadAlliance = alliances.some(a => (a.p1 === p1Id && a.p2 === p2Id) || (a.p1 === p2Id && a.p2 === p1Id));
    alliances = alliances.filter(a => !((a.p1 === p1Id && a.p2 === p2Id) || (a.p1 === p2Id && a.p2 === p1Id)));
    localStorage.setItem('custom_alliances', JSON.stringify(alliances));

    if (hadAlliance) {
      const w1 = getWrestlerById(p1Id);
      const w2 = getWrestlerById(p2Id);
      if (w1 && w2) {
        logShowFalloutEvent('breakup', `💔 ALLIANCE SHATTERED: ${w1.name.toUpperCase()} & ${w2.name.toUpperCase()} disbanded!`);
      }
    }
  } else {
    localStorage.removeItem('custom_alliances');
  }
  if (typeof renderGrid === 'function') renderGrid();
}

function areInSameAlliance(id1, id2) {
  const alliances = getAlliances();
  return alliances.some(a => (a.p1 === id1 && a.p2 === id2) || (a.p1 === id2 && a.p2 === id1));
}

function getMitbHolder() {
  try {
    const stored = localStorage.getItem('mitb_holder');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
}

function setMitbHolder(wrestler) {
  try {
    if (wrestler) localStorage.setItem('mitb_holder', JSON.stringify(wrestler));
    else localStorage.removeItem('mitb_holder');
  } catch (e) {}
}

function getKotrHolder() {
  try {
    return localStorage.getItem('kotr_holder') || localStorage.getItem('ewf_kotr_winner_id') || null;
  } catch (e) {
    return null;
  }
}

function setKotrHolder(id) {
  try {
    if (id) {
      localStorage.setItem('kotr_holder', id);
      localStorage.setItem('ewf_kotr_winner_id', id);
    } else {
      localStorage.removeItem('kotr_holder');
      localStorage.removeItem('ewf_kotr_winner_id');
    }
  } catch (e) {}
}

function getStoredWrestlers() {
  try {
    const stored = localStorage.getItem('custom_wrestlers');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

function saveCustomWrestler(wrestler) {
  try {
    const current = getStoredWrestlers();
    current.push(wrestler);
    localStorage.setItem('custom_wrestlers', JSON.stringify(current));
  } catch (e) {}
}

function deleteWrestler(id) {
  try {
    let current = getStoredWrestlers();
    current = current.filter(w => w.id !== id);
    localStorage.setItem('custom_wrestlers', JSON.stringify(current));
  } catch (e) {}
  if (typeof renderGrid === 'function') renderGrid();
}

function getUnlockedWrestlers() {
  const currentLvl = typeof getGMLevel === 'function' ? getGMLevel() : 1;
  const custom = getStoredWrestlers();
  const unlockedVaultIds = typeof getUnlockedVaultIds === 'function' ? getUnlockedVaultIds() : [];
  const banishedIds = JSON.parse(localStorage.getItem('ewf_vault_banished') || '[]');

  const defaults = typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : [];
  const activeDefaults = defaults.filter(w => {
    if (banishedIds.includes(w.id)) return false;
    if (w.id === 'default-romanreigns' || w.id === 'vault-romanreigns') {
      return unlockedVaultIds.includes('vault-romanreigns');
    }
    if (w.id === 'default-theundertaker' && currentLvl < 6) return false;
    if (w.id === 'default-kane' && currentLvl < 10) return false;
    return !w.unlockLevel || w.unlockLevel <= currentLvl;
  });

  const activeVaultStars = [];
  if (typeof SECRET_TALENT_VAULT !== 'undefined') {
    SECRET_TALENT_VAULT.forEach(v => {
      if (unlockedVaultIds.includes(v.id) && !banishedIds.includes(v.id)) {
        if (!activeDefaults.some(d => d.id === v.id) && !custom.some(c => c.id === v.id)) {
          activeVaultStars.push(v);
        }
      }
    });
  }

  const activeCustom = custom.filter(c => !banishedIds.includes(c.id));
  return [...activeDefaults, ...activeVaultStars, ...activeCustom];
}

function getWrestlerById(id) {
  const allVault = typeof SECRET_TALENT_VAULT !== 'undefined' ? SECRET_TALENT_VAULT : [];
  const defaults = typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : [];
  const all = [...defaults, ...allVault, ...getStoredWrestlers()];
  return all.find(w => w.id === id) || null;
}

function getWrestlerPosePath(w) {
  if (!w) return 'logo_notext.png';
  if (w.poseImage) return w.poseImage;
  const cleanId = (w.id || '').replace('default-', '');
  return `${cleanId}_pose.png`;
}

/* --------------------------------------------------------------------------
   3. RIVALRIES, MANDATORY LOCKS & RESET UNIVERSE
   -------------------------------------------------------------------------- */
function getRivalries() {
  try {
    const stored = localStorage.getItem('ewf_rivalries');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

function saveRivalries(list) {
  try {
    localStorage.setItem('ewf_rivalries', JSON.stringify(list));
  } catch (e) {}
}

function addOrUpdateRivalry(w1Id, w2Id, origin, heat = 1) {
  if (areInSameAlliance(w1Id, w2Id)) return;

  let rivalries = getRivalries();
  const existingIdx = rivalries.findIndex(r => r && ((r.w1 === w1Id && r.w2 === w2Id) || (r.w2 === w1Id && r.w1 === w2Id)));
  let reachedTier3 = false;
  let targetFeud = null;

  if (existingIdx >= 0) {
    const oldHeat = rivalries[existingIdx].heat || 1;
    rivalries[existingIdx].heat = Math.min(3, oldHeat + 1);
    if (rivalries[existingIdx].heat === 3 && oldHeat < 3) {
      reachedTier3 = true;
      targetFeud = rivalries[existingIdx];
    }
  } else {
    if (rivalries.length >= 3) { rivalries.shift(); }
    const newRiv = { id: 'riv-' + Date.now(), w1: w1Id, w2: w2Id, origin: origin, heat: heat };
    rivalries.push(newRiv);
    if (heat === 3) {
      reachedTier3 = true;
      targetFeud = newRiv;
    }
  }

  saveRivalries(rivalries);
  if (typeof unlockAchievement === 'function') unlockAchievement('sparks_flying');
  if (typeof renderGrid === 'function') renderGrid();

  if (reachedTier3 && targetFeud) {
    checkBloodFeudActivation(targetFeud);
  }
}

function removeRivalry(rivId) {
  let rivalries = getRivalries().filter(r => r && r.id !== rivId);
  saveRivalries(rivalries);
  renderFeudsListUI();
  if (typeof renderGrid === 'function') renderGrid();
}

function getMandatoryLocks() {
  return { 
    kotrIc: localStorage.getItem('kotr_ic_mandatory'), 
    rumbleWhc: localStorage.getItem('rumble_whc_mandatory') 
  };
}

function clearMandatoryLock(type) {
  if (type === 'ic') localStorage.removeItem('kotr_ic_mandatory');
  if (type === 'whc') localStorage.removeItem('rumble_whc_mandatory');
  if (typeof renderGrid === 'function') renderGrid();
}

// BATCH 6 ITEM 2: #1 CONTENDER TITLE SHOT LOCKS (8-LOSS STREAK REDEMPTION)
function getContenderTitleShotLocks() {
  try {
    const raw = JSON.parse(localStorage.getItem('ewf_contender_title_locks') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    return [];
  }
}

function grantContenderTitleShotLock(wrestlerId) {
  if (!wrestlerId) return;
  try {
    const locks = getContenderTitleShotLocks();
    if (!locks.includes(wrestlerId)) {
      locks.push(wrestlerId);
      localStorage.setItem('ewf_contender_title_locks', JSON.stringify(locks));
    }
  } catch (e) {}
}

function clearContenderTitleShotLock(wrestlerId) {
  if (!wrestlerId) return;
  try {
    const locks = getContenderTitleShotLocks().filter(id => id !== wrestlerId);
    localStorage.setItem('ewf_contender_title_locks', JSON.stringify(locks));
    if (typeof renderGrid === 'function') renderGrid();
  } catch (e) {}
}

function promptResetUniverse() {
  const confirmFirst = confirm("⚠️ RESET EWF UNIVERSE?\n\nClear all titles, defenses, alliances, feuds, injuries, tournament locks, show archives, AND reset Ellis's Career back to Level 1?");
  if (!confirmFirst) return;
  try {
    const keysToRemove = [
      'championship_holders', 'championship_defenses', 'custom_alliances', 'ewf_rivalries',
      'mitb_holder', 'kotr_holder', 'ewf_kotr_winner_id', 'ewf_injuries', 'ewf_pending_return_ambush',
      'kotr_ic_mandatory', 'rumble_whc_mandatory', 'main_event_history', 'ewf_show_history', 'ewf_milestones',
      'ewf_hof_inductees', 'ewf_gm_profile', 'ewf_unlocked_vault_ids', 'ewf_vault_banished',
      'ewf_ice_overrides', 'ewf_promo_plays', 'ewf_last_career_contract_match',
      'ewf_last_media_scrum_match', 'ewf_last_decree_match', 'ewf_uncrowned_king', 'ewf_acknowledged_levels',
      'ewf_last_summit_match', 'ewf_tag_loss_streaks', 'ewf_scheduled_story_match',
      'ewf_contender_title_locks', 'ewf_eight_loss_redemption_seen'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));

    if (typeof saveShowHistory === 'function') saveShowHistory([]);
    if (typeof renderBookShowAccordionArchives === 'function') renderBookShowAccordionArchives();
    if (typeof renderShowArchives === 'function') renderShowArchives();

    alert("✅ EWF Universe, Show Archives, and Ellis's Career have been completely reset to Level 1!");
    closeUniverseModal();
    if (typeof updateGMHeaderWidget === 'function') updateGMHeaderWidget();
    if (typeof renderGrid === 'function') renderGrid();
  } catch (e) {
    alert("Error resetting universe: " + e.message);
  }
}

/* --------------------------------------------------------------------------
   4. MOMENTUM ENGINE, PROMO TRACKING & LIFETIME H2H
   -------------------------------------------------------------------------- */
function getWrestlerMomentum(wrestlerId) {
  const history = typeof getHistory === 'function' ? getHistory() : (JSON.parse(localStorage.getItem('main_event_history') || '[]'));
  const allW = getUnlockedWrestlers();
  const wrestler = allW.find(w => w.id === wrestlerId);
  
  const frozenIds = JSON.parse(localStorage.getItem('ewf_ice_overrides') || '[]');
  if (frozenIds.includes(wrestlerId)) {
    return { status: 'ice', wins: 0, total: 0, streak: 0 };
  }

  if (!wrestler) return { status: 'neutral', wins: 0, total: 0, streak: 0 };

  const wNameUpper = wrestler.name.toUpperCase();
  const completedBouts = [];

  for (const h of history) {
    if (!h || !h.text) continue;
    const textUpper = h.text.toUpperCase();
    const isTrueDecision = textUpper.includes(' DEF. ') || 
                           (h.winnerId && (textUpper.includes('DEF.') || textUpper.includes('VICTORY') || textUpper.includes('WON') || textUpper.includes('WINNER')));

    if (isTrueDecision && (textUpper.includes(wNameUpper) || h.winnerId === wrestlerId)) {
      const isWin = (h.winnerId === wrestlerId);
      completedBouts.push(isWin);
      if (completedBouts.length === 5) break;
    }
  }

  const total = completedBouts.length;
  const wins = completedBouts.filter(Boolean).length;

  let streak = 0;
  for (let b of completedBouts) {
    if (b) streak++;
    else break;
  }

  if (streak >= 3) return { status: 'fire', wins, total, streak };
  if (total >= 4 && wins >= 4) return { status: 'fire', wins, total, streak };

  if (completedBouts.length >= 2 && !completedBouts[0] && !completedBouts[1]) {
    return { status: 'ice', wins, total, streak: 0 };
  }
  if (total >= 3 && wins <= 1) return { status: 'ice', wins, total, streak: 0 };

  return { status: 'neutral', wins, total, streak };
}

function getSuperstarConsecutiveLosses(wrestlerId) {
  const history = typeof getHistory === 'function' ? getHistory() : (JSON.parse(localStorage.getItem('main_event_history') || '[]'));
  const wrestler = getWrestlerById(wrestlerId);
  if (!wrestler) return 0;

  const wNameUpper = wrestler.name.toUpperCase();
  let lossStreak = 0;

  for (const h of history) {
    if (!h || !h.text) continue;
    const textUpper = h.text.toUpperCase();
    const isTrueDecision = textUpper.includes(' DEF. ') ||
                           (h.winnerId && (textUpper.includes('DEF.') || textUpper.includes('VICTORY') || textUpper.includes('WON') || textUpper.includes('WINNER')));

    if (isTrueDecision && (textUpper.includes(wNameUpper) || h.winnerId === wrestlerId)) {
      const isWin = (h.winnerId === wrestlerId);
      if (isWin) break;
      lossStreak++;
    }
  }
  return lossStreak;
}

function forceIceMomentum(wrestlerId) {
  try {
    const frozenIds = JSON.parse(localStorage.getItem('ewf_ice_overrides') || '[]');
    if (!frozenIds.includes(wrestlerId)) {
      frozenIds.push(wrestlerId);
      localStorage.setItem('ewf_ice_overrides', JSON.stringify(frozenIds));
    }
  } catch (e) {}
}

function clearIceMomentumOverrides(wrestlerId = null) {
  try {
    if (wrestlerId) {
      let frozenIds = JSON.parse(localStorage.getItem('ewf_ice_overrides') || '[]');
      frozenIds = frozenIds.filter(id => id !== wrestlerId);
      localStorage.setItem('ewf_ice_overrides', JSON.stringify(frozenIds));
    } else {
      localStorage.removeItem('ewf_ice_overrides');
    }
  } catch (e) {}
}

function calculateMomentum(wrestlerId) {
  const data = getWrestlerMomentum(wrestlerId);
  if (data.status === 'fire') return 5;
  if (data.status === 'ice') return 0;
  return 2;
}

function getHeadToHeadRecord(idA, idB) {
  const history = typeof getHistory === 'function' ? getHistory() : JSON.parse(localStorage.getItem('main_event_history') || '[]');
  const wA = getWrestlerById(idA);
  const wB = getWrestlerById(idB);
  const nameA = wA ? wA.name.toUpperCase() : '';
  const nameB = wB ? wB.name.toUpperCase() : '';
  let matchesCount = 0;
  let winsA = 0;
  let winsB = 0;

  history.forEach(h => {
    if (!h || !h.text) return;
    const t = h.text.toUpperCase();
    const hasBoth = (nameA && nameB && t.includes(nameA) && t.includes(nameB)) ||
                    (h.winnerId === idA && nameB && t.includes(nameB)) ||
                    (h.winnerId === idB && nameA && t.includes(nameA));
    if (hasBoth) {
      matchesCount++;
      if (h.winnerId === idA) winsA++;
      else if (h.winnerId === idB) winsB++;
      else if (t.includes(`${nameA} DEF.`) || t.includes(`${nameA} WON`)) winsA++;
      else if (t.includes(`${nameB} DEF.`) || t.includes(`${nameB} WON`)) winsB++;
    }
  });

  return { count: matchesCount, winsA, winsB };
}

function getTopContenderId() {
  const titles = getTitleHolders();
  const champs = [titles.whc, titles.ic, titles.hardcore, titles.tag1, titles.tag2];
  const allW = getUnlockedWrestlers().filter(w => !getInjuryRecord(w.id) && !champs.includes(w.id));

  // Prioritize active #1 Contender Title Shot Lock holders first
  const activeLocks = getContenderTitleShotLocks();
  const lockedContender = allW.find(w => activeLocks.includes(w.id));
  if (lockedContender) return lockedContender.id;

  let topId = null;
  let maxStreak = -1;
  allW.forEach(w => {
    const data = getWrestlerMomentum(w.id);
    if (data.status === 'fire' && data.streak >= 3 && data.streak > maxStreak) {
      maxStreak = data.streak;
      topId = w.id;
    }
  });
  return topId;
}

function isHofInductee(wrestlerId) {
  try {
    const inducted = JSON.parse(localStorage.getItem('ewf_hof_inductees')) || [];
    return inducted.includes(wrestlerId);
  } catch (e) {
    return false;
  }
}

function logPromoPlay(wrestlerId) {
  try {
    let promos = JSON.parse(localStorage.getItem('ewf_promo_plays')) || {};
    promos[wrestlerId] = (promos[wrestlerId] || 0) + 1;
    localStorage.setItem('ewf_promo_plays', JSON.stringify(promos));
    if (promos[wrestlerId] >= 30) {
      let m = JSON.parse(localStorage.getItem('ewf_milestones')) || {};
      if (!m.fan_favourite) {
        m.fan_favourite = { unlocked: true, firstWrestler: wrestlerId };
        localStorage.setItem('ewf_milestones', JSON.stringify(m));
      }
    }
  } catch (e) {}
}

/* --------------------------------------------------------------------------
   5. UNIVERSE HUB UI & EXECUTIVE DATA BACKUP / RESTORE
   -------------------------------------------------------------------------- */
const EWF_BACKUP_KEYS = [
  'championship_holders', 'championship_defenses', 'custom_alliances', 'ewf_rivalries',
  'mitb_holder', 'kotr_holder', 'ewf_kotr_winner_id', 'ewf_injuries', 'ewf_pending_return_ambush',
  'kotr_ic_mandatory', 'rumble_whc_mandatory', 'main_event_history', 'ewf_show_history', 'ewf_milestones',
  'ewf_hof_inductees', 'ewf_gm_profile', 'ewf_unlocked_vault_ids', 'custom_wrestlers',
  'ewf_ice_overrides', 'ewf_promo_plays', 'ewf_last_career_contract_match',
  'ewf_last_media_scrum_match', 'ewf_last_decree_match', 'ewf_uncrowned_king', 'ewf_vault_banished',
  'ewf_acknowledged_levels', 'ewf_last_summit_match', 'ewf_tag_loss_streaks', 'ewf_scheduled_story_match',
  'ewf_contender_title_locks', 'ewf_eight_loss_redemption_seen'
];

function exportUniverseBackup() {
  try {
    const backupData = {
      app: "ELLIS WRESTLING FEDERATION (EWF)",
      exportDate: new Date().toISOString(),
      keys: {}
    };
    EWF_BACKUP_KEYS.forEach(k => {
      const val = localStorage.getItem(k);
      if (val !== null) backupData.keys[k] = val;
    });

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateTag = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `ewf_universe_backup_${dateTag}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    alert("⚠️ Export failed: " + err.message);
  }
}

function triggerRestoreUniverse() {
  let input = document.getElementById('ewfUniverseRestoreInput');
  if (!input) {
    input = document.createElement('input');
    input.type = 'file';
    input.id = 'ewfUniverseRestoreInput';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (!parsed.keys) throw new Error("Invalid EWF backup file structure.");
          Object.keys(parsed.keys).forEach(k => {
            localStorage.setItem(k, parsed.keys[k]);
          });
          alert("✅ EWF UNIVERSE RESTORED!\n\nAll title reigns, match logs, and roster lineages reinstated.");
          closeUniverseModal();
          if (typeof updateGMHeaderWidget === 'function') updateGMHeaderWidget();
          if (typeof renderGrid === 'function') renderGrid();
        } catch (readErr) {
          alert("⚠️ Failed to restore backup: " + readErr.message);
        }
      };
      reader.readAsText(file);
    };
  }
  input.click();
}

function ensureUniverseBackupUI() {
  const modal = document.getElementById('universeModal');
  if (!modal || document.getElementById('ewfUniverseBackupContainer')) return;
  const content = modal.querySelector('.modal-content') || modal.children[0] || modal;
  
  const box = document.createElement('div');
  box.id = 'ewfUniverseBackupContainer';
  box.style.cssText = `
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
    gap: 10px; margin-top: 18px; padding: 12px 16px; background: rgba(10, 12, 20, 0.85);
    border: 1px solid rgba(255, 215, 0, 0.4); border-radius: 6px; width: 100%; box-sizing: border-box;
  `;
  box.innerHTML = `
    <div>
      <div style="font-family:'Russo One', sans-serif; font-size:0.8rem; color:#ffd700; letter-spacing:0.5px;">
        💾 FEDERATION ARCHIVE BACKUP
      </div>
      <div style="font-size:0.68rem; color:#aaa; margin-top:2px;">Back up or restore Ellis's entire universe and history logs.</div>
    </div>
    <div style="display:flex; gap:8px;">
      <button type="button" class="action-btn btn-blue" style="padding:6px 12px; font-size:0.75rem;" onclick="exportUniverseBackup()">
        💾 EXPORT (.JSON)
      </button>
      <button type="button" class="action-btn" style="padding:6px 12px; font-size:0.75rem; background:#222; color:#fff; border-color:#888;" onclick="triggerRestoreUniverse()">
        📂 RESTORE BACKUP
      </button>
    </div>
  `;
  content.appendChild(box);
}

function showUniverseBulletin({ icon = '⚖️', kicker = 'EWF BULLETIN', title = 'NOTICE', body = '', confirmBtn = 'VIEW ➔', tab = 'titles', onConfirm = null }) {
  const modal = document.getElementById('universeBulletinOverlay');
  if (!modal) return;

  const iconEl = document.getElementById('bulletinIcon');
  const kickerEl = document.getElementById('bulletinKicker');
  const titleEl = document.getElementById('bulletinTitle');
  const msgEl = document.getElementById('bulletinMessage');
  const btnEl = document.getElementById('bulletinConfirmBtn');

  if (iconEl) iconEl.innerText = icon;
  if (kickerEl) kickerEl.innerText = kicker.toUpperCase();
  if (titleEl) titleEl.innerText = title.toUpperCase();
  if (msgEl) msgEl.innerText = body;
  if (btnEl) {
    btnEl.innerText = confirmBtn.toUpperCase();
    btnEl.onclick = () => {
      closeUniverseBulletin();
      if (typeof onConfirm === 'function') {
        onConfirm();
      } else {
        openUniverseModal();
        if (tab && typeof switchUniverseTab === 'function') switchUniverseTab(tab);
      }
    };
  }

  try {
    const gavel = new Audio('gavel.mp3');
    gavel.volume = 0.6;
    gavel.play().catch(() => {});
  } catch(e) {}

  modal.style.display = 'flex';
}

function closeUniverseBulletin() {
  const modal = document.getElementById('universeBulletinOverlay');
  if (modal) modal.style.display = 'none';
}

function openUniverseModal() {
  if (typeof turnOffOtherModes === 'function') turnOffOtherModes('');
  if (typeof unlockAchievement === 'function') unlockAchievement('front_office');
  
  const gmLevel = typeof getGMLevel === 'function' ? getGMLevel() : 1;
  const allWrestlers = getUnlockedWrestlers();
  const currentHolders = getTitleHolders();
  const currentMitb = getMitbHolder();
  const alliances = getAlliances();
  const currentAlliance = alliances.length > 0 ? alliances[0] : { p1: '', p2: '', name: '', color: '' };

  const titlesTabBtn = document.getElementById('tabBtnTitles');
  if (titlesTabBtn) {
    if (gmLevel < 2) {
      titlesTabBtn.innerHTML = `🔒 Titles (Lvl 2)`;
      titlesTabBtn.classList.add('tab-locked');
      titlesTabBtn.style.opacity = '0.55';
    } else {
      titlesTabBtn.innerHTML = `Titles`;
      titlesTabBtn.classList.remove('tab-locked');
      titlesTabBtn.style.opacity = '1';
    }
  }

  const injuriesTabBtn = document.getElementById('tabBtnInjuries');
  if (injuriesTabBtn) {
    if (gmLevel < 3) {
      injuriesTabBtn.innerHTML = `🔒 Medical (Lvl 3)`;
      injuriesTabBtn.classList.add('tab-locked');
      injuriesTabBtn.style.opacity = '0.55';
    } else {
      injuriesTabBtn.innerHTML = `Medical Ward`;
      injuriesTabBtn.classList.remove('tab-locked');
      injuriesTabBtn.style.opacity = '1';
    }
  }

  ['whcSelect', 'icSelect', 'hardcoreSelect', 'tag1Select', 'tag2Select', 'mitbSelect', 'alliance1Select', 'alliance2Select', 'newFeudASelect', 'newFeudBSelect'].forEach(selectId => {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Vacant / None --</option>';
    allWrestlers.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.id;
      opt.innerText = w.name;
      sel.appendChild(opt);
    });

    if (['whcSelect', 'icSelect', 'hardcoreSelect', 'tag1Select', 'tag2Select'].includes(selectId)) {
      sel.disabled = (gmLevel < 2);
    }
  });

  if (document.getElementById('whcSelect')) document.getElementById('whcSelect').value = currentHolders.whc || "";
  if (document.getElementById('icSelect')) document.getElementById('icSelect').value = currentHolders.ic || "";
  if (document.getElementById('hardcoreSelect')) document.getElementById('hardcoreSelect').value = currentHolders.hardcore || "";
  if (document.getElementById('tag1Select')) document.getElementById('tag1Select').value = currentHolders.tag1 || "";
  if (document.getElementById('tag2Select')) document.getElementById('tag2Select').value = currentHolders.tag2 || "";
  if (document.getElementById('mitbSelect')) document.getElementById('mitbSelect').value = currentMitb ? currentMitb.id : "";

  if (document.getElementById('alliance1Select')) document.getElementById('alliance1Select').value = currentAlliance.p1 || "";
  if (document.getElementById('alliance2Select')) document.getElementById('alliance2Select').value = currentAlliance.p2 || "";
  if (document.getElementById('allianceNameInput')) document.getElementById('allianceNameInput').value = currentAlliance.name || "";
  if (document.getElementById('allianceColorSelect')) document.getElementById('allianceColorSelect').value = currentAlliance.color || "";

  renderFeudsListUI();
  renderUniverseInjuriesTab();
  ensureUniverseBackupUI();
  checkEmergencyBoardroomBanner();

  switchUniverseTab(gmLevel >= 2 ? 'titles' : 'feuds');
  setElDisplay('universeModal', 'flex');
}

function switchUniverseTab(tabName) {
  const gmLevel = typeof getGMLevel === 'function' ? getGMLevel() : 1;
  if (tabName === 'titles' && gmLevel < 2) {
    alert("🔒 CLASSIFIED CLEARANCE: Physical Championship Sanctioning unlocks at Level 2 (TV Coordinator) after 500 XP.");
    tabName = 'feuds';
  }

  if (tabName === 'injuries' && gmLevel < 3) {
    alert("🔒 CLASSIFIED CLEARANCE: The Medical Ward & Injury Tracking system unlocks at Level 3 (Chief Medical Officer) after 1,100 XP.");
    tabName = 'feuds';
  }

  ['titles', 'alliances', 'feuds', 'injuries'].forEach(t => {
    setElDisplay(`universeTab${t.charAt(0).toUpperCase() + t.slice(1)}`, (t === tabName) ? 'block' : 'none');
    const btn = document.getElementById(`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) btn.classList.toggle('active', t === tabName);
  });
}

function renderFeudsListUI() {
  const container = document.getElementById('activeFeudsListContainer');
  if (!container) return;
  const rivalries = getRivalries();
  const allWrestlers = getUnlockedWrestlers();
  const getName = id => (allWrestlers.find(w => w && w.id === id) || {}).name || "Unknown";

  if (rivalries.length === 0) {
    container.innerHTML = `<div style="color:#777; font-size:0.85rem; padding:10px; text-align:center;">No active feuds tracked.</div>`;
    return;
  }

  container.innerHTML = rivalries.map((r) => {
    if (!r) return '';
    const heatIcons = r.heat === 1 ? '🔥 Simmering' : (r.heat === 2 ? '🔥🔥 Boiling' : '💀 BLOOD FEUD');
    const isBloodFeud = r.heat === 3;
    const cardClass = isBloodFeud ? 'feud-card blood-feud' : 'feud-card';
    let blowoffBtn = isBloodFeud ? `<button class="action-btn btn-red" style="padding:4px 8px; font-size:0.65rem;" onclick="bookBloodFeudBlowoff('${r.id}')">💀 BOOK BLOWOFF ➔</button>` : '';

    return `
      <div class="${cardClass}">
        <div>
          <div style="font-family:'Russo One'; font-size:0.85rem; color:#fff;">${getName(r.w1)} vs ${getName(r.w2)}</div>
          <div style="font-size:0.72rem; color:${isBloodFeud ? '#ff0000' : '#ff9999'};">${heatIcons}</div>
        </div>
        <div style="display:flex; gap:6px;">
          ${blowoffBtn}
          <button type="button" class="action-btn btn-red" style="padding:4px 8px; font-size:0.7rem; min-width:80px; flex:none;" onclick="removeRivalry('${r.id}')">Settle</button>
        </div>
      </div>
    `;
  }).join('');
}

function igniteManualFeud() {
  const a = document.getElementById('newFeudASelect').value;
  const b = document.getElementById('newFeudBSelect').value;
  const heat = parseInt(document.getElementById('newFeudHeatSelect').value, 10);
  if (!a || !b || a === b) { alert("Select two different superstars!"); return; }
  addOrUpdateRivalry(a, b, "Manual Roster Feud", heat);
  renderFeudsListUI();
}

function renderUniverseInjuriesTab() {
  const container = document.getElementById('hospitalizedRosterListContainer');
  if (!container) return;
  container.innerHTML = '';

  const injuries = getInjuries();
  if (injuries.length === 0) {
    container.innerHTML = `<div style="color:#00ff66; font-family:'Russo One'; font-size:0.85rem; padding:10px;">✅ All superstars medically cleared — full roster active!</div>`;
  } else {
    const allWrestlers = getUnlockedWrestlers();
    injuries.forEach(inj => {
      const w = allWrestlers.find(x => x.id === inj.id);
      if (!w) return;
      const card = document.createElement('div');
      card.className = 'feud-card';
      card.style.borderColor = '#ff0000';
      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${w.image}" style="width:36px; height:36px; border:1px solid #fff; object-fit:cover;" onerror="handleImgError(this, '${w.id}')">
          <div>
            <div style="font-family:'Russo One'; font-size:0.88rem; color:#fff;">${w.name}</div>
            <div style="font-size:0.75rem; color:#ff6666;">${inj.severity.toUpperCase()} INJURY: ${inj.remaining} match(es) remaining</div>
          </div>
        </div>
        <button class="action-btn btn-red" style="padding:4px 8px; font-size:0.65rem;" onclick="clearInjury('${w.id}')">CLEAR ➔</button>
      `;
      container.appendChild(card);
    });
  }

  const banishedIds = getBanishedWrestlerIds();
  let exiledPanel = document.getElementById('exiledSuperstarsPanel');
  if (banishedIds.length === 0) {
    if (exiledPanel) exiledPanel.remove();
    return;
  }

  if (!exiledPanel) {
    exiledPanel = document.createElement('div');
    exiledPanel.id = 'exiledSuperstarsPanel';
    exiledPanel.style.cssText = `
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid rgba(255, 215, 0, 0.35);
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    container.parentElement.appendChild(exiledPanel);
  }

  exiledPanel.innerHTML = `
    <div style="font-family:'Russo One', sans-serif; font-size:0.85rem; color:#ffd700; letter-spacing:0.8px;">
      🚫 EXILED SUPERSTARS (BANISHED FROM EWF)
    </div>
  `;

  banishedIds.forEach(bId => {
    const w = getWrestlerById(bId);
    if (!w) return;
    const card = document.createElement('div');
    card.className = 'feud-card';
    card.style.borderColor = '#ffd700';
    card.style.background = 'rgba(20, 16, 10, 0.9)';
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <img src="${w.image}" style="width:36px; height:36px; border:1px solid #ffd700; object-fit:cover; filter:grayscale(0.6);" onerror="handleImgError(this, '${w.id}')">
        <div>
          <div style="font-family:'Russo One'; font-size:0.88rem; color:#fff;">${w.name}</div>
          <div style="font-size:0.72rem; color:#ffd700;">EXILED • LOSER LEAVES EWF CLAUSE</div>
        </div>
      </div>
      <button type="button" class="action-btn btn-gold" style="padding:6px 10px; font-size:0.68rem;" onclick="reinstateBanishedWrestler('${w.id}')">✍️ RE-SIGN TO ROSTER</button>
    `;
    exiledPanel.appendChild(card);
  });
}

function closeUniverseModal() { setElDisplay('universeModal', 'none'); }

function saveUniverseModal() {
  const oldHolders = getTitleHolders();
  const allWrestlers = getUnlockedWrestlers();
  const getName = id => (allWrestlers.find(w => w && w.id === id) || {}).name || "Unknown";

  const newHolders = {
    whc: document.getElementById('whcSelect') ? document.getElementById('whcSelect').value : null,
    ic: document.getElementById('icSelect') ? document.getElementById('icSelect').value : null,
    hardcore: document.getElementById('hardcoreSelect') ? document.getElementById('hardcoreSelect').value : null,
    tag1: document.getElementById('tag1Select') ? document.getElementById('tag1Select').value : null,
    tag2: document.getElementById('tag2Select') ? document.getElementById('tag2Select').value : null
  };

  const selectedMitbId = document.getElementById('mitbSelect') ? document.getElementById('mitbSelect').value : "";
  if (selectedMitbId) { setMitbHolder(allWrestlers.find(w => w && w.id === selectedMitbId)); } else { setMitbHolder(null); }

  if (newHolders.whc !== oldHolders.whc) {
    if (typeof resetTitleDefense === 'function') resetTitleDefense('whc');
    if (newHolders.whc) {
      if (typeof saveHistoryLog === 'function') saveHistoryLog(`🏆 NEW WHC CHAMPION: ${getName(newHolders.whc).toUpperCase()}`, 'title-change');
    }
  }
  if (newHolders.ic !== oldHolders.ic) {
    if (typeof resetTitleDefense === 'function') resetTitleDefense('ic');
    if (newHolders.ic) {
      if (typeof saveHistoryLog === 'function') saveHistoryLog(`🏆 NEW IC CHAMPION: ${getName(newHolders.ic).toUpperCase()}`, 'title-change');
      if (typeof unlockAchievement === 'function') unlockAchievement('workhorse_heritage');
    }
  }
  if (newHolders.hardcore !== oldHolders.hardcore) {
    if (typeof resetTitleDefense === 'function') resetTitleDefense('hardcore');
    if (newHolders.hardcore) {
      if (typeof saveHistoryLog === 'function') saveHistoryLog(`💀 NEW HARDCORE CHAMPION: ${getName(newHolders.hardcore).toUpperCase()}`, 'title-change');
      if (typeof unlockAchievement === 'function') unlockAchievement('hardcore_havoc');
    }
  }
  if ((newHolders.tag1 !== oldHolders.tag1) || (newHolders.tag2 !== oldHolders.tag2)) {
    if (typeof resetTitleDefense === 'function') resetTitleDefense('tag');
    if (newHolders.tag1 || newHolders.tag2) {
      if (typeof saveHistoryLog === 'function') saveHistoryLog(`🤝 NEW TAG CHAMPIONS: ${getName(newHolders.tag1)} & ${getName(newHolders.tag2)}`, 'title-change');
      if (typeof unlockAchievement === 'function') unlockAchievement('double_trouble');
    }
  }

  const a1 = document.getElementById('alliance1Select') ? document.getElementById('alliance1Select').value : null;
  const a2 = document.getElementById('alliance2Select') ? document.getElementById('alliance2Select').value : null;
  const aName = document.getElementById('allianceNameInput') ? document.getElementById('allianceNameInput').value : "";
  const aColor = document.getElementById('allianceColorSelect') ? document.getElementById('allianceColorSelect').value : "";

  if (a1 && a2 && a1 !== a2) { saveAlliance(a1, a2, aName, aColor); } 
  else { 
    if (!a1 && !a2) disbandAlliance();
  }

  setTitleHolders(newHolders);
  if (typeof playTitleClinkAudio === 'function') playTitleClinkAudio();
  closeUniverseModal();
  if (typeof renderGrid === 'function') renderGrid();
}

/* --------------------------------------------------------------------------
   6. CINEMATIC CUTSCENE TRILOGY & UNIVERSAL ADDITIONS
   -------------------------------------------------------------------------- */

// --- CUTSCENE 1: "LOSER LEAVES EWF" CAREER CONTRACT (BATCH 6 ITEM 1: 10+ H2H, 5-MATCH COOLDOWN) ---
function canTriggerCareerContract() {
  const profile = typeof getGMProfile === 'function' ? getGMProfile() : { stats: { matches: 0 } };
  const curMatches = (profile && profile.stats && profile.stats.matches) || 0;
  const lastMatch = parseInt(localStorage.getItem('ewf_last_career_contract_match') || '-5', 10);
  return (curMatches - lastMatch) >= 5;
}

function openCareerContractModal(wA, wB, feudObj, h2h) {
  closeBloodFeudOverlay();
  let modal = document.getElementById('careerContractCutsceneModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'careerContractCutsceneModal';
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483647; display: flex; flex-direction: column;
      align-items: center; justify-content: space-between; padding: 25px 30px;
      background: #000 url('career_contract_bg.png') no-repeat center center / cover;
      box-sizing: border-box; overflow: hidden;
    `;
    document.body.appendChild(modal);
  }
  modal.style.zIndex = '2147483647';

  logShowFalloutEvent('cutscene', `💀 CAREER ULTIMATUM: ${wA.name.toUpperCase()} & ${wB.name.toUpperCase()} entered a Loser Leaves EWF contract showdown!`);

  try {
    const audio = new Audio('funeral_toll.mp3');
    audio.play().catch(() => { if (typeof playSubBassBoom === 'function') playSubBassBoom(); });
  } catch(e) {}

  modal.innerHTML = `
    <div style="text-align:center; z-index:10;">
      <div style="font-family:'Russo One', sans-serif; font-size:clamp(1.2rem, 2.4vw, 1.8rem); color:#ff1111; letter-spacing:2px; text-shadow:0 0 20px #ff0000;">
        💀 HIGH-STAKES ULTIMATUM // LOSER LEAVES EWF 💀
      </div>
      <div style="font-family:'Russo One', sans-serif; font-size:0.85rem; color:#ffd700; margin-top:4px;">
        LIFETIME WAR RECORD: ${wA.name.toUpperCase()} (${h2h.winsA} WINS) — ${wB.name.toUpperCase()} (${h2h.winsB} WINS)
      </div>
    </div>

    <div style="position:relative; width:100%; max-width:1200px; height:62vh; display:flex; align-items:flex-end; justify-content:space-between; z-index:5;">
      <div style="width:30%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-end;">
        <img src="${getWrestlerPosePath(wA)}" style="max-height:85%; object-fit:contain; filter:drop-shadow(0 0 25px rgba(255,0,0,0.8));" onerror="this.src='${wA.image}'">
        <div style="background:#090a14; border:2px solid #ff3333; padding:6px 14px; font-family:'Russo One'; font-size:0.9rem; color:#fff; margin-top:6px; box-shadow:0 0 15px rgba(255,0,0,0.5);">
          ${wA.name.toUpperCase()}
        </div>
      </div>

      <div style="position:relative; width:40%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <img src="career_contract_table.png" style="width:100%; max-height:48vh; object-fit:contain; filter:drop-shadow(0 15px 30px rgba(0,0,0,0.95));" alt="Contract Dais">
        <img id="contractTerminatedStamp" src="stamp_terminated.png" style="display:none; position:absolute; top:35%; left:50%; transform:translate(-50%, -50%) rotate(-12deg); width:65%; pointer-events:none; z-index:20; filter:drop-shadow(0 0 15px #ff0000);">
      </div>

      <div style="width:30%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-end;">
        <img src="${getWrestlerPosePath(wB)}" style="max-height:85%; object-fit:contain; filter:drop-shadow(0 0 25px rgba(0,180,255,0.8));" onerror="this.src='${wB.image}'">
        <div style="background:#090a14; border:2px solid #00b4ff; padding:6px 14px; font-family:'Russo One'; font-size:0.9rem; color:#fff; margin-top:6px; box-shadow:0 0 15px rgba(0,180,255,0.5);">
          ${wB.name.toUpperCase()}
        </div>
      </div>
    </div>

    <div id="contractActionsRow" style="display:flex; flex-wrap:wrap; gap:12px; width:100%; max-width:850px; justify-content:center; z-index:10; margin-bottom:10px;">
      <button class="action-btn btn-red" style="flex:1 1 240px; padding:12px; font-size:0.9rem; font-family:'Russo One'; box-shadow:0 0 25px #ff0000;" onclick="executeCareerContractSign()">
        ⚔️ FIGHT RIGHT NOW ➔
      </button>
      <button class="action-btn btn-gold" style="flex:1 1 240px; padding:12px; font-size:0.9rem; font-family:'Russo One'; box-shadow:0 0 20px #ffd700;" onclick="executeCareerContractSanction()">
        📋 SANCTION FOR NEXT BROADCAST ➔
      </button>
      <button class="action-btn" style="flex:1 1 100%; padding:10px; font-size:0.82rem; font-family:'Russo One'; background:#1b1d2a; color:#aaa; border-color:#555;" onclick="executeCareerContractRefuse()">
        ❌ REFUSE TERMS (COWARD BACKS DOWN)
      </button>
    </div>
  `;

  modal.style.display = 'flex';
  window.activeStagedFeud = { wrestlerA: wA, wrestlerB: wB, feudObj, h2h };
}

window.executeCareerContractSign = function() {
  if (!window.activeStagedFeud) return;
  const { wrestlerA, wrestlerB, feudObj } = window.activeStagedFeud;
  
  const stamp = document.getElementById('contractTerminatedStamp');
  const btnRow = document.getElementById('contractActionsRow');
  if (stamp) stamp.style.display = 'block';
  if (btnRow) btnRow.style.display = 'none';

  try {
    const pen = new Audio('pen_sign.mp3');
    pen.play().catch(() => {});
    setTimeout(() => {
      const gavel = new Audio('gavel.mp3');
      gavel.play().catch(() => { if (typeof anvilSlamSound !== 'undefined') anvilSlamSound.play().catch(()=>{}); });
    }, 450);
  } catch(e) {}

  if (typeof triggerCameraFlash === 'function') triggerCameraFlash();
  if (typeof playSubBassBoom === 'function') playSubBassBoom();

  const profile = typeof getGMProfile === 'function' ? getGMProfile() : { stats: { matches: 0 } };
  localStorage.setItem('ewf_last_career_contract_match', (profile.stats && profile.stats.matches) || 0);

  if (feudObj) feudObj.careerContractOffered = true;
  logShowFalloutEvent('signing', `✍️ CONTRACT SIGNED: ${wrestlerA.name.toUpperCase()} & ${wrestlerB.name.toUpperCase()} signed the Loser Leaves EWF contract!`);

  setTimeout(() => {
    const modal = document.getElementById('careerContractCutsceneModal');
    if (modal) modal.style.display = 'none';

    activeBookedMatch.isCareerMatch = true;
    proceedBloodFeudToMatch();
  }, 2400);
};

window.executeCareerContractSanction = function() {
  if (!window.activeStagedFeud) return;
  const { wrestlerA, wrestlerB, feudObj } = window.activeStagedFeud;

  const stamp = document.getElementById('contractTerminatedStamp');
  const btnRow = document.getElementById('contractActionsRow');
  if (stamp) stamp.style.display = 'block';
  if (btnRow) btnRow.style.display = 'none';

  try {
    const pen = new Audio('pen_sign.mp3');
    pen.play().catch(() => {});
    setTimeout(() => {
      const gavel = new Audio('gavel.mp3');
      gavel.play().catch(() => { if (typeof anvilSlamSound !== 'undefined') anvilSlamSound.play().catch(()=>{}); });
    }, 450);
  } catch(e) {}

  if (typeof triggerCameraFlash === 'function') triggerCameraFlash();
  if (typeof playSubBassBoom === 'function') playSubBassBoom();

  const profile = typeof getGMProfile === 'function' ? getGMProfile() : { stats: { matches: 0 } };
  localStorage.setItem('ewf_last_career_contract_match', (profile.stats && profile.stats.matches) || 0);

  if (feudObj) feudObj.careerContractOffered = true;

  const scheduledMatch = {
    w1: wrestlerA,
    w2: wrestlerB,
    matchType: "No Disqualification",
    formatKey: "1v1",
    isTitleMatch: false,
    isCareerMatch: true,
    feudStake: "💀 LOSER LEAVES EWF",
    originText: `💀 CAREER TERMINATION: ${wrestlerA.name.toUpperCase()} vs ${wrestlerB.name.toUpperCase()}`
  };
  localStorage.setItem('ewf_scheduled_story_match', JSON.stringify(scheduledMatch));

  if (typeof saveHistoryLog === 'function') {
    saveHistoryLog(`📜 CAREER CONTRACT RATIFIED: ${wrestlerA.name.toUpperCase()} vs ${wrestlerB.name.toUpperCase()} Sanctioned for Next Broadcast!`, 'feud');
  }
  logShowFalloutEvent('signing', `✍️ CONTRACT RATIFIED: ${wrestlerA.name.toUpperCase()} vs ${wrestlerB.name.toUpperCase()} (Loser Leaves EWF) sanctioned!`);

  setTimeout(() => {
    const modal = document.getElementById('careerContractCutsceneModal');
    if (modal) modal.style.display = 'none';
    alert(`💀 PINK SLIP MATCH SANCTIONED!\n\n${wrestlerA.name.toUpperCase()} vs ${wrestlerB.name.toUpperCase()} (LOSER LEAVES EWF) is locked as the Main Event for your next broadcast!`);
    if (typeof renderGrid === 'function') renderGrid();
  }, 2400);
};

window.executeCareerContractRefuse = function() {
  if (!window.activeStagedFeud) return;
  const { wrestlerA, wrestlerB, feudObj, h2h } = window.activeStagedFeud;

  let coward = wrestlerB;
  let brave = wrestlerA;
  if (h2h.winsA < h2h.winsB) { coward = wrestlerA; brave = wrestlerB; }
  else if (h2h.winsA === h2h.winsB) {
    const momA = calculateMomentum(wrestlerA.id);
    const momB = calculateMomentum(wrestlerB.id);
    if (momA < momB) { coward = wrestlerA; brave = wrestlerB; }
  }

  forceIceMomentum(coward.id);

  let feuds = getRivalries();
  const fIdx = feuds.findIndex(f => f.id === feudObj.id);
  if (fIdx >= 0) {
    feuds[fIdx].heat = 1;
    saveRivalries(feuds);
  }

  const profile = typeof getGMProfile === 'function' ? getGMProfile() : { stats: { matches: 0 } };
  localStorage.setItem('ewf_last_career_contract_match', (profile.stats && profile.stats.matches) || 0);

  if (typeof saveHistoryLog === 'function') {
    saveHistoryLog(`📜 CONTRACT REFUSED: ${coward.name.toUpperCase()} refused to sign the Career Contract against ${brave.name.toUpperCase()}! Momentum plunged to ICE COLD.`, 'feud');
  }
  logShowFalloutEvent('cutscene', `❌ CONTRACT REFUSED: ${coward.name.toUpperCase()} backed down from ${brave.name.toUpperCase()}'s Career Ultimatum!`);

  const modal = document.getElementById('careerContractCutsceneModal');
  if (modal) modal.style.display = 'none';

  alert(`❌ CONTRACT REFUSED!\n\n${coward.name.toUpperCase()} balked at putting their career on the line! Their momentum has collapsed to ❄️ ICE COLD, and the feud simmers back down to Tier 1.`);
  if (typeof renderGrid === 'function') renderGrid();
};

function checkBloodFeudActivation(feud) {
  window.activeStagedFeud = { feudObj: feud };
  const allWrestlers = getUnlockedWrestlers();
  const wA = allWrestlers.find(w => w.id === feud.w1);
  const wB = allWrestlers.find(w => w.id === feud.w2);
  if (!wA || !wB) return;

  window.activeStagedFeud.wrestlerA = wA;
  window.activeStagedFeud.wrestlerB = wB;

  logShowFalloutEvent('feud', `💀 BLOOD FEUD ERUPTED: ${wA.name.toUpperCase()} vs ${wB.name.toUpperCase()} reached maximum Tier 3 volatility!`);

  const showModal = () => {
    const modal = document.getElementById('bloodFeudAlertModal');
    const namesEl = document.getElementById('bloodFeudAlertNames');
    if (modal && namesEl) {
      namesEl.innerText = `${wA.name.toUpperCase()} VS ${wB.name.toUpperCase()}`;
      modal.style.setProperty('z-index', '2147483646', 'important');
      modal.style.display = 'flex';
      try {
        if (typeof bloodFeudSound !== 'undefined') {
          bloodFeudSound.currentTime = 0;
          bloodFeudSound.play().catch(() => {});
        }
      } catch (e) {}
    }
  };

  if (window.enqueuePostMatchEvent && window.isMatchPostScreenActive) {
    window.enqueuePostMatchEvent(showModal);
  } else {
    showModal();
  }
}

function confirmAlertSettleNow() {
  closeBloodFeudAlertModal();
  if (window.activeStagedFeud && window.activeStagedFeud.wrestlerA && window.activeStagedFeud.wrestlerB) {
    openBloodFeudShowdown(window.activeStagedFeud.wrestlerA, window.activeStagedFeud.wrestlerB, window.activeStagedFeud.feudObj);
  }
}

function closeBloodFeudAlertModal() {
  const modal = document.getElementById('bloodFeudAlertModal');
  if (modal) modal.style.display = 'none';

  if (window.postMatchEventQueue && window.postMatchEventQueue.length > 0 && typeof window.processNextPostMatchEvent === 'function') {
    window.processNextPostMatchEvent();
  }
}

function bookBloodFeudBlowoff(rivId) {
  const rivalries = getRivalries();
  const feud = rivalries.find(r => r && r.id === rivId);
  if (!feud) return;

  const allWrestlers = getUnlockedWrestlers();
  const pA = allWrestlers.find(w => w.id === feud.w1);
  const pB = allWrestlers.find(w => w.id === feud.w2);
  if (!pA || !pB) return;

  closeUniverseModal();
  openBloodFeudShowdown(pA, pB, feud);
}

// BATCH 6 ITEM 1: REQUIRE 10+ H2H ENCOUNTERS BEFORE INTERCEPTING WITH CAREER CONTRACT
function openBloodFeudShowdown(wrestlerA, wrestlerB, feudObj = null) {
  const h2h = getHeadToHeadRecord(wrestlerA.id, wrestlerB.id);

  if (h2h.count >= 10 && canTriggerCareerContract() && !(feudObj && feudObj.careerContractOffered)) {
    openCareerContractModal(wrestlerA, wrestlerB, feudObj, h2h);
    return;
  }

  const overlay = document.getElementById('bloodFeudOverlay');
  if (!overlay || !wrestlerA || !wrestlerB) return;

  window.activeStagedFeud = { wrestlerA, wrestlerB, feudObj };

  if (!window.isMatchPostScreenActive) {
    if (typeof stopBGMForAction === 'function') stopBGMForAction();
    else if (typeof pauseBGM === 'function') pauseBGM();
  }

  const leftImg = document.getElementById('feudLeftImg');
  const rightImg = document.getElementById('feudRightImg');
  const leftName = document.getElementById('feudLeftName');
  const rightName = document.getElementById('feudRightName');
  const desc = document.getElementById('feudDescText');
  
  const buttons = overlay.querySelectorAll('button');
  if (buttons.length >= 2) {
    const btnParent = buttons[0].parentElement;
    if (btnParent) {
      btnParent.style.flexWrap = 'wrap';
      btnParent.style.gap = '10px';
    }

    buttons[0].className = "action-btn";
    buttons[0].style.cssText = "background: rgba(20,20,30,0.85); color: #fff; border-color: #555; box-shadow: 0 4px 12px rgba(0,0,0,0.7); flex: 1 1 200px;";
    buttons[0].innerHTML = "💀 SETTLE RIVALRY & ARCHIVE SCORE";
    
    let sanctionBtn = document.getElementById('bloodFeudSanctionNextShowBtn');
    if (!sanctionBtn && btnParent) {
      sanctionBtn = document.createElement('button');
      sanctionBtn.id = 'bloodFeudSanctionNextShowBtn';
      sanctionBtn.type = 'button';
      btnParent.insertBefore(sanctionBtn, buttons[1]);
    }
    if (sanctionBtn) {
      sanctionBtn.className = "action-btn btn-gold";
      sanctionBtn.style.cssText = "box-shadow: 0 0 18px rgba(255, 215, 0, 0.6); font-size: 0.9rem; font-weight: bold; flex: 1 1 220px;";
      sanctionBtn.innerHTML = "📋 SANCTION FOR NEXT BROADCAST ➔";
      sanctionBtn.onclick = () => window.sanctionBloodFeudForNextBroadcast();
    }

    buttons[1].className = "action-btn btn-red";
    buttons[1].style.cssText = "box-shadow: 0 0 20px #ff0000; font-size: 0.95rem; font-weight: bold; flex: 1 1 220px;";
    buttons[1].innerHTML = "🩸 FIGHT IN BLOWOFF MATCH ➔";
  }

  if (leftName) leftName.innerText = wrestlerA.name.toUpperCase();
  if (rightName) rightName.innerText = wrestlerB.name.toUpperCase();

  if (leftImg) {
    leftImg.src = getWrestlerPosePath(wrestlerA);
    leftImg.onerror = () => { leftImg.src = wrestlerA.image; };
  }
  if (rightImg) {
    rightImg.src = getWrestlerPosePath(wrestlerB);
    rightImg.onerror = () => { rightImg.src = wrestlerB.image; };
  }

  if (desc) {
    desc.innerHTML = `The animosity between <strong>${wrestlerA.name}</strong> and <strong>${wrestlerB.name}</strong> has reached maximum volatility (H2H Encounters: ${h2h.count}). Concluding this rivalry awards <strong>Grudge Settler (+250 XP)</strong>.`;
  }

  overlay.style.setProperty('z-index', '2147483646', 'important');
  overlay.style.display = 'flex';

  try {
    bloodFeudSound.currentTime = 0;
    bloodFeudSound.play().catch(() => {});
    if (typeof playSubBassBoom === 'function') playSubBassBoom();
  } catch (e) {}
}

window.sanctionBloodFeudForNextBroadcast = function() {
  if (!window.activeStagedFeud) return;
  const { wrestlerA, wrestlerB } = window.activeStagedFeud;
  if (!wrestlerA || !wrestlerB) return;

  const violentStipulations = ['Last Man Standing', 'No Disqualification'];
  const gmLevel = typeof getGMLevel === 'function' ? getGMLevel() : 1;
  if (gmLevel >= 5) violentStipulations.push('Ambulance Match');
  const stip = violentStipulations[Math.floor(Math.random() * violentStipulations.length)];

  const scheduledMatch = {
    w1: wrestlerA,
    w2: wrestlerB,
    matchType: stip,
    formatKey: "1v1",
    isTitleMatch: false,
    isCareerMatch: false,
    isBloodFeudBlowoff: true,
    feudStake: `💀 BLOOD FEUD BLOWOFF (${stip.toUpperCase()})`,
    originText: `💀 BLOOD FEUD BLOWOFF: ${wrestlerA.name.toUpperCase()} vs ${wrestlerB.name.toUpperCase()} [${stip.toUpperCase()}]`
  };

  localStorage.setItem('ewf_scheduled_story_match', JSON.stringify(scheduledMatch));

  if (typeof saveHistoryLog === 'function') {
    saveHistoryLog(`📋 BLOOD FEUD SANCTIONED: ${wrestlerA.name.toUpperCase()} vs ${wrestlerB.name.toUpperCase()} [${stip.toUpperCase()}] locked in for the Next Broadcast!`, 'feud');
  }

  closeBloodFeudOverlay();

  alert(`📋 BLOOD FEUD BLOWOFF SANCTIONED!\n\n${wrestlerA.name.toUpperCase()} vs ${wrestlerB.name.toUpperCase()} (${stip.toUpperCase()}) is locked in as the Main Event for your next broadcast!`);

  if (typeof renderGrid === 'function') renderGrid();
};

function closeBloodFeudOverlay() {
  const overlay = document.getElementById('bloodFeudOverlay');
  if (overlay) overlay.style.display = 'none';

  try {
    bloodFeudSound.pause();
    bloodFeudSound.currentTime = 0;
  } catch (e) {}

  window.activeStagedFeud = null;
  if (!window.isMatchPostScreenActive && typeof resumeBGM === 'function') resumeBGM();
}

function confirmSettleBloodFeud() {
  if (!window.activeStagedFeud) return;
  const { wrestlerA, wrestlerB } = window.activeStagedFeud;

  let feuds = getRivalries();
  feuds = feuds.filter(f => {
    const isPair = (f.w1 === wrestlerA.id && f.w2 === wrestlerB.id) || 
                   (f.w1 === wrestlerB.id && f.w2 === wrestlerA.id);
    return !isPair;
  });
  saveRivalries(feuds);

  if (typeof saveHistoryLog === 'function') {
    saveHistoryLog(`💀 BLOOD FEUD SETTLED: The war between ${wrestlerA.name.toUpperCase()} and ${wrestlerB.name.toUpperCase()} has concluded!`, 'match');
  }
  logShowFalloutEvent('feud', `💀 BLOOD FEUD SETTLED: The war between ${wrestlerA.name.toUpperCase()} and ${wrestlerB.name.toUpperCase()} concluded!`);

  if (typeof unlockAchievement === 'function') {
    unlockAchievement('grudge_settler');
  }

  closeBloodFeudOverlay();
  
  const loser = Math.random() > 0.5 ? wrestlerA : wrestlerB;
  forceIceMomentum(loser.id);

  showFeudSettlementScreen(wrestlerA, wrestlerB, loser);
}

function showFeudSettlementScreen(wA, wB, loser) {
  let modal = document.getElementById('feudSettlementModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'feudSettlementModal';
    modal.style.cssText = `
      position: fixed; inset: 0; background: radial-gradient(circle at center, #3a0000 0%, #050000 100%);
      z-index: 2147483647; display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 20px; text-align: center; color: #fff; font-family: 'Russo One', sans-serif;
    `;
    document.body.appendChild(modal);
  }
  modal.style.zIndex = '2147483647';

  modal.innerHTML = `
    <div style="font-size:4rem; margin-bottom:10px; filter:drop-shadow(0 0 20px #ff0000);">💀</div>
    <h2 style="color:#ff3333; font-size:2.4rem; letter-spacing:2px; margin-bottom:10px; text-shadow:0 0 15px #ff0000;">BLOOD FEUD ARCHIVED</h2>
    <div style="font-size:1.1rem; max-width:600px; color:#ddd; line-height:1.4; margin-bottom:30px;">
      The war between <strong>${wA.name.toUpperCase()}</strong> and <strong>${wB.name.toUpperCase()}</strong> has officially been settled and sealed in federation history.
    </div>
    
    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:35px; background:rgba(0,0,0,0.4); padding:15px 30px; border-radius:8px; border:1px solid #555;">
      <div style="color:#ffd700; font-size:0.9rem;">Milestone Unlocked: Grudge Settler (+250 XP)</div>
      <div style="color:#00e5ff; font-size:0.9rem;">❄️ ${loser.name.toUpperCase()} suffers massive loss of momentum (ICE COLD)</div>
    </div>
    
    <button class="action-btn" style="background:#ff3333; color:#fff; border:2px solid #ff0000; box-shadow:0 0 15px #ff0000;" onclick="closeFeudSettlementScreen()">
      RETURN TO HEADQUARTERS ➔
    </button>
  `;
  
  modal.style.display = 'flex';
  
  try {
    if (typeof playSubBassBoom === 'function') playSubBassBoom();
    const anvil = typeof anvilSlamSound !== 'undefined' ? anvilSlamSound : new Audio('anvil.mp3');
    anvil.currentTime = 0;
    anvil.play().catch(()=>{});
  } catch(e){}
}

window.closeFeudSettlementScreen = function() {
  const modal = document.getElementById('feudSettlementModal');
  if (modal) modal.style.display = 'none';
  if (typeof renderGrid === 'function') renderGrid();
};

function proceedBloodFeudToMatch() {
  if (!window.activeStagedFeud) return;
  const { wrestlerA, wrestlerB } = window.activeStagedFeud;
  closeBloodFeudOverlay();

  if (window.activeShowSession) {
    window.activeShowSession = null;
    if (typeof setElDisplay === 'function') setElDisplay('bookShowCardModal', 'none');
  }

  const violentStipulations = ['Last Man Standing', 'No Disqualification'];
  const gmLevel = typeof getGMLevel === 'function' ? getGMLevel() : 1;
  if (gmLevel >= 5) violentStipulations.push('Ambulance Match');

  const stip = violentStipulations[Math.floor(Math.random() * violentStipulations.length)];

  if (typeof openMatchEngine === 'function') openMatchEngine();

  activeBookedMatch.showKey = "raw";
  activeBookedMatch.matchType = stip;
  activeBookedMatch.formatKey = "1v1";
  activeBookedMatch.formatCount = 2;
  activeBookedMatch.participants = [wrestlerA, wrestlerB];
  pickedReferee = null;

  isBloodFeudBlowoff = true;
  quickMatchQueue = [...activeBookedMatch.participants];

  if (typeof navGoToStep === 'function') navGoToStep(6);
  const matchTypeEl = document.getElementById('qmMatchType');
  if (matchTypeEl) {
    const careerHeader = activeBookedMatch.isCareerMatch ? 'LOSER LEAVES EWF: ' : 'BLOOD FEUD: ';
    matchTypeEl.innerHTML = `<span style="color:#ff0000; text-shadow:0 0 10px #ff0000;">💀 ${careerHeader}${stip.toUpperCase()}</span>`;
  }

  const listContainer = document.getElementById('qmWrestlersList');
  if (listContainer) {
    listContainer.innerHTML = `
      <div class="vs-wrestler"><img src="${wrestlerA.image}"><div>${wrestlerA.name}</div></div>
      <div class="vs-divider">VS</div>
      <div class="vs-wrestler"><img src="${wrestlerB.image}"><div>${wrestlerB.name}</div></div>
    `;
  }
  setElDisplay('qmButtons', 'flex');
}

// --- CUTSCENE 2: POST-SHOW MEDIA SCRUM ---
function getTagTeamStreakKey(p1Id, p2Id) {
  const ids = [p1Id, p2Id].sort();
  return `tag_streak_${ids[0]}_${ids[1]}`;
}

window.recordTagTeamResult = function(partnerAId, partnerBId, isWin, matchSummary = {}) {
  try {
    let streaks = JSON.parse(localStorage.getItem('ewf_tag_loss_streaks') || '{}');
    const key = getTagTeamStreakKey(partnerAId, partnerBId);

    if (isWin) {
      streaks[key] = 0;
      localStorage.setItem('ewf_tag_loss_streaks', JSON.stringify(streaks));
      return false;
    }

    const currentLosses = (streaks[key] || 0) + 1;
    streaks[key] = currentLosses;
    localStorage.setItem('ewf_tag_loss_streaks', JSON.stringify(streaks));

    if (currentLosses >= 2) {
      streaks[key] = 0;
      localStorage.setItem('ewf_tag_loss_streaks', JSON.stringify(streaks));
      const wA = getWrestlerById(partnerAId);
      const wB = getWrestlerById(partnerBId);
      if (wA && wB) {
        if (window.activeShowSession) {
          window.pendingMediaScrum = { partnerA: wA, partnerB: wB, matchSummary };
          logShowFalloutEvent('cutscene', `🎙️ PRESS INQUISITION QUEUED: ${wA.name.toUpperCase()} & ${wB.name.toUpperCase()} summoned to Post-Show Media Scrum!`);
          return true;
        }
        window.openMediaScrumModal(wA, wB, matchSummary);
        return true;
      }
    }
  } catch (e) {}
  return false;
};

window.openMediaScrumModal = function(partnerA, partnerB, matchSummary) {
  let modal = document.getElementById('mediaScrumCutsceneModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'mediaScrumCutsceneModal';
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 9999999; display: flex; flex-direction: column;
      align-items: center; justify-content: space-between; padding: 25px 30px;
      background: #000 url('media_scrum_bg.png') no-repeat center center / cover;
      box-sizing: border-box; overflow: hidden;
    `;
    document.body.appendChild(modal);
  }

  let scrumAudio = null;
  try {
    scrumAudio = new Audio('press_room.mp3');
    scrumAudio.loop = true;
    scrumAudio.play().catch(() => {});
  } catch(e) {}

  modal.innerHTML = `
    <div style="text-align:center; z-index:10;">
      <div style="font-family:'Russo One', sans-serif; font-size:clamp(1.2rem, 2.2vw, 1.8rem); color:#00e5ff; letter-spacing:2px; text-shadow:0 0 15px rgba(0,229,255,0.7);">
        🎙️ POST-SHOW MEDIA SCRUM // PRESS TRIBUNAL 🎙️
      </div>
      <div style="font-family:'Russo One', sans-serif; font-size:0.85rem; color:#ffd700; margin-top:4px;">
        PRESS ROOM TRANSCRIPT: 2 CONSECUTIVE LOSSES TRIGGER LOCKER ROOM INQUISITION
      </div>
    </div>

    <div style="position:relative; width:100%; max-width:1200px; height:60vh; display:flex; align-items:flex-end; justify-content:space-between; z-index:5;">
      <div style="width:30%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-end;">
        <img src="${getWrestlerPosePath(partnerA)}" style="max-height:85%; object-fit:contain; filter:drop-shadow(0 0 25px rgba(255,80,0,0.8));" onerror="this.src='${partnerA.image}'">
        <div style="background:#090a14; border:2px solid #ff5500; padding:6px 14px; font-family:'Russo One'; font-size:0.88rem; color:#fff; margin-top:6px;">
          ${partnerA.name.toUpperCase()} (FRUSTRATED)
        </div>
      </div>

      <div style="position:relative; width:40%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <img src="media_scrum_table.png" style="width:100%; max-height:48vh; object-fit:contain; filter:drop-shadow(0 15px 30px rgba(0,0,0,0.9));" alt="Media Dais">
        <img id="mediaShatteredStamp" src="stamp_shattered.png" style="display:none; position:absolute; top:40%; left:50%; transform:translate(-50%, -50%); width:80%; aspect-ratio:3/2; object-fit:contain; pointer-events:none; z-index:20; filter:drop-shadow(0 0 20px #ff0000);">
      </div>

      <div style="width:30%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-end;">
        <img src="${getWrestlerPosePath(partnerB)}" style="max-height:85%; object-fit:contain; filter:drop-shadow(0 0 25px rgba(0,229,255,0.7));" onerror="this.src='${partnerB.image}'">
        <div style="background:#090a14; border:2px solid #00e5ff; padding:6px 14px; font-family:'Russo One'; font-size:0.88rem; color:#fff; margin-top:6px;">
          ${partnerB.name.toUpperCase()} (DEFEATED)
        </div>
      </div>
    </div>

    <div id="mediaScrumActionsRow" style="display:flex; gap:16px; width:100%; max-width:850px; justify-content:center; z-index:10; margin-bottom:10px;">
      <button class="action-btn btn-blue" style="flex:1; padding:12px; font-size:0.9rem; font-family:'Russo One';" onclick="resolveMediaScrumSolidarity('${partnerA.id}', '${partnerB.id}')">
        🎙️ UNITED FRONT (BACK YOUR PARTNER)
      </button>
      <button class="action-btn btn-red" style="flex:1; padding:12px; font-size:0.9rem; font-family:'Russo One'; box-shadow:0 0 20px #ff0000;" onclick="resolveMediaScrumPipebomb('${partnerA.id}', '${partnerB.id}')">
        💥 DROP PIPEBOMB (THROW UNDER BUS)
      </button>
    </div>
  `;

  modal.style.display = 'flex';
  window.activeMediaScrumAudio = scrumAudio;
};

window.resolveMediaScrumSolidarity = function(p1Id, p2Id) {
  if (window.activeMediaScrumAudio) { window.activeMediaScrumAudio.pause(); window.activeMediaScrumAudio = null; }
  clearIceMomentumOverrides(p2Id);

  const w1 = getWrestlerById(p1Id);
  const w2 = getWrestlerById(p2Id);
  if (typeof addXP === 'function') addXP(50, "Locker Room Unity");
  if (typeof saveHistoryLog === 'function') {
    saveHistoryLog(`🎙️ MEDIA SCRUM: ${w1.name.toUpperCase()} defended ${w2.name.toUpperCase()} to reporters! Tag alliance preserved.`, 'feud');
  }

  const profile = typeof getGMProfile === 'function' ? getGMProfile() : { stats: { matches: 0 } };
  localStorage.setItem('ewf_last_career_contract_match', (profile.stats && profile.stats.matches) || 0);

  const modal = document.getElementById('mediaScrumCutsceneModal');
  if (modal) modal.style.display = 'none';
  if (typeof closeVideoModal === 'function') closeVideoModal();
};

window.resolveMediaScrumPipebomb = function(p1Id, p2Id) {
  if (window.activeMediaScrumAudio) { window.activeMediaScrumAudio.pause(); window.activeMediaScrumAudio = null; }
  
  const stamp = document.getElementById('mediaShatteredStamp');
  const btnRow = document.getElementById('mediaScrumActionsRow');
  if (stamp) stamp.style.display = 'block';
  if (btnRow) btnRow.style.display = 'none';

  if (typeof triggerCameraFlash === 'function') triggerCameraFlash();
  if (typeof playSubBassBoom === 'function') playSubBassBoom();
  try {
    const audio = new Audio('table.mp3');
    audio.play().catch(() => {});
  } catch(e) {}

  disbandAlliance(p1Id, p2Id);
  addOrUpdateRivalry(p1Id, p2Id, "Press Scrum Fallout", 2);

  const w1 = getWrestlerById(p1Id);
  const w2 = getWrestlerById(p2Id);
  if (typeof addXP === 'function') addXP(150, "Broadcast Controversy");
  if (typeof saveHistoryLog === 'function') {
    saveHistoryLog(`💥 ALLIANCE SHATTERED: ${w1.name.toUpperCase()} cut a scathing pipebomb on ${w2.name.toUpperCase()} at the post-show press scrum!`, 'feud');
  }

  const profile = typeof getGMProfile === 'function' ? getGMProfile() : { stats: { matches: 0 } };
  localStorage.setItem('ewf_last_media_scrum_match', (profile.stats && profile.stats.matches) || 0);

  setTimeout(() => {
    const modal = document.getElementById('mediaScrumCutsceneModal');
    if (modal) modal.style.display = 'none';
    if (typeof closeVideoModal === 'function') closeVideoModal();
  }, 2500);
};

// --- CUTSCENE 3: EMERGENCY BOARDROOM TITLE DECREE ---
function checkEmergencyBoardroomBanner() {
  const titles = getTitleHolders();
  const injuries = getInjuries();
  const titleList = [
    { code: 'whc', name: 'World Heavyweight Championship', id: titles.whc, img: 'whc.png' },
    { code: 'ic', name: 'Intercontinental Championship', id: titles.ic, img: 'ic_title.png' },
    { code: 'hardcore', name: 'Hardcore Championship', id: titles.hardcore, img: 'hardcore.png' }
  ];

  for (let t of titleList) {
    if (t.id) {
      const inj = injuries.find(i => i.id === t.id && i.severity === 'major');
      if (inj) {
        showBoardroomDecreePrompt(t.id, t.code, t.name, t.img, `Major Medical Trauma (${inj.remaining} Matches)`);
        return;
      }
    }
  }
}

function showBoardroomDecreePrompt(champId, titleCode, titleName, titleImg, reason) {
  let bar = document.getElementById('boardroomAlertPromptBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'boardroomAlertPromptBar';
    bar.style.cssText = `
      width: 100%; background: linear-gradient(90deg, #800000, #ff0000); color: #fff;
      padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px; border-radius: 4px; box-shadow: 0 0 15px rgba(255,0,0,0.5);
      font-family: 'Russo One', sans-serif; font-size: 0.82rem;
    `;
    const tabTitles = document.getElementById('universeTabTitles');
    if (tabTitles) tabTitles.insertBefore(bar, tabTitles.firstChild);
  }

  const champ = getWrestlerById(champId);
  bar.innerHTML = `
    <span>⚖️ EMERGENCY DECREE: ${champ ? champ.name.toUpperCase() : 'CHAMPION'} UNFIT TO DEFEND ${titleName.toUpperCase()}!</span>
    <button class="action-btn" style="background:#fff; color:#900; font-size:0.75rem; padding:4px 10px;" onclick="openBoardroomDecreeModal('${champId}', '${titleCode}', '${reason}')">
      CONVENE BOARD ➔
    </button>
  `;
}

window.openBoardroomDecreeModal = function(champId, titleCode, reason = 'Title Inactivity') {
  closeUniverseModal();
  let modal = document.getElementById('boardroomDecreeCutsceneModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'boardroomDecreeCutsceneModal';
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 9999999; display: flex; flex-direction: column;
      align-items: center; justify-content: space-between; padding: 25px 30px;
      background: #000 url('boardroom_decree_bg.png') no-repeat center center / cover;
      box-sizing: border-box; overflow: hidden;
    `;
    document.body.appendChild(modal);
  }

  const champ = getWrestlerById(champId);
  const titles = [
    { code: 'whc', name: 'World Heavyweight Championship', img: 'whc.png' },
    { code: 'ic', name: 'Intercontinental Championship', img: 'ic_title.png' },
    { code: 'hardcore', name: 'Hardcore Championship', img: 'hardcore.png' },
    { code: 'tag', name: 'World Tag Team Championship', img: 'tag_title.png' }
  ];
  const tObj = titles.find(t => t.code === titleCode) || titles[0];

  modal.innerHTML = `
    <div style="text-align:center; z-index:10;">
      <div style="font-family:'Russo One', sans-serif; font-size:clamp(1.2rem, 2.2vw, 1.8rem); color:#ffd700; letter-spacing:2px; text-shadow:0 0 15px rgba(255,215,0,0.6);">
        ⚖️ EMERGENCY BOARDROOM SESSION // TITLE SANCTIONING DECREE ⚖️
      </div>
      <div style="font-family:'Russo One', sans-serif; font-size:0.85rem; color:#ff6666; margin-top:4px;">
        OFFICIAL SUMMONS: ${champ ? champ.name.toUpperCase() : 'CHAMPION'} (${reason.toUpperCase()})
      </div>
    </div>

    <div style="position:relative; width:100%; max-width:1100px; height:62vh; display:flex; align-items:flex-end; justify-content:space-around; z-index:5;">
      <div style="position:relative; width:45%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-end;">
        <img src="title_pedestal.png" style="max-height:55vh; object-fit:contain; filter:drop-shadow(0 15px 30px rgba(0,0,0,0.95));" alt="Pedestal">
        <img src="${tObj.img}" style="position:absolute; top:20%; left:50%; transform:translate(-50%, -50%); max-height:18vh; object-fit:contain; filter:drop-shadow(0 0 18px #ffd700);" alt="${tObj.name}">
        <img id="boardroomVacatedStamp" src="stamp_vacated.png" style="display:none; position:absolute; top:28%; left:50%; transform:translate(-50%, -50%); width:65%; pointer-events:none; z-index:20; filter:drop-shadow(0 0 20px #ff0000);">
      </div>

      <div style="width:38%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-end;">
        <img src="${getWrestlerPosePath(champ)}" style="max-height:85%; object-fit:contain; filter:grayscale(0.5) brightness(0.7) drop-shadow(0 0 25px rgba(255,0,0,0.5));" onerror="this.src='${champ.image}'">
        <div style="background:#090a14; border:2px solid #ffd700; padding:6px 14px; font-family:'Russo One'; font-size:0.9rem; color:#fff; margin-top:6px;">
          ${champ ? champ.name.toUpperCase() : 'CHAMPION'} (INJURED)
        </div>
      </div>
    </div>

    <div id="boardroomActionsRow" style="display:flex; gap:16px; width:100%; max-width:850px; justify-content:center; z-index:10; margin-bottom:10px;">
      <button class="action-btn btn-red" style="flex:1; padding:12px; font-size:0.9rem; font-family:'Russo One'; box-shadow:0 0 20px #ff0000;" onclick="executeBoardroomStripTitle('${champ.id}', '${titleCode}', '${tObj.name}')">
        ⚖️ STRIKE GAVEL: STRIP & VACATE GOLD
      </button>
      <button class="action-btn btn-blue" style="flex:1; padding:12px; font-size:0.9rem; font-family:'Russo One';" onclick="executeBoardroomGrantGrace('${champ.id}')">
        ⏳ GRANT 2-MATCH MEDICAL GRACE
      </button>
    </div>
  `;

  modal.style.display = 'flex';
};

window.executeBoardroomStripTitle = function(champId, titleCode, titleName) {
  const stamp = document.getElementById('boardroomVacatedStamp');
  const btnRow = document.getElementById('boardroomActionsRow');
  if (stamp) stamp.style.display = 'block';
  if (btnRow) btnRow.style.display = 'none';

  try {
    const gavel = new Audio('gavel.mp3');
    gavel.play().catch(() => { if (typeof anvilSlamSound !== 'undefined') anvilSlamSound.play().catch(()=>{}); });
  } catch(e) {}

  if (typeof triggerCameraFlash === 'function') triggerCameraFlash();
  if (typeof playSubBassBoom === 'function') playSubBassBoom();

  const holders = getTitleHolders();
  holders[titleCode] = null;
  setTitleHolders(holders);

  if (typeof resetTitleDefense === 'function') resetTitleDefense(titleCode);
  localStorage.setItem('ewf_uncrowned_king', champId);

  const champ = getWrestlerById(champId);
  if (typeof saveHistoryLog === 'function') {
    saveHistoryLog(`⚖️ BOARDROOM DECREE: ${champ ? champ.name.toUpperCase() : 'CHAMPION'} stripped of ${titleName.toUpperCase()}! Title declared officially VACANT.`, 'title-change');
  }
  logShowFalloutEvent('cutscene', `⚖️ BOARDROOM DECREE: ${champ ? champ.name.toUpperCase() : 'CHAMPION'} stripped of ${titleName.toUpperCase()}!`);

  const profile = typeof getGMProfile === 'function' ? getGMProfile() : { stats: { matches: 0 } };
  localStorage.setItem('ewf_last_decree_match', (profile.stats && profile.stats.matches) || 0);

  setTimeout(() => {
    const modal = document.getElementById('boardroomDecreeCutsceneModal');
    if (modal) modal.style.display = 'none';
    if (typeof renderGrid === 'function') renderGrid();
    alert(`⚖️ TITLE OFFICIALLY VACATED!\n\nThe ${titleName.toUpperCase()} has been stripped by order of the Board of Directors.`);
  }, 2500);
};

window.executeBoardroomGrantGrace = function(champId) {
  const modal = document.getElementById('boardroomDecreeCutsceneModal');
  if (modal) modal.style.display = 'none';
  alert("⏳ GRACE PERIOD GRANTED: Champion retains gold for 2 additional shows.");
};

// --- CUTSCENE 4: MIDNIGHT SYNDICATE SUMMIT ---
window.checkMidnightSyndicateTrigger = function() {
  const profile = typeof getGMProfile === 'function' ? getGMProfile() : { stats: { matches: 0 } };
  const curMatches = (profile && profile.stats && profile.stats.matches) || 0;
  const lastSummit = parseInt(localStorage.getItem('ewf_last_summit_match') || '-10', 10);
  if ((curMatches - lastSummit) < 5) return false;

  const allW = getUnlockedWrestlers().filter(w => !getInjuryRecord(w.id));
  const alliances = getAlliances();

  const unalignedHotStars = allW.filter(w => {
    const isAligned = alliances.some(a => a.p1 === w.id || a.p2 === w.id);
    if (isAligned) return false;
    const mom = getWrestlerMomentum(w.id);
    return mom.status === 'fire';
  });

  if (unalignedHotStars.length >= 2) {
    const wA = unalignedHotStars[0];
    const wB = unalignedHotStars[1];
    localStorage.setItem('ewf_last_summit_match', curMatches);

    showUniverseBulletin({
      icon: '🕶️',
      kicker: 'MIDNIGHT SYNDICATE: SECRET SUMMIT',
      title: 'POWER PACT IN MOTION',
      body: `Both ${wA.name.toUpperCase()} and ${wB.name.toUpperCase()} are riding dominant winning streaks with no active alliance. A tinted limousine is waiting at Loading Dock 4...`,
      confirmBtn: 'ENTER LIMOUSINE ➔',
      onConfirm: () => openLimoSummitModal(wA, wB)
    });
    return true;
  }
  return false;
};

window.openLimoSummitModal = function(wA, wB) {
  let modal = document.getElementById('limoSummitCutsceneModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'limoSummitCutsceneModal';
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 9999999; display: flex; flex-direction: column;
      align-items: center; justify-content: space-between; padding: 25px 30px;
      background: #000 url('limo_summit_bg.png') no-repeat center center / cover;
      box-sizing: border-box; overflow: hidden;
    `;
    document.body.appendChild(modal);
  }

  try {
    const limoDoor = new Audio('limo_door.mp3');
    limoDoor.volume = 0.85;
    limoDoor.play().catch(() => {});
  } catch (e) {}

  modal.innerHTML = `
    <div style="text-align:center; z-index:10;">
      <div style="font-family:'Russo One', sans-serif; font-size:clamp(1.2rem, 2.2vw, 1.8rem); color:#ffd700; letter-spacing:2px; text-shadow:0 0 15px rgba(255,215,0,0.6);">
        🕶️ MIDNIGHT SYNDICATE SUMMIT // SECRET PACT 🕶️
      </div>
      <div style="font-family:'Russo One', sans-serif; font-size:0.85rem; color:#aaa; margin-top:4px;">
        LOCATION: LOADING DOCK 4 • 02:40 AM
      </div>
    </div>

    <div style="position:relative; width:100%; max-width:1100px; height:60vh; display:flex; align-items:flex-end; justify-content:space-around; z-index:5;">
      <div style="width:35%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-end;">
        <img src="${getWrestlerPosePath(wA)}" style="max-height:85%; object-fit:contain; filter:drop-shadow(0 0 25px rgba(0,229,255,0.7));" onerror="this.src='${wA.image}'">
        <div style="background:#090a14; border:2px solid #00e5ff; padding:6px 14px; font-family:'Russo One'; font-size:0.88rem; color:#fff; margin-top:6px;">
          ${wA.name.toUpperCase()}
        </div>
      </div>

      <div style="width:35%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-end;">
        <img src="${getWrestlerPosePath(wB)}" style="max-height:85%; object-fit:contain; filter:drop-shadow(0 0 25px rgba(255,215,0,0.7));" onerror="this.src='${wB.image}'">
        <div style="background:#090a14; border:2px solid #ffd700; padding:6px 14px; font-family:'Russo One'; font-size:0.88rem; color:#fff; margin-top:6px;">
          ${wB.name.toUpperCase()}
        </div>
      </div>
    </div>

    <div style="display:flex; gap:16px; width:100%; max-width:850px; justify-content:center; z-index:10; margin-bottom:10px;">
      <button class="action-btn btn-gold" style="flex:1; padding:12px; font-size:0.95rem; font-family:'Russo One';" onclick="confirmLimoSummitAlliance('${wA.id}', '${wB.id}')">
        🤝 RATIFY SYNDICATE IN UNIVERSE HUB ➔
      </button>
      <button class="action-btn btn-red" style="flex:1; padding:12px; font-size:0.9rem; font-family:'Russo One';" onclick="closeLimoSummitModal()">
        DISMISS (NO DEAL)
      </button>
    </div>
  `;

  modal.style.display = 'flex';
};

window.confirmLimoSummitAlliance = function(p1Id, p2Id) {
  closeLimoSummitModal();
  openUniverseModal();
  switchUniverseTab('alliances');
  const sel1 = document.getElementById('alliance1Select');
  const sel2 = document.getElementById('alliance2Select');
  if (sel1) sel1.value = p1Id;
  if (sel2) sel2.value = p2Id;
};

window.closeLimoSummitModal = function() {
  const modal = document.getElementById('limoSummitCutsceneModal');
  if (modal) modal.style.display = 'none';
};

// --- CUTSCENE 5: THE ROGUE DISCHARGE ---
window.openHospitalEscapeModal = function(injuredWrestler, rivalWrestler) {
  let modal = document.getElementById('hospitalEscapeCutsceneModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'hospitalEscapeCutsceneModal';
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 9999999; display: flex; flex-direction: column;
      align-items: center; justify-content: space-between; padding: 25px 30px;
      background: #000 url('hospital_escape_bg.png') no-repeat center center / cover;
      box-sizing: border-box; overflow: hidden;
    `;
    document.body.appendChild(modal);
  }

  try {
    const crash = new Audio('ambush_crash.mp3');
    crash.volume = 0.9;
    crash.play().catch(() => {});
  } catch (e) {}

  modal.innerHTML = `
    <div style="text-align:center; z-index:10;">
      <div style="font-family:'Russo One', sans-serif; font-size:clamp(1.2rem, 2.2vw, 1.8rem); color:#ff1111; letter-spacing:2px; text-shadow:0 0 20px #ff0000;">
        🚨 ROGUE DISCHARGE // AMBULANCE BAY SIGHTING 🚨
      </div>
      <div style="font-family:'Russo One', sans-serif; font-size:0.85rem; color:#ffd700; margin-top:4px;">
        WARNING: INJURED SUPERSTAR REFUSES HOSPITAL BED — HUNTING RIVAL ${rivalWrestler.name.toUpperCase()}!
      </div>
    </div>

    <div style="position:relative; width:100%; max-width:800px; height:60vh; display:flex; align-items:flex-end; justify-content:center; z-index:5;">
      <div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-end;">
        <img src="${getWrestlerPosePath(injuredWrestler)}" style="max-height:85%; object-fit:contain; filter:drop-shadow(0 0 30px #ff0000);" onerror="this.src='${injuredWrestler.image}'">
        <div style="background:#090a14; border:2px solid #ff1111; padding:6px 16px; font-family:'Russo One'; font-size:1rem; color:#fff; margin-top:6px;">
          ${injuredWrestler.name.toUpperCase()} (CLEARED FOR WAR)
        </div>
      </div>
    </div>

    <div style="display:flex; gap:16px; width:100%; max-width:650px; justify-content:center; z-index:10; margin-bottom:10px;">
      <button class="action-btn btn-red" style="flex:1; padding:12px; font-size:0.95rem; font-family:'Russo One'; box-shadow:0 0 25px #ff0000;" onclick="confirmHospitalEscapeClearance('${injuredWrestler.id}', '${rivalWrestler.id}')">
        🔥 SANCTION IMMEDIATE RETURN TO ROSTER ➔
      </button>
    </div>
  `;

  modal.style.display = 'flex';
};

window.confirmHospitalEscapeClearance = function(injuredId, rivalId) {
  clearInjury(injuredId);
  clearIceMomentumOverrides(injuredId);

  const w = getWrestlerById(injuredId);
  const rival = getWrestlerById(rivalId);

  if (typeof saveHistoryLog === 'function') {
    saveHistoryLog(`🚨 ROGUE RETURN: ${w.name.toUpperCase()} escaped the hospital ward and hunted down ${rival.name.toUpperCase()}!`, 'feud');
  }
  logShowFalloutEvent('return', `🚨 ROGUE RETURN: ${w.name.toUpperCase()} escaped the hospital ward hunting ${rival.name.toUpperCase()}!`);

  const modal = document.getElementById('hospitalEscapeCutsceneModal');
  if (modal) modal.style.display = 'none';

  if (typeof renderGrid === 'function') renderGrid();
};

// --- CUTSCENE 6: ROYAL RUMBLE ROAD TO WRESTLEMANIA STAREDOWN ---
let activeManiaCutsceneContext = null;

window.openManiaStaredownModal = function(rumbleWinner, champ) {
  if (!rumbleWinner || !champ) return;
  activeManiaCutsceneContext = { rumbleWinner, champ };

  const modal = document.getElementById('maniaStaredownModal');
  const winnerImg = document.getElementById('maniaRumbleVictorImg');
  const winnerName = document.getElementById('maniaRumbleVictorName');
  const champImg = document.getElementById('maniaChampImg');
  const champName = document.getElementById('maniaChampName');

  if (winnerName) winnerName.innerText = rumbleWinner.name.toUpperCase();
  if (champName) champName.innerText = champ.name.toUpperCase();

  if (winnerImg) {
    winnerImg.src = getWrestlerPosePath(rumbleWinner);
    winnerImg.onerror = () => { winnerImg.src = rumbleWinner.image; };
  }
  if (champImg) {
    champImg.src = getWrestlerPosePath(champ);
    champImg.onerror = () => { champImg.src = champ.image; };
  }

  if (modal) modal.style.display = 'flex';
  if (typeof playHeavyPyroBlast === 'function') playHeavyPyroBlast();
};

window.resolveManiaCutsceneChoice = function(choice) {
  const modal = document.getElementById('maniaStaredownModal');
  if (modal) modal.style.display = 'none';
  if (!activeManiaCutsceneContext) return;

  const { rumbleWinner, champ } = activeManiaCutsceneContext;

  if (choice === 'tunnel') {
    disbandAlliance(rumbleWinner.id);
    disbandAlliance(champ.id);

    let feuds = getRivalries().filter(f => {
      const involvesWinner = (f.w1 === rumbleWinner.id || f.w2 === rumbleWinner.id);
      const involvesChamp = (f.w1 === champ.id || f.w2 === champ.id);
      const isTheirDirectFeud = (involvesWinner && involvesChamp);
      return isTheirDirectFeud;
    });
    saveRivalries(feuds);

    clearIceMomentumOverrides(rumbleWinner.id);
    clearIceMomentumOverrides(champ.id);

    if (typeof addXP === 'function') addXP(100, "Tunnel Vision Booking");
    if (typeof saveHistoryLog === 'function') {
      saveHistoryLog(`⚡ TUNNEL VISION: ${rumbleWinner.name.toUpperCase()} & ${champ.name.toUpperCase()} severed outside ties to focus strictly on WrestleMania!`, 'match');
    }
    if (typeof renderGrid === 'function') renderGrid();
  } else if (choice === 'fasttrack') {
    if (typeof openMatchEngine === 'function') openMatchEngine();

    activeBookedMatch.showKey = "mania";
    activeBookedMatch.matchType = "Normal Match";
    activeBookedMatch.formatKey = "1v1";
    activeBookedMatch.formatCount = 2;
    activeBookedMatch.participants = [champ, rumbleWinner];
    activeBookedMatch.isTitleMatch = true;
    activeBookedMatch.titleCode = "whc";
    activeBookedMatch.titleName = "World Heavyweight Championship";
    activeBookedMatch.titleImg = "whc.png";
    pickedReferee = null;

    quickMatchQueue = [...activeBookedMatch.participants];
    if (typeof navGoToStep === 'function') navGoToStep(6);
    if (typeof updateTitleStakeBtnUI === 'function') updateTitleStakeBtnUI();
  }

  activeManiaCutsceneContext = null;
};

// --- CUTSCENE 7: MONEY IN THE BANK 24/7 PARANOIA LOCKER ROOM STALKING ---
let activeMitbStalkingContext = null;

window.openMitbStalkingModal = function(holder, champ) {
  if (!holder || !champ) return;
  activeMitbStalkingContext = { holder, champ };

  const modal = document.getElementById('mitbStalkingModal');
  const holderImg = document.getElementById('stalkingHolderImg');
  const holderName = document.getElementById('stalkingHolderName');
  const champImg = document.getElementById('stalkingChampImg');
  const champName = document.getElementById('stalkingChampName');

  if (holderName) holderName.innerText = holder.name.toUpperCase();
  if (champName) champName.innerText = champ.name.toUpperCase();

  if (holderImg) {
    holderImg.src = getWrestlerPosePath(holder);
    holderImg.onerror = () => { holderImg.src = holder.image; };
  }
  if (champImg) {
    champImg.src = getWrestlerPosePath(champ);
    champImg.onerror = () => { champImg.src = champ.image; };
  }

  if (modal) modal.style.display = 'flex';
  if (typeof playHeartbeatLoop === 'function') playHeartbeatLoop();
};

window.resolveMitbStalkingChoice = function(choice) {
  const modal = document.getElementById('mitbStalkingModal');
  if (modal) modal.style.display = 'none';
  if (typeof stopHeartbeatLoop === 'function') stopHeartbeatLoop();
  if (!activeMitbStalkingContext) return;

  const { holder, champ } = activeMitbStalkingContext;

  if (choice === 'rattle') {
    forceIceMomentum(champ.id);
    if (typeof saveHistoryLog === 'function') {
      saveHistoryLog(`💼 24/7 PARANOIA: ${holder.name.toUpperCase()} stalked ${champ.name.toUpperCase()} outside the dressing room! Champion rattled to ICE COLD.`, 'feud');
    }
    if (typeof renderGrid === 'function') renderGrid();
  } else if (choice === 'callshot') {
    if (typeof openMatchEngine === 'function') openMatchEngine();

    activeBookedMatch.showKey = "raw";
    activeBookedMatch.matchType = "Normal Match";
    activeBookedMatch.formatKey = "1v1";
    activeBookedMatch.formatCount = 2;
    activeBookedMatch.participants = [champ, holder];
    activeBookedMatch.isTitleMatch = true;
    activeBookedMatch.titleCode = "whc";
    activeBookedMatch.titleName = "World Heavyweight Championship";
    activeBookedMatch.titleImg = "whc.png";
    pickedReferee = null;

    quickMatchQueue = [...activeBookedMatch.participants];
    if (typeof navGoToStep === 'function') navGoToStep(6);
    if (typeof updateTitleStakeBtnUI === 'function') updateTitleStakeBtnUI();
  }

  activeMitbStalkingContext = null;
};

// --- CUTSCENE 8 (BATCH 6 ITEM 2): COMMENTARY DESK REDEMPTION CUTSCENE (8-LOSS STREAK) ---
let activeCommentaryRedemptionContender = null;

function resolveActiveSinglesChampionshipForContender(contenderId) {
  const holders = getTitleHolders();
  const candidates = [
    { code: 'whc', name: 'World Heavyweight Championship', img: 'whc.png', holderId: holders.whc },
    { code: 'ic', name: 'Intercontinental Championship', img: 'ic_title.png', holderId: holders.ic },
    { code: 'hardcore', name: 'Hardcore Championship', img: 'hardcore.png', holderId: holders.hardcore }
  ];

  for (const c of candidates) {
    if (c.holderId && c.holderId !== contenderId) {
      const champObj = getWrestlerById(c.holderId);
      if (champObj && !getInjuryRecord(champObj.id)) {
        return { ...c, champObj };
      }
    }
  }

  // Fallback if all singles titles are vacant: put WHC on the line vs an active opponent
  const allW = getUnlockedWrestlers().filter(w => w.id !== contenderId && !getInjuryRecord(w.id));
  const fallbackOpponent = allW[Math.floor(Math.random() * allW.length)] || allW[0] || null;
  return {
    code: 'whc',
    name: 'World Heavyweight Championship',
    img: 'whc.png',
    holderId: fallbackOpponent ? fallbackOpponent.id : null,
    champObj: fallbackOpponent
  };
}

window.checkEightLossRedemptionTrigger = function(loserList) {
  if (!Array.isArray(loserList) || loserList.length === 0) return false;
  const titles = getTitleHolders();
  const activeChamps = [titles.whc, titles.ic, titles.hardcore].filter(Boolean);
  let seenMap = {};
  try {
    seenMap = JSON.parse(localStorage.getItem('ewf_eight_loss_redemption_seen') || '{}');
  } catch (e) { seenMap = {}; }

  for (const loser of loserList) {
    if (!loser || !loser.id) continue;
    if (getInjuryRecord(loser.id)) continue;
    if (activeChamps.includes(loser.id)) continue;

    const streak = getSuperstarConsecutiveLosses(loser.id);
    if (streak < 8) {
      if (seenMap[loser.id]) {
        delete seenMap[loser.id];
        localStorage.setItem('ewf_eight_loss_redemption_seen', JSON.stringify(seenMap));
      }
      continue;
    }

    if (streak === 8 && !seenMap[loser.id]) {
      seenMap[loser.id] = true;
      localStorage.setItem('ewf_eight_loss_redemption_seen', JSON.stringify(seenMap));

      if (window.activeShowSession) {
        window.pendingEightLossRedemption = loser;
        logShowFalloutEvent('cutscene', `🎙️ BROADCAST DESK APPEAL: Bret Hart & Happy Corbin debated ${loser.name.toUpperCase()}'s 0-8 slump — GM Ellis granted a #1 Contender Title Shot Lock!`);
        return true;
      }

      window.openCommentaryRedemptionModal(loser);
      return true;
    }
  }
  return false;
};

window.openCommentaryRedemptionModal = function(superstar) {
  if (!superstar) return;
  activeCommentaryRedemptionContender = superstar;

  if (typeof stopBGMForAction === 'function') stopBGMForAction();

  // Play victory.mp3 at 0.2 volume for broadcast atmosphere
  try {
    if (window.activeRedemptionVictoryAudio) {
      window.activeRedemptionVictoryAudio.pause();
      window.activeRedemptionVictoryAudio.currentTime = 0;
    }
    const vic = new Audio('victory.mp3');
    vic.volume = 0.2;
    vic.loop = true;
    window.activeRedemptionVictoryAudio = vic;
    vic.play().catch(() => {});
  } catch (e) {}

  let modal = document.getElementById('commentaryRedemptionModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'commentaryRedemptionModal';
    document.body.appendChild(modal);
  }

  modal.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #000 url('commentary_desk_bg.png') no-repeat center center / cover;
    box-sizing: border-box;
    overflow: hidden;
  `;

  const starNameUpper = superstar.name.toUpperCase();
  const titlePack = resolveActiveSinglesChampionshipForContender(superstar.id);
  const targetTitleLabel = titlePack ? titlePack.name.toUpperCase() : 'CHAMPIONSHIP GOLD';

  modal.innerHTML = `
    <!-- TOP BROADCAST CHYRON (TOP ~12%) -->
    <div style="
      width: 100%;
      padding: 14px 22px;
      background: linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 75%, rgba(0,0,0,0) 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      z-index: 10;
      box-sizing: border-box;
    ">
      <div style="font-family:'Russo One', sans-serif; font-size:clamp(0.95rem, 2vw, 1.35rem); color:#ffd700; letter-spacing:1.5px; text-shadow:0 2px 10px #000;">
        🎙️ EWF BROADCAST DESK // BRET HART & HAPPY CORBIN 🎙️
      </div>
      <div style="font-family:'Russo One', sans-serif; font-size:0.78rem; color:#ff4d4d; letter-spacing:1px; margin-top:3px; text-shadow:0 2px 6px #000;">
        ⚠️ 8-MATCH LOSING STREAK ALERT: ${starNameUpper} (0–8 SLUMP)
      </div>
    </div>

    <!-- UNOBSTRUCTED CENTER STAGE (~68%) SO FULL-SCREEN ARTWORK SHINES -->
    <div style="flex: 1; pointer-events: none;"></div>

    <!-- DARK BOTTOM DIALOGUE & 3 ACTION BUTTONS (~20%) -->
    <div style="
      width: 100%;
      padding: 18px 20px 22px 20px;
      background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.88) 25%, rgba(5,7,14,0.98) 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      z-index: 10;
      box-sizing: border-box;
    ">
      <div style="
        max-width: 920px;
        background: rgba(10, 12, 22, 0.88);
        border: 1.5px solid rgba(255, 215, 0, 0.55);
        border-radius: 6px;
        padding: 10px 16px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.9);
      ">
        <div style="font-family:'Russo One', sans-serif; font-size:clamp(0.82rem, 1.5vw, 1rem); color:#ffffff; line-height:1.4;">
          <span style="color:#ff66b2;">BRET HART:</span> "Corbin, you can laugh at ${starNameUpper}'s 0–8 skid all night—but I just spoke with <span style="color:#ffd700;">GM ELLIS</span> in the back, and he's officially granting <span style="color:#00e5ff;">${starNameUpper}</span> a <span style="color:#00ff66;">#1 CONTENDER TITLE SHOT LOCK</span> (${targetTitleLabel})!"
        </div>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:10px; width:100%; max-width:960px; justify-content:center;">
        <button type="button" class="action-btn btn-red" style="flex:1 1 250px; padding:12px 14px; font-size:0.88rem; font-family:'Russo One'; box-shadow:0 0 22px rgba(229,9,20,0.85);" onclick="resolveCommentaryRedemptionChoice('now')">
          ⚔️ BOOK TITLE MATCH NOW ➔
        </button>
        <button type="button" class="action-btn btn-gold" style="flex:1 1 250px; padding:12px 14px; font-size:0.88rem; font-family:'Russo One'; box-shadow:0 0 20px rgba(255,215,0,0.7);" onclick="resolveCommentaryRedemptionChoice('next_card')">
          📋 ADD TO NEXT MATCH CARD ➔
        </button>
        <button type="button" class="action-btn btn-blue" style="flex:1 1 230px; padding:12px 14px; font-size:0.85rem; font-family:'Russo One'; box-shadow:0 0 16px rgba(0,112,243,0.65);" onclick="resolveCommentaryRedemptionChoice('wait')">
          ⏳ WAIT (KEEP TITLE LOCK)
        </button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
};

window.resolveCommentaryRedemptionChoice = function(choice) {
  if (window.activeRedemptionVictoryAudio) {
    try {
      window.activeRedemptionVictoryAudio.pause();
      window.activeRedemptionVictoryAudio.currentTime = 0;
    } catch (e) {}
    window.activeRedemptionVictoryAudio = null;
  }

  const modal = document.getElementById('commentaryRedemptionModal');
  if (modal) modal.style.display = 'none';

  const contender = activeCommentaryRedemptionContender;
  activeCommentaryRedemptionContender = null;
  if (!contender) {
    if (typeof resumeBGM === 'function') resumeBGM();
    return;
  }

  const titlePack = resolveActiveSinglesChampionshipForContender(contender.id);
  const champ = titlePack ? titlePack.champObj : null;

  if (choice === 'now' && champ) {
    clearContenderTitleShotLock(contender.id);

    if (typeof saveHistoryLog === 'function') {
      saveHistoryLog(`🎙️ GM ELLIS REDEMPTION SHOT: ${contender.name.toUpperCase()} cashed in their #1 Contender Lock against ${champ.name.toUpperCase()} for the ${titlePack.name}!`, 'booking');
    }

    if (typeof openMatchEngine === 'function') openMatchEngine();
    activeBookedMatch.showKey = "raw";
    activeBookedMatch.matchType = "Normal Match";
    activeBookedMatch.formatKey = "1v1";
    activeBookedMatch.formatCount = 2;
    activeBookedMatch.participants = [champ, contender];
    activeBookedMatch.isTitleMatch = true;
    activeBookedMatch.titleCode = titlePack.code;
    activeBookedMatch.titleName = titlePack.name;
    activeBookedMatch.titleImg = titlePack.img;
    pickedReferee = null;

    quickMatchQueue = [...activeBookedMatch.participants];
    if (typeof navGoToStep === 'function') navGoToStep(6);
    if (typeof updateTitleStakeBtnUI === 'function') updateTitleStakeBtnUI();
    return;
  }

  if (choice === 'next_card' && champ) {
    clearContenderTitleShotLock(contender.id);

    const scheduledMatch = {
      w1: champ,
      w2: contender,
      matchType: "Normal Match",
      formatKey: "1v1",
      isTitleMatch: true,
      titleCode: titlePack.code,
      titleName: titlePack.name,
      titleImg: titlePack.img,
      isCareerMatch: false,
      feudStake: `⭐ #1 CONTENDER LOCK (${titlePack.name.toUpperCase()})`,
      originText: `🎙️ GM ELLIS #1 CONTENDER LOCK: ${contender.name.toUpperCase()} vs ${champ.name.toUpperCase()}`
    };
    localStorage.setItem('ewf_scheduled_story_match', JSON.stringify(scheduledMatch));

    if (typeof saveHistoryLog === 'function') {
      saveHistoryLog(`📋 #1 CONTENDER LOCK BOOKED: ${contender.name.toUpperCase()} vs ${champ.name.toUpperCase()} (${titlePack.name}) locked onto the Next Broadcast Card!`, 'booking');
    }

    alert(`📋 TITLE SHOT ADDED TO NEXT MATCH CARD!\n\n${contender.name.toUpperCase()} vs ${champ.name.toUpperCase()} for the ${titlePack.name.toUpperCase()} is locked in for your next broadcast!`);
    if (typeof renderGrid === 'function') renderGrid();
    if (typeof resumeBGM === 'function') resumeBGM();
    return;
  }

  // Choice === 'wait': Keep active #1 Contender Title Shot Lock badge on the superstar
  grantContenderTitleShotLock(contender.id);
  if (typeof saveHistoryLog === 'function') {
    saveHistoryLog(`⭐ #1 CONTENDER LOCK GRANTED: Bret Hart & GM Ellis awarded ${contender.name.toUpperCase()} an official #1 Contender Title Shot Lock after an 8-loss streak!`, 'booking');
  }
  alert(`⭐ #1 CONTENDER TITLE SHOT LOCK ACTIVE!\n\n${contender.name.toUpperCase()} now holds an official #1 Contender Title Shot Lock on the roster until their championship match takes place.`);
  if (typeof renderGrid === 'function') renderGrid();
  if (typeof resumeBGM === 'function') resumeBGM();
};

// Window Exports for Module 3 Part 1
window.getInjuries = getInjuries;
window.saveInjuries = saveInjuries;
window.getInjuryRecord = getInjuryRecord;
window.replaceInjuredWrestlerInActiveShow = replaceInjuredWrestlerInActiveShow;
window.inflictInjury = inflictInjury;
window.processSlambulanceCasualty = processSlambulanceCasualty;
window.clearInjury = clearInjury;
window.tickDownInjuriesAfterMatch = tickDownInjuriesAfterMatch;
window.getBanishedWrestlerIds = getBanishedWrestlerIds;
window.getTitleHolders = getTitleHolders;
window.setTitleHolders = setTitleHolders;
window.getAlliances = getAlliances;
window.saveAlliance = saveAlliance;
window.disbandAlliance = disbandAlliance;
window.areInSameAlliance = areInSameAlliance;
window.getMitbHolder = getMitbHolder;
window.setMitbHolder = setMitbHolder;
window.getKotrHolder = getKotrHolder;
window.setKotrHolder = setKotrHolder;
window.getStoredWrestlers = getStoredWrestlers;
window.saveCustomWrestler = saveCustomWrestler;
window.deleteWrestler = deleteWrestler;
window.getUnlockedWrestlers = getUnlockedWrestlers;
window.getWrestlerById = getWrestlerById;
window.getWrestlerPosePath = getWrestlerPosePath;
window.getRivalries = getRivalries;
window.saveRivalries = saveRivalries;
window.addOrUpdateRivalry = addOrUpdateRivalry;
window.removeRivalry = removeRivalry;
window.getMandatoryLocks = getMandatoryLocks;
window.clearMandatoryLock = clearMandatoryLock;
window.getContenderTitleShotLocks = getContenderTitleShotLocks;
window.grantContenderTitleShotLock = grantContenderTitleShotLock;
window.clearContenderTitleShotLock = clearContenderTitleShotLock;
window.promptResetUniverse = promptResetUniverse;
window.getWrestlerMomentum = getWrestlerMomentum;
window.getSuperstarConsecutiveLosses = getSuperstarConsecutiveLosses;
window.forceIceMomentum = forceIceMomentum;
window.clearIceMomentumOverrides = clearIceMomentumOverrides;
window.calculateMomentum = calculateMomentum;
window.getHeadToHeadRecord = getHeadToHeadRecord;
window.getTopContenderId = getTopContenderId;
window.isHofInductee = isHofInductee;
window.logPromoPlay = logPromoPlay;
window.exportUniverseBackup = exportUniverseBackup;
window.triggerRestoreUniverse = triggerRestoreUniverse;
window.ensureUniverseBackupUI = ensureUniverseBackupUI;
window.showUniverseBulletin = showUniverseBulletin;
window.closeUniverseBulletin = closeUniverseBulletin;
window.openUniverseModal = openUniverseModal;
window.switchUniverseTab = switchUniverseTab;
window.renderFeudsListUI = renderFeudsListUI;
window.igniteManualFeud = igniteManualFeud;
window.renderUniverseInjuriesTab = renderUniverseInjuriesTab;
window.closeUniverseModal = closeUniverseModal;
window.saveUniverseModal = saveUniverseModal;
window.canTriggerCareerContract = canTriggerCareerContract;
window.openCareerContractModal = openCareerContractModal;
window.executeCareerContractSign = executeCareerContractSign;
window.executeCareerContractSanction = executeCareerContractSanction;
window.executeCareerContractRefuse = executeCareerContractRefuse;
window.checkBloodFeudActivation = checkBloodFeudActivation;
window.confirmAlertSettleNow = confirmAlertSettleNow;
window.closeBloodFeudAlertModal = closeBloodFeudAlertModal;
window.bookBloodFeudBlowoff = bookBloodFeudBlowoff;
window.openBloodFeudShowdown = openBloodFeudShowdown;
window.sanctionBloodFeudForNextBroadcast = sanctionBloodFeudForNextBroadcast;
window.closeBloodFeudOverlay = closeBloodFeudOverlay;
window.confirmSettleBloodFeud = confirmSettleBloodFeud;
window.showFeudSettlementScreen = showFeudSettlementScreen;
window.closeFeudSettlementScreen = closeFeudSettlementScreen;
window.proceedBloodFeudToMatch = proceedBloodFeudToMatch;
window.getTagTeamStreakKey = getTagTeamStreakKey;
window.recordTagTeamResult = recordTagTeamResult;
window.openMediaScrumModal = openMediaScrumModal;
window.resolveMediaScrumSolidarity = resolveMediaScrumSolidarity;
window.resolveMediaScrumPipebomb = resolveMediaScrumPipebomb;
window.checkEmergencyBoardroomBanner = checkEmergencyBoardroomBanner;
window.showBoardroomDecreePrompt = showBoardroomDecreePrompt;
window.openBoardroomDecreeModal = openBoardroomDecreeModal;
window.executeBoardroomStripTitle = executeBoardroomStripTitle;
window.executeBoardroomGrantGrace = executeBoardroomGrantGrace;
window.checkMidnightSyndicateTrigger = checkMidnightSyndicateTrigger;
window.openLimoSummitModal = openLimoSummitModal;
window.confirmLimoSummitAlliance = confirmLimoSummitAlliance;
window.closeLimoSummitModal = closeLimoSummitModal;
window.openHospitalEscapeModal = openHospitalEscapeModal;
window.confirmHospitalEscapeClearance = confirmHospitalEscapeClearance;
window.openManiaStaredownModal = openManiaStaredownModal;
window.resolveManiaCutsceneChoice = resolveManiaCutsceneChoice;
window.openMitbStalkingModal = openMitbStalkingModal;
window.resolveMitbStalkingChoice = resolveMitbStalkingChoice;
window.checkEightLossRedemptionTrigger = checkEightLossRedemptionTrigger;
window.openCommentaryRedemptionModal = openCommentaryRedemptionModal;
window.resolveCommentaryRedemptionChoice = resolveCommentaryRedemptionChoice;
/* ==========================================================================
   ELLIS'S MAIN EVENT (EWF UNIVERSE) - MODULAR ENGINE
   MODULE 3 OF 5: js/3-storylines-feuds.js (PART 2 OF 2)
   Storylines Catalog, Typewriter Engine, Roster Grid & Global Exports
   ========================================================================== */

/* --------------------------------------------------------------------------
   7. COMPLETE 79 STORYLINES REPERTOIRE & CINEMATIC TYPEWRITER ENGINE
   -------------------------------------------------------------------------- */
const storylines = [
  // --- BASELINE INJURY FEUDS (1, 26-30) ---
  { id: 1, image: "story_1.png", text: "EWF CAMERAS CAUGHT {Superstar A} AMBUSHING {Superstar B} IN THE PARKING GARAGE WITH A LEAD PIPE!", type: "injury_feud", matchMatch: "Ambulance Match", formatKey: "1v1", formatCount: 2, logText: "🚨 {Superstar A} ambushed {Superstar B} with a lead pipe!" },
  { id: 26, image: "story_26.png", text: "CAMERAS CAUGHT {Superstar A} TRAPPING {Superstar B}'S ANKLE INSIDE A STEEL CHAIR AND CRUSHING IT WITH A FLYING STOMP!", type: "injury_feud", matchMatch: "No Disqualification", formatKey: "1v1", formatCount: 2, logText: "🩹 {Superstar A} crushed {Superstar B}'s ankle in a steel chair!" },
  { id: 27, image: "story_27.png", text: "{Superstar A} DRAGGED {Superstar B} TO RINGSIDE, PULLED BACK THE PADDING, AND DROPPED THEM DIRECTLY ONTO THE EXPOSED CONCRETE!", type: "injury_feud", matchMatch: "Last Man Standing", formatKey: "1v1", formatCount: 2, logText: "🩹 {Superstar A} dropped {Superstar B}'s onto raw concrete!" },
  { id: 28, image: "story_28.png", text: "{Superstar A} BETRAYED {Superstar B} DURING A LIVE TALK SHOW SEGMENT AND HURLED THEM FACE-FIRST THROUGH A PLATE-GLASS WINDOW!", type: "injury_feud", matchMatch: "Falls Count Anywhere", formatKey: "1v1", formatCount: 2, logText: "🩹 {Superstar A} threw {Superstar B} through a plate-glass window!" },
  { id: 29, image: "story_29.png", text: "{Superstar A} OPERATED A FORKLIFT IN THE LOADING DOCK AND DROPPED A THREE-TON EQUIPMENT CRATE STRAIGHT ONTO {Superstar B}!", type: "injury_feud", matchMatch: "Ambulance Match", formatKey: "1v1", formatCount: 2, logText: "🚑 {Superstar A} crushed {Superstar B} with an equipment crate!" },
  { id: 30, image: "story_30.png", text: "{Superstar A} CHOKESLAMMED {Superstar B} STRAIGHT THROUGH THE ENTRANCE STAGE, TRIGGERING A MASSIVE ELECTRICAL EXPLOSION!", type: "injury_feud", matchMatch: "TLC Match", formatKey: "1v1", formatCount: 2, logText: "⚡ {Superstar A} chokeslammed {Superstar B} through the stage floor!" },

  // --- BASELINE FEUDS (2-10, 31-35) ---
  { id: 2, image: "story_2.png", text: "{Superstar A} SNEAKED INTO THE LOCKER ROOM AND STOLE {Superstar B}'S CHAMPIONSHIP BELT!", type: "feud", matchMatch: "Normal Match", isTitle: true, formatKey: "1v1", formatCount: 2, logText: "🏆 {Superstar A} stole {Superstar B}'s title belt!" },
  { id: 3, image: "story_3.png", text: "THE CONTRACT SIGNING DEVOLVED INTO CHAOS! {Superstar A} POWERBOMBED {Superstar B} THROUGH THE OAK TABLE!", type: "feud", matchMatch: "Tables Match", formatKey: "1v1", formatCount: 2, logText: "🪵 {Superstar A} put {Superstar B} through a table at the contract signing!" },
  { id: 4, image: "story_4.png", text: "{Superstar A} WALKED OUT ONTO THE STAGE AND BLASTED THEIR MUSIC, COSTING {Superstar B} A CRUCIAL WIN!", type: "feud", matchMatch: "Normal Match", formatKey: "1v1", formatCount: 2, logText: "🎶 {Superstar A} hijacked the stage, costing {Superstar B} a win!" },
  { id: 5, image: "story_5.png", text: "THE REFEREE WAS COMPROMISED! {Superstar A} WAS SEEN SLIPPING AN ENVELOPE TO TONIGHT'S SPECIAL OFFICIAL!", type: "feud", matchMatch: "Special Guest Referee", formatKey: "1v1", formatCount: 2, logText: "🦓 {Superstar A} compromised the referee against {Superstar B}!" },
  { id: 6, image: "story_6.png", text: "A HEATED BACKSTAGE INTERVIEW EXPOSED REAL BAD BLOOD! {Superstar A} AND {Superstar B} BRAWLED THROUGH THE ARENA!", type: "feud", matchMatch: "Falls Count Anywhere", formatKey: "1v1", formatCount: 2, logText: "🎙️ {Superstar A} and {Superstar B} brawled through the arena hallway!" },
  { id: 7, image: "story_7.png", text: "{Superstar A} PADLOCKED {Superstar B} INSIDE THEIR DRESSING ROOM MINUTES BEFORE SHOWTIME!", type: "feud", matchMatch: "Last Man Standing", formatKey: "1v1", formatCount: 2, logText: "🔒 {Superstar A} padlocked {Superstar B} inside their dressing room!" },
  { id: 8, image: "story_8.png", text: "PARTNERSHIP SHATTERED! {Superstar A} ACCIDENTALLY LEVELED {Superstar B} WITH A CLOTHESLINE DURING THEIR MATCH!", type: "feud", matchMatch: "2 out of 3 Falls", dissolveAlliance: true, formatKey: "1v1", formatCount: 2, logText: "💔 {Superstar A} accidentally clotheslined {Superstar B}, ending their partnership!" },
  { id: 9, image: "story_9.png", text: "{Superstar A} ISSUED A LIVE OPEN CHALLENGE IN THE RING... AND {Superstar B}'S MUSIC HIT THE ARENA!", type: "feud", matchMatch: "Normal Match", formatKey: "1v1", formatCount: 2, logText: "🎤 {Superstar A}'s open challenge was answered by {Superstar B}!" },
  { id: 10, image: "story_10.png", text: "NO ESCAPE! THE ENTIRE ROSTER SURROUNDED THE RING TO PREVENT {Superstar A} AND {Superstar B} FROM RUNNING!", type: "feud", matchMatch: "Lumberjack Match", formatKey: "1v1", formatCount: 2, logText: "🪵 {Superstar A} and {Superstar B} are trapped in a Lumberjack Match!" },
  { id: 31, image: "story_31.png", text: "{Superstar A} SNATCHED THE HEAVY STEEL RING BELL OFF THE TIMEKEEPER'S TABLE AND LEVELLED {Superstar B}!", type: "feud", matchMatch: "Submission Match", formatKey: "1v1", formatCount: 2, logText: "🔔 {Superstar A} struck {Superstar B} with the heavy timekeeper bell!" },
  { id: 32, image: "story_32.png", text: "{Superstar A} SLICED THROUGH THE RING CANVAS FROM UNDERNEATH AND DRAGGED {Superstar B} INTO THE DARK VOID!", type: "feud", matchMatch: "No Disqualification", formatKey: "1v1", formatCount: 2, logText: "🕳️ {Superstar A} dragged {Superstar B} under the ring canvas!" },
  { id: 33, image: "story_33.png", text: "{Superstar A} DROVE A MONSTER TRUCK THROUGH THE ARENA PARKING LOT AND COMPLETELY FLATTENED {Superstar B}'S RENTAL CAR!", type: "feud", matchMatch: "Falls Count Anywhere", formatKey: "1v1", formatCount: 2, logText: "🚗 {Superstar A} crushed {Superstar B}'s rental car with a monster truck!" },
  { id: 34, image: "story_34.png", text: "{Superstar A} DISRESPECTFULLY TORE OFF {Superstar B}'S ICONIC RING GEAR AND WAVED IT FROM ATOP THE BROADCAST TABLE!", type: "feud", matchMatch: "2 out of 3 Falls", formatKey: "1v1", formatCount: 2, logText: "🎭 {Superstar A} ripped away and desecrated {Superstar B}'s ring gear!" },
  { id: 35, image: "story_35.png", text: "{Superstar A} AND {Superstar B} BRAWLED TO THE UPPER TIER BEFORE {Superstar A} KNOCKED {Superstar B} OFF THE SCAFFOLDING!", type: "feud", matchMatch: "Ladder Match", formatKey: "1v1", formatCount: 2, logText: "🪜 {Superstar A} hurled {Superstar B} off the arena scaffolding!" },

  // --- BASELINE ALLIANCES (11-15, 36-40) ---
  { id: 11, image: "story_11.png", text: "{Superstar A} WAS GETTING DOUBLE-TEAMED WHEN {Superstar B} CHARGED DOWN THE RAMP WITH A CHAIR TO MAKE THE SAVE!", type: "alliance", matchMatch: "Normal Match", formatKey: "tag", formatCount: 4, logText: "🛡️ {Superstar B} saved {Superstar A} with a steel chair, forming an alliance!" },
  { id: 12, image: "story_12.png", text: "AFTER A HARD-HITTING CLASSIC, {Superstar A} AND {Superstar B} PULLED EACH OTHER OFF THE CANVAS AND SHOOK HANDS!", type: "alliance_only", logText: "🤝 {Superstar A} and {Superstar B} formed a mutual respect tag alliance!" },
  { id: 13, image: "story_13.png", text: "{Superstar A} APPROACHED {Superstar B} BACKSTAGE WITH A PROPOSITION TO TAKE OVER THE EWF DIVISION TOGETHER!", type: "alliance_only", logText: "💼 {Superstar A} and {Superstar B} signed a locker room alliance pact!" },
  { id: 14, image: "story_14.png", text: "FORCED TO TEAM UP BY THE GM, {Superstar A} AND {Superstar B} HIT A SIMULTANEOUS FINISHER TO SCORE THE WIN!", type: "alliance", matchMatch: "Normal Match", formatKey: "tag", formatCount: 4, logText: "⚡ {Superstar A} and {Superstar B} won their tag team trial and united!" },
  { id: 15, image: "story_15.png", text: "{Superstar A} SPRANG INTO ACTION AND THWARTED A SURPRISE MONEY IN THE BANK CASH-IN ATTACK ON {Superstar B}!", type: "alliance_only", logText: "🚨 {Superstar A} thwarted a surprise MITB cash-in on {Superstar B}!" },
  { id: 36, image: "story_36.png", text: "{Superstar A} AND {Superstar B} MET CENTER-RING THROUGH THE HAZE AND LOCKED FISTS IN A PACT TO TERRORIZE THE DIVISION!", type: "alliance_only", logText: "👊 {Superstar A} and {Superstar B} united in a locked-fist dominance pact!" },
  { id: 37, image: "story_37.png", text: "{Superstar A} AND {Superstar B} LAID OUT EVERY OFFICIAL AND SUPERSTAR IN SIGHT TO SEIZE TOTAL CONTROL OF THE BROADCAST!", type: "alliance", matchMatch: "Normal Match", formatKey: "tag", formatCount: 4, logText: "⚡ {Superstar A} and {Superstar B} executed a broadcast hostile takeover!" },
  { id: 38, image: "story_38.png", text: "{Superstar A} AND {Superstar B} WERE TRADING PUNCHES IN A LOCAL TAVERN BEFORE TEAMING UP TO CLEAR OUT THE BOUNCERS!", type: "alliance_only", logText: "🍻 {Superstar A} and {Superstar B} bonded in a tavern brawl and formed a team!" },
  { id: 39, image: "story_39.png", text: "{Superstar A} TOOK THE MICROPHONE, ANOINTED {Superstar B} AS THE HEIR APPARENT, AND FORMED A DOMINANT DYNASTY!", type: "alliance_only", logText: "👑 {Superstar A} anointed {Superstar B} as protégé to build a new dynasty!" },
  { id: 40, image: "story_40.png", text: "{Superstar A} WAS BEING SWARMED BY GOONS UNTIL THE LIGHTS CUT OUT AND {Superstar B} APPEARED TO DESTROY THEM!", type: "alliance", matchMatch: "Normal Match", formatKey: "tag", formatCount: 4, logText: "🔥 {Superstar A} and {Superstar B} cleared the ramp side-by-side in destruction!" },

  // --- BASELINE FLAVOR (16-25, 41-45) ---
  { id: 16, image: "story_16.png", text: "{Superstar A} SAT CROSS-LEGGED IN THE RING AND DELIVERED AN UNSCRIPTED, SCATHING TIRADE AGAINST {Superstar B}!", type: "flavor", logText: "🎤 {Superstar A} dropped an unscripted pipebomb on {Superstar B}!" },
  { id: 17, image: "story_17.png", text: "SECURITY AND ROAD AGENTS HAD TO PHYSICALLY SEPARATE {Superstar A} AND {Superstar B} IN THE GORILLA POSITION!", type: "flavor", logText: "📹 {Superstar A} and {Superstar B} had a tense standoff in the Gorilla Position!" },
  { id: 18, image: "story_18.png", text: "PRESS CONFERENCE CHAOS! {Superstar A} FLIPPED THE MEDIA TABLE AND LUNGED ACROSS THE DAIS AT {Superstar B}!", type: "flavor", logText: "🎙️ {Superstar A} flipped the media table attacking {Superstar B}!" },
  { id: 19, image: "story_19.png", text: "ARENA SECURITY FOOTAGE REVEALED THE MASKED ASSAILANT HAUNTING {Superstar B} WAS {Superstar A} ALL ALONG!", type: "flavor", logText: "👺 Security cameras unmasked {Superstar A} as the secret assailant!" },
  { id: 20, image: "story_20.png", text: "{Superstar A} VANDALIZED {Superstar B}'S PRIVATE DRESSING ROOM AND SPRAY-PAINTED AN OMINOUS WARNING!", type: "flavor", logText: "🎨 {Superstar A} vandalized {Superstar B}'s dressing room!" },
  { id: 21, image: "story_21.png", text: "{Superstar A} CRASHED {Superstar B}'S SIT-DOWN INTERVIEW AND TOSSED A GLASS OF WATER STRAIGHT INTO THEIR FACE!", type: "flavor", logText: "🍸 {Superstar A} threw a drink into {Superstar B}'s face in the green room!" },
  { id: 22, image: "story_22.png", text: "{Superstar A} EMERGED ONTO THE STAGE, STANDING MOTIONLESS IN THE SHADOWS AND GLARING SILENTLY AT {Superstar B}!", type: "flavor", logText: "⚡ {Superstar A} stared down {Superstar B} from the entrance ramp shadows!" },
  { id: 23, image: "story_23.png", text: "CAMERAS CAPTURED {Superstar A} SPEEDING THROUGH THE LOADING DOCK, TRAPPING {Superstar B} AGAINST A PRODUCTION TRUCK!", type: "flavor", logText: "🚗 {Superstar A} trapped {Superstar B} with a vehicle in the loading dock!" },
  { id: 24, image: "story_24.png", text: "{Superstar A} DRAMATICALLY TORE UP THE PROPOSED CONTRACT ON LIVE TV AND HUFFED THE MIC AT {Superstar B}!", type: "flavor", logText: "📜 {Superstar A} tore up the contract and threw the mic at {Superstar B}!" },
  { id: 25, image: "story_25.png", text: "LEAKED CELL PHONE FOOTAGE SHOWED {Superstar A} AND {Superstar B} IN A WILD LATE-NIGHT HOTEL LOBBY BRAWL!", type: "flavor", logText: "🏨 Leaked footage revealed {Superstar A} and {Superstar B} brawling in the hotel lobby!" },
  { id: 41, image: "story_41.png", text: "{Superstar A} DROVE A BEVERAGE TANKER TRUCK INTO THE ARENA AND DRENCHED {Superstar B} AND THE VIP SUITE WITH A HOSE!", type: "flavor", logText: "🥛 {Superstar A} hosed down {Superstar B} with a beverage truck!" },
  { id: 42, image: "story_42.png", text: "{Superstar A} DISGUISED THEMSELVES AS AN ORDERLY IN A HOSPITAL AND CLOBBERED {Superstar B} WITH A STAINLESS-STEEL BEDPAN!", type: "flavor", logText: "🏥 {Superstar A} hit {Superstar B} with a bedpan in a medical center!" },
  { id: 43, image: "story_43.png", text: "{Superstar A} PRESENTED {Superstar B} WITH A CUSTOM GIFT BOX ON LIVE TV, ONLY FOR IT TO REVEAL A CRUEL DECEPTION!", type: "flavor", logText: "🎁 {Superstar A} turned on {Superstar B} during a live gift presentation!" },
  { id: 44, image: "story_44.png", text: "{Superstar A} STOLE {Superstar B}'S CHAMPIONSHIP TROPHY AND THREW IT OFF A SUSPENSION BRIDGE INTO THE RIVER!", type: "flavor", logText: "🌉 {Superstar A} threw {Superstar B}'s trophy off a bridge!" },
  { id: 45, image: "story_45.png", text: "{Superstar A} AND {Superstar B} COLLIDED IN A CONTEST OF BRUTE STRENGTH THAT CAVED IN THE CANVAS AND BROKE THE TOP ROPE!", type: "flavor", logText: "💥 {Superstar A} and {Superstar B} snapped the ring ropes in a collision!" },

  // --- NEW FEUDS (46-51) ---
  { id: 46, image: "story_46.png", text: "CLEANUP ON AISLE FOUR! {Superstar A} TRACKED {Superstar B} OUTSIDE THE ARENA INTO A LOCAL SUPERMARKET, TURNING THE GROCERY AISLES INTO A WILD FOOD BRAWL!", type: "feud", matchMatch: "Falls Count Anywhere", formatKey: "1v1", formatCount: 2, logText: "🛒 {Superstar A} brawled with {Superstar B} through a local supermarket!" },
  { id: 47, image: "story_47.png", text: "{Superstar A} BURGLARIZED {Superstar B}'S LOCKER ROOM, STOLE THEIR SACRED PERSONAL TROPHY, AND THREATENED TO DESTROY IT IN FRONT OF THE WORLD!", type: "feud", matchMatch: "No Disqualification", formatKey: "1v1", formatCount: 2, logText: "⚱️ {Superstar A} stole {Superstar B}'s sacred personal relic!" },
  { id: 48, image: "story_48.png", text: "EL CABALLERO STRIKES! {Superstar A} BLINDSIDED {Superstar B} DURING A LIVE TALK SHOW AND SHATTERED AN ACOUSTIC GUITAR STRAIGHT OVER THEIR HEAD!", type: "feud", matchMatch: "Tables Match", formatKey: "1v1", formatCount: 2, logText: "🎸 {Superstar A} smashed an acoustic guitar over {Superstar B}!" },
  { id: 49, image: "story_49.png", text: "{Superstar A} CORNERED {Superstar B} IN THE RING, PULLED A SET OF HEAVY BARBER CLIPPERS OUT OF A DUFFEL BAG, AND THREATENED TO SHAVE THEM BALD!", type: "feud", matchMatch: "Submission Match", formatKey: "1v1", formatCount: 2, logText: "✂️ {Superstar A} threatened to shave {Superstar B}'s head bald!" },
  { id: 50, image: "story_50.png", text: "AN OMINOUS CHILL ENGULFED THE ARENA! {Superstar A} ROLLED A FULL-SIZED WOODEN CASKET TO RINGSIDE WITH {Superstar B}'S NAME PAINTED ON THE LID!", type: "feud", matchMatch: "Last Man Standing", formatKey: "1v1", formatCount: 2, logText: "⚰️ {Superstar A} rolled an ominous personalized casket out for {Superstar B}!" },
  { id: 51, image: "story_51.png", text: "{Superstar A} PULLED A 10-POUND STEEL SLEDGEHAMMER FROM UNDERNEATH THE RING APRON AND DARED {Superstar B} TO STEP INSIDE THE ROPES!", type: "feud", matchMatch: "No Disqualification", formatKey: "1v1", formatCount: 2, logText: "🔨 {Superstar A} pulled out a sledgehammer to threaten {Superstar B}!" },

  // --- NEW INJURY FEUDS (52-57) ---
  { id: 52, image: "story_52.png", text: "{Superstar A} TRAPPED {Superstar B}'S HEAD FLAT ACROSS THE STEEL RING STEPS AND DELIVERED A DEVASTATING CON-CHAIR-TO WITH A FOLDING CHAIR!", type: "injury_feud", matchMatch: "No Disqualification", formatKey: "1v1", formatCount: 2, logText: "🪑 {Superstar A} delivered a brutal Con-Chair-To on the steel steps to {Superstar B}!" },
  { id: 53, image: "story_53.png", text: "{Superstar A} JAMMED A 10-POUND STEEL SLEDGEHAMMER BLUNT-FIRST INTO {Superstar B}'S THROAT, CRUSHING THEIR LARYNX BEFORE OFFICIALS COULD INTERVENE!", type: "injury_feud", matchMatch: "Last Man Standing", formatKey: "1v1", formatCount: 2, logText: "🔨 {Superstar A} crushed {Superstar B}'s trachea with a steel sledgehammer!" },
  { id: 54, image: "story_54.png", text: "TOTAL DISASTER! {Superstar A} BRAWLED WITH {Superstar B} HIGH ONTO THE ARENA PRODUCTION GANTRY AND HURLED THEM 15 FEET DOWN ONTO HARD FLIGHT CASES!", type: "injury_feud", matchMatch: "Falls Count Anywhere", formatKey: "1v1", formatCount: 2, logText: "💥 {Superstar A} threw {Superstar B} off the arena production balcony!" },
  { id: 55, image: "story_55.png", text: "THE SHOCKING BETRAYAL! {Superstar A} LEVELLED {Superstar B} WITH A VICIOUS SUPERKICK AND HURLED THEM HEAD-FIRST THROUGH A HUGE STUDIO MIRROR!", type: "injury_feud", matchMatch: "Tables Match", formatKey: "1v1", formatCount: 2, logText: "🪞 {Superstar A} threw {Superstar B} face-first through a plate-glass window!" },
  { id: 56, image: "story_56.png", text: "{Superstar A} TIPPED OVER A GIANT 20-FOOT EXTENSION LADDER, SENDING {Superstar B} PLUMMETING HEADLONG THROUGH TWO STACKED TABLES ON THE CONCRETE!", type: "injury_feud", matchMatch: "TLC Match", formatKey: "1v1", formatCount: 2, logText: "🪜 {Superstar A} sent {Superstar B} plunging off a giant ladder through stacked tables!" },
  { id: 57, image: "story_57.png", text: "{Superstar A} CORNERED {Superstar B} IN THE EMERGENCY BAY, TRAPPED THEIR SPINE IN THE AMBULANCE REAR FRAME, AND REPEATEDLY SLAMMED THE HEAVY DOORS SHUT!", type: "injury_feud", matchMatch: "Ambulance Match", formatKey: "1v1", formatCount: 2, logText: "🚑 {Superstar A} crushed {Superstar B} inside the heavy ambulance rear doors!" },

  // --- NEW ALLIANCE ONLY (58-60) ---
  { id: 58, image: "story_58.png", text: "BUSINESS IS OPEN! {Superstar A} AND {Superstar B} FORMED AN ENFORCER ALLIANCE OVER BEER AND CASH AT A BACKSTAGE POKER TABLE!", type: "alliance_only", logText: "🚪 {Superstar A} and {Superstar B} signed a backstage protection agency pact!" },
  { id: 59, image: "story_59.png", text: "THE UNTHINKABLE POWER PACT! ONCE BITTER ENEMIES, {Superstar A} AND {Superstar B} SHOOK HANDS TO FORM AN UNSTOPPABLE TWO-MAN COALITION!", type: "alliance_only", logText: "🤝 {Superstar A} and {Superstar B} united in a shocking Two-Man Power pact!" },
  { id: 60, image: "story_60.png", text: "AN UNLIKELY BOND! {Superstar A} PRESENTED A BIZARRE GIFT IN THE LOCKER ROOM, AND {Superstar B} AGREED TO DOMINATE TOGETHER!", type: "alliance_only", logText: "🎁 {Superstar A} won over {Superstar B} with a locker room peace offering!" },

  // --- NEW FLAVOR (61-65) ---
  { id: 61, image: "story_61.png", text: "CONCRETE CARNAGE IN THE PARKING LOT! {Superstar A} BACKED A CEMENT MIXER UP TO {Superstar B}'S SPORTS CAR AND FILLED IT TO THE BRIM WITH WET CEMENT!", type: "flavor", logText: "🚗 {Superstar A} filled {Superstar B}'s luxury car with wet cement!" },
  { id: 62, image: "story_62.png", text: "TOTAL DESECRATION! {Superstar A} STOLE {Superstar B}'S CHAMPIONSHIP STRAP, LAID IT FLAT ACROSS THE CONCRETE, AND SMASHED THE GOLD MEDALLION TO PIECES!", type: "flavor", logText: "🔨 {Superstar A} smashed {Superstar B}'s championship belt with a hammer!" },
  { id: 63, image: "story_63.png", text: "UNSTOPPABLE MACHINERY! {Superstar A} HIJACKED AN ARENA ZAMBONI AND DROVE IT STRAIGHT DOWN THE ENTRANCE RAMP THROUGH SECURITY LINES!", type: "flavor", logText: "🚜 {Superstar A} hijacked an arena Zamboni to crash {Superstar B}'s broadcast!" },
  { id: 64, image: "story_64.png", text: "AN EERIE MIDNIGHT TRANSMISSION! {Superstar A} STOOD IN A RAIN-SOAKED CEMETERY BESIDE A FRESH GRAVE WITH {Superstar B}'S NAME CHISELED INTO THE STONE!", type: "flavor", logText: "🪦 {Superstar A} broadcast an ominous cemetery vignette threatening {Superstar B}!" },
  { id: 65, image: "story_65.png", text: "RINGSIDE INCINERATION! {Superstar A} TOSSED {Superstar B}'S RING GEAR INTO A STEEL TRASH CAN IN THE CENTER OF THE RING AND SET IT ON FIRE!", type: "flavor", logText: "🔥 {Superstar A} burned {Superstar B}'s ring gear in a flaming steel trash can!" },

  // --- NEW BETRAYALS (66-68) ---
  { id: 66, image: "story_66.png", text: "THE THUMBS-DOWN BETRAYAL! WHILE HOISTING {Superstar B} IN CELEBRATION, {Superstar A} GAVE A COLD THUMBS-DOWN AND DROPPED THEM VIOLENTLY ON THE CANVAS!", type: "betrayal", matchMatch: "No Disqualification", formatKey: "1v1", formatCount: 2, logText: "💔 BETRAYAL: {Superstar A} turned on partner {Superstar B} with a cold thumbs-down beatdown!" },
  { id: 67, image: "story_67.png", text: "PARTNERS NO MORE! IN THE MIDDLE OF PLAYING TO THE FANS, {Superstar A} SPUN {Superstar B} AROUND AND DROPPED THEM WITH A VICIOUS SUCKER-PUNCH!", type: "betrayal", matchMatch: "2 out of 3 Falls", formatKey: "1v1", formatCount: 2, logText: "💔 BETRAYAL: {Superstar A} blindsided tag partner {Superstar B} during their victory pose!" },
  { id: 68, image: "story_68.png", text: "BACKSTAGE JEALOUSY ERUPTS! {Superstar A} ACCUSED {Superstar B} OF HOGGING THE GLORY AND SMASHED A STEEL FOLDING CHAIR OVER THEIR SPINE!", type: "betrayal", matchMatch: "Falls Count Anywhere", formatKey: "1v1", formatCount: 2, logText: "💔 BETRAYAL: {Superstar A} attacked tag partner {Superstar B} backstage over jealousy!" },

  // --- NEW CONTENDERSHIPS (69-73) ---
  { id: 69, image: "story_69.png", text: "FRONT OFFICE DECREE! THE GENERAL MANAGER ANNOUNCED TONIGHT'S WINNER BETWEEN {Superstar A} AND {Superstar B} WILL BE CROWNED #1 CONTENDER!", type: "contendership", matchMatch: "Normal Match", formatKey: "1v1", formatCount: 2, logText: "⭐ ELIMINATOR: {Superstar A} and {Superstar B} booked in an official #1 Contender match!" },
  { id: 70, image: "story_70.png", text: "THE ULTIMATE TEST OF ENDURANCE! WITH A TITLE SHOT ON THE LINE, MANAGEMENT MANDATED A BRUTAL 2-OUT-OF-3 FALLS TRIAL BETWEEN {Superstar A} AND {Superstar B}!", type: "contendership", matchMatch: "2 out of 3 Falls", formatKey: "1v1", formatCount: 2, logText: "⭐ ENDURANCE TRIAL: {Superstar A} vs {Superstar B} in a 2-out-of-3 Falls #1 Contender match!" },
  { id: 71, image: "story_71.png", text: "EYES ON THE PRIZE! {Superstar A} AND {Superstar B} MET NOSE-TO-NOSE, BOTH POINTING UP AT THE CHAMPIONSHIP BANNER IN THE RAFTERS!", type: "contendership", matchMatch: "Falls Count Anywhere", formatKey: "1v1", formatCount: 2, logText: "⭐ STAKED CLAIM: {Superstar A} and {Superstar B} clash for the right to challenge for the gold!" },
  { id: 72, image: "story_72.png", text: "THE HARDCORE PROVING GROUND! TO PROVE THEY DESERVE THE #1 CONTENDER SPOT, {Superstar A} CHALLENGED {Superstar B} TO A BRUTAL NO DISQUALIFICATION WAR!", type: "contendership", matchMatch: "No Disqualification", formatKey: "1v1", formatCount: 2, logText: "⭐ PROVING GROUND: {Superstar A} and {Superstar B} battle in a No DQ #1 Contender war!" },
  { id: 73, image: "story_73.png", text: "TAP OR SNAP! WITH THE TITLE SHOT ON THE LINE, {Superstar A} AND {Superstar B} AGREED TO A TECHNICAL SHOWDOWN WHERE ONLY A SUBMISSION CAN DECLARE THE TOP CONTENDER!", type: "contendership", matchMatch: "Submission Match", formatKey: "1v1", formatCount: 2, logText: "⭐ TAP OR SNAP: {Superstar A} vs {Superstar B} in a Submission #1 Contender match!" },

  // --- NEW TITLE VACATES (74-76) ---
  { id: 74, image: "story_74.png", text: "MEDICAL SURRENDER! {Superstar B} EMOTIONALLY SURRENDERED THE TITLE DUE TO SURGERY. THE GM DECLARED {Superstar A} AND A GRUDGE ENEMY WILL FIGHT TONIGHT FOR THE VACANT GOLD!", type: "title_vacate", matchMatch: "Normal Match", formatKey: "1v1", formatCount: 2, logText: "🩹 VACATED: {Superstar B} surrendered the Championship due to injury! {Superstar A} fights to crown a new king tonight!" },
  { id: 75, image: "story_75.png", text: "SEIZED BY THE BOARD! FOLLOWING A SCANDALOUS FINISH, {Superstar B} WAS STRIPPED OF THE GOLD. {Superstar A} CLASHES WITH A REBEL ENEMY TONIGHT IN A NO-DQ WAR TO CLAIM THE VACANT TITLE!", type: "title_vacate", matchMatch: "No Disqualification", formatKey: "1v1", formatCount: 2, logText: "📜 VACATED: The Championship is stripped from {Superstar B}! {Superstar A} is booked in a No-DQ clash to crown a new Champion!" },
  { id: 76, image: "story_76.png", text: "THE PRIZE IS FORFEITED! {Superstar B} WAS STRIPPED OF THE TITLE AFTER REPEATEDLY FLOUTING THE RULES. {Superstar A} STEPPED FORWARD TO FIGHT FOR THE ABANDONED PRIZE IN FALLS COUNT ANYWHERE!", type: "title_vacate", matchMatch: "Falls Count Anywhere", formatKey: "1v1", formatCount: 2, logText: "🏆 VACATED: The Title is stripped! {Superstar A} and a rival fight in Falls Count Anywhere!" },

  // --- NEW HEIST DEMANDS (77-79) ---
  { id: 77, image: "story_77.png", text: "CALLING THEIR SHOT! {Superstar A} HOISTED THE BRIEFCASE HIGH AND DEMANDED REIGNING CHAMPION {Superstar B} MEET THEM TONIGHT IN AN EXTREME RULES TITLE WAR!", type: "heist_demand", matchMatch: "No Disqualification", formatKey: "1v1", formatCount: 2, logText: "💼 HEIST DEMAND: {Superstar A} called their shot and cashed in on {Superstar B}!" },
  { id: 78, image: "story_78.png", text: "THE ULTIMATE OPPORTUNIST! AS A BATTERED {Superstar B} STRUGGLED TO STAND, {Superstar A} SPRINTED THROUGH THE SMOKE WITH BRIEFCASE IN HAND TO STEAL THE GOLD!", type: "heist_demand", matchMatch: "Normal Match", formatKey: "1v1", formatCount: 2, logText: "💼 HEIST OF THE CENTURY: {Superstar A} ambushed an exhausted {Superstar B} to cash in!" },
  { id: 79, image: "story_79.png", text: "BLUDGEONED BY THE CONTRACT! {Superstar A} SMASHED THE CORNER OF THE HEAVY STEEL BRIEFCASE STRAIGHT INTO {Superstar B}'S TEMPLE, HANDING OVER THE CONTRACT AS THE BELL RANG!", type: "heist_demand", matchMatch: "No Disqualification", formatKey: "1v1", formatCount: 2, logText: "💼 BRUTAL CASH-IN: {Superstar A} clocked {Superstar B} with the briefcase to trigger a title bout!" }
];

function openStorylineModal(forcedA = null, forcedB = null, isBreakingNews = false) {
  if (typeof turnOffOtherModes === 'function') turnOffOtherModes('');
  const gmLevel = typeof getGMLevel === 'function' ? getGMLevel() : 1;
  const allWrestlers = getUnlockedWrestlers().filter(w => !getInjuryRecord(w.id));
  const activeAlliances = getAlliances();
  const mitbHolder = getMitbHolder();
  const currentHolders = getTitleHolders();
  
  if (allWrestlers.length < 2 && (!forcedA || !forcedB)) {
    alert("Need at least 2 active, uninjured superstars for a storyline!");
    return;
  }

  const eligibleStorylines = storylines.filter(story => {
    // During an active show session, restrict storyline rolls strictly to flavor/alliance vignettes
    if (window.activeShowSession) {
      if (story.type !== 'flavor' && story.type !== 'alliance_only') return false;
    }

    if (story.type === 'injury_feud' && gmLevel < 3) return false;
    if (story.matchMatch === 'TLC Match' && gmLevel < 4) return false;
    if (story.matchMatch === 'Ambulance Match' && gmLevel < 5) return false;
    
    if (story.type === 'alliance' || story.type === 'alliance_only') {
      const hasTeamA = activeAlliances.some(a => a.p1 === (forcedA ? forcedA.id : null) || a.p2 === (forcedA ? forcedA.id : null));
      const hasTeamB = activeAlliances.some(a => a.p1 === (forcedB ? forcedB.id : null) || a.p2 === (forcedB ? forcedB.id : null));
      if (hasTeamA || hasTeamB) return false;
    }

    if (story.type === 'betrayal') {
      if (!activeAlliances || activeAlliances.length === 0) return false;
      const al = activeAlliances[0];
      const p1 = allWrestlers.find(w => w.id === al.p1);
      const p2 = allWrestlers.find(w => w.id === al.p2);
      if (!p1 || !p2) return false;
    }

    if (story.type === 'heist_demand') {
      if (!mitbHolder || getInjuryRecord(mitbHolder.id)) return false;
      const targetChampId = currentHolders.whc || currentHolders.ic;
      if (!targetChampId || targetChampId === mitbHolder.id) return false;
      const champ = allWrestlers.find(w => w.id === targetChampId);
      if (!champ) return false;
    }

    if (story.type === 'title_vacate') {
      const champId = currentHolders.whc || currentHolders.ic;
      if (!champId) return false;
      const champ = allWrestlers.find(w => w.id === champId);
      if (!champ) return false;
    }

    return true;
  });

  if (eligibleStorylines.length === 0) {
    if (!window.activeShowSession) {
      alert("No eligible storylines available right now!");
    }
    return;
  }

  activeStoryline = eligibleStorylines[Math.floor(Math.random() * eligibleStorylines.length)];

  if (activeStoryline.type === 'betrayal' && activeAlliances.length > 0) {
    let al = activeAlliances[0];
    if (forcedA && forcedB && areInSameAlliance(forcedA.id, forcedB.id)) {
      al = activeAlliances.find(a => (a.p1 === forcedA.id && a.p2 === forcedB.id) || (a.p1 === forcedB.id && a.p2 === forcedA.id));
    } else if (activeAlliances.length > 1) {
      al = activeAlliances[Math.floor(Math.random() * activeAlliances.length)];
    }
    activeStoryWrestlerA = allWrestlers.find(w => w.id === al.p1);
    activeStoryWrestlerB = allWrestlers.find(w => w.id === al.p2);
  } else if (activeStoryline.type === 'heist_demand') {
    activeStoryWrestlerA = allWrestlers.find(w => w.id === mitbHolder.id);
    const champId = currentHolders.whc || currentHolders.ic;
    activeStoryWrestlerB = allWrestlers.find(w => w.id === champId);
  } else if (activeStoryline.type === 'title_vacate') {
    const champId = currentHolders.whc || currentHolders.ic;
    activeStoryWrestlerB = allWrestlers.find(w => w.id === champId);
    const challengers = allWrestlers.filter(w => w.id !== champId);
    activeStoryWrestlerA = challengers[Math.floor(Math.random() * challengers.length)] || allWrestlers[0];
  } else if (forcedA && forcedB && !getInjuryRecord(forcedA.id) && !getInjuryRecord(forcedB.id)) {
    activeStoryWrestlerA = forcedA;
    activeStoryWrestlerB = forcedB;
  } else if (forcedA && forcedB) {
    const uninjured = allWrestlers.filter(w => w.id !== forcedA.id && w.id !== forcedB.id);
    activeStoryWrestlerA = !getInjuryRecord(forcedA.id) ? forcedA : (uninjured[0] || forcedA);
    activeStoryWrestlerB = !getInjuryRecord(forcedB.id) ? forcedB : (uninjured[1] || forcedB);
  } else {
    const shuffled = [...allWrestlers].sort(() => Math.random() - 0.5);
    if (activeStoryline.type === 'alliance' || activeStoryline.type === 'alliance_only') {
      const freeAgents = shuffled.filter(w => !activeAlliances.some(a => a.p1 === w.id || a.p2 === w.id));
      if (freeAgents.length >= 2) {
        activeStoryWrestlerA = freeAgents[0];
        activeStoryWrestlerB = freeAgents[1];
      } else {
        activeStoryWrestlerA = shuffled[0];
        activeStoryWrestlerB = shuffled[1];
      }
    } else {
      activeStoryWrestlerA = shuffled[0];
      activeStoryWrestlerB = shuffled[1];
    }
  }

  setElDisplay('storylineModal', 'flex');
  setElDisplay('storyScreen1', 'flex');
  setElDisplay('storyScreen2', 'none');
  setElDisplay('storyContinueBtn', 'none');

  const titleEl = document.getElementById('storyModalTitle');
  if (titleEl) {
    if (isBreakingNews) {
      titleEl.innerText = "🚨 BREAKING EWF NEWS 🚨";
      titleEl.style.color = "#ff0000";
      titleEl.style.textShadow = "0 0 15px rgba(255,0,0,0.8)";
    } else {
      titleEl.innerText = "EWF STORYLINE WIRE";
      titleEl.style.color = "#ffd700";
      titleEl.style.textShadow = "0 0 10px rgba(255,215,0,0.5)";
    }
  }

  if (isBreakingNews) {
    if (typeof playBreakingNewsAudio === 'function') playBreakingNewsAudio();
    if (typeof triggerCameraFlash === 'function') triggerCameraFlash();
  }

  const imgEl = document.getElementById('storySceneImage');
  const frameEl = document.getElementById('storyImageFrame');
  if (imgEl && frameEl) { 
    imgEl.src = activeStoryline.image; 
    frameEl.style.display = 'block'; 
  }

  const badgeA = document.getElementById('storyBadgeA');
  const badgeB = document.getElementById('storyBadgeB');
  if (badgeA) {
    badgeA.innerHTML = `<img src="${activeStoryWrestlerA.image}" onerror="handleImgError(this, '${activeStoryWrestlerA.id}')"><span>${activeStoryWrestlerA.name}</span>`;
    badgeA.classList.remove('popped');
    badgeA.style.display = 'none';
  }
  if (badgeB) {
    badgeB.innerHTML = `<img src="${activeStoryWrestlerB.image}" onerror="handleImgError(this, '${activeStoryWrestlerB.id}')"><span>${activeStoryWrestlerB.name}</span>`;
    badgeB.classList.remove('popped');
    badgeB.style.display = 'none';
  }

  const logToSave = activeStoryline.logText.replace(/{Superstar A}/g, activeStoryWrestlerA.name).replace(/{Superstar B}/g, activeStoryWrestlerB.name);
  if (typeof saveHistoryLog === 'function') saveHistoryLog(logToSave, 'match');

  if (typeof logShowFalloutEvent === 'function') {
    logShowFalloutEvent('cutscene', `🎬 STORYLINE WIRE: ${logToSave}`);
  }

  if (activeStoryline.type === 'injury_feud') {
    const result = inflictInjury(activeStoryWrestlerB.id);
    if (result) {
      addOrUpdateRivalry(activeStoryWrestlerA.id, activeStoryWrestlerB.id, activeStoryline.matchMatch, 2);
      if (typeof saveHistoryLog === 'function') {
        saveHistoryLog(`🚑 HOSPITAL ADMISSION: ${activeStoryWrestlerB.name.toUpperCase()} suffered a ${result.severity.toUpperCase()} injury (${result.matchesRemaining} match out)!`, 'medical');
      }
    }
  } else if (activeStoryline.type === 'feud') {
    addOrUpdateRivalry(activeStoryWrestlerA.id, activeStoryWrestlerB.id, activeStoryline.matchMatch, 1);
  }

  startStorylineTypewriter(activeStoryline.text, activeStoryWrestlerA, activeStoryWrestlerB);
}

function startStorylineTypewriter(rawText, wrestlerA, wrestlerB) {
  const container = document.getElementById('storyNarrativeText');
  container.innerHTML = '';

  try {
    typewriterSound.currentTime = 0;
    typewriterSound.play().catch(() => {});
  } catch (e) {}

  let tokens = [];
  const parts = rawText.split(/({Superstar A}|{Superstar B})/g);
  parts.forEach(p => {
    if (p === '{Superstar A}') {
      tokens.push({ text: wrestlerA.name.toUpperCase(), cls: 'story-name-a', isA: true });
    } else if (p === '{Superstar B}') {
      tokens.push({ text: wrestlerB.name.toUpperCase(), cls: 'story-name-b', isB: true });
    } else if (p.length > 0) {
      tokens.push({ text: p, cls: '' });
    }
  });

  let tokenIdx = 0;
  let charIdx = 0;
  let currentSpan = null;

  clearInterval(typeWriterInterval);
  typeWriterInterval = setInterval(() => {
    if (tokenIdx >= tokens.length) {
      clearInterval(typeWriterInterval);
      try { typewriterSound.pause(); } catch (e) {}
      setElDisplay('storyContinueBtn', 'block');
      return;
    }

    const curToken = tokens[tokenIdx];
    if (charIdx === 0) {
      currentSpan = document.createElement('span');
      if (curToken.cls) currentSpan.className = curToken.cls;
      container.appendChild(currentSpan);

      if (curToken.isA) {
        if (typeof triggerCameraFlash === 'function') triggerCameraFlash();
        const badgeA = document.getElementById('storyBadgeA');
        if (badgeA) { badgeA.style.display = 'flex'; badgeA.classList.add('popped'); }
      } else if (curToken.isB) {
        if (typeof triggerCameraFlash === 'function') triggerCameraFlash();
        const badgeB = document.getElementById('storyBadgeB');
        if (badgeB) { badgeB.style.display = 'flex'; badgeB.classList.add('popped'); }
      }
    }

    currentSpan.textContent += curToken.text[charIdx];
    charIdx++;

    if (charIdx >= curToken.text.length) {
      tokenIdx++;
      charIdx = 0;
    }
  }, 70);
}

function proceedToStoryScreen2() {
  clearInterval(typeWriterInterval);
  try { typewriterSound.pause(); } catch (e) {}

  setElDisplay('storyScreen1', 'none');
  setElDisplay('storyScreen2', 'flex');

  document.getElementById('storyWrestlerAImg').src = activeStoryWrestlerA.image;
  document.getElementById('storyWrestlerAName').innerText = activeStoryWrestlerA.name;

  document.getElementById('storyWrestlerBImg').src = activeStoryWrestlerB.image;
  document.getElementById('storyWrestlerBName').innerText = activeStoryWrestlerB.name;

  const banner = document.getElementById('storyConsequenceBanner');
  const bookBtn = document.getElementById('storyBookMatchBtn');

  let sanctionBtn = document.getElementById('storySanctionMatchBtn');
  if (!sanctionBtn && bookBtn && bookBtn.parentElement) {
    sanctionBtn = document.createElement('button');
    sanctionBtn.id = 'storySanctionMatchBtn';
    sanctionBtn.className = 'action-btn btn-gold';
    sanctionBtn.style.cssText = 'display:none; margin-top:8px; width:100%; font-family:"Russo One", sans-serif; font-size:0.9rem; padding:10px; box-shadow:0 0 15px rgba(255,215,0,0.5);';
    sanctionBtn.innerText = '📋 SANCTION FOR NEXT BROADCAST';
    sanctionBtn.onclick = () => window.sanctionStorylineForNextBroadcast();
    bookBtn.parentElement.appendChild(sanctionBtn);
  }

  if (typeof playBreakingNewsAudio === 'function') {
    playBreakingNewsAudio();
  }

  const showSanctionOption = () => {
    if (sanctionBtn) {
      sanctionBtn.style.display = 'block';
    }
  };

  const hideSanctionOption = () => {
    if (sanctionBtn) {
      sanctionBtn.style.display = 'none';
    }
  };

  if (activeStoryline.type === 'injury_feud' || activeStoryline.type === 'feud') {
    const isInj = activeStoryline.type === 'injury_feud';
    banner.innerText = isInj ? `🚑 INJURY INFLICTED: REVENGE ${activeStoryline.matchMatch.toUpperCase()} BOOKED!` : `💥 MATCH BOOKED: ${activeStoryline.matchMatch.toUpperCase()} 💥`;
    banner.style.display = 'block';
    bookBtn.style.display = 'block';
    bookBtn.innerText = '⚔️ FIGHT RIGHT NOW ➔';
    showSanctionOption();

    if (activeStoryline.dissolveAlliance) {
      disbandAlliance(activeStoryWrestlerA.id, activeStoryWrestlerB.id);
    }
  } else if (activeStoryline.type === 'betrayal') {
    disbandAlliance(activeStoryWrestlerA.id, activeStoryWrestlerB.id);
    addOrUpdateRivalry(activeStoryWrestlerA.id, activeStoryWrestlerB.id, "Locker Room Betrayal", 2);

    banner.innerText = `💔 PARTNERSHIP SHATTERED: GRUDGE ${activeStoryline.matchMatch.toUpperCase()} BOOKED!`;
    banner.style.display = 'block';
    bookBtn.style.display = 'block';
    bookBtn.innerText = '⚔️ FIGHT RIGHT NOW ➔';
    showSanctionOption();
  } else if (activeStoryline.type === 'contendership') {
    banner.innerText = `⭐ #1 CONTENDER ELIMINATOR: ${activeStoryline.matchMatch.toUpperCase()}!`;
    banner.style.display = 'block';
    bookBtn.style.display = 'block';
    bookBtn.innerText = '⚔️ FIGHT RIGHT NOW ➔';
    showSanctionOption();
  } else if (activeStoryline.type === 'title_vacate') {
    const holders = getTitleHolders();
    if (holders.whc === activeStoryWrestlerB.id) holders.whc = null;
    else if (holders.ic === activeStoryWrestlerB.id) holders.ic = null;
    else holders.whc = null;
    setTitleHolders(holders);
    if (typeof renderGrid === 'function') renderGrid();

    banner.innerText = `🏆 TITLE VACATED: CLASH TO CROWN A NEW CHAMPION!`;
    banner.style.display = 'block';
    bookBtn.style.display = 'block';
    bookBtn.innerText = '⚔️ FIGHT RIGHT NOW ➔';
    showSanctionOption();
  } else if (activeStoryline.type === 'heist_demand') {
    banner.innerText = `💼 MITB CASH-IN SANCTIONED: TITLE ON THE LINE!`;
    banner.style.display = 'block';
    bookBtn.style.display = 'block';
    bookBtn.innerText = '⚔️ FIGHT RIGHT NOW ➔';
    showSanctionOption();
  } else if (activeStoryline.type === 'alliance' || activeStoryline.type === 'alliance_only') {
    saveAlliance(activeStoryWrestlerA.id, activeStoryWrestlerB.id, `${activeStoryWrestlerA.name} & ${activeStoryWrestlerB.name}`, '#d4af37');
    if (typeof renderGrid === 'function') renderGrid();

    banner.innerText = `🤝 ALLIANCE FORMED: NEW TAG TEAM PACT!`;
    banner.style.display = 'block';

    if (activeStoryline.type === 'alliance') {
      bookBtn.style.display = 'block';
      bookBtn.innerText = 'BOOK TAG MATCH ➔';
    } else {
      bookBtn.style.display = 'none';
    }
    hideSanctionOption();
  } else {
    banner.innerText = `📜 STORYLINE ARCHIVED TO HISTORY`;
    banner.style.display = 'block';
    bookBtn.style.display = 'none';
    hideSanctionOption();
  }
}

function closeStorylineModal() { 
  clearInterval(typeWriterInterval); 
  try { typewriterSound.pause(); } catch (e) {}
  setElDisplay('storylineModal', 'none'); 

  if (window.activeShowSession && typeof renderBookShowCardModal === 'function') {
    setElDisplay('bookShowCardModal', 'flex');
    renderBookShowCardModal();
  }
}

function sanctionStorylineForNextBroadcast() {
  const story = activeStoryline;
  const wA = activeStoryWrestlerA;
  const wB = activeStoryWrestlerB;

  if (!story || !wA || !wB) return;

  const isTitle = !!(story.isTitle || story.type === 'title_vacate' || story.type === 'heist_demand');
  const matchType = story.matchMatch || "Normal Match";

  const scheduledMatch = {
    w1: wA,
    w2: wB,
    matchType: matchType,
    formatKey: "1v1",
    isTitleMatch: isTitle,
    titleCode: isTitle ? "whc" : null,
    titleName: isTitle ? "World Heavyweight Championship" : null,
    titleImg: isTitle ? "whc.png" : null,
    isCareerMatch: false,
    storyType: story.type,
    storyId: story.id,
    originText: story.logText ? story.logText.replace(/{Superstar A}/g, wA.name).replace(/{Superstar B}/g, wB.name) : "Sanctioned Storyline Bout"
  };

  localStorage.setItem('ewf_scheduled_story_match', JSON.stringify(scheduledMatch));

  closeStorylineModal();

  if (typeof saveHistoryLog === 'function') {
    saveHistoryLog(`📋 SANCTIONED FOR NEXT BROADCAST: ${wA.name.toUpperCase()} vs ${wB.name.toUpperCase()} [${matchType.toUpperCase()}]`, 'booking');
  }

  alert(`📋 MATCH OFFICIALLY SANCTIONED!\n\n${wA.name.toUpperCase()} vs ${wB.name.toUpperCase()} (${matchType.toUpperCase()}) has been locked into the card for the next EWF Broadcast.\n\nOpen "BOOK A SHOW" to generate the event!`);

  if (typeof renderGrid === 'function') renderGrid();
}

function launchStorylineMatch() {
  const story = activeStoryline;
  const wA = activeStoryWrestlerA;
  const wB = activeStoryWrestlerB;

  closeStorylineModal();
  if (typeof openMatchEngine === 'function') openMatchEngine();

  activeBookedMatch.matchType = story.matchMatch || "Normal Match";
  activeBookedMatch.formatKey = story.formatKey || "1v1";
  activeBookedMatch.formatCount = 2;
  pickedReferee = null;

  if (story.isTitle || story.type === 'title_vacate' || story.type === 'heist_demand') {
    activeBookedMatch.isTitleMatch = true;
    activeBookedMatch.titleCode = "whc";
    activeBookedMatch.titleName = "World Heavyweight Championship";
    activeBookedMatch.titleImg = "whc.png";
    if (typeof updateTitleStakeBtnUI === 'function') updateTitleStakeBtnUI();
  }

  if (activeBookedMatch.formatKey === 'tag') {
    const allWrestlers = getUnlockedWrestlers();
    const others = allWrestlers.filter(w => w && w.id !== wA.id && w.id !== wB.id).sort(() => Math.random() - 0.5);
    activeBookedMatch.participants = [wA, wB, others[0] || wA, others[1] || wB];
  } else {
    activeBookedMatch.participants = [wA, wB];
  }

  storyBypassIds = activeBookedMatch.participants.map(w => w.id);
  quickMatchQueue = [...activeBookedMatch.participants];

  if (typeof navGoToStep === 'function') navGoToStep(6);

  const matchTypeEl = document.getElementById('qmMatchType');
  if (matchTypeEl && typeof renderMatchLogoHTML === 'function') {
    matchTypeEl.innerHTML = renderMatchLogoHTML(activeBookedMatch.matchType, 'locked-red');
  }

  const listContainer = document.getElementById('qmWrestlersList');
  if (listContainer) {
    listContainer.innerHTML = '';
    quickMatchQueue.forEach((w, idx) => {
      const wBlock = document.createElement('div');
      wBlock.className = 'vs-wrestler';
      wBlock.innerHTML = `<img src="${w.image}" alt="${w.name}" onerror="handleImgError(this, '${w.id}')"><div>${w.name}</div>`;
      listContainer.appendChild(wBlock);
      if (idx < quickMatchQueue.length - 1) {
        const vsBlock = document.createElement('div');
        vsBlock.className = 'vs-divider';
        vsBlock.innerText = (activeBookedMatch.formatKey === 'tag' && idx === 1) ? 'VS (TAG TEAM)' : 'VS';
        listContainer.appendChild(vsBlock);
      }
    });
  }
  setElDisplay('qmButtons', 'flex');
}

/* --------------------------------------------------------------------------
   8. ROSTER CARD CLICK HANDLER & ROSTER GRID RENDERING (BATCH EDITS APPLIED)
   -------------------------------------------------------------------------- */
function handleCardClick(wrestler) {
  if (activeBookedMatch) activeBookedMatch.isTitleMatch = false;
  setElDisplay('titleMatchBanner', 'none');

  window.isCommentatorVideoActive = false;

  if (storyBypassIds && storyBypassIds.includes(wrestler.id)) {
  } else {
    const injury = getInjuryRecord(wrestler.id);
    if (injury) {
      if (confirm(`🚑 ${wrestler.name} is in hospital with a ${injury.severity.toUpperCase()} injury (${injury.remaining} match sitting out)!\n\nGrant immediate medical clearance?`)) {
        clearInjury(wrestler.id);
      }
      return;
    }
  }

  logPromoPlay(wrestler.id);
  if (typeof unlockAchievement === 'function') unlockAchievement('soundcheck');

  if (window.isPromoMode) {
    let promoList = [];
    if (wrestler.promoUrl && typeof wrestler.promoUrl === 'string' && wrestler.promoUrl.trim() !== "") {
      promoList = wrestler.promoUrl.split(',').map(url => url.trim()).filter(url => url !== "");
    }

    if (promoList.length > 0) {
      const selectedPromoUrl = promoList[Math.floor(Math.random() * promoList.length)];
      currentPlayingWrestler = wrestler;
      if (typeof saveHistoryLog === 'function') saveHistoryLog(`🎤 PROMO: ${wrestler.name.toUpperCase()} took the mic`, 'match');
      if (typeof stopBGMForAction === 'function') stopBGMForAction();
      if (typeof loadAndPlayYouTube === 'function') loadAndPlayYouTube(selectedPromoUrl, false, true);
    } else {
      alert(`No promo saved for ${wrestler.name} yet!\n\nAdd YouTube promo link(s) when creating custom wrestlers.`);
    }
  } else {
    currentPlayingWrestler = wrestler;
    activeMatchMode = 'normal';
    setElDisplay('nextEntrantBtn', 'none');
    if (typeof stopBGMForAction === 'function') stopBGMForAction();
    if (typeof loadAndPlayYouTube === 'function') loadAndPlayYouTube(wrestler.youtubeUrl, false, false);
  }
}

function renderGrid() {
  try {
    const container = document.getElementById('wrestler-grid') || 
                      document.getElementById('wrestlerGrid') || 
                      document.getElementById('rosterGrid') || 
                      document.querySelector('.grid');
    if (!container) return;
    container.innerHTML = '';

    const unlockedWrestlers = getUnlockedWrestlers();
    const mitbHolder = getMitbHolder(); 
    const kotrHolderId = getKotrHolder();
    const titles = getTitleHolders() || {}; 
    const alliances = getAlliances() || [];
    const rivalries = getRivalries() || [];
    const locks = getMandatoryLocks() || {};
    const contenderLocks = typeof getContenderTitleShotLocks === 'function' ? getContenderTitleShotLocks() : [];
    const defenses = typeof getDefenses === 'function' ? getDefenses() : (JSON.parse(localStorage.getItem('championship_defenses') || '{}'));
    const topContenderId = getTopContenderId();

    unlockedWrestlers.forEach((wrestler, index) => {
      if (!wrestler) return;
      if (!wrestler.id) wrestler.id = 'wrestler-' + index;

      const card = document.createElement('div');
      card.className = 'card';

      const injury = getInjuryRecord(wrestler.id);
      const isInjured = injury !== null;
      if (isInjured) card.classList.add('is-injured');

      const wrestlerFeuds = Array.isArray(rivalries) ? rivalries.filter(r => r && (r.w1 === wrestler.id || r.w2 === wrestler.id)) : [];
      const hasBloodFeud = wrestlerFeuds.some(r => r.heat === 3);
      const feudCount = wrestlerFeuds.length;

      if (feudCount > 0 && !isInjured) card.classList.add('is-rival');

      const isMandatoryPending = (locks.kotrIc && titles.ic === wrestler.id && locks.kotrIc !== wrestler.id) ||
                                 (locks.rumbleWhc && titles.whc === wrestler.id && locks.rumbleWhc !== wrestler.id);
      if (isMandatoryPending && !isInjured) card.classList.add('mandatory-pending');

      let injuryBadgeHTML = isInjured ? `<div class="injury-badge">${injury.severity === 'major' ? '💊' : '🩹'} ${injury.severity.toUpperCase()} (${injury.remaining}M)</div>` : '';

      let rivalBadgeHTML = '';
      if (!isInjured) {
        if (hasBloodFeud) rivalBadgeHTML = `<div class="rival-badge blood-feud">💀 BLOOD FEUD</div>`;
        else if (feudCount > 1) rivalBadgeHTML = `<div class="rival-badge">🔥 ${feudCount} RIVALRIES</div>`;
        else if (feudCount === 1) rivalBadgeHTML = `<div class="rival-badge">🔥 RIVALRY</div>`;
      }

      let mandatoryBadgeHTML = (isMandatoryPending && !isInjured) ? `<div class="mandatory-badge">⚠️ TITLE LOCK</div>` : '';

      let mitbBadgeHTML = '';
      const hasMitb = mitbHolder && mitbHolder.id === wrestler.id && !isInjured;
      if (hasMitb) {
        card.classList.add('mitb-holder');
        mitbBadgeHTML = `<img src="mitb_briefcase.png" class="mitb-badge-img" alt="MITB" onerror="this.outerHTML='<div class=\\'mitb-badge\\'>💼</div>'">`;
      }

      let kotrCrownHTML = '';
      const hasKotr = kotrHolderId === wrestler.id && !isInjured;
      if (hasKotr) {
        const rightOffset = hasMitb ? '38px' : '6px';
        kotrCrownHTML = `
          <img src="kotr_crown_roster.png" class="kotr-badge-img" alt="KOTR" style="
            position: absolute !important;
            top: 6px !important;
            right: ${rightOffset} !important;
            width: 28px !important;
            height: 28px !important;
            object-fit: contain !important;
            z-index: 22 !important;
            filter: drop-shadow(0 2px 5px rgba(0,0,0,0.9)) !important;
            pointer-events: none;
          " onerror="this.outerHTML='<div class=\\'kotr-badge\\' style=\\'position:absolute; top:6px; right:${rightOffset}; font-size:1.35rem; z-index:22; line-height:1; filter:drop-shadow(0 2px 4px #000);\\'>👑</div>'">
        `;
      }

      // Title Badges Container
      let titleBadgesHTML = ''; 
      const activeBadges = [];
      let totalDefenses = 0;
      if (titles.whc === wrestler.id) { activeBadges.push({ img: 'whc.png', alt: 'WHC' }); totalDefenses += (defenses.whc || 0); }
      if (titles.ic === wrestler.id) { activeBadges.push({ img: 'ic_title.png', alt: 'IC' }); totalDefenses += (defenses.ic || 0); }
      if (titles.hardcore === wrestler.id) { activeBadges.push({ img: 'hardcore.png', alt: 'HC' }); totalDefenses += (defenses.hardcore || 0); }
      if (titles.tag1 === wrestler.id || titles.tag2 === wrestler.id) { activeBadges.push({ img: 'tag_title.png', alt: 'TAG' }); totalDefenses += (defenses.tag || 0); }

      let defensePillHTML = '';
      if (activeBadges.length > 0 && !isInjured) {
        card.classList.add('has-title');
        const isMulti = activeBadges.length > 1;

        titleBadgesHTML = `
          <div class="title-badges-container ${isMulti ? 'has-double-title' : ''}">
            ${activeBadges.map(b => `
              <img src="${b.img}" alt="${b.alt}" class="title-card-badge-img">
            `).join('')}
          </div>
        `;

        if (totalDefenses > 0) {
          defensePillHTML = `<div class="defense-counter-pill">${totalDefenses} DEFENSE${totalDefenses > 1 ? 'S' : ''}</div>`;
        }
      }

      // MOMENTUM ICON TILES (TOP-RIGHT) & CENTERED HONORS (BOTTOM)
      let momentumBadgeHTML = '';
      let contenderBadgeHTML = '';
      if (!isInjured) {
        const momData = getWrestlerMomentum(wrestler.id);
        if (momData.status === 'fire') {
          momentumBadgeHTML = `<div class="momentum-badge momentum-fire" title="ON FIRE">🔥</div>`;
        } else if (momData.status === 'ice') {
          momentumBadgeHTML = `<div class="momentum-badge momentum-ice" title="ICE COLD">❄️</div>`;
        }

        // BATCH 6 ITEM 2: DISPLAY ⭐ #1 CONTENDER LOCK BADGE WHEN GRANTED BY BRET HART & GM ELLIS
        if (contenderLocks.includes(wrestler.id)) {
          contenderBadgeHTML = `
            <div class="momentum-contender" style="
              background: linear-gradient(90deg, #b8860b, #ffd700) !important;
              color: #000000 !important;
              border: 1px solid #ffffff !important;
              font-weight: 900 !important;
              text-shadow: none !important;
              box-shadow: 0 0 12px rgba(255, 215, 0, 0.85) !important;
            ">⭐ #1 CONTENDER LOCK</div>
          `;
        } else if (topContenderId === wrestler.id && activeBadges.length === 0) {
          contenderBadgeHTML = `<div class="momentum-contender">⭐ #1 CONTENDER</div>`;
        }

        if (locks.rumbleWhc === wrestler.id) {
          contenderBadgeHTML += `
            <div class="momentum-contender" style="
              background: #cc0000 !important;
              color: #ffffff !important;
              border: 1px solid #ff3333 !important;
              text-shadow: 0 1px 2px #000;
              box-shadow: 0 0 10px rgba(204,0,0,0.6);
              margin-top: 2px;
            ">🏆 RUMBLE WINNER</div>
          `;
        }
      }

      let hofCrestHTML = '';
      if (isHofInductee(wrestler.id)) {
        card.classList.add('card-hof-border');
        hofCrestHTML = `<img src="hof_crest.png" class="hof-card-crest" onerror="this.style.display='none'">`;
      }

      let allianceHTML = '';
      let customPhotoStyle = '';
      if (Array.isArray(alliances) && alliances.length > 0 && !isInjured) {
        const al = alliances.find(a => a.p1 === wrestler.id || a.p2 === wrestler.id);
        if (al) {
          if (al.color) customPhotoStyle = `border-color: ${al.color} !important; box-shadow: 0 0 20px ${al.color} !important;`;
          if (al.name) allianceHTML = `<div class="card-alliance-banner" style="color: ${al.color || '#00ffcc'}; text-shadow:0 0 8px ${al.color || '#000'};">${al.name}</div>`;
        }
      }

      const nameColor = wrestler.textColor || '#ffffff';
      card.innerHTML = `
        ${(!wrestler.isDefault && !wrestler.code) ? `<button class="delete-btn" onclick="event.stopPropagation(); deleteWrestler('${wrestler.id}')">✕</button>` : ''}
        ${injuryBadgeHTML}
        ${rivalBadgeHTML}
        ${mandatoryBadgeHTML}
        ${mitbBadgeHTML}
        ${kotrCrownHTML}
        ${titleBadgesHTML}
        ${defensePillHTML}
        ${momentumBadgeHTML}
        ${contenderBadgeHTML}
        ${hofCrestHTML}
        ${allianceHTML}
        <img src="${wrestler.image}" class="wrestler-photo" style="${customPhotoStyle}" alt="${wrestler.name}" onerror="handleImgError(this, '${wrestler.id}')">
        <h3 style="color: ${nameColor}">${wrestler.name}</h3>
      `;
      card.onclick = () => handleCardClick(wrestler);
      container.appendChild(card);
    });

    const addCard = document.createElement('div'); 
    addCard.className = 'card add-card'; 
    addCard.innerHTML = `<div class="add-icon-box">+</div><h3 style="color: #ffffff">ADD NEW</h3>`; 
    addCard.onclick = typeof openModal === 'function' ? openModal : () => setElDisplay('wrestlerModal', 'flex'); 
    container.appendChild(addCard);

    if (!window.isMatchInProgressLooping) {
      window.checkMidnightSyndicateTrigger();
    }

  } catch (err) {
    console.error("Error rendering wrestler grid:", err);
  }
}

// Global Window Exports for Module 3 Part 2
window.storylines = storylines;
window.openStorylineModal = openStorylineModal;
window.startStorylineTypewriter = startStorylineTypewriter;
window.proceedToStoryScreen2 = proceedToStoryScreen2;
window.closeStorylineModal = closeStorylineModal;
window.sanctionStorylineForNextBroadcast = sanctionStorylineForNextBroadcast;
window.launchStorylineMatch = launchStorylineMatch;
window.handleCardClick = handleCardClick;
window.renderGrid = renderGrid;