// node render.js out.png [city] [date] [layersDir]
const {chromium}=require('playwright');
(async()=>{const [out,city,date,ldir]=process.argv.slice(2);
const b=await chromium.launch({args:['--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:2});
const q=new URLSearchParams();if(city)q.set('city',city);if(date)q.set('date',date);
await p.goto('file://'+__dirname+'/09_red_loadout_nocut.html?'+q.toString());await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(600);
await p.screenshot({path:out});
if(ldir){const names=await p.evaluate(()=>[...document.querySelectorAll('[data-layer]')].map(e=>e.dataset.layer));
 require('fs').mkdirSync(ldir,{recursive:true});
 for(let i=0;i<names.length;i++){
  await p.evaluate(i=>{document.querySelectorAll('[data-layer]').forEach((e,j)=>e.classList.toggle('hidden',j!==i))},i);
  await p.screenshot({path:`${ldir}/${String(i).padStart(2,'0')}.png`,omitBackground:true});}
 require('fs').writeFileSync(`${ldir}/layers.json`,JSON.stringify(names));}
await b.close();})();
