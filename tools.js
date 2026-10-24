// ─────────── ZUBI TOOL — extra tools (tools.js) ───────────
// Hub: search + categories + scroll
let activeCat='all';
function applyFilters(){
  const q=(document.getElementById('toolSearch').value||'').toLowerCase();
  document.querySelectorAll('#toolGrid .tcard').forEach(c=>{
    const okCat = activeCat==='all' || c.dataset.cat===activeCat;
    const okQ = !q || (c.dataset.name+' '+c.querySelector('.nm').textContent.toLowerCase()).includes(q);
    c.style.display = (okCat && okQ) ? '' : 'none';
  });
}
function filterTools(){ applyFilters(); }
function chipFilter(el,cat){
  activeCat=cat;
  document.querySelectorAll('#chips .chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  applyFilters();
}
function goPanel(id){
  const el=document.getElementById(id);
  if(!el) return;
  el.scrollIntoView({behavior:'smooth',block:'start'});
  el.style.borderColor='#9F5FFB';
  setTimeout(()=>{el.style.borderColor='';},1800);
}

// ── helpers ──
function loadScript(src){
  return new Promise((res,rej)=>{
    if(document.querySelector('script[src="'+src+'"]')){res();return;}
    const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('Script load fail: '+src));
    document.head.appendChild(s);
  });
}
function loadImg(file){
  return new Promise((res,rej)=>{
    const img=new Image();
    img.onload=()=>{URL.revokeObjectURL(img.src);res(img);};
    img.onerror=()=>rej(new Error('Photo khul nahi saki'));
    img.src=URL.createObjectURL(file);
  });
}
function outHtml(id,html){document.getElementById(id).innerHTML=html;}
function dlBlob(blob,name){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=name;
  document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),1500);
}
function fileOf(id){
  const el=document.getElementById(id);
  if(!el.files||!el.files.length){alert('Pehle file select karo!');return null;}
  return el.files[0];
}
function canvasToBlob(c,type,q){
  return new Promise(res=>c.toBlob(b=>res(b),type||'image/png',q));
}
function sharpenCanvas(canvas,amount){
  if(amount<=0) return;
  const ctx=canvas.getContext('2d');
  const w=canvas.width,h=canvas.height;
  const src=ctx.getImageData(0,0,w,h);
  const d=src.data,out=ctx.createImageData(w,h);const o=out.data;
  const k=[0,-1,0,-1,5,-1,0,-1,0];
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const i=(y*w+x)*4;
    for(let ch=0;ch<3;ch++){
      let v=0;
      for(let ky=-1;ky<=1;ky++)for(let kx=-1;kx<=1;kx++){
        v+=d[((y+ky)*w+(x+kx))*4+ch]*k[(ky+1)*3+(kx+1)];
      }
      o[i+ch]=Math.max(0,Math.min(255,d[i+ch]+(v-d[i+ch])*amount));
    }
    o[i+3]=d[i+3];
  }
  ctx.putImageData(out,0,0);
}

