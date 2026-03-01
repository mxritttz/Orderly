import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../config/env";
import { HttpError, ok, parseDto } from "../../shared/http";
import { buildClearSessionCookie, buildSessionCookie } from "../../shared/session-cookie";
import { loginBodySchema } from "./auth.dto";
import { AuthService } from "./auth.service";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = parseDto(loginBodySchema, request.body, "request body");
    const auth = await this.authService.login(body.email, body.password);

    reply.header(
      "Set-Cookie",
      buildSessionCookie({
        value: auth.token,
        maxAgeSeconds: auth.maxAgeSeconds,
        secure: env.SESSION_COOKIE_SECURE,
      })
    );

    return ok(request, reply, { user: auth.user });
  };

  me = async (request: FastifyRequest, reply: FastifyReply) => {
    const me = await this.authService.getMe(request.headers.cookie);
    return ok(request, reply, me);
  };

  logout = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.authService.logout(request.headers.cookie);
    reply.header("Set-Cookie", buildClearSessionCookie(env.SESSION_COOKIE_SECURE));
    return ok(request, reply, { loggedOut: true });
  };
}

export const requireAuth =
  (authService: AuthService) => async (request: FastifyRequest, _reply: FastifyReply) => {
    const auth = await authService.getAuthUserFromCookie(request.headers.cookie);
    if (!auth) {
      throw new HttpError(401, "unauthorized", "Authentication required.");
    }
    request.authUser = auth.user;
  };
