import type { Metadata } from "next";
import { Geist, Instrument_Sans } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import { getLatestState } from "@/lib/data";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

// The collector updates repository-backed JSON independently of the UI process.
// Read it per request so a long-running deployment never serves a stale build snapshot.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Solana State", template: "%s · Solana State" },
  description: "Real-time intelligence and ecosystem health for Solana.",
  metadataBase: new URL("https://solanastate.dev"),
  openGraph: {
    title: "Solana State",
    description: "Real-time intelligence and ecosystem health for Solana.",
    type: "website",
    siteName: "Solana State",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const state = await getLatestState();
  return <html lang="en" className={`${instrumentSans.variable} ${geistSans.variable}`}><body><AppHeader state={state} />{children}<footer className="footer"><span>Solana State</span><span>Generated intelligence · {state?.meta.version ? `Collector v${state.meta.version}` : "Collector offline"}</span></footer></body></html>;
}
