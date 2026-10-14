# ⚡ ZUBI DOWNLOADER

**Professional Bulk Video Downloader** — YouTube, TikTok, Facebook aur RedNote (Xiaohongshu) se **ek sath 10 tak videos** download karo!

## Chalao

```bash
bash ~/workspace/zubi-downloader/run.sh
```

Phir browser mein `http://127.0.0.1:7861` kholo.

## Kaise use karein

1. **Links paste karo** — har line mein 1 link (platform auto-detect)
2. **Quality chuno** — Best / HD 720p / SD 480p
3. **DOWNLOAD ALL** dabao → sab videos ek ZIP file mein!

## Features

- 🎨 Professional branded interface
- 🔍 Auto platform detection (YouTube, TikTok, Facebook, RedNote)
- 🎞️ Quality selection
- 📦 Ek-click ZIP download
- 🧹 Purani files auto-clean (24 hours)

## 🌐 FREE website hosting (live link)

**Option 1 — Hugging Face Spaces (recommended, 100% free):**
1. **huggingface.co** par free account banao
2. **New Space** → SDK: **Docker** → naam rakho `zubi-downloader` (public)
3. Ye saari files upload karo: `app.py`, `requirements.txt`, `Dockerfile`, `templates/`, `static/`
4. Space khud build hokar live ho jayega: `https://TUMHARA-USERNAME-zubi-downloader.hf.space` 🎉
5. 48 ghante use na ho to so jata hai, kholte hi khud jaag jata hai (~30 sec)

**Option 2 — Render (free):**
1. **render.com** par free account → **New → Web Service** → ye repo/folder connect karo
2. Free plan chuno → Deploy. 15 min idle ke baad sota hai, kholne par ~30-60 sec mein uthta hai.

**⚠️ PythonAnywhere FREE account kaam NAHI karega** — free accounts sirf allowlist wali sites khol sakte hain, aur `youtube.com` / `xiaohongshu.com` us list mein nahi hain (checked 14 Oct 2026), is liye YouTube aur RedNote downloads fail hongi. Paid PythonAnywhere par chalega, lekin free mein upar wale 2 options use karo.

## Note

- Sirf **public** videos download hongi (login/private wali nahi)
- Apne **khud ke videos ya copyright-free content** ke liye use karo — doosron ka content download karke repost karna copyright violation hai
- Free hosting par YouTube kabhi kabhi bot-check lagata hai; TikTok/Facebook/RedNote usually theek chalte hain
