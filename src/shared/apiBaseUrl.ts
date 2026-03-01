const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

const isIpv4 = (value: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(value);

const isPrivateIpv4 = (value: string) => {
  if (!isIpv4(value)) return false;
  const [a, b] = value.split(".").map(Number);
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 127) return true;
  return false;
};

const isLocalLikeHost = (value: string) =>
  LOCAL_HOSTS.has(value) || isPrivateIpv4(value) || value.endsWith(".local");

const normalizeApiHostToCurrentHost = (configuredUrl: string) => {
  if (typeof window === "undefined") return configuredUrl;

  const currentHost = window.location.hostname;

  try {
    const parsed = new URL(configuredUrl);
    if (isLocalLikeHost(parsed.hostname) && isLocalLikeHost(currentHost)) {
      parsed.hostname = currentHost;
      return parsed.origin;
    }
    return parsed.origin;
  } catch {
    return configuredUrl;
  }
};

export const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (configured && configured.trim().length > 0) {
    return normalizeApiHostToCurrentHost(configured.trim());
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }

  return "http://localhost:4000";
};
