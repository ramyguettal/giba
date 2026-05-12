from __future__ import annotations

import json

import redis


class IdempotencyStore:
    def __init__(self, redis_client: redis.Redis, *, ttl_seconds: int = 60 * 60 * 24):
        self.redis = redis_client
        self.ttl = ttl_seconds

    def _key(self, scope: str, key: str) -> str:
        return f"idempotency:{scope}:{key}"

    def get(self, *, scope: str, key: str) -> dict | None:
        val = self.redis.get(self._key(scope, key))
        if not val:
            return None
        try:
            return json.loads(val)
        except Exception:
            return None

    def set(self, *, scope: str, key: str, value: dict) -> None:
        self.redis.setex(self._key(scope, key), self.ttl, json.dumps(value))
