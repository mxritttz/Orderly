export type CustomerOrderItem = {
  id: number;
  name: string;
  qty: number;
  unitPrice: number;
};

export type CustomerOrder = {
  id: string;
  tenantSlug: string;
  tenantName: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  accountMode: "guest" | "account";
  email?: string;
  createdAt: string;
  etaMinutes: number;
  items: CustomerOrderItem[];
  total: number;
};

const ORDER_STORAGE_KEY = "orderly:customer-orders";

export const loadCustomerOrders = (): CustomerOrder[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomerOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveCustomerOrder = (order: CustomerOrder) => {
  const existing = loadCustomerOrders();
  const next = [order, ...existing].slice(0, 80);
  window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(next));
};

export const findCustomerOrder = (tenantSlug: string, orderId: string) =>
  loadCustomerOrders().find((entry) => entry.tenantSlug === tenantSlug && entry.id === orderId) ?? null;
