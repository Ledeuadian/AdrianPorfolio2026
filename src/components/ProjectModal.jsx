import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

/**
 * High-tech hologram-style modal for showing project details.
 *
 * Visual treatment:
 *   - Full-screen overlay with a dim+blur backdrop.
 *   - Centered "monitor" frame with chamfered corners, grid lines,
 *     scanline sweep, and a soft purple glow.
 *   - Left: large project image rendered as a holographic projection
 *     (faint cyan/purple duotone, scanlines, slight chromatic offset).
 *   - Right: project title, tag, description, and a tech stack chip row.
 *   - Close button (X) in the top-right corner.
 *   - Keyboard: ESC closes. Click on backdrop closes.
 *
 * Animation:
 *   - Entry: backdrop fades in, then the monitor scales+fades in with
 *     a 3D rotateY from -15deg to 0 (slides in from the left).
 *   - Exit: reverses.
 *   - A looping scanline animation runs while the modal is open.
 */
export default function ProjectModal({ project, onClose }) {
  const overlayRef = useRef(null)
  const monitorRef = useRef(null)
  const scanlineRef = useRef(null)
  const imageRef = useRef(null)
  const titleRef = useRef(null)
  const descriptionRef = useRef(null)
  const techRef = useRef(null)

  // Run entry + scanline animation when project changes.
  useEffect(() => {
    if (!project) return

    const overlay = overlayRef.current
    const monitor = monitorRef.current
    const scanline = scanlineRef.current
    if (!overlay || !monitor) return

    // Force the browser to render the initial state BEFORE we start
    // tweening. Without this, the GPU may batch the entry animation
    // onto the same frame as the React mount, producing a single
    // janky "delayed start" frame. Reading offsetWidth flushes layout.
    void monitor.offsetWidth

    const ctx = gsap.context(() => {
      // Backdrop fade in (very short — it sits behind the monitor
      // and doesn't need much attention).
      gsap.fromTo(
        overlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.15, ease: 'power1.out' },
      )

      // Monitor entrance: scale + fade + slide from the left.
      // Uses ONLY transform + opacity (cheap GPU-composited properties).
      // NO filter:blur and NO rotateY — both force the GPU to rasterize
      // the element on every frame and were the main cause of the lag.
      const tl = gsap.timeline({ delay: 0.04 })
      tl.fromTo(
        monitor,
        { opacity: 0, scale: 0.94, x: -40 },
        { opacity: 1, scale: 1, x: 0, duration: 0.32, ease: 'power2.out' },
        0,
      )
      // Stagger the inner content so it snaps in after the monitor
      // frame lands — this also masks any minor first-frame stutter.
      const innerTargets = [
        titleRef.current,
        descriptionRef.current,
        techRef.current,
      ].filter(Boolean)
      tl.fromTo(
        innerTargets,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out', stagger: 0.05 },
        0.12,
      )

      // Hologram image: subtle floating motion while the modal is open.
      // Small distance (6px) keeps it cheap.
      if (imageRef.current) {
        gsap.to(imageRef.current, {
          y: -6,
          duration: 2.4,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        })
      }

      // Looping scanline sweep across the monitor face.
      if (scanline) {
        gsap.fromTo(
          scanline,
          { yPercent: -110 },
          { yPercent: 110, duration: 2.2, ease: 'none', repeat: -1 },
        )
      }
    }, overlay)

    return () => ctx.revert()
  }, [project])

  // Esc key closes modal.
  useEffect(() => {
    if (!project) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [project, onClose])

  // Lock body scroll while modal is open.
  useEffect(() => {
    if (!project) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [project])

  if (!project) return null

  const handleBackdropClick = (e) => {
    // Only close if the click is on the overlay itself, not on the
    // monitor contents.
    if (e.target === overlayRef.current) onClose()
  }

  const handleClose = () => {
    const overlay = overlayRef.current
    const monitor = monitorRef.current
    if (!overlay || !monitor) {
      onClose()
      return
    }

    // Quick exit: shrink + slide + fade, then close.
    // Only transform + opacity (cheap GPU props).
    const tl = gsap.timeline({ onComplete: () => onClose() })
    tl.to(monitor, {
      opacity: 0,
      scale: 0.96,
      x: -20,
      duration: 0.2,
      ease: 'power2.in',
    }, 0)
    tl.to(overlay, {
      opacity: 0,
      duration: 0.18,
      ease: 'power2.in',
    }, 0.04)
  }

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div ref={monitorRef} className="modal-monitor">
        {/* Decorative chrome corners */}
        <span className="monitor-corner monitor-corner--tl" />
        <span className="monitor-corner monitor-corner--tr" />
        <span className="monitor-corner monitor-corner--bl" />
        <span className="monitor-corner monitor-corner--br" />

        {/* Grid background overlay (decorative) */}
        <div className="monitor-grid" aria-hidden="true" />

        {/* Top status bar */}
        <div className="monitor-status">
          <span className="status-dot status-dot--green" />
          <span className="status-dot status-dot--amber" />
          <span className="status-label">PROJECT :: {project.id.toString().padStart(2, '0')}</span>
        </div>

        {/* Close button */}
        <button
          type="button"
          className="modal-close"
          onClick={handleClose}
          aria-label="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Main content: image on left, description on right */}
        <div className="modal-content">
          <div className="modal-image-wrap">
            <div className="image-frame">
              <img
                ref={imageRef}
                src={project.img}
                alt={project.title}
                className="modal-image"
                draggable={false}
              />
            </div>
            <div className="image-frame-label">VISUAL_FEED</div>
          </div>

          <div className="modal-text">
            <div className="text-meta">
              <span className="tag">{project.tag}</span>
              <span className="meta-divider">/</span>
              <span className="meta-id">ID_{project.id.toString().padStart(2, '0')}</span>
            </div>
            <h2 ref={titleRef} id="modal-title" className="modal-title">{project.title}</h2>
            <p ref={descriptionRef} className="modal-description">{project.description}</p>

            {project.tech && project.tech.length > 0 && (
              <div ref={techRef} className="modal-tech">
                <div className="modal-tech-stack">
                  <span className="tech-label">STACK</span>
                  <div className="tech-chips">
                    {project.tech.map((t) => (
                      <span key={t} className="tech-chip">{t}</span>
                    ))}
                  </div>
                </div>
                {project.link?.url && (
                  <a
                    className="modal-link"
                    href={project.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="modal-link-label">{project.link.label || 'Open'}</span>
                    <svg
                      className="modal-link-icon"
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
            )}
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="monitor-footer">
          <span>SCROLL_LOCKED</span>
          <span className="footer-sep">|</span>
          <span>ESC :: CLOSE</span>
        </div>

        {/* Scanline sweep (above everything) */}
        <div ref={scanlineRef} className="monitor-scanline" aria-hidden="true" />
      </div>
    </div>
  )
}
