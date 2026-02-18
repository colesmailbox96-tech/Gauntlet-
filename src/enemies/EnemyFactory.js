import act1Enemies from '../../data/enemies/act1.json';
import bossEnemies from '../../data/enemies/bosses.json';
import { StatusEffectManager } from '../combat/StatusEffectManager.js';

const ENEMY_DEFS = new Map();

function registerEnemies(enemies) {
  for (const e of enemies) {
    ENEMY_DEFS.set(e.id, e);
  }
}

registerEnemies(act1Enemies);
registerEnemies(bossEnemies);

/**
 * Create an enemy instance from a definition.
 * @param {string} id
 * @param {import('../utils/SeededRandom.js').SeededRandom} rng
 * @returns {object|null}
 */
export function createEnemy(id, rng) {
  const def = ENEMY_DEFS.get(id);
  if (!def) return null;

  const hp = rng.nextInt(def.hp.min, def.hp.max);
  return {
    instanceId: `${id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    id: def.id,
    name: def.name,
    hp,
    maxHp: hp,
    block: 0,
    tier: def.tier,
    behavior: def.behavior || null,
    phases: def.phases || null,
    currentPhase: def.phases ? 0 : -1,
    statusEffects: new StatusEffectManager(),
    lastActionId: null,
    currentIntent: null,
    turnCount: 0,
  };
}

/**
 * Get a random encounter formation for an act.
 * @param {number} act
 * @param {import('../utils/SeededRandom.js').SeededRandom} rng
 * @returns {string[]}
 */
export function getRandomFormation(act, rng) {
  const formations = [
    { enemies: ['jaw_worm'], weight: 20 },
    { enemies: ['goblin_warrior'], weight: 15 },
    { enemies: ['cultist'], weight: 15 },
    { enemies: ['louse_red', 'louse_red'], weight: 25 },
    { enemies: ['goblin_warrior', 'louse_red'], weight: 25 },
  ];
  const items = formations.map(f => f.enemies);
  const weights = formations.map(f => f.weight);
  return rng.weightedChoice(items, weights);
}

export { ENEMY_DEFS, registerEnemies };
