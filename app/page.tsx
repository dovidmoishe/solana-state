import Link from "next/link";
import { ArrowRight, Gauge } from "@/components/icons";
import { Concentration } from "@/components/concentration";
import { NetworkComposition } from "@/components/network-composition";
import { SourceHealth } from "@/components/source-health";
import { TimeSeriesChart } from "@/components/time-series-chart";
import { HealthyIntelligence, Metric, SectionHeader, Unavailable } from "@/components/ui";
import { getHistory, getLatestState, toTimeSeries } from "@/lib/data";
import { formatDuration, formatNumber, formatPercent, formatRelativeTime, formatUsd } from "@/lib/format";
import { getOperationalStatus, statusCopy } from "@/lib/status";

export default async function OverviewPage() {
  const [state, history] = await Promise.all([getLatestState(), getHistory()]);
  if (!state) return <Unavailable />;
  const status = getOperationalStatus(state);
  const copy = statusCopy[status];
  const networkSeries = toTimeSeries(history, "network", ["tps", "non_vote_tps", "vote_tps"]);
  const economicsSeries = toTimeSeries(history, "economics", ["sol_price_usd"]);
  return (
    <main className="page">
      <section className="hero" data-status={status}>
        <div className="hero-signal" aria-hidden="true"><span /><span /><span /><span /><span /></div>
        <div className="hero-copy">
          <div className="hero-status"><span className="hero-status-dot" /><h1>{copy.title}</h1></div>
          <p className="hero-description">{copy.detail}</p>
          <div className="hero-meta"><span>{formatRelativeTime(state.meta.generated_at)}</span><span>Block {formatNumber(state.network.block_height)}</span><span>Epoch {formatNumber(state.network.epoch.epoch)}</span></div>
        </div>
        <div className="hero-metrics">
          <Metric label="Total throughput" value={`${formatNumber(state.network.performance.tps)} TPS`} detail="5-minute aggregate" tone="green" large />
          <Metric label="Slot time" value={formatDuration(state.network.performance.slot_time_ms)} detail={`${formatNumber(state.network.performance.slots_per_second, 2)} slots / sec`} tone="cyan" large />
          <Metric label="Total value locked" value={formatUsd(state.economics.defi.tvl_usd)} detail="DeFiLlama" tone="violet" large />
          <Metric label="24h DEX volume" value={formatUsd(state.economics.dex.volume_24h_usd)} delta={state.economics.dex.change_1d_percent ?? null} large />
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Performance at a glance" description="Throughput, transaction mix, and current consensus progress." action={<Link href="/network" className="text-link">Open network view <ArrowRight size={14} /></Link>} />
        <div className="overview-grid">
          <div className="panel panel--chart"><div className="panel-heading"><div><h3>Transaction throughput</h3><p>Vote and non-vote transactions per second</p></div><span className="live-badge">Live aggregate</span></div><TimeSeriesChart data={networkSeries} series={[{ key: "non_vote_tps", label: "Non-vote TPS", color: "#43b978", type: "area" }, { key: "vote_tps", label: "Vote TPS", color: "#b8bab6" }]} /></div>
          <NetworkComposition state={state} />
        </div>
      </section>

      <section className="section split-section">
        <div>
          <SectionHeader title="Stake distribution" description="Cumulative active stake controlled by the largest validators." action={<Link href="/validators" className="text-link">Validator detail <ArrowRight size={14} /></Link>} />
          <div className="panel concentration-panel"><div className="validator-summary"><Metric label="Active validators" value={formatNumber(state.validators.counts.active)} detail={`${formatNumber(state.validators.counts.total)} observed`} /><Metric label="Delinquent stake" value={formatPercent(state.validators.stake.delinquent_percent, 3)} detail={`${formatNumber(state.validators.counts.delinquent)} delinquent accounts`} /></div><Concentration data={state.validators.concentration} /></div>
        </div>
        <div>
          <SectionHeader title="Market pulse" description="Capital, liquidity, and application-level economic activity." action={<Link href="/economics" className="text-link">Economics detail <ArrowRight size={14} /></Link>} />
          <div className="panel pulse-panel"><div className="price-block"><span>SOL / USD</span><strong>{formatUsd(state.economics.market.price_usd, false)}</strong><small>Confidence {formatPercent(state.economics.market.confidence ? state.economics.market.confidence * 100 : null, 0)}</small></div><div className="mini-chart"><TimeSeriesChart data={economicsSeries} series={[{ key: "sol_price_usd", label: "SOL price", color: "#43b978", type: "area" }]} height={155} /></div><div className="pulse-grid"><Metric label="Stablecoin supply" value={formatUsd(state.economics.stablecoins.market_cap_usd)} /><Metric label="App fees / 24h" value={formatUsd(state.economics.fees["24h_usd"] ?? null)} delta={state.economics.fees.change_1d_percent ?? null} /><Metric label="App revenue / 24h" value={formatUsd(state.economics.revenue["24h_usd"] ?? null)} delta={state.economics.revenue.change_1d_percent ?? null} /></div></div>
        </div>
      </section>

      <section className="section intelligence-grid">
        <div><SectionHeader title="Signal monitor" description="Statistical deviations generated by the Python analysis layer." action={<Link href="/activity" className="text-link">All intelligence <ArrowRight size={14} /></Link>} /><div className="panel intelligence-panel">{state.anomalies.length ? state.anomalies.slice(0, 3).map((item) => <div key={item.metric}><span className="feed-icon"><Gauge size={15} /></span><div><strong>{item.severity.toUpperCase()} · {item.label}</strong><p>{item.message}</p></div></div>) : <HealthyIntelligence />}</div></div>
        <div><SectionHeader title="Data sources" description="Upstream availability at the latest collection." /><div className="panel"><SourceHealth state={state} /></div></div>
      </section>
    </main>
  );
}
