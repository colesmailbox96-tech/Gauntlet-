/**
 * Selects enemy actions based on behavior patterns with adaptive weights.
 */
export class EnemyAI {
  /**
   * @param {import('../utils/SeededRandom.js').SeededRandom} rng
   */
  constructor(rng) {
    this.rng = rng;
  }

  /**
   * Select the next intent for an enemy.
   * @param {object} enemy
   * @returns {object} selected action from pattern
   */
  selectIntent(enemy) {
    const pattern = this.getActivePattern(enemy);
    if (!pattern || pattern.length === 0) return null;

    // Filter actions whose conditions are met
    const available = pattern.filter(action => this.checkConditions(action, enemy));
    if (available.length === 0) {
      // Fallback to first action
      return pattern[0];
    }

    const weights = available.map(a => a.weight);
    return this.rng.weightedChoice(available, weights);
  }

  /**
   * Get the currently active pattern for an enemy (handles phases).
   * @param {object} enemy
   * @returns {object[]|null}
   */
  getActivePattern(enemy) {
    if (enemy.phases && enemy.phases.length > 0) {
      // Check for phase transitions
      const currentIdx = enemy.currentPhase || 0;
      for (let i = enemy.phases.length - 1; i > currentIdx; i--) {
        const phase = enemy.phases[i];
        if (this.checkPhaseTrigger(phase.trigger, enemy)) {
          enemy.currentPhase = i;
          break;
        }
      }
      return enemy.phases[enemy.currentPhase]?.pattern || null;
    }

    if (enemy.behavior && enemy.behavior.pattern) {
      return enemy.behavior.pattern;
    }

    return null;
  }

  /**
   * Check if a phase trigger condition is met.
   */
  checkPhaseTrigger(trigger, enemy) {
    if (!trigger) return false;
    switch (trigger.type) {
      case 'start':
        return true;
      case 'hp_below_percent':
        return (enemy.hp / enemy.maxHp) * 100 < trigger.value;
      default:
        return false;
    }
  }

  /**
   * Check if all conditions for an action are met.
   */
  checkConditions(action, enemy) {
    if (!action.conditions || action.conditions.length === 0) return true;
    return action.conditions.every(cond => {
      switch (cond.type) {
        case 'not_consecutive':
          return enemy.lastActionId !== cond.actionId;
        case 'hp_below_percent':
          return (enemy.hp / enemy.maxHp) * 100 < cond.value;
        case 'first_turn':
          return enemy.turnCount === 0;
        default:
          return true;
      }
    });
  }

  /**
   * Execute an enemy's intent and return the results.
   * @param {object} action
   * @param {object} enemy
   * @returns {object[]}
   */
  executeAction(action, enemy) {
    const results = [];
    if (!action || !action.effects) return results;

    for (const effect of action.effects) {
      switch (effect.type) {
        case 'damage': {
          let damage = effect.value + enemy.statusEffects.get('strength');
          const times = effect.times || 1;
          results.push({ type: 'damage', value: damage, times, source: enemy.instanceId });
          break;
        }
        case 'block':
          enemy.block += effect.value;
          results.push({ type: 'block', value: effect.value, source: enemy.instanceId });
          break;
        case 'apply_status':
          if (effect.target === 'self') {
            enemy.statusEffects.apply(effect.status, effect.value);
          }
          results.push({
            type: 'apply_status',
            status: effect.status,
            value: effect.value,
            target: effect.target,
            source: enemy.instanceId,
          });
          break;
        default:
          results.push({ ...effect, source: enemy.instanceId });
      }
    }

    enemy.lastActionId = action.id;
    enemy.turnCount++;
    return results;
  }
}
