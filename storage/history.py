from __future__ import annotations

import json
from datetime import (
    datetime,
    timedelta,
    timezone,
)
from pathlib import Path
from typing import Any


HISTORY_DIR = Path(
    "data/history/raw"
)


def extract_snapshot(
    report: dict[str, Any],
) -> dict[str, Any]:
    """
    Extract only trend-worthy numerical metrics.

    latest.json remains rich, while history stays compact.
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

    supply = network.get(
        "supply",
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

    concentration = validators.get(
        "concentration",
        {},
    )

    commissions = validators.get(
        "commissions",
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

    return {
        "timestamp": (
            report
            .get("meta", {})
            .get("generated_at")
        ),

        # ==================================================
        # NETWORK
        # ==================================================

        "network": {
            "slot": network.get(
                "slot"
            ),

            "block_height":
                network.get(
                    "block_height"
                ),

            "epoch":
                epoch.get(
                    "epoch"
                ),

            "epoch_progress_percent":
                epoch.get(
                    "progress_percent"
                ),

            "tps":
                performance.get(
                    "tps"
                ),

            "non_vote_tps":
                performance.get(
                    "non_vote_tps"
                ),

            "vote_tps":
                performance.get(
                    "vote_tps"
                ),

            "slots_per_second":
                performance.get(
                    "slots_per_second"
                ),

            "slot_time_ms":
                performance.get(
                    "slot_time_ms"
                ),

            "total_supply_sol":
                supply.get(
                    "total_sol"
                ),

            "circulating_supply_sol":
                supply.get(
                    "circulating_sol"
                ),
        },

        # ==================================================
        # VALIDATORS
        # ==================================================

        "validators": {
            "active":
                validator_counts.get(
                    "active"
                ),

            "delinquent":
                validator_counts.get(
                    "delinquent"
                ),

            "total":
                validator_counts.get(
                    "total"
                ),

            "active_stake_sol":
                validator_stake.get(
                    "active_sol"
                ),

            "delinquent_stake_sol":
                validator_stake.get(
                    "delinquent_sol"
                ),

            "delinquent_stake_percent":
                validator_stake.get(
                    "delinquent_percent"
                ),

            "top_10_stake_percent":
                concentration.get(
                    "top_10_percent"
                ),

            "top_25_stake_percent":
                concentration.get(
                    "top_25_percent"
                ),

            "top_50_stake_percent":
                concentration.get(
                    "top_50_percent"
                ),

            "average_commission_percent":
                commissions.get(
                    "average_percent"
                ),

            "median_commission_percent":
                commissions.get(
                    "median_percent"
                ),
        },

        # ==================================================
        # ECONOMICS
        # ==================================================

        "economics": {
            "sol_price_usd":
                market.get(
                    "price_usd"
                ),

            "tvl_usd":
                defi.get(
                    "tvl_usd"
                ),

            "stablecoin_market_cap_usd":
                stablecoins.get(
                    "market_cap_usd"
                ),

            "dex_volume_24h_usd":
                dex.get(
                    "volume_24h_usd"
                ),

            "dex_volume_7d_usd":
                dex.get(
                    "volume_7d_usd"
                ),

            "app_fees_24h_usd":
                fees.get(
                    "24h_usd"
                ),

            "app_revenue_24h_usd":
                revenue.get(
                    "24h_usd"
                ),
        },
    }


def save_snapshot(
    report: dict[str, Any],
) -> Path:
    """
    Save one compact raw historical snapshot.
    """

    HISTORY_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    snapshot = extract_snapshot(
        report
    )

    now = datetime.now(
        timezone.utc
    )

    filename = now.strftime(
        "%Y-%m-%dT%H%M%SZ.json"
    )

    path = (
        HISTORY_DIR
        / filename
    )

    with path.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            snapshot,
            file,
            indent=2,
            ensure_ascii=False,
        )

    return path


def parse_timestamp(
    timestamp: str,
) -> datetime:
    """
    Parse ISO timestamps written by generate.py.
    """

    return datetime.fromisoformat(
        timestamp.replace(
            "Z",
            "+00:00",
        )
    )


def load_snapshots(
    hours: int | None = None,
) -> list[dict[str, Any]]:
    """
    Load historical snapshots ordered oldest -> newest.

    If hours is supplied, ignore observations older
    than that historical window.
    """

    if not HISTORY_DIR.exists():
        return []

    snapshots: list[
        dict[str, Any]
    ] = []

    cutoff: datetime | None = None

    if hours is not None:
        cutoff = (
            datetime.now(
                timezone.utc
            )
            - timedelta(
                hours=hours
            )
        )

    for path in sorted(
        HISTORY_DIR.glob(
            "*.json"
        )
    ):
        try:
            with path.open(
                "r",
                encoding="utf-8",
            ) as file:
                snapshot = json.load(
                    file
                )

            timestamp = snapshot.get(
                "timestamp"
            )

            if cutoff and timestamp:
                try:
                    observed_at = (
                        parse_timestamp(
                            timestamp
                        )
                    )

                    if observed_at < cutoff:
                        continue

                except ValueError:
                    continue

            snapshots.append(
                snapshot
            )

        except (
            json.JSONDecodeError,
            OSError,
        ):
            continue

    return snapshots


def cleanup_old_snapshots(
    retention_hours: int = 48,
) -> int:
    """
    Delete raw snapshots older than retention_hours.

    Returns number of deleted snapshots.
    """

    if not HISTORY_DIR.exists():
        return 0

    cutoff = (
        datetime.now(
            timezone.utc
        )
        - timedelta(
            hours=retention_hours
        )
    )

    deleted = 0

    for path in HISTORY_DIR.glob(
        "*.json"
    ):
        try:
            modified_at = (
                datetime.fromtimestamp(
                    path.stat().st_mtime,
                    tz=timezone.utc,
                )
            )

            if modified_at < cutoff:
                path.unlink()

                deleted += 1

        except OSError:
            continue

    return deleted