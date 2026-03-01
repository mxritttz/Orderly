import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTenantState } from "../context";
import { useAuth } from "../../../auth/AuthContext";
import OrderlyLogo from "../../../components/OrderlyLogo";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { id: "dashboard", label: "Bestellungen", icon: "📋" },
  { id: "integrations", label: "Integrationen", icon: "🔗" },
  { id: "settings", label: "Einstellungen", icon: "⚙️" },
];

export default function OrderlyLayout() {
  const { tenant, orders } = useTenantState();
  const { tenants } = useAuth();
  const navigate = useNavigate();
  const newOrders = orders.filter((order) => order.status === "new");
  const contentRef = useRef<HTMLElement | null>(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const target = contentRef.current;
    if (!target) return;
    const onScroll = () => setIsCompact(target.scrollTop > 18);
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="orderly-shell">
      <div className="orderly-shell-glow" />
      <div className="floating-brand-corner">
        <OrderlyLogo width={220} />
      </div>

      <div className="floating-tenant-control">
        <span className="floating-tenant-label">Mandant</span>
        <select
          value={tenant.slug}
          onChange={(e) => navigate(`/t/${e.target.value}/dashboard`)}
          className="floating-tenant-select"
          aria-label="Mandant auswaehlen"
        >
          {tenants.map((entry) => (
            <option key={entry.tenant.id} value={entry.tenant.slug}>
              {entry.tenant.name} ({entry.tenant.city})
            </option>
          ))}
        </select>
      </div>

      <header className={`floating-header ${isCompact ? "compact" : ""}`}>
        <nav className="floating-header-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={`/t/${tenant.slug}/${item.id}`}
              className={({ isActive }) => `floating-nav-link ${isActive ? "active" : ""}`}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
              {item.id === "dashboard" && newOrders.length > 0 && (
                <span className="floating-nav-badge">{newOrders.length}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      <main ref={contentRef} style={{ flex: 1, overflow: "auto", padding: "104px 32px 24px", zIndex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
