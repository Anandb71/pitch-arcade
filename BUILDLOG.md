# Build log

## T01

Created npm workspaces, strict TypeScript, Vitest, project rules, architecture plan and safe environment placeholders. Added a workspace configuration smoke test. npm test passed with 1 test.

## T05

Defined a closed JSON Schema, 30 verbs, 320 curated emoji, semantic role and control checks, and format documentation. Added 10 examples covering all MVP values. Added 13 format tests for accepted examples, title safety, unknown fields, role references, mods and defaults. npm test passed with 14 tests. Type checks passed.

## T06

Implemented mulberry32, a fixed 60 Hz engine, frame input streams, entities, live spawner limits, all eight motions, collisions, all five objectives and six mods. Added 25 simulation tests including PRNG and replay goldens, identical seed replays, input edges, collision priority, origins, terminal freezing and headless example deadlines. npm test passed with 39 tests. Type checks passed.

## T08

Added idle, random and humanish bots with independent seeded noise, a nine frame reaction delay and bounded mash cadence. The runner measures 40 seeds per bot and enforces every difficulty and safety band. All eight report codes include hints. Added seven plain broken specs, assessment boundary tests, repeatability checks, reaction and cadence tests, and a copied-template CLI test covering success, failure, invalid JSON and missing files.

Calibrated the ten core examples using measured results and added twenty verb variants. All thirty examples now pass. Added an enum coverage test for every MVP value and every verb. The committed standalone CLI is generated from source, marked read only by the builder, and includes dependency licenses. Factory instructions require a real read only mount when job isolation is implemented in T09.

Added the requested local EventSub WebSocket mock in place of Twitch CLI, with welcome, chat, keepalive, reconnect and drop controls. Added two wire fixture tests and an npm run mock:twitch command. Real Twitch clients remain later tasks.

Updated Vitest and pinned the compatible Vite major after dependency auditing. npm audit reports zero vulnerabilities. The shell defaults to Node 20.19, so final validation used Node 22.11 explicitly through npm exec. npm test passed: 6 files, 57 tests, 2.68 seconds. Type checks and bundle generation passed. Taco Rain reports idle 48 percent, random 23 percent and humanish 65 percent. The deliberately impossible mash game exits 1 with TOO_HARD. No milestone blockers.
