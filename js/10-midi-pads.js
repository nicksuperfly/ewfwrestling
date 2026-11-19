// 10-midi-pads.js
// Donner Starrypad Mini -> sound pad for the EWF app, via Web MIDI (Chrome on Android).
// Sounds live in the /sounds folder, separate from the app's own sounds.
//
// ADDING A SOUND
// Name the new file to follow the pattern and bump the number in the list below.
// e.g. add "pin - kickout 7.mp3" to /sounds, then change sounds("pin - kickout", 6) to 7.
//
// FIRST-TIME CHECK
// Plug in the pad, open the app in Chrome and press pad 1. The console logs "Note 36 = pad 1".
// If pad 1 shows a different note, change FIRST_NOTE below.
//
// PAD LAYOUT (pad 1 = bottom left, counting left to right, bottom to top)
// One match type per row. Left column = the random "roll the dice" pad.
//
//   13 Table smash    | 14 Chair / steps | 15 Spare      | 16 Spare
//    9 RANDOM Rumble  | 10 Eliminated    | 11 RANDOM MITB| 12 Ladder win
//    5 RANDOM Submit  |  6 Tap out       |  7 Ropes      |  8 Oh my god
//    1 RANDOM Pin     |  2 Kick-out      |  3 Three count|  4 Ring bell
//
// Rumble pads (9, 10) stay silent until the rumble sounds are added.

const FIRST_NOTE = 36;      // note number pad 1 sends
const SOUND_FOLDER = "sounds/";

// ---------- CHANCES (higher = more likely) ----------
const PINFALL_CHANCES    = { kickout: 70, win: 30 };     // pad 1
const SUBMISSION_CHANCES = { ropes: 65, tapout: 35 };    // pad 5
const RUMBLE_CHANCES     = { saved: 60, eliminated: 40 }; // pad 9
const MITB_CHANCES       = { miss: 70, win: 30 };        // pad 11

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
const RUMBLE_OUT   = sounds("rumble - eliminated", 0); // set to how many you make
const RUMBLE_SAVED = sounds("rumble - saved", 0);      // set to how many you make
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
  4:  { type: "sound", files: ["fx - ring bell.mp3"] },

  // Row 2: submissions
  5:  { type: "outcome", name: "submission", outcomes: [
        { result: "ropes",  weight: SUBMISSION_CHANCES.ropes,  files: ROPE_BREAKS },
        { result: "tapout", weight: SUBMISSION_CHANCES.tapout, files: TAP_OUTS },
      ]},
  6:  { type: "outcome", name: "submission", outcomes: [{ result: "tapout", weight: 1, files: TAP_OUTS }] },
  7:  { type: "outcome", name: "submission", outcomes: [{ result: "ropes",  weight: 1, files: ROPE_BREAKS }] },
  8:  { type: "sound", files: ["fx - oh my god.mp3"] },

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

  // Row 4: effects
  13: { type: "sound", files: TABLE_SMASH },
  14: { type: "sound", files: ["fx - chair shot.mp3", "fx - steel steps.mp3"] },
  // 15: spare
  // 16: spare
};

// Called when an outcome pad's sound finishes, e.g. ("pinfall", "win").
// Hook the app in here later to show "KICK OUT!" / a winner screen / update records.
function onPadOutcome(name, result) {
  console.log("Result:", name, result);
}

// ---------- ENGINE (no need to edit below) ----------
(function () {
  const lastPlayed = {};
  const busy = {};

  function playFile(file) {
    const audio = new Audio(SOUND_FOLDER + encodeURIComponent(file));
    audio.play().catch(err => console.warn("Could not play", file, err));
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

  function handlePad(padNumber) {
    const pad = PADS[padNumber];
    if (!pad) return;

    if (pad.type === "sound") {
      if (pad.files.length) playFile(pickFile(padNumber, pad.files));
      return;
    }

    if (pad.type === "outcome") {
      if (busy[pad.name]) return;
      const outcome = pickOutcome(pad.outcomes);
      if (!outcome) return; // no sounds added yet
      const audio = playFile(pickFile(pad.name + outcome.result, outcome.files));
      busy[pad.name] = true;
      audio.addEventListener("ended", () => { busy[pad.name] = false; onPadOutcome(pad.name, outcome.result); });
      audio.addEventListener("error", () => { busy[pad.name] = false; });
    }
  }

  function onMidiMessage(event) {
    const [status, note, velocity] = event.data;
    const isNoteOn = (status & 0xf0) === 0x90 && velocity > 0;
    if (!isNoteOn) return;
    const padNumber = note - FIRST_NOTE + 1;
    console.log("Note " + note + " = pad " + padNumber);
    handlePad(padNumber);
  }

  function connectInputs(midi) {
    midi.inputs.forEach(input => { input.onmidimessage = onMidiMessage; });
  }

  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(midi => {
      connectInputs(midi);
      midi.onstatechange = () => connectInputs(midi);
      console.log("MIDI pad ready");
    }).catch(err => console.warn("MIDI not available:", err));
  } else {
    console.warn("This browser does not support Web MIDI. Use Chrome on Android.");
  }
})();
