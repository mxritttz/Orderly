import {
  PrismaClient,
  IntegrationProvider,
  LocationRole,
  OrderChannel,
  OrderStatus,
  Role,
} from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();
const demoPassword = "demo1234";

const hashPassword = (plainTextPassword) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plainTextPassword, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
};

const tenants = [
  { slug: "doner-palace", name: "Doner Palace", city: "Berlin" },
  { slug: "istanbul-grill", name: "Istanbul Grill", city: "Hamburg" },
  { slug: "nimo-bites", name: "Nimo Bites", city: "Koeln" },
];

const tenantLocations = {
  "doner-palace": [
    { name: "Doner Palace Mitte", city: "Berlin", address: "Alexanderplatz 1" },
    { name: "Doner Palace Kreuzberg", city: "Berlin", address: "Oranienstrasse 42" },
  ],
  "istanbul-grill": [
    { name: "Istanbul Grill Altona", city: "Hamburg", address: "Altonaer Strasse 8" },
    { name: "Istanbul Grill Hafen", city: "Hamburg", address: "Am Sandtorkai 21" },
  ],
  "nimo-bites": [
    { name: "Nimo Bites Ehrenfeld", city: "Koeln", address: "Venloer Strasse 200" },
    { name: "Nimo Bites Suedstadt", city: "Koeln", address: "Severinstrasse 55" },
  ],
};

const baseMenu = [
  { name: "Doner Kebab", category: "Doner", price: "7.50" },
  { name: "Doner Teller", category: "Doner", price: "9.00" },
  { name: "Durum", category: "Doner", price: "8.00" },
  { name: "Lahmacun", category: "Tuerkisch", price: "6.50" },
  { name: "Pommes klein", category: "Beilagen", price: "3.00" },
  { name: "Ayran", category: "Getraenke", price: "2.00" },
];

const sampleCustomers = [
  { name: "Mueller, Stefan", phone: "+49 176 4821 3347" },
  { name: "Yilmaz, Ayse", phone: "+49 151 2293 8812" },
  { name: "Kaya, Mert", phone: "+49 160 7331 100" },
  { name: "Demir, Elif", phone: "+49 152 4498 227" },
  { name: "Arslan, Can", phone: "+49 171 2200 555" },
  { name: "Schneider, Lara", phone: "+49 177 8227 910" },
  { name: "Wagner, Jonas", phone: "+49 159 3324 663" },
  { name: "Koc, Deniz", phone: "+49 172 4418 092" },
  { name: "Acar, Emre", phone: "+49 151 9817 204" },
  { name: "Yildiz, Melis", phone: "+49 176 5571 443" },
  { name: "Becker, Paul", phone: "+49 152 8732 118" },
  { name: "Aydin, Zeynep", phone: "+49 178 2904 662" },
];

const orderStatuses = [
  OrderStatus.NEW,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DONE,
];

const orderChannels = [OrderChannel.PHONE, OrderChannel.SMS, OrderChannel.EMAIL, OrderChannel.WEB];

