/* ==========================================================================
   ELLIS'S MAIN EVENT (EWF UNIVERSE) - MODULE 8: js/8-create-show.js
   BATCH 12: CREATE YOUR OWN SHOW (unlocks at Level 10 since Batch 13)
   - Name it, photo or drawn logo, YouTube intro, weekly or pay-per-view
   - Arena colours, build the whole card, main event last
   - Bret and Corbin welcome everyone to the show
   - Event poster to save or print
   - Each show keeps its own history, best match and past main event winners
   - Big nights build a reputation: SOLD OUT!
   ========================================================================== */

(function () {
  const KEY = 'ewf_custom_shows';
  const UNLOCK_LEVEL = (window.EWF_UNLOCK_LEVELS && window.EWF_UNLOCK_LEVELS.custom) || 16;
  const MAX_SHOWS = 8;

  const COLOURS = [
    { name: 'Blood Red', primary: '#d50000', secondary: '#2b0000' },
    { name: 'Royal Blue', primary: '#1e88e5', secondary: '#001a40' },
    { name: 'Champion Gold', primary: '#ffd700', secondary: '#3d2c00' },
    { name: 'Toxic Green', primary: '#00e676', secondary: '#00331a' },
    { name: 'Purple Reign', primary: '#aa00ff', secondary: '#1a0033' },
    { name: 'Hellfire Orange', primary: '#ff6d00', secondary: '#1a0a00' }
  ];
  const FORMATS = [
    { key: '1v1', label: '1 VS 1', n: 2 },
    { key: 'triple', label: 'TRIPLE THREAT', n: 3 },
    { key: 'fatal', label: 'FATAL 4-WAY', n: 4 },
    { key: 'tag', label: 'TAG TEAM (2 VS 2)', n: 4 },
    { key: 'handicap', label: 'HANDICAP (1 VS 2)', n: 3 } // BATCH 15 ITEM 22
  ];
  const TITLES = [
    { code: 'whc', name: 'World Heavyweight Championship', img: 'whc.png' },
    { code: 'ic', name: 'Intercontinental Championship', img: 'ic_title.png' },
    { code: 'hardcore', name: 'Hardcore Championship', img: 'hardcore.png' },
    { code: 'tag', name: 'Tag Team Championship', img: 'tag_title.png' }
  ];

  /* ---------- Storage ---------- */
  function loadShows() { try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function saveShows(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch (e) { alert('The tablet is out of room for another show logo. Try a smaller picture, or delete an old show.'); return false; }
  }
  const showKey = (s) => 'cs_' + s.id;
  const byKey = (key) => loadShows().find(s => showKey(s) === key) || null;
  const level = () => (typeof getGMLevel === 'function' ? getGMLevel() : 1);
  const roster = () => (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : []).filter(Boolean);
  const wById = (id) => roster().find(w => w.id === id) || null;
  const injured = (id) => typeof getInjuryRecord === 'function' && !!getInjuryRecord(id);
  const esc = (t) => String(t || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const host = () => { const fs = document.fullscreenElement || document.webkitFullscreenElement; return (fs && getComputedStyle(fs).display !== 'none') ? fs : document.body; };
  const bret = (k, html, d) => { try { if (typeof window.ewfBretCut === 'function') window.ewfBretCut(k, html, d); } catch (e) {} };
  const safeType = (t) => (typeof window.ewfSafeMatchType === 'function' ? window.ewfSafeMatchType(t) : t);

  /* ---------- Plug custom shows into the rest of the app ---------- */
  function register() {
    try {
      loadShows().forEach(s => {
        if (typeof showIntros !== 'undefined') {
          if (s.intro) showIntros[showKey(s)] = s.intro; else delete showIntros[showKey(s)];
        }
      });
    } catch (e) {}
  }
  const origLogo = window.getShowLogo;
  window.getShowLogo = function (key) {
    if (typeof key === 'string' && key.indexOf('cs_') === 0) { const s = byKey(key); return (s && s.logo) || 'logo_notext.png'; }
    return origLogo ? origLogo(key) : key + '_logo.png';
  };
  try { getShowLogo = window.getShowLogo; } catch (e) {}
  const origName = window.getShowName;
  window.getShowName = function (key) {
    if (typeof key === 'string' && key.indexOf('cs_') === 0) { const s = byKey(key); return s ? s.name.toUpperCase() : 'CUSTOM SHOW'; }
    return origName ? origName(key) : String(key || '').toUpperCase();
  };
  window.ewfShowTheme = function (key) {
    if (typeof key === 'string' && key.indexOf('cs_') === 0) { const s = byKey(key); return s && s.colours ? s.colours : null; }
    return null;
  };

  /* ---------- History, best match and SOLD OUT ---------- */
  function showStats(s) {
    const hist = (typeof getShowHistory === 'function' ? getShowHistory() : []).filter(h => h && h.showKey === showKey(s));
    const runs = hist.length;
    const ratings = hist.map(h => parseFloat(h.rating) || 0);
    const bestRun = hist.slice().sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))[0] || null;
    let bestMatch = null;
    hist.forEach(h => (h.bouts || []).forEach(b => { if (!bestMatch || (b.rating || 0) > (bestMatch.rating || 0)) bestMatch = Object.assign({ date: h.date }, b); }));
    const mainWinners = hist.map(h => { const b = (h.bouts || [])[(h.bouts || []).length - 1]; return b ? { name: b.winnerName, date: h.date, grade: h.grade } : null; }).filter(Boolean);
    const bigNights = ratings.filter(r => r >= 4).length;
    return { runs, bestRun, bestMatch, mainWinners, soldOut: bigNights >= 2, bigNights };
  }

  /* ---------- Styles ---------- */
  function ensureStyles() {
    if (document.getElementById('ewfCsStyles')) return;
    const css = document.createElement('style');
    css.id = 'ewfCsStyles';
    css.textContent = `
      .ewf-cs-ov { position: fixed; inset: 0; z-index: 2147483300; background: rgba(4,4,8,0.94); overflow-y: auto; padding: 18px 12px 40px 12px; box-sizing: border-box;
        font-family: 'DM Sans', -apple-system, 'Segoe UI', Roboto, sans-serif; color: #fff; }
      .ewf-cs-box { max-width: 900px; margin: 0 auto; background: linear-gradient(160deg, #15151f, #08080c); border: 2px solid #ffd700; box-shadow: 0 0 30px rgba(255,215,0,0.3); padding: 16px; }
      .ewf-cs-box h2 { font-family: 'Russo One', sans-serif; color: #ffd700; margin: 0 0 4px 0; letter-spacing: 1px; text-align: center; }
      .ewf-cs-sub { text-align: center; color: #bbb; font-size: 0.9rem; margin-bottom: 14px; }
      .ewf-cs-sec { border-top: 1px dashed #444; padding: 12px 0; }
      .ewf-cs-sec > label { display: block; font-family: 'Russo One', sans-serif; color: #ffd700; font-size: 0.85rem; letter-spacing: 1px; margin-bottom: 6px; }
      .ewf-cs-ov input[type=text], .ewf-cs-ov select { width: 100%; box-sizing: border-box; background: #111; color: #fff; border: 1px solid #555; padding: 10px; font-size: 1rem; font-family: inherit; }
      .ewf-cs-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
      .ewf-cs-btn { font-family: 'Russo One', sans-serif; font-size: 0.95rem; padding: 11px 16px; border: 2px solid #fff; color: #fff; cursor: pointer; background: linear-gradient(180deg, #333, #111); text-transform: uppercase; }
      .ewf-cs-btn.gold { background: linear-gradient(180deg, #d4af37, #b8860b); color: #000; }
      .ewf-cs-btn.red { background: linear-gradient(180deg, #d32f2f, #7f0000); }
      .ewf-cs-btn.blue { background: linear-gradient(180deg, #1565c0, #0d2a5c); }
      .ewf-cs-btn.green { background: linear-gradient(180deg, #00a152, #004d26); }
      .ewf-cs-btn.sel { outline: 3px solid #ffd700; box-shadow: 0 0 14px rgba(255,215,0,0.8); }
      .ewf-cs-logo { width: 140px; height: 140px; border: 2px dashed #888; display: flex; align-items: center; justify-content: center; background: #000; color: #777; font-size: 0.8rem; text-align: center; }
      .ewf-cs-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
      .ewf-cs-sw { width: 54px; height: 54px; border: 3px solid #555; cursor: pointer; }
      .ewf-cs-sw.sel { border-color: #fff; box-shadow: 0 0 14px #fff; }
      .ewf-cs-match { background: rgba(255,255,255,0.04); border: 1px solid #333; padding: 10px; margin-bottom: 10px; }
      .ewf-cs-match.main { border-color: #ffd700; box-shadow: 0 0 12px rgba(255,215,0,0.25); }
      .ewf-cs-match h4 { margin: 0 0 8px 0; font-family: 'Russo One', sans-serif; color: #fff; letter-spacing: 1px; }
      .ewf-cs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; }
      .ewf-cs-grid > div > span { display: block; font-size: 0.72rem; color: #aaa; margin-bottom: 3px; font-family: 'Russo One', sans-serif; letter-spacing: 1px; }
      .ewf-cs-err { color: #ff5252; font-weight: 700; min-height: 1.2em; text-align: center; margin: 8px 0; }
      .ewf-cs-tile { position: relative; }
      .ewf-cs-tile .so { position: absolute; top: 6px; right: -6px; transform: rotate(12deg); background: #d50000; color: #fff; font-family: 'Russo One', sans-serif;
        font-size: 0.6rem; padding: 2px 6px; border: 1px solid #fff; box-shadow: 0 0 10px #f00; z-index: 3; }
      .ewf-cs-stat { background: rgba(0,0,0,0.5); border: 1px solid #444; padding: 8px 10px; margin: 6px 0; font-size: 0.9rem; }
      .ewf-cs-stat b { color: #ffd700; }
      .ewf-cs-hype { position: fixed; inset: 0; z-index: 2147483400; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px;
        box-sizing: border-box; background-size: cover; background-position: center; animation: ewfCsIn .4s ease-out; }
      .ewf-cs-hype .desk { display: flex; gap: 22px; margin-bottom: 14px; }
      .ewf-cs-hype .desk img { width: 110px; height: 110px; border-radius: 50%; object-fit: cover; border: 3px solid #ffd700; box-shadow: 0 0 20px rgba(255,215,0,0.6); background: #222; }
      .ewf-cs-hype .lg { max-width: min(420px, 70vw); max-height: 30vh; object-fit: contain; filter: drop-shadow(0 0 25px rgba(255,255,255,0.4)); margin: 6px 0 10px 0; animation: ewfCsPop .8s .3s both cubic-bezier(.3,1.5,.6,1); }
      .ewf-cs-hype h1 { font-family: 'Russo One', sans-serif; font-size: clamp(1.8rem, 5.5vw, 3.6rem); margin: 0; letter-spacing: 2px; animation: ewfCsPop .8s .6s both cubic-bezier(.3,1.5,.6,1); }
      .ewf-cs-hype .line { font-size: clamp(1rem, 2.4vw, 1.3rem); max-width: 720px; margin: 10px 0 18px 0; background: rgba(0,0,0,0.6); padding: 10px 14px; border: 1px solid #555; }
      .ewf-cs-hype .soldout { font-family: 'Russo One', sans-serif; font-size: clamp(1.2rem, 3vw, 2rem); color: #fff; background: #d50000; padding: 6px 18px; border: 2px solid #fff;
        transform: rotate(-4deg); box-shadow: 0 0 25px #f00; margin-bottom: 12px; animation: ewfCsPop .6s 1s both; }
      @keyframes ewfCsIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes ewfCsPop { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    `;
    document.head.appendChild(css);
  }
  function overlay(html) {
    ensureStyles();
    closeOverlay();
    const ov = document.createElement('div');
    ov.className = 'ewf-cs-ov'; ov.id = 'ewfCsOverlay';
    ov.innerHTML = `<div class="ewf-cs-box">${html}</div>`;
    host().appendChild(ov);
    return ov;
  }
  function closeOverlay() { const o = document.getElementById('ewfCsOverlay'); if (o) o.remove(); }

  /* ---------- Book a Show tiles ---------- */
  function addTiles() {
    const grid = document.getElementById('bookShowGrid');
    if (!grid) return;
    grid.querySelectorAll('.ewf-cs-tile').forEach(t => t.remove());
    const lv = level();
    if (lv < UNLOCK_LEVEL) {
      const t = document.createElement('div');
      t.className = 'book-show-brand-tile is-locked ewf-cs-tile';
      t.innerHTML = `<div style="height:70px; display:flex; align-items:center; justify-content:center; font-family:'Russo One', sans-serif; font-size:2.6rem; color:#ffd700;">❓</div>
        <div style="text-align:center;"><div class="book-show-brand-name">???</div><div class="book-show-brand-tier">🔒 TOP SECRET: LVL ${UNLOCK_LEVEL}</div></div>`;
      t.onclick = () => alert(`🔒 TOP SECRET!\n\nSomething special unlocks at Level ${UNLOCK_LEVEL}. What could it be?`);
      grid.appendChild(t);
      return;
    }
    loadShows().forEach(s => {
      const st = showStats(s);
      const t = document.createElement('div');
      t.className = 'book-show-brand-tile ewf-cs-tile';
      t.style.borderColor = s.colours ? s.colours.primary : '';
      t.innerHTML = `${st.soldOut ? '<div class="so">🎟️ SOLD OUT</div>' : ''}
        ${s.logo ? `<img src="${s.logo}" alt="${esc(s.name)}">` : `<div style="height:70px; display:flex; align-items:center; justify-content:center; font-family:'Russo One', sans-serif; font-size:1.2rem; color:${s.colours ? s.colours.primary : '#fff'};">${esc(s.name.toUpperCase())}</div>`}
        <div style="text-align:center;"><div class="book-show-brand-name">${esc(s.name.toUpperCase())}</div>
        <div class="book-show-brand-tier">🎬 ELLIS ORIGINAL · ${s.type === 'weekly' ? '📺 WEEKLY' : '🏟️ PPV'} (${s.matches.length} BOUTS)</div></div>`;
      t.onclick = () => openShowMenu(s.id);
      grid.appendChild(t);
    });
    const c = document.createElement('div');
    c.className = 'book-show-brand-tile ewf-cs-tile';
    c.style.cssText = 'border: 2px dashed #ffd700;';
    c.innerHTML = `<div style="height:70px; display:flex; align-items:center; justify-content:center; font-size:2.6rem;">🎬</div>
      <div style="text-align:center;"><div class="book-show-brand-name" style="color:#ffd700;">CREATE YOUR OWN SHOW</div><div class="book-show-brand-tier">✏️ YOUR NAME, YOUR LOGO, YOUR CARD</div></div>`;
    c.onclick = () => { if (loadShows().length >= MAX_SHOWS) { alert(`You've got ${MAX_SHOWS} shows already! Delete one to make room.`); return; } openBuilder(null); };
    grid.appendChild(c);
  }
  const origOpenBook = window.openBookShowModal;
  if (typeof origOpenBook === 'function') {
    window.openBookShowModal = function (...a) { const r = origOpenBook.apply(this, a); try { addTiles(); } catch (e) { console.warn(e); } return r; };
  }

  /* ---------- Custom show menu ---------- */
  function openShowMenu(id) {
    const s = loadShows().find(x => x.id === id);
    if (!s) return;
    const st = showStats(s);
    const past = st.mainWinners.slice(-5).reverse().map(m => `<div>🏆 ${esc(m.name)} <span style="color:#888;">(${esc(m.date)}, grade ${esc(m.grade)})</span></div>`).join('') || '<div style="color:#888;">No main events yet. Run the show to make history!</div>';
    const ov = overlay(`
      <div style="text-align:center;">${s.logo ? `<img src="${s.logo}" style="max-height:120px; max-width:300px; object-fit:contain;">` : ''}</div>
      <h2 style="color:${s.colours ? s.colours.primary : '#ffd700'};">${esc(s.name.toUpperCase())}</h2>
      <div class="ewf-cs-sub">${s.type === 'weekly' ? '📺 Weekly show' : '🏟️ Pay-per-view'} · ${s.matches.length} matches${st.soldOut ? ' · <b style="color:#ff5252;">🎟️ SOLD OUT REPUTATION</b>' : ''}</div>
      <div class="ewf-cs-stat">📅 Times run: <b>${st.runs}</b>${st.bestRun ? ` · Best night: <b>${esc(st.bestRun.grade)} (${esc(st.bestRun.rating)} ★)</b>` : ''}</div>
      ${st.bestMatch ? `<div class="ewf-cs-stat">⭐ Best match ever: <b>${esc(st.bestMatch.winnerName)}</b> def. ${esc(st.bestMatch.loserName)} (${'★'.repeat(st.bestMatch.rating || 0)})</div>` : ''}
      <div class="ewf-cs-stat"><b>PAST MAIN EVENT WINNERS</b>${past}</div>
      ${!st.soldOut ? `<div class="ewf-cs-stat" style="color:#bbb;">🎟️ Get <b>${Math.max(0, 2 - st.bigNights)}</b> more ${2 - st.bigNights === 1 ? 'night' : 'nights'} rated 4 stars or more and this show will <b>SELL OUT</b>!</div>` : ''}
      <div class="ewf-cs-row" style="justify-content:center; margin-top:12px;">
        <button class="ewf-cs-btn gold" id="csRun">▶ RUN THE SHOW</button>
        <button class="ewf-cs-btn blue" id="csPoster">🖼️ MAKE POSTER</button>
        <button class="ewf-cs-btn" id="csEdit">✏️ EDIT</button>
        <button class="ewf-cs-btn red" id="csDel">🗑️ DELETE</button>
        <button class="ewf-cs-btn" id="csClose">✕ CLOSE</button>
      </div>`);
    ov.querySelector('#csRun').onclick = () => runShow(s.id);
    ov.querySelector('#csPoster').onclick = () => makePoster(s);
    ov.querySelector('#csEdit').onclick = () => openBuilder(s.id);
    ov.querySelector('#csDel').onclick = () => {
      if (!confirm(`Delete ${s.name}? Its history stays in the archives.`)) return;
      saveShows(loadShows().filter(x => x.id !== s.id));
      closeOverlay();
      if (typeof window.openBookShowModal === 'function') window.openBookShowModal();
    };
    ov.querySelector('#csClose').onclick = closeOverlay;
  }

  /* ---------- Builder ---------- */
  let draft = null;
  function blankMatch(i, total) { return { formatKey: '1v1', matchType: 'Normal Match', participants: [], titleCode: '' }; }
  function openBuilder(id) {
    const existing = id ? loadShows().find(x => x.id === id) : null;
    draft = existing ? JSON.parse(JSON.stringify(existing)) : {
      id: String(Date.now()), name: '', logo: '', intro: '', type: 'ppv', colours: COLOURS[0],
      matches: [blankMatch(), blankMatch(), blankMatch()], created: Date.now()
    };
    renderBuilder();
    bret('createShow', `Now <b>YOU'RE</b> the promoter, GM! Name your show, <b>draw a logo on paper and take a photo of it</b>, pick your colours and book every match yourself. The last match is your <b>MAIN EVENT</b>!`, 900);
  }
  function matchTypesFor(fmt) {
    const base = fmt === 'tag' ? (typeof tagMatchTypes !== 'undefined' ? tagMatchTypes : ['Normal Match']) : (typeof allMatchTypes !== 'undefined' ? allMatchTypes : ['Normal Match']);
    return base.filter(t => !(typeof isMatchTypeLocked === 'function' && isMatchTypeLocked(t).locked));
  }
  function orderName(i, n) { return i === n - 1 ? '⭐ MAIN EVENT' : (i === 0 ? 'OPENER' : (i === n - 2 && n >= 3 ? 'CO-MAIN EVENT' : `MATCH ${i + 1}`)); }

  function renderBuilder() {
    const d = draft;
    const ws = roster();
    const maxMatches = d.type === 'weekly' ? 3 : 6;
    if (d.matches.length > maxMatches) d.matches = d.matches.slice(0, maxMatches);
    const titlesOk = level() >= 2;
    const wOpts = (sel) => `<option value="">-- pick --</option>` + ws.map(w => `<option value="${w.id}" ${w.id === sel ? 'selected' : ''}>${esc(w.name)}${injured(w.id) ? ' (injured)' : ''}</option>`).join('');
    const matchesHtml = d.matches.map((m, i) => {
      const fmt = FORMATS.find(f => f.key === m.formatKey) || FORMATS[0];
      const types = matchTypesFor(m.formatKey);
      if (!types.includes(m.matchType)) m.matchType = types[0] || 'Normal Match';
      const slotLabel = k => m.formatKey === 'tag' ? (k < 2 ? `TEAM 1 · PARTNER ${k + 1}` : `TEAM 2 · PARTNER ${k - 1}`)
        : m.formatKey === 'handicap' ? (k === 0 ? 'ON THEIR OWN' : `THE PAIR · PARTNER ${k}`) : `SUPERSTAR ${k + 1}`;
      const slots = Array.from({ length: fmt.n }, (_, k) => `<div><span>${slotLabel(k)}</span><select data-m="${i}" data-slot="${k}">${wOpts(m.participants[k])}</select></div>`).join('');
      if (m.titleCode && !titleAllowed(m, m.titleCode)) m.titleCode = '';
      const titleOpts = titleOptions(m);
      return `<div class="ewf-cs-match ${i === d.matches.length - 1 ? 'main' : ''}">
        <h4>${orderName(i, d.matches.length)}</h4>
        <div class="ewf-cs-grid">
          <div><span>MATCH STYLE</span><select data-m="${i}" data-f="format">${FORMATS.map(f => `<option value="${f.key}" ${f.key === m.formatKey ? 'selected' : ''}>${f.label}</option>`).join('')}</select></div>
          <div><span>MATCH TYPE</span><select data-m="${i}" data-f="type">${types.map(t => `<option ${t === m.matchType ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
          ${titlesOk && m.formatKey !== 'handicap' ? `<div><span>TITLE ON THE LINE?</span><select data-m="${i}" data-f="title"><option value="">No title</option>${titleOpts}</select><div class="ewf-cs-tnote" data-tnote="${i}" style="color:#ffb300; font-size:0.72rem; margin-top:3px;"></div></div>` : ''}
        </div>
        <div class="ewf-cs-grid" style="margin-top:8px;">${slots}</div>
      </div>`;
    }).join('');
    const ov = overlay(`
      <h2>🎬 CREATE YOUR OWN SHOW</h2>
      <div class="ewf-cs-sub">You're the promoter now, GM Ellis!</div>
      <div class="ewf-cs-sec"><label>1. NAME YOUR SHOW</label><input type="text" id="csName" maxlength="28" placeholder="e.g. ELLIS MANIA" value="${esc(d.name)}"></div>
      <div class="ewf-cs-sec"><label>2. YOUR LOGO</label>
        <div class="ewf-cs-row">
          <div class="ewf-cs-logo" id="csLogoBox">${d.logo ? `<img src="${d.logo}">` : 'No logo yet'}</div>
          <div style="flex:1; min-width:200px;">
            <div style="margin-bottom:8px; color:#ccc;">Draw a logo on paper and take a photo of it, or pick a picture from the tablet.</div>
            <div class="ewf-cs-row">
              <button class="ewf-cs-btn gold" id="csCam">📷 TAKE A PHOTO</button>
              <button class="ewf-cs-btn blue" id="csPick">🖼️ CHOOSE A PICTURE</button>
              ${d.logo ? '<button class="ewf-cs-btn" id="csNoLogo">✕ REMOVE</button>' : ''}
            </div>
            <input type="file" id="csCamInput" accept="image/*" capture="environment" style="display:none;">
            <input type="file" id="csFileInput" accept="image/*" style="display:none;">
          </div>
        </div></div>
      <div class="ewf-cs-sec"><label>3. INTRO VIDEO (YOUTUBE LINK, OPTIONAL)</label><input type="text" id="csIntro" placeholder="Paste a YouTube link" value="${esc(d.intro)}"></div>
      <div class="ewf-cs-sec"><label>4. WEEKLY SHOW OR PAY-PER-VIEW?</label>
        <div class="ewf-cs-row">
          <button class="ewf-cs-btn ${d.type === 'weekly' ? 'sel' : ''}" data-type="weekly">📺 WEEKLY SHOW (2-3 MATCHES, 150 XP)</button>
          <button class="ewf-cs-btn ${d.type === 'ppv' ? 'sel' : ''}" data-type="ppv">🏟️ PAY-PER-VIEW (3-6 MATCHES, 350-600 XP)</button>
        </div></div>
      <div class="ewf-cs-sec"><label>5. ARENA COLOURS</label>
        <div class="ewf-cs-row">${COLOURS.map((c, i) => `<div class="ewf-cs-sw ${d.colours && d.colours.primary === c.primary ? 'sel' : ''}" data-col="${i}" title="${c.name}" style="background:linear-gradient(135deg, ${c.primary} 50%, ${c.secondary} 50%);"></div>`).join('')}</div></div>
      <div class="ewf-cs-sec"><label>6. BUILD THE CARD</label>
        <div class="ewf-cs-row" style="margin-bottom:10px;">
          <span style="color:#ccc;">How many matches?</span>
          ${Array.from({ length: maxMatches - 1 }, (_, k) => k + 2).map(n => `<button class="ewf-cs-btn ${d.matches.length === n ? 'sel' : ''}" data-count="${n}" style="padding:8px 14px;">${n}</button>`).join('')}
          <button class="ewf-cs-btn blue" id="csFill" style="margin-left:auto;">🎲 FILL THE GAPS FOR ME</button>
        </div>
        ${matchesHtml}
      </div>
      <div class="ewf-cs-err" id="csErr"></div>
      <div class="ewf-cs-row" style="justify-content:center;">
        <button class="ewf-cs-btn green" id="csSave">💾 SAVE MY SHOW</button>
        <button class="ewf-cs-btn" id="csCancel">CANCEL</button>
      </div>`);
    const keepFields = () => { d.name = ov.querySelector('#csName').value.trim(); d.intro = ov.querySelector('#csIntro').value.trim(); };
    ov.querySelector('#csName').oninput = keepFields;
    ov.querySelector('#csIntro').oninput = keepFields;
    const pickFile = (input) => { keepFields(); input.value = ''; input.click(); };
    ov.querySelector('#csCam').onclick = () => pickFile(ov.querySelector('#csCamInput'));
    ov.querySelector('#csPick').onclick = () => pickFile(ov.querySelector('#csFileInput'));
    const onFile = (e) => { const f = e.target.files && e.target.files[0]; if (f) shrinkImage(f, (url) => { d.logo = url; renderBuilder(); }); };
    ov.querySelector('#csCamInput').onchange = onFile;
    ov.querySelector('#csFileInput').onchange = onFile;
    const rm = ov.querySelector('#csNoLogo'); if (rm) rm.onclick = () => { keepFields(); d.logo = ''; renderBuilder(); };
    ov.querySelectorAll('[data-type]').forEach(b => b.onclick = () => {
      keepFields(); d.type = b.getAttribute('data-type');
      if (d.type === 'weekly' && d.matches.length > 3) d.matches = d.matches.slice(0, 3);
      if (d.type === 'ppv' && d.matches.length < 3) while (d.matches.length < 3) d.matches.push(blankMatch());
      renderBuilder();
    });
    ov.querySelectorAll('[data-col]').forEach(b => b.onclick = () => { keepFields(); d.colours = COLOURS[+b.getAttribute('data-col')]; renderBuilder(); });
    ov.querySelectorAll('[data-count]').forEach(b => b.onclick = () => {
      keepFields(); const n = +b.getAttribute('data-count');
      // keep the main event as the main event when the card changes size
      const main = d.matches[d.matches.length - 1];
      let rest = d.matches.slice(0, -1);
      while (rest.length < n - 1) rest.push(blankMatch());
      rest = rest.slice(0, n - 1);
      d.matches = rest.concat([main]);
      renderBuilder();
    });
    ov.querySelectorAll('select[data-m]').forEach(sel => sel.onchange = () => {
      keepFields();
      const m = d.matches[+sel.getAttribute('data-m')];
      const f = sel.getAttribute('data-f');
      if (f === 'format') { m.formatKey = sel.value; const n = (FORMATS.find(x => x.key === m.formatKey) || FORMATS[0]).n; m.participants = m.participants.slice(0, n); if ((m.titleCode === 'tag') !== (m.formatKey === 'tag')) m.titleCode = ''; renderBuilder(); return; }
      if (f === 'type') { m.matchType = sel.value; return; }
      if (f === 'title') { m.titleCode = sel.value; return; }
      m.participants[+sel.getAttribute('data-slot')] = sel.value;
      // BATCH 15 ITEM 19: only belts held by someone in this match (or empty belts) can be on the line
      const ti = +sel.getAttribute('data-m');
      const tSel = ov.querySelector(`select[data-m="${ti}"][data-f="title"]`);
      const note = ov.querySelector(`[data-tnote="${ti}"]`);
      if (tSel) {
        const had = m.titleCode;
        if (had && !titleAllowed(m, had)) m.titleCode = '';
        tSel.innerHTML = `<option value="">No title</option>${titleOptions(m)}`;
        tSel.value = m.titleCode || '';
        if (note) note.textContent = (had && !m.titleCode) ? 'The champion isn\'t in this match any more, so the title came off.' : '';
      }
    });
    ov.querySelector('#csFill').onclick = () => { keepFields(); fillGaps(d); renderBuilder(); };
    ov.querySelector('#csCancel').onclick = () => { draft = null; closeOverlay(); };
    ov.querySelector('#csSave').onclick = () => {
      keepFields();
      const err = validate(d);
      const box = ov.querySelector('#csErr');
      if (err) { box.textContent = '⚠️ ' + err; return; }
      const list = loadShows();
      const idx = list.findIndex(x => x.id === d.id);
      if (idx >= 0) list[idx] = d; else list.push(d);
      if (!saveShows(list)) return;
      register();
      try { if (typeof saveHistoryLog === 'function') saveHistoryLog(`🎬 NEW SHOW: GM Ellis created ${d.name.toUpperCase()}!`, 'show'); } catch (e) {}
      const saved = d; draft = null;
      if (typeof window.openBookShowModal === 'function') window.openBookShowModal();
      openShowMenu(saved.id);
    };
  }

  // BATCH 15 ITEM 19: which belts can be on the line in this match
  function titleAllowed(m, code) {
    const h = (typeof getTitleHolders === 'function' ? getTitleHolders() : {}) || {};
    const n = (FORMATS.find(f => f.key === m.formatKey) || FORMATS[0]).n;
    const ps = (m.participants || []).slice(0, n).filter(Boolean);
    if (m.formatKey === 'handicap') return false;
    if (code === 'tag') {
      if (m.formatKey !== 'tag') return false;
      if (!h.tag1 && !h.tag2) return true;
      return ps.includes(h.tag1) || ps.includes(h.tag2);
    }
    if (m.formatKey === 'tag') return false;
    if (!h[code]) return true;
    return ps.includes(h[code]);
  }
  function titleOptions(m) {
    const h = (typeof getTitleHolders === 'function' ? getTitleHolders() : {}) || {};
    return TITLES.filter(t => titleAllowed(m, t.code)).map(t => {
      const empty = t.code === 'tag' ? (!h.tag1 && !h.tag2) : !h[t.code];
      return `<option value="${t.code}" ${m.titleCode === t.code ? 'selected' : ''}>🏆 ${t.name}${empty ? ' (EMPTY: UP FOR GRABS)' : ''}</option>`;
    }).join('');
  }

  function fillGaps(d) {
    const ws = roster().filter(w => !injured(w.id));
    const used = new Set(d.matches.flatMap(m => m.participants.filter(Boolean)));
    const shuffled = ws.filter(w => !used.has(w.id)).sort(() => Math.random() - 0.5);
    d.matches.forEach(m => {
      const n = (FORMATS.find(f => f.key === m.formatKey) || FORMATS[0]).n;
      for (let k = 0; k < n; k++) {
        if (!m.participants[k]) { const w = shuffled.shift(); if (w) { m.participants[k] = w.id; used.add(w.id); } }
      }
    });
  }

  function validate(d) {
    if (!d.name) return 'Give your show a name!';
    const ws = roster();
    if (ws.length < 2) return 'Sign at least 2 superstars first!';
    const seen = {};
    for (let i = 0; i < d.matches.length; i++) {
      const m = d.matches[i];
      const n = (FORMATS.find(f => f.key === m.formatKey) || FORMATS[0]).n;
      const ps = m.participants.slice(0, n);
      if (ps.filter(Boolean).length < n) return `${orderName(i, d.matches.length).replace('⭐ ', '')} needs ${n} superstars. Tap "FILL THE GAPS FOR ME" if you're stuck!`;
      if (new Set(ps).size !== ps.length) return `${orderName(i, d.matches.length).replace('⭐ ', '')} has the same superstar twice!`;
      for (const id of ps) {
        if (seen[id] !== undefined) return `${(wById(id) || {}).name || 'A superstar'} is booked in two matches. Each superstar can only wrestle once a night.`;
        seen[id] = i;
      }
    }
    if (d.intro && typeof extractVideoInfo === 'function') {
      try { const v = extractVideoInfo(d.intro); if (!v || !v.id) return "That intro link doesn't look like a YouTube video. Check it, or leave it empty."; } catch (e) {}
    }
    return '';
  }

  // Photos are big: shrink them so the tablet doesn't run out of room
  function shrinkImage(file, cb) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 480;
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        const x = c.getContext('2d');
        x.drawImage(img, 0, 0, c.width, c.height);
        const png = /png|gif|webp/i.test(file.type);
        let url = png ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.85);
        if (url.length > 450000) url = c.toDataURL('image/jpeg', 0.75);
        cb(url);
      };
      img.onerror = () => alert("Sorry, that picture couldn't be opened. Try another one.");
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- Run the show ---------- */
  function buildBouts(s) {
    const ws = roster();
    const fit = ws.filter(w => !injured(w.id));
    const onCard = new Set(s.matches.flatMap(m => m.participants));
    const subs = fit.filter(w => !onCard.has(w.id)).sort(() => Math.random() - 0.5);
    const swaps = [];
    const n = s.matches.length;
    const bouts = s.matches.map((m, i) => {
      const fmt = FORMATS.find(f => f.key === m.formatKey) || FORMATS[0];
      const ps = m.participants.slice(0, fmt.n).map(id => {
        const w = wById(id);
        if (w && !injured(w.id)) return w;
        const sub = subs.shift();
        if (sub) swaps.push(`${w ? w.name : 'A superstar'} is injured, so ${sub.name} takes their place.`);
        return sub || null;
      });
      const title = m.titleCode ? TITLES.find(t => t.code === m.titleCode) : null;
      let referee = null;
      if (m.matchType === 'Special Guest Referee' && subs.length) referee = subs.shift();
      return {
        order: i === n - 1 ? 'MAIN EVENT' : (i === 0 ? 'OPENER' : (i === n - 2 && n >= 3 ? 'CO-MAIN' : 'MIDCARD')),
        matchType: safeType(m.matchType), formatKey: m.formatKey, participants: ps,
        isTitleMatch: !!title, titleCode: title ? title.code : null, titleName: title ? title.name : null, titleImg: title ? title.img : null,
        isCareerMatch: false, feudStake: null, isSanctionedContract: true, referee, status: 'pending', rating: 0
      };
    }).filter(b => b.participants.filter(Boolean).length >= 2).map(b => Object.assign(b, { participants: b.participants.filter(Boolean) }));
    // a tag match needs 4
    bouts.forEach(b => { if (b.formatKey === 'tag' && b.participants.length < 4) b.formatKey = b.participants.length === 3 ? 'triple' : '1v1'; });
    bouts.forEach(b => { if (b.formatKey === 'handicap' && b.participants.length < 3) b.formatKey = '1v1'; if (b.formatKey === 'handicap') { b.isTitleMatch = false; b.titleCode = null; b.titleName = null; b.titleImg = null; } });
    return { bouts, swaps };
  }

  function runShow(id) {
    const s = loadShows().find(x => x.id === id);
    if (!s) return;
    if (typeof ensureRosterReady === 'function' && !ensureRosterReady(2)) return;
    register();
    const { bouts, swaps } = buildBouts(s);
    if (!bouts.length) { alert('Not enough fit superstars to run this show right now!'); return; }
    closeOverlay();
    if (typeof closeBookShowModal === 'function') closeBookShowModal();
    const st = showStats(s);
    const xp = s.type === 'weekly' ? 150 : (bouts.length >= 5 ? 600 : 350);
    window.activeShowSession = {
      showKey: showKey(s), showName: s.name.toUpperCase(), bouts, currentBoutIdx: 0, cumulativeStars: 0, completedBouts: 0,
      showFalloutLog: [], customXp: xp, isCustomShow: true, theme: s.colours
    };
    swaps.forEach(t => { try { window.activeShowSession.showFalloutLog.push({ type: 'injury', text: `🩹 ${t}` }); } catch (e) {} });
    hype(s, st, swaps, () => {
      setElDisplay('gmProfileWidget', 'none');
      setElDisplay('bgmToggleBtn', 'none');
      setElDisplay('gmHeaderHomeBtn', 'none');
      try { const a = typeof matchCardSlamSound !== 'undefined' ? matchCardSlamSound : new Audio('match_card_slam.mp3'); a.currentTime = 0; a.volume = 0.8; a.play().catch(() => {}); } catch (e) {}
      if (typeof renderBookShowCardModal === 'function') renderBookShowCardModal();
    });
  }

  // Bret and Corbin welcome everyone to Ellis's show
  function hype(s, st, swaps, done) {
    ensureStyles();
    const c = s.colours || COLOURS[0];
    const main = s.matches[s.matches.length - 1];
    const names = (main ? main.participants : []).map(id => (wById(id) || {}).name).filter(Boolean);
    const ov = document.createElement('div');
    ov.className = 'ewf-cs-hype';
    ov.style.backgroundImage = `radial-gradient(ellipse at center, ${c.primary}55, rgba(0,0,0,0.95) 70%), url('commentary_desk_bg.png'), url('show_bg.png')`;
    const vs = main && main.formatKey === 'tag' && names.length === 4 ? `${names[0]} & ${names[1]} vs ${names[2]} & ${names[3]}` : (main && main.formatKey === 'handicap' && names.length === 3 ? `${names[0]} vs ${names[1]} & ${names[2]}` : names.join(' vs '));
    ov.innerHTML = `
      <div class="desk"><img src="brethart.png" onerror="this.style.display='none'"><img src="corbin.png" onerror="this.style.display='none'"></div>
      ${st.soldOut ? '<div class="soldout">🎟️ SOLD OUT TONIGHT! 🎟️</div>' : ''}
      ${s.logo ? `<img class="lg" src="${s.logo}">` : ''}
      <h1 style="color:#fff; text-shadow: 0 0 14px ${c.primary}, 0 0 34px ${c.primary};">WELCOME TO ${esc(s.name.toUpperCase())}!</h1>
      <div class="line"><b style="color:#ffd700;">BRET:</b> "What a night we've got for you, Corbin! GM Ellis booked every match himself${vs ? `, and in the main event it's <b>${esc(vs)}</b>` : ''}!"<br>
      <b style="color:#ffd700;">CORBIN:</b> "${st.soldOut ? "And look at this crowd, Bret. It's a SELL OUT!" : st.runs ? `This is show number ${st.runs + 1}. Can tonight beat the last one?` : "The first ever show. History starts tonight!"}"
      ${swaps.length ? `<br><span style="color:#ff8a80;">🩹 ${swaps.map(esc).join(' ')}</span>` : ''}</div>
      <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
        <button class="ewf-cs-btn gold" id="csGo" style="font-size:1.15rem; padding:14px 26px;">🎬 SHOW TIME! ➔</button>
        <button class="ewf-cs-btn blue" id="csHypePoster">🖼️ POSTER</button>
      </div>`;
    host().appendChild(ov);
    try { if (typeof playPyroBlast === 'function') playPyroBlast(); } catch (e) {}
    try { const a = new Audio('crowd.mp3'); a.volume = st.soldOut ? 0.9 : 0.55; a.play().catch(() => {}); setTimeout(() => { let v = a.volume; const iv = setInterval(() => { v -= 0.05; if (v <= 0) { clearInterval(iv); a.pause(); } else a.volume = v; }, 150); }, 4000); } catch (e) {}
    ov.querySelector('#csGo').onclick = () => { ov.remove(); done(); };
    ov.querySelector('#csHypePoster').onclick = () => makePoster(s);
  }

  /* ---------- Event poster ---------- */
  function loadImg(src) {
    return new Promise(res => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  }
  function poseOf(w) { return (typeof getWrestlerPosePath === 'function' ? getWrestlerPosePath(w) : null) || w.image; }
  async function makePoster(s) {
    const W = 1080, H = 1350;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    const c = s.colours || COLOURS[0];
    try { if (document.fonts && document.fonts.load) await Promise.all([document.fonts.load('60px "Russo One"'), document.fonts.load('700 30px "DM Sans"')]); } catch (e) {}
    const font = (px, bold) => `${bold ? '' : ''}${px}px "Russo One", "Arial Black", sans-serif`;
    // background
    // BATCH 15 ITEM 20: a random arena picture behind the superstars, with the show's colour over it
    const ARENAS = ['show_bg.png', 'background.png', 'background2.png', 'badblood_highlights_bg.png', 'judgmentday_highlights_bg.png']; // no other show's branding
    const bg = (await loadImg(ARENAS[Math.floor(Math.random() * ARENAS.length)])) || (await loadImg('show_bg.png'));
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    if (bg) { const r = Math.max(W / bg.width, H / bg.height); x.globalAlpha = 0.7; x.drawImage(bg, (W - bg.width * r) / 2, (H - bg.height * r) / 2, bg.width * r, bg.height * r); x.globalAlpha = 1; }
    x.globalAlpha = 0.45; x.fillStyle = c.primary; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
    let g = x.createRadialGradient(W / 2, H * 0.45, 50, W / 2, H * 0.45, H * 0.8);
    g.addColorStop(0, c.primary + '99'); g.addColorStop(1, '#000000ee');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // logo or name
    const logo = await loadImg(s.logo);
    let y = 40;
    if (logo) { const r = Math.min(620 / logo.width, 260 / logo.height); const lw = logo.width * r, lh = logo.height * r; x.drawImage(logo, (W - lw) / 2, y, lw, lh); y += lh + 20; }
    else { x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = font(92); x.shadowColor = c.primary; x.shadowBlur = 30; x.fillText(s.name.toUpperCase(), W / 2, y + 100); x.shadowBlur = 0; y += 140; }
    // main event poses
    const main = s.matches[s.matches.length - 1];
    const mains = (main ? main.participants : []).map(wById).filter(Boolean);
    const poses = await Promise.all(mains.slice(0, 4).map(async w => (await loadImg(poseOf(w))) || (await loadImg(w.image))));
    const pTop = y, pH = 640;
    const slotW = W / Math.max(2, poses.length);
    poses.forEach((im, i) => {
      if (!im) return;
      const r = Math.min(pH / im.height, (slotW * 1.25) / im.width);
      const iw = im.width * r, ih = im.height * r;
      const cx = slotW * i + slotW / 2;
      x.save(); x.shadowColor = '#000'; x.shadowBlur = 30;
      x.drawImage(im, cx - iw / 2, pTop + pH - ih, iw, ih); x.restore();
    });
    // VS banner
    y = pTop + pH - 30;
    x.fillStyle = c.primary; x.fillRect(0, y, W, 120);
    x.fillStyle = '#000'; x.globalAlpha = 0.35; x.fillRect(0, y + 100, W, 20); x.globalAlpha = 1;
    x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = font(28); x.fillText('⭐ MAIN EVENT ⭐', W / 2, y + 36);
    const vs = main && main.formatKey === 'tag' && mains.length === 4 ? `${mains[0].name} & ${mains[1].name}  VS  ${mains[2].name} & ${mains[3].name}` : (main && main.formatKey === 'handicap' && mains.length === 3 ? `${mains[0].name}  VS  ${mains[1].name} & ${mains[2].name}` : mains.map(w => w.name).join('  VS  '));
    let size = 56; x.font = font(size); while (x.measureText(vs.toUpperCase()).width > W - 60 && size > 26) { size -= 2; x.font = font(size); }
    x.fillText(vs.toUpperCase(), W / 2, y + 92);
    // undercard
    y += 160;
    x.font = font(26); x.fillStyle = '#ffd700'; x.fillText('ALSO TONIGHT', W / 2, y); y += 40;
    x.font = font(30); x.fillStyle = '#fff';
    s.matches.slice(0, -1).forEach(m => {
      const ns = m.participants.map(wById).filter(Boolean).map(w => w.name.toUpperCase());
      const t = m.formatKey === 'tag' && ns.length === 4 ? `${ns[0]} & ${ns[1]} VS ${ns[2]} & ${ns[3]}` : (m.formatKey === 'handicap' && ns.length === 3 ? `${ns[0]} VS ${ns[1]} & ${ns[2]}` : ns.join(' VS '));
      let fs = 30; x.font = font(fs); while (x.measureText(t).width > W - 80 && fs > 18) { fs -= 2; x.font = font(fs); }
      x.fillText(t, W / 2, y); y += 44;
    });
    // footer
    x.fillStyle = c.primary; x.fillRect(0, H - 90, W, 90);
    x.fillStyle = '#fff'; x.font = font(40); x.fillText(s.type === 'weekly' ? 'LIVE THIS WEEK' : 'LIVE ON PAY-PER-VIEW', W / 2, H - 50);
    x.font = font(20); x.fillText('ELLIS WRESTLING FEDERATION', W / 2, H - 18);
    // BATCH 15 ITEM 20: EWF and WWE logos either side of the footer
    const [ewfLogo, wweLogo] = await Promise.all([loadImg('logo.png'), loadImg('wwe_logo.png')]);
    const putLogo = (im, cx) => { if (!im) return; const r = Math.min(150 / im.width, 70 / im.height); const lw = im.width * r, lh = im.height * r; x.drawImage(im, cx - lw / 2, H - 45 - lh / 2, lw, lh); };
    putLogo(ewfLogo, 95); putLogo(wweLogo, W - 95);
    let url;
    try { url = cv.toDataURL('image/png'); } catch (e) { alert("Sorry, the poster couldn't be made on this device."); return; }
    showPoster(s, url);
  }
  function showPoster(s, url) {
    ensureStyles();
    const ov = document.createElement('div');
    ov.className = 'ewf-cs-ov'; ov.style.zIndex = '2147483450';
    ov.innerHTML = `<div class="ewf-cs-box" style="text-align:center;">
      <h2>🖼️ ${esc(s.name.toUpperCase())} POSTER</h2>
      <img src="${url}" style="max-width:100%; max-height:70vh; border:2px solid #fff; box-shadow:0 0 30px rgba(0,0,0,0.8);">
      <div class="ewf-cs-row" style="justify-content:center; margin-top:12px;">
        <a class="ewf-cs-btn gold" href="${url}" download="${esc(s.name.replace(/[^a-z0-9]+/gi, '_'))}_poster.png" style="text-decoration:none;">💾 SAVE POSTER</a>
        <button class="ewf-cs-btn blue" id="csPrint">🖨️ PRINT</button>
        <button class="ewf-cs-btn" id="csPClose">✕ CLOSE</button>
      </div></div>`;
    host().appendChild(ov);
    ov.querySelector('#csPClose').onclick = () => ov.remove();
    ov.querySelector('#csPrint').onclick = () => {
      const w = window.open('', '_blank');
      if (!w) { alert('Tap SAVE POSTER instead, then print it from your photos.'); return; }
      w.document.write(`<html><head><title>${esc(s.name)} poster</title><style>body{margin:0}img{width:100%}</style></head><body><img src="${url}" onload="setTimeout(function(){window.print()},300)"></body></html>`);
      w.document.close();
    };
  }

  /* ---------- Show locking for the level-up screen and anything that asks ---------- */
  const origLocked = window.isShowLocked;
  if (typeof origLocked === 'function') {
    window.isShowLocked = function (key) {
      if (key === 'custom' || (typeof key === 'string' && key.indexOf('cs_') === 0)) return level() < UNLOCK_LEVEL ? { locked: true, req: UNLOCK_LEVEL, name: 'Create Your Own Show' } : { locked: false };
      return origLocked(key);
    };
    try { isShowLocked = window.isShowLocked; } catch (e) {}
  }

  /* ---------- Recap screen: one generic background, tinted with the show's colours, plus its logo ---------- */
  const origHighlights = window.openEventHighlightsModal;
  if (typeof origHighlights === 'function') {
    window.openEventHighlightsModal = function (...a) {
      const r = origHighlights.apply(this, a);
      try {
        const sess = window.activeShowSession;
        const key = sess && sess.showKey;
        const stage = document.getElementById('ehHeroStage');
        const old = document.getElementById('ewfCsHeroLogo'); if (old) old.remove();
        if (stage && typeof key === 'string' && key.indexOf('cs_') === 0) {
          const sh = byKey(key);
          const c = (sh && sh.colours) || COLOURS[0];
          stage.style.backgroundImage = `linear-gradient(90deg, ${c.secondary}cc, ${c.primary}55 55%, ${c.secondary}cc), linear-gradient(rgba(10,12,20,0.15), rgba(10,12,20,0.6)), url('custom_highlights_bg.png'), url('show_bg.png')`;
          stage.style.backgroundSize = 'cover';
          stage.style.backgroundPosition = 'center center';
          stage.style.borderColor = c.primary;
          if (sh && sh.logo) {
            if (getComputedStyle(stage).position === 'static') stage.style.position = 'relative';
            const lg = document.createElement('img');
            lg.id = 'ewfCsHeroLogo'; lg.src = sh.logo; lg.alt = sh.name;
            lg.style.cssText = 'position:absolute; top:10px; right:14px; max-height:30%; max-width:24%; object-fit:contain; z-index:5; filter:drop-shadow(0 0 12px rgba(0,0,0,0.9)); pointer-events:none;';
            stage.appendChild(lg);
          }
        }
      } catch (e) { console.warn(e); }
      return r;
    };
    try { openEventHighlightsModal = window.openEventHighlightsModal; } catch (e) {}
  }

  window.EWFCS = { loadShows, saveShows, openBuilder, openShowMenu, runShow, makePoster, showStats, _fillGaps: fillGaps, _validate: validate };
  register();
})();
