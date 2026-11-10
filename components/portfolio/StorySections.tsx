'use client';
/* eslint-disable @next/next/no-img-element -- Certificates are supplied as optimized local evidence images. */
import {useLayoutEffect,useEffect,useRef,useState,type RefObject} from 'react';
import {ArrowUpRight,Copy,Check,Terminal,Mail} from 'lucide-react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {asset,projects,internships,type Evidence} from './data';
import {ArrowLink,Socials} from './links';
import './story-motion.css';
import {projectMotion,internshipMotion,contactMotion} from './story-choreography';

if(typeof window!=='undefined')gsap.registerPlugin(ScrollTrigger);

type SceneSetup=(root:HTMLElement,desktop:boolean)=>void|(()=>void);
function useScene(ref:RefObject<HTMLElement|null>,setup:SceneSetup){
  useLayoutEffect(()=>{
    const media=gsap.matchMedia();
    media.add({motion:'(prefers-reduced-motion: no-preference)',desktop:'(min-width: 900px) and (min-height: 620px)'},context=>{
      if(!context.conditions?.motion)return;
      const ctx=gsap.context(()=>setup(ref.current!,Boolean(context.conditions?.desktop)),ref);
      return()=>ctx.revert();
    });
    return()=>media.revert();
  },[ref,setup]);
}
function SectionHead({kicker,title}:{kicker:string;title:string}){
  return <div className="section-head"><span className="eyebrow">{kicker}</span><h2>{title}</h2></div>;
}
function Thread(){return <div className="chapter-thread" aria-hidden="true"><span/></div>}
export function ProjectStory(){
  const ref=useRef<HTMLElement>(null);useScene(ref,projectMotion);
  return <section id="projects" ref={ref} className="project-story motion-projects" aria-labelledby="projects-title">
    <Thread/><div className="section-head"><span className="eyebrow">THINGS I’M BUILDING</span><h2 id="projects-title">Curiosity, put to work.</h2></div>
    <div className="project-viewport"><div className="project-grid">{projects.map((p,i)=><article key={p.title} className="project-card">
      <div className="project-front"><div className="project-windowbar"><span className="window-lights" aria-hidden="true"><i/><i/><i/></span><span className="eyebrow">{p.type}</span><span className="project-index" aria-hidden="true">0{i+1}</span></div><h3>{p.title}<ArrowUpRight size={25} aria-hidden="true"/></h3><p>{p.short}</p><div className="project-trace" aria-hidden="true"/></div>
      <div className="project-fold"><p>{p.description}</p><div className="project-tech"><span className="eyebrow">BUILT WITH</span><div className="tags">{p.stack.map(x=><span key={x}>{x}</span>)}</div><ArrowLink href={p.github} external>View on GitHub</ArrowLink></div></div>
    </article>)}</div></div>
  </section>;
}

export function InternshipStory({onEvidence}:{onEvidence:(x:Evidence)=>void}){
  const ref=useRef<HTMLElement>(null);useScene(ref,internshipMotion);
  return <section id="internships" ref={ref} className="internship-story motion-internships">
    <Thread/><SectionHead kicker="BEYOND THE CLASSROOM" title="Learning in the field."/>
    <div className="internship-ledger"><div className="ledger-rail" aria-hidden="true"><span className="ledger-progress"/></div>{internships.map((item,i)=><article key={item.title} className="internship-card">
      <span className="ledger-node" aria-hidden="true"/><div className="internship-copy"><span className="eyebrow">0{i+1} / COMPLETED INTERNSHIP</span><h3>{item.title}</h3><p className="internship-role">{item.role}</p><p className="quiet">{item.date}</p><p>{item.description}</p><div className="tags">{item.skills.map(x=><span key={x}>{x}</span>)}</div><ArrowLink href={item.github} external>Read my internship journal</ArrowLink></div>
      <button className="internship-proof" onClick={()=>onEvidence({title:item.title,image:item.image,meta:item.date})}><img src={asset(item.image)} alt={`${item.title} completion certificate`} loading="lazy"/></button>
    </article>)}</div>
  </section>;
}

export function Contact(){
  const ref=useRef<HTMLElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const[copied,setCopied]=useState(false);useScene(ref,contactMotion);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
  const copy=async()=>{
    try{await navigator.clipboard.writeText('husnain.offsec@gmail.com');setCopied(true);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setCopied(false),2500)}
    catch{window.location.href='mailto:husnain.offsec@gmail.com'}
  };
  return <section id="contact" className="contact cyber-contact" ref={ref} aria-labelledby="contact-title">
    <Thread/><div className="contact-intro"><div><span className="eyebrow">LET’S START A CONVERSATION</span><h2 id="contact-title">Ping me<span aria-hidden="true">_</span></h2></div><p>A project, a CTF, or something worth figuring out together?</p></div>
    <div className="contact-dock"><div className="contact-console"><div className="console-scan" aria-hidden="true"/>
      <div className="console-bar"><span><Terminal size={17} aria-hidden="true"/> ~/contact</span><span className="console-protocol">FSOCIETY PK</span></div>
      <div className="console-body"><div className="contact-mail contact-reveal"><span className="eyebrow"><Mail size={13} aria-hidden="true"/> EMAIL</span><a className="contact-address" href="mailto:husnain.offsec@gmail.com">husnain.offsec<span>@gmail.com</span></a><div className="contact-actions"><a className="contact-send" href="mailto:husnain.offsec@gmail.com">Write a message <ArrowUpRight size={17}/></a><button className="contact-copy" onClick={copy} aria-label="Copy email address">{copied?<Check size={16}/>:<Copy size={16}/>}<span aria-live="polite">{copied?'Copied':'Copy email'}</span></button></div></div>
        <div className="contact-networks contact-reveal"><span className="eyebrow">OTHER CHANNELS</span><Socials/></div>
      </div>
      <div className="console-bottom" aria-hidden="true"><span>HUSNAIN FIAZ</span><svg viewBox="0 0 120 16"><path d="M5 8H115"/><path className="connection-trace" d="M5 8H115" pathLength="100"/><circle cx="5" cy="8" r="3"/><circle className="connection-packet" cx="115" cy="8" r="3"/><circle cx="115" cy="8" r="3"/></svg><span>LET’S CONNECT</span></div>
    </div></div>
  </section>;
}
