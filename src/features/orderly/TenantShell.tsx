import { Navigate, useParams } from "react-router-dom";
import { TenantProvider } from "./context";
import OrderlyLayout from "./layout/OrderlyLayout";
import { useAuth } from "../../auth/AuthContext";

export default function TenantShell() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenants } = useAuth();
  const tenant = tenants.find((entry) => entry.tenant.slug === tenantSlug)?.tenant;

  if (!tenant) {
    const fallback = tenants[0]?.tenant.slug;
    if (!fallback) return <Navigate to="/" replace />;
    return <Navigate to={`/t/${fallback}/dashboard`} replace />;
  }

  return (
    <TenantProvider tenant={tenant}>
      <OrderlyLayout />
    </TenantProvider>
  );
}
