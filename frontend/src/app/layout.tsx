import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpenGuilty — Kelola Keuanganmu",
  description: "Aplikasi pencatatan keuangan pribadi yang modern dan intuitif",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
