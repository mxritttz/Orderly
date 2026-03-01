-- CreateEnum
CREATE TYPE "LocationRole" AS ENUM ('VIEWER', 'MANAGER');

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Berlin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipLocation" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "role" "LocationRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipLocation_pkey" PRIMARY KEY ("id")
);

-- 1) Add as nullable first for safe backfill
ALTER TABLE "Order" ADD COLUMN "locationId" TEXT;

-- 2) Create one fallback location per tenant for existing orders
INSERT INTO "Location" (
    "id",
    "tenantId",
    "name",
    "city",
    "timezone",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT
    'legacy-location-' || t."id",
    t."id",
    'Legacy Main Location',
    t."city",
    t."timezone",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Tenant" t
WHERE EXISTS (
    SELECT 1 FROM "Order" o WHERE o."tenantId" = t."id" AND o."locationId" IS NULL
)
AND NOT EXISTS (
    SELECT 1
    FROM "Location" l
    WHERE l."tenantId" = t."id"
      AND l."name" = 'Legacy Main Location'
);

-- 3) Backfill old orders
UPDATE "Order" o
SET "locationId" = l."id"
FROM "Location" l
WHERE l."tenantId" = o."tenantId"
  AND l."name" = 'Legacy Main Location'
  AND o."locationId" IS NULL;

-- 4) Enforce required column after data exists
ALTER TABLE "Order" ALTER COLUMN "locationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Location_tenantId_isActive_idx" ON "Location"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Location_tenantId_name_key" ON "Location"("tenantId", "name");

-- CreateIndex
CREATE INDEX "MembershipLocation_locationId_idx" ON "MembershipLocation"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipLocation_membershipId_locationId_key" ON "MembershipLocation"("membershipId", "locationId");

-- Replace old order index
DROP INDEX "Order_tenantId_status_createdAt_idx";
CREATE INDEX "Order_tenantId_locationId_status_createdAt_idx" ON "Order"("tenantId", "locationId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipLocation" ADD CONSTRAINT "MembershipLocation_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipLocation" ADD CONSTRAINT "MembershipLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
