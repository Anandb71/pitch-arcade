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

Register a confidential app. The device flow below needs no localhost callback. For the optional redirect flow, register `http://localhost:8787/callback`. That helper uses port 8787 independently of the arcade's port 3000. Keep the redirect exact, including localhost rather than 127.0.0.1.

```sh
cp .env.example .env
```

Fill TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_BROADCASTER_LOGIN and TWITCH_BOT_LOGIN. Leave MOCK_TWITCH and MOCK_CODEX empty for live operation. Use MOCK_CODEX=1 if you want real Twitch with simulated generation.

### Headless device authorization

Keep TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in the environment or your private .env file. Never paste either value into chat, logs or a screenshot. Set the expected login names before starting.

```sh
npm run auth -- --device --role=broadcaster
npm run auth -- --device --role=bot
npm run auth:check
npm run doctor
```

Run the two device commands separately. Each prints its verification page, a user code, the expiry and the account role and login you should use. Open the page on a phone or another computer. Enter the user code and authorize while signed in as the expected account. Leave the terminal running until it confirms the private save. No browser needs to connect back to the headless box.

Polling follows Twitch's interval. A pending request keeps waiting. A slow down adds five seconds to later polls. Connection failures get at most three retries. A denial or expired code exits with a friendly error and a nonzero status. Run the same command again for a fresh code. Do not share the displayed user code during authorization.

The bot requests user:read:chat, user:write:chat and user:bot. The broadcaster requests channel:bot, clips:edit and user:read:chat. TWITCH_STRETCH=1 adds the existing optional pin or marker scope for the chosen role. Old broadcaster grants without the added scopes need authorization again.

Device authorization has been checked with fake fetch only. This task made no live Twitch identity requests. Complete the live grant with your own account before relying on it during a stream.

### Local redirect authorization

```sh
npm run auth
```

Use the broadcaster account for the first URL and the bot account for the second. The terminal prints a local launch link, which redirects the browser without printing the app ID. This flow uses the registered http://localhost:8787/callback URL. A browser on another machine cannot reach that local listener without a separate connection setup. Prefer the device commands on a headless host.

### Private storage and refresh

Both flows save to the same token file at `~/.config/pitch-arcade/tokens.json`, with mode 0600. TWITCH_TOKEN_PATH may choose another private path outside the repo. The access token, refresh token, expiry, identity and granted scopes are saved after validation. The device code and app credentials are not saved there. An existing account grant is preserved if a new device authorization fails validation.

Confidential token and refresh requests send the client secret. Replacement refresh tokens are saved atomically. The check command validates both accounts and prints only recognized scope names. The doctor command reads the same token file. It makes a live reachability check when you run it.

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
