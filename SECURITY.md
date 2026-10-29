# Security

Pitch Arcade binds to 127.0.0.1. Loopback requests retain the existing Host, Origin and mutation header guards. Public access is disabled by default. ARCADE_PUBLIC_HOSTS opts exact hostnames or leading wildcard subdomains into the proxy mode, and ARCADE_ACCESS_TOKEN must contain at least 24 characters. Missing, short or invalid configuration logs a fixed message and keeps loopback access only.

Every request on an allowed public host needs a valid key query, X-Arcade-Key header or private cookie. Key comparisons use timingSafeEqual on fixed length digests. A query key sets a host bound cookie derived with HMAC, then redirects to the same path and remaining query without the key. The cookie is HttpOnly, Secure, SameSite=Lax, scoped to / and has no Domain attribute. It does not expose the original access token. Public responses disable caching and referrer forwarding. Unauthorized requests return plain 401 text without state. Unknown hosts remain forbidden.

Public WebSocket upgrades need authentication and a same host HTTPS Origin before any state is sent. Mutation routes still require X-Arcade-Control with value local, plus public authentication. The browser sends cookies automatically. No token is stored in browser JavaScript or API state. No CORS is enabled. Request logging remains disabled, and errors never reflect request URLs. Access credentials are excluded from factory command environments by the existing whitelist.

For a quick tunnel, use cloudflared tunnel --url http://localhost:3000 with the public host allowlist and secret configured first. Preserve the public Host header. A proxy that rewrites Host to localhost bypasses the public boundary and is not supported. Do not expose the loopback port directly. See [the server recipe](docs/server.md) for private OBS links. Anyone with the shared key can use dashboard controls. Treat access links and the derived cookie as credentials. Rotate the key and restart the server to revoke access and close existing sockets.

These guards trust the local operating system and the TLS terminating proxy. The tunnel still carries private game and chat data. Configure it only for the streamer and their OBS machine. The code is tested with local HTTP, WebSocket and TLS proxy fixtures, not a public tunnel deployment.


Chat and model output are untrusted. Browser pages use text nodes. Games are JSON data with a closed schema, semantic limits and fixed allowlists. They cannot select scripts, modules, paths or remote resources. The engine is deterministic and has no DOM or wall clock randomness. Viewers author ideas but cannot steer gameplay.

Intake bounds length, cooldown, similarity and queue size. Secret shaped text is dropped before storage or moderation requests. The local denylist always applies. OPENAI_API_KEY enables optional moderation. Without it the fallback is a limited heuristic. Moderation errors fail closed. Pausing invalidates pending intake, stops factory work and ends the active run.

Runtime factory jobs receive a fixed prompt and an inbox file. Chat text never becomes a shell argument or path. The controller spawns an argv array without a shell. Its environment is scrubbed. Commands use a verified Codex 0.165 permission profile with network disabled. Only out is writable. Tools, examples, schema and instructions are protected. OS boundary probes must pass before each real job. See [the verified profile](docs/factory.md).

Jobs have a 150 second timeout, four playtest attempts, two workers and a default twenty job hourly budget. Cancellation terminates the process group. Raw model prose, commands and stderr never enter browser events. Receipts contain bounded metadata and parsed usage. Reset notices retain only a recognized time.

The server reads fixed output names, refuses links and limits bytes, depth and fields. It scans strings and keys, checks the schema and semantics, and reruns forty seeds with idle, random and humanish bots. It ignores agent reported acceptance. Viewer games need approval or an explicit mod or VIP auto approval rule. Rejecting a selected game stops that run.

OAuth checks state, account identity, client ID and scopes. Tokens are private files outside the repository with mode 0600. Both accounts validate at startup and hourly. Refresh failures end the Twitch session. Upstream response bodies and credentials are not reflected into local logs or tickers. Clip or chat failures do not stop gameplay.

Never put credentials in chat, fixtures or screenshots. Keep .env local. The ignore rules cover environment files, token JSON, SQLite data, dependencies, builds and factory jobs. `npm run forget -- login` deletes local designer records and related jobs. It also invalidates pending intake. It cannot undo an already published Twitch message or clip.

The six findings and regression evidence are in [the review](docs/review.md). Secret and entropy checks are heuristic. Sandbox support depends on the host. Live channel behavior remains unverified without credentials. Report a concern privately to the repository owner before sharing any sensitive payload publicly.

New factory outputs also pass the quality layer documented in docs/quality.md. Its evidence comes from the server's own bot runs. Mechanical fingerprints ignore cosmetic reskins and irrelevant parameters. Rejected library games remain in duplicate checks. Repair feedback contains fixed server codes and hints, lives in a protected inbox file, and never becomes a shell argument. The second attempt shares the existing 150 second deadline and four playtest budget. Historical seed receipts retain their original validation rather than receiving invented quality claims.
