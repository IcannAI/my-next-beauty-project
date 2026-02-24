'use client'

import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Checkbox } from '../../components/ui/checkbox'
import { Textarea } from '../../components/ui/textarea'
import { ShoppingBag } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog'

type OrderWithRefund = {
  id: string
  productId: string
  totalAmount: number
  status: string
  createdAt: Date
  refundRequest: any | null
}

export function OrdersList({ orders }: { orders: OrderWithRefund[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggle = (id: string) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const submit = async () => {
    if (!reason.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/refund/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selected, reason }),
      })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || '退款失敗')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedTotal = orders
    .filter(o => selected.includes(o.id))
    .reduce((sum, o) => sum + o.totalAmount, 0)

  if (orders.length === 0) {
    return (
      <div className="text-center py-32 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed dark:border-gray-700">
        <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-xl font-bold text-gray-400 dark:text-gray-500 tracking-tight">還沒有任何訂單</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 sticky top-4 z-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">已選擇 {selected.length} 筆</p>
          <p className="text-2xl font-black text-rose-500 dark:text-rose-400">NT$ {selectedTotal.toLocaleString()}</p>
        </div>
        <Button 
          disabled={selected.length === 0}
          onClick={() => setOpen(true)}
          className="rounded-full px-8 py-6 h-auto bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-lg shadow-rose-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
        >
          批量申請退款
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl border-none p-8 dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900 dark:text-white">申請批量退款</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/30">
              <p className="text-sm text-rose-700 dark:text-rose-300 font-bold">
                即將為 {selected.length} 筆訂單申請退款，總金額 NT$ {selectedTotal.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 ml-1">退款原因</label>
              <Textarea
                placeholder="請輸入退款理由（至少 5 個字）"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="min-h-[140px] rounded-2xl bg-gray-50 dark:bg-gray-900 border-none focus:ring-2 focus:ring-rose-500 dark:text-white p-4"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full px-8 font-bold border-2 dark:border-gray-700 dark:text-gray-300">
              取消
            </Button>
            <Button 
              onClick={submit} 
              disabled={reason.trim().length < 5 || isSubmitting}
              className="rounded-full px-10 bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-lg shadow-rose-100 dark:shadow-none"
            >
              {isSubmitting ? '提交中...' : '確認提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6">
        {orders.map(o => (
          <div 
            key={o.id} 
            className={`
              group flex items-center gap-6 p-6 bg-white dark:bg-gray-800 rounded-3xl border-2 transition-all duration-300
              ${selected.includes(o.id) ? 'border-rose-500 bg-rose-50/20 shadow-xl shadow-rose-100/20 dark:shadow-none' : 'border-transparent hover:border-gray-100 dark:hover:border-gray-700 shadow-md shadow-gray-100/50 dark:shadow-none'}
            `}
          >
            <Checkbox 
              checked={selected.includes(o.id)}
              onCheckedChange={() => toggle(o.id)}
              disabled={o.status !== 'COMPLETED' || !!o.refundRequest}
              className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-black text-gray-900 dark:text-white text-lg tracking-tight">訂單 #{o.id.slice(-8)}</h3>
                  <p className="text-sm font-bold text-gray-400 dark:text-gray-500">
                    {new Date(o.createdAt).toLocaleString('zh-TW')}
                  </p>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                  <p className="text-xl font-black text-gray-900 dark:text-white tracking-tighter italic">NT$ {o.totalAmount.toLocaleString()}</p>
                  <span className={`
                    inline-block px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase
                    ${o.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                      o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                  `}>
                    {o.status}
                  </span>
                </div>
              </div>
              
              {o.refundRequest && (
                <div className="mt-4 py-3 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    <span className="uppercase tracking-widest opacity-60">退款狀態</span>
                    <span className="text-orange-600 dark:text-orange-400 font-black">{o.refundRequest.status}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
