import { MOCK_MENU } from "../data";
import { useTheme } from "../../../theme/ThemeContext";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Einstellungen</h1>
        <p className="settings-subtitle">
          Konfiguriere deinen AI-Agenten und Geschaeftsdaten
        </p>
      </div>

      <section className="settings-card">
        <div className="settings-card-top">
          <h3 className="settings-card-title">Anzeige</h3>
          <button
            type="button"
            className={`theme-toggle ${theme === "dark" ? "dark" : ""}`}
            onClick={toggleTheme}
            aria-label="Dark Mode umschalten"
            aria-pressed={theme === "dark"}
          >
            <span className="theme-toggle-track">
              <span className="theme-toggle-knob" />
            </span>
            <span className="theme-toggle-text">
              {theme === "dark" ? "Dark Mode aktiv" : "Light Mode aktiv"}
            </span>
          </button>
        </div>
      </section>

      <section className="settings-card">
        <h3 className="settings-card-title">Betrieb</h3>
        <div className="settings-grid">
          {[
            { label: "Name", placeholder: "Doener Palace" },
            { label: "Telefonnummer", placeholder: "+49 30 12345678" },
            { label: "Adresse", placeholder: "Hauptstrasse 42, 10115 Berlin" },
            { label: "Oeffnungszeiten", placeholder: "Mo-Sa 11:00 - 22:00" },
          ].map((field) => (
            <div key={field.label}>
              <label className="settings-field-label">
                {field.label}
              </label>
              <input
                type="text"
                placeholder={field.placeholder}
                className="settings-input"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="settings-card">
        <h3 className="settings-card-title">AI-Agent</h3>
        <div className="settings-stack">
          <div>
            <label className="settings-field-label">
              Begruessung
            </label>
            <textarea
              rows={2}
              placeholder="Willkommen beim Doener Palace! Ich bin Ihr digitaler Assistent."
              className="settings-textarea"
            />
          </div>
          <div>
            <label className="settings-field-label">
              Sprache
            </label>
            <select className="settings-select">
              <option>Deutsch</option>
              <option>Tuerkisch</option>
              <option>Englisch</option>
              <option>Arabisch</option>
            </select>
          </div>
        </div>
      </section>

      <section className="settings-card">
        <h3 className="settings-card-title">Speisekarte</h3>
        <p className="settings-table-description">
          Aktuelle Speisekarte, die der AI-Agent verwendet:
        </p>
        <table className="settings-table">
          <thead>
            <tr>
              <th>
                Gericht
              </th>
              <th>
                Kategorie
              </th>
              <th className="align-right">
                Preis
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_MENU.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td className="muted">{item.category}</td>
                <td className="align-right strong">
                  {item.price.toFixed(2)} EUR
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
