/**
 * Manages status effects (buffs and debuffs) for any entity.
 */
export class StatusEffectManager {
  constructor() {
    /** @type {Map<string, {value: number, permanent: boolean}>} */
    this.effects = new Map();
  }

  /**
   * Apply or stack a status effect.
   * @param {string} status
   * @param {number} value
   */
  apply(status, value) {
    const existing = this.effects.get(status);
    if (existing) {
      existing.value += value;
    } else {
      this.effects.set(status, {
        value,
        permanent: this.isPermanent(status),
      });
    }
  }

  /**
   * Get the current value of a status effect.
   * @param {string} status
   * @returns {number}
   */
  get(status) {
    const e = this.effects.get(status);
    return e ? e.value : 0;
  }

  /**
   * Check if a status effect is active.
   * @param {string} status
   * @returns {boolean}
   */
  has(status) {
    return this.get(status) > 0;
  }

  /**
   * Remove a status entirely.
   * @param {string} status
   */
  remove(status) {
    this.effects.delete(status);
  }

  /** Tick turn-based status effects (decrement non-permanent ones). */
  tickTurnEnd() {
    for (const [key, effect] of this.effects) {
      if (!effect.permanent && effect.value > 0) {
        effect.value -= 1;
        if (effect.value <= 0) {
          this.effects.delete(key);
        }
      }
    }
  }

  /** Process start-of-turn effects and return actions to apply. */
  getStartOfTurnEffects() {
    const actions = [];
    const ritual = this.get('ritual');
    if (ritual > 0) {
      actions.push({ type: 'apply_status', status: 'strength', value: ritual });
    }
    const poison = this.get('poison');
    if (poison > 0) {
      actions.push({ type: 'damage', value: poison });
      const e = this.effects.get('poison');
      if (e) {
        e.value -= 1;
        if (e.value <= 0) this.effects.delete('poison');
      }
    }
    return actions;
  }

  /** Process end-of-turn effects. */
  getEndOfTurnEffects() {
    const actions = [];
    const regen = this.get('regen');
    if (regen > 0) {
      actions.push({ type: 'heal', value: regen });
      const e = this.effects.get('regen');
      if (e) {
        e.value -= 1;
        if (e.value <= 0) this.effects.delete('regen');
      }
    }
    const metallicize = this.get('metallicize');
    if (metallicize > 0) {
      actions.push({ type: 'block', value: metallicize });
    }
    const burn = this.get('burn');
    if (burn > 0) {
      actions.push({ type: 'damage', value: burn });
      const e = this.effects.get('burn');
      if (e) {
        e.value -= 1;
        if (e.value <= 0) this.effects.delete('burn');
      }
    }
    return actions;
  }

  /** @returns {[string, number][]} */
  getAll() {
    return [...this.effects.entries()].map(([k, v]) => [k, v.value]);
  }

  /** Check if a status type is permanent (stacks don't decay each turn). */
  isPermanent(status) {
    const permanentStatuses = ['strength', 'dexterity', 'thorns', 'ritual', 'metallicize', 'barricade', 'plated_armor', 'artifact'];
    return permanentStatuses.includes(status);
  }

  clear() {
    this.effects.clear();
  }
}
