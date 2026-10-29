# Record a video

Run these commands from a fresh clone with Node 22.11 or newer.

```sh
npm install
npm run demo:video
```

No credentials are needed. This command forces mock chat, mock generation and local moderation. It never calls Twitch or OpenAI. Every generated game still goes through the server schema, safety, bot and quality gates.

Open these pages:

* Play: http://127.0.0.1:3000/play/?sound=1
* Overlay: http://127.0.0.1:3000/overlay/?backdrop=1&sound=0
* Chat: http://127.0.0.1:3000/chat/
* Approvals: http://127.0.0.1:3000/dashboard/

The terminal prints the actual URLs if PORT is set. Click the play page once to enable synthesized sound. Capture the play window and add the overlay as an OBS browser source at 1920 by 1080. Remove backdrop=1 for transparency. Keep one sound source enabled to avoid doubled audio.

## The schedule

Each loop lasts 110 seconds on a normal machine. At the beginning the show announces a new cycle. Pitches arrive from second 6 through second 22. Funny viewer ideas enter the factory while hostile instructions, a link and an empty pitch are rejected or ignored. Moderation notices appear in chat and the overlay ticker. Factory steps are clearly simulated.

At second 29 the script waits for independent validation, approves the five games and posts visible approval notices. At second 35 the branded gauntlet intro starts. The existing humanish bot uses its reaction delay and noise to win some games and lose some. Five rounds lead to designer credits and both leaderboards. Results stay visible until second 110.

A slow computer finishes the actual validation and gauntlet before restarting. The script never invents a result to meet a deadline. Each cycle clears only its scripted viewer records and starts a fresh mock replay adapter. This avoids exhausting the finite replay pool. Clients stay connected to the same server. Reconnecting pages receive the current server state.

```sh
npm run demo:video -- --hold
npm run demo:video -- --seed=8
npm run demo:video:check
```

The default seed is verified to complete all five games with mixed results. A different seed is repeatable but can lose all three lives earlier. The hold flag leaves the final credits on screen. Stop with Ctrl+C. These are demo records in a fresh local session database, separate from the live database by default.

## Headless capture

```sh
npm run record
```

The recorder starts its own isolated mock session on port 3098 and writes a 112 second play page video to shots/demo.webm. It uses the installed Playwright and /usr/bin/google-chrome, or Playwright Chromium if available. CHROME_PATH can select another local Chromium executable. If Chromium is missing it prints an installation command and skips recording.

Playwright video contains no audio. Use OBS to record synthesized sound. The recorder uses a fixed 1920 by 1080 viewport and closes its browser and server when done. The generated video is optional and is ignored by git. The browser binary is the only extra local requirement beyond npm install.

## Verification

This mode was checked on Node 22.11 and npm 10.9 from a clean local clone. npm ci succeeded, the build passed and demo:video:check completed two cycles without credentials. The real time browser recording completed all five games with four wins, one loss, two lives and 700 points. Reloading the play page kept the finished results and produced no browser errors. The 112 second WebM was generated successfully. The opening card and final credits were inspected at 1920 by 1080.

The repository test suite passes 204 tests across 34 files. The scheduler tests cover delayed ticks, action ordering, duplicate prevention and invalid seeds. The full cycle check covers fresh replay selection, moderation, approvals, repeatable outcomes, final hold and looping.
