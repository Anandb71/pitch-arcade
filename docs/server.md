# Server and mock modes

The server binds to 127.0.0.1. The control room at /dashboard/ shows factory work,
pauses the arcade and approves or rejects games. The mock chat page is /chat/.
Its DOM uses textContent for all chat and model data.
The WebSocket at /events broadcasts sanitized factory and state events.

## Commands

* npm run demo starts the offline panel with simulated factory steps and local moderation.
* npm run dev starts the mode selected in .env.
* npm run demo:check runs the full pipeline without opening a browser or network connection.
* npm run forget -- <login> deletes a user's stored records.
* npm run mock:twitch starts the local EventSub wire fixture on port 8081.
* npm run mock:replay sends five pitches through that fixture.
* npm run library:seed rebuilds the twenty seed games and honest validation receipts.
* npm run factory:check verifies the Codex sandbox without a model call.

Node 22.11 needs --experimental-sqlite. The npm scripts supply it.
better-sqlite3 installed but crashed in the target runtime smoke check,
so storage uses node:sqlite behind SqlDatabase.
A light-my-request override keeps Fastify injection compatible with Node 22.11.
The newer injection helper requires an ESM loading behavior unavailable in that runtime.

## Environment

| Name | Purpose |
| --- | --- |
| MOCK_TWITCH | Set to 1 for the fake chat endpoint |
| MOCK_CODEX | Set to 1 for simulated factory replay |
| MOCK_EVENTSUB_URL | Optional local mock socket, such as ws://127.0.0.1:8081 |
| MOCK_TWITCH_PORT | Port for the separate mock server, default 8081 |
| PORT | Arcade port, default 3000 |
| ARCADE_DB_PATH | Persistent SQLite path |
| PITCH_COOLDOWN_MS | User cooldown, default 120000 |
| PITCH_QUEUE_CAP | Active factory capacity, default and maximum 20 |
| FACTORY_MAX_JOBS_PER_HOUR | Job budget, default 20 |
| FACTORY_MODEL | Live CLI model, default gpt-6-luna |
| OPENAI_API_KEY | Optional OpenAI moderation key |
| TWITCH_CLIENT_ID | Registered Twitch application ID |
| TWITCH_CLIENT_SECRET | Application secret kept in .env |
| TWITCH_BROADCASTER_LOGIN | Expected broadcaster login |
| TWITCH_BOT_LOGIN | Expected bot login |
| TWITCH_TOKEN_PATH | Private token file outside the repo |
| CODEX_BUILD_THREAD_ID | Verified main build thread override for seed regeneration |

See [Twitch setup](twitch.md) for authorization, scopes, reconnect behavior and the local protocol simulation. The CLI factory uses existing ChatGPT sign in. It does not forward CODEX_API_KEY or other parent API credentials to job commands. No SDK package is needed.

## Local API

Read state with GET /api/state and approved games with GET /api/library.
GET /api/health identifies this server and its mock flags.
Mutation requests require the X-Arcade-Control header with value local.
The server rejects unrelated Host and Origin values and does not enable CORS.
The header is a browser request guard, not a secret. Local OS users are trusted.

```sh
curl http://127.0.0.1:3000/api/mock/chat \
  -H 'Content-Type: application/json' \
  -H 'X-Arcade-Control: local' \
  -d '{"login":"priya","role":"viewer","text":"!pitch dodge falling tacos"}'
```

POST /api/mock/chat exists only in mock Twitch mode.
The simulated roles are broadcaster, mod, vip, sub and viewer.
Real roles come from EventSub identity and badges, never chat text.

POST /api/arcade accepts an enabled boolean.
POST /api/games/:id/approve approves a built game.
POST /api/games/:id/reject removes a game from the approved library.
POST /api/users/:login/forget cancels that user's work and deletes their records.

## Queue and persistence

Pitch text has at most 120 Unicode characters after normalization.
Commands use a two minute configurable cooldown, a 20 job active cap,
similarity dedupe and FIFO ordering inside each role priority.
Broadcaster, mod, VIP, sub and viewer is the priority order.
Only broadcaster and mod chat messages can use !arcade on or !arcade off.
The kill switch pauses queue intake and aborts running workers.
Its state survives server restart.

SQLite has users, pitches, builds, games, gauntlets, plays and events.
settings holds the persistent kill switch.
Built games remain unavailable to play until approved.
The server reruns the harness before saving a built game.
Seed games are trusted local fixtures that are independently validated at startup.
Interrupted builds are recorded as failed and their pitches return to the queue on restart.

Moderation uses the OpenAI endpoint when OPENAI_API_KEY is set.
Without it, the local heuristic is labeled as such.
The forced demo mode uses the heuristic even if a key exists in .env.
Moderator timeouts and errors reject the pitch.
The endpoint follows the official
[moderation guide](https://developers.openai.com/api/docs/guides/moderation).

## Privacy

npm run forget uses the running server at PORT when available.
For a stopped server, select the database with ARCADE_DB_PATH.
For example, ARCADE_DB_PATH=data/demo.sqlite npm run forget -- priya deletes from a saved demo.
The command removes related pitches, builds, games, plays and user audit events.
A running server also removes in-memory acknowledgments and factory steps and cancels active jobs.
Stopped job folders for that user's pitches are removed by the CLI.
SQLite uses secure_delete and checkpoints its WAL after deletion.

Nonpitch conversations are not persisted. Command output, stderr, credentials and agent prose are not logged.
Only pitch text and basic Twitch identity are retained with the necessary game and build records.

## Browser clients

The dashboard is now at /dashboard/, the play page at /play/,
the transparent OBS source at /overlay/ and mock chat at /chat/.
The root URL also serves the dashboard.
npm run demo prints all four URLs and OBS instructions.

The server owns the active gauntlet and engine.
A fixed tick clock advances title, countdown, play, result and final score phases.
Every engine frame is pushed to connected clients.
Snapshots have monotonic revisions so an older HTTP response cannot restore an earlier phase.

POST /api/gauntlet/start begins a five game session.
POST /api/gauntlet/skip preserves lives and skips the current game.
POST /api/gauntlet/stop ends the session.
The start body can include an integer seed. Autoplay is accepted only in mock Twitch mode.
Player input uses a claimed local WebSocket connection, separate from all chat sources.

POST /api/settings updates autoApproveMods, autoApproveVips and a bounded denylist.
Rules persist in SQLite and apply to new builds after independent validation.
The word list updates intake immediately and also filters generated titles.
Settings audit events store counts rather than the blocked phrases.
GET /api/state includes settings, current gauntlet, designer beats and labeled result ticker items.

MOCK_FACTORY_STEP_MS optionally sets replay step timing.
DEMO_AUTO is set by npm run demo:auto.
Its mock-only /api/demo/freeze endpoint exists for screenshot capture.
Normal and live sessions do not expose that endpoint.
See docs/demo.md for unattended capture and OBS placement.

The loss hook is a ResultsSink interface.
MockResultsSink records simulated clip requests and chat result lines.
RealResultsSink uses the live Helix client, posts confirmed clip links and sends the final gauntlet summary. Clip and chat errors stay separate from gameplay. The local protocol demo uses the same sink against fake Helix and labels its links simulated. Public Twitch delivery is not yet verified.
