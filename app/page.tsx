// app/page.tsx
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LoginPage from '@/components/LoginPage'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading, userRole } = useAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Oturumu olan kullanıcıyı rolüne göre yönlendir
      if (userRole === 'WEB') {
        router.replace('/mobile-app')
      } else {
        router.replace('/dashboard')
      }
    }
  }, [isAuthenticated, isLoading, userRole, router])

  // Yükleniyor durumunda
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          <p className="mt-4 text-white/60">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Oturumu yoksa login sayfasını göster
  if (!isAuthenticated) {
    return <LoginPage />
  }

  // Yönlendirme yapılıyor (bu noktaya gelmemeli)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        <p className="mt-4 text-white/60">Yönlendiriliyorsunuz...</p>
      </div>
    </div>
  )
}