'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Save, Check } from 'lucide-react'
import type { Profile } from '@/types'

interface ProfileFormProps {
  profile: Profile | null
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name ?? '',
    clinic_name: profile?.clinic_name ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('認証エラーが発生しました')
      setLoading(false)
      return
    }

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: formData.full_name,
        clinic_name: formData.clinic_name,
        role: 'doctor',
      })

    if (upsertError) {
      setError('保存に失敗しました: ' + upsertError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              氏名
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary"
              placeholder="山田 太郎"
            />
          </div>

          <div>
            <label htmlFor="clinic_name" className="block text-sm font-medium text-gray-700 mb-1">
              医療機関名
            </label>
            <input
              id="clinic_name"
              name="clinic_name"
              type="text"
              value={formData.clinic_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary"
              placeholder="山田クリニック"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                保存しました
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存する
              </>
            )}
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
