const urlsEl = document.getElementById('urls');
const detectEl = document.getElementById('detect');
const qualityEl = document.getElementById('quality');
const dlBtn = document.getElementById('dlBtn');
const progressCard = document.getElementById('progressCard');
const logEl = document.getElementById('log');
const zipBtn = document.getElementById('zipBtn');

function detectPlatform(u) {
  u = u.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube';
  if (u.includes('tiktok.com')) return 'TikTok';
  if (u.includes('facebook.com') || u.includes('fb.watch') || u.includes('fb.com')) return 'Facebook';
  if (u.includes('xiaohongshu.com') || u.includes('xhslink.com')) return 'RedNote';
  return 'Unknown';
}

function getUrls() {
  return urlsEl.value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 10);
}

urlsEl.addEventListener('input', () => {
  const urls = getUrls();
  if (!urls.length) {
    detectEl.textContent = '— links paste karte hi platform yahan show hogi —';
    return;
  }
  detectEl.innerHTML = urls.map((u, i) => {
    const p = detectPlatform(u);
    const cls = p === 'Unknown' ? 'bad' : 'ok';
    const icon = p === 'Unknown' ? '❌' : '✅';
    return `<span class="${cls}">${i + 1}. ${icon} [${p}] ${u.slice(0, 64)}</span>`;
  }).join('\n');
});

dlBtn.addEventListener('click', async () => {
  const urls = getUrls();
  if (!urls.length) { alert('Pehle koi link paste karo!'); return; }
  dlBtn.disabled = true;
  dlBtn.textContent = '⏳ STARTING…';
  progressCard.classList.remove('hidden');
  zipBtn.classList.add('hidden');
  logEl.textContent = '🚀 Download shuru ho raha hai…\n';

  let jobId;
  try {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls, quality: qualityEl.value })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    jobId = data.job_id;
  } catch (e) {
    logEl.textContent += '❌ Error: ' + e.message;
    dlBtn.disabled = false;
    dlBtn.textContent = '⬇️ DOWNLOAD ALL';
    return;
  }

  dlBtn.textContent = '⏳ DOWNLOADING…';
  const timer = setInterval(async () => {
    try {
      const res = await fetch('/api/status/' + jobId);
      const s = await res.json();
      logEl.textContent = s.log.join('\n');
      logEl.scrollTop = logEl.scrollHeight;
      if (s.done) {
        clearInterval(timer);
        if (s.has_zip) {
          zipBtn.href = '/api/zip/' + jobId;
          zipBtn.classList.remove('hidden');
          logEl.textContent += '\n📦 ZIP tayyar — upar button dabao!';
        }
        dlBtn.disabled = false;
        dlBtn.textContent = '⬇️ DOWNLOAD ALL';
      }
    } catch (e) { /* retry next tick */ }
  }, 2000);
});
