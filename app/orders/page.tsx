'use client'
import { useState } from 'react'

type Order = { id: string; productName: string; amount: number; status: string; createdAt: string }

const orders: Order[] = [
  { id: 'order-1', productName: '商品 A', amount: 1200, status: 'COMPLETED', createdAt: '2025-02-01' },
  { id: 'order-2', productName: '商品 B', amount: 850, status: 'COMPLETED', createdAt: '2025-02-05' },
  { id: 'order-3', productName: '商品 C', amount: 2000, status: 'COMPLETED', createdAt: '2025-02-10' },
]

export default function OrdersPage() {
  const [selected, setSelected] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')

  const toggle = (id: string) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const submit = async () => {
    if (!reason.trim()) { alert('請填寫退款理由'); return }
    const res = await fetch('/api/refund/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIds: selected, reason }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg(`已提交 ${selected.length} 筆批量退款申請`)
      setSelected([]); setReason(''); setOpen(false)
    } else {
      alert(data.error || '退款失敗')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">我的訂單</h1>
      {msg && <p className="mb-4 text-green-600 font-medium">{msg}</p>}

      {selected.length > 0 && (
        <button onClick={() => setOpen(true)}
          className="mb-6 px-4 py-2 border rounded-md hover:bg-gray-50">
          批量申請退款 ({selected.length})
        </button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-2">批量退款申請</h2>
            <p className="text-sm text-gray-500 mb-4">您選擇了 {selected.length} 筆訂單</p>
            <textarea name="reason" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="請填寫退款理由" className="w-full border rounded-md p-2 h-28 mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 border rounded-md">取消</button>
              <button onClick={submit} className="px-4 py-2 bg-blue-600 text-white rounded-md">確認提交</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {orders.map(o => (
          <div key={o.id} className="flex items-center gap-4 border p-4 rounded-lg">
            <input type="checkbox" value={o.id} checked={selected.includes(o.id)}
              onChange={() => toggle(o.id)} disabled={o.status !== 'COMPLETED'} className="w-4 h-4" />
            <div className="flex-1">
              <p className="font-medium">{o.productName}</p>
              <p className="text-sm text-gray-500">NT$ {o.amount.toLocaleString()} • {new Date(o.createdAt).toLocaleDateString('zh-TW')}</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">{o.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
