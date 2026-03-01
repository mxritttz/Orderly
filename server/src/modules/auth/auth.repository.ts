import type { PrismaClient } from "@prisma/client";

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        fullName: true,
        passwordHash: true,
      },
    });
  }

  createSession(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.session.create({
      data: { userId, tokenHash, expiresAt },
      select: { id: true, userId: true, expiresAt: true },
    });
  }

  findSessionByTokenHash(tokenHash: string) {
    return this.prisma.session.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });
  }

  revokeSessionByTokenHash(tokenHash: string) {
    return this.prisma.session.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  listUserTenantMemberships(userId: string) {
    return this.prisma.membership.findMany({
      where: { userId },
      select: {
        role: true,
        tenant: {
          select: {
            id: true,
            slug: true,
            name: true,
            city: true,
            timezone: true,
            locations: {
              where: { isActive: true },
              select: { id: true, name: true, city: true },
            },
          },
        },
        locations: {
          select: {
            role: true,
            location: { select: { id: true, name: true, city: true } },
          },
        },
      },
    });
  }
}
