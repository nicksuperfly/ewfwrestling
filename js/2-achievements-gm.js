/* ==========================================================================
   ELLIS'S MAIN EVENT (EWF UNIVERSE) - MODULAR ENGINE
   MODULE 2 OF 5: js/2-achievements-gm.js
   GM Profile, Milestones, History Logs, and The Blackout Debut Engine
   ========================================================================== */

/* --------------------------------------------------------------------------
   0. GM LEVEL PROGRESSION LADDER (LEVELS 1-20 FULL RE-BALANCE)
   -------------------------------------------------------------------------- */
const LEVEL_LADDER = [
  { level: 1,  xpReq: 0,     title: "Rookie Booker",             unlockType: "none",     unlockKey: "none",                  unlockName: "5-Man Core Roster & Standard Matches", unlockImg: "logo_notext.png" },
  { level: 2,  xpReq: 500,   title: "TV Coordinator",              unlockType: "titles",   unlockKey: "titles",                unlockName: "Championship Belts",    unlockImg: "whc.png" },
  { level: 3,  xpReq: 1100,  title: "Chief Medical Officer",     unlockType: "injuries", unlockKey: "injuries",              unlockName: "Medical Ward & Injuries",              unlockImg: "story_26.png" },
  { level: 4,  xpReq: 1800,  title: "Hardcore Coordinator",        unlockType: "match",    unlockKey: "TLC Match",             unlockName: "TLC (Tables, Ladders & Chairs) Match", unlockImg: "tlc.png" },
  { level: 5,  xpReq: 2600,  title: "Emergency Dispatcher",        unlockType: "match",    unlockKey: "Ambulance Match",       unlockName: "Slambulance Match & Evacuation",       unlockImg: "ambulance.png" },
  { level: 6,  xpReq: 3500,  title: "Lord of Darkness",          unlockType: "wrestler", unlockKey: "default-theundertaker", unlockName: "The Undertaker",                       unlockImg: "theundertaker_pose.png" },
  { level: 7,  xpReq: 4500,  title: "Contract Executive",        unlockType: "show",     unlockKey: "mitb",                  unlockName: "Money in the Bank Ladder Match",       unlockImg: "mitb_briefcase.png" },
  { level: 8,  xpReq: 5600,  title: "Tournament Director",         unlockType: "show",     unlockKey: "kotr",                  unlockName: "King of the Ring Tournament",          unlockImg: "kotr_crown.png" },
  { level: 9,  xpReq: 6800,  title: "Main Event Chairman",         unlockType: "show",     unlockKey: "rumble",                unlockName: "The 30-Man Royal Rumble Match",        unlockImg: "rumble_logo.png" },
  { level: 10, xpReq: 8200,  title: "Director of Chaos",          unlockType: "wrestler", unlockKey: "default-kane",         unlockName: "Kane",                                 unlockImg: "kane_pose.png" },
  { level: 11, xpReq: 9800,  title: "Senior Vice President",       unlockType: "show",     unlockKey: "badblood",              unlockName: "Bad Blood: Grudge Night",              unlockImg: "badblood_logo.png" },
  { level: 12, xpReq: 11600, title: "Executive Producer",          unlockType: "show",     unlockKey: "custom",                unlockName: "Create Your Own Show",                 unlockImg: "logo_notext.png" },
  { level: 13, xpReq: 13600, title: "Managing Director",          unlockType: "show",     unlockKey: "judgmentday",           unlockName: "Judgment Day: Good vs Bad",            unlockImg: "judgmentday_logo.png" },
  { level: 14, xpReq: 15800, title: "Head of Creative",            unlockType: "none",     unlockKey: "none",                  unlockName: "Bragging Rights: Level 14 GM",            unlockImg: "logo_notext.png" },
  { level: 15, xpReq: 18200, title: "Corporate Titan",             unlockType: "show",     unlockKey: "nomercy",               unlockName: "No Mercy: Anything Goes",              unlockImg: "nomercy_logo.png" },
  { level: 16, xpReq: 20800, title: "Franchise Architect",         unlockType: "none",     unlockKey: "none",                  unlockName: "Bragging Rights: Level 16 GM",            unlockImg: "logo_notext.png" },
  { level: 17, xpReq: 23600, title: "Industry Icon",               unlockType: "none",     unlockKey: "none",                  unlockName: "Bragging Rights: Level 17 GM",            unlockImg: "logo_notext.png" },
  { level: 18, xpReq: 26600, title: "Living Legend",               unlockType: "none",     unlockKey: "none",                  unlockName: "Bragging Rights: Level 18 GM",            unlockImg: "logo_notext.png" },
  { level: 19, xpReq: 29800, title: "Board of Directors",          unlockType: "none",     unlockKey: "none",                  unlockName: "Bragging Rights: Level 19 GM",            unlockImg: "logo_notext.png" },
  { level: 20, xpReq: 33200, title: "Ultimate Federation Mogul", unlockType: "none",     unlockKey: "none",                  unlockName: "Permanent Hall of Fame Executive",     unlockImg: "logo_notext.png" }
];

window.LEVEL_LADDER = LEVEL_LADDER;

function isMedicalWardUnlocked() {
  return getGMLevel() >= 3;
}
window.isMedicalWardUnlocked = isMedicalWardUnlocked;

/* --------------------------------------------------------------------------
   1. 5-TIER THEMATIC SECRET ACHIEVEMENTS CATALOG
   -------------------------------------------------------------------------- */
const SECRET_ACHIEVEMENTS = [
  // ⚡ ELECTRIC CYAN: PERFORMANCE & CLASSICS
  { id: 'first_bell',          tier: 'tier-cyan',    icon: '⚡', title: "First Bell",         xp: 100, desc: "Book and complete your very first match in EWF." },
  { id: 'five_star_standard',  tier: 'tier-cyan',    icon: '⭐', title: "Five-Star Standard", xp: 75,  desc: "Award any match 5 stars on the official summary screen." },
  { id: 'five_star_general',   tier: 'tier-cyan',    icon: '🌟', title: "Five-Star General",  xp: 300, desc: "Produce three separate 5-star match classics." },
  { id: 'tap_out',             tier: 'tier-cyan',    icon: '🥋', title: "Tap Out!",             xp: 125, desc: "Crown a victor in a Submission Match." },
  { id: 'roulette_gambler',    tier: 'tier-cyan',    icon: '🎰', title: "Roulette Gambler",   xp: 100, desc: "Book and finish a bout created via the Mystery Match slot machine." },

  // 🎙️ BRONZE: FRONT OFFICE & PRODUCTION
  { id: 'front_office',        tier: 'tier-bronze',  icon: '📋', title: "Front Office",       xp: 50,  desc: "Open the EWF Universe Hub to inspect titles, teams, or feuds." },
  { id: 'soundcheck',          tier: 'tier-bronze',  icon: '🎙️', title: "Soundcheck",         xp: 50,  desc: "Preview an entrance theme or promo video from the roster grid." },
  { id: 'dotted_line',         tier: 'tier-bronze',  icon: '✍️', title: "Dotted Line",        xp: 150, desc: "Complete a championship contract signing." },
  { id: 'medical_ward',        tier: 'tier-bronze',  icon: '🏥', title: "Medical Ward",       xp: 100, desc: "Clear an injured superstar from the hospital wing in Universe Hub." },
  { id: 'workhorse_promoter',  tier: 'tier-bronze',  icon: '📅', title: "Workhorse Promoter", xp: 150, desc: "Successfully complete 5 total matches in your career." },
  { id: 'television_mogul',    tier: 'tier-bronze',  icon: '📺', title: "Television Mogul",   xp: 250, desc: "Complete 10 total matches across any show." },
  { id: 'first_broadcast',     tier: 'tier-bronze',  icon: '📺', title: "First Broadcast",    xp: 75,  desc: "Book and sign off your very first TV or PPV show card." },
  { id: 'the_showrunner',      tier: 'tier-bronze',  icon: '🎬', title: "The Showrunner",     xp: 150, desc: "Successfully complete and sign off 5 full event cards." },

  // 🏆 CHAMPIONSHIP GOLD: TITLES & TOURNAMENTS
  { id: 'the_holy_grail',      tier: 'tier-gold',    icon: '🏆', title: "The Holy Grail",     xp: 200, desc: "Crown a new World Heavyweight Champion." },
  { id: 'workhorse_heritage',  tier: 'tier-gold',    icon: '🥇', title: "Workhorse Heritage", xp: 150, desc: "Crown a new Intercontinental Champion." },
  { id: 'double_trouble',      tier: 'tier-gold',    icon: '🤝', title: "Double Trouble",     xp: 150, desc: "Crown new World Tag Team Champions." },
  { id: 'crown_the_king',      tier: 'tier-gold',    icon: '👑', title: "Crown the King",     xp: 300, desc: "Win the King of the Ring Tournament." },
  { id: 'contract_in_hand',    tier: 'tier-gold',    icon: '💼', title: "Contract in Hand",   xp: 300, desc: "Win a Money in the Bank Ladder Match." },
  { id: 'megalomaniac',        tier: 'tier-gold',    icon: '👑', title: "Megalomaniac",       xp: 300, desc: "Score an A+ (4.5+ ★) Overall Show Grade on SummerSlam or WrestleMania." },

  // 💀 CRIMSON: BLOOD FEUDS & VIOLENCE
  { id: 'sparks_flying',       tier: 'tier-crimson', icon: '🔥', title: "Sparks Flying",      xp: 75,  desc: "Have a rivalry ignite or escalate after a heated match." },
  { id: 'grudge_settler',      tier: 'tier-crimson', icon: '💀', title: "Grudge Settler",     xp: 250, desc: "Defeat a rival in a Tier 3 Blood Feud blowoff match." },
  { id: 'hardcore_havoc',      tier: 'tier-crimson', icon: '🩸', title: "Hardcore Havoc",     xp: 125, desc: "Crown a new Hardcore Champion." },
  { id: 'broken_furniture',    tier: 'tier-crimson', icon: '🪵', title: "Broken Furniture",   xp: 150, desc: "Complete 3 weapon-destruction bouts (Tables, Ladder, or TLC matches)." },
  { id: 'calling_backup',      tier: 'tier-crimson', icon: '🚨', title: "Calling for Backup", xp: 125, desc: "Trigger a manual run-in or call for a Slambulance during a match." },
  { id: 'back_from_dead',      tier: 'tier-crimson', icon: '🚑', title: "Back from the Dead", xp: 200, desc: "Witness a superstar return from a Major Injury via a surprise lights-out ambush." },

  // 💎 AMETHYST PURPLE: IMMORTAL HALL OF FAME
  { id: 'iron_gauntlet',       tier: 'tier-purple',  icon: '🥊', title: "The Iron Gauntlet",  xp: 500, desc: "Win the 30-Man Royal Rumble." },
  { id: 'immortal_maker',      tier: 'tier-purple',  icon: '🏛️', title: "Immortal Maker",     xp: 400, desc: "Conduct an official enshrinement ceremony into the EWF Hall of Fame." },
  { id: 'grand_tour_promoter', tier: 'tier-purple',  icon: '🌍', title: "Grand Tour Promoter", xp: 500, desc: "Host at least one official card across all show brands." }
];

