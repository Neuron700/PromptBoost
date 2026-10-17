import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PromptGraph from "@/components/PromptGraph";
import PwaRegister from "@/components/PwaRegister";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PromptBoost Turn simple ideas into structured prompts",
  description: "Bengkel tempa prompt untuk mahasiswa dan developer. Ubah ide vage jadi prompt terstruktur per kategori.",
  applicationName: "PromptBoost",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "PromptBoost",
    statusBarStyle: "black",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1018",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`} style={{ colorScheme: "dark" }}>
      <body className="min-h-full flex flex-col">
        <PromptGraph />
        <PwaRegister />
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--forge-muted)]">
          <div className="mx-auto max-w-[1160px] px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 PromptBoost</span>
            <span>Feedback: <a href="mailto:syahlanbudi73@gmail.com" className="underline">syahlanbudi73@gmail.com</a> • <a href="/feedback" className="underline">Kirim Feedback</a></span>
          </div>
        </footer>
      </body>
    </html>
  );
}
