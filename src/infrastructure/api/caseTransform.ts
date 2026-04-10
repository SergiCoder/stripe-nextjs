export function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);
}

export function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
}

export function keysToSnake<T extends object>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[toSnakeCase(k)] = v;
  }
  return out;
}

export function keysToCamel<T>(obj: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[toCamelCase(k)] = v;
  }
  return out as T;
}

/**
 * Convert a raw API object's top-level keys to camelCase and, when a nested
 * `price` object is present, convert its keys as well.  Covers Plan, Product,
 * and Subscription responses that embed a price sub-object.
 */
export function keysToCamelWithPrice<T>(raw: Record<string, unknown>): T {
  const result = keysToCamel<T>(raw);
  if (raw.price && typeof raw.price === "object") {
    (result as Record<string, unknown>).price = keysToCamel(
      raw.price as Record<string, unknown>,
    );
  }
  return result;
}
