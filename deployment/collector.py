#!/usr/bin/env python3
"""Credibility Lab anonymous study collector (Python 3.9+, stdlib only).
Run behind HTTPS reverse proxy. Configure ALLOWED_ORIGIN, ADMIN_TOKEN, DATA_DIR.
"""
import hashlib, hmac, json, os, secrets, sqlite3, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

DATA_DIR = Path(os.environ.get("DATA_DIR", "./private-data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB = DATA_DIR / "responses.sqlite3"
ORIGIN = os.environ.get("ALLOWED_ORIGIN", "").rstrip("/")
TOKEN = os.environ.get("ADMIN_TOKEN", "")
MAX_BYTES = 128 * 1024

def connect():
    db = sqlite3.connect(DB, timeout=10)
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("""CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt TEXT UNIQUE NOT NULL,
        participant TEXT NOT NULL,
        kind TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL
    )""")
    return db

with connect() as db:
    pass

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Do not log request paths containing secrets or participant data.
        return

    def headers_common(self):
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if ORIGIN and self.headers.get("Origin") == ORIGIN:
            self.send_header("Access-Control-Allow-Origin", ORIGIN)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def respond(self, status, data):
        raw = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.headers_common()
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        if self.path != "/submit" or not ORIGIN or self.headers.get("Origin") != ORIGIN:
            return self.respond(403, {"error": "origin not allowed"})
        self.respond(204, {})

    def do_GET(self):
        if urlparse(self.path).path == "/health":
            return self.respond(200, {"ok": True})
        if urlparse(self.path).path == "/admin/export":
            if not TOKEN or not hmac.compare_digest(self.headers.get("Authorization", ""), "Bearer " + TOKEN):
                return self.respond(401, {"error": "unauthorized"})
            with connect() as db:
                rows = db.execute("SELECT receipt,participant,kind,payload,created_at FROM submissions ORDER BY id").fetchall()
            return self.respond(200, {"submissions": [
                {"receipt": r[0], "participant": r[1], "kind": r[2], "data": json.loads(r[3]), "created_at": r[4]}
                for r in rows
            ]})
        self.respond(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/submit":
            return self.respond(404, {"error": "not found"})
        if not ORIGIN or self.headers.get("Origin") != ORIGIN:
            return self.respond(403, {"error": "origin not allowed"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 2 or length > MAX_BYTES:
                return self.respond(413, {"error": "invalid body size"})
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError()
            participant = data.get("participant")
            if not isinstance(participant, str) or not 1 <= len(participant) <= 32 or not all(c.isascii() and (c.isalnum() or c in "_-") for c in participant):
                return self.respond(400, {"error": "invalid participant"})
            if "items" in data and data.get("stage") in ("Pre-test", "Post-test") and data.get("form") in ("A", "B"):
                kind = data["stage"] + "-" + data["form"]
            elif "answers" in data and "questionnaire" in data:
                kind = "questionnaire"
            elif "activity" in data or "training" in data or data.get("recordType") == "training":
                kind = "training"
            else:
                return self.respond(400, {"error": "unknown submission type"})
            payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
            # Repeated identical submissions return the same receipt.
            digest = hashlib.sha256((kind + "\0" + payload).encode()).hexdigest()
            receipt = digest[:32]
            with connect() as db:
                db.execute("INSERT OR IGNORE INTO submissions(receipt,participant,kind,payload,created_at) VALUES(?,?,?,?,?)",
                           (receipt, participant, kind, payload, int(time.time())))
                db.commit()
            return self.respond(200, {"received": True, "receipt": receipt})
        except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
            return self.respond(400, {"error": "invalid JSON"})
        except Exception:
            return self.respond(500, {"error": "server error"})

if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8765"))
    print(f"Credibility Lab collector listening on {host}:{port}")
    ThreadingHTTPServer((host, port), Handler).serve_forever()
