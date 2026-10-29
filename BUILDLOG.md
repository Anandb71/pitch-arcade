# Build log

## T01

Created npm workspaces, strict TypeScript, Vitest, project rules, architecture plan and safe environment placeholders. Added a workspace configuration smoke test. npm test passed with 1 test.

## T05

Defined a closed JSON Schema, 30 verbs, 320 curated emoji, semantic role and control checks, and format documentation. Added 10 examples covering all MVP values. Added 13 format tests for accepted examples, title safety, unknown fields, role references, mods and defaults. npm test passed with 14 tests. Type checks passed.

## T06

Implemented mulberry32, a fixed 60 Hz engine, frame input streams, entities, live spawner limits, all eight motions, collisions, all five objectives and six mods. Added 25 simulation tests including PRNG and replay goldens, identical seed replays, input edges, collision priority, origins, terminal freezing and headless example deadlines. npm test passed with 39 tests. Type checks passed.

## T08

Added idle, random and humanish bots with independent seeded noise, a nine frame reaction delay and bounded mash cadence. The runner measures 40 seeds per bot and enforces every difficulty and safety band. All eight report codes include hints. Added seven plain broken specs, assessment boundary tests, repeatability checks, reaction and cadence tests, and a copied-template CLI test covering success, failure, invalid JSON and missing files.

Calibrated the ten core examples using measured results and added twenty verb variants. All thirty examples now pass. Added an enum coverage test for every MVP value and every verb. The committed standalone CLI is generated from source, marked read only by the builder, and includes dependency licenses. Factory instructions require a real read only mount when job isolation is implemented in T09.

Added the requested local EventSub WebSocket mock in place of Twitch CLI, with welcome, chat, keepalive, reconnect and drop controls. Added two wire fixture tests and an npm run mock:twitch command. Real Twitch clients remain later tasks.

Updated Vitest and pinned the compatible Vite major after dependency auditing. npm audit reports zero vulnerabilities. The shell defaults to Node 20.19, so final validation used Node 22.11 explicitly through npm exec. npm test passed: 6 files, 57 tests, 2.68 seconds. Type checks and bundle generation passed. Taco Rain reports idle 48 percent, random 23 percent and humanish 65 percent. The deliberately impossible mash game exits 1 with TOO_HARD. No milestone blockers.

## T11

Added ChatSource and FakeChatSource, bounded pitch parsing, Unicode character limits, configurable cooldown and queue capacity, token similarity dedupe, role priority, local denylist, pluggable moderation and acknowledgments. The moderator uses the OpenAI moderation endpoint when OPENAI_API_KEY is configured and a clearly labeled local heuristic otherwise. Moderator outages fail closed. Privileged arcade commands persist the kill switch and interrupt pending moderation immediately.

Created all seven section 7.11 tables plus settings behind a small synchronous SqlDatabase interface. Foreign keys cascade privacy deletion. Events store references and decisions rather than raw nonpitch chat. The better-sqlite3 package installed but its Node 22.11 smoke check terminated with a segmentation fault. Removed it and used the authorized node:sqlite fallback, verified against SQLite 3.46.1. Node 22.11 requires --experimental-sqlite, now passed to tests and Vitest workers.

Added 20 intake and storage tests covering spam, simultaneous requests, boundaries, roles, moderation, kill switch persistence and deletion. npm test passed on Node 22.11 with 77 tests across 8 files. Type checks and bundle generation passed.

## T09

Added fresh git job workspaces, inbox data files, CodexCliRunner, MockCodexRunner, sanitized JSONL factory steps and measured receipts. The scheduler runs at most two jobs, enforces a 150 second deadline and four playtests, persists receipts, supports cancellation and crash recovery, cleans job folders and limits jobs per hour. Mock replay receipts explicitly identify simulation and leave thread and token values null.

Verified codex-cli 0.165.0 against its help and official permission documentation. Corrected the sketch to use a nested :workspace_roots map. The CLI uses a profile extending :workspace rather than passing --sandbox, because the legacy flag overrides profile deny rules. A live offline preflight verified secret and sibling read denial, protected tool write denial, output writes and blocked TCP access. Root denied view writes outside the output did not persist to the host. The runtime repeats the preflight and rejects unverified minor versions. No model job or side thread was launched during verification.