window.SECRET_ACHIEVEMENTS = SECRET_ACHIEVEMENTS;

/* --------------------------------------------------------------------------
   2. GM PROFILE STATE & XP ENGINE
   -------------------------------------------------------------------------- */
function getGMProfile() {
  try {
    const raw = localStorage.getItem('ewf_gm_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        parsed.level = parseInt(parsed.level, 10) || 1;
        if (!Array.isArray(parsed.unlockedAchievements)) parsed.unlockedAchievements = [];
        parsed.stats = parsed.stats || { matches: 0, fiveStars: 0, furnitureMatches: 0, showsCompleted: 0, showBrands: [] };
        
        // --- BATCH 5 ITEM 12 FIX: AUTO-RECONCILE FIVE-STAR GENERAL UNLOCK ---
        if (parsed.unlockedAchievements.includes('five_star_general') && (parsed.stats.fiveStars || 0) < 10) {
            parsed.unlockedAchievements = parsed.unlockedAchievements.filter(a => a !== 'five_star_general');
            localStorage.setItem('ewf_gm_profile', JSON.stringify(parsed));
        }

        return parsed;
      }
    }
  } catch(e){}
  return { 
    xp: 0, 
    level: 1, 
    unlockedAchievements: [], 
    stats: { matches: 0, fiveStars: 0, furnitureMatches: 0, showsCompleted: 0, showBrands: [] } 
  };
}

function saveGMProfile(profile) {
  try {
    const existing = getGMProfile();
    if (existing && Array.isArray(existing.unlockedAchievements)) {
      const merged = Array.from(new Set([...(existing.unlockedAchievements || []), ...(profile.unlockedAchievements || [])]));
      profile.unlockedAchievements = merged;
    }
    localStorage.setItem('ewf_gm_profile', JSON.stringify(profile));
  } catch(e){}
}

function getGMLevel() {
  return parseInt(getGMProfile().level, 10) || 1;
}

function addXP(amount, reason = "") {
  const profile = getGMProfile();
  const oldLevel = parseInt(profile.level, 10) || 1;
  profile.xp = (profile.xp || 0) + amount;
  
  let currentLevel = 1;
  for (let i = LEVEL_LADDER.length - 1; i >= 0; i--) {
    if (profile.xp >= LEVEL_LADDER[i].xpReq) {
      currentLevel = LEVEL_LADDER[i].level;
      break;
    }
  }

  profile.level = currentLevel;
  saveGMProfile(profile);

  updateGMHeaderWidget();

  if (currentLevel > oldLevel) {
    let acknowledged = JSON.parse(localStorage.getItem('ewf_acknowledged_levels') || '[]');
    if (!window.queuedLevelUps) window.queuedLevelUps = [];
    for (let l = oldLevel + 1; l <= currentLevel; l++) {
      if (!acknowledged.includes(l) && !window.queuedLevelUps.includes(l)) {
        window.queuedLevelUps.push(l);
      }
    }
    if (!window.isMatchPostScreenActive) {
      checkNextQueuedLevelUp();
    }
  }
}

/* --------------------------------------------------------------------------
   3. CENTERED ACHIEVEMENT NOTIFICATION ENGINE
   -------------------------------------------------------------------------- */
let achievementQueue = [];
let isAchievementShowing = false;
let achAutoDismissTimeout = null;

function unlockAchievement(achId) {
  const profile = getGMProfile();
  if (!profile.unlockedAchievements) profile.unlockedAchievements = [];
  
  if (profile.unlockedAchievements.includes(achId)) return false;

  const ach = SECRET_ACHIEVEMENTS.find(a => a.id === achId);
  if (!ach) return false;

  profile.unlockedAchievements.push(achId);
  saveGMProfile(profile);

  showAchievementPopup(ach);
  addXP(ach.xp, `Achievement: ${ach.title}`);
  return true;
}

function showAchievementPopup(ach) {
  if (isAchievementShowing) {
    achievementQueue.push(ach);
    return;
  }

  const popup = document.getElementById('achievementPopup');
  const title = document.getElementById('achPopupTitle');
  const desc = document.getElementById('achPopupDesc');
  const xp = document.getElementById('achPopupXp');
  const icon = document.getElementById('achPopupIcon');

  if (!popup || !title || !xp) return;

  isAchievementShowing = true;

  const fullscreenContainer = document.fullscreenElement || document.webkitFullscreenElement;
  if (fullscreenContainer && popup.parentElement !== fullscreenContainer) {
    fullscreenContainer.appendChild(popup);
  } else if (!fullscreenContainer && popup.parentElement !== document.body) {
    document.body.appendChild(popup);
  }

  if (icon) icon.innerText = ach.icon || '🏆';
  title.innerText = ach.title.toUpperCase();
  if (desc) desc.innerText = ach.desc || '';
  xp.innerText = `+${ach.xp} PROMOTER XP`;

  try {
    if (typeof achievementUnlockSound !== 'undefined') {
      achievementUnlockSound.currentTime = 0;
      achievementUnlockSound.volume = 0.85;
      achievementUnlockSound.play().catch(() => {});
    }
  } catch (e) {}

  popup.classList.add('show');

  clearTimeout(achAutoDismissTimeout);
  achAutoDismissTimeout = setTimeout(() => {
    dismissAchievementPopup();
  }, 10000);
}

function dismissAchievementPopup() {
  clearTimeout(achAutoDismissTimeout);
  const popup = document.getElementById('achievementPopup');
  if (popup) popup.classList.remove('show');

  setTimeout(() => {
    isAchievementShowing = false;
    if (achievementQueue.length > 0) {
      const nextAch = achievementQueue.shift();
      showAchievementPopup(nextAch);
    } else if (window.postMatchEventQueue && window.postMatchEventQueue.length > 0 && typeof window.processNextPostMatchEvent === 'function') {
      window.processNextPostMatchEvent();
    }
  }, 350);
}

function updateGMHeaderWidget() {
  const profile = getGMProfile();
  const currentLvl = parseInt(profile.level, 10) || 1;
  const badge = document.getElementById('gmLevelBadge');
  const bar = document.getElementById('gmXpBar');

  if (badge) badge.innerText = `⭐ LVL ${currentLvl}`;

  const nextTier = LEVEL_LADDER.find(l => l.level === currentLvl + 1);

  if (bar) {
    if (!nextTier) {
      bar.style.width = '100%';
    } else {
      const pct = Math.min(100, Math.max(0, Math.round(((profile.xp || 0) / nextTier.xpReq) * 100)));
      bar.style.width = `${pct}%`;
    }
  }

  // BATCH 6 ITEM 3: ANCHOR HOME BUTTON TO TOP-LEFT
  let homeBtn = document.getElementById('gmHeaderHomeBtn');
  if (!homeBtn) {
      homeBtn = document.createElement('div');
      homeBtn.id = 'gmHeaderHomeBtn';
      homeBtn.innerHTML = '🏠';
      
      const gmWidget = document.getElementById('gmProfileWidget');
      if (gmWidget) {
          gmWidget.parentElement.appendChild(homeBtn);
      } else {
          document.body.appendChild(homeBtn);
      }
      
      homeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (typeof stopCurrentVideo === 'function') stopCurrentVideo();
          if (typeof stopBGMForAction === 'function') stopBGMForAction();
          window.location.reload();
      });
  }
  
  homeBtn.style.cssText = `
      position: fixed;
      top: 15px;
      left: 15px; 
      right: auto;
      width: 44px;
      height: 44px;
      background: rgba(18, 20, 30, 0.9);
      border: 2px solid #555;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 10px rgba(0,0,0,0.6);
      transition: all 0.2s ease;
  `;
  
  homeBtn.onmouseenter = () => {
      homeBtn.style.background = 'rgba(212, 175, 55, 0.9)';
      homeBtn.style.borderColor = '#ffd700';
      homeBtn.style.transform = 'scale(1.1)';
  };
  homeBtn.onmouseleave = () => {
      homeBtn.style.background = 'rgba(18, 20, 30, 0.9)';
      homeBtn.style.borderColor = '#555';
      homeBtn.style.transform = 'scale(1.0)';
  };

  // Hide the home button immediately if we are actively in Book a Show mode
  if (window.activeShowSession || (document.getElementById('bookShowCardModal') && document.getElementById('bookShowCardModal').style.display === 'flex')) {
      homeBtn.style.display = 'none';
  }
}

