# Pitch Arcade

Tagline: Your chat pitches five second games. Codex builds them. Three lives says you cannot survive all five.

YouTube URL: TODO add the public submission video URL

Codex session ID: 01a18380-92df-7fb1-84cd-1b45659bee41

## Inspiration

Every stream has that one chatter with a terrible game idea. We wanted to hand them a design credit and make the streamer play it.

Falling tacos. An octopus picnic. A ghost who is late for the moon. The joke gets better when it becomes a real challenge and costs the streamer a life. Chat gets to say, "I made that."

## What it does

Viewers send `!pitch` and a short idea. A constrained Codex factory creates a five second microgame as JSON, runs bot playtests and sends it for approval. The streamer takes on five approved games with three lives and a faster pace each round.

A hype intro and countdown kick off the run. Synthesized sound, particles, brief hit stop and combo pops give tiny actions some weight. The transparent OBS overlay shows live factory steps, the queue, designer credits and leaderboards. The dashboard handles previews, difficulty reports, approvals and the kill switch.

Wins build a scoring streak. A loss pays the designer and requests a clip through the Twitch adapter. Final results credit every game. Designer totals and player high scores persist in SQLite, with bot runs labeled.

One command, npm run demo:video, runs the whole 110 second show without credentials. Funny pitches, moderation rejections, simulated builds and approvals lead to a humanish bot run with wins and losses. It loops for recording or holds the final leaderboard.

## How we used Codex

### Build

One main Codex thread wrote the original TypeScript application, deterministic engine, closed game format, bot harness, Twitch adapters, browser clients and recording tools. The same thread reviewed the safety boundaries, fixed six findings and inspected browser captures. Tests guided the engine, harness and Twitch implementation.

The suite now passes 219 tests in 35 files. BUILDLOG.md records the work and validation. The main session is 01a18380-92df-7fb1-84cd-1b45659bee41.

### Runtime

Codex is also the designer inside the product. A live factory job runs the installed CLI with gpt-6.1-sol by default. It gets an isolated workspace, protected tools, an untrusted pitch inbox and a digest of recent mechanics and themes. It writes JSON and runs the trusted playtest tool. Sanitized events show the build steps without publishing raw model or shell output.

Three actual runtime jobs were measured earlier with gpt-6-luna. Their median build time was 15.900 seconds, with two playtests per game. Total reported usage was 461039 input tokens and 3096 output tokens across tool turns. The injection pitch became a harmless catching game. Real receipts live beside the games.

Those numbers describe the earlier spike. The current Sol default and newer quality prompt have not had another real spike. Mock mode makes no model call and labels its factory progress as simulated.

### Technological implementation

The model composes known controls, motions, goals and visual choices rather than executable gameplay code. The server independently validates the output and reruns forty seeds with idle, random and humanish bots. New games then face nine extra quality gates for skill separation, input responsiveness, engagement and novelty. Changing a title or palette cannot hide a duplicate mechanic.

A failed quality check can request one repair within the original 150 second deadline and four playtest budget. Approval happens only after the independent gates pass. The deterministic engine drives both bot evaluation and the streamer's game.

## How it works

EventSub WebSocket supplies chat. Intake applies length bounds, cooldown, role priority, duplicate checks and moderation. SQLite stores the queue, approvals, receipts and results. Two factory workers run isolated CLI jobs. A closed JSON Schema, semantic checks and string scans protect the game boundary.

The server owns the fixed 60 Hz simulation. Canvas renders its snapshots while WebSocket updates keep the play page, overlay and dashboard together. Render feedback never changes the engine outcome. Effects respect reduced motion and avoid full screen flashes.

OAuth connects the broadcaster and bot. Helix sends paced chat and requests twenty second clips after losses. Failures do not block the game. The Twitch simulator exercises these same clients against local fixture servers.

## Safety

Chat and model output are untrusted data. They cannot select code, shell commands, remote resources or file paths. Factory command network access is disabled. Protected tools and OS boundary probes must pass before generation. The server checks titles, emoji, verbs, secret patterns and game limits before independent playtesting.

Controls bind to loopback and check Host and Origin. Secret shaped chat is dropped before persistence. Human approval or an explicit trusted role rule gates viewer games. Heuristic moderation has limits and is described honestly.

Viewers design ideas rather than control gameplay. No Affiliate features or Extensions are required.

## Challenges

A valid game can still be boring. We added paired input checks, skilled versus random win rate separation, event variance and fingerprints that ignore cosmetic reskins. The v1 vocabulary has limits, so prompts adapt unsupported ideas honestly or reject them.

A polished unattended demo also needed repeatable timing without fake outcomes. Stable approval order, a fixed seed and a humanish bot now produce five games, four wins and one loss. Every loop still passes the independent gates.

The native SQLite package failed its target runtime check. A small storage interface let us use Node's built in SQLite. Codex permissions needed real OS probes and a version guard. Local Twitch fixtures let us test reconnects and clip polling without claiming a live broadcast.

## What we learned

A small vocabulary makes generated games easier to test and safer to play. Independent evidence matters more than the model saying it passed. Clear credits and an honest factory timeline turn the build itself into part of the show.

Testing interruption paths also mattered. Forgetting a designer and pausing intake now invalidate pending moderation work. A pretty demo still needs those boundaries.

## What's next

Authorize real accounts, verify public chat and a published clip, and check OBS composition during a live stream. Record and publish the submission video. A new runtime spike should measure the current Sol prompt and quality gates before making new performance claims.

Live Twitch authorization and clip publication have not been demonstrated in this environment. Screenshots and the recording demo use local sessions. Real Codex receipts are labeled separately from simulated clip URLs.

## Built with tags

TypeScript, Node.js, npm workspaces, Codex CLI, Twitch EventSub, Twitch Helix, Fastify, WebSocket, SQLite, Ajv, Canvas 2D, WebAudio, Vite, Vitest, Playwright, OBS
