'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="bg-gray-900 p-8 rounded-[2rem] border border-white/5 shadow-2xl w-96">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white italic tracking-tighter">
            BEAUTY<span className="text-rose-500">LIVE</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">登入帳號</p>
        </div>
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 text-sm rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} name="loginForm">
          <div className="mb-4">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">電子郵件</label>
            <input name="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-white/10 text-white rounded-xl focus:border-rose-500 transition-colors" required />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">密碼</label>
            <input name="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-white/10 text-white rounded-xl focus:border-rose-500 transition-colors" required />
          </div>
          <button type="submit" className="w-full bg-rose-500 text-white py-3 rounded-xl hover:bg-rose-600 font-bold transition-all shadow-lg shadow-rose-500/20 active:scale-95">
            登入
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          還沒有帳號？
          <Link href="/register" className="text-rose-500 hover:underline ml-1">
            立即註冊
          </Link>
        </p>
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
