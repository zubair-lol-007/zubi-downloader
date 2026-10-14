#!/usr/bin/env python3
"""ZUBI DOWNLOADER — website version.
YouTube, TikTok, Facebook, RedNote se bulk videos download karo.

Run:  bash run.sh   ->   http://127.0.0.1:7861
"""
import os, uuid, time, shutil, zipfile, threading
from flask import Flask, render_template, request, jsonify, send_file
import yt_dlp

BASE = os.path.dirname(os.path.abspath(__file__))
DL_DIR = os.path.join(BASE, "downloads")
os.makedirs(DL_DIR, exist_ok=True)
MAX_URLS = 10

app = Flask(__name__)
JOBS = {}

PLATFORM_PATTERNS = [
    (["youtube.com", "youtu.be"], "YouTube"),
    (["tiktok.com"], "TikTok"),
    (["facebook.com", "fb.watch", "fb.com"], "Facebook"),
    (["xiaohongshu.com", "xhslink.com"], "RedNote"),
]

def detect_platform(url: str) -> str:
    u = url.lower()
    for domains, name in PLATFORM_PATTERNS:
        if any(d in u for d in domains):
            return name
    return "Unknown"

QUALITY_MAP = {
    "best": "best",
    "hd": "best[height<=720]/best",
    "sd": "best[height<=480]/best",
}

def run_job(job_id, urls, quality):
    job = JOBS[job_id]
    sdir = os.path.join(DL_DIR, job_id)
    os.makedirs(sdir, exist_ok=True)
    fmt = QUALITY_MAP.get(quality, "best")
    ok = fail = 0
    for i, url in enumerate(urls, 1):
        plat = detect_platform(url)
        if plat == "Unknown":
            job["log"].append(f"[{i}/{len(urls)}] ❌ Unknown platform — skip")
            fail += 1
            continue
        job["log"].append(f"[{i}/{len(urls)}] [{plat}] ⏳ downloading…")
        before = set(os.listdir(sdir))
        opts = {
            "format": fmt,
            "outtmpl": os.path.join(sdir, "%(title).60s [%(id)s].%(ext)s"),
            "merge_output_format": "mp4",
            "quiet": True, "no_warnings": True,
            "noplaylist": True,
            "restrict_filenames": True,
            "nocheckcertificate": True,
            "extractor_args": {"youtube": {"player_client": ["android"]}},
        }
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([url])
            new_files = [f for f in os.listdir(sdir) if f not in before]
            if new_files:
                job["log"].append(f"  ✅ {new_files[0][:70]}")
                ok += 1
            else:
                job["log"].append("  ⚠️ complete lekin file nahi mili")
                fail += 1
        except Exception as e:
            job["log"].append(f"  ❌ Fail: {str(e)[:150]}")
            fail += 1
    job["ok"], job["fail"] = ok, fail
    job["log"].append(f"🏁 Done: {ok} download ✅, {fail} fail ❌")
    files = [os.path.join(sdir, f) for f in os.listdir(sdir)]
    if files:
        zip_path = os.path.join(DL_DIR, f"ZUBI_DOWNLOAD_{job_id}.zip")
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
            for f in files:
                z.write(f, os.path.basename(f))
        job["zip"] = zip_path
        job["log"].append(f"📦 ZIP ready!")
    job["state"] = "done"

def clean_old_sessions(max_age_h=24):
    now = time.time()
    for name in os.listdir(DL_DIR):
        p = os.path.join(DL_DIR, name)
        if os.path.isdir(p) and now - os.path.getmtime(p) > max_age_h * 3600:
            shutil.rmtree(p, ignore_errors=True)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/download", methods=["POST"])
def api_download():
    data = request.get_json(force=True, silent=True) or {}
    raw = data.get("urls", "")
    if isinstance(raw, str):
        raw = raw.splitlines()
    urls = [u.strip() for u in raw if u.strip()][:MAX_URLS]
    if not urls:
        return jsonify({"error": "Pehle koi link paste karo!"}), 400
    quality = data.get("quality", "hd")
    job_id = uuid.uuid4().hex[:8]
    JOBS[job_id] = {"state": "running", "log": [], "ok": 0, "fail": 0,
                    "total": len(urls), "zip": None}
    threading.Thread(target=run_job, args=(job_id, urls, quality), daemon=True).start()
    return jsonify({"job_id": job_id})

@app.route("/api/status/<job_id>")
def api_status(job_id):
    job = JOBS.get(job_id)
    if not job:
        return jsonify({"error": "job not found"}), 404
    return jsonify({
        "state": job["state"], "log": job["log"], "ok": job["ok"],
        "fail": job["fail"], "total": job["total"],
        "done": job["state"] == "done", "has_zip": job["zip"] is not None,
    })

@app.route("/api/zip/<job_id>")
def api_zip(job_id):
    job = JOBS.get(job_id)
    if not job or not job["zip"]:
        return "ZIP not ready", 404
    return send_file(job["zip"], as_attachment=True,
                     download_name=os.path.basename(job["zip"]))

if __name__ == "__main__":
    clean_old_sessions()
    port = int(os.environ.get("PORT", 7861))
    app.run(host="0.0.0.0", port=port)
