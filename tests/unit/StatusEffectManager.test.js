import { describe, it, expect } from 'vitest';
import { StatusEffectManager } from '../../src/combat/StatusEffectManager.js';

describe('StatusEffectManager', () => {
  it('applies and retrieves status effects', () => {
    const sem = new StatusEffectManager();
    sem.apply('strength', 2);
    expect(sem.get('strength')).toBe(2);
    expect(sem.has('strength')).toBe(true);
  });

  it('stacks status effects', () => {
    const sem = new StatusEffectManager();
    sem.apply('strength', 2);
    sem.apply('strength', 3);
    expect(sem.get('strength')).toBe(5);
  });

  it('ticks down non-permanent effects', () => {
    const sem = new StatusEffectManager();
    sem.apply('vulnerable', 2);
    expect(sem.get('vulnerable')).toBe(2);

    sem.tickTurnEnd();
    expect(sem.get('vulnerable')).toBe(1);

    sem.tickTurnEnd();
    expect(sem.has('vulnerable')).toBe(false);
  });

  it('does not tick permanent effects', () => {
    const sem = new StatusEffectManager();
    sem.apply('strength', 3);
    sem.tickTurnEnd();
    expect(sem.get('strength')).toBe(3);
  });

  it('processes ritual at start of turn', () => {
    const sem = new StatusEffectManager();
    sem.apply('ritual', 2);
    const effects = sem.getStartOfTurnEffects();
    expect(effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'apply_status', status: 'strength', value: 2 }),
      ])
    );
  });

  it('processes poison at start of turn and decrements', () => {
    const sem = new StatusEffectManager();
    sem.apply('poison', 3);
    const effects = sem.getStartOfTurnEffects();
    expect(effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'damage', value: 3 }),
      ])
    );
    expect(sem.get('poison')).toBe(2);
  });

  it('processes regen at end of turn', () => {
    const sem = new StatusEffectManager();
    sem.apply('regen', 4);
    const effects = sem.getEndOfTurnEffects();
    expect(effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'heal', value: 4 }),
      ])
    );
    expect(sem.get('regen')).toBe(3);
  });

  it('getAll returns all active effects', () => {
    const sem = new StatusEffectManager();
    sem.apply('strength', 2);
    sem.apply('vulnerable', 1);
    const all = sem.getAll();
    expect(all.length).toBe(2);
  });

  it('clear removes all effects', () => {
    const sem = new StatusEffectManager();
    sem.apply('strength', 5);
    sem.apply('poison', 3);
    sem.clear();
    expect(sem.getAll().length).toBe(0);
  });
});
