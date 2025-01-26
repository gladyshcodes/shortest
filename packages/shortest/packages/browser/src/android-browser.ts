import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { CoreDriverForPlatform } from "@shortest/driver";
import { Browser } from "./browser";
import {
  BrowserActionOptions,
  BrowserActionResult,
  BrowserActions,
  BrowserState,
  ScrollDirection,
} from "./interfaces";
import { ensureDirs } from "./utils/file-utils";
import {
  aspectRatioToDimensionsMap,
  getClaudeImageRecommendedAspectRatio,
  resizeToDimention,
} from "./utils/image-utils";

// @ts-expect-error not implemented fully yet
export class AndroidBrowser extends Browser {
  private id: string;
  private driver: CoreDriverForPlatform.Mobile | null = null;
  private state: DeepPartial<BrowserState>;

  constructor(driver: CoreDriverForPlatform.Mobile) {
    super();
    this.id = randomUUID();
    this.driver = driver;
    this.state = {};
    ensureDirs();
  }

  public getId() {
    return this.id;
  }

  async click(
    x: number | null,
    y: number | null
  ): Promise<BrowserActionResult<BrowserActions.Click>> {
    if (x === null || y === null || isNaN(x) || isNaN(y)) {
      x = this.state?.cursor?.position?.x ?? 0;
      y = this.state?.cursor?.position?.y ?? 0;
      console.warn(
        `No coordinates provided. Using last remembered cursor position ${x} ${y}`
      );
    }

    try {
      await this.getDriver().executeScript("mobile: clickGesture", [{ x, y }]);

      let metadata;
      try {
        metadata = await this.getState();
      } catch {
        // Fallthrough
      }

      return {
        message: `Tap performed at (${x}, ${y})`,
        metadata,
      };
    } catch (error) {
      throw new Error(`Failed to tap: ${error}`);
    }
  }

  async screenshot(): Promise<BrowserActionResult<BrowserActions.Screenshot>> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputDir = join(process.cwd(), ".shortest", "screenshots");
    const filePath = join(outputDir, `screenshot-${timestamp}.png`);
    const deviceViewport = __shortest__.driver!.getDeviceInfo().viewport;

    try {
      const screenshot = await this.getDriver().takeScreenshot();
      const AR = getClaudeImageRecommendedAspectRatio(deviceViewport);
      const dimentions = aspectRatioToDimensionsMap[AR];

      const screenshotOut = await resizeToDimention(
        Buffer.from(screenshot, "base64"),
        dimentions
      );

      writeFileSync(filePath, screenshotOut);

      return {
        message: `Screenshot taken`,
        payload: {
          base64Image: screenshotOut.toString("base64"),
        },
        metadata: {
          browserState: (await this.getState()).payload?.state,
        },
      };
    } catch (error) {
      throw new Error(`Screenshot failed: ${error}`);
    }
  }

  async type(
    text: string | null
  ): Promise<BrowserActionResult<BrowserActions.Type>> {
    if (!text || text.trim() === "") {
      throw new Error("No text provided to type.");
    }

    try {
      await this.getDriver().executeScript("mobile: type", [{ text }]);

      // Optionally, get the current state or metadata after typing
      let metadata;
      try {
        metadata = await this.getState();
      } catch {
        // Fallthrough
      }

      return {
        message: `Typed text: "${text}"`,
        metadata,
      };
    } catch (error) {
      throw new Error(`Failed to type: ${error}`);
    }
  }

  async scroll(
    directionIn: ScrollDirection
  ): Promise<BrowserActionResult<BrowserActions.Scroll>> {
    let direction;

    // Reverse direction
    switch (directionIn) {
      case "up":
        direction = "down";
        break;
      case "down":
        direction = "up";
        break;
      default:
        throw new Error(`Unknown scroll direction: ${direction}`);
    }

    try {
      await this.getDriver().executeScript("mobile: swipeGesture", [
        {
          direction,
          left: 200,
          top: 200,
          width: 200,
          height: 200,
          percent: 0.75,
        },
      ]);

      let metadata;
      try {
        metadata = await this.getState();
      } catch {
        // Fallthrough
      }

      return {
        message: `Scrolled ${direction}.`,
        metadata,
      };
    } catch (error) {
      throw new Error(`Failed to scroll: ${error}`);
    }
  }

  async sleep(
    ms: number | null
  ): Promise<BrowserActionResult<BrowserActions.Sleep>> {
    const DEFAULT_SLEEP_DURATION_MS = 1000;
    const DEFAULT_SLEEP_MAX_DURATION_MS = 60000;

    let duration = ms ?? DEFAULT_SLEEP_DURATION_MS;

    if (duration > DEFAULT_SLEEP_MAX_DURATION_MS) {
      console.warn(
        `Requested sleep duration ${duration}ms exceeds maximum of ${DEFAULT_SLEEP_MAX_DURATION_MS}ms. Using maximum.`
      );
      duration = DEFAULT_SLEEP_MAX_DURATION_MS;
    }

    const seconds = Math.round(duration / 1000);
    console.log(`Waiting for ${seconds} second${seconds !== 1 ? "s" : ""}...`);

    try {
      const driver = this.getDriver();
      await driver.pause(duration);
      return {
        message: `Slept for ${seconds} second${seconds !== 1 ? "s" : ""}.`,
      };
    } catch (error) {
      throw new Error(`Failed to sleep: ${error}`);
    }
  }

  public getState(): Promise<BrowserActionResult<BrowserActions.GetState>> {
    return Promise.resolve({
      message: "State received.",
      payload: undefined, // No state for mobile currently
    });
  }

  public async destroy(): Promise<void> {
    if (this.getDriver()) {
      await this.getDriver().deleteSession();
      this.driver = null;
    } else {
      console.warn("No driver to destroy.");
    }
  }

  public getDriver(): CoreDriverForPlatform.Mobile {
    if (!this.driver) {
      throw new Error("Driver not initialized.");
    }
    return this.driver;
  }

  // NOTE This method should never be called on mobile
  public async navigate(
    _url: string,
    _options: BrowserActionOptions.Navigate
  ): Promise<BrowserActionResult<BrowserActions.Navigate>> {
    return new Promise((resolve) =>
      resolve({
        message: "Navigate action is not supported on mobile",
      })
    );
  }

  // NOTE This method should never be called on mobile
  async locateAt(
    _x: number,
    _y: number
  ): Promise<BrowserActionResult<BrowserActions.LocateAt>> {
    return new Promise((resolve) =>
      resolve({
        message: "Locale actions is not supported on mobile.",
      })
    );
  }
}
