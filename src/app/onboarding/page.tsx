'use client'

/**
 * /onboarding — post-signin onboarding wizard
 *
 * Step 1: Welcome (skippable to step 2)
 * Step 2: Pick username (validated for uniqueness)
 * Step 3: Pick English level (A1-C2) with descriptions
 * Step 4: Done → redirect to /dashboard
 *
 * Optimized for mobile-first, RTL Persian.
 */

import { useState } from 'react'
import { errorMessage } from '@/lib/error'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Check, ChevronLeft, Loader2, Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const LEVELS = [
  {
    value: 'A1',
    title: 'مقدماتی',
    desc: 'تازه شروع به یادگیری کرده‌ام — کلمات ساده و جملات کوتاه',
    color: 'from-emerald-400 to-emerald-600',
  },
  {
    value: 'A2',
    title: 'پایه',
    desc: 'مکالمات روزمره ساده را می‌فهمم',
    color: 'from-teal-400 to-teal-600',
  },
  {
    value: 'B1',
    title: 'متوسط',
    desc: 'می‌توانم کتاب‌های ساده بخوانم و بحث کنم',
    color: 'from-amber-400 to-amber-600',
    recommended: true,
  },
  {
    value: 'B2',
    title: 'متوسط پیشرفته',
    desc: 'متن‌های پیچیده‌تر را می‌فهمم',
    color: 'from-orange-400 to-orange-600',
  },
  {
    value: 'C1',
    title: 'پیشرفته',
    desc: 'روان می‌خوانم و می‌نویسم',
    color: 'from-rose-400 to-rose-600',
  },
  {
    value: 'C2',
    title: 'مسلط',
    desc: 'سطح زبان مادری — کتاب‌های فلسفی و پیچیده',
    color: 'from-stone-500 to-stone-700',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { update } = useSession()
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [level, setLevel] = useState('')
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)

  async function checkUsername(u: string) {
    setUsername(u)
    setAvailable(null)
    if (u.length < 3) return
    setChecking(true)
    try {
      const res = await fetch(`/api/auth/check-username?u=${encodeURIComponent(u)}`)
      const json = await res.json()
      setAvailable(json.available)
    } catch {
      // ignore
    } finally {
      setChecking(false)
    }
  }

  async function finish() {
    if (!username || username.length < 3) {
      toast.error('نام کاربری نامعتبر')
      return
    }
    if (!level) {
      toast.error('لطفاً سطح انگلیسی خود را انتخاب کنید')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, englishLevel: level, name: name || undefined }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Failed')
      // Refresh the session so the JWT picks up onboardingCompleted
      await update({ username, onboardingCompleted: true, englishLevel: level })
      toast.success('خوش آمدید! آماده شروع هستید.')
      router.push('/dashboard')
      router.refresh()
    } catch (e: unknown) {
      toast.error(errorMessage(e, 'ذخیره ناموفق'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-amber-50 via-stone-50 to-rose-50 flex flex-col" dir="rtl">
      {/* Progress bar */}
      <div className="h-1.5 bg-stone-200">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-stone-700 transition-[transform,opacity,colors,border-color,background-color] duration-500"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Step 1 — Welcome */}
          {step === 1 && (
            <div className="text-center space-y-6 py-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-stone-700 text-white shadow-xl shadow-amber-500/30">
                <Sparkles className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold">به کتاب‌یار خوش آمدید!</h1>
                <p className="text-muted-foreground leading-relaxed">
                  برای شخصی‌سازی تجربه شما، چند سؤال سریع می‌پرسیم.
                  فقط ۳۰ ثانیه طول می‌کشد.
                </p>
              </div>
              <Button
                onClick={() => setStep(2)}
                size="lg"
                className="w-full h-14 text-base gap-2 bg-gradient-to-r from-amber-600 to-stone-700 hover:from-amber-700 hover:to-stone-800"
              >
                شروع کنید
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Step 2 — Username */}
          {step === 2 && (
            <Card className="shadow-xl border-stone-200/60">
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-2">
                    <User className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-bold">نام کاربری خود را انتخاب کنید</h2>
                  <p className="text-sm text-muted-foreground">
                    این نام در لیدربورد و نقد‌ها نمایش داده می‌شود.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">نام کاربری</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => checkUsername(e.target.value)}
                      placeholder="مثلاً: ali_reader"
                      dir="ltr"
                      className="text-left h-12 pr-10"
                      maxLength={30}
                      autoComplete="username"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      @
                    </div>
                  </div>
                  {checking && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      در حال بررسی...
                    </p>
                  )}
                  {available === true && username.length >= 3 && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                      <Check className="w-3 h-3" />
                      این نام در دسترس است
                    </p>
                  )}
                  {available === false && (
                    <p className="text-xs text-destructive">
                      این نام قبلاً گرفته شده است
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    حداقل ۳ کاراکتر — فقط حروف، عدد، نقطه و خط تیره
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">نام نمایشی (اختیاری)</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="نام شما"
                    className="h-12"
                    maxLength={60}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12"
                  >
                    بازگشت
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={username.length < 3 || available === false}
                    className="flex-1 h-12 gap-2"
                  >
                    ادامه
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3 — English Level */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-2">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold">سطح انگلیسی شما؟</h2>
                <p className="text-sm text-muted-foreground">
                  برای پیشنهاد کتاب‌های مناسب به ما کمک کنید
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLevel(l.value)}
                    className={cn(
                      'text-right p-4 rounded-xl border-2 transition-[transform,opacity,colors,border-color,background-color] relative',
                      level === l.value
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-stone-200 bg-white hover:border-stone-300',
                    )}
                  >
                    {l.recommended && (
                      <span className="absolute top-2 left-2 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                        پیشنهادی
                      </span>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn('w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br', l.color)}>
                        {l.value}
                      </div>
                      <span className="font-bold">{l.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{l.desc}</p>
                    {level === l.value && (
                      <Check className="absolute bottom-2 left-2 w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 h-12"
                >
                  بازگشت
                </Button>
                <Button
                  onClick={finish}
                  disabled={!level || saving}
                  className="flex-1 h-12 gap-2 bg-gradient-to-r from-amber-600 to-stone-700"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? 'در حال ذخیره...' : 'شروع مطالعه'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
