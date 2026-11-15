# Tactical FPS Browser Game — Design Document

**Date:** 2026-11-15  
**Status:** Draft — awaiting approval  
**Author:** Claude (per user direction)

---

## 1. Intent & Why

Build a **complete, playable tactical FPS** in the browser that captures the core CS:GO experience: round-based bomb defusal, economy management, precise gunplay with spray patterns, and team coordination — rendered in a distinctive low-poly aesthetic. No install, no download, runs in any modern browser.

**Why now:** Browser gaming has matured (WebGL2, WASM, WebGPU emerging). Low-poly style sidesteps asset pipeline bottlenecks. A phased approach delivers playable increments.

---

## 2. Goals, Non-Goals, Anti-Goals

### Goals (Must Have)
- ✅ **Core movement** — CS-style acceleration, friction, counter-strafe, crouch jump, bunny hop
- ✅ **Gunplay** — Per-weapon spray patterns, recoil recovery, first-shot accuracy, damage falloff, wallbang
- ✅ **Bomb defusal mode** — 5v5, 30s round timer, 40s plant→explode, defuse kit, side switch at 15
- ✅ **Economy** — Round money, loss bonus streak, buy menu (primary, secondary, armor, nades, kit)
- ✅ **One polished map** — Low-poly dust2-style (A/B sites, mid, CT/T spawn, callouts)
- ✅ **Bot AI** — Navmesh-based, personality profiles (aggro, passive, support), difficulty scaling
- ✅ **Low-poly art** — Stylized characters, weapons, map; outline/toon shader; clean readability
- ✅ **Audio** — Spatial gunshots, footstep occlusion, grenade cues, buy menu sounds
- ✅ **Spectator/Deathcam** — Free cam, player follow, X-ray outline through walls

### Non-Goals (Explicitly Out of MVP)
- ❌ Multiplayer networking (WebRTC/WebSocket) — Phase 4+
- ❌ Matchmaking, ranking, leaderboards — Phase 4+
- ❌ Skin system, cases, inventory — Phase 5+
- ❌ Multiple maps — One map done perfectly first
- ❌ Console/voice chat — Text chat only if needed
- ❌ Anti-cheat — Single-player only for MVP
- ❌ Controller support — Keyboard/mouse only

### Anti-Goals (Would Make This a Failure)
- 🚫 **Feels "floaty" or "web-like"** — Movement/gunplay must feel crisp, deterministic, native
- 🚫 **Asset-heavy** — No 50MB downloads; target < 10MB initial load
- 🚫 **Mobile support** — Desktop only; pointer lock required
- 🚫 **Framework lock-in** — Core systems portable, not tied to Three.js internals

---

## 3. Constraints

| Constraint | Detail |
|------------|--------|
| **Browser** | Chrome/Edge/Firefox/Safari (last 2 versions), WebGL2 required |
| **Load time** | < 3s on 10Mbps; < 10MB gzipped initial payload |
| **Frame rate** | 60 FPS steady on 5-year-old laptop (GTX 1050 / integrated) |
| **Determinism** | Same input → same output (critical for replay, future netcode) |
| **Input latency** | < 16ms frame-to-photon (pointer lock + requestAnimationFrame) |
| **Memory** | < 512MB heap (WASM + textures + audio) |
| **No backend** | Phase 1–3 fully client-side; static hosting (GitHub Pages, Netlify) |

---

## 4. Approaches Considered

| Approach | Render | Physics | Netcode | Verdict |
|----------|--------|---------|---------|---------|
| **A: Three.js + Rapier WASM** | High-level, fast iteration, good ecosystem | Deterministic, WASM, collision groups | Colyseus (rooms, auth) | ✅ **Chosen** — Best balance |
| B: Babylon.js + Ammo.js | Strong editor, good perf | Bullet port, heavier | Socket.io + custom | Good alternative |
| C: Raw WebGL2 + Custom AABB | Maximum control, minimal deps | Simple, but reinventing wheel | Raw WebRTC | Too much engine work |
| D: Unity WebGL / Godot 4 Web | Mature tooling, asset pipeline | Built-in | Built-in | Heavy payload (~20MB+), less "web-native" |

