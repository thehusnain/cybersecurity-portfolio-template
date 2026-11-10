import * as THREE from 'three';
import {asset,ctfs} from './data';

const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const span=(p:number,a:number,b:number)=>clamp((p-a)/(b-a));
const ease=(v:number)=>v*v*(3-2*v);

/** One reversible scene: orbit the event records, then capture them into the gallery. */
export function createCtfCaptureEngine(canvas:HTMLCanvasElement,buttons:HTMLButtonElement[]){
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,100);
  camera.position.z=12;
  let disposed=false,dirty=true,W=1,H=1,vw=1,vh=1,last=-1;
  const loader=new THREE.TextureLoader();
  const nx=16,ny=4;
  const cards=ctfs.map(record=>{
    const geometry=new THREE.PlaneGeometry(1,1,nx,ny);
    (geometry.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    const texture=loader.load(asset(record.image),loaded=>{
      if(disposed){loaded.dispose();return;}
      const image=loaded.image as HTMLImageElement;
      material.uniforms.imageAspect.value=image.width/image.height;material.uniforms.ready.value=1;dirty=true;
    });
    texture.colorSpace=THREE.NoColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;
    const material=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,uniforms:{map:{value:texture},fit:{value:new THREE.Vector2(1,1)},ready:{value:0},alpha:{value:0},imageAspect:{value:1.6},aspect:{value:1.6}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`uniform sampler2D map;uniform vec2 fit;uniform float ready,alpha,aspect;varying vec2 vUv;
        void main(){
          vec2 q=(abs(vUv-.5)-.5)*vec2(aspect,1.)+.018;
          float d=length(max(q,0.))+min(max(q.x,q.y),0.)-.018;
          float a=1.-smoothstep(-fwidth(d),fwidth(d),d);if(a<.01)discard;
          vec2 uv=vUv;if(!gl_FrontFacing)uv.x=1.-uv.x;uv=(uv-.5)*fit+.5;
          float inside=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
          vec3 color=mix(vec3(.045),texture2D(map,clamp(uv,0.,1.)).rgb,inside*ready);
          float edge=smoothstep(-.015,-.002,d);
          gl_FragColor=vec4(mix(color,vec3(.8),edge*.18),a*alpha);
        }`});
    const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
    return {geometry,material,texture,mesh};
  });
  let targets:{x:number;y:number;w:number;h:number}[]=[];
  const resize=()=>{
    W=Math.max(1,canvas.clientWidth);H=Math.max(1,canvas.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio,W<701?1.25:1.5));renderer.setSize(W,H,false);
    camera.aspect=W/Math.max(H,1);camera.updateProjectionMatrix();
    vh=24*Math.tan(THREE.MathUtils.degToRad(20));vw=vh*camera.aspect;
    const rect=canvas.getBoundingClientRect();
    targets=buttons.map(button=>{
      const r=button.querySelector('.ctr-image')!.getBoundingClientRect();
      return {x:((r.left-rect.left+r.width/2)/W-.5)*vw,y:(.5-(r.top-rect.top+r.height/2)/H)*vh,w:Math.max(1,r.width)/W*vw,h:Math.max(1,r.height)/H*vh};
    });
    last=-1;dirty=true;
  };
  const vertex=new THREE.Vector3(),rotation=new THREE.Euler();
  const render=(p:number)=>{
    if(disposed||p===last&&!dirty)return;
    dirty=false;last=p;
    const mobile=W<701;
    const orbit=span(p,.17,.68),open=ease(span(p,.14,.34));
    cards.forEach((card,i)=>{
      const g=targets[i];if(!g)return;
      const q=ease(span(p,.64+i*.009,.84+i*.009));
      const theta=i/cards.length*Math.PI*2-orbit*Math.PI*1.65;
      const ringX=Math.cos(theta)*vw*(mobile?.36:.35);
      const ringY=Math.sin(theta)*vh*.24+(i/(cards.length-1)-.5)*vh*.06;
      const ringZ=Math.sin(theta)*3.7-1.2;
      const cardW=Math.min(vw*(mobile?.3:.17),vh*.26)*mix(.2,1,open),cardH=cardW/1.6;
      const imageAspect=card.material.uniforms.imageAspect.value as number,aspect=mix(1.6,g.w/g.h,q);
      card.material.uniforms.aspect.value=aspect;card.material.uniforms.fit.value.set(imageAspect>aspect?1:aspect/imageAspect,imageAspect>aspect?imageAspect/aspect:1);
      card.material.uniforms.alpha.value=ease(span(p,.15+i*.004,.29+i*.004));
      rotation.set(Math.sin(theta)*.12,-Math.cos(theta)*.35,Math.cos(theta)*.13*(1-q));
      const positions=card.geometry.attributes.position;
      for(let iy=0;iy<=ny;iy++)for(let ix=0;ix<=nx;ix++){
        const u=ix/nx-.5,v=.5-iy/ny,k=iy*(nx+1)+ix;
        vertex.set(u*cardW,v*cardH,Math.sin((u+.5)*Math.PI)*.05).applyEuler(rotation);
        positions.setXYZ(k,mix(vertex.x+ringX,g.x+u*g.w,q),mix(vertex.y+ringY,g.y+v*g.h,q),mix(vertex.z+ringZ,0,q));
      }
      positions.needsUpdate=true;
    });
    renderer.render(scene,camera);canvas.dataset.calls=String(renderer.info.render.calls);canvas.dataset.cards=String(cards.length);
  };
  resize();
  return {resize,render,get dirty(){return dirty;},dispose(){disposed=true;cards.forEach(c=>{c.geometry.dispose();c.material.dispose();c.texture.dispose();});renderer.dispose();}};
}
