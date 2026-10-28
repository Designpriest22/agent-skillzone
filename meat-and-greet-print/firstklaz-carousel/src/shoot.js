const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
for(const [h,o] of JSON.parse(process.argv[2])){await p.goto('file://'+h);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(250);await p.screenshot({path:o});}
await b.close();})();