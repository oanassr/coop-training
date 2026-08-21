import { createContext, useCallback, useContext, useState, ReactNode } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface ToastItem {
  id: number
  msg: string
  type: 'success' | 'error'
}
interface ToastCtx {
  show: (msg: string, type?: 'success' | 'error') => void
}
const Ctx = createContext<ToastCtx>({ show: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const show = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.random()
    setItems((prev) => [...prev, { id, msg, type }])
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 3400)
  }, [])
  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
        {items.map((i) => (
          <div
            key={i.id}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg animate-fade-up ${
              i.type === 'success' ? 'bg-kku-600' : 'bg-red-600'
            }`}
          >
            {i.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {i.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
