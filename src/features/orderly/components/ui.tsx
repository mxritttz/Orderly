import type { ReactNode } from "react";
import { CHANNELS, STATUS_CONFIG } from "../data";
import { formatTime, timeAgo } from "../utils";
import type { Order, OrderStatus } from "../types";

type BadgeProps = {
  children: ReactNode;
  color: string;
  bg: string;
};

export const Badge = ({ children, color, bg }: BadgeProps) => (
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

export const StatCard = ({ icon, label, value, sub, accent }: StatCardProps) => (
  <div
    className="stat-card"
    style={{
      background: "var(--card-bg)",
      borderRadius: 16,
      padding: "20px 24px",
      border: "1px solid var(--card-border)",
      flex: 1,
      minWidth: 160,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: accent ?? "var(--text-main)" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
  </div>
);

type OrderCardProps = {
  order: Order;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void> | void;
  onSelect: (orderId: string) => void;
  isSelected: boolean;
  index?: number;
};

export const OrderCard = ({
  order,
  onStatusChange,
  onSelect,
  isSelected,
  index = 0,
}: OrderCardProps) => {
  const channel = CHANNELS[order.channel];
  const status = STATUS_CONFIG[order.status];
  const orderedStatuses: Array<{ id: OrderStatus; label: string }> = [
    { id: "new", label: "Neu" },
    { id: "confirmed", label: "Bestaetigt" },
    { id: "preparing", label: "In Zubereitung" },
    { id: "ready", label: "Abholbereit" },
    { id: "done", label: "Erledigt" },
  ];

  return (
    <div
      onClick={() => onSelect(order.id)}
      className="order-card"
      style={{
        background: isSelected ? "#f0f5ff" : "#fff",
        borderRadius: 14,
        padding: "16px 20px",
        border: isSelected ? "2px solid #3b82f6" : "1px solid #e5e7eb",
        cursor: "pointer",
        transition: "all 0.25s ease",
        marginBottom: 10,
        animation: `fadeRise 0.4s ease both`,
        animationDelay: `${Math.min(index * 45, 360)}ms`,
        boxShadow: isSelected ? "0 16px 34px rgba(37,99,235,0.16)" : "0 10px 24px rgba(15,23,42,0.06)",
      }}
    >
      <div className="order-card-layout">
        <div>
          <div className="order-card-top">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-main)" }}>
                  {order.externalId}
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
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>{order.customer}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {formatTime(order.createdAt)} · {timeAgo(order.createdAt)} · Abholung{" "}
                <strong style={{ color: "var(--text-main)" }}>{order.pickup}</strong>
              </div>
              {order.location && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Standort: <strong style={{ color: "var(--text-main)" }}>{order.location.name}</strong>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
            {order.items.map((item, i) => (
              <span
                key={i}
                style={{
                  fontSize: 12,
                  background: "color-mix(in srgb, var(--card-bg) 86%, var(--card-border) 14%)",
                  borderRadius: 6,
                  padding: "3px 8px",
                  color: "var(--text-main)",
                }}
              >
                {item.qty}x {item.name}
                {item.notes && <span style={{ color: "#f59e0b", marginLeft: 4 }}>({item.notes})</span>}
              </span>
            ))}
          </div>
        </div>

        <div className="order-card-status-center">
          <div className="order-status-grid">
            {orderedStatuses.map((entry) => {
              const tone = STATUS_CONFIG[entry.id];
              const isCurrent = order.status === entry.id;
              return (
                <button
                  key={entry.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isCurrent) void onStatusChange(order.id, entry.id);
                  }}
              className={`order-status-btn ${isCurrent ? "active" : ""}`}
              style={{
                borderColor: isCurrent ? tone.color : `${tone.color}7a`,
                background: isCurrent ? `${tone.color}1f` : "var(--card-bg)",
                color: tone.color,
                boxShadow: isCurrent ? `0 0 0 1px ${tone.color}28 inset, 0 8px 18px ${tone.color}18` : "none",
              }}
              disabled={isCurrent}
              aria-pressed={isCurrent}
                  title={isCurrent ? "Aktueller Status" : `Status setzen: ${entry.label}`}
                >
                  {entry.label}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="order-card-price">
          <div className="order-card-total">
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-main)" }}>
              {order.total.toFixed(2)} EUR
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              AI {Math.round(order.aiConfidence * 100)}%
            </div>
          </div>
        </aside>
      </div>
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

export const IntegrationCard = ({
  name,
  icon,
  description,
  connected,
  onToggle,
}: IntegrationCardProps) => (
  <div
    className="integration-card"
    style={{
      background: "var(--card-bg)",
      borderRadius: 14,
      padding: "20px",
      border: connected ? "2px solid #10b981" : "1px solid var(--card-border)",
      marginBottom: 12,
      transition: "all 0.2s ease",
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-main)" }}>{name}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{description}</div>
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
        {connected ? "Verbunden" : "Verbinden"}
      </button>
    </div>
    {connected && (
      <div
        style={{
          marginTop: 12,
          padding: "10px 14px",
          background: "color-mix(in srgb, var(--card-bg) 90%, var(--card-border) 10%)",
          borderRadius: 8,
          fontSize: 12,
          color: "var(--text-muted)",
          fontFamily: "monospace",
        }}
      >
        Status: Aktiv · Letzte Sync: {formatTime(new Date())} · API-Key: ****-****-7f3a
      </div>
    )}
  </div>
);
