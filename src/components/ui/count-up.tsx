import { toPersianDigits } from '@/lib/typography'

export function CountUp({ to }: { to: number; duration?: number }) {
  return <span>{toPersianDigits(to)}</span>
}
