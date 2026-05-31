"""
Lightweight Flask proxy for Recreation.gov API.
Runs in a daemon thread alongside the polling worker so Vercel can reach
Recreation.gov through Railway's non-AWS IP (Vercel's Lambda IP range is blocked).
"""

from __future__ import annotations

import logging
import os

import requests as req
from flask import Flask, jsonify, request

app = Flask(__name__)
logger = logging.getLogger(__name__)

_BASE = "https://www.recreation.gov"
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}
_TIMEOUT = 15


def _authed() -> bool:
    secret = os.environ.get("PROXY_SECRET", "")
    return bool(secret) and request.headers.get("X-Proxy-Secret") == secret


def _proxy(url: str, params: dict) -> tuple:
    if not _authed():
        return jsonify({"error": "Unauthorized"}), 401
    try:
        r = req.get(url, params=params, headers=_HEADERS, timeout=_TIMEOUT)
        r.raise_for_status()
        return jsonify(r.json()), 200
    except req.HTTPError as exc:
        logger.error("Recreation.gov error: %s", exc)
        return jsonify({"error": str(exc)}), 502
    except Exception as exc:
        logger.error("Proxy error: %s", exc)
        return jsonify({"error": "proxy error"}), 502


@app.get("/health")
def health():
    return jsonify({"ok": True}), 200


@app.get("/availability")
def availability():
    facility_id = request.args.get("facility_id", "")
    month = request.args.get("month", "")
    if not facility_id or not month:
        return jsonify({"error": "facility_id and month are required"}), 400
    return _proxy(
        f"{_BASE}/api/camps/availability/campground/{facility_id}/month",
        {"start_date": f"{month}T00:00:00.000Z"},
    )


@app.get("/search")
def search():
    q = request.args.get("q", "")
    if not q:
        return jsonify({"error": "q is required"}), 400
    return _proxy(
        f"{_BASE}/api/search",
        {"q": q, "entity_type": "campground", "exact": "false"},
    )


def start_server() -> None:
    port = int(os.environ.get("PORT", 8080))
    logger.info("Proxy server listening on port %d", port)
    app.run(host="0.0.0.0", port=port, use_reloader=False)
