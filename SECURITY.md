# Safety boundaries

Games are JSON data interpreted by a fixed engine.
No game field selects a script, remote resource, file path or executable module.
The same deterministic engine runs the playtest and will run browser gameplay.

Chat enters through a typed source interface.
The local panel is available only on loopback and mock identity controls exist only in mock mode.
Real chat role checks use EventSub identity and badges.
The server checks origin and host, requires a custom header for mutation requests
and renders untrusted strings with textContent.

Pitches pass a local denylist and a pluggable moderation decision.
Without an OpenAI key, the fallback is a limited heuristic, not a full moderation service.
Moderation errors fail closed. Cooldowns, dedupe, queue capacity and a persistent kill switch bound intake.
Games built from chat always require streamer approval.

The factory passes a pitch as inbox JSON data and uses a static prompt.
Its CLI adapter spawns an argv array without a shell.
The Codex 0.165 permission profile gives commands no network access and denies secret reads.
Only out is writable. Tools, schema, examples and instructions are read only.
A short environment allowlist and shell environment exclusions keep parent API credentials out.
Apps, plugins, web search and multi_agent are disabled for jobs.
An offline preflight must succeed before live generation.
See docs/factory.md for the verified policy and its platform limits.

The CLI process group is terminated on timeout or cancellation.
Raw agent prose, commands, command output and stderr never enter the overlay or audit log.
The parser emits only fixed labels and allowlisted report codes.
The server treats completion events as build receipts, not proof of a safe game.

The validator reads only fixed output filenames, refuses symlinks and hardlinks,
bounds file size and reads, scans every string and property name for unsafe content,
and validates the closed schema, allowlists and semantic rules.
It reruns the harness independently from trusted server source.
A claimed agent playtest report is ignored.
Designer rejections are reduced to a fixed safe message.
Entropy scanning is a heuristic layered with isolation and schema limits.

SQLite and job directories are ignored by git.
Tokens belong outside the repository. .env is local and untracked.
Never place real credentials in pitches, fixtures, screenshots or seed receipts.
The forget command deletes related rows, user audit events and stopped job artifacts.
Live deletion cancels that user's active jobs and clears local presentation state.

The server now owns live gauntlet simulation and only a claimed local play socket can send input.
Chat messages remain authoring data and cannot steer the game. Previews use a separate local engine.
All snapshots carry monotonic revisions. The accelerated clock still consumes fixed engine steps.

The mock-only screenshot freeze control is disabled outside the explicit auto demo.
Mock result requests are labeled and contain no invented clip URLs.
Automatic token refresh and real clip integration remain planned.
