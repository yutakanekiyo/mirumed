import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import InvitationsClient from './InvitationsClient'

export default async function AdminInvitationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 管理者メール以外は 404
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    notFound()
  }

  const admin = createAdminClient()
  const { data: codes } = await admin
    .from('invitation_codes')
    .select('*')
    .order('created_at', { ascending: false })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  return (
    <InvitationsClient
      initialCodes={codes ?? []}
      siteUrl={siteUrl}
    />
  )
}