function checkNextQueuedLevelUp() {
  if (!window.queuedLevelUps || window.queuedLevelUps.length === 0) return;
  const nextLvl = window.queuedLevelUps.shift();
  triggerLevelUpSequence(nextLvl);
}

/* --------------------------------------------------------------------------
   4. IN-MEMORY ROSTER SYNC & DOM MOUNT HELPER
   -------------------------------------------------------------------------- */
function ensureWrestlerInRoster(wrestlerId) {
  try {
    const allAvailable = [
      ...(typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : []),
      ...(typeof SECRET_TALENT_VAULT !== 'undefined' ? SECRET_TALENT_VAULT : [])
    ];
    const found = allAvailable.find(w => w.id === wrestlerId);
    if (!found) return;

    let storedRoster = [];
    try {
      const raw = localStorage.getItem('wrestlers');
      if (raw) storedRoster = JSON.parse(raw);
    } catch(e) {}

    if (Array.isArray(storedRoster)) {
      if (!storedRoster.some(w => w.id === found.id)) {
        storedRoster.push(found);
        localStorage.setItem('wrestlers', JSON.stringify(storedRoster));
      }
    }

    if (typeof window.wrestlers !== 'undefined' && Array.isArray(window.wrestlers)) {
      if (!window.wrestlers.some(w => w.id === found.id)) {
        window.wrestlers.push(found);
      }
    }
    if (typeof wrestlers !== 'undefined' && Array.isArray(wrestlers)) {
      if (!wrestlers.some(w => w.id === found.id)) {
        wrestlers.push(found);
      }
    }

    if (typeof renderRoster === 'function') renderRoster();
    if (typeof renderGrid === 'function') renderGrid();
    if (typeof renderRosterGrid === 'function') renderRosterGrid();
  } catch(e) {}
}

/* --------------------------------------------------------------------------
   5. OFFICIAL SUPERSTAR SIGNING & WELCOME INDUCTION MODAL
   -------------------------------------------------------------------------- */
let pendingInductionWrestler = null;
let pendingInductionCallback = null;

function openWelcomeInductionModal(wrestler, callbackOrIsVault = null) {
  if (!wrestler) return;
  pendingInductionWrestler = wrestler;
  pendingInductionCallback = typeof callbackOrIsVault === 'function' ? callbackOrIsVault : null;

  const modal = document.getElementById('welcomeInductionModal');
  const title = document.getElementById('welcomeInductionTitle');
  const name = document.getElementById('welcomeInductionName');
  const img = document.getElementById('welcomeInductionImg');

  if (title) title.innerText = `WELCOME ${wrestler.name.toUpperCase()} TO THE EWF UNIVERSE!`;
  if (name) name.innerText = wrestler.name.toUpperCase();
  if (img) {
    img.src = (typeof getWrestlerPosePath === 'function') ? getWrestlerPosePath(wrestler) : (wrestler.poseImage || wrestler.image);
    img.onerror = () => { img.src = wrestler.image || 'logo_notext.png'; };
  }

  if (modal) modal.style.display = 'flex';
  if (typeof penSignSound !== 'undefined') {
    try { penSignSound.currentTime = 0; penSignSound.play().catch(()=>{}); } catch(e){}
  }
}

function confirmSuperstarInduction() {
  const modal = document.getElementById('welcomeInductionModal');
  if (modal) modal.style.display = 'none';

  if (pendingInductionWrestler && pendingInductionWrestler.id) {
    ensureWrestlerInRoster(pendingInductionWrestler.id);
    if (typeof saveUnlockedVaultId === 'function') {
      saveUnlockedVaultId(pendingInductionWrestler.id);
    }
    if (typeof triggerCameraFlash === 'function') triggerCameraFlash();
    if (typeof playTitleClinkAudio === 'function') playTitleClinkAudio();
  }

  const cb = pendingInductionCallback;
  pendingInductionWrestler = null;
  pendingInductionCallback = null;

  if (typeof cb === 'function') {
    cb();
  } else {
    if (typeof renderGrid === 'function') renderGrid();
    if (typeof renderRoster === 'function') renderRoster();
    if (typeof resumeBGM === 'function') resumeBGM();
    checkNextQueuedLevelUp();
  }
  // BATCH 8 ITEM 1: after the 2nd superstar is signed, introduce the broadcast team
  if (typeof window.ewfTutorialAfterSigning === 'function') window.ewfTutorialAfterSigning();
}

/* --------------------------------------------------------------------------
   6. LEVEL-UP CUTSCENES & STAGE REVEALS (SAFE WINDOW SCOPING)
   -------------------------------------------------------------------------- */
window.activeShowcaseTier = window.activeShowcaseTier || null;
window.pendingShowcaseClaimCallback = window.pendingShowcaseClaimCallback || null;
window.activeDebutFinishHandler = window.activeDebutFinishHandler || null;

function triggerLevelUpSequence(newLevel) {
  let acknowledged = JSON.parse(localStorage.getItem('ewf_acknowledged_levels') || '[]');
  if (acknowledged.includes(newLevel)) {
    if (window.postMatchEventQueue && window.postMatchEventQueue.length > 0 && typeof window.processNextPostMatchEvent === 'function') {
      window.processNextPostMatchEvent();
    } else {
      checkNextQueuedLevelUp();
    }
    return;
  }
  acknowledged.push(newLevel);
  localStorage.setItem('ewf_acknowledged_levels', JSON.stringify(acknowledged));

  const tier = LEVEL_LADDER.find(l => l.level === newLevel);
  if (!tier) {
    checkNextQueuedLevelUp();
    return;
  }

  window.activeShowcaseTier = tier;
  showPadlockShatterModal(tier);
}

function showPadlockShatterModal(tier) {
  const overlay = document.getElementById('levelUpOverlay');
  const title = document.getElementById('levelUpTitleText');
  const rank = document.getElementById('levelUpRankText');
  const padlockBox = document.getElementById('levelUpPadlockContainer');
  const silhouette = document.getElementById('levelUpSilhouette');
  const itemBox = document.getElementById('unlockedItemBox');
  const itemImg = document.getElementById('unlockedItemImg');
  const itemText = document.getElementById('unlockedItemText');
  const closeBtn = document.getElementById('levelUpCloseBtn');

  if (!overlay || !title || !rank) return;

  title.innerText = `PROMOTED TO ${(tier.title || 'EXECUTIVE').toUpperCase()}!`;
  rank.innerText = `⭐ LEVEL ${tier.level} ACHIEVED ⭐`;

  if (tier.unlockType !== 'none') {
    if (padlockBox) {
      padlockBox.style.display = 'flex';
      padlockBox.classList.remove('shattering');
    }
    if (silhouette) silhouette.src = 'logo_notext.png';
    if (itemBox) { itemBox.style.display = 'none'; itemBox.classList.remove('revealed'); }
    if (itemImg) { itemImg.src = 'logo_notext.png'; itemImg.style.display = 'none'; }
    if (itemText) itemText.innerText = `🔒 CLASSIFIED REWARD UNLOCKED`;
    if (closeBtn) {
      closeBtn.innerText = "REVEAL UNLOCKED REWARD ➔";
      closeBtn.style.opacity = '0';
    }

    overlay.style.display = 'flex';

    setTimeout(() => {
      try {
        if (typeof anvilSlamSound !== 'undefined') {
          anvilSlamSound.currentTime = 0;
          anvilSlamSound.volume = 0.85;
          anvilSlamSound.play().catch(()=>{});
        }
      } catch(e){}

      if (padlockBox) padlockBox.classList.add('shattering');

      setTimeout(() => {
        if (padlockBox) padlockBox.style.display = 'none';
        if (itemBox) { 
          itemBox.style.display = 'flex'; 
          void itemBox.offsetWidth; 
          itemBox.classList.add('revealed'); 
        }
        if (closeBtn) closeBtn.style.opacity = '1';
      }, 450);
    }, 1200);

  } else {
    if (padlockBox) padlockBox.style.display = 'none';
    if (itemBox) {
      itemBox.style.display = 'flex';
      itemBox.classList.add('revealed');
    }
    if (itemImg) itemImg.src = 'logo_notext.png';
    if (itemText) itemText.innerText = `🎖️ EXECUTIVE CITATION: LEVEL ${tier.level} CLEARANCE ACTIVE`;
    if (closeBtn) {
      closeBtn.innerText = "PROCEED TO OFFICE ➔";
      closeBtn.style.opacity = '1';
    }
    overlay.style.display = 'flex';
  }
}

