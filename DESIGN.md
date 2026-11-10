# Fsociety portfolio design and motion

## Current direction

One continuous, single-page portfolio with one global navigation. Preserve the original masked and real portraits, supplied evidence and real project/journal destinations. Use the existing dark and red themes. The CTF scene contains only evidence panels: do not reintroduce a flag, pole or decorative flag effects. Do not show brush/drag/press-to-reveal instructions over the portrait.

Keep Ping Me compact and cyber themed. Its heading is 32px on desktop and 28px on mobile; do not restore the oversized headline. Contact uses a terminal panel with a real email link, clipboard actions and social channels. Do not add fictitious availability, server status, security claims, a contact form backend or fabricated metrics.

## Typography and color

Self-hosted MatrixType is the body/control font, using the supplied bold cut to keep its dots readable at small sizes. Alvera Circle is the heading face. Both use regular and bold WOFF2 files. Preserve license notes: MatrixType is labeled Public Domain; Alvera is labeled Demo, so hosting/redistribution rights need confirmation before public distribution.

Dark: background #101111, surface #191a1a, raised #222323, text #faf8f2, secondary #d2cfca, accent #ff8c82. Red: background #250e10, surface #361417, raised #471c20, text #fff5ee, secondary #eed4cd, accent #ffb3a1. Shared text tokens against these theme surfaces have a minimum computed contrast of 7.00:1 in dark and 8.40:1 in red. The certificate and CTF chapters inherit background, surface, border and text colors from the global theme, including red mode.

## Chapter flow

1. Hero: two-line Hello Friends sits behind the original masked portrait. Staggered 900ms entrances use opacity/transform. Pointer brushing, touch and keyboard activation reveal the original real portrait, without generated replacements or recoloring.
2. Certificates: opposing heading lines travel with native scroll while the supplied certificate images follow their continuous 3D ribbon path into a six-item paginated grid. Keep all 17 certificate records and three pages. The small courses/workshops caption is removed.
3. CTFs: the existing certificate canvas recedes into a shared handoff. Ten evidence panels orbit in depth, then settle into their actual HTML gallery positions. No flag, pole, fabric, lighting rig, wind loop or pixel dissolve. Main render pass is ten unlit evidence meshes; colors and aspect ratios stay faithful to the supplied records.
4. Projects: on desktop (at least 900px wide and 620px tall), a pinned workbench deck travels horizontally for 1.8 viewport heights of scroll, with short reading holds at each end. Keyboard focus scrolls the appropriate panel into view. Smaller screens retain stacked panels with perspective motion spanning the full reading pass. Accent traces draw across the panel seams. Keep complete descriptions, technology tags and GitHub links.
5. Internships: a sticky desktop introduction sits beside a vertical ledger. Its progress line draws with scroll; certificates move from below their records to above them with opposing paper rotations throughout the reading pass, rather than completing before entry. On mobile the introduction and records stack naturally. Both evidence dialogs and journal links remain available.
6. Contact: compact intro, terminal chrome, email and social columns, and a small connection trace. The panel settles from a shallow angle. Desktop holds the panel during a scroll-driven scan lasting .9 viewport heights; the scan line traverses the panel and a packet moves across the trace. Smaller screens map this movement to the full panel pass without pinning. Keep the full email address on one line with responsive type sizing. Email opens the user's mail client; email and Discord copy buttons announce successful copying.

The last three chapters share a fine vertical thread and the same theme tokens while keeping distinct layouts and motion. Existing Lenis remains the sole scroll conductor. ScrollTrigger timelines scrub naturally in both directions, without wheel interception or snapping. Contact's entrance end is clamped to maximum scroll, with a separate scan timeline during reading. Keyboard focus completes the relevant reveal immediately.

## Files and lifecycle

`portfolio.tsx` owns page composition, theme navigation, Lenis and shared evidence dialogs. `StorySections.tsx` owns project, internship and contact sections; `story-motion.css` contains their scoped styles. `links.tsx` shares social and project link controls.

Each GSAP scene uses matchMedia and a scoped context, reverting timelines, transforms, triggers and listeners on preference changes or unmount. The static layout is complete before JavaScript runs. Reduced motion skips these timelines and shows all records. Native document flow and aspect ratios determine layout; transforms carry the motion instead of repeatedly animating layout dimensions.

The CTF camera is perspective 40 degrees at z=12. Its canvas begins below the shared navigation at 86px desktop / 70px mobile. DOM image rectangles determine the release targets. DPR caps are 1.5 desktop and 1.25 mobile. Render only on changed state/textures and suspend offscreen or in hidden tabs. Dispose all geometries, materials, textures, observers and RAF callbacks on teardown. WebGL/context failures restore the certificate surface and expose native HTML records.

## Accessibility and verification

All evidence uses focus-managed dialogs with full-size image links. Hidden outgoing controls are inert. Main section links use native anchors; keyboard skip controls bypass the long certificate/CTF sequences. Focus rings use the accent token. Clipboard feedback uses polite live announcements and clears timers on unmount.

Check dark/red themes, 320px, 390px, 768px and desktop widths; no horizontal overflow. Verify forward/reverse scroll transforms, anchors, dynamic reduced-motion changes, evidence dialogs, clipboard actions and mail links. The 2026-11-10 browser review confirmed distinct project/certificate/contact transforms, complete static reduced-motion content, working email/Discord copying, and an internship evidence dialog. All 29 evidence image references resolve, covering 17 certificates, ten CTF events and two internships. Original font/model license files remain with the assets.

The browser tab title is “Husnain | Portfolio”. Verified the email remains one line at 320, 390, 768 and desktop widths without horizontal overflow; project deck translation changes and reverses with scroll, certificate transforms continue during reading, and the contact scan/packet respond to scroll.

## Cinematic chapter revision

Projects, Internships and Contact now use authored spatial sequences in `story-choreography.ts`. At desktop sizes of at least 900×620, project windows arrive from opposite sides/depth, separate their covers and information planes, then unfold and settle during 3.8 viewport heights of scroll. Internships use a 4.2-viewport pinned stack: the first record/certificate unfolds for reading, turns away, and the second record turns forward. Contact assembles its shell, email panel, social panel and chrome from separate 3D planes, reveals the single-line address, then scans during 3.2 viewport heights. Include readable holds and reverse every transition with scroll. Smaller screens use large perspective entrances across the content's full reading pass, retaining natural document flow. Reduced motion removes all pinned scenes and restores complete static records. Keyboard focus brings the appropriate record to a readable scene position.

The user requested removal of the global footer, including its identity, credits and back-to-top links. Keep attribution files with the assets. The hero’s FSOCIETY PK team label links to https://fsocietypk.tech in a new tab.

Visible “View certificates”, “View CTFs” and internship “View certificate” browse labels are removed. Evidence images remain clickable and retain accessible names; keyboard skip controls and certificate pagination remain available. Certificate and CTF surfaces no longer override the selected theme with hardcoded black.
