import { PALETTE } from '../config.js';
import { Button } from '../ui/Button.js';
import { HealthBar } from '../ui/HealthBar.js';
import { CardRenderer, CARD_WIDTH, CARD_HEIGHT } from '../ui/CardRenderer.js';
import { HandLayout } from '../ui/HandLayout.js';
import { CombatManager } from '../combat/CombatManager.js';
import { createEnemy, getRandomFormation } from '../enemies/EnemyFactory.js';
import { createStarterDeck, createCard } from '../cards/CardFactory.js';

/**
 * Combat scene — card play, enemy turns, full battle loop.
 */
export class CombatScene {
  /**
   * @param {import('../core/GameState.js').GameState} gameState
   * @param {import('../core/EventBus.js').EventBus} eventBus
   * @param {import('../core/SceneManager.js').SceneManager} sceneManager
   * @param {import('../utils/SeededRandom.js').SeededRandom} rng
   */
  constructor(gameState, eventBus, sceneManager, rng) {
    this.gameState = gameState;
    this.eventBus = eventBus;
    this.sceneManager = sceneManager;
    this.rng = rng;
    this.combatManager = null;
    this.endTurnButton = null;
    this.selectedCardIndex = -1;
    this.hoveredCardIndex = -1;
    this.cardPositions = [];
    this.playerHealthBar = new HealthBar(0, 0, 200, 20);
    this.damageNumbers = [];
    this.enemyTurnTimer = 0;
    this.showingEnemyTurn = false;
  }

  load(data) {
    if (!this.gameState.run) return;

    // Set up deck if not already done
    if (this.gameState.run.deck.length === 0) {
      this.gameState.run.deck = createStarterDeck();
    }

    this.combatManager = new CombatManager(this.gameState, this.eventBus, this.rng);

    // Create enemies based on node type
    const nodeType = data?.nodeType || 'combat';
    const formation = getRandomFormation(this.gameState.run.act, this.rng);
    const enemies = formation.map(id => createEnemy(id, this.rng)).filter(Boolean);

    this.combatManager.startCombat(enemies);

    this.endTurnButton = new Button(0, 0, 140, 44, 'End Turn', {
      color: PALETTE.primary,
      fontSize: 16,
      onClick: () => this.onEndTurn(),
    });

    this.selectedCardIndex = -1;
    this.hoveredCardIndex = -1;
    this.damageNumbers = [];

    // Listen for events
    this.eventBus.on('combatWon', () => this.onCombatWon());
    this.eventBus.on('combatLost', () => this.onCombatLost());
    this.eventBus.on('playerDamaged', (data) => this.onPlayerDamaged(data));
  }

  onEndTurn() {
    if (this.combatManager.phase !== 'PLAYER_TURN') return;
    this.selectedCardIndex = -1;
    this.combatManager.endPlayerTurn();
  }

  onCombatWon() {
    // Small delay then go to reward
    setTimeout(() => {
      this.sceneManager.switchTo('REWARD');
    }, 800);
  }

  onCombatLost() {
    setTimeout(() => {
      this.sceneManager.switchTo('DEATH');
    }, 800);
  }

  onPlayerDamaged(data) {
    if (data.hpDamage > 0) {
      this.damageNumbers.push({
        text: `-${data.hpDamage}`,
        x: 120 + Math.random() * 40,
        y: 120,
        alpha: 1,
        color: PALETTE.danger,
      });
    }
  }

  update(dt) {
    // Animate damage numbers
    this.damageNumbers = this.damageNumbers.filter(d => {
      d.y -= 40 * dt;
      d.alpha -= dt;
      return d.alpha > 0;
    });
  }

