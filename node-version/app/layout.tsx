import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Localipet | Pet Identification Platform",
  description: "Smart pet identification with QR codes and instant alerts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} flex flex-col min-vh-100`}>
        <Navbar />
        <main id="main-content" className="flex-grow-1 py-4">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
