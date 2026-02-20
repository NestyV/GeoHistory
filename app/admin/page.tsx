'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { HistoricalEvent } from '../types'
import Navbar from '../components/Navbar'

export default function AdminPanel() {
  const [pendingEvents, setPendingEvents] = useState<HistoricalEvent[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      
      if (user) {
        // Check user role
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setUserRole(data.role)
        }

        if (data?.role === 'super_user') {
          fetchPendingEvents()
        }
      }
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  const fetchPendingEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        users:user_id(email, full_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching pending events:', error)
    } else {
      setPendingEvents(data || [])
    }
  }

  const approveEvent = async (eventId: string) => {
    const { error } = await supabase
      .from('events')
      .update({ status: 'approved' })
      .eq('id', eventId)
    
    if (error) {
      console.error('Error approving event:', error)
      alert('Error approving event')
    } else {
      alert('Event approved!')
      fetchPendingEvents()
    }
  }

  const rejectEvent = async (eventId: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
    
    if (error) {
      console.error('Error rejecting event:', error)
      alert('Error rejecting event')
    } else {
      alert('Event rejected!')
      fetchPendingEvents()
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!currentUser) {
    return (
      <>
        <Navbar />
        <div className="p-8">Please log in</div>
      </>
    )
  }

  if (userRole !== 'super_user') {
    return (
      <>
        <Navbar />
        <div className="p-8 text-red-600">You don&apos;t have permission to access this page</div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Panel - Pending Events</h1>
        <p className="text-gray-600 mb-8">{pendingEvents.length} pending event(s)</p>
        
        {pendingEvents.length === 0 ? (
          <div className="bg-green-50 p-6 rounded text-green-800">
            No pending events to review
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingEvents.map(event => (
              <div key={event.id} className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{event.title}</h2>
                    <p className="text-sm text-gray-600">
                      Submitted by: {(event as any).users?.full_name || (event as any).users?.email}
                    </p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                    Pending Review
                  </span>
                </div>

                <p className="text-gray-700 mb-4">{event.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-semibold">📅 Date:</span> {event.event_date}
                  </div>
                  <div>
                    <span className="font-semibold">📍 Location:</span> {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
                  </div>
                </div>

                {event.characters && event.characters.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded mb-4">
                    <p className="font-semibold text-sm text-gray-700">
                      👥 Historical Figures: {Array.isArray(event.characters) ? event.characters.join(', ') : event.characters}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => approveEvent(event.id)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold transition"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to reject this event?')) {
                        rejectEvent(event.id)
                      }
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold transition"
                  >
                    × Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}