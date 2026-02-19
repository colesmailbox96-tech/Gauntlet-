import { DeckManager } from '../cards/DeckManager.js';
import { CardResolver } from './CardResolver.js';
import { StatusEffectManager } from './StatusEffectManager.js';
import { EnemyAI } from './EnemyAI.js';
import { clamp } from '../utils/MathUtils.js';

/**
 * Manages the combat turn loop: player turns, enemy turns, win/loss conditions.
 */
export class CombatManager {
  /**
   * @param {import('../core/GameState.js').GameState} gameState
   * @param {import('../core/EventBus.js').EventBus} eventBus
   * @param {import('../utils/SeededRandom.js').SeededRandom} rng
   */
  constructor(gameState, eventBus, rng) {
    this.gameState = gameState;
    this.eventBus = eventBus;
    this.rng = rng;
    this.deckManager = new DeckManager(eventBus);
    this.cardResolver = new CardResolver(eventBus);
    this.enemyAI = new EnemyAI(rng);
    this.playerStatus = new StatusEffectManager();
    this.enemies = [];
    this.phase = 'PLAYER_TURN'; // PLAYER_TURN | ENEMY_TURN | WON | LOST
    this.turnNumber = 0;
    this.energy = 0;
    this.maxEnergy = 3;
    this.block = 0;
    this.cardsPlayedThisTurn = 0;
  }

  /**
   * Initialize a new combat.
   * @param {object[]} enemies
   */
  startCombat(enemies) {
    this.enemies = enemies;
    this.phase = 'PLAYER_TURN';
    this.turnNumber = 0;
    this.energy = this.gameState.run.maxEnergy;
    this.maxEnergy = this.gameState.run.maxEnergy;
    this.block = 0;
    this.cardsPlayedThisTurn = 0;
    this.playerStatus.clear();

    this.deckManager.initCombat(this.gameState.run.deck);

    // Select initial intents for all enemies
    for (const enemy of this.enemies) {
      enemy.currentIntent = this.enemyAI.selectIntent(enemy);
    }

    this.startPlayerTurn();
    this.eventBus.emit('combatStarted', { enemies: this.enemies });
  }

  /** Begin the player's turn. */
  startPlayerTurn() {
    this.turnNumber++;
    this.phase = 'PLAYER_TURN';

    // Reset block (unless barricade)
    if (!this.playerStatus.has('barricade')) {
      this.block = 0;
    }

    this.energy = this.maxEnergy;
    this.cardsPlayedThisTurn = 0;

    // Process start-of-turn status effects
    const turnEffects = this.playerStatus.getStartOfTurnEffects();
    for (const effect of turnEffects) {
      this.applyPlayerEffect(effect);
    }

    // Draw cards
    this.deckManager.draw(this.gameState.run.cardsPerDraw);

    this.eventBus.emit('playerTurnStart', {
      turn: this.turnNumber,
      energy: this.energy,
      hand: this.deckManager.hand,
    });
  }

  /**
   * Play a card from the hand.
   * @param {string} instanceId
   * @param {object|null} targetEnemy
   * @returns {boolean} true if card was played
   */
  playCard(instanceId, targetEnemy) {
    if (this.phase !== 'PLAYER_TURN') return false;

    const cardIndex = this.deckManager.hand.findIndex(c => c.instanceId === instanceId);
    if (cardIndex === -1) return false;

    const card = this.deckManager.hand[cardIndex];
    const combatState = { energy: this.energy, block: this.block };

    if (!this.cardResolver.canPlay(card, combatState)) return false;

    // Determine target for single_enemy effects
    let target = targetEnemy;
    if (!target && this.enemies.length > 0) {
      const livingEnemies = this.enemies.filter(e => e.hp > 0);
      if (livingEnemies.length === 1) target = livingEnemies[0];
    }

    // Resolve card effects
    const { energyCost, results } = this.cardResolver.resolve(card, combatState, target, this.playerStatus);

    // Deduct energy
    this.energy -= energyCost;
    this.cardsPlayedThisTurn++;

    // Apply results
    for (const result of results) {
      this.applyResult(result, target);
    }

    // Move card to appropriate pile
    if (card.keywords && card.keywords.includes('Exhaust')) {
      this.deckManager.exhaustFromHand(instanceId);
    } else if (card.type === 'power') {
      // Powers are removed from play
      const idx = this.deckManager.hand.findIndex(c => c.instanceId === instanceId);
      if (idx !== -1) this.deckManager.hand.splice(idx, 1);
    } else {
      this.deckManager.discardFromHand(instanceId);
    }

    // Check for enemy deaths
    this.checkEnemyDeaths();

    // Check win condition
    if (this.enemies.every(e => e.hp <= 0)) {
      this.phase = 'WON';
      this.eventBus.emit('combatWon', { turn: this.turnNumber });
      return true;
    }

    this.eventBus.emit('cardPlayComplete', {
      card,
      results,
      energy: this.energy,
      hand: this.deckManager.hand,
    });

    return true;
  }

