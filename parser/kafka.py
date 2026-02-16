import asyncio
import json
import hashlib
from aiokafka import AIOKafkaProducer

def kafka_key(url: str) -> bytes:
    return hashlib.sha1(url.encode("utf-8")).hexdigest().encode("utf-8")

async def make_producer(bootstrap: str) -> AIOKafkaProducer:
    producer = AIOKafkaProducer(
        bootstrap_servers=bootstrap,
        acks="all",
        linger_ms=50,
        request_timeout_ms=40_000,
        retry_backoff_ms=300,
        enable_idempotence=True,   # можно включать
    )
    await producer.start()
    return producer

async def publish_with_retry(
        producer: AIOKafkaProducer,
        topic: str,
        event: dict,
        attempts: int = 5,
) -> None:
    value = json.dumps(event, ensure_ascii=False).encode("utf-8")
    key = kafka_key(event["link"])

    last_err = None
    for i in range(attempts):
        try:
            await producer.send_and_wait(topic, value=value, key=key)
            return
        except Exception as e:
            last_err = e
            await asyncio.sleep(0.5 * (2 ** i))


    raise last_err