**Why A wins:** Three.js + Rapier is the sweet spot — battle-tested, small bundle (~400KB gzipped), TypeScript-first, easy to hire for. Colyseus adds authoritative multiplayer later without rewriting game logic.

---

## 5. Technical Architecture (Decided)

```
┌─────────────────────────────────────────────────────────────┐
│                      GAME LOOP (60Hz fixed step)            │
├─────────────────────────────────────────────────────────────┤
│  Input System → Movement System → Physics (Rapier)          │
│       ↓              ↓                    ↓                 │
│  Weapon System → Hit Reg → Damage → Game State              │
│       ↓              ↓                    ↓                 │
│  Bot AI (BT) → Animation → Audio → Render (Three.js)        │
└─────────────────────────────────────────────────────────────┘
```

### Core Systems (Module Boundary)
| Module | Responsibility | Key Files |
|--------|----------------|-----------|
| `core/input` | Pointer lock, keyboard state, command buffer | `InputManager.ts` |
| `core/movement` | CS-style physics (accel, friction, air control) | `MovementController.ts` |
| `core/weapons` | Spray patterns, recoil, spread, damage, penetration | `WeaponSystem.ts`, `data/weapons.json` |
| `core/economy` | Round money, buy menu, loss bonus, equipment | `EconomyManager.ts` |
| `core/round` | Phase machine (warmup→freeze→live→end), bomb logic | `RoundManager.ts` |
| `ai/navmesh` | Recast/Detour WASM, pathfinding, off-mesh links | `NavMesh.ts` |
| `ai/behavior` | Behavior trees (Selector, Sequence, Decorator) | `BehaviorTree.ts`, `botProfiles.json` |
| `render/scene` | Three.js setup, low-poly shaders, outline pass | `SceneManager.ts` |
| `render/entities` | Player/weapon/grenade models, animation mixer | `EntityRenderer.ts` |
| `audio/engine` | Web Audio graph, spatial, HRTF, occlusion | `AudioEngine.ts` |
| `game/state` | Authoritative state, serialization, replay | `GameState.ts` |

### Data-Driven Design
- **Weapons**: `data/weapons.json` — 30+ params per gun (spray pattern array, damage, range, pen, fire rate, reload, draw, cost)
- **Bot profiles**: `data/botProfiles.json` — aggression, aim skill, reaction time, buy preferences
- **Map**: `data/maps/dust2_lowpoly.json` — spawns, bomb sites, navmesh, callouts, prop placement

---

## 6. Phase Breakdown (9 Phases — MVP)

### Phase 1: Foundation & Input (Week 1) — **"Engine runs, input works"**
| Deliverable | Criteria |
|-------------|----------|
| Vite + TS + Three.js + Rapier scaffold | Dev server, hot reload, type checking, lint, 60Hz fixed timestep loop |
| Input system | Pointer lock on click, raw mouse (movementX/Y), keyboard state, command buffer (tick-synchronized) |
| Camera controller | First-person, configurable FOV, sensitivity, inversion, smoothing |
| Debug overlay (F3) | FPS, tick rate, position/velocity, memory, entity count |
| CI pipeline | GitHub Actions: build, type-check, test, deploy preview |

**Exit gate:** `npm run dev` → click → pointer lock → move mouse → camera rotates smoothly, no jitter.

---

### Phase 2: Movement System (Week 1–2) — **"Feels like CS movement"**
| Deliverable | Criteria |
|-------------|----------|
| Ground movement | Acceleration 5.5, max speed 250u/s, friction 4, air accel 0.7 (CS:GO values) |
| Counter-strafe | Instant stop on opposite key (velocity → 0 in 1 tick) |
| Crouch/uncrouch | Hull height 36→72u, speed 0.34x, silent uncrouch |
| Jumping | 270u/s initial, gravity 800u/s², bunny hop preserves horizontal speed |
| Crouch jump | Reaches 64u ledge; edge bug (ledge grab) optional |
| Air control | Strafe gain up to 30° angle, max 30u/s per tick |
| Stuck/unstuck | Automatic resolve, no teleport exploits |

