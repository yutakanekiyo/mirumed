'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import ShareModal from '@/components/dashboard/ShareModal'

interface NewShareButtonProps {
  videoId: string
  videoTitle: string
}

export default function NewShareButton({ videoId, videoTitle }: NewShareButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Button onClick={() => setShowModal(true)} className="flex-shrink-0">
        <Share2 className="w-4 h-4 mr-2" />
        共有リンクを発行
      </Button>
      {showModal && (
        <ShareModal
          videoId={videoId}
          videoTitle={videoTitle}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
