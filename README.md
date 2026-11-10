# Husnain Fiaz — Fsociety portfolio

A single-page cybersecurity portfolio built with Next.js 16, React 19, TypeScript, GSAP ScrollTrigger, Lenis and Three.js. Includes certificates, CTF evidence, projects, internships and contact links, with dark and red themes.

## Run locally

Use Node.js 22.13 or newer and the pnpm version pinned in `package.json` (11.25.0).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. The portfolio needs no environment variables, database or authentication service. Optional starter database/authentication utilities are not used by the page.

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

`pnpm build` creates `.next`; `pnpm start` serves the production build. `vercel.json` contains the Next.js deployment configuration. The additional Sites/vinext scripts are optional; normal development and production use Next.js.

## Content and motion

- Edit `components/portfolio/data.ts` for certificates, CTF events, internships and projects.
- `components/portfolio/portfolio.tsx` composes the page and shared navigation.
- `StorySections.tsx` contains project, internship and contact sections. `story-choreography.ts` authors their pinned spatial sequences; `story-motion.css` styles the workbench, record stack and compact contact console.
- The certificate ribbon and CTF evidence orbit use Three.js. The CTF scene contains evidence cards only, without a decorative flag.
- The portrait preserves both original images. Pointer movement, touch and keyboard controls reveal the real portrait.
- Scroll motion reverses naturally. Reduced motion shows complete static content; WebGL failures expose HTML evidence galleries.
- Contact opens an email client or copies the email/Discord username. There is no contact form backend.

Fonts, images and evidence are self-hosted under `public/`. Keep font/model license and attribution files with their assets. MatrixType's supplied license is marked Public Domain; Alvera Circle's supplied license is marked Demo. Confirm the Alvera license permits your intended hosting and redistribution before publishing those font files. No repository-wide license is implied for personal evidence or third-party assets.

## Before pushing

```sh
git status --short
git diff --check
git add -A
git diff --cached --stat
git commit -m "Update portfolio layout, motion and evidence"
git push origin main
```

Review the staged changes before committing. `.env.local`, dependency folders, build outputs, browser logs, TypeScript caches and local design prompts are ignored. An older commit tracked `.env`; the current change removes it while retaining the local settings in ignored `.env.local`. Removing a file in a new commit does not remove its previous versions from Git history. Replace any credentials from that file that are still in use before publishing.

All 17 certificate records and 10 CTF events use local evidence images. The Hack4Bug team screenshot containing a team passcode is excluded. The Ramadan CTF result is labeled as an archived scoreboard. Social links and project/journal links use the supplied destinations; Discord copies `sheriffsec`.
