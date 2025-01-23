import { isObjectNotEmpty } from "@shortest/util";

interface RuntimeErrorOptions {
  /**
   * An optional underlying error that caused the runtime error.
   * This can be used to chain errors and provide more context for debugging.
   */
  cause?: Error;

  /**
   * Optional contextual information that may provide additional details
   * about the circumstances in which the error occurred.
   * This can help with debugging by providing relevant state or context.
   */
  context?: Record<string, unknown>;
}
export class RuntimeError extends Error {
  context?: Record<string, unknown>;

  constructor(message: string, options?: RuntimeErrorOptions) {
    super(message);

    this.name = this.constructor.name;
    if (isObjectNotEmpty(options?.context)) {
      this.context = options!.context!;
    }

    if (options?.cause) {
      this.cause = options.cause;
    }

    // ensures the stack trace is captured and points to where this custom error was created
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  cause?: Error;
}

export class BrowserError extends RuntimeError {
  constructor(message: string, options?: RuntimeErrorOptions) {
    super(message, options);
    this.name = "BROWSER_ERROR";
  }
}
