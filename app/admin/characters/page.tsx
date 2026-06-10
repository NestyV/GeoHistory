'use client'

import { useEffect, useState } from 'react'
import { api, auth } from '@/lib/api'
import Navbar from '@/app/components/Navbar'
import AdminNav from '@/app/components/AdminNav'
import OptimizedImage from '@/app/components/OptimizedImage'
import { useRouter } from 'next/navigation'
import { t } from '@/app/lib/i18n'

function convertWikipediaUrl(url: string): string {
  if (!url) return url
  if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) return url
  const esMatch = url.match(/\/media\/Archivo:(.+?)\.(jpg|jpeg|png|gif)/i)
  if (esMatch) {
    const filename = esMatch[1]
    const extension = esMatch[2]
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${filename.charAt(0)}/${filename}/${filename}.${extension}/200px-${filename}.${extension}`
  }
  return url
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCharacter, setEditingCharacter] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [showUrlHelper, setShowUrlHelper] = useState(false)
  const [wikipediaUrl, setWikipediaUrl] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: ''
  })
  const router = useRouter()
  const currentUser = auth.getUser()
  const isAtLeastCurator = currentUser?.role === 'curator' || currentUser?.role === 'super_user'

  useEffect(() => {
    if (!isAtLeastCurator) {
      router.push('/map')
      return
    }
    fetchCharacters()
  }, [router, isAtLeastCurator])

  const fetchCharacters = async () => {
    try {
      const data = await api.getCharacters()
      setCharacters(data || [])
    } catch (error) {
      console.error('Error fetching characters:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCharacter) {
        const response = await fetch(`http://localhost:3001/api/characters/${editingCharacter.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify(formData)
        })
        if (!response.ok) {
          const error = await response.json()
          alert('Error: ' + error.error)
          return
        }
      } else {
        await api.createCharacter(formData.name, formData.description, formData.image_url)
      }
      setShowForm(false)
      setEditingCharacter(null)
      setFormData({ name: '', description: '', image_url: '' })
      setImagePreview('')
      setWikipediaUrl('')
      fetchCharacters()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/characters/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      if (response.ok) {
        fetchCharacters()
      }
    } catch (error) {
      console.error('Error deleting character:', error)
      alert('Error deleting character')
    }
  }

  const handleEdit = (character: any) => {
    setEditingCharacter(character)
    setFormData({
      name: character.name,
      description: character.description || '',
      image_url: character.image_url || ''
    })
    setImagePreview(character.image_url || '')
    setWikipediaUrl('')
    setShowForm(true)
  }

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, image_url: url })
    setImagePreview(url)
  }

  const handleConvertWikipediaUrl = () => {
    if (!wikipediaUrl) return
    const directUrl = convertWikipediaUrl(wikipediaUrl)
    setFormData({ ...formData, image_url: directUrl })
    setImagePreview(directUrl)
    setWikipediaUrl('')
    setShowUrlHelper(false)
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
          <h2 className="text-2xl font-semibold">{t('characters')}</h2>
          <button
            onClick={() => {
              setEditingCharacter(null)
              setFormData({ name: '', description: '', image_url: '' })
              setImagePreview('')
              setWikipediaUrl('')
              setShowForm(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + {t('addCharacter')}
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-md w-full my-8">
              <h3 className="text-xl font-bold mb-4">
                {editingCharacter ? t('edit') : t('addCharacter')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder={t('characterName')}
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
                
                <div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder={t('imageUrl')}
                      value={formData.image_url}
                      onChange={e => handleImageUrlChange(e.target.value)}
                      className="flex-1 p-2 border rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUrlHelper(!showUrlHelper)}
                      className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 text-sm"
                    >
                      {t('help')}
                    </button>
                  </div>
                </div>

                {showUrlHelper && (
                  <div className="border rounded p-3 bg-blue-50">
                    <p className="text-sm font-semibold mb-2">📸 ¿Cómo obtener la URL correcta de Wikipedia?</p>
                    <ol className="text-xs space-y-2 list-decimal list-inside">
                      <li>Ve a la página de Wikipedia del personaje</li>
                      <li>Haz clic derecho sobre la imagen</li>
                      <li>Selecciona "Copiar dirección de la imagen"</li>
                      <li>Pega la URL en el campo de arriba</li>
                    </ol>
                    <div className="mt-3">
                      <p className="text-xs font-semibold mb-1">O pega la URL de la página de Wikipedia:</p>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://es.wikipedia.org/wiki/..."
                          value={wikipediaUrl}
                          onChange={e => setWikipediaUrl(e.target.value)}
                          className="flex-1 p-1 border rounded text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleConvertWikipediaUrl}
                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                        >
                          {t('convert')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {imagePreview && (
                  <div className="mt-2 p-2 border rounded bg-gray-50">
                    <p className="text-sm text-gray-600 mb-1">{t('imagePreview')}:</p>
                    <OptimizedImage 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-24 h-24 object-cover rounded mx-auto"
                    />
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    {t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingCharacter(null)
                      setImagePreview('')
                      setWikipediaUrl('')
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map(char => (
            <div key={char.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <div className="flex gap-3">
                {char.image_url ? (
                  <OptimizedImage 
                    src={char.image_url} 
                    alt={char.name} 
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                    {t('noImage')}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{char.name}</h3>
                  {char.description && (
                    <p className="text-sm text-gray-600 mt-1">{char.description}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(char)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(char.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
