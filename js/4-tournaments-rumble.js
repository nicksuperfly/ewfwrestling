/* ==========================================================================
   ELLIS'S MAIN EVENT (EWF UNIVERSE) - MODULAR ENGINE
   MODULE 4 OF 5: js/4-tournaments-rumble.js
   Defenses & History, KOTR Brackets, Royal Rumble, Trophies & Hall of Fame
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CHAMPIONSHIP DEFENSES & MATCH HISTORY CORE
   -------------------------------------------------------------------------- */
function getDefenses() {
  try {
    const stored = localStorage.getItem('championship_defenses');
    return stored ? JSON.parse(stored) : { whc: 0, ic: 0, hardcore: 0, tag: 0 };
  } catch (e) {
    return { whc: 0, ic: 0, hardcore: 0, tag: 0 };
  }
}

function saveDefenses(defObj) {
  try {
    localStorage.setItem('championship_defenses', JSON.stringify(defObj));
  } catch (e) {}
}

function getTitleDefenseCount(titleCode) {
  const d = getDefenses();
  return d[titleCode] || 0;
}

function incrementTitleDefense(titleCode) {
  const d = getDefenses();
  d[titleCode] = (d[titleCode] || 0) + 1;
  saveDefenses(d);
  return d[titleCode];
}

function resetTitleDefense(titleCode) {
  const d = getDefenses();
  d[titleCode] = 0;
  saveDefenses(d);
}

