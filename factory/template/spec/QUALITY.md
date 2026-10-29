# Game quality and variety

The factory now asks for a clear five second objective, a coherent theme and a meaningful difference from recent games. Ten new seed games use all eight palettes and all four controls. Their credits identify the Pitch Arcade seed studio. Their receipts contain actual bot measurements, not invented model timings.

## Existing gates stay first

Moderation, the denylist, private environment handling and the sandbox are unchanged. The server still rejects unsafe strings, unknown fields, invalid emoji, title and verb mismatches, role errors and limits. It independently runs the original forty seed harness with idle, random and humanish bots. Spawn kills, overcrowding, impossible games and other original report codes still reject a game.

Quality checks run only after those checks pass. Agent reports are never trusted. Approval and trusted role auto approval happen only after the new checks pass too.

## Added gates

| Code | Requirement | Repair direction |
| --- | --- | --- |
| FUN_EVIDENCE | A passing server report with forty runs per bot and finite engagement metrics | Pass the original checks first |
| FUN_DURATION | Exactly five seconds | Make the objective and deadline agree |
| FUN_FEEDBACK | pop, ding or boom | Use the standard renderer's feedback |
| FUN_SKILL_GAP | Humanish wins from 40% to 80% and beats random by at least 15 percentage points | Tune the route, target size, cadence or objective count |
| FUN_INPUT | Humanish changes at least 20% of outcomes compared with idle on the same seeds | Make the intended action useful |
| FUN_IDLE | Idle wins at most 25% of survival seeds or 2.5% of objective seeds | Remove passive wins |
| FUN_EVENTS | Mean meaningful events is at least 4, or score variance at least 0.15, or finish frame variance at least 100 | Add interactions or varied progress |
| FUN_DUPLICATE | Mechanics do not exactly repeat a library game | Change actual rules or behavior |
| FUN_NEAR_DUPLICATE | No close mechanical copy exists in the library | Make a substantial parameter or structural change |

Meaningful events count distinct nondecor entities observed in a run plus score increments. Decorative spawns cannot inflate the count. Score and finish frame variance use the population variance across the forty humanish runs. Paired outcomes compare the same engine seed with and without humanish input. Bot win rates are proxies for challenge, not proof that people will enjoy a game.

The fingerprint includes control, duration, win and lose rules, relevant mods, movement parameters and nondecor spawner roles, origins, motions, intervals, effective caps, speed and size. It ignores titles, verb aliases, emoji, palettes, patterns, sound and decor. Unused speeds, once spawner caps and mods that have no mechanical effect are ignored too.

Near copies must have the same categorical structure. The relative difference for each numeric parameter is its absolute difference divided by the larger magnitude or 1. A candidate is too close when every difference is at most 25% and their mean is at most 12%. This is deliberately conservative and deterministic. It is a heuristic, not a complete equivalence proof.

## Context and repair

Each job receives inbox/context.json. It contains a digest of the latest eight library games, using only allowed mechanics, emoji, palettes and patterns. It omits free text titles and author names. Short mechanical hashes let the mock avoid existing replays. These are data, never instructions. The server compares the candidate with all stored library games, including rejected entries, including concurrent work that finished first.

A quality failure writes fixed codes and hints to the protected inbox/feedback.json file. The second CLI invocation reads that file through a fixed prompt. Viewer text and hints never become shell arguments or file paths. Old output files are removed before the repair so stale output cannot pass accidentally.

There are at most two generation attempts, four total playtest calls and one 150 second deadline. Receipts retain each attempt's actual thread and usage metadata. The final receipt sums usage and playtests. A failed schema, safety or original harness check is rejected immediately. Repair is only for the added quality layer.

## New seed collection

| Game | Focus | Visual theme |
| --- | --- | --- |
| Neon Taco Shuffle | Escalating lane dodge | Neon food |
| Shell Shuffle | Bouncing pickups with wind | Ocean shells |
| Lantern Snap | Short visibility timing and aim | Light targets |
| Star Sprint Gallery | Moving target aim | Icy space |
| Pancake Stack | Rising collection count | Citrus breakfast |
| Robot Rave | Repeated input before threats arrive | Candy machinery |
| Ghost Courier | Chase a fleeing finish | Forest ghosts |
| Orbit Avoid | Mirrored bouncing hazard avoidance | Mono space |
| Garden Reflex | Small fleeing targets | Tiny garden |
| Honey Balance | Movement against wind and threats | Sunset weather |

All ten pass fresh validation and quality checks against the rest of the library. The thirty eight mock variants also pass the full harness and pairwise novelty checks. Mock generation rotates eligible families and respects requested control themes. It never changes the server's acceptance rules. Replays remain labeled simulated and make no model call.

The mock pool is finite. Once its eligible variants are exhausted, it declines safely instead of bypassing duplicate checks. A fresh demo database or real Codex generation can provide more games.

The legacy set is twenty seed classics and three measured runtime games. Those historical games retain their original validation and receipts. The added quality version applies to all new factory outputs and to the ten new seeds. It does not rewrite old receipts or claim their difficulty meets the new bands.

## Honest format limits

V1 supports short timing windows, aim, reflex, chase, collection and avoidance. Stack is a collection theme, rhythm is repeated input cadence, and balance is movement against wind. There is no physical block stacking, beat accuracy scoring or hidden memory rule. The prompt requires a clear supported adaptation or a safe rejection rather than pretending otherwise.

## Reproduce

```sh
npm test
npm run library:variety
npm run demo:auto
```

The variety command regenerates the ten seed receipts and the measured mock variant bank from committed examples. It performs real local bot simulations and makes no model call. The unattended demo uses seed 8 with five distinct viewer games. The actual humanish run wins four games and loses Lantern Snap, which credits its designer.
