import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Person1Reveal from './Person1Reveal'
import PersonSequence from './PersonSequence'
import Projects from './Projects'

gsap.registerPlugin(ScrollTrigger)

const INTRODUCTION = {
  id: 'introduction',
  eyebrow: 'Software Engineer',
  title: 'Adrian Abellanosa',
  copy: [
    'I design and build digital experiences that make complex workflows simple.',
    'With 2 years of professional experience, I develop and maintain enterprise systems for a Philippine local government agency, delivering reliable software that supports thousands of daily operations.',
    'By combining modern web technologies with AI-powered development—including Claude Code, ChatGPT, GitHub Copilot, and intelligent automation—I transform ideas into scalable, efficient, and maintainable solutions.',
    "I don't just write code—I engineer systems that last.",
  ],
}

const SKILLS = [
  // Frontend
  'React', 'TypeScript', 'Next.js', 'Vite', 'Tailwind', 'GSAP', 'Framer Motion',
  'Three.js', 'WebGL', 'Lenis',
  // Backend & Data
  'Node.js', 'Laravel', 'PHP', 'REST APIs', 'GraphQL', 'Supabase', 'PostgreSQL', 'MySQL', 'SQL',
  // Tooling & Platform
  'Git', 'GitHub', 'Vercel', 'Docker', 'Figma',
  // AI
  'Claude Code', 'ChatGPT', 'GitHub Copilot', 'Cursor', 'AI Automation',
  'and more',
]

/**
 * Split a headline into per-word mask wrappers for the Masked Reveal.
 *
 * Each word becomes:
 *   <span class="mask"><span class="mask__inner">Word</span></span>
 *
 * The `.mask` has `overflow: hidden` (the "slit"); `.mask__inner`
 * starts at `y: 100%` (below the slit) and animates up to `y: 0`.
 * Whitespace is preserved as bare text nodes between word masks.
 */
function splitWords(node) {
  if (!node) return []
  const text = node.textContent ?? ''
  node.textContent = ''
  return text.split(/(\s+)/).filter(Boolean).map((chunk) => {
    if (/^\s+$/.test(chunk)) {
      node.appendChild(document.createTextNode(chunk))
      return null
    }
    const mask = document.createElement('span')
    mask.className = 'mask'
    const inner = document.createElement('span')
    inner.className = 'mask__inner'
    inner.textContent = chunk
    mask.appendChild(inner)
    node.appendChild(mask)
    return inner
  }).filter(Boolean)
}

/**
 * Masked Reveal — text slides up through an overflow:hidden slit.
 *
 * Each text piece (eyebrow, headline words, copy) is wrapped in a
 * `.mask` container with `overflow: hidden`. The inner text starts at
 * `y: 100%` (hidden below the slit) and translates up to `y: 0` —
 * giving the appearance of emerging from behind a horizontal mask.
 *
 * Implementation note: a SINGLE scrubbed timeline drives both enter
 * and exit so scroll progress determines the state deterministically.
 * Multiple `toggleActions`-based tweens racing each other (the old
 * approach) caused visible glitches during fast scrolling — scrub
 * timelines can't race because they're all read from the same scroll
 * value.
 *
 *   - Timeline spans from this section's spacer entering to the NEXT
 *     section's spacer entering. Scroll progress 0 → 1 maps directly
 *     to timeline progress.
 *   - First 25% of the scroll: slide up (enter).
 *   - 25% – 75%: hold (text fully visible).
 *   - Last 25%: slide down (exit).
 *   - On scroll-up the timeline reverses smoothly.
 *
 * The spacer itself is removed from the document flow here — we now
 * use it only as a scroll-height donor so the timeline has a long
 * enough range.
 */
