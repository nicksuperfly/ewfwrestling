/* ==========================================================================
   ELLIS'S MAIN EVENT (EWF UNIVERSE) - MODULAR ENGINE
   MODULE 1 OF 5: js/1-vault-audio.js
   Global State, Roster Vault, Media Catalogs, & Audio Engine
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. GLOBAL ENGINE STATE FLAGS & RUNTIME REGISTERS
   -------------------------------------------------------------------------- */
var isPromoMode = false;
var storyBypassIds = [];
var isMysteryMatchMode = false;
var isBloodFeudBlowoff = false;
var isSlotSpinning = false;
var isRunInActive = false;
var isMatchInProgressLooping = false;
var isPlayingCountdown = false;
var isMatchPostScreenActive = false;
var activeMatchMode = 'normal';
var currentPlayingWrestler = null;
var lastMatchLoser = null;
var pickedReferee = null;
var pickedParticipants = [];
var quickMatchQueue = [];
var rumbleUnenteredQueue = [];
var rumbleInRingList = [];
var rumbleEliminatedList = [];
var rumbleEntrant1 = null;
var rumbleEntrant2 = null;
var rumbleEntrantCount = 10;
var mitbEntrantCount = 6;
var activeSlotIdx = 0;
var liveMatchElapsedSeconds = 0;
var liveMatchTimerInterval = null;
var rumbleTimerInterval = null;
var rumbleTimerSeconds = 110;
var rumbleEntranceDurationTimeout = null;
var matchCardTimeout = null;
var matchCardDelayTimeout = null;
var activeHistoryTab = 'all';
var wakeLockObj = null;
var currentMatchSummary = {};
var fadeInterval = null;
var fadeTimeout = null;
var rumbleEntrantTimeout = null;
var qmSpinTimeout = null;
var nameplateTimeout = null;
var nameplateDelayTimeout = null;
var runInAutoTimeout = null;
var rouletteInterval = null;
var victoryTimeout = null;
var cashInTimeout = null;
var typeWriterInterval = null;
var unpromptedAmbushTimer = null;
var entranceFadeInterval = null;
var entranceFadeTimeout = null;
var contractSigningCallback = null;
var currentContractChamp = null;
var currentContractChallenger = null;
var activeStoryline = null;
var activeStoryWrestlerA = null;
var activeStoryWrestlerB = null;
var activeStagedFeud = null;
var queuedLevelUps = [];
var activeShowcaseTier = null;
var kotrSize = 4;
var kotrMatches = [];
var kotrCurrentMatchIdx = 0;
var kotrCustomEntrants = [];
var kotrPickingSlotIdx = 0;
var currentVideoId = '';
var currentVideoStartTime = '';
var matchEntrants = [];
var currentEntranceIndex = 0;
var isCommentatorVideoActive = false;

var activeBookedMatch = { 
  showKey: "raw", 
  matchType: "Normal Match", 
  formatKey: "1v1", 
  formatCount: 2, 
  participants: [], 
  referee: null,
  refereeId: null,
  isTitleMatch: false, 
  titleCode: "", 
  titleName: "", 
  titleImg: "",
  mitbCoronationShown: false 
};

const INJURY_GRAPHIC_ASSETS = ['injury.png', 'injury2.png', 'injury3.png'];

/* --------------------------------------------------------------------------
   2. IMAGE & ASSET FALLBACK RESOLVERS
   -------------------------------------------------------------------------- */
function handleImgError(img, wrestlerId) {
  if (!img || !wrestlerId) return;
  const fallbacks = [
    wrestlerId + '.png',
    wrestlerId.replace('default-', '') + '.png',
    wrestlerId.replace('default-', '') + 'icon.png'
  ];
  if (!img.dataset.fallbackIndex) img.dataset.fallbackIndex = '0';
  let idx = parseInt(img.dataset.fallbackIndex, 10);
  idx++;
  if (idx < fallbacks.length) {
    img.dataset.fallbackIndex = idx.toString();
    img.src = fallbacks[idx];
  } else {
    img.src = 'logo_notext.png';
  }
}

function getWrestlerPosePath(wrestler) {
  if (!wrestler) return 'logo_notext.png';
  if (wrestler.poseImage) return wrestler.poseImage;
  const cleanId = (wrestler.id || '').replace('default-', '');
  return `${cleanId}_pose.png`;
}

window.handleImgError = handleImgError;
window.getWrestlerPosePath = getWrestlerPosePath;

/* --------------------------------------------------------------------------
   3. ROSTER VAULT & GRANDPARENT CONTRACT CODES
   -------------------------------------------------------------------------- */
