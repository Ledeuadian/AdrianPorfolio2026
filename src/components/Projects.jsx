import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ProjectModal from './ProjectModal'

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
    title: 'Project Two',
    tag: '3D',
    img: '/projects/p2.jpg',
    description:
      'An interactive 3D product viewer built with Three.js. Supports orbit, pan, and zoom with shader-based materials and environment lighting for realistic reflections.',
    tech: ['Three.js', 'WebGL', 'GLSL'],
    link: { url: '#', label: 'View Demo' },
  },
  {
    id: 3,
    title: 'Project Three',
    tag: 'Brand',
    img: '/projects/p3.jpg',
    description:
      'A brand identity system for a local startup — including logo, color palette, typography, and motion guidelines. Designed to be flexible across print and digital media.',
    tech: ['Figma', 'After Effects'],
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
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const frames = [...stageRef.current.querySelectorAll('.frame')]
      const count = frames.length

      // Orbit geometry (CSS px).
      const radiusX = 820   // wider horizontal swing — uses more of the right side
      const radiusY = 380
      const radiusZ = 900
      const liftY = 380 // the "hole" sits high up

      // Belt spacing: how far apart cards are on the conveyor, in 0..1
      // units of one revolution. Smaller = cards closer together.
      const SPACING = 0.16   // larger gap between cards to avoid overlap

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
              gsap.set(frame, {
                x: s.x,
                y: s.y,
                z: s.z,
                rotationY: s.rotationY,
                scale: s.scale,
                opacity: s.opacity,
                // Deeper z = lower zIndex so front cards render on top.
                zIndex: Math.round(10000 + s.z),
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
      // Click opens the modal for this project. Use 'click' (not
      // 'pointerdown') so it doesn't fire when the user is just
      // scrolling past with a press.
      const onClick = () => {
        const project = PROJECTS[i]
        if (project) setSelectedProject(project)
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
        {PROJECTS.map((p) => (
          <article className="frame" key={p.id}>
            <div className="frame__inner">
              <img src={p.img} alt={p.title} draggable={false} />
              <div className="frame__meta">
                <span className="frame__tag">{p.tag}</span>
                <h3 className="frame__title">{p.title}</h3>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="projects__hint">Scroll to browse projects</p>

      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  )
}
