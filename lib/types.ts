export type NullableNumber = number | null;

export interface TrendMetric {
  current: NullableNumber;
  previous: NullableNumber;
  change_percent: NullableNumber;
  average: NullableNumber;
  vs_average_percent: NullableNumber;
  minimum: NullableNumber;
  maximum: NullableNumber;
  samples: number;
}

export interface SourceStatus {
  provider: string;
  status: "ok" | "error" | string;
  error?: string;
}

export interface SolanaState {
  meta: {
    generated_at: string;
    network: string;
    version: string;
    collection_duration_seconds: number;
    history?: {
      window_hours: number;
      samples_available: number;
      oldest_observation: string | null;
      newest_observation: string | null;
    };
  };
  network: {
    slot: NullableNumber;
    block_height: NullableNumber;
    epoch: {
      epoch: NullableNumber;
      slot_index: NullableNumber;
      slots_in_epoch: NullableNumber;
      slots_remaining: NullableNumber;
      progress_percent: NullableNumber;
    };
    performance: {
      tps: NullableNumber;
      non_vote_tps: NullableNumber;
      vote_tps: NullableNumber;
      slots_per_second: NullableNumber;
      slot_time_ms: NullableNumber;
      sample_period_seconds: NullableNumber;
      transactions_sampled: NullableNumber;
    };
    transactions?: { total_since_genesis: NullableNumber };
    supply: {
      total_sol: NullableNumber;
      circulating_sol: NullableNumber;
      non_circulating_sol: NullableNumber;
    };
    rpc_health: string;
    source?: { name: string; type: string };
  };
  validators: {
    counts: { active: NullableNumber; delinquent: NullableNumber; total: NullableNumber };
    stake: {
      active_sol: NullableNumber;
      delinquent_sol: NullableNumber;
      total_sol: NullableNumber;
      delinquent_percent: NullableNumber;
    };
    concentration: {
      top_10_percent: NullableNumber;
      top_25_percent: NullableNumber;
      top_50_percent: NullableNumber;
    };
    commissions: {
      average_percent: NullableNumber;
      median_percent: NullableNumber;
      minimum_percent: NullableNumber;
      maximum_percent: NullableNumber;
    };
    top_validators: Array<{
      vote_account: string | null;
      identity: string | null;
      activated_stake_sol: NullableNumber;
      commission_percent: NullableNumber;
      last_vote: NullableNumber;
      epoch_vote_account: boolean | null;
    }>;
    source?: { name: string; method: string; type: string };
  };
  economics: {
    market: { price_usd: NullableNumber; symbol?: string; price_timestamp?: NullableNumber; confidence?: NullableNumber };
    defi: { tvl_usd: NullableNumber };
    stablecoins: { market_cap_usd: NullableNumber; timestamp?: string | null };
    dex: EconomicWindow & {
      volume_24h_usd: NullableNumber;
      volume_previous_24h_usd?: NullableNumber;
      volume_7d_usd: NullableNumber;
      volume_30d_usd: NullableNumber;
      weekly_change_percent?: NullableNumber;
    };
    fees: EconomicWindow;
    revenue: EconomicWindow;
    sources: Record<string, SourceStatus>;
  };
  growth: Record<string, unknown>;
  protocol: Record<string, unknown>;
  trends: {
    network: Record<string, TrendMetric>;
    validators: {
      counts: Record<string, TrendMetric>;
      stake: Record<string, TrendMetric>;
      concentration: Record<string, TrendMetric>;
    };
    economics: Record<string, TrendMetric>;
  };
  anomalies: Anomaly[];
  health: Record<string, unknown>;
}

export interface EconomicWindow {
  [key: string]: NullableNumber | undefined;
  "24h_usd"?: NullableNumber;
  previous_24h_usd?: NullableNumber;
  "7d_usd"?: NullableNumber;
  "30d_usd"?: NullableNumber;
  change_1d_percent?: NullableNumber;
  change_7d_percent?: NullableNumber;
  change_1m_percent?: NullableNumber;
}

export interface Anomaly {
  metric: string;
  label: string;
  severity: "critical" | "warning" | "notice" | string;
  current: NullableNumber;
  baseline_average: NullableNumber;
  change_from_baseline_percent: NullableNumber;
  z_score: NullableNumber;
  message: string;
}

export interface HistoricalSnapshot {
  timestamp: string;
  network: Record<string, NullableNumber>;
  validators: Record<string, NullableNumber>;
  economics: Record<string, NullableNumber>;
}

export interface ChartPoint {
  timestamp: string;
  label: string;
  [metric: string]: string | number | null;
}

export type DataSection = "network" | "validators" | "economics";