// ── IMAGE: Enhancer ──
async function imgEnhance(){
  const f=fileOf('ieFile');if(!f)return;
  const out='out-ie';outHtml(out,'<span class="spin"></span>Enhance ho raha…');
  try{
    const img=await loadImg(f);
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
    const ctx=c.getContext('2d');
    const b=document.getElementById('ieB').value,cv=document.getElementById('ieC').value,s=document.getElementById('ieS').value;
    ctx.filter=`brightness(${b}%) contrast(${cv}%) saturate(${s}%)`;
    ctx.drawImage(img,0,0);
    ctx.filter='none';
    sharpenCanvas(c,parseInt(document.getElementById('ieSh').value)/100*0.8);
    const blob=await canvasToBlob(c,'image/png');
    outHtml(out,'<span class="c-green">✅ Tayyar!</span>');
    document.getElementById(out).appendChild(c);
    const btn=document.createElement('button');btn.className='save-btn';btn.textContent='💾 Enhanced Photo Download Karo';
    btn.onclick=()=>dlBlob(blob,'ZUBI_Enhanced_'+Date.now()+'.png');
    document.getElementById(out).appendChild(btn);
  }catch(e){outHtml(out,'<span class="c-red">❌ '+e.message+'</span>');}
}
// ── IMAGE: Upscaler ──
async function imgUpscale(){
  const f=fileOf('iuFile');if(!f)return;
  const out='out-iu';outHtml(out,'<span class="spin"></span>Upscale ho raha…');
  try{
    const img=await loadImg(f);
    const s=parseInt(document.getElementById('iuScale').value);
    const c=document.createElement('canvas');c.width=img.naturalWidth*s;c.height=img.naturalHeight*s;
    const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(img,0,0,c.width,c.height);
    const blob=await canvasToBlob(c,'image/png');
    outHtml(out,`<span class="c-green">✅ ${img.naturalWidth}x${img.naturalHeight} → ${c.width}x${c.height}</span>`);
    document.getElementById(out).appendChild(c);
    const btn=document.createElement('button');btn.className='save-btn';btn.textContent='💾 Upscaled Photo Download Karo';
    btn.onclick=()=>dlBlob(blob,'ZUBI_Upscaled_'+Date.now()+'.png');
    document.getElementById(out).appendChild(btn);
  }catch(e){outHtml(out,'<span class="c-red">❌ '+e.message+'</span>');}
}
// ── IMAGE: Format changer ──
async function imgFormat(){
  const f=fileOf('ifFile');if(!f)return;
  const out='out-if';outHtml(out,'<span class="spin"></span>Format badal raha…');
  try{
    const img=await loadImg(f);
    const fmt=document.getElementById('ifFmt').value;
    const q=parseInt(document.getElementById('ifQ').value)/100;
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
    const ctx=c.getContext('2d');
    if(fmt==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);}
    ctx.drawImage(img,0,0);
    const ext=fmt.split('/')[1].replace('jpeg','jpg');
    const blob=await canvasToBlob(c,fmt,q);
    outHtml(out,'<span class="c-green">✅ Tayyar!</span>');
    document.getElementById(out).appendChild(c);
    const btn=document.createElement('button');btn.className='save-btn';btn.textContent='💾 Download Karo (.'+ext+')';
    btn.onclick=()=>dlBlob(blob,'ZUBI_Converted_'+Date.now()+'.'+ext);
    document.getElementById(out).appendChild(btn);
  }catch(e){outHtml(out,'<span class="c-red">❌ '+e.message+'</span>');}
}
// ── IMAGES TO PDF ──
async function imgsToPdf(){
  const files=[...document.getElementById('ipFiles').files];
  if(!files.length){alert('Pehle photos select karo!');return;}
  const out='out-ip';outHtml(out,'<span class="spin"></span>PDF ban raha…');
  try{
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF();
    for(let i=0;i<files.length;i++){
      const img=await loadImg(files[i]);
      const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
      c.getContext('2d').drawImage(img,0,0);
      const data=c.toDataURL('image/jpeg',0.92);
      const pw=doc.internal.pageSize.getWidth(),ph=doc.internal.pageSize.getHeight();
      const r=Math.min(pw/img.naturalWidth,ph/img.naturalHeight);
      const w=img.naturalWidth*r,h=img.naturalHeight*r;
      if(i>0)doc.addPage();
      doc.addImage(data,'JPEG',(pw-w)/2,(ph-h)/2,w,h);
    }
    doc.save('ZUBI_Images_'+Date.now()+'.pdf');
    outHtml(out,'<span class="c-green">✅ PDF download ho gaya! ('+files.length+' photos)</span>');
  }catch(e){outHtml(out,'<span class="c-red">❌ '+e.message+'</span>');}
}
// ── IMAGE: Resizer ──
async function imgResize(){
  const f=fileOf('irFile');if(!f)return;
  const out='out-ir';outHtml(out,'<span class="spin"></span>Resize ho raha…');
  try{
    const img=await loadImg(f);
    let w=parseInt(document.getElementById('irW').value),h=parseInt(document.getElementById('irH').value);
    const keep=document.getElementById('irKeep').checked;
    const ratio=img.naturalWidth/img.naturalHeight;
    if(keep){
      if(w&&!h)h=Math.round(w/ratio);
      else if(h&&!w)w=Math.round(h*ratio);
    }
    if(!w||!h){outHtml(out,'<span class="c-red">❌ Width ya height likhna zaroori hai</span>');return;}
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(img,0,0,w,h);
    const blob=await canvasToBlob(c,'image/png');
    outHtml(out,`<span class="c-green">✅ ${img.naturalWidth}x${img.naturalHeight} → ${w}x${h}</span>`);
    document.getElementById(out).appendChild(c);
    const btn=document.createElement('button');btn.className='save-btn';btn.textContent='💾 Resized Photo Download Karo';
    btn.onclick=()=>dlBlob(blob,'ZUBI_Resized_'+Date.now()+'.png');
    document.getElementById(out).appendChild(btn);
  }catch(e){outHtml(out,'<span class="c-red">❌ '+e.message+'</span>');}
}
// ── IMAGE: Background remover (AI, on-device) ──
let bgMod=null;
async function imgBgRemove(){
  const f=fileOf('bgFile');if(!f)return;
  const out='out-bg';outHtml(out,'<span class="spin"></span>AI model load ho raha… (pehli dafa thoda waqt lagega)');
  try{
    if(!bgMod){
      bgMod=await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/dist/index.mjs');
    }
    outHtml(out,'<span class="spin"></span>Background hataya ja raha…');
    const blob=await bgMod.removeBackground(f);
    const url=URL.createObjectURL(blob);
    const img=new Image();img.src=url;
    outHtml(out,'<span class="c-green">✅ Background hat gaya!</span>');
    document.getElementById(out).appendChild(img);
    const btn=document.createElement('button');btn.className='save-btn';btn.textContent='💾 Transparent PNG Download Karo';
    btn.onclick=()=>dlBlob(blob,'ZUBI_NoBG_'+Date.now()+'.png');
    document.getElementById(out).appendChild(btn);
  }catch(e){outHtml(out,'<span class="c-red">❌ Background remover load nahi ho saka — internet check karke dobara try karo. ('+e.message+')</span>');}
}
// ── IMAGE: OCR ──
async function imgOcr(){
  const f=fileOf('ocrFile');if(!f)return;
  const ta=document.getElementById('ocrOut');
  ta.value='⏳ Text nikala ja raha… (pehli dafa language data load hoga)';
  try{
    const lang=document.getElementById('ocrLang').value;
    const worker=await Tesseract.createWorker(lang);
    const {data}=await worker.recognize(f);
    await worker.terminate();
    ta.value=data.text.trim()||'(Koi text nahi mila)';
    log('🔤 OCR complete','c-green');
  }catch(e){ta.value='❌ OCR fail: '+e.message;}
}
// ── IMAGE: Aspect ratio crop ──
async function imgCrop(){
  const f=fileOf('icFile');if(!f)return;
  const out='out-ic';outHtml(out,'<span class="spin"></span>Crop ho raha…');
  try{
    const img=await loadImg(f);
    const target=parseFloat(document.getElementById('icRatio').value);
    const srcR=img.naturalWidth/img.naturalHeight;
    let sw,sh,sx,sy;
    if(srcR>target){sh=img.naturalHeight;sw=sh*target;sx=(img.naturalWidth-sw)/2;sy=0;}
    else{sw=img.naturalWidth;sh=sw/target;sx=0;sy=(img.naturalHeight-sh)/2;}
    const c=document.createElement('canvas');c.width=Math.round(sw);c.height=Math.round(sh);
    c.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,c.width,c.height);
    const blob=await canvasToBlob(c,'image/png');
    outHtml(out,'<span class="c-green">✅ Crop ho gaya!</span>');
    document.getElementById(out).appendChild(c);
    const btn=document.createElement('button');btn.className='save-btn';btn.textContent='💾 Cropped Photo Download Karo';
    btn.onclick=()=>dlBlob(blob,'ZUBI_Cropped_'+Date.now()+'.png');
    document.getElementById(out).appendChild(btn);
  }catch(e){outHtml(out,'<span class="c-red">❌ '+e.message+'</span>');}
}
function copyText(id){
  const el=document.getElementById(id);
  el.select();document.execCommand('copy');
  log('📋 Copy ho gaya','c-green');
}

