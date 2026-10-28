# Demo and OBS

npm run demo starts one local server that hosts all four Vite pages.
The play page uses the Canvas renderer. The control room and mock chat are browser clients.
The overlay has a fixed 1920 by 1080 transparent canvas area.
All pages receive state through the server WebSocket.

## Manual session

1. Open mock chat and send a short idea with !pitch.
2. Watch the factory build a labeled mock replay.
3. Open the control room. Check the humanish, random and idle bot win rates.
4. Preview the game if you like, then approve it.
5. Press Start gauntlet. The play window opens separately.
6. Survive five games. Each round credits its designer and raises the game clock speed.

The lineup uses the newest viewer approved games first, then distinct classics.
Three losses end the run. A skip preserves lives.
A normal S press moves down in four direction games.
Double tap S or use Shift + S to skip without losing WASD movement.
The dashboard also has a skip button.

Sound starts only when you press Sound off to enable it.
All effects are synthesized. There is no music.
The engine and outcomes run on the server, so previews cannot advance the shared game.
Only a claimed local play connection can send player input.
Chat authors games and never controls the player.

## OBS scene

Add a browser source using the printed overlay URL.
Set its width to 1920 and height to 1080.
Keep the URL free of the backdrop query in OBS.

Capture the play window separately. Crop the window capture to the game arena,
preserve its 16:9 ratio, and size it to 960 by 540 on the OBS canvas.
Place it at x 480 and y 270. The side panels leave that area clear.
Put the transparent overlay above the capture.
Its panels and ticker stay within a 48 pixel safe margin.

Use /overlay/?backdrop=1 only when inspecting transparency in a normal browser.
That query adds a dark checker backdrop. It does not change the production source.

## Unattended session

npm run demo:auto uses the same chat source, queue, factory adapter,
validator, approval method, library and gauntlet as a manual session.
It supplies actual humanish bot inputs to the deterministic engine.
The fixed seed of 1 produces four wins and one loss across five viewer games.
The loss records a real designer beat in the demo database and emits a mock clip request.
It does not fabricate a live Twitch clip or a model generation receipt.

The default auto session gets a fresh database under ignored data/auto-sessions.
An explicitly configured ARCADE_DB_PATH is honored.
The forced mock mode removes external moderation credentials from the local demo process.
It makes no real Twitch or model requests.

## Screenshot evidence

npm run shots starts its own server and fresh database, then launches Playwright.
It uses /usr/bin/google-chrome when present, otherwise the installed Playwright browser cache.
Set CHROME_PATH to choose another installed Chromium executable.
No browser download is performed by the script.

The script writes:

* shots/overlay.png with two actual mock jobs building, current gameplay and a designer beat.
* shots/play-title.png with the first viewer game title.
* shots/play-game.png, play-game-2.png and play-game-3.png from three different games.
* shots/dashboard.png with actual validated games awaiting approval.
* shots/chat-panel.png with mock pitches, acknowledgments and a result.
* shots/manifest.json with capture provenance and the actual finished outcomes.

A mock-only freeze endpoint pauses engine ticks for a clean capture.
It does not change entities, outcomes, lives or leaderboard values.
The factory continues running during those captures.
After taking the images, the script waits for the gauntlet to finish.
It then checks a manual game, keyboard input, double tap skip, preview isolation,
auto approval settings and the word editor through the browser.

The source images were inspected during the build.
The word editor is collapsed by default so blocked phrases do not appear in a shared dashboard.
The gameplay HUD sits outside the arena so it cannot hide a simulated target.
It shows the actual verb, score target and remaining game time. The OBS card mirrors that objective.
The spotlight retains its last cursor position between clicks and never strobes.
