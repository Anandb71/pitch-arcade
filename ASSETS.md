# Assets and sound

All interface layouts, patterns, particles and arcade artwork are original code written in this build.

Emoji use the system font stack: Noto Color Emoji, Apple Color Emoji, Segoe UI Emoji and sans-serif.
Noto Color Emoji is available on the build machine. No font binary is bundled or downloaded.
Its upstream source is googlefonts/noto-emoji and its font license is SIL Open Font License 1.1.
Other machines use their installed system emoji font. Emoji appearance may differ across operating systems.

All game sound effects are synthesized locally with WebAudio oscillators and gain envelopes.
No audio recordings, music or copyrighted sound packs are included.
Audio resumes on interaction when the browser requires it. OBS can permit autoplay with sound enabled in the overlay URL. Muting does not affect simulation.

The renderer uses eight palettes and five static patterns.
Particles are decorative and capped at 96. Shake is capped at six logical pixels.
There are no full screen flashes or strobe effects.

The committed shots are browser captures of the running application at 1920 by 1080.
They use original interface code, system emoji rendering and actual mock session state.
No generated bitmap artwork or third party screenshots are included.

## Licenses

Original application source and generated game data are provided under the repository MIT license, copyright 2026 Anand Biju. No external game code was copied.

| Component | License | Distribution |
| --- | --- | --- |
| Original UI, renderer, engine and games | MIT | Source in this repo |
| Noto Color Emoji font | SIL OFL 1.1 | System font only, no font binary bundled |
| Apple and Segoe emoji fonts | Platform supplied | Used only when installed by the operating system |
| Synthesized effects | Original code under MIT | No recorded audio |
| Fastify, ws, Ajv, Vite, Vitest, TypeScript and esbuild | MIT | npm dependencies with upstream notices |
| Playwright | Apache 2.0 | Development dependency |
| Node.js and SQLite | Upstream Node license and SQLite public domain | Provided by the runtime |
| Bundled harness dependencies | Upstream notices | factory/template/tools/LICENSES.txt |

The screenshots are direct browser captures of this application. The final overlay includes a real measured Codex receipt and clearly simulated Helix clip links. No Twitch footage, copyrighted music or external artwork is included. Font rendering can differ on other systems.

The polish sprint adds original synthesized hit, score, countdown, win, lose and pitch cues. Render hit stop is capped at 35 ms and never delays the engine. Reduced motion disables spatial feedback and edge pulses. No sound or image asset files were added.
