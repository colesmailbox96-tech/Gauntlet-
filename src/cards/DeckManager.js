/**
 * Manages draw pile, hand, discard pile, and exhaust pile during combat.
 */
export class DeckManager {
  /**
   * @param {import('../core/EventBus.js').EventBus} eventBus
   */
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
  }

  /**
   * Initialize the deck for a new combat from the player's deck.
   * @param {object[]} deck
   */
  initCombat(deck) {
    this.drawPile = this.shuffle([...deck]);
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
  }

  /**
   * Draw n cards into the hand.
   * @param {number} n
   * @returns {object[]} drawn cards
   */
  draw(n) {
    const drawn = [];
    for (let i = 0; i < n; i++) {
      if (this.drawPile.length === 0) {
        this.reshuffleDiscard();
        if (this.drawPile.length === 0) break;
      }
      const card = this.drawPile.pop();
      this.hand.push(card);
      drawn.push(card);
      this.eventBus.emit('cardDrawn', card);
    }
    return drawn;
  }

  /** Discard a card from the hand by instanceId. */
  discardFromHand(instanceId) {
    const idx = this.hand.findIndex(c => c.instanceId === instanceId);
    if (idx === -1) return null;
    const [card] = this.hand.splice(idx, 1);
    this.discardPile.push(card);
    this.eventBus.emit('cardDiscarded', card);
    return card;
  }

  /** Move a card from the hand to the exhaust pile. */
  exhaustFromHand(instanceId) {
    const idx = this.hand.findIndex(c => c.instanceId === instanceId);
    if (idx === -1) return null;
    const [card] = this.hand.splice(idx, 1);
    this.exhaustPile.push(card);
    this.eventBus.emit('cardExhausted', card);
    return card;
  }

  /** Discard entire hand. */
  discardHand() {
    while (this.hand.length > 0) {
      const card = this.hand.pop();
      // Exhaust Ethereal cards
      if (card.keywords && card.keywords.includes('Ethereal')) {
        this.exhaustPile.push(card);
        this.eventBus.emit('cardExhausted', card);
      } else if (card.keywords && card.keywords.includes('Retain')) {
        this.hand.push(card); // keep it
        break; // avoid infinite loop
      } else {
        this.discardPile.push(card);
        this.eventBus.emit('cardDiscarded', card);
      }
    }
  }

  /** Reshuffle the discard pile into the draw pile. */
  reshuffleDiscard() {
    this.drawPile = this.shuffle([...this.discardPile, ...this.drawPile]);
    this.discardPile = [];
  }

  /**
   * @param {object[]} arr
   * @returns {object[]}
   */
  shuffle(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