function playMaskedReveal({ section, spacer, nextSpacer }) {
  const eyebrow = section.querySelector('.eyebrow')
  const title = section.querySelector('h2')
  const copyInners = [...section.querySelectorAll('.intro-copy .mask__inner')]

  const words = title ? splitWords(title) : []
  const eyebrowInner = eyebrow?.querySelector('.mask__inner') ?? eyebrow
  const allInners = [eyebrowInner, ...words, ...copyInners].filter(Boolean)

  // Hidden start state: inner text sits 100% below its mask.
  gsap.set(allInners, { yPercent: 100 })

  // If we don't have a nextSpacer, fall back to the spacer itself
  // and use toggleActions (only-enter).
  if (!nextSpacer) {
    gsap.to(allInners, {
      yPercent: 0,
      duration: 0.7,
      ease: 'power3.out',
      stagger: { each: 0.06, from: 'start' },
      scrollTrigger: {
        trigger: spacer,
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      },
    })
    return null
  }

  // Single scrubbed timeline — enter + hold + exit.
  // Trigger spans from THIS spacer's top entering viewport to the
  // NEXT spacer's top entering viewport, so the timeline's progress
  // 0 → 1 covers the entire visible-and-fade window.
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: spacer,
      start: 'top 70%',
      endTrigger: nextSpacer,
      end: 'top 70%',
      scrub: 0.6,
      // Toggle .is-active so CSS can gate pointer-events (:hover
      // styles) outside the active scroll window.
      onToggle: (self) => section.classList.toggle('is-active', self.isActive),
    },
  })

  // ENTER: 0 → 0.3 of scroll progress. All elements slide up together.
  // (No stagger — stagger causes unpredictable durations on scrub.)
  tl.to(allInners, {
    yPercent: 0,
    duration: 0.3,
    ease: 'power2.out',
  }, 0)

  // EXIT: 0.7 → 1.0 of scroll progress. All elements slide back down.
  tl.to(allInners, {
    yPercent: 100,
    duration: 0.3,
    ease: 'power2.in',
  }, 0.7)

  return tl
}

