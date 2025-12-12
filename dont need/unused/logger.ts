/**
 * Centralized logging utility
 * 
 * Use this instead of console.log for better error tracking and debugging.
 * In production, this can be connected to services like Sentry, LogRocket, etc.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogOptions {
  context?: string
  metadata?: Record<string, unknown>
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const timestamp = new Date().toISOString()
    const context = options?.context ? `[${options.context}]` : ''
    return `[${timestamp}] ${level.toUpperCase()} ${context} ${message}`
  }

  info(message: string, options?: LogOptions): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, options), options?.metadata || '')
    }
  }

  warn(message: string, options?: LogOptions): void {
    console.warn(this.formatMessage('warn', message, options), options?.metadata || '')
  }

  error(message: string, error?: unknown, options?: LogOptions): void {
    console.error(this.formatMessage('error', message, options), error, options?.metadata || '')
    
    // In production, send to error tracking service
    if (!this.isDevelopment && typeof window !== 'undefined') {
      // TODO: Send to Sentry or similar service
      // Sentry.captureException(error, { extra: options?.metadata })
    }
  }

  debug(message: string, options?: LogOptions): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, options), options?.metadata || '')
    }
  }
}

export const logger = new Logger()
