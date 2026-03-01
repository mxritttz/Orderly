import type { FastifyInstance } from "fastify";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

export async function authRoutes(app: FastifyInstance) {
  const authRepository = new AuthRepository(app.prisma);
  const authService = new AuthService(authRepository);
  const authController = new AuthController(authService);

  app.post("/api/auth/login", authController.login);
  app.get("/api/auth/me", authController.me);
  app.post("/api/auth/logout", authController.logout);
}
