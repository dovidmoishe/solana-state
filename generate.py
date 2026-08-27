from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from time import perf_counter
from typing import Any

from analysis.anomalies import detect_anomalies
from analysis.trends import calculate_trends

from collector.economics import collect_economic_metrics
from collector.network import collect_network_metrics
from collector.rpc import SolanaRPC
from collector.validators import collect_validator_metrics

from storage.history import (
    cleanup_old_snapshots,
    load_snapshots,
    save_snapshot,
)


# ============================================================
# CONFIG
# ============================================================

OUTPUT_DIR = Path("data")
OUTPUT_FILE = OUTPUT_DIR / "latest.json"

VERSION = "0.3.0"
NETWORK = "mainnet-beta"

HISTORY_WINDOW_HOURS = 48
RAW_RETENTION_HOURS = 48


# ============================================================
# COLLECTION
# ============================================================


def build_report() -> dict[str, Any]:
    """
    Collect the current state of the Solana ecosystem.

    Historical analysis is intentionally performed later,
    because the current observation must be compared against
    snapshots from previous runs.
    """

    started = perf_counter()

    # --------------------------------------------------------
    # Solana RPC
    # --------------------------------------------------------

    rpc = SolanaRPC()

    print("→ Collecting network metrics...")

    network = collect_network_metrics(
        rpc
    )

    print("✓ Network metrics collected")

    # --------------------------------------------------------
    # Validators
    # --------------------------------------------------------

    print("→ Collecting validator metrics...")

    validators = collect_validator_metrics(
        rpc
    )

    print("✓ Validator metrics collected")

    # --------------------------------------------------------
    # Economics
    # --------------------------------------------------------

    print("→ Collecting economic metrics...")

    economics = collect_economic_metrics()

    print("✓ Economic metrics collected")

    # --------------------------------------------------------
    # Finish current-state collection
    # --------------------------------------------------------

    collection_duration = (
        perf_counter() - started
    )

    report: dict[str, Any] = {
        "meta": {
            "generated_at": datetime.now(
                timezone.utc
            ).isoformat(),

            "network": NETWORK,

            "version": VERSION,

            "collection_duration_seconds": round(
                collection_duration,
                2,
            ),
        },

        "network": network,

        "validators": validators,

        "economics": economics,

        # Future collectors
        "growth": {},

        "protocol": {},

        # Analysis layers
        "trends": {},

        "anomalies": [],

        "health": {},
    }

    return report


# ============================================================
# REPORT STORAGE
# ============================================================


def save_report(
    report: dict[str, Any],
) -> Path:
    """
    Save the canonical latest report.

    data/latest.json always represents the most recently
    generated Solana State.
    """

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    with OUTPUT_FILE.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            report,
            file,
            indent=2,
            ensure_ascii=False,
        )

    return OUTPUT_FILE


# ============================================================
# FORMATTING HELPERS
# ============================================================


def format_usd(
    value: float | int | None,
) -> str:
    """
    Convert large USD amounts into readable terminal values.
    """

    if value is None:
        return "unknown"

    number = float(value)

    absolute = abs(number)

    if absolute >= 1_000_000_000:
        return (
            f"${number / 1_000_000_000:,.2f}B"
        )

    if absolute >= 1_000_000:
        return (
            f"${number / 1_000_000:,.2f}M"
        )

    if absolute >= 1_000:
        return (
            f"${number / 1_000:,.2f}K"
        )

    return f"${number:,.2f}"


def trend_symbol(
    value: float | int | None,
) -> str:
    if value is None:
        return ""

    if value > 0:
        return "↑"

    if value < 0:
        return "↓"

    return "→"


# ============================================================
# CLI SUMMARY
# ============================================================


