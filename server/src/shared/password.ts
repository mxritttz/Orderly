import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_PREFIX = "scrypt";

export const hashPassword = (plainTextPassword: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plainTextPassword, salt, 64).toString("hex");
  return `${HASH_PREFIX}:${salt}:${hash}`;
};

export const verifyPassword = (plainTextPassword: string, encodedHash: string) => {
  const [prefix, salt, storedHash] = encodedHash.split(":");
  if (prefix !== HASH_PREFIX || !salt || !storedHash) return false;

  const computed = scryptSync(plainTextPassword, salt, 64).toString("hex");
  const storedBuffer = Buffer.from(storedHash, "hex");
  const computedBuffer = Buffer.from(computed, "hex");

  if (storedBuffer.length !== computedBuffer.length) return false;
  return timingSafeEqual(storedBuffer, computedBuffer);
};
