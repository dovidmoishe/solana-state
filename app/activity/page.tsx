import type { Metadata } from "next";
import { Activity, ChartNoAxesCombined, Clock3, Sigma } from "@/components/icons";
import { SourceHealth } from "@/components/source-health";
import { TimeSeriesChart } from "@/components/time-series-chart";
import { AnomalyItem, CollectingHistory, HealthyIntelligence, SectionHeader, TrendSummary, Unavailable } from "@/components/ui";
import { getHistory, getLatestState, toTimeSeries } from "@/lib/data";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const [state, history] = await Promise.all([getLatestState(), getHistory()]);
  if (!state) return <Unavailable />;
  const tpsSeries = toTimeSeries(history, "network", ["tps"]);
  const samples = state.meta.history?.samples_available ?? history.length;
  const monitoredMetrics = Object.keys(state.trends.network).length
    + Object.keys(state.trends.validators.counts).length
    + Object.keys(state.trends.validators.stake).length
    + Object.keys(state.trends.validators.concentration).length
    + Object.keys(state.trends.economics).length;
  return <main className="page detail-page">
    <div className="page-intro"><h1>Signals, not noise.</h1><p>Trend context and statistically meaningful deviations produced from the rolling observation window.</p></div>
    <section className="intelligence-summary"><div><Activity size={18} /><span>Active signals<strong>{state.anomalies.length}</strong></span></div><div><Sigma size={18} /><span>Baseline samples<strong>{samples}</strong></span></div><div><Clock3 size={18} /><span>Observation window<strong>{formatNumber(state.meta.history?.window_hours ?? null)}h</strong></span></div><div><ChartNoAxesCombined size={18} /><span>Metrics monitored<strong>{monitoredMetrics}</strong></span></div></section>
    <section className="section intelligence-layout"><div><SectionHeader title="Deviation feed" description="Signals are ranked by severity and generated only after sufficient baseline data exists." /><div className="anomaly-feed">{state.anomalies.length ? state.anomalies.map((anomaly) => <AnomalyItem key={anomaly.metric} anomaly={anomaly} />) : <HealthyIntelligence />}</div></div><div><SectionHeader title="Source health" description="Availability reported by the latest collector run." /><div className="panel"><SourceHealth state={state} /></div><div className="collection-record"><span>Latest collection</span><strong>{formatDateTime(state.meta.generated_at)}</strong><small>Completed in {state.meta.collection_duration_seconds.toFixed(2)} seconds</small></div></div></section>
    <section className="section"><SectionHeader title="TPS baseline" description="Current throughput compared against the rolling historical window." /><div className="two-column trend-chart-grid"><div className="panel panel--chart"><TimeSeriesChart data={tpsSeries} series={[{ key: "tps", label: "Total TPS", color: "#43b978", type: "area" }]} height={280} /></div><div className="panel trend-panel"><div className="trend-current"><Activity size={18} /><span>Current observation<strong>{formatNumber(state.network.performance.tps)} TPS</strong></span></div><TrendSummary trend={state.trends.network.tps} format={(value) => `${formatNumber(value)} TPS`} /></div></div></section>
    <section className="section trends-catalog"><SectionHeader title="Economic trend matrix" description="A compact reading of current values against recent observations." /><div className="trend-cards">{Object.entries(state.trends.economics).map(([key, trend]) => <div className="panel trend-card" key={key}><span>{labelMetric(key)}</span><strong>{trend.change_percent === null ? "No baseline" : `${trend.change_percent > 0 ? "+" : ""}${formatPercent(trend.change_percent)}`}</strong>{trend.samples > 0 ? <small>{trend.samples} samples · avg delta {formatPercent(trend.vs_average_percent)}</small> : <CollectingHistory compact />}</div>)}</div></section>
  </main>;
}

function labelMetric(key: string): string { return key.replaceAll("_usd", "").replaceAll("_24h", " / 24h").replaceAll("_7d", " / 7d").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()); }