Kept @openai/codex-sdk out of dependencies because CLI JSONL already supplies the needed events and sign in path. Documented controls and limitations in docs/factory.md. Moved canonical examples into packages/engine and made the build sync all template content, including factory designer instructions and config. Added 13 factory tests for JSONL fragments, limits, event dedupe, secret scrubbing, argv safety, mock receipts, concurrency, timeout, cancellation, budget and preflight failure. npm test passed on Node 22.11 with 90 tests across 9 files. npm run factory:check passed.

## T10

Added independent server validation with bounded regular file reads, symlink and hardlink rejection, schema and semantic checks, title filtering, all string and key safety scans, secret patterns and entropy checks, designer rejection handling and a fresh trusted harness run. Claimed agent reports are ignored. Built games require explicit approval, approval counters are idempotent and rejected games cannot be approved.

Implemented the Fastify loopback server, tiny fake chat panel, guarded local control API, sanitized WebSocket factory feed, persistent library and privacy deletion. Deletion cancels active jobs, removes dependent rows and user events, clears in-memory presentation data and checkpoints SQLite with secure_delete enabled. Added the forget CLI for running and stopped servers. Filtered pitches now consume cooldown too, preventing moderation spam.

Connected the common ChatSource to HTTP mock chat and an EventSub socket adapter. Added bounded local mock replay injection and a five pitch replay script. Added supplied-token EventSub subscription and rate limited Helix acknowledgment helpers. OAuth refresh and clips remain future tasks. Mock mode remains independent of live Twitch credentials and Codex.

Created twenty passing seed specs with honest receipts naming main build thread 01a18380-92df-7fb1-84cd-1b45659bee41. Per game runtime thread IDs, model, timings and token usage are null. Each receipt includes real 40 seed bot reports and difficulty summaries. Added a regeneration script. The scripted demo and tests prove chat to queue to mock factory to independent validator to approval to library. A separate test replays through the actual EventSub mock socket before approving all five games.

Updated README, setup, safety, architecture and Codex evidence docs. The demo now starts a real local panel. Verified its rendered factory state and seed library with headless Chrome. Pinned light-my-request to 6.6.0 because the latest helper requires ESM loading behavior missing in Node 22.11. No new unapproved production dependency was added.

Added 29 tests covering malicious outputs, forged reports, output filesystem checks, approval states, all seed receipts, HTTP guards, live deletion, CLI deletion, EventSub mapping and replay, subscription payloads, acknowledgment pacing and moderation spam. A clean npm ci passed on Node 22.11 with npm 10.9. Final npm test passed: 14 files, 119 tests, 3.48 seconds. npm run demo:check and npm run factory:check passed. npm audit reports zero vulnerabilities. Live Twitch requests and real model generation were not exercised. No milestone blockers.

## T07

Implemented the Canvas 2D renderer at 960 by 540 with all eight palettes and five static patterns, system emoji sprites, bounded particles, soft spotlight, floor lava and shake capped at six logical pixels. Rendering observes snapshots without modifying simulation or moving entities independently. Added synthesized WebAudio effects behind an explicit sound gesture. Added keyboard, pointer and scaled coordinate input, blur cleanup and a practice play page built by Vite. Double tap S or Shift + S skips so a normal S press remains available for WASD movement.

Documented the installed Noto Color Emoji fallback stack and original synthesized audio in ASSETS.md. Added seven renderer and input tests, including exact snapshot coordinates and an engine purity guard, plus a trusted web asset smoke test. npm test passed on Node 22.11 and npm 10.9: 16 files, 127 tests. Type checks and Vite build passed.

## T12

Added shared browser protocol types and a server authoritative gauntlet with five distinct approved games, newest viewer approvals first, classic fill, title cards, 3 2 1 countdown, play, result and final score phases. Sessions begin with three lives. Skips preserve lives, stops are idempotent, and three losses end the run. Integer speed percentages advance the unchanged 60 Hz engine through a rational accumulator. Humanish bot play remains explicitly labeled as a mock demo mode.

The server pushes snapshots over WebSocket and accepts input only from a claimed local play connection. The play page now renders those snapshots and offers sound, skip and start controls. Added persistent gauntlet and play records, designer beats and ResultsSink hooks. MockResultsSink records honest simulated clip requests and result chat lines, with no fabricated clip URLs. Privacy deletion resets sessions referencing the forgotten designer.

Added 12 state machine, life exhaustion, determinism, speed, API and socket input tests. npm test passed on Node 22.11 and npm 10.9: 18 files, 139 tests. Type checks and Vite build passed.

