"""
CampSearch monitoring worker.
Polls Supabase for active alerts, checks availability via camply,
writes hits to alert_history, and fires Resend/Twilio notifications.

Deploy on Railway (see railway.toml). Runs continuously.
"""

from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timezone

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("campsearch.worker")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Minimum global sleep between full poll cycles (seconds)
CYCLE_SLEEP = 10


def get_db() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def fetch_active_alerts(db: Client) -> list[dict]:
    """Fetch monitoring alerts joined with campground data."""
    result = (
        db.table("alerts")
        .select("*, campgrounds(id, name, park, rec_area_id, booking_url)")
        .eq("status", "monitoring")
        .execute()
    )
    return result.data or []


def fetch_user_profile(db: Client, user_id: str) -> dict:
    """Fetch profile row for a user."""
    try:
        result = db.table("profiles").select("*").eq("id", user_id).single().execute()
        return result.data or {}
    except Exception as exc:
        logger.warning("Could not fetch profile for user %s: %s", user_id, exc)
        return {}


def fetch_user_email(db: Client, user_id: str) -> str | None:
    """Look up email from auth.users via service role."""
    try:
        result = db.auth.admin.get_user_by_id(user_id)
        return result.user.email if result.user else None
    except Exception as exc:
        logger.warning("Could not fetch email for user %s: %s", user_id, exc)
        return None


def process_alert(db: Client, alert: dict) -> None:
    from poller import check_alert, is_alert_due
    from notifications import send_email, send_sms

    if not is_alert_due(alert):
        return

    alert_id = alert["id"]
    user_id = alert["user_id"]
    profile = fetch_user_profile(db, user_id)
    if not profile:
        logger.warning("Skipping alert %s — could not fetch user profile, will retry next cycle", alert_id)
        return
    campground = alert.get("campgrounds") or {}

    logger.info("Checking alert %s — %s", alert_id, campground.get("name", "?"))

    # Mark last_checked_at immediately to prevent double-checking
    db.table("alerts").update(
        {"last_checked_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", alert_id).execute()

    # Record check in history
    db.table("alert_history").insert({
        "alert_id": alert_id,
        "user_id": user_id,
        "event_type": "check",
        "detail": {"ts": datetime.now(timezone.utc).isoformat()},
    }).execute()

    hits = check_alert(alert)
    if not hits:
        return

    # Process first hit (avoid notification spam for multiple sites)
    hit = hits[0]
    logger.info("HIT on alert %s: %s", alert_id, hit.get("site_name"))

    # Update alert state
    db.table("alerts").update({
        "status": "found",
        "hits": (alert.get("hits") or 0) + 1,
        "last_hit_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", alert_id).execute()

    # Write notified history row (Realtime subscription fires dashboard toast)
    db.table("alert_history").insert({
        "alert_id": alert_id,
        "user_id": user_id,
        "event_type": "notified",
        "site_id": hit.get("site_id"),
        "site_name": hit.get("site_name"),
        "arrive_date": hit.get("arrive_date"),
        "depart_date": hit.get("depart_date"),
        "detail": {"booking_url": hit.get("booking_url"), "all_hits": len(hits)},
    }).execute()

    # Notifications
    user_email = fetch_user_email(db, user_id)
    user_name = profile.get("full_name") or "Camper"

    if profile.get("notify_email") and user_email:
        send_email(alert, hit, user_email, user_name)

    if profile.get("notify_sms") and profile.get("phone"):
        send_sms(alert, hit, profile["phone"])


def run_cycle(db: Client) -> None:
    alerts = fetch_active_alerts(db)
    if not alerts:
        logger.debug("No active alerts")
        return

    logger.info("Cycle: %d active alerts", len(alerts))
    for alert in alerts:
        try:
            process_alert(db, alert)
        except Exception as exc:
            logger.error("Unhandled error on alert %s: %s", alert.get("id"), exc)


def main() -> None:
    logger.info("CampSearch worker starting")
    db = get_db()

    while True:
        try:
            run_cycle(db)
        except Exception as exc:
            logger.error("Cycle error: %s", exc)
            # Re-connect on connection errors
            try:
                db = get_db()
            except Exception:
                pass

        time.sleep(CYCLE_SLEEP)


if __name__ == "__main__":
    main()