// ─────────── VIDEO TOOLS (ffmpeg.wasm — sab kuch device par) ───────────
let ff=null, ffLoading=null;
async function ensureFFmpeg(statusEl){
  if(ff) return ff;
  if(ffLoading) return ffLoading;
  ffLoading=(async()=>{
    if(!window.FFmpeg){
      await loadScript('https://unpkg.com/@ffmpeg/ffmpeg@0.11.0/dist/ffmpeg.min.js');
    }
    const {createFFmpeg,fetchFile}=window.FFmpeg;
    const inst=createFFmpeg({log:false,corePath:'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'});
    if(statusEl) statusEl.innerHTML='<span class="spin"></span>Video engine load ho raha… (pehli dafa ~30MB)';
    await inst.load();
    ff={inst,fetchFile};
    return ff;
  })();
  return ffLoading;
}
async function runVideo(inFile,args,outName,outId){
  const outEl=document.getElementById(outId);
  try{
    const {inst,fetchFile}=await ensureFFmpeg(outEl);
    outEl.innerHTML='<span class="spin"></span>Video process ho rahi… (bari video par waqt lagega, page band mat karo)';
    inst.FS('writeFile','in.mp4',await fetchFile(inFile));
    await inst.run(...args);
    const data=inst.FS('readFile',outName);
    const mime=outName.endsWith('.mp3')?'audio/mpeg':'video/mp4';
    const blob=new Blob([data.buffer],{type:mime});
    try{inst.FS('unlink','in.mp4');inst.FS('unlink',outName);}catch(e){}
    outEl.innerHTML='<span class="c-green">✅ Tayyar!</span><br>';
    const btn=document.createElement('button');btn.className='save-btn';btn.textContent='💾 Download Karo';
    btn.onclick=()=>dlBlob(blob,outName.replace('out.','ZUBI_'+Date.now()+'.'));
    outEl.appendChild(btn);
    return blob;
  }catch(e){
    outEl.innerHTML='<span class="c-red">❌ Video process fail: '+e.message+' (dobara try karo, ya chhoti video use karo)</span>';
    throw e;
  }
}
async function vidUpscale(){
  const f=fileOf('vuFile');if(!f)return;
  const [w,h]=document.getElementById('vuRes').value.split(':');
  try{await runVideo(f,['-i','in.mp4','-vf',`scale=${w}:${h}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,unsharp=5:5:0.5:5:5:0.0`,'-c:a','copy','out.mp4'],'out-vu');}catch(e){}
}
async function vidEnhance(){
  const f=fileOf('veFile');if(!f)return;
  const b=document.getElementById('veB').value,c=document.getElementById('veC').value,s=document.getElementById('veS').value,sh=document.getElementById('veSh').value;
  const vf=`eq=brightness=${b}:contrast=${c}:saturation=${s}`+(parseFloat(sh)>0?`,unsharp=5:5:${sh}:5:5:0.0`:'');
  try{await runVideo(f,['-i','in.mp4','-vf',vf,'-c:a','copy','out.mp4'],'out-ve');}catch(e){}
}
async function vidToMp3(){
  const f=fileOf('vmFile');if(!f)return;
  try{await runVideo(f,['-i','in.mp4','-vn','-c:a','libmp3lame','-q:a','2','out.mp3'],'out-vm');}catch(e){}
}
async function vidToReels(){
  const f=fileOf('vrFile');if(!f)return;
  const trim=document.getElementById('vrTrim').checked;
  const vf='split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=40[bg];[b]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2';
  const args=['-i','in.mp4','-filter_complex',vf];
  if(trim)args.push('-t','90');
  args.push('-c:a','copy','out.mp4');
  try{await runVideo(f,args,'out-vr');}catch(e){}
}

