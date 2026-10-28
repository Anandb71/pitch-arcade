# Playtest harness

Run npm run playtest -- <file> from the repository root.
Inside a copied factory template, run node tools/playtest.mjs <file>.
The tool exits 0 on pass and 1 on any failure, including unreadable files and invalid JSON.
npm run build generates the committed self contained tool from the TypeScript source.
npm test rebuilds it first so tests exercise current code.

## Bots and measurements

Each bot runs seeds 1 through 40 at 60 Hz. All bots use the same engine seeds.
Their own noise uses a separate mulberry32 stream.
Idle never inputs. Random changes movement every 12 frames and randomly clicks and presses.
Humanish pursues the nearest goal, avoids the nearest predicted hazard and clicks the nearest target.
Its inputs arrive nine frames later, giving 150 ms of reaction delay.
Movement has small directional noise. Click aim has up to 18 units of error per axis.
Mash attempts are spaced eight frames apart, with an 8 percent chance of a missed press.
That stays below eight presses in any second.

Reports expose exact wins, runs and rates for each bot, peak entities including the player,
earliest hazard touch, longest run and unfinished run count.
Compact output rounds percentages for display. Acceptance uses exact rates.

Humanish must win 35 to 85 percent inclusive.
Idle may win at most 60 percent of survive runs and 5 percent of objective runs.
Random may beat humanish by at most five percentage points.
Every run must end within seconds plus 0.25.
Hazard contact before frame 30 fails. More than 60 entities fails.
All roles and verb semantics must validate before simulation.

## Report codes

* SCHEMA_ERROR: fix the reported JSON field, role reference, control or limit.
* VERB_MISMATCH: align the command, win rule and lose rule.
* TOO_EASY: increase the objective or challenge.
* TOO_HARD: reduce challenge, or make deliberate action more useful than random input.
* IDLE_WINS: require action or improve hazard coverage.
* NEVER_ENDS: fix termination. The current engine always enforces the duration, so this guard is tested with synthetic run metrics.
* SPAWN_KILL: move hazards away from the initial player position.
* OVERCROWDED: reduce spawn rate or live limits.

The fixtures folder contains seven plain game files that fail with the code in their filename.
Thirty passing examples cover every verb and MVP enum. Ten are core mechanical examples;
the remaining twenty demonstrate other verbs using calibrated mechanics.

Difficulty is a repeatable bot estimate, not a promise about every human player.
Streamer approval and the future skip control still matter.

The builder marks the tool file read only. Git does not preserve that permission bit,
so the eventual factory runner must mount tools and spec read only as described in its instructions.
That mount is the security boundary. A file permission alone is not isolation.
