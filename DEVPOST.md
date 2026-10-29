# Pitch Arcade

Tagline: Your chat makes five second games. Codex builds them. You try to survive.

YouTube URL: TODO add the public submission video URL

Codex session ID: 01a18380-92df-7fb1-84cd-1b45659bee41

## Inspiration

Chat is full of strange game ideas. Most disappear after one joke. We wanted those ideas to become something a streamer could actually play while everyone watched the build happen.

The best moment is a tiny game that looks silly and still takes a life. Its designer gets the credit. The streamer gets another round.

## What it does

Viewers type `!pitch` and a short idea. Pitch Arcade queues the pitch, checks it and gives it to a constrained Codex factory. The factory writes a five second game as JSON and tests it with bots. The streamer approves games in a dashboard and plays a five game gauntlet with three lives.

A transparent OBS overlay shows the factory, designer credit, lives, queue and toughest designers. Real Twitch adapters can request a clip after a loss and post a link. A fully local demo works without credentials.

## How we used Codex

### Build

One main Codex thread built the original TypeScript application, deterministic engine, JSON format, bots, Twitch adapters, dashboard and demo tooling. Tests guided the engine, harness and Twitch work. The same thread reviewed the boundaries, fixed six findings and captured browser evidence.

The final suite has 201 passing tests. The build record names each task and its validation. The main session is 01a18380-92df-7fb1-84cd-1b45659bee41.

### Runtime

Codex is also part of the product. Each live factory job gets an isolated workspace, protected instructions, a pitch inbox and a writable output folder. It writes data and runs the trusted playtest tool. Sanitized tool events show viewers the build steps. The server reruns validation before approval.

Three actual CLI jobs passed. Their median build time was 15.900 seconds, with two playtests each. The prompt injection pitch became a harmless catching game. Receipts record real job thread IDs, usage and difficulty reports. Mock mode is explicitly a replay and makes no model call.

### Technological implementation

The runtime model does not write executable gameplay code. It composes a closed set of controls, motions, goals and visual choices. That makes generation testable within a short stream moment. Deterministic simulation lets the same game run in the bot harness and the streamer's gauntlet.

## How it works

Twitch EventSub WebSocket delivers chat messages. Intake applies length bounds, cooldown, similarity checks, role priority and moderation. SQLite stores the queue, approvals and results. Two factory workers run Codex CLI jobs with a 150 second deadline.

JSON Schema and semantic validation check the game. Forty seeds with idle, random and humanish bots measure difficulty and reject broken games. The server owns the 60 Hz game clock. Canvas renders its snapshots. WebSocket updates keep the play page, overlay and dashboard together.

OAuth connects a broadcaster and bot. Helix sends paced chat and creates clips with twenty second duration. Clip and chat failures do not block play. The local Twitch simulation uses the same clients against fixture servers.

## Safety

Chat and model output are untrusted. They cannot choose code, shell commands or file paths. The factory has a verified permission profile with command network access disabled and protected tools. Output strings, emoji, titles and verbs are checked. Secret shaped chat is dropped before persistence. Approval gates viewer games.

Controls bind to loopback and check Host and Origin. The game has bounded effects and no full screen flashes. Viewer messages author ideas rather than control the streamer. This uses no Affiliate features or Extensions.

## Challenges

Fast generation is only useful if a game is playable. We built bots with reaction delay and noise so a technically valid game still had to pass a difficulty check.

The host's native SQLite package failed its target runtime check. A small storage interface let us use Node's built in SQLite instead. Codex permission profiles also needed real OS probes. The factory fails closed when those probes or the verified CLI version do not match.

Local Twitch fixtures let us test reconnects, refresh and clip polling without accounts. We keep that evidence separate from live channel claims.

## What we learned

A small game vocabulary creates a useful boundary for model output. Independent testing matters more than a model saying its game passed. Showing honest build steps can be part of the entertainment, even before the game starts.

A final review also found races that happy path demos missed. Forgetting a designer and pausing intake now invalidate pending moderation work.

## What's next

Authorize the bot and broadcaster on a real channel. Verify public chat delivery, a published clip and OBS composition while live. Record the submission video. More motion combinations and streamer chosen difficulty could follow after that check.

Live Twitch authorization and clip publication have not been demonstrated in this environment. The committed screenshots use local sessions. Real Codex receipts are labeled separately from simulated clip URLs.

## Built with tags

TypeScript, Node.js, npm workspaces, Codex CLI, Twitch EventSub, Twitch Helix, Fastify, WebSocket, SQLite, Ajv, Canvas 2D, WebAudio, Vite, Vitest, Playwright, OBS
