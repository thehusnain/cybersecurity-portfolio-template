'use client';
/* eslint-disable @next/next/no-img-element -- The original transparent persona is the static canvas fallback. */

import {useEffect,useRef} from 'react';
import {asset} from './data';
import './portrait-reveal.css';

type Stamp={x:number;y:number;t:number;lobes:{dx:number;dy:number;r:number}[]};

/** Brush between the two original, unmodified portrait images. */
export function PortraitReveal(){
  const ref=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    const button=ref.current!,hero=button.closest<HTMLElement>('#home')!;
    const figure=button.querySelector<HTMLElement>('.pfp-figure')!;
    const masked=button.querySelector<HTMLImageElement>('.pfp-front')!;
    const portrait=button.querySelector<HTMLImageElement>('.pfp-back')!;
    const canvas=button.querySelector<HTMLCanvasElement>('.pfp-reveal')!;
    const ctx=canvas.getContext('2d');
    const brush=document.createElement('canvas'),buffer=document.createElement('canvas');
    const brushCtx=brush.getContext('2d'),bufferCtx=buffer.getContext('2d');
    const motion=matchMedia('(prefers-reduced-motion: reduce)'),touch=matchMedia('(hover: none), (pointer: coarse)');
    let stopped=false,ready=false,visible=true,pinned=false,dirty=true;
    let reveal=0,target=0,raf=0,last=performance.now(),introStarted=false,W=1,H=1,dpr=1;
    let stamps:Stamp[]=[],previousPoint:{x:number;y:number}|null=null;
    let touchStart:{x:number;y:number}|null=null,dragged=false;
    const life=1100;
    const animations:Animation[]=[];
    const removers:(()=>void)[]=[];
    const listen=(el:EventTarget,type:string,fn:EventListener)=>{el.addEventListener(type,fn);removers.push(()=>el.removeEventListener(type,fn));};
    const sync=()=>{
      target=pinned?1:0;
      if(motion.matches)reveal=target;
      button.setAttribute('aria-pressed',String(target===1));dirty=true;
    };
    const drawSource=(context:CanvasRenderingContext2D,source:HTMLImageElement)=>{
      const sourceW=source.naturalWidth,sourceH=source.naturalHeight;
      const scale=Math.min(canvas.width/sourceW,canvas.height/sourceH);
      const width=sourceW*scale,height=sourceH*scale;
      context.drawImage(source,(canvas.width-width)/2,canvas.height-height,width,height);
    };
    const paint=(now=performance.now())=>{
      if(!ctx||!ready||!brushCtx||!bufferCtx)return;
      brushCtx.setTransform(1,0,0,1,0,0);brushCtx.clearRect(0,0,brush.width,brush.height);
      brushCtx.setTransform(dpr,0,0,dpr,0,0);brushCtx.fillStyle='#000';
      if(reveal>0){brushCtx.globalAlpha=reveal;brushCtx.fillRect(0,0,W,H);brushCtx.globalAlpha=1;}
      for(const stamp of stamps){
        const remaining=1-(now-stamp.t)/life,scale=remaining<.75?Math.max(0,remaining/.75):1;
        for(const lobe of stamp.lobes){brushCtx.beginPath();brushCtx.arc(stamp.x+lobe.dx*scale,stamp.y+lobe.dy*scale,lobe.r*scale**.8,0,Math.PI*2);brushCtx.fill();}
      }
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,canvas.width,canvas.height);drawSource(ctx,masked);
      if(stamps.length||reveal>0){
        ctx.globalCompositeOperation='destination-out';ctx.drawImage(brush,0,0);ctx.globalCompositeOperation='source-over';
        bufferCtx.globalCompositeOperation='source-over';bufferCtx.clearRect(0,0,buffer.width,buffer.height);drawSource(bufferCtx,portrait);
        bufferCtx.globalCompositeOperation='destination-in';bufferCtx.drawImage(brush,0,0);bufferCtx.globalCompositeOperation='source-over';ctx.drawImage(buffer,0,0);
      }
      button.dataset.persona=reveal>.999?'photo':stamps.length?'brush':reveal>.001?'revealing':'mask';
      button.dataset.reveal=reveal.toFixed(4);button.dataset.stamps=String(stamps.length);
    };
    const resize=()=>{
      const rect=figure.getBoundingClientRect();W=rect.width;H=rect.height;dpr=Math.min(devicePixelRatio,2);
      for(const layer of [canvas,brush,buffer]){layer.width=Math.max(1,Math.round(W*dpr));layer.height=Math.max(1,Math.round(H*dpr));}
      stamps=[];previousPoint=null;dirty=true;paint();
    };
    const register=()=>{
      if(ready||!ctx||!brushCtx||!bufferCtx||!masked.naturalWidth||!portrait.naturalWidth)return;
      ready=true;button.classList.add('pfp-ready');button.dataset.ready='true';resize();
    };
    const entrance=()=>{
      if(stopped||introStarted)return;introStarted=true;hero.classList.remove('hero-pending');
      if(motion.matches){hero.dataset.entrance='complete';return;}
      const ease='cubic-bezier(.2,.7,.15,1)';
      const animate=(element:Element|null,from:Keyframe,to:Keyframe,delay:number,duration:number)=>{
        if(element)animations.push(element.animate([from,to],{delay,duration,easing:ease,fill:'backwards'}));
      };
      const lines=hero.querySelectorAll('.hero-title-line');
      lines.forEach((line,i)=>animate(line,{opacity:0,transform:`translate3d(${i===0?'-24px':'24px'},18px,0) scale(.97)`},{opacity:1,transform:'translate3d(0,0,0) scale(1)'},120+i*90,900));
      animate(button,{opacity:0,transform:'translateY(60px)'},{opacity:1,transform:'translateY(0)'},520,1500);
      hero.querySelectorAll('.hero-note').forEach((note,i)=>animate(note,{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'},1000+i*120,1000));
      animate(hero.querySelector('.hero-bottom'),{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'},1300,800);
      hero.dataset.entrance='running';
      void Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(()=>{if(!stopped)hero.dataset.entrance='complete';});
    };
    const decode=(image:HTMLImageElement)=>image.decode().catch(()=>{});
    const failsafe=setTimeout(entrance,3500);
    void Promise.all([decode(masked),decode(portrait),document.fonts.ready]).then(()=>{if(!stopped){register();entrance();}});
    listen(masked,'load',register);listen(portrait,'load',register);
    const addStamp=(x:number,y:number,now:number)=>{
      const radius=Math.max(W,260)*(touch.matches?.15:.12),lobes=[];
      for(let i=0,n=3+Math.floor(Math.random()*3);i<n;i++){
        const angle=Math.random()*Math.PI*2,distance=Math.random()*radius*.45;
        lobes.push({dx:Math.cos(angle)*distance,dy:Math.sin(angle)*distance,r:radius*(.45+Math.random()*.55)});
      }
      stamps.push({x,y,t:now,lobes});if(stamps.length>320)stamps.splice(0,stamps.length-320);dirty=true;
    };
    const move=(event:Event)=>{
      if(!ready||motion.matches)return;
      const e=event as PointerEvent,rect=figure.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
      if(x<0||x>W||y<0||y>H){previousPoint=null;return;}
      const now=performance.now();
      if(e.pointerType==='touch'){
        if(e.type==='pointerdown'){touchStart={x,y};dragged=false;}
        else if(touchStart&&Math.hypot(x-touchStart.x,y-touchStart.y)>8)dragged=true;
      }
      if(previousPoint){
        const dx=x-previousPoint.x,dy=y-previousPoint.y,n=Math.min(40,Math.floor(Math.hypot(dx,dy)/(Math.max(W,260)*.04)));
        for(let i=1;i<=n;i++)addStamp(previousPoint.x+dx*i/(n+1),previousPoint.y+dy*i/(n+1),now);
      }
      addStamp(x,y,now);previousPoint={x,y};
    };
    listen(hero,'pointermove',move);listen(hero,'pointerdown',move);listen(hero,'pointerleave',()=>{previousPoint=null;});
    listen(button,'blur',()=>{pinned=false;sync();});
    listen(button,'click',((event:MouseEvent)=>{if(touch.matches&&dragged&&!motion.matches){dragged=false;return;}if(touch.matches||motion.matches||event.detail===0){pinned=!pinned;sync();}}) as EventListener);
    listen(motion,'change',()=>{if(motion.matches){animations.forEach(a=>a.cancel());entrance();}sync();});listen(touch,'change',sync);
    const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(figure);
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){stamps=[];previousPoint=null;pinned=false;sync();}dirty=true;});observer.observe(button);
    const frame=(now:number)=>{
      const dt=Math.min(.1,(now-last)/1000);last=now;
      if(ready&&visible&&!document.hidden){
        const hadStamps=stamps.length>0;stamps=stamps.filter(stamp=>now-stamp.t<life);
        const next=motion.matches?target:reveal+(target-reveal)*(1-Math.exp(-10*dt));
        if(dirty||hadStamps||Math.abs(target-reveal)>.0001){reveal=Math.abs(next-target)<.0001?target:next;paint(now);dirty=false;}
      }
      raf=requestAnimationFrame(frame);
    };
    sync();register();raf=requestAnimationFrame(frame);
    return()=>{stopped=true;clearTimeout(failsafe);cancelAnimationFrame(raf);resizeObserver.disconnect();observer.disconnect();animations.forEach(a=>a.cancel());removers.forEach(fn=>fn());hero.classList.remove('hero-pending');};
  },[]);

  return <button ref={ref} className="portrait portrait-brush" type="button" aria-label="Reveal the person behind the mask" aria-pressed="false" data-persona="mask">
    <span className="pfp-figure"><img className="pfp-source pfp-front" src={asset('persona-v2.webp')} alt="Masked persona in a black top hat and tuxedo" fetchPriority="high" draggable={false}/><img className="pfp-source pfp-back" src={asset('profile-studio.webp')} alt="" aria-hidden="true" fetchPriority="high" draggable={false}/><canvas className="pfp-reveal" aria-hidden="true"/></span>
  </button>;
}
