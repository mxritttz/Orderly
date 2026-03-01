import { env } from "../../config/env";
import { HttpError } from "../../shared/http";
import {
  createSessionToken,
  hashSessionToken,
  parseCookieHeader,
  SESSION_COOKIE_NAME,
} from "../../shared/session-cookie";
import { verifyPassword } from "../../shared/password";
import { AuthRepository } from "./auth.repository";
import type { AuthUser } from "./auth.types";

const toAuthUser = (user: { id: string; email: string; fullName: string }): AuthUser => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
});

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  private getSessionCookieToken(cookieHeader?: string) {
    const cookies = parseCookieHeader(cookieHeader);
    return cookies[SESSION_COOKIE_NAME];
  }

  async login(email: string, password: string) {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user?.passwordHash) {
      throw new HttpError(401, "invalid_credentials", "Invalid email or password.");
    }

    if (!verifyPassword(password, user.passwordHash)) {
      throw new HttpError(401, "invalid_credentials", "Invalid email or password.");
    }

    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(
      Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    await this.authRepository.createSession(user.id, tokenHash, expiresAt);

    return {
      token,
      maxAgeSeconds: env.SESSION_TTL_DAYS * 24 * 60 * 60,
      user: toAuthUser(user),
    };
  }

  async getAuthUserFromCookie(cookieHeader?: string) {
    const sessionToken = this.getSessionCookieToken(cookieHeader);
    if (!sessionToken) return null;

    const session = await this.authRepository.findSessionByTokenHash(
      hashSessionToken(sessionToken)
    );
    if (!session?.user) return null;

    return {
      user: toAuthUser(session.user),
      session: {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt.toISOString(),
      },
    };
  }

  async logout(cookieHeader?: string) {
    const sessionToken = this.getSessionCookieToken(cookieHeader);
    if (!sessionToken) return;

    await this.authRepository.revokeSessionByTokenHash(hashSessionToken(sessionToken));
  }

  async getMe(cookieHeader?: string) {
    const auth = await this.getAuthUserFromCookie(cookieHeader);
    if (!auth) {
      throw new HttpError(401, "unauthorized", "Authentication required.");
    }

    const memberships = await this.authRepository.listUserTenantMemberships(auth.user.id);

    return {
      user: auth.user,
      session: auth.session,
      tenants: memberships.map((membership) => ({
        role: membership.role,
        tenant: membership.tenant,
        assignedLocations: membership.locations.map((entry) => ({
          role: entry.role,
          location: entry.location,
        })),
      })),
    };
  }
}