function revealStage2Showcase() {
  const stage1Modal = document.getElementById('levelUpOverlay');
  if (stage1Modal) stage1Modal.style.display = 'none';

  if (!window.activeShowcaseTier) {
    checkNextQueuedLevelUp();
    return;
  }

  if (window.activeShowcaseTier.unlockType === 'wrestler') {
    const allAvailable = [
      ...(typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : []),
      ...(typeof SECRET_TALENT_VAULT !== 'undefined' ? SECRET_TALENT_VAULT : [])
    ];
    const wrestler = allAvailable.find(w => w.id === window.activeShowcaseTier.unlockKey);
    if (wrestler) {
      executeSuperstarBlackoutDebut(window.activeShowcaseTier, wrestler);
      return;
    }
  }

  showUnlockShowcase(window.activeShowcaseTier);
}

window.skipSuperstarDebutIntro = function() {
  if (typeof window.activeDebutFinishHandler === 'function') {
    window.activeDebutFinishHandler();
  }
};

function executeSuperstarBlackoutDebut(arg1, arg2) {
  const wrestler = arg2 || arg1;
  const tier = arg2 ? arg1 : { level: 1, unlockName: wrestler?.name || 'SUPERSTAR', unlockType: 'wrestler' };
  if (!wrestler) return;

  if (typeof closeModal === 'function') closeModal();
  const wModal = document.getElementById('wrestlerModal');
  if (wModal) wModal.style.display = 'none';

  if (typeof stopBGMForAction === 'function') stopBGMForAction();
  if (typeof stopMatchCrowd === 'function') stopMatchCrowd();
  if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd(false);

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

  const host = document.fullscreenElement || document.webkitFullscreenElement || document.body;
  if (blackout.parentElement !== host) host.appendChild(blackout);

  blackout.style.setProperty('position', 'fixed', 'important');
  blackout.style.setProperty('inset', '0', 'important');
  blackout.style.setProperty('width', '100vw', 'important');
  blackout.style.setProperty('height', '100vh', 'important');
  blackout.style.setProperty('background-color', '#000000', 'important');
  blackout.style.setProperty('z-index', '2147483647', 'important');
  blackout.style.setProperty('display', 'block', 'important');

  const banner = document.getElementById('superstarDebutBanner');
  if (banner) banner.style.display = 'none';

  let bannerText = wrestler.debutBanner || `🚨 A DANGEROUS FORCE HAS INFILTRATED THE ROSTER! 🚨`;
  let bannerBg = wrestler.bannerBg || 'linear-gradient(180deg, #d32f2f, #7f0000)';
  let bannerShadow = wrestler.bannerShadow || '0 0 40px #ff0000';

  if (wrestler.id === 'default-kane') {
    bannerText = `🔥 HELLFIRE & BRIMSTONE ENGULFS THE ARENA... KANE IS HERE! 🔥`;
    bannerBg = 'linear-gradient(180deg, #ff1100 0%, #660000 100%)';
    bannerShadow = '0 0 50px #ff1100, 0 0 25px #ff9900';
  } else if (wrestler.id === 'default-theundertaker') {
    bannerText = `⚡ GONG... A DARK PRESENCE HAS RISEN: THE UNDERTAKER ARRIVES! ⚡`;
    bannerBg = 'linear-gradient(180deg, #7b1fa2 0%, #1a0033 100%)';
    bannerShadow = '0 0 50px #9c27b0, 0 0 30px #4a148c';
  } else if (wrestler.id === 'vault-johncena') {
    bannerText = `🎺 BRRRRRAAAAPPPLE DOUGH! JOHN CENA HAS ARRIVED IN EWF! 🎺`;
    bannerBg = 'linear-gradient(180deg, #0066ff 0%, #001f5c 100%)';
    bannerShadow = '0 0 50px #0066ff, 0 0 25px #00e5ff';
  } else if (wrestler.id === 'vault-romanreigns') {
    bannerText = `☝️ ACKNOWLEDGE HIM! THE TRIBAL CHIEF ROMAN REIGNS ARRIVES! ☝️`;
    bannerBg = 'linear-gradient(180deg, #b8860b 0%, #332200 100%)';
    bannerShadow = '0 0 50px #ffd700, 0 0 25px #ff8800';
  } else if (wrestler.id === 'vault-cmpunk') {
    bannerText = `⚡ LOOK IN MY EYES! CM PUNK HAS SHOCKED THE WORLD! ⚡`;
    bannerBg = 'linear-gradient(180deg, #990000 0%, #111111 100%)';
    bannerShadow = '0 0 45px #ff0000, 0 0 25px #ff4444';
  }

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
        if (typeof playSubBassBoom === 'function') playSubBassBoom();
        if (typeof triggerCameraFlash === 'function') triggerCameraFlash();

        let skipBtn = document.getElementById('debutSkipIntroBtn');
        if (!skipBtn) {
          skipBtn = document.createElement('button');
          skipBtn.id = 'debutSkipIntroBtn';
          skipBtn.innerText = '⏩ SKIP INTRO';
          host.appendChild(skipBtn);
        }
        
        skipBtn.style.cssText = `
          position: fixed !important; bottom: 30px !important; right: 30px !important; top: auto !important; left: auto !important;
          z-index: 2147483647 !important; background: rgba(229, 9, 20, 0.92) !important;
          border: 2px solid #ffffff !important; color: #ffffff !important;
          font-family: 'Russo One', sans-serif !important; font-size: 0.95rem !important;
          padding: 10px 22px !important; cursor: pointer !important; border-radius: 4px !important;
          letter-spacing: 1px !important; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.8) !important;
          text-transform: uppercase !important; display: block !important; pointer-events: auto !important;
        `;

        const finishDebut = () => {
          window.activeDebutFinishHandler = null;
          clearTimeout(bannerTimeout);
          if (skipBtn) skipBtn.style.display = 'none';
          if (banner) banner.style.display = 'none';
          if (typeof stopCurrentVideo === 'function') stopCurrentVideo();

          if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => {});
          }

          const videoModal = document.getElementById('videoModal');
          if (videoModal) videoModal.style.display = 'none';
          
          showUnlockShowcase(tier, wrestler, () => {
            openWelcomeInductionModal(wrestler);
          });
        };

        window.activeDebutFinishHandler = finishDebut;
        skipBtn.onclick = finishDebut;

        if (typeof loadAndPlayYouTube === 'function') {
          loadAndPlayYouTube(wrestler.youtubeUrl, false, false, false, false);
        }

        const bannerTimeout = setTimeout(() => {
          if (banner) {
            banner.innerText = bannerText;
            banner.style.background = bannerBg;
            banner.style.boxShadow = bannerShadow;
            banner.style.color = '#ffffff';
            banner.style.display = 'flex';
            banner.style.alignItems = 'center';
            banner.style.justifyContent = 'center';
            banner.style.gap = '15px';
            banner.style.zIndex = '2147483645';
            
            if (typeof getRandomCommentatorOverlayIcon === 'function') {
                const commIcon = getRandomCommentatorOverlayIcon();
                if (commIcon) {
                    banner.innerHTML = `${commIcon} <span style="flex:1;">${bannerText}</span>`;
                }
            }

            if (typeof playSubBassBoom === 'function') playSubBassBoom();
            if (typeof triggerCameraFlash === 'function') triggerCameraFlash();
            if (typeof playOhMyGodSting === 'function') playOhMyGodSting();

            setTimeout(() => {
              if (banner) banner.style.display = 'none';
            }, 6000);
          }
        }, 10000);

        const debutMessageListener = (e) => {
          try {
            const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
            if (data && data.event === 'onStateChange' && data.info === 0) {
              window.removeEventListener('message', debutMessageListener);
              finishDebut();
            }
          } catch (_) {}
        };
        window.addEventListener('message', debutMessageListener);
      }
    }, 120);
  }, 1800);
}

// BATCH 6 ITEM 6: FRAMELESS 62PX CIRCULAR COMMENTATOR OVERLAY ICON
function getRandomCommentatorOverlayIcon() {
    if (window.isCommentatorVideoActive) return '';
    const commentators = [
        { img: 'brethart.png' },
        { img: 'corbin.png' }
    ];
    const pick = commentators[Math.floor(Math.random() * commentators.length)];
    return `
        <div style="display:flex; align-items:center; justify-content:center; position:relative;">
            <img src="${pick.img}" style="width:62px; height:62px; object-fit:cover; border-radius:50%; border:3px solid #ffd700; box-shadow:0 0 15px rgba(0,0,0,0.8);" onerror="this.style.display='none'">
        </div>
    `;
}
window.getRandomCommentatorOverlayIcon = getRandomCommentatorOverlayIcon;


