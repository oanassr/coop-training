import { supabase } from './supabase'
import { LetterRequest } from './types'

const SELECT = `*,
  student:profiles!letter_requests_student_id_fkey(*),
  supervisor:profiles!letter_requests_supervisor_id_fkey(*),
  entity:training_entities(*),
  issued:issued_letters(*)`

export async function fetchRequests(opts?: {
  studentId?: string
  supervisorId?: string
  statuses?: string[]
}): Promise<LetterRequest[]> {
  let q = supabase.from('letter_requests').select(SELECT).order('created_at', { ascending: false })
  if (opts?.studentId) q = q.eq('student_id', opts.studentId)
  if (opts?.supervisorId) q = q.eq('supervisor_id', opts.supervisorId)
  if (opts?.statuses) q = q.in('status', opts.statuses)
  const { data, error } = await q
  if (error) throw error
  return (data as any[])?.map(normalize) || []
}

export async function fetchRequest(id: string): Promise<LetterRequest | null> {
  const { data } = await supabase.from('letter_requests').select(SELECT).eq('id', id).maybeSingle()
  return data ? normalize(data) : null
}

// Supabase يعيد العلاقة كمصفوفة للـ issued (لأنها join)، نطبّعها لكائن
function normalize(row: any): LetterRequest {
  return {
    ...row,
    issued: Array.isArray(row.issued) ? row.issued[0] : row.issued,
  }
}
