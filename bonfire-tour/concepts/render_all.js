const {chromium}=require('playwright');
(async()=>{const files=process.argv.slice(2);const b=await chromium.launch({args:['--allow-file-access-from-files']});
for(const f of files){const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:2});
 await p.goto('file://'+__dirname+'/'+f);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(700);
 await p.screenshot({path:__dirname+'/out/'+f.replace('.html','.png')});await p.close();}
await b.close();})();
