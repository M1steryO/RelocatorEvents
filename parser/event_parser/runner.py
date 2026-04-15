import logging
from time import perf_counter
from typing import List

from redis.asyncio import Redis

from event_parser.config import JOBS, SCRAPERS, AppSettings, load_settings
from event_parser.infra.kafka_bus import make_producer
from event_parser.infra.redis_dedup import cleanup_all_past_seen_events
from event_parser.models import Event


def configure_logging(settings: AppSettings) -> None:
    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


async def main() -> None:
    settings = load_settings()
    configure_logging(settings)

    t_run = perf_counter()
    all_events: List[Event] = []
    redis = Redis.from_url(settings.redis_url, decode_responses=True)
    producer = await make_producer(settings.kafka_bootstrap)
    try:
        t_redis = perf_counter()
        await cleanup_all_past_seen_events(redis)
        logging.info(
            "Redis cleanup (past dedup keys): %.2fs", perf_counter() - t_redis
        )

        topic = settings.kafka_topic

        for job in JOBS:
            scraper = SCRAPERS.get(job.source)
            if scraper is None:
                logging.warning("No scraper for source=%r, skip job %s", job.source, job)
                continue

            t0 = perf_counter()
            try:
                evs = await scraper(
                    page_url=job.page_url,
                    country=job.country,
                    source=job.source,
                    category=job.category,
                    redis=redis,
                    kafka_data=[producer, topic],
                )
            except Exception:
                logging.exception(
                    "Job failed: country=%r source=%r category=%r url=%s",
                    job.country,
                    job.source,
                    job.category,
                    job.page_url,
                )
                continue
            dt = perf_counter() - t0
            all_events.extend(evs)
            rate = len(evs) / dt if dt > 0 else 0.0
            logging.info(
                "Run done: country=%r source=%r category=%r url=%s | "
                "events=%d wall_time=%.2fs (%.2f ev/s)",
                job.country,
                job.source,
                job.category,
                job.page_url,
                len(evs),
                dt,
                rate,
            )

        total_dt = perf_counter() - t_run
        logging.info(
            "Total: events=%d jobs=%d wall_time=%.2fs (%.2f ev/s overall)",
            len(all_events),
            len(JOBS),
            total_dt,
            len(all_events) / total_dt if total_dt > 0 else 0.0,
        )
        if all_events:
            logging.debug("Sample event: %s", all_events[0])
    finally:
        await redis.aclose()
        await producer.stop()
