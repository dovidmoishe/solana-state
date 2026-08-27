import type { NullableNumber } from "@/lib/types";

const unavailable = "—";

export function formatNumber(value: NullableNumber, digits = 0): string {
  if (value === null || !Number.isFinite(value)) return unavailable;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

export function formatCompact(value: NullableNumber, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return unavailable;
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: digits }).format(value);
}

export function formatUsd(value: NullableNumber, compact = true): string {
  if (value === null || !Number.isFinite(value)) return unavailable;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact && Math.abs(value) >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: compact && Math.abs(value) >= 10_000 ? 2 : 2,
  }).format(value);
}

export function formatPercent(value: NullableNumber, digits = 2): string {
  return value === null || !Number.isFinite(value) ? unavailable : `${formatNumber(value, digits)}%`;
}

export function formatDuration(value: NullableNumber): string {
  return value === null ? unavailable : `${formatNumber(value, value < 10 ? 2 : 0)} ms`;
}

export function formatRelativeTime(timestamp: string): string {
  const elapsed = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(elapsed)) return "Update time unavailable";
  const minutes = Math.max(0, Math.floor(elapsed / 60_000));
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  return `Updated ${Math.floor(hours / 24)}d ago`;
}

export function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown update time";
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(date);
}

export function truncateAddress(value: string | null, leading = 5): string {
  if (!value) return unavailable;
  return `${value.slice(0, leading)}…${value.slice(-4)}`;
}
