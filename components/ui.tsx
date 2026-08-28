import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, Radar, ShieldCheck } from "@/components/icons";
import type { Anomaly, NullableNumber, TrendMetric } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/format";

export function SectionHeader({ title, description, action }: {
  title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="section-header">
      <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}

export function Metric({ label, value, detail, delta, tone = "default", large = false }: {
  label: string; value: ReactNode; detail?: ReactNode; delta?: NullableNumber; tone?: "default" | "cyan" | "violet" | "green"; large?: boolean;
}) {
  return (
    <div className={`metric metric--${tone}${large ? " metric--large" : ""}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">{delta !== undefined && <MetricDelta value={delta} />}{detail && <span>{detail}</span>}</div>
    </div>
  );
}

export function MetricDelta({ value, inverse = false }: { value: NullableNumber; inverse?: boolean }) {
  if (value === null) return <span className="delta delta--muted"><Minus size={12} />No baseline</span>;
  const positive = inverse ? value < 0 : value > 0;
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return <span className={`delta ${positive ? "delta--good" : value === 0 ? "delta--muted" : "delta--bad"}`}><Icon size={12} />{formatPercent(Math.abs(value))}</span>;
}

export function TrendSummary({ trend, format = (value) => formatNumber(value, 2) }: { trend?: TrendMetric; format?: (value: NullableNumber) => string }) {
  if (!trend || trend.samples === 0) return <CollectingHistory compact />;
  return (
    <dl className="trend-summary">
      <div><dt>Previous</dt><dd>{format(trend.previous)}</dd></div>
      <div><dt>Recent avg.</dt><dd>{format(trend.average)}</dd></div>
      <div><dt>Range</dt><dd>{format(trend.minimum)} – {format(trend.maximum)}</dd></div>
      <div><dt>Samples</dt><dd>{trend.samples}</dd></div>
    </dl>
  );
}

export function CollectingHistory({ compact = false }: { compact?: boolean }) {
  return <div className={`collecting${compact ? " collecting--compact" : ""}`}><Radar size={compact ? 14 : 20} /><div><strong>Collecting historical data</strong>{!compact && <span>Time-series insights appear after additional collector runs.</span>}</div></div>;
}

export function AnomalyItem({ anomaly }: { anomaly: Anomaly }) {
  return (
    <article className="anomaly" data-severity={anomaly.severity}>
      <span className="anomaly-severity">{anomaly.severity}</span>
      <div><h3>{anomaly.label}</h3><p>{anomaly.message}</p></div>
      <div className="anomaly-score"><span>vs baseline</span><strong>{formatPercent(anomaly.change_from_baseline_percent)}</strong></div>
    </article>
  );
}

export function HealthyIntelligence() {
  return (
    <div className="healthy-state"><span className="healthy-icon"><ShieldCheck size={22} /></span><div><h3>No significant deviations detected</h3><p>Network, validator, and economic signals remain within their available baselines.</p></div></div>
  );
}

export function Unavailable() {
  return <main className="page page--center"><div className="unavailable"><ActivityIcon /><h1>State unavailable</h1><p>The generated data file could not be read. The dashboard will recover after the next successful collection.</p></div></main>;
}

function ActivityIcon() { return <span className="healthy-icon"><Radar size={24} /></span>; }
