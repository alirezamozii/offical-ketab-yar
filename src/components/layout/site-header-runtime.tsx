'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function SiteHeaderRuntime() {
  const pathname = usePathname()
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('[data-nav-href]').forEach((link) => {
      const href = link.dataset.navHref || ''
      const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
      link.dataset.active = String(active)
      if (active) link.setAttribute('aria-current', 'page')
      else link.removeAttribute('aria-current')
    })
  }, [pathname])

  useEffect(() => {
    const shell = document.getElementById('site-header-shell')
    const header = document.getElementById('site-header')
    const progress = document.getElementById('site-scroll-progress')
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      const scrolled = String(y > 24)
      if (shell) shell.dataset.scrolled = scrolled
      if (header) header.dataset.scrolled = scrolled
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
    }
  }, [])
  return null
}
