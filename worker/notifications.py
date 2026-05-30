"""
Notification dispatch — Resend (email) + Twilio (SMS).
Called after a hit is confirmed and written to alert_history.
"""

from __future__ import annotations

import logging
import os
from typing import Any

logger = logging.getLogger(__name__)


def send_email(alert: dict[str, Any], hit: dict[str, Any], user_email: str, user_name: str) -> bool:
    """Send hit notification email via Resend. Returns True on success."""
    import resend

    resend.api_key = os.environ["RESEND_API_KEY"]
    campground_name = alert.get("campgrounds", {}).get("name", "Your campground")
    subject = f"🏕 Site found — {campground_name} {hit.get('site_name', '')}"

    html = _render_email_html(
        user_name=user_name,
        campground_name=campground_name,
        park=alert.get("campgrounds", {}).get("park", ""),
        site_name=hit.get("site_name", ""),
        arrive=hit["arrive_date"],
        depart=hit["depart_date"],
        booking_url=hit.get("booking_url", "https://www.recreation.gov"),
    )

    try:
        resend.Emails.send({
            "from": "CampSearch <onboarding@resend.dev>",
            "to": [user_email],
            "subject": subject,
            "html": html,
        })
        logger.info("Email sent to %s for alert %s", user_email, alert["id"])
        return True
    except Exception as exc:
        logger.error("Resend error for alert %s: %s", alert["id"], exc)
        return False


def send_sms(alert: dict[str, Any], hit: dict[str, Any], phone: str) -> bool:
    """Send hit notification SMS via Twilio. Returns True on success."""
    import os
    from twilio.rest import Client

    if not (os.environ.get("TWILIO_ACCOUNT_SID") and os.environ.get("TWILIO_AUTH_TOKEN") and os.environ.get("TWILIO_PHONE_NUMBER")):
        logger.info("Twilio not configured — skipping SMS for alert %s", alert["id"])
        return False

    client = Client(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])
    campground_name = alert.get("campgrounds", {}).get("name", "campground")
    booking_url = hit.get("booking_url", "https://www.recreation.gov")
    body = (
        f"🏕 CampSearch: {campground_name} {hit.get('site_name', '')} just opened "
        f"({hit['arrive_date']} – {hit['depart_date']}). "
        f"Book now: {booking_url}"
    )

    try:
        client.messages.create(
            body=body,
            from_=os.environ["TWILIO_PHONE_NUMBER"],
            to=phone,
        )
        logger.info("SMS sent to %s for alert %s", phone, alert["id"])
        return True
    except Exception as exc:
        logger.error("Twilio error for alert %s: %s", alert["id"], exc)
        return False


def _render_email_html(
    user_name: str,
    campground_name: str,
    park: str,
    site_name: str,
    arrive: str,
    depart: str,
    booking_url: str,
) -> str:
    from datetime import date

    arrive_fmt = date.fromisoformat(arrive).strftime("%a %b %-d, %Y")
    depart_fmt = date.fromisoformat(depart).strftime("%a %b %-d, %Y")
    nights = (date.fromisoformat(depart) - date.fromisoformat(arrive)).days

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden">
  <tr><td style="padding:10px 16px;background:#f4f4f0;color:#666;font-size:11px;border-bottom:1px solid #e5e5e5">
    CampSearch &nbsp;·&nbsp; to {user_name}
  </td></tr>
  <tr><td style="padding:32px 36px 24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
      <span style="display:inline-block;width:28px;height:28px;border-radius:6px;background:#2D4A36;color:#FBF6EA;font-size:14px;line-height:28px;text-align:center">🌲</span>
      <strong style="font-size:14px;color:#2D4A36">CampSearch</strong>
    </div>
    <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:500;color:#1a1a1a;margin:0 0 12px;line-height:1.2">
      Site found —<br>{campground_name} {site_name}
    </h1>
    <p style="color:#444;line-height:1.55;margin-bottom:24px;font-size:14px">
      {user_name}, a campsite matching your alert just opened up. It&apos;s available right now on Recreation.gov.
      These don&apos;t last — most go in under 3 minutes.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;font-size:13px;border-collapse:collapse">
      <tbody>
        <tr style="border-top:1px solid #eee;border-bottom:1px solid #eee">
          <td style="padding:10px 0;color:#888;width:130px;font-size:12px">Campground</td>
          <td style="padding:10px 0;color:#1a1a1a;font-weight:500">{campground_name}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:10px 0;color:#888;font-size:12px">Park</td>
          <td style="padding:10px 0;color:#1a1a1a;font-weight:500">{park}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:10px 0;color:#888;font-size:12px">Site</td>
          <td style="padding:10px 0;color:#1a1a1a;font-weight:500">{site_name}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:10px 0;color:#888;font-size:12px">Dates</td>
          <td style="padding:10px 0;color:#1a1a1a;font-weight:500">{arrive_fmt} → {depart_fmt} · {nights} night{"s" if nights != 1 else ""}</td>
        </tr>
      </tbody>
    </table>
    <a href="{booking_url}" style="display:inline-block;padding:14px 22px;background:#2D4A36;color:#FBF6EA;font-weight:600;border-radius:6px;text-decoration:none;margin-bottom:14px;font-size:14px">
      Book now on Recreation.gov →
    </a>
    <p style="font-size:12px;color:#888">
      Tip: have your Recreation.gov login handy. Sites are usually claimed within 2–3 minutes of opening.
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0">
    <p style="font-size:11px;color:#888;line-height:1.6">
      You&apos;re receiving this because a CampSearch alert matched.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>"""
