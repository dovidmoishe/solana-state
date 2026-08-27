from __future__ import annotations

from math import sqrt
from typing import Any


def mean(values: list[float]) -> float | None:
    if not values:
        return None

    return sum(values) / len(values)


def population_stddev(
    values: list[float],
) -> float | None:
    if not values:
        return None

    avg = mean(values)

    if avg is None:
        return None

    variance = sum((value - avg) ** 2 for value in values) / len(values)

    return sqrt(variance)


def z_score(
    current: float | int | None,
    historical: list[float],
) -> float | None:
    if current is None:
        return None

    if len(historical) < 3:
        return None

    avg = mean(historical)
    stddev = population_stddev(historical)

    if avg is None or stddev is None or stddev == 0:
        return None

    return (float(current) - avg) / stddev


def percentage_from_average(
    current: float | int | None,
    historical: list[float],
) -> float | None:
    if current is None or not historical:
        return None

    avg = mean(historical)

    if avg is None or avg == 0:
        return None

    return ((float(current) - avg) / abs(avg)) * 100


def classify_severity(
    z: float | None,
    percent_change: float | None,
) -> str:
    """
    Generic anomaly severity.

    We'll later allow metric-specific thresholds.
    """

    absolute_z = abs(z) if z is not None else 0

    absolute_change = abs(percent_change) if percent_change is not None else 0

    if absolute_z >= 4 or absolute_change >= 50:
        return "critical"

    if absolute_z >= 3 or absolute_change >= 30:
        return "warning"

    if absolute_z >= 2 or absolute_change >= 15:
        return "notice"

    return "normal"


def numeric_values(
    snapshots: list[dict[str, Any]],
    section: str,
    metric: str,
) -> list[float]:
    values: list[float] = []

    for snapshot in snapshots:
        value = snapshot.get(section, {}).get(metric)

        if isinstance(
            value,
            (int, float),
        ) and not isinstance(
            value,
            bool,
        ):
            values.append(float(value))

    return values


def create_anomaly(
    *,
    metric: str,
    label: str,
    current: float | int | None,
    historical: list[float],
    direction: str = "both",
) -> dict[str, Any] | None:
    """
    direction:
        both  -> unusual high or low
        high  -> only large increases are considered bad
        low   -> only large decreases are considered bad
    """

    if current is None:
        return None

    if len(historical) < 3:
        return None

    avg = mean(historical)

    if avg is None:
        return None

    z = z_score(
        current,
        historical,
    )

    percent_change = percentage_from_average(
        current,
        historical,
    )

    if percent_change is None:
        return None

    if direction == "high" and percent_change <= 0:
        return None

    if direction == "low" and percent_change >= 0:
        return None

    severity = classify_severity(
        z,
        percent_change,
    )

    if severity == "normal":
        return None

    movement = "above" if percent_change > 0 else "below"

    return {
        "metric": metric,
        "label": label,
        "severity": severity,
        "current": current,
        "baseline_average": round(
            avg,
            4,
        ),
        "change_from_baseline_percent": round(
            percent_change,
            2,
        ),
        "z_score": (round(z, 2) if z is not None else None),
        "message": (
            f"{label} is {abs(percent_change):.2f}% {movement} its recent baseline."
        ),
    }


def detect_anomalies(
    report: dict[str, Any],
    snapshots: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    anomalies: list[dict[str, Any]] = []

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

    checks = [
        {
            "section": "network",
            "metric": "tps",
            "label": "TPS",
            "current": performance.get("tps"),
            "direction": "low",
        },
        {
            "section": "network",
            "metric": "slot_time_ms",
            "label": "Slot time",
            "current": performance.get("slot_time_ms"),
            "direction": "high",
        },
        {
            "section": "validators",
            "metric": "delinquent",
            "label": "Delinquent validators",
            "current": validator_counts.get("delinquent"),
            "direction": "high",
        },
        {
            "section": "validators",
            "metric": "delinquent_stake_percent",
            "label": "Delinquent stake",
            "current": validator_stake.get("delinquent_percent"),
            "direction": "high",
        },
        {
            "section": "economics",
            "metric": "sol_price_usd",
            "label": "SOL price",
            "current": market.get("price_usd"),
            "direction": "both",
        },
        {
            "section": "economics",
            "metric": "tvl_usd",
            "label": "TVL",
            "current": defi.get("tvl_usd"),
            "direction": "both",
        },
        {
            "section": "economics",
            "metric": "stablecoin_market_cap_usd",
            "label": "Stablecoin market cap",
            "current": stablecoins.get("market_cap_usd"),
            "direction": "both",
        },
        {
            "section": "economics",
            "metric": "dex_volume_24h_usd",
            "label": "DEX volume",
            "current": dex.get("volume_24h_usd"),
            "direction": "both",
        },
        {
            "section": "economics",
            "metric": "app_fees_24h_usd",
            "label": "App fees",
            "current": fees.get("24h_usd"),
            "direction": "both",
        },
        {
            "section": "economics",
            "metric": "app_revenue_24h_usd",
            "label": "App revenue",
            "current": revenue.get("24h_usd"),
            "direction": "both",
        },
    ]

    for check in checks:
        historical = numeric_values(
            snapshots,
            check["section"],
            check["metric"],
        )

        anomaly = create_anomaly(
            metric=check["metric"],
            label=check["label"],
            current=check["current"],
            historical=historical,
            direction=check["direction"],
        )

        if anomaly:
            anomalies.append(anomaly)

    severity_order = {
        "critical": 3,
        "warning": 2,
        "notice": 1,
    }

    anomalies.sort(
        key=lambda item: severity_order.get(
            item["severity"],
            0,
        ),
        reverse=True,
    )

    return anomalies
