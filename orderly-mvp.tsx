import { useState, useEffect, type ReactNode } from "react";
import _ from "lodash";

type OrderStatus = "new" | "confirmed" | "preparing" | "ready" | "done";
type ChannelKey = "phone" | "sms" | "email" | "web";
type Page = "dashboard" | "integrations" | "settings";
type Filter = "active" | "new" | "done" | "all";
type IntegrationKey = "lightspeed" | "orderbird" | "sumup" | "custom";

type MenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
};

type OrderItem = MenuItem & {
  qty: number;
  notes: string;
};

type Order = {
  id: string;
  customer: string;
  phone: string;
  channel: ChannelKey;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  pickup: string;
  total: number;
  aiConfidence: number;
};

type IntegrationState = Record<IntegrationKey, boolean>;

// ── Mock Data ──────────────────────────────────────────────
const MOCK_MENU: MenuItem[] = [
  { id: 1, name: "Döner Kebab", price: 7.5, category: "Döner" },
  { id: 2, name: "Döner Teller", price: 9.0, category: "Döner" },
  { id: 3, name: "Dürüm", price: 8.0, category: "Döner" },
  { id: 4, name: "Lahmacun", price: 6.5, category: "Türkisch" },
  { id: 5, name: "Pommes klein", price: 3.0, category: "Beilagen" },
  { id: 6, name: "Pommes groß", price: 4.5, category: "Beilagen" },
  { id: 7, name: "Falafel Wrap", price: 7.0, category: "Vegetarisch" },
  { id: 8, name: "Ayran", price: 2.0, category: "Getränke" },
  { id: 9, name: "Cola 0.33l", price: 2.5, category: "Getränke" },
  { id: 10, name: "Wasser 0.5l", price: 1.5, category: "Getränke" },
];

const CHANNELS: Record<ChannelKey, { label: string; icon: string; color: string }> = {
  phone: { label: "Telefon", icon: "📞", color: "#3b82f6" },
  sms: { label: "SMS", icon: "💬", color: "#8b5cf6" },
  email: { label: "E-Mail", icon: "📧", color: "#06b6d4" },
  web: { label: "Web", icon: "🌐", color: "#10b981" },
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  new: { label: "Neu", color: "#ef4444", bg: "#fef2f2" },
  confirmed: { label: "Bestätigt", color: "#f59e0b", bg: "#fffbeb" },
  preparing: { label: "In Zubereitung", color: "#3b82f6", bg: "#eff6ff" },
  ready: { label: "Abholbereit", color: "#10b981", bg: "#f0fdf4" },
  done: { label: "Erledigt", color: "#6b7280", bg: "#f9fafb" },
};

const generateOrders = (): Order[] => [
  {
    id: "ORD-1041",
    customer: "Müller, Stefan",
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
    customer: "Yilmaz, Ayse",
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
    customer: "Schmidt, Anna",
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
    customer: "Weber, Thomas",
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

// ── Utility ────────────────────────────────────────────────
const formatTime = (date: Date | string | number) =>
  new Date(date).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

const timeAgo = (date: Date | string | number) => {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `vor ${mins} Min`;
  return `vor ${Math.floor(mins / 60)} Std`;
};

const pickOne = <T,>(values: readonly T[]): T =>
  values[_.random(0, values.length - 1)] as T;

// ── Components ─────────────────────────────────────────────

type BadgeProps = {
  children: ReactNode;
  color: string;
  bg: string;
};

const Badge = ({ children, color, bg }: BadgeProps) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 10px",
      borderRadius: 9999,
      fontSize: 12,
      fontWeight: 600,
      color,
      backgroundColor: bg,
      border: `1px solid ${color}22`,
    }}
  >
    {children}
  </span>
);

type StatCardProps = {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
};

const StatCard = ({ icon, label, value, sub, accent }: StatCardProps) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 16,
      padding: "20px 24px",
      border: "1px solid #e5e7eb",
      flex: 1,
      minWidth: 160,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{label}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: accent || "#111827" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{sub}</div>}
  </div>
);

