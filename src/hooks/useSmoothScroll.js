import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Disable browser scroll restoration IMMEDIATELY at module load, before
// React mounts. This must happen as early as possible — setting it inside
// useEffect is too late: the browser has already restored the scroll
// position by the time React's effect fires.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

/**
 * Wire Lenis smooth scroll → GSAP ScrollTrigger.
 * Mount once at the app root.
 *
 * A velocity cap is applied to wheel events so that fast flicks don't
 * translate into huge per-frame scroll deltas. Without the cap, the
 * pinned ScrollTrigger sections (Scene, PersonSequence, Projects)
 * can't keep up with the scroll and the page layout breaks.
 */
const MAX_WHEEL_DELTA_PER_EVENT = 80 // pixels per wheel event (cap)

/**
 * Force the page back to scroll=0 on every load/refresh.
 * Listens for unload events and resets scroll to top so the browser
 * can never save a non-zero position for restoration. Also handles
 * bfcache (back-forward cache) restores via 'pageshow'.
 */
function forceScrollTop() {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

// Reset on unload — fires before the browser saves scroll position.
window.addEventListener('beforeunload', forceScrollTop)
window.addEventListener('pagehide', forceScrollTop)
// Handle bfcache restore (back/forward navigation).
window.addEventListener('pageshow', (e) => {
  if (e.persisted) forceScrollTop()
})

export default function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    // Reset scroll to the top on every fresh mount so that reloading
    // mid-page doesn't strand fixed-position overlays (Intro/Skills)
    // in their hidden state over unrelated content.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)
    lenis.scrollTo(0, { immediate: true })

    // After forcing scroll to 0, recalculate all ScrollTrigger positions
    // so pinned sections (Scene, PersonSequence, Projects) start from the
    // correct baseline. Without this, ST may have cached start/end values
    // from the pre-reset scroll position.
    ScrollTrigger.refresh()

    lenis.on('scroll', ScrollTrigger.update)

    // Clamp wheel velocity. Native wheel events can fire deltaY values
    // of 1000+ on a fast trackpad/trackball flick — Lenis would then try
    // to scroll that much in one frame, breaking pinned layouts. We
    // intercept the event at the capture phase and rewrite deltaY
    // BEFORE Lenis sees it.
    const clampWheel = (e) => {
      if (Math.abs(e.deltaY) > MAX_WHEEL_DELTA_PER_EVENT) {
        const sign = e.deltaY > 0 ? 1 : -1
        try {
          e.deltaY = sign * MAX_WHEEL_DELTA_PER_EVENT
        } catch (_) {
          // Some browsers make deltaY read-only; skip silently.
        }
      }
    }
    window.addEventListener('wheel', clampWheel, { passive: true, capture: true })

    const raf = (time) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      window.removeEventListener('wheel', clampWheel, { capture: true })
      lenis.destroy()
    }
  }, [])
}
