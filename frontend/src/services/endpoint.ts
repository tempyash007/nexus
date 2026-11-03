export const WEBHOOK_BASE_URL = "https://hooks.nexus.dev/in";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function randomId(length = 12): string {
  let out = "";
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function buildEndpoint(slug: string): string {
  return `${WEBHOOK_BASE_URL}/${slug}`;
}

/** Generates a unique slug that is not in `taken`. */
export function generateSlug(taken: Iterable<string> = []): string {
  const used = new Set(taken);
  let slug = randomId(12);
  while (used.has(slug)) slug = randomId(12);
  return slug;
}