const defaultWrestlers = [
  { 
    id: 'default-tripleh', 
    name: "Triple H", 
    image: "triplehicon.png", 
    poseImage: "tripleh_pose.png", 
    youtubeUrl: "https://www.youtube.com/watch?v=dFzSXbjV054, https://youtu.be/onNEHdWX3qY?si=CYf6hE8yIJd4idA-", 
    promoUrl: "https://www.youtube.com/watch?v=QtpcMHdOwUE,https://www.youtube.com/watch?v=NzMxsqu78YI", 
    isDefault: true,
    unlockLevel: 1,
    requiresCode: true, // BATCH 7 ITEM 14: signed on Christmas Day with a contract code
    code: "THEGAME",
    debutBanner: "🎸 IT'S TIME TO PLAY THE GAME! TRIPLE H HAS ARRIVED! 🎸",
    bannerBg: "linear-gradient(180deg, #2e7d32 0%, #0b2e0f 100%)",
    bannerShadow: "0 0 45px #00c853, 0 0 25px #69f0ae" 
  },
  { 
    id: 'default-therock', 
    name: "The Rock", 
    image: "therock.png", 
    poseImage: "therock_pose.png", 
    youtubeUrl: "https://www.youtube.com/watch?v=ZcIYOgcCcnM", 
    promoUrl: "https://youtu.be/jNyerPRUfNo?t=59,https://www.youtube.com/watch?v=I7v7_o2UP10,https://www.youtube.com/watch?v=zdLj_ZOL_YM,https://www.youtube.com/watch?v=WU9yTHjpkJw,https://www.youtube.com/watch?v=nL0MuSunn30,https://youtu.be/OAskS_mdKFU?t=211,https://www.youtube.com/watch?v=e74wxxtlgI8,https://www.youtube.com/watch?v=LY4YcbyDxJw,https://www.youtube.com/watch?v=wAFSBjXoDMA", 
    isDefault: true,
    unlockLevel: 1,
    requiresCode: true, // BATCH 7 ITEM 14: signed on Christmas Day with a contract code
    code: "PEOPLESCHAMP",
    debutBanner: "🤨 FINALLY... THE ROCK HAS COME BACK TO THE EWF! 🤨",
    bannerBg: "linear-gradient(180deg, #8e24aa 0%, #2a0036 100%)",
    bannerShadow: "0 0 45px #e040fb, 0 0 25px #ffd700" 
  },
  { 
    id: 'default-stonecold', 
    name: "Stone Cold", 
    image: "stonecold.png", 
    poseImage: "stonecold_pose.png", 
    youtubeUrl: "https://www.youtube.com/watch?v=MOzjBO2dsmY, https://www.youtube.com/watch?v=cOsqdghHcIk", 
    promoUrl: "https://www.youtube.com/watch?v=nL0MuSunn30,https://youtu.be/OAskS_mdKFU?t=211,https://youtu.be/JFEjVNN5VH8,https://www.youtube.com/watch?v=oPJ37mJi2XE,https://www.youtube.com/watch?v=tjWPoQWdmjg,https://www.youtube.com/watch?v=2kTIuvD_7QU,https://www.youtube.com/watch?v=pgyt7ok7Ojg,https://www.youtube.com/watch?v=sr8Rwf5RAMU,https://www.youtube.com/watch?v=E3eXEd-hmro,https://www.youtube.com/watch?v=_O89Y0VwdPs,https://www.youtube.com/watch?v=eIRVxrNDvJs?t=64", 
    isDefault: true,
    unlockLevel: 1,
    requiresCode: true, // BATCH 7 ITEM 14: signed on Christmas Day with a contract code
    code: "AUSTIN316",
    debutBanner: "🍺 GLASS SHATTERS! STONE COLD STEVE AUSTIN IS HERE! 🍺",
    bannerBg: "linear-gradient(180deg, #424242 0%, #000000 100%)",
    bannerShadow: "0 0 45px #ffffff, 0 0 25px #ff1744" 
  },
  { 
    id: 'default-mankind', 
    name: "Mankind", 
    image: "mankind.png", 
    poseImage: "mankind_pose.png", 
    youtubeUrl: "https://www.youtube.com/watch?v=wiftmVaf0eA", 
    promoUrl: "", 
    isDefault: true,
    unlockLevel: 1,
    requiresCode: true, // BATCH 7 ITEM 14: signed on Christmas Day with a contract code
    code: "MRSOCKO",
    debutBanner: "🧦 HAVE A NICE DAY! MANKIND HAS ARRIVED IN THE EWF! 🧦",
    bannerBg: "linear-gradient(180deg, #5d4037 0%, #1b0f0a 100%)",
    bannerShadow: "0 0 45px #a1887f, 0 0 25px #ff9100" 
  },
  { 
    id: 'default-theundertaker', 
    name: "The Undertaker", 
    image: "theundertaker.png", 
    poseImage: "theundertaker_pose.png", 
    youtubeUrl: "https://www.youtube.com/watch?v=8dcY9LDdRIk", 
    promoUrl: "", 
    isDefault: true,
    unlockLevel: 6 
  },
  { 
    id: 'default-kane', 
    name: "Kane", 
    image: "kane.png", 
    poseImage: "kane_pose.png", 
    youtubeUrl: "https://youtu.be/pN0rmWh6nkE", 
    promoUrl: "", 
    isDefault: true,
    unlockLevel: 10 
  }
];

