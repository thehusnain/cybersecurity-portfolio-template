/** A small photo-sprite IK rig and a bounded silk simulation. No DOM pointer interception. */
type V={x:number;y:number};
type RopePoint=V&{px:number;py:number};
type Bead={u:number;r:number;slide:number};
type Rope={points:RopePoint[];a:V;b:V;length:number;phase:number;born:number;fade:number;beads:Bead[]};
type Drop=V&{vx:number;vy:number;r:number;age:number};
type Leg={hip:V;rest:V;a:number;b:number;side:number;group:number;foot:V;from:V;to:V;step:number;duration:number;strip:HTMLCanvasElement;split:number};
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const dist=(a:V,b:V)=>Math.hypot(a.x-b.x,a.y-b.y);
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const point=(x:number,y:number):V=>({x,y});
const makeCanvas=(w:number,h:number)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const CONTROL='a,button,input,textarea,select,[role="button"],[role="dialog"],[data-no-spider]';

export function createWebSpider(canvas:HTMLCanvasElement){
  const ctx=canvas.getContext('2d')!;
  const photo=new Image();photo.src='/assets/spider/jumping-spider.png';
  let W=innerWidth,H=innerHeight,K=.16,dpr=1,raf=0,last=performance.now(),clock=0,loaded=false,disposed=false,active=true;
  let px=W*.7,py=H*.6,fx=px,fy=py,fh=0,inside=false,overControl=false,coarseInput=false,lastMove=0,landed=0,flyAlpha=0,caught=0,recoil=0;
  let x=W*.82,y=-120,heading=Math.PI/2,vx=0,vy=0,sway=0,quiet=0,sleep=0,jumpHeight=0,landing=0,intro=true,lastAnchor=point(W*.82,-2),lastAttach=0;
  let jump:{start:V;end:V;t:number;duration:number;height:number}|null=null;
  const introStart=performance.now(),splats:Drop[]=[];
  let ropes:Rope[]=[],drops:Drop[]=[],anchors:V[]=[],legs:Leg[]=[],scrollTimer:ReturnType<typeof setTimeout>|undefined,holdTimer:ReturnType<typeof setTimeout>|undefined,lastTap=0;
  const silhouette=makeCanvas(W,H),shadow=makeCanvas(W,H),body=makeCanvas(1254,1254),head=makeCanvas(1254,1254),spider=makeCanvas(500,500);
  const listeners:(()=>void)[]=[];
  const listen=(target:EventTarget,name:string,fn:EventListener,options?:AddEventListenerOptions)=>{target.addEventListener(name,fn,options);listeners.push(()=>target.removeEventListener(name,fn,options));};
  const world=(v:V):V=>point(x+(v.x*Math.cos(heading)-v.y*Math.sin(heading))*K,y+(v.x*Math.sin(heading)+v.y*Math.cos(heading))*K);
  const bodyPoint=(v:V)=>point(v.y-600,-(v.x-627));
  const patch=(c:HTMLCanvasElement,ellipses:number[][])=>{const g=c.getContext('2d')!;g.drawImage(photo,0,0,1254,1254);g.globalCompositeOperation='destination-in';g.beginPath();for(const [ex,ey,rx,ry] of ellipses){g.ellipse(ex,ey,rx,ry,0,0,Math.PI*2);}g.fill();g.globalCompositeOperation='source-over';};
  const makeStrip=(path:V[])=>{
    const a=dist(path[0],path[1]),b=dist(path[1],path[2]),length=Math.ceil(a+b),width=92,strip=makeCanvas(length,width),g=strip.getContext('2d')!;
    const source=makeCanvas(1254,1254),sg=source.getContext('2d',{willReadFrequently:true})!;sg.drawImage(photo,0,0,1254,1254);
    const data=sg.getImageData(0,0,1254,1254),out=g.createImageData(length,width);
    for(let u=0;u<length;u++){
      const first=u<a,p0=path[first?0:1],p1=path[first?1:2],t=first?u/a:(u-a)/b,dx=p1.x-p0.x,dy=p1.y-p0.y,l=Math.hypot(dx,dy);
      for(let v=0;v<width;v++){
        const off=v-width/2,sx=clamp(mix(p0.x,p1.x,t)-dy/l*off,0,1252),sy=clamp(mix(p0.y,p1.y,t)+dx/l*off,0,1252),ix=Math.floor(sx),iy=Math.floor(sy),tx=sx-ix,ty=sy-iy,oi=(v*length+u)*4;
        for(let ch=0;ch<4;ch++)out.data[oi+ch]=mix(mix(data.data[(iy*1254+ix)*4+ch],data.data[(iy*1254+ix+1)*4+ch],tx),mix(data.data[((iy+1)*1254+ix)*4+ch],data.data[((iy+1)*1254+ix+1)*4+ch],tx),ty);
        out.data[oi+3]*=clamp((1-Math.abs(off)/(width/2))/.28);
      }
    }
    g.putImageData(out,0,0);return {strip,split:a/(a+b),a,b};
  };
  photo.onload=()=>{
    if(disposed)return;patch(body,[[628,345,220,205]]);patch(head,[[630,700,174,174],[565,865,68,58],[690,865,68,58]]);
    const paths=[[[470,760],[370,830],[400,1160]],[[460,665],[300,690],[100,955]],[[480,605],[370,580],[55,475]],[[490,560],[360,420],[410,52]]];
    legs=[];
    for(let side=0;side<2;side++)paths.forEach((coords,i)=>{
      const path=coords.map(([xx,yy])=>point(side?1254-xx:xx,yy)),rig=makeStrip(path),hip=bodyPoint(path[0]),rest=bodyPoint(path[2]);let {a,b}=rig;
      const reach=dist(hip,rest);if(a+b<1.15*reach){const ratio=1.15*reach/(a+b);a*=ratio;b*=ratio;}
      const foot=world(rest);legs.push({hip,rest,a,b,side:side?1:-1,group:(i+side)%2,foot,from:{...foot},to:{...foot},step:1,duration:.15,strip:rig.strip,split:rig.split});
    });loaded=true;canvas.dataset.ready='true';
  };
  const resize=()=>{
    W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);canvas.style.width=`${W}px`;canvas.style.height=`${H}px`;
    silhouette.width=W;silhouette.height=H;shadow.width=W;shadow.height=H;
    const t=clamp(W/H<1?clamp(W/480,.78,1.1):H<560?Math.max(.68,H/620):Math.min(W/1440,H/810),.6,1.25);K=1.3*t*.12;
    if(!intro){x=clamp(x,90,W-90);y=clamp(y,80,H-80);}else{x=W*.82;lastAnchor=point(W*.82,-2);}
    sampleAnchors();
  };
  function sampleAnchors(){
    if(disposed)return;anchors=[];const g=silhouette.getContext('2d',{willReadFrequently:true})!;g.clearRect(0,0,W,H);
    const candidates=[...document.querySelectorAll<HTMLElement>('[data-web-anchor],.brand,.nav-links>a,.section-head h2,.contact h2,.internship-proof,.project-front h3,.hero h1,.hero-note,.portrait-brush,.social-set a,.hero-bottom b')];
    candidates.forEach(el=>{
      const r=el.getBoundingClientRect(),style=getComputedStyle(el);if(r.bottom<0||r.top>H||r.width<2||r.height<2||style.visibility==='hidden'||Number(style.opacity)<.15||el.closest('[inert]'))return;
      g.fillStyle='#fff';
      const portrait=el.querySelector<HTMLCanvasElement>('.pfp-reveal');
      if(portrait&&portrait.width>1){const b=portrait.getBoundingClientRect();g.drawImage(portrait,b.left,b.top,b.width,b.height);return;}
      const isBox=!!el.querySelector('img,canvas')||el.matches('.internship-proof');
      if(isBox){g.beginPath();g.roundRect(r.left,r.top,r.width,r.height,10);g.fill();return;}
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
      for(let node=walker.nextNode();node;node=walker.nextNode()){
        if(!node.textContent?.trim())continue;const parent=node.parentElement;if(!parent)continue;const cs=getComputedStyle(parent);if(cs.visibility==='hidden'||Number(cs.opacity)<.2)continue;
        g.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;g.textBaseline='top';const range=document.createRange();const text=node.textContent;
        // Ranges preserve the actual wrap and placement of each word in the DOM.
        for(const match of text.matchAll(/\S+/g)){range.setStart(node,match.index!);range.setEnd(node,match.index!+match[0].length);const b=range.getBoundingClientRect();if(b.bottom<0||b.top>H)continue;g.fillText(match[0],b.left,b.top+Math.max(0,(b.height-parseFloat(cs.fontSize))*.5));}
      }
    });
    const pixels=g.getImageData(0,0,W,H).data;
    for(let yy=0;yy<H;yy+=7)for(let xx=0;xx<W;xx+=7){const a=pixels[(yy*W+xx)*4+3];if(a<128)continue;const edge=[[-3,0],[3,0],[0,-3],[0,3]].some(([dx,dy])=>{const nx=xx+dx,ny=yy+dy;return nx<0||ny<0||nx>=W||ny>=H||pixels[(ny*W+nx)*4+3]<128;});if(edge&&anchors.length<2400)anchors.push(point(xx,yy));}
    canvas.dataset.anchors=String(anchors.length);
  }
  const rope=(a:V,b:V,thickness=1)=>{
    const length=dist(a,b);if(length<30)return;
    const points=Array.from({length:13},(_,i)=>({x:mix(a.x,b.x,i/12),y:mix(a.y,b.y,i/12),px:mix(a.x,b.x,i/12),py:mix(a.y,b.y,i/12)}));
    ropes.push({points,a:{...a},b:{...b},length:length/12*1.012,phase:Math.random()*6.28,born:clock,fade:1,beads:Array.from({length:Math.min(8,Math.floor(length/55*(.4+Math.random())))},()=>({u:.1+Math.random()*.8,r:1.6+Math.random()*3.8,slide:0}))});
    // A bounded history prevents long visits from accumulating simulation work.
    const limit=matchMedia('(pointer: coarse)').matches?36:64;if(ropes.length>limit)ropes.shift();canvas.dataset.threads=String(ropes.length);void thickness;
  };
  const vibrate=(p:V,radius:number,strength:number)=>{ropes.forEach(r=>r.points.forEach(q=>{const d=dist(p,q);if(d<radius){q.px+=(Math.random()-.5)*strength*(1-d/radius);q.py+=(Math.random()-.5)*strength*(1-d/radius);}}));};
  const clear=()=>{for(const r of ropes){r.fade=.99;for(const bead of r.beads){const p=ropeAt(r,bead.u);drops.push({...p,vx:(Math.random()-.5)*50,vy:0,r:bead.r,age:0});}r.beads=[];}vibrate(point(x,y),Math.max(W,H),12);lastAnchor=world(point(-450,0));lastAttach=clock;canvas.dataset.cleared=String(clock);};
  const ropeAt=(r:Rope,u:number)=>{const f=clamp(u)*12,i=Math.min(11,Math.floor(f));return point(mix(r.points[i].x,r.points[i+1].x,f-i),mix(r.points[i].y,r.points[i+1].y,f-i));};
  const pounce=()=>{
    if(intro||jump||!inside||overControl)return;
    const angle=Math.atan2(fy-y,fx-x),mouth=360*K,target=point(fx-Math.cos(angle)*mouth,fy-Math.sin(angle)*mouth),distance=Math.min(360*K,dist(point(x,y),target)),a=Math.atan2(target.y-y,target.x-x);
    heading=angle;jump={start:point(x,y),end:point(clamp(x+Math.cos(a)*distance,10,W-10),clamp(y+Math.sin(a)*distance,10,H-10)),t:0,duration:clamp(distance/1100,.28,.6),height:clamp(distance*.3,22,130)};quiet=0;sleep=0;canvas.dataset.state='jumping';
  };
  listen(window,'pointermove',((e:PointerEvent)=>{
    if(e.pointerType==='touch')return;inside=true;overControl=!!(e.target as Element).closest(CONTROL);px=e.clientX;py=e.clientY;lastMove=clock;
    if(sleep>.6&&!jump){jump={start:point(x,y),end:point(x,y),t:0,duration:.3,height:26};vibrate(point(x,y),90,1.5);}sleep=0;
  }) as EventListener,{passive:true});
  listen(document,'pointerout',((e:PointerEvent)=>{if(!e.relatedTarget)inside=false;}) as EventListener);
  listen(document,'click',((e:MouseEvent)=>{if(coarseInput||(e.target as Element).closest(CONTROL))return;px=e.clientX;py=e.clientY;inside=true;overControl=false;pounce();}) as EventListener);
  listen(document,'keydown',((e:KeyboardEvent)=>{if((e.key==='Delete'||e.key==='Backspace')&&!(e.target as Element).closest('input,textarea,[contenteditable=true]')){e.preventDefault();clear();}}) as EventListener);
  listen(window,'portfolio:clear-web',clear);
  listen(window,'resize',resize,{passive:true});
  listen(window,'scroll',()=>{
    // Silhouettes and old attachments belong to the previous viewport. Retire them as the page moves.
    ropes.forEach(r=>{if(r.fade===1)r.fade=.99;});anchors=[];silhouette.getContext('2d')!.clearRect(0,0,W,H);
    if(scrollTimer)clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{sampleAnchors();lastAnchor=world(point(-450,0));},400);
  },{passive:true});
  listen(window,'pointerdown',((e:PointerEvent)=>{coarseInput=e.pointerType==='touch';if(!coarseInput||(e.target as Element).closest(CONTROL))return;px=fx=e.clientX;py=fy=e.clientY;inside=true;overControl=false;lastMove=clock;if(clock-lastTap<.35)pounce();lastTap=clock;holdTimer=setTimeout(()=>{clear();navigator.vibrate?.(30);},650);}) as EventListener,{passive:true});
  const endHold=()=>{if(holdTimer)clearTimeout(holdTimer);};listen(window,'pointerup',endHold);listen(window,'pointercancel',endHold);listen(window,'touchmove',endHold,{passive:true});
  listen(document,'visibilitychange',()=>{active=!document.hidden;last=performance.now();});
  const updateRig=(dt:number)=>{
    const speed=Math.hypot(vx,vy);
    legs.forEach((leg,i)=>{
      const tucked=point(leg.hip.x+(leg.rest.x-leg.hip.x)*(1-sleep*.38),leg.hip.y+(leg.rest.y-leg.hip.y)*(1-sleep*.38)),target=world(tucked);target.x+=vx*.09;target.y+=vy*.09;
      const hip=world(leg.hip),trigger=130*K*(i%4===0?.7:1),distance=dist(leg.foot,target),over=dist(leg.foot,hip)>(leg.a+leg.b)*K*.98;
      if(leg.step>=1&&(distance>trigger*(speed<10?.3:1)||over)&&(!legs.some(other=>other.group!==leg.group&&other.step<1)||over||distance>trigger*1.6)){
        leg.step=0;leg.from={...leg.foot};leg.to=target;leg.duration=clamp(.15-speed/3200,.055,.15);
      }
      if(leg.step<1){leg.step=Math.min(1,leg.step+dt/leg.duration);const t=1-(1-leg.step)**3;leg.foot=point(mix(leg.from.x,leg.to.x,t),mix(leg.from.y,leg.to.y,t));if(leg.step===1)vibrate(leg.foot,30,.6);}
    });
  };
  const updateRopes=(dt:number)=>{
    ropes=ropes.filter(r=>r.fade>0);
    for(const r of ropes){
      if(r.fade<1)r.fade-=dt*2.6;
      r.points.forEach((p,i)=>{if(i===0||i===12)return;const dx=(p.x-p.px)*.975,dy=(p.y-p.py)*.975;p.px=p.x;p.py=p.y;p.x+=dx+(Math.sin(clock*.45)*.6+Math.sin(clock*1.3+1.7)*.4)*22*dt*dt;p.y+=dy+110*dt*dt;
        const distance=dist(p,point(fx,fy));if(inside&&distance<36&&distance>0){p.x+=(p.x-fx)/distance*(36-distance)*dt*3;p.y+=(p.y-fy)/distance*(36-distance)*dt*3;}
      });
      for(let pass=0;pass<4;pass++){
        Object.assign(r.points[0],r.a);Object.assign(r.points[12],r.b);
        for(let i=0;i<12;i++){const a=r.points[i],b=r.points[i+1],d=dist(a,b)||1,k=(d-r.length)/d*.5,dx=(b.x-a.x)*k,dy=(b.y-a.y)*k;if(i>0){a.x+=dx;a.y+=dy;}if(i<11){b.x-=dx;b.y-=dy;}}
      }
      r.beads.forEach(bead=>{if(!bead.slide)return;const u=clamp(bead.u),a=ropeAt(r,u),b=ropeAt(r,clamp(u+.01));bead.slide+=(b.y-a.y)*9*dt;bead.slide*=.95;bead.u+=bead.slide*dt/100;if(bead.u<.02||bead.u>.98){drops.push({...a,vx:0,vy:20,r:bead.r,age:0});bead.r=0;}});
    }
    drops=drops.filter(drop=>drop.y<H+20&&drop.age<8);const mask=silhouette.getContext('2d',{willReadFrequently:true})!;
    drops.forEach(drop=>{drop.age+=dt;drop.vy+=1100*dt;drop.x+=drop.vx*dt;drop.y+=drop.vy*dt;if(drop.age>.12&&drop.x>0&&drop.x<W&&drop.y>0&&drop.y<H&&mask.getImageData(Math.floor(drop.x),Math.floor(drop.y),1,1).data[3]>140){splats.push({...drop,vy:0,age:0});drop.y=H+50;}});if(splats.length>150)splats.splice(0,splats.length-150);
  };
  const bead=(g:CanvasRenderingContext2D,p:V,r:number,alpha=1)=>{if(r<=0)return;g.save();g.globalAlpha*=alpha;const grad=g.createRadialGradient(p.x-r*.25,p.y-r*.3,r*.05,p.x,p.y,r);grad.addColorStop(0,'rgba(255,255,255,.9)');grad.addColorStop(.25,'rgba(235,245,255,.12)');grad.addColorStop(.8,'rgba(255,210,150,.3)');grad.addColorStop(1,'rgba(255,255,255,.75)');g.fillStyle=grad;g.beginPath();g.ellipse(p.x,p.y,r,r*.8,0,0,Math.PI*2);g.fill();g.restore();};
  const drawSilk=(g:CanvasRenderingContext2D,black=false)=>{
    for(const r of ropes){
      const alpha=Math.max(0,r.fade)*(.5+.5*Math.max(0,1-(clock-r.born)/90));g.save();g.globalAlpha=alpha;g.lineCap='round';
      for(let i=0;i<12;i++){
        const a=r.points[i],b=r.points[i+1],angle=Math.atan2(b.y-a.y,b.x-a.x),P=.5+.5*Math.sin(angle*2+clock*.3+r.phase);
        g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.strokeStyle=black?'#000':'rgba(255,255,255,.06)';g.lineWidth=4;g.stroke();
        g.strokeStyle=black?'#000':'rgba(255,255,255,.75)';g.lineWidth=.9-.35*Math.sin(Math.PI*i/12);g.stroke();
        if(!black){g.strokeStyle=`hsla(${190+150*P},100%,74%,${.12+.3*P**3})`;g.lineWidth=.6;g.stroke();
          for(let j=0;j<3;j++){const t=(j+.3)/3,xx=mix(a.x,b.x,t),yy=mix(a.y,b.y,t),off=Math.sin(i*19+j*7+r.phase)*2;g.beginPath();g.moveTo(xx,yy);g.lineTo(xx-Math.sin(angle)*off,yy+Math.cos(angle)*off);g.strokeStyle='rgba(255,255,255,.38)';g.lineWidth=.35;g.stroke();}
        }
      }
      for(const drop of r.beads){if(black){g.beginPath();g.arc(ropeAt(r,drop.u).x,ropeAt(r,drop.u).y,drop.r,0,Math.PI*2);g.fillStyle='#000';g.fill();}else bead(g,ropeAt(r,drop.u),drop.r);}
      if(!black){const glint=ropeAt(r,(clock*.6+r.phase)%1);g.fillStyle='#fff';g.beginPath();g.arc(glint.x,glint.y,.9,0,Math.PI*2);g.fill();}
      g.restore();
    }
    if(!black){const spinner=world(point(-450,0));g.beginPath();g.moveTo(lastAnchor.x,lastAnchor.y);g.quadraticCurveTo((lastAnchor.x+spinner.x)/2,(lastAnchor.y+spinner.y)/2+Math.min(20,dist(lastAnchor,spinner)*.05),spinner.x,spinner.y);g.strokeStyle='rgba(245,249,255,.72)';g.lineWidth=1.25;g.stroke();drops.forEach(drop=>bead(g,drop,drop.r));splats.forEach(drop=>bead(g,drop,drop.r,.5));}
  };
  const bone=(g:CanvasRenderingContext2D,a:V,b:V,leg:Leg,first:boolean)=>{
    const length=dist(a,b),sx=first?0:leg.strip.width*leg.split,sw=leg.strip.width*(first?leg.split:1-leg.split);g.save();g.translate(a.x,a.y);g.rotate(Math.atan2(b.y-a.y,b.x-a.x));
    // A fur-coloured underlay connects gaps in a photographed leg when the knee bends.
    g.strokeStyle='#604732';g.lineWidth=6*K;g.beginPath();g.moveTo(0,0);g.lineTo(length,0);g.stroke();g.drawImage(leg.strip,sx,0,sw,92,-length*.06,-46*K,length*1.12,92*K);g.restore();
  };
  const drawSpider=()=>{
    const g=spider.getContext('2d')!;g.clearRect(0,0,500,500);g.save();g.translate(250,250);
    for(let i=legs.length-1;i>=0;i--){const leg=legs[i],hip=world(leg.hip),foot=leg.foot,a=leg.a*K,b=leg.b*K,D=clamp(dist(hip,foot),1,a+b-.01),base=Math.atan2(foot.y-hip.y,foot.x-hip.x),angle=Math.acos(clamp((a*a+D*D-b*b)/(2*a*D),-1,1));
      const k1=point(hip.x+Math.cos(base+angle)*a,hip.y+Math.sin(base+angle)*a),k2=point(hip.x+Math.cos(base-angle)*a,hip.y+Math.sin(base-angle)*a),out=point(-Math.sin(heading)*leg.side,Math.cos(heading)*leg.side),dot=(p:V)=>(p.x-hip.x)*out.x+(p.y-hip.y)*out.y,knee=dot(k1)>dot(k2)?k1:k2,lift=Math.sin(leg.step*Math.PI)*26*K;
      knee.x+=out.x*lift;knee.y+=out.y*lift;bone(g,point(hip.x-x,hip.y-y),point(knee.x-x,knee.y-y),leg,true);bone(g,point(knee.x-x,knee.y-y),point(foot.x-x,foot.y-y),leg,false);
    }
    g.save();g.rotate(heading-Math.PI/2);g.scale(K,K);const breath=1+Math.sin(clock*(3.2-1.8*sleep))*(.025+.03*sleep),squash=1-.1*landing;
    g.save();g.translate(0,-52);g.rotate(sway);g.scale(breath*(2-squash),breath*squash);g.drawImage(body,-627,-548);g.restore();g.drawImage(head,-627,-600);
    if(quiet>.05){
      const blink=sleep>.4?1:Math.max(0,1-Math.abs(((clock+1.5)%3.8)-.15)/.1),eyes=[[-30,245,25],[35,245,25],[-82,222,14],[87,222,14],[-105,190,9],[109,190,9]];
      g.globalAlpha=quiet;
      eyes.forEach(([ex,ey,r])=>{g.fillStyle='#171310';g.beginPath();g.ellipse(ex,ey,r,r*(1-.93*blink),0,0,Math.PI*2);g.fill();if(blink<.5){g.fillStyle='#ffffffdd';g.beginPath();g.arc(ex-r*.25,ey-r*.3,r*.25,0,Math.PI*2);g.fill();}});
    }
    g.restore();g.restore();
    ctx.save();ctx.translate(x,y);const scale=1+jumpHeight/260;ctx.scale(scale*(1-sleep*.03),scale*(1-sleep*.03));ctx.shadowColor=`rgba(0,0,0,${.42-Math.min(.24,jumpHeight/500)})`;ctx.shadowBlur=7+.14*jumpHeight;ctx.shadowOffsetX=5+.35*jumpHeight;ctx.shadowOffsetY=9+.6*jumpHeight;ctx.drawImage(spider,-250,-250);ctx.restore();
    if(sleep>.05){for(let i=0;i<3;i++){const c=(clock*.25+i/3)%1;ctx.save();ctx.globalAlpha=Math.sin(Math.PI*c)*sleep;ctx.font=`600 ${12+14*c}px "MatrixType", sans-serif`;ctx.fillStyle='#fff';ctx.shadowColor='#0008';ctx.shadowBlur=3;ctx.fillText('z',x+30+c*30,y-25-c*70);ctx.restore();}}
  };
  const drawFly=()=>{
    if(flyAlpha<.01)return;ctx.save();ctx.globalAlpha=flyAlpha;ctx.translate(fx,fy);ctx.rotate(fh+Math.PI/2);const t=clamp(K/.16,.7,1.1);ctx.scale(t,t);ctx.shadowColor='#0005';ctx.shadowBlur=3+9*(1-landed);ctx.shadowOffsetX=3+10*(1-landed);ctx.shadowOffsetY=5+18*(1-landed);
    for(const side of [-1,1])for(let i=0;i<(landed>.9?1:4);i++){ctx.save();ctx.rotate(side*(.25+(1-landed)*Math.sin(clock*(caught>0?46:34)*6.28+i)*.6));ctx.fillStyle=`rgba(227,237,244,${landed>.9?.55:.12})`;ctx.strokeStyle='#68747988';ctx.lineWidth=.5;ctx.beginPath();ctx.ellipse(side*7,7,7,16,side*-.35,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
    const grad=ctx.createLinearGradient(-5,0,5,0);grad.addColorStop(0,'#162019');grad.addColorStop(.5,'#6c8172');grad.addColorStop(1,'#15231d');ctx.fillStyle=grad;ctx.beginPath();ctx.ellipse(0,5,5,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1b211e';ctx.beginPath();ctx.arc(0,-6,5,0,Math.PI*2);ctx.fill();for(const side of [-1,1]){ctx.fillStyle='#8d4c37';ctx.beginPath();ctx.ellipse(side*3,-8,2.5,3,0,0,Math.PI*2);ctx.fill();for(let i=0;i<3;i++){ctx.strokeStyle='#29332c';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(side*3,i*4-1);ctx.lineTo(side*10,i*5+2);ctx.lineTo(side*12,i*6+6);ctx.stroke();}}
    if(caught>0){ctx.strokeStyle='#fff9';ctx.lineWidth=.8;for(let i=0;i<7;i++){ctx.beginPath();ctx.ellipse(0,3,12+i*.7,19-i,Math.sin(i*4)*.5,0,Math.PI*2*clamp((3.8-caught)*2-i*.12));ctx.stroke();}}
    ctx.restore();
  };
  const frame=(now:number)=>{
    const dt=Math.min(.033,(now-last)/1000);last=now;
    if(active&&loaded){
      clock+=dt;const still=clock-lastMove;
      landed=clamp(landed+dt*(still>1.2?3:-10));flyAlpha=mix(flyAlpha,inside&&!overControl?1:0,1-Math.exp(-14*dt));
      const old=point(fx,fy),follow=1-Math.exp(-(28-20*recoil)*dt);recoil=Math.max(0,recoil-dt*1.5);
      if(caught>0){caught-=dt;const mouth=world(point(360,0));fx=mouth.x+Math.sin(clock*47)*1.2;fy=mouth.y+Math.sin(clock*31)*1.2;if(caught<=0){fx+=Math.cos(heading)*150;fy+=Math.sin(heading)*150;recoil=1;}}
      else{fx+=((px+Math.sin(clock*23.1)*2.2*(1-landed))-fx)*follow;fy+=((py+Math.sin(clock*29.3+.7)*2.2*(1-landed))-fy)*follow;}
      if(dist(old,point(fx,fy))/dt>60)fh=Math.atan2(fy-old.y,fx-old.x);
      const previous=point(x,y),oldHeading=heading;
      if(intro){const u=(now-introStart)/1000-3,v=clamp(u/2.3),drop=1-(1-v)**2.4;y=mix(-760*K,H*.43,drop);x=W*(W<821?.72:.82)+(u>2.3?Math.sin((u-2.3)*1.8)*8*Math.exp(-(u-2.3)*.5):0);if(u>2.3)y+=14*Math.exp(-(u-2.3)*3.2)*Math.sin((u-2.3)*6.5);if(u>3.6){intro=false;landing=1;vibrate(point(x,y),140,2);canvas.dataset.state='following';}}
      else if(jump){jump.t+=dt;const t=clamp(jump.t/jump.duration),e=t<.5?2*t*t:1-(-2*t+2)**2/2;x=mix(jump.start.x,jump.end.x,e);y=mix(jump.start.y,jump.end.y,e);jumpHeight=Math.sin(t*Math.PI)*jump.height;if(t===1){jump=null;jumpHeight=0;landing=1;vibrate(point(x,y),140,3);if(dist(world(point(360,0)),point(fx,fy))<55){caught=3+Math.random()*1.2;}canvas.dataset.state='following';}}
      else if(inside&&!overControl){const distance=Math.hypot(fx-x,fy-y),angle=Math.atan2(fy-y,fx-x),delta=Math.atan2(Math.sin(angle-heading),Math.cos(angle-heading));heading+=delta*(1-Math.exp(-8*dt));const speed=Math.min(760,Math.max(0,(distance-560*K)*4)),e=1-Math.exp(-10*dt);vx=mix(vx,Math.cos(angle)*speed,e);vy=mix(vy,Math.sin(angle)*speed,e);x=clamp(x+vx*dt,10,W-10);y=clamp(y+vy*dt,10,H-10);}
      else{vx*=Math.exp(-10*dt);vy*=Math.exp(-10*dt);}
      if(jump||intro){vx=(x-previous.x)/Math.max(dt,.001);vy=(y-previous.y)/Math.max(dt,.001);}sway=mix(sway,clamp(-(heading-oldHeading)/Math.max(dt,.001)*.08,-.35,.35),1-Math.exp(-6*dt));landing=Math.max(0,landing-dt*4);
      updateRig(dt);const resting=!intro&&!jump&&Math.hypot(vx,vy)<25&&still>.25&&legs.every(l=>l.step>=1);quiet=clamp(quiet+dt*(resting?3.2:-6));sleep=clamp(sleep+dt*(resting&&still>8?1/1.6:-5));
      const spinner=world(point(-450,0));if(!intro&&clock-lastAttach>.45&&dist(lastAnchor,spinner)>54){let nearest:V|undefined,distance=70;for(const a of anchors){const d=dist(a,spinner);if(d<distance&&dist(a,lastAnchor)>54){nearest=a;distance=d;}}if(nearest){rope(lastAnchor,nearest);const previous=ropes.slice(0,-1).map(r=>r.a).filter(a=>dist(a,nearest!)<288&&dist(a,nearest!)>45).sort((a,b)=>dist(a,nearest!)-dist(b,nearest!))[0];if(previous)rope(previous,nearest,.7);lastAnchor={...nearest};lastAttach=clock;vibrate(nearest,60,1.2);}}
      updateRopes(dt);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
      const sg=shadow.getContext('2d')!;sg.clearRect(0,0,W,H);sg.save();sg.shadowColor='rgba(8,14,70,.42)';sg.shadowBlur=3.5;sg.shadowOffsetX=7;sg.shadowOffsetY=11;drawSilk(sg,true);sg.restore();sg.globalCompositeOperation='destination-in';sg.drawImage(silhouette,0,0);sg.globalCompositeOperation='source-over';ctx.drawImage(shadow,0,0);
      drawSilk(ctx);drawSpider();drawFly();canvas.dataset.state=sleep>.6?'sleeping':intro?'arriving':jump?'jumping':caught>0?'caught':'following';canvas.dataset.x=x.toFixed(1);canvas.dataset.y=y.toFixed(1);
    }
    raf=requestAnimationFrame(frame);
  };
  resize();document.fonts.ready.then(()=>{if(!disposed)sampleAnchors();});const initialTimer=setTimeout(sampleAnchors,600);raf=requestAnimationFrame(frame);
  return()=>{disposed=true;cancelAnimationFrame(raf);clearTimeout(initialTimer);if(scrollTimer)clearTimeout(scrollTimer);if(holdTimer)clearTimeout(holdTimer);photo.onload=null;listeners.forEach(fn=>fn());ctx.clearRect(0,0,canvas.width,canvas.height);};
}
