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
* npm run library:seed rebuilds the canonical seed collection and honest validation receipts.
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
| ARCADE_ACCESS_TOKEN | Secret with at least 24 characters, required for public hosts |
| ARCADE_PUBLIC_HOSTS | Comma separated exact hostnames or leading wildcard subdomains |
| PITCH_COOLDOWN_MS | User cooldown, default 120000 |
| PITCH_QUEUE_CAP | Active factory capacity, default and maximum 20 |
| FACTORY_MAX_JOBS_PER_HOUR | Job budget, default 20 |
| FACTORY_MODEL | Live CLI model, default gpt-6.1-sol |
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
The server rejects unrelated Host and Origin values and does not enable CORS. Public allowlisted hosts also require the access key or its private cookie.
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

## Points and league tables

GET /api/leaderboards returns designer point totals and player high scores. The same boards travel in /api/state. Round scores reference persisted plays and player identities reference gauntlets. Existing databases gain the two score tables automatically. Legacy wins without streak data count 100 points each. Bots are labeled independently of human players.

Each win earns 100 times the consecutive win count, capped at 5×. A loss gives the designer 100 and resets the player streak. A skip also resets it. Results include per game points, streak and designer credit. Render combo effects are decorative and do not write scores.

## Private access through a quick tunnel

Keep the arcade listener on 127.0.0.1. Install cloudflared separately. Put ARCADE_ACCESS_TOKEN in your private environment or .env file using a URL safe random value of at least 24 characters. Do not print it. Configure the allowed public hostname before restarting the server. Quick tunnels can use this nonsecret setting:

```text
ARCADE_PUBLIC_HOSTS=*.trycloudflare.com
```

For a stable tunnel, prefer its exact hostname. Hosts are ASCII hostnames without a scheme, port, path or trailing dot. Commas separate entries. A leading wildcard matches real subdomains, not the apex or names that only resemble the suffix. Unknown hosts remain forbidden. Forwarded host headers do not grant access.

Start the arcade as usual, then start the tunnel separately:

```sh
npm run start
```

```sh
cloudflared tunnel --url http://localhost:3000
```

The first command is the live Twitch mode. Use npm run demo instead when rehearsing without credentials. cloudflared forwards locally to the same server. Keep its default public Host forwarding and do not set httpHostHeader to localhost. The server never prints an access URL containing the key.

Replace the example hostname with the HTTPS hostname cloudflared prints. Replace YOUR_PRIVATE_KEY privately in the browser or OBS source settings:

```text
https://your-tunnel.trycloudflare.com/overlay/?key=YOUR_PRIVATE_KEY&sound=0
https://your-tunnel.trycloudflare.com/play/?key=YOUR_PRIVATE_KEY&sound=1
https://your-tunnel.trycloudflare.com/dashboard/?key=YOUR_PRIVATE_KEY
```

The OBS overlay is a 1920 by 1080 browser source. The play page can be captured from the streamer machine. Leave backdrop off for a transparent overlay. Each browser profile or OBS source cookie profile must authenticate once. Do not screenshot source settings while the private URL is visible.

A valid key query produces a 303 redirect without the key and a host bound __Host-arcade cookie. The cookie is derived from the secret, not its raw value. It has HttpOnly, Secure, SameSite=Lax and Path=/ attributes and no Domain. Remaining query options such as sound are preserved. The browser attaches the cookie to assets, fetches and WebSockets. Dashboard fetches explicitly use same origin credentials and retain the X-Arcade-Control header. WebSockets need the same host HTTPS Origin. The initial query never reaches browser application code.

API tools may send X-Arcade-Key instead of using a cookie. They still need X-Arcade-Control: local for mutations. Missing or wrong credentials return only Unauthorized. with status 401. No state is returned. Cross origin actions and WebSockets remain forbidden. The server does not trust X-Forwarded-Host or X-Forwarded-Proto for access. Cache and referrer headers protect the entry redirect, and no CORS headers are added.

The shared key grants full dashboard access, including pause, approval and deletion. It is not a public viewer link. Session cookies stay valid for that host while the configured secret is unchanged. Rotate the secret and restart the server to invalidate cookies and close old WebSockets. Invalid public settings fail closed with a message naming only the configuration variables. Loopback access keeps working without a key.

Tests use synthetic credentials and local HTTP and WebSocket fixtures. Browser verification uses a local TLS terminating proxy with a public shaped Host and same host Origin. No Cloudflare tunnel was opened for these checks.
