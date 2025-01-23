import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Ensures that the necessary directories exist for storing screenshots.
 * If the directories do not exist, they are created.
 */
export function ensureDirs() {
  const screenshotsDir = join(process.cwd(), ".shortest", "screenshots");
  if (!existsSync(screenshotsDir)) {
    mkdirSync(screenshotsDir, { recursive: true });
  }
}
