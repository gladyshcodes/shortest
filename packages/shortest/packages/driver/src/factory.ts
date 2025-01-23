import { RuntimeError } from "packages/browser/src";
import { Logger } from "packages/logger/src/logger-service";
import { Driver } from "./driver";
import { CoreDriverForPlatform, DriverConfig } from "./interfaces";
import { UIAutomator2Driver } from "./uiautomator2-driver";
import { WebDriver } from "./web-driver";
import { XCUITestDriver } from "./xcuitest-driver";

export class DriverFactory {
  static async getInstance({
    platform,
    coreDriver,
  }: DriverConfig): Promise<
    Driver<CoreDriverForPlatform.Web | CoreDriverForPlatform.Mobile>
  > {
    const logger = Logger.getInstanse();
    logger.log({
      message: `Initializing driver for ${platform} platform`,
      level: "INFO",
    });
    try {
      switch (platform) {
        case "web":
          const webDriver = new WebDriver(coreDriver);
          logger.log({
            message: `Driver initialized`,
            level: "SUCCESS",
          });
          return webDriver;
        case "android":
          const androidDriver = new UIAutomator2Driver(coreDriver);
          await androidDriver.init();
          logger.log({
            message: `Driver initialized`,
            level: "SUCCESS",
          });
          return androidDriver;
        case "ios":
          const IOSDriver = new XCUITestDriver(coreDriver);
          logger.log({
            message: `Driver initialized`,
            level: "SUCCESS",
          });
          return IOSDriver;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (errorIn: any) {
      const error = new RuntimeError("Driver initialization failed.", {
        cause: errorIn,
      });
      logger.error(error);
      throw error;
    }
  }
}
