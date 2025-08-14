import { ConfigManager } from './config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private static instance: Logger;
  private configManager: ConfigManager;
  private context: string;

  constructor(context?: string) {
    this.configManager = ConfigManager.getInstance();
    this.context = context || 'CapacitorNativeUpdate';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(): boolean {
    return this.configManager.get('enableLogging');
  }

  private sanitize(data: unknown): unknown {
    if (typeof data === 'string') {
      let sanitized = data;
      // Remove potential file paths
      sanitized = sanitized.replace(/\/[^\s]+\/([\w.-]+)$/g, '/<path>/$1');
      // Remove potential URLs with credentials
      sanitized = sanitized.replace(
        /https?:\/\/[^:]+:[^@]+@/g,
        'https://***:***@'
      );
      // Remove potential API keys
      sanitized = sanitized.replace(/[a-zA-Z0-9]{32,}/g, '<redacted>');
      return sanitized;
    } else if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map((item) => this.sanitize(item));
      } else {
        const sanitized: Record<string, unknown> = {};
        const dataObj = data as Record<string, unknown>;
        for (const key in dataObj) {
          if (
            key.toLowerCase().includes('key') ||
            key.toLowerCase().includes('secret') ||
            key.toLowerCase().includes('password') ||
            key.toLowerCase().includes('token')
          ) {
            sanitized[key] = '<redacted>';
          } else {
            sanitized[key] = this.sanitize(dataObj[key]);
          }
        }
        return sanitized;
      }
    }
    return data;
  }

  log(message: string, data?: unknown): void {
    this.logWithLevel(LogLevel.INFO, message, data);
  }

  private logWithLevel(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog()) return;

    const timestamp = new Date().toISOString();
    const sanitizedData = data ? this.sanitize(data) : undefined;
    const logEntry: Record<string, unknown> = {
      timestamp,
      level: LogLevel[level],
      context: this.context,
      message,
    };
    if (sanitizedData !== undefined) {
      logEntry.data = sanitizedData;
    }

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`[${this.context}]`, logEntry);
        break;
      case LogLevel.INFO:
        console.info(`[${this.context}]`, logEntry);
        break;
      case LogLevel.WARN:
        console.warn(`[${this.context}]`, logEntry);
        break;
      case LogLevel.ERROR:
        console.error(`[${this.context}]`, logEntry);
        break;
    }
  }

  debug(message: string, data?: unknown): void {
    this.logWithLevel(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: unknown): void {
    this.logWithLevel(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.logWithLevel(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error | unknown): void {
    const errorData =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error;
    this.logWithLevel(LogLevel.ERROR, message, errorData);
  }
}