  /** End the player's turn and start the enemy turn. */
  endPlayerTurn() {
    if (this.phase !== 'PLAYER_TURN') return;

    // Process end-of-turn status effects
    const endEffects = this.playerStatus.getEndOfTurnEffects();
    for (const effect of endEffects) {
      this.applyPlayerEffect(effect);
    }

    // Tick down player status effect durations
    this.playerStatus.tickTurnEnd();

    // Discard hand
    this.deckManager.discardHand();

    this.eventBus.emit('playerTurnEnd', { turn: this.turnNumber });

    // Start enemy turn
    this.executeEnemyTurn();
  }

  /** Execute all enemy actions. */
  executeEnemyTurn() {
    this.phase = 'ENEMY_TURN';
    this.eventBus.emit('enemyTurnStart', { turn: this.turnNumber });

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;

      // Reset enemy block
      enemy.block = 0;

      // Process enemy start-of-turn status effects
      const enemyTurnEffects = enemy.statusEffects.getStartOfTurnEffects();
      for (const effect of enemyTurnEffects) {
        if (effect.type === 'damage') {
          enemy.hp = Math.max(0, enemy.hp - effect.value);
        } else if (effect.type === 'apply_status') {
          enemy.statusEffects.apply(effect.status, effect.value);
        }
      }

      if (enemy.hp <= 0) {
        this.checkEnemyDeaths();
        continue;
      }

      // Execute the enemy's current intent
      const action = enemy.currentIntent;
      if (action) {
        const results = this.enemyAI.executeAction(action, enemy);
        this.applyEnemyResults(results, enemy);
      }

      // Tick enemy status effects
      enemy.statusEffects.tickTurnEnd();

      // Select next intent
      enemy.currentIntent = this.enemyAI.selectIntent(enemy);
    }

    this.eventBus.emit('enemyTurnEnd', { turn: this.turnNumber });

    // Check if player is dead
    if (this.gameState.run.playerHP <= 0) {
      this.phase = 'LOST';
      this.eventBus.emit('combatLost', { turn: this.turnNumber });
      return;
    }

    // Check win condition (enemies may have died from poison)
    if (this.enemies.every(e => e.hp <= 0)) {
      this.phase = 'WON';
      this.eventBus.emit('combatWon', { turn: this.turnNumber });
      return;
    }

