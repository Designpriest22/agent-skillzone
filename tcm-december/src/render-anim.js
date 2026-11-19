// node src/render-anim.js <fmt> <out.mp4> [fps] [scale]   |  node src/render-anim.js <fmt> --frames t1,t2,... <outprefix>
const {chromium}=require('playwright');const path=require('path');const {spawn}=require('child_process');
const S={story:[1080,1920],feed:[1080,1350],square:[1080,1080],wide:[1920,1080]};
(async()=>{const [,,fmt,out,a3,a4]=process.argv;const [w,h]=S[fmt];
const b=await chromium.launch();const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
p.on('pageerror',e=>console.error('ERR',e.message));
await p.goto('file://'+path.resolve(__dirname,'tcm.html')+'?mode=anim&fmt='+fmt);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
if(out==='--frames'){for(const t of a3.split(',')){await p.evaluate(t=>seek(t),+t);await p.screenshot({path:`${a4}_${t}.png`})}await b.close();return}
const fps=+a3||30,D=20,n=D*fps;
const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
for(let i=0;i<n;i++){await p.evaluate(t=>seek(t),i/fps);const buf=await p.screenshot({type:'jpeg',quality:95});
  if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(i%100==0)console.log(fmt,i,'/',n)}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close()})();
