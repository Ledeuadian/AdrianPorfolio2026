import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Replace these with your real project images (drop them in /public).
const PROJECTS = [
  {
    id: 1,
    title: 'Previous Portfolio',
    tag: 'Web',
    img: '/1stProj.JPG',
    description:
      'Adrian3DPort is an interactive 3D developer portfolio showcasing projects, technical skills, certificates, and contact information through immersive animations and models.',
    tech: ['React', 'Vite', 'Tailwind', 'Three.js / React Three Fiber', 'Framer Motion'],
    link: { url: 'https://adrian3-d-port.vercel.app/', label: 'View Live' },
  },
  {
    id: 2,
    title: 'CKC-SHRMS',
    tag: 'PWA clinical Record',
    img: '/2ndProj.JPG',
    contain: true,
    description:
      'A full-stack Progressive Web App for managing a school clinic\'s day-to-day operations — patient/student health records, doctor appointments, prescriptions, medicine inventory, dental and physical exam tracking, and analytics. Built for Christ the King College (CKC) to digitize clinic workflows with role-based access for doctors, staff, and admins. PWA-installable for mobile/desktop offline access.',
    tech: ['Laravel 11 (PHP 8.2)', 'Blade + Tailwind + Alpine.js', 'Flowbite UI', 'MySQL', 'Laravel Breeze (auth)', 'Vite', 'PWA (offline install)', 'Maatwebsite/Excel'],
    link: { url: '#', label: 'View Case Study' },
  },
  {
    id: 3,
    title: 'ShopSmart',
    tag: 'Shopping mobile app',
    img: '/3rdProj.png',
    description:
      'An online mobile app for shopping, packaged via Capacitor. Features multi-role dashboards (DTI regulatory, stores, customers), geolocation-based store discovery using a custom KNN algorithm, Philippine DTI SRP price verification, OCR-based business permit verification, OAuth with deep-link support, and Supabase RLS for fine-grained access control. Built with Ionic React components for a native mobile UX, installable directly to the device.',
    tech: ['React 18 + TypeScript', 'Ionic React', 'Vite', 'Capacitor (Android APK)', 'Supabase (PostgreSQL + Auth)', 'KNN Geolocation', 'OCR Permit Verification'],
    link: { url: '#', label: 'View Case Study' },
  },
  {
    id: 4,
    title: 'Project Four',
    tag: 'App',
    img: '/projects/p4.jpg',
    description:
      'A cross-platform mobile application prototype with focus on offline-first architecture, smooth navigation, and a hand-crafted design system.',
    tech: ['React Native', 'Expo', 'SQLite'],
    link: { url: '#', label: 'View on App Store' },
  },
  {
    id: 5,
    title: 'Project Five',
    tag: 'Motion',
    img: '/projects/p5.jpg',
    description:
      'A motion-graphics reel exploring kinetic typography, particle systems, and procedural animation. All transitions built with GSAP timelines and SVG morphing.',
    tech: ['GSAP', 'SVG', 'Lottie'],
    link: { url: '#', label: 'Watch Reel' },
  },
]

/**
 * Continuous-belt 3D project showcase with sequential entry.
 *
 * The orbit is parameterised on a 0..1 "belt position" (one full
 * revolution = 1). Every card sits at a fixed offset on the belt:
 *
 *   beltPos(card i) = leadProgress - i * SPACING
 *
 * - `leadProgress` is scrubbed by scroll. It represents the position of
 *   the lead (front-most) card on the belt.
 * - `SPACING` is how far apart cards are along the belt (in 0..1 units).
 *
 * Card 0 (the lead) starts in the hole at progress 0. Cards 1..N start
 * further back on the belt (progress -SPACING, -2*SPACING, …), still in
 * the hole. As scroll advances, leadProgress increases, which moves every
 * card forward through the orbit together — they form a line.
 *
 * Visibility rule: a card is visible while its beltPos is within the
 * front-arc of the orbit (between FADE_IN and FADE_OUT progress). This
 * naturally produces the effect of cards emerging from the hole one by
 * one and lining up behind the lead.
 */
