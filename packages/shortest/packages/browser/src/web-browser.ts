import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { WebBrowserDriver, WebPage } from "@shortest/driver";
import { urlSafe } from "@shortest/util";
import { Logger } from "../../logger/src/logger-service";
import { Browser } from "./browser";
import * as actions from "./deprecated_actions";
import { BrowserError } from "./exceptions";
import {
  BrowserActionOptions,
  BrowserActionResult,
  BrowserActions,
  BrowserAutomation,
  BrowserState,
} from "./interfaces";

export class WebBrowser extends Browser {
  private id: string;
  private driver: WebBrowserDriver | null = null;
  private state: DeepPartial<BrowserState>;
  private logger = Logger.getInstanse();

  constructor(driver: WebBrowserDriver) {
    super();
    this.id = randomUUID();
    this.driver = driver;
    this.state = {};
  }

  public getId(): string {
    return this.id;
  }

  async locateAt(
    x: number,
    y: number
  ): Promise<BrowserActionResult<BrowserActions.LocateAt>> {
    try {
      const element = await this.getNormalizedComponentStringByCoords(x, y);
      return {
        message: `Found element located at coordinates.`,
        payload: { element },
        metadata: { x, y },
      };
    } catch (errorIn: any) {
      const error = new BrowserError("Failed to locale.", {
        cause: errorIn,
        context: {
          x,
          y,
        },
      });
      this.logger.error(error);
      throw error;
    }
  }

  async navigate(
    url: string,
    options: BrowserActionOptions.Navigate = { shouldInitialize: true }
  ): Promise<BrowserActionResult<BrowserActions.Navigate>> {
    const NATIGATION_TIMEOUT_MS = 30000;
    const page = await this.getDriver().newPage();

    try {
      await page.goto(urlSafe(url), {
        timeout: NATIGATION_TIMEOUT_MS,
        // maybe wait for networkidle?
      });

      if (options?.shouldInitialize) {
        await this.initPage();
      }

      return {
        message: "Navigation successful.",
        metadata: {
          browserState: {
            window: {
              url: page.url(),
              title: await page.title(),
              size: {
                width: page.viewportSize()?.width ?? NaN,
                height: page.viewportSize()?.height ?? NaN,
              },
            },
          },
        },
      };
    } catch (errorIn: any) {
      const error = new BrowserError("Navigation failed.", {
        cause: errorIn,
        context: {
          url,
          options,
        },
      });
      this.logger.error(error);
      throw error;
    }
  }

  async screenshot(): Promise<BrowserActionResult<BrowserActions.Screenshot>> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputDir = join(process.cwd(), ".shortest", "screenshots");
    const filePath = join(outputDir, `screenshot-${timestamp}.png`);

