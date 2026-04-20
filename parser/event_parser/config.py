from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Awaitable, Callable, Dict, Tuple

from event_parser.models import Event
from event_parser.scrapers.georgia import parse_georgia


@dataclass(frozen=True, slots=True)
class AppSettings:
    redis_url: str
    kafka_bootstrap: str
    kafka_topic: str
    log_level: str


@dataclass(frozen=True, slots=True)
class ScrapeJob:
    country: str
    source: str
    category: str
    page_url: str


def load_settings() -> AppSettings:
    return AppSettings(
        redis_url=os.environ.get(
            "REDIS_URL", "redis://default:redispass@redis:6379/0"
        ),
        kafka_bootstrap=os.environ.get("KAFKA_BOOTSTRAP", "kafka1:29091"),
        kafka_topic=os.environ.get("KAFKA_TOPIC", "events.new"),
        log_level=os.environ.get("LOG_LEVEL", "INFO"),
    )


ScraperFn = Callable[..., Awaitable[list[Event]]]

SCRAPERS: Dict[str, ScraperFn] = {
    "yolo.ge": parse_georgia,
}

JOBS: Tuple[ScrapeJob, ...] = (
    ScrapeJob("Грузия", "yolo.ge", "music", "https://yolo.ge/ru/posters/musical"),
    ScrapeJob("Грузия", "yolo.ge", "theater", "https://yolo.ge/ru/posters/theater"),
    ScrapeJob("Грузия", "yolo.ge", "festivals", "https://yolo.ge/ru/posters/festivals"),
    ScrapeJob(
        "Грузия", "yolo.ge", "gastronomic", "https://yolo.ge/ru/posters/gastronomic"
    ),
    ScrapeJob("Грузия", "yolo.ge", "cafe", "https://yolo.ge/ru/posters/cafe"),
    ScrapeJob("Грузия", "yolo.ge", "exhibition", "https://yolo.ge/ru/posters/exhibition"),
    ScrapeJob("Грузия", "yolo.ge", "kids", "https://yolo.ge/ru/posters/kids"),
    ScrapeJob("Грузия", "yolo.ge", "education", "https://yolo.ge/ru/posters/education"),
    ScrapeJob("Грузия", "yolo.ge", "nightlife", "https://yolo.ge/ru/posters/nightlife"),
    ScrapeJob("Грузия", "yolo.ge", "sports", "https://yolo.ge/ru/posters/sports"),
    ScrapeJob("Грузия", "yolo.ge", "movies", "https://yolo.ge/ru/posters/movies"),
    ScrapeJob("Грузия", "yolo.ge", "excursions", "https://yolo.ge/ru/impressions/excursions"),
    ScrapeJob("Грузия", "yolo.ge", "sport", "https://yolo.ge/ru/impressions/sport"),
)
