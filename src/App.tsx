import type { ReactElement } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import TenantShell from "./features/orderly/TenantShell";
import DashboardPage from "./features/orderly/pages/DashboardPage";
import IntegrationsPage from "./features/orderly/pages/IntegrationsPage";
import SettingsPage from "./features/orderly/pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import OrderlyLogo from "./components/OrderlyLogo";

function Home() {
  const { user, tenants, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="home">
      <OrderlyLogo width={360} />
      <p>
        Eingeloggt als <strong>{user.fullName}</strong> ({user.email})
      </p>
      <div className="tenant-links">
        {tenants.map((entry) => (
          <Link key={entry.tenant.id} className="cta" to={`/t/${entry.tenant.slug}/dashboard`}>
            {entry.tenant.name} ({entry.tenant.city}) · Rolle: {entry.role}
          </Link>
        ))}
      </div>
      <button className="cta" onClick={() => void logout()} style={{ marginTop: 16 }}>
        Logout
      </button>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="home">Lade Session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, tenants } = useAuth();
  const firstTenantSlug = tenants[0]?.tenant.slug ?? "doner-palace";

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/orderly-mvp"
        element={<Navigate to={`/t/${firstTenantSlug}/dashboard`} replace />}
      />
      <Route
        path="/t/:tenantSlug"
        element={
          <ProtectedRoute>
            <TenantShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
