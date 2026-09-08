import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BookListItem } from '@/lib/data'
import { BookCarousel } from './book-carousel'

vi.mock('./book-card', () => ({ BookCard: () => <span role="link">Example book</span> }))

afterEach(cleanup)

function pointer(el: Element, type: string, x: number, pointerType = 'mouse') {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, { pointerType, pointerId: 1, button: 0, clientX: x })
  fireEvent(el, event)
}

function setup() {
  render(<BookCarousel books={[{ id: '1', slug: 'example' } as BookListItem]} />)
  const link = screen.getByRole('link')
  const scroller = link.parentElement!.parentElement!
  const capture = vi.fn()
  Object.assign(scroller, { setPointerCapture: capture, releasePointerCapture: vi.fn() })
  return { link, scroller, capture }
}

describe('BookCarousel pointer behavior', () => {
  it('preserves ordinary clicks without capturing the link pointer', () => {
    const { link, capture } = setup()
    pointer(link, 'pointerdown', 100)
    pointer(link, 'pointerup', 100)
    expect(capture).not.toHaveBeenCalled()
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    fireEvent(link, click)
    expect(click.defaultPrevented).toBe(false)
  })

  it('drags RTL content in the correct direction and suppresses accidental navigation', () => {
    const { link, scroller, capture } = setup()
    pointer(link, 'pointerdown', 100)
    pointer(link, 'pointermove', 160)
    expect(capture).toHaveBeenCalledWith(1)
    expect(scroller.scrollLeft).toBe(-60)
    pointer(scroller, 'pointerup', 160)
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    fireEvent(link, click)
    expect(click.defaultPrevented).toBe(true)
  })

  it('leaves touch swipes to the browser', () => {
    const { link, scroller, capture } = setup()
    pointer(link, 'pointerdown', 100, 'touch')
    pointer(link, 'pointermove', 160, 'touch')
    expect(capture).not.toHaveBeenCalled()
    expect(scroller.scrollLeft).toBe(0)
  })
})
