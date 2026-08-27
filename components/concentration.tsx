import { formatPercent } from "@/lib/format";
import type { SolanaState } from "@/lib/types";

export function Concentration({ data }: { data: SolanaState["validators"]["concentration"] }) {
  const groups = [
    { label: "Top 10", value: data.top_10_percent, className: "concentration-a" },
    { label: "Next 15", value: data.top_25_percent === null || data.top_10_percent === null ? null : data.top_25_percent - data.top_10_percent, className: "concentration-b" },
    { label: "Next 25", value: data.top_50_percent === null || data.top_25_percent === null ? null : data.top_50_percent - data.top_25_percent, className: "concentration-c" },
    { label: "Remainder", value: data.top_50_percent === null ? null : 100 - data.top_50_percent, className: "concentration-rest" },
  ];
  return (
    <div className="concentration">
      <div className="concentration-bar" aria-label="Active stake concentration">
        {groups.map((group) => <span key={group.label} className={group.className} style={{ width: `${Math.max(0, group.value ?? 0)}%` }} />)}
      </div>
      <div className="concentration-legend">
        {groups.map((group) => <div key={group.label}><span className={group.className} /><p>{group.label}<strong>{formatPercent(group.value)}</strong></p></div>)}
      </div>
      <div className="concentration-cumulative">
        <span>Top 10 <strong>{formatPercent(data.top_10_percent)}</strong></span><span>Top 25 <strong>{formatPercent(data.top_25_percent)}</strong></span><span>Top 50 <strong>{formatPercent(data.top_50_percent)}</strong></span>
      </div>
    </div>
  );
}
