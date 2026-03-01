import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import OrderlyLogo from "../components/OrderlyLogo";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("owner@ordermitnimo.local");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch {
      setError("Login fehlgeschlagen. Bitte Zugangsdaten pruefen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="home">
      <OrderlyLogo width={320} />
      <h1>Login</h1>
      <p>Demo-User: owner/manager/staff @ordermitnimo.local mit Passwort demo1234</p>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10, width: 320 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-Mail"
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
          required
        />
        <button className="cta" type="submit" disabled={isSubmitting} style={{ width: "100%" }}>
          {isSubmitting ? "Anmeldung..." : "Einloggen"}
        </button>
        {error && <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div>}
      </form>
    </div>
  );
}
