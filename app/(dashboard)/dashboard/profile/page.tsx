import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/dashboard/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">プロフィール編集</h1>
        <p className="text-gray-500 mt-1 text-sm">氏名・医療機関名を変更できます</p>
      </div>

      <div className="max-w-lg">
        <ProfileForm profile={profile} />
      </div>
    </div>
  )
}
