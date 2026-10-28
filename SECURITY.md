# Security

Pitch Arcade is a trusted local application. It binds to 127.0.0.1. Do not expose its control port through a public proxy or tunnel. HTTP checks Host and Origin and requires X-Arcade-Control for mutations. WebSocket upgrades check Host and Origin before sending state. A local nonbrowser process can use the controls.

Chat and model output are untrusted. Browser pages use text nodes. Games are JSON data with a closed schema, semantic limits and fixed allowlists. They cannot select scripts, modules, paths or remote resources. The engine is deterministic and has no DOM or wall clock randomness. Viewers author ideas but cannot steer gameplay.

Intake bounds length, cooldown, similarity and queue size. Secret shaped text is dropped before storage or moderation requests. The local denylist always applies. OPENAI_API_KEY enables optional moderation. Without it the fallback is a limited heuristic. Moderation errors fail closed. Pausing invalidates pending intake, stops factory work and ends the active run.

Runtime factory jobs receive a fixed prompt and an inbox file. Chat text never becomes a shell argument or path. The controller spawns an argv array without a shell. Its environment is scrubbed. Commands use a verified Codex 0.165 permission profile with network disabled. Only out is writable. Tools, examples, schema and instructions are protected. OS boundary probes must pass before each real job. See [the verified profile](docs/factory.md).

Jobs have a 150 second timeout, four playtest attempts, two workers and a default twenty job hourly budget. Cancellation terminates the process group. Raw model prose, commands and stderr never enter browser events. Receipts contain bounded metadata and parsed usage. Reset notices retain only a recognized time.

The server reads fixed output names, refuses links and limits bytes, depth and fields. It scans strings and keys, checks the schema and semantics, and reruns forty seeds with idle, random and humanish bots. It ignores agent reported acceptance. Viewer games need approval or an explicit mod or VIP auto approval rule. Rejecting a selected game stops that run.

OAuth checks state, account identity, client ID and scopes. Tokens are private files outside the repository with mode 0600. Both accounts validate at startup and hourly. Refresh failures end the Twitch session. Upstream response bodies and credentials are not reflected into local logs or tickers. Clip or chat failures do not stop gameplay.

Never put credentials in chat, fixtures or screenshots. Keep .env local. The ignore rules cover environment files, token JSON, SQLite data, dependencies, builds and factory jobs. `npm run forget -- login` deletes local designer records and related jobs. It also invalidates pending intake. It cannot undo an already published Twitch message or clip.

The six findings and regression evidence are in [the review](docs/review.md). Secret and entropy checks are heuristic. Sandbox support depends on the host. Live channel behavior remains unverified without credentials. Report a concern privately to the repository owner before sharing any sensitive payload publicly.
