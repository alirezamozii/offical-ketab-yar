'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
    calculateAge,
    dateToJalali,
    formatJalaliDate,
    isValidJalaliDate,
    JALALI_MONTH_NAMES,
    jalaliToDate,
    type JalaliDate,
} from '@/lib/utils/jalali-converter'
import { Calendar } from 'lucide-react'
import { useMemo, useState } from 'react'

interface JalaliDatePickerProps {
    value: Date | null
    onChange: (date: Date) => void
    label?: string
    error?: string
    placeholder?: string
    required?: boolean
}

export function JalaliDatePicker({
    value,
    onChange,
    label = 'تاریخ تولد',
    error,
    placeholder = 'انتخاب تاریخ',
    required = false,
}: JalaliDatePickerProps) {
    const [open, setOpen] = useState(false)
    const [jalaliDate, setJalaliDate] = useState<JalaliDate | null>(
        value ? dateToJalali(value) : null
    )

    // Set default date to 1383/01/01 when picker opens if no date selected
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen && !jalaliDate) {
            setJalaliDate({ year: 1383, month: 1, day: 1 })
        }
    }

    // Current Jalali date for max date calculation
    const today = new Date()
    const todayJalali = dateToJalali(today)
    const currentYear = todayJalali.year // Current Shamsi year (e.g., 1403)

    // Generate year options - reasonable range for Iranian users (memoized for performance)
    const years = useMemo(() => {
        const minYear = 1350 // Start from 1350 (1971 in Gregorian)
        const maxYear = currentYear // Up to current year
        return Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i) // Descending order
    }, [currentYear])

    // Handle date change
    const handleDateChange = (year: number, month: number, day: number) => {
        if (!isValidJalaliDate(year, month, day)) return

        const newJalaliDate: JalaliDate = { year, month, day }
        setJalaliDate(newJalaliDate)

        const gregorianDate = jalaliToDate(newJalaliDate)
        onChange(gregorianDate)
    }

    // Get max day for selected month
    const getMaxDay = (year: number, month: number): number => {
        if (month <= 6) return 31
        if (month < 12) return 30
        // Check if leap year for month 12
        return 29 // Simplified, should check leap year
    }

    const maxDay = jalaliDate ? getMaxDay(jalaliDate.year, jalaliDate.month) : 31
    const days = useMemo(() => Array.from({ length: maxDay }, (_, i) => i + 1), [maxDay])

    // Format display value
    const displayValue = jalaliDate ? formatJalaliDate(jalaliDate) : placeholder

    return (
        <div className="space-y-2">
            {label && (
                <Label>
                    {label}
                    {required && <span className="text-destructive mr-1">*</span>}
                </Label>
            )}

            <Popover open={open} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            'w-full justify-start text-right font-normal h-12',
                            !jalaliDate && 'text-muted-foreground',
                            error && 'border-destructive'
                        )}
                    >
                        <Calendar className="ml-2 size-4" />
                        {displayValue}
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-4" align="start">
                    <div className="space-y-4">
                        <div className="text-sm font-medium text-center">
                            انتخاب تاریخ تولد (تقویم شمسی)
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {/* Year */}
                            <div className="space-y-2">
                                <Label className="text-xs">سال</Label>
                                <Select
                                    value={jalaliDate?.year.toString() || "1383"}
                                    onValueChange={(value) => {
                                        const year = parseInt(value)
                                        handleDateChange(
                                            year,
                                            jalaliDate?.month || 1,
                                            jalaliDate?.day || 1
                                        )
                                    }}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="1383" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]" position="popper">
                                        {years.map((year) => (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Month */}
                            <div className="space-y-2">
                                <Label className="text-xs">ماه</Label>
                                <Select
                                    value={jalaliDate?.month.toString() || "1"}
                                    onValueChange={(value) => {
                                        const month = parseInt(value)
                                        handleDateChange(
                                            jalaliDate?.year || 1383,
                                            month,
                                            jalaliDate?.day || 1
                                        )
                                    }}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="فروردین" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        {JALALI_MONTH_NAMES.map((name, index) => (
                                            <SelectItem key={index + 1} value={(index + 1).toString()}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Day */}
                            <div className="space-y-2">
                                <Label className="text-xs">روز</Label>
                                <Select
                                    value={jalaliDate?.day.toString() || "1"}
                                    onValueChange={(value) => {
                                        const day = parseInt(value)
                                        handleDateChange(
                                            jalaliDate?.year || 1383,
                                            jalaliDate?.month || 1,
                                            day
                                        )
                                    }}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="1" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]" position="popper">
                                        {days.map((day) => (
                                            <SelectItem key={day} value={day.toString()}>
                                                {day}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Age display */}
                        {jalaliDate && (
                            <div className="text-center text-sm text-muted-foreground">
                                سن شما: {calculateAge(jalaliToDate(jalaliDate))} سال
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                    setJalaliDate({ year: 1383, month: 1, day: 1 })
                                }}
                            >
                                بازنشانی
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 bg-gold hover:bg-gold/90"
                                onClick={() => setOpen(false)}
                                disabled={!jalaliDate}
                            >
                                تأیید
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
        </div>
    )
}
