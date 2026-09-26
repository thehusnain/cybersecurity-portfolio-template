'use client';
import {useEffect,useLayoutEffect,useRef,useState,lazy,Suspense} from 'react';
import Link from 'next/link';
import {ArrowUpRight,ArrowDown,ArrowLeft,Copy,Check,Menu,X} from 'lucide-react';
import {FaGithub,FaInstagram,FaLinkedinIn,FaYoutube,FaDiscord} from 'react-icons/fa';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {Switch} from '@/components/ui/switch';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {asset,certificates,ctfs,projects,internships,type Evidence,type Ctf} from './data';
import {AnimatedBackground} from '@/components/AnimatedBackground';
import {Cinematic3DArchive} from './Cinematic3DArchive';
if(typeof window!=='undefined')gsap.registerPlugin(ScrollTrigger);
const Scene=lazy(()=>import('./scenes'));
export type Page='home'|'certificates'|'ctfs'|'projects'|'internships';
export type SceneProgress={open:number;spread:number;ribbon:number;cards:{value:number}[]};
const social=[{name:'GitHub',icon:FaGithub,href:'https://github.com/thehusnain'},{name:'Instagram',icon:FaInstagram,href:'https://www.instagram.com/sheiff.offsec/'},{name:'LinkedIn',icon:FaLinkedinIn,href:'https://www.linkedin.com/in/thehusnainfiaz/'},{name:'YouTube',icon:FaYoutube,href:'https://www.youtube.com/@thephantomdelux'}];
function ArrowLink({href,children,external=false}:{href:string;children:React.ReactNode;external?:boolean}){return <Link className="arrow-link" href={href} {...(external?{target:'_blank',rel:'noopener noreferrer'}:{})}><span>{children}</span><ArrowUpRight size={19}/></Link>}
function Socials({ticker=false}:{ticker?:boolean}){const[copied,setCopied]=useState(false);const copy=async()=>{try{await navigator.clipboard.writeText('sheriffsec');setCopied(true);setTimeout(()=>setCopied(false),2500)}catch{setCopied(false)}};const list=(dup=false)=><div className="social-set" aria-hidden={dup||undefined}>{social.map(({name,href,icon:Icon})=><a key={name} href={href} target="_blank" rel="noopener noreferrer" tabIndex={dup?-1:undefined}><Icon/><span>{name}</span><ArrowUpRight className="social-arrow" size={13}/></a>)}<button onClick={copy} tabIndex={dup?-1:undefined} aria-label="Copy Discord username sheriffsec"><FaDiscord/><span>{copied?'Copied sheriffsec':'Discord · sheriffsec'}</span></button></div>;return <div className={ticker?'social-ticker':'social-row'}><div className={ticker?'ticker-track':''}>{list()}{ticker&&list(true)}</div></div>}
function Ambient({page}:{page:Page}){return <div className={`ambient ambient-${page}`} aria-hidden="true"><div className="ambient-light"/><div className="ambient-texture"/>{page==='projects'&&<div className="code-drift">reconnaissance<br/>analysis<br/>evidence<br/>remediation</div>}{page==='internships'&&<div className="timeline-drift"/>}</div>}
function Navbar({page}:{page:Page}){const[red,setRed]=useState(false),[open,setOpen]=useState(false);useEffect(()=>{const t=localStorage.getItem('hf-theme')==='red';setRed(t);document.documentElement.dataset.theme=t?'red':'dark'},[]);const toggle=(value:boolean)=>{setRed(value);document.documentElement.dataset.theme=value?'red':'dark';localStorage.setItem('hf-theme',value?'red':'dark')};const links=[['Home','/'],['Certificates','/certificates'],['Internships','/internships'],['CTFs','/ctfs'],['Projects','/projects'],['Contact','/#contact']];return <header className="navbar"><Link className="brand" href="/" aria-label="Husnain Fiaz home">husnain<span>.</span></Link><nav className={open?'nav-links open':'nav-links'} aria-label="Main navigation">{links.map(([name,href])=><Link key={name} href={href} onClick={()=>setOpen(false)} aria-current={(page==='home'?href==='/':href===`/${page}`)?'page':undefined}>{name}</Link>)}</nav><div className="nav-controls"><label className="theme-control"><span>{red?'Red':'Dark'}</span><Switch checked={red} onCheckedChange={toggle} aria-label="Red theme" className="theme-switch"/></label><button className="menu-toggle" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X size={22}/>:<Menu size={22}/>}</button></div></header>}
function Hero(){
  const avatarRef=useRef<HTMLDivElement>(null);
  const[revealed,setRevealed]=useState(false);

  useEffect(()=>{
    if(typeof window==='undefined')return;
    if(window.matchMedia('(hover: none)').matches)return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;

    let targetRotX=0,targetRotY=0;
    let currentRotX=0,currentRotY=0;
    let rafId=0,isRunning=false;

    const tick=()=>{
      const dx=targetRotX-currentRotX;
      const dy=targetRotY-currentRotY;

      currentRotX+=dx*0.08;
      currentRotY+=dy*0.08;

      if(avatarRef.current){
        avatarRef.current.style.transform=`perspective(1000px) rotateX(${currentRotX.toFixed(3)}deg) rotateY(${currentRotY.toFixed(3)}deg)`;
      }

      if(Math.abs(dx)>0.001||Math.abs(dy)>0.001){
        rafId=requestAnimationFrame(tick);
      }else{
        currentRotX=targetRotX;
        currentRotY=targetRotY;
        if(avatarRef.current){
          avatarRef.current.style.transform=`perspective(1000px) rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`;
        }
        isRunning=false;
      }
    };

    const startLoop=()=>{
      if(!isRunning){
        isRunning=true;
        rafId=requestAnimationFrame(tick);
      }
    };

    const onPointerMove=(e:PointerEvent)=>{
      if(e.pointerType==='touch')return;
      const halfW=window.innerWidth/2;
      const halfH=window.innerHeight/2;
      const normX=Math.max(-1,Math.min(1,(e.clientX-halfW)/halfW));
      const normY=Math.max(-1,Math.min(1,(e.clientY-halfH)/halfH));

      targetRotY=normX*8;
      targetRotX=-normY*5;

      startLoop();
    };

    const onPointerLeave=()=>{
      targetRotX=0;
      targetRotY=0;
      startLoop();
    };

    window.addEventListener('pointermove',onPointerMove,{passive:true});
    window.addEventListener('mouseleave',onPointerLeave);

    return()=>{
      window.removeEventListener('pointermove',onPointerMove);
      window.removeEventListener('mouseleave',onPointerLeave);
      if(rafId)cancelAnimationFrame(rafId);
    };
  },[]);

  return <section className="hero" aria-labelledby="hero-title"><div className="hero-topline"><span>HUSNAIN FIAZ</span><span>CYBERSECURITY & RED TEAMING</span></div><h1 id="hero-title">Offensive<br/><em>security.</em></h1><div className="hero-composition"><p className="hero-note left-note"><span>THE STUDENT</span>I’m a BS Computer Science student, always finding something new to learn.</p><button className={`portrait ${revealed?'revealed':''}`} onPointerEnter={e=>{if(e.pointerType!=='touch')setRevealed(true)}} onPointerLeave={()=>setRevealed(false)} onFocus={e=>{if(e.currentTarget.matches(':focus-visible'))setRevealed(true)}} onBlur={()=>setRevealed(false)} onClick={()=>{if(matchMedia('(hover: none)').matches)setRevealed(v=>!v);else setRevealed(true)}} aria-label="Reveal Husnain's profile photo" aria-pressed={revealed}><div ref={avatarRef} className="portrait-avatar" style={{position:'absolute',inset:0,transformStyle:'preserve-3d',transformOrigin:'50% 30%',willChange:'transform'}}><img className="portrait-real" src={asset('profile-studio.webp')} alt="Husnain Fiaz" fetchPriority="high"/><img className="portrait-mask" src={asset('persona-v2.webp')} alt="Fsociety persona" fetchPriority="high"/></div><span className="portrait-hint">{revealed?'HUSNAIN FIAZ':<><span className="hover-label">HOVER TO MEET ME</span><span className="tap-label">TAP TO MEET ME</span></>}<span>↗</span></span></button><p className="hero-note right-note"><span>THE CURIOSITY</span>I’m into cybersecurity and red teaming, getting a little better every day.</p></div><div className="hero-bottom"><span>CTF PLAYER AT <b>FSOCIETY</b></span><a href="#certifications">SCROLL TO EXPLORE <ArrowDown size={17}/></a></div><Socials ticker/></section>;
}
function SectionHead({kicker,title,description}:{kicker:string;title:string;description?:string}){return <div className="section-head"><span className="eyebrow">{kicker}</span><h2>{title}</h2>{description&&<p>{description}</p>}</div>}
function CertificateStory({onEvidence}:{onEvidence:(x:Evidence)=>void}){
  return (
    <section id="certifications" className="plain-story certificate-story">
      <SectionHead kicker="PROOF OF THE WORK" title="Learning, on record." description="From the first fundamentals to hands-on challenges."/>
      <div className="certificate-grid" style={{marginTop:'45px'}}>
        {certificates.slice(0,3).map(c=>(
          <button key={c.title} className="gallery-card" onClick={()=>onEvidence(c)}>
            <div className="gallery-image">
              <img src={asset(c.image)} alt={c.title} loading="lazy"/>
              <span><ArrowUpRight size={24}/></span>
            </div>
            <div className="gallery-copy">
              <span>{c.meta}</span>
              <h2>{c.title}</h2>
              {c.description&&<p>{c.description}</p>}
            </div>
          </button>
        ))}
      </div>
      <div className="scene-footer" style={{marginTop:'45px',paddingTop:'0'}}>
        <ArrowLink href="/certificates">See All Certificates</ArrowLink>
      </div>
    </section>
  );
}
function CtfCard({c,onEvidence}:{c:Ctf;onEvidence:(x:Evidence)=>void}){return <article className="ctf-card"><div className="ctf-meta"><span>{c.team}</span><span>{c.meta}</span></div><h3>{c.title}</h3><p className="result">{c.result}</p><p>{c.description}</p><button className="text-link" onClick={()=>onEvidence(c)}>View result <ArrowUpRight size={17}/></button></article>}
function CtfStory({onEvidence}:{onEvidence:(x:Evidence)=>void}){
  return (
    <section className="plain-story ctf-story">
      <SectionHead kicker="CAPTURE THE FLAG" title="Better, together." description="Different challenges. Shared late nights. I play with Fsociety."/>
      <div className="ctf-story-cards" style={{marginTop:'45px',paddingTop:'0'}}>
        {ctfs.slice(0,3).map(c=>(
          <CtfCard key={c.title} c={c} onEvidence={onEvidence}/>
        ))}
      </div>
      <div className="scene-footer" style={{marginTop:'45px',paddingTop:'0'}}>
        <p className="quiet">A few results from the journey.</p>
        <ArrowLink href="/ctfs">See All CTFs</ArrowLink>
      </div>
    </section>
  );
}
function ProjectCards({animated=false}:{animated?:boolean}){return <div className={`project-grid ${animated?'folding-projects':''}`}>{projects.map(p=><article key={p.title} className="project-card"><div className="project-front"><span className="eyebrow">{p.type}</span><h3>{p.title}<span>↗</span></h3><p>{p.short}</p><div className="project-hinge"/></div><div className="project-fold"><p>{p.description}</p><div className="project-tech"><span className="eyebrow">BUILT WITH</span><div className="tags">{p.stack.map(x=><span key={x}>{x}</span>)}</div><ArrowLink href={p.github} external>View on GitHub</ArrowLink></div></div></article>)}</div>}
function ProjectStory(){const ref=useRef<HTMLElement>(null);useLayoutEffect(()=>{const ctx=gsap.context(()=>{const mm=gsap.matchMedia();mm.add('(prefers-reduced-motion: no-preference)',()=>{gsap.set('.project-fold',{height:0,autoAlpha:0,rotateX:-85,transformOrigin:'top center'});gsap.set('.project-tech',{autoAlpha:0,y:15});gsap.timeline({scrollTrigger:{trigger:ref.current,start:'top top',end:'+=220%',pin:true,scrub:1}}).to('.project-fold',{height:'auto',autoAlpha:1,rotateX:0,duration:1.1,stagger:.1},.25).to('.project-tech',{autoAlpha:1,y:0,duration:.8,stagger:.12},1.5).to({},{duration:1.5}).to('.project-tech',{autoAlpha:0,y:15,duration:.5},3.8).to('.project-fold',{height:0,autoAlpha:0,rotateX:-85,duration:1},4.1)});return()=>mm.revert()},ref);return()=>ctx.revert()},[]);return <section ref={ref} className="story project-story"><SectionHead kicker="THINGS I’M BUILDING" title="Curiosity, put to work."/><ProjectCards animated/><div className="scene-footer"><p className="quiet">Tools that help me ask better questions.</p><ArrowLink href="/projects">See All Projects</ArrowLink></div></section>}
function InternshipCard({item,onEvidence}:{item:typeof internships[number];onEvidence:(x:Evidence)=>void}){return <div className="internship-card"><div className="internship-copy"><span className="eyebrow">COMPLETED INTERNSHIP</span><h3>{item.title}</h3><p className="internship-role">{item.role}</p><p className="quiet">{item.date}</p><p>{item.description}</p><div className="tags">{item.skills.map(x=><span key={x}>{x}</span>)}</div><ArrowLink href={item.github} external>Read my internship journal</ArrowLink></div><button className="internship-proof" onClick={()=>onEvidence({title:item.title,image:item.image,meta:item.date})}><img src={asset(item.image)} alt={`${item.title} completion certificate`} loading="lazy"/><span>View certificate <ArrowUpRight size={17}/></span></button></div>}
function InternshipStory({onEvidence}:{onEvidence:(x:Evidence)=>void}){const ref=useRef<HTMLElement>(null);useLayoutEffect(()=>{const ctx=gsap.context(()=>{const mm=gsap.matchMedia();mm.add('(prefers-reduced-motion: no-preference)',()=>{gsap.fromTo('.internship-card',{rotateY:-9,rotateX:7,y:65},{rotateY:4,rotateX:-2,y:-20,ease:'none',scrollTrigger:{trigger:ref.current,start:'top bottom',end:'bottom top',scrub:1}})});return()=>mm.revert()},ref);return()=>ctx.revert()},[]);return <section ref={ref} className="internship-story"><SectionHead kicker="BEYOND THE CLASSROOM" title="Learning in the field."/><InternshipCard item={internships[0]} onEvidence={onEvidence}/><div className="scene-footer"><p className="quiet">From understanding a tool to using it with care.</p><ArrowLink href="/internships">See All Internships</ArrowLink></div></section>}
function Contact(){const[copied,setCopied]=useState(false);return <section id="contact" className="contact"><span className="eyebrow">LET’S START A CONVERSATION</span><h2>Ping me<span>_</span></h2><p>A project, a CTF, or something worth figuring out together?</p><div className="email-line"><a href="mailto:husnain.offsec@gmail.com">husnain.offsec@gmail.com<ArrowUpRight/></a><button aria-label="Copy email address" onClick={async()=>{try{await navigator.clipboard.writeText('husnain.offsec@gmail.com');setCopied(true);setTimeout(()=>setCopied(false),2500)}catch{window.location.href='mailto:husnain.offsec@gmail.com'}}}>{copied?<Check size={20}/>:<Copy size={20}/>}</button></div><Socials/></section>}
function Archive({page,onEvidence}:{page:Exclude<Page,'home'>;onEvidence:(x:Evidence)=>void}){
  if (page === 'certificates') {
    return <Cinematic3DArchive page="certificates" items={certificates} onEvidence={onEvidence} />;
  }
  if (page === 'ctfs') {
    return <Cinematic3DArchive page="ctfs" items={ctfs} onEvidence={onEvidence} />;
  }
  const copy={projects:['Built from curiosity.','The projects I’m working on and the problems behind them.'],internships:['Experience, in practice.','The places where I put the theory to work.']}[page];return <main className={`archive archive-${page}`}><Link className="back-link" href="/"><ArrowLeft size={16}/> Back home</Link><header className="archive-head"><span className="eyebrow">{page.toUpperCase()}</span><h1>{copy[0]}</h1><p>{copy[1]}</p></header>{page==='projects'&&<ProjectCards/>}{page==='internships'&&<div className="internship-list">{internships.map(item=><InternshipCard item={item} key={item.title} onEvidence={onEvidence}/>)}</div>}</main>}
