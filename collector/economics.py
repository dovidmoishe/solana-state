from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


DEFILLAMA_API = "https://api.llama.fi"
DEFILLAMA_COINS_API = "https://coins.llama.fi"
DEFILLAMA_STABLECOINS_API = "https://stablecoins.llama.fi"

USER_AGENT = "solana-state/0.1"


class EconomicsCollectorError(Exception):
    """Raised when an economics data source fails."""


def fetch_json(
    url: str,
    timeout: int = 20,
) -> Any:
    """
    Perform a simple zero-dependency HTTP GET request
    and decode the JSON response.
    """

    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="GET",
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=timeout,
        ) as response:
            raw = response.read().decode(
                "utf-8"
            )

        return json.loads(raw)

    except urllib.error.HTTPError as error:
        raise EconomicsCollectorError(
            f"HTTP {error.code} for {url}"
        ) from error

    except urllib.error.URLError as error:
        raise EconomicsCollectorError(
            f"Request failed for {url}: "
            f"{error.reason}"
        ) from error

    except json.JSONDecodeError as error:
        raise EconomicsCollectorError(
            f"Invalid JSON returned by {url}"
        ) from error


def safe_float(
    value: Any,
) -> float | None:
    """
    Convert a value to float if possible.
    """

    if isinstance(
        value,
        (int, float),
    ):
        return float(value)

    try:
        if value is not None:
            return float(value)

    except (
        TypeError,
        ValueError,
    ):
        pass

    return None


def round_number(
    value: Any,
    digits: int = 2,
) -> float | None:
    """
    Safely convert and round a numeric value.
    """

    number = safe_float(value)

    if number is None:
        return None

    return round(
        number,
        digits,
    )


# ============================================================
# SOL PRICE
# ============================================================


def collect_sol_price() -> dict[str, Any]:
    """
    Fetch SOL/USD price from DeFiLlama's free
    coins pricing endpoint.
    """

    coin_id = "coingecko:solana"

    encoded_coin = urllib.parse.quote(
        coin_id,
        safe=":",
    )

    url = (
        f"{DEFILLAMA_COINS_API}"
        f"/prices/current/"
        f"{encoded_coin}"
    )

    data = fetch_json(url)

    coins = data.get(
        "coins",
        {},
    )

    solana = coins.get(
        coin_id,
        {},
    )

    return {
        "price_usd": round_number(
            solana.get("price"),
            4,
        ),

        "symbol": solana.get(
            "symbol",
            "SOL",
        ),

        "price_timestamp": solana.get(
            "timestamp"
        ),

        "confidence": round_number(
            solana.get("confidence"),
            4,
        ),
    }


# ============================================================
# TVL
# ============================================================


def collect_chain_tvl() -> dict[str, Any]:
    """
    Fetch current Solana DeFi TVL from
    DeFiLlama's chain endpoint.
    """

    url = (
        f"{DEFILLAMA_API}"
        "/v2/chains"
    )

    chains = fetch_json(url)

    if not isinstance(
        chains,
        list,
    ):
        raise EconomicsCollectorError(
            "Unexpected /v2/chains response"
        )

    for chain in chains:
        name = str(
            chain.get(
                "name",
                "",
            )
        ).lower()

        if name == "solana":
            return {
                "tvl_usd": round_number(
                    chain.get("tvl")
                ),
            }

    raise EconomicsCollectorError(
        "Solana not found in "
        "DeFiLlama chains response"
    )


# ============================================================
# STABLECOINS
# ============================================================


def extract_stablecoin_usd(
    item: dict[str, Any],
) -> float | None:
    """
    DeFiLlama stablecoin responses have historically
    exposed circulating values in nested objects.

    Handle multiple shapes defensively.
    """

    candidates = [
        item.get(
            "totalCirculatingUSD"
        ),
        item.get(
            "totalCirculating"
        ),
        item.get(
            "circulatingUSD"
        ),
    ]

    for candidate in candidates:
        if isinstance(
            candidate,
            (int, float),
        ):
            return float(candidate)

        if isinstance(
            candidate,
            dict,
        ):
            pegged_usd = candidate.get(
                "peggedUSD"
            )

            value = safe_float(
                pegged_usd
            )

            if value is not None:
                return value

    return None


def collect_stablecoins() -> dict[str, Any]:
    """
    Fetch the latest total stablecoin supply
    deployed on Solana.
    """

    url = (
        f"{DEFILLAMA_STABLECOINS_API}"
        "/stablecoincharts/Solana"
    )

    data = fetch_json(url)

    if not isinstance(
        data,
        list,
    ):
        raise EconomicsCollectorError(
            "Unexpected stablecoin chart response"
        )

    if not data:
        return {
            "market_cap_usd": None,
            "timestamp": None,
        }

    latest = data[-1]

    market_cap = extract_stablecoin_usd(
        latest
    )

    return {
        "market_cap_usd": (
            round_number(
                market_cap
            )
        ),

        "timestamp": latest.get(
            "date"
        ),
    }


# ============================================================
# DEX VOLUME
# ============================================================


def collect_dex_volume() -> dict[str, Any]:
    """
    Fetch aggregate Solana DEX volume.
    """

    url = (
        f"{DEFILLAMA_API}"
        "/overview/dexs/Solana"
    )

    data = fetch_json(url)

    return {
        "volume_24h_usd": round_number(
            data.get("total24h")
        ),

        "volume_previous_24h_usd":
            round_number(
                data.get(
                    "total48hto24h"
                )
            ),

        "volume_7d_usd": round_number(
            data.get("total7d")
        ),

        "volume_30d_usd": round_number(
            data.get("total30d")
        ),

        "change_1d_percent":
            round_number(
                data.get("change_1d")
            ),

        "change_7d_percent":
            round_number(
                data.get("change_7d")
            ),

        "change_1m_percent":
            round_number(
                data.get("change_1m")
            ),

        "weekly_change_percent":
            round_number(
                data.get(
                    "change_7dover7d"
                )
            ),
    }


