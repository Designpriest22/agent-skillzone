// screenshot each .slide / .page of an html file to pngs for review
const {chromium}=require('playwright');const path=require('path');
(async()=>{const [src,out,w,h,sel]=process.argv.slice(2);const b=await chromium.launch();const p=await b.newPage({viewport:{width:+w,height:+h}});
await p.goto('file://'+path.resolve(src),{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
const els=await p.$$(sel||'.slide');for(let i=0;i<els.length;i++){await els[i].screenshot({path:`${out}_${String(i+1).padStart(2,'0')}.png`});}
console.log(els.length);await b.close();})();