def print_summary(
    report: dict[str, Any],
) -> None:
    """
    Print a concise terminal summary after generation.
    """

    network = report.get(
        "network",
        {},
    )

    validators = report.get(
        "validators",
        {},
    )

    economics = report.get(
        "economics",
        {},
    )

    performance = network.get(
        "performance",
        {},
    )

    epoch = network.get(
        "epoch",
        {},
    )

    validator_counts = validators.get(
        "counts",
        {},
    )

    validator_stake = validators.get(
        "stake",
        {},
    )

    market = economics.get(
        "market",
        {},
    )

    defi = economics.get(
        "defi",
        {},
    )

    stablecoins = economics.get(
        "stablecoins",
        {},
    )

    dex = economics.get(
        "dex",
        {},
    )

    fees = economics.get(
        "fees",
        {},
    )

    revenue = economics.get(
        "revenue",
        {},
    )

    # ========================================================
    # NETWORK
    # ========================================================

    print()
    print("Network")
    print("-------")

    slot = network.get(
        "slot"
    )

    if slot is not None:
        print(
            f"Slot: {slot:,}"
        )

    block_height = network.get(
        "block_height"
    )

    if block_height is not None:
        print(
            f"Block height: "
            f"{block_height:,}"
        )

    epoch_number = epoch.get(
        "epoch"
    )

    if epoch_number is not None:
        print(
            f"Epoch: {epoch_number}"
        )

    epoch_progress = epoch.get(
        "progress_percent"
    )

    if epoch_progress is not None:
        print(
            f"Epoch progress: "
            f"{epoch_progress:.2f}%"
        )

    tps = performance.get(
        "tps"
    )

    if tps is not None:
        print(
            f"TPS: {tps:,.2f}"
        )

    non_vote_tps = performance.get(
        "non_vote_tps"
    )

    if non_vote_tps is not None:
        print(
            f"Non-vote TPS: "
            f"{non_vote_tps:,.2f}"
        )

    slot_time = performance.get(
        "slot_time_ms"
    )

    if slot_time is not None:
        print(
            f"Slot time: "
            f"{slot_time:,.2f} ms"
        )

    # ========================================================
    # VALIDATORS
    # ========================================================

    print()
    print("Validators")
    print("----------")

    active = validator_counts.get(
        "active"
    )

    delinquent = validator_counts.get(
        "delinquent"
    )

    if active is not None:
        print(
            f"Active: {active:,}"
        )

    if delinquent is not None:
        print(
            f"Delinquent: "
            f"{delinquent:,}"
        )

    delinquent_stake = validator_stake.get(
        "delinquent_percent"
    )

    if delinquent_stake is not None:
        print(
            f"Delinquent stake: "
            f"{delinquent_stake:.4f}%"
        )

    # ========================================================
    # ECONOMICS
    # ========================================================

    print()
    print("Economics")
    print("---------")

    sol_price = market.get(
        "price_usd"
    )

    if sol_price is not None:
        print(
            f"SOL: "
            f"${sol_price:,.2f}"
        )

    tvl = defi.get(
        "tvl_usd"
    )

    print(
        f"TVL: "
        f"{format_usd(tvl)}"
    )

    stablecoin_market_cap = (
        stablecoins.get(
            "market_cap_usd"
        )
    )

    print(
        f"Stablecoins: "
        f"{format_usd(stablecoin_market_cap)}"
    )

    dex_volume = dex.get(
        "volume_24h_usd"
    )

    print(
        f"DEX volume (24h): "
        f"{format_usd(dex_volume)}"
    )

    dex_change = dex.get(
        "change_1d_percent"
    )

    if dex_change is not None:
        print(
            f"DEX change (24h): "
            f"{trend_symbol(dex_change)} "
            f"{abs(dex_change):.2f}%"
        )

    app_fees = fees.get(
        "24h_usd"
    )

    print(
        f"App fees (24h): "
        f"{format_usd(app_fees)}"
    )

    app_revenue = revenue.get(
        "24h_usd"
    )

    print(
        f"App revenue (24h): "
        f"{format_usd(app_revenue)}"
    )

    # ========================================================
    # ANOMALIES
    # ========================================================

    anomalies = report.get(
        "anomalies",
        [],
    )

    print()
    print("Anomalies")
    print("---------")

    if not anomalies:
        print(
            "✓ No significant anomalies detected"
        )

    else:
        for anomaly in anomalies:
            severity = (
                anomaly
                .get(
                    "severity",
                    "notice",
                )
                .upper()
            )

            message = anomaly.get(
                "message",
                "Unknown anomaly",
            )

            print(
                f"[{severity}] "
                f"{message}"
            )

    # ========================================================
    # SOURCE HEALTH
    # ========================================================

    economic_sources = economics.get(
        "sources",
        {},
    )

    print()
    print("Data Sources")
    print("------------")

    print(
        "✓ Solana RPC: ok"
    )

    for (
        source_name,
        source_info,
    ) in economic_sources.items():

        status = source_info.get(
            "status"
        )

        icon = (
            "✓"
            if status == "ok"
            else "✗"
        )

        print(
            f"{icon} "
            f"{source_name}: "
            f"{status}"
        )

    # ========================================================
    # HISTORY
    # ========================================================

    history = (
        report
        .get(
            "meta",
            {},
        )
        .get(
            "history",
            {},
        )
    )

    samples = history.get(
        "samples_available",
        0,
    )

    print()

    print(
        f"Historical samples: "
        f"{samples}"
    )


