/**
 * Publish/subscribe event system for decoupled communication.
 */
export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
  }

  /**
   * @param {string} event
   * @param {Function} callback
   * @returns {() => void} unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  /**
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) this.listeners.delete(event);
    }
  }

  /**
   * @param {string} event
   * @param {*} [data]
   */
  emit(event, data) {
    const set = this.listeners.get(event);
    if (set) {
      for (const cb of set) {
        cb(data);
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}
