import type { Metadata } from 'next';
import '@fontsource-variable/urbanist';
import './globals.css';
export const metadata:Metadata={title:'Husnain Fiaz — Cybersecurity & Fsociety',description:'BS Computer Science student. Cybersecurity, red teaming, and learning through CTFs. Explore my projects, certificates, and internships.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
