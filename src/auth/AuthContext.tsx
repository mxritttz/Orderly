import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getApiBaseUrl } from "../shared/apiBaseUrl";

type AuthTenant = {
  role: "OWNER" | "MANAGER" | "STAFF";
  tenant: {
    id: string;
    slug: string;
    name: string;
    city: string;
    timezone: string;
    locations: Array<{ id: string; name: string; city: string }>;
  };
  assignedLocations: Array<{
    role: "VIEWER" | "MANAGER";
    location: { id: string; name: string; city: string };
  }>;
};

type AuthUser = {
  id: string;
  email: string;
  fullName: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  tenants: AuthTenant[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const API_BASE_URL = getApiBaseUrl();

type MeResponse = {
  success: true;
  data: {
    user: AuthUser;
    tenants: AuthTenant[];
  };
};

const fetchMe = async () => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: "include",
  });
  if (!response.ok) return null;
  const body = (await response.json()) as MeResponse;
  return body.data;
};

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenants, setTenants] = useState<AuthTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const me = await fetchMe();
    if (!me) {
      setUser(null);
      setTenants([]);
      return;
    }
    setUser(me.user);
    setTenants(me.tenants);
  }, []);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        await refreshMe();
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Login failed.");
    }

    await refreshMe();
  }, [refreshMe]);

  const logout = useCallback(async () => {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setTenants([]);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, tenants, isLoading, login, logout, refreshMe }),
    [isLoading, login, logout, refreshMe, tenants, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider.");
  return ctx;
};
