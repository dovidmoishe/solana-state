"use client";

import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CollectingHistory } from "@/components/ui";
import type { ChartPoint } from "@/lib/types";

export interface ChartSeries { key: string; label: string; color: string; type?: "line" | "area" }

export function TimeSeriesChart({ data, series, valueFormat = "number", height = 280 }: {
  data: ChartPoint[]; series: ChartSeries[]; valueFormat?: "number" | "usd" | "ms"; height?: number;
}) {
  const valueFormatter = (value: number) => formatChartValue(value, valueFormat);
  if (data.length < 2) return <div className="chart-empty" style={{ minHeight: height }}><CollectingHistory /></div>;
  return (
    <div className="chart-wrap" style={{ height }}>
      <div className="chart-plot">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 12, left: -12, bottom: 8 }}>
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
