# Fresh clone proof

A clean local clone was checked on October 29, 2026. The source revision was de4bc34b5cd1bb7c6a7855fa06399aeed0e1462f. No files were copied from the working tree. Dependencies came from the committed lockfile.

The shell selected Node v22.11.0 and npm 10.9.0 explicitly. The following commands ran in a new /tmp/pa-fresh clone. Twitch credentials, mock flags and moderation credentials were removed from the child environment. Doctor used a deliberately absent token path, so it could not load an existing user's Twitch grant.

```sh
git clone --no-hardlinks /workspace/hackathons/twitchcon/pitch-arcade /tmp/pa-fresh
cd /tmp/pa-fresh
node --version
npm --version
npm ci
npm test
npm run build
npm run lint:prose
npm run demo:auto
npm run doctor
git status --short
```

## Installation and build

Actual installation output:

```text
added 107 packages, and audited 117 packages in 1s
found 0 vulnerabilities
```

npm ci returned 0. Type checking, server bundles, the self contained playtest tool and all four Vite pages built successfully. npm run build returned 0. No absolute workspace path was needed by the application. The regenerated committed files were unchanged.

## Tests

Actual Vitest summary:

```text
Test Files  27 passed (27)
Tests       168 passed (168)
```

npm test returned 0. The Node experimental SQLite warning is expected on 22.11 and does not affect the result. npm run lint:prose returned 0 for the ten documentation files present at that revision.

## Unattended demo

The helper started npm run demo:auto on an available loopback port and polled its real HTTP state. It reached this result without credentials or input from a person:

```json
{
  "phase": "finished",
  "rounds": 5,
  "score": 4,
  "lives": 2
}
```

The command printed play, overlay, dashboard and mock chat URLs plus OBS setup. The helper stopped the server after the final score card. The demo is a server and otherwise stays running until Ctrl+C.

## Doctor without credentials

The checklist reported:

```text
✓ Node 22.11 or newer
✗ TWITCH_CLIENT_ID is configured
✗ TWITCH_CLIENT_SECRET is configured
✗ TWITCH_BROADCASTER_LOGIN is configured
✗ TWITCH_BOT_LOGIN is configured
✗ Private token file is ready. Run npm run auth if needed.
✓ Twitch ID endpoint is reachable
✓ Codex CLI is installed
Mock play needs no credentials. Use npm run demo.
```

Doctor returned 1 intentionally because the live account requirements were absent. This is the expected readiness result for a credential free checkout. The mock demo completed successfully in the same checkout.

## Cleanup

The final git status was empty. The helper deleted /tmp/pa-fresh after stopping its server. No clone directory or demo process was left behind. This proof required no source fix.

## Final audit

The full git history and current tracked files were scanned for service key patterns, bearer literals, JWTs, private keys and token shaped high entropy strings. No operational credential was found. Entropy candidates were checked as public dependency integrity values, commit and session IDs, source paths, Canvas type names or synthetic test fixtures. The prohibited provenance marker scan found zero occurrences in the tracked tree and history.

Ignore checks confirmed .env, .env.local, token JSON, data, dependencies, builds and factory jobs are excluded. Only the names in .env.example are tracked. All eight screenshots were visually inspected and contain local demo identities, measured public receipts and simulated clip links.

The prose checker passed the final docs. A temporary negative fixture proved it rejects an em dash, an en dash and a spaced hyphen. The fixture was removed after the check.
