import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../../src/utils/SeededRandom.js';
import { EnemyAI } from '../../src/combat/EnemyAI.js';
import { createEnemy } from '../../src/enemies/EnemyFactory.js';

describe('EnemyAI', () => {
  it('selects an intent from the enemy pattern', () => {
    const rng = new SeededRandom(42);
    const ai = new EnemyAI(rng);
    const enemy = createEnemy('jaw_worm', rng);

    const intent = ai.selectIntent(enemy);
    expect(intent).toBeTruthy();
    expect(intent.id).toBeDefined();
    expect(intent.intent).toBeDefined();
  });

  it('respects not_consecutive condition', () => {
    const rng = new SeededRandom(42);
    const ai = new EnemyAI(rng);
    const enemy = createEnemy('jaw_worm', rng);

    // Set last action to bellow
    enemy.lastActionId = 'bellow';

    // Select next intent — bellow should not be chosen since it was just used
    const intent = ai.selectIntent(enemy);
    expect(intent.id).not.toBe('bellow');

    // Now simulate a full sequence and verify bellow never follows bellow
    enemy.lastActionId = intent.id;
    for (let i = 0; i < 20; i++) {
      const prev = enemy.lastActionId;
      const next = ai.selectIntent(enemy);
      if (prev === 'bellow') {
        expect(next.id).not.toBe('bellow');
      }
      enemy.lastActionId = next.id;
    }
  });

  it('executes an action and returns results', () => {
    const rng = new SeededRandom(42);
    const ai = new EnemyAI(rng);
    const enemy = createEnemy('jaw_worm', rng);

    const action = {
      id: 'chomp',
      intent: 'attack',
      effects: [{ type: 'damage', value: 11 }],
    };

    const results = ai.executeAction(action, enemy);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe('damage');
    expect(results[0].value).toBe(11);
    expect(enemy.lastActionId).toBe('chomp');
    expect(enemy.turnCount).toBe(1);
  });

  it('handles boss phase transitions', () => {
    const rng = new SeededRandom(42);
    const ai = new EnemyAI(rng);
    const enemy = createEnemy('the_warden', rng);

    // Phase 1 initially
    expect(enemy.currentPhase).toBe(0);

    // Set HP below 50%
    enemy.hp = enemy.maxHp * 0.3;

    const intent = ai.selectIntent(enemy);
    expect(intent).toBeTruthy();
    // Should have transitioned to phase 2
    expect(enemy.currentPhase).toBe(1);
  });
});
