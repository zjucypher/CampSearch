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

    # Normalise site_ids to strings for comparison regardless of DB storage type
    allowed_site_ids = {str(s) for s in (alert.get("site_ids") or [])}

    hits = []
    for site in available:
        # Filter by specific site IDs if the alert is in "specific" mode
        if alert["site_mode"] == "specific" and allowed_site_ids:
            site_num = _extract_site_number(site.campsite_site_name)
            if str(site_num) not in allowed_site_ids:
                continue

        hits.append({
            "site_id": site.campsite_id,
            "site_name": site.campsite_site_name,
            "arrive_date": site.booking_date.date().isoformat(),
            "depart_date": site.booking_end_date.date().isoformat(),
            "booking_url": site.booking_url,
        })

    return hits


def _extract_site_number(site_name: str) -> int | None:
    """
    Extract the numeric site number from Recreation.gov site names.
    Handles pure numbers ('001', '14'), loop-prefixed names ('A03', 'B46', 'C09'),
    and 'Site N' style names. Returns None for descriptive group-site names like
    'BOAT IN GROUP 1, 15-25 people' where the number is not the site identifier.
    """
    import re
    cleaned = re.sub(r"(?i)^site\s*", "", (site_name or "").strip())
    # Allow up to 3 leading letters (loop prefix, e.g. 'A', 'B', 'GRP') followed by digits.
    # Requires a fullmatch so descriptive names with spaces/extra words return None.
    m = re.fullmatch(r"[A-Za-z]{0,3}\s*0*(\d+)", cleaned)
    return int(m.group(1)) if m else None


def is_alert_due(alert: dict[str, Any]) -> bool:
    """Returns True if the alert's poll_interval has elapsed since last check."""
    last_checked = alert.get("last_checked_at")
    if not last_checked:
        return True
    elapsed = (datetime.now(timezone.utc) - datetime.fromisoformat(last_checked.replace("Z", "+00:00"))).total_seconds()
    return elapsed >= alert["poll_interval"]
