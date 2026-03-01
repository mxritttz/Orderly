import _ from "lodash";
import type {
  ChannelKey,
  IntegrationState,
  MenuItem,
  Order,
  OrderStatus,
  Tenant,
  TenantState,
} from "./types";

export const MOCK_MENU: MenuItem[] = [
  { id: 1, name: "Doener Kebab", price: 7.5, category: "Doener" },
  { id: 2, name: "Doener Teller", price: 9.0, category: "Doener" },
  { id: 3, name: "Dueruem", price: 8.0, category: "Doener" },
  { id: 4, name: "Lahmacun", price: 6.5, category: "Tuerkisch" },
  { id: 5, name: "Pommes klein", price: 3.0, category: "Beilagen" },
  { id: 6, name: "Pommes gross", price: 4.5, category: "Beilagen" },
  { id: 7, name: "Falafel Wrap", price: 7.0, category: "Vegetarisch" },
  { id: 8, name: "Ayran", price: 2.0, category: "Getraenke" },
  { id: 9, name: "Cola 0.33l", price: 2.5, category: "Getraenke" },
  { id: 10, name: "Wasser 0.5l", price: 1.5, category: "Getraenke" },
];

export const CHANNELS: Record<ChannelKey, { label: string; icon: string; color: string }> = {
  phone: { label: "Telefon", icon: "📞", color: "#3b82f6" },
  sms: { label: "SMS", icon: "💬", color: "#8b5cf6" },
  email: { label: "E-Mail", icon: "📧", color: "#06b6d4" },
  web: { label: "Web", icon: "🌐", color: "#10b981" },
};

export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  new: { label: "Neu", color: "#ef4444", bg: "#fef2f2" },
  confirmed: { label: "Bestaetigt", color: "#f59e0b", bg: "#fffbeb" },
  preparing: { label: "In Zubereitung", color: "#3b82f6", bg: "#eff6ff" },
  ready: { label: "Abholbereit", color: "#10b981", bg: "#f0fdf4" },
  done: { label: "Erledigt", color: "#6b7280", bg: "#f9fafb" },
};

export const DEFAULT_INTEGRATIONS: IntegrationState = {
  lightspeed: false,
  orderbird: false,
  sumup: false,
  custom: false,
};

export const TENANTS: Tenant[] = [
  { id: "tenant-1", slug: "doner-palace", name: "Doener Palace", city: "Berlin", timezone: "Europe/Berlin" },
  { id: "tenant-2", slug: "istanbul-grill", name: "Istanbul Grill", city: "Hamburg", timezone: "Europe/Berlin" },
  { id: "tenant-3", slug: "nimo-bites", name: "Nimo Bites", city: "Koeln", timezone: "Europe/Berlin" },
];

const pickOne = <T,>(values: readonly T[]): T => values[_.random(0, values.length - 1)] as T;

const tenantCustomers: Record<string, string[]> = {
  "doner-palace": ["Mueller, Stefan", "Yilmaz, Ayse", "Schmidt, Anna", "Weber, Thomas"],
  "istanbul-grill": ["Demir, Emre", "Kaya, Elif", "Arslan, Deniz", "Aydin, Mert"],
  "nimo-bites": ["Becker, Lukas", "Wagner, Petra", "Hoffmann, Mia", "Koch, Lisa"],
};

