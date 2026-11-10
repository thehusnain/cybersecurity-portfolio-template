import gsap from 'gsap';

type Setup=(root:HTMLElement,desktop:boolean)=>void|(()=>void);

function sequence(root:HTMLElement,length:number){
  root.dataset.motionMode='cinematic';
  return gsap.timeline({defaults:{ease:'power2.inOut'},scrollTrigger:{
    id:`chapter-${root.id}`,trigger:root,start:'top top',end:()=>`+=${innerHeight*length}`,
    pin:true,scrub:.65,invalidateOnRefresh:true,
    onUpdate:self=>{root.dataset.motionProgress=self.progress.toFixed(4)},
  }});
}

function focusChapter(root:HTMLElement,tl:gsap.core.Timeline,selector:string,stops:number[]){
  const panels=[...root.querySelectorAll(selector)];
  const focus=(event:FocusEvent)=>{
    // Pointer clicks use the visible scene; keyboard focus brings its record forward.
    if(!(event.target as HTMLElement).matches(':focus-visible'))return;
    const index=panels.findIndex(panel=>panel.contains(event.target as Node)),trigger=tl.scrollTrigger;
    if(index>=0&&trigger)window.dispatchEvent(new CustomEvent('portfolio:scroll-to',{detail:{top:trigger.start+(trigger.end-trigger.start)*stops[index],immediate:true}}));
  };
  root.addEventListener('focusin',focus);
  return()=>{root.removeEventListener('focusin',focus);delete root.dataset.motionMode;delete root.dataset.motionProgress};
}

function flowing(root:HTMLElement,selector:string){
  const panels=[...root.querySelectorAll<HTMLElement>(selector)];
  panels.forEach((panel,i)=>{
    gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:panel,start:'top 96%',end:'bottom 8%',scrub:.6}})
      .fromTo(panel,{xPercent:i%2?24:-24,y:150,rotationY:i%2?-26:26,rotationZ:i%2?8:-8,scale:.76,opacity:.25},{xPercent:0,y:0,rotationY:0,rotationZ:0,scale:1,opacity:1,duration:1.1})
      .to(panel,{y:-45,rotationX:4,duration:.5});
  });
}

export const projectMotion:Setup=(root,desktop)=>{
  if(!desktop){flowing(root,'.project-card');return;}
  const cards=[...root.querySelectorAll<HTMLElement>('.project-card')];
  const fronts=root.querySelectorAll('.project-front'),folds=root.querySelectorAll('.project-fold');
  const tl=sequence(root,3.8);
  tl.from(root.querySelector('.section-head'),{x:-90,opacity:.1,duration:.6},0)
    .from(cards,{x:(i:number)=>(i?1:-1)*innerWidth*.55,y:220,z:-900,rotationX:38,rotationY:(i:number)=>i?-32:32,rotationZ:(i:number)=>i?13:-13,scale:.58,opacity:.05,stagger:.12,duration:1.1},0)
    .to(fronts,{y:-12,z:40,duration:.65},.95)
    .fromTo(folds,{rotationX:-68,y:140,z:-160,opacity:.1},{rotationX:-20,y:65,z:-40,opacity:.9,transformOrigin:'top',duration:.85},.9)
    .from(root.querySelectorAll('.project-tech'),{y:50,opacity:0,duration:.65},1.1)
    .to(fronts,{y:0,z:0,duration:.8},1.8)
    .to(folds,{rotationX:0,y:0,z:0,opacity:1,duration:.8},1.8)
    .from(root.querySelectorAll('.tags span'),{y:25,rotationX:-65,opacity:0,stagger:.045,duration:.5},2)
    .from(root.querySelectorAll('.project-trace'),{scaleX:0,transformOrigin:'left',duration:.9},2)
    .to({},{duration:1.05},2.75)
    .to(cards,{y:(i:number)=>i?18:-18,rotationZ:(i:number)=>i?1:-1,duration:.55},3.75)
    .to(cards,{y:0,rotationZ:0,duration:.5},4.3);
  return focusChapter(root,tl,'.project-card',[.67,.67]);
};

