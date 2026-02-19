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
    this.hoveredCardIndex = -1;
  }

  load() {
    // Generate rewards
    this.goldReward = this.rng.nextInt(10, 25);
    this.goldCollected = false;
    this.cardChosen = false;
    this.hoveredCardIndex = -1;

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

    // Victory glow
    const grd = ctx.createRadialGradient(w / 2, 50, 20, w / 2, 50, w * 0.4);
    grd.addColorStop(0, 'rgba(39,174,96,0.1)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Title with shadow
    ctx.fillStyle = 'rgba(39,174,96,0.2)';
    ctx.font = '700 38px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Victory!', w / 2 + 2, 48);
    ctx.fillStyle = PALETTE.success;
    ctx.fillText('Victory!', w / 2, 46);

    // Decorative line
    const lineGrd = ctx.createLinearGradient(w * 0.3, 66, w * 0.7, 66);
    lineGrd.addColorStop(0, 'transparent');
    lineGrd.addColorStop(0.5, PALETTE.success);
    lineGrd.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGrd;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.3, 66);
    ctx.lineTo(w * 0.7, 66);
    ctx.stroke();

    // Gold reward with pill background
    const goldText = !this.goldCollected
      ? `⬥ +${this.goldReward} Gold  (click to collect)`
      : `⬥ +${this.goldReward} Gold collected`;
    const gtw = ctx.measureText(goldText).width + 30;
    ctx.fillStyle = !this.goldCollected ? 'rgba(243,156,18,0.12)' : 'rgba(100,100,100,0.1)';
    ctx.beginPath();
    ctx.roundRect(w / 2 - gtw / 2, 82, gtw, 30, 6);
    ctx.fill();
    ctx.fillStyle = !this.goldCollected ? PALETTE.accent : PALETTE.textDim;
    ctx.font = '600 17px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(goldText, w / 2, 97);

    // Card choices
    if (!this.cardChosen && this.cardChoices.length > 0) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = '600 17px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('Choose a card to add to your deck:', w / 2, 140);

      const cardSpacing = 160;
      const startX = (w - cardSpacing * (this.cardChoices.length - 1)) / 2 - 70;

      for (let i = 0; i < this.cardChoices.length; i++) {
        const card = this.cardChoices[i];
        const x = startX + i * cardSpacing;
        const isHov = i === this.hoveredCardIndex;
        CardRenderer.render(ctx, card, x, 160, { playable: true, hovered: isHov });

        // Rarity label
        const rarity = card.rarity || 'common';
        const rCol = rarity === 'rare' ? PALETTE.rarityRare : rarity === 'uncommon' ? PALETTE.rarityUncommon : PALETTE.rarityCommon;
        ctx.fillStyle = rCol;
        ctx.font = '500 11px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(rarity.charAt(0).toUpperCase() + rarity.slice(1), x + 70, 370);
      }
    } else if (this.cardChosen) {
      ctx.fillStyle = PALETTE.textSecondary;
      ctx.font = '500 16px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('Card added to deck!', w / 2, 180);
    }

    // Skip card hint
    if (!this.cardChosen && this.cardChoices.length > 0) {
      ctx.fillStyle = PALETTE.textDim;
      ctx.font = '400 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('or click Continue to skip', w / 2, 400);
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
          if (event.x >= x && event.x <= x + 140 && event.y >= 160 && event.y <= 160 + 196) {
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
      // Card hover detection
      this.hoveredCardIndex = -1;
      if (!this.cardChosen && this.cardChoices.length > 0) {
        const w = event.canvasWidth || 960;
        const cardSpacing = 160;
        const startX = (w - cardSpacing * (this.cardChoices.length - 1)) / 2 - 70;
        for (let i = 0; i < this.cardChoices.length; i++) {
          const x = startX + i * cardSpacing;
          if (event.x >= x && event.x <= x + 140 && event.y >= 160 && event.y <= 160 + 196) {
            this.hoveredCardIndex = i;
            break;
          }
        }
      }
    }
  }

  unload() {}
}