function showUnlockShowcase(tier, wrestler = null, onClaimCallback = null) {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => {});
  }

  window.pendingShowcaseClaimCallback = typeof onClaimCallback === 'function' ? onClaimCallback : null;

  const showcase = document.getElementById('unlockShowcaseOverlay');
  const img = document.getElementById('showcaseAssetImg');
  const name = document.getElementById('showcaseAssetName');

  if (!showcase) {
    checkNextQueuedLevelUp();
    return;
  }

  let assetPath = tier.unlockImg || 'whc.png';
  if (tier.unlockType === 'wrestler' && wrestler) {
    assetPath = (typeof getWrestlerPosePath === 'function') ? getWrestlerPosePath(wrestler) : (wrestler.poseImage || wrestler.image);
  } else if (tier.unlockKey === 'mitb') {
    assetPath = 'mitb_briefcase.png';
  } else if (tier.unlockKey === 'kotr') {
    assetPath = 'kotr_crown.png';
  } else if (tier.unlockKey === 'rumble') {
    assetPath = 'rumble_logo.png';
  } else if (tier.unlockKey === 'Ambulance Match') {
    assetPath = 'ambulance.png';
  } else if (tier.unlockKey === 'TLC Match') {
    assetPath = 'tlc.png';
  } else if (tier.unlockType === 'injuries') {
    assetPath = tier.unlockImg || 'story_26.png';
  }

  if (img) {
    img.src = assetPath;
    img.onerror = () => {
      if (wrestler) img.src = wrestler.image;
      else if (tier.unlockType === 'injuries') img.src = 'story_1.png';
      else if (tier.unlockType === 'show') img.src = 'logo_notext.png';
      else img.src = 'whc.png';
    };
  }
  if (name) name.innerText = (tier.unlockName || 'CLEARANCE UNLOCKED').toUpperCase();

  let dadGiftEl = document.getElementById('showcaseDadGiftText');
  if (!dadGiftEl && name && name.parentElement) {
    dadGiftEl = document.createElement('div');
    dadGiftEl.id = 'showcaseDadGiftText';
    name.parentElement.insertBefore(dadGiftEl, name.nextSibling);
  }

  // BATCH 11 ITEM 5: superstars signed with a contract code are already in Ellis's hands
  const isDadGift = !tier.fromCode && (
    tier.level === 2 ||
    tier.level === 3 ||
    tier.level === 6 ||
    tier.level === 10 ||
    tier.unlockType === 'titles' ||
    tier.unlockType === 'injuries' ||
    tier.unlockKey === 'injuries' ||
    (tier.unlockName && tier.unlockName.toLowerCase().includes('championship')) ||
    (tier.unlockName && tier.unlockName.toLowerCase().includes('injur')) ||
    (tier.unlockName && tier.unlockName.toLowerCase().includes('medical')) ||
    tier.unlockKey === 'default-theundertaker' ||
    tier.unlockKey === 'default-kane' ||
    (wrestler && (wrestler.id === 'default-theundertaker' || wrestler.id === 'default-kane' || wrestler.id === 'vault-romanreigns' || wrestler.id === 'vault-johncena' || wrestler.id === 'vault-cmpunk'))
  );

  if (dadGiftEl) {
    if (isDadGift) {
      dadGiftEl.innerHTML = `★ UNLOCKED IN EWF UNIVERSE, NOW PICK UP YOUR GIFT FROM DAD ★`;
      dadGiftEl.style.cssText = `
        display: block;
        color: #ffd700;
        font-family: 'Russo One', sans-serif;
        font-weight: 800;
        font-size: 1.05rem;
        letter-spacing: 2px;
        text-shadow: 0 0 12px rgba(255, 215, 0, 0.75);
        margin-top: 10px;
        margin-bottom: 12px;
        text-transform: uppercase;
        text-align: center;
      `;
    } else {
      dadGiftEl.style.display = 'none';
      dadGiftEl.innerHTML = '';
    }
  }

  showcase.style.display = 'flex';

  // BATCH 7 ITEM 4: Play the achievement sound when the unlock showcase appears
  try {
    if (typeof achievementUnlockSound !== 'undefined') {
      achievementUnlockSound.currentTime = 0;
      achievementUnlockSound.volume = 0.85;
      achievementUnlockSound.play().catch(() => {});
    }
  } catch (e) {}
}

function closeUnlockShowcase() {
  const showcase = document.getElementById('unlockShowcaseOverlay');
  if (showcase) showcase.style.display = 'none';

  if (window.activeShowcaseTier && window.activeShowcaseTier.unlockType === 'wrestler' && window.activeShowcaseTier.unlockKey) {
    ensureWrestlerInRoster(window.activeShowcaseTier.unlockKey);
  }

  const cb = window.pendingShowcaseClaimCallback;
  window.pendingShowcaseClaimCallback = null;
  window.activeShowcaseTier = null;

  if (document.fullscreenElement || document.webkitFullscreenElement) {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => {});
  }

  if (typeof resumeBGM === 'function') resumeBGM();
  if (typeof renderGrid === 'function') renderGrid();
  if (typeof renderRoster === 'function') renderRoster();
  if (typeof renderRosterGrid === 'function') renderRosterGrid();
  
  if (typeof cb === 'function') {
    cb();
    return;
  }

  if (window.postMatchEventQueue && window.postMatchEventQueue.length > 0 && typeof window.processNextPostMatchEvent === 'function') {
    window.processNextPostMatchEvent();
  } else {
    checkNextQueuedLevelUp();
  }
}

function closeLevelUpOverlay() {
  const overlay = document.getElementById('levelUpOverlay');
  if (overlay) overlay.style.display = 'none';
  if (typeof renderGrid === 'function') renderGrid();
  if (typeof renderRoster === 'function') renderRoster();
  if (typeof resumeBGM === 'function') resumeBGM();
}

/* --------------------------------------------------------------------------
   7. GM FRONT OFFICE, PROGRESSION & COMMENTARY BOOTH
   -------------------------------------------------------------------------- */
function openGMOffice() {
  try {
    const modal = document.getElementById('gmOfficeModal');
    if (!modal) return;
    const profile = getGMProfile();
    const currentLvl = parseInt(profile.level, 10) || 1;
    const currentTier = LEVEL_LADDER.find(l => l.level === currentLvl) || LEVEL_LADDER[0];
    const nextTier = LEVEL_LADDER.find(l => l.level === currentLvl + 1);

    const rankTitle = document.getElementById('gmOfficeRankTitle');
    const xpFill = document.getElementById('gmOfficeXpFill');
    const xpText = document.getElementById('gmOfficeXpText');
    const nextUnlock = document.getElementById('gmNextUnlockText');

    if (rankTitle) rankTitle.innerText = `⭐ LEVEL ${currentLvl}: ${(currentTier.title || 'ROOKIE BOOKER').toUpperCase()}`;

    if (nextTier) {
      const pct = Math.min(100, Math.max(0, Math.round(((profile.xp || 0) / nextTier.xpReq) * 100)));
      if (xpFill) xpFill.style.width = `${pct}%`;
      if (xpText) xpText.innerText = `${profile.xp || 0} / ${nextTier.xpReq} XP`;
      if (nextUnlock) nextUnlock.innerText = `Next Rank (Lvl ${nextTier.level}): ??? (Reward: 🔒 TOP SECRET)`;
    } else {
      if (xpFill) xpFill.style.width = '100%';
      if (xpText) xpText.innerText = `${profile.xp || 0} XP (MAX TIER)`;
      if (nextUnlock) nextUnlock.innerText = `Maximum Executive Clearance Attained!`;
    }

    const grid = document.getElementById('gmAchievementsGrid');
    if (grid) {
      grid.innerHTML = '';
      const unlockedList = Array.isArray(profile.unlockedAchievements) ? profile.unlockedAchievements : [];

      SECRET_ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = unlockedList.includes(ach.id);
        const card = document.createElement('div');
        card.className = isUnlocked ? `achievement-card ${ach.tier}` : 'achievement-card is-locked';

        // --- BATCH 5 ITEM 12 FIX: 10/10 CLASSICS IN OFFICE ---
        let achTitleExtra = '';
        if (ach.id === 'five_star_general') {
            const fiveStars = (profile.stats && profile.stats.fiveStars) ? profile.stats.fiveStars : 0;
            achTitleExtra = ` <span style="font-size:0.6rem; color:#aaa; font-weight:normal; margin-left:6px;">(${fiveStars} / 10 Classics)</span>`;
        }

        if (isUnlocked) {
          card.innerHTML = `
            <div>
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                <div class="achieve-title" style="font-family:'Russo One', sans-serif; font-size:0.88rem; text-transform:uppercase; letter-spacing:0.5px;">
                  <span style="font-size:1.05rem; margin-right:4px;">${ach.icon}</span> ${ach.title}${achTitleExtra}
                </div>
                <div class="achieve-xp-pill" style="font-family:'Russo One', sans-serif; font-size:0.68rem; padding:2px 8px; border-radius:3px;">
                  +${ach.xp} XP
                </div>
              </div>
              <div style="font-size:0.76rem; color:#cbd5e1; line-height:1.35; margin-bottom:8px;">
                ${ach.desc}
              </div>
            </div>
            <div style="display:flex; justify-content:flex-end;">
              <span style="color:#00ff66; font-size:0.85rem; font-weight:bold; text-shadow:0 0 8px rgba(0,255,102,0.6);">✔ UNLOCKED</span>
            </div>
          `;
        } else {
          card.innerHTML = `
            <div>
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                <div class="achieve-title" style="font-family:'Russo One', sans-serif; font-size:0.84rem; text-transform:uppercase; letter-spacing:0.5px;">
                  🔒 ${ach.title.includes('General') ? 'FIVE-STAR GENERAL' : '??? CLASSIFIED OBJECTIVE'}${achTitleExtra}
                </div>
                <div style="font-family:'Russo One', sans-serif; font-size:0.68rem; color:#64748b; padding:2px 6px;">
                  +${ach.xp} XP
                </div>
              </div>
              <div style="font-size:0.74rem; color:#64748b; font-style:italic; line-height:1.35;">
                ${ach.id === 'five_star_general' ? 'Produce ten 5-star match classics.' : 'Explore the federation and book matches to uncover this milestone.'}
              </div>
            </div>
            <div style="display:flex; justify-content:flex-end;">
              <span style="color:#64748b; font-size:0.78rem;">LOCKED</span>
            </div>
          `;
        }
        grid.appendChild(card);
      });
    }

    modal.style.display = 'flex';
  } catch(err) {
    console.error("Error opening GM Office:", err);
    const modal = document.getElementById('gmOfficeModal');
    if (modal) modal.style.display = 'flex';
  }
}
window.openGMOffice = openGMOffice;

