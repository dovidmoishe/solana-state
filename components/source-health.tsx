import { Check, CircleAlert, RadioTower } from "@/components/icons";
import type { SolanaState } from "@/lib/types";

const labels: Record<string, string> = { price: "SOL price", tvl: "TVL", stablecoins: "Stablecoins", dex: "DEX activity", fees: "App fees", revenue: "App revenue" };

export function SourceHealth({ state }: { state: SolanaState }) {
  const sources = [
    { key: "rpc", label: "Solana RPC", provider: "On-chain", status: state.network.rpc_health },
    ...Object.entries(state.economics.sources).map(([key, source]) => ({ key, label: labels[key] ?? key, provider: source.provider, status: source.status })),
  ];
  return (
    <div className="source-list">
      {sources.map((source) => {
        const ok = source.status === "ok";
        return <div className="source-row" key={source.key}><span className={ok ? "source-icon" : "source-icon source-icon--bad"}>{ok ? <Check size={13} /> : <CircleAlert size={13} />}</span><span><strong>{source.label}</strong><small>{source.provider}</small></span><span className={ok ? "source-status" : "source-status source-status--bad"}>{source.status}</span></div>;
      })}
      <div className="source-note"><RadioTower size={13} />Collector-owned · no client RPC calls</div>
    </div>
  );
}
