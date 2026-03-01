export type OrderStatus = "new" | "confirmed" | "preparing" | "ready" | "done";
export type ChannelKey = "phone" | "sms" | "email" | "web";
export type Filter = "active" | "new" | "done" | "all";
export type IntegrationKey = "lightspeed" | "orderbird" | "sumup" | "custom";

export type MenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
};

export type OrderItem = MenuItem & {
  qty: number;
  notes: string;
};

export type Order = {
  id: string;
  externalId: string;
  customer: string;
  phone: string;
  location?: {
    id: string;
    name: string;
    city: string;
  };
  channel: ChannelKey;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  pickup: string;
  total: number;
  aiConfidence: number;
};

export type IntegrationState = Record<IntegrationKey, boolean>;

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  city: string;
  timezone: string;
};

export type TenantState = {
  orders: Order[];
  integrations: IntegrationState;
};
