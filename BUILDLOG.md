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

## T11

Added ChatSource and FakeChatSource, bounded pitch parsing, Unicode character limits, configurable cooldown and queue capacity, token similarity dedupe, role priority, local denylist, pluggable moderation and acknowledgments. The moderator uses the OpenAI moderation endpoint when OPENAI_API_KEY is configured and a clearly labeled local heuristic otherwise. Moderator outages fail closed. Privileged arcade commands persist the kill switch and interrupt pending moderation immediately.

Created all seven section 7.11 tables plus settings behind a small synchronous SqlDatabase interface. Foreign keys cascade privacy deletion. Events store references and decisions rather than raw nonpitch chat. The better-sqlite3 package installed but its Node 22.11 smoke check terminated with a segmentation fault. Removed it and used the authorized node:sqlite fallback, verified against SQLite 3.46.1. Node 22.11 requires --experimental-sqlite, now passed to tests and Vitest workers.

Added 20 intake and storage tests covering spam, simultaneous requests, boundaries, roles, moderation, kill switch persistence and deletion. npm test passed on Node 22.11 with 77 tests across 8 files. Type checks and bundle generation passed.

## T09

Added fresh git job workspaces, inbox data files, CodexCliRunner, MockCodexRunner, sanitized JSONL factory steps and measured receipts. The scheduler runs at most two jobs, enforces a 150 second deadline and four playtests, persists receipts, supports cancellation and crash recovery, cleans job folders and limits jobs per hour. Mock replay receipts explicitly identify simulation and leave thread and token values null.

Verified codex-cli 0.165.0 against its help and official permission documentation. Corrected the sketch to use a nested :workspace_roots map. The CLI uses a profile extending :workspace rather than passing --sandbox, because the legacy flag overrides profile deny rules. A live offline preflight verified secret and sibling read denial, protected tool write denial, output writes and blocked TCP access. Root denied view writes outside the output did not persist to the host. The runtime repeats the preflight and rejects unverified minor versions. No model job or side thread was launched during verification.

Kept @openai/codex-sdk out of dependencies because CLI JSONL already supplies the needed events and sign in path. Documented controls and limitations in docs/factory.md. Moved canonical examples into packages/engine and made the build sync all template content, including factory designer instructions and config. Added 13 factory tests for JSONL fragments, limits, event dedupe, secret scrubbing, argv safety, mock receipts, concurrency, timeout, cancellation, budget and preflight failure. npm test passed on Node 22.11 with 90 tests across 9 files. npm run factory:check passed.

## T10

Added independent server validation with bounded regular file reads, symlink and hardlink rejection, schema and semantic checks, title filtering, all string and key safety scans, secret patterns and entropy checks, designer rejection handling and a fresh trusted harness run. Claimed agent reports are ignored. Built games require explicit approval, approval counters are idempotent and rejected games cannot be approved.

Implemented the Fastify loopback server, tiny fake chat panel, guarded local control API, sanitized WebSocket factory feed, persistent library and privacy deletion. Deletion cancels active jobs, removes dependent rows and user events, clears in-memory presentation data and checkpoints SQLite with secure_delete enabled. Added the forget CLI for running and stopped servers. Filtered pitches now consume cooldown too, preventing moderation spam.

Connected the common ChatSource to HTTP mock chat and an EventSub socket adapter. Added bounded local mock replay injection and a five pitch replay script. Added supplied-token EventSub subscription and rate limited Helix acknowledgment helpers. OAuth refresh and clips remain future tasks. Mock mode remains independent of live Twitch credentials and Codex.

Created twenty passing seed specs with honest receipts naming main build thread 01a18380-92df-7fb1-84cd-1b45659bee41. Per game runtime thread IDs, model, timings and token usage are null. Each receipt includes real 40 seed bot reports and difficulty summaries. Added a regeneration script. The scripted demo and tests prove chat to queue to mock factory to independent validator to approval to library. A separate test replays through the actual EventSub mock socket before approving all five games.

Updated README, setup, safety, architecture and Codex evidence docs. The demo now starts a real local panel. Verified its rendered factory state and seed library with headless Chrome. Pinned light-my-request to 6.6.0 because the latest helper requires ESM loading behavior missing in Node 22.11. No new unapproved production dependency was added.

Added 29 tests covering malicious outputs, forged reports, output filesystem checks, approval states, all seed receipts, HTTP guards, live deletion, CLI deletion, EventSub mapping and replay, subscription payloads, acknowledgment pacing and moderation spam. A clean npm ci passed on Node 22.11 with npm 10.9. Final npm test passed: 14 files, 119 tests, 3.48 seconds. npm run demo:check and npm run factory:check passed. npm audit reports zero vulnerabilities. Live Twitch requests and real model generation were not exercised. No milestone blockers.

