import re
from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from zoneinfo import ZoneInfo


@dataclass
class Event:
    link: str
    title: str
    description: Optional[str]
    country: str
    category: str
    starts_at: Optional[str]  # ISO-8601
    venue: Optional[str]
    city: Optional[str]
    price: Optional[int]
    currency: Optional[str]
    age: Optional[int]
    address: Optional[str]
    longitude: Optional[float]
    latitude: Optional[float]
    img_url: Optional[str]

TBILISI = ZoneInfo("Asia/Tbilisi")

def parse_datetime_loose(date_raw: str, time_raw: str) -> Optional[str]:
    if not date_raw:
        return None

    d = date_raw.strip()
    t = (time_raw or "").strip()

    # 26.01.2026 + 18:00
    if t:
        s = f"{d} {t}"
        m = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})", s)
        if m:
            dd, mm, yyyy, hh, mi = map(int, m.groups())
            dt = datetime(yyyy, mm, dd, hh, mi, tzinfo=TBILISI)
            return dt.isoformat()  # -> 2026-01-26T18:00:00+04:00
    else:
        # только дата (в 00:00)
        m = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", d)
        if m:
            dd, mm, yyyy = map(int, m.groups())
            dt = datetime(yyyy, mm, dd, tzinfo=TBILISI)
            return dt.isoformat()  # -> 2026-01-26T00:00:00+04:00

    # fallback: если сайт уже ISO
    try:
        dt = datetime.fromisoformat(d)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=TBILISI)
        return dt.isoformat()
    except Exception:
        return None
