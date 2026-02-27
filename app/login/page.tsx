'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const urlError = searchParams.get('error')

  useEffect(() => {
    if (urlError === 'CredentialsSignin') {
      setError('電子郵件或密碼錯誤')
    } else if (urlError === 'CallbackRouteError') {
      setError('登入時發生錯誤，請重試')
    } else if (urlError) {
      setError('登入失敗，請檢查您的電子郵件與密碼')
    }
  }, [urlError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    })

    if (result?.error) {
      if (result.error === 'CredentialsSignin') {
        setError('電子郵件或密碼錯誤')
      } else {
        setError('登入失敗，請檢查您的電子郵件與密碼')
      }
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">登入</h1>
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 text-sm rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} name="loginForm">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">電子郵件</label>
            <input name="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md" required />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">密碼</label>
            <input name="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-md" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
            登入
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">載入中...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
