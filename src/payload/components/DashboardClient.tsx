'use client'

import React, { useState, useEffect, startTransition, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Crown,
  Search,
  X,
  Copy,
  Check,
  BarChart3,
  BookOpen,
  Clock,
  Download,
  Ticket,
  Sparkles,
  Trophy,
  Flame,
  BookMarked,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  FileCode2,
  Layers,
  MessageSquare,
  Bookmark,
  Trash2,
  Zap,
  Activity,
  ArrowUpRight,
  Database,
  RefreshCw,
  ChevronLeft,
  Eye,
  MoreVertical,
} from 'lucide-react'
import { ContentStudio } from './ContentStudio'
import {
  fetchStats,
  searchUsers,
  updateUserRole,
  banUser,
  unbanUser,
  deleteUser,
  importBookAction,
  DashboardStats,
  ManagedUser,
} from './actions'

interface DashboardClientProps {
  initialStats: DashboardStats
  initialUsers: ManagedUser[]
  currentAdminRole?: 'owner' | 'admin' | 'editor'
}

type UserFilterCategory = 'all' | 'active' | 'banned' | 'admins'

const PRESET_BAN_REASONS = [
  'ارسال نقدهای اسپم و تبلیغاتی',
  'استفاده از کلمات نامناسب و توهین‌آمیز',
  'تلاش برای دور زدن سیستم و نقض قوانین سایت',
  'درخواست مسدودسازی موقت توسط خود کاربر',
]

const SAMPLE_BOOK_JSON = JSON.stringify(
  {
    title: 'The Great Gatsby',
    titleFa: 'گتسبی بزرگ',
    slug: 'the-great-gatsby',
    description: 'A classic 1925 novel by F. Scott Fitzgerald set in the Jazz Age on Long Island.',
    descriptionFa: 'رمانی کلاسیک نوشته اف. اسکات فیتزجرالد درباره جامعه آمریکا در عصر جاز.',
    level: 'B2',
    pageCount: 180,
    price: 0,
    author: {
      name: 'F. Scott Fitzgerald',
      nameFa: 'اف. اسکات فیتزجرالد',
      slug: 'f-scott-fitzgerald',
      nationalityFa: 'آمریکایی',
    },
    chapters: [
      {
        title: 'Chapter 1',
        titleFa: 'فصل اول',
        slug: 'chapter-1',
        order: 1,
        startPage: 1,
      },
    ],
    pages: [
      {
        pageNumber: 1,
        english: 'In my younger and more vulnerable years my father gave me some advice that I’ve been turning over in my mind ever since.',
        farsi: 'در دوران جوانی و آسیب‌پذیری‌ام، پدرم پندی به من داد که از آن زمان تاکنون همواره در ذهنم مرور کرده‌ام.',
        type: 'text',
      },
    ],
  },
  null,
  2,
)

