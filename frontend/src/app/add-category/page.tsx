"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, isLoggedIn } from "@/lib/api";
import { useEffect } from "react";

const ICON_OPTIONS = [
  "fas fa-utensils", "fas fa-bus", "fas fa-shopping-bag", "fas fa-gamepad",
  "fas fa-wallet", "fas fa-home", "fas fa-plane", "fas fa-heartbeat",
  "fas fa-book", "fas fa-coffee", "fas fa-gift", "fas fa-hashtag",
];

export default function AddCategoryPage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [tipe, setTipe] = useState("Pengeluaran");
  const [icon, setIcon] = useState("fas fa-hashtag");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!isLoggedIn()) router.replace("/login"); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    setLoading(true);
    try {
      await api.createCategory({ nama, tipe, icon });
      router.push("/add-expense");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="gradient-header animate-in" style={{ height: 200, textAlign: "center", paddingTop: 32 }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.2rem", margin: 0, position: "relative", zIndex: 1 }}>Tambah Kategori</h2>
        <p style={{ opacity: 0.8, fontSize: "0.85rem", position: "relative", zIndex: 1, marginTop: 4 }}>Buat kategori baru untuk transaksimu</p>
      </div>

      <div style={{ margin: "-80px 20px 20px", position: "relative", zIndex: 10 }}>
        <div className="glass-card animate-in stagger-2">
          <form onSubmit={handleSubmit}>
            <div className="input-group" style={{ borderRadius: 16 }}>
              <i className="fas fa-tag icon" />
              <input placeholder="Nama Kategori" value={nama} onChange={(e) => setNama(e.target.value)} required autoComplete="off" />
            </div>

            <div className="input-group" style={{ borderRadius: 16 }}>
              <i className="fas fa-exchange-alt icon" />
              <select value={tipe} onChange={(e) => setTipe(e.target.value)}
                style={{ border: "none", background: "transparent", flex: 1, fontWeight: 600, color: "var(--text-primary)", outline: "none", fontSize: "0.95rem", fontFamily: "var(--font)" }}>
                <option value="Pengeluaran">Pengeluaran</option>
                <option value="Pemasukan">Pemasukan</option>
              </select>
            </div>

            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase" }}>Pilih Ikon</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 24 }}>
              {ICON_OPTIONS.map((ic) => (
                <div key={ic} onClick={() => setIcon(ic)} style={{
                  width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: "1.1rem", transition: "all 0.2s",
                  background: icon === ic ? "rgba(108,180,238,0.12)" : "var(--bg-input)",
                  border: icon === ic ? "2px solid var(--brand-primary)" : "2px solid transparent",
                  color: icon === ic ? "var(--brand-primary)" : "var(--text-secondary)",
                }}>
                  <i className={ic} />
                </div>
              ))}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Kategori"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>Batal</button>
          </form>
        </div>
      </div>
    </div>
  );
}
