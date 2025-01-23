/* eslint-disable no-console-usage/main */

import { RuntimeError } from "@shortest/browser";
import { isObjectNotEmpty } from "@shortest/util";
import dotenv from "dotenv";
dotenv.config();
import { LoggerService, LogLine } from "./interfaces";

export class Logger implements LoggerService {
  private static instance: LoggerService;
  private constructor() {}
  private readonly CLIColors = {
    WARN: "\x1b[33m",
    SUCCESS: "\x1b[32m",
    INFO: "\x1b[34m",
    DEFAULT: "\x1b[0m",
    ERROR: "\x1b[31m",
  };

  public static getInstanse(): LoggerService {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  log(line: LogLine): void {
    console.log(
      `${this.CLIColors[line.level]}[${line.level}]${this.CLIColors.DEFAULT} ${line.message}`
    );
  }

  error(error: Error): void {
    // If error is not instance of Error class, log in in row format
    if (!(error instanceof Error)) {
      return console.error(error);
    }

    const informUsMessage = `
    ---
    Something went wrong.
    
    We apologize for the inconvenience! If you encounter this error, please report it on our GitHub issue tracker:
    https://github.com/anti-work/shortest/issues/new?template=bug.yml
    
    Your feedback helps us improve the product. Thank you for your support!
    ---
    `;

    const isDevelopment = process.env.NODE_ENV === "development";
    const isHandled = error instanceof RuntimeError;
    /** 
     * Warn if error is not instanse of RuntimeError
    /* If so, error is considered unhandled
    /* We should aim that all errors are handled appropriately
    */
    const severity = isHandled ? "[ERROR]" : "[UNHANDLED ERROR]";
    const cause = error.cause
      ? isHandled
        ? error.cause
        : `${new String().padEnd(10)}${error.cause}`
      : "";
    const stack = error.stack;
    const context = isObjectNotEmpty((error as RuntimeError).context)
      ? `Execution context: ${JSON.stringify((error as RuntimeError).context, null, 2)}`
      : "";
    // display the user-friendly message only if not in development mode
    const informUs = !isDevelopment ? informUsMessage : "";

    console.error(
      `${this.CLIColors.ERROR}${severity} ${error.message}
        ${cause}${this.CLIColors.DEFAULT}
        ${informUs}
        \n${stack}
        \n${context}`
    );
  }
}