## T14

Added a transparent 1920 by 1080 OBS overlay with a 48 pixel safe margin, live factory job cards and stages, truthful receipt labels, a now playing designer card, lives, speed, actual designer beats, gauntlet score and queue or mock result ticker. The center remains transparent for gameplay. A backdrop query supports transparency inspection without changing the OBS source. There are no flashing or scrolling effects.

Added shared receipt formatting tests to keep mock and seed receipts distinct from completed live CLI receipts. npm test passed on Node 22.11 and npm 10.9: 19 files, 141 tests. Type checks and the Vite build passed. Full screenshot inspection follows in the integrated demo task.

## T15 and integrated demo experience

Built the Vite control room with approval cards, all three bot win rates, difficulty bars, truthful receipts, approve and reject actions, full collection browsing and an isolated Canvas preview dialog. Start opens the play window. Stop, skip and the persistent kill switch are available beside the active show. Added persisted mod and VIP auto approval rules that run only after independent validation. Added a live bounded word editor and generated title filtering. Blocked phrases stay collapsed by default so they do not appear in shared screenshots.

Replaced the old panel with a dedicated mock chat page, actual acknowledgments and mock result messages. The server now prints all four URLs and OBS setup. Added demo:auto using the real source, queue, mock runner, validator, approvals and five round humanish play. A fresh database is used by default. The fixed seed completes with four wins, one designer win and two lives left. Added monotonic snapshot revisions, 60 Hz state delivery, stable cursor aim, mouse mash input and a gameplay objective HUD outside the arena so random targets remain unobstructed. The OBS now playing card mirrors the objective and time. Queue messages return after the result ticker.

Added Playwright as a development dependency and npm run shots. The script uses installed Chrome, captures seven 1920 by 1080 images, checks transparency and safe margins, waits for the complete unattended run, then verifies real keyboard movement, double tap S, preview isolation, auto approval controls and word editing. All browser checks passed without uncaught page errors. Inspected every PNG, refined the layouts and recaptured the final images. The committed manifest records actual frames and outcomes. Screenshots contain simulated factory and clip labels, not fabricated live generation or clip URLs.

Added five Vitest tests for auto approval, live settings, a finished demo:auto gauntlet, full frame delivery and steady cursor aim. Updated setup, OBS, security, asset and Codex evidence docs. Final npm test passed on Node 22.11 and npm 10.9: 21 files, 146 tests, 7.03 seconds. Type checks and all four Vite page builds passed. npm run shots passed. npm audit reports zero vulnerabilities. Real Helix clip creation remains the requested next milestone. No blockers.

### T02 OAuth accounts

Added localhost authorization code login for broadcaster and bot, state verification, expected login and client checks, required scopes, refresh coalescing and private atomic token storage outside the repo. The check command prints scopes only. Added fake Twitch ID server tests for refresh and authorization URL scopes. Verified the official Twitch validation requirement at https://dev.twitch.tv/docs/authentication/validate-tokens/. npm test passes with 148 tests.

### T03 EventSub lifecycle

Extended the WebSocket client with per socket welcome and keepalive deadlines, seamless reconnect migration, duplicate chat suppression, revocation shutdown and resubscription after drops. The old connection stays alive until the replacement welcomes. Token monitoring validates both accounts hourly and ends the session on failure. Added mock tests for reconnect, missing welcome and missed keepalive, plus an hourly validation test. npm test passes with 154 tests, including the new Helix fixtures prepared for T04.

### T04 Helix client

Added typed safe errors, bot chat queue with one second spacing and twenty sends per rolling thirty seconds, rate reset handling, authenticated subscriptions, broadcaster clips with title and twenty second duration, bounded clip polling and optional pin and marker flags. Added local HTTP fixtures for request bodies, auth role, polling, chat pacing and rate headers. npm test passes with 154 tests.

### T13 live results and protocol simulation

Wired OAuth account identity into the live EventSub and Helix clients, hourly token checks, bounded nonblocking clip results, chat links, end of gauntlet summaries and optional stream markers. Designer beats remain persisted independently of upstream requests. Result tickers distinguish real and simulated events. Added start with a friendly missing variable list, doctor, Twitch setup docs and a credential free protocol demo with actual WebSocket and HTTP calls. Legacy chat helpers now use the same conservative queue. Hardened the migration deadline, token path checks and callback state encoding. Prepared the measured factory spike command and usage limit reporting.

