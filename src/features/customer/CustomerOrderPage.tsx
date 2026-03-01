import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import OrderlyLogo from "../../components/OrderlyLogo";
import { MOCK_MENU, TENANTS } from "../orderly/data";
import type { CustomerOrderItem } from "./customerStore";
import { getApiBaseUrl } from "../../shared/apiBaseUrl";

const pickupModes = ["So schnell wie moeglich", "In 20 Minuten", "In 35 Minuten"] as const;
const API_BASE_URL = getApiBaseUrl();

export default function CustomerOrderPage() {
  const { tenantSlug = "doner-palace" } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();

  const tenant =
    TENANTS.find((entry) => entry.slug === tenantSlug) ??
    TENANTS[0] ?? { slug: "doner-palace", name: "Orderly Kitchen", city: "Berlin", id: "tenant-x", timezone: "Europe/Berlin" };

  const menu = useMemo(
    () =>
      MOCK_MENU.map((item) => ({
        ...item,
        description:
          item.category === "Doener"
            ? "Frisch gegrillt, hausgemachte Sosse, knackiger Salat."
            : item.category === "Getraenke"
              ? "Eiskalt und perfekt zur Bestellung."
              : "Beliebt bei Stammgaesten.",
      })),
    []
  );

  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [pickupMode, setPickupMode] = useState<(typeof pickupModes)[number]>(pickupModes[0]);
  const [checkoutMode, setCheckoutMode] = useState<"guest" | "account">("guest");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = useMemo(
    () =>
      menu
        .filter((item) => (quantities[item.id] ?? 0) > 0)
        .map<CustomerOrderItem>((item) => ({
          id: item.id,
          name: item.name,
          qty: quantities[item.id],
          unitPrice: item.price,
        })),
    [menu, quantities]
  );

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
    [items]
  );

  const changeQty = (itemId: number, delta: 1 | -1) => {
    setQuantities((prev) => {
      const nextQty = Math.max(0, (prev[itemId] ?? 0) + delta);
      if (nextQty === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: nextQty };
    });
  };

  const submitOrder = async () => {
    if (!name.trim() || !phone.trim()) {
      setError("Bitte Name und Telefonnummer eintragen.");
      return;
    }
    if (items.length === 0) {
      setError("Bitte mindestens ein Gericht waehlen.");
      return;
    }
    if (checkoutMode === "account" && (!email.trim() || password.length < 6)) {
      setError("Fuer Account-Bestellung bitte gueltige E-Mail und Passwort (min. 6 Zeichen) angeben.");
      return;
    }

    setError(null);
    const etaMinutes = pickupMode === "So schnell wie moeglich" ? 18 : pickupMode === "In 20 Minuten" ? 20 : 35;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/tenants/${tenant.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          notes: notes.trim() || undefined,
          pickupEtaMinutes: etaMinutes,
          items: items.map((item) => ({
            itemName: item.name,
            qty: item.qty,
            unitPrice: item.unitPrice,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Bestellung konnte nicht angelegt werden (${response.status}).`);
      }

      const payload = (await response.json()) as {
        data?: {
          id: string;
        };
      };

      if (!payload.data?.id) {
        throw new Error("Antwort ohne Order-ID erhalten.");
      }

      navigate(`/c/${tenant.slug}/track/${payload.data.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Bestellung fehlgeschlagen.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <strong>Orderly Direct</strong>
            <span>Schnell bestellen. Live verfolgen.</span>
          </div>
        </div>
        <div className="customer-topbar-meta">
          <strong>{tenant.name}</strong>
          <span>{tenant.city}</span>
        </div>
      </header>

      <main className="customer-grid">
        <section className="customer-card customer-menu">
          <h1>Online Bestellen</h1>
          <p>Direkt bei {tenant.name}. Ohne Login als Gast oder optional mit Kundenkonto.</p>
          <div className="customer-hero-pills">
            <span>⚡ 30 Sek. Checkout</span>
            <span>📍 Live Status</span>
            <span>🛡️ Gast oder Account</span>
          </div>

          <div className="customer-menu-list">
            {menu.map((item) => {
              const qty = quantities[item.id] ?? 0;
              return (
                <article key={item.id} className="customer-menu-item">
                  <div>
                    <h3>{item.name}</h3>
                    <span>{item.category}</span>
                    <p>{item.description}</p>
                  </div>
                  <div className="customer-menu-actions">
                    <strong>{item.price.toFixed(2)} EUR</strong>
                    <div className="customer-stepper">
                      <button onClick={() => changeQty(item.id, -1)} disabled={qty === 0}>−</button>
                      <span>{qty}</span>
                      <button onClick={() => changeQty(item.id, 1)}>+</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="customer-card customer-checkout">
          <h2>Deine Bestellung</h2>
          <div className="customer-checkout-mode">
            <button
              className={checkoutMode === "guest" ? "active" : ""}
              onClick={() => setCheckoutMode("guest")}
            >
              Gast
            </button>
            <button
              className={checkoutMode === "account" ? "active" : ""}
              onClick={() => setCheckoutMode("account")}
            >
              Mit Account
            </button>
          </div>

          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Max Mustermann" />

          <label>Telefon</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 ..." />

          {checkoutMode === "account" && (
            <>
              <label>E-Mail</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@mail.de" />
              <label>Passwort</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mind. 6 Zeichen" />
            </>
          )}

          <label>Abholung</label>
          <select value={pickupMode} onChange={(e) => setPickupMode(e.target.value as (typeof pickupModes)[number])}>
            {pickupModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>

          <label>Notiz</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="z. B. ohne Zwiebeln" />

          <div className="customer-summary-list">
            {items.length === 0 ? (
              <p>Noch keine Artikel im Warenkorb.</p>
            ) : (
              items.map((item) => (
                <div key={item.id}>
                  <span>{item.qty}x {item.name}</span>
                  <strong>{(item.qty * item.unitPrice).toFixed(2)} EUR</strong>
                </div>
              ))
            )}
          </div>

          <div className="customer-total">
            <span>Gesamt</span>
            <strong>{total.toFixed(2)} EUR</strong>
          </div>

          {error && <div className="customer-error">{error}</div>}

          <button className="customer-submit" onClick={() => void submitOrder()} disabled={isSubmitting}>
            {isSubmitting ? "Bestellung wird gesendet..." : "Bestellung abschicken"}
          </button>

          <Link className="customer-track-link" to={`/c/${tenant.slug}/track/demo-live`}>
            Demo-Tracking ansehen
          </Link>
        </aside>
      </main>
    </div>
  );
}
