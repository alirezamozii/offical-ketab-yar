'use client'

import { cn } from '@/lib/utils'
import { memo, useState } from 'react'
import Image from 'next/image'

interface BookCoverProps {
  /** Kept for backwards compat — title is NO LONGER rendered on the cover
   *  per user feedback ("نوشته رو کتاب که رو جای عکس و اسم مویسنه پاک
   *  کن"). Title/author now appear only in the card meta below the cover. */
  title?: string
  /** Same as title — kept for compat, no longer rendered on the cover. */
  author?: string
  from: string
  to: string
  accent?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Optional uploaded cover image URL (preferred over gradient). */
  imageUrl?: string
  /** Optional blurhash data URL for blur-up placeholder. */
  blurhash?: string
}

/**
 * Procedural book cover — gradient + typography. No network image required,
 * so covers always render reliably and stay on-brand.
 *
 * Realism layers (top → bottom in z-order):
 *   1. Base gradient (150deg, from → to)
 *   1b. Optional uploaded cover image with blur-up placeholder
 *   2. Paper texture overlay — two stacked noise layers:
 *        a) fine grain (.book-cover-texture) — printed-paper noise
 *        b) coarse vertical "pulp streaks" — subtle paper-fiber feel that
 *           reads as material depth when light glances across the cover
 *   3. Top inner shadow (light falling off the top edge — "curl" depth)
 *   4a. Spine — darker right edge (bound side), widens with size
 *   4b. Spine highlight — a 1px bright line at the inside of the spine,
 *       implying light catching the rounded edge of the binding
 *   4c. Page gutter — a faint accent-tinted line just inboard of the spine
 *   5. Inner frame (accent-tinted)
 *   6. Accent glow — bottom-left, blurred, low opacity (harmonizes with
 *      the .book-light pseudo-element which is also bottom-left)
 *   7. Foreground content — REMOVED per user feedback; see comment below.
 *   8. Dog-eared corner — a small triangular fold in the bottom-end
 *      corner, revealed on hover. Reads as "well-thumbed paperback".
 *
 * Light source is top-left throughout (matches .book-light and --shadow-book).
 *
 * Wrapped in `React.memo` because BookCover is a pure visual component
 * rendered inside every BookCard (which is rendered in lists of 20+).
 * Props are all primitives (strings + an enum `size`), so shallow
 * comparison skips re-renders when nothing changed. `memo` does NOT
 * break the internal `useState(imgLoaded)` — memo only short-circuits
 * re-renders on prop changes, not on internal hook updates.
 */
