"use client";

import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartPoint } from "@/lib/types";

export interface ChartSeries { key: string; label: string; color: string; type?: "line" | "area" }

export function TimeSeriesChart({ data, series, valueFormat = "number", height = 280 }: {
  data: ChartPoint[]; series: ChartSeries[]; valueFormat?: "number" | "usd" | "ms"; height?: number;
}) {
  const valueFormatter = (value: number) => formatChartValue(value, valueFormat);
  const usingDemoData = data.length < 2;
  const chartData = usingDemoData ? createDemoSeries(data[0], series) : data;
  return (
    <div className="chart-wrap" style={{ height }} data-demo={usingDemoData}>
      {usingDemoData && <span className="demo-data-badge">Demo data</span>}
      <div className="chart-plot">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: -12, bottom: 8 }}>
            <defs>{series.map((item) => <linearGradient key={item.key} id={`fill-${item.key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={item.color} stopOpacity={0.22} /><stop offset="100%" stopColor={item.color} stopOpacity={0} /></linearGradient>)}</defs>
            <CartesianGrid stroke="#e7e7e3" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#92938f", fontSize: 11 }} tickMargin={11} height={36} minTickGap={28} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#92938f", fontSize: 11 }} tickMargin={8} tickFormatter={valueFormatter} />
            <Tooltip content={<ChartTooltip series={series} valueFormatter={valueFormatter} />} />
            {series.map((item) => item.type === "area" ? <Area key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} fill={`url(#fill-${item.key})`} strokeWidth={2.25} connectNulls /> : <Line key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} strokeWidth={2.25} dot={false} activeDot={{ r: 4, fill: item.color, stroke: "#ffffff", strokeWidth: 2 }} connectNulls />)}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">{series.map((item) => <span key={item.key}><i style={{ background: item.color }} />{item.label}</span>)}</div>
    </div>
  );
}

const demoBaselines: Record<string, number> = {
  tps: 3280,
  non_vote_tps: 1160,
  vote_tps: 2120,
  slot_time_ms: 418,
  sol_price_usd: 182,
  active: 1565,
  delinquent: 21,
  delinquent_stake_percent: 0.18,
  tvl_usd: 9_400_000_000,
  stablecoin_market_cap_usd: 12_700_000_000,
  dex_volume_24h_usd: 3_900_000_000,
  app_fees_24h_usd: 4_600_000,
  app_revenue_24h_usd: 2_100_000,
};

function createDemoSeries(seed: ChartPoint | undefined, series: ChartSeries[]): ChartPoint[] {
  const curve = [0.91, 0.94, 0.925, 0.97, 1.01, 0.995, 1.04, 1.025, 1.07, 1.045, 1.09, 1.065, 1.11, 1.085];
  const start = Date.now() - (curve.length - 1) * 60 * 60 * 1000;

  return curve.map((factor, index) => {
    const timestamp = new Date(start + index * 60 * 60 * 1000).toISOString();
    const point: ChartPoint = {
      timestamp,
      label: new Intl.DateTimeFormat("en", { hour: "numeric" }).format(new Date(timestamp)),
    };

    series.forEach((item, seriesIndex) => {
      const seedValue = seed?.[item.key];
      const baseline = typeof seedValue === "number" && Number.isFinite(seedValue)
        ? seedValue
        : demoBaselines[item.key] ?? 100 * (seriesIndex + 1);
      const offsetFactor = factor + seriesIndex * 0.012 * Math.sin(index * 1.4);
      point[item.key] = Number((baseline * offsetFactor).toFixed(baseline < 10 ? 3 : 1));
    });

    return point;
  });
}

function formatChartValue(value: number, mode: "number" | "usd" | "ms"): string {
  if (mode === "ms") return `${Math.round(value)} ms`;
  if (mode === "usd") return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

function ChartTooltip({ active, payload, label, series, valueFormatter }: {
  active?: boolean; payload?: Array<{ dataKey?: string | number; value?: number | string }>; label?: string; series: ChartSeries[]; valueFormatter: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><span>{label}</span>{payload.map((item) => { const definition = series.find((entry) => entry.key === item.dataKey); return <div key={String(item.dataKey)}><i style={{ background: definition?.color }} /><strong>{definition?.label}</strong><b>{typeof item.value === "number" ? valueFormatter(item.value) : "—"}</b></div>; })}</div>;
}
