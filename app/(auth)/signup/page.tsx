'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { UserPlus, Ticket } from 'lucide-react'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    inviteCode: '',
    fullName: '',
    clinicName: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // URLパラメータ ?code=XXXX からコードを自動入力
  useEffect(() => {
    const codeFromUrl = searchParams.get('code')
    if (codeFromUrl) {
      setFormData((prev) => ({ ...prev, inviteCode: codeFromUrl.toUpperCase() }))
    }
  }, [searchParams])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const code = formData.inviteCode.trim().toUpperCase()

    // Step 1: 招待コードの有効性を確認
    const { data: isValid, error: checkError } = await supabase.rpc(
      'check_invitation_code',
      { p_code: code }
    )

    if (checkError || !isValid) {
      setError('招待コードが無効または使用済みです')
      setLoading(false)
      return
    }

    // Step 2: Supabase Auth でユーザー登録
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          clinic_name: formData.clinicName,
        },
      },
    })

    if (signUpError) {
      const msg = signUpError.message
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('このメールアドレスはすでに登録済みです')
      } else if (msg.includes('invalid') && msg.toLowerCase().includes('email')) {
        setError('メールアドレスの形式が正しくありません')
      } else if (msg.includes('Password') || msg.includes('password')) {
        setError('パスワードは8文字以上で入力してください')
      } else {
        setError('登録に失敗しました。しばらく経ってから再度お試しください')
      }
      setLoading(false)
      return
    }

    // メール確認が有効な場合、既存メールでも signUpError にならず
    // identities が空で返ってくるため重複チェック
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('このメールアドレスはすでに登録済みです')
      setLoading(false)
      return
    }

    // Step 3: 招待コードを使用済みにマーク（ユーザー情報も記録）
    if (data.user) {
      await supabase.rpc('use_invitation_code', {
        p_code: code,
        p_user_id: data.user.id,
        p_user_email: formData.email,
      })

      if (data.session) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setSuccess(true)
      }
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">確認メールを送信しました</h2>
            <p className="text-gray-500 text-sm mb-6">
              {formData.email} に確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。
            </p>
            <Link href="/login">
              <Button variant="secondary" className="w-full">ログインページへ</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">mirumed</h1>
          <p className="text-gray-500 mt-1 text-sm">医師アカウント登録</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">新規登録</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* 招待コード（最上部に配置） */}
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
                招待コード <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  value={formData.inviteCode}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary font-mono tracking-widest uppercase"
                  placeholder="MIRU-XXXX-XXXX"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">担当者からお知らせした招待コードを入力してください</p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">アカウント情報</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    氏名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary"
                    placeholder="山田 太郎"
                  />
                </div>

                <div>
                  <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700 mb-1">
                    医療機関名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="clinicName"
                    name="clinicName"
                    type="text"
                    value={formData.clinicName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary"
                    placeholder="山田クリニック"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary"
                    placeholder="doctor@clinic.jp"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary"
                    placeholder="8文字以上"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              <UserPlus className="w-4 h-4 mr-2" />
              登録する
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
