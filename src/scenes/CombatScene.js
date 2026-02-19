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
        scale: 1.5,
        color: PALETTE.danger,
      });
    }
  }

  update(dt) {
    // Animate damage numbers
    this.damageNumbers = this.damageNumbers.filter(d => {
      d.y -= 40 * dt;
      d.alpha -= dt;
      d.scale = Math.max(1, d.scale - dt * 2);
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

    // Subtle ambient glow behind enemies
    const ambGrd = ctx.createRadialGradient(w / 2, 130, 30, w / 2, 130, 250);
    ambGrd.addColorStop(0, 'rgba(15,52,96,0.12)');
    ambGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = ambGrd;
    ctx.fillRect(0, 0, w, h);

    // Top bar — player stats
    this.renderTopBar(ctx, w, state);

    // Enemy area
    this.renderEnemies(ctx, w, h, state);

    // Divider between enemy and player areas
    const divY = h * 0.45;
    const divGrd = ctx.createLinearGradient(0, divY, w, divY);
    divGrd.addColorStop(0, 'transparent');
    divGrd.addColorStop(0.3, 'rgba(255,255,255,0.06)');
    divGrd.addColorStop(0.7, 'rgba(255,255,255,0.06)');
    divGrd.addColorStop(1, 'transparent');
    ctx.strokeStyle = divGrd;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, divY);
    ctx.lineTo(w, divY);
    ctx.stroke();

    // Middle area — energy, draw/discard piles
    this.renderMiddleArea(ctx, w, h, state);

    // Hand area
    this.renderHand(ctx, w, h, state);

    // Damage numbers
    this.renderDamageNumbers(ctx);

    // Phase overlay
    if (state.phase === 'WON') {
      this.renderOverlay(ctx, w, h, 'VICTORY!', PALETTE.success, 'Rewards await...');
    } else if (state.phase === 'LOST') {
      this.renderOverlay(ctx, w, h, 'DEFEATED', PALETTE.danger, 'Your journey ends here.');
    } else if (state.phase === 'ENEMY_TURN') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = PALETTE.warning;
      ctx.font = '700 24px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Enemy Turn...', w / 2, h / 2);
    }
  }

  renderTopBar(ctx, w, state) {
    // Background bar with gradient
    const barGrd = ctx.createLinearGradient(0, 0, 0, 52);
    barGrd.addColorStop(0, PALETTE.surface);
    barGrd.addColorStop(1, PALETTE.background);
    ctx.fillStyle = barGrd;
    ctx.fillRect(0, 0, w, 52);

    // Bottom border glow
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 52);
    ctx.lineTo(w, 52);
    ctx.stroke();

    // Player HP
    this.playerHealthBar.x = 16;
    this.playerHealthBar.y = 15;
    this.playerHealthBar.width = 200;
    this.playerHealthBar.render(ctx, state.playerHP, state.playerMaxHP, state.block);

    // Gold
    ctx.fillStyle = PALETTE.accent;
    ctx.font = '700 15px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⬥ ${this.gameState.run.gold}`, 250, 26);

    // Turn number
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '500 13px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Turn ${state.turnNumber}`, w - 20, 26);

    // Status effects
    let statusX = 340;
    ctx.textAlign = 'left';
    for (const [name, value] of state.playerStatus) {
      const col = this.getStatusColor(name);
      ctx.fillStyle = col;
      ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
      // Status pill background
      const tw = ctx.measureText(`${name}: ${value}`).width + 10;
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(statusX - 4, 18, tw, 18, 4);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = col;
      ctx.fillText(`${name}: ${value}`, statusX, 28);
      statusX += tw + 6;
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

      // Enemy body with gradient
      const isBoss = enemy.tier === 'boss';
      const bodyGrd = ctx.createLinearGradient(ex - 40, ey - 30, ex - 40, ey + 30);
      bodyGrd.addColorStop(0, isBoss ? '#9B0000' : PALETTE.secondaryLight);
      bodyGrd.addColorStop(1, isBoss ? '#5B0000' : PALETTE.secondary);
      ctx.fillStyle = bodyGrd;
      ctx.beginPath();
      ctx.roundRect(ex - 40, ey - 30, 80, 60, 10);
      ctx.fill();
      // Border
      ctx.strokeStyle = isBoss ? '#FF4444' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = isBoss ? 2 : 1;
      ctx.stroke();
      // Inner highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ex - 39, ey - 29, 78, 58, 9);
      ctx.stroke();

      // Enemy name
      ctx.fillStyle = PALETTE.text;
      ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(enemy.name, ex, ey - 42);

      // Enemy HP bar
      const hpBarW = 80;
      const hpBarH = 10;
      const hpPct = enemy.hp / enemy.maxHp;
      // Background
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.roundRect(ex - hpBarW / 2, ey + 36, hpBarW, hpBarH, 3);
      ctx.fill();
      // Fill
      if (hpPct > 0) {
        const ehGrd = ctx.createLinearGradient(ex - hpBarW / 2, ey + 36, ex - hpBarW / 2, ey + 36 + hpBarH);
        ehGrd.addColorStop(0, PALETTE.danger);
        ehGrd.addColorStop(1, PALETTE.dangerDark);
        ctx.fillStyle = ehGrd;
        ctx.beginPath();
        ctx.roundRect(ex - hpBarW / 2, ey + 36, hpBarW * hpPct, hpBarH, 3);
        ctx.fill();
      }
      // HP text
      ctx.fillStyle = PALETTE.text;
      ctx.font = '600 9px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, ex, ey + 41);

      // Block indicator
      if (enemy.block > 0) {
        ctx.fillStyle = PALETTE.intentDefend;
        ctx.beginPath();
        ctx.arc(ex + 50, ey - 10, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '700 11px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(`${enemy.block}`, ex + 50, ey - 10);
      }

      // Intent display with icon background
      if (enemy.currentIntent) {
        const intent = enemy.currentIntent;
        const intentColor = this.getIntentColor(intent.intent);
        const intentText = this.getIntentText(intent);
        const tw = ctx.measureText(intentText).width + 14;
        // Intent pill
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = intentColor;
        ctx.beginPath();
        ctx.roundRect(ex - tw / 2, ey - 65, tw, 20, 5);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = intentColor;
        ctx.font = '600 13px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(intentText, ex, ey - 55);
      }

      // Enemy status effects
      const statuses = enemy.statusEffects.getAll();
      if (statuses.length > 0) {
        ctx.font = '500 10px "Segoe UI", system-ui, sans-serif';
        let sx = ex - 30;
        for (const [name, value] of statuses) {
          ctx.fillStyle = this.getStatusColor(name);
          ctx.fillText(`${name.slice(0, 3)}:${value}`, sx, ey + 56);
          sx += 40;
        }
      }
    }
  }

  renderMiddleArea(ctx, w, h, state) {
    const midY = h * 0.55;

    // Energy orb with gradient
    const energyX = 60;
    const orbGrd = ctx.createRadialGradient(energyX - 5, midY - 5, 3, energyX, midY, 28);
    orbGrd.addColorStop(0, state.energy > 0 ? '#FFD700' : '#666');
    orbGrd.addColorStop(1, state.energy > 0 ? PALETTE.accentDark : '#333');
    ctx.beginPath();
    ctx.arc(energyX, midY, 28, 0, Math.PI * 2);
    ctx.fillStyle = orbGrd;
    ctx.fill();
    // Orb border
    ctx.strokeStyle = state.energy > 0 ? 'rgba(255,215,0,0.4)' : '#444';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Outer glow
    if (state.energy > 0) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = PALETTE.accent;
      ctx.beginPath();
      ctx.arc(energyX, midY, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Energy text
    ctx.fillStyle = '#000';
    ctx.font = '700 22px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.energy}/${state.maxEnergy}`, energyX, midY);

    // Draw pile
    ctx.fillStyle = PALETTE.surface;
    ctx.beginPath();
    ctx.roundRect(20, midY + 40, 70, 30, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = PALETTE.textSecondary;
    ctx.font = '500 12px "Segoe UI", system-ui, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`Draw: ${state.drawPileSize}`, 55, midY + 60);

    // Discard pile
    ctx.fillStyle = PALETTE.surface;
    ctx.beginPath();
    ctx.roundRect(w - 90, midY + 40, 70, 30, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
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
      ctx.save();
      ctx.globalAlpha = d.alpha;
      ctx.fillStyle = d.color;
      const fontSize = Math.round(24 * d.scale);
      ctx.font = `700 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Text outline for readability
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 3;
      ctx.strokeText(d.text, d.x, d.y);
      ctx.fillText(d.text, d.x, d.y);
      ctx.restore();
    }
  }

  renderOverlay(ctx, w, h, text, color, subtitle) {
    // Dark overlay with vignette
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, w, h);

    // Glow behind text
    const glowGrd = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 200);
    const [cr, cg, cb] = this._hexToRgb(color);
    glowGrd.addColorStop(0, `rgba(${cr},${cg},${cb},0.1)`);
    glowGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrd;
    ctx.fillRect(0, 0, w, h);

    // Main text shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.font = '700 50px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2 + 2, h / 2 - 8);

    // Main text
    ctx.fillStyle = color;
    ctx.font = '700 50px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(text, w / 2, h / 2 - 10);

    // Subtitle
    if (subtitle) {
      ctx.fillStyle = PALETTE.textSecondary;
      ctx.font = '400 16px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(subtitle, w / 2, h / 2 + 25);
    }
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

  _hexToRgb(hex) {
    const num = parseInt(hex.replace('#', ''), 16);
    return [(num >> 16) & 0xFF, (num >> 8) & 0xFF, num & 0xFF];
  }

  unload() {}
}