export const DashboardClient: React.FC<DashboardClientProps> = ({ 
  initialStats, 
  initialUsers, 
  currentAdminRole = 'owner' 
}) => {
  const searchParams = useSearchParams()
  const rawTab = searchParams?.get('tab') as 'stats' | 'users' | 'studio' | 'import' | null
  const tabParam = rawTab === 'import' ? 'studio' : rawTab
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'studio'>(
    tabParam === 'users' ? 'users' : tabParam === 'studio' ? 'studio' : 'stats',
  )

  useEffect(() => {
    if (tabParam === 'stats' || tabParam === 'users' || tabParam === 'studio') {
      setActiveTab(tabParam)
    } else {
      setActiveTab('stats')
    }
  }, [tabParam])
  
  // Stats state
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [loadingStats, setLoadingStats] = useState(false)
  
  // Users state
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [activeFilter, setActiveFilter] = useState<UserFilterCategory>('all')
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null)
  
  // Modal / Action states
  const [banningUserId, setBanningUserId] = useState<string | null>(null)
  const [banReason, setBanReason] = useState('')
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Import state
  const [jsonInput, setJsonInput] = useState('')
  const [importLog, setImportLog] = useState('')
  const [importing, setImporting] = useState(false)

  const isOwner = currentAdminRole === 'owner'

  // Reload stats
  const refreshStats = async () => {
    setLoadingStats(true)
    try {
      const res = await fetchStats()
      setStats(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingStats(false)
    }
  }

  // Auto-reload stats on tab change
  useEffect(() => {
    if (activeTab === 'stats') {
      refreshStats()
    }
  }, [activeTab])

  // Search users with debounce
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoadingUsers(true)
    try {
      const res = await searchUsers(searchQuery)
      setUsers(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        handleSearch()
      })
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (activeFilter === 'active') return !u.banned
      if (activeFilter === 'banned') return u.banned
      if (activeFilter === 'admins') return u.role === 'ADMIN' || u.role === 'OWNER'
      return true
    })
  }, [users, activeFilter])

  // Computed counts for filter tabs
  const counts = useMemo(() => ({
    all: users.length,
    active: users.filter((u) => !u.banned).length,
    banned: users.filter((u) => u.banned).length,
    admins: users.filter((u) => u.role === 'ADMIN' || u.role === 'OWNER').length,
  }), [users])

  // Copy ID helper
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Permission helpers
  const canBan = (target: ManagedUser) => {
    if (target.role === 'OWNER') return false // No one can ban owner
    if (target.role === 'ADMIN') return isOwner // Only owner can ban admin
    return true // Admins and owner can ban regular users
  }

  const canUnban = (target: ManagedUser) => {
    if (target.role === 'ADMIN') return isOwner // Only owner can unban admin
    return true
  }

  const canDelete = (target: ManagedUser) => {
    return isOwner && target.role !== 'OWNER' // Only owner can remove accounts, but cannot delete owner
  }

  // Handle Role Change
  const handleRoleChange = async (userId: string, role: string) => {
    if (!isOwner) {
      setActionError('تنها مالک اصلی سیستم مجاز به تغییر نقش‌ها است.')
      return
    }
    setActionError(null)
    setActionSuccess(null)
    try {
      await updateUserRole(userId, role)
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => (prev ? { ...prev, role } : null))
      }
      setActionSuccess('نقش کاربر با موفقیت تغییر یافت.')
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'خطا در تغییر نقش کاربر')
    }
  }

  // Handle Ban
  const handleBan = async () => {
    if (!banningUserId) return
    const target = users.find((u) => u.id === banningUserId)
    if (target && !canBan(target)) {
      setActionError('شما اجازه مسدودسازی این کاربر را ندارید.')
      return
    }

    setActionError(null)
    setActionSuccess(null)
    try {
      const reason = banReason.trim() || 'نقض قوانین وب‌سایت'
      await banUser(banningUserId, reason)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === banningUserId
            ? { ...u, banned: true, banReason: reason, bannedAt: new Date() }
            : u,
        ),
      )
      if (selectedUser?.id === banningUserId) {
        setSelectedUser((prev) =>
          prev
            ? { ...prev, banned: true, banReason: reason, bannedAt: new Date() }
            : null,
        )
      }
      setBanningUserId(null)
      setBanReason('')
      setActionSuccess('کاربر با موفقیت مسدود شد.')
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'خطا در مسدودسازی کاربر')
    }
  }

  // Handle Unban
  const handleUnban = async (userId: string) => {
    const target = users.find((u) => u.id === userId)
    if (target && !canUnban(target)) {
      setActionError('تنها مالک اصلی سیستم مجاز به رفع مسدودیت مدیران است.')
      return
    }

    setActionError(null)
    setActionSuccess(null)
    try {
      await unbanUser(userId)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, banned: false, banReason: null, bannedAt: null }
            : u,
        ),
      )
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) =>
          prev
            ? { ...prev, banned: false, banReason: null, bannedAt: null }
            : null,
        )
      }
      setActionSuccess('مسدودیت کاربر لغو و حساب وی فعال گردید.')
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'خطا در رفع مسدودسازی کاربر')
    }
  }

  // Handle Delete User (Owner only)
  const handleDelete = async (userId: string) => {
    if (!isOwner) {
      setActionError('تنها مالک اصلی مجاز به حذف حساب کاربری است.')
      return
    }
    setActionError(null)
    setActionSuccess(null)
    try {
      await deleteUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      if (selectedUser?.id === userId) {
        setSelectedUser(null)
      }
      setDeletingUserId(null)
      setActionSuccess('حساب کاربری با موفقیت از سیستم حذف گردید.')
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'خطا در حذف حساب کاربری')
    }
  }

  // Handle Import JSON
  const handleImport = async () => {
    if (!jsonInput.trim()) return
    setImporting(true)
    setImportLog('در حال ارسال فایل JSON و آغاز درون‌ریزی...\n')
    try {
      const res = await importBookAction(jsonInput)
      setImportLog(res.log)
      if (res.success) {
        setJsonInput('')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setImportLog((prev) => prev + `\nخطای پردازش: ${msg}`)
    } finally {
      setImporting(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setJsonInput(text)
    }
    reader.readAsText(file)
  }

  return (
    <div className="unified-dashboard-container" dir="rtl">
      {/* Global Action Alerts */}
      {actionError && (
        <div className="alert-message error-alert">
          <div className="alert-content-row">
            <AlertTriangle size={18} />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="close-alert-btn">
            <X size={16} />
          </button>
        </div>
      )}
      {actionSuccess && (
        <div className="alert-message success-alert">
          <div className="alert-content-row">
            <CheckCircle2 size={18} />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="close-alert-btn">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 1: PLATFORM ANALYTICS WORKSPACE */}
      {/* ========================================================= */}
      {activeTab === 'stats' && (
        <div className="dashboard-standalone-workspace fade-in">
          {/* Header */}
          <div className="workspace-header-card">
            <div className="workspace-header-text">
              <div className="workspace-badge-row">
                <span className="workspace-status-badge live-pulse">
                  <Activity size={12} />
                  <span>داده‌های زنده پلتفرم</span>
                </span>
                <span className="workspace-status-badge db-connected">
                  <Database size={12} />
                  <span>Postgres & Prisma متصل</span>
                </span>
              </div>
              <h2>داشبورد جامع آمار و عملکرد بوکزی</h2>
              <p className="tab-subtitle-text">تحلیل بلادرنگ تعامل کاربران، ساعات مطالعه، کتاب‌های خوانده‌شده و تقاضای پشتیبانی</p>
            </div>
            
            <button 
              onClick={refreshStats} 
              className="refresh-data-btn"
              disabled={loadingStats}
            >
              <RefreshCw size={15} className={loadingStats ? 'spin-icon' : ''} />
              <span>{loadingStats ? 'در حال بروزرسانی...' : 'بروزرسانی داده‌ها'}</span>
            </button>
          </div>
          
          {/* Stats Cards Grid */}
          <div className="dashboard-stats-grid">
            <div className="stat-card-item">
              <div className="stat-icon-wrapper text-sky-400">
                <Users size={26} />
              </div>
              <div className="stat-info-wrapper">
                <h4>کل کاربران ثبت‌نامی</h4>
                <p className="stat-number-value">{stats.totalUsers.toLocaleString('fa-IR')}</p>
                <span className="stat-trend-sub">حساب‌های ایجاد شده در سامانه</span>
              </div>
            </div>

            <div className="stat-card-item">
              <div className="stat-icon-wrapper text-emerald-400">
                <UserCheck size={26} />
              </div>
              <div className="stat-info-wrapper">
                <h4>کاربران فعال (تکمیل آنبوردینگ)</h4>
                <p className="stat-number-value text-emerald-400">{stats.activeUsers.toLocaleString('fa-IR')}</p>
                <span className="stat-trend-sub">
                  {stats.totalUsers > 0 
                    ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}٪ نرخ فعال‌سازی حساب‌ها`
                    : 'بدون کاربر'}
                </span>
              </div>
            </div>

            <div className="stat-card-item">
              <div className="stat-icon-wrapper text-amber-400">
                <BookOpen size={26} />
              </div>
              <div className="stat-info-wrapper">
                <h4>جلسات مطالعه ثبت‌شده</h4>
                <p className="stat-number-value">{stats.totalReadingSessions.toLocaleString('fa-IR')}</p>
                <span className="stat-trend-sub">Reading Sessions فعال</span>
              </div>
            </div>

            <div className="stat-card-item">
              <div className="stat-icon-wrapper text-indigo-400">
                <Layers size={26} />
              </div>
              <div className="stat-info-wrapper">
                <h4>کل صفحات خوانده‌شده</h4>
                <p className="stat-number-value">{stats.totalPagesRead.toLocaleString('fa-IR')}</p>
                <span className="stat-trend-sub">مجموع ورق‌های مطالعه شده</span>
              </div>
            </div>

            <div className="stat-card-item">
              <div className="stat-icon-wrapper text-purple-400">
                <Clock size={26} />
              </div>
              <div className="stat-info-wrapper">
                <h4>مجموع زمان مطالعه</h4>
                <p className="stat-number-value">{stats.totalMinutesRead.toLocaleString('fa-IR')} <small>دقیقه</small></p>
                <span className="stat-trend-sub">
                  {stats.totalMinutesRead > 60 
                    ? `معادل ${Math.round(stats.totalMinutesRead / 60)} ساعت مطالعه`
                    : 'مطالعه ثبت‌شده'}
                </span>
              </div>
            </div>

            <div className="stat-card-item">
              <div className="stat-icon-wrapper text-teal-400">
                <Download size={26} />
              </div>
              <div className="stat-info-wrapper">
                <h4>دانلود کتاب‌های چاپی</h4>
                <p className="stat-number-value">{stats.totalDownloads.toLocaleString('fa-IR')}</p>
                <span className="stat-trend-sub">نسخه‌های دریافت شده</span>
              </div>
            </div>

            <div className="stat-card-item">
              <div className="stat-icon-wrapper text-rose-400">
                <Ticket size={26} />
              </div>
              <div className="stat-info-wrapper">
                <h4>تیکت‌های باز پشتیبانی</h4>
                <p className="stat-number-value text-rose-400">{stats.openTickets.toLocaleString('fa-IR')}</p>
                <span className="stat-trend-sub">نیاز به پاسخگویی مدیریت</span>
              </div>
            </div>

            <div className="stat-card-item">
              <div className="stat-icon-wrapper text-cyan-400">
                <BarChart3 size={26} />
              </div>
              <div className="stat-info-wrapper">
                <h4>میانگین صفحات به ازای کاربر</h4>
                <p className="stat-number-value">{stats.averagePagesPerUser.toLocaleString('fa-IR')}</p>
                <span className="stat-trend-sub">شاخص میانگین درگیری کاربر</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: APP USER MANAGEMENT WORKSPACE */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="dashboard-standalone-workspace fade-in">
          {/* Header */}
          <div className="workspace-header-card">
            <div>
              <h2>مدیریت و نظارت بر کاربران اپلیکیشن</h2>
              <p className="tab-subtitle-text">بررسی سوابق مطالعه، تعیین نقش، مسدودسازی حساب‌های متخلف و رفع مسدودیت</p>
            </div>
          </div>

          {/* Single Streamlined Action & Filter Toolbar */}
          <div className="user-unified-toolbar">
            {/* Segmented Filter Controls */}
            <div className="studio-segmented-nav">
              <button 
                type="button"
                className={`nav-segment-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                <Users size={15} />
                <span>همه کاربران ({counts.all})</span>
              </button>

              <button 
                type="button"
                className={`nav-segment-btn ${activeFilter === 'active' ? 'active' : ''}`}
                onClick={() => setActiveFilter('active')}
              >
                <UserCheck size={15} />
                <span>فعال ({counts.active})</span>
              </button>

              <button 
                type="button"
                className={`nav-segment-btn ${activeFilter === 'banned' ? 'active' : ''}`}
                onClick={() => setActiveFilter('banned')}
              >
                <UserX size={15} />
                <span>مسدود ({counts.banned})</span>
              </button>

              <button 
                type="button"
                className={`nav-segment-btn ${activeFilter === 'admins' ? 'active' : ''}`}
                onClick={() => setActiveFilter('admins')}
              >
                <Crown size={15} />
                <span>مدیران ({counts.admins})</span>
              </button>
            </div>

            {/* Live Search Input */}
            <form onSubmit={handleSearch} className="user-search-form-control">
              <div className="search-input-wrapper">
                <Search size={15} className="search-icon-prefix" />
                <input 
                  type="text" 
                  placeholder="جستجوی نام، ایمیل یا نام‌کاربری..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-field"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="search-clear-btn">
                    <X size={14} />
                  </button>
                )}
              </div>
              {loadingUsers && <span className="search-loading-text">در حال جستجو...</span>}
            </form>
          </div>

          {/* User Table */}
          <div className="users-table-wrapper">
            <table className="users-dashboard-table">
              <thead>
                <tr>
                  <th>پروفایل کاربر</th>
                  <th>ایمیل / نام کاربری</th>
                  <th>سطح زبان و امتیاز</th>
                  <th>نقش سیستم</th>
                  <th>وضعیت حساب</th>
                  <th>آمار مطالعه</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-empty-row-text">
                      هیچ کاربری با فیلتر انتخابی یا عبارت جستجو شده یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const banAllowed = canBan(user)
                    const unbanAllowed = canUnban(user)
                    return (
                      <tr 
                        key={user.id} 
                        className={`${user.banned ? 'banned-row-tint' : ''} ${selectedUser?.id === user.id ? 'selected-row-highlight' : ''}`}
                      >
                        {/* Profile & Name */}
                        <td>
                          <div 
                            className="user-profile-cell cursor-pointer"
                            onClick={() => setSelectedUser(user)}
                          >
                            <div className="avatar-container">
                              {user.image ? (
                                <Image src={user.image} alt="" width={38} height={38} unoptimized className="user-avatar-image" />
                              ) : (
                                <div className="user-avatar-placeholder">
                                  {user.name?.slice(0, 1) || user.email?.slice(0, 1) || 'U'}
                                </div>
                              )}
                              {user.englishLevel && (
                                <span className="avatar-level-badge">{user.englishLevel}</span>
                              )}
                            </div>
                            <div className="user-name-stack">
                              <span className="user-full-name">{user.name || 'نام مشخص نشده'}</span>
                              <span className="user-registered-date">
                                عضویت: {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email & Username */}
                        <td>
                          <div className="user-credentials-cell">
                            <span className="user-email-text">{user.email || 'فاقد ایمیل'}</span>
                            <span className="user-username-text">
                              {user.username ? `@${user.username}` : 'فاقد نام‌کاربری'}
                            </span>
                          </div>
                        </td>

                        {/* Level & XP */}
                        <td>
                          <div className="user-gamification-cell">
                            <span className="user-xp-badge">
                              <Sparkles size={13} />
                              {user.stats.xp.toLocaleString('fa-IR')} XP
                            </span>
                            <span className="user-level-sub">سطح {user.stats.level} • {user.stats.streakDays} روز استریک</span>
                          </div>
                        </td>

                        {/* Role */}
                        <td>
                          <div className="role-dropdown-wrapper">
                            {user.role === 'OWNER' ? (
                              <div className="role-badge owner-role-badge">
                                <Crown size={13} />
                                <span>مالک اصلی</span>
                              </div>
                            ) : isOwner ? (
                              <select 
                                value={user.role} 
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                className={`user-role-select-box ${user.role !== 'USER' ? 'admin-role-select' : ''}`}
                              >
                                <option value="USER">کاربر عادی</option>
                                <option value="ADMIN">مدیر ارشد</option>
                                <option value="OWNER">مالک اصلی</option>
                              </select>
                            ) : (
                              <span className={`role-badge ${user.role === 'ADMIN' ? 'admin-role-badge' : 'user-role-badge'}`}>
                                {user.role === 'ADMIN' ? (
                                  <>
                                    <Shield size={13} />
                                    <span>مدیر ارشد</span>
                                  </>
                                ) : (
                                  <span>کاربر عادی</span>
                                )}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          {user.banned ? (
                            <div className="banned-chip-wrapper" title={user.banReason || 'دلیل نامشخص'}>
                              <span className="badge-status-chip banned-chip">
                                <UserX size={13} />
                                مسدود شده
                              </span>
                              {user.banReason && (
                                <span className="ban-reason-tooltip-preview">{user.banReason}</span>
                              )}
                            </div>
                          ) : (
                            <span className="badge-status-chip active-chip">
                              <UserCheck size={13} />
                              فعال
                            </span>
                          )}
                        </td>

                        {/* Stats */}
                        <td>
                          <div className="user-stats-summary-cell">
                            <span><b>{user.stats.sessionsCount}</b> جلسه ({user.stats.totalMinutesRead} دقیقه)</span>
                            <span><b>{user.stats.booksCompleted}</b> کتاب • <b>{user.stats.vocabulariesCount}</b> لغت</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="action-buttons-cell">
                            <button 
                              onClick={() => setSelectedUser(user)}
                              className="action-icon-btn inspect-action-btn"
                              title="مشاهده جزئیات کامل کاربر"
                            >
                              <Eye size={16} />
                            </button>
                            {user.banned ? (
                              <button 
                                onClick={() => handleUnban(user.id)}
                                className="action-icon-btn unban-action-btn"
                                disabled={!unbanAllowed}
                                title={!unbanAllowed ? 'تنها مالک می‌تواند مسدودیت مدیر را لغو کند' : 'رفع مسدودیت'}
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            ) : user.role === 'OWNER' ? (
                              <button 
                                className="action-icon-btn disabled-btn"
                                disabled
                                title="حساب مالک اصلی غیرقابل مسدودسازی است"
                              >
                                <Crown size={16} />
                              </button>
                            ) : user.role === 'ADMIN' && !isOwner ? (
                              <button 
                                className="action-icon-btn disabled-btn"
                                disabled
                                title="مدیران نمی‌توانند سایر مدیران را مسدود کنند"
                              >
                                <Shield size={16} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => { setBanningUserId(user.id); setBanReason(''); }}
                                className="action-icon-btn ban-action-btn"
                                disabled={!banAllowed}
                                title="مسدودسازی حساب کاربری"
                              >
                                <UserX size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* USER DETAILS MODAL / DRAWER */}
          {selectedUser && (
            <div className="user-details-modal-overlay" onClick={() => setSelectedUser(null)}>
              <div className="user-details-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="user-modal-header">
                  <div className="user-modal-profile-header">
                    <div className="modal-avatar-wrapper">
                      {selectedUser.image ? (
                        <Image src={selectedUser.image} alt="" width={64} height={64} unoptimized className="modal-avatar-img" />
                      ) : (
                        <div className="modal-avatar-placeholder">
                          {selectedUser.name?.slice(0, 1) || selectedUser.email?.slice(0, 1) || 'U'}
                        </div>
                      )}
                      {selectedUser.englishLevel && (
                        <span className="modal-level-tag">{selectedUser.englishLevel}</span>
                      )}
                    </div>
                    <div className="modal-user-title-stack">
                      <h3>{selectedUser.name || 'کاربر بدون نام'}</h3>
                      <p className="modal-user-email">{selectedUser.email}</p>
                      <div className="modal-id-copy-row">
                        <span className="modal-user-id-code">ID: {selectedUser.id}</span>
                        <button 
                          onClick={() => handleCopyId(selectedUser.id)} 
                          className="copy-id-small-btn"
                        >
                          {copiedId === selectedUser.id ? (
                            <>
                              <Check size={12} />
                              <span>کپی شد</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>کپی ID</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="modal-close-icon">
                    <X size={20} />
                  </button>
                </div>

                {/* Ban Status Warning Box */}
                {selectedUser.banned && (
                  <div className="user-modal-banned-alert">
                    <div className="banned-alert-header">
                      <div className="banned-alert-title-row">
                        <AlertTriangle size={18} />
                        <span>این حساب کاربری مسدود شده است</span>
                      </div>
                      {selectedUser.bannedAt && (
                        <span className="banned-date-sub">
                          {new Date(selectedUser.bannedAt).toLocaleString('fa-IR')}
                        </span>
                      )}
                    </div>
                    <p className="banned-reason-detail">
                      <b>علت مسدودسازی:</b> {selectedUser.banReason || 'دلیلی ثبت نشده است.'}
                    </p>
                    {canUnban(selectedUser) && (
                      <button 
                        onClick={() => handleUnban(selectedUser.id)}
                        className="modal-btn unban-confirm-btn"
                      >
                        لغو مسدودیت و بازگردانی دسترسی کاربر
                      </button>
                    )}
                  </div>
                )}

                {/* User Stats Overview Grid */}
                <h4 className="modal-section-title">شاخص‌های یادگیری و فعالیت کاربر</h4>
                <div className="modal-stats-card-grid">
                  <div className="modal-stat-box">
                    <div className="modal-stat-icon-wrapper">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <span className="modal-stat-title">امتیاز تجربه (XP)</span>
                      <span className="modal-stat-val">{selectedUser.stats.xp.toLocaleString('fa-IR')} XP</span>
                    </div>
                  </div>
                  <div className="modal-stat-box">
                    <div className="modal-stat-icon-wrapper">
                      <Trophy size={18} />
                    </div>
                    <div>
                      <span className="modal-stat-title">سطح کاربر</span>
                      <span className="modal-stat-val">سطح {selectedUser.stats.level}</span>
                    </div>
                  </div>
                  <div className="modal-stat-box">
                    <div className="modal-stat-icon-wrapper text-amber-400">
                      <Flame size={18} />
                    </div>
                    <div>
                      <span className="modal-stat-title">استریک مطالعه</span>
                      <span className="modal-stat-val">{selectedUser.stats.streakDays} روز متوالی</span>
                    </div>
                  </div>
                  <div className="modal-stat-box">
                    <div className="modal-stat-icon-wrapper">
                      <Clock size={18} />
                    </div>
                    <div>
                      <span className="modal-stat-title">زمان کل مطالعه</span>
                      <span className="modal-stat-val">{selectedUser.stats.totalMinutesRead} دقیقه</span>
                    </div>
                  </div>
                  <div className="modal-stat-box">
                    <div className="modal-stat-icon-wrapper">
                      <BookMarked size={18} />
                    </div>
                    <div>
                      <span className="modal-stat-title">کتاب‌های پایان‌یافته</span>
                      <span className="modal-stat-val">{selectedUser.stats.booksCompleted} عنوان</span>
                    </div>
                  </div>
                  <div className="modal-stat-box">
                    <div className="modal-stat-icon-wrapper">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <span className="modal-stat-title">جلسات مطالعه</span>
                      <span className="modal-stat-val">{selectedUser.stats.sessionsCount} جلسه</span>
                    </div>
                  </div>
                  <div className="modal-stat-box">
                    <div className="modal-stat-icon-wrapper">
                      <Bookmark size={18} />
                    </div>
                    <div>
                      <span className="modal-stat-title">لغات ذخیره‌شده</span>
                      <span className="modal-stat-val">{selectedUser.stats.vocabulariesCount} لغت</span>
                    </div>
                  </div>
                  <div className="modal-stat-box">
                    <div className="modal-stat-icon-wrapper">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <span className="modal-stat-title">نظرات و نقدها</span>
                      <span className="modal-stat-val">{selectedUser.stats.reviewsCount} نقد</span>
                    </div>
                  </div>
                </div>

                {/* Management Quick Actions */}
                <h4 className="modal-section-title">مدیریت سطح دسترسی و حساب</h4>
                <div className="modal-management-actions-row">
                  <div className="role-change-control">
                    <label>نقش در سیستم:</label>
                    {isOwner && selectedUser.role !== 'OWNER' ? (
                      <select 
                        value={selectedUser.role} 
                        onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                        className="modal-role-select"
                      >
                        <option value="USER">کاربر عادی</option>
                        <option value="ADMIN">مدیر ارشد</option>
                        <option value="OWNER">مالک اصلی</option>
                      </select>
                    ) : (
                      <span className="role-badge owner-role-badge">
                        {selectedUser.role === 'OWNER' ? 'مالک اصلی (OWNER)' : selectedUser.role}
                      </span>
                    )}
                  </div>

                  <div className="modal-action-buttons-group">
                    {!selectedUser.banned && canBan(selectedUser) && (
                      <button 
                        onClick={() => { setBanningUserId(selectedUser.id); setBanReason(''); }}
                        className="modal-btn ban-trigger-btn"
                      >
                        مسدودسازی
                      </button>
                    )}

                    {canDelete(selectedUser) && (
                      <button 
                        onClick={() => setDeletingUserId(selectedUser.id)}
                        className="modal-btn delete-trigger-btn"
                      >
                        <Trash2 size={15} />
                        <span>حذف حساب</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BAN REASON MODAL */}
          {banningUserId && (
            <div className="ban-reason-modal-overlay">
              <div className="ban-modal-content-wrapper">
                <div className="ban-modal-header-line">
                  <div className="ban-header-title-row">
                    <AlertTriangle size={20} className="text-red-500" />
                    <h3>مسدودسازی کاربر در سیستم</h3>
                  </div>
                  <button onClick={() => { setBanningUserId(null); setBanReason(''); }} className="modal-close-icon">
                    <X size={18} />
                  </button>
                </div>
                <p className="ban-modal-desc">
                  با مسدودسازی، دسترسی کاربر به اپلیکیشن و نشست‌های فعال وی قطع خواهد شد. علت مسدودسازی را مشخص کنید:
                </p>

                {/* Quick Presets */}
                <div className="preset-reasons-block">
                  <span className="preset-title">انتخاب دلیل آماده:</span>
                  <div className="preset-chips-row">
                    {PRESET_BAN_REASONS.map((preset) => (
                      <button 
                        key={preset}
                        type="button" 
                        onClick={() => setBanReason(preset)}
                        className={`preset-chip-btn ${banReason === preset ? 'selected' : ''}`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea 
                  value={banReason} 
                  onChange={(e) => setBanReason(e.target.value)} 
                  placeholder="یا متن دلیل سفارشی خود را اینجا وارد کنید..."
                  className="ban-reason-textarea-field"
                  rows={3}
                />

                <div className="modal-action-buttons-row">
                  <button onClick={handleBan} className="modal-btn confirm-ban-btn">
                    تایید مسدودسازی حساب
                  </button>
                  <button 
                    onClick={() => { setBanningUserId(null); setBanReason(''); }} 
                    className="modal-btn cancel-ban-btn"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DELETE CONFIRMATION MODAL */}
          {deletingUserId && (
            <div className="ban-reason-modal-overlay">
              <div className="ban-modal-content-wrapper">
                <div className="ban-modal-header-line">
                  <div className="ban-header-title-row">
                    <Trash2 size={20} className="text-red-500" />
                    <h3>تایید حذف کامل کاربر</h3>
                  </div>
                  <button onClick={() => setDeletingUserId(null)} className="modal-close-icon">
                    <X size={18} />
                  </button>
                </div>
                <p className="ban-modal-desc">
                  آیا از حذف کامل این حساب کاربری اطمینان دارید؟ تمام داده‌های مرتبط با این حساب به صورت دائمی از دیتابیس پاک خواهد شد.
                </p>

                <div className="modal-action-buttons-row">
                  <button onClick={() => handleDelete(deletingUserId)} className="modal-btn confirm-ban-btn">
                    بله، حذف قطعی حساب
                  </button>
                  <button 
                    onClick={() => setDeletingUserId(null)} 
                    className="modal-btn cancel-ban-btn"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: CONTENT STUDIO & AI IMPORTER WORKSPACE */}
      {/* ========================================================= */}
      {activeTab === 'studio' && (
        <div className="dashboard-standalone-workspace fade-in">
          <ContentStudio />
        </div>
      )}
    </div>
  )
}
