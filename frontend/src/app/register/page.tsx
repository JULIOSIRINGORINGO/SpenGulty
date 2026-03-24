"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nama: "", email: "", pekerjaan: "", tgl_lahir: "", password: "", konfirmasi: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: string, val: string) => setForm({ ...form, [key]: val });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.konfirmasi) {
      setError("Password dan konfirmasi tidak cocok!");
      return;
    }
    setLoading(true);
    try {
      const data = await api.register(form);
      setToken(data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registrasi gagal!");
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
      paddingTop: "8vh",
      padding: "8vh 20px 40px",
    }}>
      <h1 className="animate-in stagger-1" style={{
        color: "white", fontWeight: 900, fontSize: "2.4rem", marginBottom: 4,
        textShadow: "0 2px 12px rgba(0,0,0,0.12)",
      }}>SpenGuilty</h1>
      <p className="animate-in stagger-2" style={{
        color: "rgba(255,255,255,0.85)", fontSize: "0.95rem", marginBottom: 32,
      }}>Buat akun untuk mulai kelola keuangan</p>

      <div className="glass-card animate-in stagger-3" style={{ maxWidth: 380, width: "100%" }}>
        {error && <div className="alert alert-error"><i className="fas fa-exclamation-circle" />{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group"><i className="fas fa-id-card icon" />
            <input placeholder="Nama Lengkap" value={form.nama} onChange={(e) => set("nama", e.target.value)} required /></div>

          <div className="input-group"><i className="fas fa-envelope icon" />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} required /></div>

          <div className="input-group"><i className="fas fa-briefcase icon" />
            <input placeholder="Pekerjaan (opsional)" value={form.pekerjaan} onChange={(e) => set("pekerjaan", e.target.value)} /></div>

          <div className="input-group"><i className="fas fa-calendar icon" />
            <input type="date" placeholder="Tanggal Lahir" value={form.tgl_lahir} onChange={(e) => set("tgl_lahir", e.target.value)} /></div>

          <div className="input-group"><i className="fas fa-lock icon" />
            <input type={showPw ? "text" : "password"} placeholder="Password" value={form.password} onChange={(e) => set("password", e.target.value)} required />
            <i className={`fas ${showPw ? "fa-eye-slash" : "fa-eye"}`}
              style={{ color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
              onClick={() => setShowPw(!showPw)} /></div>

          <div className="input-group"><i className="fas fa-lock icon" />
            <input type={showPw ? "text" : "password"} placeholder="Konfirmasi Password" value={form.konfirmasi} onChange={(e) => set("konfirmasi", e.target.value)} required /></div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Memproses..." : "DAFTAR SEKARANG"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.9rem", color: "var(--text-muted)" }}>
          Sudah punya akun? <a href="/login" style={{ color: "var(--brand-primary)", fontWeight: 700, textDecoration: "none" }}>Masuk disini</a>
        </p>
      </div>
    </div>
  );
}
