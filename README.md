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