// ─────────── TEXT TO SPEECH ───────────
function ttsVoices(){
  const sel=document.getElementById('ttsVoice');
  const vs=speechSynthesis.getVoices();
  if(!vs.length)return;
  sel.innerHTML='';
  vs.forEach((v,i)=>{
    const o=document.createElement('option');o.value=i;o.textContent=v.name+' ('+v.lang+')';
    sel.appendChild(o);
  });
}
if('speechSynthesis' in window){
  ttsVoices();
  speechSynthesis.onvoiceschanged=ttsVoices;
}
function ttsPlay(){
  if(!('speechSynthesis' in window)){alert('Aapka browser Text-to-Speech support nahi karta');return;}
  const t=document.getElementById('ttsText').value.trim();
  if(!t){alert('Pehle text likho!');return;}
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(t);
  const vs=speechSynthesis.getVoices();
  const sel=document.getElementById('ttsVoice').value;
  if(vs[sel])u.voice=vs[sel];
  u.rate=parseFloat(document.getElementById('ttsRate').value);
  speechSynthesis.speak(u);
}
function ttsStop(){ if('speechSynthesis' in window) speechSynthesis.cancel(); }

// ─────────── QR CODE ───────────
function qrGen(){
  const txt=document.getElementById('qrText').value.trim();
  if(!txt){alert('Pehle link ya text likho!');return;}
  const size=parseInt(document.getElementById('qrSize').value);
  const out=document.getElementById('out-qr');
  out.innerHTML='';
  const cv=document.createElement('canvas');
  QRCode.toCanvas(cv,txt,{width:size,margin:2},err=>{
    if(err){out.innerHTML='<span class="c-red">❌ QR ban nahi saka: '+err.message+'</span>';return;}
    out.appendChild(cv);
    const btn=document.createElement('button');btn.className='save-btn';btn.textContent='💾 QR Code Download Karo (PNG)';
    btn.onclick=()=>cv.toBlob(b=>dlBlob(b,'ZUBI_QR_'+Date.now()+'.png'),'image/png');
    out.appendChild(document.createElement('br'));out.appendChild(btn);
  });
}