export const createSeedOrders = (tenantSlug: string): Order[] => {
  const customers = tenantCustomers[tenantSlug] ?? tenantCustomers["doner-palace"];
  return [
    {
      id: "ORD-1041",
      externalId: "ORD-1041",
      customer: customers[0],
      phone: "+49 176 4821 3347",
      channel: "phone",
      items: [
        { ...MOCK_MENU[0], qty: 2, notes: "Ohne Zwiebeln" },
        { ...MOCK_MENU[4], qty: 1, notes: "" },
        { ...MOCK_MENU[8], qty: 2, notes: "" },
      ],
      status: "new",
      createdAt: new Date(Date.now() - 2 * 60000),
      pickup: "15:30",
      total: 23.0,
      aiConfidence: 0.96,
    },
    {
      id: "ORD-1040",
      externalId: "ORD-1040",
      customer: customers[1],
      phone: "+49 151 2293 8812",
      channel: "sms",
      items: [
        { ...MOCK_MENU[3], qty: 1, notes: "Extra scharf" },
        { ...MOCK_MENU[6], qty: 1, notes: "" },
        { ...MOCK_MENU[7], qty: 2, notes: "" },
      ],
      status: "confirmed",
      createdAt: new Date(Date.now() - 8 * 60000),
      pickup: "15:45",
      total: 17.5,
      aiConfidence: 0.92,
    },
    {
      id: "ORD-1039",
      externalId: "ORD-1039",
      customer: customers[2],
      phone: "+49 170 5517 2234",
      channel: "phone",
      items: [
        { ...MOCK_MENU[1], qty: 1, notes: "" },
        { ...MOCK_MENU[5], qty: 1, notes: "Mit Mayo" },
        { ...MOCK_MENU[9], qty: 1, notes: "" },
      ],
      status: "preparing",
      createdAt: new Date(Date.now() - 15 * 60000),
      pickup: "15:20",
      total: 15.0,
      aiConfidence: 0.99,
    },
    {
      id: "ORD-1038",
      externalId: "ORD-1038",
      customer: customers[3],
      phone: "+49 162 7783 1190",
      channel: "email",
      items: [
        { ...MOCK_MENU[2], qty: 3, notes: "1x vegetarisch" },
        { ...MOCK_MENU[4], qty: 2, notes: "" },
        { ...MOCK_MENU[8], qty: 3, notes: "" },
      ],
      status: "new",
      createdAt: new Date(Date.now() - 1 * 60000),
      pickup: "16:00",
      total: 37.5,
      aiConfidence: 0.88,
    },
    {
      id: "ORD-1037",
      externalId: "ORD-1037",
      customer: "Koch, Lisa",
      phone: "+49 173 9912 5567",
      channel: "web",
      items: [
        { ...MOCK_MENU[6], qty: 2, notes: "" },
        { ...MOCK_MENU[7], qty: 2, notes: "" },
      ],
      status: "ready",
      createdAt: new Date(Date.now() - 25 * 60000),
      pickup: "15:10",
      total: 18.0,
      aiConfidence: 0.95,
    },
    {
      id: "ORD-1036",
      externalId: "ORD-1036",
      customer: "Braun, Marco",
      phone: "+49 157 3344 8821",
      channel: "phone",
      items: [
        { ...MOCK_MENU[0], qty: 1, notes: "Alles drauf" },
        { ...MOCK_MENU[8], qty: 1, notes: "" },
      ],
      status: "done",
      createdAt: new Date(Date.now() - 45 * 60000),
      pickup: "14:45",
      total: 10.0,
      aiConfidence: 0.97,
    },
  ];
};

export const createIncomingOrder = (): Order => {
  const orderId = `ORD-${1042 + Math.floor(Math.random() * 900)}`;
  return {
  id: orderId,
  externalId: orderId,
  customer: pickOne([
    "Fischer, Klaus",
    "Wagner, Petra",
    "Becker, Lukas",
    "Hoffmann, Mia",
  ]),
  phone: `+49 ${_.random(150, 179)} ${_.random(1000, 9999)} ${_.random(1000, 9999)}`,
  channel: pickOne(["phone", "sms", "email", "web"] as const),
  items: _.sampleSize(MOCK_MENU, _.random(1, 3)).map((item) => ({
    ...item,
    qty: _.random(1, 2),
    notes: pickOne(["", "", "", "Extra scharf", "Ohne Sosse", "Doppelt Fleisch"]),
  })),
  status: "new",
  createdAt: new Date(),
  pickup: `${_.random(15, 19)}:${pickOne(["00", "15", "30", "45"] as const)}`,
  total: Number(_.random(8, 35, true).toFixed(2)),
  aiConfidence: _.random(0.85, 0.99, true),
};
};

export const createInitialTenantState = (tenantSlug: string): TenantState => ({
  orders: createSeedOrders(tenantSlug),
  integrations: { ...DEFAULT_INTEGRATIONS },
});
