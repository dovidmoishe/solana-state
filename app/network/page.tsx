import type { Metadata } from "next";
import { Binary, Blocks, CircleGauge, TimerReset } from "@/components/icons";
import { EpochProgress } from "@/components/epoch-progress";
import { TimeSeriesChart } from "@/components/time-series-chart";
import { Metric, SectionHeader, TrendSummary, Unavailable } from "@/components/ui";
import { getHistory, getLatestState, toTimeSeries } from "@/lib/data";
import { formatCompact, formatDuration, formatNumber, formatPercent } from "@/lib/format";

export const metadata: Metadata = { title: "Network" };

export default async function NetworkPage() {
  const [state, history] = await Promise.all([getLatestState(), getHistory()]);
  if (!state) return <Unavailable />;
  const perf = state.network.performance;
  const throughput = toTimeSeries(history, "network", ["tps", "non_vote_tps", "vote_tps"]);
  const timing = toTimeSeries(history, "network", ["slot_time_ms"]);
  return <main className="page detail-page">
    <div className="page-intro"><h1>Consensus at full resolution.</h1><p>Current throughput, timing, supply, and ledger position from finalized mainnet-beta observations.</p></div>
    <section className="metric-ribbon"><Metric label="Total TPS" value={formatNumber(perf.tps)} delta={state.trends.network.tps?.change_percent} tone="green" large /><Metric label="Non-vote TPS" value={formatNumber(perf.non_vote_tps)} delta={state.trends.network.non_vote_tps?.change_percent} tone="cyan" large /><Metric label="Vote TPS" value={formatNumber(perf.vote_tps)} delta={state.trends.network.vote_tps?.change_percent} tone="violet" large /><Metric label="Slot time" value={formatDuration(perf.slot_time_ms)} delta={state.trends.network.slot_time_ms?.change_percent} large /></section>
    <section className="section"><SectionHeader title="Transaction flow" description={`Aggregated over ${formatNumber(perf.sample_period_seconds)} seconds and ${formatCompact(perf.transactions_sampled)} transactions.`} /><div className="panel panel--chart"><TimeSeriesChart data={throughput} series={[{ key: "tps", label: "Total TPS", color: "#1f211f" }, { key: "non_vote_tps", label: "Non-vote TPS", color: "#43b978", type: "area" }, { key: "vote_tps", label: "Vote TPS", color: "#b8bab6" }]} height={330} /></div></section>
    <section className="section network-detail-grid"><div className="panel detail-block"><div className="detail-icon"><Blocks size={18} /></div><h3>{formatNumber(state.network.slot)}</h3><span>Finalized slot</span><dl><div><dt>Block height</dt><dd>{formatNumber(state.network.block_height)}</dd></div><div><dt>Transactions since genesis</dt><dd>{formatCompact(state.network.transactions?.total_since_genesis ?? null, 2)}</dd></div></dl></div><EpochProgress epoch={state.network.epoch} /><div className="panel detail-block"><div className="detail-icon"><Binary size={18} /></div><h3>{formatCompact(state.network.supply.circulating_sol, 2)} SOL</h3><span>Circulating</span><dl><div><dt>Total supply</dt><dd>{formatCompact(state.network.supply.total_sol, 2)}</dd></div><div><dt>Non-circulating</dt><dd>{formatCompact(state.network.supply.non_circulating_sol, 2)}</dd></div><div><dt>Circulating ratio</dt><dd>{formatPercent(state.network.supply.circulating_sol && state.network.supply.total_sol ? state.network.supply.circulating_sol / state.network.supply.total_sol * 100 : null)}</dd></div></dl></div></section>
    <section className="section two-column"><div><SectionHeader title="Slot cadence" /><div className="panel panel--chart"><TimeSeriesChart data={timing} series={[{ key: "slot_time_ms", label: "Slot time", color: "#e9a84a", type: "area" }]} valueFormat="ms" height={250} /></div></div><div><SectionHeader title="TPS statistics" /><div className="panel trend-panel"><div className="trend-current"><CircleGauge size={18} /><span>Current aggregate<strong>{formatNumber(perf.tps)} TPS</strong></span></div><TrendSummary trend={state.trends.network.tps} format={(value) => `${formatNumber(value)} TPS`} /><div className="timing-note"><TimerReset size={15} />History window: {formatNumber(state.meta.history?.window_hours ?? null)} hours</div></div></div></section>
  </main>;
}
