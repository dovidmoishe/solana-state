from __future__ import annotations

import json
from http.client import IncompleteRead
import time
import urllib.error
import urllib.request
from typing import Any


DEFAULT_RPC_URL = "https://api.mainnet.solana.com"


class RPCError(Exception):
    """Raised when a Solana RPC request fails."""


class SolanaRPC:
    def __init__(
        self,
        url: str = DEFAULT_RPC_URL,
        timeout: int = 20,
        retries: int = 3,
    ) -> None:
        self.url = url
        self.timeout = timeout
        self.retries = retries
        self._request_id = 0

    def _next_id(self) -> int:
        self._request_id += 1
        return self._request_id

    def call(
        self,
        method: str,
        params: list[Any] | None = None,
    ) -> Any:
        """
        Execute a JSON-RPC request against the Solana RPC endpoint.
        """

        payload = {
            "jsonrpc": "2.0",
            "id": self._next_id(),
            "method": method,
            "params": params or [],
        }

        body = json.dumps(payload).encode("utf-8")

        request = urllib.request.Request(
            self.url,
            data=body,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "solana-state/0.1",
            },
            method="POST",
        )

        last_error: Exception | None = None

        for attempt in range(self.retries):
            try:
                with urllib.request.urlopen(
                    request,
                    timeout=self.timeout,
                ) as response:
                    data = json.loads(response.read().decode("utf-8"))

                if "error" in data:
                    error = data["error"]

                    message = error.get(
                        "message",
                        "Unknown Solana RPC error",
                    )

                    code = error.get("code")

                    raise RPCError(
                        f"{method} failed "
                        f"(code={code}): {message}"
                    )

                if "result" not in data:
                    raise RPCError(
                        f"{method} returned no result"
                    )

                return data["result"]

            except (
                urllib.error.URLError,
                urllib.error.HTTPError,
                IncompleteRead,
                TimeoutError,
                json.JSONDecodeError,
                RPCError,
            ) as error:

                last_error = error

                # Exponential-ish backoff:
                # 1s → 2s → 4s
                if attempt < self.retries - 1:
                    delay = 2 ** attempt
                    time.sleep(delay)

        raise RPCError(
            f"{method} failed after "
            f"{self.retries} attempts: {last_error}"
        )

    # ---------------------------------------------------------
    # Network RPC methods
    # ---------------------------------------------------------

    def get_slot(
        self,
        commitment: str = "finalized",
    ) -> int:
        return self.call(
            "getSlot",
            [
                {
                    "commitment": commitment,
                }
            ],
        )

    def get_block_height(
        self,
        commitment: str = "finalized",
    ) -> int:
        return self.call(
            "getBlockHeight",
            [
                {
                    "commitment": commitment,
                }
            ],
        )

    def get_epoch_info(
        self,
        commitment: str = "finalized",
    ) -> dict[str, Any]:
        return self.call(
            "getEpochInfo",
            [
                {
                    "commitment": commitment,
                }
            ],
        )

    def get_recent_performance_samples(
        self,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """
        Performance samples are roughly 60-second samples.

        Maximum supported by Solana RPC is 720.
        """

        if limit < 1 or limit > 720:
            raise ValueError(
                "Performance sample limit must be between 1 and 720"
            )

        return self.call(
            "getRecentPerformanceSamples",
            [limit],
        )

    def get_supply(
        self,
        commitment: str = "finalized",
    ) -> dict[str, Any]:
        result = self.call(
            "getSupply",
            [
                {
                    "commitment": commitment,
                    "excludeNonCirculatingAccountsList": True,
                }
            ],
        )

        return result["value"]

    def get_health(self) -> str:
        return self.call("getHealth")

    # ---------------------------------------------------------
    # Validator RPC methods
    # ---------------------------------------------------------

    def get_vote_accounts(
        self,
        commitment: str = "finalized",
    ) -> dict[str, Any]:
        return self.call(
            "getVoteAccounts",
            [
                {
                    "commitment": commitment,
                    "keepUnstakedDelinquents": True,
                }
            ],
        )
