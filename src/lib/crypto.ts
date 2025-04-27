import { randomBytes, scrypt as _scrypt } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt);

const SALT_LEN = 16;
const KEY_LEN = 64;

/** Hash a password: returns "salt:hash" */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LEN)) as Buffer;
  return salt + ":" + derivedKey.toString("hex");
}

/** Verify a password against the stored "salt:hash" */
export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, key] = stored.split(":");
  const derivedKey = (await scrypt(password, salt, KEY_LEN)) as Buffer;
  return derivedKey.toString("hex") === key;
}
