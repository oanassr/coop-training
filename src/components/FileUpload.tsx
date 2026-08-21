import { useRef, useState } from 'react'
import { uploadAsset } from '../lib/storage'
import { Spinner } from './ui'
import { Upload, ImageIcon, Trash2 } from 'lucide-react'

export function FileUpload({
  value,
  onChange,
  folder,
  label,
  hint,
}: {
  value: string | null | undefined
  onChange: (url: string | null) => void
  folder: string
  label?: string
  hint?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const pick = () => inputRef.current?.click()

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErr(null)
    setLoading(true)
    try {
      const url = await uploadAsset(file, folder)
      onChange(url)
    } catch (e: any) {
      setErr(e.message || 'تعذّر رفع الملف')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex items-center gap-3">
        <div className="grid h-20 w-32 place-items-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <ImageIcon className="h-6 w-6 text-slate-300" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={pick} disabled={loading} className="btn-ghost">
            {loading ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {value ? 'تغيير' : 'رفع صورة'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null)} className="btn-danger">
              <Trash2 className="h-4 w-4" />
              إزالة
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handle} />
      </div>
      {hint && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
      {err && <p className="mt-1.5 text-xs font-bold text-red-600">{err}</p>}
    </div>
  )
}
