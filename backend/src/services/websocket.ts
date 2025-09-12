import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { query } from '../config/database';

export interface WebSocketClient {
  ws: WebSocket;
  userId: string;
  isAlive: boolean;
}

export class WebSocketService {
  private clients: Map<string, WebSocketClient> = new Map();
  private wss: WebSocketServer;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.initialize();
  }

  private initialize(): void {
    this.wss.on('connection', async (ws, req) => {
      try {
        // Extract token from query parameters
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token) {
          ws.close(1008, 'Token required');
          return;
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const userId = decoded.userId;

        // Verify user exists
        const userResult = await query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
          ws.close(1008, 'Invalid user');
          return;
        }

        // Store client connection
        const client: WebSocketClient = {
          ws,
          userId,
          isAlive: true
        };

        this.clients.set(userId, client);
        logger.info(`WebSocket client connected: ${userId}`);

        // Handle client messages
        ws.on('message', (data) => {
          this.handleMessage(userId, data);
        });

        // Handle client disconnect
        ws.on('close', () => {
          this.clients.delete(userId);
          logger.info(`WebSocket client disconnected: ${userId}`);
        });

        // Handle pong responses
        ws.on('pong', () => {
          if (this.clients.has(userId)) {
            this.clients.get(userId)!.isAlive = true;
          }
        });

        // Send welcome message
        this.sendToUser(userId, {
          type: 'CONNECTED',
          payload: { message: 'WebSocket connected successfully' }
        });

      } catch (error) {
        logger.error('WebSocket connection error:', error);
        ws.close(1008, 'Authentication failed');
      }
    });

    // Start heartbeat interval
    this.startHeartbeat();
  }

  private handleMessage(userId: string, data: any): void {
    try {
      const message = JSON.parse(data.toString());
      logger.info(`WebSocket message from ${userId}:`, message);

      switch (message.type) {
        case 'SUBSCRIBE':
          this.handleSubscription(userId, message.payload);
          break;
        case 'UNSUBSCRIBE':
          this.handleUnsubscription(userId, message.payload);
          break;
        case 'PING':
          this.sendToUser(userId, { type: 'PONG', payload: {} });
          break;
        default:
          logger.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
    }
  }

  private handleSubscription(userId: string, payload: any): void {
    // Handle symbol subscriptions for market data
    if (payload.symbol) {
      logger.info(`User ${userId} subscribed to ${payload.symbol}`);
      // Here you would typically subscribe to market data feed
    }
  }

  private handleUnsubscription(userId: string, payload: any): void {
    // Handle symbol unsubscriptions
    if (payload.symbol) {
      logger.info(`User ${userId} unsubscribed from ${payload.symbol}`);
      // Here you would typically unsubscribe from market data feed
    }
  }

  private startHeartbeat(): void {
    const interval = setInterval(() => {
      this.clients.forEach((client, userId) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(userId);
          return;
        }

        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  public sendToUser(userId: string, message: any): void {
    const client = this.clients.get(userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error(`Failed to send message to user ${userId}:`, error);
      }
    }
  }

  public broadcastToUser(userId: string, message: any): void {
    this.sendToUser(userId, message);
  }

  public broadcastToAll(message: any): void {
    this.clients.forEach((client, userId) => {
      this.sendToUser(userId, message);
    });
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  public isUserConnected(userId: string): boolean {
    return this.clients.has(userId);
  }
}