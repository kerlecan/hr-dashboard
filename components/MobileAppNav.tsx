"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  Home, User, Calendar, Clock, CreditCard,
  QrCode, FileText, Bell, LogOut, X,
  Sun, Moon, MoreVertical,
  Building, MapPin, Eye, EyeOff, ShieldCheck, ChevronRight,
  CalendarDays, Clock as TimeIcon, AlertCircle,
  Sparkles, TrendingUp, ChevronDown,
  Target, Award, Rocket, Star, TrendingUp as TrendingUpIcon,
  Users, Briefcase, Layers, PieChart, Crown
} from 'lucide-react'

type DashboardResponse = {
  success: boolean
  data?: {
    ad: string
    ikinciAd?:  string
    soyad:  string
    display:  string
    email: string
    tcKimlik: string
    manager1Tc?:  string
    manager2Tc?:  string
    gercekMi:  boolean
    departman: string
    departmanKodu?:  string
    unvan: string
    firma: string
    tesis: string
    dogumTarihi?:  string
    iseBaslayis?: string
    maas?:  { net?:  number; yil?: string; ay?: string }
    izin?: { kullanilan?: number; kalan?: number }
    sonrakiMesai?: { tarih:  string; gun: string; saat?:  string } | null
  }
}

const mobileNavItems = [
  { name:  'Ana Sayfa', icon: Home, path: '/mobile-app', badge: null, color: 'from-blue-500 to-cyan-500', activeColor: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
  { name: 'Bordro', icon: CreditCard, path: '/mobile-app/payroll', badge: null, color:  'from-violet-500 to-purple-500', activeColor: 'bg-gradient-to-r from-violet-500 to-purple-500' },
  { name: 'QR', icon: QrCode, path:  '/mobile-app/QR', badge: null, color:  'from-emerald-500 to-green-500', activeColor: 'bg-gradient-to-r from-emerald-500 to-green-500', emphasize: true },
  { name: 'İzinler', icon: Calendar, path: '/mobile-app/leaves', badge: null, color: 'from-amber-500 to-orange-500', activeColor: 'bg-gradient-to-r from-amber-500 to-orange-500' },
  { name: 'Taleplerim', icon: FileText, path: '/mobile-app/requests', badge: null, color: 'from-pink-500 to-rose-500', activeColor: 'bg-gradient-to-r from-pink-500 to-rose-500' },
]

function formatCurrency(value?:  number) {
  if (value === undefined || value === null) return '—'
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 })
}

function truncateFirmName(name: string, max = 64) {
  if (!name) return '—'
  return name.length > max ? name.slice(0, max - 1) + '…' : name
}

function truncateTesis(name: string, max = 40) {
  if (!name) return '—'
  return name.length > max ? name.slice(0, max - 1) + '…' : name
}

function parseTrDate(ddmmyyyy: string) {
  const [dd, mm, yyyy] = ddmmyyyy.split('. ').map(Number)
  if (! dd || !mm || !yyyy) return null
  return new Date(yyyy, mm - 1, dd)
}

