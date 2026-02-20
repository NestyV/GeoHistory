'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Navbar() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current user on mount
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (user) {
        // Get user role from database
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setUserRole(data.role)
        }
      }
      setLoading(false)
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null
      setCurrentUser(user)

      if (user) {
        // Get user role from database
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (data) {
          setUserRole(data.role)
        } else {
          setUserRole(null)
        }
      } else {
        setUserRole(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setUserRole(null)
    window.location.href = '/'
  }

  if (loading) {
    return null
  }

  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          🌍 GeoHistory
        </Link>
        
        <div className="flex gap-4 items-center">
          <Link href="/map" className="hover:text-blue-300">
            Map
          </Link>
          <Link href="/timeline" className="hover:text-blue-300">
            Timeline
          </Link>
          
          {userRole === 'super_user' && (
            <Link href="/admin" className="hover:text-green-300 font-semibold">
              Admin Panel
            </Link>
          )}

          {currentUser ? (
            <div className="flex gap-4 items-center">
              <span className="text-sm">
                {currentUser.email}
                {userRole === 'super_user' && ' (Super User)'}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/auth" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}