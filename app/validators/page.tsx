import type { Metadata } from "next";
import { BadgeCheck, CircleSlash2, Shield, Users } from "@/components/icons";
import { Concentration } from "@/components/concentration";
import { TimeSeriesChart } from "@/components/time-series-chart";
import { Metric, SectionHeader, TrendSummary, Unavailable } from "@/components/ui";
import { getHistory, getLatestState, toTimeSeries } from "@/lib/data";
import { formatCompact, formatNumber, formatPercent, truncateAddress } from "@/lib/format";

export const metadata: Metadata = { title: "Validators" };

export default async function ValidatorsPage() {
  const [state, history] = await Promise.all([getLatestState(), getHistory()]);
  if (!state) return <Unavailable />;
  const validators = state.validators;
  const series = toTimeSeries(history, "validators", ["active", "delinquent", "delinquent_stake_percent"]);
  return <main className="page detail-page">
    <div className="page-intro"><h1>The security set, quantified.</h1><p>Participation, delinquency, commission structure, and active stake concentration across mainnet-beta.</p></div>
    <section className="metric-ribbon"><Metric label="Active validators" value={formatNumber(validators.counts.active)} delta={state.trends.validators.counts.active?.change_percent} tone="green" large /><Metric label="Delinquent validators" value={formatNumber(validators.counts.delinquent)} delta={state.trends.validators.counts.delinquent?.change_percent} large /><Metric label="Active stake" value={`${formatCompact(validators.stake.active_sol, 2)} SOL`} detail={`${formatPercent(validators.stake.delinquent_percent, 3)} delinquent`} tone="cyan" large /><Metric label="Median commission" value={formatPercent(validators.commissions.median_percent, 1)} detail={`${formatPercent(validators.commissions.average_percent, 1)} average`} tone="violet" large /></section>
    <section className="section"><SectionHeader title="Active stake concentration" description="Cumulative stake share shows how much voting power is controlled by the largest validator cohorts." /><div className="panel concentration-panel concentration-panel--large"><Concentration data={validators.concentration} /><div className="concentration-context"><Shield size={18} /><p><strong>{formatPercent(validators.concentration.top_50_percent)}</strong> of active stake is held by the top 50 validators. The remaining stake is distributed across the long tail of the active set.</p></div></div></section>
    <section className="section two-column validators-history"><div><SectionHeader title="Participation over time" /><div className="panel panel--chart"><TimeSeriesChart data={series} series={[{ key: "active", label: "Active", color: "#43b978", type: "area" }, { key: "delinquent", label: "Delinquent", color: "#e9a84a" }]} height={280} /></div></div><div><SectionHeader title="Delinquent stake" /><div className="panel trend-panel"><div className="trend-current"><CircleSlash2 size={18} /><span>Current exposure<strong>{formatPercent(validators.stake.delinquent_percent, 4)}</strong></span></div><TrendSummary trend={state.trends.validators.stake.delinquent_stake_percent} format={(value) => formatPercent(value, 4)} /></div></div></section>
    <section className="section"><SectionHeader title="Largest active validators" description="Ranked by activated stake from the latest getVoteAccounts observation." /><div className="panel table-panel"><div className="data-table" role="table"><div className="table-row table-head" role="row"><span>Rank</span><span>Identity</span><span>Vote account</span><span>Activated stake</span><span>Commission</span><span>Status</span></div>{validators.top_validators.map((validator, index) => <div className="table-row" role="row" key={validator.vote_account ?? index}><span className="rank">{String(index + 1).padStart(2, "0")}</span><span className="mono" title={validator.identity ?? undefined}>{truncateAddress(validator.identity, 7)}</span><span className="mono muted" title={validator.vote_account ?? undefined}>{truncateAddress(validator.vote_account, 7)}</span><strong>{formatCompact(validator.activated_stake_sol, 2)} SOL</strong><span>{formatPercent(validator.commission_percent, 0)}</span><span className="status-cell"><BadgeCheck size={14} />Active</span></div>)}</div></div></section>
    <section className="section validator-foot"><div className="panel compact-stat"><Users size={18} /><span>Observed set<strong>{formatNumber(validators.counts.total)} vote accounts</strong></span></div><div className="panel commission-range"><span>Commission range</span><div><strong>{formatPercent(validators.commissions.minimum_percent, 0)}</strong><i /><strong>{formatPercent(validators.commissions.maximum_percent, 0)}</strong></div></div></section>
  </main>;
}
