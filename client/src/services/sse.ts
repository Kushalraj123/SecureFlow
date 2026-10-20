type SSEListener = (data: any) => void;
type ConnectionStateListener = (state: 'connecting' | 'connected' | 'disconnected') => void;

class SSEClient {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<SSEListener>> = new Map();
  private stateListeners: Set<ConnectionStateListener> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private retryDelayMs = 2000;
  private maxRetryDelayMs = 15000;
  public state: 'connecting' | 'connected' | 'disconnected' = 'disconnected';

  public connect(): void {
    if (this.eventSource) return;

    this.setState('connecting');
    try {
      this.eventSource = new EventSource('/api/events/stream');

      this.eventSource.onopen = () => {
        this.setState('connected');
        this.retryDelayMs = 2000;
      };

      this.eventSource.addEventListener('connected', (e: MessageEvent) => {
        this.dispatch('connected', JSON.parse(e.data));
      });

      this.eventSource.addEventListener('transaction_created', (e: MessageEvent) => {
        this.dispatch('transaction_created', JSON.parse(e.data));
      });

      this.eventSource.addEventListener('transaction_updated', (e: MessageEvent) => {
        this.dispatch('transaction_updated', JSON.parse(e.data));
      });

      this.eventSource.onerror = () => {
        this.setState('disconnected');
        this.disconnect();
        this.scheduleReconnect();
      };
    } catch (err) {
      console.error('SSE initialization error', err);
      this.setState('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.retryDelayMs = Math.min(this.retryDelayMs * 1.5, this.maxRetryDelayMs);
      this.connect();
    }, this.retryDelayMs);
  }

  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.setState('disconnected');
  }

  public on(event: string, callback: SSEListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public onStateChange(callback: ConnectionStateListener): () => void {
    this.stateListeners.add(callback);
    callback(this.state);
    return () => {
      this.stateListeners.delete(callback);
    };
  }

  private setState(newState: 'connecting' | 'connected' | 'disconnected'): void {
    this.state = newState;
    this.stateListeners.forEach(cb => cb(newState));
  }

  private dispatch(event: string, data: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(fn => fn(data));
    }
  }
}

export const sseClient = new SSEClient();
