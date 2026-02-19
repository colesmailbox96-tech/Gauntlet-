import { clamp } from '../utils/MathUtils.js';

/**
 * Resolves card effects during combat.
 */
export class CardResolver {
  /**
   * @param {import('../core/EventBus.js').EventBus} eventBus
   */
  constructor(eventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Check if a card can be played.
   * @param {object} card
   * @param {object} combatState
   * @returns {boolean}
   */
  canPlay(card, combatState) {
    if (card.keywords && card.keywords.includes('Unplayable')) return false;
    if (card.energyCost > combatState.energy) return false;
    return true;
  }

  /**
   * Resolve a card's effects.
   * @param {object} card
   * @param {object} combatState
   * @param {object|null} target - target enemy
   * @param {object} playerStatus - StatusEffectManager
   * @returns {{ energyCost: number, results: object[] }}
   */
  resolve(card, combatState, target, playerStatus) {
    const results = [];
    const energyCost = card.energyCost;

    for (const effect of card.effects) {
      const result = this.resolveEffect(effect, combatState, target, playerStatus);
      results.push(result);
    }

    this.eventBus.emit('cardPlayed', { card, results });
    return { energyCost, results };
  }

  /**
   * Resolve a single effect.
   * @param {object} effect
   * @param {object} combatState
   * @param {object|null} target
   * @param {object} playerStatus
   * @returns {object}
   */
  resolveEffect(effect, combatState, target, playerStatus) {
    switch (effect.type) {
      case 'damage':
        return this.resolveDamage(effect, combatState, target, playerStatus);
      case 'block':
        return this.resolveBlock(effect, combatState, playerStatus);
      case 'apply_status':
        return this.resolveApplyStatus(effect, target);
      case 'draw':
        return { type: 'draw', value: effect.value };
      case 'gain_energy':
        return { type: 'gain_energy', value: effect.value };
      case 'heal':
        return { type: 'heal', value: effect.value };
      case 'lose_hp':
        return { type: 'lose_hp', value: effect.value };
      default:
        return { type: effect.type, ...effect };
    }
  }

  /**
   * Calculate and return damage result.
   */
  resolveDamage(effect, combatState, target, playerStatus) {
    let baseDamage = effect.value || 0;

    // Apply scaling
    if (effect.scaling) {
      for (const scale of effect.scaling) {
        let statValue = 0;
        if (scale.stat === 'block') statValue = combatState.block || 0;
        if (scale.stat === 'strength') statValue = playerStatus.get('strength');
        baseDamage += statValue * scale.multiplier;
      }
    }

    // Add strength
    baseDamage += playerStatus.get('strength');

    // Apply weak
    if (playerStatus.has('weak')) {
      baseDamage = Math.floor(baseDamage * 0.75);
    }

    const times = effect.times || 1;
    const hits = [];

    for (let i = 0; i < times; i++) {
      let damage = baseDamage;
      // Apply vulnerable on target
      if (target && target.statusEffects && target.statusEffects.has('vulnerable')) {
        damage = Math.floor(damage * 1.5);
      }
      // Apply against target's block
      if (target) {
        const blocked = Math.min(target.block || 0, damage);
        target.block = (target.block || 0) - blocked;
        const hpDamage = damage - blocked;
        target.hp = Math.max(0, target.hp - hpDamage);
        hits.push({ damage, blocked, hpDamage, targetHp: target.hp });
      } else {
        hits.push({ damage, blocked: 0, hpDamage: damage });
      }
    }

    return {
      type: 'damage',
      target: effect.target,
      hits,
      totalDamage: hits.reduce((s, h) => s + h.hpDamage, 0),
    };
  }

  /**
   * Calculate and return block result.
   */
  resolveBlock(effect, combatState, playerStatus) {
    let block = effect.value || 0;
    block += playerStatus.get('dexterity');
    if (playerStatus.has('frail')) {
      block = Math.floor(block * 0.75);
    }
    return { type: 'block', value: Math.max(0, block) };
  }

  /**
   * Return status application result.
   */
  resolveApplyStatus(effect, target) {
    return {
      type: 'apply_status',
      status: effect.status,
      value: effect.value,
      target: effect.target,
    };
  }
}