window.defaultWrestlers = defaultWrestlers;

const SECRET_TALENT_VAULT = [
  {
    code: "CANTSEEME",
    id: "vault-johncena",
    name: "John Cena",
    image: "cena.png",
    poseImage: "cena_pose.png",
    youtubeUrl: "https://www.youtube.com/watch?v=zu8bEljrolk",
    promoUrl: "https://www.youtube.com/watch?v=zu8bEljrolk",
    debutBanner: "🎺 THE CHAMP IS HERE! JOHN CENA HAS ARRIVED! 🎺",
    bannerBg: "linear-gradient(180deg, #0055ff 0%, #001155 100%)",
    bannerShadow: "0 0 45px #0055ff, 0 0 25px #00ffff"
  },
  {
    code: "BLOODLINE",
    id: "vault-romanreigns",
    name: "Roman Reigns",
    image: "roman.png",
    poseImage: "romanreigns_pose.png",
    youtubeUrl: "https://www.youtube.com/watch?v=tDZX7pxAMCA",
    promoUrl: "https://www.youtube.com/watch?v=tDZX7pxAMCA",
    debutBanner: "☝️ ACKNOWLEDGE HIM! THE TRIBAL CHIEF ROMAN REIGNS HAS ARRIVED! ☝️",
    bannerBg: "linear-gradient(180deg, #d32f2f 0%, #7f0000 100%)",
    bannerShadow: "0 0 45px #d32f2f, 0 0 25px #ff0000"
  },
  // BATCH 6 ITEM 4: ADD CM PUNK TO SECRET VAULT
  {
    code: "STRAIGHTEDGE",
    id: "vault-cmpunk",
    name: "CM Punk",
    image: "cmpunk.png",
    poseImage: "cmpunk_pose.png",
    youtubeUrl: "https://www.youtube.com/watch?v=u5HwSRo36Kg",
    promoUrl: "https://www.youtube.com/watch?v=u5HwSRo36Kg",
    debutBanner: "⚡ LOOK IN MY EYES! CM PUNK HAS SHOCKED THE WORLD! ⚡",
    bannerBg: "linear-gradient(180deg, #990000 0%, #111111 100%)",
    bannerShadow: "0 0 45px #ff0000, 0 0 25px #ff4444"
  }
];
window.SECRET_TALENT_VAULT = SECRET_TALENT_VAULT;

// BATCH 7 ITEM 14: With an empty roster (before contract codes are entered) matches can't run.
// Returns true if there are enough superstars; otherwise explains and opens the contract vault.
function ensureRosterReady(minNeeded = 2) {
  try {
    const count = (typeof getUnlockedWrestlers === 'function') ? getUnlockedWrestlers().filter(w => !(typeof getInjuryRecord === 'function' && getInjuryRecord(w.id))).length : 99;
    if (count >= minNeeded) return true;
    alert(`✍️ SIGN YOUR SUPERSTARS FIRST!\n\nThe EWF needs at least ${minNeeded} superstars ready to wrestle. Enter a contract code from one of your figures to sign them.`);
    if (typeof openModal === 'function') openModal(); else { const m = document.getElementById('wrestlerModal'); if (m) m.style.display = 'flex'; }
    return false;
  } catch (e) { return true; }
}
window.ensureRosterReady = ensureRosterReady;

function getUnlockedVaultIds() {
  try {
    const stored = localStorage.getItem('ewf_unlocked_vault_ids');
    return stored ? JSON.parse(stored) : [];
  } catch (e) { return []; }
}
window.getUnlockedVaultIds = getUnlockedVaultIds;

