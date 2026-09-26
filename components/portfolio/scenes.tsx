'use client';

import {useEffect,useRef,type RefObject} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {SVGRenderer} from 'three/examples/jsm/renderers/SVGRenderer.js';
import type {SceneProgress} from './portfolio';

type Props={kind:'envelope'|'flags';progress:RefObject<SceneProgress>};
type AnimatedMesh=THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>;

const clamp=(value:number)=>THREE.MathUtils.clamp(value,0,1);
const smoothstep=(value:number)=>{const t=clamp(value);return t*t*(3-2*t)};
const damp=(current:number,target:number,lambda:number,delta:number)=>THREE.MathUtils.damp(current,target,lambda,delta);

function copyModel(source:THREE.Group){
  const clone=source.clone(true);
  clone.traverse(object=>{
    if(object instanceof THREE.Mesh){
      object.geometry=object.geometry.clone();
      object.frustumCulled=false;
    }
  });
  return clone;
}

function makeEnvelope(source:THREE.Group,ribbonSource:THREE.Group,camera:THREE.PerspectiveCamera){
  const group=new THREE.Group();
  const body=copyModel(source);
  const flapMeshes:AnimatedMesh[]=[];
  body.quaternion.set(.5,.5,.5,.5);
  body.scale.setScalar(1);
  body.traverse(object=>{
    if(object instanceof THREE.Mesh){
      object.material=new THREE.MeshStandardMaterial({
        color:'#a99a82',
        roughness:.92,
        metalness:0,
        side:THREE.DoubleSide
      });
      object.userData.originalPositions=new Float32Array(object.geometry.attributes.position.array);
      flapMeshes.push(object as AnimatedMesh);
    }
  });
  body.updateMatrixWorld(true);
  const bodyBounds=new THREE.Box3().setFromObject(body);
  group.position.copy(bodyBounds.getCenter(new THREE.Vector3()).negate());
  group.add(body);
  group.rotation.x=-.1;

  const ribbon=copyModel(ribbonSource);
  const ribbonBounds=new THREE.Box3().setFromObject(ribbon);
  const ribbonScale=1.65/ribbonBounds.getSize(new THREE.Vector3()).y;
  ribbon.scale.setScalar(ribbonScale);
  ribbon.position.copy(ribbonBounds.getCenter(new THREE.Vector3()).multiplyScalar(-ribbonScale));
  ribbon.traverse(object=>{
    if(object instanceof THREE.Mesh){
      object.material=new THREE.MeshStandardMaterial({
        color:object.name.startsWith('Sphere')?'#c2ad83':'#89413c',
        roughness:.72,
        metalness:.02,
        side:THREE.DoubleSide,
        transparent:true
      });
    }
  });
  const ribbonAnchor=new THREE.Group();
  ribbonAnchor.position.set(0,-.08,.62);
  ribbonAnchor.add(ribbon);
  group.add(ribbonAnchor);

  let lastOpen=-1;
  let visualOpen=0;
  let visualRibbon=0;
  const update=(progress:SceneProgress,time:number,delta:number)=>{
    visualOpen=damp(visualOpen,progress.open,9,delta);
    visualRibbon=damp(visualRibbon,progress.ribbon,9,delta);
    const opening=smoothstep(visualOpen);
    const release=smoothstep(visualRibbon);
    if(Math.abs(lastOpen-opening)>.00015){
      const angle=THREE.MathUtils.lerp(THREE.MathUtils.degToRad(166),THREE.MathUtils.degToRad(12),opening);
      for(const mesh of flapMeshes){
        const positions=mesh.geometry.attributes.position;
        const original=mesh.userData.originalPositions as Float32Array;
        for(let i=0;i<positions.count;i++){
          const x=original[i*3],y=original[i*3+1];
          if(x>2.5121){
            const dx=x-2.512056;
            positions.setXYZ(i,2.512056+Math.cos(angle)*dx-Math.sin(angle)*y,Math.sin(angle)*dx+Math.cos(angle)*y,original[i*3+2]);
          }
        }
        positions.needsUpdate=true;
        mesh.geometry.computeVertexNormals();
      }
      lastOpen=opening;
    }

    const ribbonTravel=smoothstep((release-.08)/.92);
    ribbonAnchor.position.set(
      5.2*ribbonTravel,
      -.08+2.25*ribbonTravel+Math.sin(ribbonTravel*Math.PI)*.45,
      .62+1.3*ribbonTravel
    );
    ribbonAnchor.rotation.set(ribbonTravel*1.2,ribbonTravel*3.6,-ribbonTravel*.85);
    const opacity=1-smoothstep((ribbonTravel-.5)/.3);
    ribbonAnchor.visible=opacity>.001;
    ribbon.traverse(object=>{
      if(object instanceof THREE.Mesh){
        const material=object.material as THREE.MeshStandardMaterial;
        material.opacity=opacity;
        material.depthWrite=opacity>.9;
      }
    });
    group.rotation.y=.018+Math.sin(time*.3)*.012+opening*.035;
    group.rotation.x=-.1+opening*.035;

    const cardProgress=Math.max(...progress.cards.map(card=>card.value));
    const reveal=smoothstep(cardProgress);
    const desiredPosition=new THREE.Vector3(
      -Math.sin(release*Math.PI)*1.15+Math.sin(opening*.9)*1.55-reveal*.95,
      .15+opening*1.05-reveal*.85,
      14.2-opening*1.6+reveal*1.4
    );
    const desiredTarget=new THREE.Vector3(0,opening*-.2+reveal*.2,0);
    camera.position.lerp(desiredPosition,1-Math.exp(-7*delta));
    camera.lookAt(desiredTarget);
  };
  return{group,update};
}

