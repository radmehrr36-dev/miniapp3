import crypto from "crypto";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export interface VerifiedInitData {
  ok: boolean;
  user?: TelegramUser;
  authDate?: number;
  error?: string;
}

/**
 * Validates Telegram Mini App `initData` using the official algorithm:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * 1. Parse the query string into key/value pairs.
 * 2. Remove the `hash` field.
 * 3. Sort the remaining pairs alphabetically and join with `\n` as `key=value`.
 * 4. Compute secret = HMAC_SHA256(botToken, "WebAppData").
 * 5. Compute hash = HMAC_SHA256(dataCheckString, secret).
 * 6. Compare with the provided `hash` (constant-time).
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 86400
): VerifiedInitData {
  if (!botToken) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN is not configured on the server." };
  }
  if (!initData) {
    return { ok: false, error: "initData is empty." };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    return { ok: false, error: "hash is missing from initData." };
  }
  params.delete("hash");

  // Build the data-check-string (sorted alphabetically).
  const dataCheckString = Array.from(params.entries())
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // Constant-time comparison to avoid timing attacks.
  const valid =
    computedHash.length === hash.length &&
    crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));

  if (!valid) {
    return { ok: false, error: "Invalid hash — data was not signed by this bot token." };
  }

  // Optional freshness check.
  const authDate = Number(params.get("auth_date") || 0);
  if (maxAgeSeconds > 0 && authDate > 0) {
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > maxAgeSeconds) {
      return { ok: false, error: "initData has expired. Please reopen the Mini App." };
    }
  }

  const userRaw = params.get("user");
  let user: TelegramUser | undefined;
  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as TelegramUser;
    } catch {
      return { ok: false, error: "Could not parse the user field." };
    }
  }

  return { ok: true, user, authDate };
}

/**
 * Calls the Telegram Bot API to confirm the bot token is live and fetch its info.
 * Returns null if the token is missing or invalid.
 */
export async function getBotInfo(botToken: string): Promise<{
  ok: boolean;
  botUsername?: string;
  botName?: string;
  error?: string;
}> {
  if (!botToken) {
    return { ok: false, error: "No bot token configured." };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.description || "getMe failed." };
    }
    return {
      ok: true,
      botUsername: data.result.username,
      botName: data.result.first_name,
    };
  } catch (err: any) {
    return { ok: false, error: err.message || "Network error contacting Telegram." };
  }
}
