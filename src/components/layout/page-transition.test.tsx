import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageTransition } from './page-transition'

describe('PageTransition', () => {
  it('keeps the initial content visible after a provider rerender, and animates a new navigation', () => {
    const view = render(<PageTransition><h1>First page</h1></PageTransition>)
    const wrapper = screen.getByRole('heading').parentElement!
    expect(wrapper.className).toBe('min-h-0')
    view.rerender(<PageTransition><h1>Updated content</h1></PageTransition>)
    expect(wrapper.className).toBe('min-h-0')
    view.unmount()
    render(<PageTransition><h1>Next page</h1></PageTransition>)
    expect(screen.getByRole('heading').parentElement!.className).toContain('motion-safe:animate-')
    expect(screen.getByRole('heading').parentElement!.className).not.toContain('opacity-0')
  })
})
