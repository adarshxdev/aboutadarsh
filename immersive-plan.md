# Immersive Portfolio — Reference Teardown & Plan

**Reference:** https://www.junkbranding.com/ ("Mix the unexpected.")
**Analysed:** 2026-10-23 (from the live HTML, JS bundle and CSS)
**Status:** Built (2026-10-23) with React Three Fiber. The concept was revised on 2026-10-24 from "Code × Nature" to plain engineering sections a recruiter can scan. See §7.
**Relation to `plan.md`:** `plan.md` covers the current site (Next.js, content-as-data, contact API). This file covers a new front end inspired by the reference. The content layer, contact API, DB and email stay as they are.

---

## 1. What the reference site is

The whole page is one full-screen WebGL scene with the content laid over it. Scrolling moves the camera down through the scene (an "ocean descent") instead of scrolling a document. Each section is a full-viewport **panel**, and every scroll step snaps to the next one.

- **Concept:** "Jellyfish × Beautiful flower". A particle flower (cosmos) folds into a jellyfish. The tagline: mix two unrelated things to get something new.
- **Narrative:** the sections are the four seasons (春 spring → About, 夏 summer → Services, 秋 autumn → Works, 冬 winter → Contact). A HUD shows the current season and a depth counter in metres.
- **Mood:** a dark, deep-sea palette (`#03050a`), warm paper-coloured text, one pink accent, film grain, bloom and fog.

### Page flow

| # | Panel | What happens |
|---|-------|--------------|
| 0 | **Loader** | A particle text logo forms (computed in a Web Worker). It shows a progress bar and "Depth / Particles / Motif" stats, then asks **Enter with sound / Without sound**. If loading takes too long, it offers **Retry** or **Light version**. |
| 1 | **Hero** | Label, `h1` "Mix the unexpected." revealed letter by letter, intro paragraph revealed with a sweep. The flower/jellyfish particles sit behind. |
| 2 | **About (spring)** | Large headline, body text, location note, portrait image (duotone SVG filter). |
| 3 | **Services (summer)** | A numbered list of 8 services (`01`–`08`), each with tech tags. Items are focusable. |
| 4 | **Works intro (autumn)** | "7 works so far." as a section break. |
| 5 | **Works** | One project at a time: a counter (`01 / 07`), a side list, name, summary, highlights, year/role, stack, links. **Each project's preview video plays on the particle field** (`VideoTexture` sampled by the particles, crossfaded with `uVideoMix`). Text changes through an SVG water-ripple warp. |
| 6 | **Contact (winter)** | A form with name, email and message, plus a hidden honeypot field. It posts to `/api/contact`. |
| 7 | **Finale** | "Our Sites" links (other projects), ©, back to top. |
| ★ | **Easter egg** | After a successful send, a `junkbranding:reveal-earth` event opens a hidden "Earth, low orbit" dialog with its own lazily loaded globe canvas: "Thank you." |

---

## 2. Tech inventory (what the reference actually uses)

### Build and framework
- **Vite** (hashed `/assets/index-*.js`, CSS built with Lightning CSS), **vanilla TypeScript/JS**. No React on the main site; the whole thing is one ~770 KB JS bundle.
- Static hosting on **Vercel** with one serverless function, `/api/contact`.
- Lazy-loaded chunks: the loader Web Worker and the Earth easter egg (dynamic `import`).

### 3D / WebGL (**Three.js r185**)
- One full-screen `<canvas class="stage">` behind all DOM content (`aria-hidden`).
- **GPGPU particle simulation:** positions and velocities live in float/half-float `DataTexture`s and are updated each frame by `ShaderMaterial` passes on a `WebGLRenderTarget` (ping-pong). The sim uniforms show what it does:
  - `uFormA / uFormB / uMorph` morph between target shapes (flower ↔ jellyfish)
  - `uPointer, uPointerVelocity, uPointerRadius, uPointerStrength` push particles away from the cursor
  - `uSpring, uDamping, uScatter, uSplit, uExit` control the physics
  - `uJelly, uPetal, uLeaf, uPulse, uBob, uSway` drive the jellyfish pulse and the flower sway
  - `uFirefly, uIgnite, uGlowA/B` add glowing particles
