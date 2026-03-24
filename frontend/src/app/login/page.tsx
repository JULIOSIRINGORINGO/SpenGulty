"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setToken(data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login gagal!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "var(--brand-primary)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: "12vh",
      padding: "12vh 20px 20px",
    }}>
      <h1 className="animate-in stagger-1" style={{
        color: "white",
        fontWeight: 900,
        fontSize: "2.6rem",
        letterSpacing: "1px",
        marginBottom: 4,
        textShadow: "0 2px 12px rgba(0,0,0,0.12)",
      }}>
        SpenGuilty
      </h1>
      <p className="animate-in stagger-2" style={{
        color: "rgba(255,255,255,0.85)",
        fontSize: "1rem",
        fontWeight: 500,
        marginBottom: 40,
      }}>
        Masuk untuk kelola keuanganmu
      </p>

      <div className="glass-card animate-in stagger-3" style={{ maxWidth: 380, width: "100%" }}>
        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <i className="fas fa-envelope icon" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <i className="fas fa-lock icon" />
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <i
              className={`fas ${showPw ? "fa-eye-slash" : "fa-eye"}`}
              style={{ color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
              onClick={() => setShowPw(!showPw)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? "Memproses..." : "MASUK SEKARANG"}
          </button>
        </form>

        <p style={{
          textAlign: "center",
          marginTop: 24,
          fontSize: "0.9rem",
          color: "var(--text-muted)",
        }}>
          Belum punya akun?{" "}
          <a href="/register" style={{ color: "var(--brand-primary)", fontWeight: 700, textDecoration: "none" }}>
            Daftar disini
          </a>
        </p>
      </div>
    </div>
  );
}
