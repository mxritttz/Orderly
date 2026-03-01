import type { FastifyInstance } from "fastify";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { OrdersRepository } from "./orders.repository";
import { TenantsRepository } from "../tenants/tenants.repository";
import { TenantAccessRepository } from "../tenants/tenant-access.repository";
import { AuthRepository } from "../auth/auth.repository";
import { AuthService } from "../auth/auth.service";
import { requireAuth } from "../auth/auth.controller";

export async function ordersRoutes(app: FastifyInstance) {
  const tenantsRepository = new TenantsRepository(app.prisma);
  const tenantAccessRepository = new TenantAccessRepository(app.prisma);
  const ordersRepository = new OrdersRepository(app.prisma);
  const authRepository = new AuthRepository(app.prisma);
  const authService = new AuthService(authRepository);
  const ordersService = new OrdersService(
    tenantsRepository,
    tenantAccessRepository,
    ordersRepository
  );
  const ordersController = new OrdersController(ordersService);
  const authGuard = requireAuth(authService);

  app.get("/api/tenants/:tenantSlug/orders", { preHandler: authGuard }, ordersController.listOrders);
  app.patch(
    "/api/tenants/:tenantSlug/orders/:orderId/status",
    { preHandler: authGuard },
    ordersController.updateOrderStatus
  );
  app.post("/api/public/tenants/:tenantSlug/orders", ordersController.createPublicOrder);
  app.get("/api/public/tenants/:tenantSlug/orders/:orderId", ordersController.publicTrackOrder);
}
