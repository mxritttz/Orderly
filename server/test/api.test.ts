import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { buildApp } from "../src/app";
import { hashPassword } from "../src/shared/password";
import { hashSessionToken } from "../src/shared/session-cookie";

const createPrismaMock = () =>
  {
    const users = [
      {
        id: "user-owner",
        email: "owner@ordermitnimo.local",
        fullName: "Owner",
        passwordHash: hashPassword("demo1234"),
      },
      {
        id: "user-outsider",
        email: "outsider@ordermitnimo.local",
        fullName: "Outsider",
        passwordHash: hashPassword("demo1234"),
      },
    ];
    const sessions: Array<{
      id: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      revokedAt: Date | null;
    }> = [];

    return ({
    user: {
      findUnique: async ({ where }: { where: { email: string } }) =>
        users.find((user) => user.email === where.email.toLowerCase()) ?? null,
    },
    session: {
      create: async ({
        data,
      }: {
        data: { userId: string; tokenHash: string; expiresAt: Date };
      }) => {
        const session = {
          id: `session-${sessions.length + 1}`,
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          revokedAt: null,
        };
        sessions.push(session);
        return session;
      },
      findFirst: async ({
        where,
      }: {
        where: { tokenHash: string; revokedAt: null; expiresAt: { gt: Date } };
      }) => {
        const found = sessions.find(
          (session) =>
            session.tokenHash === where.tokenHash &&
            session.revokedAt === null &&
            session.expiresAt > where.expiresAt.gt
        );
        if (!found) return null;
        const user = users.find((entry) => entry.id === found.userId);
        if (!user) return null;
        return {
          ...found,
          user: { id: user.id, email: user.email, fullName: user.fullName },
        };
      },
      updateMany: async ({ where }: { where: { tokenHash: string } }) => {
        let count = 0;
        for (const session of sessions) {
          if (session.tokenHash === where.tokenHash && session.revokedAt === null) {
            session.revokedAt = new Date();
            count += 1;
          }
        }
        return { count };
      },
    },
    tenant: {
      findUnique: async ({ where }: { where: { slug: string } }) => {
        if (where.slug !== "doner-palace") return null;
        return {
          id: "tenant-1",
          slug: "doner-palace",
          name: "Doner Palace",
          city: "Berlin",
          timezone: "Europe/Berlin",
        };
      },
    },
    membership: {
      findFirst: async ({ where }: { where: { userId: string } }) => {
        if (where.userId === "user-owner") {
          return {
            tenantId: "tenant-1",
            role: "OWNER",
            locations: [{ locationId: "loc-1" }, { locationId: "loc-2" }],
          };
        }

        return null;
      },
      findMany: async ({ where }: { where: { userId: string } }) => {
        if (where.userId !== "user-owner") return [];
        return [
          {
            role: "OWNER",
            tenant: {
              id: "tenant-1",
              slug: "doner-palace",
              name: "Doner Palace",
              city: "Berlin",
              timezone: "Europe/Berlin",
              locations: [
                { id: "loc-1", name: "Doner Palace Mitte", city: "Berlin" },
                { id: "loc-2", name: "Doner Palace Kreuzberg", city: "Berlin" },
              ],
            },
            locations: [
              { role: "MANAGER", location: { id: "loc-1", name: "Doner Palace Mitte", city: "Berlin" } },
              { role: "MANAGER", location: { id: "loc-2", name: "Doner Palace Kreuzberg", city: "Berlin" } },
            ],
          },
        ];
      },
    },
    order: {
      findMany: async () => [
        {
          id: "order-1",
          externalId: "ORD-1041",
          customerName: "Mueller, Stefan",
          customerPhone: "+49 176 4821 3347",
          channel: "PHONE",
          status: "NEW",
          pickupAt: null,
          totalAmount: 23,
          aiConfidence: 0.96,
          createdAt: new Date("2026-03-01T10:00:00.000Z"),
          updatedAt: new Date("2026-03-01T10:00:00.000Z"),
          location: { id: "loc-1", name: "Doner Palace Mitte", city: "Berlin" },
          items: [{ id: "item-1", itemName: "Doner Kebab", qty: 2, unitPrice: 7.5, notes: null }],
        },
      ],
      updateMany: async () => ({ count: 1 }),
      findFirst: async () => ({
        id: "order-1",
        externalId: "ORD-1041",
        status: "CONFIRMED",
        updatedAt: new Date("2026-03-01T11:00:00.000Z"),
        location: { id: "loc-1", name: "Doner Palace Mitte", city: "Berlin" },
        items: [],
      }),
    },
  }) as unknown as PrismaClient;
  };

describe("API", () => {
  let app: FastifyInstance;
  const readSessionCookie = (setCookieHeader: string | string[] | undefined) => {
    const raw = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
    return raw?.split(";")[0] ?? "";
  };

  before(async () => {
    app = await buildApp({ prismaClient: createPrismaMock() });
  });

  after(async () => {
    await app.close();
  });

  it("returns health response envelope", async () => {
    const response = await app.inject({ method: "GET", url: "/api/health" });
    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.success, true);
    assert.equal(body.data.ok, true);
    assert.ok(body.meta.requestId);
  });

  it("returns tenant orders", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "owner@ordermitnimo.local", password: "demo1234" },
    });
    const sessionCookie = readSessionCookie(login.headers["set-cookie"]);

    const response = await app.inject({
      method: "GET",
      url: "/api/tenants/doner-palace/orders",
      headers: { cookie: sessionCookie },
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.success, true);
    assert.equal(body.data.tenant.slug, "doner-palace");
    assert.equal(body.data.orders.length, 1);
    assert.equal(body.data.orders[0].externalId, "ORD-1041");
    assert.equal(body.data.orders[0].location.id, "loc-1");
  });

  it("returns authenticated user profile via /api/auth/me", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "owner@ordermitnimo.local", password: "demo1234" },
    });
    const sessionCookie = readSessionCookie(login.headers["set-cookie"]);

    const response = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie: sessionCookie },
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, "owner@ordermitnimo.local");
    assert.equal(body.data.tenants.length, 1);
  });

  it("returns validation error for invalid status payload", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "owner@ordermitnimo.local", password: "demo1234" },
    });
    const sessionCookie = readSessionCookie(login.headers["set-cookie"]);

    const response = await app.inject({
      method: "PATCH",
      url: "/api/tenants/doner-palace/orders/order-1/status",
      headers: { cookie: sessionCookie },
      payload: { status: "invalid_status" },
    });

    assert.equal(response.statusCode, 400);
    const body = response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, "validation_error");
    assert.ok(Array.isArray(body.error.details));
  });

  it("returns unauthorized when session cookie is missing", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/tenants/doner-palace/orders",
    });
    assert.equal(response.statusCode, 401);
    const body = response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, "unauthorized");
  });

  it("returns forbidden for user without tenant membership", async () => {
    const outsiderToken = "outsider-token";
    const outsiderTokenHash = hashSessionToken(outsiderToken);
    const prisma = (app as unknown as { prisma: PrismaClient }).prisma;
    await prisma.session.create({
      data: {
        userId: "user-outsider",
        tokenHash: outsiderTokenHash,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/tenants/doner-palace/orders",
      headers: { cookie: `session_token=${outsiderToken}` },
    });
    assert.equal(response.statusCode, 403);
    const body = response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, "forbidden");
  });

  it("returns route_not_found envelope for unknown route", async () => {
    const response = await app.inject({ method: "GET", url: "/api/does-not-exist" });
    assert.equal(response.statusCode, 404);
    const body = response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, "route_not_found");
  });
});
