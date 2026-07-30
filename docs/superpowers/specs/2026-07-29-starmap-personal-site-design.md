# Starmap Personal Site — Design Spec

**Date:** 2026-07-29
**Status:** Approved design, pending implementation plan

## Vision

A personal website presented as a Destiny 2-style "Director" starmap: a non-linear
3D scene where each planet is a content category. Selecting a planet flies the
camera to its surface, where glowing city markers represent subcategories.
Clicking a city opens a sci-fi HUD panel containing the actual content. The
visitor never leaves the scene.

**Audiences:** recruiters/professional contacts (need fast paths to substance)
and curious visitors (rewarded for exploring).

## Destination Map

| Planet | Cities (subcategories) | Content |
|--------|------------------------|---------|
| Education | — (single panel) | Degrees, certifications |
| Professional | Work, Personal Ventures, Projects | Chronological entries per city |
| Hobbies | One city per sport/hobby | One panel per hobby |
| Blog | One city per topic (derived from post frontmatter) | Post lists → reading panel |
| The Tower (space station) | Live Feed | "Coming soon" panel in v1; realtime personal feed later |

**The Tower** is rendered as a space station, not a planet — echoing Destiny's
social hub. In v1 its Live Feed city opens a themed "transmission offline —
coming soon" panel; the feed itself (shape TBD: personal status/photo feed vs.
guestbook) gets its own design cycle later and will require a backend.

**About** and **Contact** are not planets: they live in a persistent HUD
(emblem/avatar icon → About panel; transmission icon → Contact panel with
email/GitHub/LinkedIn). The About panel is tabbed: **About / Now / Uses** —
who I am, what I'm up to right now, and my dev setup/tools. A **Colophon**
(how this site was built) is not a structural element: it ships as a content
entry ("This Website") in the Professional planet's Projects city.

A **Destinations index** (list icon in HUD) is the escape hatch: a themed text
index of every planet, city, and post — fast path for recruiters, full fallback
for screen readers and no-WebGL browsers.

## Architecture & Tech Stack

- **Framework:** Next.js (App Router, static export), TypeScript. Hosted on
  Vercel, deploy on push to `main`.
- **3D:** React Three Fiber + drei, custom GLSL shaders for planet
  surfaces/atmospheres, `@react-three/postprocessing` for bloom.
- **HUD/panels:** React DOM layered over the canvas, animated with Framer
  Motion. All content is real HTML — readable, selectable, crawlable. No text
  rendered in WebGL.
- **Content:** MDX files in `content/`, compiled at build time. Frontmatter
  validated with Zod; invalid content fails the build, never the live site.
- **State:** URL is the source of truth:
  - `/` — starmap (Director)
  - `/professional` — orbiting the Professional planet
  - `/professional/work` — Work city panel open
  - `/blog/<topic>` — topic post list; `/blog/<topic>/<slug>` — reading a post
  - `/tower` — approaching the Tower station; `/tower/feed` — Live Feed panel
    ("coming soon" in v1)
  - Browser back = fly back out; every view is deep-linkable.
- A small Zustand store holds transient scene state only (camera animation
  progress, hover). Navigation pushes routes; the scene reacts.
- The 3D scene mounts once in the root layout and never unmounts; route changes
  only retarget the camera and toggle panels.
- Planets/cities/colors/orbital positions live in one typed
  `src/config/destinations.ts`. Adding a planet = config entry + content folder.

## Scene & UX Design

**Art style:** stylized sci-fi — shader-driven planets with glowing atmospheres
and a distinct color identity per category:

- Education: cool blue, gyroscope-like orbiting ring
- Professional: amber city-grid glow
- Hobbies: vivid green/teal, dynamic weather bands
- Blog: violet, pulsing signal waves
- The Tower: white/silver space station (distinct silhouette — stylized station
  geometry with running lights, not a planet shader)

**Director (`/`):** ambient starfield + subtle nebula haze; 4 planets plus the
Tower station in a loose non-linear orbital spread; slow idle camera drift. Hover raises a
Destiny-style nameplate (name + one-line descriptor); click flies the camera in
(~1.5s eased).

**Destination view (`/planet`):** planet fills ~60% of viewport as a rotating,
draggable globe. Cities are glowing markers with nameplates on the visible
hemisphere. "Back to orbit" control, Esc, or browser back flies out. Planets
with no cities (Education) open their content panel automatically on arrival —
the fly-in and panel slide-in play as one continuous transition.