  render(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const state = this.combatManager?.getState();
    if (!state) return;

    // Background
    ctx.fillStyle = PALETTE.background;
    ctx.fillRect(0, 0, w, h);

    // Top bar — player stats
    this.renderTopBar(ctx, w, state);

    // Enemy area
    this.renderEnemies(ctx, w, h, state);

    // Middle area — energy, draw/discard piles
    this.renderMiddleArea(ctx, w, h, state);

    // Hand area
    this.renderHand(ctx, w, h, state);

    // Damage numbers
    this.renderDamageNumbers(ctx);

    // Phase overlay
    if (state.phase === 'WON') {
      this.renderOverlay(ctx, w, h, 'VICTORY!', PALETTE.success);
    } else if (state.phase === 'LOST') {
      this.renderOverlay(ctx, w, h, 'DEFEATED', PALETTE.danger);
    } else if (state.phase === 'ENEMY_TURN') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = PALETTE.warning;
      ctx.font = '700 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Enemy Turn...', w / 2, h / 2);
    }
  }

  renderTopBar(ctx, w, state) {
    // Background bar
    ctx.fillStyle = PALETTE.surface;
    ctx.fillRect(0, 0, w, 50);

    // Player HP
    this.playerHealthBar.x = 16;
    this.playerHealthBar.y = 15;
    this.playerHealthBar.width = 200;
    this.playerHealthBar.render(ctx, state.playerHP, state.playerMaxHP, state.block);

    // Gold
    ctx.fillStyle = PALETTE.accent;
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`💰 ${this.gameState.run.gold}`, 250, 30);

    // Deck info
    ctx.fillStyle = PALETTE.textSecondary;
    ctx.font = '400 14px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Turn ${state.turnNumber}`, w - 20, 30);

    // Status effects
    let statusX = 340;
    for (const [name, value] of state.playerStatus) {
      ctx.fillStyle = this.getStatusColor(name);
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${name}: ${value}`, statusX, 30);
      statusX += ctx.measureText(`${name}: ${value}`).width + 12;
    }
  }

  renderEnemies(ctx, w, h, state) {
    const enemies = state.enemies.filter(e => e.hp > 0);
    const spacing = Math.min(200, (w - 100) / (enemies.length || 1));
    const startX = (w - spacing * (enemies.length - 1)) / 2;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const ex = startX + i * spacing;
      const ey = 130;

      // Enemy body (placeholder rectangle)
      ctx.fillStyle = enemy.tier === 'boss' ? '#8B0000' : PALETTE.secondary;
      ctx.beginPath();
      ctx.roundRect(ex - 40, ey - 30, 80, 60, 8);
      ctx.fill();
      ctx.strokeStyle = enemy.tier === 'boss' ? '#FF4444' : '#666';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Enemy name
      ctx.fillStyle = PALETTE.text;
      ctx.font = '600 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(enemy.name, ex, ey - 40);

      // Enemy HP bar
      const hpBarW = 80;
      const hpPct = enemy.hp / enemy.maxHp;
      ctx.fillStyle = '#333';
      ctx.fillRect(ex - hpBarW / 2, ey + 38, hpBarW, 10);
      ctx.fillStyle = hpPct > 0.5 ? PALETTE.danger : '#FF6B6B';
      ctx.fillRect(ex - hpBarW / 2, ey + 38, hpBarW * hpPct, 10);
      ctx.fillStyle = PALETTE.text;
      ctx.font = '600 10px system-ui, sans-serif';
      ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, ex, ey + 45);

      // Block indicator
      if (enemy.block > 0) {
        ctx.fillStyle = PALETTE.intentDefend;
        ctx.beginPath();
        ctx.arc(ex + 50, ey - 10, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.text;
        ctx.font = '700 11px system-ui, sans-serif';
        ctx.fillText(`${enemy.block}`, ex + 50, ey - 10);
      }

      // Intent display
      if (enemy.currentIntent) {
        const intent = enemy.currentIntent;
        const intentColor = this.getIntentColor(intent.intent);
        ctx.fillStyle = intentColor;
        ctx.font = '600 13px system-ui, sans-serif';
        ctx.fillText(this.getIntentText(intent), ex, ey - 55);
      }

      // Enemy status effects
      const statuses = enemy.statusEffects.getAll();
      if (statuses.length > 0) {
        ctx.font = '500 10px system-ui, sans-serif';
        let sx = ex - 30;
        for (const [name, value] of statuses) {
          ctx.fillStyle = this.getStatusColor(name);
          ctx.fillText(`${name.slice(0, 3)}:${value}`, sx, ey + 60);
          sx += 40;
        }
      }
    }
  }

  renderMiddleArea(ctx, w, h, state) {
    const midY = h * 0.55;

    // Energy orb
    const energyX = 60;
    ctx.beginPath();
    ctx.arc(energyX, midY, 28, 0, Math.PI * 2);
    ctx.fillStyle = state.energy > 0 ? PALETTE.accent : '#555';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.energy}/${state.maxEnergy}`, energyX, midY);

    // Draw pile
    ctx.fillStyle = PALETTE.surface;
    ctx.beginPath();
    ctx.roundRect(20, midY + 40, 70, 30, 6);
    ctx.fill();
    ctx.fillStyle = PALETTE.textSecondary;
    ctx.font = '500 12px system-ui, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`Draw: ${state.drawPileSize}`, 55, midY + 60);

    // Discard pile
    ctx.fillStyle = PALETTE.surface;
    ctx.beginPath();
    ctx.roundRect(w - 90, midY + 40, 70, 30, 6);
    ctx.fill();
    ctx.fillStyle = PALETTE.textSecondary;
    ctx.fillText(`Disc: ${state.discardPileSize}`, w - 55, midY + 60);

    // End turn button
    if (state.phase === 'PLAYER_TURN') {
      this.endTurnButton.x = w - 170;
      this.endTurnButton.y = midY - 22;
      this.endTurnButton.disabled = false;
      this.endTurnButton.render(ctx);
    }
  }

  renderHand(ctx, w, h, state) {
    if (state.phase !== 'PLAYER_TURN' && state.phase !== 'WON' && state.phase !== 'LOST') return;

    const hand = state.hand;
    this.cardPositions = HandLayout.getCardPositions(hand.length, w, h);

    for (let i = 0; i < hand.length; i++) {
      const card = hand[i];
      const pos = this.cardPositions[i];
      const isSelected = i === this.selectedCardIndex;
      const isHovered = i === this.hoveredCardIndex;
      const isPlayable = state.phase === 'PLAYER_TURN' && card.energyCost <= state.energy;

      CardRenderer.render(ctx, card, pos.x, pos.y, {
        selected: isSelected,
        hovered: isHovered,
        playable: isPlayable,
      });
    }
  }

  renderDamageNumbers(ctx) {
    for (const d of this.damageNumbers) {
      ctx.globalAlpha = d.alpha;
      ctx.fillStyle = d.color;
      ctx.font = '700 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.text, d.x, d.y);
    }
    ctx.globalAlpha = 1;
  }

  renderOverlay(ctx, w, h, text, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.font = '700 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
  }

  handleInput(event) {
    const state = this.combatManager?.getState();
    if (!state) return;

    if (event.type === 'click' && state.phase === 'PLAYER_TURN') {
      // Check end turn button
      if (this.endTurnButton && this.endTurnButton.containsPoint(event.x, event.y)) {
        this.onEndTurn();
        return;
      }

      // Check card click
      const cardIndex = HandLayout.getCardAtPoint(this.cardPositions, event.x, event.y);
      if (cardIndex >= 0) {
        const card = state.hand[cardIndex];
        if (this.selectedCardIndex === cardIndex) {
          // Deselect
          this.selectedCardIndex = -1;
        } else if (card.energyCost <= state.energy) {
          if (this.needsTarget(card)) {
            this.selectedCardIndex = cardIndex;
          } else {
            // Auto-play non-targeted cards
            this.playSelectedCard(cardIndex, null);
          }
        }
        return;
      }

      // Check enemy click (if card is selected)
      if (this.selectedCardIndex >= 0) {
        const enemy = this.getClickedEnemy(event.x, event.y, state);
        if (enemy) {
          this.playSelectedCard(this.selectedCardIndex, enemy);
        }
        return;
      }

      // Click on enemy without selected card — select first playable attack
      const clickedEnemy = this.getClickedEnemy(event.x, event.y, state);
      if (clickedEnemy) {
        // Find first playable attack card
        const attackIdx = state.hand.findIndex(c =>
          c.type === 'attack' && c.energyCost <= state.energy
        );
        if (attackIdx >= 0) {
          this.playSelectedCard(attackIdx, clickedEnemy);
        }
      }
    }

    if (event.type === 'mousemove') {
      this.hoveredCardIndex = HandLayout.getCardAtPoint(this.cardPositions, event.x, event.y);
      if (this.endTurnButton) {
        this.endTurnButton.hovered = this.endTurnButton.containsPoint(event.x, event.y);
      }
    }

    // Keyboard shortcuts
    if (event.type === 'keydown') {
      if (event.key === 'e' || event.key === 'E') {
        this.onEndTurn();
      }
      const num = parseInt(event.key);
      if (num >= 1 && num <= 9 && num <= (state.hand?.length || 0)) {
        const idx = num - 1;
        if (this.selectedCardIndex === idx) {
          this.selectedCardIndex = -1;
        } else {
          this.selectedCardIndex = idx;
        }
      }
    }
  }

  needsTarget(card) {
    return card.effects?.some(e => e.target === 'single_enemy');
  }

  playSelectedCard(cardIndex, target) {
    const state = this.combatManager.getState();
    const card = state.hand[cardIndex];
    if (!card) return;

    // For single_enemy target cards, get the target
    const enemies = state.enemies.filter(e => e.hp > 0);
    let finalTarget = target;
    if (!finalTarget && enemies.length > 0) {
      finalTarget = enemies[0];
    }

    this.combatManager.playCard(card.instanceId, finalTarget);
    this.selectedCardIndex = -1;
  }

  getClickedEnemy(x, y, state) {
    const w = state.enemies.length > 0 ? 960 : 0; // approximate canvas width
    const enemies = state.enemies.filter(e => e.hp > 0);
    const spacing = Math.min(200, (w - 100) / (enemies.length || 1));
    const startX = (w - spacing * (enemies.length - 1)) / 2;

    for (let i = 0; i < enemies.length; i++) {
      const ex = startX + i * spacing;
      const ey = 130;
      if (Math.abs(x - ex) < 50 && Math.abs(y - ey) < 50) {
        return enemies[i];
      }
    }
    return null;
  }

  getIntentColor(intent) {
    switch (intent) {
      case 'attack':
      case 'attack_multi':
        return PALETTE.intentAttack;
      case 'defend':
        return PALETTE.intentDefend;
      case 'buff':
        return PALETTE.intentBuff;
      case 'debuff':
        return PALETTE.intentDebuff;
      default:
        return PALETTE.textSecondary;
    }
  }

  getIntentText(action) {
    if (!action) return '';
    const intent = action.intent;
    const effects = action.effects || [];

    switch (intent) {
      case 'attack': {
        const dmg = effects.find(e => e.type === 'damage');
        return dmg ? `🗡 ${dmg.value}` : '🗡';
      }
      case 'attack_multi': {
        const dmg = effects.find(e => e.type === 'damage');
        return dmg ? `🗡 ${dmg.value}×${dmg.times || 1}` : '🗡🗡';
      }
      case 'defend':
        return '🛡';
      case 'buff':
        return '⬆';
      case 'debuff':
        return '⬇';
      default:
        return '❓';
    }
  }

  getStatusColor(name) {
    const buffs = ['strength', 'dexterity', 'thorns', 'ritual', 'metallicize', 'regen', 'artifact', 'barricade'];
    return buffs.includes(name) ? PALETTE.intentBuff : PALETTE.intentDebuff;
  }

  unload() {}
}
