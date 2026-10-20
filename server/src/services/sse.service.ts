import type { Response } from 'express';

export interface SSEClient {
  id: string;
  res: Response;
}

export class SSEService {
  private static clients: Map<string, Response> = new Map();
  private static heartbeatInterval: NodeJS.Timeout | null = null;

  public static addClient(id: string, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // For nginx / reverse proxy pass-through
    res.flushHeaders?.();

    this.clients.set(id, res);

    // Initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId: id, timestamp: new Date().toISOString() })}\n\n`);

    // Setup heartbeat if not already running
    if (!this.heartbeatInterval) {
      this.heartbeatInterval = setInterval(() => {
        this.broadcastPing();
      }, 25000);
    }
  }

  public static removeClient(id: string): void {
    this.clients.delete(id);
    if (this.clients.size === 0 && this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public static broadcast(eventName: string, data: unknown): void {
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [id, clientRes] of this.clients.entries()) {
      try {
        clientRes.write(payload);
      } catch (err) {
        console.error(`Failed to send SSE to client ${id}, removing`, err);
        this.clients.delete(id);
      }
    }
  }

  private static broadcastPing(): void {
    for (const [id, clientRes] of this.clients.entries()) {
      try {
        clientRes.write(': ping\n\n');
      } catch {
        this.clients.delete(id);
      }
    }
  }

  public static getActiveClientCount(): number {
    return this.clients.size;
  }
}
