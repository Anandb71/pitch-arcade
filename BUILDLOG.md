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