function makeFlag(source:THREE.Group,index:number){
  const group=new THREE.Group();
  const model=copyModel(source);
  model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model);
  const scale=6.4/box.getSize(new THREE.Vector3()).y;
  const center=box.getCenter(new THREE.Vector3());
  const scaling=new THREE.Group();
  const offset=new THREE.Group();
  scaling.scale.setScalar(scale);
  offset.position.copy(center.negate());
  offset.add(model);
  scaling.add(offset);
  group.add(scaling);
  const cloth:AnimatedMesh[]=[];
  model.traverse(object=>{
    if(object instanceof THREE.Mesh){
      const material=object.material as THREE.MeshStandardMaterial;
      if(material.name==='LightRed'){
        object.userData.originalPositions=new Float32Array(object.geometry.attributes.position.array);
        cloth.push(object as AnimatedMesh);
        object.material=new THREE.MeshStandardMaterial({color:'#ab493f',roughness:.88,side:THREE.DoubleSide});
      }else{
        object.material=new THREE.MeshStandardMaterial({color:'#8f8170',metalness:.7,roughness:.45,side:THREE.DoubleSide});
      }
    }
  });
  const target=new THREE.Color();
  const update=(spread:number,time:number,reduced:boolean,red:boolean)=>{
    const side=index-1;
    group.visible=index===1||spread>.02;
    group.scale.setScalar(index===1?1-spread*.64:spread*.36);
    group.position.set(side*4.2*spread,.4+spread*.7,0);
    group.rotation.y=-.3+(reduced?0:Math.sin(time*.32+index)*.1);
    group.rotation.z=side*spread*-.035;
    for(const mesh of cloth){
      mesh.material.color.lerp(target.set(red?'#d27463':'#ab493f'),.035);
      const positions=mesh.geometry.attributes.position;
      const original=mesh.userData.originalPositions as Float32Array;
      for(let i=0;i<positions.count;i++){
        const x=original[i*3],z=original[i*3+2],weight=THREE.MathUtils.clamp((x-.0008)/.0188,0,1);
        positions.setY(i,original[i*3+1]+Math.sin(x*420+z*160-(reduced?0:time)*2.5+index*.4)*.0011*weight);
      }
      positions.needsUpdate=true;
      mesh.geometry.computeVertexNormals();
    }
  };
  return{group,update};
}

