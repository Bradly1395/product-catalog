import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "catalog_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSigningSecret(): Uint8Array | null {
  const rawSecret =
    process.env.SESSION_SECRET?.trim() ||
    (process.env.ADMIN_PASSWORD?.trim()
      ? `catalog-session-key::${process.env.ADMIN_PASSWORD.trim()}`
      : "");

  if (!rawSecret) {
    return null;
  }

  return new TextEncoder().encode(rawSecret);
}

export async function signAdminSessionToken(): Promise<string> {
  const secret = getSigningSecret();
  if (!secret) {
    throw new Error(
      "Missing SESSION_SECRET or ADMIN_PASSWORD environment variable."
    );
  }

  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret);
}

export async function verifyAdminSessionToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  const secret = getSigningSecret();
  if (!secret) return false;

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    return payload.role === "admin";
  } catch {
    return false;
  }
}
