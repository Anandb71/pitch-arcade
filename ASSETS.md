# Assets and sound

All interface layouts, patterns, particles and arcade artwork are original code written in this build.

Emoji use the system font stack: Noto Color Emoji, Apple Color Emoji, Segoe UI Emoji and sans-serif.
Noto Color Emoji is available on the build machine. No font binary is bundled or downloaded.
Its upstream source is googlefonts/noto-emoji and its font license is SIL Open Font License 1.1.
Other machines use their installed system emoji font. Emoji appearance may differ across operating systems.

All game sound effects are synthesized locally with WebAudio oscillators and gain envelopes.
No audio recordings, music or copyrighted sound packs are included.
Audio starts only after a user gesture. Muting does not affect simulation.

The renderer uses eight palettes and five static patterns.
Particles are decorative and capped at 96. Shake is capped at six logical pixels.
There are no full screen flashes or strobe effects.