export default function Scene({kind,progress}:Props){
  const host=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const element=host.current;
    if(!element)return;
    let disposed=false;
    let visible=false;
    let raf=0;
    let previousFrame=0;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(36,1,.1,100);
    camera.position.z=14.2;
    scene.add(new THREE.HemisphereLight('#fff9ef','#594941',1.15));
    const key=new THREE.DirectionalLight('#fffaf0',2.1);
    key.position.set(-3,7,9);
    scene.add(key);
    const fill=new THREE.DirectionalLight('#f1cbb0',.65);
    fill.position.set(5,1,5);
    scene.add(fill);
    const rim=new THREE.DirectionalLight('#d8b1a1',.75);
    rim.position.set(-4,-2,-3);
    scene.add(rim);

    const canvas=document.createElement('canvas');
    let renderer:THREE.WebGLRenderer|SVGRenderer;
    try{
      const context=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});
      if(context){
        const webgl=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true,powerPreference:'low-power'});
        webgl.outputColorSpace=THREE.SRGBColorSpace;
        webgl.toneMapping=THREE.ACESFilmicToneMapping;
        webgl.toneMappingExposure=1.08;
        webgl.setPixelRatio(Math.min(devicePixelRatio,1.5));
        webgl.setClearColor(0x000000,0);
        renderer=webgl;
      }else{
        renderer=new SVGRenderer();
        renderer.setQuality('high');
        element.dataset.renderer='svg';
      }
    }catch{
      renderer=new SVGRenderer();
      renderer.setQuality('high');
      element.dataset.renderer='svg';
    }
    renderer.domElement.style.background='transparent';
    element.appendChild(renderer.domElement);

    const resize=()=>{
      const{width,height}=element.getBoundingClientRect();
      if(!width||!height)return;
      camera.aspect=width/height;
      camera.updateProjectionMatrix();
      renderer.setSize(width,height);
    };
    const observer=new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting},{rootMargin:'100px'});
    intersection.observe(element);

    const loader=new GLTFLoader();
    let update:(time:number,delta:number)=>void=()=>{};
    Promise.all((kind==='envelope'?['/models/envelope.glb','/models/ribbon.glb']:['/models/flag.glb']).map(file=>loader.loadAsync(file)))
      .then(models=>{
        if(disposed)return;
        if(kind==='envelope'){
          const item=makeEnvelope(models[0].scene,models[1].scene,camera);
          scene.add(item.group);
          update=(time,delta)=>item.update(progress.current,time,delta);
        }else{
          const items=[0,1,2].map(index=>makeFlag(models[0].scene,index));
          items.forEach(item=>scene.add(item.group));
          update=time=>items.forEach(item=>item.update(progress.current.spread,time,reduced,document.documentElement.dataset.theme==='red'));
        }
      })
      .catch(()=>{element.dataset.modelError='true'});

    const animate=(time:number)=>{
      if(disposed)return;
      raf=requestAnimationFrame(animate);
      if(!visible||document.hidden){previousFrame=0;return}
      if(previousFrame&&time-previousFrame<1000/60)return;
      const delta=previousFrame?Math.min((time-previousFrame)/1000,1/30):1/60;
      previousFrame=time;
      update(time/1000,delta);
      renderer.render(scene,camera);
    };
    raf=requestAnimationFrame(animate);
    return()=>{
      disposed=true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      scene.traverse(object=>{
        if(object instanceof THREE.Mesh){
          object.geometry.dispose();
          (Array.isArray(object.material)?object.material:[object.material]).forEach(material=>material.dispose());
        }
      });
      if(renderer instanceof THREE.WebGLRenderer)renderer.dispose();
      renderer.domElement.remove();
    };
  },[kind,progress]);
  return <div className="canvas-host" ref={host} aria-hidden="true"/>;
}
