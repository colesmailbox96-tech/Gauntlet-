import { describe, it, expect } from 'vitest';
import { EventBus } from '../../src/core/EventBus.js';
import { DeckManager } from '../../src/cards/DeckManager.js';
import { createCard, createStarterDeck } from '../../src/cards/CardFactory.js';

describe('DeckManager', () => {
  it('initializes combat with shuffled deck', () => {
    const eventBus = new EventBus();
    const dm = new DeckManager(eventBus);
    const deck = createStarterDeck();
    dm.initCombat(deck);

    expect(dm.drawPile.length).toBe(10);
    expect(dm.hand.length).toBe(0);
    expect(dm.discardPile.length).toBe(0);
    expect(dm.exhaustPile.length).toBe(0);
  });

  it('draws cards from draw pile to hand', () => {
    const eventBus = new EventBus();
    const dm = new DeckManager(eventBus);
    dm.initCombat(createStarterDeck());

    const drawn = dm.draw(5);
    expect(drawn.length).toBe(5);
    expect(dm.hand.length).toBe(5);
    expect(dm.drawPile.length).toBe(5);
  });

  it('reshuffles discard when draw pile is empty', () => {
    const eventBus = new EventBus();
    const dm = new DeckManager(eventBus);
    dm.initCombat(createStarterDeck());

    dm.draw(10); // draw all
    expect(dm.drawPile.length).toBe(0);
    expect(dm.hand.length).toBe(10);

    // Discard all
    dm.discardHand();
    expect(dm.discardPile.length).toBe(10);

    // Drawing should trigger reshuffle
    const drawn = dm.draw(3);
    expect(drawn.length).toBe(3);
    expect(dm.hand.length).toBe(3);
  });

  it('discards a card from hand', () => {
    const eventBus = new EventBus();
    const dm = new DeckManager(eventBus);
    dm.initCombat(createStarterDeck());
    dm.draw(3);

    const card = dm.hand[0];
    const discarded = dm.discardFromHand(card.instanceId);
    expect(discarded).toBeTruthy();
    expect(dm.hand.length).toBe(2);
    expect(dm.discardPile.length).toBe(1);
  });

  it('exhausts a card from hand', () => {
    const eventBus = new EventBus();
    const dm = new DeckManager(eventBus);
    dm.initCombat(createStarterDeck());
    dm.draw(3);

    const card = dm.hand[1];
    const exhausted = dm.exhaustFromHand(card.instanceId);
    expect(exhausted).toBeTruthy();
    expect(dm.hand.length).toBe(2);
    expect(dm.exhaustPile.length).toBe(1);
  });
});

describe('CardFactory', () => {
  it('creates a Strike card', () => {
    const card = createCard('strike_001');
    expect(card).toBeTruthy();
    expect(card.name).toBe('Strike');
    expect(card.type).toBe('attack');
    expect(card.energyCost).toBe(1);
    expect(card.effects[0].type).toBe('damage');
    expect(card.effects[0].value).toBe(6);
  });

  it('creates an upgraded card', () => {
    const card = createCard('strike_001', true);
    expect(card).toBeTruthy();
    expect(card.name).toBe('Strike+');
    expect(card.upgraded).toBe(true);
    expect(card.effects[0].value).toBe(9);
  });

  it('creates a starter deck with 10 cards', () => {
    const deck = createStarterDeck();
    expect(deck.length).toBe(10);

    const strikes = deck.filter(c => c.id === 'strike_001');
    const defends = deck.filter(c => c.id === 'defend_001');
    const bashes = deck.filter(c => c.id === 'bash_001');
    expect(strikes.length).toBe(5);
    expect(defends.length).toBe(4);
    expect(bashes.length).toBe(1);
  });

  it('each card has a unique instanceId', () => {
    const deck = createStarterDeck();
    const ids = new Set(deck.map(c => c.instanceId));
    expect(ids.size).toBe(10);
  });
});
