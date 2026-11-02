// Campaign components: plate-record symbol, cutlery, rough-stamp filter.
(function(){
  const NS='http://www.w3.org/2000/svg';
  // global filter for inked stamp edges
  const f=document.createElement('div');
  f.innerHTML=`<svg width="0" height="0" style="position:absolute"><filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter></svg>`;
  document.body.appendChild(f.firstChild);

  function wedge(r,a1,a2){const p=a=>[r*Math.cos(a*Math.PI/180),r*Math.sin(a*Math.PI/180)];const[x1,y1]=p(a1),[x2,y2]=p(a2);return `M0,0 L${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2} Z`;}

  window.plateSVG=function(o={}){
    const id='p'+Math.random().toString(36).slice(2,7);
    const label=o.label??'05.12', ring=o.ring??'CIBUS MUSICA · BETTER DAYS · ABUJA · 2026 · ';
    const lc=o.labelColor??'#FF5A1F', tc=o.textColor??'#150A2E';
    let grooves='';
    for(let r=148;r<=362;r+=4.5){const a=(0.03+((r*7)%11)/300).toFixed(3);grooves+=`<circle r="${r}" fill="none" stroke="rgba(255,255,255,${a})" stroke-width=".9"/>`;}
    return `<svg viewBox="-520 -520 1040 1040" xmlns="${NS}" style="width:100%;height:100%;overflow:visible">
    <defs>
      <radialGradient id="${id}pg" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="#FFFBF2"/><stop offset=".7" stop-color="#F1E6CF"/><stop offset="1" stop-color="#D9CBAE"/></radialGradient>
      <radialGradient id="${id}sh" cx="50%" cy="50%" r="50%"><stop offset=".85" stop-color="rgba(0,0,0,.45)"/><stop offset="1" stop-color="rgba(0,0,0,0)"/></radialGradient>
      <path id="${id}ring" d="M -96,0 a96,96 0 1,1 192,0 a96,96 0 1,1 -192,0"/>
    </defs>
    ${o.noShadow?'':`<circle cx="22" cy="34" r="505" fill="url(#${id}sh)"/>`}
    <circle r="492" fill="url(#${id}pg)"/>
    <circle r="489" fill="none" stroke="rgba(80,55,20,.18)" stroke-width="2"/>
    <circle r="470" fill="none" stroke="rgba(255,90,31,.55)" stroke-width="5"/>
    <circle r="458" fill="none" stroke="rgba(255,90,31,.35)" stroke-width="1.5"/>
    <circle r="402" fill="rgba(90,60,20,.06)" stroke="rgba(90,60,20,.16)" stroke-width="2.5"/>
    <circle r="372" fill="#120C16"/>
    ${grooves}
    <path d="${wedge(370,-70,-38)}" fill="rgba(255,255,255,.075)"/>
    <path d="${wedge(370,110,142)}" fill="rgba(255,255,255,.06)"/>
    <circle r="138" fill="${lc}"/>
    <circle r="132" fill="none" stroke="rgba(21,10,46,.25)" stroke-width="1.5"/>
    <text font-family="DM Mono" font-weight="500" font-size="15" letter-spacing="2" fill="${tc}"><textPath href="#${id}ring" textLength="596" lengthAdjust="spacing">${ring}</textPath></text>
    <text y="-14" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="48" style="font-variation-settings:'wdth' 75" fill="${tc}">${label}</text>
    <circle r="5" cy="10" fill="#120C16"/>
    <text y="46" text-anchor="middle" font-family="DM Mono" font-weight="500" font-size="13" letter-spacing="2.5" fill="${tc}">${o.sub??'SAT · ABUJA'}</text>
    </svg>`;
  };
  window.forkSVG=function(c='#F4ECDB'){return `<svg viewBox="0 0 100 640" xmlns="${NS}" style="width:100%;height:100%"><g fill="${c}">
    <rect x="14" y="0" width="11" height="160" rx="5.5"/><rect x="33" y="0" width="11" height="160" rx="5.5"/><rect x="56" y="0" width="11" height="160" rx="5.5"/><rect x="75" y="0" width="11" height="160" rx="5.5"/>
    <path d="M14 140 H86 V170 C86 215 66 232 58 250 L57 300 H43 L42 250 C34 232 14 215 14 170 Z"/>
    <rect x="33" y="292" width="34" height="348" rx="17"/></g></svg>`;};
  window.knifeSVG=function(c='#F4ECDB'){return `<svg viewBox="0 0 100 640" xmlns="${NS}" style="width:100%;height:100%"><g fill="${c}">
    <path d="M38 12 C40 2 50 0 56 6 C74 30 76 120 74 210 L72 300 H38 Z"/>
    <rect x="33" y="292" width="38" height="348" rx="19"/></g></svg>`;};
  document.querySelectorAll('[data-plate]').forEach(el=>{const o=JSON.parse(el.dataset.plate||'{}');el.innerHTML=plateSVG(o);});
  document.querySelectorAll('[data-fork]').forEach(el=>el.innerHTML=forkSVG(el.dataset.fork||undefined));
  document.querySelectorAll('[data-knife]').forEach(el=>el.innerHTML=knifeSVG(el.dataset.knife||undefined));
})();