function closeGMOffice() {
  const modal = document.getElementById('gmOfficeModal');
  if (modal) modal.style.display = 'none';
}

function playCommentatorIntro(who) {
  const commentators = {
    bret: {
      name: "Bret 'The Hitman' Hart",
      role: "Lead Color Analyst",
      url: "https://www.youtube.com/watch?v=3KhudlnBhfw",
      image: "brethart.png"
    },
    corbin: {
      name: "Happy Corbin",
      role: "Broadcast Analyst",
      url: "https://www.youtube.com/watch?v=BMnVE6Jznvg",
      image: "corbin.png"
    }
  };

  const comm = commentators[who];
  if (!comm) return;

  closeGMOffice();

  // --- BATCH 5 ITEM 11 FIX: FLAG ACTIVE COMMENTATOR VIDEO ---
  window.isCommentatorVideoActive = true;

  if (typeof loadAndPlayYouTube === 'function') {
    loadAndPlayYouTube(comm.url, false, true, false, false);
    if (typeof triggerNameplate === 'function') {
      setTimeout(() => {
        triggerNameplate(`${comm.name.toUpperCase()} // ${comm.role.toUpperCase()}`);
      }, 800);
    }
  }
  
  // Clear flag once video ends or closes (fallback auto-clear after typical duration)
  setTimeout(() => { window.isCommentatorVideoActive = false; }, 40000);
}
window.playCommentatorIntro = playCommentatorIntro;

/* --------------------------------------------------------------------------
   8. CLASSIFIED GM EXECUTIVE ROADMAP MODAL CONTROLS
   -------------------------------------------------------------------------- */
function openGMRoadmapModal() {
  const modal = document.getElementById('gmRoadmapModal');
  const list = document.getElementById('gmRoadmapList');
  if (!modal || !list) return;

  const profile = getGMProfile();
  const currentLvl = parseInt(profile.level, 10) || 1;

  list.innerHTML = '';
  LEVEL_LADDER.forEach(tier => {
    const isCurrent = tier.level === currentLvl;
    const isUnlocked = tier.level <= currentLvl;
    const item = document.createElement('div');
    item.style.cssText = `
      background: ${isCurrent ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(14, 16, 26, 0.95))' : 'rgba(18, 20, 30, 0.85)'};
      border: 1.5px solid ${isCurrent ? '#ffd700' : isUnlocked ? '#00e5ff' : '#444'};
      border-radius: 6px;
      padding: 12px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      box-shadow: ${isCurrent ? '0 0 15px rgba(255, 215, 0, 0.4)' : 'none'};
    `;

    const statusBadge = isCurrent
      ? `<span style="background:#ffd700; color:#000; font-family:'Russo One', sans-serif; font-size:0.7rem; padding:3px 8px; border-radius:3px; font-weight:bold;">★ CURRENT RANK</span>`
      : isUnlocked
        ? `<span style="color:#00ff66; font-family:'Russo One', sans-serif; font-size:0.75rem; font-weight:bold;">✔ UNLOCKED</span>`
        : `<span style="color:#888; font-family:'Russo One', sans-serif; font-size:0.75rem;">🔒 CLASSIFIED</span>`;

    const rewardText = isUnlocked
      ? `<span style="color:#ffd700;">${tier.unlockName}</span>`
      : `<span style="color:#64748b; font-style:italic;">🔒 TOP SECRET (UNLOCKS AT LEVEL ${tier.level})</span>`;

    item.innerHTML = `
      <div style="flex: 1;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="font-family:'Russo One', sans-serif; color:${isCurrent ? '#ffd700' : '#fff'}; font-size:0.95rem;">
            LEVEL ${tier.level}: ${isUnlocked ? tier.title.toUpperCase() : '???'}
          </span>
          <span style="font-family:'Russo One', sans-serif; color:#aaa; font-size:0.75rem;">(${tier.xpReq.toLocaleString()} XP)</span>
        </div>
        <div style="font-family:'Russo One', sans-serif; font-size:0.78rem;">
          REWARD: ${rewardText}
        </div>
      </div>
      <div>${statusBadge}</div>
    `;

    list.appendChild(item);
  });

  modal.style.display = 'flex';
}

function closeGMRoadmapModal() {
  const modal = document.getElementById('gmRoadmapModal');
  if (modal) modal.style.display = 'none';
}

function devCheatLevelUp() {
  // BATCH 7 ITEM 15: DEV button now unlocks EVERYTHING in one go (max level, all shows/matches/titles,
  // every superstar including code-signed and vault ones) with no level-up popups. Use Reset Universe
  // in EWF Universe to go back to a fresh Christmas-morning save.
  if (!confirm("⚡ DEV: UNLOCK EVERYTHING?\n\nJumps to Level 20 and signs every superstar. Use 'Reset Universe' afterwards to go back to a fresh start.")) return;

  const top = LEVEL_LADDER[LEVEL_LADDER.length - 1];
  const profile = getGMProfile();
  profile.xp = Math.max(profile.xp || 0, top.xpReq);
  profile.level = top.level;
  saveGMProfile(profile);
  localStorage.setItem('ewf_acknowledged_levels', JSON.stringify(LEVEL_LADDER.map(l => l.level)));
  window.queuedLevelUps = [];

  const toSign = [
    ...(typeof defaultWrestlers !== 'undefined' ? defaultWrestlers.filter(w => w.requiresCode) : []),
    ...(typeof SECRET_TALENT_VAULT !== 'undefined' ? SECRET_TALENT_VAULT : [])
  ];
  toSign.forEach(w => { if (typeof saveUnlockedVaultId === 'function') saveUnlockedVaultId(w.id); });

  if (typeof updateGMHeaderWidget === 'function') updateGMHeaderWidget();
  if (typeof renderGrid === 'function') renderGrid();
  if (typeof closeGMOffice === 'function') closeGMOffice();
  alert(`✅ DEV UNLOCK COMPLETE\n\nLevel ${top.level}, every show and match type unlocked, and ${getUnlockedWrestlers().length} superstars on the roster.`);
}

/* --------------------------------------------------------------------------
   9. SHOW HISTORY & ACCORDION ARCHIVES
   -------------------------------------------------------------------------- */
function getShowHistory() {
  try {
    const raw = localStorage.getItem('ewf_show_history');
    if (raw) {
        const parsed = JSON.parse(raw);
        // --- BATCH 5 ITEM 3 FIX: FILTER OUT CORRUPT/BLANK ARCHIVES ---
        return Array.isArray(parsed) ? parsed.filter(s => s && s.id && s.showKey) : [];
    }
  } catch(e){}
  return [];
}

function saveShowHistory(history) {
  try {
    localStorage.setItem('ewf_show_history', JSON.stringify(history));
  } catch(e){}
}

