import type { OrderChannel, OrderStatus } from "@prisma/client";
import { OrdersRepository } from "./orders.repository";
import { TenantsRepository } from "../tenants/tenants.repository";
import { TenantAccessRepository } from "../tenants/tenant-access.repository";

const statusMap = {
  new: "NEW",
  confirmed: "CONFIRMED",
  preparing: "PREPARING",
  ready: "READY",
  done: "DONE",
} as const;

const reverseStatusMap: Record<OrderStatus, keyof typeof statusMap> = {
  NEW: "new",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  READY: "ready",
  DONE: "done",
};

const channelMap: Record<OrderChannel, "phone" | "sms" | "email" | "web"> = {
  PHONE: "phone",
  SMS: "sms",
  EMAIL: "email",
  WEB: "web",
};

type ListOrdersInput = {
  tenantSlug: string;
  actorUserId: string;
  status?: keyof typeof statusMap;
  search?: string;
  locationId?: string;
};

type UpdateOrderStatusInput = {
  tenantSlug: string;
  actorUserId: string;
  orderId: string;
  status: keyof typeof statusMap;
};

export class OrdersService {
  constructor(
    private readonly tenantsRepository: TenantsRepository,
    private readonly tenantAccessRepository: TenantAccessRepository,
    private readonly ordersRepository: OrdersRepository
  ) {}

  async listOrders(input: ListOrdersInput) {
    const tenant = await this.tenantsRepository.findBySlug(input.tenantSlug);
    if (!tenant) return null;

    const access = await this.tenantAccessRepository.findByTenantSlugAndUserId(
      input.tenantSlug,
      input.actorUserId
    );
    if (!access) return { type: "forbidden" as const };

    const canSeeAllLocations = access.role === "OWNER";
    const allowedLocationIds = canSeeAllLocations ? undefined : access.locationIds;

    if (!canSeeAllLocations && access.locationIds.length === 0) {
      return {
        type: "ok" as const,
        tenant,
        orders: [],
        access: { canSeeAllLocations, allowedLocationIds: [] },
      };
    }

    if (input.locationId && !canSeeAllLocations && !access.locationIds.includes(input.locationId)) {
      return { type: "forbidden" as const };
    }

    const orders = await this.ordersRepository.findMany({
      tenantId: tenant.id,
      locationIds: allowedLocationIds,
      locationId: input.locationId,
      status: input.status ? statusMap[input.status] : undefined,
      search: input.search,
    });

    return {
      type: "ok" as const,
      tenant,
      access: { canSeeAllLocations, allowedLocationIds: access.locationIds },
      orders: orders.map((order) => ({
        id: order.id,
        externalId: order.externalId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        location: {
          id: order.location.id,
          name: order.location.name,
          city: order.location.city,
        },
        channel: channelMap[order.channel],
        status: reverseStatusMap[order.status],
        pickupAt: order.pickupAt?.toISOString() ?? null,
        totalAmount: Number(order.totalAmount),
        aiConfidence: order.aiConfidence ? Number(order.aiConfidence) : null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: order.items.map((item) => ({
          id: item.id,
          itemName: item.itemName,
          qty: item.qty,
          unitPrice: Number(item.unitPrice),
          notes: item.notes,
        })),
      })),
    };
  }

  async updateOrderStatus(input: UpdateOrderStatusInput) {
    const tenant = await this.tenantsRepository.findBySlug(input.tenantSlug);
    if (!tenant) return { type: "tenant_not_found" as const };

    const access = await this.tenantAccessRepository.findByTenantSlugAndUserId(
      input.tenantSlug,
      input.actorUserId
    );
    if (!access) return { type: "forbidden" as const };

    const canSeeAllLocations = access.role === "OWNER";
    const allowedLocationIds = canSeeAllLocations ? undefined : access.locationIds;

    const result = await this.ordersRepository.updateStatusById(
      tenant.id,
      input.orderId,
      statusMap[input.status],
      allowedLocationIds
    );

    if (result.count === 0) return { type: "order_not_found" as const };

    const updatedOrder = await this.ordersRepository.findById(
      tenant.id,
      input.orderId,
      allowedLocationIds
    );
    if (!updatedOrder) return { type: "order_not_found" as const };

    return {
      type: "ok" as const,
      order: {
        id: updatedOrder.id,
        externalId: updatedOrder.externalId,
        status: reverseStatusMap[updatedOrder.status],
        updatedAt: updatedOrder.updatedAt.toISOString(),
      },
    };
  }
}
