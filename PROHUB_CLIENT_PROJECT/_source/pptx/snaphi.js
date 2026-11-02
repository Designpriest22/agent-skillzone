const {chromium}=require('playwright');const path=require('path');
(async()=>{const [src,out]=process.argv.slice(2);const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:4/3});
await p.goto('file://'+path.resolve(src),{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
const els=await p.$$('.slide');for(let i=0;i<els.length;i++){await els[i].screenshot({path:`${out}/slide_${String(i+1).padStart(2,'0')}.jpg`,type:'jpeg',quality:90});}
console.log(els.length);await b.close();})();
