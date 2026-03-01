import { useMemo, useState } from "react";
import { OrderCard, StatCard } from "../components/ui";
import { useTenantState } from "../context";
import type { Filter } from "../types";

export default function DashboardPage() {
  const { orders, changeOrderStatus, showNewOrderBanner, isOrdersLoading, ordersError } =
    useTenantState();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  const activeOrders = useMemo(() => orders.filter((order) => order.status !== "done"), [orders]);
  const newOrders = useMemo(() => orders.filter((order) => order.status === "new"), [orders]);
  const todayRevenue = useMemo(
    () => orders.filter((order) => order.status === "done").reduce((sum, order) => sum + order.total, 0),
    [orders]
  );
  const avgConfidence = useMemo(
    () =>
      orders.length > 0
        ? orders.reduce((sum, order) => sum + order.aiConfidence, 0) / orders.length
        : 0,
    [orders]
  );

  const filteredOrders = useMemo(
    () =>
      orders
        .filter((order) => {
          if (filter === "active") return order.status !== "done";
          if (filter === "new") return order.status === "new";
          if (filter === "done") return order.status === "done";
          return true;
        })
        .filter((order) =>
          locationFilter === "all" ? true : order.location?.id === locationFilter
        )
        .filter((order) =>
          searchTerm
            ? order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
              order.externalId.toLowerCase().includes(searchTerm.toLowerCase())
            : true
        ),
    [filter, locationFilter, orders, searchTerm]
  );

  const selectedOrderData = useMemo(
    () => filteredOrders.find((order) => order.id === selectedOrder) ?? filteredOrders[0] ?? null,
    [filteredOrders, selectedOrder]
  );

  const locationOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; city: string }>();
    for (const order of orders) {
      if (order.location) map.set(order.location.id, order.location);
    }
    return Array.from(map.values());
  }, [orders]);

  const filterItems: { id: Filter; label: string; count: number }[] = [
    { id: "active", label: "Aktiv", count: activeOrders.length },
    { id: "new", label: "Neu", count: newOrders.length },
    { id: "done", label: "Erledigt", count: orders.filter((order) => order.status === "done").length },
    { id: "all", label: "Alle", count: orders.length },
  ];

  return (
    <>
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
          Neue Bestellung eingegangen!
        </div>
      )}

      <div className="dashboard-hero">
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
          Bestellungen
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "4px 0 0" }}>
          Uebersicht aller eingehenden Bestellungen vom AI-Agenten
        </p>
      </div>

      <div className="stats-grid">
        <StatCard icon="📦" label="Offene Bestellungen" value={activeOrders.length} sub={`${newOrders.length} neue`} accent="#ef4444" />
        <StatCard icon="💶" label="Umsatz heute" value={`${todayRevenue.toFixed(2)} EUR`} sub="Abgeschlossene Bestellungen" accent="#10b981" />
        <StatCard icon="🤖" label="AI-Genauigkeit" value={`${Math.round(avgConfidence * 100)}%`} sub="Durchschnittliche Konfidenz" accent="#3b82f6" />
        <StatCard icon="⏱️" label="Ø Bearbeitungszeit" value="4.2 Min" sub="Vom Eingang bis Bestaetigung" accent="#8b5cf6" />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {filterItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              style={{
                padding: "6px 16px",
                borderRadius: 9999,
                background: filter === item.id ? "#111827" : "var(--card-bg)",
                color: filter === item.id ? "#fff" : "var(--text-muted)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                border: filter === item.id ? "none" : "1px solid var(--card-border)",
              }}
              className="filter-pill"
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div className="location-switch-wrap">
            <span className="location-switch-label">Standort</span>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="location-switch-select"
              aria-label="Standort auswaehlen"
            >
              <option value="all">Alle Standorte</option>
              {locationOptions.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="Suche nach Name oder ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dashboard-search-input"
          />
        </div>
      </div>

      <div className="dashboard-grid">
        <div>
        {isOrdersLoading && orders.length === 0 && (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 14 }}>
            Bestellungen werden geladen...
          </div>
        )}
        {ordersError && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#991b1b",
              fontSize: 13,
            }}
          >
            API-Fehler: {ordersError}
          </div>
        )}
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)", fontSize: 14 }}>
            Keine Bestellungen gefunden.
          </div>
        ) : (
          filteredOrders.map((order, idx) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={changeOrderStatus}
              onSelect={setSelectedOrder}
              isSelected={(selectedOrderData?.id ?? selectedOrder) === order.id}
              index={idx}
            />
          ))
        )}
        </div>

        <aside className="order-detail-panel">
          <div className="order-detail-title">Ausgewaehlte Bestellung</div>
          {selectedOrderData ? (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
                {selectedOrderData.externalId}
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 12 }}>
                {selectedOrderData.customer} · {selectedOrderData.phone || "keine Nummer"}
              </div>
              <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
                {selectedOrderData.items.map((item, idx) => (
                  <div key={`${item.name}-${idx}`} className="order-detail-item">
                    <span>{item.qty}x {item.name}</span>
                    <strong>{(item.qty * item.price).toFixed(2)} EUR</strong>
                  </div>
                ))}
              </div>
              <div className="order-detail-foot">
                <span>Gesamt</span>
                <strong>{selectedOrderData.total.toFixed(2)} EUR</strong>
              </div>
            </>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Keine Bestellung ausgewaehlt.</div>
          )}
        </aside>
      </div>
    </>
  );
}
