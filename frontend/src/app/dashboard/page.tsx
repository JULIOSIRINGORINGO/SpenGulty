"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, isLoggedIn } from "@/lib/api";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

interface DashboardData {
  user: { id: number; nama: string; foto: string | null };
  total_pengeluaran: number;
  total_pemasukan: number;
  sisa_saldo: number;
  budget: number;
}

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    api.getDashboard().then(setData).catch(() => router.replace("/login"));
  }, [router]);

  if (!data) return (
    <div className="page-wrapper" style={{ padding: 20 }}>
      <div className="loading-skeleton" style={{ height: 280, borderRadius: "0 0 40px 40px" }} />
      <div className="loading-skeleton" style={{ height: 200, borderRadius: 32, marginTop: -80, marginInline: 20 }} />
    </div>
  );

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="gradient-header animate-in" style={{ height: 300, paddingTop: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
          <div>
            <small style={{ opacity: 0.8, fontWeight: 400 }}>Welcome</small>
            <h2 style={{ fontWeight: 700, margin: 0, fontSize: "1.3rem" }}>{data.user.nama}</h2>
          </div>
          <div className="avatar">
            {data.user.foto ? (
              <img src={`http://localhost:8000/uploads/${data.user.foto}`} alt="Profile" />
            ) : (
              <i className="fas fa-user" style={{ fontSize: "1.2rem" }} />
            )}
          </div>
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          marginTop: 64, position: "relative", zIndex: 1,
        }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>Sisa saldo :</span>
          <h3 style={{ fontWeight: 700, margin: 0, fontSize: "1.3rem" }}>{formatRp(data.sisa_saldo)}</h3>
        </div>
      </div>

      {/* Main Card */}
      <div style={{ marginTop: -80, padding: "0 20px", position: "relative", zIndex: 10 }}>
        <div className="glass-card animate-in stagger-2" style={{
          minHeight: 200, display: "flex", flexDirection: "column", marginBottom: 32,
        }}>
          <span style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: "0.85rem" }}>Total Pengeluaran</span>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <h1 style={{ fontWeight: 800, fontSize: "2.2rem", letterSpacing: "-1px", color: "var(--text-primary)" }}>
              {formatRp(data.total_pengeluaran)}
            </h1>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="animate-in stagger-3" style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 8,
        }}>
          {[
            { href: "/add-category", icon: "fas fa-folder-plus", label: "Kategori" },
            { href: "/set-budget", icon: "fas fa-wallet", label: "Budget" },
            { href: "/chart", icon: "fas fa-chart-line", label: "Statistik" },
          ].map((item) => (
            <Link key={item.href} href={item.href} style={{
              background: "white", borderRadius: 20, height: 80,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--shadow-sm)", textDecoration: "none", gap: 6,
              transition: "transform 0.2s", color: "var(--brand-primary)",
            }}>
              <i className={item.icon} style={{ fontSize: "1.6rem" }} />
              <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-secondary)" }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* FAB */}
      <Link href="/add-expense" className="fab">
        <i className="fas fa-plus" />
      </Link>

      <BottomNav />
    </div>
  );
}
