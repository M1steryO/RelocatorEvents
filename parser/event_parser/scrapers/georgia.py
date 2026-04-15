import asyncio
import logging
import re
from dataclasses import asdict
from time import perf_counter
from typing import List
from urllib.parse import urljoin

import aiohttp
from aiokafka import AIOKafkaProducer
from playwright.async_api import async_playwright
from playwright.async_api import TimeoutError as PWTimeout
from redis.asyncio import Redis

from event_parser.infra.kafka_bus import publish_with_retry
from event_parser.infra.redis_dedup import (
    cleanup_past_seen_events,
    is_new_event,
    mark_seen,
)
from event_parser.models import Event, parse_datetime_loose
from event_parser.services.geocoder import ReverseGeocoder

logger = logging.getLogger(__name__)

LANGUAGE_CODE_MAP = {
    "английский": "en",
    "русский": "ru",
    "грузинский": "ge",
}


async def _extract_service_languages(detail_page) -> list[str] | None:
    items = await detail_page.query_selector_all(".product__icons_short_info_item")
    for item in items:
        marker = await item.query_selector(
            "[aria-label='Язык обслуживания'], [data-bs-original-title='Язык обслуживания']"
        )
        if not marker:
            continue

        raw_text = (await item.inner_text()).strip()
        if not raw_text:
            return None

        cleaned = re.sub(r"\s+", " ", raw_text).strip(" ,")
        if not cleaned:
            return None

        raw_languages = [part.strip() for part in cleaned.split(",") if part.strip()]
        if not raw_languages:
            return None

        codes: list[str] = []
        for raw in raw_languages:
            code = LANGUAGE_CODE_MAP.get(raw.casefold())
            if code and code not in codes:
                codes.append(code)
        return codes or None
    return None


