/**
 * Shared SVG filters. `#water-warp` ripples the works text as projects change;
 * its displacement scale sits at 0 (a no-op) until WorksViewer animates it.
 */
export function SvgFilters() {
  return (
    <svg className="defs" aria-hidden="true" focusable="false">
      <filter id="water-warp" x="-10%" y="-20%" width="120%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.03" numOctaves="2" seed="7" />
        <feDisplacementMap
          data-water-warp
          in="SourceGraphic"
          scale="0"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  )
}