## T07

Implemented the Canvas 2D renderer at 960 by 540 with all eight palettes and five static patterns, system emoji sprites, bounded particles, soft spotlight, floor lava and shake capped at six logical pixels. Rendering observes snapshots without modifying simulation or moving entities independently. Added synthesized WebAudio effects behind an explicit sound gesture. Added keyboard, pointer and scaled coordinate input, blur cleanup and a practice play page built by Vite. Double tap S or Shift + S skips so a normal S press remains available for WASD movement.

Documented the installed Noto Color Emoji fallback stack and original synthesized audio in ASSETS.md. Added seven renderer and input tests, including exact snapshot coordinates and an engine purity guard, plus a trusted web asset smoke test. npm test passed on Node 22.11 and npm 10.9: 16 files, 127 tests. Type checks and Vite build passed.

## T12

Added shared browser protocol types and a server authoritative gauntlet with five distinct approved games, newest viewer approvals first, classic fill, title cards, 3 2 1 countdown, play, result and final score phases. Sessions begin with three lives. Skips preserve lives, stops are idempotent, and three losses end the run. Integer speed percentages advance the unchanged 60 Hz engine through a rational accumulator. Humanish bot play remains explicitly labeled as a mock demo mode.

The server pushes snapshots over WebSocket and accepts input only from a claimed local play connection. The play page now renders those snapshots and offers sound, skip and start controls. Added persistent gauntlet and play records, designer beats and ResultsSink hooks. MockResultsSink records honest simulated clip requests and result chat lines, with no fabricated clip URLs. Privacy deletion resets sessions referencing the forgotten designer.

Added 12 state machine, life exhaustion, determinism, speed, API and socket input tests. npm test passed on Node 22.11 and npm 10.9: 18 files, 139 tests. Type checks and Vite build passed.

## T14

Added a transparent 1920 by 1080 OBS overlay with a 48 pixel safe margin, live factory job cards and stages, truthful receipt labels, a now playing designer card, lives, speed, actual designer beats, gauntlet score and queue or mock result ticker. The center remains transparent for gameplay. A backdrop query supports transparency inspection without changing the OBS source. There are no flashing or scrolling effects.

Added shared receipt formatting tests to keep mock and seed receipts distinct from completed live CLI receipts. npm test passed on Node 22.11 and npm 10.9: 19 files, 141 tests. Type checks and the Vite build passed. Full screenshot inspection follows in the integrated demo task.

## T15 and integrated demo experience

Built the Vite control room with approval cards, all three bot win rates, difficulty bars, truthful receipts, approve and reject actions, full collection browsing and an isolated Canvas preview dialog. Start opens the play window. Stop, skip and the persistent kill switch are available beside the active show. Added persisted mod and VIP auto approval rules that run only after independent validation. Added a live bounded word editor and generated title filtering. Blocked phrases stay collapsed by default so they do not appear in shared screenshots.

Replaced the old panel with a dedicated mock chat page, actual acknowledgments and mock result messages. The server now prints all four URLs and OBS setup. Added demo:auto using the real source, queue, mock runner, validator, approvals and five round humanish play. A fresh database is used by default. The fixed seed completes with four wins, one designer win and two lives left. Added monotonic snapshot revisions, 60 Hz state delivery, stable cursor aim, mouse mash input and a gameplay objective HUD outside the arena so random targets remain unobstructed. The OBS now playing card mirrors the objective and time. Queue messages return after the result ticker.

Added Playwright as a development dependency and npm run shots. The script uses installed Chrome, captures seven 1920 by 1080 images, checks transparency and safe margins, waits for the complete unattended run, then verifies real keyboard movement, double tap S, preview isolation, auto approval controls and word editing. All browser checks passed without uncaught page errors. Inspected every PNG, refined the layouts and recaptured the final images. The committed manifest records actual frames and outcomes. Screenshots contain simulated factory and clip labels, not fabricated live generation or clip URLs.

Added five Vitest tests for auto approval, live settings, a finished demo:auto gauntlet, full frame delivery and steady cursor aim. Updated setup, OBS, security, asset and Codex evidence docs. Final npm test passed on Node 22.11 and npm 10.9: 21 files, 146 tests, 7.03 seconds. Type checks and all four Vite page builds passed. npm run shots passed. npm audit reports zero vulnerabilities. Real Helix clip creation remains the requested next milestone. No blockers.
