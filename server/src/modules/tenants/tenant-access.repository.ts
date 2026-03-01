import type { PrismaClient, Role } from "@prisma/client";

export type TenantAccess = {
  tenantId: string;
  role: Role;
  locationIds: string[];
};

export class TenantAccessRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByTenantSlugAndUserId(tenantSlug: string, userId: string): Promise<TenantAccess | null> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        tenant: { slug: tenantSlug },
        userId,
      },
      select: {
        tenantId: true,
        role: true,
        locations: { select: { locationId: true } },
      },
    });

    if (!membership) return null;

    return {
      tenantId: membership.tenantId,
      role: membership.role,
      locationIds: membership.locations.map((entry) => entry.locationId),
    };
  }
}
