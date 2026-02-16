import hashlib
import json

from redis.asyncio import Redis


def url_key(url: str) -> str:
    return hashlib.sha1(url.encode("utf-8")).hexdigest()


async def is_new_event(redis: Redis, source: str, url: str) -> bool:
    return not await redis.sismember(f"events:seen:{source}", url)

async def mark_seen(redis: Redis, source: str, url: str) -> None:


    await redis.sadd(f"events:seen:{source}", url)


async def save_event_json(redis: Redis, url: str, event_dict: dict, ttl_days: int = 90) -> None:
    key = f"event:data:{url_key(url)}"
    await redis.set(key, json.dumps(event_dict, ensure_ascii=False), ex=ttl_days * 24 * 3600)
