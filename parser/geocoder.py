import asyncio
from typing import Optional, Dict, Tuple

import aiohttp


class ReverseGeocoder:
    """
    Nominatim reverse geocoding:
    - async (aiohttp)
    - кэш по округлённым координатам
    - rate limit (чтобы не улететь в бан)
    """

    def __init__(self, session: aiohttp.ClientSession, qps: float = 1.0):
        self.session = session
        self.cache: Dict[Tuple[float, float], Optional[str]] = {}
        self.lock = asyncio.Lock()
        self.min_interval = 1.0 / max(qps, 0.1)
        self._last_call = 0.0

    async def city_from_latlon(self, lat: Optional[str], lon: Optional[str]) -> Optional[str]:
        if not lat or not lon:
            return None

        try:
            lat_f = float(lat.strip())
            lon_f = float(lon.strip())
        except Exception:
            return None

        # округляем, чтобы кэш работал лучше (и меньше дергать API)
        key = (round(lat_f, 4), round(lon_f, 4))
        if key in self.cache:
            return self.cache[key]

        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "format": "jsonv2",
            "lat": key[0],
            "lon": key[1],
            "addressdetails": 1,
            "accept-language": "ru",
        }
        headers = {
            "User-Agent": "events-parser/1.0 (pda1205@gmail.com)"
        }

        # rate limit + запрос
        async with self.lock:
            now = asyncio.get_event_loop().time()
            wait = self.min_interval - (now - self._last_call)
            if wait > 0:
                await asyncio.sleep(wait)
            self._last_call = asyncio.get_event_loop().time()

        try:
            async with self.session.get(url, params=params, headers=headers,
                                        timeout=aiohttp.ClientTimeout(total=15)) as r:
                r.raise_for_status()
                data = await r.json()
                addr = data.get("address", {})
                city = (
                        addr.get("city")
                        or addr.get("town")
                        or addr.get("village")
                        or addr.get("municipality")
                        or addr.get("county")
                )
                self.cache[key] = city
                return city
        except Exception:
            self.cache[key] = None
            return None