export function Portfolio({page}:{page:Page}){const[evidence,setEvidence]=useState<Evidence|null>(null),[mounted,setMounted]=useState(false);useEffect(()=>{setMounted(true);if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const lenis=new Lenis({duration:1.1,smoothWheel:true,anchors:true});lenis.on('scroll',ScrollTrigger.update);const tick=(t:number)=>lenis.raf(t*1000);gsap.ticker.add(tick);gsap.ticker.lagSmoothing(0);const refresh=()=>ScrollTrigger.refresh();document.fonts.ready.then(refresh);window.addEventListener('load',refresh);return()=>{gsap.ticker.remove(tick);lenis.destroy();window.removeEventListener('load',refresh)}},[]);return <><AnimatedBackground /><a className="skip-link" href="#main">Skip to content</a><Ambient page={page}/><Navbar page={page}/>{page==='home'?<main id="main"><Hero/>{mounted&&<><CertificateStory onEvidence={setEvidence}/><CtfStory onEvidence={setEvidence}/><ProjectStory/></>}<InternshipStory onEvidence={setEvidence}/><Contact/></main>:<div id="main"><Archive page={page} onEvidence={setEvidence}/></div>}<footer className="footer"><Link href="/">Husnain Fiaz<span> / </span>Fsociety</Link><a href="/models/ATTRIBUTION.md" target="_blank" rel="noopener noreferrer">3D asset credits</a><a href={page==='home'?'#hero-title':'#main'}>Back to top ↑</a></footer><Dialog open={!!evidence} onOpenChange={open=>{if(!open)setEvidence(null)}}><DialogContent className="evidence-modal" aria-describedby="evidence-description"><DialogTitle>{evidence?.title}</DialogTitle><DialogDescription id="evidence-description">{evidence?.meta}</DialogDescription>{evidence&&<img src={asset(evidence.image)} alt={evidence.title}/>}<a className="text-link" href={evidence?asset(evidence.image):undefined} target="_blank" rel="noopener noreferrer">Open full-size image <ArrowUpRight size={16}/></a></DialogContent></Dialog></>}

