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

  // Batch 13: how easily each superstar turns (set per superstar as heelTendency: likely / neutral / unlikely)
  const TURN_BAD = { likely: 3, neutral: 4, unlikely: 6 };
  const TURN_GOOD = { likely: 4, neutral: 3, unlikely: 2 };
  const TEND_RANK = { likely: 0, neutral: 1, unlikely: 2 };
  function tendencyOf(id) { const w = byId(id); const t = w && w.heelTendency; return TURN_BAD[t] ? t : 'neutral'; }
  window.ewfTendencyOf = tendencyOf;

  // pts > 0 = good deed, pts < 0 = bad deed
  function deed(id, pts, why, st) {
    if (!id || !pts) return;
    const own = !st; st = st || load();
    const d = st.deeds[id] || (st.deeds[id] = { b: 0, g: 0 });
    if (pts < 0) d.b += -pts; else d.g += pts;
    const bad = st.align[id] === 'bad';
    const queued = st.pendingTurns.some(t => t.id === id);
    if (!queued) {
      const t = tendencyOf(id);
      if (!bad && d.b - d.g >= TURN_BAD[t] && badCount(st) < maxBad()) {
        st.pendingTurns.push({ id, to: 'bad', why: why || 'One dirty trick too many' });
      } else if (bad && d.g - d.b >= TURN_GOOD[t]) {
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

  // Batch 11 item 18: only the big stuff makes someone FURIOUS, it cools after 4 matches, max 3 at once
  function makeFurious(id, vsId, why, st) {
    if (!id) return;
    const active = Object.keys(st.furious).filter(k => k !== id && st.furious[k].until > st.matchNo);
    if (!st.furious[id] && active.length >= 3) return;
    st.furious[id] = { vs: vsId || null, why: why || 'Wants revenge', until: st.matchNo + 4 };
  }

  /* ---------- Bad guy mark (Batch 11 item 15): 🫯 if the tablet can draw it, otherwise just the red name ---------- */
  // A colour emoji ignores the red fill colour; a "missing glyph" box is drawn in plain red. So: any non-red pixels = supported.
  function emojiSupported(ch) {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 40;
      const x = c.getContext('2d'); x.textBaseline = 'top'; x.font = '32px sans-serif'; x.fillStyle = '#ff0000';
      x.fillText(ch, 2, 2);
      const d = x.getImageData(0, 0, 40, 40).data;
      let colour = 0, ink = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 60) continue;
        ink++;
        if (d[i + 1] > 60 || d[i + 2] > 60) colour++;
      }
      return ink > 20 && colour > ink * 0.15;
    } catch (e) { return false; }
  }
  const BADMARK = emojiSupported('🫯') ? '🫯' : '';
  const bm = (t) => (BADMARK ? BADMARK + ' ' : '') + t;

  /* ---------- Moods ---------- */
  const MOODS = {
    cocky: { e: '👑', label: 'COCKY', col: '#ffd700' },
    hungry: { e: '💪', label: 'HUNGRY', col: '#00e676' },
    fedup: { e: '💤', label: 'FED UP', col: '#9e9e9e' },
    jealous: { e: '👀', label: 'JEALOUS', col: '#b388ff' },
    furious: { e: '🌋', label: 'FURIOUS', col: '#ff1744' }
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
      // Batch 13: born villains get the villain's role, fan favourites rarely do
      else if (aBadDeed && !isBad(A.id, st) && !isBad(B.id, st) && TEND_RANK[tendencyOf(A.id)] > TEND_RANK[tendencyOf(B.id)] && Math.random() < 0.75) swap();
      if (!forced && Array.isArray(pool) && aBadDeed && !isBad(A.id, st) && tendencyOf(A.id) === 'unlikely' && Math.random() < 0.6) {
        const heels = pool.filter(w => w && w.id !== B.id && tendencyOf(w.id) !== 'unlikely');
        const likely = heels.filter(w => tendencyOf(w.id) === 'likely');
        if (likely.length || heels.length) A = pick(likely.length && Math.random() < 0.7 ? likely : heels);
      }
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
      if (story.type === 'injury_feud') makeFurious(B.id, A.id, `Put in hospital by ${A.name}`, st);
      else if (story.type === 'betrayal') makeFurious(B.id, A.id, `Betrayed by ${A.name}`, st);
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
      if (winners.length === 2 && match && (match.formatKey === 'tag' || match.formatKey === 'handicap')) {
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
      /* Batch 11 item 10: superstars square up in the middle, victims go down properly */
      .ewfp-pose { position: absolute; bottom: 0; height: 88%; max-width: 40%; object-fit: contain; filter: drop-shadow(0 0 18px rgba(0,0,0,0.9));
        transform-origin: bottom center; transition: rotate .25s ease-out, translate .25s ease-out, filter .25s; }
      .ewfp-pose.left { left: 15%; z-index: 2; animation: ewfpInLeft .6s ease-out both; }
      .ewfp-pose.right { right: 15%; z-index: 1; animation: ewfpInRight .6s ease-out both; }
      .ewfp-pose.center { left: 50%; transform: translateX(-50%); animation: ewfpRise .7s ease-out both; }
      .ewfp-pose.square { height: auto; width: min(26vw, 240px); bottom: 12%; border: 3px solid #fff; }
      .ewfp-pose.left.square { left: 22%; } .ewfp-pose.right.square { right: 22%; }
      .ewfp-pose.hurt { filter: grayscale(0.85) brightness(0.5) drop-shadow(0 0 12px #000); rotate: -20deg; translate: -6% 10%; }
      .ewfp-pose.right.hurt { rotate: 20deg; translate: 6% 10%; }
      .ewfp-monitor { position: absolute; top: 4%; right: 3%; width: min(24vw, 230px); background: #000; border: 5px solid #2b2b2b; outline: 2px solid #555;
        box-shadow: 0 10px 30px rgba(0,0,0,0.9); z-index: 5; animation: ewfpPop .5s ease-out both; }
      .ewfp-monitor img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; filter: contrast(1.1) saturate(0.9); }
      .ewfp-monitor div { position: absolute; top: 6px; left: 8px; color: #ff1744; font-family: 'Russo One', sans-serif; font-size: 0.8rem; text-shadow: 0 0 6px #000; }
      .ewfp-monitor span { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.75); color: #fff; font-family: 'Russo One', sans-serif; font-size: 0.75rem; padding: 3px 6px; text-align: center; }
      .ewfp-obj { position: absolute; z-index: 4; pointer-events: none; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.85)); }
      .ewfp-obj.drop { animation: ewfpDrop .7s cubic-bezier(.3,1.4,.6,1) both; }
      .ewfp-obj.slideL { animation: ewfpInLeft .7s ease-out both; }
      .ewfp-obj.slideR { animation: ewfpInRight .7s ease-out both; }
      .ewfp-obj.spin { animation: ewfpSpin .8s ease-out both; }
      .ewfp-obj.pop { animation: ewfpPop .5s ease-out both; }
      .ewfp-obj.still { animation: ewfpFade .4s ease-out both; }
      .ewfp-obj.placing { opacity: 0; animation: none; }
      .ewfp-panel { position: relative; z-index: 5; margin: 0 auto 22px auto; width: min(880px, 94%); background: rgba(8,8,14,0.9); border: 2px solid #ffd700;
        box-shadow: 0 0 30px rgba(0,0,0,0.9); padding: 14px 18px; text-align: center; }
      .ewfp-text { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: clamp(1rem, 2.2vw, 1.25rem); line-height: 1.4; }
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
      /* Batch 11 item 11: Book a Show results */
      .bsb-fighter-thumb-wrap.bsb-win .bsb-fighter-thumb { border: 2px solid #ffd700 !important; box-shadow: 0 0 14px rgba(255,215,0,0.95), 0 0 4px #fff !important; }
      .bsb-win-ribbon { position: absolute; left: -6px; right: -6px; bottom: -7px; z-index: 4; background: linear-gradient(180deg, #ffe066, #d4af37 60%, #b8860b);
        color: #000; font-family: 'Russo One', sans-serif; font-size: 0.5rem; letter-spacing: 0.5px; text-align: center; padding: 1px 0; border: 1px solid #fff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.8); white-space: nowrap; }
      .bsb-lose-stamp { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(-18deg); z-index: 4; color: #ff1744; border: 2px solid #ff1744;
        font-family: 'Russo One', sans-serif; font-size: 0.48rem; padding: 1px 3px; background: rgba(0,0,0,0.55); letter-spacing: 0.5px; white-space: nowrap; }
      .bsb-fighter-name.bsb-win-name { color: #ffd700 !important; text-shadow: 0 0 8px rgba(255,215,0,0.6); }
      .bsb-fighter-name.bsb-lose-name { color: #888 !important; text-decoration: none !important; }
      .bsb-res { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; font-family: 'Russo One', sans-serif; }
      .bsb-res .stars { color: #ffd700; font-size: 1.05rem; text-shadow: 0 0 8px #ffd700; letter-spacing: 1px; }
      .bsb-res .time { color: #ccc; font-size: 0.68rem; }
      .bsb-res .champ { display: flex; align-items: center; gap: 5px; background: linear-gradient(180deg, #ffe066, #b8860b); color: #000; font-size: 0.66rem; padding: 3px 7px; border: 1.5px solid #fff; box-shadow: 0 0 12px rgba(255,215,0,0.8); }
      .bsb-res .champ img { height: 16px; }
      .bsb-res .kept { color: #4fc3f7; font-size: 0.66rem; border: 1px solid #4fc3f7; padding: 2px 6px; }
      .bs-bout-strip.ewfp-slam { animation: ewfpSlam .55s cubic-bezier(.2,1.6,.5,1) both; }
      @keyframes ewfpSlam { 0% { transform: scale(1.35); opacity: 0; filter: brightness(2); } 60% { transform: scale(0.97); opacity: 1; } 100% { transform: scale(1); filter: none; } }
      /* Batch 11 item 14: one job per corner */
      .card .rival-badge, .card .defense-counter-pill { display: none !important; }
      .rival-tile { position: absolute !important; top: 104px !important; left: 6px !important; min-width: 26px; height: 26px; padding: 0 3px; box-sizing: border-box;
        display: flex !important; align-items: center; justify-content: center; gap: 1px; border-radius: 4px; font-size: 0.85rem; line-height: 1; z-index: 17; pointer-events: none;
        background: rgba(30, 0, 0, 0.9); border: 2px solid #ff1744; box-shadow: 0 0 10px rgba(255, 23, 68, 0.75); color: #fff; font-family: 'Russo One', sans-serif; }
      .rival-tile.blood { border-color: #b71c1c; background: #000; box-shadow: 0 0 12px #ff0000; animation: pulseFire 1.5s infinite alternate; }
      .rival-tile small { font-size: 0.62rem; }
      .belt-def-count { position: absolute; right: 1px; bottom: 1px; min-width: 18px; height: 18px; border-radius: 9px; padding: 0 4px; box-sizing: border-box;
        background: linear-gradient(180deg, #ffd700, #b8860b); color: #000; border: 1.5px solid #fff; font-family: 'Russo One', sans-serif; font-size: 0.6rem;
        display: flex; align-items: center; justify-content: center; z-index: 25; box-shadow: 0 0 8px rgba(255, 215, 0, 0.8); }
      #universeTabSuperstars { background: linear-gradient(rgba(5,5,10,0.35), rgba(5,5,10,0.55)), url('relationships_bg.png') center/cover; padding: 10px; border: 1px solid #333; }
      .ewfp-hot { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
      .ewfp-hot div { flex: 1; min-width: 150px; background: rgba(0,0,0,0.72); border: 1px solid #ffd700; padding: 6px 8px; font-size: 0.75rem; }
      .ewfp-tile div { text-shadow: 0 1px 3px #000, 0 0 6px #000; }
      .ewfp-hot b { color: #ffd700; display: block; font-family: 'Russo One', sans-serif; font-size: 0.7rem; letter-spacing: 1px; }
      .ewfp-roster { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-bottom: 10px; }
      .ewfp-tile { width: 74px; cursor: pointer; text-align: center; font-family: 'Russo One', sans-serif; font-size: 0.6rem; position: relative; }
      .ewfp-tile img { width: 64px; height: 64px; object-fit: cover; border: 2px solid #fff; display: block; margin: 0 auto 3px auto; }
      .ewfp-tile.sel img { border-color: #ffd700; box-shadow: 0 0 14px #ffd700; }
      .ewfp-tile .mb { position: absolute; top: 44px; right: 4px; font-size: 0.8rem; }
      .ewfp-prof { background: rgba(0,0,0,0.78); border: 1px solid #555; padding: 10px; font-size: 0.85rem; text-align: left; }
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
    const addPose = (w, cls, hurt, style) => {
      if (!w) return;
      const img = document.createElement('img');
      img.className = `ewfp-pose ${cls}${hurt ? ' hurt' : ''}`;
      if (style) img.style.cssText = style;
      img.src = pose(w);
      img.alt = w.name;
      img.onerror = function () { this.onerror = null; this.src = w.image; this.classList.add('square'); };
      stage.appendChild(img);
    };
    addPose(opts.left, 'left', opts.leftHurt, opts.leftStyle);
    addPose(opts.right, 'right', opts.rightHurt, opts.rightStyle);
    addPose(opts.center, 'center', false);
    (opts.objects || []).forEach(o => {
      const img = document.createElement('img');
      img.className = `ewfp-obj ${o.cls || 'pop'}${o.anchor ? ' placing' : ''}`;
      img.src = o.src;
      img.style.cssText = o.style || '';
      if (o.delay) img.style.animationDelay = o.delay + 'ms';
      img.onerror = function () { this.remove(); };
      if (o.anchor) img.__anchor = o.anchor;
      stage.appendChild(img);
    });
    setTimeout(() => placeAnchored(el), 0);
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
  // BATCH 15 ITEMS 10, 21: props sized and placed against the superstar they belong to.
  // anchor: { to: 'left'|'right'|'center', kind: 'mic'|'cameraman'|'bin' }
  const loaded = img => new Promise(res => { if (img.complete && img.naturalWidth) return res(); img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); setTimeout(res, 2500); });
  function poseBox(stage, to) {
    const p = stage.querySelector(`.ewfp-pose.${to}`);
    if (!p) return null;
    const sr = stage.getBoundingClientRect(), r = p.getBoundingClientRect();
    // object-fit: contain, so work out the picture's real box inside the element
    const nw = p.naturalWidth || 2, nh = p.naturalHeight || 3;
    const scale = Math.min(r.width / nw, r.height / nh);
    const w = nw * scale, h = nh * scale;
    return { x: r.left - sr.left + (r.width - w) / 2, y: r.top - sr.top + (r.height - h), w, h, el: p, sw: sr.width, sh: sr.height };
  }
  async function placeAnchored(el) {
    const stage = el.querySelector('.ewfp-stage');
    if (!stage) return;
    const objs = [...stage.querySelectorAll('.ewfp-obj')].filter(o => o.__anchor);
    if (!objs.length) return;
    await Promise.all([...stage.querySelectorAll('img')].map(loaded));
    await new Promise(r => setTimeout(r, 650)); // let the superstars finish sliding in
    objs.forEach(img => {
      const a = img.__anchor;
      const b = poseBox(stage, a.to);
      img.classList.remove('placing');
      if (!b) { img.classList.add('still'); return; }
      img.style.left = img.style.right = img.style.top = img.style.bottom = '';
      if (a.kind === 'mic') {
        // the mic head sits just in front of their mouth, held up from the interviewer's side
        const h = b.h * 0.36, w = h * (img.naturalWidth / img.naturalHeight || 0.67);
        const side = a.side || 1; // 1 = interviewer on their right
        const mouthX = b.x + b.w * (side > 0 ? 0.66 : 0.34), mouthY = b.y + b.h * 0.2;
        img.style.height = h + 'px';
        // the mic head is at (69%, 25%) of the picture
        img.style.left = (mouthX - w * (side > 0 ? 0.69 : 0.31)) + 'px';
        img.style.top = (mouthY - h * 0.25) + 'px';
        img.style.rotate = (side > 0 ? '-12deg' : '12deg');
        if (side < 0) img.style.transform = 'scaleX(-1)';
        img.style.zIndex = '4';
      } else if (a.kind === 'cameraman') {
        // big, in the foreground, filming the superstar (camera pointing at them)
        const h = b.sh * 0.96, w = h * (img.naturalWidth / img.naturalHeight || 0.9);
        img.style.height = h + 'px';
        img.style.bottom = '0px';
        img.style.left = Math.min(b.sw - w * 0.78, b.x + b.w * 1.15) + 'px';
        img.style.transform = 'scaleX(-1)';
        img.style.zIndex = '6';
      } else if (a.kind === 'bin') {
        // a real-size bin at their feet
        const h = b.h * 0.42;
        img.style.height = h + 'px';
        img.style.bottom = '2%';
        img.style.left = (b.x + b.w * 0.78) + 'px';
        img.style.zIndex = '3';
      }
      img.classList.add('still');
    });
  }
  // BATCH 15 ITEMS 11, 21: a prop flies from one superstar and smacks into the other
  function throwProp(el, src, from, to, opts) {
    opts = opts || {};
    const stage = el && el.querySelector('.ewfp-stage');
    if (!stage) return;
    const A = poseBox(stage, from), B = poseBox(stage, to);
    if (!A || !B) return;
    const img = document.createElement('img');
    img.className = 'ewfp-obj';
    img.src = src;
    const h = (opts.size || 0.5) * B.h;
    img.style.height = h + 'px';
    img.style.zIndex = '6';
    stage.appendChild(img);
    loaded(img).then(() => {
      const w = h * (img.naturalWidth / img.naturalHeight || 1);
      const dir = B.x > A.x ? 1 : -1;
      const sx = A.x + A.w * (dir > 0 ? 0.75 : 0.25) - w / 2, sy = A.y + A.h * 0.12;
      const ex = B.x + B.w * 0.5 - w / 2, ey = B.y + B.h * 0.10;
      const fx = B.x + B.w * (dir > 0 ? 0.15 : 0.85) - w / 2, fy = stage.getBoundingClientRect().height - h * 0.9;
      img.style.left = '0px'; img.style.top = '0px';
      const anim = img.animate([
        { transform: `translate(${sx}px, ${sy}px) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${(sx + ex) / 2}px, ${Math.min(sy, ey) - B.h * 0.18}px) rotate(${dir * 280}deg)`, offset: 0.5 },
        { transform: `translate(${ex}px, ${ey}px) rotate(${dir * 540}deg)` }
      ], { duration: opts.ms || 650, easing: 'ease-in', fill: 'forwards' });
      anim.onfinish = () => {
        if (opts.sound) sfx(opts.sound, 0.95);
        shake(el); flash(el);
        B.el.classList.add('hurt');
        img.animate([
          { transform: `translate(${ex}px, ${ey}px) rotate(${dir * 540}deg)` },
          { transform: `translate(${fx}px, ${fy}px) rotate(${dir * 640}deg)` }
        ], { duration: 450, easing: 'cubic-bezier(.3,1.4,.6,1)', fill: 'forwards' });
        if (opts.onHit) opts.onHit();
      };
    });
  }
  // kick an object (already in the scene) across the floor
  function kickProp(el, img, dir) {
    if (!el || !img) return;
    const stage = el.querySelector('.ewfp-stage');
    const sw = stage.getBoundingClientRect().width;
    const dist = Math.max(200, sw * 0.42) * (dir || 1);
    img.classList.remove('still');
    img.animate([
      { transform: 'translate(0,0) rotate(0deg)' },
      { transform: `translate(${dist * 0.55}px, -${stage.getBoundingClientRect().height * 0.18}px) rotate(${(dir || 1) * 200}deg)`, offset: 0.45 },
      { transform: `translate(${dist}px, 0px) rotate(${(dir || 1) * 450}deg)` }
    ], { duration: 900, easing: 'ease-out', fill: 'forwards' });
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
    if (cfg.matchType) cfg.matchType = safeType(cfg.matchType);
    // BATCH 16 ITEM 20: no title shot for an ICE COLD challenger
    if (cfg.titleCode && typeof window.ewfIceColdBlocksTitle === 'function' && window.ewfIceColdBlocksTitle([a && a.id, b && b.id], cfg.titleCode)) {
      try { if (typeof window.ewfToast === 'function') window.ewfToast(`❄️ ${window.ewfIceColdName([a.id, b.id], cfg.titleCode)} is ICE COLD. He hasn't earned a title shot!`); } catch (e) {}
      cfg = Object.assign({}, cfg, { titleCode: null });
    }
    const isTitle = !!cfg.titleCode;
    if (when === 'next') {
      const m = {
        w1: a, w2: b, matchType: cfg.matchType || 'Normal Match', formatKey: '1v1',
        isTitleMatch: isTitle, titleCode: isTitle ? cfg.titleCode : null,
        titleName: isTitle ? TITLE_NAMES[cfg.titleCode] : null, titleImg: isTitle ? TITLE_IMGS[cfg.titleCode] : null,
        isCareerMatch: false, storyType: 'callout', originText: cfg.origin || 'Booked by GM Ellis'
      };
      let ok16 = true;
      try { ok16 = (window.ewfQueueBooking ? window.ewfQueueBooking(m) : (localStorage.setItem('ewf_scheduled_story_match', JSON.stringify(m)), true)) !== false; } catch (e) {}
      if (!ok16) { done && done(); return; }
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
    log(bad ? `${bm('BAD GUY TURN')}: ${NM(w)} has turned their back on the fans! (${t.why})` : `⭐ GOOD GUY TURN: ${NM(w)} has won the fans back! (${t.why})`, 'match');
    fallout('cutscene', bad ? bm(`${NM(w)} TURNED BAD GUY!`) : `⭐ ${NM(w)} TURNED GOOD GUY!`);
    scene({
      bg: bad ? 'bad_guy_turn_bg.png' : 'good_guy_turn_bg.png',
      title: bad ? bm(`${NM(w)} HAS TURNED BAD GUY!`) : `⭐ ${NM(w)} IS A GOOD GUY AGAIN! ⭐`,
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
      ? `Whoa, GM! <b>${w.name}</b> just turned <b>BAD GUY</b>! Bad guys get a <b>red name${BADMARK ? ' and a ' + BADMARK : ''}</b> on their card. They cheat, they attack after the bell, and the fans boo them. Every hero needs a villain!`
      : `What a moment, GM! <b>${w.name}</b> is a <b>GOOD GUY</b> again. Do enough good deeds, like making a save, and even the worst bad guy can win the fans back!`, 1600);
  }

  function nudgeBadGuy(done) {
    const st = load();
    st.lastNudge = st.matchNo; save(st);
    const pool = fit().sort((a, b) => {
      const ta = TEND_RANK[tendencyOf(a.id)], tb = TEND_RANK[tendencyOf(b.id)];
      if (ta !== tb) return ta - tb;
      const da = st.deeds[a.id] || { b: 0, g: 0 }, db = st.deeds[b.id] || { b: 0, g: 0 };
      return (db.b - db.g) - (da.b - da.g);
    }).slice(0, 4);
    if (!pool.length) return done();
    scene({
      bg: 'bad_guy_turn_bg.png', title: bm('THE EWF NEEDS A BAD GUY!'), titleBg: 'linear-gradient(180deg,#b71c1c,#1a0000)',
      center: pool[0],
      text: `GM, everyone's a good guy right now... and every hero needs a <b>VILLAIN</b> to beat! Who's going to turn their back on the fans?`,
      buttons: [...pool.map(w => ({ label: bm(w.name), cls: 'red', fn: () => { closeScene(); playTurn({ id: w.id, to: 'bad', why: 'Chosen by GM Ellis to be the EWF\'s big bad' }, done); } })),
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
    const mic = { src: 'microphone.png', style: '', cls: 'still', anchor: { to: 'center', kind: 'mic' } };
    const micLeft = { src: 'microphone.png', style: '', cls: 'still', anchor: { to: 'left', kind: 'mic' } };
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
        bg: 'catering_bg.png', title: `💤 ${NM(w)}: "I'M SICK OF SITTING IN CATERING!"`, titleBg: 'linear-gradient(180deg,#616161,#212121)',
        center: w,
        text: `<b>${w.name}</b> throws down a plate of sandwiches: <i>"I've been sat back here for ages! Put me in a match, GM!"</i>`,
        buttons: whenButtons(when => {
          if (when === 'no') return refuse(`<b>${w.name}</b> kicks over the snack table and storms off. Someone's in a mood...`, 'bin_crash.mp3', () => deed(w.id, -1, 'Threw a tantrum in catering'));
          bookFlow(vs, { stake: '💤 OUT OF CATERING' }, when, `${NM(w)} is out of catering to face ${NM(vs)}!`);
        }, Object.assign({ noLabel: '⏳ WAIT YOUR TURN' }, opts))
      });
      bret('callout_catering', `This superstar is <b>💤 FED UP</b> because they haven't had a match in ages. Keep everyone busy, GM, or they get grumpy!`);
    } else if (c.type === 'walking') {
      const top = fit().filter(x => x.id !== w.id).sort((a, b) => (momentum(b.id).wins || 0) - (momentum(a.id).wins || 0))[0];
      if (!top) return done();
      scene({
        bg: 'gm_office_bg.png', title: `❄️ ${NM(w)}: "BIG MATCH OR I'M WALKING!"`, titleBg: 'linear-gradient(180deg,#0277bd,#01243d)',
        center: w,
        text: `<b>${w.name}</b> has lost too many and they've had enough: <i>"Give me a <b>BIG</b> match, GM. Against <b>${top.name}</b>. Or I'm walking out that door!"</i>`,
        buttons: whenButtons(when => {
          if (when === 'no') return refuse(`<b>${w.name}</b> storms out and <b>SLAMS</b> the door so hard the GM's trophies rattle!`, 'door_slam.mp3', () => { const s2 = load(); s2.lastMatch[w.id] = s2.matchNo - 8; save(s2); });
          bookFlow(top, { matchType: 'Hardcore Match', stake: '❄️ BIG MATCH OR WALK' }, when, `${NM(w)} gets the big match against ${NM(top)}!`);
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
        bg: 'hospital_escape_bg.png', title: `🌋 ${NM(w)}: "I WANT THE ONE WHO PUT ME OUT!"`, titleBg: 'linear-gradient(180deg,#d50000,#3d0000)',
        left: w, right: c.vs, objects: [micLeft],
        text: `<b>${w.name}</b> is back from injury... and they've only got one name on their mind: <b>${c.vs.name}</b>! <i>"You put me in the hospital. Now it's PAYBACK!"</i>`,
        buttons: whenButtons(when => {
          if (when === 'no') return refuse(`Not yet! But <b>${w.name}</b> won't forget...`, null, () => { const s2 = load(); makeFurious(w.id, c.vs.id, `Wants payback on ${c.vs.name}`, s2); save(s2); });
          bookFlow(c.vs, { matchType: 'Hardcore Match', stake: '🌋 PAYBACK MATCH' }, when, `${NM(w)} gets payback on ${NM(c.vs)}!`);
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
        bg: 'show_bg.png', title, left: att, right: vic,
        text: why, buttons: []
      });
      if (isBad(att.id)) sfx('crowd_boo.mp3', 0.8);
      // BATCH 15: the chair flies from the attacker and smacks the victim
      setTimeout(() => { if (sceneEl === el) throwProp(el, 'steel_chair.png', 'left', 'right', { size: 0.5, ms: 500, sound: 'sounds/' + encodeURIComponent('fx - chair shot.mp3') }); }, 650);
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
          bret('beatdown', `That's a <b>POST-MATCH BEATDOWN</b>, GM! Bad guys and furious superstars do this. The victim is now <b>🌋 FURIOUS</b> and wants revenge!`);
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

  /* ---------- Batch 11 item 8: unlock screens always go first ---------- */
  function visible(id) {
    const el = document.getElementById(id);
    if (!el) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0;
  }
  function unlockBusy() {
    if (window.activeDebutFinishHandler) return true;
    if (['levelUpOverlay', 'unlockShowcaseOverlay', 'welcomeInductionModal'].some(visible)) return true;
    // BATCH 16 ITEM 7: the lights-out strobe before a superstar's reveal video, the reveal video itself and gift reveals
    if (['lightsOutOverlay', 'debutSkipIntroBtn', 'contractSigningModal', 'ewfTrophy16'].some(visible)) return true;
    if (window.__ewfUnlockSequence) return true;
    const ach = document.getElementById('achievementPopup');
    if (ach && ach.classList.contains('show')) return true;
    const q = window.queuedLevelUps || (typeof queuedLevelUps !== 'undefined' ? queuedLevelUps : []);
    return Array.isArray(q) && q.length > 0;
  }
  window.ewfUnlockBusy = unlockBusy;
  // run fn once nothing celebratory is on screen (gives up waiting after 2 minutes)
  function whenFree(fn, delay) {
    const started = Date.now();
    const tryRun = () => {
      if (unlockBusy() && Date.now() - started < 120000) {
        const q = window.queuedLevelUps || [];
        const anyShown = ['levelUpOverlay', 'unlockShowcaseOverlay', 'welcomeInductionModal'].some(visible) || window.activeDebutFinishHandler;
        if (q.length && !anyShown && typeof checkNextQueuedLevelUp === 'function' && !window.isMatchPostScreenActive) { try { checkNextQueuedLevelUp(); } catch (e) {} }
        return setTimeout(tryRun, 600);
      }
      fn();
    };
    setTimeout(tryRun, delay === undefined ? 380 : delay);
  }
  window.ewfWhenFree = whenFree;
  function wrapStoryOpen() {
    const orig = window.openStorylineModal;
    if (typeof orig !== 'function') return;
    window.openStorylineModal = function (...args) {
      // BATCH 16 ITEM 7: wait for unlocks AND their reveal videos, coronations, other cutscenes etc.
      const busy16 = () => unlockBusy() || (typeof window.ewfScreenBusy === 'function' && window.ewfScreenBusy());
      if (busy16()) {
        const started = Date.now();
        const retry = () => {
          if (busy16() && Date.now() - started < 180000) return setTimeout(retry, 600);
          window.openStorylineModal(...args);
        };
        if (unlockBusy()) whenFree(retry, 600); else setTimeout(retry, 600);
        return;
      }
      return orig.apply(this, args);
    };
    try { openStorylineModal = window.openStorylineModal; } catch (e) {}
  }

  /* ---------- Batch 11 items 6 & 7: lock-safe match types and the new shows' themes ---------- */
  // BATCH 16 ITEMS 17 & 25: fallbacks chain (Hardcore is a code-card present now) and work for
  // "Triple Threat X" / "Fatal 4-Way X" too
  const LOCK_SWAP = {
    'TLC Match': ['Tables Match', 'Hardcore Match', 'Falls Count Anywhere'],
    'Ambulance Match': ['Last Man Standing'],
    'Tables Match': ['Hardcore Match', 'Falls Count Anywhere'],
    'Hardcore Match': ['Falls Count Anywhere', 'Last Man Standing'],
    'Steel Cage Match': ['Hardcore Match', 'Last Man Standing', 'Falls Count Anywhere']
  };
  function safeType(t) {
    try {
      if (!t || typeof isMatchTypeLocked !== 'function') return t;
      const m = String(t).match(/^(Triple Threat |Fatal 4-Way )(.*)$/);
      const pre = m ? m[1] : '', base = m ? m[2] : t;
      if (!isMatchTypeLocked(base).locked) return t;
      const alt = (LOCK_SWAP[base] || []).find(x => !isMatchTypeLocked(x).locked) || 'Normal Match';
      return pre + alt;
    } catch (e) {}
    return t;
  }
  window.ewfSafeMatchType = safeType;

  function recastMain(bouts, a, b, cfg, activeW) {
    const main = bouts[bouts.length - 1];
    if (!main || !a || !b) return;
    const orig = (main.participants || []).filter(Boolean);
    const freed = orig.filter(p => p.id !== a.id && p.id !== b.id);
    main.participants = [a, b];
    main.formatKey = '1v1';
    if (main.matchType === 'Royal Rumble Match') main.matchType = 'Normal Match';
    if (cfg.matchType) main.matchType = safeType(cfg.matchType);
    if (cfg.stake) main.feudStake = cfg.stake;
    if (main.referee && (main.referee.id === a.id || main.referee.id === b.id)) main.referee = null;
    if (main.isTitleMatch) {
      const h = typeof getTitleHolders === 'function' ? (getTitleHolders() || {}) : {};
      const holder = main.titleCode === 'tag' ? null : h[main.titleCode];
      if (!holder || (holder !== a.id && holder !== b.id)) { main.isTitleMatch = false; main.titleCode = null; main.titleName = null; main.titleImg = null; }
    }
    const used = new Set([a.id, b.id]);
    bouts.slice(0, -1).forEach(bt => (bt.participants || []).forEach(p => p && used.add(p.id)));
    const spare = () => freed.shift() || (activeW || []).find(w => !used.has(w.id) && (used.add(w.id) || true));
    bouts.slice(0, -1).forEach(bt => {
      if (bt.referee && (bt.referee.id === a.id || bt.referee.id === b.id)) bt.referee = null;
      bt.participants = (bt.participants || []).map(p => {
        if (p && (p.id === a.id || p.id === b.id)) { const r = spare(); if (r) used.add(r.id); return r || null; }
        return p;
      });
      if (bt.participants.some(p => !p)) bt._drop = true;
    });
    for (let i = bouts.length - 2; i >= 0; i--) if (bouts[i]._drop) bouts.splice(i, 1);
  }

  window.ewfPostProcessShowCard = function (showKey, bouts, activeW) {
    bouts = (bouts || []).filter(Boolean);
    bouts.forEach(b => { if (b.matchType) b.matchType = safeType(b.matchType); });
    const main = bouts[bouts.length - 1];
    const special = ['rumble', 'kotr', 'mitb'];
    const canTheme = main && !main.isSanctionedContract && !special.includes(main.formatKey);
    const st = load();
    const ok = (w) => w && activeW.some(x => x.id === w.id);
    if (showKey === 'nomercy') {
      const solo = ['Hardcore Match', 'Falls Count Anywhere', 'Tables Match', 'Last Man Standing', 'Ambulance Match'];
      const tag = ['Hardcore Match', 'Tables Match', 'Ladder Match'];
      bouts.forEach(b => {
        if (special.includes(b.formatKey) || b.isSanctionedContract) return;
        b.matchType = safeType(pick(b.formatKey === 'tag' ? tag : solo));
      });
      if (canTheme) main.feudStake = '🚫 NO MERCY MAIN EVENT: ANYTHING GOES';
      bret('show_nomercy', `Welcome to <b>NO MERCY</b>, GM! Tonight there are no rules: <b>Hardcore matches, tables, falls count anywhere</b>. Grab every weapon you've got!`, 1500);
    } else if (showKey === 'badblood' && canTheme) {
      let pair = null;
      try {
        const rivs = getRivalries().filter(r => r && ok(byId(r.w1)) && ok(byId(r.w2))).sort((x, y) => (y.heat || 1) - (x.heat || 1));
        if (rivs.length) pair = [byId(rivs[0].w1), byId(rivs[0].w2)];
      } catch (e) {}
      if (!pair) {
        const k = Object.keys(st.rel).filter(k => ['badblood', 'jealous'].includes(st.rel[k].t)).map(k => k.split('|').map(byId)).filter(p => ok(p[0]) && ok(p[1]));
        if (k.length) pair = k[k.length - 1];
      }
      if (pair) recastMain(bouts, pair[0], pair[1], { matchType: 'Hardcore Match', stake: '💢 BAD BLOOD MAIN EVENT: SETTLE THE GRUDGE' }, activeW);
      bret('show_badblood', `It's <b>BAD BLOOD</b>, GM! The main event is always the two superstars who hate each other the most. Time to settle the grudge!`, 1500);
    } else if (showKey === 'judgmentday' && canTheme) {
      const bads = activeW.filter(w => isBad(w.id, st)).sort((x, y) => (momentum(y.id).wins || 0) - (momentum(x.id).wins || 0));
      const goods = activeW.filter(w => !isBad(w.id, st));
      if (bads.length && goods.length) {
        const villain = bads[0];
        const rival = goods.find(g => (getRel(g.id, villain.id, st) || {}).t === 'badblood');
        const hero = rival || goods.sort((x, y) => (momentum(y.id).wins || 0) - (momentum(x.id).wins || 0))[0];
        recastMain(bouts, hero, villain, { stake: '⚖️ JUDGMENT DAY: GOOD GUY VS BAD GUY' }, activeW);
      }
      bret('show_judgmentday', `<b>JUDGMENT DAY</b> is here! The main event is <b>GOOD GUY vs BAD GUY</b>. Will the villain finally get what's coming to them?`, 1500);
    }
    return bouts;
  };

  function wrapQueueBout() {
    const orig = window.queueCutsceneBoutIntoShow;
    if (typeof orig !== 'function') return;
    window.queueCutsceneBoutIntoShow = function (cfg) {
      if (cfg && cfg.matchType) cfg.matchType = safeType(cfg.matchType);
      return orig.call(this, cfg);
    };
  }

  /* ---------- Batch 11 item 11: proper results on the show card ---------- */
  let lastSlammed = null;
  function decorateShowCard() {
    try {
      const sess = window.activeShowSession;
      const box = document.getElementById('bookShowBoutsContainer');
      if (!sess || !box) return;
      // the XP at stake was always shown as 150; show the real amount for this show
      const xpEl = document.getElementById('bookShowXpStake');
      if (xpEl) {
        const k = sess.showKey;
        const xp = sess.customXp || ((k === 'raw' || k === 'smackdown') ? 150 : ((k === 'summerslam' || k === 'mania') ? 600 : 350));
        xpEl.textContent = `+${xp} XP AT STAKE`;
      }
      const strips = [...box.querySelectorAll('.bs-bout-strip')];
      sess.bouts.forEach((bout, idx) => {
        const row = strips[idx];
        if (!row || idx >= sess.currentBoutIdx || bout.formatKey === 'rumble') return;
        const winIds = (Array.isArray(bout.winnerObjs) && bout.winnerObjs.length ? bout.winnerObjs : [{ id: bout.winnerId }]).map(w => w && w.id);
        const thumbs = [...row.querySelectorAll('.bsb-fighter-thumb')];
        thumbs.forEach((img, i) => {
          const p = bout.participants[i];
          const wrap = img.closest('.bsb-fighter-thumb-wrap');
          if (!p || !wrap) return;
          [...wrap.children].forEach(ch => { if (ch !== img && /WINNER/.test(ch.textContent || '')) ch.remove(); });
          // tag partners overlap, so only the front photo of each team carries the ribbon / stamp
          const isTag = bout.formatKey === 'tag';
          const front = !isTag || i === 0 || i === 2;
          if (winIds.includes(p.id)) {
            wrap.classList.add('bsb-win');
            img.style.filter = '';
            if (front && !wrap.querySelector('.bsb-win-ribbon')) wrap.insertAdjacentHTML('beforeend', `<div class="bsb-win-ribbon">🏆 ${isTag ? 'WINNERS' : 'WINNER'}</div>`);
          } else if (front && !wrap.querySelector('.bsb-lose-stamp')) {
            wrap.insertAdjacentHTML('beforeend', '<div class="bsb-lose-stamp">DEFEATED</div>');
          }
        });
        row.querySelectorAll('.bsb-fighter').forEach((f, i) => {
          const nm = f.querySelector('.bsb-fighter-name');
          const p = bout.participants[i];
          if (!nm || !p || bout.formatKey === 'tag') return;
          nm.classList.add(winIds.includes(p.id) ? 'bsb-win-name' : 'bsb-lose-name');
        });
        const stamp = row.querySelector('.bsb-result-stamp');
        if (stamp && !stamp.classList.contains('bsb-res')) {
          const r = Math.max(0, Math.min(5, bout.rating || 0));
          let extra = '';
          if (bout.titleWon) extra = `<div class="champ"><img src="${bout.titleImg || 'whc.png'}" alt="">🏆 NEW CHAMPION${(bout.winnerObjs || []).length > 1 ? 'S' : ''}!</div>`;
          else if (bout.titleRetained) extra = `<div class="kept">🛡️ RETAINED</div>`;
          stamp.className = 'bsb-res';
          stamp.innerHTML = `<div class="stars">${'★'.repeat(r)}${'☆'.repeat(5 - r)}</div>${extra}${bout.matchTime ? `<div class="time">⏱️ ${bout.matchTime}</div>` : ''}`;
        }
        // the result that just happened slams in
        const key = (sess.showKey || '') + ':' + idx + ':' + (bout.winnerId || '');
        if (idx === sess.currentBoutIdx - 1 && lastSlammed !== key) {
          lastSlammed = key;
          row.classList.add('ewfp-slam');
          setTimeout(() => {
            try { const a = typeof matchCardSlamSound !== 'undefined' ? matchCardSlamSound : new Audio('match_card_slam.mp3'); a.currentTime = 0; a.volume = 0.7; a.play().catch(() => {}); } catch (e) {}
            const c = sfx('crowd.mp3', 0.45); if (c) setTimeout(() => { try { c.pause(); } catch (e) {} }, 2200);
            shake(row);
          }, 120);
        }
      });
    } catch (e) { console.warn('decorateShowCard', e); }
  }
  function wrapShowCard() {
    const orig = window.renderBookShowCardModal;
    if (typeof orig !== 'function') return;
    window.renderBookShowCardModal = function (...a) { const r = orig.apply(this, a); decorateShowCard(); return r; };
    try { renderBookShowCardModal = window.renderBookShowCardModal; } catch (e) {}
  }

  /* ---------- Main hook: after every match ---------- */
  // Returns true if it took over (and will call ctx.done when finished)
  function afterBout(ctx) {
    try {
      const st = load();
      if (!ctx || !ctx.winner) return false;
      const go = (fn) => { whenFree(() => { try { fn(); } catch (e) { console.warn(e); closeScene(); ctx.done(); } }); return true; };

      // 1. queued turns always play first
      if (st.pendingTurns.length) {
        const t = st.pendingTurns[0];
        if (byId(t.id)) return go(() => playTurn(t, ctx.done));
        st.pendingTurns.shift(); save(st);
      }

      // 1b. Batch 13: the Commissioner (Stephanie McMahon) can step in
      if (typeof window.ewfCommissionerHook === 'function') {
        try { if (window.ewfCommissionerHook(ctx, go)) return true; } catch (e) { console.warn(e); }
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
      whenFree(() => { try { runBackstage(seg, W, L, outs, rowPair, done); } catch (e) { console.warn(e); closeScene(); done(); } });
      return true;
    } catch (e) { return false; }
  }

  function runBackstage(seg, W, L, outs, rowPair, done) {
    const skip = () => done();
    const first = () => bret('backstage', `We're going <b>BACKSTAGE</b>! Things happen behind the scenes too. Sometimes you get to decide what happens next. Tap <b>SKIP</b> if you just want the next match.`);
    if (seg === 'stormOff') {
      scene({ bg: 'backstage_corridor_bg.png', title: `🎥 BACKSTAGE: ${NM(L)} STORMS OFF`, left: L, skip,
        objects: [{ src: 'trash_bin.png', style: '', cls: 'still', anchor: { to: 'left', kind: 'bin' } }],
        text: `A furious <b>${L.name}</b> marches up the corridor after losing to <b>${W ? W.name : 'their opponent'}</b>... and boots a bin across the hallway!`, buttons: cont(done) });
      const binScene = sceneEl;
      setTimeout(() => {
        if (sceneEl !== binScene) return;
        kickProp(binScene, binScene.querySelector('.ewfp-obj'), 1);
        sfx('bin_crash.mp3', 0.9); shake();
      }, 1500);
      setTimeout(() => sfx('locker_slam.mp3', 0.7), 2600);
      if (W) { const st = load(); setRel(L.id, W.id, 'badblood', `lost to them and stormed off`, null, st); save(st); }
      log(`🎥 BACKSTAGE: ${NM(L)} stormed off after the loss and trashed the corridor!`, 'match');
    } else if (seg === 'interview') {
      const st = load();
      const target = badBloodOf(W.id, st, [L && L.id]) || pick(outs.length ? outs : fit().filter(x => x.id !== W.id));
      if (!target) return done();
      const ivEl = scene({ bg: 'interview_bg.png', title: `🎤 BACKSTAGE INTERVIEW: ${NM(W)}`, titleBg: 'linear-gradient(180deg,#1565c0,#0d2a5c)', left: W, skip,
        leftStyle: 'left: 20%; height: 92%;',
        objects: [
          { src: 'microphone.png', style: '', cls: 'still', anchor: { to: 'left', kind: 'mic' } },
          { src: 'cameraman.png', style: '', cls: 'still', anchor: { to: 'left', kind: 'cameraman' } }
        ],
        text: `<b>${W.name}</b> grabs the interviewer's mic: <i>"I just won, and I'm only getting started. <b>${target.name}</b>, you're NEXT!"</i><br>Does <b>${target.name}</b> accept?`,
        buttons: [
          { label: '✅ ACCEPT', cls: 'green', fn: () => { closeScene(); log(`🎤 CALLOUT ACCEPTED: ${NM(target)} accepted ${NM(W)}'s challenge!`, 'match'); bookMatch(W, target, { stake: '🎤 BACKSTAGE CHALLENGE' }, 'next', done); } },
          { label: '🙉 IGNORE', cls: '', fn: () => { closeScene(); done(); } }
        ] });
      setTimeout(() => sfx('mic_feedback.mp3', 0.6), 500);
      // the superstar being called out appears on a backstage monitor
      setTimeout(() => {
        if (!sceneEl || sceneEl !== ivEl) return;
        const mon = document.createElement('div');
        mon.className = 'ewfp-monitor';
        mon.innerHTML = `<img src="${target.image}" alt="${target.name}"><div>● LIVE</div><span>${NM(target)} IS WATCHING...</span>`;
        sceneEl.querySelector('.ewfp-stage').appendChild(mon);
        sfx('cctv_static.mp3', 0.35);
      }, 1500);
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
            save(s2);
            log(`🚗 CAR PARK AMBUSH: ${NM(att)} jumped ${NM(vic)}${inTime ? ', but security broke it up!' : ' and security were too late!'}`, 'interference');
            update(inTime ? `Security pile in and drag <b>${att.name}</b> away! <b>${vic.name}</b> is OK... but they're not happy.` : `<b>TOO LATE!</b> By the time security arrive, <b>${vic.name}</b> is laid out next to their car. There's <b>BAD BLOOD</b> now!`, cont(done),
              () => { if (!inTime && sceneEl) { const r = sceneEl.querySelector('.ewfp-pose.right'); r && r.classList.add('hurt'); } });
          } },
          { label: '🍿 LET IT PLAY OUT', cls: '', fn: () => {
            const s2 = load();
            setRel(att.id, vic.id, 'badblood', 'ambushed them in the car park', null, s2);
            deed(att.id, -1, 'Ambushed someone in the car park', s2);
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
      const rowEl = scene({ bg: 'locker_room_bg.png', title: `🥊 LOCKER ROOM ROW!`, left: a, right: b, skip,
        text: `Shouting in the locker room! <b>${a.name}</b> and <b>${b.name}</b> are nose to nose... then <b>${a.name}</b> launches a chair at <b>${b.name}</b>!`, buttons: cont(done) });
      setTimeout(() => { sfx('locker_slam.mp3', 0.9); shake(); }, 600);
      setTimeout(() => { if (sceneEl === rowEl) throwProp(rowEl, 'steel_chair.png', 'left', 'right', { size: 0.5, sound: 'sounds/' + encodeURIComponent('fx - chair shot.mp3') }); }, 1300);
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
            save(s2);
            log(`📹 CCTV REVEAL: The mystery attacker who laid out ${NM(vic)} was ${NM(att)}!`, 'interference');
            update(`IT WAS <b>${NM(att)}</b>! Caught red-handed on camera. There's <b>BAD BLOOD</b> between them now!`, cont(done));
          }, 2600);
        } }] });
    } else return done();
    first();
  }

  /* ---------- In-match: random run-ins, evening the odds, fake-outs, cheating ---------- */
  const live = { at: null, done: false, evenAt: null, victimId: null, attackerId: null, cheatAt: null };
  function resetLive() {
    const m = typeof activeBookedMatch !== 'undefined' ? activeBookedMatch : {};
    const bigShows = ['mania', 'summerslam', 'survivor', 'backlash', 'mitb', 'rumble', 'kotr', 'badblood', 'judgmentday', 'nomercy'];
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
      if (typeof window.ewfCommissionerTick === 'function' && window.ewfCommissionerTick(sec)) return;
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
    const lines = [`${bm('')}${NM(w)} GRABBED A STEEL CHAIR BEHIND THE REF'S BACK!`, `${bm('')}${NM(w)} IS PULLING THE TIGHTS! THE REF DIDN'T SEE IT!`, `${bm('')}${NM(w)} THREW DUST IN THEIR OPPONENT'S EYES!`, `${bm('')}${NM(w)} DISTRACTED THE REFEREE!`];
    b.innerHTML = `<img src="steel_chair.png" style="height:60px;" onerror="this.remove()"><span>${pick(lines)}</span>`;
    host().appendChild(b);
    sfx('crowd_boo.mp3', 0.75);
    log(`${bm('CHEATING:')} ${NM(w)} broke the rules behind the referee's back!`, 'interference');
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
          if (!h3.querySelector('.bad-guy-mark')) BADMARK && h3.insertAdjacentHTML('beforeend', `<span class="bad-guy-mark">${BADMARK}</span>`);
        }
        // rivalry tile, bottom left (⚔️, ⚔️2, or 💀 for a Blood Feud)
        const rb = card.querySelector('.rival-badge');
        if (rb) {
          const t = rb.textContent || '';
          const tile = document.createElement('div');
          const n = (t.match(/(\d+)\s*RIVAL/) || [])[1];
          tile.className = 'rival-tile' + (/BLOOD FEUD/.test(t) ? ' blood' : '');
          tile.title = t.trim();
          tile.innerHTML = /BLOOD FEUD/.test(t) ? '💀' : `⚔️${n ? `<small>${n}</small>` : ''}`;
          card.appendChild(tile);
        }
        // defence count sits on the belt instead of covering the name
        const pill = card.querySelector('.defense-counter-pill');
        const belts = card.querySelector('.title-badges-container');
        if (pill && belts) {
          const n = (pill.textContent.match(/\d+/) || [])[0];
          if (n) { const c = document.createElement('div'); c.className = 'belt-def-count'; c.title = pill.textContent; c.textContent = n; belts.appendChild(c); }
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
      if (anyMood) bret('moodBadge', `See that badge in the <b>bottom right corner</b> of a card? That's the superstar's <b>MOOD</b>! 👑 Cocky, 💪 Hungry, 💤 Fed up, 👀 Jealous, 🌋 Furious. Check the <b>SUPERSTARS</b> tab in the EWF Universe to find out why!`, 900);
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
          whenFree(() => { const s2 = load(); if (s2.pendingTurns.length && !document.querySelector('.ewfp-scene')) playTurn(s2.pendingTurns[0], () => {}); }, 500);
        }
      } catch (e) {}
      return r;
    };
    try { closeStorylineModal = window.closeStorylineModal; } catch (e) {}
  }

  /* ---------- SUPERSTARS tab (EWF Universe) ---------- */
  let selId = null;
  const REL_LABEL = { mates: '🤝 MATES', badblood: '💢 BAD BLOOD', jealous: '👀 JEALOUS OF', respect: '🙌 RESPECT' };
  const REL_COL = { mates: '#00e676', badblood: '#ff1744', jealous: '#b388ff', respect: '#ffd700' };

  function ensureTab() {
    const tabs = document.querySelector('#universeModal .universe-tabs');
    if (!tabs || document.getElementById('tabBtnSuperstars')) return;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'universe-tab-btn'; btn.id = 'tabBtnSuperstars';
    btn.innerHTML = '⭐ Superstars';
    btn.onclick = () => switchUniverseTab('superstars');
    tabs.insertBefore(btn, tabs.firstChild); // Batch 11 item 17: SUPERSTARS first
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
      <div><b>${bm('BAD GUYS')}</b>${bads.length ? bads.map(w => w.name).join(', ') : 'None! Everyone\'s a good guy'}</div>
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
        <div style="color:${isBad(w.id, st) ? '#ff1744' : '#fff'}">${w.name}${isBad(w.id, st) && BADMARK ? ' ' + BADMARK : ''}</div></div>`;
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
      if (r.t === 'jealous') label = r.by === w.id ? '👀 JEALOUS OF' : '👀 IS JEALOUS OF THEM';
      return `<div class="ewfp-rel"><span><b style="color:${REL_COL[r.t]}">${label}</b> ${o.name}</span><span style="color:#aaa; font-size:0.75rem; text-align:right;">${r.why || ''}</span></div>`;
    }).join('') : '<div style="color:#888;">No relationships yet. They\'ll build up as matches happen!</div>';
    const others = roster().filter(o => o.id !== w.id).map(o => `<option value="${o.id}">${o.name}</option>`).join('');
    el.innerHTML = `
      <h3 style="color:${bad ? '#ff1744' : '#4fc3f7'}">${w.name.toUpperCase()} ${bad ? bm('BAD GUY') : '⭐ GOOD GUY'}${tendencyOf(w.id) === 'likely' ? ' <span style="font-size:0.7rem; color:#ff8a80; border:1px solid #ff8a80; padding:1px 5px; vertical-align:middle;">🐍 BORN VILLAIN</span>' : (tendencyOf(w.id) === 'unlikely' ? ' <span style="font-size:0.7rem; color:#ffd700; border:1px solid #ffd700; padding:1px 5px; vertical-align:middle;">⭐ FAN FAVOURITE</span>' : '')}</h3>
      <div class="ewfp-row"><b>FORM:</b> ${form} (${mom.wins || 0} wins in last ${mom.total || 0})${titles.length ? ` &nbsp; <b>🏆</b> ${titles.map(t => TITLE_NAMES[t]).join(', ')}` : ''}</div>
      <div class="ewfp-row"><b>MOOD:</b> ${m ? `<span style="color:${MOODS[m.k].col}">${MOODS[m.k].e} ${MOODS[m.k].label}</span> <span style="color:#aaa">(${m.why})</span>` : 'Calm'}</div>
      <div class="ewfp-row" style="margin-top:8px;"><b>RELATIONSHIPS</b></div>${typeof window.ewfProfileExtra === 'function' ? (window.ewfProfileExtra(w) || '') : ''}${relHTML}
      <div class="ewfp-gm">
        <button class="action-btn ${bad ? 'btn-blue' : 'btn-red'}" id="ewfpTurnBtn">${bad ? '⭐ MAKE GOOD GUY' : bm('MAKE BAD GUY')}</button>
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
      // Batch 11 item 17: the Universe opens on the SUPERSTARS tab
      window.openUniverseModal = function (...a) { ensureTab(); const r = origOpen.apply(this, a); try { window.switchUniverseTab('superstars'); } catch (e) {} return r; };
      try { openUniverseModal = window.openUniverseModal; } catch (e) {}
    }
  }

  /* ---------- Batch 11 item 13: Dad's PIN for Reset Universe and DEV UNLOCK, plus UNDO ---------- */
  const PIN_HASH = 'ef24131bf488185b28e4de0c48ca43c61ef79f5929ec45287312f5625023f6df'; // sha-256, never the PIN itself
  const UNDO_KEY = 'ewf_reset_undo';
  async function pinOk(pin) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ewf-pin-' + pin));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('') === PIN_HASH;
    } catch (e) { return false; }
  }
  function pinPad(opts, onOk) {
    ensureStyles();
    const old = document.getElementById('ewfPinPad'); if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'ewfPinPad';
    ov.style.cssText = 'position:fixed; inset:0; z-index:2147483646; background:rgba(20,0,0,0.92); display:flex; align-items:center; justify-content:center; padding:16px; box-sizing:border-box;';
    ov.innerHTML = `
      <div style="width:min(440px,100%); background:#0b0b10; border:3px solid #d50000; box-shadow:0 0 40px rgba(255,0,0,0.6); padding:18px; text-align:center; color:#fff;">
        <div style="font-family:'Russo One',sans-serif; font-size:1.5rem; color:#ff1744; letter-spacing:1px;">${opts.title}</div>
        <div style="font-size:0.95rem; margin:10px 0 14px 0; line-height:1.4;">${opts.text}</div>
        <div style="font-family:'Russo One',sans-serif; color:#ffd700; font-size:0.85rem; letter-spacing:2px;">ENTER DAD'S PIN</div>
        <div id="ewfPinDots" style="font-size:2rem; letter-spacing:12px; margin:8px 0 10px 0; min-height:2.4rem;">○○○○</div>
        <div id="ewfPinKeys" style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px; max-width:280px; margin:0 auto;"></div>
        <div style="display:flex; gap:10px; justify-content:center; margin-top:14px;">
          <button type="button" id="ewfPinCancel" class="ewfp-btn" style="background:linear-gradient(180deg,#00a152,#004d26);">${opts.cancelLabel || '✋ NO, KEEP EVERYTHING'}</button>
        </div>
      </div>`;
    host().appendChild(ov);
    let pin = '';
    const dots = ov.querySelector('#ewfPinDots');
    const draw = () => { dots.textContent = '●'.repeat(pin.length) + '○'.repeat(4 - pin.length); };
    const keys = ov.querySelector('#ewfPinKeys');
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].forEach(k => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = k; b.className = 'ewfp-btn';
      b.style.cssText = 'padding:14px 0; font-size:1.3rem;';
      b.onclick = async () => {
        if (k === 'C') pin = '';
        else if (k === '⌫') pin = pin.slice(0, -1);
        else if (pin.length < 4) pin += k;
        draw();
        if (pin.length === 4) {
          if (await pinOk(pin)) { ov.remove(); onOk(); }
          else { dots.textContent = '✖ WRONG PIN'; dots.style.color = '#ff1744'; shake(ov.firstElementChild); pin = ''; setTimeout(() => { dots.style.color = ''; draw(); }, 1100); }
        }
      };
      keys.appendChild(b);
    });
    ov.querySelector('#ewfPinCancel').onclick = () => ov.remove();
  }
  function withConfirmYes(fn) {
    const c = window.confirm;
    window.confirm = () => true;
    try { fn(); } finally { window.confirm = c; }
  }
  function wrapReset() {
    const orig = window.promptResetUniverse;
    if (typeof orig !== 'function') return;
    window.promptResetUniverse = function () {
      pinPad({
        title: '⚠️ RESET THE WHOLE EWF?',
        text: `This wipes <b>everything</b>: champions, rivalries, history, show archives, good guys and bad guys, relationships, GM level and XP, and every signed superstar.<br><b style="color:#ffd700;">It can only be undone until the next match is played.</b>`
      }, () => {
        let snapOk = false;
        try {
          const snap = {};
          for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k !== UNDO_KEY) snap[k] = localStorage.getItem(k); }
          localStorage.setItem(UNDO_KEY, JSON.stringify({ at: Date.now(), keys: snap }));
          snapOk = true;
        } catch (e) {}
        withConfirmYes(() => orig.apply(this, []));
        if (!snapOk) alert('Heads up: there was not enough space to keep an UNDO copy this time.');
      });
    };
    try { promptResetUniverse = window.promptResetUniverse; } catch (e) {}
  }
  function undoAvailable() {
    try {
      if (!localStorage.getItem(UNDO_KEY)) return false;
      const h = typeof getHistory === 'function' ? getHistory() : [];
      if (h.some(x => x && x.type === 'match' && / def\. /i.test(x.text || ''))) { localStorage.removeItem(UNDO_KEY); return false; }
      return true;
    } catch (e) { return false; }
  }
  window.ewfUndoReset = function () {
    try {
      const snap = JSON.parse(localStorage.getItem(UNDO_KEY) || 'null');
      if (!snap || !snap.keys) return;
      const keep = Object.keys(snap.keys);
      const now = []; for (let i = 0; i < localStorage.length; i++) now.push(localStorage.key(i));
      now.forEach(k => { if (k !== UNDO_KEY && !keep.includes(k)) localStorage.removeItem(k); });
      keep.forEach(k => localStorage.setItem(k, snap.keys[k]));
      localStorage.removeItem(UNDO_KEY);
      alert('✅ UNDONE! The EWF is back exactly as it was before the reset.');
      location.reload();
    } catch (e) { alert('Sorry, the undo did not work: ' + e.message); }
  };
  function wrapGMOffice() {
    const orig = window.openGMOffice;
    if (typeof orig === 'function') {
      window.openGMOffice = function (...a) {
        const r = orig.apply(this, a);
        try {
          let b = document.getElementById('ewfUndoResetBtn');
          const devBtn = [...document.querySelectorAll('#gmOfficeModal button')].find(x => /devCheatLevelUp/.test(x.getAttribute('onclick') || ''));
          if (undoAvailable() && devBtn) {
            if (!b) {
              b = document.createElement('button');
              b.id = 'ewfUndoResetBtn'; b.type = 'button'; b.className = 'action-btn btn-gold';
              b.style.cssText = 'flex:1; font-size:0.75rem; padding:10px;';
              b.textContent = '↩️ UNDO RESET';
              b.onclick = () => window.ewfUndoReset();
              devBtn.parentElement.appendChild(b);
            }
            b.style.display = '';
          } else if (b) b.style.display = 'none';
        } catch (e) {}
        return r;
      };
      try { openGMOffice = window.openGMOffice; } catch (e) {}
    }
    const dev = window.devCheatLevelUp;
    if (typeof dev === 'function') {
      window.ewfDevUnlockNoPin = dev; // for testing from the browser console only
      window.devCheatLevelUp = function () {
        pinPad({ title: '⚡ DEV: UNLOCK EVERYTHING?', text: 'This jumps to Level 20 and unlocks every show, match and superstar. It spoils all the surprises!' }, () => withConfirmYes(() => dev()));
      };
      try { devCheatLevelUp = window.devCheatLevelUp; } catch (e) {}
    }
  }

  /* ---------- Reset & backup lists ---------- */
  try {
    if (typeof EWF_BACKUP_KEYS !== 'undefined' && Array.isArray(EWF_BACKUP_KEYS) && !EWF_BACKUP_KEYS.includes(KEY)) EWF_BACKUP_KEYS.push(KEY);
  } catch (e) {}

  /* ---------- Batch 14 item 6: "RIGHT HERE, RIGHT NOW!" after a promo ---------- */
  // Promo videos that feature two superstars. FIGHT = they want a piece of each other, TOGETHER = side by side.
  const PROMO_TAGS = (() => {
    const T = {}, add = (kind, a, b, ids) => ids.forEach(id => { T[id] = { kind, a, b }; });
    const HHH = 'default-tripleh', ROCK = 'default-therock', SC = 'default-stonecold', TAKER = 'default-theundertaker', KANE = 'default-kane', PUNK = 'vault-cmpunk', ROMAN = 'vault-romanreigns';
    add('fight', PUNK, HHH, ['Y0aFlijwmB0']);
    add('fight', TAKER, HHH, ['By5R4qdcQZA']);
    add('fight', ROCK, HHH, ['1_D7Y6SJKek', 'n_b4y-ObpUo', 'I7v7_o2UP10', 'WU9yTHjpkJw', 'OAskS_mdKFU']);
    add('fight', SC, HHH, ['NzMxsqu78YI', 'JFEjVNN5VH8']);
    add('fight', KANE, HHH, ['HQAcJqsJcfM']);
    add('fight', TAKER, ROMAN, ['69h-qJZHfvM']);
    add('fight', TAKER, KANE, ['iaqhAixiENg', 'Pc4Ybq5dc-E', 'jPGL1s0ajCw']);
    add('fight', SC, ROCK, ['nL0MuSunn30', 'pgyt7ok7Ojg']);
    add('together', TAKER, KANE, ['r9Qo64l6Se0', 'nlIqOxxQPqM', 'sV49FdblNZw']);
    add('together', KANE, ROCK, ['ACFvfIzvmbU']);
    // BATCH 16 ITEM 11: Nicko's new promos (24 Nov)
    const SETH = 'default-sethrollins', CENA = 'vault-johncena', MANKIND = 'default-mankind';
    add('fight', SETH, PUNK, ['m6RSEF5PrJU', 'ju10AIkPSJM']);
    add('fight', SETH, HHH, ['mwU4bxVOyVI']);
    add('fight', SETH, ROMAN, ['thpIv9vHdnM', 'f-eKryHjFkI']);
    add('fight', ROMAN, SETH, ['SRFWb4Ia3r0']);
    add('fight', PUNK, CENA, ['RkQwM9Zy6uc', 'd0HBbLiMuj4', 'G01jxfxtH1g']);
    add('fight', PUNK, ROMAN, ['hQeDiGX1iQg']);
    add('fight', ROMAN, PUNK, ['9GdHfRd1HU8']);
    add('fight', PUNK, ROCK, ['mr8mfBRsD2s']);
    add('fight', TAKER, PUNK, ['2BrWgTgnluc']);
    add('fight', CENA, ROCK, ['E0NwBjrJ3Go', 'rnNue92RSC8']);
    add('fight', CENA, ROMAN, ['nJPhEq3MqNg', 'NhF7qFn_9Xw', 'wP-d8day9E8']);
    add('fight', ROMAN, TAKER, ['OSA3-buTMG0']);
    add('fight', MANKIND, TAKER, ['Cl2N5ULlPE4', 'FaTpGQ5BuY0', 'u7J8p6tHN1k']);
    add('fight', TAKER, MANKIND, ['1P7sr2LcfAU']);
    add('fight', MANKIND, ROCK, ['GVAUHXvZ6_I', 'rD2R1SScHc4']);
    add('fight', ROCK, MANKIND, ['Lrzgmd_gnzE']);
    add('together', ROCK, MANKIND, ['Sge3h_TbNj0']);
    add('fight', MANKIND, HHH, ['HrlnVvrGl3M']);
    add('fight', MANKIND, KANE, ['7oSWGHrK3Z0']);
    add('fight', TAKER, HHH, ['zntJWuOl95E']);
    T['dk0lWUR2dBE'] = { kind: 'fight', a: PUNK, b: ROMAN, c: SETH };   // all three in one promo: a Triple Threat
    return T;
  })();
  const NICK = {
    'default-theundertaker': 'THE DEADMAN', 'default-kane': 'THE BIG RED MACHINE', 'default-tripleh': 'THE GAME',
    'default-therock': 'THE PEOPLE\'S CHAMP', 'default-stonecold': 'THE RATTLESNAKE', 'vault-cmpunk': 'THE BEST IN THE WORLD',
    'vault-romanreigns': 'THE TRIBAL CHIEF', 'default-romanreigns': 'THE TRIBAL CHIEF',
    'default-sethrollins': 'THE ARCHITECT', 'vault-johncena': 'THE CHAMP', 'default-mankind': 'MANKIND'
  };
  const onRoster = (id) => {
    const r = roster();
    return r.find(w => w.id === id) || (id === 'vault-romanreigns' ? r.find(w => w.id === 'default-romanreigns') : null);
  };
  let pendingPromo = null;

  // BATCH 16 ITEM 11: a promo with three superstars sets up a Triple Threat
  function runRhrnTriple(tag, p) {
    let ws = [onRoster(tag.a), onRoster(tag.b), onRoster(tag.c)];
    if (ws.some(w => !w || injured(w.id))) return;
    if (p.speakerId) { const i = ws.findIndex(w => w.id === p.speakerId); if (i > 0) ws = [ws[i], ...ws.filter((_, k) => k !== i)]; }
    const [A, B, C] = ws;
    const inShow = !!window.activeShowSession;
    const addHeat = () => { const st = load(); [[A, B], [A, C], [B, C]].forEach(([x, y]) => { const r = getRel(x.id, y.id, st); if (!r || r.t === 'respect') setRel(x.id, y.id, 'badblood', 'traded words in a promo', null, st); }); save(st); };
    log(`🎤 RIGHT HERE, RIGHT NOW: ${NM(A)}, ${NM(B)} and ${NM(C)} all want each other!`, 'match');
    scene({
      bg: 'interview_bg.png', title: `🎤 ${NM(A)}, ${NM(B)} & ${NM(C)}: ALL THREE WANT IT!`, titleBg: 'linear-gradient(180deg,#d32f2f,#3a0000)',
      left: B, center: A, right: C,
      text: `<b>${A.name}</b>, <b>${B.name}</b> and <b>${C.name}</b> are all on the mic and nobody's backing down! A <b>TRIPLE THREAT</b>, GM?`,
      buttons: [
        { label: inShow ? '⚔️ TRIPLE THREAT TONIGHT!' : '⚔️ TRIPLE THREAT RIGHT NOW!', cls: 'red', fn: () => {
          addHeat(); closeScene();
          const ps = [A, B, C];
          if (inShow && typeof window.queueCutsceneBoutIntoShow === 'function') {
            window.queueCutsceneBoutIntoShow({ participants: ps, matchType: 'Normal Match', formatKey: 'triple', isTitleMatch: false, storyBypass: true, feudStake: '🎤 RIGHT HERE, RIGHT NOW!' });
            return;
          }
          try {
            activeStoryline = { id: 0, type: 'feud', matchMatch: 'Normal Match', formatKey: 'triple', isTitle: false, logText: '' };
            activeStoryWrestlerA = A; activeStoryWrestlerB = B;
            if (typeof launchStorylineMatch === 'function') launchStorylineMatch();
            if (activeBookedMatch) {
              activeBookedMatch.formatKey = 'triple'; activeBookedMatch.formatCount = 3;
              activeBookedMatch.participants = ps;
              storyBypassIds = ps.map(w => w.id);
              quickMatchQueue = [...ps];
              const list = document.getElementById('qmWrestlersList');
              if (list) list.innerHTML = ps.map((w, i) => `<div class="vs-wrestler"><img src="${w.image}" alt="${w.name}" onerror="handleImgError(this, '${w.id}')"><div>${w.name}</div></div>${i < 2 ? '<div class="vs-divider">VS</div>' : ''}`).join('');
            }
          } catch (e) { console.warn(e); }
        } },
        { label: '📋 SAVE IT FOR THE NEXT SHOW', cls: 'gold', fn: () => {
          addHeat();
          const ok = window.ewfQueueBooking ? window.ewfQueueBooking({ participants: [A, B, C], matchType: 'Normal Match', formatKey: 'triple', isTitleMatch: false, storyType: 'callout', feudStake: '🎤 RIGHT HERE, RIGHT NOW!', originText: 'Promo call-out' }) : false;
          if (ok === false) return closeScene();
          log(`📋 BOOKED FOR THE NEXT SHOW: ${NM(A)} vs ${NM(B)} vs ${NM(C)}!`, 'match');
          update(`It's booked! <b>${A.name}</b> vs <b>${B.name}</b> vs <b>${C.name}</b> is on the <b>NEXT SHOW</b>!`, cont(() => {}));
        } },
        { label: '✋ SQUASH IT', cls: '', fn: () => { closeScene(); } }
      ]
    });
    sfx('crowd.mp3', 0.6);
    flash();
  }

  function runRightHereRightNow(p) {
    const tag = PROMO_TAGS[p.vid];
    if (!tag) return;
    let A = onRoster(tag.a), B = onRoster(tag.b);
    if (!A || !B || injured(A.id) || injured(B.id)) return; // no spoilers, no hospital call-outs
    if (tag.c) return runRhrnTriple(tag, p);
    // the superstar Ellis tapped does the talking
    if (p.speakerId && B.id === p.speakerId) { const t = A; A = B; B = t; }
    const st0 = load();
    const rel = getRel(A.id, B.id, st0);
    const inShow = !!window.activeShowSession;

    if (tag.kind === 'fight') {
      const addHeat = () => {
        const st = load();
        const r = getRel(A.id, B.id, st);
        if (!r || r.t === 'respect') { setRel(A.id, B.id, 'badblood', 'traded words in a promo', null, st); save(st); }
      };
      log(`🎤 RIGHT HERE, RIGHT NOW: ${NM(A)} had a message for ${NM(B)}!`, 'match');
      scene({
        bg: 'interview_bg.png', title: `🎤 ${NICK[A.id] || NM(A)} HAS A MESSAGE FOR ${NM(B)}!`, titleBg: 'linear-gradient(180deg,#d32f2f,#3a0000)',
        left: A, right: B,
        text: `<b>${A.name}</b> wants <b>${B.name}</b>, and the crowd is going wild! What's it going to be, GM?`,
        buttons: [
          { label: inShow ? '⚔️ FIGHT TONIGHT!' : '⚔️ FIGHT RIGHT HERE, RIGHT NOW!', cls: 'red', fn: () => {
            addHeat(); closeScene();
            bookMatch(A, B, { stake: '🎤 RIGHT HERE, RIGHT NOW!', origin: 'Promo call-out' }, 'now', () => {});
          } },
          { label: '📋 SAVE IT FOR THE NEXT SHOW', cls: 'gold', fn: () => {
            addHeat();
            bookMatch(A, B, { origin: 'Promo call-out' }, 'next', () => update(`It's booked! <b>${A.name}</b> vs <b>${B.name}</b> is on the <b>NEXT SHOW</b>. The tension is building...`, cont(() => {})));
          } },
          { label: '✋ SQUASH IT', cls: '', fn: () => { closeScene(); } }
        ]
      });
      sfx('crowd.mp3', 0.6);
      flash();
    } else {
      log(`🎤 ${NM(A)} & ${NM(B)} stood side by side on the mic!`, 'match');
      scene({
        bg: 'interview_bg.png', title: `🤝 ${NM(A)} & ${NM(B)}: SIDE BY SIDE!`, titleBg: 'linear-gradient(180deg,#00897b,#00332d)',
        left: A, right: B,
        text: `<b>${A.name}</b> and <b>${B.name}</b> are standing together${rel && rel.t === 'badblood' ? '... even though there\'s <b>BAD BLOOD</b> between them!' : '!'} Shall we team them up, GM?`,
        buttons: [
          { label: '🤝 TEAM THEM UP!', cls: 'green', fn: () => {
            const st = load();
            const r = getRel(A.id, B.id, st);
            if (!r || r.t === 'respect') { setRel(A.id, B.id, 'mates', 'stood side by side in a promo', null, st); save(st); }
            closeScene();
            const opp = fit().filter(w => w.id !== A.id && w.id !== B.id).sort(() => Math.random() - 0.5).slice(0, 2);
            if (opp.length < 2) return;
            const ps = [A, B, opp[0], opp[1]];
            if (inShow && typeof window.queueCutsceneBoutIntoShow === 'function') {
              window.queueCutsceneBoutIntoShow({ participants: ps, matchType: 'Normal Match', formatKey: 'tag', isTitleMatch: false, storyBypass: true, feudStake: '🤝 TEAMED UP AFTER THEIR PROMO' });
              return;
            }
            try {
              activeStoryline = { id: 0, type: 'alliance', matchMatch: 'Normal Match', formatKey: 'tag', isTitle: false, logText: '' };
              activeStoryWrestlerA = A; activeStoryWrestlerB = B;
              if (typeof launchStorylineMatch === 'function') launchStorylineMatch();
              // launchStorylineMatch picks random opponents; use the fit ones we chose
              if (activeBookedMatch && activeBookedMatch.formatKey === 'tag') {
                activeBookedMatch.participants = ps;
                storyBypassIds = ps.map(w => w.id);
                quickMatchQueue = [...ps];
                const list = document.getElementById('qmWrestlersList');
                if (list) list.innerHTML = ps.map((w, i) => `<div class="vs-wrestler"><img src="${w.image}" alt="${w.name}" onerror="handleImgError(this, '${w.id}')"><div>${w.name}</div></div>${i < 3 ? `<div class="vs-divider">${i === 1 ? 'VS (TAG TEAM)' : 'VS'}</div>` : ''}`).join('');
              }
            } catch (e) { console.warn(e); }
          } },
          { label: 'NOT TONIGHT', cls: '', fn: () => { closeScene(); } }
        ]
      });
      sfx('locker_cheer.mp3', 0.7);
    }
  }

  function wrapPromos() {
    const vidOf = (u) => { const m = String(u || '').match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/); return m ? m[1] : null; };
    if (typeof window.loadAndPlayYouTube === 'function' && !window.loadAndPlayYouTube._rhrn) {
      const orig = window.loadAndPlayYouTube;
      window.loadAndPlayYouTube = function (url, isCashIn, hideMITB) {
        const out = orig.apply(this, arguments);
        pendingPromo = null;
        try {
          const vid = (typeof currentVideoId !== 'undefined' && currentVideoId) || vidOf(url);
          const speaker = (typeof currentPlayingWrestler !== 'undefined') ? currentPlayingWrestler : null;
          if (window.isPromoMode && hideMITB && vid && PROMO_TAGS[vid]) pendingPromo = { vid, speakerId: speaker && speaker.id };
        } catch (e) {}
        return out;
      };
      window.loadAndPlayYouTube._rhrn = true;
      try { loadAndPlayYouTube = window.loadAndPlayYouTube; } catch (e) {}
    }
    if (typeof window.closeVideoModal === 'function' && !window.closeVideoModal._rhrn) {
      const origClose = window.closeVideoModal;
      window.closeVideoModal = function () {
        const p = pendingPromo; pendingPromo = null;
        const out = origClose.apply(this, arguments);
        if (p) setTimeout(() => { try { runRightHereRightNow(p); } catch (e) { console.warn(e); } }, 450);
        return out;
      };
      window.closeVideoModal._rhrn = true;
      try { closeVideoModal = window.closeVideoModal; } catch (e) {}
    }
    // when the promo video finishes by itself, close it and go straight to the cutscene
    window.addEventListener('message', (e) => {
      if (!pendingPromo) return;
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (d && d.event === 'onStateChange' && d.info === 0) window.closeVideoModal();
      } catch (_) {}
    });
  }

  /* ---------- Public API ---------- */
  window.EWFP = {
    load, save, isBad, moodOf, getRel, setRel, relsOf, deed, castStory, applyStory, onMatchResult, afterBout, maybeBackstage,
    tick, onRunIn, pickRunIn, playTurn, renderSuperstarsTab, MOODS, _live: live,
    // test helpers
    _scene: scene, _update: update, _closeScene2: closeScene, _sfx: sfx, _flash: flash, _shake: shake, _bookMatch: bookMatch, _whenButtons: whenButtons, _blackout: blackoutStrobe,
    _runCallout: runCallout, _runAngle: runAngle, _runBackstage: runBackstage, _runExile: runExile, _nudge: nudgeBadGuy, _fakeOut: fakeOut, _cheat: cheatBanner, _alliance: runAlliance, _closeScene: closeScene, _rhrn: runRightHereRightNow, PROMO_TAGS, pinPad: pinPad
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
    wrapStoryOpen();
    wrapQueueBout();
    wrapReset();
    wrapGMOffice();
    wrapShowCard();
    wrapUniverseTabs();
    wrapPromos();
    ensureTab();
    try { if (typeof renderGrid === 'function') renderGrid(); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