function renderBookShowAccordionArchives() {
  const list = document.getElementById('bookShowAccordionList');
  if (!list) return;
  const shows = getShowHistory();

  if (!shows || shows.length === 0) {
    list.innerHTML = `
      <div style="text-align:center; padding:18px 10px; color:#64748b; font-family:'Russo One', sans-serif; font-size:0.75rem;">
        NO PAST SHOW ARCHIVES LOGGED YET.<br>
        <span style="font-size:0.68rem; color:#aaa; font-weight:normal;">Produce your first broadcast above to start logging records!</span>
      </div>
    `;
    return;
  }

  // --- BATCH 5 ITEM 3 FIX: SCROLLABLE CONTAINER (ANTI-SQUISH) ---
  list.style.setProperty('max-height', '45vh', 'important');
  list.style.setProperty('overflow-y', 'auto', 'important');
  list.style.setProperty('display', 'flex', 'important');
  list.style.setProperty('flex-direction', 'column', 'important');
  list.style.setProperty('gap', '8px', 'important');
  list.style.setProperty('padding-right', '4px', 'important');

  if (list.parentElement) {
      list.parentElement.style.setProperty('overflow', 'visible', 'important');
  }

  list.innerHTML = '';
  const initialCount = 3;
  const showsToRender = shows.slice().reverse().slice(0, initialCount);
  const hasMore = shows.length > initialCount;

  showsToRender.forEach(show => {
    const item = document.createElement('div');
    item.className = 'bsh-accordion-item';
    
    // --- BATCH 5 ITEM 3 FIX: FLEX-SHRINK: 0 PREVENTS ROW CLIPPING ---
    item.style.setProperty('flex-shrink', '0', 'important');
    item.style.setProperty('min-height', '50px', 'important');
    item.style.setProperty('height', 'auto', 'important');
    
    // --- BATCH 5 ITEM 2 FIX: OVERRIDE GOLD STYLESHEET ---
    const grade = show.grade || 'A';
    const rating = show.rating ? parseFloat(show.rating) : 0;
    
    let tierColor = '#ffd700'; // Default B
    let bgPulse = 'rgba(212, 175, 55, 0.05)';
    if (grade === 'A+' || rating >= 4.5) {
        tierColor = '#00e5ff';
        bgPulse = 'rgba(0, 229, 255, 0.08)';
    } else if (grade === 'A' || rating >= 3.8) {
        tierColor = '#00ff66';
        bgPulse = 'rgba(0, 255, 102, 0.08)';
    } else if (grade === 'C' || rating < 3.0) {
        tierColor = '#ff3333';
        bgPulse = 'rgba(255, 51, 51, 0.08)';
    }
    
    item.style.setProperty('border', `1px solid ${tierColor}`, 'important');
    item.style.setProperty('box-shadow', `0 0 10px ${bgPulse}`, 'important');
    
    const logoSrc = (typeof getShowLogo === 'function') ? getShowLogo(show.showKey) : `${show.showKey}_logo.png`;
    const finishTimestamp = show.date || 'RECENT';

    const boutsHtml = (Array.isArray(show.bouts) && show.bouts.length > 0)
      ? show.bouts.map((b, bIdx) => `
          <div class="bsh-bout-line">
            <span><strong>Bout ${bIdx + 1} [${(b.orderName || 'BOUT').toUpperCase()}]:</strong> <span style="color:#00ff66;">${b.winnerName || 'Winner'}</span> def. <span style="color:#aaa;">${b.loserName || 'Opponents'}</span> <em style="color:#00e5ff; font-weight:normal;">(${b.stipulation || 'Normal Match'})</em></span>
            <span style="color:#ffd700; font-size:0.8rem; margin-left:8px;">${'★'.repeat(b.rating || 0)}${'☆'.repeat(Math.max(0, 5 - (b.rating || 0)))}</span>
          </div>
        `).join('')
      : '<div style="color:#888; font-size:0.75rem;">No bouts recorded.</div>';

    item.innerHTML = `
      <div class="bsh-accordion-header" onclick="this.parentElement.classList.toggle('open')" style="display:flex; justify-content:space-between; align-items:center; min-height: 48px; padding: 8px 12px; flex-shrink: 0;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${logoSrc}" class="bsh-accordion-logo" alt="${show.showName || show.showKey}" onerror="this.outerHTML='<span style=\\'font-family:Russo One; font-size:0.85rem; color:#ffd700;\\'>${(show.showName || show.showKey).toUpperCase()}</span>'">
          <span style="font-family:'Russo One', sans-serif; font-size:0.72rem; color:#888;">${finishTimestamp}</span>
        </div>
        <div class="bsh-accordion-meta" style="display:flex; align-items:center; gap:10px;">
          <span class="bsh-accordion-grade" style="color: ${tierColor} !important;">GRADE: ${grade} (${rating.toFixed(1)} ★)</span>
          <span class="bsh-accordion-chevron" style="color: ${tierColor} !important;">▶</span>
        </div>
      </div>
      <div class="bsh-accordion-body">
        ${boutsHtml}
        <div style="font-family:'Russo One', sans-serif; font-size:0.7rem; color:#00ff66; margin-top:4px; text-align:right;">
          +${show.xpEarned || 0} PROMOTER XP AWARDED
        </div>
      </div>
    `;
    list.appendChild(item);
  });

  if (hasMore) {
    const loadBtn = document.createElement('button');
    loadBtn.className = 'action-btn';
    loadBtn.id = 'loadMoreBookShowArchivesBtn';
    loadBtn.style.cssText = `
      width: 100%; margin-top: 10px; padding: 10px; font-size: 0.8rem;
      background: #1b1d2a; color: #fff; border-color: #555; flex-shrink: 0;
    `;
    loadBtn.innerText = `📂 LOAD REMAINING ${shows.length - initialCount} ARCHIVES ➔`;
    loadBtn.onclick = () => window.loadAllBookShowAccordionArchives();
    list.appendChild(loadBtn);
  }
}
window.renderBookShowAccordionArchives = renderBookShowAccordionArchives;

window.loadAllBookShowAccordionArchives = function() {
  const list = document.getElementById('bookShowAccordionList');
  if (!list) return;
  const shows = getShowHistory();
  if (!shows || shows.length === 0) return;

  list.innerHTML = '';
  shows.slice().reverse().forEach(show => {
    const item = document.createElement('div');
    item.className = 'bsh-accordion-item';
    
    // --- BATCH 5 ITEM 3 FIX: FLEX-SHRINK: 0 PREVENTS ROW CLIPPING ---
    item.style.setProperty('flex-shrink', '0', 'important');
    item.style.setProperty('min-height', '50px', 'important');
    item.style.setProperty('height', 'auto', 'important');
    
    // --- BATCH 5 ITEM 2 FIX: OVERRIDE GOLD STYLESHEET ---
    const grade = show.grade || 'A';
    const rating = show.rating ? parseFloat(show.rating) : 0;
    
    let tierColor = '#ffd700'; // Default B
    let bgPulse = 'rgba(212, 175, 55, 0.05)';
    if (grade === 'A+' || rating >= 4.5) {
        tierColor = '#00e5ff';
        bgPulse = 'rgba(0, 229, 255, 0.08)';
    } else if (grade === 'A' || rating >= 3.8) {
        tierColor = '#00ff66';
        bgPulse = 'rgba(0, 255, 102, 0.08)';
    } else if (grade === 'C' || rating < 3.0) {
        tierColor = '#ff3333';
        bgPulse = 'rgba(255, 51, 51, 0.08)';
    }
    
    item.style.setProperty('border', `1px solid ${tierColor}`, 'important');
    item.style.setProperty('box-shadow', `0 0 10px ${bgPulse}`, 'important');
    
    const logoSrc = (typeof getShowLogo === 'function') ? getShowLogo(show.showKey) : `${show.showKey}_logo.png`;
    const finishTimestamp = show.date || 'RECENT';

    const boutsHtml = (Array.isArray(show.bouts) && show.bouts.length > 0)
      ? show.bouts.map((b, bIdx) => `
          <div class="bsh-bout-line">
            <span><strong>Bout ${bIdx + 1} [${(b.orderName || 'BOUT').toUpperCase()}]:</strong> <span style="color:#00ff66;">${b.winnerName || 'Winner'}</span> def. <span style="color:#aaa;">${b.loserName || 'Opponents'}</span> <em style="color:#00e5ff; font-weight:normal;">(${b.stipulation || 'Normal Match'})</em></span>
            <span style="color:#ffd700; font-size:0.8rem; margin-left:8px;">${'★'.repeat(b.rating || 0)}${'☆'.repeat(Math.max(0, 5 - (b.rating || 0)))}</span>
          </div>
        `).join('')
      : '<div style="color:#888; font-size:0.75rem;">No bouts recorded.</div>';

    item.innerHTML = `
      <div class="bsh-accordion-header" onclick="this.parentElement.classList.toggle('open')" style="display:flex; justify-content:space-between; align-items:center; min-height: 48px; padding: 8px 12px; flex-shrink: 0;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${logoSrc}" class="bsh-accordion-logo" alt="${show.showName || show.showKey}" onerror="this.outerHTML='<span style=\\'font-family:Russo One; font-size:0.85rem; color:#ffd700;\\'>${(show.showName || show.showKey).toUpperCase()}</span>'">
          <span style="font-family:'Russo One', sans-serif; font-size:0.72rem; color:#888;">${finishTimestamp}</span>
        </div>
        <div class="bsh-accordion-meta" style="display:flex; align-items:center; gap:10px;">
          <span class="bsh-accordion-grade" style="color: ${tierColor} !important;">GRADE: ${grade} (${rating.toFixed(1)} ★)</span>
          <span class="bsh-accordion-chevron" style="color: ${tierColor} !important;">▶</span>
        </div>
      </div>
      <div class="bsh-accordion-body">
        ${boutsHtml}
        <div style="font-family:'Russo One', sans-serif; font-size:0.7rem; color:#00ff66; margin-top:4px; text-align:right;">
          +${show.xpEarned || 0} PROMOTER XP AWARDED
        </div>
      </div>
    `;
    list.appendChild(item);
  });
};

