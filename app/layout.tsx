import type { Metadata } from 'next';
import './globals.css';
import './fonts.css';
export const metadata:Metadata={title:'Husnain | Portfolio',description:'BS Computer Science student. Cybersecurity, red teaming, and learning through CTFs. Explore my projects, certificates, and internships.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="preload" href="/fonts/alvera/alvera-circle-regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/><link rel="preload" href="/fonts/matrixtype/matrixtype-regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/><link rel="preload" as="image" href="/assets/profile-studio.webp"/><link rel="preload" as="image" href="/assets/persona-v2.webp"/></head><body>{children}</body></html>}
