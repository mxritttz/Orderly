import type { FastifyReply, FastifyRequest } from "fastify";
import {
  listOrdersParamsSchema,
  listOrdersQuerySchema,
  updateOrderStatusBodySchema,
  updateOrderStatusParamsSchema,
} from "./orders.dto";
import { OrdersService } from "./orders.service";
import { HttpError, ok, parseDto } from "../../shared/http";

export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  listOrders = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.authUser) {
      throw new HttpError(401, "unauthorized", "Authentication required.");
    }

    const params = parseDto(listOrdersParamsSchema, request.params, "path params");
    const query = parseDto(listOrdersQuerySchema, request.query, "query params");

    const result = await this.ordersService.listOrders({
      tenantSlug: params.tenantSlug,
      actorUserId: request.authUser.id,
      status: query.status,
      search: query.search,
      locationId: query.locationId,
    });

    if (!result) {
      throw new HttpError(404, "tenant_not_found", "Tenant not found.");
    }

    if (result.type === "forbidden") {
      throw new HttpError(403, "forbidden", "You do not have access to this tenant/location.");
    }

    return ok(request, reply, result);
  };

  updateOrderStatus = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.authUser) {
      throw new HttpError(401, "unauthorized", "Authentication required.");
    }

    const params = parseDto(updateOrderStatusParamsSchema, request.params, "path params");
    const body = parseDto(updateOrderStatusBodySchema, request.body, "request body");

    const result = await this.ordersService.updateOrderStatus({
      tenantSlug: params.tenantSlug,
      actorUserId: request.authUser.id,
      orderId: params.orderId,
      status: body.status,
    });

    if (result.type === "tenant_not_found") {
      throw new HttpError(404, "tenant_not_found", "Tenant not found.");
    }

    if (result.type === "order_not_found") {
      throw new HttpError(404, "order_not_found", "Order not found.");
    }

    if (result.type === "forbidden") {
      throw new HttpError(403, "forbidden", "You do not have access to this tenant/location.");
    }

    return ok(request, reply, result.order);
  };
}
