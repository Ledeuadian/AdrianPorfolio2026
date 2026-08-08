/**
 * Person1 placeholder.
 *
 * Renders the single Person1.png image fixed at bottom-left. The actual
 * reveal animation is driven by Scene.jsx's zoom timeline (so Person1
 * appears together with 2ndBG as 1stBG zooms out). PersonSequence later
 * animates this same image into Person2..5.
 */
export default function Person1Reveal() {
  return (
    <section className="person1-reveal">
      <div className="person1-reveal__stage">
        <img src="/Person1.png" alt="" draggable={false} />
      </div>
    </section>
  )
}
