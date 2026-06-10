'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { auth } from '@/lib/api'
import { t } from '@/app/lib/i18n'

export default function AdminNav() {
  const pathname = usePathname()
  const user = auth.getUser()
  const userRole = user?.role
  const isSuperUser = userRole === 'super_user'
  const isCurator = userRole === 'curator'
  
  const navItems = [
    { href: '/admin', label: t('pendingEvents') },
    { href: '/admin/characters', label: t('characters') },
    { href: '/admin/frames', label: t('historicalFrames') },
  ]
  
  if (isCurator || isSuperUser) {
    navItems.push({ href: '/admin/events', label: t('allEvents') })
  }
  
  return (
    <div className="border-b border-gray-200 mb-6">
      <div className="flex gap-4 overflow-x-auto">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              pathname === item.href
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