type OrderCardProps = {
  order: Order;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  onSelect: (orderId: string) => void;
  isSelected: boolean;
};

const OrderCard = ({ order, onStatusChange, onSelect, isSelected }: OrderCardProps) => {
  const channel = CHANNELS[order.channel];
  const status = STATUS_CONFIG[order.status];
  const nextStatus: Record<OrderStatus, OrderStatus> = {
    new: "confirmed",
    confirmed: "preparing",
    preparing: "ready",
    ready: "done",
    done: "done",
  };
  const nextLabel: Record<OrderStatus, string> = {
    new: "Bestätigen",
    confirmed: "Zubereiten",
    preparing: "Fertig",
    ready: "Erledigt",
    done: "Erledigt",
  };

  return (
    <div
      onClick={() => onSelect(order.id)}
      style={{
        background: isSelected ? "#f0f5ff" : "#fff",
        borderRadius: 14,
        padding: "16px 20px",
        border: isSelected ? "2px solid #3b82f6" : "1px solid #e5e7eb",
        cursor: "pointer",
        transition: "all 0.15s ease",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
              {order.id}
            </span>
            <Badge color={status.color} bg={status.bg}>
              {status.label}
            </Badge>
            <span
              title={channel.label}
              style={{
                fontSize: 14,
                background: channel.color + "15",
                borderRadius: 6,
                padding: "2px 6px",
              }}
            >
              {channel.icon}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
            {order.customer}
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            {formatTime(order.createdAt)} · {timeAgo(order.createdAt)} · Abholung{" "}
            <strong style={{ color: "#374151" }}>{order.pickup}</strong>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
            {order.total.toFixed(2)} €
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
            AI {Math.round(order.aiConfidence * 100)}%
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {order.items.map((item, i) => (
          <span
            key={i}
            style={{
              fontSize: 12,
              background: "#f3f4f6",
              borderRadius: 6,
              padding: "3px 8px",
              color: "#374151",
            }}
          >
            {item.qty}× {item.name}
            {item.notes && (
              <span style={{ color: "#f59e0b", marginLeft: 4 }}>({item.notes})</span>
            )}
          </span>
        ))}
      </div>
      {order.status !== "done" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(order.id, nextStatus[order.status]);
            }}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              background: status.color,
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ✓ {nextLabel[order.status]}
          </button>
          {order.status === "new" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(order.id, "done");
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#6b7280",
                fontWeight: 500,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ✕ Ablehnen
            </button>
          )}
        </div>
      )}
    </div>
  );
};

type IntegrationCardProps = {
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  onToggle: () => void;
};

const IntegrationCard = ({
  name,
  icon,
  description,
  connected,
  onToggle,
}: IntegrationCardProps) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 14,
      padding: "20px",
      border: connected ? "2px solid #10b981" : "1px solid #e5e7eb",
      marginBottom: 12,
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{name}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{description}</div>
        </div>
      </div>
      <button
        onClick={onToggle}
        style={{
          padding: "8px 20px",
          borderRadius: 10,
          border: "none",
          background: connected ? "#f0fdf4" : "#3b82f6",
          color: connected ? "#10b981" : "#fff",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          minWidth: 110,
        }}
      >
        {connected ? "✓ Verbunden" : "Verbinden"}
      </button>
    </div>
    {connected && (
      <div
        style={{
          marginTop: 12,
          padding: "10px 14px",
          background: "#f9fafb",
          borderRadius: 8,
          fontSize: 12,
          color: "#6b7280",
          fontFamily: "monospace",
        }}
      >
        Status: Aktiv · Letzte Sync: {formatTime(new Date())} · API-Key: ****-****-7f3a
      </div>
    )}
  </div>
);