export const BookCover = memo(function BookCover({
  from,
  to,
  accent = '#ffffff',
  className,
  size = 'md',
  imageUrl,
  blurhash,
}: BookCoverProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const hasImage = !!imageUrl

  // Spine width scales with size — a hero cover needs a wider spine.
  const spineWidth = size === 'xl' ? 'w-5' : size === 'lg' ? 'w-4' : 'w-3'
  // Page-gutter line offset from the right edge (just inboard of the spine).
  const gutterInset = size === 'xl' ? 'right-5' : size === 'lg' ? 'right-4' : 'right-3'
  // Top inner shadow strength — bigger cover, softer & wider falloff.
  const topShadow =
    size === 'xl'
      ? 'inset 0 14px 36px -10px rgba(0,0,0,0.40)'
      : size === 'lg'
        ? 'inset 0 10px 26px -8px rgba(0,0,0,0.36)'
        : 'inset 0 8px 22px -8px rgba(0,0,0,0.32)'
  // Accent ambient glow — bottom-left, large, blurred, low opacity.
  // Position/size scale with the cover.
  const glowSize =
    size === 'xl' ? 'h-44 w-44' : size === 'lg' ? 'h-32 w-32' : 'h-28 w-28'
  const glowOpacity = size === 'xl' ? 'opacity-[0.18]' : 'opacity-[0.14]'

  return (
    <div
      className={cn(
        'book-light group/cover relative h-full w-full overflow-hidden',
        className,
      )}
      style={{
        background: `linear-gradient(150deg, ${from} 0%, ${to} 100%)`,
      }}
    >
      {/* (1b) Uploaded cover image — shown with blur-up placeholder when
           imageUrl is provided. The gradient base stays as a fallback
           underneath, so if the image fails to load the cover still
           looks intentional. */}
      {hasImage && (
        <>
          {blurhash && (
            // eslint-disable-next-line @next/next/no-img-element -- blurhash data URL placeholder; next/image placeholder="blur" needs a base64 image, not a blurhash.
            <img
              src={blurhash}
              alt=""
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
                imgLoaded ? 'opacity-0' : 'opacity-100 blur-md scale-105',
              )}
            />
          )}
          <Image
            src={imageUrl!}
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 1024px) 240px, (min-width: 640px) 180px, 140px"
            onLoad={() => setImgLoaded(true)}
            className={cn(
              'pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
              imgLoaded ? 'opacity-100' : 'opacity-0',
            )}
          />
          {/* Dark gradient overlay on top of the image so any text/UI that
              sits on the cover (none today, but kept for forward-compat)
              stays readable. */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.55) 100%)',
            }}
            aria-hidden="true"
          />
        </>
      )}

      {/* (2a) Paper texture overlay — subtle printed-paper noise */}
      <div
        className="book-cover-texture pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      {/* (2b) Paper pulp streaks — vertical fibers that catch the light.
          Layered very faint so the cover reads as a material surface
          rather than a flat gradient. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        aria-hidden="true"
        style={{
          backgroundImage:
            'repeating-linear-gradient(92deg, rgba(255,255,255,0.6) 0px, transparent 1px, transparent 3px, rgba(0,0,0,0.5) 4px, transparent 5px, transparent 11px)',
        }}
      />

      {/* (3) Top inner shadow — light falling off the top edge */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: topShadow }}
        aria-hidden="true"
      />

      {/* (4a) Spine — darker right edge (bound side), widens with size */}
      <div
        className={cn('absolute inset-y-0 right-0', spineWidth)}
        style={{
          background:
            'linear-gradient(to left, rgba(0,0,0,0.7), rgba(0,0,0,0.25) 60%, transparent)',
        }}
        aria-hidden="true"
      />
      {/* (4b) Spine highlight — a thin bright line at the inside of the
           binding, implying light catching the rounded edge of the spine.
           Sits just to the left of the spine width. */}
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 w-px opacity-40',
          size === 'xl' ? 'right-5' : size === 'lg' ? 'right-4' : 'right-3',
        )}
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgba(255,255,255,0.5) 18%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 82%, transparent)',
        }}
        aria-hidden="true"
      />
      {/* (4c) Page gutter — a faint accent-tinted line just inboard of the
           spine, implying the page stack visible at the binding. */}
      <div
        className={cn(
          'pointer-events-none absolute inset-y-2 w-px opacity-30',
          gutterInset,
        )}
        style={{ background: accent }}
        aria-hidden="true"
      />

      {/* (5) Decorative inner frame */}
      <div
        className="pointer-events-none absolute inset-3 rounded-lg border opacity-25"
        style={{ borderColor: accent }}
        aria-hidden="true"
      />

      {/* (6) Accent ambient glow — bottom-left, large, blurred, low opacity.
           Harmonizes with .book-light (also bottom-left) so the cover reads
           as a single light source rather than two competing ones. */}
      <div
        className={cn(
          'pointer-events-none absolute -bottom-10 -left-10 rounded-full blur-3xl',
          glowSize,
          glowOpacity,
        )}
        style={{ background: accent }}
        aria-hidden="true"
      />

      {/* (7) Foreground content — REMOVED per user feedback.
          User said: "ت ایند ما به حجای این شتا عکس کتاب میراریم و این که
          نوشته رو کتاب که رو جای عکس و اسم مویسنه پاک کن".
          The cover now shows ONLY the gradient + texture + spine + frame
          (plus the optional uploaded image when present). Title and author
          are displayed BELOW the cover in the card meta section (BookCard.tsx),
          not on the cover itself. This keeps the cover clean — it's a
          placeholder for the real cover image that will be uploaded later. */}

      {/* (8) Dog-eared corner — a triangular fold on the bottom-end corner
           that appears on hover. The two-tone triangle (slightly lighter
           underside over the cover color) reads as a folded page corner.
           Disabled on touch devices via .hover-only-fine. */}
      <div
        className="hover-only-fine pointer-events-none absolute bottom-0 right-0 h-0 w-0 opacity-0 transition-opacity duration-500 ease-out-expo group-hover/cover:opacity-100"
        aria-hidden="true"
        style={{
          // The "folded" triangle — created with border trick. The end side
          // (right in RTL) gets a ~14% diagonal fold.
          borderTop: `${
            size === 'xl' ? 28 : size === 'lg' ? 22 : size === 'sm' ? 14 : 18
          }px solid transparent`,
          borderRight: `${
            size === 'xl' ? 28 : size === 'lg' ? 22 : size === 'sm' ? 14 : 18
          }px solid rgba(0,0,0,0.18)`,
          // The underside of the fold — slightly lighter than the cover so
          // it reads as the back of the page showing through.
          filter: 'drop-shadow(-1px -1px 1px rgba(255,255,255,0.18))',
        }}
      />
      {/* Inner page underside — a smaller triangle, lighter, sitting just
          inside the fold to suggest the underside of the turned-up page. */}
      <div
        className="hover-only-fine pointer-events-none absolute bottom-0 right-0 z-20 h-0 w-0 opacity-0 transition-opacity duration-500 ease-out-expo group-hover/cover:opacity-100"
        aria-hidden="true"
        style={{
          borderTop: `${
            size === 'xl' ? 22 : size === 'lg' ? 17 : size === 'sm' ? 11 : 14
          }px solid transparent`,
          borderRight: `${
            size === 'xl' ? 22 : size === 'lg' ? 17 : size === 'sm' ? 11 : 14
          }px solid rgba(255,255,255,0.12)`,
        }}
      />
    </div>
  )
})
