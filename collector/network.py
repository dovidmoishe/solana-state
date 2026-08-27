from __future__ import annotations

from typing import Any

from collector.rpc import SolanaRPC


LAMPORTS_PER_SOL = 1_000_000_000


def lamports_to_sol(lamports: int | float) -> float:
    return lamports / LAMPORTS_PER_SOL


def calculate_performance(
    samples: list[dict[str, Any]],
) -> dict[str, float | int | None]:
    """
    Calculate network performance from recent Solana
    performance samples.

    We aggregate all samples instead of trusting a single
    60-second observation. This produces a more stable metric.
    """

    if not samples:
        return {
            "tps": None,
            "non_vote_tps": None,
            "vote_tps": None,
            "slots_per_second": None,
            "slot_time_ms": None,
            "sample_period_seconds": 0,
            "transactions_sampled": 0,
        }

    total_transactions = sum(
        sample.get("numTransactions", 0)
        for sample in samples
    )

    total_non_vote_transactions = sum(
        sample.get("numNonVoteTransactions", 0)
        for sample in samples
    )

    total_slots = sum(
        sample.get("numSlots", 0)
        for sample in samples
    )

    total_seconds = sum(
        sample.get("samplePeriodSecs", 0)
        for sample in samples
    )

    if total_seconds <= 0:
        return {
            "tps": None,
            "non_vote_tps": None,
            "vote_tps": None,
            "slots_per_second": None,
            "slot_time_ms": None,
            "sample_period_seconds": 0,
            "transactions_sampled": total_transactions,
        }

    vote_transactions = (
        total_transactions - total_non_vote_transactions
    )

    tps = total_transactions / total_seconds

    non_vote_tps = (
        total_non_vote_transactions / total_seconds
    )

    vote_tps = vote_transactions / total_seconds

    slots_per_second = total_slots / total_seconds

    slot_time_ms = None

    if slots_per_second > 0:
        slot_time_ms = (
            1 / slots_per_second
        ) * 1000

    return {
        "tps": round(tps, 2),
        "non_vote_tps": round(non_vote_tps, 2),
        "vote_tps": round(vote_tps, 2),
        "slots_per_second": round(
            slots_per_second,
            4,
        ),
        "slot_time_ms": (
            round(slot_time_ms, 2)
            if slot_time_ms is not None
            else None
        ),
        "sample_period_seconds": total_seconds,
        "transactions_sampled": total_transactions,
    }


def calculate_epoch_progress(
    epoch_info: dict[str, Any],
) -> dict[str, Any]:
    slot_index = epoch_info.get("slotIndex", 0)
    slots_in_epoch = epoch_info.get("slotsInEpoch", 0)

    progress = 0.0

    if slots_in_epoch > 0:
        progress = (
            slot_index / slots_in_epoch
        ) * 100

    slots_remaining = max(
        slots_in_epoch - slot_index,
        0,
    )

    return {
        "epoch": epoch_info.get("epoch"),
        "slot_index": slot_index,
        "slots_in_epoch": slots_in_epoch,
        "slots_remaining": slots_remaining,
        "progress_percent": round(
            progress,
            2,
        ),
    }


def collect_network_metrics(
    rpc: SolanaRPC,
) -> dict[str, Any]:
    """
    Collect core Solana network metrics.
    """

    slot = rpc.get_slot()

    block_height = rpc.get_block_height()

    epoch_info = rpc.get_epoch_info()

    performance_samples = (
        rpc.get_recent_performance_samples(
            limit=5,
        )
    )

    supply = rpc.get_supply()

    # getHealth normally returns "ok".
    try:
        health = rpc.get_health()
    except Exception:
        health = "unknown"

    performance = calculate_performance(
        performance_samples
    )

    epoch = calculate_epoch_progress(
        epoch_info
    )

    total_supply = lamports_to_sol(
        supply.get("total", 0)
    )

    circulating_supply = lamports_to_sol(
        supply.get("circulating", 0)
    )

    non_circulating_supply = lamports_to_sol(
        supply.get("nonCirculating", 0)
    )

    return {
        "slot": slot,
        "block_height": block_height,

        "epoch": epoch,

        "performance": performance,

        "transactions": {
            "total_since_genesis": epoch_info.get(
                "transactionCount"
            ),
        },

        "supply": {
            "total_sol": round(
                total_supply,
                2,
            ),
            "circulating_sol": round(
                circulating_supply,
                2,
            ),
            "non_circulating_sol": round(
                non_circulating_supply,
                2,
            ),
        },

        "rpc_health": health,

        "source": {
            "name": "Solana JSON-RPC",
            "type": "on_chain",
        },
    }