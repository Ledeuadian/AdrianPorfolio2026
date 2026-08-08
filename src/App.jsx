import useSmoothScroll from './hooks/useSmoothScroll'
import Scene from './components/Scene'
import Sections from './components/Sections'

export default function App() {
  useSmoothScroll()

  return (
    <>
      <Scene />
      <Sections />
      {/* Person5 handoff anchor: outside all pinned sections so it
          remains fixed while the Projects conveyor scrolls. */}
      <div className="person5-anchor" aria-hidden="true">
        <img src="/Person5.png" alt="" draggable={false} />
      </div>
    </>
  )
}