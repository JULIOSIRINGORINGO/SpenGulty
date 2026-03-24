"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, isLoggedIn } from "@/lib/api";
import BottomNav from "@/components/BottomNav";

interface Transaksi {
  id: number; nominal: number; keterangan: string | null;
  tanggal: string; tipe: string; kategori: { id: number; nama: string; icon: string; tipe: string };
}
interface Kategori { id: number; nama: string; icon: string; tipe: string; }

function formatDate(d: string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}`;
}
function formatNominal(n: number) { return n.toLocaleString("id-ID"); }
function formatDateLong(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function HomePage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaksi | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const loadData = (f?: Record<string, string>) => {
    const params = f || filters;
    const clean: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => { if (v) clean[k] = v; });
    api.getTransactions(clean).then(setTransactions).catch(() => {});
  };

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    loadData();
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  const applyFilter = (key: string, val: string) => {
    const nf = { ...filters, [key]: val };
    setFilters(nf);
    loadData(nf);
  };

  const resetFilters = () => { setFilters({}); loadData({}); setShowSidebar(false); };

  const deleteTx = async (id: number) => {
    if (!confirm("Hapus transaksi ini?")) return;
    await api.deleteTransaction(id);
    setSelectedTx(null);
    loadData();
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="gradient-header animate-in" style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 28 }}>
        <div style={{ width: 30 }} />
        <h2 style={{ fontWeight: 700, margin: 0, fontSize: "1.1rem", letterSpacing: 1, position: "relative", zIndex:1 }}>SpenGuilty</h2>
        <i className="fas fa-bars" style={{ fontSize: "1.2rem", cursor: "pointer", position: "relative", zIndex:1 }} onClick={() => setShowSidebar(true)} />
      </div>

      {/* Transaction List */}
      <div style={{ marginTop: -16, padding: "0 16px" }}>
        <div className="glass-card animate-in stagger-2" style={{ minHeight: "60vh", padding: "24px 16px" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: "0.95rem", margin: 0 }}>Daftar Pengeluaran</h3>
            <div style={{ height: 3, width: 40, background: "#333", margin: "8px auto 0", borderRadius: 10 }} />
          </div>

          <div style={{ maxHeight: 480, overflowY: "auto" }}>
            {transactions.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0" }}>
                Belum ada transaksi
              </p>
            ) : transactions.map((t) => (
              <div key={t.id} className="transaction-row" onClick={() => setSelectedTx(t)}>
                <span style={{ width: 48, fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>{formatDate(t.tanggal)}</span>
                <span style={{ flex: 1, fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.kategori.nama}</span>
                <span style={{ flex: 1, fontSize: "0.78rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.keterangan || "-"}</span>
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: t.tipe === "Pemasukan" ? "var(--success)" : "var(--danger)", flexShrink: 0, textAlign: "right", minWidth: 80 }}>
                  {formatNominal(t.nominal)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <>
          <div className="sidebar-overlay" onClick={() => setShowSidebar(false)} />
          <div className="sidebar">
            <h3 style={{ fontWeight: 700, textAlign: "center", marginBottom: 32, fontSize: "1rem" }}>Filter</h3>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <i className="fas fa-th-large" style={{ color: "var(--brand-primary)" }} /> Kategori
              </label>
              <select style={{ width: "100%", padding: "10px 16px", border: "1px solid #eee", borderRadius: 12, fontSize: "0.85rem", fontFamily: "var(--font)" }}
                value={filters.cat_id || ""} onChange={(e) => { applyFilter("cat_id", e.target.value); }}>
                <option value="">Semua</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <i className="fas fa-calendar-alt" style={{ color: "var(--brand-primary)" }} /> Bulan
              </label>
              <input type="month" style={{ width: "100%", padding: "10px 16px", border: "1px solid #eee", borderRadius: 12, fontSize: "0.85rem", fontFamily: "var(--font)" }}
                value={filters.month || ""} onChange={(e) => applyFilter("month", e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              {["terbanyak", "terkecil"].map((s) => (
                <button key={s} onClick={() => applyFilter("sort", s)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 12, border: "none", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", fontFamily: "var(--font)",
                  background: filters.sort === s ? "var(--brand-primary)" : "var(--bg-input)", color: filters.sort === s ? "white" : "var(--text-secondary)",
                  transition: "all 0.2s",
                }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
              ))}
            </div>

            <button className="btn-secondary" onClick={resetFilters} style={{ marginBottom: 24 }}>
              <i className="fas fa-undo" style={{ marginRight: 8 }} /> Reset Filter
            </button>

            <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <a href="/dashboard" style={{ textDecoration: "none", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 600 }}>
                <i className="fas fa-home" style={{ marginRight: 10, color: "var(--text-muted)" }} /> Dashboard
              </a>
              <a href="/manage-categories" style={{ textDecoration: "none", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 600 }}>
                <i className="fas fa-tags" style={{ marginRight: 10, color: "var(--text-muted)" }} /> Kelola Kategori
              </a>
            </div>
          </div>
        </>
      )}

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
            <div style={{
              width: 70, height: 70, borderRadius: "50%", background: "var(--brand-primary)", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
              boxShadow: "var(--shadow-brand)",
            }}>
              <i className={`${selectedTx.kategori.icon} fa-2x`} />
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{selectedTx.kategori.nama}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 16 }}>{formatDateLong(selectedTx.tanggal)}</p>
            <h2 style={{ fontWeight: 800, marginBottom: 16, fontSize: "1.8rem" }}>Rp {formatNominal(selectedTx.nominal)}</h2>
            <div style={{ background: "var(--bg-input)", padding: "14px 16px", borderRadius: 16, textAlign: "left", marginBottom: 24 }}>
              <small style={{ color: "var(--text-muted)", fontWeight: 700, display: "block", marginBottom: 4 }}>Catatan:</small>
              <span>{selectedTx.keterangan || "Tidak ada catatan"}</span>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => { setSelectedTx(null); router.push(`/add-expense?edit=${selectedTx.id}`); }}
                style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: "#fff3cd", color: "#ffc107", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fas fa-pen" />
              </button>
              <button onClick={() => deleteTx(selectedTx.id)}
                style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: "#ffe5e5", color: "#ff6b6b", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fas fa-trash-alt" />
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