function saveUnlockedVaultId(id) {
  try {
    const unlocked = getUnlockedVaultIds();
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      localStorage.setItem('ewf_unlocked_vault_ids', JSON.stringify(unlocked));
    }
  } catch (e) {}
}
window.saveUnlockedVaultId = saveUnlockedVaultId;

// ITEM 15: Vault Redeem Routes to the Contract Signing Ceremony via Lights-Out Debut
window.redeemVaultCode = function() {
  const inputEl = document.getElementById('vaultCodeInput');
  const msgEl = document.getElementById('vaultCodeMessage');
  if (!inputEl || !msgEl) return;

  const code = inputEl.value.trim().toUpperCase();
  const unlocked = getUnlockedVaultIds();
  // BATCH 7 ITEM 14: core superstars (Triple H, The Rock, Stone Cold, Mankind) are now signed by code too
  const found = SECRET_TALENT_VAULT.find(v => v.code === code) ||
                (typeof defaultWrestlers !== 'undefined' ? defaultWrestlers.find(w => w.requiresCode && w.code === code) : null);

  if (found) {
    if (unlocked.includes(found.id)) {
      msgEl.innerText = "⚠️ SUPERSTAR ALREADY SIGNED TO ROSTER";
      msgEl.style.color = "#ffd700";
      msgEl.style.display = "block";
      return;
    }
    
    msgEl.style.display = "none";
    inputEl.value = "";
    if (typeof window.closeModal === 'function') window.closeModal();
    
    if (typeof window.executeSuperstarBlackoutDebut === 'function') {
      window.executeSuperstarBlackoutDebut({ level: 1, unlockName: found.name, unlockType: 'wrestler' }, found);
    } else if (typeof window.openWelcomeInductionModal === 'function') {
      window.openWelcomeInductionModal(found, true);
    }
  } else {
    msgEl.innerText = "❌ INVALID CONTRACT CODE";
    msgEl.style.color = "#ff3333";
    msgEl.style.display = "block";
    try {
      const errorSound = typeof tableCrashSound !== 'undefined' ? tableCrashSound : new Audio('table_crash.mp3');
      errorSound.currentTime = 0; errorSound.volume = 0.4; errorSound.play().catch(() => {});
    } catch (e) {}
  }
};

/* --------------------------------------------------------------------------
   4. SHOW CATALOGS, FORMATS & STIPULATIONS
   -------------------------------------------------------------------------- */
const showKeys = ['raw', 'smackdown', 'summerslam', 'survivor', 'backlash', 'rumble', 'mania', 'kotr', 'mitb'];
var currentShowIdx = 0;

const showIntros = {
  signature: "https://www.youtube.com/watch?v=3fzP4sdJBJ4",
  raw: "https://www.youtube.com/watch?v=16go7SQ_zGc",
  smackdown: "https://www.youtube.com/watch?v=cNK88vDbqeU",
  summerslam: "https://youtu.be/8N3ib3LpCFk?is=3jfRFIe4XVaJTbXm",
  survivor: "https://youtu.be/DKi7dI2M4a4?is=rjpo3cqGmolvPc6_",
  rumble: "https://www.youtube.com/watch?v=TDyvu2W7Nqk",
  mania: "https://www.youtube.com/watch?v=Lhmi1C4JYi4",
  kotr: "https://www.youtube.com/watch?v=erO6UYBnihA",
  backlash: "https://youtu.be/Hxw9pKj1A10",
  mitb: "https://www.youtube.com/watch?v=frNdS-Bu3vc"
};

function getShowLogo(key) {
  if (key === 'mania') return 'wrestlemania_logo.png';
  if (key === 'backlash') return 'baclash_logo.png';
  if (key === 'kotr') return 'kotr_logo.png';
  if (key === 'mitb') return 'mitb_logo.png';
  if (key === 'survivor') return 'survivor_logo.png';
  return key + '_logo.png';
}

const formatKeys = ["1v1", "triple", "fatal", "tag", "rumble", "mitb", "kotr"];
const formatLabels = ["1 VS 1 MATCH", "TRIPLE THREAT (3-WAY)", "FATAL 4-WAY", "TAG TEAM MATCH", "ROYAL RUMBLE", "MONEY IN THE BANK", "KING OF THE RING"];
const formatLogos = ["1v1.png", "triple_threat.png", "fatal_4way.png", "tag_team.png", "rumble_logo.png", "mitb_logo.png", "kotr_logo.png"];
const mysteryFormatLogos = ["1v1.png", "triple_threat.png", "fatal_4way.png"];
var currentFormatIdx = 0;

