import { isPerson, OWNER, type PersonKey } from "./people";

// Everyone else's cookie is just their key: it only picks whose list and hotel to
// show. The owner's carries an HMAC, because that cookie is what unlocks editing.
// The PIN is part of what gets signed, so changing OWNER_PIN signs out every phone
// that entered the old one. Web Crypto rather than node:crypto, so proxy.ts can use
// this wherever it runs.
const encoder = new TextEncoder();

async function ownerSignature(): Promise<string | null> {
  const secret = process.env.SESSION_SECRET, pin = process.env.OWNER_PIN;
  if (!secret || !pin) return null;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`${OWNER}:${pin}`)));
  return btoa(String.fromCharCode(...mac)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const sameText = (a: string, b: string) => a.length === b.length && [...a].reduce((diff, char, i) => diff | (char.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;

export async function ownerCookieValue(): Promise<string | null> {
  const signature = await ownerSignature();
  return signature ? `${OWNER}.${signature}` : null;
}

export async function personFromCookie(value: string | undefined): Promise<PersonKey | null> {
  if (!value) return null;
  if (isPerson(value)) return value === OWNER ? null : value;
  const [key, signature] = value.split(".");
  if (key !== OWNER || !signature) return null;
  const expected = await ownerSignature();
  return expected && sameText(signature, expected) ? OWNER : null;
}