Tests added for results failure containment, missing configuration, a complete fake Twitch pipeline including actual outbound clip links and summary, private token paths, usage limits and bounded clip polling. npm test passes with 160 tests in 26 files. The launched demo:twitch-sim finished five rounds with three wins, one life left, two simulated clip links and a final chat summary. Doctor confirmed Node, Codex CLI and Twitch ID reachability and correctly reported absent credentials and token file. Start correctly lists all four missing variables. Live account authorization and published Twitch clips need credentials and a live channel, which are not present here.

### Real factory spike

Ran three actual CodexCliRunner jobs on normal, injection and impossible pitches with the verified sandbox and independent validator. All three completed and passed. No second iteration was needed. Build times were 14.182, 16.414 and 15.900 seconds, with median 15.900 seconds and two actual playtests per job. turn.completed reported 461039 total input tokens and 3096 output tokens. No timeout or usage limit occurred. The injection became Moonberry Catch with safe strings; the impossible idea became Orbiting Comets. Output scanning and sandbox probes passed. No Codex authentication file was inspected by this application.

Added the three passing JSON games and genuine CLI receipts with thread IDs, durations, usage, fresh forty seed reports and difficulty summaries. Updated the library receipt test to distinguish twenty seed receipts from three real job receipts. docs/codex.md records individual measurements and limits of the evidence. Final npm test is green with 160 tests in 26 files, duration 8.70 seconds on Node 22.11 and npm 10.9.

### M5 review

Reviewed data and command boundaries, browser sinks, Host and Origin controls, deterministic engine state and asynchronous queue behavior. Found and fixed six defects: sensitive chat reflection, forget versus moderation, pause and resume versus moderation, rejected selected games, a retained screenshot freeze and reflected receipt error suffixes. Added eight regression and boundary tests. docs/review.md records each finding and the verified boundaries. npm test is green with 168 tests in 27 files.

### M5 docs and submission draft

Rewrote README with clone instructions, all demo modes, real account setup, exact local URLs, environment settings, architecture, safety, testing, gallery and honest live status. Added setup and Devpost drafts. Cleaned up the Build and Runtime Codex story, asset licenses and security guidance. Removed obsolete credential names from .env.example and corrected OBS placement versus browser cropping. Added npm run lint:prose. The prose check passes all ten current target files. npm test is green with 168 tests in 27 files.

### M5 screenshot polish

Refreshed eight 1920 by 1080 PNGs and inspected every image. The main overlay comes from the actual local Twitch protocol demo with two building mock jobs, the measured Taco Dash Codex receipt labeled real, and a simulated Helix clip link. Increased receipt type size and kept all panels inside the safe area. Captures include three games, the title, dashboard and chat. The script also verifies literal HTML injection stays inert, preview isolation, controls and a finished unattended gauntlet. npm run shots passes with no browser errors. npm test is green with 168 tests in 27 files.

### M5 fresh clone proof

Cloned the local committed repository into /tmp/pa-fresh at de4bc34 using Node 22.11.0 and npm 10.9.0. npm ci installed 107 packages and audited 117 with zero vulnerabilities. npm test passed all 168 tests in 27 files. Build and prose checks returned 0. demo:auto completed five rounds with four wins and two lives without credentials. Doctor correctly returned 1 for missing live account settings and tokens, while Node, Twitch ID reachability and Codex checks passed. The clone remained clean after regeneration. Its server was stopped and the clone deleted. docs/fresh-clone.md records the outputs. No application fix was needed.

### M5 final audit

Scanned the entire git log patch history and current tracked files for service key patterns, bearer tokens, JWTs, private keys and high entropy token shaped strings. No operational credential was found. All entropy candidates were classified as public identifiers, dependency metadata, generated harness fragments, source paths, Canvas types or synthetic fixtures. No candidate remained unclassified. Prohibited provenance markers had zero occurrences. Ignore checks passed for .env, local env variants, token JSON, data, dependencies, builds and job directories. Only .env.example is tracked among environment and token paths.

The final prose check passes eleven target files. A temporary negative fixture confirmed all three forbidden dash forms fail, and was removed. Clarified the remaining server docs and strengthened the forget regression to prove later pitches remain possible. Final npm test is green with 168 tests in 27 files, duration 10.01 seconds on Node 22.11.0 and npm 10.9.0. Eight final screenshots were inspected. Remaining human work is live Twitch authorization and stream verification, OBS composition, recording the public video and completing the Devpost submission.

