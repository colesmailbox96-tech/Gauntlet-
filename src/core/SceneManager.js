/**
 * Manages scene lifecycle: load, update, render, unload.
 */
export class SceneManager {
  /**
   * @param {import('./EventBus.js').EventBus} eventBus
   */
  constructor(eventBus) {
    this.eventBus = eventBus;
    /** @type {Map<string, {load?: Function, update?: Function, render?: Function, unload?: Function, handleInput?: Function}>} */
    this.scenes = new Map();
    /** @type {string|null} */
    this.currentSceneId = null;
    this.currentScene = null;
  }

  /**
   * @param {string} id
   * @param {object} scene
   */
  register(id, scene) {
    this.scenes.set(id, scene);
  }

  /**
   * @param {string} id
   * @param {*} [data]
   */
  switchTo(id, data) {
    if (this.currentScene && this.currentScene.unload) {
      this.currentScene.unload();
    }
    this.currentSceneId = id;
    this.currentScene = this.scenes.get(id) || null;
    if (this.currentScene && this.currentScene.load) {
      this.currentScene.load(data);
    }
    this.eventBus.emit('sceneChanged', { id, data });
  }

  /**
   * @param {number} dt delta time in seconds
   */
  update(dt) {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(dt);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(ctx);
    }
  }

  /**
   * @param {*} inputEvent
   */
  handleInput(inputEvent) {
    if (this.currentScene && this.currentScene.handleInput) {
      this.currentScene.handleInput(inputEvent);
    }
  }
}