    // Start next player turn
    this.startPlayerTurn();
  }

  /**
   * Apply a card result.
   */
  applyResult(result, target) {
    switch (result.type) {
      case 'block':
        this.block += result.value;
        this.eventBus.emit('blockGained', { value: result.value, total: this.block });
        break;
      case 'apply_status':
        if (result.target === 'player') {
          this.playerStatus.apply(result.status, result.value);
        } else if (result.target === 'single_enemy' && target) {
          target.statusEffects.apply(result.status, result.value);
        } else if (result.target === 'all_enemies') {
          for (const e of this.enemies) {
            if (e.hp > 0) e.statusEffects.apply(result.status, result.value);
          }
        }
        break;
      case 'draw':
        this.deckManager.draw(result.value);
        break;
      case 'gain_energy':
        this.energy += result.value;
        break;
      case 'heal':
        this.gameState.run.playerHP = Math.min(
          this.gameState.run.playerMaxHP,
          this.gameState.run.playerHP + result.value
        );
        break;
      case 'lose_hp':
        this.gameState.run.playerHP = Math.max(0, this.gameState.run.playerHP - result.value);
        break;
      case 'damage':
        // Damage was already applied in the resolver for single targets.
        // For all_enemies, apply to each.
        if (result.target === 'all_enemies') {
          for (const e of this.enemies) {
            if (e.hp > 0) {
              let dmg = result.hits[0]?.damage || 0;
              if (e.statusEffects.has('vulnerable')) {
                dmg = Math.floor(dmg * 1.5);
              }
              const blocked = Math.min(e.block, dmg);
              e.block -= blocked;
              e.hp = Math.max(0, e.hp - (dmg - blocked));
            }
          }
        }
        break;
    }
  }

  /**
   * Apply enemy action results to the player.
   */
  applyEnemyResults(results, enemy) {
    for (const result of results) {
      switch (result.type) {
        case 'damage': {
          const times = result.times || 1;
          for (let i = 0; i < times; i++) {
            let dmg = result.value;
            // Apply weak on enemy
            if (enemy.statusEffects.has('weak')) {
              dmg = Math.floor(dmg * 0.75);
            }
            // Apply vulnerable on player
            if (this.playerStatus.has('vulnerable')) {
              dmg = Math.floor(dmg * 1.5);
            }
            const blocked = Math.min(this.block, dmg);
            this.block -= blocked;
            const hpDamage = dmg - blocked;
            this.gameState.run.playerHP = Math.max(0, this.gameState.run.playerHP - hpDamage);

            this.eventBus.emit('playerDamaged', {
              damage: dmg,
              blocked,
              hpDamage,
              remainingHp: this.gameState.run.playerHP,
            });
          }
          break;
        }
        case 'apply_status':
          if (result.target === 'player') {
            // Check artifact
            if (this.isDebuff(result.status) && this.playerStatus.has('artifact')) {
              const art = this.playerStatus.effects.get('artifact');
              if (art) {
                art.value -= 1;
                if (art.value <= 0) this.playerStatus.remove('artifact');
              }
              break; // negated
            }
            this.playerStatus.apply(result.status, result.value);
          }
          break;
        case 'block':
          // Enemy block is already applied in executeAction
          break;
      }
    }
  }

  /** Apply a self-effect on the player (from status ticks). */
  applyPlayerEffect(effect) {
    switch (effect.type) {
      case 'damage':
        this.gameState.run.playerHP = Math.max(0, this.gameState.run.playerHP - effect.value);
        break;
      case 'heal':
        this.gameState.run.playerHP = Math.min(
          this.gameState.run.playerMaxHP,
          this.gameState.run.playerHP + effect.value
        );
        break;
      case 'block':
        this.block += effect.value;
        break;
      case 'apply_status':
        this.playerStatus.apply(effect.status, effect.value);
        break;
    }
  }

  /** Check and mark dead enemies. */
  checkEnemyDeaths() {
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 && !enemy.dead) {
        enemy.dead = true;
        this.eventBus.emit('enemyDied', { enemy });
      }
    }
  }

  /** @param {string} status */
  isDebuff(status) {
    return ['vulnerable', 'weak', 'frail', 'poison', 'burn', 'draw_reduction', 'entangle', 'confused'].includes(status);
  }

  /** Get the current combat state for rendering. */
  getState() {
    return {
      phase: this.phase,
      turnNumber: this.turnNumber,
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      block: this.block,
      hand: this.deckManager.hand,
      drawPileSize: this.deckManager.drawPile.length,
      discardPileSize: this.deckManager.discardPile.length,
      exhaustPileSize: this.deckManager.exhaustPile.length,
      enemies: this.enemies,
      playerStatus: this.playerStatus.getAll(),
      playerHP: this.gameState.run.playerHP,
      playerMaxHP: this.gameState.run.playerMaxHP,
    };
  }
}