const allMatchTypes = [
  "Normal Match", "Ambulance Match", "Tables Match", "TLC Match", "Ladder Match", "No Disqualification", 
  "Submission Match", "Last Man Standing", "Falls Count Anywhere", "2 out of 3 Falls", 
  "Special Guest Referee", "Lumberjack Match"
];

const tagMatchTypes = ["Normal Match", "TLC Match", "Tables Match", "Ladder Match", "No Disqualification"];
var activeMatchTypesList = [...allMatchTypes];
var currentTypeIdx = 0;

const matchTypeLogos = {
  "Normal Match": "normal_match.png", "Ambulance Match": "ambulance.png", "Tables Match": "tables.png",
  "TLC Match": "tlc.png", "Ladder Match": "ladder.png", "No Disqualification": "no_dq.png",
  "Submission Match": "submission.png", "Last Man Standing": "last_man.png", "Falls Count Anywhere": "falls_anywhere.png",
  "2 out of 3 Falls": "two_out_of_three.png", "Special Guest Referee": "special_referee.png",
  "Lumberjack Match": "lumberjack.png", "Money in the Bank": "mitb_logo.png", "MITB Cash-In Match": "mitb_logo.png",
  "King of the Ring": "kotr_logo.png"
};

const stingerVideos = [
  'EWF_Video1.mp4', 'EWFVideo_1.mp4', 'EWFVideo1.mp4', 'ewf_video1.mp4',
  'EWF_Video2.mp4', 'EWFVideo_2.mp4', 'EWFVideo2.mp4', 'ewf_video2.mp4',
  'EWF_Video3.mp4', 'EWFVideo_3.mp4', 'EWFVideo3.mp4', 'ewf_video3.mp4'
];

const matchCrowdSounds = ['match_crowd1.mp3', 'match_crowd2.mp3', 'match_crowd3.mp3', 'match_crowd4.mp3'];

/* --------------------------------------------------------------------------
   5. HOME SCREEN NAVIGATION & MODAL BRIDGES
   -------------------------------------------------------------------------- */
window.triggerLogoStinger = function(callback) {
  const executeCallback = () => { if (typeof callback === 'function') { callback(); } };
  const overlay = document.getElementById('stingerOverlay'); 
  const video = document.getElementById('stingerVideo');

  if (!overlay || !video || !stingerVideos || stingerVideos.length === 0) { 
    executeCallback(); 
    return; 
  }

  overlay.style.display = 'flex';
  
  let finished = false;
  const hideStinger = () => {
    if (finished) return;
    finished = true;
    overlay.style.display = 'none';
    try { video.pause(); } catch (e) {}
    video.onended = null;
    video.onerror = null;
    executeCallback();
  };

  let attempts = 0;
  const playRandomCandidate = () => {
    const candidate = stingerVideos[Math.floor(Math.random() * stingerVideos.length)];
    video.src = candidate;
    video.currentTime = 0;
    
    const p = video.play();
    if (p !== undefined) {
      p.catch(() => {
        video.muted = true;
        video.play().catch(() => hideStinger());
      });
    }
  };

  video.onended = hideStinger;
  video.onerror = () => {
    attempts++;
    if (attempts < 8) {
      playRandomCandidate();
    } else {
      hideStinger();
    }
  };

  setTimeout(hideStinger, 3500);
  playRandomCandidate();
};

window.launchMysteryMatchDirect = function() {
  if (typeof openMatchEngine === 'function') openMatchEngine(true);
};

window.togglePromoMode = function() {
  window.isPromoMode = !window.isPromoMode;
  const btn = document.getElementById('promoToggleBtn');
  if (btn) {
    btn.classList.toggle('active', window.isPromoMode);
    btn.innerText = window.isPromoMode ? 'PROMO MODE: ON' : 'PROMO MODE';
  }
};

window.openHistoryModal = function() {
  const modal = document.getElementById('historyModal');
  if (modal) {
    modal.style.display = 'flex';
    if (typeof switchHistoryTab === 'function') switchHistoryTab('all');
  }
};

window.closeHistoryModal = function() {
  const modal = document.getElementById('historyModal');
  if (modal) modal.style.display = 'none';
};

window.openModal = function() {
  const m = document.getElementById('wrestlerModal');
  if (m) m.style.display = 'flex';
};

window.closeModal = function() {
  const m = document.getElementById('wrestlerModal');
  if (m) m.style.display = 'none';
};

