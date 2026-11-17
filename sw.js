// تقسيم المرفقات — بيخلّي البرنامج يتثبت ويفتح من غير نت بعد أول مرة
const CACHE='att-v1';
const CORE=['./','./index.html','./manifest.webmanifest','./icon.png'];
const LIBS=['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(async c=>{
    await c.addAll(CORE);
    for(const u of LIBS){try{await c.add(new Request(u,{mode:'cors'}))}catch(err){}}
  }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.port==='8765')return; // قارئ ويندوز (المساعد على الجهاز)
  if(u.origin===location.origin){
    // البرنامج نفسه: من النت الأول (عشان التحديثات توصل)، ولو مفيش نت من النسخة المحفوظة
    e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})
      .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html'))));
  }else if(u.hostname==='cdnjs.cloudflare.com'||u.hostname==='cdn.jsdelivr.net'){
    // المكتبات: من النسخة المحفوظة الأول
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})));
  }
});
