import path from "node:path";
import fs from "node:fs";
import { detect, resolveCommand } from "package-manager-detector";
import { Browser, AndroidBrowser } from "@shortest/browser";
import { Driver } from "./driver";
import {
  CoreDriverConfig,
  CoreDriverForPlatform,
  DeviceInfo,
  MobileServer,
  PlatformType,
} from "./interfaces";
import {
  execAsync,
  getProjectRoot,
  isObjectEmpty,
  merge,
  retry,
} from "@shortest/util";
import pc from "picocolors";
import * as wdio from "webdriverio";
import appium from "appium";
import { SHORTEST_APPIUM_SERVER_PORT } from "./appium-config";

/**
 * Shortest driver for Android platforms
 */
// @ts-expect-error Implementation comming
export class UIAutomator2Driver extends Driver<CoreDriverForPlatform.Mobile> {
  private driver: CoreDriverForPlatform.Mobile | null = null;
  private server: MobileServer | null = null;
  private browsers: Map<string, Browser> = new Map();
  private deviceInfo!: DeviceInfo;

  private readonly metadata = { name: "uiautomator2", platform: "android" };
  private coreDriverConfig: CoreDriverConfig.Mobile | null = null;

  constructor(coreDriverConfig?: CoreDriverConfig.Mobile) {
    super();
    this.coreDriverConfig = coreDriverConfig ?? null;
  }

  public async init() {
    await this.assureAppiumDriversInstallation();
    await this.startServer();
    await retry(this.connect.bind(this), 2);
    await this.loadDeviceInfo();
    await this.launch();
  }

  private async connect(this: UIAutomator2Driver) {
    if (!this.driver) {
      this.driver = await wdio.remote(
        merge(
          {
            // @see https://webdriver.io/docs/configurationfile/
            capabilities: {
              platformName: this.metadata.platform,
              "appium:automationName": "UiAutomator2",
              "appium:noReset": true,
            },
            protocol: "http",
            logLevel: "error",
            hostname: "127.0.0.1",
            port: SHORTEST_APPIUM_SERVER_PORT,
            strictSSL: false,
          },
          this.coreDriverConfig || {}
        )
      );
    }
  }

  private async startServer() {
    if (this.server) throw new Error("Server is already running.");
    console.log("Starting Appium server...");
    this.server = await appium.main({
      useDrivers: [this.metadata.name],
      port: SHORTEST_APPIUM_SERVER_PORT,
      loglevel: "warn",
    });
    this.server.addListener("listening", () => {
      console.log("Server started.");
    });
  }

  private async assureAppiumDriversInstallation() {
    const SUPPORTED_UIAUTOMATOR2_DRIVER_VERSION = "3.9.9";
    const driverNpmName = `appium-uiautomator2-driver`;
    const projectRoot = getProjectRoot();
    console.log({ projectRoot });
    const packageJsonPath = path.join(projectRoot, "package.json");

    // Check if driver is already installed
    const packageJson = JSON.parse(
      await fs.promises.readFile(packageJsonPath, "utf8")
    );
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    if (dependencies[driverNpmName] || devDependencies[driverNpmName]) {
      console.log(`Driver ${driverNpmName} is already installed.`);
      return;
    }

    // Install driver
    const packageManager = await detect();
    if (!packageManager) throw new Error("No package manager detected.");

    const installUIAutomator2DriverCommand = resolveCommand(
      packageManager.agent,
      "add",
      [`${driverNpmName}@${SUPPORTED_UIAUTOMATOR2_DRIVER_VERSION}`, "-w"]
    );
    if (!installUIAutomator2DriverCommand)
      throw new Error("No such command found.");

    try {
      await execAsync(
        `${installUIAutomator2DriverCommand.command} ${installUIAutomator2DriverCommand.args.join(" ")}`,
        {
          cwd: projectRoot,
        }
      );
    } catch (error) {
      console.log("Failed to install driver.");
      throw error;
    }
  }

  private async loadDeviceInfo() {
    const viewport = await this.getDriver().getWindowRect();
    this.deviceInfo = {
      platform: this.metadata.platform as PlatformType,
      viewport: {
        width: viewport.width,
        height: viewport.height,
      },
    };
  }

  async launch(): Promise<void> {
    // await this.getDriver().launchApp();
    await this.getDriver().activateApp("com.gldn.mobileapp");
  }

  public async createBrowser(): Promise<Browser> {
    const browser = new AndroidBrowser(this.getDriver());
    this.browsers.set(browser.getId(), browser);
    return browser;
  }

  public async closeBrowser(id: string): Promise<void> {
    const browser = this.browsers.get(id);
    if (!browser) {
      throw new Error(`Browser session with ID ${id} not found.`);
    }

    await browser.destroy();
    this.browsers.delete(id);
    console.log(
      pc.green(`Browser session with ID "${id}" closed successfully.`)
    );
  }

  public getDriver(): CoreDriverForPlatform.Mobile {
    if (!this.driver) {
      throw new Error("Driver not initialized.");
    }
    return this.driver;
  }

  public getDeviceInfo(): DeviceInfo {
    if (isObjectEmpty(this.deviceInfo)) {
      throw new Error(
        "Device information not available. Ensure that init() is called first."
      );
    }

    return this.deviceInfo;
  }
}
