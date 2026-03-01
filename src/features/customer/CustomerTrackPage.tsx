import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import OrderlyLogo from "../../components/OrderlyLogo";
import { TENANTS } from "../orderly/data";
import { getApiBaseUrl } from "../../shared/apiBaseUrl";

const stages = [
  { id: "new", title: "Bestellung eingegangen", note: "Wir haben deine Bestellung erhalten." },
  { id: "confirmed", title: "Bestaetigt", note: "Deine Bestellung wurde vom Team angenommen." },
  { id: "preparing", title: "In Zubereitung", note: "Kueche arbeitet gerade an deiner Bestellung." },
  { id: "ready", title: "Abholbereit", note: "Fast fertig. Du kannst gleich los." },
  { id: "done", title: "Abgeschlossen", note: "Danke fuer deine Bestellung." },
] as const;

export default function CustomerTrackPage() {
  const { tenantSlug = "doner-palace", orderId = "demo-live" } = useParams<{
    tenantSlug: string;
    orderId: string;
  }>();
  const fallbackTenant =
    TENANTS.find((entry) => entry.slug === tenantSlug) ??
    TENANTS[0] ?? {
      id: "tenant-x",
      slug: tenantSlug,
      name: "Orderly Kitchen",
      city: "Berlin",
      timezone: "Europe/Berlin",
    };
  const [order, setOrder] = useState<{
    id: string;
    externalId: string;
    status: "new" | "confirmed" | "preparing" | "ready" | "done";
    customerName: string;
    createdAt: string;
    pickupAt: string | null;
    totalAmount: number;
  } | null>(null);
  const [tenantName, setTenantName] = useState(fallbackTenant.name);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const API_BASE_URL = getApiBaseUrl();
    let active = true;

    const load = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/public/tenants/${tenantSlug}/orders/${orderId}`);
        if (!response.ok) {
          throw new Error(`Tracking konnte nicht geladen werden (${response.status}).`);
        }
        const payload = (await response.json()) as {
          data: {
            tenant: { name: string };
            order: {
              id: string;
              externalId: string;
              status: "new" | "confirmed" | "preparing" | "ready" | "done";
              customerName: string;
              createdAt: string;
              pickupAt: string | null;
              totalAmount: number;
            };
          };
        };
        if (!active) return;
        setTenantName(payload.data.tenant.name);
        setOrder(payload.data.order);
        setError(null);
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : "Tracking derzeit nicht verfuegbar.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), 12000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [orderId, tenantSlug]);

  const currentStage = useMemo(() => {
    if (!order) return 0;
    const map: Record<typeof order.status, number> = {
      new: 0,
      confirmed: 1,
      preparing: 2,
      ready: 3,
      done: 4,
    };
    return map[order.status];
  }, [order]);

  const etaLabel = useMemo(() => {
    if (!order) return "Wird berechnet";
    if (order.status === "done") return "Abgeschlossen";
    if (order.status === "ready") return "Jetzt bereit";
    if (!order.pickupAt) return "In Bearbeitung";
    const diffMinutes = Math.max(
      0,
      Math.round((new Date(order.pickupAt).getTime() - Date.now()) / 60000)
    );
    return diffMinutes <= 0 ? "Jetzt bereit" : `in ca. ${diffMinutes} Min`;
  }, [order]);

  return (
    <div className="customer-shell">
      <div className="customer-bg-orb customer-bg-orb-a" />
      <div className="customer-bg-orb customer-bg-orb-b" />

      <header className="customer-topbar">
        <div className="customer-brand-wrap">
          <div className="customer-brand-mark">
            <OrderlyLogo width={230} />
          </div>
          <div className="customer-brand-copy">
            <strong>Orderly Track</strong>
            <span>Live-Updates bis zur Abholung</span>
          </div>
        </div>
        <div className="customer-topbar-meta">
          <strong>{tenantName}</strong>
          <span>Live Tracking</span>
        </div>
      </header>

      <main className="customer-track-wrap">
        <section className="customer-card customer-track-card">
          <div className="customer-track-head">
            <div>
              <h1>Bestellung {order?.externalId ?? orderId}</h1>
              <p>
                {isLoading
                  ? "Tracking wird geladen..."
                  : order
                    ? `Hallo ${order.customerName}, hier ist dein aktueller Stand.`
                    : "Bestellung konnte nicht geladen werden."}
              </p>
              <div className="customer-live-pill">Live Status</div>
            </div>
            <div className="customer-eta">
              <span>Voraussichtliche Abholung</span>
              <strong>{etaLabel}</strong>
            </div>
          </div>

          <div className="customer-progress">
            <div className="customer-progress-bar">
              <div style={{ width: `${(currentStage / (stages.length - 1)) * 100}%` }} />
            </div>
            <div className="customer-progress-steps">
              {stages.map((stage, idx) => {
                const done = idx <= currentStage;
                return (
                  <article key={stage.id} className={`customer-progress-step ${done ? "done" : ""}`}>
                    <span>{idx + 1}</span>
                    <h3>{stage.title}</h3>
                    <p>{stage.note}</p>
                  </article>
                );
              })}
            </div>
          </div>

          {error && <div className="customer-error" style={{ marginTop: 12 }}>{error}</div>}

          <div className="customer-track-foot">
            <Link className="customer-submit customer-submit-secondary" to={`/c/${tenantSlug}`}>
              Neue Bestellung
            </Link>
            <span>{new Date().toLocaleString("de-DE")} · Auto-Update bei Reload</span>
          </div>
        </section>
      </main>
    </div>
  );
}
