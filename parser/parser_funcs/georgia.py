import asyncio
import json
from dataclasses import asdict
from typing import List
from urllib.parse import urljoin

import aiohttp
from aiokafka import AIOKafkaProducer
from playwright.async_api import async_playwright, TimeoutError as PWTimeout
from redis.asyncio import Redis

from geocoder import ReverseGeocoder
from kafka import publish_with_retry
from parser import Event, parse_datetime_loose
from cache import is_new_event, mark_seen, save_event_json


async def parse_georgia(
        page_url: str,
        category: str,
        country: str,
        source: str,
        redis: Redis,
        kafka_data: List[AIOKafkaProducer | str]
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
    seen: set[str] = set()  # дедуп по (url+starts_at)

    producer, topic = kafka_data

    async with aiohttp.ClientSession() as http:
        geocoder = ReverseGeocoder(http, qps=1.0)

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36"
            )
            page = await context.new_page()

            try:
                # открыть листинг
                for attempt in range(1, 4):
                    try:
                        await page.goto(page_url, wait_until="domcontentloaded", timeout=30_000)
                        await page.wait_for_selector(CARD_LINK, timeout=20_000)
                        break
                    except PWTimeout:
                        if attempt == 3:
                            raise
                        await asyncio.sleep(1.0 * attempt)

                link_els = await page.query_selector_all(CARD_LINK)
                hrefs: List[str] = []
                for el in link_els:
                    href = await el.get_attribute("href")
                    if href:
                        hrefs.append(urljoin(page_url, href))

                # по карточкам — отдельные страницы, но аккуратно закрываем
                for event_url in hrefs:
                    if event_url == "https://yolo.ge/ru/poster/zero-compromise-20266979":
                        pass

                    if not await is_new_event(redis, source, event_url):
                        continue
                    detail_page = await context.new_page()
                    try:
                        for attempt in range(1, 4):
                            try:
                                await detail_page.goto(event_url, wait_until="domcontentloaded", timeout=30_000)
                                await detail_page.wait_for_selector(".product", timeout=20_000)
                                break
                            except PWTimeout:
                                if attempt == 3:
                                    raise
                                await asyncio.sleep(1.0 * attempt)

                        title = (await detail_page.inner_text(TITLE)) if await detail_page.query_selector(TITLE) else ""
                        description = (await detail_page.inner_text(DESCRIPTION)) if await detail_page.query_selector(
                            DESCRIPTION) else None
                        venue = (await detail_page.inner_text(VENUE)) if await detail_page.query_selector(
                            VENUE) else None
                        address = (await detail_page.inner_text(ADDRESS)) if await detail_page.query_selector(
                            ADDRESS) else None
                        price = (await detail_page.inner_text(PRICE)) if await detail_page.query_selector(
                            PRICE) else None

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

                        # аккуратно: count может не совпадать
                        # n = min(len(date_els), len(time_els)) if time_els else len(date_els)
                        # if n == 0 and (await detail_page.query_selector(DATE)):
                        #     n = 1  # на случай странной разметки

                        n = min(1, len(date_els))

                        for i in range(n):
                            date_raw = (await date_els[i].inner_text()).strip() if i < len(date_els) else ""
                            time_raw = (await time_els[i].inner_text()).strip() if i < len(time_els) else ""

                            starts_at = parse_datetime_loose(date_raw, time_raw)
                            dedup_key = f"{event_url}|{starts_at or ''}"
                            if dedup_key in seen:
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

                                await mark_seen(redis, source, event_url)
                                await publish_with_retry(producer, topic, asdict(e))

                    finally:
                        await detail_page.close()

            finally:
                await page.close()
                await context.close()
                await browser.close()

    print(f"Processed {len(events)} events from {page_url}")
    return events
