"""
Availability poller — wraps camply to check Recreation.gov and ReserveCalifornia.
Called by main.py for each active alert that is due for a check.
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any

logger = logging.getLogger(__name__)


def check_alert(alert: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Poll for available sites matching the alert criteria.
    Returns a list of hit dicts (empty list = no availability).
    """
    campground_id = alert["campground_id"]
    arrive = date.fromisoformat(alert["arrive_date"])
    depart = date.fromisoformat(alert["depart_date"])
    nights = (depart - arrive).days
    rec_area_id = alert.get("campground", {}).get("rec_area_id")

    if not rec_area_id:
        logger.warning("Alert %s has no rec_area_id — skipping", alert["id"])
        return []

    try:
        from camply.providers import RecreationDotGov
        from camply.search import SearchRecreationDotGov

        searcher = SearchRecreationDotGov(
            campgrounds=[rec_area_id],
            recreation_area=None,
            start_date=arrive,
            end_date=depart,
            nights=nights,
        )
        available = searcher.get_all_campsites()
    except Exception as exc:
        logger.error("camply error for alert %s: %s", alert["id"], exc)
        return []

    hits = []
    for site in available:
        # Filter by specific site IDs if the alert is in "specific" mode
        if alert["site_mode"] == "specific" and alert.get("site_ids"):
            site_num = _extract_site_number(site.site_name)
            if site_num not in alert["site_ids"]:
                continue

        hits.append({
            "site_id": _extract_site_number(site.site_name),
            "site_name": site.site_name,
            "arrive_date": arrive.isoformat(),
            "depart_date": depart.isoformat(),
            "booking_url": site.booking_url,
        })

    return hits


def _extract_site_number(site_name: str) -> int | None:
    """Extract numeric site number from a name like 'Site 14' or '14'."""
    import re
    m = re.search(r"\d+", site_name or "")
    return int(m.group()) if m else None


def is_alert_due(alert: dict[str, Any]) -> bool:
    """Returns True if the alert's poll_interval has elapsed since last check."""
    last_checked = alert.get("last_checked_at")
    if not last_checked:
        return True
    elapsed = (datetime.utcnow() - datetime.fromisoformat(last_checked.replace("Z", ""))).total_seconds()
    return elapsed >= alert["poll_interval"]
