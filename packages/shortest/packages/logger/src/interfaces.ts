/**
 * Represents the available log levels for the application.
 * - "WARN": Used for non-critical warnings.
 * - "INFO": Used for informational messages that do not indicate a problem (console.log analog).
 * - "SUCCESS": Used for success confirmations or milestones.
 */
type LogLevel = "WARN" | "INFO" | "SUCCESS";

export interface LogLine {
  /**
   * The severity or importance of the log (e.g., WARN, INFO, SUCCESS).
   */
  level: LogLevel;

  /**
   * A human-readable message describing the event being logged.
   */
  message: string;

  /**
   * Optional contextual information to provide additional details for debugging.
   */
  context?: Record<string, unknown>;
}

export interface LoggerService {
  /**
   * Logs a structured message to the console or external systems.
   * @param line The structured log object containing level, message, and optional context.
   */
  log(line: LogLine): void;

  /**
   * Handles and logs an error, including optional context or stack trace.
   * @param error The error to be logged. Should ideally extend RuntimeError for detailed handling.
   */
  error(error: Error): void;
}
