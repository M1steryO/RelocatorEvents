import asyncio
from typing import List

from redis.asyncio import Redis

from kafka import make_producer
from parser import Event
from parser_funcs.georgia import parse_georgia

LINKS = {
    "Грузия": {
        "yolo.ge": (
            {
                "https://yolo.ge/ru/posters/musical": "music",
                "https://yolo.ge/ru/posters/theater": "theater",
                "https://yolo.ge/ru/posters/festivals": "festivals",
                "https://yolo.ge/ru/posters/gastronomic": "gastronomic",
                "https://yolo.ge/ru/posters/cafe": "cafe",
                "https://yolo.ge/ru/posters/exhibition": "exhibition",
                "https://yolo.ge/ru/posters/kids": "kids",
                "https://yolo.ge/ru/posters/education": "education",
                "https://yolo.ge/ru/posters/nightlife": "nightlife",
                "https://yolo.ge/ru/posters/sports": "sports",
                "https://yolo.ge/ru/posters/movies": "movies",

            },
            parse_georgia,
        )
    }
}


async def main():
    all_events: List[Event] = []
    redis = Redis.from_url("redis://default:redispass@redis:6379/0", decode_responses=True)
    producer = await make_producer("kafka1:29091")
    topic = "events.new"

    for country, resources in LINKS.items():
        for resource, (urls_map, fn) in resources.items():
            for url, category in urls_map.items():
                evs = await fn(page_url=url, country=country, source=resource, category=category, redis=redis,
                               kafka_data=[producer, topic])
                all_events.extend(evs)

    print("Total parsed:", len(all_events))
    if all_events:
        print(all_events[0])

    await redis.aclose()
    await producer.stop()


if __name__ == "__main__":
    asyncio.run(main())
