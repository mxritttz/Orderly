import { CHANNELS } from "../data";
import { IntegrationCard } from "../components/ui";
import { useTenantState } from "../context";

export default function IntegrationsPage() {
  const { integrations, toggleIntegration } = useTenantState();

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>Integrationen</h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>
          Verbinde dein Kassensystem, damit Bestellungen automatisch uebertragen werden
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
        <strong>So funktioniert&apos;s:</strong> Verbinde dein bestehendes Kassensystem und alle
        eingehenden Bestellungen werden automatisch synchronisiert.
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
        Kassensysteme (POS)
      </h2>

      <IntegrationCard
        name="Lightspeed Restaurant"
        icon="💜"
        description="Vollstaendige POS-Integration mit Echtzeit-Sync"
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
        description="Ideal fuer kleine Imbisse & Foodtrucks"
        connected={integrations.sumup}
        onToggle={() => toggleIntegration("sumup")}
      />

      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 12, marginTop: 28 }}>
        Eigenes System / Custom API
      </h2>

      <IntegrationCard
        name="Custom Webhook / REST API"
        icon="🔧"
        description="Verbinde jedes beliebige System ueber Webhook oder REST-Endpunkt"
        connected={integrations.custom}
        onToggle={() => toggleIntegration("custom")}
      />

      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 12, marginTop: 28 }}>
        Kanaele
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {Object.values(CHANNELS).map((channel) => (
          <div
            key={channel.label}
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
            <span style={{ fontSize: 22 }}>{channel.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{channel.label}</div>
              <div style={{ fontSize: 12, color: "#10b981" }}>Aktiv</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
