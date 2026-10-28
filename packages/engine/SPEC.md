# Microgame format v1

Games are JSON data. There are no scripts, URLs, paths, custom assets or arbitrary properties.
schema.json is the authoritative closed shape. emoji.json and verbs.json are explicit allowlists embedded in the schema.

## Fields

v is 1. Title has 3 to 24 ASCII letters, digits, spaces or ! ? ' &. Leading and trailing spaces are rejected.
verb is one of 30 uppercase commands. seconds is 4 to 8, with 5 used when omitted.
Palettes are sunset, ocean, candy, forest, midnight, citrus, ice and mono.
Patterns are none, dots, stripes, grid and stars. sfx is pop, boom, ding or none.
The player has an allowed emoji, control, speed from 1 to 10 and size s, m or l.
Controls are move_lr, move_4, click and mash.

There are at most four spawners. Roles are hazard, goal, target and decor.
Origins are top, bottom, left, right, edges, random and center.
Motions are fall, rise, sweep, bounce, chase, flee, still and popup.
every is a number from 0.15 to 3 seconds, or the string once.
max is the maximum live count for this spawner, from 1 to 40.
Speed is 1 to 10. Size is s, m or l.

Win rules are survive, collect with n, reach, hit with n and mash with n.
n is an integer from 1 to 100. collect and reach refer to goal. hit refers to target.
An optional role may state that fixed role explicitly.
Lose rules are touch with a role, or timeout.
Mods contain at most two distinct values: wind_left, wind_right, mirror, spotlight, floor_lava and speedup.
Opposing winds are rejected.

## Consistency

DODGE, AVOID, SURVIVE, EVADE, DUCK and DEFEND require survive and touch hazard.
CATCH, COLLECT, GRAB, FEED, GATHER, FETCH, SCOOP and HARVEST require collect.
REACH, ESCAPE, FIND, DELIVER, RACE and GUIDE require reach.
POP, CLICK, SHOOT, TAP, BURST and SMASH require hit and click control.
MASH, PUMP, CHARGE and BOOST require mash and mash control.
Movement objectives require move_lr or move_4. Objective games lose on timeout.
Every referenced role must exist. floor_lava requires movement.

## Simulation contract

The arena is 960 by 540 logical units. A step advances exactly one frame at 60 Hz.
The seed determines spawn positions and directions. Inputs are indexed by frame.
Sizes s, m and l have collision radii 12, 20 and 30. Player movement speed is speed times 60 units per second.
Horizontal players start at (480, 460). Other controls start at (480, 270).
Movement inputs are clamped to unit length. move_lr ignores vertical input.
Pointer positions use arena coordinates. click and mash count rising edges, never held keys.

Spawners first fire at frame zero. Numeric intervals round up to whole frames.
Each spawner caps its live entities. once fires only once.
Edge spawns start one radius inside the arena. random uses the whole arena.
fall and rise move vertically. sweep moves across the arena from its origin.
bounce reflects on walls. chase approaches the player. flee moves away and reflects on walls.
still stays put. popup stays visible for 0.75 seconds then disappears.
Entities leaving the arena by more than their radius are removed.
Hazards always cause loss. The touch rule can additionally make another role dangerous.
Goals are collected by contact. A reached goal wins immediately. Targets require a click.
A timeout wins survive and loses other objectives. A losing collision takes priority over a simultaneous win.

wind_left and wind_right add 70 units per second of drift.
mirror reverses movement input and reflects pointer x.
speedup increases motion speeds linearly to 1.5 times by the final frame.
floor_lava makes the bottom 32 units dangerous. spotlight affects rendering only.
No mod creates a flash. Rendering may use soft light and capped shake only.

The harness measures difficulty separately. Valid JSON can still be unsafe or too easy.
