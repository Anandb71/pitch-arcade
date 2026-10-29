# Fresh clone proof

## Current recording build

A clean local clone was verified on October 29, 2026 at revision 70ff661756e0c48202da5597271415474e881bdf. It used only committed files and the committed lockfile. The final evidence commit adds this report, gallery updates and the corrected factory capture timing.

The helper cloned into /tmp/pa-m9-fresh. It selected Node v22.11.0 and npm 10.9.0. The child environment inherited only PATH, HOME, LANG, LC_ALL, TERM and TZ. No Twitch, moderation or mock settings were inherited. The clone had no .env file.

These commands ran in the clone. The helper supplied an available loopback PORT for the demo.

```sh
git clone --no-hardlinks /workspace/hackathons/twitchcon/pitch-arcade /tmp/pa-m9-fresh
cd /tmp/pa-m9-fresh
node --version
npm --version
npm ci
npm test
npm run demo:video
git status --short
```

## Installation

Actual npm ci output:

```text
added 107 packages, and audited 117 packages in 1s
found 0 vulnerabilities
```

The command returned 0. No source files were copied from the working tree. Dependencies were installed in the clone. The application needed no absolute workspace path at runtime.

## Tests and build

Actual Vitest summary:

```text
Test Files  34 passed (34)
Tests       204 passed (204)
Duration    18.89s
```

npm test returned 0. Its pretest script ran strict type checking and the complete build. Server bundles, the self contained harness and all four Vite pages built successfully. npm run demo:video also rebuilt before starting. The SQLite experimental warning is expected on Node 22.11.

The main checkout separately passed npm run lint:prose, npm run build and npm test. The screenshot script completed fifteen captures and its browser assertions. Every screenshot was visually inspected, including the corrected busy factory frame.

## A complete recording loop

The helper ran the actual npm run demo:video command and polled HTTP state. It did not accelerate the server clock or send player input. The printed URLs included play, overlay, dashboard and chat, followed by the recording checklist. No credentials or real network services were needed.

The first gauntlet reached:

```json
{
  "phase": "finished",
  "rounds": 5,
  "wins": 4,
  "lives": 2,
  "points": 700
}
```

The helper kept watching until the script announced Cycle 2. That happened 115 seconds after starting the command, including its build and initial library validation. The recording schedule itself is 110 seconds. This verifies both completion and automatic looping from a fresh installation.

The integration suite separately checks the final hold option, repeated outcomes, visible moderation, approval notices, credits and rankings. Chromium capture was verified during milestone eight and produced a silent 112 second WebM. OBS is needed to capture audio.

## Cleanup and audit

The clone's git status was empty after the test and demo. The helper stopped the entire demo process group and deleted /tmp/pa-m9-fresh. No temporary clone or server was left running.

The final tracked tree and full git history were scanned for service key patterns, bearer literals, JWTs, private keys and token shaped high entropy strings. No operational credential or unclassified entropy candidate was found. Public session IDs, dependency integrity values, source paths and synthetic fixtures account for the expected candidates. Ignore checks cover .env, local env variants, token JSON, data, node_modules, dist and factory jobs. Only variable names are tracked in .env.example.

The prose checker passed. The screenshots contain local demo identities, public runtime receipts and explicitly simulated clip URLs. Live Twitch authorization, public chat delivery and published clips remain unverified here.

## Earlier check

The milestone five installation check at revision de4bc34b5cd1bb7c6a7855fa06399aeed0e1462f passed 168 tests in 27 files. Its unattended demo also completed five rounds. Doctor returned 1 because live credentials and a token file were absent. That was the expected readiness result. The current proof above supersedes those historical test counts.