- **Rendering:** `Points` with custom `RawShaderMaterial`/`ShaderMaterial`, plus `InstancedMesh` for heavier elements and `MeshStandardMaterial`/`MeshPhysicalMaterial` with a `CubeCamera` for reflections.
- **Noise in GLSL:** simplex noise (`snoise`), `fbm` and curl noise for organic drift.
- **Video on particles:** each project's MP4 (`/videos/*.mp4`) becomes a `VideoTexture` that the particles sample (`uVideoA/B`, `uVideoMix`).
- **Post-processing:** `EffectComposer` → `RenderPass` → `UnrealBloomPass` → custom shader pass (grain `uGrain`, chromatic aberration `uAberration`, depth of field `uFocus/uAperture/uBlur`) → `OutputPass`. ACES Filmic tone mapping, depth fog (`uFogDensity`).
- **Camera:** scroll "depth" (`uDepth`, `uTravel`) moves the camera down through the scene.
- **Robustness:** handles `webglcontextlost` / `WEBGL_lose_context`, scales quality by `devicePixelRatio`, `navigator.deviceMemory` and `hardwareConcurrency`, and offers a "light version".

### 2D canvas / Web Worker
- **Loader motif:** the logo text is sampled into glyph points, and a **Web Worker** (`loaderWorker.js`) runs the particle positions and velocities (spring toward the glyph targets, then a "scatter" fall) off the main thread.
- Glyphs are measured once `document.fonts.load(...)` resolves, so the shapes come from the real font.

### Motion: **GSAP**
- GSAP core, plus **ScrollTrigger**, **Observer** (wheel/touch/pointer input) and **Flip**.
- **Scrolling is not native.** Wheel, touch and keys (`ArrowDown`, `PageDown`, `Space` and their reverses) are captured and call `goTo(panel)`, which tweens the camera depth and moves between panels. Nav links use `data-go="about"` etc.
- **Text reveals** set by data attributes:
  - `data-reveal="chars"`: split into characters, staggered
  - `data-reveal="sweep"`: a mask/gradient sweep
  - `data-reveal="rise"`: staggered rise for lists and forms
- **Parallax:** `data-depth="0.6…1.6"` sets the CSS var `--d`, so each layer moves at its own speed against the camera depth.
- **SVG filters** animated from JS: `feTurbulence` + `feDisplacementMap` (`#water-warp`, `#works-warp`) give the "seen through water" warp when works change. A `#duotone` `feColorMatrix` + `feComponentTransfer` tints images into the palette.

### Audio: **Web Audio API**
- One looping track: `/music/Out of Flux - Blue Race.mp3` at volume 0.18.
- `AudioContext` → `createMediaElementSource` → `AnalyserNode` (`fftSize 64`). The analyser drives the 4-bar sound icon in the header, and probably modulates the visuals.
- Audio only starts after the user's choice on the loader, as autoplay rules require.

### Typography (CSS variables)
| Token | Font | Use |
|-------|------|-----|
| `--font-serif` | **Instrument Serif** (incl. italic) | English display text, numbers |
| `--font-sans` | **Zen Kaku Gothic New** | Body text / Japanese |
| `--font-mincho` | **Shippori Mincho** | Japanese display text |

All three are on Google Fonts. Sizes are fluid `clamp()` values throughout (e.g. `clamp(54px, 7.2vw, 138px)` for display text).

### Colour tokens
```
--ink:    #04070c   (background; theme-color #03050a)
--paper:  #efeae4   (text)
--mist:   #efeae49e (secondary text)
--faint:  #efeae433 (hairlines)
--accent: #ff9dbf   (pink: hover, active states, pills)
```
- Per-panel radial "light pools" (`--pool: 60% 70% at 20% 70%`) sit behind the text to keep it readable over the canvas.
- Glass UI: `backdrop-filter: blur(14px) saturate(1.2)` on pills and the header.

### Layout and CSS
- `--margin: clamp(22px, 3.6vw, 60px)` page gutter, safe-area insets (`env(safe-area-inset-*)`), `viewport-fit=cover`.
- Fixed elements: the masthead (name, nav, Motion toggle, Sound toggle) and the HUD (seasons rail plus depth in metres).
- "Pill" buttons in `pill` and `pill--solid` variants.
- Breakpoints: `width <= 640px`, `width <= 760px or aspect-ratio <= 9/10` (portrait layout).

### Accessibility (handled well, and worth copying)
- Skip link to the contact form; every decorative canvas is `aria-hidden`.
- The loader is a `role="progressbar"` with `aria-valuenow`.
- An `aria-live="polite"` announcer reports panel changes; headings get `tabindex="-1"` and receive focus on navigation.
- **Motion on/off** toggle (`aria-pressed`) plus `prefers-reduced-motion`.
- **Sound** toggle (`aria-pressed`), off by default.
- The works carousel has a **visually hidden full list** of all projects, so screen readers and crawlers see everything.
- The form uses `novalidate` with custom errors linked through `aria-describedby`, plus a `role="status"` live region.

