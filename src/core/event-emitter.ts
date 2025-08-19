/**
 * Centralized event emitter for the Native Update plugin
 */
export class EventEmitter {
  private static instance: EventEmitter;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  private constructor() {}

  static getInstance(): EventEmitter {
    if (!EventEmitter.instance) {
      EventEmitter.instance = new EventEmitter();
    }
    return EventEmitter.instance;
  }

  /**
   * Add a listener for an event
   */
  addListener(
    eventName: string,
    listener: (data: unknown) => void
  ): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    
    this.listeners.get(eventName)!.add(listener);

    // Return remove function
    return () => {
      const listeners = this.listeners.get(eventName);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(eventName);
        }
      }
    };
  }

  /**
   * Emit an event to all listeners
   */
  emit(eventName: string, data: unknown): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for a specific event
   */
  removeListeners(eventName: string): void {
    this.listeners.delete(eventName);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(eventName: string): number {
    return this.listeners.get(eventName)?.size || 0;
  }

  /**
   * Get all event names that have listeners
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}