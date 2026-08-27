import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { ChartPoint, DataSection, HistoricalSnapshot, SolanaState } from "@/lib/types";

const DATA_ROOT = path.join(process.cwd(), "data");
const HISTORY_ROOT = path.join(DATA_ROOT, "history", "raw");

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isState(value: unknown): value is SolanaState {
  return isRecord(value) && isRecord(value.meta) && typeof value.meta.generated_at === "string";
}

function isSnapshot(value: unknown): value is HistoricalSnapshot {
  return isRecord(value) && typeof value.timestamp === "string";
}

export async function getLatestState(): Promise<SolanaState | null> {
  try {
    const value = await readJson(path.join(DATA_ROOT, "latest.json"));
    return isState(value) ? value : null;
  } catch {
    return null;
  }
}

export async function getHistory(): Promise<HistoricalSnapshot[]> {
  try {
    const entries = (await fs.readdir(HISTORY_ROOT)).filter((name) => name.endsWith(".json")).sort();
    const results = await Promise.all(entries.map(async (name) => {
      try {
        const value = await readJson(path.join(HISTORY_ROOT, name));
        return isSnapshot(value) ? value : null;
      } catch {
        return null;
      }
    }));
    return results.filter((item): item is HistoricalSnapshot => item !== null);
  } catch {
    return [];
  }
}

export function toTimeSeries(
  history: HistoricalSnapshot[],
  section: DataSection,
  metrics: string[],
): ChartPoint[] {
  return history.map((snapshot) => {
    const observed = new Date(snapshot.timestamp);
    const point: ChartPoint = {
      timestamp: snapshot.timestamp,
      label: Number.isNaN(observed.getTime())
        ? snapshot.timestamp
        : observed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
    for (const metric of metrics) point[metric] = snapshot[section]?.[metric] ?? null;
    return point;
  });
}
