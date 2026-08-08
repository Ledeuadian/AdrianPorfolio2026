import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Background scene.
 *   - 2ndBG: fixed, viewport-sized backdrop, always visible.
 *   - 1stBG: pinned and zoomed symmetrically until it leaves the frame.
 *   - Person1: fixed bottom-left, revealed in parallel with the 1stBG
 *     zoom so Person1 appears together with the 2ndBG reveal.
 *
 * The Person1Reveal component downstream renders its own Person1 image
 * positioned in the same fixed location. To avoid duplicate Person1
 * elements, this component is kept but the Person1 render here is
 * disabled — the only Person1 image lives in Person1Reveal and is now
 * revealed via Scene's zoom timeline via a shared custom event.
 */
export default function Scene() {
  const pinRef = useRef(null)
  const firstRef = useRef(null)
  const promptRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Listen for Person1Reveal to register its ref, then bind it into
      // this zoom timeline so Person1 emerges together with 2ndBG.
      const bindPerson1 = () => {
        const person1 = document.querySelector('.person1-reveal img')
        if (!person1 || !pinRef.current) return false

        gsap.set(person1, { opacity: 0, filter: 'blur(30px)' })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pinRef.current,
            start: 'top top',
            end: '+=300%',
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
          },
        })

        tl.to(firstRef.current, { scale: 10, ease: 'power2.inOut' }, 0)
        // Fade the initial instruction as soon as scrolling begins.
        tl.to(promptRef.current, { opacity: 0, ease: 'power2.out' }, 0)
        // Person1 reveals gradually during the zoom so it appears together
        // with 2ndBG while 1stBG exits.
        tl.to(person1, { opacity: 1, ease: 'power2.out' }, 0.3)
        tl.to(person1, { filter: 'blur(0px)', ease: 'power2.out' }, 0.3)
        return true
      }

      // Person1Reveal mounts immediately, so try synchronously first.
      if (!bindPerson1()) {
        // Fallback: defer until Person1Reveal has rendered.
        requestAnimationFrame(() => bindPerson1() || requestAnimationFrame(bindPerson1))
      }
    }, pinRef)

    return () => ctx.revert()
  }, [])

  return (
    <>
      {/* 2ndBG: fixed backdrop, always visible and never animated. */}
      <div className="bg-base" aria-hidden="true">
        <img src="/2ndBG.jpg" alt="" draggable={false} />
      </div>

      {/* 1stBG: pinned, centered, zoomed on scroll. */}
      <div className="scene" ref={pinRef}>
        <img
          ref={firstRef}
          src="/1stBG.png"
          alt=""
          className="bg bg--first"
          draggable={false}
        />
        <p ref={promptRef} className="scene-scroll-prompt">Scroll Down ↓</p>
      </div>
    </>
  )
}
