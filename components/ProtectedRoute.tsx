// components/ProtectedRoute.tsx - GÜNCELLENMİŞ
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('GELISTIRME' | 'WEB')[]
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/' 
}: ProtectedRouteProps) {
  const { user, userRole, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/')
      return
    }

    if (!isLoading && isAuthenticated) {
      // Rol kontrolü
      if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        // Kullanıcı tipine göre doğru sayfaya yönlendir
        if (userRole === 'GELISTIRME') {
          router.replace('/dashboard')
        } else if (userRole === 'WEB') {
          router.replace('/mobile-app')
        }
        return
      }
      
      // Authenticated ve authorized ise, path kontrolü yap
      if (userRole === 'WEB' && window.location.pathname.startsWith('/dashboard')) {
        router.replace('/mobile-app')
      } else if (userRole === 'GELISTIRME' && window.location.pathname.startsWith('/mobile-app')) {
        router.replace('/dashboard')
      }
    }
  }, [isAuthenticated, isLoading, userRole, allowedRoles, router, redirectTo])

  // Yükleniyor durumunda
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          <p className="mt-4 text-white/60">Kimlik doğrulanıyor...</p>
        </div>
      </div>
    )
  }

  // Yetkisiz erişim durumunda
  if (!isAuthenticated) {
    return null // Redirect yapacak
  }

  // Rol kontrolü
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="text-center p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
          <div className="text-red-400 text-6xl mb-4">⛔</div>
          <h2 className="text-xl font-bold text-white mb-2">Erişim Engellendi</h2>
          <p className="text-white/60">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          <button 
            onClick={() => userRole === 'GELISTIRME' ? router.push('/dashboard') : router.push('/mobile-app')}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Doğru Sayfaya Git
          </button>
        </div>
      </div>
    )
  }

  // Kimlik doğrulanmış ve yetkiliyse içeriği göster
  return <>{children}</>
}