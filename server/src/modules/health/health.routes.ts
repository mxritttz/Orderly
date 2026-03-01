import type { FastifyInstance } from "fastify";
import { ok } from "../../shared/http";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/api/health", async (request, reply) =>
    ok(request, reply, { ok: true, timestamp: new Date().toISOString() })
  );
}
