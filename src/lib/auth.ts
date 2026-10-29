const PBKDF2_ITERATIONS = 100_000;
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
  const binary = atob(padded);

  return Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  );
}

export async function hashPassword(
  password: string,
): Promise<string> {
  if (password.length < 12 || password.length > 256) {
    throw new Error("Password must contain 12–256 characters.");
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltBuffer = new ArrayBuffer(salt.length);
new Uint8Array(saltBuffer).set(salt);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );

  return [
    "pbkdf2-sha256",
    String(PBKDF2_ITERATIONS),
    toBase64Url(salt),
    toBase64Url(new Uint8Array(derivedBits)),
  ].join("$");
}


export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  let stage = "parse hash";

  try {
    const parts = storedHash.split("$");

    if (
      parts.length !== 4 ||
      parts[0] !== "pbkdf2-sha256" ||
      parts[1] !== String(PBKDF2_ITERATIONS)
    ) {
      return false;
    }

    const salt = fromBase64Url(parts[2]);
    const expectedHash = fromBase64Url(parts[3]);

    if (salt.length !== 16 || expectedHash.length !== 32) {
      return false;
    }

    stage = "import key";

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"],
    );

    const saltBuffer = new ArrayBuffer(salt.length);
    new Uint8Array(saltBuffer).set(salt);

    stage = "derive bits";

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      key,
      256,
    );

    const actualHash = new Uint8Array(derivedBits);

    let difference = 0;

    for (let index = 0; index < expectedHash.length; index++) {
      difference |= actualHash[index] ^ expectedHash[index];
    }

    return difference === 0;
  } catch (error) {
    console.error(
      `Password verification failed at ${stage}:`,
      error instanceof Error ? error.name : "Unknown error",
      error instanceof Error ? error.message : "",
    );

    return false;
  }
}
