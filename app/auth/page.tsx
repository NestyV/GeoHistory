'use client'

import { useState } from 'react'
import { auth } from '@/lib/api'
import { t } from '@/app/lib/i18n'
import { useRouter } from 'next/navigation'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { user, error: signUpError } = await auth.signUp(
          email, 
          password, 
          fullName
        )

        if (signUpError) {
          setError(signUpError)
          return
        }

        if (user) {
          alert(t('signUpSuccess'))
          setIsSignUp(false)
          setEmail('')
          setPassword('')
          setFullName('')
        }
      } else {
        const { user, token, error: signInError } = await auth.login(email, password)

        if (signInError) {
          setError(signInError)
          return
        }

        if (user && token) {
          router.push('/map')
        }
      }
    } catch (e) {
      setError(t('errorOccurred'))
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {isSignUp ? t('signUp') : t('signIn')}
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder={t('fullName')}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full p-3 border rounded"
              required={isSignUp}
            />
          )}

          <input
            type="email"
            placeholder={t('email')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-3 border rounded"
            required
          />

          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-3 border rounded"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? t('loading') : (isSignUp ? t('signUp') : t('signIn'))}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
          }}
          className="w-full mt-4 text-blue-500 hover:text-blue-700"
        >
          {isSignUp ? t('login') : t('signUp')}
        </button>
      </div>
    </div>
  )
}