export const internshipMotion:Setup=(root,desktop)=>{
  if(!desktop){flowing(root,'.internship-card');return;}
  const cards=[...root.querySelectorAll<HTMLElement>('.internship-card')],first=cards[0],second=cards[1];
  const tl=sequence(root,4.2);
  gsap.set(first,{zIndex:3});gsap.set(second,{zIndex:2});
  tl.from(root.querySelector('.section-head'),{y:70,opacity:.1,duration:.65},0)
    .fromTo(second,{x:170,y:120,z:-350,rotationZ:12,rotationY:-18,scale:.78,opacity:0},{x:28,y:25,z:-100,rotationZ:5,rotationY:0,scale:.94,opacity:.35,duration:1.1},0)
    .from(first,{x:-120,y:250,z:-650,rotationX:40,rotationZ:-16,scale:.6,opacity:0,duration:1.1},.05)
    .from(first.querySelector('.internship-copy'),{x:-100,opacity:0,duration:.7},.6)
    .from(first.querySelector('.internship-proof'),{x:90,y:100,rotationY:-72,rotationZ:-10,scale:.65,opacity:0,transformOrigin:'left center',duration:1},.55)
    .to({},{duration:.8},1.5)
    .to(first,{xPercent:-120,y:-120,z:-450,rotationY:42,rotationZ:-14,scale:.75,opacity:0,duration:1.1},2.3)
    .to(second,{x:0,y:0,z:0,rotationZ:0,rotationY:0,scale:1,opacity:1,duration:1.1},2.3)
    .from(second.querySelector('.internship-proof'),{x:110,y:80,rotationY:65,rotationZ:12,scale:.7,transformOrigin:'right center',duration:.9},2.65)
    .from(second.querySelector('.internship-copy'),{y:50,opacity:.2,duration:.7},2.8)
    .fromTo(root.querySelector('.ledger-progress'),{scaleX:0},{scaleX:1,transformOrigin:'left',ease:'none',duration:3.2},.45)
    .to({},{duration:1},3.6);
  return focusChapter(root,tl,'.internship-card',[.35,.86]);
};

export const contactMotion:Setup=(root,desktop)=>{
  const panel=root.querySelector<HTMLElement>('.contact-console')!;
  if(!desktop){
    flowing(root,'.contact-console');
    gsap.from(root.querySelectorAll('.contact-reveal'),{x:(i:number)=>i?50:-50,opacity:.1,stagger:.2,scrollTrigger:{trigger:panel,start:'top 85%',end:'clamp(bottom 65%)',scrub:.7}});
    return;
  }
  const tl=sequence(root,3.2);
  tl.from(root.querySelector('.contact-intro'),{x:-70,opacity:0,duration:.7},0)
    .from(panel,{y:210,z:-600,rotationX:32,rotationY:-22,rotationZ:-7,scale:.62,opacity:.35,transformPerspective:1600,duration:1.1},0)
    .from(root.querySelector('.console-bar'),{y:-100,z:120,opacity:.1,duration:1},.3)
    .from(root.querySelector('.console-bottom'),{y:120,z:120,opacity:.1,duration:1},.3)
    .from(root.querySelector('.contact-mail'),{x:-220,y:45,z:180,rotationY:48,opacity:0,duration:1.2},.35)
    .from(root.querySelector('.contact-networks'),{x:220,y:-45,z:180,rotationY:-48,opacity:0,duration:1.2},.35)
    .from(root.querySelectorAll('.contact-networks .social-set>*'),{x:70,opacity:.1,stagger:.11,duration:.5},.95)
    .from(root.querySelector('.contact-address'),{clipPath:'inset(0 100% 0 0)',duration:.8},1.15)
    .fromTo(root.querySelector('.console-scan'),{y:0,opacity:0},{y:()=>panel.offsetHeight-75,opacity:.65,ease:'none',duration:1.3},1.65)
    .from(root.querySelector('.connection-trace'),{strokeDashoffset:100,ease:'none',duration:1.3},1.65)
    .fromTo(root.querySelector('.connection-packet'),{attr:{cx:5}},{attr:{cx:115},ease:'none',duration:1.3},1.65)
    .to(root.querySelector('.console-scan'),{opacity:0,duration:.2},2.95)
    .to({},{duration:.8},3.15);
  return focusChapter(root,tl,'.contact-console',[.85]);
};
