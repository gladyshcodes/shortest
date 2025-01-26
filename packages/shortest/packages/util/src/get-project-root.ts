import path from "node:path";

/**
 * This function returns the path to the project root
 * It assumes that the root directory contains the `package.json` file
 */
export function getProjectRoot() {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  return path.dirname(packageJsonPath);
}