### SEO
- Full Open Graph and Twitter cards, a 1200×630 `og.jpg`, a canonical URL, and robots `max-image-preview:large`.
- **JSON-LD `@graph`:** `ProfessionalService` (with `OfferCatalog` services), `WebSite`, `WebPage`, `ItemList` of works (`CreativeWork`).
- All content is in the static HTML. The JS only fills it in and animates it, so the site works without WebGL.
- (Their other site also ships an `llms.txt`.)

### Contact form
- `fetch('/api/contact', POST JSON)` with an `AbortController` timeout of 15 s.
- A honeypot field (`company_website`) and a 60 s resend lock in `sessionStorage`.
- Client checks: name 2–60 characters, email up to 254, message 20–1200.

---

## 3. Our version: approach

**Keep:** Next.js App Router, the `content/*.ts` + Zod data layer, `/api/contact` (Resend + Neon + Upstash rate limit), Vercel. Our current site already has most of the backend the reference has.

**Add:**
```
three                 r18x (pin exact)
@react-three/fiber    v9 (React 19)          ← or plain three in a client-only module (see decision below)
@react-three/drei     helpers (useVideoTexture, etc.)
@react-three/postprocessing  bloom / noise / chromatic aberration / DOF
gsap                  core + ScrollTrigger + Observer + Flip (all free since 3.13)
@gsap/react           useGSAP hook
lil-gui / leva        dev-only tuning of uniforms
vite-plugin-glsl → in Next: raw-loader / glslify via webpack rule, or inline template strings
```

**Decision to make before building:** R3F or vanilla Three.
- **R3F (recommended):** fits the existing React/Next codebase, declarative scene, drei/postprocessing out of the box.
- **Vanilla Three in a single client `Stage` class:** closer to the reference and slightly faster. Better if we want the scene completely separate from React rendering.

