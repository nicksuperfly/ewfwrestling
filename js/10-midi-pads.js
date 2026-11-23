// 10-midi-pads.js
// Donner Starrypad Mini -> sound pad for the EWF app, via Web MIDI (Chrome on Android).
// Sounds live in the /sounds folder, separate from the app's own sounds.
//
// ADDING A SOUND
// Name the new file to follow the pattern and bump the number in the list below.
// e.g. add "pin - kickout 7.mp3" to /sounds, then change sounds("pin - kickout", 6) to 7.
//
// PAD SETUP
// The pad must be on PRESET 1 (all 16 pads glow the same colour).
// If the top two rows glow different colours it has slipped onto preset 4:
// switch it off, hold pad 13 (PRESETS 1) and switch it back on.
//
// PAD LAYOUT (pad 1 = bottom left, counting left to right, bottom to top)
// One match type per row. Left column = the random "roll the dice" pad.
//
//   13 Table smash    | 14 Chair / steps | 15 RANDOM Cage | 16 Cage slam
//    9 RANDOM Rumble  | 10 Over top rope | 11 RANDOM MITB | 12 Ladder win
//    5 RANDOM Submit  |  6 Tap out       |  7 Ropes       |  8 Oh my god
//    1 RANDOM Pin     |  2 Kick-out      |  3 Three count |  4 Ring bell
//
// The pads only work during a LIVE match (from the bell until the winner is crowned).
// A pad with no sounds yet stays silent.

const FIRST_NOTE = 36;      // note number pad 1 sends
const SOUND_FOLDER = "sounds/";

// ---------- CHANCES (higher = more likely) ----------
const PINFALL_CHANCES    = { kickout: 70, win: 30 };      // pad 1
const SUBMISSION_CHANCES = { ropes: 65, tapout: 35 };     // pad 5
const RUMBLE_CHANCES     = { saved: 60, eliminated: 40 }; // pad 9
const MITB_CHANCES       = { miss: 70, win: 30 };         // pad 11
const CAGE_CHANCES       = { dragged: 60, escape: 40 };   // pad 15

// ---------- SOUND GROUPS ----------
// sounds("pin - kickout", 6) means "pin - kickout 1.mp3" up to "pin - kickout 6.mp3"
function sounds(name, count) {
  const list = [];
  for (let i = 1; i <= count; i++) list.push(name + " " + i + ".mp3");
  return list;
}

const KICKOUTS     = sounds("pin - kickout", 6);
const THREE_COUNTS = sounds("pin - win", 2);
const ROPE_BREAKS  = sounds("sub - ropes", 3);
const TAP_OUTS     = sounds("sub - tap out", 2);
const LADDER_WINS  = sounds("ladder - win", 1);
const MITB_MISSES  = sounds("mitb - miss", 2);
const MITB_WINS    = sounds("mitb - win", 1);
const RUMBLE_OUT   = sounds("rumble - over top rope", 1);
const RUMBLE_SAVED = sounds("rumble - saved", 0);         // set to how many you make
const CAGE_ESCAPE  = sounds("cage - escape", 0);          // set to how many you make
const CAGE_DRAGGED = sounds("cage - dragged back", 0);    // set to how many you make
const CAGE_SLAM    = sounds("cage - slam", 0);            // set to how many you make
const TABLE_SMASH  = sounds("fx - table smash", 3);

