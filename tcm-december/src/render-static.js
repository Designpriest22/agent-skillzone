// node src/render-static.js <fmt> <out.png> [scale]
const {chromium}=require('playwright');const path=require('path');
const S={story:[1080,1920],feed:[1080,1350],square:[1080,1080],wide:[1920,1080]};
(async()=>{const [,,fmt,out,sc]=process.argv;const [w,h]=S[fmt];
const b=await chromium.launch();const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:+sc||1});
p.on('pageerror',e=>console.error('ERR',e.message));
await p.goto('file://'+path.resolve(__dirname,'tcm.html')+'?fmt='+fmt);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(250);
const info=await p.evaluate(()=>{const o=[];document.querySelectorAll('.ev .t,.ev .s,.card .n,.cta,.sign,h1,.sub').forEach(e=>{const r=e.getBoundingClientRect(),c=e.closest('.col,.res,header,footer')?.getBoundingClientRect();if(r.right>innerWidth+1||r.bottom>innerHeight+1)o.push('OOB '+e.textContent.slice(0,20))});
const bx=s=>{const r=document.querySelector(s)?.getBoundingClientRect();return r?[Math.round(r.top),Math.round(r.bottom)]:null};
// overlap check of row text inside each ev
document.querySelectorAll('.ev').forEach(ev=>{const t=ev.querySelector('.t').getBoundingClientRect(),s=ev.querySelector('.s')?.getBoundingClientRect();if(s&&s.left<t.right&&s.top<t.bottom&&s.bottom>t.top)o.push('OVERLAP '+ev.textContent.slice(0,20));if(t.right>ev.getBoundingClientRect().right+1)o.push('WIDE '+ev.textContent.slice(0,20))});
return {o,header:bx('header'),list:bx('#list'),res:bx('#res'),foot:bx('#foot')}});
console.log(fmt,JSON.stringify(info));
await p.screenshot({path:out});await b.close()})();
