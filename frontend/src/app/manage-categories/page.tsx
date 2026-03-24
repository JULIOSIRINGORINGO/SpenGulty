"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, isLoggedIn } from "@/lib/api";

interface Kategori { id: number; nama: string; icon: string; tipe: string; }

export default function ManageCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Kategori[]>([]);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    api.getCategories().then(setCategories);
  }, []);

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Hapus kategori "${nama}"?`)) return;
    try {
      await api.deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="gradient-header animate-in" style={{ height: 200, textAlign: "center", paddingTop: 32, position: "relative" }}>
        <button onClick={() => router.back()} style={{
          position: "absolute", left: 24, top: 32, background: "none", border: "none", color: "white", fontSize: "1.3rem", cursor: "pointer",
        }}><i className="fas fa-arrow-left" /></button>
        <h2 style={{ fontWeight: 700, fontSize: "1.2rem", margin: 0, position: "relative", zIndex: 1 }}>Kelola Kategori</h2>
        <p style={{ opacity: 0.8, fontSize: "0.85rem", position: "relative", zIndex: 1, marginTop: 4 }}>Atur kategori pengeluaranmu</p>
      </div>

      <div style={{ margin: "-80px 20px 20px", position: "relative", zIndex: 10 }}>
        <div className="glass-card animate-in stagger-2" style={{ minHeight: 300 }}>
          {categories.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>Belum ada kategori</p>
          ) : categories.map((c) => (
            <div key={c.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 0", borderBottom: "1px solid #f0f2f5",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, background: "var(--bg-input)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--brand-primary)", fontSize: "1rem",
                }}>
                  <i className={c.icon} />
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase" }}>{c.nama}</span>
                  <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)" }}>{c.tipe}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(c.id, c.nama)} style={{
                width: 36, height: 36, borderRadius: "50%", border: "none",
                background: "#ffe5e5", color: "#ff6b6b", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem",
              }}>
                <i className="fas fa-trash-alt" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
