'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/lib/api'
import { t } from '@/app/lib/i18n'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LanguageSelector from '../common/LanguageSelector'

export default function Navbar() {
	const [currentUser, setCurrentUser] = useState<any>(null)
	const [userRole, setUserRole] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const router = useRouter()

	useEffect(() => {
		const user = auth.getUser()
		setCurrentUser(user)

		if (user) {
			setUserRole(user.role || 'regular')
		}
		setLoading(false)

		const unsubscribe = auth.onAuthChange((user) => {
			setCurrentUser(user)
			if (user) {
				setUserRole(user.role || 'regular')
			} else {
				setUserRole(null)
			}
		})

		return () => unsubscribe()
	}, [])

	const handleLogout = async () => {
		await auth.logout()
		setCurrentUser(null)
		setUserRole(null)
		router.push('/')
	}

	if (loading) {
		return null
	}

	const canAccessAdmin = userRole === 'curator' || userRole === 'super_user'
	const roleLabel = userRole === 'super_user' ? t('admin') : userRole === 'curator' ? t('curator') : userRole === 'regular' ? t('regular') : null

	return (
		<nav className="bg-gray-900 text-white p-4">
			<div className="flex justify-between items-center">
				<Link href="/" className="text-2xl font-bold">
					🌍 GeoHistory
				</Link>

				<div className="flex gap-4 items-center">
					<Link href="/map" className="hover:text-blue-300">
						{t('map')}
					</Link>
					<Link href="/timeline" className="hover:text-blue-300">
						{t('timeline')}
					</Link>
					<Link href="/travel-animation" className="hover:text-amber-300">
						{t('travelAnimation')}
					</Link>

					{canAccessAdmin && (
						<Link href="/admin" className="hover:text-green-300 font-semibold">
							{t('adminPanel')}
						</Link>
					)}

					<LanguageSelector />

					{currentUser ? (
						<div className="flex gap-4 items-center">
							<span className="text-sm">
								{currentUser.email}
								{roleLabel && ` (${roleLabel})`}
							</span>
							<button
								onClick={handleLogout}
								className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
							>
								{t('logout')}
							</button>
						</div>
					) : (
						<Link href="/auth" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
							{t('login')}
						</Link>
					)}
				</div>
			</div>
		</nav>
	)
}
