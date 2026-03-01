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
  const nextStatus: Record<OrderStatus, OrderStatus> = {
    new: "confirmed",
    confirmed: "preparing",
    preparing: "ready",
    ready: "done",
    done: "done",
  };
  const nextLabel: Record<OrderStatus, string> = {
    new: "Bestaetigen",
    confirmed: "Zubereiten",
    preparing: "Fertig",
    ready: "Erledigt",
    done: "Erledigt",
  };

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
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{order.customer}</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            {formatTime(order.createdAt)} · {timeAgo(order.createdAt)} · Abholung{" "}
            <strong style={{ color: "#374151" }}>{order.pickup}</strong>
          </div>
          {order.location && (
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              Standort: <strong style={{ color: "#374151" }}>{order.location.name}</strong>
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
            {order.total.toFixed(2)} EUR
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
            {item.qty}x {item.name}
            {item.notes && <span style={{ color: "#f59e0b", marginLeft: 4 }}>({item.notes})</span>}
          </span>
        ))}
      </div>
      {order.status !== "done" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              void onStatusChange(order.id, nextStatus[order.status]);
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
            {nextLabel[order.status]}
          </button>
          {order.status === "new" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                void onStatusChange(order.id, "done");
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
              Ablehnen
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
      background: "#fff",
      borderRadius: 14,
      padding: "20px",
      border: connected ? "2px solid #10b981" : "1px solid #e5e7eb",
      marginBottom: 12,
      transition: "all 0.2s ease",
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
        {connected ? "Verbunden" : "Verbinden"}
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
