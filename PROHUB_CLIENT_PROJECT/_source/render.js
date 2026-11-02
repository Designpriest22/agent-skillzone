// Usage: node render.js <jobs.json> [filter]
// job: {src, out, w, h, kind:'png'|'pdf', full?:bool}
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{
  const jobs=JSON.parse(fs.readFileSync(process.argv[2]));const filt=process.argv[3];
  const b=await chromium.launch();
  for(const j of jobs){
    if(filt && !j.out.includes(filt) && !j.src.includes(filt)) continue;
    const p=await b.newPage({viewport:{width:j.w,height:j.h},deviceScaleFactor:j.scale||1});
    await p.goto('file://'+path.resolve(j.src)+(j.hash||''),{waitUntil:'networkidle'});
    await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(250);
    fs.mkdirSync(path.dirname(j.out),{recursive:true});
    if(j.kind==='pdf'){const o={path:j.out,printBackground:true,preferCSSPageSize:!!j.css};if(!j.css){o.width=j.pw||j.w+'px';o.height=j.ph||j.h+'px';}
      if(j.footer){o.displayHeaderFooter=true;o.headerTemplate='<span></span>';o.footerTemplate=`<div style="width:100%;font-family:monospace;font-size:7px;letter-spacing:1.5px;color:#8C8C95;padding:0 16mm;display:flex;justify-content:space-between;text-transform:uppercase"><span>${j.footer}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;}
      await p.pdf(o);}
    else if(j.sel){await (await p.$(j.sel)).screenshot({path:j.out});}
    else{await p.screenshot({path:j.out,fullPage:!!j.full,clip:j.full?undefined:{x:0,y:0,width:j.w,height:j.h}});}
    console.log('✓',j.out);await p.close();
  }
  await b.close();
})();
