import { useSettings } from '../lib/settings'

// شعار الجامعة: يعرض الشعار الرسمي المرفوع، وإلا عنصراً نائباً أنيقاً بألوان الجامعة.
export function Logo({ size = 44 }: { size?: number }) {
  const { settings } = useSettings()
  if (settings?.logo_url) {
    return (
      <img
        src={settings.logo_url}
        alt="شعار جامعة الملك خالد"
        style={{ height: size }}
        className="w-auto object-contain"
      />
    )
  }
  return (
    <div
      className="grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-kku-600 to-kku-800 text-white shadow-sm"
      style={{ height: size, width: size }}
    >
      <svg viewBox="0 0 64 64" style={{ height: size * 0.62 }}>
        <path
          d="M32 10l4.6 9.3 10.3 1.5-7.4 7.2 1.7 10.2L32 43.6l-9.2 4.8 1.7-10.2-7.4-7.2 10.3-1.5z"
          fill="#e0bf6a"
        />
      </svg>
    </div>
  )
}