function renderShowArchives() {
  renderBookShowAccordionArchives();
  const container = document.getElementById('historyShowsContainer');
  if (!container) return;
  const shows = getShowHistory();

  if (!shows || shows.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:35px 15px; color:#64748b; font-family:'Russo One', sans-serif; font-size:0.88rem;">
        NO SHOW ARCHIVES LOGGED YET.<br>
        <span style="font-size:0.75rem; color:#aaa; font-weight:normal;">Use BOOK A SHOW on the home screen to produce an official event card!</span>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  shows.slice().reverse().forEach(show => {
    const plaque = document.createElement('div');
    plaque.className = 'show-archive-plaque';
    plaque.onclick = () => openShowDetailModal(show.id);

    const logoSrc = (typeof getShowLogo === 'function') ? getShowLogo(show.showKey) : `${show.showKey}_logo.png`;
    const finishTimestamp = show.date || 'RECENT';

    plaque.innerHTML = `
      <img src="${logoSrc}" alt="${show.showName || show.showKey}" onerror="this.outerHTML='<span style=\\'font-family:Russo One; font-size:1rem; color:#ffd700;\\'>${(show.showName || show.showKey).toUpperCase()}</span>'">
      <div class="show-archive-meta-right">
        <span>${finishTimestamp}</span>
        <span class="chevron">➔</span>
      </div>
    `;
    container.appendChild(plaque);
  });
}

function openShowDetailModal(showId) {
  const modal = document.getElementById('showDetailModal');
  if (!modal) return;
  const shows = getShowHistory();
  const show = shows.find(s => s.id === showId);
  if (!show) return;

  const logoEl = document.getElementById('sdShowLogo');
  const gradeEl = document.getElementById('sdShowGradeBadge');
  const dateEl = document.getElementById('sdShowDateText');
  const boutsContainer = document.getElementById('sdBoutsContainer');
  const xpEl = document.getElementById('sdXpBanner');

  if (logoEl) {
    logoEl.src = (typeof getShowLogo === 'function') ? getShowLogo(show.showKey) : `${show.showKey}_logo.png`;
  }
  if (gradeEl) {
    gradeEl.innerText = `GRADE: ${show.grade || 'A'} (${show.rating || '0.0'} ★)`;
  }
  if (dateEl) {
    dateEl.innerText = `CONCLUDED: ${show.date || ''}`;
  }
  if (xpEl) {
    xpEl.innerText = `+${show.xpEarned || 0} PROMOTER XP EARNED`;
  }

  if (boutsContainer) {
    boutsContainer.innerHTML = '';
    if (Array.isArray(show.bouts) && show.bouts.length > 0) {
      show.bouts.forEach((b, idx) => {
        const row = document.createElement('div');
        row.style.cssText = `
          background: rgba(10, 12, 18, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-left: 3px solid #ffd700;
          border-radius: 4px;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Russo One', sans-serif;
          font-size: 0.8rem;
          color: #eee;
        `;
        row.innerHTML = `
          <div>
            <div style="color:#ffd700; font-size:0.7rem; letter-spacing:1px; margin-bottom:2px;">
              BOUT ${idx + 1} [${(b.orderName || 'BOUT').toUpperCase()}]
            </div>
            <div>
              <span style="color:#00ff66;">${b.winnerName || 'Winner'}</span> def. <span style="color:#aaa;">${b.loserName || 'Opponents'}</span>
              <span style="color:#00e5ff; font-size:0.75rem; font-weight:normal; margin-left:6px;">(${b.stipulation || 'Normal Match'})</span>
            </div>
          </div>
          <div style="color:#ffd700; font-size:0.85rem; white-space:nowrap; margin-left:10px;">
            ${'★'.repeat(b.rating || 0)}${'☆'.repeat(Math.max(0, 5 - (b.rating || 0)))}
          </div>
        `;
        boutsContainer.appendChild(row);
      });
    } else {
      boutsContainer.innerHTML = '<div style="color:#888; font-size:0.8rem;">No bout records found.</div>';
    }
  }

  modal.style.display = 'flex';
}

function closeShowDetailModal() {
  const modal = document.getElementById('showDetailModal');
  if (modal) modal.style.display = 'none';
}

/* --------------------------------------------------------------------------
   10. CAREER DATA EXPORT & RESTORE ENGINE
   -------------------------------------------------------------------------- */
function exportGMSaveData() {
  const fullSave = {
    gmProfile: getGMProfile(),
    titleHolders: typeof getTitleHolders === 'function' ? getTitleHolders() : JSON.parse(localStorage.getItem('championship_holders') || '{}'),
    defenses: typeof getDefenses === 'function' ? getDefenses() : JSON.parse(localStorage.getItem('championship_defenses') || '{}'),
    alliances: typeof getAlliances === 'function' ? getAlliances() : JSON.parse(localStorage.getItem('custom_alliances') || '{}'),
    rivalries: typeof getRivalries === 'function' ? getRivalries() : JSON.parse(localStorage.getItem('ewf_rivalries') || '[]'),
    injuries: typeof getInjuries === 'function' ? getInjuries() : JSON.parse(localStorage.getItem('ewf_injuries') || '[]'),
    unlockedVault: typeof getUnlockedVaultIds === 'function' ? getUnlockedVaultIds() : JSON.parse(localStorage.getItem('ewf_unlocked_vault_ids') || '[]'),
    mitb: typeof getMitbHolder === 'function' ? getMitbHolder() : JSON.parse(localStorage.getItem('mitb_holder') || '""'),
    history: typeof getHistory === 'function' ? getHistory() : JSON.parse(localStorage.getItem('main_event_history') || '[]'),
    showsHistory: getShowHistory(),
    milestones: typeof getMilestones === 'function' ? getMilestones() : JSON.parse(localStorage.getItem('ewf_milestones') || '[]'),
    hof: JSON.parse(localStorage.getItem('ewf_hof_inductees') || '[]'),
    acknowledgedLevels: JSON.parse(localStorage.getItem('ewf_acknowledged_levels') || '[]'),
    exportDate: new Date().toISOString()
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullSave, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `EWF_Career_Save_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importGMSaveData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.gmProfile) localStorage.setItem('ewf_gm_profile', JSON.stringify(data.gmProfile));
      if (data.titleHolders) localStorage.setItem('championship_holders', JSON.stringify(data.titleHolders));
      if (data.defenses) localStorage.setItem('championship_defenses', JSON.stringify(data.defenses));
      if (data.alliances) localStorage.setItem('custom_alliances', JSON.stringify(data.alliances));
      if (data.rivalries) localStorage.setItem('ewf_rivalries', JSON.stringify(data.rivalries));
      if (data.injuries) localStorage.setItem('ewf_injuries', JSON.stringify(data.injuries));
      if (data.unlockedVault) localStorage.setItem('ewf_unlocked_vault_ids', JSON.stringify(data.unlockedVault));
      if (data.mitb) localStorage.setItem('mitb_holder', JSON.stringify(data.mitb));
      if (data.history) localStorage.setItem('main_event_history', JSON.stringify(data.history));
      if (data.showsHistory) saveShowHistory(data.showsHistory);
      if (data.milestones) localStorage.setItem('ewf_milestones', JSON.stringify(data.milestones));
      if (data.hof) localStorage.setItem('ewf_hof_inductees', JSON.stringify(data.hof));
      if (data.acknowledgedLevels) localStorage.setItem('ewf_acknowledged_levels', JSON.stringify(data.acknowledgedLevels));

      alert("✅ EWF Career Save File restored successfully!");
      openGMOffice();
      if (typeof renderGrid === 'function') renderGrid();
      if (typeof renderRoster === 'function') renderRoster();
      updateGMHeaderWidget();
    } catch(err) {
      alert("❌ Invalid save file format: " + err.message);
    }
  };
  reader.readAsText(file);
}

// Global Window Exports
window.LEVEL_LADDER = LEVEL_LADDER;
window.SECRET_ACHIEVEMENTS = SECRET_ACHIEVEMENTS;
window.getGMProfile = getGMProfile;
window.saveGMProfile = saveGMProfile;
window.getGMLevel = getGMLevel;
window.addXP = addXP;
window.unlockAchievement = unlockAchievement;
window.showAchievementPopup = showAchievementPopup;
window.dismissAchievementPopup = dismissAchievementPopup;
window.updateGMHeaderWidget = updateGMHeaderWidget;
window.checkNextQueuedLevelUp = checkNextQueuedLevelUp;
window.triggerLevelUpSequence = triggerLevelUpSequence;
window.revealStage2Showcase = revealStage2Showcase;
window.executeSuperstarBlackoutDebut = executeSuperstarBlackoutDebut;
window.skipSuperstarDebutIntro = skipSuperstarDebutIntro;
window.openWelcomeInductionModal = openWelcomeInductionModal;
window.confirmSuperstarInduction = confirmSuperstarInduction;
window.showUnlockShowcase = showUnlockShowcase;
window.closeUnlockShowcase = closeUnlockShowcase;
window.closeLevelUpOverlay = closeLevelUpOverlay;
window.openGMOffice = openGMOffice;
window.closeGMOffice = closeGMOffice;
window.openGMRoadmapModal = openGMRoadmapModal;
window.closeGMRoadmapModal = closeGMRoadmapModal;
window.ensureWrestlerInRoster = ensureWrestlerInRoster;
window.devCheatLevelUp = devCheatLevelUp;
window.exportGMSaveData = exportGMSaveData;
window.importGMSaveData = importGMSaveData;
window.getShowHistory = getShowHistory;
window.saveShowHistory = saveShowHistory;
window.renderShowArchives = renderShowArchives;
window.renderBookShowAccordionArchives = renderBookShowAccordionArchives;
window.openShowDetailModal = openShowDetailModal;
window.closeShowDetailModal = closeShowDetailModal;
window.isMedicalWardUnlocked = isMedicalWardUnlocked;
window.playCommentatorIntro = playCommentatorIntro;