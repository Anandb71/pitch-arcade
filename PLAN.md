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
