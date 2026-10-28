# Pitch Arcade plan

Viewers author games through chat. Codex designs JSON data and iterates against a deterministic playtest. The streamer approves and plays.

## Foundation milestone

T01 creates npm workspaces and strict TypeScript checks.
T05 defines a closed version 1 schema, semantic validation and curated examples.
T06 implements a 60 Hz simulation with seeded randomness and frame inputs.
T08 runs idle, random and delayed humanish bots on 40 seeds. A bundled CLI travels with each factory job.

The engine uses a logical 960 by 540 arena. It owns movement, spawning, collision and outcomes.
Rendering observes snapshots. It cannot change simulation state.
The harness imports that same engine and reports measured rates and safety failures.

## Next milestones

The server will use SQLite tables users, pitches, builds, games, gauntlets, plays and events.
Pitches move through received, filtered, queued, building, built, failed, approved or rejected.
Build receipts store thread, model, timing, playtests and tokens. Games store the exact spec and independent report.
Only pitch text and basic Twitch identity are retained. A forget command will delete user rows.

EventSub supplies channel.chat.message. Helix sends replies and creates clips asynchronously.
A local WebSocket mock will replace Twitch CLI for offline tests. No credentials are needed in mock mode.
OBS gets a transparent overlay. The play page captures streamer input. The dashboard controls approval and the kill switch.

Each factory job copies the template into a fresh git repo. Two workers get 150 seconds and four playtests each.
The runner must scrub its environment, disable network and deny secret paths. Its output is data only.
The server reruns validation and playtests independently before approval.
Runtime sandbox configuration will be verified during T09 rather than trusting the sketch.

No Affiliate features, Extensions, viewer controlled play or remote game code are planned.
Browser rendering, Twitch connectivity and runtime factory integration are later tasks.

## Second milestone implementation

T11 now handles typed chat sources, moderation, cooldowns, queue bounds, dedupe and role priority.
SQLite uses a small synchronous port with node:sqlite after the better-sqlite3 target runtime check failed.
All section 7.11 tables exist. The kill switch persists in settings.

T09 now uses a CLI adapter and an explicit mock adapter.
The verified permission profile extends :workspace, narrows writes to out and denies secret reads.
The runner checks actual OS boundaries before live jobs and never adds an SDK dependency.
The build syncs the complete factory template from canonical sources.

T10 now independently validates output, stores built games and requires approval.
The local Fastify panel, mock HTTP feed, EventSub mock replay, twenty measured seed games,
privacy deletion and scripted offline demo connect the pipeline end to end.
OAuth refresh, clips, browser gameplay and OBS remain later milestones.

## Third milestone implementation

T07 now draws engine snapshots with Canvas, all palettes and patterns, system emoji,
bounded effects, synthesized audio and keyboard or mouse input.
The Vite play window receives authoritative snapshots from the local server.

T12 now owns the five game state machine, deterministic speed scaling, lives, skips,
score cards and persistent play outcomes. New viewer approvals lead the lineup.
The server records designer beats and emits ResultsSink loss hooks.

T14 adds the transparent OBS factory, current game, lives, leaderboard and ticker.
T15 adds the control room, isolated preview, approval rules, word editor and mock chat.
A shared protocol connects every browser page over WebSocket.

The unattended demo exercises the real pipeline with explicit mock generation and result labels.
Playwright captures seven inspected images and verifies browser controls and a finished run.
OAuth refresh and actual Helix clip handling remain next.
