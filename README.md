# Pitch Arcade

Your chat makes the games. You have to survive them.

This first milestone provides the data format, deterministic simulation and bot playtest foundation.
The browser apps and Twitch connection arrive in later milestones.

Use Node 22 and npm.

```sh
npm install
npm test
npm run build
npm run playtest -- factory/template/examples/01-taco-rain.json
```

The factory CLI also runs directly from a copied template with node tools/playtest.mjs <file>.
No credentials or API keys are needed for playtests.
npm run dev and npm run demo currently print milestone status.

See PLAN.md for architecture and AGENTS.md for engineering rules.

Thirty examples cover the full format, including all 30 allowed verbs.
The playtest runs three bots on 40 seeds each and prints failure codes with tuning hints.
See packages/engine/SPEC.md and packages/harness/README.md for the rules.

Use npm run mock:twitch to start the local EventSub WebSocket fixture.
It emits welcome, keepalive and simulated chat messages without Twitch CLI or credentials.
The mock also exposes reconnect and drop controls for automated tests.
Real OAuth, Helix, browser play and OBS integration remain later milestones.
