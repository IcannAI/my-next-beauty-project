'use client'
export function Checkbox({ checked, onCheckedChange, disabled, className }: {
  checked: boolean; onCheckedChange: () => void; disabled?: boolean; className?: string
}) {
  return (
    <input type="checkbox" checked={checked} onChange={onCheckedChange}
      disabled={disabled} className={`w-4 h-4 cursor-pointer ${className ?? ''}`} />
  )
}
