import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
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
  const currentYear = new Date().getFullYear();
  const newOrders = orders.filter((order) => order.status === "new");
  const contentRef = useRef<HTMLElement | null>(null);
  const lastScrollTopRef = useRef(0);
  const [isCompact, setIsCompact] = useState(false);
  const [isTopChromeHidden, setIsTopChromeHidden] = useState(false);

  useEffect(() => {
    const target = contentRef.current;
    const updateTopChrome = (nextScrollTop: number) => {
      const delta = nextScrollTop - lastScrollTopRef.current;

      setIsCompact(nextScrollTop > 18);

      if (nextScrollTop <= 18) {
        setIsTopChromeHidden(false);
      } else if (delta > 2) {
        setIsTopChromeHidden(true);
      } else if (delta < -2) {
        setIsTopChromeHidden(false);
      }

      lastScrollTopRef.current = nextScrollTop;
    };

    const onContainerScroll = () => {
      if (!target) return;
      updateTopChrome(target.scrollTop);
    };

    const onWindowScroll = () => {
      const top = window.scrollY || document.documentElement.scrollTop || 0;
      updateTopChrome(top);
    };

    if (target) {
      target.addEventListener("scroll", onContainerScroll, { passive: true });
    }
    window.addEventListener("scroll", onWindowScroll, { passive: true });

    // Initial sync on mount.
    onWindowScroll();

    return () => {
      if (target) {
        target.removeEventListener("scroll", onContainerScroll);
      }
      window.removeEventListener("scroll", onWindowScroll);
    };
  }, []);

  return (
    <div className="orderly-shell">
      <div className="orderly-shell-glow" />
      <div className={`floating-brand-corner ${isTopChromeHidden ? "hidden" : ""}`}>
        <OrderlyLogo width={220} />
      </div>

      <div className={`floating-tenant-control ${isTopChromeHidden ? "hidden" : ""}`}>
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

      <header className={`floating-header ${isCompact ? "compact" : ""} ${isTopChromeHidden ? "hidden" : ""}`}>
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
        <footer className="orderly-footer">
          <div className="orderly-footer-grid">
            <div>
              <div className="orderly-footer-brand">Orderly Platform</div>
              <p className="orderly-footer-copy">
                AI-gestuetztes Order Management fuer Multi-Location Gastronomie mit klaren
                Prozessen, Rollenrechten und Live-Uebersicht.
              </p>
            </div>
            <div>
              <div className="orderly-footer-title">Produkt</div>
              <div className="orderly-footer-links">
                <Link to={`/t/${tenant.slug}/dashboard`}>Bestellungen</Link>
                <Link to={`/t/${tenant.slug}/integrations`}>Integrationen</Link>
                <Link to={`/t/${tenant.slug}/settings`}>Einstellungen</Link>
              </div>
            </div>
            <div>
              <div className="orderly-footer-title">Kontakt</div>
              <div className="orderly-footer-links">
                <a href="mailto:support@orderly.local">support@orderly.local</a>
                <a href="mailto:security@orderly.local">security@orderly.local</a>
                <a href="tel:+493012345678">+49 30 123 45 678</a>
              </div>
            </div>
          </div>
          <div className="orderly-footer-bottom">
            <span>© {currentYear} Orderly</span>
            <span>Tenant: {tenant.name}</span>
            <span>Status: Local Demo</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