**Exit gate:** Blind test vs CS:GO movement clip — indistinguishable in blind A/B.

---

### Phase 3: Weapon Core & Ballistics (Week 2–3) — **"Shooting feels right"**
| Deliverable | Criteria |
|-------------|----------|
| Weapon data schema | `data/weapons.json` — all 30+ params per gun (see §8) |
| Fire modes | Auto, burst (3), semi, pump; fire rate enforcement |
| Spray pattern system | Deterministic per-weapon 30-bullet pattern + per-bullet RNG deviation |
| Recoil | View punch (camera) + aim punch (crosshair); recovery curve (exponential, 0.92/frame) |
| Spread model | Stand/move/crouch/air + moving spread decay + jump penalty |
| First-shot accuracy | Near-perfect (0.0001°) on first bullet after reset |
| Damage falloff | Linear per `rangeModifier` per meter; min 0.5x at max range |
| Armor penetration | Kevlar + helmet logic (headshot 1-tap AK vs helmet) |
| Wall penetration | Material-based (wood/metal/concrete), max 2 walls, damage loss per surface |
| Hit registration | Server-authoritative raycast (Rapier), hitbox groups (head/body/limbs) |

**Exit gate:** AK spray into wall at 50m — pattern matches reference overlay pixel-perfect.

---

### Phase 4: Viewmodel, Camera FX & Audio Core (Week 3) — **"Juice & feedback"**
| Deliverable | Criteria |
|-------------|----------|
| Viewmodel system | Separate arms+gun render layer (FOV 54), bob (walk/run), sway, inspect anim |
| Camera punch | Additive rotation per shot, decays 0.92/frame, configurable per weapon |
| Screen shake | Explosion/HE proximity, directional, falloff |
| Muzzle flash + tracers | Additive billboard, 1-frame flash, tracer every 3rd bullet |
| Shell ejection | Physics-based (Rapier), random rotation, bounce, fade |
| Audio engine | Web Audio graph: master→bus (weapon/footstep/ambient/UI), HRTF panner |
| Weapon sounds | Layered (mech + tail + distant), per-weapon, distance attenuation |
| Footstep system | Surface types (concrete/metal/wood/grass), speed-based pitch/volume, occlusion |

**Exit gate:** Fire AK — punch, sound, flash, shells, tracers all sync; footsteps change on surface.

---

### Phase 5: Round System, Economy & Buy Menu (Week 4) — **"It's a match now"**
| Deliverable | Criteria |
|-------------|----------|
| Round state machine | `warmup` (knife only) → `freeze` (buy) → `live` → `end` → side switch at 15 |
| Round timer | 1:55 default, 0:40 after plant, pause on freeze, overtime rules |
| Bomb logic | Plant 3s (E), defuse 5s/10s (kit), beep acceleration (1s→0.1s), explode radius/damage |
| Economy | $800 pistol, $3250 win, loss bonus $1400→$1900→$2400→$2900→$3400 (cap), kill $300, plant $300 |
| Buy menu (B) | Categories (rifle/pistol/armor/nades/kit), keyboard nav (1-5, arrows), team preview, affordability gray-out |
| Equipment persistence | Carries across rounds (armor durability, nades used), resets on side switch |
| Bot buy logic | Meta-aware (AK/M4 + kevlar + helmet + 2 flashes), eco (Deagle/armor), force (Galil/FAMAS) |

**Exit gate:** Play 30-round half — money tracks correctly, buy menu snappy, bots buy sensibly.

---

