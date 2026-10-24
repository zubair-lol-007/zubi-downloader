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
  document.body.classList.add('tool-open');
  document.querySelectorAll('.card.tool-panel').forEach(c=>c.classList.remove('active'));
  const el=document.getElementById(id);
  if(!el) return;
  el.classList.add('active');
  const nm=document.querySelector(`[onclick="goPanel('${id}')"] .nm`);
  document.getElementById('backbarName').textContent=nm?nm.textContent:'Tool';
  document.getElementById('backbar').classList.add('show');
  document.getElementById('resultBanner').classList.remove('show');
  window.scrollTo({top:0,behavior:'smooth'});
}
function goHome(){
  document.body.classList.remove('tool-open');
  document.querySelectorAll('.card.tool-panel').forEach(c=>c.classList.remove('active'));
  document.getElementById('backbar').classList.remove('show');
  document.getElementById('resultBanner').classList.remove('show');
  window.scrollTo({top:0,behavior:'smooth'});
}
// jab bhi kisi tool ka download button bane → banner dikhao + us tak scroll karo
(function(){
  const obs=new MutationObserver(ms=>{
    for(const m of ms){
      for(const n of m.addedNodes){
        if(n.nodeType!==1) continue;
        const btn=n.classList&&n.classList.contains('save-btn')?n:(n.querySelector?n.querySelector('.save-btn'):null);
        if(btn){
          btn.classList.add('big-dl');
          const b=document.getElementById('resultBanner');
          if(b) b.classList.add('show');
          setTimeout(()=>btn.scrollIntoView({behavior:'smooth',block:'center'}),150);
        }
      }
    }
  });
  document.querySelectorAll('.tool-out').forEach(el=>obs.observe(el,{childList:true,subtree:true}));
})();

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
// koi bhi tool khamoshi se fail na ho — error seedha log me dikhao
window.addEventListener('error', function(e){
  try{ log('⚠️ Error: ' + (e.message || 'unknown error'), 'c-red'); }catch(_){}
});

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
function downscaleBlob(file,maxDim){
  return new Promise((res,rej)=>{
    const img=new Image();
    const url=URL.createObjectURL(file);
    img.onload=()=>{
      const scale=Math.min(1,maxDim/Math.max(img.naturalWidth,img.naturalHeight));
      const w=Math.max(1,Math.round(img.naturalWidth*scale));
      const h=Math.max(1,Math.round(img.naturalHeight*scale));
      const c=document.createElement('canvas');c.width=w;c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url);
      c.toBlob(b=>b?res(b):rej(new Error('photo read fail')),'image/png');
    };
    img.onerror=()=>rej(new Error('photo khul nahi saki'));
    img.src=url;
  });
}
async function imgBgRemove(){
  const f=fileOf('bgFile');if(!f)return;
  const out='out-bg';outHtml(out,'<span class="spin"></span>AI model load ho raha… (pehli dafa ~40MB download hoga, WiFi behtar hai)');
  try{
    if(!bgMod){
      bgMod=await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm');
    }
    outHtml(out,'<span class="spin"></span>Photo chhoti ki ja rahi… (phone par tez chalegi)');
    const small=await downscaleBlob(f,1024);
    outHtml(out,'<span class="spin"></span>Background hataya ja raha…');
    const blob=await Promise.race([
      bgMod.removeBackground(small),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('MODEL_TIMEOUT')),120000))
    ]);
    const url=URL.createObjectURL(blob);
    const img=new Image();img.src=url;
    outHtml(out,'<span class="c-green">✅ Background hat gaya!</span>');
    document.getElementById(out).appendChild(img);
    const btn=document.createElement('button');btn.className='save-btn';btn.textContent='💾 Transparent PNG Download Karo';
    btn.onclick=()=>dlBlob(blob,'ZUBI_NoBG_'+Date.now()+'.png');
    document.getElementById(out).appendChild(btn);
  }catch(e){
    if(e.message==='MODEL_TIMEOUT'){
      outHtml(out,'<span class="c-red">❌ 2 minute me AI model download nahi ho saka — WiFi par dobara try karo, ya chhoti photo use karo.</span>');
    }else{
      outHtml(out,'<span class="c-red">❌ Background remover load nahi ho saka — internet check karke dobara try karo. ('+e.message+')</span>');
    }
  }
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
    await Promise.race([
      inst.load(),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('Video engine load me 2 minute se zyada lag gaya — WiFi par dobara try karo')),120000))
    ]);
    ff={inst,fetchFile};
    return ff;
  })();
  ffLoading.catch(()=>{ffLoading=null;});
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
  const sz=parseInt(document.getElementById('qrSize').value)||256;
  const out='out-qr';
  if(!txt){alert('QR ke liye text ya link likho!');return;}
  if(typeof QRCode==='undefined'){outHtml(out,'<span class="c-red">❌ QR library load nahi hui — internet check karke dobara try karo.</span>');return;}
  try{
    const holder=document.createElement('div');
    new QRCode(holder,{text:txt,width:sz,height:sz,correctLevel:QRCode.CorrectLevel.M});
    const outEl=document.getElementById(out);
    outEl.innerHTML='';
    outEl.appendChild(holder);
    setTimeout(()=>{
      const cv=holder.querySelector('canvas');
      const img=holder.querySelector('img');
      if(cv){
        const btn=document.createElement('button');
        btn.className='save-btn';btn.textContent='⬇️ QR Code Download Karo';
        btn.onclick=()=>cv.toBlob(b=>dlBlob(b,'ZUBI_QR_'+Date.now()+'.png'),'image/png');
        outEl.appendChild(btn);
      }else if(img&&img.src){
        const a=document.createElement('a');
        a.className='save-btn';a.textContent='⬇️ QR Code Download Karo';a.download='ZUBI_QR_'+Date.now()+'.png';a.href=img.src;
        outEl.appendChild(a);
      }else{
        outHtml(out,'<span class="c-red">❌ QR ban nahi saka — dobara try karo.</span>');
      }
    },400);
  }catch(e){outHtml(out,'<span class="c-red">❌ '+e.message+'</span>');}
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