export default function Projects() {
  const sectionRef = useRef(null)
  const stageRef = useRef(null)
  const [flippedId, setFlippedId] = useState(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const frames = [...stageRef.current.querySelectorAll('.frame')]
      const count = frames.length

      // Orbit geometry (CSS px).
      const radiusX = 1050   // wider horizontal swing — uses more of the right side
      const radiusY = 380
      const radiusZ = 1100
      const liftY = 380 // the "hole" sits high up

      // Belt spacing: how far apart cards are on the conveyor, in 0..1
      // units of one revolution. Smaller = cards closer together.
      const SPACING = 0.17   // larger gap between cards to avoid overlap

      // Fade thresholds (in 0..1 of one revolution).
      // progress = 0  -> back-top (the hole)
      // progress = 0.5 -> front-center
      const FADE_IN = 0.02   // start becoming visible just after leaving the hole
      const FADE_OUT = 0.98  // disappear just before re-entering the hole

      // State of a frame at a given orbit progress (0..1).
      // `unlocked` forces opacity to 0 until the card's turn has come
      // (i.e. until the lead has advanced far enough that this card's
      // genuine position is at/near the hole). Without this, card N would
      // instantly appear somewhere on the belt because its starting
      // progress wraps past FADE_IN.
      const stateAt = (p, unlocked = true) => {
        // Raw (unwrapped) progress — used to decide whether the card has
        // "left the hole" yet. We want card i to unlock once lead.p has
        // advanced past i * SPACING, i.e. once its raw progress >= 0.
        if (!unlocked) {
          return {
            x: 0,
            y: -liftY,
            z: -2 * radiusZ,
            rotationY: 0,
            scale: 0.4,
            opacity: 0,
          }
        }
        // Wrap p into [0, 1)
        const pw = ((p % 1) + 1) % 1
        const theta = pw * Math.PI * 2
        const cosT = Math.cos(theta)
        const sinT = Math.sin(theta)
        // Opacity: visible between FADE_IN and FADE_OUT, 0 in the hole.
        let opacity = 1
        if (pw < FADE_IN) opacity = pw / FADE_IN
        else if (pw > FADE_OUT) opacity = (1 - pw) / (1 - FADE_OUT)
        return {
          x: sinT * radiusX,
          y: (1 - cosT) * radiusY * 0.5 - liftY,
          z: -(1 + cosT) * radiusZ,
          rotationY: sinT * 50,
          scale: 0.4 + (1 - cosT) * 0.5,
          opacity,
        }
      }

      // Initial state: every frame parked invisibly at the hole.
      // pointerEvents:'none' is critical — without it, all 5 frames
      // are stacked at the same hole position and intercept clicks for
      // each other (so users perceive only the topmost frame as
      // clickable). opacity:0 alone does NOT disable hit-testing.
      const startState = stateAt(0)
      gsap.set(frames, {
        xPercent: -50,
        yPercent: -50,
        x: startState.x,
        y: startState.y,
        z: startState.z,
        rotationY: startState.rotationY,
        scale: startState.scale,
        opacity: 0,
        zIndex: (i) => count - i,
        pointerEvents: 'none',
      })

      // Total scroll: enough to advance the belt so the last card reaches
      // front-center. leadProgress goes from 0 -> (count-1)*SPACING + 0.5.
      const leadEnd = (count - 1) * SPACING + 0.5

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${Math.round(leadEnd * 600)}%`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      })

      // Single proxy that scrubs the belt forward.
      const lead = { p: 0 }

      tl.to(
        lead,
        {
          p: leadEnd,
          duration: 1,
          ease: 'none',
          onUpdate: () => {
            frames.forEach((frame, i) => {
              // Each card sits SPACING behind the lead on the belt.
              const cardProgress = lead.p - i * SPACING
              // A card is "unlocked" only once its raw progress on the belt
              // is >= 0. Before that, it stays hidden in the hole — so
              // cards appear one-by-one as the lead advances, then line up
              // behind it on the conveyor.
              const unlocked = cardProgress >= 0
              const s = stateAt(cardProgress, unlocked)
              // Disable pointer events on frames that are visually hidden
              // (opacity near 0). Without this, all 5 frames are stacked
              // at the same hole position initially and intercept clicks
              // for each other even though they look invisible. Only the
              // topmost z-indexed frame receives clicks, which is why the
              // user perceives "only the 1st frame is clickable".
              const isVisible = s.opacity > 0.05
              gsap.set(frame, {
                x: s.x,
                y: s.y,
                z: s.z,
                rotationY: s.rotationY,
                scale: s.scale,
                opacity: s.opacity,
                // Deeper z = lower zIndex so front cards render on top.
                zIndex: Math.round(10000 + s.z),
                // Visibility-based pointer events. opacity:0 alone does
                // NOT disable hit-testing — the element still receives
                // pointer events at its transformed position.
                pointerEvents: isVisible ? 'auto' : 'none',
              })
            })
          },
        },
        0,
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  // Wire JS-driven hover (more reliable than CSS :hover on
  // 3D-transformed, continuously-updating elements).
  //
  // Why JS instead of CSS :hover:
  // - The GSAP scroll scrub updates `transform` (x, y, z, rotationY,
  //   scale) on every .frame on every tick. During active scrolling,
  //   the browser's :hover hit-testing on these rapidly-transformed
  //   elements is unreliable — the hit area shifts as the transform
  //   changes, causing the hover state to flicker on/off even when the
  //   cursor visually stays on the card.
  // - mouseenter/mouseleave fire once on enter/leave regardless of
  //   ongoing transforms, and the toggled .is-hovered class persists
  //   until the next event.
  // - mouseenter (non-bubbling) is preferred over mouseover because
  //   it does not re-fire when moving over inner elements (like the
  //   .frame__meta which sits on top of the card).
  useEffect(() => {
    const frames = stageRef.current?.querySelectorAll('.frame')
    if (!frames) return

    const cleanups = []
    frames.forEach((frame, i) => {
      const onEnter = () => frame.classList.add('is-hovered')
      const onLeave = () => frame.classList.remove('is-hovered')
      // Click flips the card to reveal the back face (project
      // details). Use 'click' (not 'pointerdown') so it doesn't fire
      // when the user is just scrolling past with a press.
      const onClick = () => {
        const project = PROJECTS[i]
        if (project) setFlippedId((cur) => (cur === project.id ? null : project.id))
      }
      frame.addEventListener('mouseenter', onEnter)
      frame.addEventListener('mouseleave', onLeave)
      frame.addEventListener('click', onClick)
      cleanups.push(() => {
        frame.removeEventListener('mouseenter', onEnter)
        frame.removeEventListener('mouseleave', onLeave)
        frame.removeEventListener('click', onClick)
        frame.classList.remove('is-hovered')
      })
    })

    return () => cleanups.forEach((fn) => fn())
  }, [])

  return (
    <section className="projects" ref={sectionRef}>
      <div className="projects__stage" ref={stageRef}>
        {PROJECTS.map((p) => {
          // Each project gets an `orientation` class on its frame based
          // on the image's natural aspect ratio, so portrait phone
          // screenshots get a tall portrait frame (no squashing, no
          // tiny letterboxed thumbnail) and landscape screenshots get
          // the standard wide frame. The class is applied via inline
          // detection below — see ImageProbe component after the map.
          return (
            <FrameCard
              key={p.id}
              project={p}
              isFlipped={flippedId === p.id}
            />
          )
        })}
      </div>

      <p className="projects__hint">Scroll to browse · Click to flip</p>
    </section>
  )
}

/**
 * Single frame card. Loads the project image once, measures its
 * natural dimensions, and applies `frame--portrait` or
 * `frame--landscape` to the wrapper so CSS can size the frame
 * adaptively. Without this, a portrait phone screenshot displayed in
 * a landscape 16:10 frame looks tiny (contain) or stretched (cover).
 *
 * The probe is local state so it only runs once per card, not on
 * every scroll tick.
 */
function FrameCard({ project, isFlipped }) {
  const [orientation, setOrientation] = useState('landscape')

  const onImgLoad = (e) => {
    const img = e.currentTarget
    // naturalWidth/naturalHeight give the image's intrinsic size
    // before any CSS sizing — exactly what we need to decide the
    // frame orientation.
    if (img.naturalWidth && img.naturalHeight) {
      setOrientation(img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait')
    }
  }

  return (
    <article
      className={`frame frame--${orientation}${isFlipped ? ' is-flipped' : ''}`}
      data-project-id={project.id}
    >
      <div className="frame__card">
        {/* ---------- FRONT FACE (image + title) ---------- */}
        <div className="frame__face frame__front">
          <img
            src={project.img}
            alt={project.title}
            draggable={false}
            onLoad={onImgLoad}
            className={project.contain ? 'frame__img--contain' : ''}
          />
          <div className="frame__meta">
            <span className="frame__tag">{project.tag}</span>
            <h3 className="frame__title">{project.title}</h3>
          </div>
          <span className="frame__flip-hint" aria-hidden="true">⤿ tap to flip</span>
        </div>

        {/* ---------- BACK FACE (project details) ---------- */}
        <div className="frame__face frame__back">
          <div className="frame__back-grid" aria-hidden="true" />
          <span className="frame__corner frame__corner--tl" />
          <span className="frame__corner frame__corner--tr" />
          <span className="frame__corner frame__corner--bl" />
          <span className="frame__corner frame__corner--br" />

          <div className="frame__back-content">
            <div className="frame__back-meta">
              <span className="frame__back-tag">{project.tag}</span>
              <span className="frame__back-divider">/</span>
              <span className="frame__back-id">ID_{String(project.id).padStart(2, '0')}</span>
            </div>
            <h3 className="frame__back-title">{project.title}</h3>
            <p className="frame__back-desc">{project.description}</p>

            {project.tech && project.tech.length > 0 && (
              <div className="frame__back-stack">
                {project.tech.map((t) => (
                  <span key={t} className="frame__back-chip">{t}</span>
                ))}
              </div>
            )}

            {project.link?.url && (
              <a
                className="frame__back-link"
                href={project.link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <span>{project.link.label || 'Open'}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 11L11 5M11 5H6M11 5V10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
