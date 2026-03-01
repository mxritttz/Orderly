import type { PrismaClient } from "@prisma/client";
import type { AuthUser } from "../modules/auth/auth.types";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }

  interface FastifyRequest {
    authUser?: AuthUser;
  }
}
