import { formatNumber, formatPercent } from "@/lib/format";
import type { SolanaState } from "@/lib/types";

const SEGMENTS = Array.from({ length: 10 }, (_, index) => index);

export function NetworkComposition({ state }: { state: SolanaState }) {
  const performance = state.network.performance;
  const total = performance.tps;
  const share = (value: number | null) => total && value !== null ? (value / total) * 100 : 0;
  const stages = [
    { label: "Throughput", percent: 100, value: `${formatNumber(total)} TPS` },
    { label: "Non-vote mix", percent: share(performance.non_vote_tps), value: `${formatNumber(performance.non_vote_tps)} TPS` },
    { label: "Vote mix", percent: share(performance.vote_tps), value: `${formatNumber(performance.vote_tps)} TPS` },
    { label: "Epoch cycle", percent: state.network.epoch.progress_percent ?? 0, value: formatPercent(state.network.epoch.progress_percent, 1) },
  ];

  return (
    <div className="panel composition-panel">
      <div className="panel-heading composition-heading">
        <div><h3>Network composition</h3><p>Live transaction mix and consensus cycle</p></div>
        <span className="live-badge">Current state</span>
      </div>
      <div className="composition-chart" role="img" aria-label="Network transaction composition">
        {stages.map((stage) => (
          <div className="composition-stage" key={stage.label}>
            <strong>{formatPercent(stage.percent, stage.percent === 100 ? 0 : 1)}</strong>
            <div className="segment-columns">
              {SEGMENTS.map((segment) => (
                <i
                  key={segment}
                  data-primary={segment === 0 || undefined}
                  style={{ height: `${Math.max(18, Math.min(100, stage.percent) - segment * 1.8)}%` }}
                />
              ))}
            </div>
            <span>{stage.label}</span>
            <small>{stage.value}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