window.triggerCameraFlash = function() {
  const flash = document.getElementById('flashOverlay');
  if (flash) { 
    flash.classList.remove('flash-anim'); 
    void flash.offsetWidth; 
    flash.classList.add('flash-anim'); 
    setTimeout(() => flash.classList.remove('flash-anim'), 400);
  }
  window.playPyroBlast();
};

async function enableWakeLock() { try { if ('wakeLock' in navigator) { wakeLockObj = await navigator.wakeLock.request('screen'); } } catch (err) {} }
function disableWakeLock() { if (wakeLockObj !== null) { wakeLockObj.release().then(() => { wakeLockObj = null; }).catch(()=>{}); } }

window.setElDisplay = function(id, displayStyle) { 
  const el = document.getElementById(id); 
  if (el) el.style.display = displayStyle; 
};

/* --------------------------------------------------------------------------
   6. AUDIO ENGINE, SYNTHESIZERS & DUAL-DECK BGM
   -------------------------------------------------------------------------- */
var matchCrowdSound = new Audio();
const entranceCrowdSound = new Audio('crowd.mp3');
const bellSound = new Audio('bell.mp3'); 
const victorySound = new Audio('victory.mp3');
const slotSpinSound = new Audio('slot_spin.mp3');
const slotLockSound = new Audio('slot_lock.mp3');
const slambulanceSirenSound = new Audio('slambulance_siren.mp3');
const eliminationSound = new Audio('elimination.mp3');
const titleClinkSound = new Audio('title_clink.mp3');
const mitbSlamSound = new Audio('mitb_slam.mp3');

// ITEM 5: MITB Cash-In Audio Isolation
const cashinSirenSound = new Audio('cashin_siren.mp3');
cashinSirenSound.volume = 1.0; 

// ITEMS 13 & 14: New Cutscene Audio
const pyroBlastSound = new Audio('pyro_blast.mp3');
pyroBlastSound.volume = 0.95;
const heartbeatLoopSound = new Audio('heartbeat.mp3');
heartbeatLoopSound.volume = 0.85;
heartbeatLoopSound.loop = true;

const matchCardSlamSound = new Audio('match_card_slam.mp3');
const typewriterSound = new Audio('typewriter.mp3'); 
typewriterSound.loop = true;

const anvilSlamSound = new Audio('level_up.mp3');
const achievementUnlockSound = new Audio('achievement_unlock.mp3');

const kotrFanfareSound = new Audio('kotr_fanfare.mp3');
const penSignSound = new Audio('pen_sign.mp3');
const tableCrashSound = new Audio('table_crash.mp3');
const hofFanfareSound = new Audio('hof_fanfare.mp3');
const bloodFeudSound = new Audio('blood_feud.mp3');
bloodFeudSound.volume = 0.85;

const lightsOutSound = new Audio('lightsout.mp3');
const breakingSound = new Audio('breaking.mp3');
const pyroSound = new Audio('pyro.mp3');
const ohMyGodSound = new Audio('ohmygod.mp3');

entranceCrowdSound.loop = false;
slotSpinSound.loop = true;

const BGM_PLAYLIST = [
  'menu_music_1.mp3', 'menu_music_2.mp3', 'menu_music_3.mp3', 'menu_music_4.mp3', 'menu_music_5.mp3',
  'menu_music_6.mp3', 'menu_music_7.mp3', 'menu_music_8.mp3', 'menu_music_9.mp3', 'menu_music_10.mp3'
];
var bgmDeckA = new Audio();
var bgmDeckB = new Audio();
var isBgmEnabled = true;
var isBgmPlaying = false;
var activeBgmDeck = 'A';
var bgmInterval = null;
var wasBgmActiveBeforeHidden = false;

window.initBGM = function() {
  document.body.addEventListener('click', startBgmEngine, { once: true });
};

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (isBgmPlaying) {
      window.stopBGMForAction();
      wasBgmActiveBeforeHidden = true;
    }
  } else {
    const videoModal = document.getElementById('videoModal');
    if (wasBgmActiveBeforeHidden && isBgmEnabled && (!videoModal || videoModal.style.display !== 'flex')) {
      wasBgmActiveBeforeHidden = false;
      startBgmEngine();
    }
  }
});

window.toggleBGM = function() {
  isBgmEnabled = !isBgmEnabled;
  const btn = document.getElementById('bgmToggleBtn');
  const text = document.getElementById('bgmText');
  if (isBgmEnabled) {
    if (btn) btn.classList.remove('is-muted');
    if (text) text.innerText = 'BGM: ON';
    const videoModal = document.getElementById('videoModal');
    if (!isBgmPlaying && (!videoModal || videoModal.style.display !== 'flex')) startBgmEngine();
  } else {
    if (btn) btn.classList.add('is-muted');
    if (text) text.innerText = 'BGM: OFF';
    window.stopBGMForAction();
  }
};

