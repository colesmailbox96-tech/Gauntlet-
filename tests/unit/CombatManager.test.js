import { describe, it, expect } from 'vitest';
import { EventBus } from '../../src/core/EventBus.js';
import { GameState } from '../../src/core/GameState.js';
import { CombatManager } from '../../src/combat/CombatManager.js';
import { SeededRandom } from '../../src/utils/SeededRandom.js';
import { createStarterDeck } from '../../src/cards/CardFactory.js';
import { createEnemy } from '../../src/enemies/EnemyFactory.js';

describe('CombatManager', () => {
  function setup() {
    const eventBus = new EventBus();
    const gameState = new GameState();
    const rng = new SeededRandom(42);
    gameState.startRun(42);
    gameState.run.deck = createStarterDeck();
    const cm = new CombatManager(gameState, eventBus, rng);
    return { cm, gameState, eventBus, rng };
  }

  it('initializes combat with enemies and draws a hand', () => {
    const { cm, rng } = setup();
    const enemies = [createEnemy('jaw_worm', rng)];
    cm.startCombat(enemies);

    const state = cm.getState();
    expect(state.phase).toBe('PLAYER_TURN');
    expect(state.hand.length).toBe(5);
    expect(state.enemies.length).toBe(1);
    expect(state.energy).toBe(3);
  });

  it('can play a card and deduct energy', () => {
    const { cm, rng } = setup();
    const enemies = [createEnemy('jaw_worm', rng)];
    cm.startCombat(enemies);

    const hand = cm.getState().hand;
    const card = hand[0]; // first card
    const success = cm.playCard(card.instanceId, enemies[0]);
    expect(success).toBe(true);

    const stateAfter = cm.getState();
    expect(stateAfter.energy).toBe(3 - card.energyCost);
    expect(stateAfter.hand.length).toBe(4);
  });

  it('cannot play a card with insufficient energy', () => {
    const { cm, rng } = setup();
    const enemies = [createEnemy('jaw_worm', rng)];
    cm.startCombat(enemies);

    // Drain energy
    cm.energy = 0;

    const hand = cm.getState().hand;
    const strikeCard = hand.find(c => c.energyCost > 0);
    if (strikeCard) {
      const success = cm.playCard(strikeCard.instanceId, enemies[0]);
      expect(success).toBe(false);
    }
  });

  it('ends player turn and starts enemy turn', () => {
    const { cm, rng, eventBus } = setup();
    const enemies = [createEnemy('jaw_worm', rng)];
    cm.startCombat(enemies);

    let enemyTurnStarted = false;
    eventBus.on('enemyTurnStart', () => { enemyTurnStarted = true; });

    cm.endPlayerTurn();
    expect(enemyTurnStarted).toBe(true);
  });

  it('detects combat won when all enemies are dead', () => {
    const { cm, rng, eventBus } = setup();
    const enemies = [createEnemy('louse_red', rng)]; // low HP enemy
    cm.startCombat(enemies);

    let won = false;
    eventBus.on('combatWon', () => { won = true; });

    // Kill the enemy directly
    enemies[0].hp = 1;
    enemies[0].block = 0;

    // Play a strike (deals 6 damage)
    const hand = cm.getState().hand;
    const strike = hand.find(c => c.id === 'strike_001');
    if (strike) {
      cm.playCard(strike.instanceId, enemies[0]);
      expect(won).toBe(true);
    }
  });
});