// ---------- PADS ----------
// type "sound"   : plays one of the files at random (never the same twice in a row)
// type "outcome" : rolls a result using the chances, then plays a random sound for it.
//                  Extra hits are ignored until it finishes, so a pin can't be cancelled.
const PADS = {
  // Row 1: pin falls
  1:  { type: "outcome", name: "pinfall", outcomes: [
        { result: "kickout", weight: PINFALL_CHANCES.kickout, files: KICKOUTS },
        { result: "win",     weight: PINFALL_CHANCES.win,     files: THREE_COUNTS },
      ]},
  2:  { type: "outcome", name: "pinfall", outcomes: [{ result: "kickout", weight: 1, files: KICKOUTS }] },
  3:  { type: "outcome", name: "pinfall", outcomes: [{ result: "win",     weight: 1, files: THREE_COUNTS }] },
  4:  { type: "sound", fx: "bell", files: ["fx - ring bell.mp3"] },

  // Row 2: submissions
  5:  { type: "outcome", name: "submission", outcomes: [
        { result: "ropes",  weight: SUBMISSION_CHANCES.ropes,  files: ROPE_BREAKS },
        { result: "tapout", weight: SUBMISSION_CHANCES.tapout, files: TAP_OUTS },
      ]},
  6:  { type: "outcome", name: "submission", outcomes: [{ result: "tapout", weight: 1, files: TAP_OUTS }] },
  7:  { type: "outcome", name: "submission", outcomes: [{ result: "ropes",  weight: 1, files: ROPE_BREAKS }] },
  8:  { type: "sound", fx: "omg", files: ["fx - oh my god.mp3"] },

  // Row 3: Royal Rumble and Money in the Bank / ladder
  9:  { type: "outcome", name: "rumble", outcomes: [
        { result: "saved",      weight: RUMBLE_CHANCES.saved,      files: RUMBLE_SAVED },
        { result: "eliminated", weight: RUMBLE_CHANCES.eliminated, files: RUMBLE_OUT },
      ]},
  10: { type: "outcome", name: "rumble", outcomes: [{ result: "eliminated", weight: 1, files: RUMBLE_OUT }] },
  11: { type: "outcome", name: "ladder", outcomes: [
        { result: "miss", weight: MITB_CHANCES.miss, files: MITB_MISSES },
        { result: "win",  weight: MITB_CHANCES.win,  files: MITB_WINS },
      ]},
  12: { type: "outcome", name: "ladder", outcomes: [{ result: "win", weight: 1, files: LADDER_WINS }] },

  // Row 4: effects and the steel cage
  13: { type: "sound", fx: "table", files: TABLE_SMASH },
  14: { type: "sound", fx: "chair", files: ["fx - chair shot.mp3", "fx - steel steps.mp3"] },
  15: { type: "outcome", name: "cage", outcomes: [
        { result: "dragged", weight: CAGE_CHANCES.dragged, files: CAGE_DRAGGED },
        { result: "escape",  weight: CAGE_CHANCES.escape,  files: CAGE_ESCAPE },
      ]},
  16: { type: "sound", fx: "cage", files: CAGE_SLAM },
};

