import type { OrderChannel, OrderStatus, PrismaClient } from "@prisma/client";

type FindOrdersInput = {
  tenantId: string;
  locationIds?: string[];
  locationId?: string;
  status?: OrderStatus;
  search?: string;
};

export class OrdersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findPrimaryActiveLocation(tenantId: string) {
    return this.prisma.location.findFirst({
      where: { tenantId, isActive: true },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
      select: { id: true, name: true, city: true },
    });
  }

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

  createPublicOrder(input: {
    tenantId: string;
    locationId: string;
    externalId: string;
    customerName: string;
    customerPhone: string;
    notes?: string;
    pickupAt?: Date;
    totalAmount: number;
    channel: OrderChannel;
    items: Array<{ itemName: string; qty: number; unitPrice: number }>;
  }) {
    return this.prisma.order.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        externalId: input.externalId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        notes: input.notes,
        pickupAt: input.pickupAt,
        totalAmount: input.totalAmount.toFixed(2),
        channel: input.channel,
        status: "NEW",
        items: {
          create: input.items.map((item) => ({
            itemName: item.itemName,
            qty: item.qty,
            unitPrice: item.unitPrice.toFixed(2),
          })),
        },
      },
      include: {
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