// ─────────── INTERNET SPEED CHECKER ───────────
async function speedTest(){
  const box=document.getElementById('speedOut');
  box.innerHTML='⏳ Check ho raha…';
  try{
    // ping (3 samples, sab se kam)
    let ping=9999;
    for(let i=0;i<3;i++){
      const t0=performance.now();
      await fetch('https://speed.cloudflare.com/__down?bytes=0&x='+Date.now());
      ping=Math.min(ping,performance.now()-t0);
    }
    // download 10MB
    const t0=performance.now();
    const r=await fetch('https://speed.cloudflare.com/__down?bytes=10000000&x='+Date.now());
    const buf=await r.arrayBuffer();
    const dlSec=(performance.now()-t0)/1000;
    const dlMbps=(buf.byteLength*8/dlSec/1e6).toFixed(1);
    // upload 5MB
    const upData=new Uint8Array(5*1024*1024);
    const t1=performance.now();
    await fetch('https://speed.cloudflare.com/__up',{method:'POST',body:upData});
    const upSec=(performance.now()-t1)/1000;
    const upMbps=(5*1024*1024*8/upSec/1e6).toFixed(1);
    box.innerHTML=`📶 <b>Download:</b> ${dlMbps} Mbps<br>📤 <b>Upload:</b> ${upMbps} Mbps<br>⏱️ <b>Ping:</b> ${Math.round(ping)} ms`;
    log(`🚀 Speed: DL ${dlMbps} / UL ${upMbps} Mbps, ping ${Math.round(ping)}ms`,'c-green');
  }catch(e){
    box.innerHTML='❌ Speed check fail — internet check karke dobara try karo.';
  }
}

