from __future__ import annotations

from statistics import median
from typing import Any

from collector.rpc import SolanaRPC


LAMPORTS_PER_SOL = 1_000_000_000


def lamports_to_sol(
    lamports: int | float,
) -> float:
    return lamports / LAMPORTS_PER_SOL


def calculate_stake_concentration(
    validators: list[dict[str, Any]],
    total_stake: int,
) -> dict[str, float]:
    """
    Calculate the percentage of active stake controlled
    by the largest validator groups.
    """

    if total_stake <= 0:
        return {
            "top_10_percent": 0.0,
            "top_25_percent": 0.0,
            "top_50_percent": 0.0,
        }

    stakes = sorted(
        (
            validator.get(
                "activatedStake",
                0,
            )
            for validator in validators
        ),
        reverse=True,
    )

    def concentration(count: int) -> float:
        group_stake = sum(
            stakes[:count]
        )

        return round(
            (
                group_stake
                / total_stake
            )
            * 100,
            2,
        )

    return {
        "top_10_percent": concentration(10),
        "top_25_percent": concentration(25),
        "top_50_percent": concentration(50),
    }


def calculate_commissions(
    validators: list[dict[str, Any]],
) -> dict[str, float | int | None]:
    commissions = [
        validator.get("commission")
        for validator in validators
        if validator.get("commission") is not None
    ]

    if not commissions:
        return {
            "average_percent": None,
            "median_percent": None,
            "minimum_percent": None,
            "maximum_percent": None,
        }

    average = (
        sum(commissions)
        / len(commissions)
    )

    return {
        "average_percent": round(
            average,
            2,
        ),
        "median_percent": round(
            float(median(commissions)),
            2,
        ),
        "minimum_percent": min(
            commissions
        ),
        "maximum_percent": max(
            commissions
        ),
    }


def get_top_validators(
    validators: list[dict[str, Any]],
    limit: int = 10,
) -> list[dict[str, Any]]:
    """
    Return the largest validators by activated stake.
    """

    sorted_validators = sorted(
        validators,
        key=lambda validator: validator.get(
            "activatedStake",
            0,
        ),
        reverse=True,
    )

    return [
        {
            "vote_account": validator.get(
                "votePubkey"
            ),
            "identity": validator.get(
                "nodePubkey"
            ),
            "activated_stake_sol": round(
                lamports_to_sol(
                    validator.get(
                        "activatedStake",
                        0,
                    )
                ),
                2,
            ),
            "commission_percent": (
                validator.get("commission")
            ),
            "last_vote": validator.get(
                "lastVote"
            ),
            "epoch_vote_account": (
                validator.get(
                    "epochVoteAccount"
                )
            ),
        }
        for validator in sorted_validators[:limit]
    ]


def collect_validator_metrics(
    rpc: SolanaRPC,
) -> dict[str, Any]:
    """
    Collect validator health and stake distribution
    information directly from Solana RPC.
    """

    vote_accounts = rpc.get_vote_accounts()

    current = vote_accounts.get(
        "current",
        [],
    )

    delinquent = vote_accounts.get(
        "delinquent",
        [],
    )

    all_validators = (
        current + delinquent
    )

    active_stake_lamports = sum(
        validator.get(
            "activatedStake",
            0,
        )
        for validator in current
    )

    delinquent_stake_lamports = sum(
        validator.get(
            "activatedStake",
            0,
        )
        for validator in delinquent
    )

    total_stake_lamports = (
        active_stake_lamports
        + delinquent_stake_lamports
    )

    delinquent_stake_percent = 0.0

    if total_stake_lamports > 0:
        delinquent_stake_percent = (
            delinquent_stake_lamports
            / total_stake_lamports
        ) * 100

    concentration = (
        calculate_stake_concentration(
            current,
            active_stake_lamports,
        )
    )

    commissions = calculate_commissions(
        current
    )

    return {
        "counts": {
            "active": len(current),
            "delinquent": len(delinquent),
            "total": len(all_validators),
        },

        "stake": {
            "active_sol": round(
                lamports_to_sol(
                    active_stake_lamports
                ),
                2,
            ),
            "delinquent_sol": round(
                lamports_to_sol(
                    delinquent_stake_lamports
                ),
                2,
            ),
            "total_sol": round(
                lamports_to_sol(
                    total_stake_lamports
                ),
                2,
            ),
            "delinquent_percent": round(
                delinquent_stake_percent,
                4,
            ),
        },

        "concentration": concentration,

        "commissions": commissions,

        "top_validators": get_top_validators(
            current,
            limit=10,
        ),

        "source": {
            "name": "Solana JSON-RPC",
            "method": "getVoteAccounts",
            "type": "on_chain",
        },
    }