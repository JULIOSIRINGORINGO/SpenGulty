"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/home", icon: "fas fa-list-ul", label: "Riwayat" },
  { href: "/dashboard", icon: "fas fa-th-large", label: "Dashboard" },
  { href: "/profile", icon: "fas fa-user", label: "Profil" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-item ${pathname === item.href ? "active" : ""}`}
        >
          <i className={`${item.icon} nav-icon`} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
