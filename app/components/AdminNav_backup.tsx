'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { auth } from '@/lib/api'

export default function AdminNav() {
  const pathname = usePathname()
  const user = auth.getUser()
  const isSuperUser = user?.role === 'super_user'
  
  const navItems = [
    { href: '/admin', label: 'Eventos Pendientes' },
    { href: '/admin/characters', label: 'Personajes' },
    { href: '/admin/frames', label: 'Marcos Históricos' },
  ]
  
  // Solo super_user puede ver "Todos los Eventos"
  if (isSuperUser) {
    navItems.push({ href: '/admin/events', label: 'Todos los Eventos' })
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
