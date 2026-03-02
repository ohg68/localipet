import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getLocale } from "@/lib/locale";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Localipet | Pet Identification Platform",
  description: "Smart pet identification with QR codes and instant alerts.",
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className={`${inter.className} flex flex-col min-h-screen bg-slate-50`}>
        <Navbar />
        <main id="main-content" className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