### Phase 6: Map — Low-Poly Dust2-Style (Week 4–5) — **"The arena"**
| Deliverable | Criteria |
|-------------|----------|
| Blockout (graybox) | A/B sites, T/CT spawn, Mid, Long A, Short A, Cat, CT, Tunnels, Doors — all to CS:GO scale (units) |
| Modular kit | Walls, floors, corners, doors, windows, crates, props — vertex-colored, atlas UVs |
| Low-poly art pass | ~800 tris/prop, 256×256 atlas, 3-tone toon shader, baked vertex AO |
| Collision mesh | Simplified convex hulls (Rapier), separate from render mesh |
| Callout system | Text labels at key positions (Long, Pit, Ramp, CT, etc.) for UI/bots |
| Optimization | < 50K tris total, < 15 draw calls (atlas + instancing), frustum culling |

**Exit gate:** Walk full map — no clipping errors, readable layout, 60 FPS on integrated graphics.

---

### Phase 7: Navmesh & Bot AI (Week 5–6) — **"Bots that play CS"**
| Deliverable | Criteria |
|-------------|----------|
| Navmesh build | Recast/Detour WASM — offline bake → `navmesh.bin`, runtime load < 200ms |
| Off-mesh links | Doors, jump gaps (T-spawn→Mid window), boost spots (CT→A boxes) |
| Behavior tree framework | Selector, Sequence, Parallel, Decorator (cooldown, inverter, repeater), Blackboard |
| 5 personalities | **Rush** (B-rush, entry), **Hold** (site anchor, crossfire), **Support** (flash/trade), **Lurk** (flank, info), **AWPer** (long angles, repeek) |
| Aim system | Reaction delay (ms), accuracy cone, spray control (pull-down), burst at range |
| Decision making | Site choice (info-based), rotate timing, retake vs save, economy-aware buy |
| Difficulty 0–3 | Scalar on reaction, aim, aggression, game sense |
| Debug viz | Navmesh, paths, BT state, target, last known enemy pos |

**Exit gate:** 5v5 on map — bots hold angles, trade, rotate, plant/defuse, use nades, feel distinct.

---

### Phase 8: Grenades & Tactical Utility (Week 6) — **"Nades win rounds"**
| Deliverable | Criteria |
|-------------|----------|
| Grenade physics | Projectile (Rapier), gravity, bounce (restitution 0.3), roll friction, cook timer |
| Flashbang | Blind radius 20m, falloff curve (full→0), turn-away mitigation (0.25x), duration 1.5–5s |
| Smoke | 150 radius sphere, 18s lifetime, particle billboard, occlusion culling (vision + audio) |
| HE | 350 radius, 98 dmg max, armor pen 0.5, falloff, pushback impulse |
| Molotov/Incendiary | 3m radius pool, 7s burn, 40 dmg/s, area denial (bots avoid), extinguish by smoke |
| Decoy | Sound mimic (random weapon), 15s, no damage, distraction |
| Throw modes | Primary (far), secondary (short), middle-click (drop) — arc preview line |
| Bot nade usage | Flash entry, smoke cross/plant, molly default, HE info, decoy fake |

**Exit gate:** Execute A-split with 2 flashes, smoke CT, molly pit — bots react realistically.

---

### Phase 9: Polish, Spectator & Ship (Week 7) — **"Shippable game"**
| Deliverable | Criteria |
|-------------|----------|
| Outline shader | Sobel + normal edge, team color (CT cyan / T orange), X-ray through walls (spectator) |
| Hit markers | Client-predicted (instant), server-confirmed (sound), headshot flash |
| Kill feed | Top-right, icon + weapon + distance, fade 3s |
| Spectator mode | Free cam (WASD+shift), player follow (1-10), deathcam (killer POV 3s) |
| Round end UI | Win reason (elim/bomb/defuse/time), MVP, money earned, side switch notice |
| Settings menu | Sens, FOV, keybinds, graphics (quality, shadows), audio sliders, colorblind |
| Loading screen | Progress bar, map preview, tips, warmup countdown |
| Build optimization | Production bundle < 8MB gzipped, code-split (map loads in background), service worker cache |
| Accessibility | Colorblind outlines, key remap, reduced motion (no bob/shake), high contrast UI |

**Exit gate:** Full 30-round match — zero console errors, smooth 60 FPS, feels complete.

---

