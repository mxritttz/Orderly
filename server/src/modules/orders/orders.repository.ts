import type { OrderStatus, PrismaClient } from "@prisma/client";

type FindOrdersInput = {
  tenantId: string;
  locationIds?: string[];
  locationId?: string;
  status?: OrderStatus;
  search?: string;
};

export class OrdersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(input: FindOrdersInput) {
    return this.prisma.order.findMany({
      where: {
        tenantId: input.tenantId,
        ...(input.locationIds ? { locationId: { in: input.locationIds } } : {}),
        ...(input.locationId ? { locationId: input.locationId } : {}),
        status: input.status,
        ...(input.search
          ? {
              OR: [
                { customerName: { contains: input.search, mode: "insensitive" } },
                { externalId: { contains: input.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        items: {
          select: {
            id: true,
            itemName: true,
            qty: true,
            unitPrice: true,
            notes: true,
          },
        },
      },
    });
  }

  updateStatusById(
    tenantId: string,
    orderId: string,
    status: OrderStatus,
    locationIds?: string[]
  ) {
    return this.prisma.order.updateMany({
      where: {
        id: orderId,
        tenantId,
        ...(locationIds ? { locationId: { in: locationIds } } : {}),
      },
      data: { status },
    });
  }

  findById(tenantId: string, orderId: string, locationIds?: string[]) {
    return this.prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId,
        ...(locationIds ? { locationId: { in: locationIds } } : {}),
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        items: {
          select: {
            id: true,
            itemName: true,
            qty: true,
            unitPrice: true,
            notes: true,
          },
        },
      },
    });
  }
}
