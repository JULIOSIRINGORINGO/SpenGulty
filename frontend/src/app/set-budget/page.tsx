"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, isLoggedIn } from "@/lib/api";

function formatRupiahInput(value: string) {
  const num = value.replace(/[^\d]/g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function SetBudgetPage() {
  const router = useRouter();
  const [nominal, setNominal] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    api.getBudget().then((b) => { if (b) setNominal(formatRupiahInput(String(b.amount))); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const amount = parseInt(nominal.replace(/\./g, "")) || 0;
    try {
      await api.setBudget(amount);
      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="gradient-header animate-in" style={{ height: 200, textAlign: "center", paddingTop: 32 }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.2rem", margin: 0, position: "relative", zIndex: 1 }}>Atur Budget</h2>
        <p style={{ opacity: 0.8, fontSize: "0.85rem", position: "relative", zIndex: 1, marginTop: 4 }}>Tetapkan saldo awal keuanganmu</p>
      </div>

      <div style={{ margin: "-80px 20px 20px", position: "relative", zIndex: 10 }}>
        <div className="glass-card animate-in stagger-2">
          <form onSubmit={handleSubmit}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-primary)" }}>Rp</span>
              <input type="text" value={nominal} placeholder="0"
                onChange={(e) => setNominal(formatRupiahInput(e.target.value))}
                inputMode="numeric" required autoComplete="off"
                style={{
                  border: "none", borderBottom: "2px solid #eee", fontSize: "2.4rem", fontWeight: 800,
                  color: "var(--text-primary)", width: "70%", textAlign: "center", background: "transparent",
                  outline: "none", fontFamily: "var(--font)", paddingBottom: 4,
                }} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Budget"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>Batal</button>
          </form>
        </div>
      </div>
    </div>
  );
}
