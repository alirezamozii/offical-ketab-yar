'use client'

import { useEffect } from 'react'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { toPersianDigits } from '@/lib/typography'

export function BottomNavRuntime() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('[data-bottom-nav]')
    const badge = document.getElementById('bottom-nav-due-badge')
    const backToTop = document.getElementById('back-to-top')
    const backProgress = document.getElementById('back-to-top-progress')
    let lastY = scrollY
    let frame = 0
    const setNavHidden = (hidden: boolean) => {
      if (nav) nav.dataset.hidden = String(hidden)
    }
    const update = () => {
      frame = 0
      const y = scrollY
      const delta = y - lastY
      // Direction with a 4px dead-zone so tiny jitters / momentum bounce
      // don't flip the bar up and down repeatedly. The bar comes back ONLY
      // when the user scrolls up — no automatic re-show on a timer.
      if (Math.abs(delta) >= 4) {
        if (delta > 0 && y > 120) setNavHidden(true)
        else if (delta < 0) setNavHidden(false)
      }
      const max = document.documentElement.scrollHeight - innerHeight
      const ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0
      if (backToTop) {
        const visible = y > 250
        backToTop.dataset.visible = String(visible)
        backToTop.setAttribute('aria-hidden', String(!visible))
        backToTop.tabIndex = visible ? 0 : -1
      }
      if (backProgress) backProgress.style.strokeDashoffset = `${2 * Math.PI * 18 * (1 - ratio)}px`
      lastY = y
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    addEventListener('scroll', onScroll, { passive: true })

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.srs)
      const values = raw ? Object.values(JSON.parse(raw) as Record<string, { nextReview?: number }>) : []
      const due = values.filter((value) => typeof value?.nextReview === 'number' && value.nextReview <= Date.now()).length
      if (badge && due > 0) {
        badge.hidden = false
        badge.textContent = toPersianDigits(Math.min(99, due))
        const link = badge.closest('a')
        link?.setAttribute('aria-label', `داشبورد، ${toPersianDigits(due)} مرور سررسید`)
      }
    } catch {}

    const onClick = () => {
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'vibrate' in navigator) navigator.vibrate(8)
    }
    nav?.addEventListener('click', onClick)
    const onBackToTop = () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    backToTop?.addEventListener('click', onBackToTop)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      removeEventListener('scroll', onScroll)
      nav?.removeEventListener('click', onClick)
      backToTop?.removeEventListener('click', onBackToTop)
    }
  }, [])
  return null
}
