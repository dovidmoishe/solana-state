import type { SolanaState } from "@/lib/types";

export type OperationalStatus = "operational" | "degraded" | "critical" | "unknown";

export function getOperationalStatus(state: SolanaState): OperationalStatus {
  if (state.network.rpc_health !== "ok") return "degraded";
  if (state.anomalies.some((item) => item.severity === "critical")) return "critical";
  if (state.anomalies.some((item) => item.severity === "warning")) return "degraded";
  return "operational";
}

export const statusCopy: Record<OperationalStatus, { title: string; detail: string }> = {
  operational: { title: "Network operating normally", detail: "Mainnet-beta is healthy with no significant deviations detected." },
  degraded: { title: "Network performance degraded", detail: "One or more live signals require attention." },
  critical: { title: "Critical deviation detected", detail: "A major network signal has moved outside its expected range." },
  unknown: { title: "Network status unavailable", detail: "The latest state could not be verified." },
};
