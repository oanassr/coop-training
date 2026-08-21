import { supabase } from './supabase'

// يرفع ملفاً إلى bucket ويعيد الرابط العام
export async function uploadAsset(
  file: File,
  folder: string,
  bucket = 'assets',
): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