function humanizeShift(dateStr?:  string) {
  if (!dateStr) return 'Planlanmıyor'
  const date = parseTrDate(dateStr)
  if (!date) return dateStr
  const today = new Date()
  const target = new Date(date. getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((target. getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Bugün'
  if (diffDays === 1) return 'Yarın'
  if (diffDays === -1) return 'Dün'
  if (diffDays > 1 && diffDays <= 7) return `${diffDays} gün sonra`
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} gün önce`
  return dateStr
}

function getLeaveColor(kalan?:  number, darkMode:  boolean = true) {
  if (kalan === undefined || kalan === null) return { 
    badge: darkMode ? 'bg-slate-500/20 text-slate-100' : 'bg-slate-200 text-slate-700', 
    bar: 'from-slate-500 to-slate-400' 
  }
  if (kalan >= 10) return { 
    badge: darkMode ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-700 border border-emerald-300', 
    bar: 'from-emerald-500 to-green-500' 
  }
  if (kalan >= 5) return { 
    badge: darkMode ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40' : 'bg-amber-100 text-amber-700 border border-amber-300', 
    bar: 'from-amber-500 to-orange-500' 
  }
  return { 
    badge: darkMode ? 'bg-rose-500/25 text-rose-100 border border-rose-500/40' : 'bg-rose-100 text-rose-700 border border-rose-300', 
    bar: 'from-rose-500 to-pink-500' 
  }
}

export default function MobileAppNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [dashboard, setDashboard] = useState<DashboardResponse['data'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNetSalary, setShowNetSalary] = useState(false)

  const notificationRef = useRef<HTMLDivElement | null>(null)
  const [notificationOpen, setNotificationOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    const isDark = stored === 'true' || (stored === null && true)
    setDarkMode(isDark)
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList. remove('dark')
  }, [])

  useEffect(() => {
    if (isMenuOpen) {
      const original = document.body.style.overflow
      document.body.style. overflow = 'hidden'
      return () => { document.body.style.overflow = original }
    }
  }, [isMenuOpen])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    if (newMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    try {
      const dbName = (user as any)?.dbName || 'HOMINUM'
      const persid = (user as any)?.persid
      const res = await fetch(`/api/mobil-user/dashboard?dbName=${encodeURIComponent(dbName)}`, {
        method: 'POST',
        headers: {
          'x-db-name': dbName,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ persid }),
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Beklenmeyen hata')
      }
      const json:  DashboardResponse = await res. json()
      if (!json.success || !json.data) throw new Error(json as any)
      setDashboard(json.data)
    } catch (err:  any) {
      if (err.name === 'AbortError') setError('Bağlantı zaman aşımı.  Tekrar dene.')
      else setError('Veri alınamadı.  Lütfen tekrar dene.')
      console.error('Dashboard fetch error:', err)
    } finally {
      clearTimeout(timer)
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const handleLogout = async () => {
    try { await logout() } catch (error) { console.error('Logout error:', error) }
  }

  const izinKullanilan = dashboard?.izin?.kullanilan ??  0
  const izinKalan = dashboard?.izin?.kalan ?? 0
  const izinToplam = izinKullanilan + izinKalan
  const izinProgress = izinToplam > 0 ? (izinKullanilan / izinToplam) * 100 : 0
  const izinColors = getLeaveColor(izinKalan, darkMode)

  return (
    <>
      {/* ÜST NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        darkMode
          ? 'bg-gradient-to-br from-slate-900 via-purple-900/70 to-slate-900'
          : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700'
      } shadow-2xl`}>
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${darkMode ? 'via-cyan-400/50' : 'via-white/50'} to-transparent`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
        
        <div className="relative px-3 py-2 space-y-1.5">
          {/* Üst Satır:  Avatar + İsim + Butonlar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Avatar - Taç kaldırıldı */}
              <div className="relative flex-shrink-0">
                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${darkMode ? 'from-cyan-500 via-purple-500 to-pink-500' : 'from-white via-indigo-100 to-purple-100'} p-0.5 shadow-lg`}>
                  <div className={`h-full w-full rounded-xl ${darkMode ? 'bg-slate-900' : 'bg-indigo-700'} flex items-center justify-center`}>
                    <span className="text-sm font-black text-white">
                      {dashboard?.display? .[0]?.toUpperCase() || user?.display?.[0]?.toUpperCase() || 'P'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* İsim ve Bilgiler */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1. 5">
                  <h2 className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-white'}`}>
                    {dashboard?.display || user?.display || 'Personel'}
                  </h2>
                  <span className={`flex-shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded-full border ${
                    darkMode 
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30' 
                      : 'bg-white/20 border-white/40'
                  }`}>
                    <Crown className={`h-2 w-2 ${darkMode ? 'text-amber-300' : 'text-amber-200'}`} />
                    <span className={`text-[9px] font-bold ${darkMode ? 'text-amber-200' : 'text-white'}`}>PRO</span>
                  </span>
                </div>
                
                {/* Departman ve Ünvan */}
                <div className={`flex items-center gap-1 mt-0.5 text-[10px] ${darkMode ? 'text-white/70' : 'text-white/90'}`}>
                  <span className="truncate">{dashboard?.departman || 'Departman'}</span>
                  <span className={`flex-shrink-0 ${darkMode ? 'text-white/40' : 'text-white/60'}`}>•</span>
                  <span className="truncate">{dashboard?.unvan || 'Ünvan'}</span>
                </div>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${
                  darkMode 
                    ? 'bg-slate-800/80 hover:bg-slate-700 border border-white/10' 
                    : 'bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm'
                }`}
              >
                {darkMode ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-white" />}
              </button>
              
              <button 
                onClick={() => setNotificationOpen(! notificationOpen)}
                className={`p-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${
                  darkMode 
                    ? 'bg-slate-800/80 hover:bg-slate-700 border border-white/10' 
                    : 'bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm'
                }`}
              >
                <Bell className={`h-4 w-4 ${darkMode ? 'text-cyan-400' : 'text-white'}`} />
              </button>
              
              <button
                onClick={handleLogout}
                className={`p-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${
                  darkMode 
                    ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30' 
                    : 'bg-red-500/30 hover:bg-red-500/40 border border-red-400/50 backdrop-blur-sm'
                }`}
              >
                <LogOut className={`h-4 w-4 ${darkMode ?  'text-red-400' : 'text-white'}`} />
              </button>
            </div>
          </div>

          {/* Firma ve Tesis - Tek satır */}
          <div className={`flex items-center gap-1. 5 text-[10px] ${darkMode ? 'text-white/80' : 'text-white/90'}`}>
            <Briefcase className={`h-3 w-3 flex-shrink-0 ${darkMode ? 'text-cyan-300' : 'text-cyan-200'}`} />
            <span className="truncate flex-1">{dashboard?.firma || 'Firma Adı'}</span>
            <span className={`flex-shrink-0 ${darkMode ?  'text-white/30' : 'text-white/50'}`}>|</span>
            <Layers className={`h-3 w-3 flex-shrink-0 ${darkMode ? 'text-purple-300' : 'text-purple-200'}`} />
            <span className="truncate">{dashboard?.tesis || 'Tesis'}</span>
          </div>

          {/* İstatistik Kartları - Grid 3'lü */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* İzin Kartı */}
            <Link 
              href="/mobile-app/leaves"
              className={`group relative overflow-hidden rounded-xl p-2. 5 ${
                darkMode 
                  ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-white/10' 
                  :  'bg-white/20 hover:bg-white/30 border-white/30'
              } backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/10 group-hover: via-emerald-500/15 group-hover:to-emerald-500/10 transition-all duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className={`p-1 rounded-lg ${darkMode ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20' : 'bg-emerald-500/30'}`}>
                      <CalendarDays className={`h-3.5 w-3.5 ${darkMode ? 'text-emerald-300' : 'text-white'}`} />
                    </div>
                    <span className={`text-[10px] font-bold ${darkMode ? 'text-white' : 'text-white'}`}>İZİN</span>
                  </div>
                  <ChevronDown className={`h-3 w-3 ${darkMode ?  'text-white/50 group-hover:text-emerald-300' : 'text-white/70 group-hover:text-white'} transition-transform group-hover:rotate-180`} />
                </div>
                
                <div className="flex items-end justify-between mb-1">
                  <div className={`text-base font-black ${darkMode ? 'text-white' : 'text-white'}`}>
                    {izinKalan. toFixed(1)}
                    <span className={`text-[9px] font-semibold ml-0.5 ${darkMode ? 'text-white/60' : 'text-white/80'}`}>/ {izinToplam.toFixed(1)}g</span>
                  </div>
                  <div className={`px-1. 5 py-0.5 text-[9px] font-black rounded-full shadow-md ${izinColors.badge}`}>
                    {izinProgress.toFixed(0)}%
                  </div>
                </div>
                
                <div className={`h-1.5 w-full rounded-full overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-white/30'}`}>
                  <div 
                    className={`h-full bg-gradient-to-r ${izinColors.bar} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${izinProgress}%` }}
                  />
                </div>

                <div className={`mt-1 flex items-center justify-between text-[9px] ${darkMode ? 'text-white/75' : 'text-white/90'}`}>
                  <span>Kullanılan: {izinKullanilan.toFixed(1)}g</span>
                  <span className="font-semibold">Kalan: {izinKalan.toFixed(1)}g</span>
                </div>
              </div>
            </Link>

            {/* Vardiya Kartı */}
            <Link 
              href="/mobile-app/shifts"
              className={`group relative overflow-hidden rounded-xl p-2.5 ${
                darkMode 
                  ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-white/10' 
                  : 'bg-white/20 hover:bg-white/30 border-white/30'
              } backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-blue-500/15 group-hover:to-blue-500/10 transition-all duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className={`p-1 rounded-lg ${darkMode ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' : 'bg-blue-500/30'}`}>
                      <TimeIcon className={`h-3.5 w-3.5 ${darkMode ? 'text-blue-300' : 'text-white'}`} />
                    </div>
                    <span className={`text-[10px] font-bold ${darkMode ? 'text-white' : 'text-white'}`}>VARDİYA</span>
                  </div>
                  <TrendingUp className={`h-3 w-3 ${darkMode ? 'text-white/50 group-hover:text-blue-300' : 'text-white/70 group-hover:text-white'}`} />
                </div>
                
                <div className={`text-base font-black mb-1 truncate ${darkMode ? 'text-white' : 'text-white'}`}>
                  {humanizeShift(dashboard?.sonrakiMesai?. tarih)}
                </div>
                
                {dashboard?.sonrakiMesai ?  (
                  <div className={`text-[9px] flex items-center gap-1 ${darkMode ? 'text-white/70' : 'text-white/90'}`}>
                    <Clock className="h-2. 5 w-2.5" />
                    <span className="truncate">{dashboard. sonrakiMesai.gun} • {dashboard.sonrakiMesai.saat || '—'}</span>
                  </div>
                ) : (
                  <div className={`text-[9px] ${darkMode ? 'text-white/70' : 'text-white/90'}`}>Veri bekleniyor...</div>
                )}
              </div>
            </Link>

            {/* Maaş Kartı */}
            <div 
              className={`group relative overflow-hidden rounded-xl p-2.5 cursor-pointer ${
                darkMode 
                  ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-white/10' 
                  :  'bg-white/20 hover:bg-white/30 border-white/30'
              } backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
              onClick={() => setShowNetSalary(!showNetSalary)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/0 to-amber-500/0 group-hover:from-amber-500/10 group-hover:via-amber-500/15 group-hover:to-amber-500/10 transition-all duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className={`p-1 rounded-lg ${darkMode ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' : 'bg-amber-500/30'}`}>
                      <CreditCard className={`h-3.5 w-3.5 ${darkMode ? 'text-amber-300' : 'text-white'}`} />
                    </div>
                    <span className={`text-[10px] font-bold ${darkMode ? 'text-white' :  'text-white'}`}>NET MAAŞ</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowNetSalary(!showNetSalary)
                    }}
                    className="p-0.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {showNetSalary ? (
                      <EyeOff className={`h-3 w-3 ${darkMode ?  'text-white/80 hover:text-white' : 'text-white/90 hover:text-white'}`} />
                    ) : (
                      <Eye className={`h-3 w-3 ${darkMode ? 'text-white/80 hover:text-white' : 'text-white/90 hover:text-white'}`} />
                    )}
                  </button>
                </div>
                
                <div className={`text-base font-black mb-1 truncate ${darkMode ? 'text-white' : 'text-white'}`}>
                  {showNetSalary ? formatCurrency(dashboard?.maas?. net) : '••••••••'}
                </div>
                
                <div className={`text-[9px] flex items-center gap-1 ${darkMode ? 'text-white/70' : 'text-white/90'}`}>
                  <CalendarDays className="h-2.5 w-2.5" />
                  <span>{dashboard?.maas?.yil || '—'} / {dashboard?.maas?.ay || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
              darkMode 
                ? 'bg-red-500/20 border border-red-500/30' 
                : 'bg-red-500/30 border border-red-400/50'
            }`}>
              <AlertCircle className={`h-3 w-3 ${darkMode ? 'text-rose-300' : 'text-white'}`} />
              <span className={`text-[10px] truncate ${darkMode ? 'text-rose-200' : 'text-white'}`}>{error}</span>
            </div>
          )}
        </div>
        
        <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${darkMode ? 'via-purple-400/30' : 'via-white/30'} to-transparent`} />
      </nav>

      {/* Bottom Navigation - Gündüz modu iyileştirildi */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 pb-4 pt-3 ${
        darkMode 
          ? 'bg-gradient-to-t from-slate-900/95 via-slate-800/95 to-slate-900/95 border-white/10' 
          : 'bg-gradient-to-t from-white via-slate-50 to-white border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]'
      } backdrop-blur-xl border-t`}>
        <div className="px-4">
          <div className="flex justify-between items-center gap-2">
            {mobileNavItems.map((item, index) => {
              const isActive = pathname === item.path
              const isQr = item.path === '/mobile-app/QR'

              return (
                <Link
                  key={item.path}
                  href={item. path}
                  className="flex flex-col items-center relative group flex-1"
                  onClick={() => setActiveTab(index)}
                >
                  {isActive && (
                    <div className={`absolute -top-3 w-14 h-1. 5 rounded-t-lg bg-gradient-to-r ${
                      darkMode 
                        ? 'from-cyan-400 to-purple-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]' 
                        : 'from-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                    } animate-pulse`} />
                  )}

                  <div
                    className={`relative rounded-2xl transition-all duration-300 ${
                      isActive
                        ? `${item.activeColor} shadow-xl scale-110 ring-2 ${darkMode ? 'ring-white/30' : 'ring-indigo-300/50'}`
                        : darkMode
                          ? 'bg-white/10 hover:bg-white/20'
                          : 'bg-slate-100 hover:bg-indigo-100 hover:shadow-md'
                    } ${isQr 
                        ? `p-4 ring-2 scale-110 hover:scale-115 ${
                            darkMode 
                              ? 'shadow-[0_0_24px_rgba(16,185,129,0.6)] ring-emerald-400/80' 
                              : 'shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-emerald-400/60 bg-gradient-to-r from-emerald-500 to-green-500'
                          }` 
                        : 'p-3 hover:scale-105'
                    }`}
                  >
                    <item.icon className={`${isQr ? 'h-7 w-7' : 'h-6 w-6'} ${
                      isActive || isQr
                        ? 'text-white' 
                        : darkMode 
                          ? 'text-white/80' 
                          : 'text-slate-500 group-hover:text-indigo-600'
                    } transition-colors`} />
                  </div>

                  <span className={`mt-2 font-bold transition-all duration-300 ${
                    isQr 
                      ? `text-sm ${darkMode ? 'text-emerald-200 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]' : 'text-emerald-600'}` 
                      : 'text-xs'
                  } ${
                    isActive 
                      ? `text-transparent bg-clip-text bg-gradient-to-r ${darkMode ?  'from-cyan-400 to-purple-500' : 'from-indigo-600 to-purple-600'}` 
                      : darkMode 
                        ? 'text-white/70' 
                        : 'text-slate-500 group-hover:text-indigo-600'
                  }`}>
                    {item.name}
                  </span>

                  {! isActive && (
                    <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl ${
                      darkMode 
                        ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10' 
                        : 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10'
                    }`} />
                  )}
                </Link>
              )
            })}

            <button
              onClick={() => setIsMenuOpen(true)}
              className={`flex flex-col items-center relative group p-3 rounded-2xl transition-all duration-300 hover:scale-105 flex-1 max-w-[72px] ${
                darkMode
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30'
                  : 'bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 hover:shadow-md'
              }`}
            >
              <MoreVertical className={`h-6 w-6 transition-colors ${
                darkMode 
                  ? 'text-white group-hover:text-purple-300' 
                  : 'text-indigo-600 group-hover:text-purple-600'
              }`} />
              <span className={`mt-1. 5 text-xs font-black transition-colors ${
                darkMode 
                  ? 'text-white/70 group-hover:text-white' 
                  : 'text-indigo-600 group-hover:text-purple-600'
              }`}>
                DAHA FAZLA
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Side Menu */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => { setIsMenuOpen(false); setNotificationOpen(false); }}
          />

          <div
            className={`fixed right-0 top-0 bottom-0 z-50 w-4/5 max-w-sm animate-in slide-in-from-right duration-500 ${
              darkMode
                ? 'bg-gradient-to-b from-slate-900 via-purple-900/30 to-slate-900'
                : 'bg-gradient-to-b from-white via-indigo-50/50 to-slate-50'
            } shadow-2xl overflow-hidden`}
            style={{ boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className={`p-6 border-b ${darkMode ? 'border-white/10' : 'border-slate-200'} relative overflow-hidden`}>
              <div className={`absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-24 translate-x-24 ${
                darkMode 
                  ? 'bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10' 
                  : 'bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10'
              }`} />
              
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <div className={`h-11 w-11 rounded-2xl p-0.5 shadow-2xl ${
                      darkMode 
                        ? 'bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500' 
                        :  'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
                    }`}>
                      <div className={`h-full w-full rounded-2xl flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                        <span className={`text-lg font-black ${darkMode ? 'text-white' : 'text-indigo-600'}`}>
                          {dashboard?.display?.[0]?.toUpperCase() || 'P'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-black text-base truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {dashboard?.display || 'Personel'}
                    </p>
                    <p className={`text-[11px] truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {dashboard?.firma || 'Firma'}
                    </p>
                    <p className={`text-[10px] truncate ${darkMode ?  'text-slate-500' : 'text-slate-400'}`}>
                      {dashboard?.tesis || 'Tesis'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                    darkMode 
                      ?  'bg-white/10 hover:bg-white/20' 
                      :  'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <X className={`h-5 w-5 ${darkMode ? 'text-white' : 'text-slate-600'}`} />
                </button>
              </div>
            </div>

            {/* Menu Content */}
            <div className="overflow-y-auto h-[calc(100vh-220px)] py-4">
              <div className="px-6 space-y-4">
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Rocket className="h-3. 5 w-3.5 inline mr-2" />
                    TÜM ÖZELLİKLER
                  </h3>
                  <div className="space-y-1">
                    {[
                      { name: 'PDKS', icon: QrCode, path: '/mobile-app/attendance' },
                      { name: 'Vardiyalar', icon: TimeIcon, path: '/mobile-app/shifts' },
                      { name:  'Organizasyon', icon: Building, path:  '/mobile-app/organization' },
                      { name: 'Özlük Bilgileri', icon: User, path: '/mobile-app/profile' },
                      { name: 'Özlük Evraklarım', icon: FileText, path: '/mobile-app/documents' },
                      { name:  'Talep Oluştur', icon: FileText, path: '/mobile-app/requests/new' },
                      { name:  'Eğitim', icon: Award, path: '/mobile-app/trainings' },
                      { name: 'Anket', icon: PieChart, path: '/mobile-app/surveys' },
                      { name: 'Zimmet', icon:  Briefcase, path: '/mobile-app/assets' },
                      { name:  'Performans', icon: TrendingUpIcon, path: '/mobile-app/performance' },
                      { name: 'Mobil İmza', icon: ShieldCheck, path: '/mobile-app/e-signature' },
                      { name: 'Ayarlar', icon: Clock, path: '/mobile-app/settings' },
                    ]. map((item, index) => (
                      <Link
                        key={index}
                        href={item. path}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] group ${
                          darkMode 
                            ? 'hover:bg-white/10' 
                            : 'hover:bg-indigo-50 hover:shadow-sm'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg transition-colors shadow-sm ${
                            darkMode 
                              ? 'bg-white/10 group-hover:bg-white/20' 
                              : 'bg-slate-100 group-hover:bg-indigo-100'
                          }`}>
                            <item.icon className={`h-4 w-4 ${
                              darkMode 
                                ?  'text-white' 
                                : 'text-slate-600 group-hover:text-indigo-600'
                            }`} />
                          </div>
                          <span className={`font-semibold text-sm ${
                            darkMode 
                              ? 'text-white' 
                              :  'text-slate-700 group-hover:text-indigo-700'
                          }`}>
                            {item.name}
                          </span>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-colors ${
                          darkMode 
                            ? 'text-slate-400 group-hover:text-white' 
                            : 'text-slate-400 group-hover:text-indigo-600'
                        }`} />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Footer */}
            <div className={`absolute bottom-0 left-0 right-0 p-6 border-t backdrop-blur-xl ${
              darkMode 
                ? 'border-white/10 bg-slate-900/95' 
                : 'border-slate-200 bg-white/95'
            }`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-xl"
                >
                  <LogOut className="h-4 w-4" />
                  ÇIKIŞ
                </button>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className={`py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
                    darkMode 
                      ? 'bg-white/10 hover:bg-white/20 text-white' 
                      :  'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  KAPAT
                </button>
              </div>
              <div className="mt-3 text-center">
                <div className={`flex items-center justify-center gap-2 text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  <Star className="h-3 w-3 text-amber-400" />
                  <span>HR<span className={`font-bold ${darkMode ? 'text-cyan-400' : 'text-indigo-500'}`}>Tomorrow</span> v3.0.16</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="h-32" />
    </>
  )
}