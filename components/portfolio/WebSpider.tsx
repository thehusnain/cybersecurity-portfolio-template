'use client';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {Bug,ChevronDown} from 'lucide-react';
import './web-spider.css';
const subscribe=(update:()=>void)=>{window.addEventListener('portfolio:spider-change',update);window.addEventListener('storage',update);const motion=matchMedia('(prefers-reduced-motion: reduce)');motion.addEventListener('change',update);return()=>{window.removeEventListener('portfolio:spider-change',update);window.removeEventListener('storage',update);motion.removeEventListener('change',update);};};
const getEnabled=()=>{const saved=localStorage.getItem('hf-spider');return saved?saved==='on':!matchMedia('(prefers-reduced-motion: reduce)').matches;};
export function WebSpider(){
  const enabled=useSyncExternalStore(subscribe,getEnabled,()=>false),[open,setOpen]=useState(false),ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    let dispose:(()=>void)|undefined,cancelled=false;document.documentElement.classList.toggle('spider-enabled',enabled);
    if(enabled)void import('./web-spider-engine').then(({createWebSpider})=>{if(!cancelled&&ref.current)dispose=createWebSpider(ref.current);});
    return()=>{cancelled=true;dispose?.();document.documentElement.classList.remove('spider-enabled');};
  },[enabled]);
  const toggle=()=>{localStorage.setItem('hf-spider',enabled?'off':'on');window.dispatchEvent(new Event('portfolio:spider-change'));};
  return <>{enabled&&<canvas className="web-spider-canvas" ref={ref} aria-hidden="true"/>}<aside className="spider-tools" data-no-spider><button className="spider-tools-trigger" aria-label="Spider companion settings" aria-expanded={open} aria-controls="spider-settings" onClick={()=>setOpen(!open)}><Bug size={18}/><ChevronDown size={12}/></button>{open&&<div id="spider-settings" className="spider-settings"><strong>A curious companion</strong><button onClick={toggle} aria-pressed={enabled}>Spider <span>{enabled?'On':'Off'}</span></button><button disabled={!enabled} onClick={()=>window.dispatchEvent(new Event('portfolio:clear-web'))}>Clear the web <span>⌫</span></button><p>Move to lead the fly.<br/>Click an empty space to pounce.<br/>Delete clears the silk.</p><p className="spider-touch-help">Double-tap to pounce.<br/>Hold an empty space to clear.</p></div>}</aside></>;
}
