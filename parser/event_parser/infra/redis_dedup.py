import hashlib
import json
import time
from datetime import datetime
from typing import Optional

from redis.asyncio import Redis

_SCORE_UNKNOWN_START = 1e12
_DEDUP_KEY_PREFIX = "events:dedup:"


def url_key(url: str) -> str:
    return hashlib.sha1(url.encode("utf-8")).hexdigest()


def _dedup_member(url: str, starts_at: Optional[str]) -> str:
    return f"{url}\x00{starts_at or ''}"


def _score_for_starts_at(starts_at: Optional[str]) -> float:
    if not starts_at:
        return _SCORE_UNKNOWN_START
    try:
        dt = datetime.fromisoformat(starts_at)
        return dt.timestamp()
    except (TypeError, ValueError):
        return _SCORE_UNKNOWN_START


def _dedup_key(source: str) -> str:
    return f"{_DEDUP_KEY_PREFIX}{source}"


async def is_new_event(
    redis: Redis, source: str, url: str, starts_at: Optional[str] = None
) -> bool:
    member = _dedup_member(url, starts_at)
    return await redis.zscore(_dedup_key(source), member) is None


async def mark_seen(
    redis: Redis, source: str, url: str, starts_at: Optional[str] = None
) -> None:
    member = _dedup_member(url, starts_at)
    score = _score_for_starts_at(starts_at)
    await redis.zadd(_dedup_key(source), {member: score})


async def cleanup_past_seen_events(
    redis: Redis, source: str, grace_seconds: int = 0
) -> None:
    cutoff = time.time() - grace_seconds
    await redis.zremrangebyscore(_dedup_key(source), "-inf", cutoff)


async def cleanup_all_past_seen_events(redis: Redis, grace_seconds: int = 0) -> None:
    cutoff = time.time() - grace_seconds
    cursor: int = 0
    while True:
        cursor, keys = await redis.scan(
            cursor, match=f"{_DEDUP_KEY_PREFIX}*", count=128
        )
        for key in keys:
            await redis.zremrangebyscore(key, "-inf", cutoff)
        if cursor == 0:
            break


async def save_event_json(
    redis: Redis, url: str, event_dict: dict, ttl_days: int = 90
) -> None:
    key = f"event:data:{url_key(url)}"
    await redis.set(
        key, json.dumps(event_dict, ensure_ascii=False), ex=ttl_days * 24 * 3600
    )