function buildOrdersForTenant(tenantSlug, tenantIndex) {
  const orders = [];
  const totalOrders = 24;
  const base = 1040 + tenantIndex * 100;

  for (let i = 0; i < totalOrders; i += 1) {
    const customer = sampleCustomers[(i + tenantIndex * 2) % sampleCustomers.length];
    const qtyMain = 1 + (i % 3);
    const addFries = i % 2 === 0;
    const addAyran = i % 4 !== 0;
    const mainTotal = qtyMain * 7.5;
    const friesTotal = addFries ? 3 : 0;
    const ayranTotal = addAyran ? 2 : 0;
    const totalAmount = (mainTotal + friesTotal + ayranTotal).toFixed(2);
    const confidence = (0.86 + ((i + tenantIndex) % 11) * 0.011).toFixed(3);

    orders.push({
      externalId: `ORD-${base + i}`,
      customerName: customer.name,
      customerPhone: customer.phone,
      channel: orderChannels[(i + tenantIndex) % orderChannels.length],
      status: orderStatuses[(i + tenantIndex) % orderStatuses.length],
      totalAmount,
      aiConfidence: confidence,
      items: [
        { itemName: "Doner Kebab", qty: qtyMain, unitPrice: "7.50" },
        ...(addFries ? [{ itemName: "Pommes klein", qty: 1, unitPrice: "3.00" }] : []),
        ...(addAyran ? [{ itemName: "Ayran", qty: 1, unitPrice: "2.00" }] : []),
      ],
    });
  }

  // Keep two familiar order IDs for quick manual checks.
  if (tenantSlug === "doner-palace") {
    orders[0] = {
      externalId: "ORD-1041",
      customerName: "Mueller, Stefan",
      customerPhone: "+49 176 4821 3347",
      channel: OrderChannel.PHONE,
      status: OrderStatus.NEW,
      totalAmount: "23.00",
      aiConfidence: "0.960",
      items: [
        { itemName: "Doner Kebab", qty: 2, unitPrice: "7.50" },
        { itemName: "Pommes klein", qty: 1, unitPrice: "3.00" },
        { itemName: "Ayran", qty: 1, unitPrice: "2.00" },
      ],
    };
    orders[1] = {
      externalId: "ORD-1040",
      customerName: "Yilmaz, Ayse",
      customerPhone: "+49 151 2293 8812",
      channel: OrderChannel.SMS,
      status: OrderStatus.CONFIRMED,
      totalAmount: "17.50",
      aiConfidence: "0.920",
      items: [
        { itemName: "Doner Kebab", qty: 2, unitPrice: "7.50" },
        { itemName: "Pommes klein", qty: 1, unitPrice: "3.00" },
      ],
    };
  }

  return orders;
}

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: "owner@ordermitnimo.local" },
    update: { fullName: "Local Owner", passwordHash: hashPassword(demoPassword) },
    create: {
      email: "owner@ordermitnimo.local",
      fullName: "Local Owner",
      passwordHash: hashPassword(demoPassword),
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@ordermitnimo.local" },
    update: { fullName: "Local Manager", passwordHash: hashPassword(demoPassword) },
    create: {
      email: "manager@ordermitnimo.local",
      fullName: "Local Manager",
      passwordHash: hashPassword(demoPassword),
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@ordermitnimo.local" },
    update: { fullName: "Local Staff", passwordHash: hashPassword(demoPassword) },
    create: {
      email: "staff@ordermitnimo.local",
      fullName: "Local Staff",
      passwordHash: hashPassword(demoPassword),
    },
  });

  for (const [tenantIndex, tenantData] of tenants.entries()) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: tenantData.slug },
      update: { name: tenantData.name, city: tenantData.city },
      create: tenantData,
    });

    const ownerMembership = await prisma.membership.upsert({
      where: { userId_tenantId: { userId: owner.id, tenantId: tenant.id } },
      update: { role: Role.OWNER },
      create: { userId: owner.id, tenantId: tenant.id, role: Role.OWNER },
    });

    const managerMembership = await prisma.membership.upsert({
      where: { userId_tenantId: { userId: manager.id, tenantId: tenant.id } },
      update: { role: Role.MANAGER },
      create: { userId: manager.id, tenantId: tenant.id, role: Role.MANAGER },
    });

    const staffMembership = await prisma.membership.upsert({
      where: { userId_tenantId: { userId: staff.id, tenantId: tenant.id } },
      update: { role: Role.STAFF },
      create: { userId: staff.id, tenantId: tenant.id, role: Role.STAFF },
    });

    const locations = [];
    for (const locationData of tenantLocations[tenant.slug]) {
      const location = await prisma.location.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: locationData.name } },
        update: locationData,
        create: { ...locationData, tenantId: tenant.id },
      });
      locations.push(location);
    }

    for (const location of locations) {
      await prisma.membershipLocation.upsert({
        where: { membershipId_locationId: { membershipId: ownerMembership.id, locationId: location.id } },
        update: { role: LocationRole.MANAGER },
        create: { membershipId: ownerMembership.id, locationId: location.id, role: LocationRole.MANAGER },
      });
    }

    if (locations[0]) {
      await prisma.membershipLocation.upsert({
        where: { membershipId_locationId: { membershipId: managerMembership.id, locationId: locations[0].id } },
        update: { role: LocationRole.MANAGER },
        create: { membershipId: managerMembership.id, locationId: locations[0].id, role: LocationRole.MANAGER },
      });

      await prisma.membershipLocation.upsert({
        where: { membershipId_locationId: { membershipId: staffMembership.id, locationId: locations[0].id } },
        update: { role: LocationRole.VIEWER },
        create: { membershipId: staffMembership.id, locationId: locations[0].id, role: LocationRole.VIEWER },
      });
    }

    for (const menuItem of baseMenu) {
      await prisma.menuItem.upsert({
        where: {
          id: `${tenant.slug}-${menuItem.name.toLowerCase().replace(/\s+/g, "-")}`,
        },
        update: {
          name: menuItem.name,
          category: menuItem.category,
          price: menuItem.price,
          isActive: true,
        },
        create: {
          id: `${tenant.slug}-${menuItem.name.toLowerCase().replace(/\s+/g, "-")}`,
          tenantId: tenant.id,
          name: menuItem.name,
          category: menuItem.category,
          price: menuItem.price,
          isActive: true,
        },
      });
    }

    const ordersPerTenant = buildOrdersForTenant(tenant.slug, tenantIndex);
    for (const [index, orderData] of ordersPerTenant.entries()) {
      const location = locations[index % locations.length];
      const order = await prisma.order.upsert({
        where: { tenantId_externalId: { tenantId: tenant.id, externalId: orderData.externalId } },
        update: {
          locationId: location.id,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          channel: orderData.channel,
          status: orderData.status,
          totalAmount: orderData.totalAmount,
          aiConfidence: orderData.aiConfidence,
        },
        create: {
          tenantId: tenant.id,
          locationId: location.id,
          externalId: orderData.externalId,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          channel: orderData.channel,
          status: orderData.status,
          totalAmount: orderData.totalAmount,
          aiConfidence: orderData.aiConfidence,
        },
      });

      const existingItems = await prisma.orderItem.count({ where: { orderId: order.id } });
      if (existingItems === 0) {
        await prisma.orderItem.createMany({
          data: orderData.items.map((item) => ({ orderId: order.id, ...item })),
        });
      }
    }

    for (const provider of [
      IntegrationProvider.LIGHTSPEED,
      IntegrationProvider.ORDERBIRD,
      IntegrationProvider.SUMUP,
      IntegrationProvider.CUSTOM,
    ]) {
      await prisma.integration.upsert({
        where: { tenantId_provider: { tenantId: tenant.id, provider } },
        update: {},
        create: { tenantId: tenant.id, provider, isConnected: false },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
