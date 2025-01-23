import pc from "picocolors";
import { DriverFactory } from "@shortest/driver";

async function testBrowser() {
  const driver = await DriverFactory.getInstance({
    platform: "web",
  });

  await driver.launch();
  const browser = await driver.createBrowser();

  try {
    // Navigate to the specified page
    await browser.navigate("http://localhost:3000");
    const page = browser.getCurrentPage();

    if (!page) throw new Error("Page not found");

    // Locate the "Sign in" element and get its bounding box
    const signInElement = page.locator('text="Sign in"').first();
    const boundingBox = await signInElement.boundingBox();

    if (!boundingBox) {
      throw new Error("Could not find 'Sign in' element");
    }

    // Calculate the center coordinates of the "Sign in" element
    const x = Math.round(boundingBox.x + boundingBox.width / 2);
    const y = Math.round(boundingBox.y + boundingBox.height / 2);

    console.log(pc.cyan(`Sign in button coordinates: (${x}, ${y})`));

    // Test sequence starts here
    console.log(pc.cyan("\nTesting Mouse Movements and Clicks:"));

    // Move the cursor to the "Sign in" button
    console.log(pc.cyan(`Test 1: Moving to Sign in button at (${x}, ${y})`));
    const moveResult = await browser.moveCursor(x, y);
    console.log(pc.yellow("Mouse Move Result:"), moveResult);
    console.log(pc.yellow("Metadata:"), moveResult.metadata);
    await new Promise((r) => setTimeout(r, 1000));

    // Take a screenshot to verify the cursor position
    console.log(
      pc.cyan("\nTest 2: Taking screenshot to verify cursor position")
    );
    const screenshotResult = await browser.screenshot();
    console.log(pc.yellow("Screenshot Result:"), screenshotResult);
    console.log(pc.yellow("Metadata:"), screenshotResult.metadata);

    // Click the "Sign in" button at the current position
    console.log(pc.cyan("\nTest 3: Clicking at the current position"));
    const clickResult = await browser.click(x, y);
    console.log(pc.yellow("Click Result:"), clickResult);
    console.log(pc.yellow("Metadata:"), clickResult.metadata);
    await new Promise((r) => setTimeout(r, 1000));

    // Take a final screenshot after the click action
    console.log(pc.cyan("\nTest 4: Taking final screenshot after click"));
    const finalResult = await browser.screenshot();
    console.log(pc.yellow("Final Screenshot Result:"), finalResult);
    console.log(pc.yellow("Metadata:"), finalResult.metadata);

    console.log(pc.green("\nAll coordinate tests completed successfully"));
  } catch (error) {
    console.error(pc.red("Test failed:"), error);
  } finally {
    // Cleanup browser instance after the tests
    console.log(pc.cyan("\nCleaning up..."));
    await browser.destroy();
  }
}

console.log(pc.cyan("Mouse Coordinate Test"));
console.log(pc.cyan("====================="));
testBrowser().catch(console.error);