**Our concept** (to decide; the reference's strength is one strong metaphor):
- Something specific to us, e.g. *"Code × Nature"*: a particle field that morphs from a terminal/circuit shape into an organic one, or a dev-themed "depth" counter (commits, years, lines).
- Map the sections onto a 4–6 step narrative the way they use seasons.

### Proposed architecture
```
src/
  app/
    page.tsx                 # SSR: all content as semantic HTML (SEO / no-JS fallback)
    layout.tsx               # fonts (next/font: Instrument Serif, + sans), JSON-LD
  components/immersive/
    Stage.tsx                # 'use client'; fixed <Canvas>, dynamic(ssr:false)
    scene/
      Particles.tsx          # GPGPU points (FBO ping-pong)
      shaders/sim.frag.glsl  # morph + pointer + curl noise
      shaders/render.vert/frag.glsl
      Effects.tsx            # bloom + grain + aberration + DOF
      CameraRig.tsx          # depth driven by panel progress
    Loader.tsx               # progress, particle logo (worker), Enter with/without sound
    PanelController.ts       # GSAP Observer → goTo(index); keys/wheel/touch; data-go links
    reveal.ts                # data-reveal chars|sweep|rise (split text + GSAP)
    Masthead.tsx             # nav + Motion toggle + Sound toggle
    Hud.tsx                  # section rail + depth counter
    WorksViewer.tsx          # one project at a time; feeds VideoTexture to Particles
    SvgFilters.tsx           # duotone + water-warp filters
    audio.ts                 # AudioContext + Analyser → store
  lib/
    store.ts                 # zustand: panel, depth, motion, sound, quality tier
    quality.ts               # tier from DPR / deviceMemory / cores / GPU
  workers/
    loaderParticles.worker.ts
public/
  videos/<project>.mp4       # short muted loops, ~5–10s, ≤2MB each, + poster
  music/<track>.mp3          # royalty-free / licensed
```
Content still comes from `content/projects.ts`. Add `video` and `poster` fields to `projectSchema`.

---

## 4. Implementation phases

1. **Foundation:** fonts, colour tokens, panel layout (full-viewport sections, absolutely positioned text), masthead and HUD. Content renders server-side, with no WebGL yet. The site must be fully usable at this stage.
2. **Panel navigation:** GSAP Observer controller, snapping, keys, nav `data-go`, focus management, `aria-live` announcer, URL hash sync, native-scroll fallback for reduced motion.
3. **Text motion:** `data-reveal` chars/sweep/rise, `data-depth` parallax, SVG water-warp on work changes, duotone portrait.
4. **WebGL stage v1:** canvas, camera rig tied to depth, fog, simple `Points` field with curl-noise drift, pointer repulsion.
5. **GPGPU particles:** FBO sim, two target shapes (sampled from a mesh/SVG/text) with `uMorph`, a spring/damping model, glow particles.
6. **Works on particles:** per-project `VideoTexture`, crossfade on project change, lazy-load and pause any video that isn't showing.
7. **Post-processing:** bloom, grain, chromatic aberration, light DOF, ACES tone mapping.
8. **Loader:** font-load gate, particle logo in a worker, progress from real asset loading, Enter with/without sound, timeout → Retry / Light version.
9. **Audio:** licensed loop, analyser → header bars and a small uniform (`uPulse`), off by default.
10. **Quality and fallbacks:** quality tiers, `webglcontextlost` recovery, Motion toggle, `prefers-reduced-motion` (static poster, no snapping), a no-WebGL path.
11. **Easter egg (optional):** a lazily loaded "thank you" scene after the form is sent.
12. **SEO and performance pass:** JSON-LD (`Person` + `ItemList` of `CreativeWork`), OG image, `llms.txt`, Lighthouse (`lighthouserc.json` already exists). Targets: LCP < 2.5 s on 4G (text is the LCP, not the canvas), JS for the 3D chunk lazy-loaded after first paint.

---

## 5. Assets we need to produce

- [ ] Concept and the two particle "forms" (shapes to morph between)
- [ ] 5–8 project preview loops (MP4/H.264 + WebM, muted, ~1280px wide) + posters
- [ ] Portrait photo (works with the duotone filter)
- [ ] Music loop (licensed or royalty-free), ~1–2 min, MP3 ~128 kbps
- [ ] OG image 1200×630, favicon SVG/PNG, apple-touch-icon

## 6. Risks and notes

- **Hijacked scrolling** hurts usability if done badly. Always support keys and touch, and fall back to native scroll with reduced motion or Motion off.
- **Mobile GPU and battery:** cap DPR at 1.5–2, use smaller FBOs (e.g. 128² vs 256² particles), and pause rendering when the tab is hidden.
- **Bundle size:** the reference ships ~770 KB of JS. Keep the 3D chunk out of the critical path (`next/dynamic`, `ssr:false`).
- **Licensing:** don't reuse the reference's music, videos, shaders or copy. Use it only as inspiration.

---

## 7. What shipped

**Concept:** plain résumé sections (About, Skills, Experience, Projects, Contact), each illustrated by an engineering shape: a particle bust of me in the hero (a placeholder torso until `profile.portrait` points at a photo), a neural network, a layered stack, a git branch graph, browser windows, an envelope, and `</>` at the end. Shapes are generated in code (`stage/forms.ts`), so there are no model files. The hero has résumé and contact buttons up front.

| Piece | Where |
|---|---|
| Home page (server-rendered panels) | `src/app/page.tsx`, copy in `content/home.ts` |
| Client shell: loader, masthead, HUD, thank-you | `src/components/immersive/` |
| GPGPU particles, shaders, post-processing | `src/components/immersive/stage/` |
| Panel stepping, parallax, reveals | `src/components/immersive/usePanelNavigation.ts` |
| State, chapters, quality tiers, audio | `src/lib/immersive/` |
| Styles | `src/styles/immersive.css` |

**Differences from the plan:**
- **Native scroll underneath.** Wheel and arrow keys step between panels only with a fine pointer and motion on. Touch devices scroll natively, and tall panels are stepped through a screen at a time. This keeps find-in-page, Tab focus and mobile scrolling working.
- **Audio is generated** with Web Audio (detuned oscillators, filter, delay), so there is no music file to license.
- **Reveals are CSS**, toggled by a class from ScrollTrigger, rather than GSAP SplitText.
- **No duotone portrait:** there's no portrait photo yet. The About panel shows computed stats instead.
- **No project videos yet.** The `video`/`poster` fields exist on projects, and the field switches to a flat "screen" shape to play them. All current projects are confidential or have no loop, so none play.
- **Content pages moved into an `(site)` route group** so they keep the nav and footer; URLs are unchanged.

**Still to do:**
- [ ] Add a head-and-shoulders photo (cut-out, transparent or dark background) and set `portrait` in `content/profile.ts`
- [ ] Record project loops (§5) for non-confidential projects
- [ ] Re-run Lighthouse on `/`. The CI budget (perf ≥ 0.94, TBT ≤ 200 ms) may not hold with the 3D chunk, so tune quality tiers or the budget.
- [ ] Test on real phones (iOS Safari half-float path, battery)

