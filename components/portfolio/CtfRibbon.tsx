'use client';
/* eslint-disable @next/next/no-img-element -- Evidence is served as optimized local WebP images. */

import {useEffect,useRef,useState} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {asset,ctfs} from './data';
import './ctf-ribbon.css';

const evidenceLabel=(name:string)=>name.includes('hs-divison')?'Division scoreboard':name.includes('scoreboard')?'Scoreboard':name.includes('certificate')?'Certificate':name.includes('badge')?'Badge':name.includes('performance')?'Individual results':name.includes('team')?'Team record':'Event record';

export function CtfRibbon(){
  const rootRef=useRef<HTMLElement>(null);
  const [selected,setSelected]=useState<number|null>(null);
  const [evidenceIndex,setEvidenceIndex]=useState(0);
  const item=selected===null?null:ctfs[selected];
  const images=item?[item.image,...item.gallery??[]]:[];
  const current=images[evidenceIndex]??images[0];

  useEffect(()=>{
    if(selected===null)return;
    document.documentElement.classList.add('ctf-detail-open');
    window.dispatchEvent(new CustomEvent('portfolio:scroll-lock',{detail:{locked:true}}));
    return()=>{document.documentElement.classList.remove('ctf-detail-open');window.dispatchEvent(new CustomEvent('portfolio:scroll-lock',{detail:{locked:false}}));};
  },[selected]);

  useEffect(()=>{
    const root=rootRef.current!,track=root.querySelector<HTMLElement>('.ctr-track')!,stage=root.querySelector<HTMLElement>('.ctr-stage')!;
    const canvas=root.querySelector<HTMLCanvasElement>('.ctr-canvas')!,heading=root.querySelector<HTMLElement>('.ctr-heading')!;
    const grid=root.querySelector<HTMLElement>('.ctr-grid')!,cards=[...root.querySelectorAll<HTMLButtonElement>('.ctr-card')];
    root.style.setProperty('--ctr-rows',String(Math.ceil(cards.length/3)));
    const certificate=document.querySelector<HTMLElement>('#certifications')!;
    const certificateStage=certificate.querySelector<HTMLElement>('.cr-stage')!;
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    const original={transform:certificateStage.style.transform,opacity:certificateStage.style.opacity,pointerEvents:certificateStage.style.pointerEvents,inert:certificate.inert};
    let disposed=false,visible=false,dirty=true,p=0,target=0,raf=0,last=performance.now(),seam=0,range=1;
    let engine:ReturnType<typeof import('./ctf-capture-engine').createCtfCaptureEngine>|undefined;
    const clamp=(v:number)=>Math.max(0,Math.min(1,v));
    const span=(v:number,a:number,b:number)=>clamp((v-a)/(b-a));
    const ease=(v:number)=>v*v*(3-2*v);
    const restore=()=>{Object.assign(certificateStage.style,{transform:original.transform,opacity:original.opacity,pointerEvents:original.pointerEvents});certificate.inert=original.inert;};
    const read=()=>{
      if(scrollY<seam||scrollY>seam+range+innerHeight)restore();
      target=motion.matches||!engine?1:clamp((scrollY-seam)/range);
      const view=stage.getBoundingClientRect();
      if(view.top<76&&view.bottom>innerHeight*.55&&scrollY>=seam)document.body.dataset.portfolioScene='ctfs';
      else if(document.body.dataset.portfolioScene==='ctfs')delete document.body.dataset.portfolioScene;
      dirty=true;
    };
    const measure=()=>{
      seam=scrollY+track.getBoundingClientRect().top;range=Math.max(1,track.offsetHeight-stage.offsetHeight);
      engine?.resize();read();dirty=true;
    };
    const paint=()=>{
      const staticView=motion.matches||!engine;
      const handoff=ease(span(p,0,.21)),gallery=staticView?1:ease(span(p,.88,.94));
      root.classList.toggle('ctr-browsing',gallery>.995);root.dataset.phase=staticView||p>.94?'gallery':p<.22?'handoff':p<.64?'capture':'release';root.dataset.progress=p.toFixed(4);
      root.classList.toggle('ctr-title-settled',staticView||p>.76);
      root.style.setProperty('--ctr-backdrop',String(staticView?1:ease(span(p,.025,.2))));
      root.style.pointerEvents=staticView||target>.02?'auto':'none';
      if(!staticView&&scrollY>=seam&&scrollY<seam+range+innerHeight){
        // Continue the existing certificate canvas in place while the CTF world takes over.
        const travel=Math.min(scrollY-seam,range*.24);
        certificateStage.style.transform=`translate3d(0,${travel}px,0) perspective(1100px) translateZ(${-handoff*800}px) rotateX(${handoff*24}deg) rotateZ(${-handoff*8}deg)`;
        certificateStage.style.opacity=String(1-ease(span(p,.035,.2)));
        certificateStage.style.pointerEvents=p>.01?'none':original.pointerEvents;certificate.inert=p>.01;
      }else restore();
      const mobile=innerWidth<701;
      const titleBack=staticView?1:ease(span(p,.78,.9));
      heading.style.opacity=String(titleBack);
      const settle=staticView?1:ease(span(p,.69,.9));
      heading.style.transform=staticView?'none':`translate3d(0,${settle*((mobile?86:106)-innerHeight*(mobile?.18:.27))}px,0) scale(${1-settle*(mobile?.23:.36)})`;
      grid.style.opacity=String(gallery);grid.inert=gallery<.995;grid.setAttribute('aria-hidden',String(gallery<.995));
      canvas.style.opacity=String(1-gallery);engine?.render(p);root.dataset.ready=staticView?'static':'true';
    };
    const refresh=()=>window.dispatchEvent(new Event('resize'));
    const fallback=()=>{engine?.dispose();engine=undefined;root.classList.remove('ctr-animated');restore();p=target=1;measure();paint();refresh();};
    const preference=()=>{root.classList.toggle('ctr-reduced',motion.matches);restore();measure();p=target;paint();refresh();};
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){read();dirty=true;}},{rootMargin:'600px'});observer.observe(stage);
    window.addEventListener('scroll',read,{passive:true});window.addEventListener('resize',measure,{passive:true});motion.addEventListener('change',preference);
    const contextLost=(event:Event)=>{event.preventDefault();fallback();};canvas.addEventListener('webglcontextlost',contextLost);
    const skip=root.querySelector<HTMLAnchorElement>('.ctr-skip')!;
    const skipAnimation=(event:MouseEvent)=>{event.preventDefault();window.dispatchEvent(new CustomEvent('portfolio:scroll-to',{detail:{top:seam+range*.97,immediate:true}}));};
    skip.addEventListener('click',skipAnimation);
    root.classList.toggle('ctr-reduced',motion.matches);measure();paint();
    void import('./ctf-capture-engine').then(({createCtfCaptureEngine})=>{
      if(disposed)return;
      try{engine=createCtfCaptureEngine(canvas,cards);root.classList.add('ctr-animated');measure();p=target;paint();refresh();}catch{fallback();}
    }).catch(()=>{if(!disposed)fallback();});
    const frame=(now:number)=>{
      const dt=Math.min(.15,(now-last)/1000);last=now;
      if(visible&&!document.hidden){
        const next=p+(target-p)*(1-Math.exp(-10*dt));
        if(dirty||engine?.dirty||Math.abs(target-p)>.0001){p=Math.abs(target-next)<.0001?target:next;paint();dirty=false;}
      }
      raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);document.fonts.ready.then(()=>{if(!disposed)measure();});
    return()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect();engine?.dispose();restore();window.removeEventListener('scroll',read);window.removeEventListener('resize',measure);motion.removeEventListener('change',preference);canvas.removeEventListener('webglcontextlost',contextLost);skip.removeEventListener('click',skipAnimation);if(document.body.dataset.portfolioScene==='ctfs')delete document.body.dataset.portfolioScene;};
  },[]);

  return <section id="ctfs" className="ctf-ribbon" ref={rootRef} aria-labelledby="ctf-ribbon-title">
    <div className="ctr-track"><div className="ctr-stage">
      <div className="ctr-heading"><h2 id="ctf-ribbon-title"><span>Capture</span> <span>the flag.</span></h2></div>
      <canvas className="ctr-canvas" aria-hidden="true"/>
      <a className="ctr-skip" href="#ctf-gallery">Skip to CTF gallery</a>
      <div id="ctf-gallery" className="ctr-grid" aria-label="All CTF events">{ctfs.map((record,i)=><button key={record.title} className="ctr-card" onClick={()=>{setEvidenceIndex(0);setSelected(i);}} aria-label={`View ${record.title}, ${record.result}`}>
        <span className="ctr-image"><img src={asset(record.image)} alt="" loading="lazy" draggable={false}/></span>
        <span className="ctr-card-copy"><span className="ctr-card-title">{record.title}<span aria-hidden="true">↗</span></span><span className="ctr-card-meta">{record.team}<span aria-hidden="true"> · </span>{record.result}</span></span>
      </button>)}</div>
    </div></div>
    <Dialog open={item!==null} onOpenChange={open=>{if(!open)setSelected(null);}}><DialogContent className="evidence-modal ctr-evidence" aria-describedby="ctf-record-description">
      <DialogTitle>{item?.title}</DialogTitle><DialogDescription id="ctf-record-description">{item?.team} · {item?.meta} · {item?.result}</DialogDescription>
      {current&&<img className="ctr-evidence-image" src={asset(current)} alt={`${item?.title} — ${evidenceLabel(current)}`}/>}
      {images.length>1&&<div className="ctr-evidence-choices" role="group" aria-label="Supporting CTF evidence">{images.map((name,i)=><button key={name} aria-pressed={evidenceIndex===i} onClick={()=>setEvidenceIndex(i)}>{evidenceLabel(name)}</button>)}</div>}
      <p className="ctr-evidence-description">{item?.description}</p>
      <a className="text-link" href={current?asset(current):undefined} target="_blank" rel="noopener noreferrer">Open full-size evidence ↗</a>
    </DialogContent></Dialog>
  </section>;
}