// ---------- ENGINE (no need to edit below) ----------
(function () {
  const lastPlayed = {};
  const busy = {};
  const busyTimer = {};
  const lastNoteAt = {};
  const cache = {};
  const log = [];                       // pad test readout
  let lastWrongPresetToast = 0;
  let lastNotLiveToast = 0;

  window.EWF_PAD = { PADS, FIRST_NOTE, log, handlePad: (n) => handlePad(n, 'test'), _midi: (note, port) => onMidiMessage({ data: [0x99, note, 100] }), isLive: () => isLive() };

  function record(entry) {
    log.unshift(Object.assign({ t: new Date().toLocaleTimeString() }, entry));
    log.length = Math.min(log.length, 20);
    if (typeof window.ewfPadTestRefresh === 'function') window.ewfPadTestRefresh();
  }

  // Preload every pad sound so the first press isn't delayed
  function preload() {
    Object.values(PADS).forEach(p => {
      const groups = p.type === 'sound' ? [p.files] : p.outcomes.map(o => o.files);
      groups.forEach(g => g.forEach(f => {
        if (cache[f]) return;
        const a = new Audio(SOUND_FOLDER + encodeURIComponent(f));
        a.preload = 'auto';
        cache[f] = a;
      }));
    });
  }

  function toast(msg) {
    if (typeof window.ewfToast === 'function') return window.ewfToast(msg);
    console.log(msg);
  }

  // Turn the crowd down while a pad sound plays
  let duckCount = 0, duckRestore = null;
  function duck(on) {
    try {
      if (typeof matchCrowdSound === 'undefined') return;
      if (on) {
        if (duckCount === 0) { duckRestore = matchCrowdSound.volume; matchCrowdSound.volume = Math.max(0, duckRestore * 0.35); }
        duckCount++;
      } else {
        duckCount = Math.max(0, duckCount - 1);
        if (duckCount === 0 && duckRestore !== null) { matchCrowdSound.volume = duckRestore; duckRestore = null; }
      }
    } catch (e) {}
  }

  function playFile(file, onDone) {
    let audio = cache[file];
    if (!audio || !audio.paused) audio = new Audio(SOUND_FOLDER + encodeURIComponent(file));
    try { audio.currentTime = 0; } catch (e) {}
    audio.volume = 1;
    duck(true);
    let finished = false;
    const finish = (ok) => { if (finished) return; finished = true; duck(false); if (onDone) onDone(ok); };
    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    const pr = audio.play();
    if (pr && pr.catch) pr.catch(err => { console.warn("Could not play", file, err); finish(false); });
    return audio;
  }

  function pickFile(key, files) {
    if (files.length === 1) return files[0];
    let choice;
    do {
      choice = files[Math.floor(Math.random() * files.length)];
    } while (choice === lastPlayed[key]);
    lastPlayed[key] = choice;
    return choice;
  }

  function pickOutcome(outcomes) {
    const usable = outcomes.filter(o => o.files.length > 0 && o.weight > 0);
    if (!usable.length) return null;
    const total = usable.reduce((sum, o) => sum + o.weight, 0);
    let roll = Math.random() * total;
    for (const o of usable) {
      if (roll < o.weight) return o;
      roll -= o.weight;
    }
    return usable[usable.length - 1];
  }

  // Pads only work during a live match (bell to crowning the winner)
  function isLive() {
    try {
      if (typeof isMatchInProgressLooping === 'undefined' || !isMatchInProgressLooping) return false;
      if (typeof isRunInActive !== 'undefined' && isRunInActive) return false;
      if (document.querySelector('.ewfp-scene')) return false;
      const lo = document.getElementById('lightsOutOverlay');
      if (lo && getComputedStyle(lo).display !== 'none') return false;
      if (document.querySelector('#ewfCrownOverlay, #ewfLegendOverlay, #ewfPopup, #ewfPinPad')) return false;
      return true;
    } catch (e) { return false; }
  }

  function handlePad(padNumber, source) {
    const pad = PADS[padNumber];
    if (!pad) return;
    const live = source === 'test' ? true : isLive();
    if (!live) {
      record({ pad: padNumber, note: FIRST_NOTE + padNumber - 1, live: false, result: 'ignored (no live match)' });
      return;
    }

    if (pad.type === "sound") {
      if (!pad.files.length) { record({ pad: padNumber, live, result: 'no sound yet' }); return; }
      const f = pickFile(padNumber, pad.files);
      playFile(f);
      record({ pad: padNumber, live, result: pad.fx, file: f });
      if (typeof window.ewfPadEffect === 'function') window.ewfPadEffect(pad.fx);
      return;
    }

    if (pad.type === "outcome") {
      if (busy[pad.name]) { record({ pad: padNumber, live, result: 'busy, ignored' }); return; }
      const outcome = pickOutcome(pad.outcomes);
      if (!outcome) { record({ pad: padNumber, live, result: 'no sound yet' }); return; }
      const f = pickFile(pad.name + outcome.result, outcome.files);
      busy[pad.name] = true;
      clearTimeout(busyTimer[pad.name]);
      // safety net: never leave a pad stuck "busy"
      busyTimer[pad.name] = setTimeout(() => { busy[pad.name] = false; }, 20000);
      record({ pad: padNumber, live, result: pad.name + ': ' + outcome.result, file: f });
      playFile(f, () => {
        busy[pad.name] = false;
        clearTimeout(busyTimer[pad.name]);
        onPadOutcome(pad.name, outcome.result, source);
      });
    }
  }

  // Called when an outcome pad's sound finishes, e.g. ("pinfall", "win").
  function onPadOutcome(name, result, source) {
    if (source !== 'test' && !isLive()) return;
    if (typeof window.ewfPadResult === 'function') window.ewfPadResult(name, result);
  }

  function onMidiMessage(event) {
    const [status, note, velocity] = event.data;
    const isNoteOn = (status & 0xf0) === 0x90 && velocity > 0;
    if (!isNoteOn) return;
    // the pad sends every press on two MIDI ports: ignore the copy
    const now = performance.now();
    if (lastNoteAt[note] && now - lastNoteAt[note] < 80) return;
    lastNoteAt[note] = now;

    const padNumber = note - FIRST_NOTE + 1;
    if (padNumber < 1 || padNumber > 16) {
      record({ note, result: 'unknown note (wrong preset?)' });
      if (Date.now() - lastWrongPresetToast > 10000) {
        lastWrongPresetToast = Date.now();
        toast("🎹 The pad is on the wrong preset! Switch it off, hold pad 13 and switch it back on.");
      }
      return;
    }
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) {
      if (Date.now() - lastNotLiveToast > 8000) { lastNotLiveToast = Date.now(); toast("🎹 Tap the screen once so the pad can make noise!"); }
    }
    handlePad(padNumber, 'midi');
  }

  const connected = new Set();
  function connectInputs(midi, announce) {
    midi.inputs.forEach(input => {
      input.onmidimessage = onMidiMessage;
      if (input.state === 'connected' && !connected.has(input.id)) {
        connected.add(input.id);
        if (announce && /starry/i.test(input.name || '') && connected.size === 1) toast("🎹 PAD CONNECTED! Ready when the bell rings.");
      }
      if (input.state !== 'connected') connected.delete(input.id);
    });
  }

  preload();
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(midi => {
      connectInputs(midi, false);
      midi.onstatechange = () => connectInputs(midi, true);
      console.log("MIDI pad ready");
    }).catch(err => console.warn("MIDI not available:", err));
  } else {
    console.warn("This browser does not support Web MIDI. Use Chrome on Android.");
  }
})();
