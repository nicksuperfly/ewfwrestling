/* ==========================================================================
   ELLIS'S MAIN EVENT (EWF UNIVERSE) - MODULE 7: js/7-personality.js
   BATCH 10: "CHARACTERS COME ALIVE"
   - Good Guys / Bad Guys (earned through deeds, GM can force a turn)
   - Relationships: MATES / BAD BLOOD / JEALOUS OF / RESPECT
   - Moods + callouts (max one callout every 5 matches)
   - Backstage segments between bouts in Book a Show
   - More lights-out surprises: random run-ins, evening the odds, fake-outs,
     post-match beatdowns, THE SAVE, celebration interruptions, return from exile
   - SUPERSTARS tab in the EWF Universe
   ========================================================================== */

(function () {
  const KEY = 'ewf_personality';

  /* ---------- State ---------- */
  function load() {
    let st;
    try { st = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { st = {}; }
    st.align = st.align || {};       // id -> 'bad' (good is the default)
    st.deeds = st.deeds || {};       // id -> { b, g }
    st.rel = st.rel || {};           // 'idA|idB' -> { t, by, why, mate, at }
    st.furious = st.furious || {};   // id -> { vs, why, until }
    st.lastMatch = st.lastMatch || {}; // id -> matchNo they last wrestled
    st.injuredBy = st.injuredBy || {}; // victimId -> attackerId
    st.pendingReturn = st.pendingReturn || []; // [{ id, vs }]
    st.pendingTurns = st.pendingTurns || [];   // [{ id, to, why }]
    st.lossFlag = st.lossFlag || {};
    st.matchNo = st.matchNo || 0;
    if (st.lastCallout === undefined) st.lastCallout = 0;
    if (st.lastAngle === undefined) st.lastAngle = 0;
    if (st.lastNudge === undefined) st.lastNudge = 0;
    if (st.lastExile === undefined) st.lastExile = 0;
    return st;
  }
  function save(st) { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  const roster = () => (typeof getUnlockedWrestlers === 'function' ? getUnlockedWrestlers() : []).filter(Boolean);
  const byId = (id) => roster().find(w => w.id === id) || (typeof getWrestlerById === 'function' ? getWrestlerById(id) : null);
  const injured = (id) => typeof getInjuryRecord === 'function' && !!getInjuryRecord(id);
  const fit = () => roster().filter(w => !injured(w.id));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const NM = (w) => (w && w.name ? w.name.toUpperCase() : 'A SUPERSTAR');
  const log = (txt, type) => { try { if (typeof saveHistoryLog === 'function') saveHistoryLog(txt, type || 'match'); } catch (e) {} };
  const fallout = (type, txt) => { try { if (typeof logShowFalloutEvent === 'function') logShowFalloutEvent(type, txt); } catch (e) {} };
  const bret = (key, html, delay) => { try { if (typeof window.ewfBretCut === 'function') window.ewfBretCut(key, html, delay); } catch (e) {} };
  const pose = (w) => (typeof getWrestlerPosePath === 'function' ? getWrestlerPosePath(w) : (w && w.image)) || 'logo_notext.png';

  /* ---------- Alignment ---------- */
  function isBad(id, st) { st = st || load(); return st.align[id] === 'bad'; }
  function badCount(st) { return roster().filter(w => st.align[w.id] === 'bad').length; }
  function maxBad() { return Math.max(1, Math.floor(roster().length / 3)); }

  // pts > 0 = good deed, pts < 0 = bad deed
  function deed(id, pts, why, st) {
    if (!id || !pts) return;
    const own = !st; st = st || load();
    const d = st.deeds[id] || (st.deeds[id] = { b: 0, g: 0 });
    if (pts < 0) d.b += -pts; else d.g += pts;
    const bad = st.align[id] === 'bad';
    const queued = st.pendingTurns.some(t => t.id === id);
    if (!queued) {
      if (!bad && d.b - d.g >= 4 && badCount(st) < maxBad()) {
        st.pendingTurns.push({ id, to: 'bad', why: why || 'One dirty trick too many' });
      } else if (bad && d.g - d.b >= 3) {
        st.pendingTurns.push({ id, to: 'good', why: why || 'Won the fans back' });
      }
    }
    if (own) save(st);
  }

  function setAlign(id, to, st) {
    st.align[id] = to === 'bad' ? 'bad' : undefined;
    if (to !== 'bad') delete st.align[id];
    st.deeds[id] = { b: 0, g: 0 };
    st.pendingTurns = st.pendingTurns.filter(t => t.id !== id);
  }

  /* ---------- Relationships ---------- */
  const rk = (a, b) => [a, b].sort().join('|');
  function getRel(a, b, st) { st = st || load(); return st.rel[rk(a, b)] || null; }
  function setRel(a, b, t, why, by, st) {
    if (!a || !b || a === b) return;
    const own = !st; st = st || load();
    const k = rk(a, b);
    const old = st.rel[k] || {};
    if (!t) { delete st.rel[k]; }
    else st.rel[k] = { t, by: t === 'jealous' ? (by || a) : undefined, why: why || '', mate: old.mate || 0, at: st.matchNo };
    if (own) save(st);
  }
  function relsOf(id, st) {
    st = st || load();
    return Object.keys(st.rel).filter(k => k.split('|').includes(id)).map(k => {
      const r = st.rel[k]; const other = k.split('|').find(x => x !== id);
      return Object.assign({ other }, r);
    });
  }
  const mateOf = (id, st, exclude) => {
    const ex = exclude || [];
    const m = relsOf(id, st).filter(r => r.t === 'mates' && !ex.includes(r.other) && !injured(r.other) && byId(r.other));
    return m.length ? byId(pick(m).other) : null;
  };
  const badBloodOf = (id, st, exclude) => {
    const ex = exclude || [];
    const m = relsOf(id, st).filter(r => r.t === 'badblood' && !ex.includes(r.other) && !injured(r.other) && byId(r.other));
    return m.length ? byId(pick(m).other) : null;
  };

  function makeFurious(id, vsId, why, st) {
    if (!id) return;
    st.furious[id] = { vs: vsId || null, why: why || 'Wants revenge', until: st.matchNo + 6 };
  }

  /* ---------- Moods ---------- */
  const MOODS = {
    cocky: { e: '👑', label: 'COCKY', col: '#ffd700' },
    hungry: { e: '💪', label: 'HUNGRY', col: '#00e676' },
    fedup: { e: '🥱', label: 'FED UP', col: '#9e9e9e' },
    jealous: { e: '😒', label: 'JEALOUS', col: '#b388ff' },
    furious: { e: '😡', label: 'FURIOUS', col: '#ff1744' }
  };
  function heldTitles(id) {
    const h = typeof getTitleHolders === 'function' ? (getTitleHolders() || {}) : {};
    const out = [];
    if (h.whc === id) out.push('whc'); if (h.ic === id) out.push('ic'); if (h.hardcore === id) out.push('hardcore');
    if (h.tag1 === id || h.tag2 === id) out.push('tag');
    return out;
  }
  const TITLE_NAMES = { whc: 'World Heavyweight Championship', ic: 'Intercontinental Championship', hardcore: 'Hardcore Championship', tag: 'Tag Team Championship' };
  const TITLE_IMGS = { whc: 'whc.png', ic: 'ic_title.png', hardcore: 'hardcore.png', tag: 'tag_title.png' };

  function momentum(id) { try { return getWrestlerMomentum(id) || { status: 'neutral' }; } catch (e) { return { status: 'neutral' }; } }

  function moodOf(id, st) {
    st = st || load();
    if (injured(id)) return null;
    const f = st.furious[id];
    if (f && f.until > st.matchNo) {
      const vs = f.vs ? byId(f.vs) : null;
      return { k: 'furious', why: f.why + (vs ? '' : '') };
    }
    const jr = relsOf(id, st).find(r => r.t === 'jealous' && r.by === id && byId(r.other));
    if (jr) return { k: 'jealous', why: `Jealous of ${byId(jr.other).name}${jr.why ? ' (' + jr.why + ')' : ''}` };
    const titles = heldTitles(id);
    const mom = momentum(id);
    if (titles.length) {
      const defs = typeof getTitleDefenseCount === 'function' ? Math.max(...titles.map(t => getTitleDefenseCount(t) || 0)) : 0;
      if (defs >= 2 || mom.status === 'fire') return { k: 'cocky', why: `Champion and loving it${defs ? ' (' + defs + ' defences)' : ''}` };
    }
    if (mom.status === 'fire') {
      return titles.length ? { k: 'cocky', why: 'On a hot streak with gold' } : { k: 'hungry', why: `On a ${mom.streak >= 3 ? mom.streak + '-match winning streak' : 'hot run'} and wants a title shot` };
    }
    const last = st.lastMatch[id];
    if (last !== undefined && st.matchNo - last >= 8) return { k: 'fedup', why: `Hasn't had a match in ${st.matchNo - last} matches` };
    return null;
  }

  /* ---------- Storyline deeds (approved classification, Batch 10) ---------- */
  // a/b: points for Superstar A / B (negative = bad deed, positive = good deed); rel: relationship it creates
  const STORY = {};
  [1, 26, 28, 29, 2, 5, 19, 44, 47, 52, 53, 55, 57, 62, 66, 67, 68, 79].forEach(id => STORY[id] = { a: -2 });
  [27, 30, 3, 4, 7, 31, 32, 33, 34, 35, 20, 21, 23, 42, 43, 48, 49, 54, 56, 65, 78].forEach(id => STORY[id] = { a: -1 });
  STORY[11] = { b: 2 }; STORY[15] = { a: 2 }; STORY[40] = { b: 1 }; STORY[12] = { a: 1, b: 1, rel: 'respect' };
  STORY[36] = { a: -1, b: -1 }; STORY[37] = { a: -1, b: -1 };
  STORY[75] = { b: -1 }; STORY[76] = { b: -1 };
  STORY[45] = { rel: 'respect' }; STORY[68].rel = 'jealous';

  function storyRel(story) {
    const d = STORY[story.id] || {};
    if (d.rel) return d.rel;
    if (['feud', 'injury_feud', 'betrayal', 'flavor', 'heist_demand'].includes(story.type)) return 'badblood';
    if (story.type === 'alliance' || story.type === 'alliance_only') return 'mates';
    return null;
  }

  // Bad guys lean into the villain roles (Batch 10 item 3). Never changes the story itself.
  function castStory(story, A, B, forced, pool) {
    try {
      if (!story || !A || !B) return [A, B];
      const st = load();
      const d = STORY[story.id] || {};
      const swap = () => { const t = A; A = B; B = t; };
      if (story.type === 'betrayal') {
        if (!isBad(A.id, st) && isBad(B.id, st)) swap();
        return [A, B];
      }
      if (['heist_demand', 'title_vacate'].includes(story.type)) return [A, B];
      const aBadDeed = (d.a || 0) < 0 && !(d.b < 0);
      const aGood = (d.a || 0) > 0 && !(d.b > 0);
      const bGood = (d.b || 0) > 0 && !(d.a > 0);
      if (aBadDeed && !isBad(A.id, st) && isBad(B.id, st)) swap();
      else if (aGood && isBad(A.id, st) && !isBad(B.id, st)) swap();
      else if (bGood && isBad(B.id, st) && !isBad(A.id, st)) swap();
      if (!forced && Array.isArray(pool) && Math.random() < 0.7) {
        if (aBadDeed && !isBad(A.id, st)) {
          const bads = pool.filter(w => w && isBad(w.id, st) && w.id !== B.id);
          if (bads.length) A = pick(bads);
        } else if ((d.a || 0) < 0 && (d.b || 0) < 0) {
          const bads = pool.filter(w => w && isBad(w.id, st));
          if (bads.length >= 2 && !isBad(A.id, st)) { const c = bads.filter(w => w.id !== B.id); if (c.length) A = pick(c); }
        }
      }
      return [A, B];
    } catch (e) { return [A, B]; }
  }

  function applyStory(story, A, B) {
    try {
      if (!story || !A || !B) return;
      const st = load();
      const d = STORY[story.id] || {};
      const what = short(story, A, B);
      if (d.a) deed(A.id, d.a, d.a < 0 ? `The last straw: ${what}` : `Won the fans over: ${what}`, st);
      if (d.b) deed(B.id, d.b, d.b < 0 ? `The last straw: ${what}` : `Won the fans over: ${what}`, st);
      const rel = storyRel(story);
      if (rel === 'jealous') setRel(A.id, B.id, 'jealous', 'accused them of hogging the glory', A.id, st);
      else if (rel === 'mates') setRel(A.id, B.id, 'mates', 'teamed up in a storyline', null, st);
      else if (rel === 'respect') setRel(A.id, B.id, 'respect', 'earned each other\'s respect', null, st);
      else if (rel === 'badblood') {
        const r = getRel(A.id, B.id, st);
        if (!r || r.t !== 'jealous') setRel(A.id, B.id, 'badblood', short(story, A, B), null, st);
      }
      if ((d.a || 0) < 0) makeFurious(B.id, A.id, `Wants revenge on ${A.name}`, st);
      if (story.type === 'injury_feud') st.injuredBy[B.id] = A.id;
      save(st);
    } catch (e) {}
  }
  function short(story, A, B) {
    const t = (story.logText || '').replace(/{Superstar A}/g, A.name).replace(/{Superstar B}/g, B.name).replace(/^[^A-Za-z0-9]+/, '');
    return t.length > 70 ? t.slice(0, 67) + '...' : t;
  }

  /* ---------- Match results ---------- */
  let preHolders = null;
  function wrapDeclare() {
    const orig = window.declareMatchWinner;
    if (typeof orig !== 'function') return;
    window.declareMatchWinner = function (...a) {
      try { preHolders = JSON.parse(JSON.stringify(getTitleHolders() || {})); } catch (e) { preHolders = null; }
      return orig.apply(this, a);
    };
  }

  function onMatchResult(s, match) {
    try {
      if (!s || !s.winner) return;
      const st = load();
      st.matchNo++;
      const parts = (match && Array.isArray(match.participants) ? match.participants : []).filter(Boolean);
      const loserIds = (s.losers || []).map(l => l && l.id).filter(Boolean);
      const winners = parts.filter(p => !loserIds.includes(p.id));
      if (!winners.some(w => w.id === s.winner.id)) winners.unshift(s.winner);
      [...parts, s.winner].forEach(p => { if (p) st.lastMatch[p.id] = st.matchNo; });

      // first sighting of any superstar: start their "last match" clock now
      roster().forEach(w => { if (st.lastMatch[w.id] === undefined) st.lastMatch[w.id] = st.matchNo; });

      // revenge cools a FURIOUS superstar down
      winners.forEach(w => { const f = st.furious[w.id]; if (f && (!f.vs || loserIds.includes(f.vs))) delete st.furious[w.id]; });

      // tag partners who win together become MATES
      if (winners.length === 2 && match && match.formatKey === 'tag') {
        const k = rk(winners[0].id, winners[1].id);
        const r = st.rel[k] || { t: null, mate: 0 };
        r.mate = (r.mate || 0) + 1;
        st.rel[k] = r;
        if (r.mate >= 2 && r.t !== 'badblood' && r.t !== 'mates') {
          st.rel[k] = { t: 'mates', why: `won ${r.mate} tag matches together`, mate: r.mate, at: st.matchNo };
        } else if (!r.t) delete r.t;
      }

      // 5-star classic earns RESPECT
      if ((s.rating || 0) >= 5 && winners[0] && loserIds[0]) {
        const r = getRel(winners[0].id, loserIds[0], st);
        if (!r || !r.t) setRel(winners[0].id, loserIds[0], 'respect', 'tore the house down in a 5-star classic', null, st);
      }

      // title changes
      if (s.titleWon && preHolders && match && match.titleCode) {
        const code = match.titleCode;
        const oldIds = code === 'tag' ? [preHolders.tag1, preHolders.tag2] : [preHolders[code]];
        oldIds.filter(Boolean).forEach(oid => {
          if (loserIds.includes(oid)) {
            setRel(oid, s.winner.id, 'badblood', `took their ${TITLE_NAMES[code] || 'title'}`, null, st);
            makeFurious(oid, s.winner.id, `Lost the ${TITLE_NAMES[code] || 'title'} to ${s.winner.name}`, st);
            deed(oid, -1, 'Bitter about losing the title', st);
          }
        });
        // a mate with no gold gets JEALOUS of the new champion
        winners.forEach(w => {
          relsOf(w.id, st).filter(r => r.t === 'mates').forEach(r => {
            if (!winners.some(x => x.id === r.other) && !heldTitles(r.other).length && Math.random() < 0.5) {
              setRel(r.other, w.id, 'jealous', `${w.name} won the gold, they didn't`, r.other, st);
            }
          });
        });
      }

      // losing runs make superstars bitter
      loserIds.forEach(id => {
        let n = 0; try { n = getSuperstarConsecutiveLosses(id); } catch (e) {}
        if ((n === 4 || n === 7) && st.lossFlag[id] !== n) { st.lossFlag[id] = n; deed(id, -1, `Lost ${n} in a row and snapped`, st); }
      });
      winners.forEach(w => { delete st.lossFlag[w.id]; });

      // injuries from this match
      if (s.injuryInflicted && s.injuryInflicted.victim) st.injuredBy[s.injuryInflicted.victim.id] = s.winner.id;

      // returns from injury -> "I want the guy who put me out" callout
      Object.keys(st.injuredBy).forEach(vid => {
        if (!injured(vid) && byId(vid)) {
          if (!st.pendingReturn.some(p => p.id === vid)) st.pendingReturn.push({ id: vid, vs: st.injuredBy[vid] });
          delete st.injuredBy[vid];
        }
      });

      // tidy expired FURIOUS moods
      Object.keys(st.furious).forEach(id => { if (st.furious[id].until <= st.matchNo) delete st.furious[id]; });
      save(st);
    } catch (e) { console.warn('EWFP onMatchResult', e); }
  }

  /* ---------- Sounds ---------- */
  const sfxCache = {};
  function sfx(name, vol) {
    try {
      const a = sfxCache[name] || (sfxCache[name] = new Audio(name));
      a.pause(); a.currentTime = 0; a.volume = vol === undefined ? 0.85 : vol;
      a.play().catch(() => {});
      return a;
    } catch (e) { return null; }
  }

  /* ---------- Cutscene builder ---------- */
  function ensureStyles() {
    if (document.getElementById('ewfpStyles')) return;
    const css = document.createElement('style');
    css.id = 'ewfpStyles';
    css.textContent = `
      .ewfp-scene { position: fixed; inset: 0; z-index: 2147483000; background: #000 center/cover no-repeat; display: flex; flex-direction: column;
        font-family: 'Russo One', sans-serif; color: #fff; overflow: hidden; animation: ewfpFade .35s ease-out; }
      .ewfp-scene::before { content: ''; position: absolute; inset: 0; background: linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.85)); pointer-events: none; }
      .ewfp-title { position: relative; z-index: 3; margin: 18px auto 0 auto; padding: 10px 22px; max-width: 92%; text-align: center; display: flex; align-items: center; gap: 12px;
        font-size: clamp(1.1rem, 3vw, 2rem); letter-spacing: 2px; text-transform: uppercase; border: 2px solid #fff; box-shadow: 0 0 30px rgba(0,0,0,0.8); }
      .ewfp-title img { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; border: 2px solid #ffd700; }
      .ewfp-stage { position: relative; flex: 1; z-index: 2; }
      .ewfp-pose { position: absolute; bottom: 0; height: 78%; max-width: 42%; object-fit: contain; filter: drop-shadow(0 0 18px rgba(0,0,0,0.9)); }
      .ewfp-pose.left { left: 4%; animation: ewfpInLeft .6s ease-out both; }
      .ewfp-pose.right { right: 4%; animation: ewfpInRight .6s ease-out both; }
      .ewfp-pose.center { left: 50%; transform: translateX(-50%); animation: ewfpRise .7s ease-out both; }
      .ewfp-pose.square { height: auto; width: min(30vw, 260px); bottom: 12%; border: 3px solid #fff; }
      .ewfp-pose.hurt { filter: grayscale(0.6) brightness(0.65) drop-shadow(0 0 12px #000); transform: rotate(-8deg); transform-origin: bottom center; }
      .ewfp-pose.right.hurt { transform: rotate(8deg); }
      .ewfp-obj { position: absolute; z-index: 4; pointer-events: none; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.85)); }
      .ewfp-obj.drop { animation: ewfpDrop .7s cubic-bezier(.3,1.4,.6,1) both; }
      .ewfp-obj.slideL { animation: ewfpInLeft .7s ease-out both; }
      .ewfp-obj.slideR { animation: ewfpInRight .7s ease-out both; }
      .ewfp-obj.spin { animation: ewfpSpin .8s ease-out both; }
      .ewfp-obj.pop { animation: ewfpPop .5s ease-out both; }
      .ewfp-panel { position: relative; z-index: 5; margin: 0 auto 22px auto; width: min(880px, 94%); background: rgba(8,8,14,0.9); border: 2px solid #ffd700;
        box-shadow: 0 0 30px rgba(0,0,0,0.9); padding: 14px 18px; text-align: center; }
      .ewfp-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: clamp(1rem, 2.2vw, 1.25rem); line-height: 1.4; }
      .ewfp-text b { color: #ffd700; }
      .ewfp-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 12px; }
      .ewfp-btn { font-family: 'Russo One', sans-serif; font-size: 1rem; padding: 12px 20px; border: 2px solid #fff; cursor: pointer; color: #fff; background: linear-gradient(180deg, #333, #111); text-transform: uppercase; }
      .ewfp-btn.gold { background: linear-gradient(180deg, #d4af37, #b8860b); color: #000; }
      .ewfp-btn.red { background: linear-gradient(180deg, #d32f2f, #7f0000); }
      .ewfp-btn.green { background: linear-gradient(180deg, #00a152, #004d26); }
      .ewfp-btn.blue { background: linear-gradient(180deg, #1565c0, #0d2a5c); }
      .ewfp-skip { position: absolute; top: 14px; right: 14px; z-index: 6; background: rgba(0,0,0,0.65); color: #fff; border: 1px solid #fff; padding: 8px 14px; font-family: 'Russo One', sans-serif; cursor: pointer; }
      .ewfp-shake { animation: ewfpShake .45s; }
      .ewfp-flash { position: absolute; inset: 0; background: #fff; z-index: 8; animation: ewfpFlash .5s ease-out forwards; pointer-events: none; }
      .ewfp-cctv { position: absolute; inset: 0; z-index: 7; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 4px); animation: ewfpStatic .15s steps(2) infinite; }
      .ewfp-rec { position: absolute; top: 18px; left: 18px; z-index: 7; color: #ff1744; font-family: 'Share Tech Mono', monospace; font-size: 1.2rem; animation: ewfpBlink 1s steps(2) infinite; }
      @keyframes ewfpFade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes ewfpInLeft { from { transform: translateX(-120%); opacity: 0; } to { opacity: 1; } }
      @keyframes ewfpInRight { from { transform: translateX(120%); opacity: 0; } to { opacity: 1; } }
      @keyframes ewfpRise { from { transform: translate(-50%, 30%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
      @keyframes ewfpDrop { from { transform: translateY(-140%) rotate(-25deg); opacity: 0; } to { opacity: 1; } }
      @keyframes ewfpSpin { from { transform: translate(-60vw, -40vh) rotate(-540deg); } to { transform: none; } }
      @keyframes ewfpPop { from { transform: scale(0.2); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      @keyframes ewfpShake { 0%,100% { transform: none; } 20% { transform: translate(-12px, 6px); } 40% { transform: translate(10px, -8px); } 60% { transform: translate(-8px, 4px); } 80% { transform: translate(6px, -3px); } }
      @keyframes ewfpFlash { from { opacity: 0.95; } to { opacity: 0; } }
      @keyframes ewfpStatic { 0% { opacity: 0.6; } 100% { opacity: 0.9; } }
      @keyframes ewfpBlink { 0% { opacity: 1; } 100% { opacity: 0; } }
      .mood-badge { position: absolute !important; top: 104px !important; right: 6px !important; width: 26px !important; height: 26px !important;
        display: flex !important; align-items: center !important; justify-content: center !important; border-radius: 4px !important; font-size: 0.92rem !important;
        z-index: 17 !important; pointer-events: none; line-height: 1 !important; background: rgba(10,10,14,0.88) !important; border: 2px solid #fff; }
      .card .bad-guy-mark { margin-left: 4px; }
      #universeTabSuperstars { background: linear-gradient(rgba(5,5,10,0.78), rgba(5,5,10,0.9)), url('relationships_bg.png') center/cover; padding: 10px; border: 1px solid #333; }
      .ewfp-hot { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
      .ewfp-hot div { flex: 1; min-width: 150px; background: rgba(0,0,0,0.6); border: 1px solid #ffd700; padding: 6px 8px; font-size: 0.75rem; }
      .ewfp-hot b { color: #ffd700; display: block; font-family: 'Russo One', sans-serif; font-size: 0.7rem; letter-spacing: 1px; }
      .ewfp-roster { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-bottom: 10px; }
      .ewfp-tile { width: 74px; cursor: pointer; text-align: center; font-family: 'Russo One', sans-serif; font-size: 0.6rem; position: relative; }
      .ewfp-tile img { width: 64px; height: 64px; object-fit: cover; border: 2px solid #fff; display: block; margin: 0 auto 3px auto; }
      .ewfp-tile.sel img { border-color: #ffd700; box-shadow: 0 0 14px #ffd700; }
      .ewfp-tile .mb { position: absolute; top: 44px; right: 4px; font-size: 0.8rem; }
      .ewfp-prof { background: rgba(0,0,0,0.7); border: 1px solid #555; padding: 10px; font-size: 0.85rem; text-align: left; }
      .ewfp-prof h3 { margin: 0 0 6px 0; font-family: 'Russo One', sans-serif; }
      .ewfp-row { margin: 4px 0; }
      .ewfp-rel { display: flex; justify-content: space-between; gap: 6px; border-bottom: 1px solid #222; padding: 4px 0; }
      .ewfp-gm { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
      .ewfp-gm button { flex: 1 1 30%; min-width: 0; font-size: 0.68rem; padding: 8px 4px; white-space: normal; transform: none !important; }
    `;
    document.head.appendChild(css);
  }

  const host = () => {
    const fs = document.fullscreenElement || document.webkitFullscreenElement;
    if (fs && getComputedStyle(fs).display === 'none') { try { document.exitFullscreen().catch(() => {}); } catch (e) {} return document.body; }
    return fs || document.body;
  };
  let sceneEl = null;
  function closeScene() { if (sceneEl) { sceneEl.remove(); sceneEl = null; } }

  // opts: { bg, title, titleBg, text, left, right, center, leftHurt, rightHurt, objects:[{src, style, cls, delay}], buttons:[{label, cls, fn}], skip }
  function scene(opts) {
    ensureStyles();
    closeScene();
    const el = document.createElement('div');
    el.className = 'ewfp-scene';
    el.style.backgroundImage = `url('${opts.bg || 'show_bg.png'}'), url('show_bg.png')`;
    const icon = (typeof getRandomCommentatorOverlayIcon === 'function' && opts.comm !== false) ? (getRandomCommentatorOverlayIcon() || '') : '';
    el.innerHTML = `
      <div class="ewfp-title" style="background:${opts.titleBg || 'linear-gradient(180deg,#d32f2f,#7f0000)'};">${icon}<span style="flex:1;">${opts.title || ''}</span></div>
      <div class="ewfp-stage"></div>
      <div class="ewfp-panel"><div class="ewfp-text"></div><div class="ewfp-btns"></div></div>`;
    const stage = el.querySelector('.ewfp-stage');
    const addPose = (w, cls, hurt) => {
      if (!w) return;
      const img = document.createElement('img');
      img.className = `ewfp-pose ${cls}${hurt ? ' hurt' : ''}`;
      img.src = pose(w);
      img.alt = w.name;
      img.onerror = function () { this.onerror = null; this.src = w.image; this.classList.add('square'); };
      stage.appendChild(img);
    };
    addPose(opts.left, 'left', opts.leftHurt);
    addPose(opts.right, 'right', opts.rightHurt);
    addPose(opts.center, 'center', false);
    (opts.objects || []).forEach(o => {
      const img = document.createElement('img');
      img.className = `ewfp-obj ${o.cls || 'pop'}`;
      img.src = o.src;
      img.style.cssText = o.style || '';
      if (o.delay) img.style.animationDelay = o.delay + 'ms';
      img.onerror = function () { this.remove(); };
      stage.appendChild(img);
    });
    el.querySelector('.ewfp-text').innerHTML = opts.text || '';
    setButtons(el, opts.buttons);
    if (opts.skip) {
      const sk = document.createElement('button');
      sk.className = 'ewfp-skip'; sk.textContent = '⏩ SKIP';
      sk.onclick = () => { closeScene(); opts.skip(); };
      el.appendChild(sk);
    }
    host().appendChild(el);
    sceneEl = el;
    return el;
  }
  function setButtons(el, buttons) {
    const box = el.querySelector('.ewfp-btns');
    box.innerHTML = '';
    (buttons || []).forEach(b => {
      const btn = document.createElement('button');
      btn.className = `ewfp-btn ${b.cls || ''}`;
      btn.innerHTML = b.label;
      btn.onclick = () => { if (btn.disabled) return; btn.disabled = true; b.fn(); };
      box.appendChild(btn);
    });
  }
  function update(text, buttons, extra) {
    if (!sceneEl) return;
    sceneEl.querySelector('.ewfp-text').innerHTML = text;
    setButtons(sceneEl, buttons);
    if (extra) extra(sceneEl);
  }
  function flash(el) { const f = document.createElement('div'); f.className = 'ewfp-flash'; (el || sceneEl).appendChild(f); setTimeout(() => f.remove(), 600); }
  function shake(el) { el = el || sceneEl; if (!el) return; el.classList.remove('ewfp-shake'); void el.offsetWidth; el.classList.add('ewfp-shake'); }
  function addObj(src, style, cls, fallback) {
    if (!sceneEl) return;
    const img = document.createElement('img');
    img.className = `ewfp-obj ${cls || 'pop'}`; img.src = src; img.style.cssText = style || '';
    img.onerror = function () { if (fallback && this.src.indexOf(fallback) < 0) { this.src = fallback; this.style.height = 'auto'; this.style.width = 'min(26vw, 230px)'; this.style.border = '3px solid #fff'; this.style.bottom = '12%'; } else this.remove(); };
    sceneEl.querySelector('.ewfp-stage').appendChild(img);
  }
  const cont = (fn, label) => [{ label: label || 'CONTINUE ➔', cls: 'gold', fn: () => { closeScene(); fn(); } }];

  /* ---------- Booking helpers ---------- */
  function bookMatch(a, b, cfg, when, done) {
    cfg = cfg || {};
    const isTitle = !!cfg.titleCode;
    if (when === 'next') {
      const m = {
        w1: a, w2: b, matchType: cfg.matchType || 'Normal Match', formatKey: '1v1',
        isTitleMatch: isTitle, titleCode: isTitle ? cfg.titleCode : null,
        titleName: isTitle ? TITLE_NAMES[cfg.titleCode] : null, titleImg: isTitle ? TITLE_IMGS[cfg.titleCode] : null,
        isCareerMatch: false, storyType: 'callout', originText: cfg.origin || 'Booked by GM Ellis'
      };
      try { localStorage.setItem('ewf_scheduled_story_match', JSON.stringify(m)); } catch (e) {}
      log(`📋 BOOKED FOR THE NEXT SHOW: ${NM(a)} vs ${NM(b)}${isTitle ? ' for the ' + TITLE_NAMES[cfg.titleCode] : ''}!`, 'match');
      done && done();
      return;
    }
    // FIGHT NOW
    if (window.activeShowSession && typeof window.queueCutsceneBoutIntoShow === 'function') {
      window.queueCutsceneBoutIntoShow({
        participants: [a, b], matchType: cfg.matchType || 'Normal Match', formatKey: '1v1', isTitleMatch: isTitle,
        titleCode: cfg.titleCode, titleName: isTitle ? TITLE_NAMES[cfg.titleCode] : null, titleImg: isTitle ? TITLE_IMGS[cfg.titleCode] : null,
        storyBypass: true, feudStake: cfg.stake || '🎤 CALLED OUT BY A SUPERSTAR'
      });
      return;
    }
    try {
      activeStoryline = { id: 0, type: 'feud', matchMatch: cfg.matchType || 'Normal Match', formatKey: '1v1', isTitle: false, logText: '' };
      activeStoryWrestlerA = a; activeStoryWrestlerB = b;
      if (typeof launchStorylineMatch === 'function') launchStorylineMatch();
      if (isTitle) {
        activeBookedMatch.isTitleMatch = true;
        activeBookedMatch.titleCode = cfg.titleCode;
        activeBookedMatch.titleName = TITLE_NAMES[cfg.titleCode];
        activeBookedMatch.titleImg = TITLE_IMGS[cfg.titleCode];
        if (typeof updateTitleStakeBtnUI === 'function') updateTitleStakeBtnUI();
      }
    } catch (e) { console.warn(e); done && done(); }
  }
  // which "when" buttons make sense right now
  function whenButtons(onPick, opts) {
    opts = opts || {};
    const inShow = !!window.activeShowSession;
    const out = [];
    if (!inShow || opts.ongoing !== false) out.push({ label: inShow ? '⚔️ ADD TO TONIGHT' : '⚔️ FIGHT RIGHT NOW', cls: 'red', fn: () => onPick('now') });
    out.push({ label: '📋 NEXT SHOW', cls: 'gold', fn: () => onPick('next') });
    if (opts.noLabel) out.push({ label: opts.noLabel, cls: '', fn: () => onPick('no') });
    return out;
  }

  /* ---------- Turns ---------- */
  function playTurn(t, done) {
    const st = load();
    const w = byId(t.id);
    st.pendingTurns = st.pendingTurns.filter(x => x.id !== t.id);
    if (!w) { save(st); return done(); }
    setAlign(w.id, t.to, st);
    save(st);
    const bad = t.to === 'bad';
    log(bad ? `😈 BAD GUY TURN: ${NM(w)} has turned their back on the fans! (${t.why})` : `😇 GOOD GUY TURN: ${NM(w)} has won the fans back! (${t.why})`, 'match');
    fallout('cutscene', bad ? `😈 ${NM(w)} TURNED BAD GUY!` : `😇 ${NM(w)} TURNED GOOD GUY!`);
    scene({
      bg: bad ? 'bad_guy_turn_bg.png' : 'good_guy_turn_bg.png',
      title: bad ? `😈 ${NM(w)} HAS TURNED BAD GUY! 😈` : `😇 ${NM(w)} IS A GOOD GUY AGAIN! 😇`,
      titleBg: bad ? 'linear-gradient(180deg,#b71c1c,#1a0000)' : 'linear-gradient(180deg,#1e88e5,#0d2a5c)',
      center: w,
      text: bad
        ? `The fans can't believe it! <b>${w.name}</b> has turned their back on everyone. <i>${t.why}.</i><br>From now on they're a <b style="color:#ff1744;">BAD GUY</b>: expect cheating, sneak attacks and plenty of boos!`
        : `Listen to that crowd! <b>${w.name}</b> has turned it around. <i>${t.why}.</i><br>They're a <b style="color:#4fc3f7;">GOOD GUY</b> again and the fans are right behind them!`,
      buttons: cont(done)
    });
    if (bad) { sfx('crowd_boo.mp3', 0.9); if (typeof playSubBassBoom === 'function') playSubBassBoom(); }
    else { sfx('locker_cheer.mp3', 0.9); }
    flash();
    if (typeof renderGrid === 'function') setTimeout(renderGrid, 50);
    bret(bad ? 'badTurn' : 'goodTurn', bad
      ? `Whoa, GM! <b>${w.name}</b> just turned <b>BAD GUY</b>! Bad guys get a <b>red name and a 😈</b> on their card. They cheat, they attack after the bell, and the fans boo them. Every hero needs a villain!`
      : `What a moment, GM! <b>${w.name}</b> is a <b>GOOD GUY</b> again. Do enough good deeds, like making a save, and even the worst bad guy can win the fans back!`, 1600);
  }

  function nudgeBadGuy(done) {
    const st = load();
    st.lastNudge = st.matchNo; save(st);
    const pool = fit().sort((a, b) => {
      const da = st.deeds[a.id] || { b: 0, g: 0 }, db = st.deeds[b.id] || { b: 0, g: 0 };
      return (db.b - db.g) - (da.b - da.g);
    }).slice(0, 4);
    if (!pool.length) return done();
    scene({
      bg: 'bad_guy_turn_bg.png', title: '😈 THE EWF NEEDS A BAD GUY! 😈', titleBg: 'linear-gradient(180deg,#b71c1c,#1a0000)',
      center: pool[0],
      text: `GM, everyone's a good guy right now... and every hero needs a <b>VILLAIN</b> to beat! Who's going to turn their back on the fans?`,
      buttons: [...pool.map(w => ({ label: `😈 ${w.name}`, cls: 'red', fn: () => { closeScene(); playTurn({ id: w.id, to: 'bad', why: 'Chosen by GM Ellis to be the EWF\'s big bad' }, done); } })),
        { label: 'NOT YET', cls: '', fn: () => { closeScene(); done(); } }],
      comm: true
    });
  }

  /* ---------- Callouts ---------- */
  function calloutCandidates(st, excludeIds) {
    const ex = excludeIds || [];
    const out = [];
    const pool = fit().filter(w => !ex.includes(w.id));
    if (pool.length < 2) return out;
    // I want the guy who put me out
    st.pendingReturn.forEach(p => {
      const w = byId(p.id), vs = byId(p.vs);
      if (w && vs && !injured(w.id) && !injured(vs.id) && !ex.includes(w.id)) out.push({ type: 'return', w, vs, weight: 5 });
    });
    pool.forEach(w => {
      const m = moodOf(w.id, st);
      const mom = momentum(w.id);
      if (!m) return;
      if (m.k === 'hungry') out.push({ type: 'shot', w, weight: 3 });
      if (m.k === 'fedup') out.push({ type: 'catering', w, weight: 2 });
      if (m.k === 'cocky') out.push({ type: 'open', w, weight: 2 });
      if (mom.status === 'ice') out.push({ type: 'walking', w, weight: 2 });
    });
    pool.forEach(w => { if (momentum(w.id).status === 'ice' && !out.some(c => c.w.id === w.id && c.type === 'walking')) out.push({ type: 'walking', w, weight: 1 }); });
    // a hungry challenger needs a champion to call out
    return out.filter(c => c.type !== 'shot' || champTarget(c.w));
  }
  function champTarget(w) {
    const h = typeof getTitleHolders === 'function' ? (getTitleHolders() || {}) : {};
    for (const code of ['whc', 'ic', 'hardcore']) {
      const cid = h[code];
      if (cid && cid !== w.id && !injured(cid) && byId(cid)) return { code, champ: byId(cid) };
    }
    return null;
  }
  function weighted(arr) {
    const tot = arr.reduce((s, c) => s + (c.weight || 1), 0);
    let r = Math.random() * tot;
    for (const c of arr) { r -= (c.weight || 1); if (r <= 0) return c; }
    return arr[0];
  }

  function runCallout(c, done, opts) {
    const st = load();
    st.lastCallout = st.matchNo;
    if (c.type === 'return') st.pendingReturn = st.pendingReturn.filter(p => p.id !== c.w.id);
    save(st);
    const w = c.w;
    const mic = { src: 'microphone.png', style: 'right: 30%; bottom: 8%; height: 42%;', cls: 'slideR', delay: 300 };
    const bookFlow = (vs, cfg, when, okText) => {
      if (when === 'no') return;
      closeScene();
      log(`🎤 CALLOUT ANSWERED: ${okText}`, 'match');
      fallout('cutscene', `🎤 ${okText}`);
      bookMatch(w, vs, cfg, when, done);
    };
    const refuse = (text, sound, after) => {
      if (sound) sfx(sound, 0.9);
      shake();
      update(text, cont(() => { after && after(); done(); }));
    };
    if (c.type === 'shot') {
      const t = champTarget(w);
      scene({
        bg: 'gm_office_bg.png', title: `🎤 ${NM(w)}: "I WANT MY SHOT!"`, titleBg: 'linear-gradient(180deg,#00a152,#003d1e)',
        center: w, objects: [mic],
        text: `<b>${w.name}</b> bursts into the GM's office: <i>"I'm the hottest thing in the EWF right now! I want <b>${t.champ.name}</b> and the <b>${TITLE_NAMES[t.code]}</b>!"</i>`,
        buttons: whenButtons(when => {
          if (when === 'no') return refuse(`<b>${w.name}</b> can't believe it! <i>"You'll regret this, GM!"</i> They storm out and slam the door.`, 'door_slam.mp3', () => { const s2 = load(); setRel(w.id, t.champ.id, 'jealous', 'was refused a title shot', w.id, s2); save(s2); });
          bookFlow(t.champ, { titleCode: t.code, stake: '🎤 TITLE SHOT EARNED' }, when, `${NM(w)} gets a title shot at ${NM(t.champ)}!`);
        }, Object.assign({ noLabel: '❌ NOT YET' }, opts))
      });
      bret('callout_shot', `<b>CALLOUT!</b> When a superstar is <b>💪 HUNGRY</b> they'll demand a title shot. Give it to them, or say not yet... but they might not like it!`);
    } else if (c.type === 'catering') {
      const vs = pick(fit().filter(x => x.id !== w.id));
      scene({
        bg: 'catering_bg.png', title: `🥱 ${NM(w)}: "I'M SICK OF SITTING IN CATERING!"`, titleBg: 'linear-gradient(180deg,#616161,#212121)',
        center: w,
        text: `<b>${w.name}</b> throws down a plate of sandwiches: <i>"I've been sat back here for ages! Put me in a match, GM!"</i>`,
        buttons: whenButtons(when => {
          if (when === 'no') return refuse(`<b>${w.name}</b> kicks over the snack table and storms off. Someone's in a mood...`, 'bin_crash.mp3', () => deed(w.id, -1, 'Threw a tantrum in catering'));
          bookFlow(vs, { stake: '🥱 OUT OF CATERING' }, when, `${NM(w)} is out of catering to face ${NM(vs)}!`);
        }, Object.assign({ noLabel: '⏳ WAIT YOUR TURN' }, opts))
      });
      bret('callout_catering', `This superstar is <b>🥱 FED UP</b> because they haven't had a match in ages. Keep everyone busy, GM, or they get grumpy!`);
    } else if (c.type === 'walking') {
      const top = fit().filter(x => x.id !== w.id).sort((a, b) => (momentum(b.id).wins || 0) - (momentum(a.id).wins || 0))[0];
      if (!top) return done();
      scene({
        bg: 'gm_office_bg.png', title: `❄️ ${NM(w)}: "BIG MATCH OR I'M WALKING!"`, titleBg: 'linear-gradient(180deg,#0277bd,#01243d)',
        center: w,
        text: `<b>${w.name}</b> has lost too many and they've had enough: <i>"Give me a <b>BIG</b> match, GM. Against <b>${top.name}</b>. Or I'm walking out that door!"</i>`,
        buttons: whenButtons(when => {
          if (when === 'no') return refuse(`<b>${w.name}</b> storms out and <b>SLAMS</b> the door so hard the GM's trophies rattle!`, 'door_slam.mp3', () => { const s2 = load(); s2.lastMatch[w.id] = s2.matchNo - 8; save(s2); });
          bookFlow(top, { matchType: 'Extreme Rules', stake: '❄️ BIG MATCH OR WALK' }, when, `${NM(w)} gets the big match against ${NM(top)}!`);
        }, Object.assign({ noLabel: '🚪 LET THEM STORM OFF' }, opts))
      });
      bret('callout_walking', `This superstar is <b>❄️ ICE COLD</b>, they keep losing! They want one big match to turn things around. Will you give them the chance?`);
    } else if (c.type === 'open') {
      const takers = fit().filter(x => x.id !== w.id).sort(() => Math.random() - 0.5).slice(0, 3);
      if (!takers.length) return done();
      scene({
        bg: 'open_challenge_bg.png', title: `👑 ${NM(w)}: "ANYONE, ANY TIME!"`, titleBg: 'linear-gradient(180deg,#b8860b,#3d2c00)',
        center: w, objects: [mic],
        text: `<b>${w.name}</b> grabs the mic: <i>"Nobody in this locker room can beat me. I'm issuing an <b>OPEN CHALLENGE</b>. Anyone. Any time!"</i><br>Who answers the challenge?`,
        buttons: [...takers.map(t => ({ label: `🎵 ${t.name}`, cls: 'red', fn: () => {
          if (typeof playOhMyGodSting === 'function') playOhMyGodSting();
          flash();
          update(`<b>${t.name}</b>'s music hits! The challenge is <b>ACCEPTED</b>!`, whenButtons(when => bookFlow(t, { stake: '👑 OPEN CHALLENGE' }, when, `${NM(t)} answered ${NM(w)}'s open challenge!`), opts));
        } })), { label: 'NOBODY ANSWERS', cls: '', fn: () => { closeScene(); done(); } }]
      });
      bret('callout_open', `This superstar is <b>👑 COCKY</b>! They think they're unbeatable, so they've laid down an <b>OPEN CHALLENGE</b>. You pick who answers it!`);
    } else if (c.type === 'return') {
      scene({
        bg: 'hospital_escape_bg.png', title: `😡 ${NM(w)}: "I WANT THE ONE WHO PUT ME OUT!"`, titleBg: 'linear-gradient(180deg,#d50000,#3d0000)',
        left: w, right: c.vs, objects: [mic],
        text: `<b>${w.name}</b> is back from injury... and they've only got one name on their mind: <b>${c.vs.name}</b>! <i>"You put me in the hospital. Now it's PAYBACK!"</i>`,
        buttons: whenButtons(when => {
          if (when === 'no') return refuse(`Not yet! But <b>${w.name}</b> won't forget...`, null, () => { const s2 = load(); makeFurious(w.id, c.vs.id, `Wants payback on ${c.vs.name}`, s2); save(s2); });
          bookFlow(c.vs, { matchType: 'No Disqualification', stake: '😡 PAYBACK MATCH' }, when, `${NM(w)} gets payback on ${NM(c.vs)}!`);
        }, Object.assign({ noLabel: '⏳ NOT YET' }, opts))
      });
      bret('callout_return', `They're <b>BACK</b> from injury, GM, and they want the superstar who put them there! Revenge matches are the best kind.`);
    } else return done();
  }

  /* ---------- Post-match angles ---------- */
  function freeOutsiders(match, st) {
    const inMatch = (match && match.participants || []).map(w => w && w.id);
    return fit().filter(w => !inMatch.includes(w.id));
  }

  function angleCandidates(ctx, st) {
    const out = [];
    const W = ctx.winner, L = (ctx.losers || [])[0];
    const match = ctx.match || {};
    if (!W || !L || match.formatKey === 'rumble') return out;
    const outsiders = freeOutsiders(match, st);
    const furiousL = st.furious[L.id] && st.furious[L.id].vs === W.id;
    if (isBad(L.id, st) || furiousL) out.push({ type: 'beatdown', att: L, vic: W, sore: true, w: 3 });
    if (isBad(W.id, st)) out.push({ type: 'beatdown', att: W, vic: L, sore: false, w: 2 });
    const bb = badBloodOf(W.id, st, (match.participants || []).map(p => p.id));
    if (bb && outsiders.some(o => o.id === bb.id)) out.push({ type: 'jump', att: bb, vic: W, w: 2 });
    // champion celebration interrupted
    if (match.isTitleMatch && heldTitles(W.id).length) {
      const code = match.titleCode === 'tag' ? null : (match.titleCode || heldTitles(W.id)[0]);
      const hungry = outsiders.filter(o => (moodOf(o.id, st) || {}).k === 'hungry');
      const rival = badBloodOf(W.id, st, (match.participants || []).map(p => p.id));
      const ch = hungry[0] || (rival && outsiders.some(o => o.id === rival.id) ? rival : null) || (outsiders.length ? pick(outsiders) : null);
      if (ch && code) out.push({ type: 'interrupt', ch, champ: W, code, w: 3 });
    }
    // jealous mate cracks
    const jr = relsOf(W.id, st).find(r => r.t === 'jealous' && r.by !== W.id && outsiders.some(o => o.id === r.other));
    if (jr && ctx.summary && ctx.summary.titleWon) out.push({ type: 'jump', att: byId(jr.other), vic: W, jealous: true, w: 3 });
    return out;
  }

  function runAngle(a, ctx, done) {
    const st = load();
    st.lastAngle = st.matchNo; save(st);
    const match = ctx.match || {};
    if (a.type === 'beatdown' || a.type === 'jump') {
      const att = a.att, vic = a.vic;
      const title = a.type === 'jump'
        ? (a.jealous ? `💔 ${NM(att)} SNAPS!` : `💥 ${NM(att)} RUINS THE CELEBRATION!`)
        : `💥 AFTER THE BELL: ${NM(att)} ATTACKS!`;
      const why = a.type === 'jump'
        ? (a.jealous ? `<b>${att.name}</b> couldn't stand watching <b>${vic.name}</b> celebrate with the gold. They've attacked their own mate!` : `<b>${vic.name}</b> is celebrating... until <b>${att.name}</b> storms the ring from behind!`)
        : (a.sore ? `<b>${att.name}</b> can't handle losing! The bell has rung but they're beating down <b>${vic.name}</b>!` : `<b>${att.name}</b> won the match but they're not finished. They're still laying into <b>${vic.name}</b>!`);
      const el = scene({
        bg: 'show_bg.png', title, left: att, right: vic, rightHurt: true,
        objects: [{ src: 'steel_chair.png', style: 'left: 40%; top: 18%; height: 40%;', cls: 'spin', delay: 400 }],
        text: why, buttons: []
      });
      if (isBad(att.id)) sfx('crowd_boo.mp3', 0.8);
      setTimeout(() => { sfx('table_crash.mp3', 0.6); shake(el); }, 1000);
      const s2 = load();
      deed(att.id, -1, a.jealous ? 'Attacked their own mate out of jealousy' : 'Attacked a superstar after the bell', s2);
      log(`💥 POST-MATCH ATTACK: ${NM(att)} attacked ${NM(vic)}${a.type === 'jump' ? ' during the celebration' : ' after the bell'}!`, 'interference');
      fallout('ambush', `💥 ${NM(att)} attacked ${NM(vic)} after the match!`);
      const saver = mateOf(vic.id, s2, (match.participants || []).map(p => p.id).concat([att.id]));
      save(s2);
      const showSave = saver && Math.random() < 0.75;
      setTimeout(() => {
        if (!sceneEl) return;
        if (showSave) {
          update(`${why}<br><br>Wait... <b>THAT'S ${NM(saver)}'S MUSIC!</b>`, [], () => {});
          if (typeof playOhMyGodSting === 'function') playOhMyGodSting();
          flash();
          setTimeout(() => {
            if (!sceneEl) return;
            sceneEl.querySelector('.ewfp-pose.left') && (sceneEl.querySelector('.ewfp-pose.left').classList.add('hurt'));
            addObj(pose(saver), 'left: 30%; bottom: 0; height: 78%; max-width: 40%;', 'slideL', saver.image);
            sfx('locker_cheer.mp3', 0.8);
            const s3 = load();
            deed(saver.id, 2, `Made THE SAVE for ${vic.name}`, s3);
            deed(vic.id, 1, `Saved by their mate ${saver.name}`, s3);
            setRel(saver.id, vic.id, 'mates', `${saver.name} made the save`, null, s3);
            setRel(saver.id, att.id, 'badblood', 'made the save and ran them off', null, s3);
            setRel(att.id, vic.id, 'badblood', a.jealous ? 'betrayed out of jealousy' : 'attacked after the bell', null, s3);
            save(s3);
            if (a.jealous) disbandIf(att.id, vic.id);
            log(`🦸 THE SAVE: ${NM(saver)} ran in to rescue ${NM(vic)} from ${NM(att)}!`, 'interference');
            fallout('return', `🦸 THE SAVE! ${NM(saver)} rescued ${NM(vic)}!`);
            update(`<b>${saver.name}</b> sprints down to the ring and makes <b>THE SAVE</b>! <b>${att.name}</b> runs for the hills!<br>That's what MATES are for.`, cont(done));
            bret('theSave', `<b>THE SAVE!</b> Mates have each other's backs, GM. Making a save is a big <b>good deed</b>... it can even turn a bad guy good!`);
          }, 1600);
        } else {
          const s3 = load();
          setRel(att.id, vic.id, 'badblood', a.jealous ? 'betrayed out of jealousy' : 'attacked after the bell', null, s3);
          makeFurious(vic.id, att.id, `Wants revenge on ${att.name} for the attack`, s3);
          save(s3);
          if (a.jealous) disbandIf(att.id, vic.id);
          update(`${why}<br><br><b>${vic.name}</b> is left laid out in the middle of the ring. They'll want <b>REVENGE</b>!`, cont(done));
          bret('beatdown', `That's a <b>POST-MATCH BEATDOWN</b>, GM! Bad guys and furious superstars do this. The victim is now <b>😡 FURIOUS</b> and wants revenge!`);
        }
      }, 2600);
    } else if (a.type === 'interrupt') {
      const { ch, champ, code } = a;
      scene({
        bg: 'show_bg.png', title: `🏆 ${NM(ch)} INTERRUPTS THE CELEBRATION!`, titleBg: 'linear-gradient(180deg,#b8860b,#3d2c00)',
        left: champ, right: ch,
        objects: [{ src: TITLE_IMGS[code], style: 'left: 38%; top: 10%; width: 24%;', cls: 'pop', delay: 500 }],
        text: `<b>${champ.name}</b> is holding the <b>${TITLE_NAMES[code]}</b> high... when <b>${ch.name}</b> walks out and points at the gold! <i>"Enjoy it while it lasts. That title is MINE!"</i>`,
        buttons: whenButtons(when => {
          if (when === 'no') { closeScene(); return done(); }
          closeScene();
          const s2 = load(); setRel(ch.id, champ.id, 'badblood', 'interrupted the title celebration', null, s2); save(s2);
          log(`🏆 TITLE CHALLENGE: ${NM(ch)} interrupted ${NM(champ)}'s celebration and demanded a title match!`, 'match');
          bookMatch(ch, champ, { titleCode: code, stake: '🏆 CELEBRATION CRASHED' }, when, done);
        }, Object.assign({ noLabel: '❌ NOT TONIGHT' }, { ongoing: ctx.ongoing }))
      });
      if (typeof playOhMyGodSting === 'function') playOhMyGodSting();
      bret('interrupt', `A <b>CELEBRATION INTERRUPTED</b>! Someone wants the champion's title. Book the rematch and see if they can back it up!`);
    } else done();
  }
  function disbandIf(a, b) {
    try {
      if (typeof areInSameAlliance === 'function' && areInSameAlliance(a, b) && typeof disbandAlliance === 'function') disbandAlliance(a, b);
    } catch (e) {}
  }

  /* ---------- Return from exile (quick matches only) ---------- */
  function exileCandidate(st) {
    if (window.activeShowSession) return null;
    if (st.matchNo - st.lastExile < 6) return null;
    let ids = [];
    try { ids = (typeof getBanishedWrestlerIds === 'function' ? getBanishedWrestlerIds() : JSON.parse(localStorage.getItem('ewf_vault_banished') || '[]')); } catch (e) {}
    const pool = (typeof defaultWrestlers !== 'undefined' ? defaultWrestlers : []).concat(typeof SECRET_TALENT_VAULT !== 'undefined' ? SECRET_TALENT_VAULT : []);
    const ws = ids.map(id => pool.find(w => w.id === id)).filter(Boolean);
    return ws.length ? pick(ws) : null;
  }
  function runExile(w, done) {
    const st = load(); st.lastExile = st.matchNo; save(st);
    const overlay = blackoutStrobe(() => {
      scene({
        bg: 'show_bg.png', title: `😱 THEY'RE BACK?! IT'S ${NM(w)}!`, titleBg: 'linear-gradient(180deg,#4a148c,#120024)',
        center: w,
        text: `The lights come back on and... it's <b>${w.name}</b>! They were kicked out of the EWF, but they've snuck back into the arena. <i>"Let me back in, GM. I'll prove I belong here!"</i><br><b>Do you let them back in?</b>`,
        buttons: [
          { label: '✅ YES! WELCOME BACK', cls: 'green', fn: () => { closeScene(); log(`😱 RETURN FROM EXILE: ${NM(w)} begged GM Ellis for their job back... and got it!`, 'match'); if (typeof reinstateBanishedWrestler === 'function') reinstateBanishedWrestler(w.id); done(); } },
          { label: '🚫 NO! SECURITY!', cls: 'red', fn: () => {
            addObj('security_guards.png', 'left: 20%; bottom: 0; height: 70%;', 'slideL');
            sfx('crowd.mp3', 0.6);
            log(`🚫 EXILE ENFORCED: ${NM(w)} tried to sneak back in, but GM Ellis had security throw them out!`, 'match');
            update(`<b>SECURITY!</b> The guards drag <b>${w.name}</b> out of the building. The GM's word is final!`, cont(done));
          } }
        ]
      });
      if (typeof playOhMyGodSting === 'function') playOhMyGodSting();
      bret('exile', `Someone you <b>KICKED OUT</b> is back, begging for their job! You're the boss, GM. Let them back in, or call security?`);
    });
  }

  function blackoutStrobe(after, color) {
    if (typeof playLightsOutAudio === 'function') playLightsOutAudio();
    const b = document.createElement('div');
    b.style.cssText = 'position:fixed; inset:0; background:#000; z-index:2147483600;';
    host().appendChild(b);
    setTimeout(() => {
      let p = 0;
      const iv = setInterval(() => {
        p++;
        b.style.background = p % 2 ? (color || '#fff') : '#000';
        if (typeof playPyroBlast === 'function') playPyroBlast();
        if (p >= 6) { clearInterval(iv); b.remove(); after && after(); }
      }, 130);
    }, 1400);
    return b;
  }

  /* ---------- Alliance offer from MATES ---------- */
  function allianceCandidate(st) {
    const al = typeof getAlliances === 'function' ? getAlliances() : [];
    const inAl = (id) => al.some(a => a.p1 === id || a.p2 === id);
    const pairs = Object.keys(st.rel).filter(k => st.rel[k].t === 'mates').map(k => k.split('|'))
      .filter(([a, b]) => byId(a) && byId(b) && !inAl(a) && !inAl(b) && !injured(a) && !injured(b));
    return pairs.length ? pick(pairs).map(byId) : null;
  }
  function runAlliance(pair, done) {
    const [a, b] = pair;
    const st = load(); st.lastCallout = st.matchNo; save(st);
    scene({
      bg: 'locker_room_bg.png', title: `🤝 ${NM(a)} & ${NM(b)} WANT TO TEAM UP!`, titleBg: 'linear-gradient(180deg,#00897b,#00332d)',
      left: a, right: b,
      text: `These two are proper <b>MATES</b> now. They're in your office asking to become an official <b>TAG TEAM</b>. What do you say, GM?`,
      buttons: [
        { label: '🤝 MAKE IT OFFICIAL', cls: 'green', fn: () => {
          const name = `${a.name.split(' ').pop()} & ${b.name.split(' ').pop()}`.toUpperCase();
          if (typeof saveAlliance === 'function') saveAlliance(a.id, b.id, name, '#00ffcc');
          log(`🤝 TAG TEAM FORMED: ${NM(a)} & ${NM(b)} are now an official team!`, 'match');
          sfx('locker_cheer.mp3', 0.8);
          if (typeof renderGrid === 'function') renderGrid();
          update(`It's official! <b>${a.name}</b> and <b>${b.name}</b> are a <b>TAG TEAM</b>!`, cont(done));
        } },
        { label: 'NOT RIGHT NOW', cls: '', fn: () => { closeScene(); done(); } }
      ]
    });
  }

  // start a rivalry, but never push one into a Blood Feud from here (that has its own big cutscene)
  function safeRivalry(a, b, origin) {
    try {
      const ex = getRivalries().find(r => r && ((r.w1 === a && r.w2 === b) || (r.w1 === b && r.w2 === a)));
      if (!ex && typeof addOrUpdateRivalry === 'function') addOrUpdateRivalry(a, b, origin, 1);
    } catch (e) {}
  }

  /* ---------- Main hook: after every match ---------- */
  // Returns true if it took over (and will call ctx.done when finished)
  function afterBout(ctx) {
    try {
      const st = load();
      if (!ctx || !ctx.winner) return false;
      const go = (fn) => { setTimeout(() => { try { fn(); } catch (e) { console.warn(e); closeScene(); ctx.done(); } }, 380); return true; };

      // 1. queued turns always play first
      if (st.pendingTurns.length) {
        const t = st.pendingTurns[0];
        if (byId(t.id)) return go(() => playTurn(t, ctx.done));
        st.pendingTurns.shift(); save(st);
      }

      // 2. post-match angles (beatdown, the save, celebration jump, title challenge)
      if (st.matchNo - st.lastAngle >= 3) {
        const cands = angleCandidates(ctx, st);
        const chance = ctx.isMain ? 0.45 : 0.28;
        if (cands.length && Math.random() < chance) return go(() => runAngle(weighted(cands.map(c => Object.assign(c, { weight: c.w }))), ctx, ctx.done));
      }

      // 3. return from exile (quick matches)
      const ex = exileCandidate(st);
      if (ex && Math.random() < 0.15) return go(() => runExile(ex, ctx.done));

      // 4. callouts: at most one every 5 matches
      if (st.matchNo - st.lastCallout >= 5 && (!ctx.inShow || ctx.ongoing)) {
        // the EWF needs a bad guy
        const n = roster().length;
        if (n >= 4 && badCount(st) === 0 && st.matchNo >= 6 && st.matchNo - st.lastNudge >= 10 && Math.random() < 0.6) {
          return go(() => { const s2 = load(); s2.lastCallout = s2.matchNo; save(s2); nudgeBadGuy(ctx.done); });
        }
        const mates = allianceCandidate(st);
        if (mates && Math.random() < 0.25) return go(() => runAlliance(mates, ctx.done));
        const cands = calloutCandidates(st, (ctx.match && ctx.match.participants || []).map(p => p.id));
        if (cands.length && Math.random() < 0.6) return go(() => runCallout(weighted(cands), ctx.done, { ongoing: ctx.ongoing }));
      }
    } catch (e) { console.warn('EWFP afterBout', e); }
    return false;
  }

  /* ---------- Backstage segments (Book a Show, ~40% between bouts) ---------- */
  function maybeBackstage(winner, loser, done) {
    try {
      if (!window.activeShowSession || Math.random() >= 0.4) return false;
      const st = load();
      const segs = [];
      const W = winner, L = loser;
      if (L) segs.push('stormOff');
      if (W) segs.push('interview');
      const outs = fit().filter(w => !(W && w.id === W.id) && !(L && w.id === L.id));
      if (outs.length >= 2) segs.push('carPark', 'mystery');
      const rowPair = Object.keys(st.rel).filter(k => ['badblood', 'jealous'].includes(st.rel[k].t)).map(k => k.split('|').map(byId)).filter(p => p[0] && p[1] && !injured(p[0].id) && !injured(p[1].id));
      if (rowPair.length || outs.length >= 2) segs.push('row');
      if (W && mateOf(W.id, st, [L && L.id])) segs.push('mates');
      if (!segs.length) return false;
      const seg = pick(segs);
      setTimeout(() => { try { runBackstage(seg, W, L, outs, rowPair, done); } catch (e) { console.warn(e); closeScene(); done(); } }, 380);
      return true;
    } catch (e) { return false; }
  }

  function runBackstage(seg, W, L, outs, rowPair, done) {
    const skip = () => done();
    const first = () => bret('backstage', `We're going <b>BACKSTAGE</b>! Things happen behind the scenes too. Sometimes you get to decide what happens next. Tap <b>SKIP</b> if you just want the next match.`);
    if (seg === 'stormOff') {
      scene({ bg: 'backstage_corridor_bg.png', title: `🎥 BACKSTAGE: ${NM(L)} STORMS OFF`, left: L, skip,
        objects: [{ src: 'trash_bin.png', style: 'right: 22%; bottom: 4%; height: 38%;', cls: 'drop', delay: 900 }],
        text: `A furious <b>${L.name}</b> marches up the corridor after losing to <b>${W ? W.name : 'their opponent'}</b>... and boots a bin across the hallway!`, buttons: cont(done) });
      setTimeout(() => { sfx('bin_crash.mp3', 0.9); shake(); }, 1200);
      setTimeout(() => sfx('locker_slam.mp3', 0.7), 2600);
      if (W) { const st = load(); makeFurious(L.id, W.id, `Lost to ${W.name} and wants a rematch`, st); save(st); }
      log(`🎥 BACKSTAGE: ${NM(L)} stormed off after the loss and trashed the corridor!`, 'match');
    } else if (seg === 'interview') {
      const st = load();
      const target = badBloodOf(W.id, st, [L && L.id]) || pick(outs.length ? outs : fit().filter(x => x.id !== W.id));
      if (!target) return done();
      scene({ bg: 'interview_bg.png', title: `🎤 BACKSTAGE INTERVIEW: ${NM(W)}`, titleBg: 'linear-gradient(180deg,#1565c0,#0d2a5c)', left: W, skip,
        objects: [{ src: 'cameraman.png', style: 'right: 4%; bottom: 0; height: 70%;', cls: 'slideR', delay: 200 }, { src: 'microphone.png', style: 'left: 34%; bottom: 10%; height: 40%;', cls: 'pop', delay: 600 }],
        text: `<b>${W.name}</b> grabs the interviewer's mic: <i>"I just won, and I'm only getting started. <b>${target.name}</b>, you're NEXT!"</i><br>Does <b>${target.name}</b> accept?`,
        buttons: [
          { label: '✅ ACCEPT', cls: 'green', fn: () => { closeScene(); log(`🎤 CALLOUT ACCEPTED: ${NM(target)} accepted ${NM(W)}'s challenge!`, 'match'); bookMatch(W, target, { stake: '🎤 BACKSTAGE CHALLENGE' }, 'next', done); } },
          { label: '🙉 IGNORE', cls: '', fn: () => { closeScene(); done(); } }
        ] });
      setTimeout(() => sfx('mic_feedback.mp3', 0.6), 500);
    } else if (seg === 'carPark') {
      const st = load();
      const bads = outs.filter(w => isBad(w.id, st));
      const att = bads.length ? pick(bads) : pick(outs);
      const vic = pick(outs.filter(w => w.id !== att.id));
      if (!vic) return done();
      scene({ bg: 'car_park_bg.png', title: `🚗 CAR PARK AMBUSH!`, left: att, right: vic, skip,
        text: `<b>${vic.name}</b> is just arriving at the arena when <b>${att.name}</b> jumps out from behind a car and attacks!`,
        buttons: [
          { label: '🚨 SEND SECURITY', cls: 'blue', fn: () => {
            addObj('security_guards.png', 'left: 28%; bottom: 0; height: 72%;', 'slideL');
            const inTime = Math.random() < 0.65;
            const s2 = load();
            setRel(att.id, vic.id, 'badblood', 'ambushed them in the car park', null, s2);
            deed(att.id, -1, 'Ambushed someone in the car park', s2);
            if (!inTime) makeFurious(vic.id, att.id, `Ambushed by ${att.name} in the car park`, s2);
            save(s2);
            log(`🚗 CAR PARK AMBUSH: ${NM(att)} jumped ${NM(vic)}${inTime ? ', but security broke it up!' : ' and security were too late!'}`, 'interference');
            update(inTime ? `Security pile in and drag <b>${att.name}</b> away! <b>${vic.name}</b> is OK... but they're not happy.` : `<b>TOO LATE!</b> By the time security arrive, <b>${vic.name}</b> is laid out next to their car. <b>${vic.name}</b> is <b>FURIOUS</b>!`, cont(done),
              () => { if (!inTime && sceneEl) { const r = sceneEl.querySelector('.ewfp-pose.right'); r && r.classList.add('hurt'); } });
          } },
          { label: '🍿 LET IT PLAY OUT', cls: '', fn: () => {
            const s2 = load();
            setRel(att.id, vic.id, 'badblood', 'ambushed them in the car park', null, s2);
            deed(att.id, -1, 'Ambushed someone in the car park', s2);
            makeFurious(vic.id, att.id, `Ambushed by ${att.name} in the car park`, s2);
            save(s2);
            shake(); sfx('table_crash.mp3', 0.6);
            const r = sceneEl && sceneEl.querySelector('.ewfp-pose.right'); r && r.classList.add('hurt');
            log(`🚗 CAR PARK AMBUSH: ${NM(att)} laid out ${NM(vic)} in the car park!`, 'interference');
            update(`<b>${att.name}</b> leaves <b>${vic.name}</b> lying on the concrete and drives off! There's <b>BAD BLOOD</b> now.`, cont(done));
          } }
        ] });
      setTimeout(() => sfx('car_alarm.mp3', 0.7), 400);
    } else if (seg === 'row') {
      const pair = rowPair.length ? pick(rowPair) : outs.sort(() => Math.random() - 0.5).slice(0, 2);
      const [a, b] = pair;
      scene({ bg: 'locker_room_bg.png', title: `🥊 LOCKER ROOM ROW!`, left: a, right: b, skip,
        objects: [{ src: 'steel_chair.png', style: 'left: 42%; top: 30%; height: 34%;', cls: 'drop', delay: 1200 }],
        text: `Shouting in the locker room! <b>${a.name}</b> and <b>${b.name}</b> are nose to nose, and a chair's just gone flying!`, buttons: cont(done) });
      setTimeout(() => { sfx('locker_slam.mp3', 0.9); shake(); }, 900);
      const s2 = load(); setRel(a.id, b.id, 'badblood', 'had a row in the locker room', null, s2); save(s2);
      safeRivalry(a.id, b.id, 'Locker Room Row');
      log(`🥊 LOCKER ROOM ROW: ${NM(a)} and ${NM(b)} had to be pulled apart backstage!`, 'match');
    } else if (seg === 'mates') {
      const st = load();
      const m = mateOf(W.id, st, [L && L.id]);
      scene({ bg: 'locker_room_bg.png', title: `🎉 ${NM(W)} CELEBRATES WITH ${NM(m)}`, titleBg: 'linear-gradient(180deg,#00a152,#003d1e)', left: W, right: m, skip,
        text: `Back in the locker room, <b>${m.name}</b> is waiting to celebrate <b>${W.name}</b>'s win. Now THAT's what mates are for!`, buttons: cont(done) });
      setTimeout(() => sfx('locker_cheer.mp3', 0.9), 300);
      log(`🎉 BACKSTAGE: ${NM(W)} celebrated the win with their mate ${NM(m)}!`, 'match');
    } else if (seg === 'mystery') {
      const st = load();
      const bads = outs.filter(w => isBad(w.id, st));
      const vic = pick(outs);
      const attPool = (bads.filter(w => w.id !== vic.id).length ? bads : outs).filter(w => w.id !== vic.id);
      const att = pick(attPool);
      if (!att) return done();
      scene({ bg: 'crime_scene_bg.png', title: `🕵️ WHO DID THIS?!`, titleBg: 'linear-gradient(180deg,#263238,#000)', right: vic, rightHurt: true, skip,
        objects: [{ src: 'briefcase_shadow.png', style: 'left: 10%; bottom: 0; height: 80%; opacity: 0.9; filter: brightness(0) drop-shadow(0 0 14px rgba(255,255,255,0.75));', cls: 'slideL', delay: 300 }],
        text: `<b>${vic.name}</b> has been found laid out backstage! Nobody saw who did it... but there's a camera in the corner.`,
        buttons: [{ label: '📹 CHECK THE CCTV', cls: 'blue', fn: () => {
          closeScene();
          const el = scene({ bg: 'security_office_bg.png', title: '📹 SECURITY FOOTAGE', titleBg: 'linear-gradient(180deg,#263238,#000)', comm: false, skip,
            text: `Rewinding the tape...`, buttons: [] });
          const st2 = document.createElement('div'); st2.className = 'ewfp-cctv'; el.appendChild(st2);
          const rec = document.createElement('div'); rec.className = 'ewfp-rec'; rec.textContent = '● REC'; el.appendChild(rec);
          sfx('cctv_static.mp3', 0.7);
          setTimeout(() => {
            if (!sceneEl) return;
            addObj(pose(att), 'left: 38%; bottom: 0; height: 78%; filter: grayscale(1) contrast(1.2);', 'pop', att.image);
            flash();
            if (typeof playOhMyGodSting === 'function') playOhMyGodSting();
            const s2 = load();
            setRel(att.id, vic.id, 'badblood', 'was caught on CCTV attacking them', null, s2);
            deed(att.id, -1, 'Caught on camera attacking someone', s2);
            makeFurious(vic.id, att.id, `Caught ${att.name} on CCTV`, s2);
            save(s2);
            log(`📹 CCTV REVEAL: The mystery attacker who laid out ${NM(vic)} was ${NM(att)}!`, 'interference');
            update(`IT WAS <b>${NM(att)}</b>! Caught red-handed on camera. <b>${vic.name}</b> is going to be <b>FURIOUS</b>!`, cont(done));
          }, 2600);
        } }] });
    } else return done();
    first();
  }

  /* ---------- In-match: random run-ins, evening the odds, fake-outs, cheating ---------- */
  const live = { at: null, done: false, evenAt: null, victimId: null, attackerId: null, cheatAt: null };
  function resetLive() {
    const m = typeof activeBookedMatch !== 'undefined' ? activeBookedMatch : {};
    const bigShows = ['wrestlemania', 'summerslam', 'survivor', 'backlash', 'mitb', 'rumble', 'kotr'];
    let chance = 0.30;
    const isMain = !!(window.activeShowSession && window.activeShowSession.bouts && window.activeShowSession.currentBoutIdx === window.activeShowSession.bouts.length - 1);
    if (isMain) chance += 0.15;
    if (m && bigShows.includes(m.showKey)) chance += 0.10;
    live.at = (m && m.formatKey !== 'rumble' && Math.random() < chance) ? 90 + Math.floor(Math.random() * 211) : null;
    live.done = false; live.evenAt = null; live.victimId = null; live.attackerId = null;
    const st = load();
    const badIn = (m.participants || []).filter(p => p && isBad(p.id, st));
    live.cheatAt = (badIn.length && Math.random() < 0.35) ? 60 + Math.floor(Math.random() * 180) : null;
    live.cheater = badIn.length ? pick(badIn) : null;
  }
  function inMatchOK() {
    try { return !!(isMatchInProgressLooping && !isRunInActive); } catch (e) { return false; }
  }
  function tick(sec) {
    try {
      if (sec <= 1) resetLive();
      if (!inMatchOK()) return;
      if (live.at !== null && !live.done && sec >= live.at) {
        live.done = true;
        if (window.armedAmbushWrestler && !ambushTriggeredThisMatch) { executePendingReturnAmbushIfArmed(); return; }
        const free = freeOutsiders(activeBookedMatch, load());
        if (!free.length || (activeBookedMatch.participants || []).length < 2) return;
        if (Math.random() < 0.08) { fakeOut(); return; }
        if (typeof window.triggerManualLightsOutAmbush === 'function') window.triggerManualLightsOutAmbush();
        return;
      }
      if (live.evenAt !== null && sec >= live.evenAt) {
        const ev = live.evenAt; live.evenAt = null;
        const st = load();
        const saver = live.victimId ? mateOf(live.victimId, st, (activeBookedMatch.participants || []).map(p => p.id).concat([live.attackerId])) : null;
        if (saver && ev) {
          deed(saver.id, 1, `Evened the odds for ${(byId(live.victimId) || {}).name || 'their mate'}`);
          bret('evenOdds', `<b>EVENING THE ODDS!</b> When someone gets ambushed, their mate might come down to make it fair!`);
          executeLightsOutAmbush(saver, false, `⚖️ EVENING THE ODDS: ${NM(saver)} IS HERE TO HELP ${NM(byId(live.victimId))}!`);
        }
        return;
      }
      if (live.cheatAt !== null && sec >= live.cheatAt && live.cheater) {
        live.cheatAt = null;
        cheatBanner(live.cheater);
      }
    } catch (e) {}
  }
  function cheatBanner(w) {
    const vm = document.getElementById('videoModal');
    const b = document.createElement('div');
    b.style.cssText = 'position:fixed; top:16%; left:50%; transform:translateX(-50%); z-index:2147483640; background:linear-gradient(180deg,#b71c1c,#3d0000); color:#fff; border:2px solid #fff; padding:14px 22px; font-family:"Russo One",sans-serif; font-size:clamp(1rem,2.6vw,1.6rem); text-align:center; display:flex; align-items:center; gap:14px; box-shadow:0 0 30px #f00; max-width:90%;';
    const lines = [`😈 ${NM(w)} GRABBED A STEEL CHAIR BEHIND THE REF'S BACK!`, `😈 ${NM(w)} IS PULLING THE TIGHTS! THE REF DIDN'T SEE IT!`, `😈 ${NM(w)} THREW DUST IN THEIR OPPONENT'S EYES!`, `😈 ${NM(w)} DISTRACTED THE REFEREE!`];
    b.innerHTML = `<img src="steel_chair.png" style="height:60px;" onerror="this.remove()"><span>${pick(lines)}</span>`;
    host().appendChild(b);
    sfx('crowd_boo.mp3', 0.75);
    log(`😈 CHEATING: ${NM(w)} broke the rules behind the referee's back!`, 'interference');
    bret('cheat', `Did you see that, GM? <b>BAD GUYS CHEAT!</b> Act it out with the figures... the ref never sees it!`);
    setTimeout(() => b.remove(), 6000);
  }
  function fakeOut() {
    try { isRunInActive = true; } catch (e) {}
    blackoutStrobe(() => {
      const b = document.createElement('div');
      b.style.cssText = 'position:fixed; top:18%; left:50%; transform:translateX(-50%); z-index:2147483640; background:linear-gradient(180deg,#37474f,#000); color:#fff; border:2px solid #fff; padding:14px 22px; font-family:"Russo One",sans-serif; font-size:clamp(1rem,2.6vw,1.6rem); text-align:center; max-width:90%;';
      b.textContent = `😱 THE LIGHTS ARE BACK... AND NOBODY'S THERE?!`;
      host().appendChild(b);
      log(`😱 FAKE-OUT: The lights went out... but nobody came! Mind games!`, 'interference');
      bret('fakeOut', `Ha! <b>Mind games, GM!</b> Sometimes the lights go out and nobody's there. Keep them guessing!`);
      setTimeout(() => { b.remove(); try { isRunInActive = false; } catch (e) {} }, 4500);
    });
  }
  function onRunIn(attacker, victimId) {
    live.attackerId = attacker && attacker.id; live.victimId = victimId || null;
    const st = load();
    if (attacker && victimId) {
      deed(attacker.id, -1, 'Interfered in a match', st);
      setRel(attacker.id, victimId, 'badblood', 'ran in and attacked them', null, st);
      makeFurious(victimId, attacker.id, `Ambushed by ${attacker.name} mid-match`, st);
    }
    save(st);
    if (victimId && Math.random() < 0.6 && mateOf(victimId, st, (activeBookedMatch.participants || []).map(p => p.id).concat([attacker.id]))) {
      let sec = 0; try { sec = liveMatchElapsedSeconds; } catch (e) {}
      live.evenAt = sec + 35;
    }
  }
  // Prefer bad guys, furious superstars and bad blood rivals as run-in attackers
  function pickRunIn(free, participants) {
    const st = load();
    const pIds = (participants || []).map(p => p && p.id);
    const cands = [];
    free.forEach(w => {
      let wt = 1, vic = null;
      if (isBad(w.id, st)) wt += 2;
      const f = st.furious[w.id];
      if (f && pIds.includes(f.vs)) { wt += 3; vic = f.vs; }
      const bb = relsOf(w.id, st).find(r => r.t === 'badblood' && pIds.includes(r.other));
      if (bb) { wt += 2; vic = vic || bb.other; }
      cands.push({ w, weight: wt, vic });
    });
    if (!cands.length) return null;
    const c = weighted(cands);
    if (!c.vic) {
      const goods = pIds.filter(id => id && !isBad(id, st));
      c.vic = (goods.length ? pick(goods) : pick(pIds)) || null;
    }
    return { attacker: c.w, victimId: c.vic };
  }

  /* ---------- Bad guy entrances get booed ---------- */
  function wrapEntranceBoos() {
    const orig = window.loadAndPlayYouTube;
    if (typeof orig !== 'function') return;
    window.loadAndPlayYouTube = function (url, isCashIn, hideMITB, isVictory, isShowIntro) {
      const r = orig.apply(this, arguments);
      try {
        const w = typeof currentPlayingWrestler !== 'undefined' ? currentPlayingWrestler : null;
        if (w && !isVictory && !isShowIntro && !hideMITB && !window.isCommentatorVideoActive && isBad(w.id) && !(typeof isPromoMode !== 'undefined' && isPromoMode)) {
          setTimeout(() => sfx('crowd_boo.mp3', 0.55), 600);
        }
      } catch (e) {}
      return r;
    };
    try { loadAndPlayYouTube = window.loadAndPlayYouTube; } catch (e) {}
  }

  /* ---------- Locker room cards ---------- */
  function decorateGrid() {
    try {
      const container = document.getElementById('wrestler-grid');
      if (!container) return;
      const st = load();
      const ws = roster();
      const cards = [...container.querySelectorAll('.card:not(.add-card)')];
      let anyMood = false;
      cards.forEach((card, i) => {
        const w = ws[i];
        if (!w) return;
        const h3 = card.querySelector('h3');
        if (h3 && isBad(w.id, st)) {
          h3.style.color = '#ff1744';
          if (!h3.querySelector('.bad-guy-mark')) h3.insertAdjacentHTML('beforeend', '<span class="bad-guy-mark">😈</span>');
        }
        const m = moodOf(w.id, st);
        if (m) {
          anyMood = true;
          const M = MOODS[m.k];
          const d = document.createElement('div');
          d.className = 'mood-badge';
          d.title = `${M.label}: ${m.why}`;
          d.style.setProperty('border-color', M.col, 'important');
          d.style.setProperty('box-shadow', `0 0 10px ${M.col}`, 'important');
          d.textContent = M.e;
          card.appendChild(d);
        }
      });
      if (anyMood) bret('moodBadge', `See that badge in the <b>bottom corner</b> of a card? That's the superstar's <b>MOOD</b>! 👑 Cocky, 💪 Hungry, 🥱 Fed up, 😒 Jealous, 😡 Furious. Check the <b>SUPERSTARS</b> tab in the EWF Universe to find out why!`, 900);
    } catch (e) {}
  }
  function wrapGrid() {
    const orig = window.renderGrid;
    if (typeof orig !== 'function') return;
    window.renderGrid = function (...a) { const r = orig.apply(this, a); decorateGrid(); return r; };
    try { renderGrid = window.renderGrid; } catch (e) {}
  }

  /* ---------- Storyline modal hooks ---------- */
  function wrapStoryClose() {
    const orig = window.closeStorylineModal || (typeof closeStorylineModal === 'function' ? closeStorylineModal : null);
    if (!orig) return;
    window.closeStorylineModal = function (...a) {
      const r = orig.apply(this, a);
      try {
        // turns earned in a quick-play storyline play straight away (in shows they wait for the next bout)
        const st = load();
        if (!window.activeShowSession && st.pendingTurns.length && !document.querySelector('.ewfp-scene')) {
          setTimeout(() => { const s2 = load(); if (s2.pendingTurns.length) playTurn(s2.pendingTurns[0], () => {}); }, 500);
        }
      } catch (e) {}
      return r;
    };
    try { closeStorylineModal = window.closeStorylineModal; } catch (e) {}
  }

  /* ---------- SUPERSTARS tab (EWF Universe) ---------- */
  let selId = null;
  const REL_LABEL = { mates: '🤝 MATES', badblood: '💢 BAD BLOOD', jealous: '😒 JEALOUS OF', respect: '🙌 RESPECT' };
  const REL_COL = { mates: '#00e676', badblood: '#ff1744', jealous: '#b388ff', respect: '#ffd700' };

  function ensureTab() {
    const tabs = document.querySelector('#universeModal .universe-tabs');
    if (!tabs || document.getElementById('tabBtnSuperstars')) return;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'universe-tab-btn'; btn.id = 'tabBtnSuperstars';
    btn.innerHTML = '⭐ Superstars';
    btn.onclick = () => switchUniverseTab('superstars');
    tabs.appendChild(btn);
    const div = document.createElement('div');
    div.id = 'universeTabSuperstars'; div.style.display = 'none';
    const inj = document.getElementById('universeTabInjuries');
    (inj && inj.parentNode ? inj.parentNode : tabs.parentNode).insertBefore(div, inj ? inj.nextSibling : null);
  }

  function hottest(st) {
    const ws = fit();
    const scored = ws.map(w => ({ w, m: momentum(w.id) })).sort((a, b) => (b.m.streak - a.m.streak) || (b.m.wins - a.m.wins));
    const hot = scored.filter(x => x.m.status === 'fire')[0] || scored[0];
    const bb = Object.keys(st.rel).filter(k => st.rel[k].t === 'badblood').map(k => k.split('|').map(byId)).filter(p => p[0] && p[1]);
    const mates = Object.keys(st.rel).filter(k => st.rel[k].t === 'mates').map(k => k.split('|').map(byId)).filter(p => p[0] && p[1]);
    const bads = roster().filter(w => isBad(w.id, st));
    return `<div class="ewfp-hot">
      <div><b>🔥 HOTTEST IN THE EWF</b>${hot ? `${hot.w.name}${hot.m.streak ? ` (${hot.m.streak} wins in a row)` : ''}` : '-'}</div>
      <div><b>💢 BIGGEST BAD BLOOD</b>${bb.length ? `${bb[bb.length - 1][0].name} vs ${bb[bb.length - 1][1].name}` : 'Nobody... yet'}</div>
      <div><b>🤝 BEST MATES</b>${mates.length ? `${mates[mates.length - 1][0].name} & ${mates[mates.length - 1][1].name}` : 'Nobody... yet'}</div>
      <div><b>😈 BAD GUYS</b>${bads.length ? bads.map(w => w.name).join(', ') : 'None! Everyone\'s a good guy'}</div>
    </div>`;
  }

  function renderSuperstarsTab() {
    ensureStyles(); ensureTab();
    const box = document.getElementById('universeTabSuperstars');
    if (!box) return;
    const st = load();
    const ws = roster();
    if (!ws.length) { box.innerHTML = '<div style="padding:12px; color:#aaa;">Sign some superstars first!</div>'; return; }
    if (!selId || !ws.some(w => w.id === selId)) selId = ws[0].id;
    const tiles = ws.map(w => {
      const m = moodOf(w.id, st);
      return `<div class="ewfp-tile ${w.id === selId ? 'sel' : ''}" data-id="${w.id}">
        <img src="${w.image}" onerror="handleImgError(this, '${w.id}')">${m ? `<span class="mb">${MOODS[m.k].e}</span>` : ''}
        <div style="color:${isBad(w.id, st) ? '#ff1744' : '#fff'}">${w.name}${isBad(w.id, st) ? ' 😈' : ''}</div></div>`;
    }).join('');
    box.innerHTML = hottest(st) + `<div class="ewfp-roster">${tiles}</div><div class="ewfp-prof" id="ewfpProfile"></div>`;
    box.querySelectorAll('.ewfp-tile').forEach(t => t.onclick = () => { selId = t.getAttribute('data-id'); renderSuperstarsTab(); });
    renderProfile();
  }

  function renderProfile() {
    const el = document.getElementById('ewfpProfile');
    if (!el) return;
    const st = load();
    const w = byId(selId);
    if (!w) { el.innerHTML = ''; return; }
    const bad = isBad(w.id, st);
    const mom = momentum(w.id);
    const form = mom.status === 'fire' ? '🔥 ON FIRE' : mom.status === 'ice' ? '❄️ ICE COLD' : 'STEADY';
    const m = moodOf(w.id, st);
    const titles = heldTitles(w.id);
    const rels = relsOf(w.id, st).filter(r => r.t && byId(r.other));
    const relHTML = rels.length ? rels.map(r => {
      const o = byId(r.other);
      let label = REL_LABEL[r.t];
      if (r.t === 'jealous') label = r.by === w.id ? '😒 JEALOUS OF' : '😒 IS JEALOUS OF THEM';
      return `<div class="ewfp-rel"><span><b style="color:${REL_COL[r.t]}">${label}</b> ${o.name}</span><span style="color:#aaa; font-size:0.75rem; text-align:right;">${r.why || ''}</span></div>`;
    }).join('') : '<div style="color:#888;">No relationships yet. They\'ll build up as matches happen!</div>';
    const others = roster().filter(o => o.id !== w.id).map(o => `<option value="${o.id}">${o.name}</option>`).join('');
    el.innerHTML = `
      <h3 style="color:${bad ? '#ff1744' : '#4fc3f7'}">${w.name.toUpperCase()} ${bad ? '😈 BAD GUY' : '😇 GOOD GUY'}</h3>
      <div class="ewfp-row"><b>FORM:</b> ${form} (${mom.wins || 0} wins in last ${mom.total || 0})${titles.length ? ` &nbsp; <b>🏆</b> ${titles.map(t => TITLE_NAMES[t]).join(', ')}` : ''}</div>
      <div class="ewfp-row"><b>MOOD:</b> ${m ? `<span style="color:${MOODS[m.k].col}">${MOODS[m.k].e} ${MOODS[m.k].label}</span> <span style="color:#aaa">(${m.why})</span>` : 'Calm'}</div>
      <div class="ewfp-row" style="margin-top:8px;"><b>RELATIONSHIPS</b></div>${relHTML}
      <div class="ewfp-gm">
        <button class="action-btn ${bad ? 'btn-blue' : 'btn-red'}" id="ewfpTurnBtn">${bad ? '😇 MAKE GOOD GUY' : '😈 MAKE BAD GUY'}</button>
      </div>
      <div class="ewfp-gm" style="align-items:center;">
        <select id="ewfpOther" style="flex:1; min-width:140px;">${others}</select>
      </div>
      <div class="ewfp-gm">
        <button class="action-btn btn-gold" id="ewfpMates">🤝 MAKE THEM MATES</button>
        <button class="action-btn btn-red" id="ewfpBad">💢 START BAD BLOOD</button>
        <button class="action-btn btn-blue" id="ewfpSquash">🕊️ SQUASH IT</button>
      </div>`;
    el.querySelector('#ewfpTurnBtn').onclick = () => {
      if (typeof closeUniverseModal === 'function') closeUniverseModal();
      playTurn({ id: w.id, to: bad ? 'good' : 'bad', why: 'GM Ellis made the call' }, () => {});
    };
    const other = () => byId(el.querySelector('#ewfpOther').value);
    el.querySelector('#ewfpMates').onclick = () => { const o = other(); if (!o) return; const s = load(); setRel(w.id, o.id, 'mates', 'GM Ellis made them mates', null, s); save(s); log(`🤝 GM DECREE: ${NM(w)} and ${NM(o)} are now MATES!`, 'match'); renderSuperstarsTab(); if (typeof renderGrid === 'function') renderGrid(); };
    el.querySelector('#ewfpBad').onclick = () => {
      const o = other(); if (!o) return; const s = load(); setRel(w.id, o.id, 'badblood', 'GM Ellis started the bad blood', null, s); save(s);
      safeRivalry(w.id, o.id, 'GM Decree');
      log(`💢 GM DECREE: BAD BLOOD between ${NM(w)} and ${NM(o)}!`, 'match'); renderSuperstarsTab();
    };
    el.querySelector('#ewfpSquash').onclick = () => {
      const o = other(); if (!o) return; const s = load(); setRel(w.id, o.id, null, '', null, s);
      if (s.furious[w.id] && s.furious[w.id].vs === o.id) delete s.furious[w.id];
      if (s.furious[o.id] && s.furious[o.id].vs === w.id) delete s.furious[o.id];
      save(s);
      try { const riv = getRivalries().find(r => r && ((r.w1 === w.id && r.w2 === o.id) || (r.w2 === w.id && r.w1 === o.id))); if (riv && typeof removeRivalry === 'function') removeRivalry(riv.id); } catch (e) {}
      log(`🕊️ GM DECREE: ${NM(w)} and ${NM(o)} have squashed it. No more drama between them!`, 'match'); renderSuperstarsTab();
      if (typeof renderGrid === 'function') renderGrid();
    };
  }

  function wrapUniverseTabs() {
    const orig = window.switchUniverseTab || (typeof switchUniverseTab === 'function' ? switchUniverseTab : null);
    if (!orig) return;
    window.switchUniverseTab = function (tab) {
      ensureTab();
      const sBtn = document.getElementById('tabBtnSuperstars');
      const sDiv = document.getElementById('universeTabSuperstars');
      if (tab === 'superstars') {
        ['titles', 'alliances', 'feuds', 'injuries'].forEach(t => {
          setElDisplay(`universeTab${t.charAt(0).toUpperCase() + t.slice(1)}`, 'none');
          const b = document.getElementById(`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`); if (b) b.classList.remove('active');
        });
        if (sDiv) sDiv.style.display = 'block';
        if (sBtn) sBtn.classList.add('active');
        renderSuperstarsTab();
        return;
      }
      if (sDiv) sDiv.style.display = 'none';
      if (sBtn) sBtn.classList.remove('active');
      return orig.apply(this, arguments);
    };
    try { switchUniverseTab = window.switchUniverseTab; } catch (e) {}
    const origOpen = window.openUniverseModal;
    if (typeof origOpen === 'function') {
      window.openUniverseModal = function (...a) { ensureTab(); const sDiv = document.getElementById('universeTabSuperstars'); if (sDiv) sDiv.style.display = 'none'; const b = document.getElementById('tabBtnSuperstars'); if (b) b.classList.remove('active'); return origOpen.apply(this, a); };
      try { openUniverseModal = window.openUniverseModal; } catch (e) {}
    }
  }

  /* ---------- Reset & backup lists ---------- */
  try {
    if (typeof EWF_BACKUP_KEYS !== 'undefined' && Array.isArray(EWF_BACKUP_KEYS) && !EWF_BACKUP_KEYS.includes(KEY)) EWF_BACKUP_KEYS.push(KEY);
  } catch (e) {}

  /* ---------- Public API ---------- */
  window.EWFP = {
    load, save, isBad, moodOf, getRel, setRel, relsOf, deed, castStory, applyStory, onMatchResult, afterBout, maybeBackstage,
    tick, onRunIn, pickRunIn, playTurn, renderSuperstarsTab, MOODS, _live: live,
    // test helpers
    _runCallout: runCallout, _runAngle: runAngle, _runBackstage: runBackstage, _runExile: runExile, _nudge: nudgeBadGuy, _fakeOut: fakeOut, _cheat: cheatBanner, _alliance: runAlliance, _closeScene: closeScene
  };

  function init() {
    ensureStyles();
    // safety net: never leave a hidden screen in fullscreen (a late fullscreen request can land after it closed)
    const fsGuard = () => {
      const fs = document.fullscreenElement || document.webkitFullscreenElement;
      if (fs && fs !== document.documentElement && getComputedStyle(fs).display === 'none') {
        try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {}
      }
    };
    document.addEventListener('fullscreenchange', () => setTimeout(fsGuard, 50));
    document.addEventListener('webkitfullscreenchange', () => setTimeout(fsGuard, 50));
    wrapDeclare();
    wrapEntranceBoos();
    wrapGrid();
    wrapStoryClose();
    wrapUniverseTabs();
    ensureTab();
    try { if (typeof renderGrid === 'function') renderGrid(); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