    try {
      const page = this.getCurrentPage();
      if (!page) {
        throw new Error("No page found.");
      }
      const buffer = await page.screenshot({
        type: "jpeg",
        quality: 50,
        scale: "device",
        fullPage: false,
      });

      writeFileSync(filePath, buffer);

      return {
        message: `Screenshot taken`,
        payload: { base64Image: buffer.toString("base64") },
        metadata: {
          browserState: (await this.getState()).payload?.state,
        },
      };
    } catch (errorIn: any) {
      const error = new BrowserError("Screenshot failed.", {
        cause: errorIn,
      });
      this.logger.error(error);
      throw error;
    }
  }

  async getState(): Promise<BrowserActionResult<BrowserActions.GetState>> {
    const page = this.getCurrentPage();
    const state: BrowserActions.GetState["state"] = {
      window: {
        url: page?.url() ?? "unknown",
        size: {
          width: page?.viewportSize()?.width ?? NaN,
          height: page?.viewportSize()?.height ?? NaN,
        },
      },
      cursor: {
        position: {
          x: 0,
          y: 0,
        },
      },
    };

    try {
      state.window!.title = (await page?.title()) ?? "unknown";

      // wait for page to be stable and set cursor state
      await this.waitForStableDOM();
      if (page) {
        const position = await actions.getCursorPosition(page);
        state.cursor = {
          position: {
            x: position[0],
            y: position[1],
          },
        };
      }

      return {
        message: "State retrieved.",
        payload: {
          state,
        },
      };
    } catch (errorIn: any) {
      const error = new BrowserError("Failed to retrieve state.", {
        cause: errorIn,
      });
      this.logger.error(error);
      throw error;
    }
  }

  async drag(
    x: number,
    y: number
  ): Promise<BrowserActionResult<BrowserActions.Drag>> {
    try {
      if (!x || !y) {
        throw new Error("No coordinates provided.");
      }
      const page = this.getCurrentPage();
      if (!page) {
        throw new Error("No page found.");
      }

      await actions.dragMouse(page, x, y);

      return {
        message: "Element dragged.",
        payload: {},
        metadata: {
          x,
          y,
        },
      };
    } catch (errorIn: any) {
      const error = new BrowserError("Failed to drag.", {
        cause: errorIn,
        context: {
          x,
          y,
        },
      });
      this.logger.error(error);
      throw error;
    }
  }

  async click(
    x: number | null,
    y: number | null
  ): Promise<BrowserActionResult<BrowserActions.Click>> {
    try {
      const page = this.getCurrentPage();
      if (!page) {
        throw new Error("No page found.");
      }

      if (!x || !y) {
        x = this.state?.cursor?.position?.x ?? 0;
        y = this.state?.cursor?.position?.y ?? 0;
        this.logger.log({
          message: `No coordinates provided. Using last remembered cursor position ${x} ${y}`,
          level: "WARN",
        });
      }

      await actions.click(page, x, y);
      const newPage = this.getCurrentPage();
      if (!newPage) {
        throw new Error("No page found.");
      }
      let metadata;
      try {
        await page.waitForTimeout(500);
        metadata = await this.getState();
      } catch {
        // fallthrough
      }
      return {
        message: `Mouse clicked at (${x}, ${y})`,
        metadata,
      };
    } catch (errorIn: any) {
      const error = new BrowserError("Failed to click:", {
        cause: errorIn,
      });
      this.logger.error(error);
      throw error;
    }
  }

  async pressKey(
    keys: string[]
  ): Promise<BrowserActionResult<BrowserActions.PressKey>> {
    try {
      if (!keys.length) {
        throw new Error("Key required for pressKey action");
      }
      const singleKey = keys.length === 1;

      const page = this.getCurrentPage();
      if (!page) {
        throw new Error("No page found.");
      }
      await page.waitForTimeout(100);

      if (singleKey) {
        await page.keyboard.press(keys[0]);
      } else {
        await page.keyboard.down(keys[0]);
        await page.keyboard.press(keys[1]);
        await page.keyboard.up(keys[0]);
      }

      await page.waitForTimeout(100);
      return {
        message: `Pressed key: ${keys.join("+")}`,
      };
    } catch (errorIn: any) {
      const error = new BrowserError("Failed to press key.", {
        cause: errorIn,
        context: { keys },
      });
      this.logger.error(error);
      throw error;
    }
  }

  async moveCursor(
    x: number,
    y: number
  ): Promise<BrowserActionResult<BrowserActions.MoveCursor>> {
    try {
      const page = this.getCurrentPage();
      if (!page) {
        throw new Error("No page found.");
      }
      if (!x || !y) {
        throw new Error("Coordinates required for mouse_move");
      }
      await actions.mouseMove(page, x, y);
      this.state = {
        ...this.state,
        cursor: {
          position: {
            x,
            y,
          },
        },
      };
      return {
        message: `Cursor moved to ${x} ${y}.`,
      };
    } catch (errorIn: any) {
      const error = new BrowserError("Failed to move cursor.", {
        cause: errorIn,
        context: { x, y },
      });
      this.logger.error(error);
      throw error;
    }
  }

  async type(text: string): Promise<BrowserActionResult<BrowserActions.Type>> {
    try {
      if (!text) {
        throw new Error("Text required for type action");
      }

      const page = this.getCurrentPage();
      if (!page) {
        throw new Error("No page found.");
      }
      await page.waitForTimeout(100);
      await page.keyboard.type(text);
      await page.waitForTimeout(100);

      return {
        message: `Typed: ${text}`,
      };
    } catch (errorIn: any) {
      const error = new BrowserError("Failed to move cursor.", {
        cause: errorIn,
        context: { text },
      });
      this.logger.error(error);
      throw error;
    }
  }

  async sleep(
    ms: number | null
  ): Promise<BrowserActionResult<BrowserActions.Sleep>> {
    try {
      const DEFAULT_SLEEP_DURATION_MS = 1000;
      const DEFAULT_SLEEP_MAX_DURATION_MS = 60000;

      let duration = ms ?? DEFAULT_SLEEP_DURATION_MS;

      if (duration > DEFAULT_SLEEP_MAX_DURATION_MS) {
        this.logger.log({
          message: `Requested sleep duration ${duration}ms exceeds maximum of ${DEFAULT_SLEEP_MAX_DURATION_MS}ms. Using maximum.`,
          level: "WARN",
        });
        duration = DEFAULT_SLEEP_MAX_DURATION_MS;
      }

      const seconds = Math.round(duration / 1000);
      this.logger.log({
        message: `⏳ Waiting for ${seconds} second${seconds !== 1 ? "s" : ""}...`,
        level: "INFO",
      });

      const page = this.getCurrentPage();
      if (!page) {
        throw new Error("No page found.");
      }
      await page.waitForTimeout(duration);
      return {
        message: `Slept for ${seconds} second${seconds !== 1 ? "s" : ""}.`,
      };
    } catch (errorIn: any) {
      const error = new BrowserError("Failed to sleep.", {
        cause: errorIn,
      });
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Cleans up the browser by clearing cookies, local storage, session storage,
   * and indexedDB. It also resets permissions, navigates pages to `about:blank`,
   * and closes any remaining open pages to ensure a clean state.
   */
  async cleanup(): Promise<BrowserActionResult<BrowserActions.Cleanup>> {
    try {
      await Promise.all([
        this.getDriver().clearCookies(),
        this.getDriver()
          .pages()
          .map((page) =>
            page.evaluate(() => {
              localStorage.clear();
              sessionStorage.clear();
              indexedDB.deleteDatabase("shortest");
            })
          ),
        this.getDriver().clearPermissions(),
      ]);

      await Promise.all(
        this.getDriver()
          .pages()
          .map((page) => page.goto("about:blank"))
      );

      const pages = this.getDriver().pages();
      if (pages.length > 1) {
        await Promise.all(pages.slice(1).map((page) => page.close()));
      }

      return {
        message: "Successfully cleanup current Browser",
      };
    } catch (errorIn: any) {
      const error = new BrowserError("Failed to cleanup.", {
        cause: errorIn,
      });
      this.logger.error(error);
      throw error;
    }
  }

  async runAutomation(
    automation: BrowserAutomation,
    options: BrowserActionOptions.Automation
  ): Promise<BrowserActionResult<BrowserActions.Automation>> {
    try {
      const automationName = automation.constructor.name;
      const result = await automation.execute(this, options);

      return {
        message: result.success
          ? `${automationName} automation was successfully completed`
          : `${automationName} automation failed: ${result.reason || "unknown error"}`,
        payload: {
          reason: result.reason,
        },
        metadata: {
          browserState: (await this.getState()).payload?.state,
        },
      };
    } catch (errorIn: any) {
      const error = new BrowserError("Failed to run automation.", {
        cause: errorIn,
      });
      this.logger.error(error);
      throw error;
    }
  }

  async runCallback(): Promise<BrowserActionResult<BrowserActions.Callback>> {
    throw new Error("IMPLEMENT ME");
  }

  async destroy(): Promise<void> {
    try {
      await this.getDriver().close();
      this.driver = null;
    } catch (errorIn: any) {
      const error = new BrowserError("Failed to destroy browser.", {
        cause: errorIn,
      });
      this.logger.error(error);
      throw error;
    }
  }

  public getDriver(): WebBrowserDriver {
    try {
      if (!this.driver) {
        throw new Error("Driver not initialized.");
      }
      return this.driver;
    } catch (errorIn: any) {
      const error = new BrowserError("Failed to get driver.", {
        cause: errorIn,
      });
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Returns the current active page in the browser context.
   * @returns The current page or null if no page is found.
   */
  getCurrentPage(): WebPage | null {
    try {
      const pages = this.getDriver().pages();
      return pages.length > 0 ? pages[pages.length - 1] : null;
    } catch (errorIn: any) {
      const error = new BrowserError("Failed to get current page.", {
        cause: errorIn,
      });
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Retrieves normalized component string by X and Y coordinates
   * This is primarily used to determine change in UI
   * Playwright currently does not support such functionality
   * @see https://github.com/microsoft/playwright/issues/13273
   */
  async getNormalizedComponentStringByCoords(x: number, y: number) {
    try {
      const page = this.getCurrentPage();
      if (!page) {
        throw new Error("No page found");
      }

      return await page.evaluate(
        ({ x, y, allowedAttr }) => {
          const elem = document.elementFromPoint(x, y);
          if (elem) {
            // todo: test func below
            const clone = elem.cloneNode(true) as HTMLElement;

            /**
             * Gets deepest nested child node
             * If several nodes are on the same depth, the first node would be returned
             */
            function getDeepestChildNode(element: Element): HTMLElement {
              let deepestChild = element.cloneNode(true) as HTMLElement;
              let maxDepth = 0;

              function traverse(node: any, depth: number) {
                if (depth > maxDepth) {
                  maxDepth = depth;
                  deepestChild = node;
                }

                Array.from(node.children).forEach((child) => {
                  traverse(child, depth + 1);
                });
              }

              traverse(deepestChild, 0);
              return deepestChild;
            }

            const deepestNode = getDeepestChildNode(clone);

            // get several parents if present
            const node = deepestNode.parentElement
              ? deepestNode.parentElement.parentElement
                ? deepestNode.parentElement.parentElement
                : deepestNode.parentElement
              : deepestNode;

            /**
             * Recursively delete attributes from Nodes
             */
            function cleanAttributesRecursively(
              element: Element,
              options: { exceptions: string[] }
            ) {
              Array.from(element.attributes).forEach((attr) => {
                if (!options.exceptions.includes(attr.name)) {
                  element.removeAttribute(attr.name);
                }
              });

              Array.from(element.children).forEach((child) => {
                cleanAttributesRecursively(child, options);
              });
            }

            cleanAttributesRecursively(node, {
              exceptions: allowedAttr,
            });

            // trim and remove white spaces
            return node.outerHTML.trim().replace(/\s+/g, " ");
          } else {
            return "";
          }
        },
        {
          x,
          y,
          allowedAttr: [
            "type",
            "name",
            "placeholder",
            "aria-label",
            "role",
            "title",
            "alt",
            "d", // for <path> tags
          ],
        }
      );
    } catch (errorIn: any) {
      const error = new BrowserError(
        "Failed to get normalized component string by coords.",
        {
          cause: errorIn,
          context: {
            x,
            y,
          },
        }
      );
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Waits for DOM to stabilize
   * DOM is considered stabilized when:
   * - DOMContentLoaded is fired
   * - No mutations are detected for 1 second (e.g new elements such as modals, popups, etc.)
   */
  public async waitForStableDOM(): Promise<void> {
    const page = this.getCurrentPage();
    if (!page) {
      throw new Error("No page found.");
    }
    try {
      await this.waitForDOMContentLoaded();
      page.evaluate(() => {
        return new Promise<void>((resolve) => {
          const createTimeout = () => {
            return setTimeout(() => {
              resolve();
              observer.disconnect();
            }, 1000);
          };

          let timeout = createTimeout();

          const observer = new MutationObserver(() => {
            clearTimeout(timeout);
            timeout = createTimeout();
          });

          observer.observe(window.document.body, {
            childList: true,
            subtree: true,
          });
        });
      });
    } catch (errorIn: any) {
      const error = new BrowserError("Failed to wait for stable DOM.", {
        cause: errorIn,
      });
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * DOM is considered loaded when DOMContentLoaded is fired
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event
   */
  private async waitForDOMContentLoaded(
    options: { timeout: number } = { timeout: 1000 }
  ): Promise<void> {
    const page = this.getCurrentPage();
    if (!page) {
      throw new Error("No page found.");
    }
    let timeoutHandle: NodeJS.Timeout;

    try {
      const timeoutPromise = new Promise<void>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(
            new Error(
              `Timed out after ${options.timeout}ms waiting for the DOM to stabilize.`
            )
          );
        }, options.timeout);
      });

      await Promise.race([
        page.waitForLoadState("domcontentloaded", {
          timeout: options.timeout,
        }),
        page.waitForSelector("body"),
        timeoutPromise,
      ]);
    } catch (errorIn: any) {
      const error = new BrowserError(
        "Failed to wait for DOM content to load.",
        {
          cause: errorIn,
        }
      );
      this.logger.error(error);
      throw error;
    } finally {
      clearTimeout(timeoutHandle!);
    }
  }

  private async initPage(): Promise<void> {
    const page = this.getCurrentPage();
    if (!page) {
      throw new Error("No page found.");
    }

    const initWithRetry = async () => {
      for (let i = 0; i < 3; i++) {
        try {
          await actions.initializeCursor(page);
          break;
        } catch (error) {
          this.logger.log({
            message: `Retry ${i + 1}/3: Cursor initialization failed, retrying...:`,
            level: "WARN",
            context: {
              error,
            },
          });
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    };

    await initWithRetry();

    page.on("load", async () => {
      await initWithRetry();
    });
  }
}
