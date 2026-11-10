'use client';
/* eslint-disable @next/next/no-img-element -- Portfolio evidence is already optimized as local WebP assets. */
import {useEffect,useState,useSyncExternalStore} from 'react';
import {ArrowUpRight,ArrowDown,Menu,X} from 'lucide-react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {Switch} from '@/components/ui/switch';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {asset,type Evidence} from './data';
import {PortraitReveal} from './PortraitReveal';
import {WebSpider} from './WebSpider';
import {CertificateRibbon} from './CertificateRibbon';
import {CtfRibbon} from './CtfRibbon';
import {Socials} from './links';
import {ProjectStory,InternshipStory,Contact} from './StorySections';
if(typeof window!=='undefined')gsap.registerPlugin(ScrollTrigger);
export type SceneProgress={open:number;spread:number;ribbon:number;cards:{value:number}[]};
function subscribeTheme(update:()=>void){
  window.addEventListener('storage',update);window.addEventListener('hf-theme-change',update);
  return()=>{window.removeEventListener('storage',update);window.removeEventListener('hf-theme-change',update)};
}
const readTheme=()=>localStorage.getItem('hf-theme')==='red';
const serverTheme=()=>false;
function Navbar(){
  const red=useSyncExternalStore(subscribeTheme,readTheme,serverTheme);
  const[open,setOpen]=useState(false);
  useEffect(()=>{document.documentElement.dataset.theme=red?'red':'dark'},[red]);
  const toggle=(value:boolean)=>{localStorage.setItem('hf-theme',value?'red':'dark');window.dispatchEvent(new Event('hf-theme-change'))};
  const links=[['Home','#home'],['Certificates','#certifications'],['Internships','#internships'],['CTFs','#ctfs'],['Projects','#projects'],['Contact','#contact']];
  return <header className="navbar"><nav className={open?'nav-links open':'nav-links'} aria-label="Main navigation">{links.map(([name,href])=><a key={name} href={href} onClick={()=>setOpen(false)}>{name}</a>)}</nav><div className="nav-controls"><label className="theme-control"><span>{red?'Red':'Dark'}</span><Switch checked={red} onCheckedChange={toggle} aria-label="Red theme" className="theme-switch"/></label><button className="menu-toggle" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X size={22}/>:<Menu size={22}/>}</button></div></header>;
}
function Hero(){
  return <section id="home" className="hero hero-pending" aria-labelledby="hero-title"><noscript><style>{'#home.hero-pending .hero-title-line,#home.hero-pending .portrait-brush,#home.hero-pending .hero-note,#home.hero-pending .hero-bottom{opacity:1}'}</style></noscript><h1 id="hero-title"><span className="hero-title-line">Hello</span><em className="hero-title-line">Friends</em></h1><div className="hero-composition"><p className="hero-note left-note"><span>THE STUDENT</span>I’m a BS Computer Science student, always finding something new to learn.</p><PortraitReveal/><p className="hero-note right-note"><span>THE CURIOSITY</span>I’m into cybersecurity and red teaming, getting a little better every day.</p></div><div className="hero-bottom"><span>CTF PLAYER AT <a className="hero-team-link" href="https://fsocietypk.tech" target="_blank" rel="noopener noreferrer"><b>FSOCIETY PK</b></a></span><a href="#certifications">SCROLL TO EXPLORE <ArrowDown size={17}/></a></div><Socials ticker/><div className="pfp-cursor" aria-hidden="true"/></section>;
}
export function Portfolio(){
  const[evidence,setEvidence]=useState<Evidence|null>(null);
  useEffect(()=>{
    const lenis=matchMedia('(prefers-reduced-motion: reduce)').matches?null:new Lenis({duration:1.1,smoothWheel:true,anchors:true});
    lenis?.on('scroll',ScrollTrigger.update);
    const tick=(t:number)=>lenis?.raf(t*1000);if(lenis)gsap.ticker.add(tick);gsap.ticker.lagSmoothing(0);
    const go=(event:Event)=>{
      const {top,immediate=false}=(event as CustomEvent<{top:number;immediate?:boolean}>).detail;
      if(lenis)lenis.scrollTo(top,{duration:.7,immediate,force:true});
      else window.scrollTo({top,behavior:'instant'});
    };
    window.addEventListener('portfolio:scroll-to',go);
    const lock=(event:Event)=>{if((event as CustomEvent<{locked:boolean}>).detail.locked)lenis?.stop();else lenis?.start();};
    window.addEventListener('portfolio:scroll-lock',lock);
    const refresh=()=>ScrollTrigger.refresh();document.fonts.ready.then(refresh);window.addEventListener('load',refresh);
    return()=>{gsap.ticker.remove(tick);lenis?.destroy();window.removeEventListener('load',refresh);window.removeEventListener('portfolio:scroll-to',go);window.removeEventListener('portfolio:scroll-lock',lock)};
  },[]);
  return <><a className="skip-link" href="#main">Skip to content</a><Navbar/>
    <WebSpider/><main id="main"><Hero/><CertificateRibbon onEvidence={setEvidence}/><CtfRibbon/><ProjectStory/><InternshipStory onEvidence={setEvidence}/><Contact/></main>
    <Dialog open={!!evidence} onOpenChange={open=>{if(!open)setEvidence(null)}}><DialogContent className="evidence-modal" aria-describedby="evidence-description"><DialogTitle>{evidence?.title}</DialogTitle><DialogDescription id="evidence-description">{evidence?.meta}</DialogDescription>{evidence&&<img src={asset(evidence.image)} alt={evidence.title}/>}<a className="text-link" href={evidence?asset(evidence.image):undefined} target="_blank" rel="noopener noreferrer">Open full-size image <ArrowUpRight size={16}/></a></DialogContent></Dialog></>;
}
