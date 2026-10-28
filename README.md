# Pitch Arcade

Your chat makes the games. You have to survive them.

Pitch Arcade turns chat pitches into data for a deterministic microgame engine.
The factory checks every game with bots. You approve what enters the library.

The first two milestones include the engine, playtest harness, local server,
factory adapters, moderation, approval controls and persistent storage.
Browser gameplay, the OBS overlay, OAuth setup and clips are later milestones.

## Try the offline factory

Use Node 22.11 or newer and npm 10.9 or newer.

```sh
npm install
npm run demo
```

Open http://127.0.0.1:3000. Send a mock pitch as any user and role.
The factory shows simulated steps, then the game appears for approval.
Approve it to add it to the channel library. Twenty curated seed games are ready already.

The demo needs no credentials, Codex installation or internet connection after dependencies are installed.
It forces mock Twitch, mock Codex and local moderation even if a local API key is configured.
Simulation is labeled in the UI and every mock receipt.

```sh
npm test
npm run demo:check
npm run playtest -- library/01-taco-rain.json
```

The scripted demo check exercises mock chat, queueing, factory replay,
independent validation, approval and library publication.
The tests also replay chat through an actual local EventSub WebSocket server.

## Local settings

Copy .env.example to .env and fill only the settings you need.
The example lists names with empty values. Secrets stay untracked.
Use npm run dev for the configured mode. Use npm run demo for a guaranteed offline session.
The demo uses data/demo.sqlite unless ARCADE_DB_PATH is set.
Configured mode uses data/arcade.sqlite by default.

```sh
npm run forget -- priya
```

The forget command uses a running local server when available.
Otherwise it deletes from the database selected by ARCADE_DB_PATH.
Set PORT if the server uses another port. See docs/server.md for details.

## Factory and Twitch adapters

```sh
npm run factory:check
npm run mock:twitch
npm run mock:replay
```

The factory check verifies the installed Codex sandbox without making a model call.
The mock Twitch server and replay commands replace Twitch CLI.
To connect a demo to that socket, set MOCK_EVENTSUB_URL to ws://127.0.0.1:8081.
Keep the mock server and arcade running while replaying from another terminal.

Live chat can use a supplied bot token with EventSub and rate limited Helix acknowledgments.
OAuth login and token refresh remain later tasks.
See docs/server.md for environment names and docs/factory.md for the verified CLI policy.

Thirty template examples cover every allowed verb and MVP enum.
The factory tool is generated from source and works in a copied template.
See packages/engine/SPEC.md and packages/harness/README.md for the data and playtest rules.

AGENTS.md records the engineering rules. PLAN.md explains the architecture.
BUILDLOG.md records completed tasks and test evidence. SECURITY.md describes the boundaries.
