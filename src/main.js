import { EventBus } from './core/EventBus.js';
import { GameState } from './core/GameState.js';
import { SceneManager } from './core/SceneManager.js';
import { SeededRandom } from './utils/SeededRandom.js';
import { MapGenerator } from './map/MapGenerator.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { MapScene } from './scenes/MapScene.js';
import { CombatScene } from './scenes/CombatScene.js';
import { RewardScene } from './scenes/RewardScene.js';
import { RestScene } from './scenes/RestScene.js';
import { DeathScene } from './scenes/DeathScene.js';
import { PALETTE } from './config.js';

const app = document.querySelector('#app');

if (app) {
  app.innerHTML = `
    <canvas id="game-canvas" role="img" aria-label="Arcane Gauntlet game"></canvas>
  `;

  const style = document.createElement('style');
  style.textContent = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${PALETTE.background}; }
    #app { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
    #game-canvas { width: 100%; max-width: 960px; aspect-ratio: 16 / 9; border-radius: 8px; display: block; background: ${PALETTE.background}; cursor: default; }
  `;
  document.head.append(style);

  const canvas = /** @type {HTMLCanvasElement} */ (document.querySelector('#game-canvas'));
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) throw new Error('Canvas not available');

  // Core systems
  const eventBus = new EventBus();
  const gameState = new GameState();
  const rng = new SeededRandom(Date.now());
  const sceneManager = new SceneManager(eventBus);
  const mapGenerator = new MapGenerator(rng);

  // Register scenes
  const mainMenuScene = new MainMenuScene(gameState, eventBus, sceneManager);
  const mapScene = new MapScene(gameState, eventBus, sceneManager, mapGenerator);
  const combatScene = new CombatScene(gameState, eventBus, sceneManager, rng);
  const rewardScene = new RewardScene(gameState, eventBus, sceneManager, rng);
  const restScene = new RestScene(gameState, eventBus, sceneManager);
  const deathScene = new DeathScene(gameState, eventBus, sceneManager);

  sceneManager.register('MAIN_MENU', mainMenuScene);
  sceneManager.register('MAP', mapScene);
  sceneManager.register('COMBAT', combatScene);
  sceneManager.register('REWARD', rewardScene);
  sceneManager.register('REST', restScene);
  sceneManager.register('DEATH', deathScene);

  // Input handling
  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    };
  }

  canvas.addEventListener('click', (e) => {
    const coords = getCanvasCoords(e);
    sceneManager.handleInput({ type: 'click', ...coords });
  });

  canvas.addEventListener('mousemove', (e) => {
    const coords = getCanvasCoords(e);
    sceneManager.handleInput({ type: 'mousemove', ...coords });
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    sceneManager.handleInput({ type: 'wheel', deltaY: e.deltaY });
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    sceneManager.handleInput({ type: 'keydown', key: e.key });
  });

  // Game loop
  let lastTime = performance.now();

  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Set canvas resolution
    canvas.width = 960;
    canvas.height = 540;

    // Update & render
    sceneManager.update(dt);
    sceneManager.render(ctx);

    requestAnimationFrame(gameLoop);
  }

  // Start the game
  sceneManager.switchTo('MAIN_MENU');
  requestAnimationFrame(gameLoop);
}
