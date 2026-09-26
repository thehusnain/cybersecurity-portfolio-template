export const asset=(name:string)=>`/assets/${name}`;
export type Evidence={title:string;image:string;meta:string;description?:string};
export const certificates:Evidence[]=[
{title:'Digital Pakistan Cybersecurity Hackathon',meta:'Ignite Hackathon · September 2026',description:'4th place in the hands-on workshop. Web security, cryptography, penetration testing, and Wi-Fi security.',image:'workshop-certificiate.webp'},
{title:'Certified Cybersecurity Foundations',meta:'Hackviser · July 2026',description:'CORE certification, earned through training modules and practical security exercises.',image:'hackiver-CORE.webp'},
{title:'Introduction to Digital Forensics',meta:'Centri · August 2026',description:'Linux, steganography, archive analysis, and an investigation using a mock disk image.',image:'introduction-to-forensic.webp'},
{title:'Certified Threat Intelligence & Governance Analyst',meta:'Red Team Leaders · February 2026',image:'readteamcertificate.webp'},
{title:'Linux Unhatched',meta:'Cisco Networking Academy · August 2026',image:'linux-unhatched.webp'},
{title:'Networking Basics',meta:'Cisco Networking Academy · June 2026',image:'Networking-Basic-From-CISCO.webp'},
{title:'Pre Security',meta:'TryHackMe · February 2026',image:'presecuirty.webp'},
{title:'CSDF IT Battle',meta:'Center for Cyber Security & Digital Forensics · June 2026',image:'CCSDF_Certificate_CCSDF-2026-IT-CH-190.webp'},
{title:'Cyber Security Fundamentals',meta:'Secure Dev Labs · Webinar participation',image:'webinar.webp'},
{title:'BrunnerCTF 2026',meta:'Fsociety · 212th place',image:'ctfs--brunner-ctf--certificate.webp'},
{title:'boroCTF 2026',meta:'Fsociety · 76th in the Open Division',image:'ctfs--boro-ctf--boroCTF-2026-certificate.webp'},
{title:'Kali Team CTF',meta:'Fsociety · August 2026',image:'ctfs--kali-team-ctf--certificate.webp'},
{title:'SecLeaf Q2 CTF',meta:'Fsociety · May 2026',image:'ctfs--secleaf-ctf--certificate-page-1.webp'},
{title:'TechJam 2026',meta:'Cyber-Sec Society · PAF-IAST',image:'ctfs--techjam-ctf--techjam.webp'},
{title:'Hack4Bug CTF Player',meta:'Hack4Bug · 2026',image:'ctfs--Hack4Bug-ctf--badge-page-1.webp'},
{title:'Summer Internship',meta:'Secured X Wave LLP · July–August 2026',image:'internships--securedxwave--certificate.webp'},
{title:'Ethical Hacking Internship',meta:'Secure Dev Labs · Completion',image:'internships--securedevlabs--secure-dev-labs.webp'}];
export type Ctf=Evidence&{team:string;result:string;gallery?:string[]};
export const ctfs:Ctf[]=[
{title:'Hack4Bug CTF',meta:'2026',team:'Meoww Team',result:'13th place',description:'A team competition covering web challenges, OSINT, and more. Our placement is recorded on the event scoreboard.',image:'ctfs--Hack4Bug-ctf--scoreboard.webp',gallery:['ctfs--Hack4Bug-ctf--badge-page-1.webp']},
{title:'boroCTF',meta:'2026',team:'Fsociety',result:'76th · Open Division',description:'A weekend of cryptography, reverse engineering, and OSINT. The certificate records our Open Division result.',image:'ctfs--boro-ctf--boroCTF-2026-certificate.webp',gallery:['ctfs--boro-ctf--overall-scoreboard.webp','ctfs--boro-ctf--hs-divison-scoreboard.webp']},
{title:'BrunnerCTF',meta:'2026',team:'Fsociety',result:'212th of 1,103 teams',description:'Worked through web challenges with the team, including access control, PHP behavior, and application logic.',image:'ctfs--brunner-ctf--certificate.webp'},
{title:'Kali Team CTF',meta:'2026',team:'Fsociety',result:'Participation',description:'Practised with the team, explored unfamiliar challenges, and learned from each attempt.',image:'ctfs--kali-team-ctf--certificate.webp'},
{title:'UMassCTF',meta:'2026',team:'Fsociety',result:'134th place',description:'Competed as Fsociety. The saved scoreboard documents our result.',image:'ctfs--umass-ctf--scoreboard.webp',gallery:['ctfs--umass-ctf--team.webp']},
{title:'SecLeaf Q2 CTF',meta:'2026',team:'Fsociety',result:'205th place',description:'Participated in the May competition with Fsociety.',image:'ctfs--secleaf-ctf--certificate-page-1.webp',gallery:['ctfs--secleaf-ctf--scoreboard.webp']},
{title:'picoCTF',meta:'2026',team:'Cyber Trio',result:'784th place',description:'Solved challenges with the team and recorded our progress along the way.',image:'ctfs--pico-ctf--scoreboard.webp',gallery:['ctfs--pico-ctf--team.webp','ctfs--pico-ctf--my-performance.webp']},
{title:'Ramadan CTF',meta:'2026 · Archived scoreboard',team:'Cyber Trio',result:'22nd place',description:'An earlier competition with Cyber Trio, documented in the team and scoreboard archive.',image:'ctfs--ramadan-ctf-2025--scoreboard.webp',gallery:['ctfs--ramadan-ctf-2025--team.webp']},
{title:'TechJam CTF',meta:'2026',team:'PAF-IAST',result:'Participation',description:'Took part in the CTF organised by the Cyber-Sec Society at PAF-IAST.',image:'ctfs--techjam-ctf--techjam.webp'}];
export const projects=[
{title:'WebRekon',type:'Reconnaissance',short:'A clearer starting point for web reconnaissance.',description:'A Linux CLI assistant for CTF web reconnaissance. It collects evidence, explains notable findings, keeps investigation notes, and turns the work into a Markdown report.',stack:['Python','Rich','Nmap','FFUF','WhatWeb'],github:'https://github.com/thehusnain/WebRekon'},
{title:'VulnSpectra',type:'Web security',short:'Website security checks, with findings I can understand.',description:'A web security framework for authorised testing. It runs security tools, keeps the raw evidence, and adds AI explanations and remediation guidance to verified findings.',stack:['React','TypeScript','Express','MongoDB'],github:'https://github.com/thehusnain/vuln-spectra'}];
export const internships=[
{title:'Secured X Wave LLP',role:'Cybersecurity summer intern',date:'6 July – 17 August 2026',description:'Worked through networking, Linux, reconnaissance, SOC monitoring, and digital forensics. Built WebRekon and practised investigating evidence in guided labs.',skills:['Reconnaissance','Wazuh SIEM','Digital forensics','Web security'],image:'internships--securedxwave--certificate.webp',github:'https://github.com/thehusnain/SecuredxWave-internship'},
{title:'Secure Dev Labs',role:'Ethical hacking intern',date:'Completed internship',description:'Completed an ethical hacking internship with Secure Dev Labs. The completion certificate is included here.',skills:['Ethical hacking'],image:'internships--securedevlabs--secure-dev-labs.webp',github:'https://github.com/thehusnain/SDL-Internship'}];
