"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, isLoggedIn } from "@/lib/api";
import BottomNav from "@/components/BottomNav";

interface ChartItem { nama: string; total: number; persen: number; }
interface ChartData { display_month: string; current_month: string; data_list: ChartItem[]; }

export default function ChartPage() {
  const router = useRouter();
  const [data, setData] = useState<ChartData | null>(null);
  const [month, setMonth] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadChart = (m?: string) => {
    api.getChart(m).then((d) => { setData(d); setMonth(d.current_month); }).catch(() => {});
  };

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    loadChart();
  }, []);

  useEffect(() => {
    if (!data || !canvasRef.current || data.data_list.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = Math.min(cx, cy) - 10;
    let startAngle = -Math.PI / 2;

    data.data_list.forEach((item, i) => {
      const sliceAngle = (item.persen / 100) * 2 * Math.PI;
      const hue = (i * 360) / data.data_list.length;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = `hsl(${hue}, 70%, 58%)`;
      ctx.fill();
      startAngle += sliceAngle;
    });

    // Center hole for donut
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.55, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();
  }, [data]);

  return (
    <div className="page-wrapper">
      <div className="gradient-header animate-in" style={{ height: 280, paddingTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: "1.2rem" }}>{data?.display_month || "..."}</span>
          <div style={{ position: "relative" }}>
            <button style={{
              background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
              color: "white", borderRadius: 50, padding: "8px 16px", fontWeight: 600, fontSize: "0.8rem",
              cursor: "pointer", fontFamily: "var(--font)", display: "flex", alignItems: "center", gap: 8,
            }} onClick={() => document.getElementById("month-picker")?.click()}>
              Pilih Bulan <i className="fas fa-calendar-alt" />
            </button>
            <input id="month-picker" type="month" value={month}
              onChange={(e) => { if (e.target.value) loadChart(e.target.value); }}
              style={{ position: "absolute", top: 0, right: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: 16, opacity: 0.8, fontSize: "0.85rem", position: "relative", zIndex: 1 }}>Analisis Pengeluaran</p>
      </div>

      <div style={{ marginTop: -140, padding: "0 20px", position: "relative", zIndex: 10 }}>
        <div className="glass-card animate-in stagger-2" style={{ textAlign: "center", minHeight: 240 }}>
          {data && data.data_list.length > 0 ? (
            <canvas ref={canvasRef} style={{ width: "100%", height: 200 }} />
          ) : (
            <p style={{ color: "var(--text-muted)", padding: "60px 0" }}>Belum ada data pengeluaran</p>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="animate-in stagger-3" style={{ margin: "20px 20px", padding: 20, background: "white", borderRadius: 24, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Rincian Kategori</span>
        </div>
        {data?.data_list.map((item, i) => (
          <div key={item.nama} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 0", borderBottom: i < data.data_list.length - 1 ? "1px solid #f8f8f8" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: `hsl(${(i * 360) / data.data_list.length}, 70%, 58%)` }} />
              <span style={{ fontWeight: 700, fontSize: "0.82rem", textTransform: "uppercase" }}>{item.nama}</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.82rem" }}>{item.persen}%</span>
          </div>
        ))}
        {(!data || data.data_list.length === 0) && (
          <p style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>Belum ada pengeluaran</p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