**City panel (`/planet/city`):** HUD panel slides in from the right (~45% width
desktop, full-screen sheet mobile); planet stays visible behind it. Scrollable.
Themed typography for headings/chrome, but body text is real readable prose.
Blog flow: topic city → post list → post in the same panel with a back link.

**Tower view (`/tower`):** the station replaces the globe treatment — camera
holds a slight orbit around the station; its single Live Feed marker sits on
the hull. Same interaction model as planets otherwise.

**Persistent HUD:** emblem (About panel, tabbed About / Now / Uses),
transmission icon (Contact), destinations index icon. Available from every
view.

**Mobile:** same full 3D experience; drag to orbit, tap to select. Device-tier
detection scales particle counts and texture sizes and disables bloom on weak
GPUs.

**Accessibility:** fully keyboard-navigable (planets/cities focusable, Enter
selects, Esc backs out); `prefers-reduced-motion` replaces camera flights with
quick fades; destinations index exposes all content as plain links.

## Content Model

```
content/
  education/        # one .mdx per entry
  professional/
    work/           # one .mdx per role
    ventures/       # one .mdx per personal venture
    projects/       # one .mdx per project
  hobbies/          # one .mdx per sport/hobby (the "cities")
  blog/             # one .mdx per post
  about.mdx
  now.mdx           # About panel "Now" tab — edit + push to update
  uses.mdx          # About panel "Uses" tab — dev setup, tools, stack
  contact.mdx
src/config/destinations.ts
```

**Frontmatter (Zod-validated):** common — `title`, `summary`, `date`, `draft`;
blog adds `topic`; work adds `org`, `role`, `period`; projects add `links`.

- Blog topic cities are derived from the union of post `topic` values — no
  separate registry.
- Hobby city markers are placed deterministically (slug hash → lat/long) with
  an optional frontmatter override.
- `draft: true` content is excluded from builds.
- Adding content = adding a file.

## Error Handling

- **No WebGL:** detect up front; serve the destinations index as a full themed
  fallback site with a notice.
- **WebGL context lost:** attempt one recovery, then fall back to index.
- **Build-time:** Zod frontmatter errors and broken internal links fail the
  build, naming the offending file.
- **Runtime:** error boundary around the canvas (scene crash → index UI, not a
  white screen); separate boundary around panels (a bad post cannot take down
  the scene).

## Performance

- Lazy-load the 3D bundle behind a themed loading screen ("Establishing
  transmission…"); keep initial JS lean.
- Targets: 60fps desktop, 30fps+ mobile.
- Static export: content is served as prerendered HTML.

## Testing

- **Unit (Vitest):** content pipeline (frontmatter parse/validation, topic
  derivation, slug→lat/long placement), destinations config integrity, utils.
- **Integration (Vitest + Testing Library):** URL→state mapping opens the right
  panel; panel rendering from MDX; HUD interactions; destinations index
  completeness (every content file reachable).
- **E2E (Playwright):** starmap → planet → city → content; direct URL to a blog
  post; About/Contact via HUD; keyboard-only navigation; WebGL-disabled
  fallback.
- 3D visuals: Playwright screenshot smoke tests (scene renders, no black
  canvas) — no pixel-perfect assertions.
- Coverage target: 80%+ on non-shader application code (content pipeline,
  routing/state, config, components). GLSL shaders and R3F visual internals are
  exercised via E2E/smoke tests instead.

## Deployment

GitHub repo → Vercel, static export, auto-deploy on push to `main`. Custom
domain when available.

## Decisions Log

- Full 3D starmap (not 2.5D or hybrid) — chosen for maximum wow-factor.
- Zoom to 3D planet surface with city markers (true Director → Destination →
  Landing zone flow).
- All content in in-scene HUD panels, including blog reading.
- About/Contact in persistent HUD, not celestial bodies.
- MDX in repo, no CMS.
- Full 3D on mobile with performance scaling, no separate mobile nav.
- Stylized shader-driven art, no realistic textures.
- Next.js + R3F over Vite SPA (deep-linking/SEO for free) and over Astro
  (persistent-scene model fights Astro's per-page islands).
- The Tower added as a 5th destination (space station) holding the Live Feed
  city; feed ships as "coming soon" in v1 — its realtime shape (personal
  status/photo feed vs. guestbook) and backend are deferred to a later design
  cycle.
- Now and Uses live as tabs of the About HUD panel, not destinations.
- Colophon is a content entry ("This Website") in Professional → Projects, not
  a structural element.
