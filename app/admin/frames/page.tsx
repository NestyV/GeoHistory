'use client'

import { useEffect, useState } from 'react'
import { api, auth } from '@/lib/api'
import Navbar from '@/app/components/layout/Navbar'
import AdminNav from '@/app/components/layout/AdminNav'
import { useRouter } from 'next/navigation'
import { t } from '@/app/lib/i18n'

export default function FramesPage() {
  const [frames, setFrames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFrame, setEditingFrame] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: ''
  })
  const router = useRouter()
  const currentUser = auth.getUser()
  const isAtLeastCurator = currentUser?.role === 'curator' || currentUser?.role === 'super_user'

  useEffect(() => {
    if (!isAtLeastCurator) {
      router.push('/map')
      return
    }
    fetchFrames()
  }, [router, isAtLeastCurator])

  const fetchFrames = async () => {
    try {
      const data = await api.getFrames()
      setFrames(data || [])
    } catch (error) {
      console.error('Error fetching frames:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingFrame) {
        const response = await fetch(`http://localhost:3001/api/frames/${editingFrame.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify(formData)
        })
        if (!response.ok) {
          alert('Error actualizando el marco')
          return
        }
      } else {
        await api.createFrame(formData.name, formData.description, formData.start_date, formData.end_date)
      }
      setShowForm(false)
      setEditingFrame(null)
      setFormData({ name: '', description: '', start_date: '', end_date: '' })
      fetchFrames()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/frames/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      if (response.ok) {
        fetchFrames()
      }
    } catch (error) {
      console.error('Error deleting frame:', error)
      alert('Error eliminando el marco')
    }
  }

  const handleEdit = (frame: any) => {
    setEditingFrame(frame)
    setFormData({
      name: frame.name,
      description: frame.description || '',
      start_date: frame.start_date ? frame.start_date.split('T')[0] : '',
      end_date: frame.end_date ? frame.end_date.split('T')[0] : ''
    })
    setShowForm(true)
  }

  if (loading) return <div className="p-8 text-center">{t('loading')}</div>

  if (!isAtLeastCurator) {
    return (
      <>
        <Navbar />
        <main className="p-8">
          <div className="text-center py-8 text-red-600">
            {t('accessDenied')}
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t('adminPanel')}</h1>
        <AdminNav />
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">{t('historicalFrames')}</h2>
          <button
            onClick={() => {
              setEditingFrame(null)
              setFormData({ name: '', description: '', start_date: '', end_date: '' })
              setShowForm(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + {t('add')}
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">
                {editingFrame ? t('edit') : t('add')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder={t('frameName')}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
                <textarea
                  placeholder={t('description')}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    placeholder={t('startDate')}
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="date"
                    placeholder={t('endDate')}
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    {t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingFrame(null)
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {frames.map(frame => (
            <div key={frame.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{frame.name}</h3>
                  {frame.description && (
                    <p className="text-sm text-gray-600 mt-1">{frame.description}</p>
                  )}
                  {(frame.start_date || frame.end_date) && (
                    <p className="text-xs text-gray-500 mt-2">
                      {frame.start_date && `${t('startDate')}: ${new Date(frame.start_date).getFullYear()}`}
                      {frame.start_date && frame.end_date && ' - '}
                      {frame.end_date && `${t('endDate')}: ${new Date(frame.end_date).getFullYear()}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(frame)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(frame.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
