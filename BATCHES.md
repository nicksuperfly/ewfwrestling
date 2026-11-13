# EWF Universe - Batch Log

Working notes for Ellis's Main Event. Newest batch at the top.

How we work:
1. Nicko tests and sends a list of bugs and ideas.
2. Claude logs them here as a batch, then makes the changes in this folder.
3. Nicko tests locally (VS Code Live Server) or on the test branch.
4. Nicko commits and pushes in GitHub Desktop. Netlify deploys main automatically.

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
