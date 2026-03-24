"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, isLoggedIn } from "@/lib/api";
import { Suspense } from "react";

interface Kategori { id: number; nama: string; icon: string; tipe: string; }

function formatRupiahInput(value: string) {
  const num = value.replace(/[^\d]/g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function AddExpenseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [categories, setCategories] = useState<Kategori[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [nominal, setNominal] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    api.getCategories().then(setCategories);
    if (editId) {
      api.getTransactions().then((list: any[]) => {
        const t = list.find((x: any) => x.id === Number(editId));
        if (t) {
          setNominal(String(t.nominal));
          setTanggal(t.tanggal);
          setKeterangan(t.keterangan || "");
          setSelectedCat(t.kategori_id);
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCat) { alert("Harap pilih kategori!"); return; }
    setLoading(true);
    const cleanNominal = parseInt(nominal.replace(/\./g, "")) || 0;
    try {
      if (editId) {
        await api.updateTransaction(Number(editId), { nominal: cleanNominal, keterangan, tanggal, kategori_id: selectedCat });
      } else {
        await api.createTransaction({ nominal: cleanNominal, keterangan, tanggal, kategori_id: selectedCat });
      }
      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="gradient-header animate-in" style={{ height: 200, textAlign: "center", paddingTop: 32, position: "relative" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.2rem", margin: 0, position: "relative", zIndex: 1 }}>
          {editId ? "Edit Pengeluaran" : "Pengeluaran"}
        </h2>
        <p style={{ opacity: 0.8, fontSize: "0.85rem", position: "relative", zIndex: 1, marginTop: 4 }}>Catat pengeluaranmu hari ini</p>
      </div>

      <div style={{ margin: "-80px 20px 20px", position: "relative", zIndex: 10 }}>
        <div className="glass-card animate-in stagger-2">
          <form onSubmit={handleSubmit}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-primary)" }}>Rp</span>
              <input type="text" value={nominal} placeholder="0"
                onChange={(e) => setNominal(formatRupiahInput(e.target.value))}
                inputMode="numeric" required autoComplete="off"
                style={{
                  border: "none", borderBottom: "2px solid #eee", fontSize: "2.4rem", fontWeight: 800,
                  color: "var(--text-primary)", width: "75%", textAlign: "center", background: "transparent",
                  outline: "none", fontFamily: "var(--font)", paddingBottom: 4,
                }} />
            </div>

            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase" }}>Pilih Kategori</p>
            <div className="category-grid" style={{ marginBottom: 20, maxHeight: 100, overflowY: "auto" }}>
              {categories.map((c) => (
                <div key={c.id} className={`category-item ${selectedCat === c.id ? "selected" : ""}`} onClick={() => setSelectedCat(c.id)}>
                  <div className="cat-icon"><i className={c.icon} /></div>
                  <span className="cat-name">{c.nama}</span>
                </div>
              ))}
            </div>

            <div className="input-group" style={{ borderRadius: 16 }}>
              <i className="fas fa-calendar-alt icon" />
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required style={{ fontFamily: "var(--font)" }} />
            </div>

            <div className="input-group" style={{ borderRadius: 16 }}>
              <i className="fas fa-pen icon" />
              <input placeholder="Catatan (Makan siang, bensin, dll)" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} autoComplete="off" />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? "Menyimpan..." : "Simpan Transaksi"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>Batal</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AddExpensePage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="loading-skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} /></div>}>
      <AddExpenseContent />
    </Suspense>
  );
}
