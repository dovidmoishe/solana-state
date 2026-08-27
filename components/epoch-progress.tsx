import { CircleGauge } from "@/components/icons";
import { formatNumber, formatPercent } from "@/lib/format";
import type { SolanaState } from "@/lib/types";

export function EpochProgress({ epoch }: { epoch: SolanaState["network"]["epoch"] }) {
  const progress = Math.max(0, Math.min(100, epoch.progress_percent ?? 0));
  return (
    <div className="epoch-panel">
      <div className="epoch-top"><div><h3>Epoch {formatNumber(epoch.epoch)}</h3></div><CircleGauge size={24} /></div>
      <div className="epoch-progress-label"><strong>{formatPercent(epoch.progress_percent, 1)}</strong><span>{formatNumber(epoch.slots_remaining)} slots remaining</span></div>
      <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>
      <div className="epoch-grid"><span>Current slot <strong>{formatNumber(epoch.slot_index)}</strong></span><span>Epoch capacity <strong>{formatNumber(epoch.slots_in_epoch)}</strong></span></div>
    </div>
  );
}
