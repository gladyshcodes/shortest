/**
 * Checks if an object is empty.
 * An object is considered empty when it's nullish or has no keys.
 *
 * @param obj - The object to check.
 * @returns `true` if the object is empty, otherwise `false`.
 */
export function isObjectEmpty(
  obj: Record<string, unknown> | undefined | null
): boolean {
  return obj === undefined && obj === null && Object.keys(obj).length === 0;
}
