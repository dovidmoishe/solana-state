from __future__ import annotations

from typing import Any


def percentage_change(
    current: float | int | None,
    previous: float | int | None,
) -> float | None:
    """
    Percentage difference from previous -> current.
    """

    if (
        current is None
        or previous is None
    ):
        return None

    if previous == 0:
        return None

    change = (
        (current - previous)
        / abs(previous)
    ) * 100

    return round(
        change,
        2,
    )


def numeric_values(
    snapshots: list[dict[str, Any]],
    section: str,
    metric: str,
) -> list[float]:
    """
    Extract all valid numeric observations for one
    metric from historical snapshots.
    """

    values: list[float] = []

    for snapshot in snapshots:
        value = (
            snapshot
            .get(
                section,
                {},
            )
            .get(metric)
        )

        # bool is technically an int in Python,
        # so explicitly ignore it.
        if (
            isinstance(
                value,
                (int, float),
            )
            and not isinstance(
                value,
                bool,
            )
        ):
            values.append(
                float(value)
            )

    return values


def metric_statistics(
    values: list[float],
) -> dict[str, Any]:
    """
    Basic historical statistics.
    """

    if not values:
        return {
            "average": None,
            "minimum": None,
            "maximum": None,
            "samples": 0,
        }

    average = (
        sum(values)
        / len(values)
    )

    return {
        "average": round(
            average,
            4,
        ),

        "minimum": round(
            min(values),
            4,
        ),

        "maximum": round(
            max(values),
            4,
        ),

        "samples": len(
            values
        ),
    }


def analyze_metric(
    current: float | int | None,
    historical_values: list[float],
) -> dict[str, Any]:
    """
    Compare current metric with its historical data.
    """

    if not historical_values:
        return {
            "current": current,

            "previous": None,

            "change_percent": None,

            "average": None,

            "vs_average_percent": None,

            "minimum": None,

            "maximum": None,

            "samples": 0,
        }

    previous = historical_values[
        -1
    ]

    stats = metric_statistics(
        historical_values
    )

    average = stats[
        "average"
    ]

    return {
        "current": current,

        "previous": previous,

        "change_percent":
            percentage_change(
                current,
                previous,
            ),

        "average": average,

        "vs_average_percent":
            percentage_change(
                current,
                average,
            ),

        "minimum":
            stats["minimum"],

        "maximum":
            stats["maximum"],

        "samples":
            stats["samples"],
    }


def analyze_section(
    current_section: dict[str, Any],
    snapshots: list[dict[str, Any]],
    historical_section: str,
    metrics: list[str],
) -> dict[str, Any]:
    """
    Analyze a collection of metrics stored within
    one historical section.
    """

    result: dict[
        str,
        Any,
    ] = {}

    for metric in metrics:
        current = (
            current_section.get(
                metric
            )
        )

        historical = (
            numeric_values(
                snapshots,
                historical_section,
                metric,
            )
        )

        result[
            metric
        ] = analyze_metric(
            current,
            historical,
        )

    return result


def calculate_trends(
    report: dict[str, Any],
    snapshots: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Calculate historical trends for network,
    validator and economic metrics.
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

    validator_counts = (
        validators.get(
            "counts",
            {},
        )
    )

    validator_stake = (
        validators.get(
            "stake",
            {},
        )
    )

    concentration = (
        validators.get(
            "concentration",
            {},
        )
    )

    # ======================================================
    # NETWORK
    # ======================================================

    network_trends = (
        analyze_section(
            current_section=(
                performance
            ),

            snapshots=snapshots,

            historical_section=(
                "network"
            ),

            metrics=[
                "tps",
                "non_vote_tps",
                "vote_tps",
                "slots_per_second",
                "slot_time_ms",
            ],
        )
    )

    # ======================================================
    # VALIDATORS
    # ======================================================

    validator_count_trends = (
        analyze_section(
            current_section=(
                validator_counts
            ),

            snapshots=snapshots,

            historical_section=(
                "validators"
            ),

            metrics=[
                "active",
                "delinquent",
                "total",
            ],
        )
    )

    validator_stake_trends = (
        analyze_section(
            current_section={
                "delinquent_stake_percent":
                    validator_stake.get(
                        "delinquent_percent"
                    ),
            },

            snapshots=snapshots,

            historical_section=(
                "validators"
            ),

            metrics=[
                "delinquent_stake_percent",
            ],
        )
    )

    concentration_trends = (
        analyze_section(
            current_section={
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
            },

            snapshots=snapshots,

            historical_section=(
                "validators"
            ),

            metrics=[
                "top_10_stake_percent",
                "top_25_stake_percent",
                "top_50_stake_percent",
            ],
        )
    )

    # ======================================================
    # ECONOMICS
    # ======================================================

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

    economic_current = {
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
    }

    economic_trends = (
        analyze_section(
            current_section=(
                economic_current
            ),

            snapshots=snapshots,

            historical_section=(
                "economics"
            ),

            metrics=[
                "sol_price_usd",
                "tvl_usd",
                "stablecoin_market_cap_usd",
                "dex_volume_24h_usd",
                "dex_volume_7d_usd",
                "app_fees_24h_usd",
                "app_revenue_24h_usd",
            ],
        )
    )

    return {
        "network":
            network_trends,

        "validators": {
            "counts":
                validator_count_trends,

            "stake":
                validator_stake_trends,

            "concentration":
                concentration_trends,
        },

        "economics":
            economic_trends,
    }