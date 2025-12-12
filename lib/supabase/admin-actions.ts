import { createClient } from '@/lib/supabase/client'

export interface AdminAction {
    id: string
    admin_id: string
    action_type: string
    target_user_id: string | null
    details: Record<string, unknown>
    created_at: string
}

export interface UserProfile {
    id: string
    email: string
    full_name: string | null
    username: string | null
    role: 'user' | 'admin' | 'test_user'
    is_banned: boolean
    banned_at: string | null
    banned_reason: string | null
    subscription_tier: string
    subscription_status: string
    subscription_expires_at: string | null
    created_at: string
}

/**
 * مسدود کردن کاربر - با به‌روزرسانی فوری
 */
export async function banUser(userId: string, reason: string) {
    const supabase = createClient()

    // به‌روزرسانی پروفایل
    const { data, error } = await supabase
        .from('profiles')
        .update({
            is_banned: true,
            banned_at: new Date().toISOString(),
            banned_reason: reason,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

    if (error) {
        console.error('خطا در مسدود کردن کاربر:', error)
        throw new Error('مسدود کردن کاربر با خطا مواجه شد: ' + error.message)
    }

    return { success: true, data }
}

/**
 * رفع مسدودیت کاربر - با به‌روزرسانی فوری
 */
export async function unbanUser(userId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('profiles')
        .update({
            is_banned: false,
            banned_at: null,
            banned_reason: null,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

    if (error) {
        console.error('خطا در رفع مسدودیت:', error)
        throw new Error('رفع مسدودیت با خطا مواجه شد: ' + error.message)
    }

    return { success: true, data }
}

/**
 * تبدیل کاربر به ادمین - با دسترسی نامحدود پرمیوم
 */
export async function makeUserAdmin(userId: string) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('احراز هویت نشده است')

    // تاریخ انقضا: 100 سال بعد (نامحدود)
    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 100)

    const { data, error } = await supabase
        .from('profiles')
        .update({
            role: 'admin',
            made_admin_by: user.id,
            made_admin_at: new Date().toISOString(),
            // ادمین‌ها هم پرمیوم نامحدود دارند
            subscription_tier: 'annual',
            subscription_status: 'active',
            subscription_expires_at: expiryDate.toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

    if (error) {
        console.error('خطا در تبدیل به ادمین:', error)
        throw new Error('تبدیل به ادمین با خطا مواجه شد: ' + error.message)
    }

    return { success: true, data }
}

/**
 * حذف نقش ادمین از کاربر
 */
export async function removeUserAdmin(userId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('profiles')
        .update({
            role: 'user',
            made_admin_by: null,
            made_admin_at: null,
            // برگرداندن به اشتراک رایگان
            subscription_tier: 'free',
            subscription_status: 'inactive',
            subscription_expires_at: null,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

    if (error) {
        console.error('خطا در حذف نقش ادمین:', error)
        throw new Error('حذف نقش ادمین با خطا مواجه شد: ' + error.message)
    }

    return { success: true, data }
}

/**
 * ایجاد کاربر تستی با دسترسی نامحدود پرمیوم
 * شامل: نام، نام کاربری، ایمیل، رمز عبور
 */
export async function createTestUser(
    email: string,
    password: string,
    fullName: string,
    username?: string
) {
    const supabase = createClient()

    // ایجاد کاربر در سیستم احراز هویت
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                username: username || email.split('@')[0],
            },
            emailRedirectTo: undefined // جلوگیری از ارسال ایمیل تأیید
        }
    })

    if (authError) {
        console.error('خطا در ایجاد کاربر:', authError)
        throw new Error(authError.message)
    }

    if (!authData.user) {
        throw new Error('ایجاد کاربر با خطا مواجه شد')
    }

    // تاریخ انقضا: 100 سال بعد (نامحدود)
    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 100)

    // تنظیم پروفایل به عنوان کاربر تستی با اشتراک نامحدود
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
            role: 'test_user',
            full_name: fullName,
            username: username || email.split('@')[0],
            subscription_tier: 'annual',
            subscription_status: 'active',
            subscription_expires_at: expiryDate.toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id)
        .select()
        .single()

    if (profileError) {
        console.error('خطا در تنظیم پروفایل:', profileError)
        throw new Error('تنظیم پروفایل با خطا مواجه شد: ' + profileError.message)
    }

    return { success: true, userId: authData.user.id, profile: profileData }
}

/**
 * دریافت لیست تمام کاربران با فیلتر
 */
export async function getAllUsers(filters?: {
    role?: string
    subscription?: string
    banned?: boolean
    search?: string
}) {
    const supabase = createClient()

    let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (filters?.role) {
        query = query.eq('role', filters.role)
    }

    if (filters?.subscription) {
        query = query.eq('subscription_tier', filters.subscription)
    }

    if (filters?.banned !== undefined) {
        query = query.eq('is_banned', filters.banned)
    }

    if (filters?.search) {
        query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%,username.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
        console.error('خطا در دریافت کاربران:', error)
        throw new Error('دریافت کاربران با خطا مواجه شد: ' + error.message)
    }

    return data as UserProfile[]
}

/**
 * دریافت آمار پلتفرم
 */
export async function getPlatformStats() {
    const supabase = createClient()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
        { count: totalUsers },
        { count: adminUsers },
        { count: testUsers },
        { count: bannedUsers },
        { count: premiumUsers },
        { count: activeUsers },
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'test_user'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active').neq('subscription_tier', 'free'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', thirtyDaysAgo.toISOString()),
    ])

    return {
        totalUsers: totalUsers || 0,
        adminUsers: adminUsers || 0,
        testUsers: testUsers || 0,
        bannedUsers: bannedUsers || 0,
        premiumUsers: premiumUsers || 0,
        activeUsers: activeUsers || 0,
    }
}

/**
 * خروجی CSV از کاربران
 */
export async function exportUsersToCSV() {
    const users = await getAllUsers()

    const headers = ['ایمیل', 'نام', 'نام کاربری', 'نقش', 'اشتراک', 'وضعیت', 'مسدود', 'تاریخ عضویت']
    const rows = users.map(user => [
        user.email || '',
        user.full_name || '',
        user.username || '',
        user.role === 'admin' ? 'ادمین' : user.role === 'test_user' ? 'کاربر تستی' : 'کاربر عادی',
        user.subscription_tier === 'free' ? 'رایگان' :
            user.subscription_tier === 'monthly' ? 'ماهانه' :
                user.subscription_tier === 'quarterly' ? 'سه‌ماهه' :
                    user.subscription_tier === 'annual' ? 'سالانه' : user.subscription_tier,
        user.subscription_status === 'active' ? 'فعال' : 'غیرفعال',
        user.is_banned ? 'بله' : 'خیر',
        new Date(user.created_at).toLocaleDateString('fa-IR')
    ])

    // Add BOM for UTF-8 encoding (for Excel to recognize Persian characters)
    const BOM = '\uFEFF'
    const csvContent = BOM + [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return csvContent
}