### M6 A factory model

Changed the server and CLI runner defaults to gpt-6.1-sol. Updated current configuration docs while preserving the historical gpt-6-luna spike receipts and measurements. Added a default and override regression test. npm test passes with 169 tests.

### M6 B persistent scoring

Added capped win streak scoring, designer points for beating the streamer, per round credits and SQLite score records linked to existing plays. Added a leaderboards endpoint and state payload for designer totals and player high scores. Humanish bot runs are labeled separately. Ranking sanitizes names, sorts ties consistently and handles empty boards. Tests cover score math, unsafe names, ties, persistence after reopen and idempotent results. npm test passes with 178 tests across the scoring and presentation work prepared for this sprint.

### M6 B sound and render feedback

Added synthesized hit, tick, countdown, GO, win, lose and pitch sounds with bounded volume, mute controls and safe gesture unlock. Added render only hit stop capped at 35 ms, combo pops, particles, shake and a localized edge pulse. Reduced motion disables spatial effects and pulses. Pure tests cover feedback caps, expiry, score math, cue recipes and volume bounds. Engine code is unchanged. npm test passes with 178 tests.

### M6 B broadcast intro and overlay

Added a branded gauntlet intro, server timed countdown and GO cue, eased scene changes, a new pitch toast, persistent league panels, designer badges and OBS sound controls. Fixed panel slots keep the safe area stable. Transition tests cover queue, pitching, factory, gauntlet and results priority without changing engine time. Reduced motion skips spatial animation. The working suite is green and the browser capture run exercises the new presentation.

### M6 B player score cards

Added the branded play intro, countdown impact and GO cue, live points and streaks, sanitized designer badges, round score feedback and a complete final score card. Results include all five game credits plus designer totals and player high scores. Human and bot ties remain distinct and deterministic. Sound defaults on for play with query mute and volume controls. npm test passes with 179 tests in 31 files.

### M6 B browser proof and final polish

Refreshed eleven screenshots, including the gauntlet intro, countdown and full credited results. Inspected the new layouts and improved credit contrast. Playwright verified actual oscillator synthesis, gesture unlock, query mute, volume, normal motion countdown animation, reduced motion, controls and a finished five game gauntlet. An additional Chrome check verified overlay sound=1, pitch cues, eased panel transitions and master gain mute for active notes. Added a master gain regression test. Updated current docs, scoring rules, audio defaults and the gallery while retaining historical spike measurements.

npm run build passes. Final npm test passes with 180 tests in 31 files, duration 10.89 seconds on Node 22.11 and npm 10.9. npm run lint:prose passes all eleven documentation files. The engine and its fixed step were unchanged. No new dependencies or remote audio assets were added. No blockers.

### M7 C generation variety and quality

Strengthened the canonical designer instructions and synchronized template with five second objectives, distinct mechanics and themes, escalating motion or time pressure, clear win and lose rules and standard feedback fields. Jobs receive a bounded recent digest without free text titles or author names. The instructions explicitly distinguish supported v1 adaptations from physical stacking, beat accuracy and hidden memory, which v1 does not enforce.

Added deterministic harness telemetry for paired humanish versus idle outcomes, meaningful events, score variance and finish variance. Original bot acceptance and all safety gates remain unchanged. Added nine post validation quality codes for evidence, duration, feedback, skill advantage, input impact, idle wins, engagement, exact duplicates and near copies. Fingerprints ignore aliases, reskins, decor and ineffective parameters or mods. Comparisons include rejected library entries.

Added one bounded repair with protected feedback, stale output removal, remaining playtest enforcement and aggregate attempt receipts. Two attempts still share one 150 second deadline and four total playtests. Exhausted quality failures emit a visible rejection step. Tests cover every gate, retry limits and a server end to end reskin rejection followed by a freshly validated repair.

Tuned ten original seed games with the actual harness. All ten pass the original and new gates against the rest of the library, span eight palettes and all controls, and carry honest seed studio credits and measurements. Generated thirty eight pairwise distinct measured mock variants. The mock rotates eligible families and never bypasses quality or duplicate checks. The expanded library contains thirty seed games and three historical real CLI games. No new live model calls or runtime receipt timings are claimed.

The updated seed 8 unattended demo completes five varied viewer games with four wins and one designer win. npm run demo:check passes. npm run shots passes all browser checks and refreshes eleven images with the new games; the key gameplay, overlay and results captures were inspected. Final npm test passes with 201 tests in 33 files. Prose lint passes twelve files. docs/quality.md records thresholds, measurement definitions, retries, legacy status and format limits.