// ─────────── WEBSITE TO APK (Android project ZIP + GitHub Actions signed build) ───────────
function suggestPkg(){
  const u=document.getElementById('apkUrl').value.trim();
  const p=document.getElementById('apkPkg');
  if(!u||p.value.trim())return;
  try{
    const host=new URL(u).hostname.replace(/^www\./,'');
    const parts=host.split('.');
    const base=parts.length>=2?parts[parts.length-2]:parts[0];
    const clean=base.replace(/[^a-z0-9]/gi,'').toLowerCase()||'myapp';
    p.value='com.'+clean+'.app';
  }catch(e){}
}
function apkIconPng(size,img,color,letter){
  return new Promise(res=>{
    const c=document.createElement('canvas');c.width=size;c.height=size;
    const x=c.getContext('2d');
    if(img){
      const s=Math.min(img.naturalWidth,img.naturalHeight);
      const sx=(img.naturalWidth-s)/2,sy=(img.naturalHeight-s)/2;
      x.drawImage(img,sx,sy,s,s,0,0,size,size);
    }else{
      x.fillStyle=color;x.fillRect(0,0,size,size);
      x.fillStyle='#fff';x.font='bold '+Math.round(size*0.55)+'px Arial';x.textAlign='center';x.textBaseline='middle';
      x.fillText(letter, size/2, size/2+size*0.03);
    }
    c.toBlob(b=>res(b),'image/png');
  });
}
async function buildApkProject(){
  const url=document.getElementById('apkUrl').value.trim();
  const name=document.getElementById('apkName').value.trim();
  let pkg=document.getElementById('apkPkg').value.trim();
  const ver=document.getElementById('apkVer').value.trim()||'1.0';
  const color=document.getElementById('apkColor').value;
  const orient=document.getElementById('apkOrient').value;
  const full=document.getElementById('apkFull').checked;
  const out='out-apk';
  if(!url||!url.startsWith('http')){alert('Sahi website link likho (https:// se shuru)!');return;}
  if(!name){alert('App ka naam likho!');return;}
  if(!pkg){suggestPkg();pkg=document.getElementById('apkPkg').value.trim();}
  if(!pkg){alert('Package name likho — masalan com.meriwebsite.app');return;}
  outHtml(out,'<span class="spin"></span>Android project ban raha…');
  try{
    const path=pkg.replace(/\./g,'/');
    const iconFile=document.getElementById('apkIcon').files[0];
    const iconImg=iconFile?await loadImg(iconFile):null;
    const letter=name.trim()[0].toUpperCase();
    const escName=name.replace(/&/g,'&amp;');
    const zip=new JSZip();
    const app='app/src/main/';
    zip.file('settings.gradle', "rootProject.name = '" + name.replace(/'/g,'') + "'\ninclude ':app'\n");
    zip.file('build.gradle', "buildscript {\n    repositories { google(); mavenCentral() }\n    dependencies { classpath 'com.android.application:8.2.2' }\n}\nallprojects { repositories { google(); mavenCentral() } }\n");
    zip.file('gradle.properties', "org.gradle.jvmargs=-Xmx2048m\nandroid.useAndroidX=true\n");
    zip.file('app/build.gradle',
      "plugins { id 'com.android.application' }\n\nandroid {\n    namespace '" + pkg + "'\n    compileSdk 34\n    defaultConfig {\n        applicationId '" + pkg + "'\n        minSdk 24\n        targetSdk 34\n        versionCode 1\n        versionName '" + ver + "'\n    }\n    buildTypes { release { minifyEnabled false } }\n    compileOptions { sourceCompatibility JavaVersion.VERSION_1_8; targetCompatibility JavaVersion.VERSION_1_8 }\n}\n\ndependencies {\n    implementation 'androidx.appcompat:appcompat:1.6.1'\n    implementation 'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0'\n}\n");
    zip.file(app+'AndroidManifest.xml',
      '<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n' +
      '    <uses-permission android:name="android.permission.INTERNET" />\n' +
      '    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />\n' +
      '    <application android:allowBackup="true" android:icon="@mipmap/ic_launcher" android:label="' + escName + '" android:theme="@style/Theme.App">\n' +
      '        <activity android:name=".MainActivity" android:exported="true" android:screenOrientation="' + orient + '"' + (full ? ' android:theme="@style/Theme.App.Fullscreen"' : '') + '>\n' +
      '            <intent-filter><action android:name="android.intent.action.MAIN" /><category android:name="android.intent.category.LAUNCHER" /></intent-filter>\n' +
      '        </activity>\n    </application>\n</manifest>\n');
    const kt = 'package ' + pkg + '\n\n' +
      'import android.content.Intent\nimport android.net.Uri\nimport android.os.Bundle\nimport android.view.View\nimport android.webkit.*\nimport android.widget.ProgressBar\nimport androidx.appcompat.app.AppCompatActivity\nimport androidx.swiperefreshlayout.widget.SwipeRefreshLayout\n\n' +
      'class MainActivity : AppCompatActivity() {\n' +
      '    private lateinit var webView: WebView\n    private lateinit var progress: ProgressBar\n    private lateinit var swipe: SwipeRefreshLayout\n    private var fileCallback: ValueCallback<Array<Uri>>? = null\n\n' +
      '    override fun onCreate(savedInstanceState: Bundle?) {\n' +
      '        super.onCreate(savedInstanceState)\n        setContentView(R.layout.activity_main)\n        webView = findViewById(R.id.webview)\n        progress = findViewById(R.id.progress)\n        swipe = findViewById(R.id.swipe)\n' +
      '        val s = webView.settings\n        s.javaScriptEnabled = true\n        s.domStorageEnabled = true\n        s.loadWithOverviewMode = true\n        s.useWideViewPort = true\n        s.setSupportZoom(false)\n        s.userAgentString = s.userAgentString.replace("; wv", "")\n' +
      '        webView.webViewClient = object : WebViewClient() {\n' +
      '            override fun onPageFinished(view: WebView?, url: String?) { progress.visibility = View.GONE; swipe.isRefreshing = false }\n' +
      '            override fun shouldOverrideUrlLoading(view: WebView?, req: WebResourceRequest?): Boolean {\n' +
      '                val u = req?.url.toString()\n' +
      '                return if (u.startsWith("' + url + '")) false else { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(u))); true }\n' +
      '            }\n        }\n' +
      '        webView.webChromeClient = object : WebChromeClient() {\n' +
      '            override fun onProgressChanged(view: WebView?, p: Int) { progress.progress = p; progress.visibility = if (p < 100) View.VISIBLE else View.GONE }\n' +
      '            override fun onShowFileChooser(view: WebView?, cb: ValueCallback<Array<Uri>>?, params: FileChooserParams?): Boolean {\n' +
      '                fileCallback = cb\n' +
      '                val intent = Intent(Intent.ACTION_GET_CONTENT).apply { type = "*/*"; addCategory(Intent.CATEGORY_OPENABLE) }\n' +
      '                startActivityForResult(Intent.createChooser(intent, "File chuno"), 1001)\n                return true\n            }\n        }\n' +
      '        swipe.setOnRefreshListener { webView.reload() }\n' +
      '        webView.loadUrl("' + url + '")\n    }\n\n' +
      '    override fun onActivityResult(code: Int, result: Int, data: Intent?) {\n' +
      '        super.onActivityResult(code, result, data)\n' +
      '        if (code == 1001) { fileCallback?.onReceiveValue(if (data?.data != null) arrayOf(data.data!!) else null); fileCallback = null }\n    }\n\n' +
      '    override fun onBackPressed() { if (webView.canGoBack()) webView.goBack() else super.onBackPressed() }\n}\n';
    zip.file(app+'java/'+path+'/MainActivity.kt', kt);
    zip.file(app+'res/layout/activity_main.xml',
      '<?xml version="1.0" encoding="utf-8"?>\n<androidx.swiperefreshlayout.widget.SwipeRefreshLayout xmlns:android="http://schemas.android.com/apk/res/android" android:id="@+id/swipe" android:layout_width="match_parent" android:layout_height="match_parent">\n' +
      '    <FrameLayout android:layout_width="match_parent" android:layout_height="match_parent">\n' +
      '        <WebView android:id="@+id/webview" android:layout_width="match_parent" android:layout_height="match_parent" />\n' +
      '        <ProgressBar android:id="@+id/progress" style="?android:attr/progressBarStyleHorizontal" android:layout_width="match_parent" android:layout_height="4dp" android:max="100" />\n' +
      '    </FrameLayout>\n</androidx.swiperefreshlayout.widget.SwipeRefreshLayout>\n');
    zip.file(app+'res/values/strings.xml','<?xml version="1.0" encoding="utf-8"?>\n<resources><string name="app_name">'+escName+'</string></resources>\n');
    zip.file(app+'res/values/colors.xml','<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="theme">'+color+'</color></resources>\n');
    zip.file(app+'res/values/themes.xml',
      '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n' +
      '    <style name="Theme.App" parent="Theme.AppCompat.Light.NoActionBar">\n        <item name="colorPrimary">@color/theme</item>\n        <item name="android:statusBarColor">@color/theme</item>\n    </style>\n' +
      '    <style name="Theme.App.Fullscreen" parent="Theme.App">\n        <item name="android:windowFullscreen">true</item>\n    </style>\n</resources>\n');
    const iconSizes={mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192};
    for(const d of Object.keys(iconSizes)){
      const blob=await apkIconPng(iconSizes[d],iconImg,color,letter);
      zip.file(app+'res/mipmap-'+d+'/ic_launcher.png',blob);
      zip.file(app+'res/mipmap-'+d+'/ic_launcher_round.png',blob);
    }
    zip.file('.github/workflows/build-apk.yml',
      'name: Build signed APK\n\non:\n  workflow_dispatch:\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-java@v4\n        with:\n          distribution: temurin\n          java-version: "17"\n      - name: Make keystore\n        run: |\n          keytool -genkeypair -v -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=ZUBI, OU=App, O=ZUBI, C=PK"\n      - name: Build release APK\n        run: |\n          chmod +x gradlew 2>/dev/null || true\n          ./gradlew assembleRelease || gradle assembleRelease\n      - name: Sign APK\n        run: |\n          APK=$(find app/build/outputs/apk/release -name "*.apk" | head -1)\n          echo "Found: $APK"\n          $ANDROID_HOME/build-tools/34.0.0/apksigner sign --ks release.keystore --ks-pass pass:android --key-pass pass:android --out app-release.apk "$APK"\n      - uses: actions/upload-artifact@v4\n        with:\n          name: app-release\n          path: app-release.apk\n');
    zip.file('README.txt',
      'ZUBI TOOL — Website To APK (3 minute, free)\n\n' +
      'STEP 1: GitHub par naya PRIVATE repository banao.\n' +
      'STEP 2: Is ZIP ki saari files us repo mein upload karo.\n' +
      'STEP 3: Repo mein Actions tab kholo → "Build signed APK" → Run workflow.\n' +
      'STEP 4: ~3 minute baad Artifacts mein "app-release" se app-release.apk download karo aur phone mein install karo.\n\n' +
      'Website: ' + url + '\nApp: ' + name + '\nPackage: ' + pkg + '\nVersion: ' + ver + '\n');
    const blob=await zip.generateAsync({type:'blob'});
    dlBlob(blob,'ZUBI_AndroidApp_'+Date.now()+'.zip');
    outHtml(out,'<span class="c-green">✅ Android project ZIP download ho gaya!</span>');
    document.getElementById('apkSteps').style.display='block';
    document.getElementById('apkSteps').innerHTML='<b>Ab APK banane ke 4 steps:</b><br>1️⃣ GitHub par naya <b>private repository</b> banao<br>2️⃣ ZIP ki saari files us repo mein upload karo<br>3️⃣ Repo mein <b>Actions → Build signed APK → Run workflow</b><br>4️⃣ ~3 minute baad <b>Artifacts → app-release.apk</b> download karke install karo ✅';
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
    const flat=pages.map((lines,pi)=>'Page '+(pi+1)+'\n'+lines.join('\n')).join('\n\n');
    if(typeof docx==='undefined'||!docx.Document){
      const htmlDoc='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>ZUBI</title></head><body>'+flat.split('\n').map(l=>'<p>'+l.replace(/</g,'&lt;')+'</p>').join('')+'</body></html>';
      dlBlob(new Blob([htmlDoc],{type:'application/msword'}),'ZUBI_PDFtoWord_'+Date.now()+'.doc');
      outHtml(out,'<span class="c-green">✅ Word file (.doc) download ho gayi!</span>');
      return;
    }
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
