const SESSION_DURATION_SECONDS = 8 * 60 * 60;

export type SessionUser = {
  id: string;
  email: string;
  role: "staff" | "admin";
};

type SessionPayload = SessionUser & {
  exp: number;
};

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  return Uint8Array.from(atob(padded), (character) =>
    character.charCodeAt(0),
  );
}
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function getSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(
  user: SessionUser,
  secret: string,
): Promise<string> {
  if (secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters.");
  }

  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };

  const encodedPayload = toBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );

  const key = await getSigningKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
toArrayBuffer(new TextEncoder().encode(encodedPayload)),  );

  return `${encodedPayload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<SessionUser | null> {
  try {
    if (secret.length < 32 || token.length > 4096) {
      return null;
    }

    const parts = token.split(".");
    if (parts.length !== 2) {
      return null;
    }

    const [encodedPayload, encodedSignature] = parts;
    const key = await getSigningKey(secret);

    const valid = await crypto.subtle.verify(
  "HMAC",
  key,
  toArrayBuffer(fromBase64Url(encodedSignature)),
  new TextEncoder().encode(encodedPayload),
);

    if (!valid) {
      return null;
    }

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(encodedPayload)),
    ) as SessionPayload;

    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      !["staff", "admin"].includes(payload.role) ||
      !Number.isInteger(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}