function startBgmEngine() {
  if (!isBgmEnabled || isBgmPlaying) return;
  isBgmPlaying = true;
  activeBgmDeck = 'A';
  playBgmTrack(bgmDeckA);
  clearInterval(bgmInterval);
  bgmInterval = setInterval(checkBgmCrossfade, 1000);
}

function playBgmTrack(deck) {
  const track = BGM_PLAYLIST[Math.floor(Math.random() * BGM_PLAYLIST.length)];
  deck.src = track;
  deck.volume = 0.20;
  deck.play().catch(()=>{});
}

function checkBgmCrossfade() {
  const currentDeck = activeBgmDeck === 'A' ? bgmDeckA : bgmDeckB;
  const nextDeck = activeBgmDeck === 'A' ? bgmDeckB : bgmDeckA;
  
  if (currentDeck.duration && currentDeck.currentTime >= 86) {
    playBgmTrack(nextDeck);
    activeBgmDeck = activeBgmDeck === 'A' ? 'B' : 'A';
    
    let fadeStep = 0;
    let crossFadeInt = setInterval(() => {
      fadeStep++;
      if (currentDeck.volume > 0.01) currentDeck.volume -= 0.01;
      if (fadeStep >= 20) {
        clearInterval(crossFadeInt);
        currentDeck.pause();
      }
    }, 200);
  }
}

window.stopBGMForAction = function() {
  isBgmPlaying = false;
  clearInterval(bgmInterval);
  bgmDeckA.pause(); 
  bgmDeckB.pause();
};

window.resumeBGM = function() {
  const videoModal = document.getElementById('videoModal');
  if (isBgmEnabled && !isBgmPlaying && (!videoModal || videoModal.style.display !== 'flex')) {
    startBgmEngine();
  }
};

var audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') { audioCtx.resume().catch(()=>{}); }
  return audioCtx;
}

window.playPyroBlast = function() {
  try {
    pyroSound.currentTime = 0;
    pyroSound.volume = 0.85;
    pyroSound.play().catch(() => window.playSynthesizedFlash());
  } catch (e) {
    window.playSynthesizedFlash();
  }
};

// ITEM 13: Royal Rumble Staredown Concussion Blast
window.playHeavyPyroBlast = function() {
  try {
    pyroBlastSound.currentTime = 0;
    pyroBlastSound.play().catch(() => window.playPyroBlast());
  } catch(e) {
    window.playPyroBlast();
  }
};

// ITEM 14: MITB Stalking Paranoia Loop
window.playHeartbeatLoop = function() {
  try {
    heartbeatLoopSound.currentTime = 0;
    heartbeatLoopSound.play().catch(()=>{});
  } catch(e) {}
};

window.stopHeartbeatLoop = function() {
  try {
    heartbeatLoopSound.pause();
    heartbeatLoopSound.currentTime = 0;
  } catch(e) {}
};

window.playSynthesizedFlash = function() {
  try {
    const ctx = getAudioContext(); if (!ctx) return;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(850, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.16);
  } catch(e){}
};

function playSynthesizedSiren() {
  try {
    const ctx = getAudioContext(); if (!ctx) return;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.6);
    osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 1.2);
    osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 1.8);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 2.4);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 2.5);
  } catch(e){}
}

window.playSubBassBoom = function() {
  try {
    const audio = new Audio('ambush_hit.mp3');
    audio.play().catch(() => {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 1.2);
      gain.gain.setValueAtTime(0.85, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    });
  } catch (e) {}
};

window.playEliminationAudio = function() {
  try {
    eliminationSound.currentTime = 0;
    eliminationSound.volume = 0.9;
    const p = eliminationSound.play();
    if (p !== undefined) p.catch(() => playSynthesizedEliminationImpact());
  } catch(e) {
    playSynthesizedEliminationImpact();
  }
};

function playSynthesizedEliminationImpact() {
  try {
    const ctx = getAudioContext(); if (!ctx) return;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.75, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.36);
  } catch(e){}
}

window.playTitleClinkAudio = function() {
  try {
    titleClinkSound.currentTime = 0;
    titleClinkSound.volume = 0.75;
    titleClinkSound.play().catch(()=>{});
  } catch(e){}
};

window.playMitbSlamAudio = function() {
  try {
    mitbSlamSound.currentTime = 0;
    mitbSlamSound.volume = 0.85;
    mitbSlamSound.play().catch(()=>{});
  } catch(e){}
};