// ─────────── WEBSITE TO APP PACK ───────────
async function webAppPack(){
  const url=document.getElementById('waUrl').value.trim();
  if(!url||!url.startsWith('http')){alert('Sahi website link likho (https:// se shuru)!');return;}
  const out='out-wa';outHtml(out,'<span class="spin"></span>App pack ban raha…');
  try{
    let host='My App';
    try{host=new URL(url).hostname.replace('www.','');}catch(e){}
    const manifest={name:host,short_name:host.split('.')[0],start_url:url,display:'standalone',background_color:'#0B0B14',theme_color:'#9F5FFB',icons:[]};
    const sw=`self.addEventListener('fetch',()=>{}); // basic service worker — apni site ki files ke saath host karo`;
    const readme=[
      'ZUBI TOOL — Website To App Pack',
      '',
      'OPTION 1 — Phone par install (PWA, 1 minute):',
      '1. Apni website par manifest.json + sw.js upload karo',
      '2. Site ke <head> mein ye line daalo: <link rel="manifest" href="manifest.json">',
      '3. Phone par site kholo → browser menu → "Add to Home Screen"',
      '   → site app ban kar home screen par aa jayegi!',
      '',
      'OPTION 2 — Asli APK (5 minute):',
      '1. webintoapp.com ya appsgeyser.com kholo',
      '2. Apni website ka link paste karo: '+url,
      '3. App ka naam + icon do → APK download karo',
      '',
      'Note: APK seedha browser mein nahi ban sakta, is liye ye do tareeqe diye hain.',
    ].join('\n');
    const zip=new JSZip();
    zip.file('manifest.json',JSON.stringify(manifest,null,2));
    zip.file('sw.js',sw);
    zip.file('README.txt',readme);
    const blob=await zip.generateAsync({type:'blob'});
    dlBlob(blob,'ZUBI_AppPack_'+Date.now()+'.zip');
    outHtml(out,'<span class="c-green">✅ App pack download ho gaya! README mein dono tareeqe likhe hain.</span>');
  }catch(e){outHtml(out,'<span class="c-red">❌ '+e.message+'</span>');}
}

