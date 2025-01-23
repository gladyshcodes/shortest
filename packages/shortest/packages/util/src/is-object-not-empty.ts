/**
 * Checks if an object is not empty and not undefined or null.
 *
 * @param obj - The object to check.
 * @returns `true` if the object is not empty, otherwise `false`.
 */
export function isObjectNotEmpty(
  obj: Record<string, unknown> | undefined | null
): boolean {
  return obj !== undefined && obj !== null && Object.keys(obj).length > 0;
}
