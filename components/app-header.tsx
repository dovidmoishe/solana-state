import Link from "next/link";
import { DatabaseZap } from "@/components/icons";
import { Navigation } from "@/components/navigation";
import { formatRelativeTime } from "@/lib/format";
import type { SolanaState } from "@/lib/types";

export function AppHeader({ state }: { state: SolanaState | null }) {
  const healthy = state?.network.rpc_health === "ok";
  return (
    <header className="app-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Solana State home">
          <SolanaLogo />
        </Link>
        <Navigation />
        <div className="header-status">
          <span className="network-pill"><span className={healthy ? "status-dot" : "status-dot status-dot--bad"} />{state?.meta.network ?? "offline"}</span>
          <span className="freshness"><DatabaseZap size={13} />{state ? formatRelativeTime(state.meta.generated_at).replace("Updated ", "") : "No data"}</span>
        </div>
      </div>
    </header>
  );
}

function SolanaLogo() {
  return (
    <svg className="solana-logo" viewBox="0 0 32 26" role="img" aria-label="Solana">
      <defs>
        <linearGradient id="solana-mark-gradient" x1="4" y1="24" x2="28" y2="2" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9945ff" />
          <stop offset=".5" stopColor="#14f195" />
          <stop offset="1" stopColor="#00d1ff" />
        </linearGradient>
      </defs>
      <path fill="url(#solana-mark-gradient)" d="M7 1h22l-4.2 4.5H2.7L7 1Z" />
      <path fill="url(#solana-mark-gradient)" d="M25 10.7H3l4.2 4.5h22.1L25 10.7Z" />
      <path fill="url(#solana-mark-gradient)" d="M7.2 20.5h22.1L25 25H3l4.2-4.5Z" />
    </svg>
  );
}
