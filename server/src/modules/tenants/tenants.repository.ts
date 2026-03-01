import type { PrismaClient } from "@prisma/client";

export class TenantsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true, city: true, timezone: true },
    });
  }
}
