'use client';

import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {FaGithub,FaInstagram,FaLinkedinIn,FaYoutube,FaDiscord} from 'react-icons/fa';

const social=[
  {name:'GitHub',icon:FaGithub,href:'https://github.com/thehusnain'},
  {name:'Instagram',icon:FaInstagram,href:'https://www.instagram.com/sheiff.offsec/'},
  {name:'LinkedIn',icon:FaLinkedinIn,href:'https://www.linkedin.com/in/thehusnainfiaz/'},
  {name:'YouTube',icon:FaYoutube,href:'https://www.youtube.com/@thephantomdelux'},
];

export function ArrowLink({href,children,external=false}:{href:string;children:React.ReactNode;external?:boolean}){
  return <Link className="arrow-link" href={href} {...(external?{target:'_blank',rel:'noopener noreferrer'}:{})}><span>{children}</span><ArrowUpRight size={19}/></Link>;
}

export function Socials({ticker=false}:{ticker?:boolean}){
  const[copied,setCopied]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
  const copy=async()=>{
    try{
      await navigator.clipboard.writeText('sheriffsec');setCopied(true);
      if(timer.current)clearTimeout(timer.current);
      timer.current=setTimeout(()=>setCopied(false),2500);
    }catch{setCopied(false)}
  };
  const list=(dup=false)=><div className="social-set" aria-hidden={dup||undefined}>
    {social.map(({name,href,icon:Icon})=><a key={name} href={href} target="_blank" rel="noopener noreferrer" tabIndex={dup?-1:undefined}><Icon/><span>{name}</span><ArrowUpRight className="social-arrow" size={13}/></a>)}
    <button onClick={copy} tabIndex={dup?-1:undefined} aria-label="Copy Discord username sheriffsec"><FaDiscord/><span aria-live={dup?undefined:'polite'}>{copied?'Copied sheriffsec':'Discord · sheriffsec'}</span></button>
  </div>;
  return <div className={ticker?'social-ticker':'social-row'}><div className={ticker?'ticker-track':''}>{list()}{ticker&&list(true)}</div></div>;
}
