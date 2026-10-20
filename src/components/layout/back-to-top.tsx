const RADIUS = 18
const CIRC = 2 * Math.PI * RADIUS

export function BackToTop() {
  return (
    <button id="back-to-top" type="button" aria-label="بازگشت به بالا" aria-hidden="true" tabIndex={-1} data-visible="false" className="fixed end-4 bottom-24 z-30 flex h-11 w-11 translate-y-2 scale-75 items-center justify-center rounded-full border border-border/70 bg-background/95 text-foreground opacity-0 shadow-lg shadow-gold-500/10 pointer-events-none backdrop-blur-md transition-all duration-300 ease-out hover:border-gold-500/60 hover:text-gold-600 data-[visible=true]:translate-y-0 data-[visible=true]:scale-100 data-[visible=true]:opacity-100 data-[visible=true]:pointer-events-auto dark:hover:text-gold-400 md:bottom-6 motion-safe:active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <svg className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <circle cx="22" cy="22" r={RADIUS} className="stroke-border/40" strokeWidth="2.5" />
        <circle id="back-to-top-progress" cx="22" cy="22" r={RADIUS} className="stroke-gold-500 dark:stroke-gold-400" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={CIRC} style={{ strokeDashoffset: `${CIRC}px` }} />
      </svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="relative h-5 w-5"><path d="m18 15-6-6-6 6" /></svg>
    </button>
  )
}