export default function Sections() {
  const containerRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const triggers = []

      const introSpacer = containerRef.current.querySelector('[data-reveal-spacer="intro"]')
      const skillsSpacer = containerRef.current.querySelector('[data-reveal-spacer="skills"]')
      // PersonSequence is the next section after Skills; use its root
      // element as the "next trigger" so Skills fades out as it appears.
      const personSequenceEl = containerRef.current.querySelector('.person-sequence')

      // --- 3D tilt for the intro — tracks mouse and tilts the wrap. ---
      // The wrap uses CSS `perspective` + `transform-style: preserve-3d`,
      // so children with `[data-tilt-depth]` translateZ to appear at
      // different depths during the parallax.
      const tiltWrap = containerRef.current.querySelector('[data-tilt]')
      if (tiltWrap) {
        // Apply translateZ depths to `[data-tilt-depth]` elements so
        // the parallax displacement is visible when the wrap rotates.
        const depthEls = tiltWrap.querySelectorAll('[data-tilt-depth]')
        depthEls.forEach((el) => {
          const depth = parseFloat(el.dataset.tiltDepth || '0')
          gsap.set(el, { z: depth * 140 })
        })

        const setRotX = gsap.quickTo(tiltWrap, 'rotationX', { duration: 0.35, ease: 'power3.out' })
        const setRotY = gsap.quickTo(tiltWrap, 'rotationY', { duration: 0.35, ease: 'power3.out' })
        const setGlowX = gsap.quickTo(tiltWrap, '--mx', { duration: 0.25, ease: 'power2.out' })
        const setGlowY = gsap.quickTo(tiltWrap, '--my', { duration: 0.25, ease: 'power2.out' })

        const onMove = (e) => {
          const r = tiltWrap.getBoundingClientRect()
          // Normalized mouse position relative to wrap center: -1 → 1
          const nx = ((e.clientX - r.left) / r.width - 0.5) * 2
          const ny = ((e.clientY - r.top) / r.height - 0.5) * 2
          setRotY(ny * 14)   // horizontal mouse → rotate around Y (much bigger)
          setRotX(-nx * 14)  // vertical mouse → rotate around X
          // Mouse position as 0..1 for the gradient glow origin
          setGlowX((nx + 1) / 2)
          setGlowY((ny + 1) / 2)
        }
        const onLeave = () => {
          setRotX(0)
          setRotY(0)
          setGlowX(0.5)
          setGlowY(0.5)
        }
        // Listen on the viewport so the parallax is smooth even when
        // the cursor leaves the wrap's actual bounding box.
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseleave', onLeave)

        // Store cleanup on the wrap so we can tear it down on unmount.
        tiltWrap.__cleanupTilt = () => {
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('mouseleave', onLeave)
        }
      }

      const pairs = [
        {
          section: containerRef.current.querySelector('#introduction'),
          spacer: introSpacer,
          nextSpacer: skillsSpacer,
        },
        {
          section: containerRef.current.querySelector('#skills'),
          spacer: skillsSpacer,
          nextSpacer: personSequenceEl,
        },
      ].filter((p) => p.section && p.spacer)

      pairs.forEach((p) => {
        const tl = playMaskedReveal(p)
        if (tl?.scrollTrigger) triggers.push(tl.scrollTrigger)
      })

      // Skill chips: same single-scrubbed-timeline pattern as the
      // sections. Skill inners slide up at scroll 0 → 0.3, hold,
      // then slide back down at 0.7 → 1.0 — driven entirely by
      // scroll position so it can't race against itself on fast
      // flicks.
      const skillsSection = containerRef.current?.querySelector('#skills')
      const skillInners = skillsSection?.querySelectorAll('[data-skill] .mask__inner') ?? []
      if (skillInners.length && skillsSection && skillsSpacer && personSequenceEl) {
        gsap.set(skillInners, { yPercent: 100 })

        const chipTl = gsap.timeline({
          scrollTrigger: {
            trigger: skillsSpacer,
            start: 'top 70%',
            endTrigger: personSequenceEl,
            end: 'top 70%',
            scrub: 0.6,
            // Toggle .is-active so CSS can gate chip :hover styles
            // outside the active scroll window.
            onToggle: (self) =>
              skillsSection.classList.toggle('is-active', self.isActive),
          },
        })
        chipTl.to(skillInners, { yPercent: 0, duration: 0.3, ease: 'power2.out' }, 0)
        chipTl.to(skillInners, { yPercent: 100, duration: 0.3, ease: 'power2.in' }, 0.7)
        triggers.push(chipTl.scrollTrigger)
      }

      return () => {
        triggers.forEach((t) => t?.kill())
        const tiltWrap = containerRef.current?.querySelector?.('[data-tilt]')
        if (tiltWrap?.__cleanupTilt) tiltWrap.__cleanupTilt()
      }
    }, containerRef)

    return () => {
      const tiltWrap = containerRef.current?.querySelector?.('[data-tilt]')
      if (tiltWrap?.__cleanupTilt) tiltWrap.__cleanupTilt()
      ctx.revert()
    }
  }, [])

  return (
    <main className="content" ref={containerRef}>
      {/* 1. Person1 reveal (single owner of Person1) */}
      <Person1Reveal />

      {/* 2. Introduction — spacer in normal flow + fixed text overlay */}
      <div data-reveal-spacer="intro" />
      <section id={INTRODUCTION.id} data-reveal className="section--intro">
        <div className="intro-3d-wrap" data-tilt>
          <span className="mask">
            <span className="mask__inner eyebrow">{INTRODUCTION.eyebrow}</span>
          </span>
          <h2 className="name">{INTRODUCTION.title}</h2>
          <div className="intro-copy">
            {INTRODUCTION.copy.map((line, i) => (
              <p key={i} className="mask">
                <span className="mask__inner" data-tilt-depth={0.3 + i * 0.15}>{line}</span>
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Skills — spacer + fixed text overlay */}
      <div data-reveal-spacer="skills" />
      <section id="skills" data-reveal className="section--skills">
        <span className="mask">
          <span className="mask__inner eyebrow">Toolkit</span>
        </span>
        <h2>Skills &amp; Stack</h2>
        <div className="skills-grid" data-skills-grid>
          {SKILLS.map((s) => (
            <span key={s} className="skill-chip" data-skill>
              <span className="mask">
                <span className="mask__inner">{s}</span>
              </span>
            </span>
          ))}
        </div>
      </section>

      {/* 4. Person1 sit-down + crossfade to Person2..5 (Person5 stays) */}
      <PersonSequence />

      {/* 5. 3D project showcase — pinned internally, layered above content */}
      <Projects />
    </main>
  )
}
