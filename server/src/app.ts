import Fastify from "fastify";
import cors from "@fastify/cors";
import type { PrismaClient } from "@prisma/client";
import { prismaPlugin } from "./plugins/prisma";
import { healthRoutes } from "./modules/health/health.routes";
import { ordersRoutes } from "./modules/orders/orders.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { errorResponse, HttpError } from "./shared/http";

type BuildAppOptions = {
  prismaClient?: PrismaClient;
};

export async function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  app.addHook("onRequest", async (request) => {
    request.log.info({ requestId: request.id, method: request.method, url: request.url }, "request_start");
  });

  app.addHook("onResponse", async (request, reply) => {
    request.log.info(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTimeMs: reply.elapsedTime,
      },
      "request_end"
    );
  });

  app.setErrorHandler((error, request, reply) => {
    const normalizedError = error instanceof Error ? error : new Error("Unknown error");
    const { statusCode, body } = errorResponse(request, normalizedError);
    if (statusCode >= 500) {
      request.log.error({ requestId: request.id, err: normalizedError }, "request_error");
    } else {
      request.log.warn({ requestId: request.id, err: normalizedError }, "request_error");
    }
    reply.code(statusCode).send(body);
  });

  app.setNotFoundHandler((request, reply) => {
    const notFound = new HttpError(404, "route_not_found", "Route not found.");
    const { statusCode, body } = errorResponse(request, notFound);
    reply.code(statusCode).send(body);
  });

  if (options.prismaClient) {
    app.decorate("prisma", options.prismaClient);
  } else {
  await app.register(prismaPlugin);
  }

  await app.register(authRoutes);
  await app.register(healthRoutes);
  await app.register(ordersRoutes);

  return app;
}
