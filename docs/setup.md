# Setup checklist

Use Node 22.11 or newer, npm 10.9 or newer and git. Run commands from the repository root. SQLite is built into Node and the scripts supply its experimental flag. No native SQLite package needs compiling.

## Try the demo

```sh
npm install
npm run demo
```

Open http://127.0.0.1:3000/dashboard/ and http://127.0.0.1:3000/chat/. Pitch a game, approve it and start a run. Open http://127.0.0.1:3000/play/ for gameplay. `npm run demo:auto` handles pitching, approval and humanish play for you. `npm run demo:twitch-sim` exercises the real wire clients with local fixture servers.

All demos work without credentials. After package installation, normal mock play needs no network. Stop the server with Ctrl+C before switching demos on the same port. PORT can choose another local port.

## Connect Twitch

Create a separate bot account. Enable 2FA before registering a Twitch developer app. In your channel chat run `/mod your_bot_login`.

Register a confidential app with redirect URL `http://localhost:8787/callback`. The authorization helper uses port 8787 independently of the arcade's port 3000. Keep the redirect exact, including localhost rather than 127.0.0.1.

```sh
cp .env.example .env
```

Fill TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_BROADCASTER_LOGIN and TWITCH_BOT_LOGIN. Leave MOCK_TWITCH and MOCK_CODEX empty for live operation. Use MOCK_CODEX=1 if you want real Twitch with simulated generation.

```sh
npm run auth
npm run auth:check
npm run doctor
```

Use the broadcaster account for the first URL and the bot account for the second. The token file defaults to `~/.config/pitch-arcade/tokens.json`. Its mode is 0600. TWITCH_TOKEN_PATH may choose another path outside the repo. The check command prints scopes, never tokens.

Doctor returns 1 if a live requirement is missing. That is expected in a credential free clone. Its checklist tells you what to configure. It checks Twitch ID reachability without sending a token. Offline demos still work if that check fails.

## Connect Codex

Install codex-cli 0.165.0 and sign in with ChatGPT using the CLI. No OpenAI API key is needed for game generation. OPENAI_API_KEY enables only optional moderation. The project does not inspect the CLI authentication file.

```sh
npm run factory:check
npm run start
```

The preflight checks command isolation without a model call. A different CLI minor version is rejected until its profile is reviewed. `npm run factory:spike` makes three real model calls and consumes the signed in allowance. Existing measured results are in [Codex](codex.md).

## Set up OBS

Capture the play window at http://127.0.0.1:3000/play/. Add http://127.0.0.1:3000/overlay/ as a browser source at 1920 by 1080 above it. Keep the backdrop query off. The overlay is transparent and keeps a 48 pixel safe margin.

Crop the window capture to the visible game arena. Preserve its 16:9 ratio, resize the cropped source to 960 by 540 in OBS, and place it at x 480 and y 270 on the OBS canvas. Crop dimensions depend on the window and browser chrome. Read the result card and designer credit before starting the next run.

## Before recording

Run npm test and npm run lint:prose. Run npm run shots if you want refreshed stills. The script needs installed Chrome, Playwright Chromium or CHROME_PATH. Other machines may need `npm exec -- playwright install chromium` once.

Verify live chat, reconnect, acknowledgments and a clip on your own channel. Make sure clips are enabled and the stream category permits them. Check OBS composition and audio. Record the real behavior you can demonstrate, and label all local simulations. Add your video URL to DEVPOST.md.
