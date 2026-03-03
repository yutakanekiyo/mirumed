export interface Profile {
  id: string
  full_name: string
  clinic_name: string
  role: string
  created_at: string
}

export interface Video {
  id: string
  doctor_id: string
  title: string
  description: string | null
  disease_category: string | null
  storage_path: string
  duration_seconds: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VideoShare {
  id: string
  video_id: string
  token: string
  patient_name: string | null
  expires_at: string
  is_revoked: boolean
  created_by: string
  created_at: string
}

export interface WatchLog {
  id: string
  share_id: string
  watched_at: string
  is_completed: boolean
  watch_duration_seconds: number
}

export interface VideoWithWatchStatus extends Video {
  latest_share?: VideoShare & {
    watch_logs?: WatchLog[]
  }
  is_watched?: boolean
}

export interface ShareResponse {
  share: VideoShare
  shareUrl: string
  qrCodeDataUrl: string
}