### Phase 10+: Post-MVP (Not in this design)
| Phase | Focus |
|-------|-------|
| 10 | Multiplayer — Colyseus authoritative, prediction, lag comp, lobbies |
| 11 | Ranking — Glicko-2, leaderboards, seasons, placement matches |
| 12 | Cosmetics — Skins, cases, wear floats, inventory, marketplace |
| 13 | Map pool — Mirage, Inferno, Nuke, Overpass (low-poly) |
| 14 | Replay — Demo record/playback, tournament mode, GOTV |

---

## 7. Art Direction — Low-Poly Style

| Element | Spec |
|---------|------|
| **Characters** | ~800 tris, 1 texture atlas (256×256), 2 LODs, separate arms for viewmodel |
| **Weapons** | ~1.2K tris each, procedural wear shader (float 0–1), viewmodel + worldmodel |
| **Map** | Modular kits (walls, floors, props), vertex-colored lighting baked, < 50K tris total |
| **Shaders** | Toon/cel (3-tone), outline pass (sobel + normal), fresnel rim, UI shader for buy menu |
| **Palette** | CT: teal/cyan accents; T: orange/amber; Neutral: warm gray; UI: high contrast |

---

## 8. Data Specs (Sample)

### Weapon Data (`data/weapons.json`)
```json
{
  "ak47": {
    "name": "AK-47",
    "slot": "primary",
    "cost": 2700,
    "damage": 36,
    "armorPen": 0.775,
    "range": 30,
    "rangeModifier": 0.98,
    "fireRate": 600,
    "magSize": 30,
    "reloadTime": 2.5,
    "drawTime": 1.0,
    "sprayPattern": [[0,0], [0.2,1.8], [-0.5,3.2], ...], // 30 bullets
    "sprayDeviation": 0.0004,
    "firstShotAccuracy": 0.0001,
    "recoilRecovery": 0.92,
    "spread": { "stand": 0.0015, "move": 0.008, "crouch": 0.0008, "air": 0.04 },
    "wallPen": 2,
    "model": "ak47.glb",
    "sounds": { "fire": "ak_fire", "reload": "ak_reload", "draw": "rifle_draw" }
  }
}
```

### Bot Profile (`data/botProfiles.json`)
```json
{
  "rush": {
    "aggression": 0.9,
    "aimSkill": 0.7,
    "reactionMs": 180,
    "preferWeapons": ["ak47", "galil", "mac10"],
    "buyNades": ["flash", "flash"],
    "behaviorTree": "rush_bombsite"
  }
}
```

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Movement feels "off" | Medium | High | Reference CS:GO values from `game_movement.cpp`; A/B test with clip |
| Spray pattern mismatch | Low | High | Extract pattern from demo, visualize overlay, unit test per bullet |
| Rapier determinism drift | Low | Medium | Fixed timestep (1/60), same WASM build, seed RNG |
| Bundle size creep | Medium | Medium | Budgets per module; `webpack-bundle-analyzer` in CI |
| Bot AI too easy/hard | Medium | Medium | Parameterize heavily; difficulty = scalar on aim/reaction/aggression |
| Safari/WebGL2 quirks | Low | Medium | Test weekly; polyfill only what's needed |

---

## 10. What's Left to Builder

- Exact TypeScript project structure (Vite + TS + ESLint + Prettier)
- Unit test strategy (Vitest for pure logic, Playwright for visual regression)
- CI pipeline (GitHub Actions → build, test, deploy preview)
- Asset pipeline (Blender → GLTF → Draco compression → atlas packing)
- Input handling edge cases (tab out, pointer lock loss, key ghosting)
- Accessibility (colorblind outlines, key remapping, reduced motion)

---

## 11. Approval

**This design doc covers Phases 1–3 (MVP).**  
Phases 4–5 are intentional future work — not designed here.

**Please confirm:**
1. Phase breakdown matches your "fases" expectation
2. Scope (goals/non-goals) is correct
3. Stack (Three.js + Rapier + Colyseus) is acceptable
4. Low-poly art direction is the vibe you want

Once approved → I'll invoke `superpowers:writing-plans` for detailed implementation plan.