import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const PERSONS = [
  { id: 2, src: '/Person2.png' },
  { id: 3, src: '/Person3.png' },
  { id: 4, src: '/Person4.png' },
  { id: 5, src: '/Person5.png' },
]

/**
 * Person2 → Person5 crossfade sequence.
 *
 * Person1 is already revealed and fixed by Person1Reveal. This component
 * animates that same Person1 image (via DOM lookup), then layers
 * Person2..5 in the same fixed bottom-left position.
 *
 * After the crossfade settles on Person5, Person5 is moved to a top-level
 * fixed anchor (.person5-anchor) so the Projects section's pin spacer
 * doesn't drag it along with the rest of the page.
 */
export default function PersonSequence() {
  const sectionRef = useRef(null)
  const stageRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const incomingImages = [...stageRef.current.querySelectorAll('img')]
      const person1 = document.querySelector('.person1-reveal img')
      const person5Anchor = document.querySelector('.person5-anchor img')

      gsap.set(incomingImages, { opacity: 0 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${PERSONS.length * 90}%`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      })

      // Sit-down motion on the already-visible Person1.
      if (person1) {
        tl.to(person1, { y: 30, scale: 0.95, duration: 0.12, ease: 'power2.out' }, 0)
      }

      // Crossfade Person1 → Person2 → ... → Person5.
      const outgoingImages = person1
        ? [person1, ...incomingImages.slice(0, -1)]
        : incomingImages.slice(0, -1)

      PERSONS.forEach((person, i) => {
        const slot = 0.12 + i * 0.22
        const incoming = incomingImages[i]
        const outgoing = outgoingImages[i]

        if (outgoing) {
          tl.to(outgoing, { opacity: 0, duration: 0.1, ease: 'power2.in' }, slot)
        }
        // The dynamic Person5 layer is never allowed to show — the static
        // anchor handles Person5. Keep it hidden and inert across the
        // Person5 slot so it cannot slide upward with the page.
        if (person.id === 5) {
          tl.set(incoming, { opacity: 0, y: 0, scale: 1, filter: 'blur(0px)' }, slot)
        } else {
          tl.fromTo(
            incoming,
            { opacity: 0, scale: 0.96, y: 20, filter: 'blur(8px)' },
            { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 0.1, ease: 'power2.out' },
            slot + 0.04,
          )
        }
      })

      // At the end of the timeline, crossfade the sequence's Person5
      // into the top-level fixed anchor. The two Person5 images overlap
      // -briefly so there is no visual gap. The anchor is a sibling of
      // <Sections />, so it never gets dragged by a pinned section's
      // transform.
      const lastIncoming = incomingImages[incomingImages.length - 1]
      if (lastIncoming && person5Anchor) {
        // Reveal the static anchor a frame later than the previous tween
        // so Person5 visibly appears after a small delay rather than
        // exactly at the end of the Person4 fade-out.
        tl.set(person5Anchor, { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }, '+=0.05')
        tl.set(lastIncoming, { opacity: 0 }, '+=0.05')
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="person-sequence" ref={sectionRef}>
      <div className="person-sequence__stage" ref={stageRef}>
        {PERSONS.map((p) => (
          <div className="person-layer" key={p.id}>
            <img src={p.src} alt="" draggable={false} />
          </div>
        ))}
      </div>
    </section>
  )
}
