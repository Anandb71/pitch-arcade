# Pitch Arcade

Your chat makes the games. You have to survive them.

Chat pitches a five second game. A constrained Codex factory writes JSON data,
tests it with bots and waits for approval. The streamer plays five approved games
with three lives while the OBS overlay credits their designers.

## Try it

Use Node 22.11 or newer and npm 10.9 or newer.

```sh
npm install
npm run demo
```

The command prints four local URLs:

* Play window: http://127.0.0.1:3000/play/
* OBS overlay: http://127.0.0.1:3000/overlay/
* Control room: http://127.0.0.1:3000/dashboard/
* Mock chat: http://127.0.0.1:3000/chat/

Send !pitch dodge falling tacos from mock chat. Watch the factory,
approve the game in the control room, then start a gauntlet.
Twenty validated classics fill any gaps in the five game lineup.

The demo needs no credentials, Codex installation or internet connection after dependencies are installed.
It forces mock Twitch, mock Codex and local moderation.
Every factory replay and clip request is labeled as simulated.

## Let it run itself

```sh
npm run demo:auto
```

Five simulated designers pitch games. Factory steps arrive, scripted approvals
put them in the library, and the humanish bot plays a complete gauntlet.
More pitches wait in the control room for your review.
The run finishes on its score card. A fresh demo database is used by default.

```sh
npm test
npm run demo:check
npm run shots
```

The screenshot script starts its own scripted session, uses the installed Chrome
or Playwright Chromium, and writes seven 1920 by 1080 PNGs into shots.
It checks three distinct games, transparent OBS output, isolated previews,
keyboard movement, the S skip gesture, settings controls and a finished gauntlet.
The committed screenshots are from real mock session state, not staged game outcomes.

## Play and produce

Arrows or WASD move. Mouse clicks or space hit targets.
Space or mouse taps mash. Double tap S or press Shift + S to skip.
A normal S press remains the down key for WASD.
Skips preserve lives. The game clock speeds up each round while the engine
continues taking fixed 60 Hz steps.

The control room previews games locally, shows all bot win rates,
approves or rejects games, edits the blocked word list and controls the show.
Auto approval rules for mods and VIPs apply only after independent validation.
Pause arcade stops intake, cancels factory jobs and ends the active gauntlet.

See docs/demo.md for OBS placement and capture details.

## Configure live adapters

Copy .env.example to .env and fill only the names you need.
Use npm run dev for the configured mode and npm run demo for offline mode.
CLI generation uses existing Codex sign in with a verified sandbox.
A supplied bot token can connect EventSub and send rate limited acknowledgments.

OAuth setup, token refresh and real clip creation are later milestones.
ResultsSink exposes the loss hook now. MockResultsSink records requests and
result chat lines without inventing clip URLs.

```sh
npm run factory:check
npm run mock:twitch
npm run mock:replay
npm run forget -- priya
npm run playtest -- library/01-taco-rain.json
```

The local EventSub mock and replay replace Twitch CLI.
The forget command removes a designer's stored records and related work.

See docs/server.md for environment settings, docs/factory.md for the CLI policy,
ASSETS.md for fonts and synthesized sound, and SECURITY.md for boundaries.
AGENTS.md, PLAN.md and BUILDLOG.md record the engineering process.