async def parse_georgia(
        page_url: str,
        category: str,
        country: str,
        source: str,
        redis: Redis,
        kafka_data: List[AIOKafkaProducer | str],
) -> List[Event]:
    CARD_LINK = ".products-actions__item_title_wrap a"

    TITLE = ".product__title"
    IMG_LINK = ".swiper-slide-fully-visible.swiper-slide-active img"
    DESCRIPTION = ".product__text_block_description"
    DATE = ".product__data-selection_date"
    TIME = ".product__data-selection_time"
    ADDRESS = ".product__contacts_info_location a"
    VENUE = ".product__contacts_info_title"
    MAP = ".product__contacts_map.map"
    PRICE = ".product__data-selection_price"

    events: List[Event] = []
    seen: set[str] = set()
    skipped_seen: int = 0
    skipped_redis: int = 0
    skipped_no_title: int = 0
    detail_pages: int = 0

    producer, topic = kafka_data

    t0 = perf_counter()
    await cleanup_past_seen_events(redis, source)
    t_after_cleanup = perf_counter()
    hrefs: List[str] = []
    t_after_listing = t_after_cleanup

    async with aiohttp.ClientSession() as http:
        geocoder = ReverseGeocoder(http, qps=1.0)

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36"
            )
            page = await context.new_page()

            try:
                for attempt in range(1, 4):
                    try:
                        await page.goto(
                            page_url, wait_until="domcontentloaded", timeout=30_000
                        )
                        await page.wait_for_selector(
                            CARD_LINK, timeout=20_000, state="attached"
                        )
                        break
                    except PWTimeout:
                        if attempt == 3:
                            logger.warning(
                                "Listing selector timeout for %s after %d attempts; skip source page",
                                page_url,
                                attempt,
                            )
                            return []
                        await asyncio.sleep(1.0 * attempt)

                link_els = await page.query_selector_all(CARD_LINK)
                for el in link_els:
                    href = await el.get_attribute("href")
                    if href:
                        hrefs.append(urljoin(page_url, href))

                t_after_listing = perf_counter()

                for event_url in hrefs:
                    detail_pages += 1
                    detail_page = await context.new_page()
                    try:
                        for attempt in range(1, 4):
                            try:
                                await detail_page.goto(
                                    event_url, wait_until="domcontentloaded", timeout=30_000
                                )
                                await detail_page.wait_for_selector(
                                    ".product", timeout=20_000
                                )
                                break
                            except PWTimeout:
                                if attempt == 3:
                                    raise
                                await asyncio.sleep(1.0 * attempt)

                        title = (
                            (await detail_page.inner_text(TITLE))
                            if await detail_page.query_selector(TITLE)
                            else ""
                        )
                        description = (
                            (await detail_page.inner_text(DESCRIPTION))
                            if await detail_page.query_selector(DESCRIPTION)
                            else None
                        )
                        venue = (
                            (await detail_page.inner_text(VENUE))
                            if await detail_page.query_selector(VENUE)
                            else None
                        )
                        address = (
                            (await detail_page.inner_text(ADDRESS))
                            if await detail_page.query_selector(ADDRESS)
                            else None
                        )
                        price = (
                            (await detail_page.inner_text(PRICE))
                            if await detail_page.query_selector(PRICE)
                            else None
                        )

                        languages = await _extract_service_languages(detail_page)

                        img_url = None
                        img_el = await detail_page.query_selector(IMG_LINK)
                        if img_el:
                            img_url = await img_el.get_attribute("src")

                        longitude = None
                        latitude = None
                        map_el = await detail_page.query_selector(MAP)
                        if map_el:
                            longitude = await map_el.get_attribute("data-longitude")
                            latitude = await map_el.get_attribute("data-latitude")

                        city = await geocoder.city_from_latlon(latitude, longitude)
                        if city == "":
                            city = None

                        date_els = await detail_page.query_selector_all(DATE)
                        time_els = await detail_page.query_selector_all(TIME)

                        n = min(1, len(date_els))

                        for i in range(n):
                            date_raw = (
                                (await date_els[i].inner_text()).strip()
                                if i < len(date_els)
                                else ""
                            )
                            time_raw = (
                                (await time_els[i].inner_text()).strip()
                                if i < len(time_els)
                                else ""
                            )

                            starts_at = parse_datetime_loose(date_raw, time_raw)
                            dedup_key = f"{event_url}|{starts_at or ''}"
                            if dedup_key in seen:
                                skipped_seen += 1
                                continue
                            if not await is_new_event(redis, source, event_url, starts_at):
                                skipped_redis += 1
                                continue
                            seen.add(dedup_key)
                            price_raw = price.split("-")[0].split() if price else None
                            price = float(price_raw[0]) if price_raw else None
                            currency = price_raw[1] if price_raw else None

                            e = Event(
                                link=event_url,
                                title=title.strip(),
                                description=description.strip() if description else None,
                                country=country.strip(),
                                category=category.strip(),
                                languages=languages,
                                starts_at=starts_at,
                                venue=venue.strip() if venue else None,
                                city=city,
                                price=price if price else None,
                                currency="GEL" if currency else None,
                                age=None,
                                address=address.strip() if address else None,
                                longitude=float(longitude) if longitude else None,
                                latitude=float(latitude) if latitude else None,
                                img_url=img_url,
                            )
                            if e.title:
                                events.append(e)

                                await mark_seen(redis, source, event_url, starts_at)
                                await publish_with_retry(producer, topic, asdict(e))
                            else:
                                skipped_no_title += 1

                    finally:
                        await detail_page.close()

            finally:
                await page.close()
                await context.close()
                await browser.close()

    total_s = perf_counter() - t0
    listing_s = t_after_listing - t_after_cleanup
    details_s = perf_counter() - t_after_listing
    logger.info(
        "Georgia %s | category=%r | cards=%d detail_pages=%d new_events=%d "
        "skip_seen=%d skip_redis=%d skip_no_title=%d | "
        "time: cleanup=%.2fs listing=%.2fs details=%.2fs total=%.2fs (%.2f pages/s)",
        page_url,
        category,
        len(hrefs),
        detail_pages,
        len(events),
        skipped_seen,
        skipped_redis,
        skipped_no_title,
        t_after_cleanup - t0,
        listing_s,
        details_s,
        total_s,
        detail_pages / details_s if details_s > 0 else 0.0,
    )
    return events