## M8 D recording demo

Added npm run demo:video with a deterministic 110 second schedule, an opening hype card, eight simulated chat arrivals, visible moderation and approval notices, independent factory validation and humanish autoplay. Seed 8 completes all five games with four wins and one loss. The final credits and leaderboards remain visible before the next loop. The hold flag keeps the final screen. Each cycle removes only its scripted viewer records and renews its mock adapter so the finite replay pool and hourly accounting cannot stall a long recording. The server stays online throughout reconnects. Existing validation gates are unchanged.

Added scheduler tests and a two cycle integration smoke check covering repeatable outcomes, moderation, approvals, final hold and looping. Added npm run demo:video:check and a Playwright recorder that creates an optional silent shots/demo.webm. Audio recording uses OBS. The recording guide documents exact URLs, the schedule and browser requirements. Verification uses Node 22.11 and npm 10.9.

Task D checks: npm test passed 204 tests in 34 files. npm run build passed strict type checking and all bundles. npm run lint:prose passed 13 documents. npm run demo:video:check passed two full cycles with identical five game outcomes and both hold and loop behavior.

Task D recording proof: a clean local clone passed npm ci and demo:video:check without credentials. A real time 112 second Chromium capture produced the optional ignored shots/demo.webm, about 12 MB. The finished state had five rounds, four wins, one loss, two lives and 700 points. A browser reload preserved credits and rankings without page errors. The opening card and final credits were visually inspected. Playwright capture is silent, as documented. Temporary clone removed after verification.

## M9 E docs and screenshot packaging

Rewrote the README around the recording demo, a visual gallery and the stream experience. Updated Devpost with a short tagline, Build and Runtime details, current features and explicit live Twitch limits. Updated Codex notes to 204 tests in 34 files, 30 seed games, three historical runtime games and 38 measured mock variants. Historical Luna measurements remain distinct from the current Sol factory default and newer quality gates.

Extended the screenshot tool to capture an actual scored hit, the recording opening card, the factory floor and persistent leaderboards alongside existing gameplay, controls and credits. Capture provenance remains in the manifest. npm run lint:prose, npm run build and npm test passed. The suite remains 204 tests in 34 files. Clean clone verification and the final visual audit are recorded below.

Task E clean clone proof: revision 70ff661756e0c48202da5597271415474e881bdf was cloned to /tmp/pa-m9-fresh with a minimal credential free environment. npm ci installed 107 packages and audited 117 with zero vulnerabilities. npm test passed 204 tests in 34 files and rebuilt the application. The actual npm run demo:video completed five games with four wins, one loss, two lives and 700 points, then announced Cycle 2 at 115 seconds including build time. The clone stayed clean. Its server process group was stopped and the clone was deleted. docs/fresh-clone.md records the current proof and preserves the earlier check as historical context.

Task E final audit: all fifteen 1920 by 1080 screenshots were inspected. A late factory frame had finished workers despite its busy caption, so the tool now saves the same actual busy OBS capture for the factory gallery image and records that reuse in the manifest. The final shots run passed audio, reduced motion, manual input, safe area, preview isolation, literal HTML and finished gauntlet assertions with no browser errors. The Devpost tagline is 101 characters and its YouTube URL remains an explicit TODO. Local documentation links resolve. Final build, prose check and all 204 tests passed. The full history and tracked tree secret scan found zero service key matches, zero unclassified entropy candidates and zero prohibited provenance markers. One Canvas method assignment was reviewed as a source identifier. Ignore rules were confirmed for env files, tokens, data, dependencies, builds and factory jobs. No live Twitch verification or new model benchmark is claimed.

## M10 F headless Twitch device authorization

Added npm run auth -- --device --role=broadcaster and the bot equivalent. Device issuance sends form data with the app ID and role scopes. Confidential token polling sends the app secret and device code without logging them. Pending approval honors the interval, slow down adds five seconds, expiry and denial fail cleanly, and network or server failures have a bounded retry. Timers keep the CLI alive through long waits. Console output uses safe fixed progress text and natural process completion so logs can flush.

