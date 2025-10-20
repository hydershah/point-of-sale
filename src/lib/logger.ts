/**
 * Structured Logging System
 *
 * Provides consistent, structured logging throughout the application
 * with support for different log levels and optional external services (Sentry, DataDog, etc.)
 */

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

interface LogContext {
  [key: string]: unknown
  userId?: string
  tenantId?: string
  requestId?: string
  ip?: string
  userAgent?: string
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
    cause?: unknown
  }
}

class Logger {
  private minLevel: LogLevel

  constructor() {
    // Set minimum log level from environment
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel
    this.minLevel = envLevel || (process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG)
  }

  /**
   * Determines if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG]
    return levels.indexOf(level) <= levels.indexOf(this.minLevel)
  }

  /**
   * Formats a log entry for output
   */
  private formatLog(entry: LogEntry): string {
    if (process.env.NODE_ENV === "production") {
      // JSON format for production (easy to parse by log aggregators)
      return JSON.stringify(entry)
    } else {
      // Human-readable format for development
      const emoji = {
        [LogLevel.ERROR]: "❌",
        [LogLevel.WARN]: "⚠️ ",
        [LogLevel.INFO]: "ℹ️ ",
        [LogLevel.DEBUG]: "🔍",
      }[entry.level]

      let output = `${emoji} [${entry.level.toUpperCase()}] ${entry.message}`

      if (entry.context && Object.keys(entry.context).length > 0) {
        output += `\n   Context: ${JSON.stringify(entry.context, null, 2)}`
      }

      if (entry.error) {
        output += `\n   Error: ${entry.error.name}: ${entry.error.message}`
        if (entry.error.stack) {
          output += `\n   Stack: ${entry.error.stack}`
        }
      }

      return output
    }
  }

  /**
   * Creates a log entry
   */
  private createLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    }

    if (context) {
      entry.context = context
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      }
    }

    return entry
  }

  /**
   * Sends log to external services (Sentry, DataDog, etc.)
   */
  private async sendToExternalServices(entry: LogEntry): Promise<void> {
    // Only send errors and warnings to external services
    if (entry.level !== LogLevel.ERROR && entry.level !== LogLevel.WARN) {
      return
    }

    // TODO: Implement Sentry integration
    // if (process.env.SENTRY_DSN && entry.error) {
    //   Sentry.captureException(entry.error, {
    //     contexts: { custom: entry.context },
    //   })
    // }
  }

  /**
   * Logs a message at the specified level
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry = this.createLogEntry(level, message, context, error)
    const formatted = this.formatLog(entry)

    // Output to console
    switch (level) {
      case LogLevel.ERROR:
        console.error(formatted)
        break
      case LogLevel.WARN:
        console.warn(formatted)
        break
      case LogLevel.INFO:
        console.info(formatted)
        break
      case LogLevel.DEBUG:
        console.debug(formatted)
        break
    }

    // Send to external services asynchronously
    this.sendToExternalServices(entry).catch(err => {
      console.error("Failed to send log to external service:", err)
    })
  }

  /**
   * Log an error
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * Log an informational message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * Log an API request
   */
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${path}`, context)
  }

  /**
   * Log an API response
   */
  apiResponse(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
    this.log(level, `API Response: ${method} ${path} - ${statusCode} (${duration}ms)`, context)
  }

  /**
   * Log a database query (for debugging slow queries)
   */
  dbQuery(query: string, duration: number, context?: LogContext): void {
    if (duration > 1000) {
      this.warn(`Slow DB Query (${duration}ms): ${query}`, context)
    } else {
      this.debug(`DB Query (${duration}ms): ${query}`, context)
    }
  }

  /**
   * Log an authentication event
   */
  authEvent(event: string, userId?: string, success: boolean = true, context?: LogContext): void {
    const level = success ? LogLevel.INFO : LogLevel.WARN
    this.log(level, `Auth Event: ${event}`, { ...context, userId, success })
  }

  /**
   * Log a security event
   */
  securityEvent(event: string, severity: "low" | "medium" | "high" | "critical", context?: LogContext): void {
    const level = severity === "critical" || severity === "high" ? LogLevel.ERROR : LogLevel.WARN
    this.log(level, `Security Event: ${event}`, { ...context, severity })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export helper function for error logging with automatic error extraction
export function logError(message: string, error: unknown, context?: LogContext): void {
  if (error instanceof Error) {
    logger.error(message, error, context)
  } else {
    logger.error(message, new Error(String(error)), context)
  }
}
