import fs from "node:fs";
import path from "node:path";
import { execAsync, sleep } from "@shortest/util";
import { resolveCommand, detect } from "package-manager-detector";
import { Platform, PlatformType } from "./interfaces";

const SUPPORTED_APPIUM_VERSION = "2.15.0";
const SUPPORTED_APPIUM_DOCTOR_VERSION = "1.16.2";
const SUPPORTED_UIAUTOMATOR2_DRIVER_VERSION = "3.9.9";
const SUPPORTED_XUITEST_DRIVER_VERSION = "8.1.0";

async function main(platform: PlatformType) {
  try {
    console.log("Setting up Shortest environment...");
    const packageManager = await detect();
    if (!packageManager) throw new Error("No package manager detected");

    const packageJsonPath = path.join(process.cwd(), "package.json");
    const projectRoot = path.dirname(packageJsonPath);

    if (!fs.existsSync(packageJsonPath))
      throw new Error(
        "This script should be run from the root of the project."
      );

    console.log("Running Appium Doctor...");
    const runDoctorCommand = resolveCommand(packageManager.agent, "execute", [
      `appium-doctor@${SUPPORTED_APPIUM_DOCTOR_VERSION}`,
    ]);
    if (!runDoctorCommand) throw new Error("No such command found.");

    const { output: doctorResult } = await execAsync(
      `${runDoctorCommand.command}`,
      runDoctorCommand.args,
      {
        cwd: projectRoot,
      }
    );
    console.log("Appium Doctor completed.");

    console.log("Checking Appium Doctor results...");
    checkAppiumDoctorForFailure(doctorResult);
    console.log("Appium Doctor check passed.");

    if (platform === Platform.Android) {
      console.log("Checking and installing UIAutomator2 Driver...");
      const installUIAutomator2DriverCommand = resolveCommand(
        packageManager.agent,
        "add",
        [
          `appium-uiautomator2-driver@${SUPPORTED_UIAUTOMATOR2_DRIVER_VERSION}`,
          "-w",
        ]
      );
      if (!installUIAutomator2DriverCommand)
        throw new Error("No such command found.");
      await execAsync(
        `${installUIAutomator2DriverCommand.command}`,
        installUIAutomator2DriverCommand.args,
        {
          cwd: projectRoot,
        }
      );
      console.log("UIAutomator2 Driver installed.");
    } else if (platform === Platform.Ios) {
      console.log("Checking and installing XCUITest Driver...");
      const installXCUITestDriverCommand = resolveCommand(
        packageManager.agent,
        "add",
        [`appium-xcuitest-driver@${SUPPORTED_XUITEST_DRIVER_VERSION}`, "-w"]
      );
      if (!installXCUITestDriverCommand)
        throw new Error("No such command found.");
      await execAsync(
        `${installXCUITestDriverCommand.command}`,
        installXCUITestDriverCommand.args,
        {
          cwd: projectRoot,
        }
      );
      console.log("XCUITest Driver installed.");
    }

    console.log("Assembling Appium run command...");
    const runAppiumCommand = resolveCommand(
      packageManager.agent,
      "execute-local",
      [`appium`]
    );
    if (!runAppiumCommand) throw new Error("No such command found.");

    console.log("Starting Appium server...");
    console.log(process.env);
    await execAsync(`${runAppiumCommand.command}`, runAppiumCommand.args, {
      cwd: projectRoot,
      detached: true,
    });
    console.log("Appium server started.");

    await sleep(5000);

    console.log("Appium setup is complete!");
  } catch (error: any) {
    console.error("Error during Appium setup:", error.message);
    process.exit(1);
  }
}

/**
 * Checks the output of the Appium Doctor command for any missing dependencies that need to be resolved.
 * If any missing dependencies are detected, an error is thrown.
 *
 * @param output The output string from the Appium Doctor command.
 */
const APPIUM_DOCTOR_MISSING_NECESSARY_DEPS_REGEX =
  /### Diagnostic for necessary dependencies completed, (\d+) fixes needed. ###/;
function checkAppiumDoctorForFailure(output: string) {
  if (output.match(APPIUM_DOCTOR_MISSING_NECESSARY_DEPS_REGEX)) {
    throw new Error(
      "Appium Doctor has detected missing dependencies. Please review the above output for more details."
    );
  }
}

export default main;