# ============================================================
# MAIN PIPELINE
# ============================================================


def main() -> None:
    """
    Complete Solana State generation pipeline.

    Order:

    1. Collect latest state
    2. Load OLD historical snapshots
    3. Calculate trends
    4. Detect anomalies
    5. Attach history metadata
    6. Save latest.json
    7. Save current historical snapshot
    8. Remove expired raw snapshots
    """

    print()
    print(
        "============================"
    )

    print(
        "       SOLANA STATE"
    )

    print(
        "============================"
    )

    print()

    pipeline_started = (
        perf_counter()
    )

    try:
        # ==================================================
        # 1. COLLECT CURRENT STATE
        # ==================================================

        report = build_report()

        # ==================================================
        # 2. LOAD HISTORY
        # ==================================================

        print()
        print(
            "→ Loading historical data..."
        )

        snapshots = load_snapshots(
            hours=HISTORY_WINDOW_HOURS
        )

        print(
            f"✓ Loaded "
            f"{len(snapshots)} "
            f"historical snapshot(s)"
        )

        # ==================================================
        # 3. CALCULATE TRENDS
        # ==================================================

        print(
            "→ Calculating trends..."
        )

        report[
            "trends"
        ] = calculate_trends(
            report,
            snapshots,
        )

        print(
            "✓ Trends calculated"
        )

        # ==================================================
        # 4. DETECT ANOMALIES
        # ==================================================

        print(
            "→ Detecting anomalies..."
        )

        report[
            "anomalies"
        ] = detect_anomalies(
            report,
            snapshots,
        )

        print(
            f"✓ Detected "
            f"{len(report['anomalies'])} "
            f"anomalies"
        )

        # ==================================================
        # 5. HISTORY METADATA
        # ==================================================

        report[
            "meta"
        ][
            "history"
        ] = {
            "window_hours":
                HISTORY_WINDOW_HOURS,

            "samples_available":
                len(snapshots),

            "oldest_observation": (
                snapshots[
                    0
                ].get(
                    "timestamp"
                )
                if snapshots
                else None
            ),

            "newest_observation": (
                snapshots[
                    -1
                ].get(
                    "timestamp"
                )
                if snapshots
                else None
            ),
        }

        # ==================================================
        # 6. SAVE LATEST REPORT
        # ==================================================

        latest_path = save_report(
            report
        )

        print()

        print(
            f"✓ Latest report saved to "
            f"{latest_path}"
        )

        # ==================================================
        # 7. SAVE CURRENT HISTORICAL SNAPSHOT
        # ==================================================

        snapshot_path = save_snapshot(
            report
        )

        print(
            f"✓ Historical snapshot saved to "
            f"{snapshot_path}"
        )

        # ==================================================
        # 8. CLEAN UP RAW HISTORY
        # ==================================================

        deleted = cleanup_old_snapshots(
            retention_hours=(
                RAW_RETENTION_HOURS
            )
        )

        if deleted > 0:
            print(
                f"✓ Removed "
                f"{deleted} expired "
                f"historical snapshot(s)"
            )

        # ==================================================
        # 9. PRINT CLI SUMMARY
        # ==================================================

        print_summary(
            report
        )

        # ==================================================
        # FINISH
        # ==================================================

        total_duration = (
            perf_counter()
            - pipeline_started
        )

        print()
        print(
            "----------------------------"
        )

        print(
            f"✓ Collection completed "
            f"in {total_duration:.2f}s"
        )

        print(
            "----------------------------"
        )

        print()

    except KeyboardInterrupt:
        print()
        print(
            "Collection cancelled."
        )
        print()

    except Exception as error:
        print()

        print(
            "✗ Solana State "
            "collection failed"
        )

        print(
            f"{type(error).__name__}: "
            f"{error}"
        )

        print()

        # Do not swallow failures.
        # GitHub Actions needs a non-zero exit code.
        raise


if __name__ == "__main__":
    main()