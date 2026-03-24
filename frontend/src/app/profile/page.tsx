"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, isLoggedIn, removeToken } from "@/lib/api";
import BottomNav from "@/components/BottomNav";

interface User { id: number; nama: string; email: string; pekerjaan: string | null; foto: string | null; }

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [nama, setNama] = useState("");
  const [pekerjaan, setPekerjaan] = useState("");
  const [password, setPassword] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    api.getProfile().then((u) => {
      setUser(u); setNama(u.nama); setPekerjaan(u.pekerjaan || "");
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("nama", nama);
    formData.append("pekerjaan", pekerjaan);
    if (password) formData.append("password", password);
    if (selectedFile) formData.append("foto", selectedFile);

    try {
      const updated = await api.updateProfile(formData);
      setUser(updated);
      setEditMode(false);
      setPassword("");
      setSelectedFile(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Yakin ingin keluar?")) {
      removeToken();
      router.push("/login");
    }
  };

  if (!user) return (
    <div className="page-wrapper"><div className="loading-skeleton" style={{ height: 280, borderRadius: "0 0 40px 40px" }} /></div>
  );

  const avatarUrl = preview || (user.foto ? `http://localhost:8000/uploads/${user.foto}` : null);

  return (
    <div className="page-wrapper">
      <div className="gradient-header animate-in" style={{ height: 300, textAlign: "center", paddingTop: 32, position: "relative" }}>
        <button onClick={() => router.push("/dashboard")} style={{
          position: "absolute", left: 24, top: 32, background: "none", border: "none", color: "white", fontSize: "1.3rem", cursor: "pointer",
        }}><i className="fas fa-arrow-left" /></button>

        <button onClick={() => setEditMode(!editMode)} style={{
          position: "absolute", right: 24, top: 32, background: "none", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer",
        }}><i className="fas fa-pencil-alt" /></button>

        <div onClick={() => editMode && fileRef.current?.click()} style={{
          width: 100, height: 100, borderRadius: "50%", margin: "16px auto 12px",
          background: "rgba(255,255,255,0.2)", border: "4px solid rgba(255,255,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          cursor: editMode ? "pointer" : "default", position: "relative", zIndex: 1,
        }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <i className="fas fa-user" style={{ fontSize: "2.2rem", color: "white" }} />
          )}
          {editMode && (
            <div style={{
              position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderRadius: "50%",
              background: "#333", color: "white", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.8rem", border: "2px solid white",
            }}><i className="fas fa-camera" /></div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />

        <h3 style={{ fontWeight: 700, margin: 0, position: "relative", zIndex: 1 }}>{user.nama}</h3>
        <p style={{ opacity: 0.8, fontSize: "0.9rem", position: "relative", zIndex: 1 }}>{user.pekerjaan || "Pengguna Setia"}</p>
      </div>

      <div style={{ margin: "-80px 20px 20px", position: "relative", zIndex: 10 }}>
        <div className="glass-card animate-in stagger-2" style={{ minHeight: 300 }}>
          <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4, marginLeft: 4 }}>Nama Lengkap</label>
          <div className="input-group" style={{ borderRadius: 16 }}>
            <i className="fas fa-id-card icon" />
            <input value={nama} onChange={(e) => setNama(e.target.value)} readOnly={!editMode}
              style={{ color: editMode ? "var(--text-primary)" : "var(--text-secondary)" }} />
          </div>

          <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4, marginLeft: 4 }}>Email Akun</label>
          <div className="input-group" style={{ borderRadius: 16, background: "#e9ecef" }}>
            <i className="fas fa-envelope icon" />
            <input value={user.email} readOnly style={{ color: "var(--text-muted)", cursor: "not-allowed" }} />
            <i className="fas fa-lock" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }} />
          </div>

          <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4, marginLeft: 4 }}>Pekerjaan</label>
          <div className="input-group" style={{ borderRadius: 16 }}>
            <i className="fas fa-briefcase icon" />
            <input value={pekerjaan} onChange={(e) => setPekerjaan(e.target.value)} readOnly={!editMode}
              placeholder="Misal: Mahasiswa / Karyawan" style={{ color: editMode ? "var(--text-primary)" : "var(--text-secondary)" }} />
          </div>

          {editMode && (
            <>
              <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4, marginLeft: 4 }}>Ganti Password (Opsional)</label>
              <div className="input-group" style={{ borderRadius: 16 }}>
                <i className="fas fa-lock icon" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Biarkan kosong jika tidak diganti" autoComplete="new-password" />
              </div>
              <button className="btn-primary" onClick={handleSave} disabled={loading} style={{ marginTop: 8 }}>
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </>
          )}

          {!editMode && (
            <button className="btn-danger" onClick={handleLogout} style={{ marginTop: 8 }}>
              <i className="fas fa-sign-out-alt" /> Keluar Aplikasi
            </button>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
