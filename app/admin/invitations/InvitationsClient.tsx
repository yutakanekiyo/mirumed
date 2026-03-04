'use client'

import { useState } from 'react'
import { Copy, Check, Plus, RefreshCw, Shield } from 'lucide-react'

interface InvitationCode {
  id: string
  code: string
  is_used: boolean
  used_by_email: string | null
  created_at: string
}

interface InvitationsClientProps {
  initialCodes: InvitationCode[]
  siteUrl: string
}

function CopyButton({ text, label = 'コピー' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors min-h-0
        bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
    >
      {copied
        ? <><Check className="w-3 h-3 text-green-400" />コピー済み</>
        : <><Copy className="w-3 h-3" />{label}</>
      }
    </button>
  )
}

export default function InvitationsClient({ initialCodes, siteUrl }: InvitationsClientProps) {
  const [codes, setCodes] = useState(initialCodes)
  const [generating, setGenerating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/invitations', { method: 'POST' })
      if (res.ok) {
        await handleRefresh()
      }
    } finally {
      setGenerating(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/invitations')
      if (res.ok) {
        setCodes(await res.json())
      }
    } finally {
      setRefreshing(false)
    }
  }

  const unusedCount = codes.filter((c) => !c.is_used).length
  const usedCount = codes.filter((c) => c.is_used).length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ヘッダー */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">mirumed admin</p>
              <p className="text-xs text-slate-500">招待コード管理</p>
            </div>
          </div>
          <a
            href="/dashboard"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors min-h-0"
          >
            ← ダッシュボードへ戻る
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* サマリー */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 rounded-xl border border-slate-800 px-5 py-4">
            <p className="text-2xl font-bold text-white">{codes.length}</p>
            <p className="text-xs text-slate-500 mt-1">発行済み合計</p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 px-5 py-4">
            <p className="text-2xl font-bold text-emerald-400">{unusedCount}</p>
            <p className="text-xs text-slate-500 mt-1">未使用</p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 px-5 py-4">
            <p className="text-2xl font-bold text-slate-400">{usedCount}</p>
            <p className="text-xs text-slate-500 mt-1">使用済み</p>
          </div>
        </div>

        {/* アクションバー */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            招待コード一覧
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50 min-h-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              更新
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium
                bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 min-h-0"
            >
              <Plus className="w-3.5 h-3.5" />
              {generating ? '生成中...' : '新しいコードを発行'}
            </button>
          </div>
        </div>

        {/* テーブル */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {codes.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 text-sm">
              コードがまだ発行されていません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      招待コード
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      使用者
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      作成日
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      共有URL
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {codes.map((code) => {
                    const signupUrl = `${siteUrl}/signup?code=${code.code}`
                    return (
                      <tr key={code.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* コード */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-sm text-indigo-300 tracking-widest">
                              {code.code}
                            </code>
                            <CopyButton text={code.code} label="コード" />
                          </div>
                        </td>

                        {/* ステータス */}
                        <td className="px-5 py-4">
                          {code.is_used ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-400">
                              使用済み
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/60 text-emerald-400">
                              未使用
                            </span>
                          )}
                        </td>

                        {/* 使用者 */}
                        <td className="px-5 py-4 text-slate-400 text-xs">
                          {code.used_by_email ?? (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* 作成日 */}
                        <td className="px-5 py-4 text-slate-500 text-xs">
                          {new Date(code.created_at).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        {/* 共有URL */}
                        <td className="px-5 py-4">
                          {!code.is_used && (
                            <CopyButton text={signupUrl} label="URLをコピー" />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-600 text-center">
          共有URLの形式: {siteUrl}/signup?code=MIRU-XXXX-XXXX
        </p>
      </main>
    </div>
  )
}