# ============================================================
# FEES
# ============================================================


def collect_fee_metric(
    data_type: str,
) -> dict[str, Any]:
    """
    Fetch one DeFiLlama fees/revenue metric.

    Examples:
        dailyFees
        dailyRevenue
    """

    query = urllib.parse.urlencode(
        {
            "dataType": data_type,

            # We only need aggregate values right now.
            "excludeTotalDataChart":
                "true",

            "excludeTotalDataChartBreakdown":
                "true",
        }
    )

    url = (
        f"{DEFILLAMA_API}"
        f"/overview/fees/Solana"
        f"?{query}"
    )

    data = fetch_json(url)

    return {
        "24h_usd": round_number(
            data.get("total24h")
        ),

        "previous_24h_usd":
            round_number(
                data.get(
                    "total48hto24h"
                )
            ),

        "7d_usd": round_number(
            data.get("total7d")
        ),

        "30d_usd": round_number(
            data.get("total30d")
        ),

        "change_1d_percent":
            round_number(
                data.get("change_1d")
            ),

        "change_7d_percent":
            round_number(
                data.get("change_7d")
            ),

        "change_1m_percent":
            round_number(
                data.get("change_1m")
            ),
    }


def collect_fees() -> dict[str, Any]:
    return collect_fee_metric(
        "dailyFees"
    )


def collect_revenue() -> dict[str, Any]:
    return collect_fee_metric(
        "dailyRevenue"
    )


# ============================================================
# MAIN COLLECTOR
# ============================================================


def collect_economic_metrics() -> dict[str, Any]:
    """
    Collect all zero-key Solana economic metrics.

    Each source is isolated so one failing endpoint does not
    destroy the entire Solana State generation process.
    """

    result: dict[str, Any] = {
        "market": {},
        "defi": {},
        "stablecoins": {},
        "dex": {},
        "fees": {},
        "revenue": {},

        "sources": {},
    }

    # --------------------------------------------------------
    # SOL price
    # --------------------------------------------------------

    try:
        result[
            "market"
        ] = collect_sol_price()

        result[
            "sources"
        ][
            "price"
        ] = {
            "provider": "DeFiLlama",
            "status": "ok",
        }

    except Exception as error:
        result[
            "market"
        ] = {
            "price_usd": None,
        }

        result[
            "sources"
        ][
            "price"
        ] = {
            "provider": "DeFiLlama",
            "status": "error",
            "error": str(error),
        }

    # --------------------------------------------------------
    # TVL
    # --------------------------------------------------------

    try:
        result[
            "defi"
        ] = collect_chain_tvl()

        result[
            "sources"
        ][
            "tvl"
        ] = {
            "provider": "DeFiLlama",
            "status": "ok",
        }

    except Exception as error:
        result[
            "defi"
        ] = {
            "tvl_usd": None,
        }

        result[
            "sources"
        ][
            "tvl"
        ] = {
            "provider": "DeFiLlama",
            "status": "error",
            "error": str(error),
        }

    # --------------------------------------------------------
    # Stablecoins
    # --------------------------------------------------------

    try:
        result[
            "stablecoins"
        ] = collect_stablecoins()

        result[
            "sources"
        ][
            "stablecoins"
        ] = {
            "provider": "DeFiLlama",
            "status": "ok",
        }

    except Exception as error:
        result[
            "stablecoins"
        ] = {
            "market_cap_usd": None,
        }

        result[
            "sources"
        ][
            "stablecoins"
        ] = {
            "provider": "DeFiLlama",
            "status": "error",
            "error": str(error),
        }

    # --------------------------------------------------------
    # DEX volume
    # --------------------------------------------------------

    try:
        result[
            "dex"
        ] = collect_dex_volume()

        result[
            "sources"
        ][
            "dex"
        ] = {
            "provider": "DeFiLlama",
            "status": "ok",
        }

    except Exception as error:
        result[
            "dex"
        ] = {
            "volume_24h_usd": None,
        }

        result[
            "sources"
        ][
            "dex"
        ] = {
            "provider": "DeFiLlama",
            "status": "error",
            "error": str(error),
        }

    # --------------------------------------------------------
    # App fees
    # --------------------------------------------------------

    try:
        result[
            "fees"
        ] = collect_fees()

        result[
            "sources"
        ][
            "fees"
        ] = {
            "provider": "DeFiLlama",
            "status": "ok",
        }

    except Exception as error:
        result[
            "fees"
        ] = {
            "24h_usd": None,
        }

        result[
            "sources"
        ][
            "fees"
        ] = {
            "provider": "DeFiLlama",
            "status": "error",
            "error": str(error),
        }

    # --------------------------------------------------------
    # App revenue
    # --------------------------------------------------------

    try:
        result[
            "revenue"
        ] = collect_revenue()

        result[
            "sources"
        ][
            "revenue"
        ] = {
            "provider": "DeFiLlama",
            "status": "ok",
        }

    except Exception as error:
        result[
            "revenue"
        ] = {
            "24h_usd": None,
        }

        result[
            "sources"
        ][
            "revenue"
        ] = {
            "provider": "DeFiLlama",
            "status": "error",
            "error": str(error),
        }

    return result