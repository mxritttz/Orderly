import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createInitialTenantState } from "./data";
import type { IntegrationKey, Order, OrderStatus, Tenant, TenantState } from "./types";
import { getApiBaseUrl } from "../../shared/apiBaseUrl";

type TenantContextValue = {
  tenant: Tenant;
  orders: Order[];
  integrations: TenantState["integrations"];
  showNewOrderBanner: boolean;
  isOrdersLoading: boolean;
  ordersError: string | null;
  changeOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  toggleIntegration: (key: IntegrationKey) => void;
};

const TenantContext = createContext<TenantContextValue | null>(null);
const API_BASE_URL = getApiBaseUrl();

const storageKey = (tenantSlug: string) => `orderly:tenant-state:${tenantSlug}`;

const readTenantState = (tenantSlug: string): TenantState => {
  if (typeof window === "undefined") return createInitialTenantState(tenantSlug);
  const raw = window.localStorage.getItem(storageKey(tenantSlug));
  if (!raw) return createInitialTenantState(tenantSlug);

  try {
    const parsed = JSON.parse(raw) as TenantState & { orders: Array<Omit<Order, "createdAt"> & { createdAt: string }> };
    return {
      integrations: parsed.integrations,
      orders: parsed.orders.map((order) => ({ ...order, createdAt: new Date(order.createdAt) })),
    };
  } catch {
    return createInitialTenantState(tenantSlug);
  }
};

type TenantProviderProps = {
  tenant: Tenant;
  children: ReactNode;
};

type ApiOrderItem = {
  id: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  notes: string | null;
};

type ApiOrder = {
  id: string;
  externalId: string;
  customerName: string;
  customerPhone: string | null;
  location: {
    id: string;
    name: string;
    city: string;
  };
  channel: "phone" | "sms" | "email" | "web";
  status: OrderStatus;
  pickupAt: string | null;
  totalAmount: number;
  aiConfidence: number | null;
  createdAt: string;
  items: ApiOrderItem[];
};

type ApiOrdersResponse = {
  success: boolean;
  data: {
    orders: ApiOrder[];
  };
};

const toUiOrder = (order: ApiOrder): Order => ({
  id: order.id,
  externalId: order.externalId,
  customer: order.customerName,
  phone: order.customerPhone ?? "",
  location: order.location,
  channel: order.channel,
  items: order.items.map((item, idx) => ({
    id: Number(item.id.replace(/\D/g, "").slice(-6) || idx + 1),
    name: item.itemName,
    category: "Unkategorisiert",
    price: item.unitPrice,
    qty: item.qty,
    notes: item.notes ?? "",
  })),
  status: order.status,
  createdAt: new Date(order.createdAt),
  pickup: order.pickupAt ? new Date(order.pickupAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "--:--",
  total: order.totalAmount,
  aiConfidence: order.aiConfidence ?? 0,
});

const fetchOrders = async (tenantSlug: string): Promise<Order[]> => {
  const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantSlug}/orders`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Orders request failed (${response.status})`);
  }
  const data = (await response.json()) as ApiOrdersResponse;
  return data.data.orders.map(toUiOrder);
};

export function TenantProvider({ tenant, children }: TenantProviderProps) {
  const [state, setState] = useState<TenantState>(() => readTenantState(tenant.slug));
  const [showNewOrderBanner, setShowNewOrderBanner] = useState(false);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    setState(readTenantState(tenant.slug));
  }, [tenant.slug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey(tenant.slug), JSON.stringify(state));
  }, [state, tenant.slug]);

  useEffect(() => {
    let active = true;
    let previousFirstOrderId: string | null = null;

    const loadOrders = async () => {
      try {
        setIsOrdersLoading(true);
        const nextOrders = await fetchOrders(tenant.slug);
        if (!active) return;
        if (previousFirstOrderId && nextOrders[0]?.id && nextOrders[0].id !== previousFirstOrderId) {
          setShowNewOrderBanner(true);
          window.setTimeout(() => setShowNewOrderBanner(false), 3000);
        }
        previousFirstOrderId = nextOrders[0]?.id ?? null;
        setState((prev) => ({ ...prev, orders: nextOrders }));
        setOrdersError(null);
      } catch (error) {
        if (!active) return;
        setOrdersError(error instanceof Error ? error.message : "Failed to fetch orders.");
      } finally {
        if (active) setIsOrdersLoading(false);
      }
    };

    void loadOrders();
    const timer = window.setInterval(() => {
      void loadOrders();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [tenant.slug]);

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant,
      orders: state.orders,
      integrations: state.integrations,
      showNewOrderBanner,
      isOrdersLoading,
      ordersError,
      changeOrderStatus: async (orderId, newStatus) => {
        const response = await fetch(
          `${API_BASE_URL}/api/tenants/${tenant.slug}/orders/${orderId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ status: newStatus }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update order status (${response.status})`);
        }

        setState((prev) => ({
          ...prev,
          orders: prev.orders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          ),
        }));
      },
      toggleIntegration: (key) => {
        setState((prev) => ({
          ...prev,
          integrations: { ...prev.integrations, [key]: !prev.integrations[key] },
        }));
      },
    }),
    [isOrdersLoading, ordersError, showNewOrderBanner, state.integrations, state.orders, tenant]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export const useTenantState = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenantState must be used within a TenantProvider.");
  }
  return ctx;
};
