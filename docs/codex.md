# How Codex is used

This project is built in one main thread:
01a18380-92df-7fb1-84cd-1b45659bee41.

Eleven completed tasks cover workspace setup, game data, deterministic simulation,
playtesting, intake, factory isolation, validation, rendering, gauntlets, the overlay and dashboard.
BUILDLOG.md records each task, test evidence and commit.
No subagents were used and no code was pushed by this build session.

The runtime adapter uses the installed Codex CLI with a verified permission profile.
It writes game data, runs a bundled playtest and can tune up to four times.
Sanitized tool events become visible factory steps.
The server reruns the playtest itself and waits for streamer approval.

The offline adapter replays curated games and labels every step as simulated.
It does not claim a model call, thread ID or token usage.
Twenty seed receipts attribute their source to this main build thread.
They contain real harness measurements and no fabricated runtime generation timings.

Live generation latency has not been measured in this milestone.
The offline sandbox preflight was run successfully with codex-cli 0.165.0.


The third milestone includes a scripted humanish bot session and inspected Playwright screenshots.
The screenshot manifest records actual engine outcomes, including a designer win.
The generated factory steps remain visibly simulated.
No live generation latency or real Twitch clip creation is claimed by these screenshots.