Broadcaster scopes are now channel:bot, clips:edit and user:read:chat. Bot scopes remain user:read:chat, user:write:chat and user:bot. Optional stretch scopes remain role specific. Candidate grants must match the configured login, client and requested scopes before replacing a saved account. Both flows use the existing private mode 0600 token store outside the repo. Expiry is now stored with access and refresh tokens. Refresh already included the confidential app secret and retains that behavior. The redirect helper now prints a local launch link instead of exposing the client ID in a console URL. The device code and app credentials are never persisted by the flow.

Tests were written first and observed failing before implementation. Fifteen new tests use synthetic credentials, fake fetch, fake clocks and a local callback fixture. They cover pending success, exact forms, role scopes, slow down, local and remote expiry, denial, wrong login, missing scopes, bounded network and server retries, unsafe guidance rejection, private storage, refresh rotation, preservation of an existing grant, real timer behavior and both CLI paths without credential output. npm test passed 219 tests in 35 files. The pretest build and strict type check passed. npm run lint:prose passed 13 documents. README, setup, Twitch notes and current counts were updated. No live Twitch request was made and no configured credential value was printed or written by this task. Live authorization is left to the orchestrator.

## M10 F activation URI compatibility fix

The orchestrator reported that Twitch includes the public activation code in an optional device-code query. The original exact URL check rejected that valid shape. The validator now accepts HTTPS on twitch.tv or www.twitch.tv with the exact /activate path and at most that single query. Other schemes, hosts, paths, credentials, explicit ports, fragments, duplicate or extra parameters and whitespace are rejected. The URI and user code are printed separately. A private polling device_code or app credential embedded in the URI fails before any guidance is emitted.

Regression tests were added first and observed failing for the reported response shape. Twenty one added cases cover both activation hosts, hostile URLs, private code suppression and all 1800 seconds of pending polling with a fake clock. No live Twitch requests were made. The final suite passes 240 tests in 35 files. The pretest build and strict type check pass. npm run lint:prose passes 13 documents. Setup notes and current test counts were updated. The normal polling deadline remains the full expires_in supplied by Twitch, including thirty minute codes.

## M12 G EventSub reconnect diagnosis and repair

Reviewed the source and indexed official Twitch lifecycle and API documentation without contacting live identity, Helix or EventSub services or inspecting saved token values. The orchestrator's generic log cannot establish the exact production cause. Confirmed risks were the 11 second default silence limit, ignored reconnect targets during migration, stale candidate and subscription callbacks, immediate termination on subscription errors, shared REST reset waits and absent close diagnostics. Subscribe was already outside the chat send queue; the shared reset timestamp was the actual pacing coupling.

The default watchdog now allows 1.5 times the advertised keepalive plus three seconds, giving 18 seconds for the normal 10 second heartbeat. All welcomed JSON messages re-arm it. Migration owns one original thirty second deadline, replaces superseded candidates, retries failed candidates while preserving the active socket and retires the old socket only after promotion. Retirement clears timers, aborts subscription work and suppresses stale callbacks. Revocation and stop clean up every socket. Source start is idempotent. Source inspection confirms one live transport instance, and fixtures prove automatic pongs without inbound application frames.

Helix subscription requests coalesce per session and bypass chat pacing and unrelated reset waits. They retry with backoff within 8.5 seconds and the source's nine second watchdog, accept 409, refresh once on 401 and handle 403, 429, server failures and network errors without raw upstream output. Rate reset waits that exceed the welcome budget fail safely. Fetches are cancellable and response bodies are released. Migration does not resubscribe. Reconnect backoff is bounded at thirty seconds.

Added fixed diagnostic labels for welcome, keepalive, subscription and migration timeouts, socket errors, HTTP statuses, close codes 4000 through 4007 and known revocation types and statuses. Peer reasons, exception strings, URLs, session IDs, chat content and secrets are excluded. The live message retains its original sentence with a sanitized cause appended. docs/eventsub-review.md records findings, limits and sources. Current documentation counts were updated.

Tests were written first and observed failing before the repair. Twenty seven added cases cover jitter, heartbeat re-arming, repeated migration, failed candidate retry, original deadline enforcement, old socket closure, 4003 recovery, revocation cleanup, ping and pong behavior, each close label, subscription retry success, 409 coalescing, a single 401 refresh, bounded 403, 429 timing, pacing isolation, cancellation, response cleanup and private diagnostic suppression. npm test passed 267 tests in 36 files, including the local Twitch end to end scenario. The strict build passed through pretest. npm run lint:prose passed fourteen documents. Live restart and observation are left to the orchestrator.
