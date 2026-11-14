# EWF Universe - Batch Log

Working notes for Ellis's Main Event. Newest batch at the top.

How we work:
1. Nicko tests and sends a list of bugs and ideas.
2. Claude logs them here as a batch, then makes the changes in this folder.
3. Nicko tests locally (VS Code Live Server) or on the test branch.
4. Nicko commits and pushes in GitHub Desktop. Netlify deploys main automatically.

---

## Batch 10 - Characters come alive (planned 14 Nov 2026)

| # | Item | Status |
|---|------|--------|
| 1 | "OH MY GOD!" (ohmygod.mp3) plays over superstar arrival banners (code signings and level-up debuts) | ✅ Done |
| 2 | App icon fix: manifest.json pointed at the wide logo (bullet-shaped icon). Use square icon-192/512 + padded maskable icons; index.html favicon line | Logged (zip sent, apply in batch) |
| 3 | Good Guys and Bad Guys: everyone starts Good Guy; turns earned through stories (bad/good deed tally from Nicko's 79 stories, which stay unchanged), losing runs, betrayals, title losses; "EWF needs a bad guy" nudge (max ~1/3 bad guys); bad guys cheat, attack after the bell, crowd boos; red name + 😈 on cards (Option B); casting leans bad guys into villain roles in stories; MAKE GOOD GUY / BAD GUY in Universe. Assets: crowd_boo.mp3, bad_guy_turn_bg.png, good_guy_turn_bg.png | ✅ Done |
| 4 | Compress all images (same names, same look, 60-80% smaller); check samples with Nicko first | ⏳ Ready, waiting for Nicko to OK the samples |
| 5 | Superstars remember each other: hidden relationships per pair: 🤝 MATES, 💢 BAD BLOOD, 😒 JEALOUS OF, 🫡 RESPECT, built from tag wins, saves, betrayals, run-ins, title changes, 5-star matches. Lead to alliance offers, betrayals, revenge, rematches. New SUPERSTARS tab in EWF Universe (profile: good/bad, form, mood, relationships with reasons, GM buttons MAKE THEM MATES / START BAD BLOOD / SQUASH IT, "Hottest in the EWF"). Tapping cards still plays intros. Asset: relationships_bg.png | ✅ Done |
| 6 | Moods and callouts: mood badge bottom right of cards (👑 COCKY gold, 💪 HUNGRY green, 🥱 FED UP grey, 😒 JEALOUS purple, 😡 FURIOUS red); 🔥/❄️ stay top right for form. Callouts max every 5 matches: I WANT MY SHOT, SAT IN CATERING, BIG MATCH OR I'M WALKING, ANYONE ANY TIME (open challenge), I WANT THE GUY WHO PUT ME OUT. Choices feed moods, relationships, turns. Assets: gm_office_bg.png, open_challenge_bg.png, door_slam.mp3, microphone.png | ✅ Done |
| 7 | Backstage segments in Book a Show (~40% between bouts, never after another cutscene, SKIP button, Bret/Corbin commentary): loser storms off, winner interview call-out, car park ambush, locker room row, mates celebrate, mystery attacker + security footage reveal. Assets: backstage_corridor_bg, interview_bg, car_park_bg, locker_room_bg, catering_bg, crime_scene_bg, security_office_bg; steel_chair, trash_bin, security_guards, cameraman, briefcase_shadow; bin_crash, car_alarm, locker_slam, mic_feedback, cctv_static, locker_cheer | ✅ Done |
| 8 | More lights-out / music-hit surprises: (1) random run-in timing anywhere 1:30-5:00, higher chance in main events and big shows; (2) THE SAVE: post-match beatdown interrupted by the victim's mate (good guy turn trigger); (3) post-match beatdowns by bad guys / FURIOUS superstars, bad blood jumping the winner's celebration; (5) champion's celebration interrupted by a challenger, sets up next big match; (6) evening the odds: good guy's mate counters a bad guy's run-in; (7) return from exile: banished superstar can shock-return vs the one who sent them away (Ellis says yes/no); (8) rare fake-out lights out. NOT doing surprise debuts: new superstars keep their own debut moment. No new assets needed. | ✅ Done |
| 9 | Bret Hart tutorial covers the new features: home tour locker-room stop explains the badges (🔥/❄️ form top right, mood bottom right, red name + 😈 = Bad Guy); EWF Universe walkthrough gets a SUPERSTARS tab step (profiles, Mates/Bad Blood/Jealous/Respect, GM buttons); one-time Bret cut-ins the first time each happens: a Bad Guy turn, a Good Guy turn, each callout type, the first backstage segment, the save, a post-match beatdown, a celebration interruption, a return from exile, and a fake-out ("Ha! Mind games, GM!"); first mood badge appearing on a card gets a quick explainer. Replay Tutorial / Reset Universe reset these too. | ✅ Done |

**Batch 10 build notes (14 Nov):** new file js/7-personality.js runs the whole personality system (save key ewf_personality, wiped by Reset Universe and included in backups). Storyline good/bad deed classification is the draft in that file (STORY table) and can be tweaked any time. Bonus fix: Sim Match could leave a hidden screen stuck in fullscreen on a tablet (black screen); fixed, plus a safety net. Image compression: 485 MB down to 139 MB, compressed copies waiting in "Claude outputs/compressed", swapped in once approved.

All assets delivered by Nicko 14 Nov (12 backgrounds, 6 moving objects, 8 sounds). Wording rule: wrestling-style language throughout (Good Guy/Bad Guy, Mates, Bad Blood).

Suggested commit message: "Batch 10: Good Guys/Bad Guys, relationships, moods and callouts, backstage segments, more run-ins, Superstars tab, icon fix"

---

## Batch 9 - Walkthroughs, Sim Match, TV titles, run-in fix (13 Nov 2026)

| # | What Nicko saw | File | Fix | Status |
|---|----------------|------|-----|--------|
| 1 | History, GM Office and Book a Show need proper prompts showing HOW to use each part, not just one tip | js/6-tutorial.js | Replace the single first-visit tips with Bret spotlight walkthroughs inside each screen (same dim + highlight + NEXT style as the home tour). Book a Show: brand tiles and locked shows; then on the first show card: the bouts, START BOUT, REROLL, live star rating, XP at stake, Abandon; then Sign Off and the show grade. GM Office: rank and XP bar, next unlock and roadmap, commentator intros, achievements, Save/Restore backup, Replay Tutorial. History: All, Titles, Classics, Victories (total wins / current run), Record Book, Trophy Cabinet. | Done |
| 2 | Same for EWF Universe | js/6-tutorial.js | Walkthrough of the 4 tabs: Titles (pick champions), Alliances, Feuds, Injuries/Medical Ward. | Done |
| 3 | Story Line and Promo Mode missing from the home tour | js/6-tutorial.js | Add 2 stops to the home tour, then a short walkthrough the first time each is used. | Done |
| 4 | Surprise cutscenes appear with no explanation | js/6-tutorial.js | First time any surprise cutscene appears (storyline after a match, Blood Feud, Loser Leaves, Media Scrum, Boardroom, Limo, Staredown, Commentary Desk, Hospital Escape, MITB Stalking), Bret cuts in once explaining the choices. | Done |
| 5 | Sim a match in Book a Show: skip a bout (e.g. a WrestleMania opener) but still get a winner | js/5-match-engine.js (+ js/6-tutorial.js tip) | ⚡ SIM MATCH button next to START BOUT. Choice of PICK THE WINNER (instant result) or LET FATE DECIDE (weighted by momentum, champion status and streaks, with upsets possible). Quick result card with a dramatic headline, then it counts like a real match: History, title changes, rivalries, star rating and momentum. Simmed bouts give less show XP than played ones so playing stays the best option. | Done |
| 6 | Raw and SmackDown never have title matches | js/5-match-engine.js (generateShowCard, shuffleBout) | TV shows get the occasional title defence: about 1 in 3 Raw/SmackDown cards includes one, usually the Intercontinental, Hardcore or Tag titles, with the World title kept mostly for big PLEs (small chance on TV for a shock). Vacant titles can be crowned on TV too. Reroll follows the same rule. | Done |
| 7 | Random run-in at 2:00 shows an error pop-up ("No outside superstars available for an ambush!") when everyone signed is already in the match, e.g. Christmas morning with just 2 superstars | js/5-match-engine.js (checkUnpromptedAmbush) | Automatic run-ins quietly skip when nobody's free; the alert only stays for the manual RUN-IN button. | Done |
| 8 | (found while testing) Title defences were logged as "NEW CHAMPION ... captured" even when the champion kept the belt; tag title changes were logged as "retained" | js/5-match-engine.js (declareMatchWinner) | Only a real change of hands counts as a new champion now, for singles and tag titles. | Done |

Suggested commit message: `Batch 8 + 9: tutorial, walkthroughs, Sim Match, TV titles, fixes, new sounds`

Notes: Sim Match isn't offered on the main event (show always ends with a played match). TV title defences land on roughly 1 in 3 Raw/SmackDown cards (tested 300 cards: about 38%, mostly IC, Hardcore and Tag, World title rare). Walkthroughs: GM Office 6 steps, History 6, Universe 4, Book a Show menu/card/highlights 1+6+1 (locked-shows step only appears while shows are locked), home tour now 10 stops. Surprise cutscene tips appear at the top of the screen so they never cover the choice buttons. Tested: full tutorial run, every walkthrough, Sim Match (fate and pick, singles and tag, title changes), shows with simmed bouts archived, cutscenes mid-show, quick/show/quick back to back. No errors.

---

## Batch 8 - Broadcast team, Bret Hart tutorial, Mystery Match sound (13 Nov 2026)

| # | What Nicko saw | File | Fix | Status |
|---|----------------|------|-----|--------|
| 1 | Once 2 superstars are signed, introduce the commentators so Ellis can set their figures up by the ring before his first match | js/2-achievements-gm.js (+ reset list in js/3-storylines-feuds.js) | One-time "MEET YOUR BROADCAST TEAM" cutscene on the commentary desk background, straight after the 2nd superstar's welcome screen. Bret Hart and Happy Corbin cards, each with a PLAY INTRO button (their existing intro videos), then "COMMENTARY TEAM IN POSITION ➔" to finish. Shows once per universe (Reset Universe brings it back). | Done |
| 2 | Mystery Match: exiting before the reels stop spinning leaves the spin sounds playing in the background | js/5-match-engine.js | Stop the spin/lock sounds (and any pending reel timers) whenever the match screen is closed or cancelled | Done |
| 3 | First play-through tutorial: pointers for each section, like a computer game | js/6-tutorial.js (new), hooks in js/2, js/3 (reset list), index.html | Hosted by Bret Hart, straight after Meet Your Broadcast Team. (a) Home tour, ~6 stops: dimmed screen, one button lit up, speech bubble, big NEXT, small Skip. (b) Guided first match through Choose Your Match, with a clear "tap the winner when the ring match ends" step. (c) One-off Bret tip the first time each other section is opened (Book a Show, GM Office, EWF Universe, Story Line, Promo Mode, MITB/KOTR/Rumble when unlocked). (d) Replay Tutorial button in GM Office. Wording for an 8-year-old wrestling fan: short punchy lines, wrestling talk welcome (Attitude Era to now). Reset Universe brings it back. | Done |

Suggested commit message: `Batch 8: broadcast team intro, Bret Hart tutorial, Mystery Match sound fix`

Testing notes: played a fresh Christmas-morning run headless: signed 2 codes, broadcast team appeared, intro video closed back to it, 8-stop home tour, then the guided first match showed all 9 tips in order through to the "YOU'RE A NATURAL" sign-off. First-visit tips show once only. Mystery Match: leaving mid-spin now stops all reel sounds and timers; a full spin still works. Regression: quick match, WrestleMania show, quick match all fine, no errors.
Replay: GM Office > REPLAY TUTORIAL. Reset Universe also resets the tutorial.

---

## Batch 7 - Quick fixes (13 Nov 2026)

| # | File | Change | Status |
|---|------|--------|--------|
| 1 | Netlify settings | "Powered by Netlify" badge covered the Skip to Summary button. Turn off in Project configuration > General > Powered by Netlify badge (no code change). | Nicko to do |
| 2 | js/4-tournaments-rumble.js, js/5-match-engine.js | Missing `ellis.png` fallback image replaced with `ellis_avatar.png` (and guarded so a failed image can't retry forever). | Done |
| 3 | js/1-vault-audio.js | Broken promo YouTube link fixed (`watch?e74wxxtlgI8` to `watch?v=e74wxxtlgI8`). | Done |
| 4 | js/2-achievements-gm.js | `achievement_unlock.mp3` now plays when the "You Have Unlocked" showcase screen appears (`showUnlockShowcase`). | Done |
| 5 | js/5-match-engine.js (`shuffleBout`) | Book a Show reroll bug: rerolling a title match always wiped the title and never offered another. Now a title bout rerolls into a title bout (any title whose champion is free and not already on the card, vs a top-momentum challenger). Non-title bouts on PLEs have a 35% chance of becoming a title match. TV shows (Raw/SmackDown) still don't add new title matches, matching the original booking rules. | Done |
| 6 | js/5-match-engine.js | Royal Rumble stuck after the winner: once the coronation showed, a leftover timer or the end of the victory video called `startRumbleTimer()` again, re-opening an empty Rumble HUD with no way out. Added a `rumbleConcluded` lock set on the final elimination (also clears pending entrance timers), which blocks every path back into the Rumble HUD until a new Rumble starts. Batch 6 item 7 tried to fix this but missed these paths. | Done |
| 7 | js/4-tournaments-rumble.js | Royal Rumble as a Book a Show main event dumped you on the home screen with the show still open (it called a function that didn't exist), so the show could never be signed off. Now goes to Event Highlights like every other show, records the bout properly, and the exit button says CONTINUE SHOW. | Done |
| 8 | js/5-match-engine.js (`generateShowCard`) | Book a Show never booked vacant titles, so a career that only uses Book a Show never had champions. From GM Level 2 (when championships unlock), PLEs now book vacant title matches between in-form superstars to crown the first champions. | Done |
| 9 | js/5-match-engine.js | King of the Ring unlocks at Level 8 but needed 6 superstars, and the roster is 5 until Kane at Level 10, so it could never be booked. Now needs 4; with fewer than 6, KOTR and the Rumble skip the opener (any scheduled storyline match waits for the next show). | Done |
| 10 | js/5-match-engine.js | KOTR show bouts were sent to the standalone KOTR bracket screen and the show could never finish. Show bouts now use the normal summary, and the show crowns the King. | Done |
| 11 | js/4-tournaments-rumble.js | Money in the Bank briefcase screen got parked inside a hidden video screen after a show, then popped up at the start of the next show's first match. Pressing it ended that match and left the show stuck. Fixed, and the post-match queue now carries on after it closes. | Done |
| 12 | js/5-match-engine.js | The post-show storyline could fire in the middle of the next show, or cover the grade screen so the show couldn't be archived. It's now dropped if a new show has started. | Done |
| 13 | js/3-storylines-feuds.js, js/4-tournaments-rumble.js | Loser Leaves EWF: Batch 6 set the trigger to 10 head-to-head matches, but the counter included every history line mentioning both names (match booked, sanctioned, rivalry ignited, storyline brawls...), so it really fired after 3 or 4 matches. Now only counts actual match results. History also keeps 500 entries instead of 100, otherwise older matches dropped off before any pair could reach 10. | Done |
| 14 | js/1-vault-audio.js, js/3-storylines-feuds.js, js/5-match-engine.js | Every figure is now signed with a contract code. Triple H, The Rock, Stone Cold and Mankind start locked (with their own debut banners), so the EWF starts empty on Christmas morning. Until 2 superstars are signed, the home screen shows a big SIGN A SUPERSTAR card, and Choose Your Match, Mystery Match, Book a Show and Story Line explain what to do and open the code screen. The Undertaker (Level 6) and Kane (Level 10) stay as level rewards. | Done |
| 15 | js/2-achievements-gm.js, index.html | GM Office dev button is now DEV: UNLOCK ALL: Level 20, every show and match type, and all 9 superstars, with no level-up popups. Reset Universe (EWF Universe screen) takes you back to a fresh, empty start. Also: vacant tag title matches now use real alliances as teams where possible. | Done |
| 16 | js/5-match-engine.js, js/3-storylines-feuds.js | "Fight right now" choices in cutscenes during Book a Show wiped the whole show (Blood Feud, Loser Leaves) or took over the next bout's result (storyline, #1 Contender, MITB call-out, Rumble fast-track). Now the cutscene match is added to tonight's card as a BREAKING NEWS bout and Ellis goes back to the show card. In Choose Your Match, the Start button now shows on those previews (it was missing for the title-shot cutscenes). | Done |
| 17 | js/3-storylines-feuds.js | Loser Leaves EWF in Choose Your Match never actually removed the loser (the flag was wiped when the match screen opened). Fixed; confirmed the loser is exiled in both modes. | Done |
| 18 | js/5-match-engine.js | The post-show storyline could pop up over a quick match Ellis had already started. It's now skipped if he's moved on. | Done |
| 19 | js/3-storylines-feuds.js, js/5-match-engine.js | Hooked up the two orphaned cutscenes. Hospital Escape: a superstar with a major injury (2+ matches left) and a fit rival has a 1 in 4 chance after each match to break out and return (then gets the shock-return ambush in their next match). MITB Stalking: if the briefcase holder isn't the World champ and both are fit, 1 in 5 chance, max once every 5 matches. After quick matches straight away; in shows, after sign-off. Needs ambush_crash.mp3 (Nicko making it). | Done |

Suggested commit message: `Batch 7: Book a Show career fixes, cutscenes in shows + new triggers, contract codes, dev unlock-all`

---

### Batch 7 testing notes

Ran automated playthroughs in a headless browser (no images or YouTube, logic only): every show type (Raw, SmackDown, Backlash, Survivor, SummerSlam, WrestleMania, MITB, KOTR, Rumble) to sign-off, plus a 12-show career from Level 1 to 9 with random winners and ratings. Final run: 12 shows, 0 stuck, 0 errors, champions crowned from Level 2.

Cutscene sweep: forced every cutscene (storyline, Story Line button, Blood Feud alert and showdown, Loser Leaves, Media Scrum, Boardroom Decree, Limo Summit, WrestleMania Staredown, Commentary Desk redemption, Hospital Escape, MITB Stalking) in Choose Your Match and mid-show, trying each choice, then played on to the end. Final run: all 12 complete in a show with the show archived, and the main choices all work in Choose Your Match. Also played quick match, show, quick, show, quick back to back: every result logged, no stuck screens.

Still worth knowing:
- Roster is small (5 to 6 until Kane at Level 10, plus John Cena, Roman Reigns and CM Punk via vault codes), so "4 BOUTS" shows often book 2. Adding Ellis's figures as custom superstars fixes this naturally.
- Tag titles rarely appear (need 4 free superstars outside the main event).
- Missing files the code asks for (silent/blank if never added): ambush_hit.mp3, ambush_crash.mp3, table.mp3, slot_machine_bg.png (Mystery Match background), mania_bg.png, summerslam_bg.png (Book a Show backdrops fall back to show_bg.png).

## Contract codes (for the figure boxes)

Enter on the home screen: tap the SIGN A SUPERSTAR / ADD NEW card, then type the code into the Secret Contract Vault. Codes aren't case sensitive.

| Superstar | Code | How he gets them |
|-----------|------|------------------|
| Triple H | THEGAME | Code |
| The Rock | PEOPLESCHAMP | Code |
| Stone Cold | AUSTIN316 | Code |
| Mankind | MRSOCKO | Code |
| John Cena | CANTSEEME | Code |
| Roman Reigns | BLOODLINE | Code |
| CM Punk | STRAIGHTEDGE | Code |
| The Undertaker | (none) | Reaching GM Level 6 |
| Kane | (none) | Reaching GM Level 10 |

Before Christmas: press Reset Universe in EWF Universe on the tablet so Ellis starts at Level 1 with an empty roster.

---

## Batches 1 to 6

Built with Gemini (Sept to Nov 2026). Batch 6 (9 items: CM Punk vault entry, background video loop, Career Contract threshold, Commentary Desk cutscene, #1 Contender Lock, Rumble exit fixes, shock comeback video and more) is confirmed in the code.

---

## What's already in the app

So new ideas build on what exists rather than repeat it.

- **Matches:** Choose Your Match (show intro, format, match type, hand-pick or auto-fill, entrances, live timer, run-ins, crown winner, summary), Mystery Match roulette, title stakes
- **Formats and types:** 1v1, Triple Threat, Fatal 4-Way, Tag Team; Normal, Tables, TLC, Ladder, No DQ, Submission, Last Man Standing, Falls Count Anywhere, 2 out of 3, Special Referee, Lumberjack, Hell in a Cell, Hardcore, Ambulance
- **Big events:** Royal Rumble, Money in the Bank (with cash-ins), King of the Ring bracket, Book a Show with Event Highlights
- **Story:** storylines, rivalries and Blood Feuds, alliances, injuries and Slambulance, Loser Leaves career contracts, banishment and shock returns, Lights Out ambushes, Commentary Desk redemption, boardroom decrees, media scrums, Promo Mode
- **Progress:** GM Ellis levels and XP, achievements, unlocks and roadmap, Secret Talent Vault codes, momentum and top contenders
- **Records:** History (matches, title changes), victories leaderboard, record book, trophy cabinet, Hall of Fame ceremonies
- **Roster:** custom superstars with photo upload
- **Saving:** save data export/import and universe backup/restore already exist
- **Device:** fullscreen, screen wake lock, background music, home screen app (landscape)

## Ideas parked

- Faster loading: shrink images, stop preloading all of them at startup
- Simple one-tap Quick Match mode
- Idle titantron mode (loops logos, champions, promos when not in use)
- Christmas morning first-launch reveal for GM Ellis
- MIDI pad: kept separate from the app on purpose (Nicko's call)