// ITEM 5: Duck crowds and maximize the emergency tone
window.playCashinSirenAndDuck = function() {
  try {
    window.stopMatchCrowd(); 
    if (entranceCrowdSound) entranceCrowdSound.volume = 0;
    cashinSirenSound.currentTime = 0;
    cashinSirenSound.play().catch(() => playSynthesizedSiren());
  } catch(e) {
    playSynthesizedSiren();
  }
};

window.playMatchCardSlamAudio = function() {
  try {
    const slamClone = matchCardSlamSound.cloneNode();
    slamClone.volume = 0.95;
    const p = slamClone.play();
    if (p !== undefined) p.catch(() => playSynthesizedMatchCardSlam());
  } catch(e) {
    playSynthesizedMatchCardSlam();
  }
};

function playSynthesizedMatchCardSlam() {
  try {
    const ctx = getAudioContext(); if (!ctx) return;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.55);
    gain.gain.setValueAtTime(0.9, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.62);
  } catch(e){}
}

window.playLightsOutAudio = function() {
  try {
    lightsOutSound.currentTime = 0;
    lightsOutSound.play().catch(() => window.playSubBassBoom());
  } catch (e) {
    window.playSubBassBoom();
  }
};

window.playBreakingNewsAudio = function() {
  try {
    breakingSound.currentTime = 0;
    breakingSound.play().catch(() => window.playMatchCardSlamAudio());
  } catch (e) {
    window.playMatchCardSlamAudio();
  }
};

window.playSlambulanceAudio = function() {
  try {
    slambulanceSirenSound.currentTime = 0;
    slambulanceSirenSound.play().catch(() => playSynthesizedSiren());
  } catch (e) {
    playSynthesizedSiren();
  }
};

window.playOhMyGodSting = function() {
  try {
    ohMyGodSound.volume = 1.0;
    ohMyGodSound.currentTime = 0;
    ohMyGodSound.play().catch(() => {});
    setTimeout(() => {
      let vol = ohMyGodSound.volume;
      const fadeOut = setInterval(() => {
        if (vol > 0.1) { vol -= 0.1; ohMyGodSound.volume = vol; }
        else { clearInterval(fadeOut); ohMyGodSound.pause(); }
      }, 100);
    }, 1800);
  } catch (e) {}
};

const maxEntranceCrowdVolume = 0.12; 
const maxCrowdVolume = 0.25;
const maxVictoryVolume = 0.4;

window.playEntranceCrowd = function() { 
  try { 
    clearInterval(entranceFadeInterval);
    clearTimeout(entranceFadeTimeout);
    entranceCrowdSound.volume = maxEntranceCrowdVolume; 
    entranceCrowdSound.currentTime = 0; 
    entranceCrowdSound.play().catch(()=>{}); 

    entranceFadeTimeout = setTimeout(() => {
      window.stopEntranceCrowd(true);
    }, 3500);
  } catch(e) {} 
};

window.stopEntranceCrowd = function(smooth = false) { 
  try { 
    clearTimeout(entranceFadeTimeout);
    if (smooth) {
      clearInterval(entranceFadeInterval);
      const steps = 30; const stepTime = 120; const volStep = entranceCrowdSound.volume / steps;
      entranceFadeInterval = setInterval(() => {
        if (entranceCrowdSound.volume > volStep) { 
          entranceCrowdSound.volume = Math.max(0, entranceCrowdSound.volume - volStep); 
        } else { 
          entranceCrowdSound.volume = 0; 
          entranceCrowdSound.pause(); 
          clearInterval(entranceFadeInterval); 
        }
      }, stepTime);
    } else {
      clearInterval(entranceFadeInterval); 
      entranceCrowdSound.pause(); 
      entranceCrowdSound.volume = 0;
    }
  } catch(e) {} 
};

window.playRandomMatchCrowd = function(volumeLevel = maxCrowdVolume) { 
  try { 
    matchCrowdSound.pause(); 
    matchCrowdSound.src = matchCrowdSounds[Math.floor(Math.random() * matchCrowdSounds.length)]; 
    matchCrowdSound.loop = true; 
    matchCrowdSound.volume = volumeLevel; 
    matchCrowdSound.currentTime = 0; 
    matchCrowdSound.play().catch(()=>{}); 
  } catch(e) {} 
};

window.stopMatchCrowd = function() { 
  try { matchCrowdSound.pause(); matchCrowdSound.loop = false; } catch(e) {} 
};

window.addEventListener('DOMContentLoaded', window.initBGM);