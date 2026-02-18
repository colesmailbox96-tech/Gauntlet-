import { PLAYER_STARTING_HP, PLAYER_STARTING_ENERGY, CARDS_PER_DRAW } from '../config.js';

/**
 * Central game state container.
 */
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.screen = 'MAIN_MENU';
    this.run = null;
    this.combat = null;
    this.meta = this.getDefaultMeta();
  }

  /** Start a new run with optional seed. */
  startRun(seed = Date.now()) {
    this.run = {
      seed,
      act: 1,
      floor: 0,
      playerHP: PLAYER_STARTING_HP,
      playerMaxHP: PLAYER_STARTING_HP,
      gold: 99,
      energy: PLAYER_STARTING_ENERGY,
      maxEnergy: PLAYER_STARTING_ENERGY,
      cardsPerDraw: CARDS_PER_DRAW,
      deck: [],
      relics: [],
      potions: [null, null, null],
      map: null,
      currentNode: null,
      ascension: 0,
    };
    this.screen = 'MAP';
  }

  /** Start a combat encounter from run state. */
  startCombat(enemies) {
    this.combat = {
      turn: 0,
      phase: 'PLAYER_TURN',
      enemies: enemies,
      drawPile: [],
      hand: [],
      discardPile: [],
      exhaustPile: [],
      energy: this.run.maxEnergy,
      maxEnergy: this.run.maxEnergy,
      block: 0,
      statusEffects: {},
      cardsPlayedThisTurn: 0,
      cardsPlayedThisCombat: 0,
    };
    this.screen = 'COMBAT';
  }

  endCombat(won) {
    this.combat = null;
    if (won) {
      this.screen = 'REWARD';
    } else {
      this.screen = 'DEATH';
    }
  }

  getDefaultMeta() {
    return {
      highestAscension: 0,
      totalRuns: 0,
      totalWins: 0,
      settings: {
        musicVolume: 0.4,
        sfxVolume: 0.7,
        screenShake: true,
        fastMode: false,
        confirmEndTurn: true,
      },
    };
  }
}
