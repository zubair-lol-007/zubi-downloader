#!/bin/bash
# ZUBI DOWNLOADER launcher — proxy workaround ke sath website start karta hai.
cd "$(dirname "$0")"
export NO_PROXY="localhost,127.0.0.1" no_proxy="localhost,127.0.0.1"
if [ ! -x "$PWD/.venv/bin/python" ]; then
  python3 -m venv .venv && .venv/bin/pip install -q -r requirements.txt
fi
echo "⚡ ZUBI DOWNLOADER running at: http://127.0.0.1:7861"
exec "$PWD/.venv/bin/python" app.py
