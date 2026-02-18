import { describe, it, expect } from 'vitest';
import { EventBus } from '../../src/core/EventBus.js';

describe('EventBus', () => {
  it('emits and receives events', () => {
    const bus = new EventBus();
    let received = null;
    bus.on('test', (data) => { received = data; });
    bus.emit('test', { value: 42 });
    expect(received).toEqual({ value: 42 });
  });

  it('supports multiple listeners', () => {
    const bus = new EventBus();
    let count = 0;
    bus.on('ping', () => { count++; });
    bus.on('ping', () => { count++; });
    bus.emit('ping');
    expect(count).toBe(2);
  });

  it('unsubscribes correctly', () => {
    const bus = new EventBus();
    let count = 0;
    const unsub = bus.on('test', () => { count++; });
    bus.emit('test');
    expect(count).toBe(1);
    unsub();
    bus.emit('test');
    expect(count).toBe(1);
  });

  it('clear removes all listeners', () => {
    const bus = new EventBus();
    let count = 0;
    bus.on('a', () => { count++; });
    bus.on('b', () => { count++; });
    bus.clear();
    bus.emit('a');
    bus.emit('b');
    expect(count).toBe(0);
  });
});
