"""
Availability poller — wraps camply to check Recreation.gov and ReserveCalifornia.
Called by main.py for each active alert that is due for a check.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


def check_alert(alert: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Poll for available sites matching the alert criteria.
    Returns a list of hit dicts (empty list = no availability).
    """
    arrive = date.fromisoformat(alert["arrive_date"])
    depart = date.fromisoformat(alert["depart_date"])
    nights = (depart - arrive).days
    rec_area_id = alert.get("campgrounds", {}).get("rec_area_id")

    if not rec_area_id:
        logger.warning("Alert %s has no rec_area_id — skipping", alert["id"])
        return []

    try:
        from camply.containers import SearchWindow
        from camply.search import SearchRecreationDotGov

        search_window = SearchWindow(start_date=arrive, end_date=depart)
        searcher = SearchRecreationDotGov(
            search_window=search_window,
            campgrounds=[rec_area_id],
            nights=nights,
        )
        available = searcher.get_all_campsites()
    except Exception as exc:
        logger.error("camply error for alert %s: %s", alert["id"], exc)
        return []

    # Case-insensitive exact match on site name (e.g. "A03", "B46")
    allowed_site_names = {str(s).upper() for s in (alert.get("site_ids") or [])}

    hits = []
    for site in available:
        # Filter by specific site names if the alert is in "specific" mode
        if alert["site_mode"] == "specific" and allowed_site_names:
            if site.campsite_site_name.upper() not in allowed_site_names:
                continue

        hits.append({
            "site_id": site.campsite_id,
            "site_name": site.campsite_site_name,
            "arrive_date": site.booking_date.date().isoformat(),
            "depart_date": site.booking_end_date.date().isoformat(),
            "booking_url": site.booking_url,
        })

    return hits



def is_alert_due(alert: dict[str, Any]) -> bool:
    """Returns True if the alert's poll_interval has elapsed since last check."""
    last_checked = alert.get("last_checked_at")
    if not last_checked:
        return True
    elapsed = (datetime.now(timezone.utc) - datetime.fromisoformat(last_checked.replace("Z", "+00:00"))).total_seconds()
    return elapsed >= alert["poll_interval"]
