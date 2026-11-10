'use client';
/* eslint-disable @next/next/no-img-element -- Existing local WebP certificates also provide the WebGL fallback. */

import {useEffect,useRef,useState} from 'react';
import type * as Three from 'three';
import {asset,certificates,type Evidence} from './data';
import './certificate-ribbon.css';

const PER_PAGE=6;
const PAGES=Math.ceil(certificates.length/PER_PAGE);
const clamp=(n:number,a=0,b=1)=>Math.min(b,Math.max(a,n));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const span=(p:number,a:number,b:number)=>clamp((p-a)/(b-a));
const out=(t:number)=>1-(1-t)**3;
const smooth=(t:number)=>t*t*(3-2*t);
type GridPose={x:number;y:number;w:number;h:number;vw:number;vh:number;c:number;r:number};
type RibbonCard={i:number;geometry:Three.PlaneGeometry;material:Three.ShaderMaterial;texture:Three.Texture;mesh:Three.Mesh;rect:GridPose|null};

export function CertificateRibbon({onEvidence}:{onEvidence:(item:Evidence)=>void}){
  const rootRef=useRef<HTMLElement>(null);
  const pageRef=useRef(0);
  const [page,setPage]=useState(0);
  const changePage=(direction:number)=>{
    const next=clamp(pageRef.current+direction,0,PAGES-1);
    pageRef.current=next;setPage(next);
  };

  useEffect(()=>{
    const root=rootRef.current!;
    const track=root.querySelector<HTMLElement>('.cr-track')!;
    const stage=root.querySelector<HTMLElement>('.cr-stage')!;
    const canvas=root.querySelector<HTMLCanvasElement>('.cr-canvas')!;
    const line1=root.querySelector<HTMLElement>('.cr-line-one')!;
    const line2=root.querySelector<HTMLElement>('.cr-line-two')!;
    const rule=root.querySelector<HTMLElement>('.cr-rule')!;
    const tooltip=root.querySelector<HTMLElement>('.cr-name')!;
    const hits=[...root.querySelectorAll<HTMLButtonElement>('.cr-grid-hit')];
    const hitGroup=root.querySelector<HTMLElement>('.cr-hit-group')!;
    const intro=[...root.querySelectorAll<HTMLElement>('[data-cr-intro]')];
    const pager=root.querySelector<HTMLElement>('.cr-pager')!;
    const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
    let reduced=reducedQuery.matches;
    let stopped=false,visible=false,dirty=true,p=reduced?1:0,target=p,raf=0;
    let W=1,H=1,asp=1,cols=3,rows=2,tanH=.3153,lastPage=-1;
    let renderer:Three.WebGLRenderer|undefined;
    let cards:RibbonCard[]=[];
    const cleanups:(()=>void)[]=[];
    const listen=(el:EventTarget,type:string,fn:EventListener,options?:AddEventListenerOptions)=>{
      el.addEventListener(type,fn,options);cleanups.push(()=>el.removeEventListener(type,fn,options));
    };
    root.classList.toggle('cr-reduced',reduced);
    const readScroll=()=>{
      const rect=track.getBoundingClientRect();
      target=reduced?1:clamp(-rect.top/Math.max(1,track.offsetHeight-innerHeight));
      if(!root.classList.contains('cr-no-webgl')&&rect.top<=1&&rect.bottom>=innerHeight-1)document.body.dataset.portfolioScene='certificates';
      else if(document.body.dataset.portfolioScene==='certificates')delete document.body.dataset.portfolioScene;
    };
    listen(window,'scroll',readScroll,{passive:true});
    listen(reducedQuery,'change',()=>{
      reduced=reducedQuery.matches;root.classList.toggle('cr-reduced',reduced);readScroll();dirty=true;
    });
    const fallback=()=>{
      root.classList.add('cr-no-webgl');root.dataset.ready='fallback';readScroll();
      window.dispatchEvent(new Event('resize'));
    };
    const skip=()=>{
      const top=scrollY+track.getBoundingClientRect().top;
      window.scrollTo({top:top+Math.max(0,track.offsetHeight-innerHeight)*.9,behavior:'instant'});
      readScroll();
    };
    root.querySelectorAll('[data-cr-skip]').forEach(el=>listen(el,'click',skip));
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)dirty=true;},{rootMargin:'200px'});
    observer.observe(root);readScroll();
    const setup=async()=>{
      const THREE=await import('three');
      if(stopped)return;
      try{
        renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
      }catch{
        fallback();return;
      }
      renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
      const scene=new THREE.Scene();
      const camera=new THREE.PerspectiveCamera(35,1,.1,100);
      const samples=1200,pathP:Three.Vector3[]=[],pathT:Three.Vector3[]=[];
      const points:Three.Vector3[]=[];
      for(let i=0;i<=160;i++){
        const t=i/160,ph=mix(-1.5,Math.PI*2+1.35,t),cs=Math.cos(ph),u=2*t-1;
        const depth=cs>0?7.6+16.4*cs**.9:7.6+2.2*cs;
        const edge=.84+.5*span(.14-t,0,.14)+.8*span(t,.84,1);
        points.push(new THREE.Vector3(edge*Math.sin(ph)*depth*.561,.5*Math.sign(u)*Math.abs(u)**1.4*depth*.63,-depth));
      }
      const path=new THREE.CatmullRomCurve3(points,false,'centripetal');path.arcLengthDivisions=1500;
      const pathLength=path.getLength();
      for(let i=0;i<=samples;i++){pathP.push(path.getPointAt(i/samples));pathT.push(path.getTangentAt(i/samples));}
      const at=(distance:number,position:Three.Vector3,tangent:Three.Vector3)=>{
        const f=clamp(distance/pathLength)*samples,i=Math.min(samples-1,Math.floor(f)),k=f-i;
        position.lerpVectors(pathP[i],pathP[i+1],k);tangent.lerpVectors(pathT[i],pathT[i+1],k).normalize();
      };
      const cardWidth=2.1,cardHeight=1.32,step=2.13,nx=28,ny=3;
      const vertexShader='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
      // The reference's two-sided shader, with a contain fit to preserve every certificate edge.
      const fragmentShader=`uniform sampler2D map;uniform vec2 fit;uniform float aspect,ready,radius;varying vec2 vUv;
        void main(){
          vec2 q=(abs(vUv-.5)-.5)*vec2(aspect,1.)+radius;
          float d=length(max(q,0.))+min(max(q.x,q.y),0.)-radius;
          float px=fwidth(d),a=1.-smoothstep(-px,px,d);if(a<.01)discard;
          vec2 uv=vUv;if(!gl_FrontFacing)uv.x=1.-uv.x;
          vec2 imageUv=(uv-.5)*fit+.5;
          float inside=step(0.,imageUv.x)*step(imageUv.x,1.)*step(0.,imageUv.y)*step(imageUv.y,1.);
          vec3 image=mix(vec3(.91,.90,.87),texture2D(map,clamp(imageUv,0.,1.)).rgb,inside);
          vec3 color=mix(vec3(.075),image,ready);
          float edge=smoothstep(-.012-px,-.012,d);
          gl_FragColor=vec4(mix(color,vec3(1.),edge*.1),a);
        }`;
      const loader=new THREE.TextureLoader();
      cards=certificates.map((item,i)=>{
        const geometry=new THREE.PlaneGeometry(1,1,nx,ny);
        (geometry.attributes.position as Three.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
        const texture=loader.load(asset(item.image),loaded=>{
          if(stopped){loaded.dispose();return;}
          const image=loaded.image as HTMLImageElement,aspect=image.width/image.height,cardAspect=cardWidth/cardHeight;
          material.uniforms.fit.value.set(aspect>cardAspect?1:cardAspect/aspect,aspect>cardAspect?aspect/cardAspect:1);
          material.uniforms.ready.value=1;dirty=true;
        });
        texture.colorSpace=THREE.NoColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;
        const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,transparent:true,side:THREE.DoubleSide,uniforms:{map:{value:texture},fit:{value:new THREE.Vector2(1,1)},aspect:{value:cardWidth/cardHeight},ready:{value:0},radius:{value:.018}}});
        const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
        return {i,geometry,material,texture,mesh,rect:null};
      });
      const grid=(slot:number):GridPose=>{
        const vh=16*tanH,vw=vh*asp,top=asp<.9?90:106,bottom=84,available=Math.max(1,H-top-bottom),pixelWidth=Math.min(W*(cols===3?.74:.88),available*(cardWidth/cardHeight)*cols/rows*.94),gw=pixelWidth/W*vw,gap=gw*.017;
        const w=(gw-gap*(cols-1))/cols,h=w/(cardWidth/cardHeight),gh=h*rows+gap*1.6*(rows-1);
        const c=slot%cols,r=Math.floor(slot/cols);
        return{x:-gw/2+w/2+c*(w+gap),y:gh/2-h/2-r*(h+gap*1.6)+(bottom-top)/H*vh/2,w,h,vw,vh,c,r};
      };
      const resize=()=>{
        W=stage.clientWidth;H=stage.clientHeight;asp=W/H;
        renderer!.setPixelRatio(Math.min(devicePixelRatio,2));renderer!.setSize(W,H,false);
        camera.aspect=asp;camera.fov=asp<16/9?Math.atan(.561/asp)*360/Math.PI:35;camera.updateProjectionMatrix();
        tanH=Math.tan(camera.fov*Math.PI/360);cols=asp<.9?2:3;rows=asp<.9?3:2;
        dirty=true;readScroll();
      };
      listen(window,'resize',resize,{passive:true});resize();
      const position=new THREE.Vector3(),tangent=new THREE.Vector3(),up=new THREE.Vector3(),Y=new THREE.Vector3(0,1,0),vertex=new THREE.Vector3();
      const poseRibbon=(card:RibbonCard,head:number)=>{
        const positions=card.geometry.attributes.position,centre=head-card.i*step;
        for(let iy=0;iy<=ny;iy++)for(let ix=0;ix<=nx;ix++){
          const k=iy*(nx+1)+ix,lu=ix/nx-.5,lv=.5-iy/ny;
          at(centre+lu*cardWidth,position,tangent);up.copy(Y).addScaledVector(tangent,-Y.dot(tangent)).normalize();
          vertex.copy(position).addScaledVector(up,lv*cardHeight);positions.setXYZ(k,vertex.x,vertex.y,vertex.z);
        }
        positions.needsUpdate=true;
      };
      const poseGrid=(card:RibbonCard,slot:number,q:number)=>{
        const g=grid(slot),positions=card.geometry.attributes.position,dx=(g.c-(cols-1)/2)*1.2,dy=g.r<rows/2?1:-1;
        const ox=dx*g.vw*.62*(1-q),oy=dy*g.vh*(g.c===1?.95:.34)*(1-q),tilt=(1-q)*.22*(g.c-1||.5)*dy;
        const cs=Math.cos(tilt),sn=Math.sin(tilt);
        for(let iy=0;iy<=ny;iy++)for(let ix=0;ix<=nx;ix++){
          const k=iy*(nx+1)+ix,x=(ix/nx-.5)*g.w,y=(.5-iy/ny)*g.h;
          positions.setXYZ(k,g.x+ox+x*cs-y*sn,g.y+oy+x*sn+y*cs,-8-(1-q)*.6*Math.sin(ix/nx*Math.PI));
        }
        positions.needsUpdate=true;card.rect=g;
      };
      const render=()=>{
        const rise=1-out(span(p,0,.12)),run=mix(-50,76,span(p,0,.58));
        line1.style.transform=`translate3d(${run}vw,${rise*34}vh,0)`;line2.style.transform=`translate3d(${-run}vw,${rise*34}vh,0)`;
        const introAmount=1-span(p,0,.05);intro.forEach(el=>{el.style.opacity=String(introAmount);});
        pager.style.opacity=String(Math.max(introAmount,span(p,.82,.86)));
        pager.style.visibility=introAmount>0||p>.82?'visible':'hidden';
        rule.style.transform=`scaleX(${smooth(span(p,.72,.86))})`;
        const head=mix(0,pathLength+cards.length*step,span(p,.14,.63));
        for(const card of cards){
          const distance=head-card.i*step,end=pathLength-cardWidth,slot=card.i-pageRef.current*PER_PAGE;
          if(distance<end){card.mesh.visible=distance>cardWidth;card.rect=null;if(card.mesh.visible)poseRibbon(card,head);}
          else if(slot>=0&&slot<PER_PAGE){
            const start=mix(.14,.63,(end+card.i*step)/(pathLength+cards.length*step)),q=out(span(p,start,start+.13));
            card.mesh.visible=q>.001;if(card.mesh.visible)poseGrid(card,slot,q);
          }else{card.mesh.visible=false;card.rect=null;}
        }
        const interactive=p>.86;root.classList.toggle('cr-grid-ready',interactive);hitGroup.inert=!interactive;
        hitGroup.setAttribute('aria-hidden',String(!interactive));
        hits.forEach((button,slot)=>{
          const g=grid(slot);button.style.left=`${(g.x/g.vw+.5)*W}px`;button.style.top=`${(.5-g.y/g.vh)*H}px`;
          button.style.width=`${g.w/g.vw*W}px`;button.style.height=`${g.h/g.vh*H}px`;
        });
        renderer!.render(scene,camera);root.dataset.progress=p.toFixed(4);root.dataset.ready='true';
      };
      listen(stage,'pointermove',((e:PointerEvent)=>{
        if(e.pointerType==='touch')return;
        const button=(e.target as Element).closest<HTMLButtonElement>('.cr-grid-hit');
        const item=button?certificates[pageRef.current*PER_PAGE+Number(button.dataset.slot)]:null;
        tooltip.style.opacity=item&&p>.86?'1':'0';
        if(item){const rect=stage.getBoundingClientRect();tooltip.textContent=item.title;
          tooltip.style.transform=`translate(${clamp(e.clientX-rect.left+14,8,Math.max(8,W-290))}px,${e.clientY-rect.top+16}px)`;}
      }) as EventListener);
      listen(stage,'pointerleave',()=>{tooltip.style.opacity='0';});
      listen(canvas,'webglcontextlost',((e:Event)=>{e.preventDefault();fallback();}) as EventListener);
      const loop=()=>{
        if(stopped)return;
        if(visible&&!root.classList.contains('cr-no-webgl')){
          const old=p;p=reduced?1:p+(target-p)*.09;if(Math.abs(target-p)<.00005)p=target;
          if(dirty||p!==old||lastPage!==pageRef.current){render();dirty=false;lastPage=pageRef.current;}
        }
        raf=requestAnimationFrame(loop);
      };
      readScroll();render();loop();
    };
    setup().catch(()=>{if(!stopped)fallback();});
    return()=>{
      stopped=true;cancelAnimationFrame(raf);observer.disconnect();cleanups.forEach(fn=>fn());
      cards.forEach(c=>{c.geometry.dispose();c.material.dispose();c.texture.dispose();});renderer?.dispose();
      if(document.body.dataset.portfolioScene==='certificates')delete document.body.dataset.portfolioScene;
    };
  },[onEvidence]);

  return <section id="certifications" className="certificate-ribbon" ref={rootRef} aria-label="Certificates and training">
    <div className="cr-track"><div className="cr-stage">
      <h2 className="cr-headline" aria-label="Certificates and training"><span className="cr-line cr-line-one" aria-hidden="true"><span>CERTIFICATES</span></span><span className="cr-line cr-line-two" aria-hidden="true"><span>&amp; TRAINING</span></span></h2>
      <div className="cr-glow" data-cr-intro aria-hidden="true"/><div className="cr-cross" data-cr-intro aria-hidden="true"><i>+</i></div><div className="cr-rule" aria-hidden="true"/>
      <canvas className="cr-canvas" aria-hidden="true"/>
      <div className="cr-hit-group" aria-label="Certificate grid" aria-hidden="true">{Array.from({length:PER_PAGE},(_,slot)=>{
        const item=certificates[page*PER_PAGE+slot];
        return <button key={slot} className="cr-grid-hit" data-slot={slot} hidden={!item} onClick={()=>item&&onEvidence(item)} aria-label={item?`View ${item.title}`:undefined}><span className="cr-accessible">{item?.title}. {item?.meta}</span></button>;
      })}</div>
      <footer className="cr-bottom"><div className="cr-pager" aria-label="Certificate pages"><button onClick={()=>changePage(-1)} disabled={page===0} aria-label="Previous certificate page">←</button><button onClick={()=>changePage(1)} disabled={page===PAGES-1} aria-label="Next certificate page">→</button></div><div className="cr-categories"><span className="cr-page-status" aria-live="polite">{String(page*PER_PAGE+1).padStart(2,'0')}—{String(Math.min((page+1)*PER_PAGE,certificates.length)).padStart(2,'0')} / {certificates.length} CERTIFICATES</span></div></footer>
      <button className="cr-skip" data-cr-skip>Skip animation and browse certificates</button><div className="cr-name" aria-hidden="true"/>
      <div className="cr-fallback"><h2>Certificates, on record.</h2><div className="cr-fallback-grid">{certificates.map(item=><button key={item.title} onClick={()=>onEvidence(item)}><img src={asset(item.image)} alt={item.title} loading="lazy"/><span>{item.title}</span></button>)}</div></div>
    </div></div>
  </section>;
}
