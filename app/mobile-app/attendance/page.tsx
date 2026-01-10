// app/mobile-app/attendance/page.tsx - PDKS Takip Sayfası
"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import {
  QrCode, Clock, Calendar, MapPin, CheckCircle, XCircle,
  TrendingUp, Activity, Target, Award, Zap, Shield,
  ArrowUpRight, ArrowDownRight, ChevronRight, ChevronLeft,
  Filter, Download, RefreshCw, AlertCircle, Check,
  ExternalLink, Navigation, Compass, Clock as TimeIcon,
  Building, DoorOpen, DoorClosed, Smartphone, Wifi,
  Battery, Signal, User, Home, Briefcase,
  Pin, Locate, Map, Globe, Satellite,
  History, BarChart, PieChart, LineChart,
  CalendarDays, Clock4, Clock8, Clock12,
  Sun, Moon, Sunrise, Sunset,
  Bell, BellRing, BellOff,
  MoreVertical, Settings, Eye, EyeOff,
  RotateCcw, RotateCw, Maximize2,
  Minimize2, ZoomIn, ZoomOut,
  ChevronUp, ChevronDown,
  Star, Crown, Trophy, Medal,
  Sparkles, Rocket, Flash,
  Layers, Grid, List, Columns,
  SortAsc, SortDesc, Calendar as CalendarIcon,
  DownloadCloud, UploadCloud,
  Printer, Share2, Copy,
  MessageSquare, HelpCircle,
  Lock, Unlock, Key,
  BatteryCharging, Power,
  WifiOff, CloudOff,
  Database, Server, HardDrive,
  Cpu, MemoryStick,
  Network, Bluetooth,
  Smartphone as PhoneIcon,
  TabletSmartphone,
  Watch, MonitorSmartphone,
  ScanLine,
  Fingerprint, Eye as EyeIcon,
  ShieldCheck, ShieldAlert,
  BellDot, CheckSquare,
  XSquare, Clock3,
  Clock9, Clock6,
  Clock1, Clock2,
  Clock10, Clock11,
  Clock5, Clock7
} from 'lucide-react'

interface PDKSRecord {
  time: string
  type: string
  description: string
  location: {
    lat: string
    lng: string
  }
}

interface TimelineDay {
  date: string
  records: PDKSRecord[]
}

interface PDKSResponse {
  success: boolean
  persid: string
  totalRecord: number
  last7Days: number
  timeline: TimelineDay[]
}

interface StatsType {
  totalRecords: number
  averagePerDay: number
  earliestEntry: string
  latestExit: string
  mostActiveDay: string
}