// ── Main App ───────────────────────────────────────────────
export default function App() {
  const [orders, setOrders] = useState<Order[]>(generateOrders);
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [integrations, setIntegrations] = useState<IntegrationState>({
    lightspeed: false,
    orderbird: false,
    sumup: false,
    custom: false,
  });
  const [showNewOrderBanner, setShowNewOrderBanner] = useState(false);

  // Simulate incoming order every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      const newOrder: Order = {
        id: `ORD-${1042 + Math.floor(Math.random() * 900)}`,
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
          notes: pickOne(["", "", "", "Extra scharf", "Ohne Soße", "Doppelt Fleisch"]),
        })),
        status: "new",
        createdAt: new Date(),
        pickup: `${_.random(15, 19)}:${pickOne(["00", "15", "30", "45"] as const)}`,
        total: _.random(8, 35, true).toFixed(2) * 1,
        aiConfidence: _.random(0.85, 0.99, true),
      };
      setOrders((prev) => [newOrder, ...prev]);
      setShowNewOrderBanner(true);
      setTimeout(() => setShowNewOrderBanner(false), 3000);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const toggleIntegration = (key: IntegrationKey) => {
    setIntegrations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "active") return o.status !== "done";
    if (filter === "new") return o.status === "new";
    if (filter === "done") return o.status === "done";
    return true;
  }).filter((o) =>
    searchTerm
      ? o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const activeOrders = orders.filter((o) => o.status !== "done");
  const newOrders = orders.filter((o) => o.status === "new");
  const todayRevenue = orders
    .filter((o) => o.status === "done")
    .reduce((sum, o) => sum + o.total, 0);
  const avgConfidence =
    orders.length > 0
      ? orders.reduce((sum, o) => sum + o.aiConfidence, 0) / orders.length
      : 0;

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: "dashboard", label: "Bestellungen", icon: "📋" },
    { id: "integrations", label: "Integrationen", icon: "🔗" },
    { id: "settings", label: "Einstellungen", icon: "⚙️" },
  ];

  const filterItems: { id: Filter; label: string; count: number }[] = [
    { id: "active", label: "Aktiv", count: activeOrders.length },
    { id: "new", label: "Neu", count: newOrders.length },
    { id: "done", label: "Erledigt", count: orders.filter((o) => o.status === "done").length },
    { id: "all", label: "Alle", count: orders.length },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: "#f8f9fb" }}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 240,
          background: "#111827",
          color: "#fff",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: 32, paddingLeft: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
            <span style={{ color: "#3b82f6" }}>⚡</span> Orderly
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
            AI Order Management
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 12px",
                marginBottom: 4,
                borderRadius: 10,
                border: "none",
                background: page === item.id ? "#1f2937" : "transparent",
                color: page === item.id ? "#fff" : "#9ca3af",
                fontSize: 14,
                fontWeight: page === item.id ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {item.id === "dashboard" && newOrders.length > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "#ef4444",
                    color: "#fff",
                    borderRadius: 99,
                    padding: "1px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {newOrders.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div
          style={{
            background: "#1f2937",
            borderRadius: 12,
            padding: 14,
            fontSize: 12,
            color: "#9ca3af",
          }}
        >
          <div style={{ fontWeight: 600, color: "#d1d5db", marginBottom: 4 }}>
            🟢 Agent aktiv
          </div>
          Nimmt Bestellungen über Telefon, SMS & E-Mail entgegen.
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
        {/* New Order Banner */}
        {showNewOrderBanner && (
          <div
            style={{
              position: "fixed",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#3b82f6",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              zIndex: 999,
              boxShadow: "0 8px 30px rgba(59,130,246,0.3)",
              animation: "slideDown 0.3s ease",
            }}
          >
            📞 Neue Bestellung eingegangen!
          </div>
        )}

        {page === "dashboard" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>
                Bestellungen
              </h1>
              <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>
                Übersicht aller eingehenden Bestellungen vom AI-Agenten
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
              <StatCard
                icon="📦"
                label="Offene Bestellungen"
                value={activeOrders.length}
                sub={`${newOrders.length} neue`}
                accent="#ef4444"
              />
              <StatCard
                icon="💶"
                label="Umsatz heute"
                value={`${todayRevenue.toFixed(2)} €`}
                sub="Abgeschlossene Bestellungen"
                accent="#10b981"
              />
              <StatCard
                icon="🤖"
                label="AI-Genauigkeit"
                value={`${Math.round(avgConfidence * 100)}%`}
                sub="Durchschnittliche Konfidenz"
                accent="#3b82f6"
              />
              <StatCard
                icon="⏱️"
                label="Ø Bearbeitungszeit"
                value="4.2 Min"
                sub="Vom Eingang bis Bestätigung"
                accent="#8b5cf6"
              />
            </div>

            {/* Filters */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                {filterItems.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 9999,
                      border: "none",
                      background: filter === f.id ? "#111827" : "#fff",
                      color: filter === f.id ? "#fff" : "#6b7280",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      border: filter === f.id ? "none" : "1px solid #e5e7eb",
                    }}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Suche nach Name oder ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  fontSize: 13,
                  width: 220,
                  outline: "none",
                }}
              />
            </div>

            {/* Order List */}
            <div>
              {filteredOrders.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 48,
                    color: "#9ca3af",
                    fontSize: 14,
                  }}
                >
                  Keine Bestellungen gefunden.
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onSelect={setSelectedOrder}
                    isSelected={selectedOrder === order.id}
                  />
                ))
              )}
            </div>
          </>
        )}

        {page === "integrations" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>
                Integrationen
              </h1>
              <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>
                Verbinde dein Kassensystem, damit Bestellungen automatisch übertragen werden
              </p>
            </div>

            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 14,
                padding: "16px 20px",
                marginBottom: 24,
                fontSize: 13,
                color: "#1e40af",
              }}
            >
              <strong>💡 So funktioniert's:</strong> Verbinde dein bestehendes Kassensystem und
              alle eingehenden Bestellungen werden automatisch synchronisiert. Kein manuelles
              Eintippen mehr.
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
              Kassensysteme (POS)
            </h2>

            <IntegrationCard
              name="Lightspeed Restaurant"
              icon="💜"
              description="Vollständige POS-Integration mit Echtzeit-Sync"
              connected={integrations.lightspeed}
              onToggle={() => toggleIntegration("lightspeed")}
            />
            <IntegrationCard
              name="orderbird"
              icon="🐦"
              description="Beliebt bei Gastronomie in DACH – Direkte API-Anbindung"
              connected={integrations.orderbird}
              onToggle={() => toggleIntegration("orderbird")}
            />
            <IntegrationCard
              name="SumUp POS"
              icon="🟦"
              description="Ideal für kleine Imbisse & Foodtrucks"
              connected={integrations.sumup}
              onToggle={() => toggleIntegration("sumup")}
            />

            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#374151",
                marginBottom: 12,
                marginTop: 28,
              }}
            >
              Eigenes System / Custom API
            </h2>

            <IntegrationCard
              name="Custom Webhook / REST API"
              icon="🔧"
              description="Verbinde jedes beliebige System über Webhook oder REST-Endpunkt"
              connected={integrations.custom}
              onToggle={() => toggleIntegration("custom")}
            />

            {integrations.custom && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: 20,
                  border: "1px solid #e5e7eb",
                  marginTop: -4,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
                  Webhook-Konfiguration
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label
                      style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                    >
                      Endpoint URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://dein-system.de/api/orders"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        fontSize: 13,
                        fontFamily: "monospace",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                    >
                      API-Key (optional)
                    </label>
                    <input
                      type="password"
                      placeholder="sk-xxxxxxxxxxxxxxxx"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        fontSize: 13,
                        fontFamily: "monospace",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                    >
                      Payload-Format (Beispiel)
                    </label>
                    <pre
                      style={{
                        background: "#111827",
                        color: "#a5f3fc",
                        padding: 14,
                        borderRadius: 8,
                        fontSize: 12,
                        overflow: "auto",
                        margin: 0,
                      }}
                    >{`{
  "order_id": "ORD-1041",
  "customer": "Müller, Stefan",
  "phone": "+49 176 4821 3347",
  "items": [
    { "name": "Döner Kebab", "qty": 2, "price": 7.50, "notes": "Ohne Zwiebeln" },
    { "name": "Pommes klein", "qty": 1, "price": 3.00 }
  ],
  "pickup_time": "15:30",
  "total": 23.00,
  "channel": "phone",
  "created_at": "2026-02-27T15:28:00Z"
}`}</pre>
                  </div>
                  <button
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      border: "none",
                      background: "#3b82f6",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      alignSelf: "flex-start",
                      marginTop: 4,
                    }}
                  >
                    🔌 Webhook testen
                  </button>
                </div>
              </div>
            )}

            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#374151",
                marginBottom: 12,
                marginTop: 28,
              }}
            >
              Kanäle
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {Object.values(CHANNELS).map((ch) => (
                <div
                  key={ch.label}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: "14px 18px",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{ch.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>
                      {ch.label}
                    </div>
                    <div style={{ fontSize: 12, color: "#10b981" }}>🟢 Aktiv</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {page === "settings" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>
                Einstellungen
              </h1>
              <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>
                Konfiguriere deinen AI-Agenten und Geschäftsdaten
              </p>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 24,
                border: "1px solid #e5e7eb",
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>
                🏪 Betrieb
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Name", placeholder: "Döner Palace", value: "" },
                  { label: "Telefonnummer", placeholder: "+49 30 12345678", value: "" },
                  { label: "Adresse", placeholder: "Hauptstraße 42, 10115 Berlin", value: "" },
                  { label: "Öffnungszeiten", placeholder: "Mo-Sa 11:00 - 22:00", value: "" },
                ].map((field) => (
                  <div key={field.label}>
                    <label
                      style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                    >
                      {field.label}
                    </label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 24,
                border: "1px solid #e5e7eb",
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>
                🤖 AI-Agent
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label
                    style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                  >
                    Begrüßung
                  </label>
                  <textarea
                    rows={2}
                    placeholder='Willkommen beim Döner Palace! Ich bin Ihr digitaler Assistent. Wie kann ich Ihnen helfen?'
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                  >
                    Sprache
                  </label>
                  <select
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                      outline: "none",
                      background: "#fff",
                    }}
                  >
                    <option>Deutsch</option>
                    <option>Türkisch</option>
                    <option>Englisch</option>
                    <option>Arabisch</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <input type="checkbox" id="upsell" defaultChecked style={{ accentColor: "#3b82f6" }} />
                  <label htmlFor="upsell" style={{ fontSize: 13, color: "#374151" }}>
                    Upselling aktivieren (z.B. Getränke vorschlagen)
                  </label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" id="noshow" defaultChecked style={{ accentColor: "#3b82f6" }} />
                  <label htmlFor="noshow" style={{ fontSize: 13, color: "#374151" }}>
                    Automatische Abholungs-Erinnerung per SMS
                  </label>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 24,
                border: "1px solid #e5e7eb",
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>
                📋 Speisekarte
              </h3>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
                Deine aktuelle Speisekarte, die der AI-Agent verwendet:
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: "#6b7280", fontWeight: 600 }}>Gericht</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: "#6b7280", fontWeight: 600 }}>Kategorie</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: "#6b7280", fontWeight: 600 }}>Preis</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_MENU.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px 12px", color: "#111827" }}>{item.name}</td>
                      <td style={{ padding: "8px 12px", color: "#6b7280" }}>{item.category}</td>
                      <td style={{ padding: "8px 12px", color: "#111827", textAlign: "right", fontWeight: 600 }}>{item.price.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                style={{
                  marginTop: 12,
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "1px dashed #d1d5db",
                  background: "#fff",
                  color: "#6b7280",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                + Gericht hinzufügen
              </button>
            </div>
          </>
        )}
      </main>

      <style>{`
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        button:hover { opacity: 0.9; }
      `}</style>
    </div>
  );
}
