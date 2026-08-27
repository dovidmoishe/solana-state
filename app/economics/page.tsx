import type { Metadata } from "next";
import { Banknote, Coins, HandCoins, Scale } from "@/components/icons";
import { TimeSeriesChart } from "@/components/time-series-chart";
import { Metric, MetricDelta, SectionHeader, TrendSummary, Unavailable } from "@/components/ui";
import { getHistory, getLatestState, toTimeSeries } from "@/lib/data";
import { formatPercent, formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Economics" };

export default async function EconomicsPage() {
  const [state, history] = await Promise.all([getLatestState(), getHistory()]);
  if (!state) return <Unavailable />;
  const economy = state.economics;
  const capital = toTimeSeries(history, "economics", ["tvl_usd", "stablecoin_market_cap_usd"]);
  const activity = toTimeSeries(history, "economics", ["dex_volume_24h_usd", "app_fees_24h_usd", "app_revenue_24h_usd"]);
  return <main className="page detail-page">
    <div className="page-intro"><h1>Economic gravity on Solana.</h1><p>Market value, deployed capital, exchange activity, fees, and protocol revenue from keyless public sources.</p></div>
    <section className="economic-hero"><div className="sol-price"><span>SOL / USD</span><strong>{formatUsd(economy.market.price_usd, false)}</strong><small>Source confidence {formatPercent(economy.market.confidence ? economy.market.confidence * 100 : null, 0)}</small></div><div className="economic-hero-metrics"><Metric label="Total value locked" value={formatUsd(economy.defi.tvl_usd)} tone="cyan" large /><Metric label="Stablecoin supply" value={formatUsd(economy.stablecoins.market_cap_usd)} tone="violet" large /><Metric label="24h DEX volume" value={formatUsd(economy.dex.volume_24h_usd)} delta={economy.dex.change_1d_percent ?? null} tone="green" large /></div></section>
    <section className="section two-column"><div><SectionHeader title="TVL and stablecoin liquidity" /><div className="panel panel--chart"><TimeSeriesChart data={capital} series={[{ key: "tvl_usd", label: "TVL", color: "#43b978", type: "area" }, { key: "stablecoin_market_cap_usd", label: "Stablecoin supply", color: "#b8bab6" }]} valueFormat="usd" height={300} /></div></div><div><SectionHeader title="Capital statistics" /><div className="panel trend-panel economic-trends"><h3>Total value locked</h3><TrendSummary trend={state.trends.economics.tvl_usd} format={(value) => formatUsd(value)} /><h3>Stablecoin supply</h3><TrendSummary trend={state.trends.economics.stablecoin_market_cap_usd} format={(value) => formatUsd(value)} /></div></div></section>
    <section className="section"><SectionHeader title="DEX volume across timeframes" description="Aggregate Solana decentralized exchange turnover and reported rate of change." /><div className="window-grid"><WindowMetric icon={<Banknote size={17} />} label="24 hours" value={economy.dex.volume_24h_usd} delta={economy.dex.change_1d_percent ?? null} /><WindowMetric icon={<Scale size={17} />} label="7 days" value={economy.dex.volume_7d_usd} delta={economy.dex.change_7d_percent ?? null} /><WindowMetric icon={<Coins size={17} />} label="30 days" value={economy.dex.volume_30d_usd} delta={economy.dex.change_1m_percent ?? null} /></div><div className="panel panel--chart activity-chart"><TimeSeriesChart data={activity} series={[{ key: "dex_volume_24h_usd", label: "24h DEX volume", color: "#43b978", type: "area" }]} valueFormat="usd" height={260} /></div></section>
    <section className="section app-economics"><div><SectionHeader title="Fees generated" /><EconomicWindow data={economy.fees} icon={<HandCoins size={19} />} /></div><div><SectionHeader title="Revenue captured" /><EconomicWindow data={economy.revenue} icon={<Coins size={19} />} /></div></section>
  </main>;
}

function WindowMetric({ icon, label, value, delta }: { icon: React.ReactNode; label: string; value: number | null; delta: number | null }) { return <div className="window-metric"><span className="detail-icon">{icon}</span><div><span>{label}</span><strong>{formatUsd(value)}</strong></div><MetricDelta value={delta} /></div>; }

function EconomicWindow({ data, icon }: { data: Record<string, number | null | undefined>; icon: React.ReactNode }) {
  return <div className="panel economic-window"><div className="economic-window-top"><span className="detail-icon">{icon}</span><strong>{formatUsd(data["24h_usd"] ?? null)}</strong><MetricDelta value={data.change_1d_percent ?? null} /></div><dl><div><dt>Previous 24h</dt><dd>{formatUsd(data.previous_24h_usd ?? null)}</dd></div><div><dt>7 day total</dt><dd>{formatUsd(data["7d_usd"] ?? null)}</dd></div><div><dt>30 day total</dt><dd>{formatUsd(data["30d_usd"] ?? null)}</dd></div><div><dt>7d change</dt><dd>{formatPercent(data.change_7d_percent ?? null)}</dd></div></dl></div>;
}