// ─────────── PDF TOOLS ───────────
if(window.pdfjsLib){
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}
async function pdfTextLines(file){
  const buf=await file.arrayBuffer();
  const doc=await pdfjsLib.getDocument({data:buf}).promise;
  const pages=[];
  for(let p=1;p<=doc.numPages;p++){
    const tc=await doc.getPage(p).then(g=>g.getTextContent());
    const lines={};
    tc.items.forEach(it=>{
      const y=Math.round(it.transform[5]);
      (lines[y]=lines[y]||[]).push(it.str);
    });
    const sorted=Object.keys(lines).sort((a,b)=>b-a).map(y=>lines[y].join(' ').trim()).filter(Boolean);
    pages.push(sorted);
  }
  return pages;
}
// ── PDF Editor ──
let peState=null;
async function pdfEditorLoad(){
  const f=fileOf('peFile');if(!f)return;
  const box=document.getElementById('pePages');
  box.innerHTML='<span class="spin"></span>PDF khul raha…';
  try{
    const bytes=await f.arrayBuffer();
    const doc=await PDFLib.PDFDocument.load(bytes);
    peState={bytes:bytes,pages:Array.from({length:doc.getPageCount()},()=>({rot:0,del:false}))};
    let html=`<div class="hint" style="margin-bottom:6px">${doc.getPageCount()} pages mile — Rotate ya Delete dabao, phir Save karo:</div>`;
    peState.pages.forEach((p,i)=>{
      html+=`<div class="up-row" id="peRow${i}">Page ${i+1} <span id="peRot${i}"></span>
        <button class="mini-btn" onclick="peRotate(${i})">↻ Rotate</button>
        <button class="mini-btn" onclick="peToggleDel(${i})" id="peDel${i}">🗑 Delete</button></div>`;
    });
    box.innerHTML=html;
  }catch(e){box.innerHTML='<span class="c-red">❌ PDF khul nahi saka: '+e.message+'</span>';}
}
function peRotate(i){
  const p=peState.pages[i];p.rot=(p.rot+90)%360;
  document.getElementById('peRot'+i).textContent=p.rot?`(${p.rot}°)`:'';
}
function peToggleDel(i){
  const p=peState.pages[i];p.del=!p.del;
  document.getElementById('peDel'+i).textContent=p.del?'↩ Undo':'🗑 Delete';
  document.getElementById('peRow'+i).style.opacity=p.del?'0.5':'1';
}
async function pdfEditorSave(){
  if(!peState){alert('Pehle PDF kholo!');return;}
  const out='out-pe';outHtml(out,'<span class="spin"></span>Edited PDF ban raha…');
  try{
    const doc=await PDFLib.PDFDocument.load(peState.bytes);
    const pages=doc.getPages();
    const stamp=document.getElementById('peText').value.trim();
    const stampPage=parseInt(document.getElementById('pePage').value);
    if(stamp&&stampPage>=1&&stampPage<=pages.length&&!peState.pages[stampPage-1].del){
      const pg=pages[stampPage-1];
      pg.drawText(stamp,{x:50,y:pg.getHeight()-80,size:20,color:PDFLib.rgb(0.6,0.2,0.9)});
    }
    pages.forEach((pg,i)=>{if(peState.pages[i].rot)pg.setRotation(PDFLib.degrees(peState.pages[i].rot));});
    const delIdx=peState.pages.map((p,i)=>p.del?i:-1).filter(i=>i>=0).sort((a,b)=>b-a);
    delIdx.forEach(i=>doc.removePage(i));
    const bytes=await doc.save();
    dlBlob(new Blob([bytes],{type:'application/pdf'}),'ZUBI_Edited_'+Date.now()+'.pdf');
    outHtml(out,'<span class="c-green">✅ Edited PDF download ho gaya!</span>');
  }catch(e){outHtml(out,'<span class="c-red">❌ '+e.message+'</span>');}
}
// ── PDF To Word (text-based) ──
async function pdfToWord(){
  const f=fileOf('pwFile');if(!f)return;
  const out='out-pw';outHtml(out,'<span class="spin"></span>Word ban raha…');
  try{
    const pages=await pdfTextLines(f);
    const children=[];
    pages.forEach((lines,pi)=>{
      children.push(new docx.Paragraph({text:'Page '+(pi+1),heading:docx.HeadingLevel.HEADING_2}));
      lines.forEach(l=>children.push(new docx.Paragraph(l)));
    });
    const doc=new docx.Document({sections:[{children:children}]});
    const blob=await docx.Packer.toBlob(doc);
    dlBlob(blob,'ZUBI_Converted_'+Date.now()+'.docx');
    outHtml(out,'<span class="c-green">✅ Word file download ho gayi!</span>');
  }catch(e){outHtml(out,'<span class="c-red">❌ '+e.message+'</span>');}
}
// ── Word To PDF (text-based) ──
async function wordToPdf(){
  const f=fileOf('wpFile');if(!f)return;
  const out='out-wp';outHtml(out,'<span class="spin"></span>PDF ban raha…');
  try{
    const buf=await f.arrayBuffer();
    const res=await mammoth.extractRawText({arrayBuffer:buf});
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF();
    const lines=doc.splitTextToSize(res.value,180);
    let y=15;
    lines.forEach(l=>{
      if(y>280){doc.addPage();y=15;}
      doc.text(l,15,y);y+=7;
    });
    doc.save('ZUBI_Converted_'+Date.now()+'.pdf');
    outHtml(out,'<span class="c-green">✅ PDF download ho gaya!</span>');
  }catch(e){outHtml(out,'<span class="c-red">❌ '+e.message+'</span>');}
}
// ── Merge PDF ──
async function pdfMerge(){
  const files=[...document.getElementById('pmFiles').files];
  if(files.length<2){alert('Kam az kam 2 PDFs select karo!');return;}
  const out='out-pm';outHtml(out,'<span class="spin"></span>Merge ho raha…');
  try{
    const merged=await PDFLib.PDFDocument.create();
    for(const f of files){
      const src=await PDFLib.PDFDocument.load(await f.arrayBuffer());
      const pages=await merged.copyPages(src,src.getPageIndices());
      pages.forEach(p=>merged.addPage(p));
    }
    const bytes=await merged.save();
    dlBlob(new Blob([bytes],{type:'application/pdf'}),'ZUBI_Merged_'+Date.now()+'.pdf');
    outHtml(out,'<span class="c-green">✅ Merged PDF download ho gaya! ('+files.length+' files)</span>');
  }catch(e){outHtml(out,'<span class="c-red">❌ '+e.message+'</span>');}
}
// ── Split PDF ──
async function pdfSplit(){
  const f=fileOf('psFile');if(!f)return;
  const out='out-ps';outHtml(out,'<span class="spin"></span>Split ho raha…');
  try{
    const src=await PDFLib.PDFDocument.load(await f.arrayBuffer());
    const total=src.getPageCount();
    const mode=document.getElementById('psMode').value;
    if(mode==='range'){
      const raw=document.getElementById('psRange').value.trim();
      if(!raw){outHtml(out,'<span class="c-red">❌ Pages likho — masalan 1-3,5</span>');return;}
      const sel=new Set();
      raw.split(',').forEach(part=>{
        part=part.trim();
        if(part.includes('-')){
          const [a,b]=part.split('-').map(n=>parseInt(n));
          for(let i=a;i<=b;i++)if(i>=1&&i<=total)sel.add(i-1);
        }else{
          const n=parseInt(part);
          if(n>=1&&n<=total)sel.add(n-1);
        }
      });
      if(!sel.size){outHtml(out,'<span class="c-red">❌ Koi sahi page nahi mila</span>');return;}
      const doc=await PDFLib.PDFDocument.create();
      const pages=await doc.copyPages(src,[...sel].sort((a,b)=>a-b));
      pages.forEach(p=>doc.addPage(p));
      const bytes=await doc.save();
      dlBlob(new Blob([bytes],{type:'application/pdf'}),'ZUBI_Split_'+Date.now()+'.pdf');
      outHtml(out,'<span class="c-green">✅ Split PDF download ho gaya! ('+sel.size+' pages)</span>');
    }else{
      const zip=new JSZip();
      for(let i=0;i<total;i++){
        const doc=await PDFLib.PDFDocument.create();
        const [p]=await doc.copyPages(src,[i]);
        doc.addPage(p);
        const bytes=await doc.save();
        zip.file('page_'+(i+1)+'.pdf',bytes);
      }
      const blob=await zip.generateAsync({type:'blob'});
      dlBlob(blob,'ZUBI_SplitPages_'+Date.now()+'.zip');
      outHtml(out,'<span class="c-green">✅ ZIP download ho gaya! ('+total+' alag pages)</span>');
    }
  }catch(e){outHtml(out,'<span class="c-red">❌ '+e.message+'</span>');}
}
// ── PDF To Excel (text-based) ──
async function pdfToExcel(){
  const f=fileOf('pxFile');if(!f)return;
  const out='out-px';outHtml(out,'<span class="spin"></span>Excel ban raha…');
  try{
    const pages=await pdfTextLines(f);
    const aoa=[];
    pages.forEach((lines,pi)=>{
      aoa.push(['Page '+(pi+1)]);
      lines.forEach(l=>aoa.push([l]));
    });
    const ws=XLSX.utils.aoa_to_sheet(aoa);
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,'Sheet1');
    XLSX.writeFile(wb,'ZUBI_Converted_'+Date.now()+'.xlsx');
    outHtml(out,'<span class="c-green">✅ Excel download ho gaya!</span>');
  }catch(e){outHtml(out,'<span class="c-red">❌ '+e.message+'</span>');}
}
// ── Excel To PDF ──
async function excelToPdf(){
  const f=fileOf('xpFile');if(!f)return;
  const out='out-xp';outHtml(out,'<span class="spin"></span>PDF ban raha…');
  try{
    const buf=await f.arrayBuffer();
    const wb=XLSX.read(buf,{type:'array'});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const aoa=XLSX.utils.sheet_to_json(ws,{header:1});
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF();
    let y=15;
    aoa.forEach(row=>{
      const line=row.map(c=>String(c??'')).join(' | ');
      doc.splitTextToSize(line,180).forEach(l=>{
        if(y>280){doc.addPage();y=15;}
        doc.text(l,15,y);y+=7;
      });
    });
    doc.save('ZUBI_Converted_'+Date.now()+'.pdf');
    outHtml(out,'<span class="c-green">✅ PDF download ho gaya!</span>');
  }catch(e){outHtml(out,'<span class="c-red">❌ '+e.message+'</span>');}
}
