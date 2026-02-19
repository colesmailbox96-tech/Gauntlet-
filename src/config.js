/** @file Global constants and tuning values */

export const DESIGN_WIDTH = 1920;
export const DESIGN_HEIGHT = 1080;

export const PLAYER_STARTING_HP = 80;
export const PLAYER_STARTING_ENERGY = 3;
export const CARDS_PER_DRAW = 5;

export const ACTS_TOTAL = 3;
export const FLOORS_PER_ACT = 15;

export const CARD_REWARD_COUNT = 3;

export const PALETTE = {
  background: '#1A1A2E',
  backgroundLight: '#222244',
  surface: '#16213E',
  surfaceLight: '#1C2A4A',
  primary: '#E94560',
  primaryDark: '#C13550',
  secondary: '#0F3460',
  secondaryLight: '#174180',
  accent: '#F39C12',
  accentDark: '#D48806',
  text: '#ECF0F1',
  textSecondary: '#BDC3C7',
  textDim: '#7F8C8D',
  success: '#27AE60',
  successDark: '#1E8449',
  danger: '#E74C3C',
  dangerDark: '#C0392B',
  warning: '#F39C12',
  rarityCommon: '#BDC3C7',
  rarityUncommon: '#3498DB',
  rarityRare: '#F1C40F',
  rarityCurse: '#8E44AD',
  cardAttack: '#C0392B',
  cardAttackLight: '#E74C3C',
  cardSkill: '#2980B9',
  cardSkillLight: '#3498DB',
  cardPower: '#F39C12',
  cardPowerLight: '#F5B041',
  cardCurse: '#8E44AD',
  cardCurseLight: '#AF7AC5',
  cardStatus: '#7F8C8D',
  cardStatusLight: '#95A5A6',
  intentAttack: '#E74C3C',
  intentDefend: '#3498DB',
  intentBuff: '#27AE60',
  intentDebuff: '#9B59B6',
};

export const FONT = {
  display: '"Segoe UI", system-ui, sans-serif',
  body: '"Segoe UI", system-ui, sans-serif',
};

export const FLOOR_SCALING = {
  act1: { enemyHpMultiplier: 1.0, enemyDamageMultiplier: 1.0, goldRewardBase: { min: 10, max: 20 }, cardRewardCount: 3 },
  act2: { enemyHpMultiplier: 1.4, enemyDamageMultiplier: 1.3, goldRewardBase: { min: 15, max: 25 }, cardRewardCount: 3 },
  act3: { enemyHpMultiplier: 1.8, enemyDamageMultiplier: 1.6, goldRewardBase: { min: 20, max: 35 }, cardRewardCount: 3 },
};

export const NODE_TYPE_WEIGHTS = {
  combat: 45,
  elite: 12,
  event: 22,
  shop: 8,
  rest: 10,
  treasure: 3,
};
