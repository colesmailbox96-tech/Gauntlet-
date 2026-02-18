import starterCards from '../../data/cards/starter.json';
import commonCards from '../../data/cards/common.json';
import uncommonCards from '../../data/cards/uncommon.json';
import rareCards from '../../data/cards/rare.json';

const ALL_CARDS = new Map();

/** Register a set of card definitions. */
function registerCards(cards) {
  for (const card of cards) {
    ALL_CARDS.set(card.id, card);
  }
}

// Register built-in cards.
registerCards(starterCards);
registerCards(commonCards);
registerCards(uncommonCards);
registerCards(rareCards);

/**
 * Create a card instance from a card definition ID.
 * @param {string} id
 * @param {boolean} [upgraded=false]
 * @returns {object|null}
 */
export function createCard(id, upgraded = false) {
  const def = ALL_CARDS.get(id);
  if (!def) return null;
  const instance = {
    instanceId: `${id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    id: def.id,
    name: upgraded && def.upgraded ? def.upgraded.name : def.name,
    type: def.type,
    rarity: def.rarity,
    energyCost: upgraded && def.upgraded?.energyCost !== undefined ? def.upgraded.energyCost : def.energyCost,
    description: upgraded && def.upgraded ? (def.upgraded.description || def.description) : def.description,
    effects: upgraded && def.upgraded ? def.upgraded.effects : def.effects,
    keywords: def.keywords || [],
    tags: def.tags || [],
    upgraded,
  };
  return instance;
}

/**
 * Get the default starting deck.
 * @returns {object[]}
 */
export function createStarterDeck() {
  const deck = [];
  for (let i = 0; i < 5; i++) deck.push(createCard('strike_001'));
  for (let i = 0; i < 4; i++) deck.push(createCard('defend_001'));
  deck.push(createCard('bash_001'));
  return deck;
}

/**
 * Get a card definition by ID.
 * @param {string} id
 * @returns {object|null}
 */
export function getCardDefinition(id) {
  return ALL_CARDS.get(id) || null;
}

/**
 * Get all card definitions matching a rarity.
 * @param {string} rarity
 * @returns {object[]}
 */
export function getCardsByRarity(rarity) {
  return [...ALL_CARDS.values()].filter(c => c.rarity === rarity);
}

export { ALL_CARDS, registerCards };
