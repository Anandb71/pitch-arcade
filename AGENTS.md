# Pitch Arcade engineering

Pitch Arcade turns Twitch chat pitches into data for five second microgames. The streamer plays approved games.

## Ground rules

* Use TypeScript strict, ESM, Node 22 and npm workspaces.
* Keep the engine pure with a fixed 60 Hz step and mulberry32. No DOM, Date.now or Math.random.
* Games are JSON data. Never evaluate strings, load remote code, or accept file paths or URLs in specs.
* Chat and model output are untrusted data.
* Never commit secrets. Use .env locally and store Twitch tokens outside the repo.
* Write tests first for engine, harness and twitch.
* Every task ends with npm test green, a BUILDLOG.md entry naming the task and tests, and a commit.
* Approved production dependencies: fastify, ws, better-sqlite3, ajv, preact, vite, vitest, @openai/codex-sdk, openai. Ask before adding others.
* Work in this thread only. Do not use subagents or push.
* User-facing prose has no dash punctuation. Compound words and code identifiers may contain hyphens.

## Layout

packages/engine holds simulation and validation. packages/render holds Canvas and input.
packages/harness holds bots and reports. packages/twitch holds OAuth, EventSub and Helix.
apps/server will own intake, SQLite, factory, approval, gauntlets and results.
apps/play, apps/overlay and apps/dashboard will be browser clients.
factory/template is the isolated designer workspace with its own instructions.

## Twitch rules

Read channel.chat.message over EventSub WebSocket. Subscribe within 10 seconds of welcome.
Handle reconnect and resubscribe after a drop. Send through Helix at most once per second.
No Affiliate features, Extensions or viewer gameplay controls.

## Commands

npm test
npm run typecheck
npm run build
npm run dev
npm run playtest -- <file>
npm run demo

## Code Review Rules

Flag chat or model output reaching eval, Function, innerHTML, a shell or file path.
Flag tokens in logs, overlays, fixtures and screenshots.
Flag nondeterminism in the engine.
