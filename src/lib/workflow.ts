import { supabase } from './supabase'
import { RequestStatus } from './types'

// ينفّذ انتقال حالة للطلب ويسجّل الإجراء في السجل الزمني
export async function transition(opts: {
  requestId: string
  from: RequestStatus
  to: RequestStatus
  actorId: string
  action: string
  note?: string
  extra?: Record<string, unknown>
}) {
  const { requestId, from, to, actorId, action, note, extra } = opts
  const { error: upErr } = await supabase
    .from('letter_requests')
    .update({ status: to, ...(extra || {}) })
    .eq('id', requestId)
  if (upErr) throw upErr

  const { error: logErr } = await supabase.from('letter_actions').insert({
    request_id: requestId,
    actor_id: actorId,
    action,
    from_status: from,
    to_status: to,
    note: note || null,
  })
  if (logErr) throw logErr
}
