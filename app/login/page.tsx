'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password) {
      localStorage.setItem('userEmail', email)
      router.push('/orders')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">登入</h1>
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