function getHistory() {
  try {
    const stored = localStorage.getItem('main_event_history');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

function saveHistoryLog(eventText, type = 'match', winnerId = null, rating = null) {
  try {
    const history = getHistory();
    const timestamp = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const parsedRating = rating ? parseInt(rating, 10) : null;
    history.unshift({ text: eventText, time: timestamp, type: type, winnerId: winnerId, rating: parsedRating });
    // BATCH 7 ITEM 13: keep 500 entries (was 100) so head-to-head records last long enough to reach 10 matches
    while (history.length > 500) history.pop();
    localStorage.setItem('main_event_history', JSON.stringify(history));
  } catch (e) {}
}

function renderHistoryUI(filterType = 'all') {
  const container = document.getElementById('historyList');
  if (!container) return;
  const history = getHistory();

  let filtered = history;
  if (filterType === 'titles') {
    filtered = history.filter(item => item && (item.type === 'title-change' || (item.text && (item.text.includes('CHAMPION') || item.text.includes('🏆')))));
  } else if (filterType === 'classics') {
    filtered = history.filter(item => item && (item.rating === 5 || (item.text && item.text.includes('★★★★★'))));
  }

  if (filtered.length === 0) { 
    container.innerHTML = `<div style="text-align: center; color: #777; padding: 20px; font-family:'Russo One';">No records found.</div>`; 
    return; 
  }

  container.innerHTML = filtered.map(item => {
    let starBadgeHTML = '';
    if (item.rating && item.rating > 0) {
      const stars = '★'.repeat(item.rating);
      starBadgeHTML = `<span style="color:#ffd700; margin-left:6px; letter-spacing:1px; text-shadow:0 0 6px #ffd700;">${stars}</span>`;
    }
    return `
      <div class="history-item ${item.type}">
        <div class="history-text">${item.text} ${starBadgeHTML}</div>
        <div class="history-time">${item.time}</div>
      </div>
    `;
  }).join('');
}

/* --------------------------------------------------------------------------
   ITEM 16: VICTORIES LEADERBOARD (TOTAL VS CURRENT RUN POWER RANKINGS)
   -------------------------------------------------------------------------- */
var currentVictoriesSubMode = 'total';

window.switchVictoriesSubMode = function(mode) {
  currentVictoriesSubMode = mode;
  const btnTotal = document.getElementById('subToggleTotalWins');
  const btnRun = document.getElementById('subToggleCurrentRun');
  if (btnTotal) btnTotal.classList.toggle('active', mode === 'total');
  if (btnRun) btnRun.classList.toggle('active', mode === 'run');
  renderVictoriesLeaderboard();
};

function renderVictoriesLeaderboard() {
  const tbody = document.getElementById('victoriesTableBody');
  const theadRow = document.getElementById('victoriesTableHeaderRow');
  if (!tbody) return;
  tbody.innerHTML = '';

  const unlockedWrestlers = (typeof window.wrestlers !== 'undefined' && Array.isArray(window.wrestlers) && window.wrestlers.length > 0)
    ? window.wrestlers
    : (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : (typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : []));

  const history = getHistory();
  const titles = typeof getTitleHolders === 'function' ? getTitleHolders() : {};
  const mitbHolder = typeof getMitbHolder === 'function' ? getMitbHolder() : null;
  const defenses = getDefenses();
  const topContenderId = typeof getTopContenderId === 'function' ? getTopContenderId() : null;
  const rivalries = typeof getRivalries === 'function' ? getRivalries() : [];

  // Cumulative Career Wins Count
  const winCounts = {};
  unlockedWrestlers.forEach(w => { winCounts[w.id] = 0; });
  history.forEach(item => {
    if (!item) return;
    if (item.type === 'match' && item.winnerId && winCounts[item.winnerId] !== undefined) {
      winCounts[item.winnerId]++;
    }
  });

  if (currentVictoriesSubMode === 'total') {
    // MODE 1: ALL-TIME TOTAL
    if (theadRow) {
      theadRow.innerHTML = `
        <th>Superstar</th>
        <th>Heat</th>
        <th>Wins</th>
        <th>Active Titles</th>
      `;
    }

    const sortedWrestlers = [...unlockedWrestlers].sort((a, b) => (winCounts[b.id] || 0) - (winCounts[a.id] || 0));

    sortedWrestlers.forEach(w => {
      const wins = winCounts[w.id] || 0;
      const activeBelts = [];
      if (titles.whc === w.id) activeBelts.push(`WHC (${defenses.whc || 0}D)`);
      if (titles.ic === w.id) activeBelts.push(`IC (${defenses.ic || 0}D)`);
      if (titles.hardcore === w.id) activeBelts.push(`Hardcore (${defenses.hardcore || 0}D)`);
      if (titles.tag1 === w.id || titles.tag2 === w.id) activeBelts.push(`Tag Team (${defenses.tag || 0}D)`);
      if (mitbHolder && mitbHolder.id === w.id) activeBelts.push('💼 MITB');

      const mom = typeof getWrestlerMomentum === 'function' ? getWrestlerMomentum(w.id) : { status: 'neutral', streak: 0 };
      const isInjured = typeof getInjuryRecord === 'function' && getInjuryRecord(w.id);
      const hasBloodFeud = rivalries.some(r => r && r.heat === 3 && (r.w1 === w.id || r.w2 === w.id));

      let heatBadge = `<span class="heat-pill heat-steady">⚖️ STEADY</span>`;
      if (isInjured) {
        heatBadge = `<span class="heat-pill heat-ice" style="color:#ff6666;">🩹 INJURED</span>`;
      } else if (hasBloodFeud) {
        heatBadge = `<span class="heat-pill heat-feud">💀 BLOOD FEUD</span>`;
      } else if (mom.status === 'fire') {
        heatBadge = `<span class="heat-pill heat-fire">🔥 HOT</span>`;
      } else if (mom.status === 'ice') {
        heatBadge = `<span class="heat-pill heat-ice">❄️ COLD</span>`;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color:#ffffff; display:flex; align-items:center; gap:8px;">
          <img src="${w.image}" style="width:28px; height:28px; border:1px solid #fff; object-fit:cover;" onerror="handleImgError(this, '${w.id}')">
          <span>${w.name}</span>
        </td>
        <td>${heatBadge}</td>
        <td style="color:#ffd700; font-size:1rem; font-weight:bold;">${wins}</td>
        <td style="color:#00ff66; font-size:0.75rem;">${activeBelts.length > 0 ? activeBelts.join(', ') : '<span style="color:#666;">None</span>'}</td>
      `;
      tbody.appendChild(tr);
    });

  } else {
    // MODE 2: CURRENT RUN (POWER RANKINGS)
    if (theadRow) {
      theadRow.innerHTML = `
        <th>Rank</th>
        <th>Superstar</th>
        <th>Current Run</th>
        <th>Status / Contender</th>
      `;
    }

    // Score based on momentum, streak, and recent form
    const ratedRoster = unlockedWrestlers.map(w => {
      const mom = typeof getWrestlerMomentum === 'function' ? getWrestlerMomentum(w.id) : { status: 'neutral', wins: 0, total: 0, streak: 0 };
      let powerScore = (mom.streak * 15) + (mom.wins * 3) - ((mom.total - mom.wins) * 3);
      if (mom.status === 'fire') powerScore += 50;
      if (mom.status === 'ice') powerScore -= 50;
      return { wrestler: w, mom, powerScore };
    });

    ratedRoster.sort((a, b) => b.powerScore - a.powerScore);

    ratedRoster.forEach((entry, idx) => {
      const w = entry.wrestler;
      const mom = entry.mom;
      const losses = Math.max(0, mom.total - mom.wins);
      const isInjured = typeof getInjuryRecord === 'function' && getInjuryRecord(w.id);
      const hasBloodFeud = rivalries.some(r => r && r.heat === 3 && (r.w1 === w.id || r.w2 === w.id));

      let runBadge = '';
      if (isInjured) {
        runBadge = `<span class="heat-pill heat-ice" style="color:#ff4444;">🩹 ON SHELF</span>`;
      } else if (mom.status === 'fire' || mom.streak >= 3) {
        runBadge = `<span class="heat-pill heat-fire">🔥 (${mom.wins}-${losses}) • ${mom.streak}W STREAK</span>`;
      } else if (mom.streak >= 2) {
        runBadge = `<span class="heat-pill heat-fire" style="color:#ffaa00;">⚡ (${mom.wins}-${losses}) • HEATING UP</span>`;
      } else if (mom.status === 'ice') {
        runBadge = `<span class="heat-pill heat-ice">❄️ (${mom.wins}-${losses}) • SLUMP</span>`;
      } else {
        runBadge = `<span class="heat-pill heat-steady">⚖️ (${mom.wins}-${losses})</span>`;
      }

      let statusTag = `<span style="color:#888;">Active Roster</span>`;
      if (isInjured) {
        statusTag = `<span style="color:#ff6666; font-weight:bold;">OUT INJURED</span>`;
      } else if (topContenderId === w.id) {
        statusTag = `<span style="color:#ffd700; font-weight:bold; text-shadow:0 0 8px rgba(255,215,0,0.6);">⭐ #1 CONTENDER</span>`;
      } else if (hasBloodFeud) {
        statusTag = `<span style="color:#ff0055; font-weight:bold;">💀 BLOOD FEUD</span>`;
      } else if (titles.whc === w.id || titles.ic === w.id || titles.hardcore === w.id || titles.tag1 === w.id || titles.tag2 === w.id) {
        statusTag = `<span style="color:#00ffcc; font-weight:bold;">👑 REIGNING CHAMP</span>`;
      }

      const rankDisplay = idx === 0 ? '🥇 #1' : (idx === 1 ? '🥈 #2' : (idx === 2 ? '🥉 #3' : `#${idx + 1}`));

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color:#ffd700; font-family:'Russo One'; font-size:0.85rem;">${rankDisplay}</td>
        <td style="color:#ffffff; display:flex; align-items:center; gap:8px;">
          <img src="${w.image}" style="width:28px; height:28px; border:1px solid #fff; object-fit:cover;" onerror="handleImgError(this, '${w.id}')">
          <span>${w.name}</span>
        </td>
        <td>${runBadge}</td>
        <td style="font-size:0.75rem;">${statusTag}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

function clearHistory() { 
  if (confirm("Clear all history logs and career victory records?")) { 
    try { localStorage.removeItem('main_event_history'); } catch (e) {} 
    if (typeof switchHistoryTab === 'function') switchHistoryTab(window.activeHistoryTab || 'all'); 
  } 
}

function openHistoryModal() { 
  window.activeHistoryTab = 'all';
  switchHistoryTab('all');
  const modal = document.getElementById('historyModal');
  if (modal) modal.style.display = 'flex'; 
}

function closeHistoryModal() { 
  const modal = document.getElementById('historyModal');
  if (modal) modal.style.display = 'none'; 
  if (typeof resumeBGM === 'function') resumeBGM();
}

function switchHistoryTab(tabKey) {
  window.activeHistoryTab = tabKey;
  ['All', 'Titles', 'Classics', 'Victories', 'Records', 'Trophies'].forEach(k => {
    const btn = document.getElementById(`histTab${k}`);
    if (btn) btn.classList.toggle('active', k.toLowerCase() === tabKey.toLowerCase());
  });

  const listEl = document.getElementById('historyList');
  const tableEl = document.getElementById('historyVictoriesContainer');
  const recordsEl = document.getElementById('historyRecordsContainer');
  const trophiesEl = document.getElementById('historyTrophiesContainer');

  if (listEl) listEl.style.display = 'none';
  if (tableEl) tableEl.style.display = 'none';
  if (recordsEl) recordsEl.style.display = 'none';
  if (trophiesEl) trophiesEl.style.display = 'none';

  if (tabKey === 'victories') {
    if (tableEl) tableEl.style.display = 'block';
    renderVictoriesLeaderboard();
  } else if (tabKey === 'records') {
    if (recordsEl) recordsEl.style.display = 'block';
    renderRecordBookUI();
  } else if (tabKey === 'trophies') {
    if (trophiesEl) trophiesEl.style.display = 'block';
    renderTrophyCabinetUI();
  } else {
    if (listEl) listEl.style.display = 'flex';
    renderHistoryUI(tabKey);
  }
}

/* --------------------------------------------------------------------------
   2. KING OF THE RING TOURNAMENT & CORONATION
   -------------------------------------------------------------------------- */
function getKotrHolder() {
  try {
    return localStorage.getItem('kotr_holder') || localStorage.getItem('ewf_kotr_winner_id') || null;
  } catch(e) { return null; }
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
  } catch(e) {}
}

function openKotrHub() {
  const kotrLock = typeof isFormatLocked === 'function' ? isFormatLocked('kotr') : { locked: false };
  if (kotrLock.locked) {
    alert(`🔒 TOP SECRET!\n\nThis unlocks at Level ${kotrLock.req}. What could it be?`);
    return;
  }
  if (typeof turnOffOtherModes === 'function') turnOffOtherModes('');
  
  const closeBtn = document.getElementById('videoCloseBtn');
  if (closeBtn) closeBtn.style.display = 'none';
  
  const setupSec = document.getElementById('kotrSetupSection');
  if (setupSec) setupSec.style.display = 'flex';
  
  const seedSec = document.getElementById('kotrSeedingSection');
  if (seedSec) seedSec.style.display = 'none';
  
  const bracketSec = document.getElementById('kotrBracketSection');
  if (bracketSec) bracketSec.style.display = 'none';
  
  const modal = document.getElementById('kotrModal');
  if (modal) modal.style.display = 'flex';
}

function closeKotrModal() { 
  const modal = document.getElementById('kotrModal');
  if (modal) modal.style.display = 'none'; 
  closeKotrMatchActionModal();
  closeKotrSlotPickerModal();
}

function chooseKotrFormat(size) {
  window.kotrSize = size;
  const promptEl = document.getElementById('kotrSeedingPromptText');
  if (promptEl) promptEl.innerText = `${size}-MAN KING OF THE RING: SELECT SEEDING`;
  
  const setupSec = document.getElementById('kotrSetupSection');
  if (setupSec) setupSec.style.display = 'none';
  
  const seedSec = document.getElementById('kotrSeedingSection');
  if (seedSec) seedSec.style.display = 'flex';
}

function backToKotrSetup() {
  const setupSec = document.getElementById('kotrSetupSection');
  if (setupSec) setupSec.style.display = 'flex';
  
  const seedSec = document.getElementById('kotrSeedingSection');
  if (seedSec) seedSec.style.display = 'none';
}

function startKotrRandomDraw() {
  const allWrestlers = (typeof window.wrestlers !== 'undefined' && Array.isArray(window.wrestlers) && window.wrestlers.length > 0)
    ? window.wrestlers.filter(w => !(typeof getInjuryRecord === 'function' && getInjuryRecord(w.id)))
    : (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers().filter(w => !(typeof getInjuryRecord === 'function' && getInjuryRecord(w.id))) : (typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : []));

  if (allWrestlers.length < window.kotrSize) { alert(`You need ${window.kotrSize} fit superstars for this!`); return; }
  const entrants = [...allWrestlers].sort(() => Math.random() - 0.5).slice(0, window.kotrSize);
  buildKotrBracketTreeFromEntrants(entrants);
}

function startKotrHandPickSeeds() {
  const allWrestlers = (typeof window.wrestlers !== 'undefined' && Array.isArray(window.wrestlers) && window.wrestlers.length > 0)
    ? window.wrestlers.filter(w => !(typeof getInjuryRecord === 'function' && getInjuryRecord(w.id)))
    : (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers().filter(w => !(typeof getInjuryRecord === 'function' && getInjuryRecord(w.id))) : (typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : []));

  if (allWrestlers.length < window.kotrSize) { alert(`You need ${window.kotrSize} fit superstars for this!`); return; }
  window.kotrCustomEntrants = new Array(window.kotrSize).fill(null);
  openKotrSlotPicker(0);
}

function openKotrSlotPicker(slotIdx) {
  window.kotrPickingSlotIdx = slotIdx;
  const list = document.getElementById('kotrSlotPickerList');
  const title = document.getElementById('kotrSlotPickerTitle');
  if (title) title.innerText = `Select Superstar for Seed #${slotIdx + 1}`;
  if (!list) return;
  list.innerHTML = '';
  
  const allWrestlers = (typeof window.wrestlers !== 'undefined' && Array.isArray(window.wrestlers) && window.wrestlers.length > 0)
    ? window.wrestlers.filter(w => !(typeof getInjuryRecord === 'function' && getInjuryRecord(w.id)))
    : (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers().filter(w => !(typeof getInjuryRecord === 'function' && getInjuryRecord(w.id))) : (typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : []));

  allWrestlers.forEach(w => {
    const isAlreadyPicked = window.kotrCustomEntrants.some((p, i) => p && p.id === w.id && i !== window.kotrPickingSlotIdx);
    if (!isAlreadyPicked) {
      const card = document.createElement('div'); 
      card.className = 'vs-wrestler'; 
      card.innerHTML = `<img src="${w.image}" alt="${w.name}" onerror="handleImgError(this, '${w.id}')"><div>${w.name}</div>`;
      card.onclick = () => {
        window.kotrCustomEntrants[window.kotrPickingSlotIdx] = w;
        closeKotrSlotPickerModal();
        if (window.kotrCustomEntrants.some(slot => slot === null)) {
          const nextEmpty = window.kotrCustomEntrants.findIndex(slot => slot === null);
          openKotrSlotPicker(nextEmpty);
        } else {
          buildKotrBracketTreeFromEntrants(window.kotrCustomEntrants);
        }
      };
      list.appendChild(card);
    }
  });
  
  const picker = document.getElementById('kotrSlotPickerModal');
  if (picker) picker.style.display = 'flex';
}

function closeKotrSlotPickerModal() {
  const picker = document.getElementById('kotrSlotPickerModal');
  if (picker) picker.style.display = 'none';
}

function buildKotrBracketTreeFromEntrants(entrants) {
  if (window.kotrSize === 4) {
    window.kotrMatches = [
      { round: 1, label: 'Semi-Final 1', p1: entrants[0], p2: entrants[1], winner: null },
      { round: 1, label: 'Semi-Final 2', p1: entrants[2], p2: entrants[3], winner: null },
      { round: 2, label: 'Grand Final', p1: null, p2: null, winner: null }
    ];
  } else {
    window.kotrMatches = [
      { round: 1, label: 'Quarter-Final 1', p1: entrants[0], p2: entrants[1], winner: null },
      { round: 1, label: 'Quarter-Final 2', p1: entrants[2], p2: entrants[3], winner: null },
      { round: 1, label: 'Quarter-Final 3', p1: entrants[4], p2: entrants[5], winner: null },
      { round: 1, label: 'Quarter-Final 4', p1: entrants[6], p2: entrants[7], winner: null },
      { round: 2, label: 'Semi-Final 1', p1: null, p2: null, winner: null },
      { round: 2, label: 'Semi-Final 2', p1: null, p2: null, winner: null },
      { round: 3, label: 'Grand Final', p1: null, p2: null, winner: null }
    ];
  }
  
  const setupSec = document.getElementById('kotrSetupSection');
  if (setupSec) setupSec.style.display = 'none';
  
  const seedSec = document.getElementById('kotrSeedingSection');
  if (seedSec) seedSec.style.display = 'none';
  
  const bracketSec = document.getElementById('kotrBracketSection');
  if (bracketSec) bracketSec.style.display = 'flex';
  
  renderKotrBracketTree();
}

function renderKotrBracketTree() {
  const container = document.getElementById('bracketTreeContainer');
  if (!container) return;
  container.innerHTML = '';

  const roundsCount = window.kotrSize === 4 ? 2 : 3;
  for (let r = 1; r <= roundsCount; r++) {
    const roundCol = document.createElement('div');
    roundCol.className = 'bracket-round';
    const roundTitle = r === roundsCount ? '👑 GRAND FINAL' : (r === roundsCount - 1 ? 'SEMI-FINALS' : 'QUARTER-FINALS');
    roundCol.innerHTML = `<div style="font-family:'Russo One'; color:#ffd700; text-align:center; font-size:0.85rem; margin-bottom:4px;">${roundTitle}</div>`;

    const roundMatches = window.kotrMatches.filter(m => m.round === r);
    roundMatches.forEach(m => {
      const matchIdx = window.kotrMatches.indexOf(m);
      const node = document.createElement('div');
      node.className = 'bracket-match-node';
      
      const p1Name = m.p1 ? m.p1.name : 'TBD';
      const p2Name = m.p2 ? m.p2.name : 'TBD';
      const p1Img = m.p1 ? m.p1.image : 'logo_notext.png';
      const p2Img = m.p2 ? m.p2.image : 'logo_notext.png';

      node.innerHTML = `
        <div style="font-size:0.65rem; color:#aaa; font-family:'Russo One'; margin-bottom:4px;">${m.label}</div>
        <div class="bracket-wrestler-slot ${m.winner && m.winner.id === (m.p1 && m.p1.id) ? 'winner-slot' : ''}">
          <img src="${p1Img}" onerror="handleImgError(this, '${m.p1 ? m.p1.id : ''}')"><span>${p1Name}</span>
        </div>
        <div class="bracket-wrestler-slot ${m.winner && m.winner.id === (m.p2 && m.p2.id) ? 'winner-slot' : ''}">
          <img src="${p2Img}" onerror="handleImgError(this, '${m.p2 ? m.p2.id : ''}')"><span>${p2Name}</span>
        </div>
      `;

      if (m.p1 && m.p2 && !m.winner) {
        node.onclick = () => openKotrMatchActionModal(matchIdx);
      }
      roundCol.appendChild(node);
    });
    container.appendChild(roundCol);
  }
}

function openKotrMatchActionModal(matchIdx) {
  window.kotrCurrentMatchIdx = matchIdx;
  const m = window.kotrMatches[matchIdx];
  if (!m || !m.p1 || !m.p2 || m.winner) return;

  const titleEl = document.getElementById('kotrActionMatchTitle');
  const vsEl = document.getElementById('kotrActionVsDisplay');
  const playBtn = document.getElementById('kotrPlayMatchBtn');
  const q1Btn = document.getElementById('kotrQuickWin1Btn');
  const q2Btn = document.getElementById('kotrQuickWin2Btn');

  if (titleEl) titleEl.innerText = `${m.label.toUpperCase()}`;
  if (vsEl) {
    vsEl.innerHTML = `
      <div class="vs-wrestler"><img src="${m.p1.image}" onerror="handleImgError(this, '${m.p1.id}')"><div>${m.p1.name}</div></div>
      <div class="vs-divider">VS</div>
      <div class="vs-wrestler"><img src="${m.p2.image}" onerror="handleImgError(this, '${m.p2.id}')"><div>${m.p2.name}</div></div>
    `;
  }

  if (playBtn) playBtn.onclick = () => { closeKotrMatchActionModal(); launchKotrMatch(matchIdx); };
  if (q1Btn) {
    q1Btn.innerText = `🏆 QUICK ADVANCE: ${m.p1.name.toUpperCase()}`;
    q1Btn.onclick = () => { closeKotrMatchActionModal(); recordKotrWinner(m.p1); };
  }
  if (q2Btn) {
    q2Btn.innerText = `🏆 QUICK ADVANCE: ${m.p2.name.toUpperCase()}`;
    q2Btn.onclick = () => { closeKotrMatchActionModal(); recordKotrWinner(m.p2); };
  }

  const modal = document.getElementById('kotrMatchActionModal');
  if (modal) modal.style.display = 'flex';
}

function closeKotrMatchActionModal() { 
  const modal = document.getElementById('kotrMatchActionModal');
  if (modal) modal.style.display = 'none'; 
}

function launchKotrMatch(matchIdx) {
  window.kotrCurrentMatchIdx = matchIdx;
  const match = window.kotrMatches[matchIdx];
  closeKotrModal();

  if (typeof openMatchEngine === 'function') openMatchEngine();
  activeBookedMatch.showKey = "kotr";
  activeBookedMatch.matchType = "King of the Ring";
  activeBookedMatch.formatKey = "1v1";
  activeBookedMatch.formatCount = 2;
  activeBookedMatch.participants = [match.p1, match.p2];
  pickedReferee = null;
  quickMatchQueue = [...activeBookedMatch.participants];

  if (typeof startBookedMatchEntrances === 'function') startBookedMatchEntrances();
}

function returnToKotrBracket() {
  const closeBtn = document.getElementById('videoCloseBtn');
  if (closeBtn) closeBtn.style.display = 'none';
  
  const setupSec = document.getElementById('kotrSetupSection');
  if (setupSec) setupSec.style.display = 'none';
  
  const seedSec = document.getElementById('kotrSeedingSection');
  if (seedSec) seedSec.style.display = 'none';
  
  const bracketSec = document.getElementById('kotrBracketSection');
  if (bracketSec) bracketSec.style.display = 'flex';
  
  const modal = document.getElementById('kotrModal');
  if (modal) modal.style.display = 'flex';
  
  renderKotrBracketTree();
}

function recordKotrWinner(winner) {
  const match = window.kotrMatches[window.kotrCurrentMatchIdx];
  if (!match) return;
  match.winner = winner;

  if (typeof tickDownInjuriesAfterMatch === 'function') tickDownInjuriesAfterMatch();
  saveHistoryLog(`🏆 KOTR ADVANCEMENT: ${winner.name.toUpperCase()} won ${match.label}!`, 'kotr', winner.id);

  if (window.kotrSize === 4) {
    if (window.kotrCurrentMatchIdx === 0) window.kotrMatches[2].p1 = winner;
    if (window.kotrCurrentMatchIdx === 1) window.kotrMatches[2].p2 = winner;
  } else {
    if (window.kotrCurrentMatchIdx === 0) window.kotrMatches[4].p1 = winner;
    if (window.kotrCurrentMatchIdx === 1) window.kotrMatches[4].p2 = winner;
    if (window.kotrCurrentMatchIdx === 2) window.kotrMatches[5].p1 = winner;
    if (window.kotrCurrentMatchIdx === 3) window.kotrMatches[5].p2 = winner;
    if (window.kotrCurrentMatchIdx === 4) window.kotrMatches[6].p1 = winner;
    if (window.kotrCurrentMatchIdx === 5) window.kotrMatches[6].p2 = winner;
  }

  const finalMatchIdx = window.kotrMatches.length - 1;
  if (window.kotrCurrentMatchIdx === finalMatchIdx) {
    localStorage.setItem('kotr_ic_mandatory', winner.id);
    setKotrHolder(winner.id);
    saveHistoryLog(`👑 KING OF THE RING WINNER: ${winner.name.toUpperCase()} won the tournament & secured an IC Title Match!`, 'kotr', winner.id);
    if (typeof unlockAchievement === 'function') unlockAchievement('crown_the_king');
    showKotrCoronationOverlay(winner);
  } else {
    returnToKotrBracket();
  }
}

function showKotrCoronationOverlay(winner) {
  if (typeof stopCurrentVideo === 'function') stopCurrentVideo();
  if (typeof stopMatchCrowd === 'function') stopMatchCrowd();
  if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd(false);
  if (typeof stopBGMForAction === 'function') stopBGMForAction();

  const closeBtn = document.getElementById('videoCloseBtn');
  if (closeBtn) closeBtn.style.display = 'none';

  const overlay = document.getElementById('kotrCoronationOverlay') || document.getElementById('coronationOverlay');
  const card = document.getElementById('kotrCoronationWrestlerCard') || document.getElementById('coronationWrestlerCard');

  if (!overlay) return;

  const host = document.fullscreenElement || document.webkitFullscreenElement || document.getElementById('videoModal') || document.body;
  if (overlay.parentElement !== host) {
    host.appendChild(overlay);
  }
  overlay.style.setProperty('position', 'fixed', 'important');
  overlay.style.setProperty('inset', '0', 'important');
  overlay.style.setProperty('z-index', '2147483647', 'important');

  if (card) {
    card.innerHTML = `
      <div class="vs-wrestler" style="position:relative; display:inline-flex; flex-direction:column; align-items:center;">
        <img src="kotr_crown.png" alt="Crown" style="width:58px; height:auto; margin-bottom:-18px; z-index:5; filter:drop-shadow(0 0 10px #ffd700);" onerror="this.outerHTML='<span style=\\'font-size:2.5rem; margin-bottom:-12px; z-index:5; filter:drop-shadow(0 0 8px #ffd700);\\'>👑</span>'">
        <img src="${winner.image}" style="width:130px; height:130px; border:2.5px solid #ffd700; box-shadow:0 0 35px #ffd700; object-fit:cover;" onerror="handleImgError(this, '${winner.id}')">
        <div style="font-family:'Russo One', sans-serif; font-size:1.15rem; color:#ffd700; margin-top:8px; text-transform:uppercase; text-shadow:0 0 10px #ffd700;">${winner.name}</div>
        <div style="font-family:'Russo One', sans-serif; font-size:0.75rem; color:#ffffff; margin-top:4px; letter-spacing:1px; text-shadow:0 0 8px #ffd700;">KING OF THE RING CROWNED</div>
      </div>
    `;
  }

  const victoryThemeBtn = document.getElementById('kotrPlayVictoryThemeBtn');
  if (victoryThemeBtn) {
    victoryThemeBtn.innerText = '👑 ACCEPT THE CROWN ➔';
    victoryThemeBtn.className = 'action-btn';
    victoryThemeBtn.style.cssText = `
      background: linear-gradient(135deg, #ffd700, #ff8800) !important;
      color: #000000 !important;
      font-family: 'Russo One', sans-serif !important;
      font-size: 0.95rem !important;
      font-weight: bold !important;
      border: 2px solid #ffffff !important;
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.8) !important;
      cursor: pointer !important;
      padding: 10px 24px !important;
      border-radius: 6px !important;
    `;
    victoryThemeBtn.onclick = () => {
      closeKotrCoronationOverlay();
    };
  }

  overlay.style.display = 'flex';

  try {
    const audio = typeof kotrFanfareSound !== 'undefined' ? kotrFanfareSound : new Audio('kotr_fanfare.mp3');
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {}
}

function closeKotrCoronationOverlay() {
  const overlay = document.getElementById('kotrCoronationOverlay') || document.getElementById('coronationOverlay');
  if (overlay) overlay.style.display = 'none';
  if (typeof stopCurrentVideo === 'function') stopCurrentVideo();
  if (typeof closeVideoModal === 'function') closeVideoModal();
  if (typeof renderGrid === 'function') renderGrid();
  if (typeof renderRoster === 'function') renderRoster();
  if (typeof renderRosterGrid === 'function') renderRosterGrid();
  if (typeof resumeBGM === 'function') resumeBGM();
}

function showCoronationOverlay(winner) {
  showKotrCoronationOverlay(winner);
}

function closeCoronationOverlay() {
  closeKotrCoronationOverlay();
}

/* --------------------------------------------------------------------------
   3. ROYAL RUMBLE & MITB CORONATION OVERLAYS (BATCH 6 ITEM 7)
   -------------------------------------------------------------------------- */
function showRumbleCoronationOverlay(winner) {
  if (typeof stopCurrentVideo === 'function') stopCurrentVideo();
  if (typeof stopMatchCrowd === 'function') stopMatchCrowd();
  if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd(false);
  if (typeof stopBGMForAction === 'function') stopBGMForAction();

  // Ensure background match loop & stopwatch cannot re-open the Rumble HUD
  if (typeof stopLiveMatchStopwatch === 'function') stopLiveMatchStopwatch();
  window.isMatchInProgressLooping = false;
  if (typeof isMatchInProgressLooping !== 'undefined') isMatchInProgressLooping = false;

  const closeBtn = document.getElementById('videoCloseBtn');
  if (closeBtn) closeBtn.style.display = 'none';

  const overlay = document.getElementById('rumbleCoronationOverlay');
  const card = document.getElementById('rumbleCoronationWrestlerCard');

  if (!overlay) return;

  // BATCH 6 ITEM 7: Set currentPlayingWrestler to the true Rumble winner so victory nameplate matches
  if (winner) {
    currentPlayingWrestler = winner;
    window.isCommentatorVideoActive = false;
  }

  // Immediate storage commit at millisecond of coronation
  if (winner && winner.id) {
    try {
      localStorage.setItem('rumble_whc_mandatory', winner.id);
      saveHistoryLog(`🏆 ROYAL RUMBLE WINNER: ${winner.name.toUpperCase()} won the Royal Rumble Match and earned a World Heavyweight Title shot!`, 'match', winner.id);
      if (typeof unlockAchievement === 'function') unlockAchievement('iron_gauntlet');

      // Record Rumble victory onto active Book a Show session if played inside a show
      if (window.activeShowSession && Array.isArray(window.activeShowSession.bouts)) {
        const curIdx = window.activeShowSession.currentBoutIdx || 0;
        const activeBout = window.activeShowSession.bouts[curIdx];
        if (activeBout && !activeBout.completed) {
          activeBout.completed = true;
          activeBout.status = 'completed'; // BATCH 7 ITEM 7: match the normal bout format so highlights/archives read it
          activeBout.winnerName = winner.name;
          activeBout.winnerId = winner.id;
          activeBout.winnerObj = winner;
          activeBout.loserName = 'Royal Rumble Field';
          activeBout.rating = activeBout.rating || 5;
          window.activeShowSession.cumulativeStars = (window.activeShowSession.cumulativeStars || 0) + activeBout.rating;
          window.activeShowSession.completedBouts = (window.activeShowSession.completedBouts || 0) + 1;
          window.activeShowSession.currentBoutIdx = curIdx + 1;
        }
        if (typeof logShowFalloutEvent === 'function') {
          logShowFalloutEvent('rumble', `🏆 ROYAL RUMBLE WINNER: ${winner.name.toUpperCase()} survived the Royal Rumble and punched their ticket to WrestleMania!`);
        }
      }
    } catch(e) {}
  }

  const getActiveHost = () => {
    return document.fullscreenElement ||
           document.webkitFullscreenElement ||
           // BATCH 7 ITEM 11: only use the video modal when it's actually open, otherwise the overlay
           // gets parked inside a hidden modal and pops up at the start of the next match
           ((() => { const vm = document.getElementById('videoModal'); return (vm && getComputedStyle(vm).display !== 'none') ? vm : null; })()) ||
           document.body;
  };

  const host = getActiveHost();
  if (overlay.parentElement !== host) {
    host.appendChild(overlay);
  }
  overlay.style.setProperty('position', 'fixed', 'important');
  overlay.style.setProperty('inset', '0', 'important');
  overlay.style.setProperty('z-index', '2147483647', 'important');
  overlay.style.setProperty('background', "url('rumble_bg.png') center/cover no-repeat", 'important');

  if (card) {
    card.innerHTML = `
      <div class="vs-wrestler">
        <img src="${winner.image}" style="width:130px; height:130px; border:2.5px solid #ff3333; box-shadow:0 0 35px #ff0000;" onerror="handleImgError(this, '${winner.id}')">
        <div style="font-family:'Russo One', sans-serif; font-size:1.15rem; color:#ffffff; margin-top:8px; text-transform:uppercase;">${winner.name}</div>
      </div>
    `;
  }

  // BATCH 7 ITEM 7: Label the overlay's exit button correctly when the Rumble is part of a show
  try {
    const staticExit = overlay.querySelector('button[onclick*="closeRumbleCoronationOverlay"]');
    if (staticExit) staticExit.innerText = window.activeShowSession ? 'CONTINUE SHOW ➔' : 'CONTINUE TO ROSTER ➔';
  } catch (e) {}

  const victoryThemeBtn = document.getElementById('rumblePlayVictoryThemeBtn');
  if (victoryThemeBtn) {
    victoryThemeBtn.onclick = () => {
      overlay.style.display = 'none';

      // Ensure true winner is locked in before launching entrance/victory theme & nameplate
      currentPlayingWrestler = winner;
      window.isCommentatorVideoActive = false;

      if (typeof loadAndPlayYouTube === 'function' && winner.youtubeUrl) {
        loadAndPlayYouTube(winner.youtubeUrl, false, false, false, false);
        if (typeof triggerNameplate === 'function') {
          setTimeout(() => {
            triggerNameplate(`${winner.name.toUpperCase()} // ROYAL RUMBLE WINNER`);
          }, 500);
        }
      }

      // Mount #rumbleFloatingExitBtn inside active fullscreen container / #videoModal so it renders ON TOP of video
      const videoHost = getActiveHost();
      let floatBtn = document.getElementById('rumbleFloatingExitBtn');
      if (!floatBtn) {
        floatBtn = document.createElement('button');
        floatBtn.id = 'rumbleFloatingExitBtn';
        floatBtn.className = 'action-btn btn-red';
      }
      if (floatBtn.parentElement !== videoHost) {
        videoHost.appendChild(floatBtn);
      }
      floatBtn.innerText = window.activeShowSession ? 'CONTINUE SHOW ➔' : 'CONTINUE TO ROSTER ➔';
      floatBtn.style.cssText = `
        position: fixed !important;
        bottom: 30px !important;
        right: 30px !important;
        top: auto !important;
        left: auto !important;
        z-index: 2147483647 !important;
        display: block !important;
        pointer-events: auto !important;
      `;

      const syncRumbleExitBtnHost = () => {
        const curHost = getActiveHost();
        if (floatBtn && floatBtn.style.display !== 'none' && floatBtn.parentElement !== curHost) {
          curHost.appendChild(floatBtn);
        }
      };
      window._activeRumbleFsSync = syncRumbleExitBtnHost;
      document.addEventListener('fullscreenchange', syncRumbleExitBtnHost);
      document.addEventListener('webkitfullscreenchange', syncRumbleExitBtnHost);
      setTimeout(syncRumbleExitBtnHost, 150);

      floatBtn.onclick = () => {
        floatBtn.style.display = 'none';
        closeRumbleCoronationOverlay();
      };
    };
  }

  overlay.style.display = 'flex';

  try {
    if (typeof playOhMyGodSting === 'function') playOhMyGodSting();
  } catch (e) {}
}

function closeRumbleCoronationOverlay() {
  const overlay = document.getElementById('rumbleCoronationOverlay');
  if (overlay) overlay.style.display = 'none';
  const floatBtn = document.getElementById('rumbleFloatingExitBtn');
  if (floatBtn) floatBtn.style.display = 'none';

  if (window._activeRumbleFsSync) {
    document.removeEventListener('fullscreenchange', window._activeRumbleFsSync);
    document.removeEventListener('webkitfullscreenchange', window._activeRumbleFsSync);
    window._activeRumbleFsSync = null;
  }

  if (typeof stopCurrentVideo === 'function') stopCurrentVideo();
  if (typeof closeVideoModal === 'function') closeVideoModal();
  if (typeof renderGrid === 'function') renderGrid();
  if (typeof renderRoster === 'function') renderRoster();
  if (typeof renderRosterGrid === 'function') renderRosterGrid();

  // BATCH 6 ITEM 7: If played inside Book a Show, route cleanly to Event Highlights (or remaining show card)
  if (window.activeShowSession && Array.isArray(window.activeShowSession.bouts)) {
    const allDone = window.activeShowSession.currentBoutIdx >= window.activeShowSession.bouts.length ||
                    window.activeShowSession.bouts.every(b => b && b.completed);
    // BATCH 7 ITEM 7: openShowFalloutSummaryModal never existed, so a Rumble main event dumped you on the
    // home screen with the show still open. Route to Event Highlights like every other final bout.
    if (allDone && typeof openEventHighlightsModal === 'function') {
      openEventHighlightsModal();
      return;
    } else if (typeof renderBookShowCardModal === 'function') {
      const cardModal = document.getElementById('bookShowCardModal');
      if (cardModal) cardModal.style.display = 'flex';
      renderBookShowCardModal();
      return;
    }
  }

  if (typeof resumeBGM === 'function') resumeBGM();

  // ITEM 13: Automatically trigger Road to WrestleMania Staredown if reigning champion is active
  try {
    const winnerId = localStorage.getItem('rumble_whc_mandatory');
    const titles = typeof getTitleHolders === 'function' ? getTitleHolders() : {};
    const champId = titles.whc;
    if (winnerId && champId && champId !== winnerId && typeof window.openManiaStaredownModal === 'function') {
      const winner = typeof getWrestlerById === 'function' ? getWrestlerById(winnerId) : null;
      const champ = typeof getWrestlerById === 'function' ? getWrestlerById(champId) : null;
      const champInj = typeof getInjuryRecord === 'function' ? getInjuryRecord(champId) : null;
      if (winner && champ && !champInj) {
        setTimeout(() => {
          window.openManiaStaredownModal(winner, champ);
        }, 500);
      }
    }
  } catch (e) {}
}

function showMitbCoronationOverlay(winner) {
  if (typeof stopCurrentVideo === 'function') stopCurrentVideo();
  if (typeof stopMatchCrowd === 'function') stopMatchCrowd();
  if (typeof stopEntranceCrowd === 'function') stopEntranceCrowd(false);
  if (typeof stopBGMForAction === 'function') stopBGMForAction();

  const closeBtn = document.getElementById('videoCloseBtn');
  if (closeBtn) closeBtn.style.display = 'none';

  const overlay = document.getElementById('mitbCoronationOverlay');
  const card = document.getElementById('mitbCoronationWrestlerCard');

  if (!overlay) return;

  if (winner) {
    currentPlayingWrestler = winner;
    window.isCommentatorVideoActive = false;
  }

  const getActiveHost = () => {
    return document.fullscreenElement ||
           document.webkitFullscreenElement ||
           // BATCH 7 ITEM 11: only use the video modal when it's actually open, otherwise the overlay
           // gets parked inside a hidden modal and pops up at the start of the next match
           ((() => { const vm = document.getElementById('videoModal'); return (vm && getComputedStyle(vm).display !== 'none') ? vm : null; })()) ||
           document.body;
  };

  const host = getActiveHost();
  if (overlay.parentElement !== host) {
    host.appendChild(overlay);
  }
  overlay.style.setProperty('position', 'fixed', 'important');
  overlay.style.setProperty('inset', '0', 'important');
  overlay.style.setProperty('z-index', '2147483647', 'important');

  if (card) {
    card.innerHTML = `
      <div class="vs-wrestler">
        <img src="${winner.image}" style="width:130px; height:130px; border:2.5px solid #ffd700; box-shadow:0 0 35px #ffd700;" onerror="handleImgError(this, '${winner.id}')">
        <div style="font-family:'Russo One', sans-serif; font-size:1.15rem; color:#ffd700; margin-top:8px; text-transform:uppercase;">${winner.name}</div>
      </div>
    `;
  }

  const victoryThemeBtn = document.getElementById('mitbPlayVictoryThemeBtn');
  if (victoryThemeBtn) {
    victoryThemeBtn.onclick = () => {
      overlay.style.display = 'none';

      currentPlayingWrestler = winner;
      window.isCommentatorVideoActive = false;

      if (typeof loadAndPlayYouTube === 'function' && winner.youtubeUrl) {
        loadAndPlayYouTube(winner.youtubeUrl, false, false, false, false);
      }

      const videoHost = getActiveHost();
      let floatBtn = document.getElementById('mitbFloatingExitBtn');
      if (!floatBtn) {
        floatBtn = document.createElement('button');
        floatBtn.id = 'mitbFloatingExitBtn';
        floatBtn.className = 'action-btn btn-red';
      }
      if (floatBtn.parentElement !== videoHost) {
        videoHost.appendChild(floatBtn);
      }
      floatBtn.innerText = window.activeShowSession ? 'CONTINUE SHOW ➔' : 'CONTINUE TO ROSTER ➔';
      floatBtn.style.cssText = `
        position: fixed !important;
        bottom: 30px !important;
        right: 30px !important;
        top: auto !important;
        left: auto !important;
        z-index: 2147483647 !important;
        display: block !important;
        pointer-events: auto !important;
      `;

      const syncMitbExitBtnHost = () => {
        const curHost = getActiveHost();
        if (floatBtn && floatBtn.style.display !== 'none' && floatBtn.parentElement !== curHost) {
          curHost.appendChild(floatBtn);
        }
      };
      window._activeMitbFsSync = syncMitbExitBtnHost;
      document.addEventListener('fullscreenchange', syncMitbExitBtnHost);
      document.addEventListener('webkitfullscreenchange', syncMitbExitBtnHost);
      setTimeout(syncMitbExitBtnHost, 150);

      floatBtn.onclick = () => {
        floatBtn.style.display = 'none';
        closeMitbCoronationOverlay();
      };
    };
  }

  overlay.style.display = 'flex';

  try {
    if (typeof playMitbSlamAudio === 'function') playMitbSlamAudio();
  } catch (e) {}
}

function closeMitbCoronationOverlay() {
  const overlay = document.getElementById('mitbCoronationOverlay');
  if (overlay) overlay.style.display = 'none';
  const floatBtn = document.getElementById('mitbFloatingExitBtn');
  if (floatBtn) floatBtn.style.display = 'none';

  if (window._activeMitbFsSync) {
    document.removeEventListener('fullscreenchange', window._activeMitbFsSync);
    document.removeEventListener('webkitfullscreenchange', window._activeMitbFsSync);
    window._activeMitbFsSync = null;
  }

  if (typeof stopCurrentVideo === 'function') stopCurrentVideo();
  if (typeof closeVideoModal === 'function') closeVideoModal();
  if (typeof renderGrid === 'function') renderGrid();
  if (typeof renderRoster === 'function') renderRoster();
  if (typeof renderRosterGrid === 'function') renderRosterGrid();
  if (typeof resumeBGM === 'function') resumeBGM();
  // BATCH 7 ITEM 11: let any queued post-match events carry on once the briefcase screen closes
  if (typeof processNextPostMatchEvent === 'function') processNextPostMatchEvent();
}

/* --------------------------------------------------------------------------
   4. RECORD BOOK, MILESTONES & 8-PEDESTAL TROPHY CABINET
   -------------------------------------------------------------------------- */
function getGmEllisAvatarSrc() {
  try {
    const widgetImg = document.querySelector('#gmProfileWidget img');
    if (widgetImg && widgetImg.getAttribute('src')) {
      return widgetImg.getAttribute('src');
    }
  } catch (e) {}
  return 'ellis_avatar.png';
}

function getMilestones() {
  try {
    return JSON.parse(localStorage.getItem('ewf_milestones')) || {};
  } catch (e) {
    return {};
  }
}

function saveMilestones(m) {
  try {
    localStorage.setItem('ewf_milestones', JSON.stringify(m));
  } catch (e) {}
}

function evaluateAllMilestones() {
  const m = getMilestones();
  const history = getHistory();
  const titles = typeof getTitleHolders === 'function' ? getTitleHolders() : {};
  const allW = (typeof window.wrestlers !== 'undefined' && Array.isArray(window.wrestlers) && window.wrestlers.length > 0)
    ? window.wrestlers
    : (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : (typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : []));

  let maxGrandSlamBelts = 0;
  let grandSlamLeader = null;

  allW.forEach(w => {
    const wNameUpper = w.name.toUpperCase();
    
    const curWhc = titles.whc === w.id;
    const curIc = titles.ic === w.id;
    const curHc = titles.hardcore === w.id;
    const curTag = (titles.tag1 === w.id || titles.tag2 === w.id);

    let histWhc = false, histIc = false, histHc = false, histTag = false;
    history.forEach(h => {
      const textUpper = (h.text || '').toUpperCase();
      const isReignLog = h.type === 'title-change' || textUpper.includes('CHAMPION') || textUpper.includes('🏆');
      if (isReignLog && textUpper.includes(wNameUpper)) {
        if (textUpper.includes('WHC') || textUpper.includes('WORLD HEAVYWEIGHT')) histWhc = true;
        if (textUpper.includes('IC') || textUpper.includes('INTERCONTINENTAL')) histIc = true;
        if (textUpper.includes('HARDCORE')) histHc = true;
        if (textUpper.includes('TAG')) histTag = true;
      }
    });

    const hasWhc = curWhc || histWhc;
    const hasIc = curIc || histIc;
    const hasHc = curHc || histHc;
    const hasTag = curTag || histTag;

    const count = (hasWhc ? 1 : 0) + (hasIc ? 1 : 0) + (hasHc ? 1 : 0) + (hasTag ? 1 : 0);
    if (count > maxGrandSlamBelts) {
      maxGrandSlamBelts = count;
      grandSlamLeader = w;
    }

    if (count === 4) {
      if (!m.grand_slam) m.grand_slam = { unlocked: true, holder: w.id };
    }
  });

  allW.forEach(w => {
    let winStreak = 0;
    for (let h of history) {
      if (h.type === 'match' && h.text && h.text.toUpperCase().includes(w.name.toUpperCase())) {
        if (h.winnerId === w.id) winStreak++;
        else winStreak = 0;
        if (winStreak >= 10) {
          if (!m.the_streak) m.the_streak = { unlocked: true, holder: w.id };
          break;
        }
      }
    }
  });

  const fiveStars = history.filter(h => h.rating === 5 || (h.text && h.text.includes('★★★★★'))).length;
  // --- BATCH 5 ITEM 12 FIX: AUTO-RECONCILE FIVE-STAR GENERAL IN MILESTONES ---
  if (m.five_star_general && fiveStars < 10) {
    delete m.five_star_general;
  }
  if (fiveStars >= 10 && !m.five_star_general) {
    m.five_star_general = { unlocked: true, count: fiveStars };
  }

  const defenses = getDefenses();
  if (defenses.tag >= 5 && !m.tag_team_kings) {
    m.tag_team_kings = { unlocked: true };
  }

  saveMilestones(m);

  return { maxGrandSlamBelts, grandSlamLeader };
}

function getSuperstarMilestoneCount(wrestlerId) {
  const m = getMilestones();
  let count = 0;
  if (m.grand_slam && m.grand_slam.holder === wrestlerId) count++;
  if (m.heist_century && m.heist_century.holder === wrestlerId) count++;
  if (m.iron_man && m.iron_man.holder === wrestlerId) count++;
  if (m.the_streak && m.the_streak.holder === wrestlerId) count++;
  if (m.slayer_giants && m.slayer_giants.holder === wrestlerId) count++;
  if (m.fan_favourite && m.fan_favourite.firstWrestler === wrestlerId) count++;
  if (m.five_star_general) count++;
  if (m.tag_team_kings) count++;
  return count;
}

function renderRecordBookUI() {
  const container = document.getElementById('recordBookContent');
  if (!container) return;
  const history = getHistory();
  const allW = (typeof window.wrestlers !== 'undefined' && Array.isArray(window.wrestlers) && window.wrestlers.length > 0)
    ? window.wrestlers
    : (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : (typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : []));

  const winCounts = {};
  allW.forEach(w => { winCounts[w.id] = 0; });
  history.forEach(h => {
    if (h.winnerId && winCounts[h.winnerId] !== undefined) winCounts[h.winnerId]++;
  });

  const sortedWins = [...allW].sort((a,b) => (winCounts[b.id]||0) - (winCounts[a.id]||0));
  const fiveStarBouts = history.filter(h => h.rating === 5);

  container.innerHTML = `
    <h3 style="font-family:'Russo One'; color:#ffd700; font-size:0.95rem; margin-bottom:8px;">🏆 ALL-TIME FEDERATION RECORDS</h3>
    <table class="record-book-table">
      <thead><tr><th>RECORD CLASSIFICATION</th><th>RECORD HOLDER</th><th>STATISTIC</th></tr></thead>
      <tbody>
        <tr>
          <td>MOST FEDERATION MATCH WINS</td>
          <td><strong>${sortedWins[0]?.name || 'None'}</strong></td>
          <td style="color:#ffd700; font-weight:bold;">${winCounts[sortedWins[0]?.id] || 0} Wins</td>
        </tr>
        <tr>
          <td>5-STAR MATCH CLASSICS LOGGED</td>
          <td>EWF UNIVERSE ROSTER</td>
          <td style="color:#00ffcc; font-weight:bold;">${fiveStarBouts.length} Classics</td>
        </tr>
        <tr>
          <td>CURRENT LONGEST TITLE DEFENSE STREAK</td>
          <td>ACTIVE CHAMPIONS</td>
          <td style="color:#00ff66; font-weight:bold;">${Math.max(...Object.values(getDefenses()))} Defenses</td>
        </tr>
      </tbody>
    </table>
  `;
}

function attachGmTrophyBadge(cardEl, trophyLabel) {
  if (!cardEl) return;
  const gmSrc = getGmEllisAvatarSrc();
  let badge = cardEl.querySelector('.gm-trophy-holder-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'gm-trophy-holder-badge';
    badge.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 6px;
      padding: 3px 8px;
      background: rgba(212, 175, 55, 0.16);
      border: 1px solid #ffd700;
      border-radius: 999px;
      font-family: 'Russo One', sans-serif;
      font-size: 0.62rem;
      color: #ffd700;
      letter-spacing: 0.6px;
      cursor: pointer;
    `;
    cardEl.appendChild(badge);
  }
  badge.innerHTML = `
    <img src="${gmSrc}" alt="General Manager Ellis" style="width:20px; height:20px; border-radius:50%; object-fit:cover; border:1px solid #ffd700;" onerror="this.onerror=null;this.src='ellis_avatar.png'">
    <span>GM ELLIS • HOF CEREMONY ➔</span>
  `;
  badge.onclick = (e) => {
    e.stopPropagation();
    launchHofCeremony('gm-ellis', trophyLabel);
  };
}

function renderTrophyCabinetUI() {
  const { maxGrandSlamBelts, grandSlamLeader } = evaluateAllMilestones();
  const m = getMilestones();
  const history = getHistory();
  const defenses = getDefenses();

  const t1 = document.getElementById('trophyCard1');
  const p1 = document.getElementById('trophyProg1');
  if (m.grand_slam?.unlocked) { 
    t1?.classList.replace('is-locked', 'is-unlocked'); 
    if (p1) p1.innerText = "UNLOCKED 👑"; 
  } else {
    t1?.classList.replace('is-unlocked', 'is-locked');
    if (p1) {
      const leaderTag = grandSlamLeader ? ` (${grandSlamLeader.name.split(' ')[0]})` : '';
      p1.innerText = `${maxGrandSlamBelts} / 4 Belts${leaderTag}`;
    }
  }

  const t2 = document.getElementById('trophyCard2');
  const p2 = document.getElementById('trophyProg2');
  if (m.heist_century?.unlocked) { t2?.classList.replace('is-locked', 'is-unlocked'); if(p2) p2.innerText = "UNLOCKED 💼"; }

  const t3 = document.getElementById('trophyCard3');
  const p3 = document.getElementById('trophyProg3');
  if (m.iron_man?.unlocked) { t3?.classList.replace('is-locked', 'is-unlocked'); if(p3) p3.innerText = "UNLOCKED ⏳"; }

  const t4 = document.getElementById('trophyCard4');
  const p4 = document.getElementById('trophyProg4');
  if (m.the_streak?.unlocked) { t4?.classList.replace('is-locked', 'is-unlocked'); if(p4) p4.innerText = "UNLOCKED 🛡️"; }

  const t5 = document.getElementById('trophyCard5');
  const p5 = document.getElementById('trophyProg5');
  const fiveStars = history.filter(h => h.rating === 5).length;
  if (m.five_star_general?.unlocked && fiveStars >= 10) {
    t5?.classList.replace('is-locked', 'is-unlocked');
    if (p5) p5.innerText = "UNLOCKED ⭐";
    attachGmTrophyBadge(t5, 'FIVE-STAR GENERAL');
  } else {
    t5?.classList.replace('is-unlocked', 'is-locked');
    const existingBadge5 = t5?.querySelector('.gm-trophy-holder-badge');
    if (existingBadge5) existingBadge5.remove();
    if (p5) p5.innerText = `${fiveStars} / 10 Classics`;
  }

  const t6 = document.getElementById('trophyCard6');
  const p6 = document.getElementById('trophyProg6');
  if (m.slayer_giants?.unlocked) { t6?.classList.replace('is-locked', 'is-unlocked'); if(p6) p6.innerText = "UNLOCKED ⚔️"; }

  const t7 = document.getElementById('trophyCard7');
  const p7 = document.getElementById('trophyProg7');
  if (m.tag_team_kings?.unlocked) {
    t7?.classList.replace('is-locked', 'is-unlocked');
    if (p7) p7.innerText = "UNLOCKED 👥";
    attachGmTrophyBadge(t7, 'TAG TEAM KINGS');
  } else {
    t7?.classList.replace('is-unlocked', 'is-locked');
    if (p7) p7.innerText = `${defenses.tag || 0} / 5 Defenses`;
  }

  const t8 = document.getElementById('trophyCard8');
  const p8 = document.getElementById('trophyProg8');
  if (m.fan_favourite?.unlocked) { t8?.classList.replace('is-locked', 'is-unlocked'); if(p8) p8.innerText = "UNLOCKED 🎤"; }

  const candidateList = document.getElementById('hofCandidateList');
  if (candidateList) {
    const allW = (typeof window.wrestlers !== 'undefined' && Array.isArray(window.wrestlers) && window.wrestlers.length > 0)
      ? window.wrestlers
      : (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : (typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : []));

    const eligible = allW.filter(w => getSuperstarMilestoneCount(w.id) >= 4 && !isHofInductee(w.id));
    const hasPromoterTrophy = Boolean((m.five_star_general?.unlocked && fiveStars >= 10) || m.tag_team_kings?.unlocked);
    const gmEligible = hasPromoterTrophy && !isHofInductee('gm-ellis');

    let chipsHtml = '';
    if (gmEligible) {
      const gmSrc = getGmEllisAvatarSrc();
      const promoterAward = (m.five_star_general?.unlocked && fiveStars >= 10) ? 'FIVE-STAR GENERAL' : 'TAG TEAM KINGS';
      chipsHtml += `
        <button class="hof-induct-chip-btn" onclick="launchHofCeremony('gm-ellis', '${promoterAward}')" style="display:inline-flex; align-items:center; gap:8px;">
          <img src="${gmSrc}" alt="General Manager Ellis" style="width:22px; height:22px; border-radius:50%; object-fit:cover; border:1px solid #ffd700;" onerror="this.onerror=null;this.src='ellis_avatar.png'">
          <span>🏛️ INDUCT GENERAL MANAGER ELLIS (${promoterAward})</span>
        </button>
      `;
    }

    if (eligible.length > 0) {
      chipsHtml += eligible.map(w => `
        <button class="hof-induct-chip-btn" onclick="launchHofCeremony('${w.id}')">
          🏛️ INDUCT ${w.name.toUpperCase()} (${getSuperstarMilestoneCount(w.id)} Milestones)
        </button>
      `).join('');
    }

    if (!chipsHtml) {
      candidateList.innerHTML = `<span style="font-size: 0.75rem; color: #888;">No eligible superstars yet (Requires 4+ milestones).</span>`;
    } else {
      candidateList.innerHTML = chipsHtml;
    }
  }
}

function showTrophyDetail(num) {
  const titles = [
    "THE GRAND SLAM", "HEIST OF THE CENTURY", "THE IRON MAN", "THE STREAK",
    "FIVE-STAR GENERAL", "SLAYER OF GIANTS", "TAG TEAM KINGS", "ULTIMATE FAN FAVOURITE"
  ];
  const descs = [
    "Win World, Intercontinental, Hardcore, and Tag Team Championships (Active or in History).",
    "Successfully cash in Money in the Bank mid-match to capture a title.",
    "Win a Royal Rumble entering from spot #1 or #2.",
    "Achieve 10 consecutive match wins across the federation without a loss.",
    "Produce 10 separate 5-star match classics in your ledger.",
    "Dethrone a reigning champion who has defended their belt 5+ times.",
    "Successfully defend the World Tag Team Championship 5 times in a single reign.",
    "Play a superstar's entrance, promo, or theme preview 30+ times."
  ];
  alert(`🏆 ${titles[num-1]}\n\nCriteria: ${descs[num-1]}`);
}

/* --------------------------------------------------------------------------
   5. HALL OF FAME WING & INDUCTION CEREMONY
   -------------------------------------------------------------------------- */
function openHofTestPicker() {
  let picker = document.getElementById('hofTestPickerModal');
  if (!picker) {
    picker = document.createElement('div');
    picker.id = 'hofTestPickerModal';
    picker.style.cssText = 'position:fixed; inset:0; width:100vw; height:100vh; background:rgba(0,0,0,0.94); z-index:999999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(6px);';
    picker.innerHTML = `
      <div class="modal-content" style="max-width:520px; text-align:center; border:2px solid #ffd700; box-shadow:0 0 30px rgba(255,215,0,0.45);">
        <h2 style="color:#ffd700; font-family:'Russo One', sans-serif; font-size:1.3rem; margin-bottom:12px; letter-spacing:1px;">
          🏛️ SELECT INDUCTEE FOR HALL OF FAME CEREMONY
        </h2>
        <div id="hofTestPickerList" class="vs-container" style="max-height:340px; overflow-y:auto; margin:15px 0;"></div>
        <div class="modal-buttons" style="justify-content:center;">
          <button type="button" class="btn-cancel" onclick="document.getElementById('hofTestPickerModal').style.display='none'">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(picker);
  }

  const list = document.getElementById('hofTestPickerList');
  if (!list) return;
  list.innerHTML = '';

  const gmCard = document.createElement('div');
  gmCard.className = 'vs-wrestler';
  gmCard.style.borderColor = '#ffd700';
  const gmSrc = getGmEllisAvatarSrc();
  gmCard.innerHTML = `
    <img src="${gmSrc}" alt="General Manager Ellis" onerror="this.onerror=null;this.src='ellis_avatar.png'">
    <div style="font-family:'Russo One', sans-serif; font-size:0.85rem; color:#ffd700; margin-top:4px;">GENERAL MANAGER ELLIS</div>
  `;
  gmCard.onclick = () => {
    picker.style.display = 'none';
    launchHofCeremony('gm-ellis', 'EXECUTIVE PROMOTER TROPHY');
  };
  list.appendChild(gmCard);

  const allW = (typeof window.wrestlers !== 'undefined' && Array.isArray(window.wrestlers) && window.wrestlers.length > 0)
    ? window.wrestlers
    : (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : (typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : []));

  allW.forEach(w => {
    const card = document.createElement('div');
    card.className = 'vs-wrestler';
    card.innerHTML = `
      <img src="${w.image}" alt="${w.name}" onerror="handleImgError(this, '${w.id}')">
      <div style="font-family:'Russo One', sans-serif; font-size:0.85rem; color:#fff; margin-top:4px;">${w.name}</div>
    `;
    card.onclick = () => {
      picker.style.display = 'none';
      launchHofCeremony(w.id);
    };
    list.appendChild(card);
  });

  picker.style.display = 'flex';
}

function launchHofCeremony(wrestlerId, trophyTitle = null) {
  const allW = (typeof window.wrestlers !== 'undefined' && Array.isArray(window.wrestlers) && window.wrestlers.length > 0)
    ? window.wrestlers
    : (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : (typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : []));

  const inductee = wrestlerId ? allW.find(w => w.id === wrestlerId) : null;

  const isPromoterTrophy = !inductee;
  const displayName = inductee ? inductee.name.toUpperCase() : 'GENERAL MANAGER ELLIS';
  const displayImg = inductee ? inductee.image : getGmEllisAvatarSrc();
  const storeId = inductee ? inductee.id : 'gm-ellis';
  const awardLabel = trophyTitle
    || (!inductee && typeof wrestlerId === 'string' && wrestlerId !== 'gm-ellis' && wrestlerId !== 'promoter' ? wrestlerId.toUpperCase() : 'EXECUTIVE PROMOTER EXCELLENCE');

  if (typeof stopBGMForAction === 'function') stopBGMForAction();
  closeHistoryModal();

  try { 
    const audio = typeof hofFanfareSound !== 'undefined' ? hofFanfareSound : new Audio('hof_fanfare.mp3');
    audio.currentTime = 0; 
    audio.play().catch(() => {}); 
  } catch (e) {}

  const overlay = document.getElementById('hofCeremonyOverlay');
  const img = document.getElementById('hofInducteeImg');
  const name = document.getElementById('hofPlaqueName');
  const proc = document.getElementById('hofProclamationText');

  if (img) {
    img.src = displayImg;
    img.onerror = isPromoterTrophy
      ? () => { img.onerror = null; img.src = 'ellis_avatar.png'; }
      : () => { if (typeof handleImgError === 'function') handleImgError(img, inductee.id); };
  }
  if (name) name.innerText = displayName;
  if (proc) {
    if (isPromoterTrophy) {
      proc.innerHTML = `“For visionary leadership, historic matchmaking (${awardLabel}), and permanent contributions to the EWF Universe, <span class="hof-proclamation-name">GENERAL MANAGER ELLIS</span> is officially enshrined into the EWF Hall of Fame.”`;
    } else {
      proc.innerHTML = `“For outstanding excellence, milestone achievements, and permanent contributions to the squared circle, <span class="hof-proclamation-name">${displayName}</span> is officially enshrined into the EWF Hall of Fame.”`;
    }
  }

  try {
    let inducted = JSON.parse(localStorage.getItem('ewf_hof_inductees')) || [];
    if (!inducted.includes(storeId)) {
      inducted.push(storeId);
      localStorage.setItem('ewf_hof_inductees', JSON.stringify(inducted));
    }
  } catch (e) {}

  saveHistoryLog(`🏛️ HALL OF FAME INDUCTION: ${displayName} was inducted into the Class of 2026!`, 'title-change');
  if (typeof unlockAchievement === 'function') unlockAchievement('immortal_maker');

  if (overlay) overlay.style.display = 'flex';
}

function closeHofCeremony() {
  const overlay = document.getElementById('hofCeremonyOverlay');
  if (overlay) overlay.style.display = 'none';
  if (typeof renderGrid === 'function') renderGrid();
  if (typeof renderRoster === 'function') renderRoster();
  if (typeof resumeBGM === 'function') resumeBGM();
}

const isHofInducteeSafe = typeof isHofInductee === 'function'
  ? isHofInductee
  : function(id) {
      try {
        const inducted = JSON.parse(localStorage.getItem('ewf_hof_inductees')) || [];
        return inducted.includes(id);
      } catch (e) {
        return false;
      }
    };

// Global Exports
window.getDefenses = getDefenses;
window.saveDefenses = saveDefenses;
window.getTitleDefenseCount = getTitleDefenseCount;
window.incrementTitleDefense = incrementTitleDefense;
window.resetTitleDefense = resetTitleDefense;
window.getHistory = getHistory;
window.saveHistoryLog = saveHistoryLog;
window.renderHistoryUI = renderHistoryUI;
window.currentVictoriesSubMode = currentVictoriesSubMode;
window.switchVictoriesSubMode = switchVictoriesSubMode;
window.renderVictoriesLeaderboard = renderVictoriesLeaderboard;
window.clearHistory = clearHistory;
window.openHistoryModal = openHistoryModal;
window.closeHistoryModal = closeHistoryModal;
window.switchHistoryTab = switchHistoryTab;
window.getKotrHolder = getKotrHolder;
window.setKotrHolder = setKotrHolder;
window.openKotrHub = openKotrHub;
window.closeKotrModal = closeKotrModal;
window.chooseKotrFormat = chooseKotrFormat;
window.backToKotrSetup = backToKotrSetup;
window.startKotrRandomDraw = startKotrRandomDraw;
window.startKotrHandPickSeeds = startKotrHandPickSeeds;
window.openKotrSlotPicker = openKotrSlotPicker;
window.closeKotrSlotPickerModal = closeKotrSlotPickerModal;
window.buildKotrBracketTreeFromEntrants = buildKotrBracketTreeFromEntrants;
window.renderKotrBracketTree = renderKotrBracketTree;
window.openKotrMatchActionModal = openKotrMatchActionModal;
window.closeKotrMatchActionModal = closeKotrMatchActionModal;
window.launchKotrMatch = launchKotrMatch;
window.returnToKotrBracket = returnToKotrBracket;
window.recordKotrWinner = recordKotrWinner;
window.showKotrCoronationOverlay = showKotrCoronationOverlay;
window.closeKotrCoronationOverlay = closeKotrCoronationOverlay;
window.showCoronationOverlay = showCoronationOverlay;
window.closeCoronationOverlay = closeCoronationOverlay;
window.showRumbleCoronationOverlay = showRumbleCoronationOverlay;
window.closeRumbleCoronationOverlay = closeRumbleCoronationOverlay;
window.showMitbCoronationOverlay = showMitbCoronationOverlay;
window.closeMitbCoronationOverlay = closeMitbCoronationOverlay;
window.getGmEllisAvatarSrc = getGmEllisAvatarSrc;
window.getMilestones = getMilestones;
window.saveMilestones = saveMilestones;
window.isHofInductee = isHofInducteeSafe;
window.evaluateAllMilestones = evaluateAllMilestones;
window.getSuperstarMilestoneCount = getSuperstarMilestoneCount;
window.renderRecordBookUI = renderRecordBookUI;
window.renderTrophyCabinetUI = renderTrophyCabinetUI;
window.showTrophyDetail = showTrophyDetail;
window.openHofTestPicker = openHofTestPicker;
window.launchHofCeremony = launchHofCeremony;
window.closeHofCeremony = closeHofCeremony;