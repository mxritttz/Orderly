import { MOCK_MENU } from "../data";

export default function SettingsPage() {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>Einstellungen</h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>
          Konfiguriere deinen AI-Agenten und Geschaeftsdaten
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
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>Betrieb</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {[
            { label: "Name", placeholder: "Doener Palace" },
            { label: "Telefonnummer", placeholder: "+49 30 12345678" },
            { label: "Adresse", placeholder: "Hauptstrasse 42, 10115 Berlin" },
            { label: "Oeffnungszeiten", placeholder: "Mo-Sa 11:00 - 22:00" },
          ].map((field) => (
            <div key={field.label}>
              <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
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
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>AI-Agent</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
              Begruessung
            </label>
            <textarea
              rows={2}
              placeholder="Willkommen beim Doener Palace! Ich bin Ihr digitaler Assistent."
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
            <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
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
              <option>Tuerkisch</option>
              <option>Englisch</option>
              <option>Arabisch</option>
            </select>
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
          Speisekarte
        </h3>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          Aktuelle Speisekarte, die der AI-Agent verwendet:
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: "8px 12px", color: "#6b7280", fontWeight: 600 }}>
                Gericht
              </th>
              <th style={{ textAlign: "left", padding: "8px 12px", color: "#6b7280", fontWeight: 600 }}>
                Kategorie
              </th>
              <th style={{ textAlign: "right", padding: "8px 12px", color: "#6b7280", fontWeight: 600 }}>
                Preis
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_MENU.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "8px 12px", color: "#111827" }}>{item.name}</td>
                <td style={{ padding: "8px 12px", color: "#6b7280" }}>{item.category}</td>
                <td style={{ padding: "8px 12px", color: "#111827", textAlign: "right", fontWeight: 600 }}>
                  {item.price.toFixed(2)} EUR
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
