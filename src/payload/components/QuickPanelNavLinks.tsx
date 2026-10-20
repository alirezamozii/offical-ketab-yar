'use client'

import React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { BarChart3, Users, FileCode2, Zap, ArrowLeft } from 'lucide-react'

export const QuickPanelNavLinks: React.FC = () => {
  const searchParams = useSearchParams()
  const rawTab = searchParams?.get('tab') || 'stats'
  const currentTab = rawTab === 'import' ? 'studio' : rawTab

  const links = [
    {
      href: '/admin?tab=stats',
      id: 'stats',
      title: 'آمار و تحلیل سیستم',
      desc: 'شاخص‌ها و گزارش عملکرد پلتفرم',
      icon: BarChart3,
      accentColor: 'var(--ky-info)',
      bgActive: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(56, 189, 248, 0.05))',
      borderActive: 'rgba(56, 189, 248, 0.5)',
      glow: '0 4px 16px rgba(56, 189, 248, 0.12)',
    },
    {
      href: '/admin?tab=users',
      id: 'users',
      title: 'مدیریت کاربران اپلیکیشن',
      desc: 'مسدودسازی، سطح دسترسی و سوابق',
      icon: Users,
      accentColor: 'var(--ky-gold)',
      bgActive: 'linear-gradient(135deg, rgba(244, 211, 94, 0.20), rgba(244, 211, 94, 0.06))',
      borderActive: 'rgba(244, 211, 94, 0.6)',
      glow: '0 4px 16px rgba(244, 211, 94, 0.15)',
    },
    {
      href: '/admin?tab=studio',
      id: 'studio',
      title: 'استودیو محتوا و پرامپت AI',
      desc: 'درون‌ریزی JSON، ویرایش صفحات و پیش‌نمایش',
      icon: FileCode2,
      accentColor: 'var(--ky-purple)',
      bgActive: 'linear-gradient(135deg, rgba(192, 132, 252, 0.18), rgba(192, 132, 252, 0.05))',
      borderActive: 'rgba(192, 132, 252, 0.5)',
      glow: '0 4px 16px rgba(192, 132, 252, 0.12)',
    },
  ]

  return (
    <div className="quick-panel-sidebar-root">
      <div className="quick-panel-section-title-box">
        <Zap size={16} className="quick-panel-zap-icon" />
        <span className="quick-panel-section-title-text">پنل دسترسی سریع (Quick Panel)</span>
      </div>

      <div className="quick-panel-cards-stack">
        {links.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.id

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`quick-panel-big-card ${isActive ? 'active' : ''}`}
              style={{
                background: isActive ? item.bgActive : undefined,
                borderColor: isActive ? item.borderActive : undefined,
                boxShadow: isActive ? item.glow : undefined,
              }}
            >
              <div 
                className="quick-panel-card-icon-container" 
                style={{ 
                  color: item.accentColor,
                  background: isActive ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.3)',
                  borderColor: isActive ? item.accentColor : 'rgba(255,255,255,0.08)',
                }}
              >
                <Icon size={20} />
              </div>

              <div className="quick-panel-card-text-container">
                <span 
                  className="quick-panel-card-heading" 
                  style={{ color: isActive ? item.accentColor : 'var(--ky-text)' }}
                >
                  {item.title}
                </span>
                <span className="quick-panel-card-desc">{item.desc}</span>
              </div>

              <ArrowLeft 
                size={16} 
                className={`quick-panel-arrow ${isActive ? 'active' : ''}`}
                style={{ color: isActive ? item.accentColor : 'var(--ky-text-disabled)' }}
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
