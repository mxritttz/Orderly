import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE_NAME = "session_token";

export const createSessionToken = () => randomBytes(32).toString("hex");

export const hashSessionToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const parseCookieHeader = (cookieHeader?: string) => {
  if (!cookieHeader) return {};
  return cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const separatorIndex = pair.indexOf("=");
      if (separatorIndex <= 0) return acc;
      const key = pair.slice(0, separatorIndex);
      const value = decodeURIComponent(pair.slice(separatorIndex + 1));
      acc[key] = value;
      return acc;
    }, {});
};

type BuildSessionCookieOptions = {
  value: string;
  maxAgeSeconds: number;
  secure: boolean;
};

export const buildSessionCookie = ({ value, maxAgeSeconds, secure }: BuildSessionCookieOptions) =>
  [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

export const buildClearSessionCookie = (secure: boolean) =>
  [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
