# Husnain Fiaz — Fsociety portfolio

Five-route React portfolio using Urbanist, GSAP ScrollTrigger, Lenis, and Three.js. Site content lives in `components/portfolio/data.ts`. Styling lives in `app/globals.css`. Downloaded GLB models and licenses are in `public/models`.

## Local development

Use Node.js 22.13 or newer and pnpm. Run `pnpm install`, then `pnpm dev`. Open the local URL printed by the development server. `pnpm build` creates the production build. A Sites deployment configuration is included; deployment requires your own authorised account.

The navbar switches between Dark and Red and remembers the choice on the device. The profile starts with the mask; hover, keyboard focus, or tap reveals Husnain. Scroll scenes are reversible. Reduced-motion preferences show the content without pinned animations. The sourced models use WebGL, with SVG geometry rendering as a fallback when WebGL is unavailable.

## Content notes

Certificates and CTF evidence come from the provided data.zip. Duplicate images were merged. The blank appreciation certificate and Cisco certificate addressed to Husnain Ali were excluded. The Hack4Bug team screenshot contains a team passcode and is excluded from the distributed website. Fourth place at the Ignite workshop is based on Husnain's supplied statement; the certificate itself confirms the workshop and date. The Ramadan event folder says 2025, but its team screenshot says Ramadan CTF 2026; the page labels the scoreboard as archived, not a newly verified final result.

WebRekon and VulnSpectra descriptions and GitHub links were checked against their repository READMEs. No unverified live demos, invented achievements, or numeric counters are used. Discord usernames cannot provide a reliable direct profile URL, so its control copies sheriffsec.

Model attribution is linked in the footer. All certificate images open in an accessible dialog and are available as full-size images.
