'use client'

import React, { useState, useEffect, startTransition } from 'react'
import {
  fetchStats,
  searchUsers,
  updateUserRole,
  banUser,
  unbanUser,
  importBookAction,
  DashboardStats,
  ManagedUser,
} from './actions'

interface DashboardClientProps {
  initialStats: DashboardStats
  initialUsers: ManagedUser[]
}

export const DashboardClient: React.FC<DashboardClientProps> = ({ initialStats, initialUsers }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'import'>('stats')
  
  // Stats state
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [loadingStats, setLoadingStats] = useState(false)
  
  // Users state
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  
  // Modal / Action states
  const [banningUserId, setBanningUserId] = useState<string | null>(null)
  const [banReason, setBanReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  
  // Import state
  const [jsonInput, setJsonInput] = useState('')
  const [importLog, setImportLog] = useState('')
  const [importing, setImporting] = useState(false)

  // Auto-reload stats on tab change
  useEffect(() => {
    if (activeTab === 'stats') {
      setLoadingStats(true)
      fetchStats()
        .then(setStats)
        .catch((err) => console.error(err))
        .finally(() => setLoadingStats(false))
    }
  }, [activeTab])

  // Search users with debounce-like behavior (manual trigger or query change)
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

  // Trigger search when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        handleSearch()
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Handle Promote
  const handleRoleChange = async (userId: string, role: string) => {
    setActionError(null)
    try {
      await updateUserRole(userId, role)
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    } catch (err: any) {
      setActionError(err.message || 'خطا در تغییر نقش کاربر')
    }
  }

  // Handle Ban
  const handleBan = async () => {
    if (!banningUserId) return
    setActionError(null)
    try {
      await banUser(banningUserId, banReason)
      setUsers(prev => prev.map(u => u.id === banningUserId ? { ...u, banned: true, banReason } : u))
      setBanningUserId(null)
      setBanReason('')
    } catch (err: any) {
      setActionError(err.message || 'خطا در مسدودسازی کاربر')
    }
  }

  // Handle Unban
  const handleUnban = async (userId: string) => {
    setActionError(null)
    try {
      await unbanUser(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: false, banReason: null } : u))
    } catch (err: any) {
      setActionError(err.message || 'خطا در رفع مسدودسازی کاربر')
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
    } catch (err: any) {
      setImportLog(prev => prev + `\n❌ خطای غیرمنتظره: ${err.message || String(err)}`)
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
      {/* Tab Navigation */}
      <div className="dashboard-navigation-tabs">
        <button 
          onClick={() => setActiveTab('stats')} 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
        >
          📊 آمار و تحلیل سایت
        </button>
        <button 
          onClick={() => setActiveTab('users')} 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
        >
          👥 مدیریت کاربران سایت
        </button>
        <button 
          onClick={() => setActiveTab('import')} 
          className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
        >
          📥 درون‌ریزی کتاب (JSON)
        </button>
      </div>

      {/* Action Error Alert */}
      {actionError && (
        <div className="alert-message error-alert">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="close-alert-btn">×</button>
        </div>
      )}

      {/* Tab 1: Stats */}
      {activeTab === 'stats' && (
        <div className="dashboard-tab-content fade-in">
          <div className="tab-header-row">
            <h2>گزارش عملکرد و آمارهای کلیدی پلتفرم</h2>
            {loadingStats && <span className="loading-spinner-inline">در حال بروزرسانی آمارهای دیتابیس...</span>}
          </div>
          
          <div className="dashboard-stats-grid">
            <div className="stat-card-item">
              <span className="stat-icon-wrapper">👥</span>
              <div className="stat-info-wrapper">
                <h4>کل کاربران ثبت‌نامی</h4>
                <p className="stat-number-value">{stats.totalUsers.toLocaleString('fa-IR')}</p>
              </div>
            </div>

            <div className="stat-card-item">
              <span className="stat-icon-wrapper">🔥</span>
              <div className="stat-info-wrapper">
                <h4>کاربران فعال (انجام آنبوردینگ)</h4>
                <p className="stat-number-value">{stats.activeUsers.toLocaleString('fa-IR')}</p>
              </div>
            </div>

            <div className="stat-card-item">
              <span className="stat-icon-wrapper">📖</span>
              <div className="stat-info-wrapper">
                <h4>کل جلسات مطالعه کاربران</h4>
                <p className="stat-number-value">{stats.totalReadingSessions.toLocaleString('fa-IR')}</p>
              </div>
            </div>

            <div className="stat-card-item">
              <span className="stat-icon-wrapper">📄</span>
              <div className="stat-info-wrapper">
                <h4>صفحات مطالعه شده</h4>
                <p className="stat-number-value">{stats.totalPagesRead.toLocaleString('fa-IR')}</p>
              </div>
            </div>

            <div className="stat-card-item">
              <span className="stat-icon-wrapper">⏱️</span>
              <div className="stat-info-wrapper">
                <h4>کل زمان مطالعه (دقیقه)</h4>
                <p className="stat-number-value">{stats.totalMinutesRead.toLocaleString('fa-IR')}</p>
              </div>
            </div>

            <div className="stat-card-item">
              <span className="stat-icon-wrapper">📥</span>
              <div className="stat-info-wrapper">
                <h4>دانلود کتاب‌های کاغذی</h4>
                <p className="stat-number-value">{stats.totalDownloads.toLocaleString('fa-IR')}</p>
              </div>
            </div>

            <div className="stat-card-item">
              <span className="stat-icon-wrapper">🎫</span>
              <div className="stat-info-wrapper text-amber-500">
                <h4>تیکت‌های پشتیبانی باز</h4>
                <p className="stat-number-value text-amber-500">{stats.openTickets.toLocaleString('fa-IR')}</p>
              </div>
            </div>

            <div className="stat-card-item">
              <span className="stat-icon-wrapper">📊</span>
              <div className="stat-info-wrapper">
                <h4>میانگین صفحات برای هر کاربر</h4>
                <p className="stat-number-value">{stats.averagePagesPerUser.toLocaleString('fa-IR')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Manager */}
      {activeTab === 'users' && (
        <div className="dashboard-tab-content fade-in">
          <div className="tab-header-row">
            <h2>مدیریت و تعدیل کاربران وب‌سایت</h2>
            <form onSubmit={handleSearch} className="user-search-form-control">
              <input 
                type="text" 
                placeholder="جستجوی کاربر با نام، ایمیل یا نام کاربری..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-field"
              />
              {loadingUsers && <span className="search-loading-text">در حال جستجو...</span>}
            </form>
          </div>

          <div className="users-table-wrapper">
            <table className="users-dashboard-table">
              <thead>
                <tr>
                  <th>پروفایل کاربر</th>
                  <th>ایمیل / نام‌کاربری</th>
                  <th>نقش کاربر</th>
                  <th>وضعیت</th>
                  <th>آمار کلیدی (جلسات/دانلود/نقد)</th>
                  <th>عملیات مدیریت</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty-row-text">هیچ کاربری یافت نشد.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className={user.banned ? 'banned-row-tint' : ''}>
                      <td>
                        <div className="user-profile-cell">
                          {user.image ? (
                            <img src={user.image} alt="" className="user-avatar-image" />
                          ) : (
                            <div className="user-avatar-placeholder">{user.name?.slice(0, 1) || user.email?.slice(0, 1) || 'U'}</div>
                          )}
                          <span className="user-full-name">{user.name || 'نام کاربری وارد نشده'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="user-credentials-cell">
                          <span className="user-email-text">{user.email || 'فاقد ایمیل'}</span>
                          <span className="user-username-text">@{user.username || 'فاقد شناسه'}</span>
                        </div>
                      </td>
                      <td>
                        <select 
                          value={user.role} 
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="user-role-select-box"
                        >
                          <option value="USER">کاربر (USER)</option>
                          <option value="ADMIN">مدیر (ADMIN)</option>
                          <option value="OWNER">مالک (OWNER)</option>
                        </select>
                      </td>
                      <td>
                        {user.banned ? (
                          <span className="badge-status-chip banned-chip" title={user.banReason || ''}>مسدود شده</span>
                        ) : (
                          <span className="badge-status-chip active-chip">فعال</span>
                        )}
                      </td>
                      <td>
                        <div className="user-stats-summary-cell">
                          <span>مطالعه: <b>{user.stats.sessionsCount}</b> جلسه</span>
                          <span>دانلودها: <b>{user.stats.downloadsCount}</b> فایل</span>
                          <span>نظرات: <b>{user.stats.reviewsCount}</b> نقد</span>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons-cell">
                          {user.banned ? (
                            <button 
                              onClick={() => handleUnban(user.id)}
                              className="action-btn unban-action-btn"
                            >
                              رفع مسدودیت
                            </button>
                          ) : (
                            <button 
                              onClick={() => setBanningUserId(user.id)}
                              className="action-btn ban-action-btn"
                            >
                              مسدود کردن
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Ban Reason Modal */}
          {banningUserId && (
            <div className="ban-reason-modal-overlay">
              <div className="ban-modal-content-wrapper">
                <h3>دلیل مسدودسازی کاربر چیست؟</h3>
                <p>لطفاً دلیل مسدودسازی این کاربر را جهت اطلاع تیم مدیریت و ثبت در تاریخچه وارد کنید:</p>
                <textarea 
                  value={banReason} 
                  onChange={(e) => setBanReason(e.target.value)} 
                  placeholder="مثال: ثبت نقدهای اسپم و تبلیغاتی، تلاش برای هک سیستم..."
                  className="ban-reason-textarea-field"
                  rows={4}
                />
                <div className="modal-action-buttons-row">
                  <button onClick={handleBan} className="modal-btn confirm-ban-btn">تایید و مسدودسازی</button>
                  <button onClick={() => { setBanningUserId(null); setBanReason(''); }} className="modal-btn cancel-ban-btn">انصراف</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: JSON Importer */}
      {activeTab === 'import' && (
        <div className="dashboard-tab-content fade-in">
          <div className="tab-header-row">
            <h2>درون‌ریزی و بارگذاری کتاب از فایل ساختاریافته (JSON)</h2>
          </div>

          <div className="json-importer-layout-grid">
            <div className="import-form-card">
              <p className="import-tip-text">
                فرمت سند ارسالی باید با ساختار دیتابیس کتاب‌یار مطابقت کامل داشته باشد. نویسنده به طور خودکار شناسایی شده یا نویسنده جدید ایجاد خواهد شد.
              </p>

              <div className="file-upload-input-row">
                <label className="file-upload-custom-label">
                  📂 انتخاب فایل JSON کتاب
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleFileUpload} 
                    className="file-upload-hidden-input"
                  />
                </label>
                <span className="file-upload-helper-msg">یا متن JSON کتاب را در باکس زیر به طور مستقیم وارد کنید.</span>
              </div>

              <textarea 
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{
  "title": "عنوان کتاب انگلیسی",
  "author": {
    "name": "نام نویسنده انگلیسی",
    "nameFa": "نام نویسنده فارسی",
    "bio": "بیوگرافی انگلیسی"
  },
  "description": "توضیحات کتاب",
  "level": "B1",
  "genres": ["Classic", "Drama"],
  "pages": [
    { "pageNumber": 1, "english": "Page content...", "farsi": "ترجمه فارسی..." }
  ]
}'
                className="json-textarea-input-editor"
                rows={15}
              />

              <button 
                onClick={handleImport}
                disabled={importing || !jsonInput.trim()}
                className="import-submit-glow-btn"
              >
                {importing ? 'در حال انجام عملیات درون‌ریزی...' : '🚀 شروع فرآیند درون‌ریزی کتاب'}
              </button>
            </div>

            <div className="import-logs-card">
              <h4>لاگ‌ها و گزارش عملیات درون‌ریزی کتاب</h4>
              <pre className="import-logs-console-output">
                {importLog || 'در انتظار بارگذاری فایل یا قرارگیری متن JSON در کادر کناری...'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
