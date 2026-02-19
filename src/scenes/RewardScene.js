import { PALETTE } from '../config.js';
import { Button } from '../ui/Button.js';
import { CardRenderer } from '../ui/CardRenderer.js';
import { getCardsByRarity, createCard } from '../cards/CardFactory.js';

/**
 * Post-combat reward scene: gold, card choice, and potion rewards.
 */
export class RewardScene {
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
    this.goldReward = 0;
    this.cardChoices = [];
    this.continueButton = null;
    this.cardButtons = [];
    this.goldCollected = false;
    this.cardChosen = false;
  }

  load() {
    // Generate rewards
    this.goldReward = this.rng.nextInt(10, 25);
    this.goldCollected = false;
    this.cardChosen = false;

    // Generate card choices (3 cards: 60% common, 30% uncommon, 10% rare)
    this.cardChoices = [];
    for (let i = 0; i < 3; i++) {
      const roll = this.rng.next();
      let rarity;
      if (roll < 0.6) rarity = 'common';
      else if (roll < 0.9) rarity = 'uncommon';
      else rarity = 'rare';

      const pool = getCardsByRarity(rarity);
      if (pool.length > 0) {
        const def = pool[this.rng.nextInt(0, pool.length - 1)];
        this.cardChoices.push(createCard(def.id));
      }
    }

    this.continueButton = new Button(0, 0, 200, 48, 'Continue', {
      color: PALETTE.success,
      fontSize: 18,
      onClick: () => {
        this.sceneManager.switchTo('MAP');
      },
    });
  }

  update(dt) {}

  render(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Background
    ctx.fillStyle = PALETTE.background;
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = PALETTE.success;
    ctx.font = '700 36px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Victory!', w / 2, 50);

    // Gold reward
    ctx.fillStyle = PALETTE.accent;
    ctx.font = '600 20px system-ui, sans-serif';
    if (!this.goldCollected) {
      ctx.fillText(`💰 Gold: +${this.goldReward} (click to collect)`, w / 2, 100);
    } else {
      ctx.fillStyle = PALETTE.textSecondary;
      ctx.fillText(`💰 Gold collected: +${this.goldReward}`, w / 2, 100);
    }

    // Card choices
    if (!this.cardChosen && this.cardChoices.length > 0) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = '600 18px system-ui, sans-serif';
      ctx.fillText('Choose a card to add to your deck:', w / 2, 145);

      const cardSpacing = 160;
      const startX = (w - cardSpacing * (this.cardChoices.length - 1)) / 2 - 70;

      for (let i = 0; i < this.cardChoices.length; i++) {
        const card = this.cardChoices[i];
        const x = startX + i * cardSpacing;
        CardRenderer.render(ctx, card, x, 170, { playable: true });
      }
    } else if (this.cardChosen) {
      ctx.fillStyle = PALETTE.textSecondary;
      ctx.font = '500 16px system-ui, sans-serif';
      ctx.fillText('Card added to deck!', w / 2, 180);
    }

    // Skip card option
    if (!this.cardChosen && this.cardChoices.length > 0) {
      ctx.fillStyle = PALETTE.textSecondary;
      ctx.font = '400 14px system-ui, sans-serif';
      ctx.fillText('(or click Continue to skip)', w / 2, 400);
    }

    // Continue button
    this.continueButton.x = w / 2 - 100;
    this.continueButton.y = h - 80;
    this.continueButton.render(ctx);
  }

  handleInput(event) {
    if (event.type === 'click') {
      const w = event.canvasWidth || 960;

      // Gold collection
      if (!this.goldCollected && event.y >= 80 && event.y <= 120) {
        this.goldCollected = true;
        this.gameState.run.gold += this.goldReward;
      }

      // Card selection
      if (!this.cardChosen && this.cardChoices.length > 0) {
        const cardSpacing = 160;
        const startX = (w - cardSpacing * (this.cardChoices.length - 1)) / 2 - 70;
        for (let i = 0; i < this.cardChoices.length; i++) {
          const x = startX + i * cardSpacing;
          if (event.x >= x && event.x <= x + 140 && event.y >= 170 && event.y <= 170 + 196) {
            this.cardChosen = true;
            this.gameState.run.deck.push(this.cardChoices[i]);
            this.eventBus.emit('cardAdded', this.cardChoices[i]);
            break;
          }
        }
      }

      // Continue button
      if (this.continueButton.containsPoint(event.x, event.y)) {
        if (!this.goldCollected) {
          this.goldCollected = true;
          this.gameState.run.gold += this.goldReward;
        }
        this.continueButton.onClick();
      }
    }

    if (event.type === 'mousemove') {
      if (this.continueButton) {
        this.continueButton.hovered = this.continueButton.containsPoint(event.x, event.y);
      }
    }
  }

  unload() {}
}
