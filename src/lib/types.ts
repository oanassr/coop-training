export type Role = 'admin' | 'coordinator' | 'training_unit' | 'supervisor' | 'student'

export type RequestStatus =
  | 'draft'
  | 'submitted'
  | 'needs_revision'
  | 'supervisor_approved'
  | 'supervisor_rejected'
  | 'unit_review'
  | 'issued'
  | 'delivered'
  | 'cancelled'

export interface Profile {
  id: string
  auth_user_id: string | null
  role: Role
  full_name: string
  kku_email: string
  university_number: string | null
  national_id: string | null
  phone: string | null
  department: string | null
  major: string | null
  position: string | null
  signature_url: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TrainingEntity {
  id: string
  name: string
  sector: string | null
  city: string | null
  address: string | null
  contact_person: string | null
  contact_email: string | null
  contact_phone: string | null
  is_approved: boolean
  capacity: number
  seats_taken: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface StudentAssignment {
  id: string
  student_id: string
  supervisor_id: string
  term: string
  is_active: boolean
  assigned_by: string | null
  assigned_at: string
}

export interface LetterRequest {
  id: string
  request_number: string | null
  student_id: string
  entity_id: string | null
  supervisor_id: string | null
  term: string
  status: RequestStatus
  purpose: string | null
  created_at: string
  updated_at: string
  // علاقات مُحمّلة
  student?: Profile
  supervisor?: Profile
  entity?: TrainingEntity
  issued?: IssuedLetter
}

export interface LetterAction {
  id: string
  request_id: string
  actor_id: string | null
  action: string
  from_status: RequestStatus | null
  to_status: RequestStatus | null
  note: string | null
  created_at: string
  actor?: Profile
}

export interface IssuedLetter {
  id: string
  request_id: string
  letter_number: string
  pdf_url: string | null
  issued_by: string | null
  issued_at: string
  supervisor_name: string | null
  supervisor_signature_snapshot: string | null
  unit_supervisor_name: string | null
  unit_signature_snapshot: string | null
  stamp_snapshot: string | null
  verify_token: string
}

export interface Settings {
  id: number
  college_name: string
  university_name: string
  unit_name: string
  unit_supervisor_name: string | null
  unit_signature_url: string | null
  stamp_url: string | null
  logo_url: string | null
  current_term: string
  letter_prefix: string
  letter_counter: number
  letter_template: string
  updated_at: string
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'مدير النظام',
  coordinator: 'مرشد التدريب',
  training_unit: 'وحدة التدريب',
  supervisor: 'مشرف التدريب',
  student: 'طالب',
}

export const STATUS_LABEL: Record<RequestStatus, string> = {
  draft: 'مسودة',
  submitted: 'مُقدَّم للمشرف',
  needs_revision: 'يحتاج تعديل',
  supervisor_approved: 'اعتمده المشرف',
  supervisor_rejected: 'رفضه المشرف',
  unit_review: 'لدى وحدة التدريب',
  issued: 'مُصدَر ومختوم',
  delivered: 'سُلّم للجهة',
  cancelled: 'ملغى',
}
