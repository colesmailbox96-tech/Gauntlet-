# Arcane Gauntlet — Roguelike Deck-Builder with Adaptive AI

> **Build Target**: A complete, production-ready roguelike deck-builder playable in-browser (desktop & mobile), deployable as a PWA on iOS, and packageable for Steam via Electron. Zero placeholders. Every system fully implemented.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Project Structure](#3-project-structure)
4. [Core Game Loop](#4-core-game-loop)
5. [Card System](#5-card-system)
6. [Combat System](#6-combat-system)
7. [Enemy AI System](#7-enemy-ai-system)
8. [Map & Progression System](#8-map--progression-system)
9. [Relic System](#9-relic-system)
10. [Procedural Generation](#10-procedural-generation)
11. [Player Progression & Meta-Game](#11-player-progression--meta-game)
12. [UI/UX Specification](#12-uiux-specification)
13. [Audio System](#13-audio-system)
14. [Save System](#14-save-system)
15. [Monetization Architecture](#15-monetization-architecture)
16. [PWA & Mobile Configuration](#16-pwa--mobile-configuration)
17. [Steam/Electron Packaging](#17-steamelectron-packaging)
18. [Performance Targets](#18-performance-targets)
19. [Testing Requirements](#19-testing-requirements)
20. [Build & Deployment](#20-build--deployment)
21. [Complete Data Definitions](#21-complete-data-definitions)

---

## 1. Project Overview

**Arcane Gauntlet** is a single-player roguelike deck-builder where the player ascends a procedurally generated tower of encounters, building a deck of cards to defeat increasingly difficult enemies. What differentiates it from competitors is an **adaptive enemy AI** that learns the player's patterns and adjusts its strategy, **procedurally generated card mutations** that ensure no two runs are identical, and a **modular data-driven architecture** that makes adding new content trivial.

### Design Pillars

- **Strategic Depth**: Every card play is a meaningful decision. No optimal autopilot strategies.
- **Adaptive Challenge**: Enemies that feel intelligent, not scripted. The AI notices your habits.
- **Infinite Replayability**: Procedural mutations, adaptive enemies, and branching paths ensure every run is unique.
- **Modular Extensibility**: New cards, relics, enemies, and events are JSON definitions — no code changes required.
- **Cross-Platform**: Identical experience on desktop browser, iOS PWA, and Steam.

### Genre References

Slay the Spire (core loop), Balatro (satisfying combo mechanics), Inscryption (atmosphere and surprise), Monster Train (multi-lane depth).

---

## 2. Tech Stack & Dependencies

### Runtime

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Renderer | HTML5 Canvas | Native | All game rendering |
| Engine | Custom JS | ES2022+ | Game logic, state management |
| Audio | Howler.js | ^2.2.4 | Cross-platform audio with sprite support |
| Animation | GSAP | ^3.12 | Card animations, UI transitions |
| State | Immer | ^10.0 | Immutable state management |
| Storage | localForage | ^1.10 | IndexedDB/localStorage abstraction |
| Build | Vite | ^5.0 | Dev server, bundling, HMR |
| Desktop | Electron | ^28.0 | Steam packaging |
| PWA | Workbox | ^7.0 | Service worker, offline caching |

### Dev Dependencies

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | ^1.0 | Unit and integration testing |
| Playwright | ^1.40 | E2E browser testing |
| ESLint | ^8.50 | Code quality |
| TypeScript | ^5.3 | Type checking (JSDoc mode — no .ts files, types via JSDoc comments) |

### Installation

```bash
npm install
npm run dev       # Start dev server at localhost:5173
npm run build     # Production build to /dist
npm run preview   # Preview production build
npm run electron  # Launch Electron wrapper
npm run test      # Run test suite
```

### CDN Fallbacks (Zero Install Mode for Codespaces)

If running in GitHub Codespaces without npm, the game can load dependencies from CDN:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/gsap.min.js"></script>
```

---

## 3. Project Structure

```
arcane-gauntlet/
├── index.html                    # Entry point
├── manifest.json                 # PWA manifest
├── sw.js                         # Service worker
├── vite.config.js                # Build configuration
├── package.json                  # Dependencies and scripts
│
├── src/
│   ├── main.js                   # Boot sequence, canvas init
│   ├── config.js                 # Global constants, tuning values
│   │
│   ├── core/
│   │   ├── GameState.js          # Central state container (Immer-powered)
│   │   ├── EventBus.js           # Pub/sub event system
│   │   ├── SceneManager.js       # Scene lifecycle (load, update, render, unload)
│   │   ├── InputManager.js       # Unified mouse/touch/keyboard input
│   │   ├── SaveManager.js        # Save/load with localForage
│   │   └── AudioManager.js       # Howler.js wrapper with music/SFX channels
│   │
│   ├── scenes/
│   │   ├── BootScene.js          # Asset loading, splash screen
│   │   ├── MainMenuScene.js      # Title screen, settings, run history
│   │   ├── MapScene.js           # Node-based map navigation
│   │   ├── CombatScene.js        # Battle arena — card play, enemy turns
│   │   ├── RewardScene.js        # Post-combat card/gold/relic rewards
│   │   ├── ShopScene.js          # Card/relic shop
│   │   ├── EventScene.js         # Narrative encounter events
│   │   ├── RestScene.js          # Rest site — heal or upgrade
│   │   ├── BossRewardScene.js    # Boss-specific reward screen
│   │   ├── VictoryScene.js       # Run complete screen
│   │   ├── DeathScene.js         # Run failed screen with stats
│   │   └── SettingsScene.js      # Audio, display, accessibility
│   │
│   ├── combat/
│   │   ├── CombatManager.js      # Turn sequencing, win/loss conditions
│   │   ├── CardResolver.js       # Card effect execution pipeline
│   │   ├── StatusEffectManager.js # Buff/debuff tick and interaction logic
│   │   ├── EnemyAI.js            # Adaptive AI decision engine
│   │   ├── IntentSystem.js       # Enemy intent display and resolution
│   │   ├── TargetingSystem.js    # Card target selection
│   │   └── ComboDetector.js      # Card synergy and combo tracking
│   │
│   ├── cards/
│   │   ├── CardFactory.js        # Creates card instances from definitions
│   │   ├── CardEffects.js        # All card effect implementations
│   │   ├── CardMutator.js        # Procedural card mutation engine
│   │   ├── DeckManager.js        # Draw pile, hand, discard, exhaust
│   │   └── CardUpgrader.js       # Card upgrade logic and UI
│   │
│   ├── map/
│   │   ├── MapGenerator.js       # Procedural map layout algorithm
│   │   ├── NodeTypes.js          # Combat, elite, boss, shop, rest, event
│   │   └── MapRenderer.js        # Map visualization with paths
│   │
│   ├── enemies/
│   │   ├── EnemyFactory.js       # Creates enemy instances from definitions
│   │   ├── EnemyPatterns.js      # Base behavior patterns (aggressive, defensive, etc.)
│   │   └── AdaptiveModel.js      # Lightweight neural net for pattern recognition
│   │
│   ├── relics/
│   │   ├── RelicFactory.js       # Creates relic instances from definitions
│   │   └── RelicEffects.js       # All relic effect implementations
│   │
│   ├── events/
│   │   ├── EventEngine.js        # Narrative event processor
│   │   └── EventResolver.js      # Choice resolution and rewards
│   │
│   ├── procedural/
│   │   ├── RunSeedManager.js     # Seeded RNG for deterministic runs
│   │   ├── EncounterScaler.js    # Difficulty scaling per floor
│   │   └── LootTableManager.js   # Weighted random reward tables
│   │
│   ├── meta/
│   │   ├── UnlockManager.js      # Persistent unlock tracking
│   │   ├── AchievementManager.js # Achievement definitions and triggers
│   │   ├── StatsTracker.js       # Per-run and lifetime statistics
│   │   └── DailyChallenge.js     # Seeded daily run with leaderboard
│   │
│   ├── ui/
│   │   ├── UIRenderer.js         # Canvas-based UI framework
│   │   ├── Button.js             # Touch-friendly button component
│   │   ├── CardRenderer.js       # Card visual rendering (frame, art, text, cost)
│   │   ├── Tooltip.js            # Hover/long-press tooltip system
│   │   ├── HealthBar.js          # Animated health bar component
│   │   ├── EnergyDisplay.js      # Energy orb display
│   │   ├── HandLayout.js         # Fan-spread card hand positioning
│   │   ├── DamageNumbers.js      # Floating damage/heal numbers
│   │   ├── ScreenShake.js        # Impact feedback
│   │   ├── ParticleSystem.js     # Card play, damage, death particles
│   │   └── TransitionManager.js  # Scene transition effects
│   │
│   └── utils/
│       ├── SeededRandom.js       # Mulberry32 PRNG
│       ├── Tween.js              # GSAP tween helpers
│       ├── MathUtils.js          # Clamp, lerp, shuffle, weighted random
│       ├── CanvasUtils.js        # Rounded rect, gradient, shadow helpers
│       └── Platform.js           # Device detection, safe area insets
│
├── data/
│   ├── cards/
│   │   ├── starter.json          # Starting deck cards
│   │   ├── common.json           # Common rarity cards
│   │   ├── uncommon.json         # Uncommon rarity cards
│   │   ├── rare.json             # Rare rarity cards
│   │   └── curse.json            # Curse cards
│   ├── enemies/
│   │   ├── act1.json             # Act 1 enemy definitions
│   │   ├── act2.json             # Act 2 enemy definitions
│   │   ├── act3.json             # Act 3 enemy definitions
│   │   ├── elites.json           # Elite enemy definitions
│   │   └── bosses.json           # Boss definitions
│   ├── relics/
│   │   └── relics.json           # All relic definitions
│   ├── events/
│   │   ├── act1_events.json      # Act 1 narrative events
│   │   ├── act2_events.json      # Act 2 narrative events
│   │   └── act3_events.json      # Act 3 narrative events
│   ├── mutations/
│   │   └── mutations.json        # Card mutation rules
│   └── config/
│       ├── balance.json          # Tuning values (damage, health, scaling)
│       ├── difficulty.json       # Ascension level modifiers
│       └── achievements.json     # Achievement definitions
│
├── assets/
│   ├── sprites/                  # All game sprites (see Asset Manifest below)
│   ├── audio/
│   │   ├── music/                # Background music tracks
│   │   └── sfx/                  # Sound effects
│   └── fonts/                    # Custom fonts (WOFF2)
│
├── electron/
│   ├── main.js                   # Electron main process
│   ├── preload.js                # Context bridge
│   └── steam/
│       └── steamworks.js         # Steamworks API integration
│
└── tests/
    ├── unit/
    │   ├── CardResolver.test.js
    │   ├── CombatManager.test.js
    │   ├── DeckManager.test.js
    │   ├── EnemyAI.test.js
    │   └── MapGenerator.test.js
    └── e2e/
        ├── combat.spec.js
        └── fullRun.spec.js
```

---

## 4. Core Game Loop

### Run Structure

A single run consists of **3 Acts**, each with a procedurally generated map of **15–17 nodes** leading to a **boss encounter**.

```
[Start] → Act 1 (Floors 1-17) → Boss → Act 2 (Floors 1-17) → Boss → Act 3 (Floors 1-17) → Final Boss → [Victory]
```

### Turn Structure (Combat)

```
PLAYER TURN START
├── Trigger: "onTurnStart" relics and status effects
├── Draw cards (default: 5)
├── Gain energy (default: 3)
├── Player action phase (play cards, use potions — unlimited actions while energy allows)
│   └── Each card play:
│       ├── Deduct energy cost
│       ├── Resolve card effects via CardResolver pipeline
│       ├── Trigger "onCardPlayed" relics
│       ├── Move card to discard (or exhaust if Exhaust keyword)
│       └── Check combo triggers
├── Player clicks "End Turn"
├── Trigger: "onTurnEnd" relics and status effects
├── Discard remaining hand
│
ENEMY TURN START
├── For each enemy (left to right):
│   ├── Trigger: "onEnemyTurnStart" status effects
│   ├── Execute announced intent (attack, defend, buff, debuff, special)
│   ├── Trigger: "onEnemyAction" relics
│   ├── Tick down status effect durations
│   └── Select and display next turn's intent via EnemyAI
├── Trigger: "onTurnEnd" for all enemies
│
→ Return to PLAYER TURN START
```

### State Machine

```
BOOT → MAIN_MENU → MAP → COMBAT → REWARD → MAP → ... → BOSS_COMBAT → BOSS_REWARD → MAP (next act) → ... → VICTORY
                                                                                                              ↓
                                                    MAP → SHOP / REST / EVENT → MAP                       DEATH
```

---

## 5. Card System

### Card Schema

Every card is defined by the following JSON structure. No card may deviate from this schema.

```json
{
  "id": "strike_001",
  "name": "Strike",
  "type": "attack",
  "rarity": "starter",
  "energyCost": 1,
  "description": "Deal {damage} damage.",
  "effects": [
    {
      "type": "damage",
      "target": "single_enemy",
      "value": 6,
      "scaling": []
    }
  ],
  "upgraded": {
    "name": "Strike+",
    "description": "Deal {damage} damage.",
    "effects": [
      {
        "type": "damage",
        "target": "single_enemy",
        "value": 9,
        "scaling": []
      }
    ]
  },
  "keywords": [],
  "tags": ["basic"],
  "art": "strike.png",
  "sfx": "sword_slash"
}
```

### Card Types

| Type | Color Code | Behavior |
|------|-----------|----------|
| `attack` | Red `#C0392B` | Deals damage to enemies |
| `skill` | Blue `#2980B9` | Applies block, buffs, or utility effects |
| `power` | Gold `#F39C12` | Persistent effects for the rest of combat. Played once, not discarded |
| `curse` | Purple `#8E44AD` | Negative cards clogging the deck. Cannot be played normally |
| `status` | Gray `#7F8C8D` | Temporary negative cards added during combat |

### Card Effects Pipeline

When a card is played, `CardResolver.js` processes its effects array in order:

```
1. PRE_PLAY    → Check if card can be played (energy, targets valid)
2. COST        → Deduct energy (modified by relics/status effects)
3. EFFECTS     → Execute each effect in the effects array:
                  → Apply damage formula: base × strength_multiplier + flat_bonus
                  → Apply block formula: base × dexterity_multiplier + flat_bonus
                  → Apply status effects
                  → Draw/discard/exhaust cards
                  → Gain/lose energy
4. KEYWORDS    → Process keywords (Exhaust, Ethereal, Retain, Innate)
5. POST_PLAY   → Trigger relics, update combo tracker, move card to appropriate pile
```

### Card Effect Types

| Effect Type | Parameters | Description |
|------------|-----------|-------------|
| `damage` | `value`, `target`, `times`, `scaling` | Deal damage |
| `block` | `value`, `scaling` | Gain block |
| `apply_status` | `status`, `value`, `target` | Apply buff/debuff |
| `draw` | `value` | Draw cards |
| `discard` | `value`, `random` | Discard cards (random or chosen) |
| `exhaust` | `value`, `random` | Exhaust cards |
| `gain_energy` | `value` | Gain energy this turn |
| `heal` | `value` | Restore HP |
| `add_to_hand` | `cardId`, `count` | Create temporary card in hand |
| `upgrade_random` | `count` | Upgrade random cards in hand |
| `scry` | `value` | Look at top N cards, discard any |
| `channel` | `element` | Channel an elemental orb |
| `conditional` | `condition`, `thenEffects`, `elseEffects` | Conditional branching |

### Card Keywords

| Keyword | Behavior |
|---------|----------|
| `Exhaust` | After playing, remove from combat permanently |
| `Ethereal` | If still in hand at end of turn, exhaust it |
| `Retain` | Does not discard at end of turn |
| `Innate` | Always drawn in opening hand |
| `Unplayable` | Cannot be played (curses, some status cards) |
| `X Cost` | Costs all remaining energy; effect scales with energy spent |

### Scaling System

Cards can scale dynamically based on game state:

```json
"scaling": [
  { "stat": "strength", "multiplier": 1.0 },
  { "stat": "cards_played_this_turn", "multiplier": 2 },
  { "stat": "cards_exhausted_this_combat", "multiplier": 1 }
]
```

The final value = `base_value + sum(stat_value × multiplier)` for each scaling entry.

### Card Mutation System

The `CardMutator.js` generates variant cards by combining base cards with mutation rules. Mutations appear as **rewards** in elite combats and special events.

```json
{
  "mutation_id": "blazing",
  "name_prefix": "Blazing",
  "description_append": " Apply {value} Burn.",
  "added_effects": [
    { "type": "apply_status", "status": "burn", "value": 3, "target": "same" }
  ],
  "energy_cost_modifier": 1,
  "visual_modifier": "fire_border",
  "rarity_upgrade": true
}
```

A "Strike" + "Blazing" mutation = "Blazing Strike" (costs 2 energy, deals 6 damage + applies 3 Burn). Mutations stack — a card can have up to 2 mutations.

---

## 6. Combat System

### Damage Formula

```
Raw Damage = (card_base_damage + scaling_bonuses) × times_multiplied
Modified Damage = Raw Damage + player_strength - enemy_block_per_hit
Final Damage = max(0, Modified Damage × vulnerability_multiplier - enemy_armor)

vulnerability_multiplier = target has Vulnerable ? 1.5 : 1.0
weakness_multiplier = attacker has Weak ? 0.75 : 1.0
Apply weakness BEFORE vulnerability.
```

### Block Formula

```
Raw Block = card_base_block + scaling_bonuses
Modified Block = (Raw Block + player_dexterity) × frail_multiplier
frail_multiplier = player has Frail ? 0.75 : 1.0
Block resets to 0 at the start of the player's turn (unless modified by relics).
```

### Status Effects

| Status | Type | Per-Stack Effect | Duration |
|--------|------|-----------------|----------|
| `strength` | Buff | +1 damage per attack | Permanent |
| `dexterity` | Buff | +1 block per block card | Permanent |
| `vulnerable` | Debuff | Take 50% more damage | Turns |
| `weak` | Debuff | Deal 25% less damage | Turns |
| `frail` | Debuff | Gain 25% less block | Turns |
| `poison` | Debuff | Lose N HP at turn start, then reduce by 1 | Until 0 |
| `burn` | Debuff | Lose N HP at turn end | Until 0 |
| `regen` | Buff | Heal N HP at turn end, then reduce by 1 | Until 0 |
| `thorns` | Buff | Deal N damage to attackers | Permanent |
| `ritual` | Buff | Gain N strength at turn end | Permanent |
| `metallicize` | Buff | Gain N block at turn end | Permanent |
| `plated_armor` | Buff | Gain N block at turn end; lose 1 on unblocked damage | Permanent |
| `artifact` | Buff | Negate next N debuffs | Stacks consumed |
| `intangible` | Buff | All damage/HP loss reduced to 1 | Turns |
| `barricade` | Buff | Block does not reset at turn start | Permanent |
| `draw_reduction` | Debuff | Draw N fewer cards | Turns |
| `entangle` | Debuff | Cannot play attacks this turn | 1 Turn |
| `confused` | Debuff | Card costs are randomized (0 to 3) | Turns |

### Potion System

The player can carry up to **3 potions** (upgradeable via relics). Potions are single-use, consumed on click during combat (free action, no energy cost).

```json
{
  "id": "fire_potion",
  "name": "Fire Potion",
  "description": "Deal 20 damage to target enemy.",
  "rarity": "common",
  "effects": [{ "type": "damage", "target": "single_enemy", "value": 20 }],
  "targetRequired": true,
  "color": "#E74C3C"
}
```

Potions are earned from combat rewards (40% chance from normal combat, guaranteed from elites) and purchased from shops.

---

## 7. Enemy AI System

### Architecture Overview

The enemy AI operates on two layers:

**Layer 1 — Pattern-Based Intent (deterministic)**: Each enemy has a predefined behavior pattern defining possible actions and their conditions. This ensures baseline behavior is predictable enough for the player to strategize around.

**Layer 2 — Adaptive Modifier (learned)**: A lightweight model tracks the player's tendencies over the current run and biases the enemy's pattern selection to counter-play. This creates the feeling of intelligent opposition without being unfair.

### Intent System

Every enemy broadcasts its **next action** as an intent icon above their head at the end of each enemy turn. The player always knows WHAT the enemy will do next turn, but the adaptive AI determines WHICH action from the enemy's pattern gets selected.

Intent types:

| Intent | Icon | Description |
|--------|------|-------------|
| `attack` | Sword | Will deal X damage |
| `attack_multi` | Multi-sword | Will deal X damage N times |
| `defend` | Shield | Will gain X block |
| `buff` | Up arrow | Will apply a buff to self or allies |
| `debuff` | Down arrow | Will apply a debuff to the player |
| `special` | Star | Unique ability (charge-up, summon, etc.) |
| `unknown` | Question mark | Used for bosses phase changes on first encounter |

### Enemy Definition Schema

```json
{
  "id": "goblin_warrior",
  "name": "Goblin Warrior",
  "act": 1,
  "tier": "normal",
  "hp": { "min": 28, "max": 32 },
  "art": "goblin_warrior.png",
  "behavior": {
    "type": "pattern",
    "pattern": [
      {
        "id": "slash",
        "intent": "attack",
        "weight": 50,
        "effects": [{ "type": "damage", "value": 8 }],
        "conditions": [],
        "adaptiveTag": "aggression"
      },
      {
        "id": "shield_bash",
        "intent": "attack",
        "weight": 30,
        "effects": [
          { "type": "damage", "value": 5 },
          { "type": "apply_status", "status": "vulnerable", "value": 1, "target": "player" }
        ],
        "conditions": [{ "type": "not_consecutive", "actionId": "shield_bash" }],
        "adaptiveTag": "setup"
      },
      {
        "id": "brace",
        "intent": "defend",
        "weight": 20,
        "effects": [{ "type": "block", "value": 6 }],
        "conditions": [{ "type": "hp_below_percent", "value": 50 }],
        "adaptiveTag": "defense"
      }
    ]
  },
  "statusBar": [],
  "deathEffect": null
}
```

### Adaptive Model (AdaptiveModel.js)

The adaptive model is a simple **pattern tracker** (not a full neural network — keeping it lightweight for browser performance):

```
Player Profile (tracked per-run):
├── attack_frequency: 0.0 - 1.0 (how often player plays attack cards)
├── block_frequency: 0.0 - 1.0 (how often player plays block cards)
├── average_burst_damage: number (average damage per turn in burst turns)
├── status_usage: { poison: count, weak: count, vulnerable: count, ... }
├── energy_efficiency: 0.0 - 1.0 (how much energy is wasted per turn)
├── deck_archetype: "aggro" | "control" | "combo" | "balanced"
└── turn_count_tendency: number (average turns per combat)
```

The adaptive modifier adjusts enemy action weights:

```javascript
// Pseudocode for adaptive weight modification
function getAdaptiveWeights(enemy, playerProfile) {
  const weights = { ...enemy.baseWeights };

  // If player is very aggressive, enemies favor defensive/debuff actions
  if (playerProfile.attack_frequency > 0.6) {
    weights.defense *= 1.5;
    weights.debuff *= 1.3;
    weights.aggression *= 0.8;
  }

  // If player turtles with block, enemies favor buff/setup actions
  if (playerProfile.block_frequency > 0.5) {
    weights.setup *= 1.4;
    weights.aggression *= 1.2;
  }

  // If player relies on poison/status, enemies favor cleansing or fast aggro
  if (playerProfile.status_usage.poison > 5) {
    weights.aggression *= 1.5;
    weights.cleanse *= 2.0;
  }

  return normalize(weights);
}
```

The adaptation is subtle (20-50% weight shifts) — it should feel like enemies are smart, not unfair. The player should feel rewarded for varying their strategy across runs.

### Boss Definitions

Bosses have **multi-phase behavior** with phase transitions triggered by HP thresholds or turn counts.

```json
{
  "id": "the_warden",
  "name": "The Warden",
  "act": 1,
  "tier": "boss",
  "hp": { "min": 210, "max": 210 },
  "phases": [
    {
      "id": "phase_1",
      "name": "Sentinel Stance",
      "trigger": { "type": "start" },
      "pattern": [
        { "id": "heavy_strike", "intent": "attack", "weight": 40, "effects": [{ "type": "damage", "value": 16 }] },
        { "id": "fortify", "intent": "defend", "weight": 35, "effects": [{ "type": "block", "value": 20 }] },
        { "id": "chains", "intent": "debuff", "weight": 25, "effects": [{ "type": "apply_status", "status": "entangle", "value": 1, "target": "player" }] }
      ],
      "onEnter": [{ "type": "apply_status", "status": "artifact", "value": 2, "target": "self" }]
    },
    {
      "id": "phase_2",
      "name": "Berserker Rage",
      "trigger": { "type": "hp_below_percent", "value": 50 },
      "pattern": [
        { "id": "frenzy", "intent": "attack_multi", "weight": 50, "effects": [{ "type": "damage", "value": 8, "times": 3 }] },
        { "id": "war_cry", "intent": "buff", "weight": 30, "effects": [{ "type": "apply_status", "status": "strength", "value": 3, "target": "self" }] },
        { "id": "slam", "intent": "attack", "weight": 20, "effects": [{ "type": "damage", "value": 28 }] }
      ],
      "onEnter": [
        { "type": "remove_block" },
        { "type": "screen_shake", "intensity": 8 },
        { "type": "dialog", "text": "ENOUGH! You face my true power!" }
      ]
    }
  ]
}
```

---

## 8. Map & Progression System

### Map Generation Algorithm

Each act generates a branching node map using the following algorithm:

```
MAP GENERATION (per act):
1. Create START node at bottom
2. Create BOSS node at top
3. Generate 15 rows between start and boss
4. Each row has 2-4 nodes (weighted random)
5. Connect nodes: each node connects to 1-3 nodes in the next row
6. Constraint: paths cannot cross (enforced by sorting and pairing)
7. Assign node types using distribution rules (see below)
8. Place guaranteed nodes: at least 1 shop, 1 rest site, 1 elite per act
9. Elite nodes cannot appear before floor 5
10. Rest site guaranteed on floor 14 or 15 (pre-boss)
```

### Node Type Distribution

| Node Type | Icon | Frequency | Description |
|-----------|------|-----------|-------------|
| `combat` | Crossed swords | 45% | Normal enemy encounter |
| `elite` | Flaming skull | 12% | Difficult enemy, better rewards |
| `event` | Question mark | 22% | Narrative choice encounter |
| `shop` | Bag of gold | 8% | Buy/sell cards and relics |
| `rest` | Campfire | 10% | Heal 30% HP or upgrade a card |
| `treasure` | Chest | 3% | Free relic (only appears once per act) |

### Floor Scaling

```json
{
  "act1": {
    "enemyHpMultiplier": 1.0,
    "enemyDamageMultiplier": 1.0,
    "goldRewardBase": { "min": 10, "max": 20 },
    "cardRewardCount": 3
  },
  "act2": {
    "enemyHpMultiplier": 1.4,
    "enemyDamageMultiplier": 1.3,
    "goldRewardBase": { "min": 15, "max": 25 },
    "cardRewardCount": 3
  },
  "act3": {
    "enemyHpMultiplier": 1.8,
    "enemyDamageMultiplier": 1.6,
    "goldRewardBase": { "min": 20, "max": 35 },
    "cardRewardCount": 3
  }
}
```

---

## 9. Relic System

Relics are persistent passive items collected during a run. Each relic modifies gameplay through event hooks.

### Relic Schema

```json
{
  "id": "burning_blood",
  "name": "Burning Blood",
  "description": "At the end of combat, heal 6 HP.",
  "rarity": "starter",
  "art": "burning_blood.png",
  "hooks": [
    {
      "event": "onCombatEnd",
      "effect": { "type": "heal", "value": 6 }
    }
  ],
  "counter": null,
  "flavor": "The thick blood of demons fuels your recovery."
}
```

### Relic Event Hooks

| Hook | Trigger |
|------|---------|
| `onCombatStart` | Combat begins |
| `onCombatEnd` | Combat ends (win) |
| `onTurnStart` | Player turn begins |
| `onTurnEnd` | Player turn ends |
| `onCardPlayed` | Any card is played |
| `onAttackCardPlayed` | Attack card played |
| `onSkillCardPlayed` | Skill card played |
| `onPowerCardPlayed` | Power card played |
| `onDamageDealt` | Player deals damage |
| `onDamageTaken` | Player takes damage |
| `onBlockGained` | Player gains block |
| `onGoldGained` | Player gains gold |
| `onCardDrawn` | Card is drawn |
| `onCardExhausted` | Card is exhausted |
| `onPotionUsed` | Potion consumed |
| `onEnemyDied` | Enemy HP reaches 0 |
| `onHPLost` | Player loses HP (damage through block) |
| `onEnterShop` | Player enters shop |
| `onEnterRest` | Player enters rest site |
| `onMapNodeChosen` | Player selects a map node |

### Relic Rarities

| Rarity | Drop Source | Count in Pool |
|--------|------------|---------------|
| `starter` | Given at run start | 1 per class |
| `common` | Normal combats, shops | 25 |
| `uncommon` | Elite combats, shops | 20 |
| `rare` | Boss rewards, shops | 15 |
| `boss` | Boss reward (choose 1 of 3) | 10 |
| `shop` | Shop-exclusive purchase | 8 |
| `event` | Event-exclusive reward | 6 |

---

## 10. Procedural Generation

### Seeded Random (SeededRandom.js)

All procedural generation uses the **Mulberry32** PRNG algorithm seeded from the run seed. This ensures runs are deterministic and reproducible (enabling daily challenges and seed sharing).

```javascript
class SeededRandom {
  constructor(seed) {
    this.state = seed;
  }

  next() {
    this.state |= 0;
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min, max) {
    return this.next() * (max - min) + min;
  }

  shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  weightedChoice(items, weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let roll = this.next() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return items[i];
    }
    return items[items.length - 1];
  }
}
```

### Encounter Generation

Normal combats draw from the act's enemy pool using weighted selection. Enemy formations:

```json
{
  "act1_formations": [
    { "enemies": ["goblin_warrior"], "weight": 15 },
    { "enemies": ["goblin_warrior", "goblin_archer"], "weight": 20 },
    { "enemies": ["slime_small", "slime_small", "slime_small"], "weight": 15 },
    { "enemies": ["cultist"], "weight": 12 },
    { "enemies": ["jaw_worm"], "weight": 18 },
    { "enemies": ["louse_red", "louse_green"], "weight": 20 }
  ]
}
```

### Reward Generation

After combat, rewards are generated using the loot table system:

```
NORMAL COMBAT REWARDS:
├── Gold: balance.goldRewardBase.min to .max (+ bonuses from relics)
├── Card choice: 3 cards from act pool
│   ├── Rarity: 60% Common, 30% Uncommon, 10% Rare (modified by relics)
│   └── Mutation: 5% chance any offered card has a random mutation
├── Potion: 40% chance of 1 potion
└── Relic: 0% (normal combats don't drop relics)

ELITE COMBAT REWARDS:
├── Gold: 1.5× normal gold
├── Card choice: 3 cards (with +10% rare chance)
├── Potion: 60% chance
├── Relic: 100% chance (uncommon or rare)
└── Mutation: 15% chance one card reward is mutated

BOSS REWARDS:
├── Gold: 2× normal gold
├── Boss relic: Choose 1 of 3
└── Cards: Access to entire pool including boss-exclusives
```

---

## 11. Player Progression & Meta-Game

### Player Character

The initial release includes **1 playable class** with architecture supporting additional classes as DLC/updates.

**The Wanderer** (default class):
- Starting HP: 80
- Starting deck: 5× Strike, 4× Defend, 1× Bash
- Starting relic: Burning Blood (heal 6 HP after combat)
- Energy per turn: 3
- Card pool: 75 unique cards (before mutations)

### Ascension System

After completing a run, the next **Ascension level** unlocks (up to Ascension 20). Each level adds a permanent modifier that increases difficulty:

| Ascension | Modifier |
|-----------|---------|
| 1 | Elites are harder |
| 2 | Normal enemies are harder |
| 3 | Elites are even harder |
| 4 | Boss fights are harder |
| 5 | Heal 75% at rest sites (instead of 100%) |
| 6 | Start each run with a Curse card |
| 7 | Start with 10 less max HP |
| 8 | Boss rewards offer 2 choices instead of 3 |
| 9 | Potion drop rate halved |
| 10 | Card rewards offer 2 instead of 3 |
| 11 | Start with 1 less starting relic slot |
| 12 | Shops cost 10% more |
| 13 | Enemies have 5% more HP |
| 14 | Enemies have 10% more HP |
| 15 | Enemies deal 5% more damage |
| 16 | Enemies deal 10% more damage |
| 17 | Card removal at rest costs HP |
| 18 | Elites have 25% more HP |
| 19 | Bosses have 15% more HP |
| 20 | Start with 1 fewer energy |

### Persistent Unlocks

Unlocks persist across runs via `localForage` (synced to cloud save if connected):

```json
{
  "highestAscension": 5,
  "totalRuns": 47,
  "totalWins": 12,
  "cardsUnlocked": ["strike_001", "..."],
  "relicsUnlocked": ["burning_blood", "..."],
  "achievementsEarned": ["first_win", "no_damage_boss", "..."],
  "classesUnlocked": ["wanderer"],
  "dailyChallengeStreak": 3,
  "lifetimeStats": {
    "totalDamageDealt": 142857,
    "totalGoldEarned": 28493,
    "totalCardsPlayed": 9821,
    "totalFloorsClimbed": 1247,
    "fastestWin": 1823,
    "highestSingleHit": 347
  }
}
```

### Daily Challenge System

A **daily challenge** generates a seeded run with specific modifiers:

```javascript
function getDailySeed() {
  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  return hashString(dateString + "arcane-gauntlet-daily");
}
```

Daily modifiers (2-3 applied per day, rotated from pool):

| Modifier | Effect |
|----------|--------|
| `glass_cannon` | Double damage dealt and received |
| `hoarder` | Card rewards offer 5 choices instead of 3 |
| `cursed_run` | Start with 3 curses |
| `sealed_deck` | Cannot add cards to deck |
| `lethality` | All enemies have 50% HP, deal 50% more damage |
| `diverse` | Cannot have duplicate cards |
| `poverty` | Shops are free but only offer 2 items |
| `draft` | Choose your starting deck from 20 random cards |

---

## 12. UI/UX Specification

### Canvas Resolution Strategy

```javascript
const config = {
  designWidth: 1920,           // Design at 1080p
  designHeight: 1080,
  minAspectRatio: 9 / 16,      // Tall phone portrait
  maxAspectRatio: 21 / 9,      // Ultrawide
  pixelRatioMax: 2,            // Cap DPR for performance
  scaleMode: "fitWidth"        // Scale to fit width, letterbox height
};
```

The canvas scales to fill the viewport width. On mobile, the layout shifts to **portrait-friendly** with the hand at the bottom and enemies at the top.

### Layout Regions (Desktop — 1920×1080)

```
┌─────────────────────────────────────────────┐
│  TOP BAR (60px)                             │
│  [HP Bar] [Block] [Gold] [Map] [Deck] [Settings] │
├─────────────────────────────────────────────┤
│                                             │
│  ENEMY AREA (340px)                         │
│  [Enemy 1]  [Enemy 2]  [Enemy 3]           │
│  (intents, HP bars, status effects)         │
│                                             │
├─────────────────────────────────────────────┤
│  MIDDLE AREA (280px)                        │
│  [Draw Pile]                [Discard Pile]  │
│  [Energy Orb]               [End Turn Btn] │
│  [Potion 1] [Potion 2] [Potion 3]         │
│                                             │
├─────────────────────────────────────────────┤
│  HAND AREA (400px)                          │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐     │
│  │C1│ │C2│ │C3│ │C4│ │C5│ │C6│ │C7│      │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘      │
└─────────────────────────────────────────────┘
```

### Layout Regions (Mobile Portrait — 430×932)

```
┌──────────────────────┐
│ TOP BAR (50px)       │
│ [HP] [Block] [Gold]  │
├──────────────────────┤
│                      │
│ ENEMY AREA (250px)   │
│ [Enemy 1] [Enemy 2]  │
│                      │
├──────────────────────┤
│ STATUS AREA (80px)   │
│ [Energy] [Draw] [Disc]│
│ [Potions]            │
├──────────────────────┤
│                      │
│ HAND AREA (200px)    │
│ Swipeable card fan   │
│                      │
├──────────────────────┤
│ ACTION BAR (60px)    │
│ [End Turn] [Map] [⚙] │
└──────────────────────┘
```

### Card Rendering (CardRenderer.js)

Each card is rendered to an offscreen canvas and cached. Card dimensions:

- **Desktop**: 180px × 252px (5:7 ratio)
- **Mobile**: 120px × 168px
- **Zoomed/Inspected**: 360px × 504px

Card visual structure:

```
┌──────────────────┐
│ [Cost]     [Type]│  ← Energy cost orb (top-left), card type icon (top-right)
│                  │
│   [Card Art]     │  ← 160px × 120px art region (procedurally tinted)
│                  │
├──────────────────┤
│   Card Name      │  ← Bold, centered, 14px
├──────────────────┤
│                  │
│  Description     │  ← Wrapped text, 11px, with {value} replacements
│  Deal 6 damage.  │
│                  │
├──────────────────┤
│ [Rarity Gem]     │  ← Colored gem indicating rarity
└──────────────────┘
```

Card border color matches card type. Upgraded cards have a **shimmering gold border**. Mutated cards have the mutation's `visual_modifier` applied (e.g., fire particles, frost overlay).

### Input Handling

**Desktop:**
- Click card to select → click enemy to target (for targeted cards)
- Right-click card to inspect (zoomed view with full description)
- Drag card upward to play (alternative to click)
- Hover card to raise it from hand fan
- Keyboard shortcuts: 1-9 to select cards, E for end turn, M for map, Esc for menu

**Mobile (Touch):**
- Tap card to select → tap enemy to target
- Long press card to inspect
- Swipe card upward to play
- Swipe left/right to scroll hand if >5 cards
- Tap empty area to deselect

### Card Animations (GSAP)

| Animation | Duration | Easing | Description |
|-----------|----------|--------|-------------|
| Card draw | 0.3s | `power2.out` | Card slides from draw pile to hand position |
| Card play | 0.25s | `power3.in` | Card flies to target with slight arc |
| Card discard | 0.2s | `power2.in` | Card slides to discard pile |
| Card exhaust | 0.4s | `power2.in` | Card shrinks, rotates, and fades |
| Enemy hit | 0.15s | `elastic.out` | Enemy sprite shakes horizontally |
| Damage number | 0.8s | `power1.out` | Number floats upward and fades |
| Block gained | 0.3s | `back.out` | Shield icon pops with scale bounce |
| Status applied | 0.25s | `power2.out` | Icon appears with scale-up |
| Turn transition | 0.5s | `power2.inOut` | Banner slides in "ENEMY TURN" / "YOUR TURN" |

### Color Palette

```javascript
const PALETTE = {
  background: "#1A1A2E",     // Deep navy
  surface: "#16213E",        // Dark blue-gray
  primary: "#E94560",        // Vibrant red (attacks, damage)
  secondary: "#0F3460",      // Deep blue (skills, block)
  accent: "#F39C12",         // Gold (powers, energy, gold)
  text: "#ECF0F1",           // Off-white
  textSecondary: "#BDC3C7",  // Light gray
  success: "#27AE60",        // Green (healing)
  danger: "#E74C3C",         // Red (damage taken)
  warning: "#F39C12",        // Amber
  rarityCommon: "#BDC3C7",   // Gray
  rarityUncommon: "#3498DB",  // Blue
  rarityRare: "#F1C40F",     // Gold
  rarityCurse: "#8E44AD",    // Purple
  cardAttack: "#C0392B",
  cardSkill: "#2980B9",
  cardPower: "#F39C12",
  cardCurse: "#8E44AD",
  cardStatus: "#7F8C8D",
  intentAttack: "#E74C3C",
  intentDefend: "#3498DB",
  intentBuff: "#27AE60",
  intentDebuff: "#9B59B6",
};
```

### Typography

- **Primary font**: "Inter" (loaded via WOFF2, fallback: system sans-serif)
- **Heading size**: 24px bold
- **Body size**: 14px regular
- **Card name**: 14px bold
- **Card description**: 11px regular
- **Damage numbers**: 28px extra-bold
- **Gold/HP numbers**: 16px bold

---

## 13. Audio System

### Audio Manager (AudioManager.js)

Uses Howler.js with two independent audio buses:

```javascript
class AudioManager {
  constructor() {
    this.musicVolume = 0.4;  // Default music volume
    this.sfxVolume = 0.7;    // Default SFX volume
    this.currentMusic = null;
    this.sfxPool = {};       // Preloaded SFX sprites
  }

  playMusic(trackId, fadeIn = 1000) { /* crossfade to new track */ }
  stopMusic(fadeOut = 500) { /* fade out current track */ }
  playSFX(sfxId) { /* play from sprite pool */ }
  setMusicVolume(vol) { /* 0.0 - 1.0 */ }
  setSFXVolume(vol) { /* 0.0 - 1.0 */ }
}
```

### Required Audio Assets

**Music tracks** (loopable, .ogg format, 128kbps):

| Track ID | Scene | Mood |
|----------|-------|------|
| `menu_theme` | Main menu | Mysterious, ambient |
| `act1_explore` | Act 1 map | Light adventure |
| `act1_combat` | Act 1 battles | Energetic, rhythmic |
| `act2_explore` | Act 2 map | Darker, foreboding |
| `act2_combat` | Act 2 battles | Intense, driving |
| `act3_explore` | Act 3 map | Ominous, epic |
| `act3_combat` | Act 3 battles | Climactic, heavy |
| `boss_combat` | Boss fights | Epic, dramatic |
| `shop` | Shop scene | Calm, whimsical |
| `rest` | Rest site | Peaceful, warm |
| `victory` | Victory screen | Triumphant, celebratory |
| `defeat` | Death screen | Somber, reflective |

**SFX** (short, .ogg format, single sprite sheet):

| SFX ID | Trigger |
|--------|---------|
| `card_draw` | Card drawn from pile |
| `card_play` | Card played (generic) |
| `card_exhaust` | Card exhausted |
| `sword_slash` | Attack card (physical) |
| `magic_blast` | Attack card (magical) |
| `shield_up` | Block gained |
| `heal` | HP restored |
| `damage_hit` | Player/enemy takes damage |
| `gold_gain` | Gold collected |
| `potion_use` | Potion consumed |
| `relic_obtain` | Relic acquired |
| `button_click` | UI button press |
| `button_hover` | UI button hover |
| `turn_end` | End turn pressed |
| `enemy_death` | Enemy HP reaches 0 |
| `level_up` | Ascension level up |
| `buff_apply` | Buff applied |
| `debuff_apply` | Debuff applied |
| `poison_tick` | Poison damage |
| `boss_roar` | Boss encounter start |
| `phase_change` | Boss phase transition |

### Placeholder Audio Generation

For initial development, generate procedural placeholder audio using the Web Audio API:

```javascript
function generatePlaceholderSFX(type) {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  switch(type) {
    case 'hit':
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      break;
    case 'card':
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      break;
    // ... more types
  }

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.2);
}
```

---

## 14. Save System

### Save Architecture

Two save tiers:

**Run Save** (in-progress run):
```json
{
  "version": "1.0.0",
  "timestamp": "2025-01-15T10:30:00Z",
  "seed": 12345678,
  "act": 2,
  "floor": 7,
  "playerHP": 54,
  "playerMaxHP": 80,
  "gold": 187,
  "deck": ["strike_001", "strike_001+", "bash_001", "..."],
  "relics": ["burning_blood", "vajra"],
  "potions": ["fire_potion", null, null],
  "map": { "...mapState" },
  "currentNode": "node_2_4",
  "ascension": 3,
  "adaptiveProfile": { "...playerProfile" },
  "combatState": null
}
```

**Meta Save** (persistent):
```json
{
  "version": "1.0.0",
  "unlocks": { "...unlockData" },
  "achievements": ["first_win", "..."],
  "settings": {
    "musicVolume": 0.4,
    "sfxVolume": 0.7,
    "screenShake": true,
    "fastMode": false,
    "confirmEndTurn": true,
    "cardHighlight": true
  },
  "stats": { "...lifetimeStats" },
  "dailyChallenge": { "...dailyData" }
}
```

### Save Triggers

- Auto-save after every node completion (combat end, event resolved, shop exit, rest complete)
- Auto-save at start of each combat turn (enable mid-combat resume)
- Meta save on every unlock/achievement
- Manual save from pause menu

### Storage Implementation

```javascript
class SaveManager {
  constructor() {
    this.runKey = "arcane_gauntlet_run";
    this.metaKey = "arcane_gauntlet_meta";
  }

  async saveRun(state) {
    const data = { ...state, timestamp: new Date().toISOString(), version: "1.0.0" };
    await localforage.setItem(this.runKey, data);
  }

  async loadRun() {
    const data = await localforage.getItem(this.runKey);
    if (data && data.version !== "1.0.0") return this.migrateRun(data);
    return data;
  }

  async clearRun() {
    await localforage.removeItem(this.runKey);
  }

  async saveMeta(meta) {
    await localforage.setItem(this.metaKey, { ...meta, version: "1.0.0" });
  }

  async loadMeta() {
    return await localforage.getItem(this.metaKey) || this.getDefaultMeta();
  }
}
```

---

## 15. Monetization Architecture

### Revenue Streams

The architecture supports multiple monetization paths without any pay-to-win mechanics. All monetizable content is **cosmetic or additive** — never power-gating.

**1. Base Game Sale (Steam)**
- Price: $9.99 USD
- Includes: 1 class, 3 acts, 75 cards, 84 relics, 20 ascension levels

**2. DLC Character Packs**
- Price: $3.99–$4.99 per pack
- Each pack includes: 1 new class, 75 new cards, 15 new relics, 1 new starter relic, unique mechanics
- Architecture: New class = new JSON files in `data/cards/`, `data/relics/`, new starter deck config
- The system loads classes dynamically from the data folder — adding a class requires zero code changes

**3. Cosmetic Card Backs**
- Price: $0.99–$1.99 each, or $4.99 for a pack of 6
- Implementation: Card back is a single sprite swapped in `CardRenderer.js`
- Stored in meta save: `selectedCardBack: "obsidian"`

**4. Content Updates (Free)**
- Regular free updates with new events, mutations, and quality-of-life improvements build community goodwill and Steam reviews

### DLC Loading System

```javascript
class DLCManager {
  constructor() {
    this.loadedPacks = [];
  }

  async loadPack(packId) {
    const manifest = await fetch(`data/dlc/${packId}/manifest.json`);
    const pack = await manifest.json();

    // Merge new cards into card pool
    CardFactory.registerCards(pack.cards);
    // Merge new relics
    RelicFactory.registerRelics(pack.relics);
    // Register new class
    if (pack.playerClass) ClassManager.registerClass(pack.playerClass);

    this.loadedPacks.push(packId);
  }
}
```

### Steam Integration Points

```javascript
// Steamworks API calls (via greenworks in Electron)
const steam = {
  setAchievement: (id) => { /* steamworks.activateAchievement(id) */ },
  setLeaderboardScore: (board, score) => { /* steamworks.setScore(board, score) */ },
  getLeaderboardScores: (board, count) => { /* steamworks.getScores(board, count) */ },
  getDLCOwnership: (appId) => { /* steamworks.isDLCInstalled(appId) */ },
  openOverlay: (url) => { /* steamworks.activateGameOverlayToWebPage(url) */ }
};
```

---

## 16. PWA & Mobile Configuration

### manifest.json

```json
{
  "name": "Arcane Gauntlet",
  "short_name": "Arcane Gauntlet",
  "description": "A roguelike deck-builder with adaptive AI enemies",
  "start_url": "/index.html",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#1A1A2E",
  "theme_color": "#E94560",
  "icons": [
    { "src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "assets/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "categories": ["games"],
  "screenshots": [
    { "src": "assets/screenshots/combat.png", "sizes": "1920x1080", "type": "image/png", "form_factor": "wide" },
    { "src": "assets/screenshots/combat-mobile.png", "sizes": "430x932", "type": "image/png", "form_factor": "narrow" }
  ]
}
```

### Service Worker (sw.js)

```javascript
const CACHE_NAME = "arcane-gauntlet-v1";
const PRECACHE_URLS = [
  "/index.html",
  "/src/main.js",
  "/assets/sprites/spritesheet.png",
  "/assets/audio/sfx-sprite.ogg",
  // ... all game assets
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
```

### iOS-Specific Meta Tags (index.html)

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Arcane Gauntlet">
<link rel="apple-touch-icon" href="assets/icons/icon-180.png">

<!-- Safe area handling for iPhone notch -->
<style>
  body {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
</style>
```

### Mobile-Specific Behaviors

```javascript
class Platform {
  static isMobile() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
  }

  static isIOS() {
    return /iPhone|iPad|iPod/.test(navigator.userAgent);
  }

  static isPWA() {
    return window.matchMedia("(display-mode: standalone)").matches ||
           window.navigator.standalone === true;
  }

  static getSafeAreaInsets() {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue("--sat") || "0"),
      bottom: parseInt(style.getPropertyValue("--sab") || "0"),
      left: parseInt(style.getPropertyValue("--sal") || "0"),
      right: parseInt(style.getPropertyValue("--sar") || "0"),
    };
  }

  static preventBounce() {
    document.body.addEventListener("touchmove", (e) => {
      if (!e.target.closest(".scrollable")) e.preventDefault();
    }, { passive: false });
  }

  static preventZoom() {
    document.addEventListener("gesturestart", (e) => e.preventDefault());
  }

  static disableContextMenu() {
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  }
}
```

---

## 17. Steam/Electron Packaging

### Electron Main Process (electron/main.js)

```javascript
const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "../assets/icons/icon-512.png"),
    title: "Arcane Gauntlet",
  });

  mainWindow.loadFile("dist/index.html");
  mainWindow.setMenu(null);

  // F11 fullscreen toggle
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F11") {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
```

### Steam Build Configuration

```json
{
  "appId": "STEAM_APP_ID_HERE",
  "depots": {
    "windows": {
      "root": "build/win",
      "files": ["**/*"]
    },
    "macos": {
      "root": "build/mac",
      "files": ["**/*"]
    },
    "linux": {
      "root": "build/linux",
      "files": ["**/*"]
    }
  },
  "launch": {
    "windows": { "executable": "Arcane Gauntlet.exe" },
    "macos": { "executable": "Arcane Gauntlet.app" },
    "linux": { "executable": "arcane-gauntlet" }
  }
}
```

### Build Scripts (package.json)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "electron": "electron electron/main.js",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron electron/main.js\"",
    "dist:win": "electron-builder --win",
    "dist:mac": "electron-builder --mac",
    "dist:linux": "electron-builder --linux",
    "dist:all": "electron-builder --win --mac --linux"
  }
}
```

---

## 18. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| FPS | 60fps stable | `requestAnimationFrame` delta tracking |
| Card animation FPS | 60fps during GSAP tweens | No dropped frames during card play |
| Initial load | <3 seconds on 4G | Lighthouse audit |
| Memory usage | <200MB | Chrome DevTools heap snapshot |
| Save/load time | <100ms | `performance.now()` measurement |
| Input latency | <50ms from tap to visual response | Input event to render delta |
| PWA install size | <30MB total | Including all cached assets |
| Canvas draw calls | <100 per frame | Custom counter in render loop |
| Audio latency | <100ms from trigger to sound | Howler.js autoplay compliance |
| Bundle size | <2MB JS (gzipped) | Vite build output |

### Performance Implementation

```javascript
class PerformanceMonitor {
  constructor() {
    this.frames = [];
    this.lastTime = performance.now();
  }

  tick() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.frames.push(delta);
    if (this.frames.length > 60) this.frames.shift();
    this.lastTime = now;
  }

  getFPS() {
    const avg = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    return Math.round(1000 / avg);
  }
}
```

### Rendering Optimizations

- **Dirty flag rendering**: Only re-render regions that changed (hand, enemy area, effects)
- **Offscreen canvas caching**: Cards, UI elements rendered once to offscreen canvas
- **Sprite batching**: All sprites packed into a single atlas
- **Object pooling**: Damage numbers, particles reused from pool (no GC pressure)
- **RAF-based game loop**: All updates tied to `requestAnimationFrame`, no `setInterval`

---

## 19. Testing Requirements

### Unit Tests (Vitest)

Every system must have unit test coverage for core logic:

```javascript
// Example: CardResolver.test.js
describe("CardResolver", () => {
  test("Strike deals base damage to target", () => {
    const state = createTestState({ playerStrength: 0 });
    const card = CardFactory.create("strike_001");
    const result = CardResolver.resolve(card, state, state.enemies[0]);
    expect(result.damage).toBe(6);
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 6);
  });

  test("Strength adds to attack damage", () => {
    const state = createTestState({ playerStrength: 3 });
    const card = CardFactory.create("strike_001");
    const result = CardResolver.resolve(card, state, state.enemies[0]);
    expect(result.damage).toBe(9);
  });

  test("Vulnerable increases damage by 50%", () => {
    const state = createTestState();
    state.enemies[0].statusEffects.push({ id: "vulnerable", stacks: 2 });
    const card = CardFactory.create("strike_001");
    const result = CardResolver.resolve(card, state, state.enemies[0]);
    expect(result.damage).toBe(9); // 6 × 1.5 = 9
  });

  test("Block absorbs damage before HP", () => {
    const state = createTestState({ playerBlock: 10 });
    applyDamageToPlayer(state, 15);
    expect(state.player.block).toBe(0);
    expect(state.player.hp).toBe(state.player.maxHp - 5);
  });
});
```

### Required Test Suites

| Suite | File | Coverage |
|-------|------|----------|
| Card resolution | `CardResolver.test.js` | All effect types, scaling, keywords |
| Deck management | `DeckManager.test.js` | Draw, discard, exhaust, shuffle, reshuffle |
| Combat flow | `CombatManager.test.js` | Turn sequencing, win/loss, status ticking |
| Enemy AI | `EnemyAI.test.js` | Pattern selection, adaptive weights, boss phases |
| Map generation | `MapGenerator.test.js` | Node placement, path validity, type distribution |
| Save system | `SaveManager.test.js` | Save/load roundtrip, migration, corruption handling |
| Relic hooks | `RelicEffects.test.js` | All hooks fire correctly, stacking behavior |
| Seeded random | `SeededRandom.test.js` | Determinism, distribution uniformity |

### E2E Tests (Playwright)

```javascript
// Example: combat.spec.js
test("complete a combat encounter", async ({ page }) => {
  await page.goto("/");
  await page.click('[data-testid="new-run"]');
  await page.click('[data-testid="map-node-combat"]');

  // Wait for combat to load
  await page.waitForSelector('[data-testid="hand-area"]');

  // Play a card
  await page.click('[data-testid="card-0"]');
  await page.click('[data-testid="enemy-0"]');

  // Verify damage was dealt
  const enemyHp = await page.textContent('[data-testid="enemy-0-hp"]');
  expect(parseInt(enemyHp)).toBeLessThan(30);
});
```

---

## 20. Build & Deployment

### GitHub Codespaces Setup

```json
// .devcontainer/devcontainer.json
{
  "name": "Arcane Gauntlet Dev",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:20",
  "forwardPorts": [5173],
  "postCreateCommand": "npm install",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ]
    }
  }
}
```

### vite.config.js

```javascript
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["howler", "gsap", "immer", "localforage"],
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
```

### Deployment Targets

| Platform | Method | URL Pattern |
|----------|--------|-------------|
| GitHub Pages | `gh-pages` branch from `/dist` | `username.github.io/arcane-gauntlet` |
| Vercel | Auto-deploy from `main` branch | `arcane-gauntlet.vercel.app` |
| Steam | Electron build via `electron-builder` | Steam App ID |
| itch.io | Upload `/dist` as HTML5 game | `username.itch.io/arcane-gauntlet` |
| iOS (PWA) | Access any web URL, "Add to Home Screen" | Any deployed URL |

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 21. Complete Data Definitions

### Starter Deck — The Wanderer

```json
[
  {
    "id": "strike_001", "name": "Strike", "type": "attack", "rarity": "starter", "energyCost": 1,
    "description": "Deal {damage} damage.",
    "effects": [{ "type": "damage", "target": "single_enemy", "value": 6 }],
    "upgraded": { "name": "Strike+", "effects": [{ "type": "damage", "target": "single_enemy", "value": 9 }] },
    "keywords": [], "tags": ["basic"], "copies_in_starter": 5
  },
  {
    "id": "defend_001", "name": "Defend", "type": "skill", "rarity": "starter", "energyCost": 1,
    "description": "Gain {block} Block.",
    "effects": [{ "type": "block", "value": 5 }],
    "upgraded": { "name": "Defend+", "effects": [{ "type": "block", "value": 8 }] },
    "keywords": [], "tags": ["basic"], "copies_in_starter": 4
  },
  {
    "id": "bash_001", "name": "Bash", "type": "attack", "rarity": "starter", "energyCost": 2,
    "description": "Deal {damage} damage. Apply {vulnerable} Vulnerable.",
    "effects": [
      { "type": "damage", "target": "single_enemy", "value": 8 },
      { "type": "apply_status", "status": "vulnerable", "value": 2, "target": "single_enemy" }
    ],
    "upgraded": {
      "name": "Bash+",
      "effects": [
        { "type": "damage", "target": "single_enemy", "value": 10 },
        { "type": "apply_status", "status": "vulnerable", "value": 3, "target": "single_enemy" }
      ]
    },
    "keywords": [], "tags": ["basic"], "copies_in_starter": 1
  }
]
```

### Sample Common Cards (20 of 75)

```json
[
  {
    "id": "anger_001", "name": "Anger", "type": "attack", "rarity": "common", "energyCost": 0,
    "description": "Deal {damage} damage. Add a copy of this card to your discard pile.",
    "effects": [
      { "type": "damage", "target": "single_enemy", "value": 6 },
      { "type": "add_to_discard", "cardId": "anger_001", "count": 1 }
    ]
  },
  {
    "id": "cleave_001", "name": "Cleave", "type": "attack", "rarity": "common", "energyCost": 1,
    "description": "Deal {damage} damage to ALL enemies.",
    "effects": [{ "type": "damage", "target": "all_enemies", "value": 8 }]
  },
  {
    "id": "iron_wave_001", "name": "Iron Wave", "type": "attack", "rarity": "common", "energyCost": 1,
    "description": "Gain {block} Block. Deal {damage} damage.",
    "effects": [
      { "type": "block", "value": 5 },
      { "type": "damage", "target": "single_enemy", "value": 5 }
    ]
  },
  {
    "id": "pommel_strike_001", "name": "Pommel Strike", "type": "attack", "rarity": "common", "energyCost": 1,
    "description": "Deal {damage} damage. Draw {draw} card.",
    "effects": [
      { "type": "damage", "target": "single_enemy", "value": 9 },
      { "type": "draw", "value": 1 }
    ]
  },
  {
    "id": "shrug_it_off_001", "name": "Shrug It Off", "type": "skill", "rarity": "common", "energyCost": 1,
    "description": "Gain {block} Block. Draw {draw} card.",
    "effects": [
      { "type": "block", "value": 8 },
      { "type": "draw", "value": 1 }
    ]
  },
  {
    "id": "true_grit_001", "name": "True Grit", "type": "skill", "rarity": "common", "energyCost": 1,
    "description": "Gain {block} Block. Exhaust a random card from your hand.",
    "effects": [
      { "type": "block", "value": 7 },
      { "type": "exhaust", "value": 1, "random": true }
    ]
  },
  {
    "id": "twin_strike_001", "name": "Twin Strike", "type": "attack", "rarity": "common", "energyCost": 1,
    "description": "Deal {damage} damage twice.",
    "effects": [{ "type": "damage", "target": "single_enemy", "value": 5, "times": 2 }]
  },
  {
    "id": "wild_strike_001", "name": "Wild Strike", "type": "attack", "rarity": "common", "energyCost": 1,
    "description": "Deal {damage} damage. Shuffle a Wound into your draw pile.",
    "effects": [
      { "type": "damage", "target": "single_enemy", "value": 12 },
      { "type": "add_to_draw", "cardId": "wound_status", "count": 1 }
    ]
  },
  {
    "id": "body_slam_001", "name": "Body Slam", "type": "attack", "rarity": "common", "energyCost": 1,
    "description": "Deal damage equal to your current Block.",
    "effects": [{ "type": "damage", "target": "single_enemy", "value": 0, "scaling": [{ "stat": "current_block", "multiplier": 1 }] }]
  },
  {
    "id": "clash_001", "name": "Clash", "type": "attack", "rarity": "common", "energyCost": 0,
    "description": "Can only be played if every card in your hand is an Attack. Deal {damage} damage.",
    "effects": [{ "type": "damage", "target": "single_enemy", "value": 14 }],
    "conditions": [{ "type": "hand_all_type", "cardType": "attack" }]
  },
  {
    "id": "headbutt_001", "name": "Headbutt", "type": "attack", "rarity": "common", "energyCost": 1,
    "description": "Deal {damage} damage. Put a card from your discard pile on top of your draw pile.",
    "effects": [
      { "type": "damage", "target": "single_enemy", "value": 9 },
      { "type": "discard_to_top", "value": 1 }
    ]
  },
  {
    "id": "heavy_blade_001", "name": "Heavy Blade", "type": "attack", "rarity": "common", "energyCost": 2,
    "description": "Deal {damage} damage. Strength affects this card {multiplier} times.",
    "effects": [{ "type": "damage", "target": "single_enemy", "value": 14, "scaling": [{ "stat": "strength", "multiplier": 3 }] }]
  },
  {
    "id": "perfected_strike_001", "name": "Perfected Strike", "type": "attack", "rarity": "common", "energyCost": 2,
    "description": "Deal {damage} damage. Deals 2 additional damage for each 'Strike' card in your deck.",
    "effects": [{ "type": "damage", "target": "single_enemy", "value": 6, "scaling": [{ "stat": "strikes_in_deck", "multiplier": 2 }] }]
  },
  {
    "id": "armaments_001", "name": "Armaments", "type": "skill", "rarity": "common", "energyCost": 1,
    "description": "Gain {block} Block. Upgrade a card in your hand for the rest of combat.",
    "effects": [
      { "type": "block", "value": 5 },
      { "type": "upgrade_in_hand", "value": 1, "random": false }
    ]
  },
  {
    "id": "flex_001", "name": "Flex", "type": "skill", "rarity": "common", "energyCost": 0,
    "description": "Gain {strength} Strength. At the end of this turn, lose {strength} Strength.",
    "effects": [
      { "type": "apply_status", "status": "strength", "value": 2, "target": "player" },
      { "type": "apply_status", "status": "strength_down_eot", "value": 2, "target": "player" }
    ]
  },
  {
    "id": "havoc_001", "name": "Havoc", "type": "skill", "rarity": "common", "energyCost": 1,
    "description": "Play the top card of your draw pile and Exhaust it.",
    "effects": [{ "type": "play_top_card", "exhaust": true }]
  },
  {
    "id": "warcry_001", "name": "Warcry", "type": "skill", "rarity": "common", "energyCost": 0,
    "description": "Draw {draw} card. Put a card from your hand on top of your draw pile. Exhaust.",
    "effects": [
      { "type": "draw", "value": 1 },
      { "type": "hand_to_top", "value": 1 }
    ],
    "keywords": ["Exhaust"]
  },
  {
    "id": "sentinel_001", "name": "Sentinel", "type": "skill", "rarity": "common", "energyCost": 1,
    "description": "Gain {block} Block. If this card is Exhausted, gain {energy} Energy.",
    "effects": [{ "type": "block", "value": 5 }],
    "onExhaust": [{ "type": "gain_energy", "value": 2 }]
  },
  {
    "id": "thunderclap_001", "name": "Thunderclap", "type": "attack", "rarity": "common", "energyCost": 1,
    "description": "Deal {damage} damage to ALL enemies. Apply {vulnerable} Vulnerable to ALL enemies.",
    "effects": [
      { "type": "damage", "target": "all_enemies", "value": 4 },
      { "type": "apply_status", "status": "vulnerable", "value": 1, "target": "all_enemies" }
    ]
  },
  {
    "id": "sword_boomerang_001", "name": "Sword Boomerang", "type": "attack", "rarity": "common", "energyCost": 1,
    "description": "Deal {damage} damage to a random enemy {times} times.",
    "effects": [{ "type": "damage", "target": "random_enemy", "value": 3, "times": 3 }]
  }
]
```

### Sample Relics (15 of 84)

```json
[
  { "id": "burning_blood", "name": "Burning Blood", "rarity": "starter", "description": "At the end of combat, heal 6 HP.", "hooks": [{ "event": "onCombatEnd", "effect": { "type": "heal", "value": 6 } }] },
  { "id": "vajra", "name": "Vajra", "rarity": "common", "description": "At the start of combat, gain 1 Strength.", "hooks": [{ "event": "onCombatStart", "effect": { "type": "apply_status", "status": "strength", "value": 1 } }] },
  { "id": "bag_of_marbles", "name": "Bag of Marbles", "rarity": "common", "description": "At the start of combat, apply 1 Vulnerable to ALL enemies.", "hooks": [{ "event": "onCombatStart", "effect": { "type": "apply_status", "status": "vulnerable", "value": 1, "target": "all_enemies" } }] },
  { "id": "anchor", "name": "Anchor", "rarity": "common", "description": "At the start of combat, gain 10 Block.", "hooks": [{ "event": "onCombatStart", "effect": { "type": "block", "value": 10 } }] },
  { "id": "lantern", "name": "Lantern", "rarity": "common", "description": "Gain 1 Energy on the first turn of each combat.", "hooks": [{ "event": "onCombatStart", "effect": { "type": "gain_energy", "value": 1 } }] },
  { "id": "oddly_smooth_stone", "name": "Oddly Smooth Stone", "rarity": "common", "description": "At the start of combat, gain 1 Dexterity.", "hooks": [{ "event": "onCombatStart", "effect": { "type": "apply_status", "status": "dexterity", "value": 1 } }] },
  { "id": "pen_nib", "name": "Pen Nib", "rarity": "common", "description": "Every 10th Attack you play deals double damage.", "hooks": [{ "event": "onAttackCardPlayed", "effect": { "type": "conditional_damage_double", "every": 10 } }], "counter": { "max": 10, "current": 0 } },
  { "id": "ornamental_fan", "name": "Ornamental Fan", "rarity": "uncommon", "description": "Every time you play 3 Attacks in a single turn, gain 4 Block.", "hooks": [{ "event": "onAttackCardPlayed", "effect": { "type": "conditional_block", "threshold": 3, "value": 4, "resetPerTurn": true } }], "counter": { "max": 3, "current": 0 } },
  { "id": "kunai", "name": "Kunai", "rarity": "uncommon", "description": "Every time you play 3 Attacks in a single turn, gain 1 Dexterity.", "hooks": [{ "event": "onAttackCardPlayed", "effect": { "type": "conditional_status", "threshold": 3, "status": "dexterity", "value": 1, "resetPerTurn": true } }], "counter": { "max": 3, "current": 0 } },
  { "id": "shuriken", "name": "Shuriken", "rarity": "uncommon", "description": "Every time you play 3 Attacks in a single turn, gain 1 Strength.", "hooks": [{ "event": "onAttackCardPlayed", "effect": { "type": "conditional_status", "threshold": 3, "status": "strength", "value": 1, "resetPerTurn": true } }], "counter": { "max": 3, "current": 0 } },
  { "id": "meat_on_the_bone", "name": "Meat on the Bone", "rarity": "uncommon", "description": "If your HP is at or below 50% at the end of combat, heal 12 HP.", "hooks": [{ "event": "onCombatEnd", "effect": { "type": "conditional_heal", "condition": "hp_below_percent_50", "value": 12 } }] },
  { "id": "thread_and_needle", "name": "Thread and Needle", "rarity": "uncommon", "description": "At the start of combat, gain 4 Plated Armor.", "hooks": [{ "event": "onCombatStart", "effect": { "type": "apply_status", "status": "plated_armor", "value": 4 } }] },
  { "id": "dead_branch", "name": "Dead Branch", "rarity": "rare", "description": "Whenever you Exhaust a card, add a random card to your hand.", "hooks": [{ "event": "onCardExhausted", "effect": { "type": "add_random_to_hand", "count": 1 } }] },
  { "id": "demon_form", "name": "Demon Form", "rarity": "rare", "description": "At the start of each turn, gain 2 Strength.", "hooks": [{ "event": "onTurnStart", "effect": { "type": "apply_status", "status": "strength", "value": 2 } }] },
  { "id": "snecko_eye", "name": "Snecko Eye", "rarity": "boss", "description": "Draw 2 additional cards each turn. All card costs are randomized (0-3).", "hooks": [{ "event": "onTurnStart", "effect": { "type": "draw", "value": 2 } }, { "event": "onCardDrawn", "effect": { "type": "randomize_cost", "min": 0, "max": 3 } }] }
]
```

### Act 1 Enemies

```json
[
  {
    "id": "jaw_worm", "name": "Jaw Worm", "act": 1, "tier": "normal",
    "hp": { "min": 40, "max": 44 },
    "behavior": {
      "type": "pattern",
      "pattern": [
        { "id": "chomp", "intent": "attack", "weight": 45, "effects": [{ "type": "damage", "value": 11 }], "adaptiveTag": "aggression" },
        { "id": "thrash", "intent": "attack", "weight": 30, "effects": [{ "type": "damage", "value": 7 }, { "type": "block", "value": 5 }], "adaptiveTag": "balanced" },
        { "id": "bellow", "intent": "buff", "weight": 25, "effects": [{ "type": "apply_status", "status": "strength", "value": 3, "target": "self" }, { "type": "block", "value": 6 }], "conditions": [{ "type": "not_consecutive", "actionId": "bellow" }], "adaptiveTag": "setup" }
      ]
    }
  },
  {
    "id": "louse_red", "name": "Red Louse", "act": 1, "tier": "normal",
    "hp": { "min": 10, "max": 15 },
    "behavior": {
      "type": "pattern",
      "pattern": [
        { "id": "bite", "intent": "attack", "weight": 75, "effects": [{ "type": "damage", "valueRange": { "min": 5, "max": 7 } }], "adaptiveTag": "aggression" },
        { "id": "grow", "intent": "buff", "weight": 25, "effects": [{ "type": "apply_status", "status": "strength", "value": 3, "target": "self" }], "conditions": [{ "type": "not_consecutive", "actionId": "grow" }], "adaptiveTag": "setup" }
      ]
    }
  },
  {
    "id": "louse_green", "name": "Green Louse", "act": 1, "tier": "normal",
    "hp": { "min": 11, "max": 17 },
    "behavior": {
      "type": "pattern",
      "pattern": [
        { "id": "bite", "intent": "attack", "weight": 75, "effects": [{ "type": "damage", "valueRange": { "min": 5, "max": 7 } }], "adaptiveTag": "aggression" },
        { "id": "spit_web", "intent": "debuff", "weight": 25, "effects": [{ "type": "apply_status", "status": "weak", "value": 2, "target": "player" }], "conditions": [{ "type": "not_consecutive", "actionId": "spit_web" }], "adaptiveTag": "debuff" }
      ]
    }
  },
  {
    "id": "cultist", "name": "Cultist", "act": 1, "tier": "normal",
    "hp": { "min": 48, "max": 54 },
    "behavior": {
      "type": "sequential",
      "firstTurn": { "id": "incantation", "intent": "buff", "effects": [{ "type": "apply_status", "status": "ritual", "value": 3, "target": "self" }] },
      "repeat": { "id": "dark_strike", "intent": "attack", "effects": [{ "type": "damage", "value": 6 }] }
    }
  },
  {
    "id": "slime_small", "name": "Spike Slime (S)", "act": 1, "tier": "normal",
    "hp": { "min": 10, "max": 14 },
    "behavior": {
      "type": "pattern",
      "pattern": [
        { "id": "tackle", "intent": "attack", "weight": 70, "effects": [{ "type": "damage", "value": 5 }], "adaptiveTag": "aggression" },
        { "id": "lick", "intent": "debuff", "weight": 30, "effects": [{ "type": "apply_status", "status": "frail", "value": 1, "target": "player" }], "adaptiveTag": "debuff" }
      ]
    }
  },
  {
    "id": "goblin_warrior", "name": "Goblin Warrior", "act": 1, "tier": "normal",
    "hp": { "min": 28, "max": 32 },
    "behavior": {
      "type": "pattern",
      "pattern": [
        { "id": "slash", "intent": "attack", "weight": 50, "effects": [{ "type": "damage", "value": 8 }], "adaptiveTag": "aggression" },
        { "id": "shield_bash", "intent": "attack", "weight": 30, "effects": [{ "type": "damage", "value": 5 }, { "type": "apply_status", "status": "vulnerable", "value": 1, "target": "player" }], "conditions": [{ "type": "not_consecutive", "actionId": "shield_bash" }], "adaptiveTag": "setup" },
        { "id": "brace", "intent": "defend", "weight": 20, "effects": [{ "type": "block", "value": 6 }], "conditions": [{ "type": "hp_below_percent", "value": 50 }], "adaptiveTag": "defense" }
      ]
    }
  },
  {
    "id": "goblin_archer", "name": "Goblin Archer", "act": 1, "tier": "normal",
    "hp": { "min": 22, "max": 26 },
    "behavior": {
      "type": "pattern",
      "pattern": [
        { "id": "snipe", "intent": "attack", "weight": 60, "effects": [{ "type": "damage", "value": 10 }], "adaptiveTag": "aggression" },
        { "id": "poison_arrow", "intent": "attack", "weight": 40, "effects": [{ "type": "damage", "value": 4 }, { "type": "apply_status", "status": "poison", "value": 3, "target": "player" }], "adaptiveTag": "debuff" }
      ]
    }
  }
]
```

### Act 1 Boss — The Warden

```json
{
  "id": "the_warden", "name": "The Warden", "act": 1, "tier": "boss",
  "hp": { "min": 210, "max": 210 },
  "phases": [
    {
      "id": "phase_1", "name": "Sentinel Stance",
      "trigger": { "type": "start" },
      "pattern": [
        { "id": "heavy_strike", "intent": "attack", "weight": 40, "effects": [{ "type": "damage", "value": 16 }] },
        { "id": "fortify", "intent": "defend", "weight": 35, "effects": [{ "type": "block", "value": 20 }] },
        { "id": "chains", "intent": "debuff", "weight": 25, "effects": [{ "type": "apply_status", "status": "entangle", "value": 1, "target": "player" }], "conditions": [{ "type": "cooldown", "turns": 3 }] }
      ],
      "onEnter": [{ "type": "apply_status", "status": "artifact", "value": 2, "target": "self" }]
    },
    {
      "id": "phase_2", "name": "Berserker Rage",
      "trigger": { "type": "hp_below_percent", "value": 50 },
      "pattern": [
        { "id": "frenzy", "intent": "attack_multi", "weight": 50, "effects": [{ "type": "damage", "value": 8, "times": 3 }] },
        { "id": "war_cry", "intent": "buff", "weight": 30, "effects": [{ "type": "apply_status", "status": "strength", "value": 3, "target": "self" }], "conditions": [{ "type": "cooldown", "turns": 2 }] },
        { "id": "slam", "intent": "attack", "weight": 20, "effects": [{ "type": "damage", "value": 28 }] }
      ],
      "onEnter": [
        { "type": "remove_block" },
        { "type": "screen_shake", "intensity": 8 },
        { "type": "dialog", "text": "ENOUGH! You face my true power!" }
      ]
    }
  ]
}
```

### Act 1 Events (3 of 10)

```json
[
  {
    "id": "mysterious_merchant",
    "name": "Mysterious Merchant",
    "description": "A hooded figure beckons from the shadows, offering a peculiar trade.",
    "art": "mysterious_merchant.png",
    "choices": [
      {
        "text": "Trade 50 gold for a random rare relic",
        "conditions": [{ "type": "gold_at_least", "value": 50 }],
        "effects": [
          { "type": "lose_gold", "value": 50 },
          { "type": "gain_relic", "rarity": "rare", "random": true }
        ],
        "resultText": "The merchant grins and hands you a glowing artifact."
      },
      {
        "text": "Trade 10% max HP for a card removal",
        "effects": [
          { "type": "lose_max_hp_percent", "value": 10 },
          { "type": "remove_card", "choice": true }
        ],
        "resultText": "Pain sears through you as the merchant extracts something... and a card dissolves."
      },
      {
        "text": "Leave",
        "effects": [],
        "resultText": "You walk away. The merchant vanishes when you look back."
      }
    ]
  },
  {
    "id": "ancient_forge",
    "name": "Ancient Forge",
    "description": "You discover a still-glowing forge deep within the tower. Its flames hunger for offerings.",
    "art": "ancient_forge.png",
    "choices": [
      {
        "text": "Offer a card to the flames (Upgrade a card)",
        "effects": [{ "type": "upgrade_card", "choice": true }],
        "resultText": "The forge burns bright and your card emerges transformed."
      },
      {
        "text": "Reach into the fire (Gain a random mutated card, take 8 damage)",
        "effects": [
          { "type": "take_damage", "value": 8 },
          { "type": "gain_card", "rarity": "uncommon", "random": true, "mutated": true }
        ],
        "resultText": "The flames bite your flesh, but you pull free a card crackling with strange energy."
      },
      {
        "text": "Stoke the forge and leave (Gain 2 Metallicize for next combat)",
        "effects": [{ "type": "apply_status_next_combat", "status": "metallicize", "value": 2 }],
        "resultText": "The forge's warmth seeps into your armor, strengthening it."
      }
    ]
  },
  {
    "id": "wounded_adventurer",
    "name": "Wounded Adventurer",
    "description": "A fellow adventurer lies bleeding against the wall, clutching a sack.",
    "art": "wounded_adventurer.png",
    "choices": [
      {
        "text": "Help them (Lose 15 HP, gain a random relic)",
        "effects": [
          { "type": "lose_hp", "value": 15 },
          { "type": "gain_relic", "rarity": "common", "random": true }
        ],
        "resultText": "\"Thank you, friend. Take this — I won't need it where I'm going.\""
      },
      {
        "text": "Rob them (Gain 75 gold, gain Curse: Guilt)",
        "effects": [
          { "type": "gain_gold", "value": 75 },
          { "type": "gain_card_specific", "cardId": "curse_guilt" }
        ],
        "resultText": "Their eyes widen in betrayal as you take their gold. Something dark enters your deck."
      },
      {
        "text": "Walk past",
        "effects": [],
        "resultText": "You avert your eyes and press onward."
      }
    ]
  }
]
```

### Mutation Definitions (5 of 20)

```json
[
  {
    "mutation_id": "blazing", "name_prefix": "Blazing",
    "description_append": " Apply {value} Burn.",
    "added_effects": [{ "type": "apply_status", "status": "burn", "value": 3, "target": "same" }],
    "energy_cost_modifier": 1, "visual_modifier": "fire_border", "rarity_upgrade": true,
    "compatible_types": ["attack"]
  },
  {
    "mutation_id": "vampiric", "name_prefix": "Vampiric",
    "description_append": " Heal {value} HP.",
    "added_effects": [{ "type": "heal", "value": 2 }],
    "energy_cost_modifier": 1, "visual_modifier": "blood_drip", "rarity_upgrade": true,
    "compatible_types": ["attack"]
  },
  {
    "mutation_id": "fortified", "name_prefix": "Fortified",
    "description_append": " Gain {value} Block.",
    "added_effects": [{ "type": "block", "value": 4 }],
    "energy_cost_modifier": 0, "visual_modifier": "stone_overlay", "rarity_upgrade": false,
    "compatible_types": ["attack", "skill"]
  },
  {
    "mutation_id": "toxic", "name_prefix": "Toxic",
    "description_append": " Apply {value} Poison.",
    "added_effects": [{ "type": "apply_status", "status": "poison", "value": 4, "target": "same" }],
    "energy_cost_modifier": 1, "visual_modifier": "green_mist", "rarity_upgrade": true,
    "compatible_types": ["attack"]
  },
  {
    "mutation_id": "echoing", "name_prefix": "Echoing",
    "description_append": " Draw {value} card.",
    "added_effects": [{ "type": "draw", "value": 1 }],
    "energy_cost_modifier": 1, "visual_modifier": "shimmer", "rarity_upgrade": false,
    "compatible_types": ["attack", "skill"]
  }
]
```

### Achievement Definitions

```json
[
  { "id": "first_blood", "name": "First Blood", "description": "Win your first combat.", "trigger": { "type": "combats_won", "value": 1 } },
  { "id": "tower_climber", "name": "Tower Climber", "description": "Complete a full run.", "trigger": { "type": "runs_won", "value": 1 } },
  { "id": "untouchable", "name": "Untouchable", "description": "Complete a combat without taking damage.", "trigger": { "type": "combat_no_damage" } },
  { "id": "minimalist", "name": "Minimalist", "description": "Win a run with 5 or fewer cards.", "trigger": { "type": "win_with_max_cards", "value": 5 } },
  { "id": "speed_runner", "name": "Speed Runner", "description": "Win a run in under 30 minutes.", "trigger": { "type": "win_under_time", "value": 1800 } },
  { "id": "hoarder", "name": "Hoarder", "description": "Have 500 gold at once.", "trigger": { "type": "gold_at_once", "value": 500 } },
  { "id": "combo_master", "name": "Combo Master", "description": "Play 10 cards in a single turn.", "trigger": { "type": "cards_in_single_turn", "value": 10 } },
  { "id": "overkill", "name": "Overkill", "description": "Deal 100+ damage in a single hit.", "trigger": { "type": "single_hit_damage", "value": 100 } },
  { "id": "collector", "name": "Collector", "description": "Collect 20 different relics across all runs.", "trigger": { "type": "unique_relics_collected", "value": 20 } },
  { "id": "ascendant", "name": "Ascendant", "description": "Reach Ascension 20.", "trigger": { "type": "ascension_reached", "value": 20 } }
]
```

---

## Asset Manifest

All sprites should be created as simple geometric/stylized pixel art or vector shapes rendered to canvas. No external image dependencies for initial build — all visuals are **procedurally generated** using canvas drawing operations until art assets are provided.

### Procedural Art System

```javascript
class ProceduralArt {
  static drawCard(ctx, cardType, rarity) {
    // Draw card frame based on type color
    // Draw rarity gem
    // Draw placeholder art (geometric pattern seeded by card ID)
  }

  static drawEnemy(ctx, enemyId) {
    // Draw enemy as geometric shape composition
    // Jaw Worm = purple semicircle with teeth triangles
    // Goblin = green trapezoid body + triangle hat
    // etc.
  }

  static drawRelic(ctx, relicId) {
    // Draw relic as small iconic shape
    // Color-coded by rarity
  }
}
```

This ensures the game is **fully playable from day one** with no missing assets. Real art can be swapped in later by replacing the procedural draw calls with sprite references.

---

## Implementation Priority

Build in this exact order to maintain a playable game at every checkpoint:

| Phase | Deliverable | Systems |
|-------|------------|---------|
| 1 | **Playable combat** | Canvas setup, card rendering, hand management, basic combat loop, Strike/Defend cards, 1 enemy |
| 2 | **Full combat** | All card effects, status effects, damage formulas, 5+ enemies, potions |
| 3 | **Map & progression** | Map generation, node navigation, rest sites, shops, events |
| 4 | **Full run** | 3 acts, boss fights, relic system, full card pool |
| 5 | **Meta-game** | Save system, unlocks, achievements, ascension, daily challenges |
| 6 | **Adaptive AI** | Player profiling, adaptive weights, boss phase intelligence |
| 7 | **Polish** | Animations, particles, audio, screen shake, card mutations |
| 8 | **Deployment** | PWA config, Electron packaging, Steam integration, CI/CD |

---

## Critical Implementation Rules

1. **ZERO PLACEHOLDERS** — Every file must contain complete, functional code. No `// TODO`, no `console.log("implement later")`, no stub functions.
2. **DATA-DRIVEN** — All game content (cards, enemies, relics, events) lives in JSON files. Adding content should never require code changes.
3. **DETERMINISTIC RUNS** — All randomness uses SeededRandom. Given the same seed, a run must produce identical results.
4. **MOBILE-FIRST TOUCH** — All interactions must work with touch input. Mouse/keyboard are enhancements, not requirements.
5. **OFFLINE-CAPABLE** — The game must work with no network connection after initial load.
6. **60 FPS** — Rendering must maintain 60fps on mid-range mobile devices (iPhone 12 / Pixel 6).
7. **SAVE INTEGRITY** — The game must be resumable from any point. Closing the browser mid-combat and reopening must restore exact state.
8. **ACCESSIBLE** — Support for colorblind mode (pattern-based indicators alongside colors), adjustable text size, and screen reader descriptions for card effects.

---

*This document is the complete specification for Arcane Gauntlet. An AI agent should be able to build the entire game from this README alone, with no additional instructions or clarification needed.*
