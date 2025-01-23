import { execSync } from "child_process";
import { Browser, WebBrowser } from "@shortest/browser";
import { getInstallationCommand } from "@shortest/util";
import * as pw from "playwright";
import { Logger } from "../../logger/src/logger-service";
import { Driver } from "./driver";
import {
  CoreDriverConfig,
  CoreDriverForPlatform,
  Platform,
} from "./interfaces";

export class WebDriver extends Driver<CoreDriverForPlatform[Platform.Web]> {
  private coreDriverConfig: CoreDriverConfig.Web | null = null;
  private driver: CoreDriverForPlatform.Web | null = null;
  private browsers: Map<string, Browser> = new Map();
  private logger = Logger.getInstanse();

  constructor(coreDriverConfig?: CoreDriverConfig.Web) {
    super();
    this.coreDriverConfig = coreDriverConfig ?? null;
  }

  async launch() {
    try {
      await this.launchChromium();
    } catch (error) {
      const coreDriverMissingError =
        error instanceof Error &&
        error.message.includes("Executable doesn't exist");
      if (coreDriverMissingError) {
        await this.installCoreDriver();
        await this.launchChromium();
      } else {
        throw error;
      }
    }
  }

  async createBrowser(): Promise<Browser> {
    const context = await this.getDriver().newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const browser = new WebBrowser(context);
    this.browsers.set(browser.getId(), browser);
    this.logger.log({
      message: `Browser session with ID ${browser.getId()} created successfully.`,
      level: "INFO",
    });
    return browser;
  }

  async closeBrowser(id: string): Promise<void> {
    const browser = this.browsers.get(id);
    if (!browser) {
      throw new Error(`Browser session with ID ${id} not found.`);
    }

    await browser.destroy();
    this.browsers.delete(id);
    this.logger.log({
      message: `Browser session with ID ${id} closed successfully.`,
      level: "INFO",
    });
  }

  async destroy(): Promise<void> {
    await this.getDriver().close();
    this.driver = null;
  }

  public getDriver(): CoreDriverForPlatform.Web {
    if (!this.driver) {
      throw new Error("Driver not initialized.");
    }
    return this.driver;
  }

  private async installCoreDriver() {
    this.logger.log({
      message: "Installing Playwright browser...",
      level: "INFO",
    });

    const installationCommand = await getInstallationCommand();

    execSync(installationCommand, { stdio: "inherit" });
    this.logger.log({
      message: "✓ Playwright browser installed",
      level: "SUCCESS",
    });
  }

  private async launchChromium() {
    this.driver = await pw.chromium.launch({
      headless: __shortest__.config?.headless ?? false,
      ...this.coreDriverConfig,
    });
  }
}