export default function PDKSPage() {
  const { user } = useAuth()
  const [darkMode, setDarkMode] = useState(true)
  const [data, setData] = useState<PDKSResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<StatsType | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')
  const [showLocation, setShowLocation] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Dark mode kontrolü
  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    const isDark = stored === 'true' || (stored === null && true)
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // PDKS verilerini çek
  const fetchPDKSData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const dbName = (user as any)?.dbName || 'HOMINUM'
      const persid = (user as any)?.persid
      
      if (!persid) {
        throw new Error('Kullanıcı bilgisi bulunamadı')
      }

      const res = await fetch(`/api/mobil-user/pdks-history?dbName=${encodeURIComponent(dbName)}`, {
        method: 'POST',
        headers: {
          'x-db-name': dbName,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ persid }),
        cache: 'no-store',
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Veri alınamadı')
      }

      const json = await res.json() as PDKSResponse
      
      if (!json.success) {
        throw new Error('PDKS verisi alınamadı')
      }

      setData(json)
      calculateStats(json)
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      console.error('PDKS fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  // İlk yükleme
  useEffect(() => {
    fetchPDKSData()
  }, [fetchPDKSData])

  // İstatistikleri hesapla
  const calculateStats = (pdksData: PDKSResponse) => {
    if (!pdksData.timeline || pdksData.timeline.length === 0) return

    let totalRecords = 0
    let earliestTime = '23:59:59'
    let latestTime = '00:00:00'
    let dayCounts: Record<string, number> = {}
    let mostActiveDay = ''
    let maxCount = 0

    pdksData.timeline.forEach(day => {
      const entryCount = day.records.length
      totalRecords += entryCount
      dayCounts[day.date] = entryCount

      if (entryCount > maxCount) {
        maxCount = entryCount
        mostActiveDay = day.date
      }

      day.records.forEach(record => {
        if (record.time < earliestTime) {
          earliestTime = record.time
        }
        if (record.time > latestTime) {
          latestTime = record.time
        }
      })
    })

    const averagePerDay = pdksData.last7Days > 0 ? totalRecords / pdksData.last7Days : 0

    setStats({
      totalRecords,
      averagePerDay: parseFloat(averagePerDay.toFixed(1)),
      earliestEntry: earliestTime,
      latestExit: latestTime,
      mostActiveDay
    })
  }

  // Tarihi formatla
  const formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('.')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Bugün'
    if (diffDays === 1) return 'Dün'
    if (diffDays <= 7) return `${diffDays} gün önce`
    
    return date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' })
  }

  // Saati formatla
  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5) // HH:MM formatına çevir
  }

  // Tür simgesi
  const getTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'GİRİŞ':
      case 'IN':
      case 'ENTER':
        return { icon: DoorOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/20' }
      case 'ÇIKIŞ':
      case 'OUT':
      case 'EXIT':
        return { icon: DoorClosed, color: 'text-rose-400', bg: 'bg-rose-500/20' }
      default:
        return { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/20' }
    }
  }

  // Tür badge rengi
  const getTypeBadgeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'GİRİŞ':
      case 'IN':
      case 'ENTER':
        return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 text-emerald-200'
      case 'ÇIKIŞ':
      case 'OUT':
      case 'EXIT':
        return 'bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30 text-rose-200'
      default:
        return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-200'
    }
  }

  // Yenileme fonksiyonu
  const handleRefresh = () => {
    setRefreshing(true)
    fetchPDKSData()
  }

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center ${
        darkMode ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        <div className="text-center">
          <div className="relative">
            <div className={`h-24 w-24 rounded-2xl ${
              darkMode ? 'bg-white/10' : 'bg-slate-100'
            } backdrop-blur-sm flex items-center justify-center mx-auto mb-6 animate-pulse`}>
              <QrCode className="h-12 w-12 text-cyan-400" />
            </div>
            <div className="space-y-3">
              <div className="text-white text-xl font-bold animate-pulse">
                PDKS Kayıtları Yükleniyor
              </div>
              <div className="text-slate-400 text-sm">
                Son 7 günlük verileriniz getiriliyor...
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen w-full overflow-hidden transition-all duration-500 ${
      darkMode 
        ? 'bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950' 
        : 'bg-gradient-to-b from-slate-50 via-blue-50/20 to-slate-50'
    }`}>
      
      {/* Ana İçerik - ÜSTTE BOŞLUK EKLENDİ */}
      <div className="pt-2 pb-24">
        {/* İstatistik Kartları */}
        {stats && (
          <div className="px-5 py-6">
            <div className="grid grid-cols-2 gap-3">
              {/* Toplam Kayıt */}
              <div className={`rounded-2xl p-4 ${
                darkMode ? 'bg-slate-800/60' : 'bg-white/80'
              } border ${
                darkMode ? 'border-white/10' : 'border-slate-200'
              } backdrop-blur-sm`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <Activity className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    TOPLAM KAYIT
                  </span>
                </div>
                <div className="text-2xl font-black text-white mb-1">
                  {stats.totalRecords || 0}
                </div>
                <div className="text-xs text-slate-400">
                  Son 7 günde
                </div>
              </div>

              {/* Günlük Ortalama */}
              <div className={`rounded-2xl p-4 ${
                darkMode ? 'bg-slate-800/60' : 'bg-white/80'
              } border ${
                darkMode ? 'border-white/10' : 'border-slate-200'
              } backdrop-blur-sm`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    GÜNLÜK ORTALAMA
                  </span>
                </div>
                <div className="text-2xl font-black text-white mb-1">
                  {stats.averagePerDay?.toFixed(1) || '0.0'}
                </div>
                <div className="text-xs text-slate-400">
                  Kayıt/gün
                </div>
              </div>

              {/* En Erken Giriş */}
              <div className={`rounded-2xl p-4 ${
                darkMode ? 'bg-slate-800/60' : 'bg-white/80'
              } border ${
                darkMode ? 'border-white/10' : 'border-slate-200'
              } backdrop-blur-sm`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                    <Sunrise className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    EN ERKEN GİRİŞ
                  </span>
                </div>
                <div className="text-2xl font-black text-white mb-1">
                  {stats.earliestEntry ? formatTime(stats.earliestEntry) : '--:--'}
                </div>
                <div className="text-xs text-slate-400">
                  Son 7 günde
                </div>
              </div>

              {/* En Geç Çıkış */}
              <div className={`rounded-2xl p-4 ${
                darkMode ? 'bg-slate-800/60' : 'bg-white/80'
              } border ${
                darkMode ? 'border-white/10' : 'border-slate-200'
              } backdrop-blur-sm`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                    <Sunset className="h-4 w-4 text-violet-400" />
                  </div>
                  <span className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    EN GEÇ ÇIKIŞ
                  </span>
                </div>
                <div className="text-2xl font-black text-white mb-1">
                  {stats.latestExit ? formatTime(stats.latestExit) : '--:--'}
                </div>
                <div className="text-xs text-slate-400">
                  Son 7 günde
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hata Mesajı */}
        {error && (
          <div className="px-5 mb-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 rounded-2xl p-4">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">Veri yüklenemedi</div>
                <div className="text-xs text-slate-300 mt-1">{error}</div>
              </div>
              <button
                onClick={fetchPDKSData}
                className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        )}

        {/* PDKS Kayıtları */}
        <div className="px-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Son 7 Günlük Kayıtlar
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list' 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : darkMode ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded-lg ${
                  viewMode === 'timeline' 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : darkMode ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Columns className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Timeline View */}
          {viewMode === 'timeline' ? (
            <div className="space-y-6">
              {data?.timeline?.map((day, dayIndex) => (
                <div key={day.date} className="relative">
                  {/* Tarih Başlığı */}
                  <div className={`sticky top-20 z-30 flex items-center gap-3 mb-4 py-2 ${
                    darkMode ? 'bg-slate-900/95' : 'bg-white/95'
                  } backdrop-blur-sm`}>
                    <div className="flex-1">
                      <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {formatDate(day.date)}
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {day.date} • {day.records.length} kayıt
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      dayIndex === 0 
                        ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-500/30'
                        : darkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {day.records.length} KAYIT
                    </div>
                  </div>

                  {/* Kayıtlar */}
                  <div className="space-y-3">
                    {day.records.map((record, recordIndex) => {
                      const { icon: TypeIcon, color, bg } = getTypeIcon(record.type)
                      const isLast = recordIndex === day.records.length - 1
                      
                      return (
                        <div
                          key={`${day.date}-${recordIndex}`}
                          className={`relative flex items-start gap-4 pl-4 ${
                            !isLast ? 'pb-4' : ''
                          }`}
                        >
                          {/* Timeline Çizgisi */}
                          {!isLast && (
                            <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/30 via-purple-500/30 to-transparent" />
                          )}

                          {/* Nokta */}
                          <div className="relative z-10">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              record.type?.toUpperCase() === 'GİRİŞ' || record.type?.toUpperCase() === 'IN'
                                ? 'border-emerald-500 bg-emerald-500/20'
                                : record.type?.toUpperCase() === 'ÇIKIŞ' || record.type?.toUpperCase() === 'OUT'
                                ? 'border-rose-500 bg-rose-500/20'
                                : 'border-amber-500 bg-amber-500/20'
                            }`}>
                              <div className="w-2 h-2 rounded-full bg-current absolute inset-1" />
                            </div>
                          </div>

                          {/* Kart İçeriği */}
                          <div className={`flex-1 rounded-xl p-4 ${
                            darkMode ? 'bg-slate-800/60' : 'bg-white/80'
                          } border ${
                            darkMode ? 'border-white/10' : 'border-slate-200'
                          } backdrop-blur-sm transition-all hover:scale-[1.02]`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${bg}`}>
                                  <TypeIcon className={`h-4 w-4 ${color}`} />
                                </div>
                                <div>
                                  <div className={`text-sm font-bold capitalize ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {record.type?.toLowerCase() || 'Bilinmeyen'}
                                  </div>
                                  <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {formatTime(record.time)}
                                  </div>
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                getTypeBadgeColor(record.type)
                              }`}>
                                {record.type || 'BİLİNMİYOR'}
                              </div>
                            </div>

                            {/* Açıklama ve Lokasyon */}
                            <div className="space-y-2">
                              {record.description && record.description !== 'Bilinmiyor' && (
                                <div className="flex items-start gap-2">
                                  <DoorOpen className="h-3.5 w-3.5 text-slate-500 mt-0.5" />
                                  <div className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {record.description}
                                  </div>
                                </div>
                              )}

                              {showLocation && record.location && record.location.lat !== 'Bilinmiyor' && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                                  <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Konum: {record.location.lat}, {record.location.lng}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              {data?.timeline?.map((day) => (
                <div key={day.date} className="space-y-3">
                  {/* Tarih Ayracı */}
                  <div className={`sticky top-20 z-30 py-3 ${
                    darkMode ? 'bg-slate-900/95' : 'bg-white/95'
                  } backdrop-blur-sm`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {formatDate(day.date)}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {day.date}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        darkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {day.records.length} kayıt
                      </div>
                    </div>
                  </div>

                  {/* Günlük Kayıtlar */}
                  {day.records.map((record, index) => {
                    const { icon: TypeIcon, color, bg } = getTypeIcon(record.type)
                    
                    return (
                      <div
                        key={`${day.date}-${index}`}
                        className={`rounded-xl p-4 ${
                          darkMode ? 'bg-slate-800/60' : 'bg-white/80'
                        } border ${
                          darkMode ? 'border-white/10' : 'border-slate-200'
                        } backdrop-blur-sm transition-all hover:scale-[1.01]`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${bg}`}>
                              <TypeIcon className={`h-5 w-5 ${color}`} />
                            </div>
                            <div>
                              <div className={`text-base font-bold capitalize ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {record.type?.toLowerCase() || 'Bilinmeyen'}
                              </div>
                              <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {formatTime(record.time)}
                              </div>
                            </div>
                          </div>
                          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            getTypeBadgeColor(record.type)
                          }`}>
                            {record.type || 'BİLİNMİYOR'}
                          </div>
                        </div>

                        {/* Detaylar */}
                        <div className="space-y-2">
                          {record.description && record.description !== 'Bilinmiyor' && (
                            <div className="flex items-start gap-2">
                              <DoorOpen className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                              <div className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                {record.description}
                              </div>
                            </div>
                          )}

                          {showLocation && record.location && record.location.lat !== 'Bilinmiyor' && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                              <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Konum: {record.location.lat}, {record.location.lng}
                              </div>
                              <button
                                onClick={() => window.open(`https://maps.google.com/?q=${record.location.lat},${record.location.lng}`, '_blank')}
                                className="ml-auto p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Boş State */}
        {(!data?.timeline || data.timeline.length === 0) && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-16 px-5">
            <div className={`w-24 h-24 rounded-2xl ${
              darkMode ? 'bg-white/10' : 'bg-slate-100'
            } flex items-center justify-center mb-6`}>
              <QrCode className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              PDKS Kaydı Bulunamadı
            </h3>
            <p className={`text-center text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Son 7 gün içinde herhangi bir PDKS kaydınız bulunmuyor.
              İlk giriş/çıkışınızı yaptıktan sonra burada görünecektir.
            </p>
            <button
              onClick={fetchPDKSData}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:scale-105 transition-all active:scale-95"
            >
              <RefreshCw className="h-4 w-4 inline mr-2" />
              Verileri Yenile
            </button>
          </div>
        )}
      </div>
    </div>
  )
}