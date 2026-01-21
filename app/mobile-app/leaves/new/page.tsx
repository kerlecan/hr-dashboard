"use client"

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Calendar, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plane, 
  Heart, 
  Baby, 
  Home, 
  Briefcase,
  ChevronRight,
  X,
  Trash2,
  Edit2,
  TrendingUp,
  CalendarDays,
  UserCheck,
  Zap,
  Moon,
  Sun
} from 'lucide-react'
import { format, parseISO, addDays, isToday, isPast, isFuture, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { tr } from 'date-fns/locale'

type LeaveType = {
  id: number
  name: string
  code: string
  icon: any
  color: string
  gradient: string
  maxDays: number
  requiresApproval: boolean
}

type LeaveRequest = {
  id: number
  type: string
  startDate: string
  endDate: string
  totalDays: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reason?: string
  createdAt: string
  approvedBy?: string
}

export default function LeavePage() {
  const { user } = useAuth()
  const [darkMode, setDarkMode] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null)
  const [selectedStartDate, setSelectedStartDate] = useState<string>('')
  const [selectedEndDate, setSelectedEndDate] = useState<string>('')
  const [leaveReason, setLeaveReason] = useState('')
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [leaveBalance, setLeaveBalance] = useState({
    annual: 14,
    used: 5,
    remaining: 9,
    sick: 10,
    emergency: 3
  })

  // İzin türleri
  const leaveTypes: LeaveType[] = [
    {
      id: 1,
      name: 'Yıllık İzin',
      code: 'ANNUAL',
      icon: Plane,
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500',
      maxDays: 14,
      requiresApproval: true
    },
    {
      id: 2,
      name: 'Sağlık İzni',
      code: 'SICK',
      icon: Heart,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-500',
      maxDays: 10,
      requiresApproval: false
    },
    {
      id: 3,
      name: 'Doğum İzni',
      code: 'MATERNITY',
      icon: Baby,
      color: 'pink',
      gradient: 'from-pink-500 to-rose-500',
      maxDays: 112,
      requiresApproval: true
    },
    {
      id: 4,
      name: 'Evlilik İzni',
      code: 'MARRIAGE',
      icon: Home,
      color: 'purple',
      gradient: 'from-purple-500 to-violet-500',
      maxDays: 3,
      requiresApproval: true
    },
    {
      id: 5,
      name: 'Resmi İzin',
      code: 'OFFICIAL',
      icon: Briefcase,
      color: 'amber',
      gradient: 'from-amber-500 to-orange-500',
      maxDays: 5,
      requiresApproval: true
    }
  ]

  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    const isDark = stored === 'true' || (stored === null && true)
    setDarkMode(isDark)
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

  useEffect(() => {
    // Simüle edilmiş izin talepleri
    setLeaveRequests([
      {
        id: 1,
        type: 'Yıllık İzin',
        startDate: '2024-05-15',
        endDate: '2024-05-18',
        totalDays: 4,
        status: 'approved',
        reason: 'Tatil',
        createdAt: '2024-05-10',
        approvedBy: 'Ahmet Yılmaz'
      },
      {
        id: 2,
        type: 'Sağlık İzni',
        startDate: '2024-05-20',
        endDate: '2024-05-21',
        totalDays: 2,
        status: 'approved',
        reason: 'Grip',
        createdAt: '2024-05-19'
      },
      {
        id: 3,
        type: 'Yıllık İzin',
        startDate: '2024-06-01',
        endDate: '2024-06-03',
        totalDays: 3,
        status: 'pending',
        reason: 'Aile ziyareti',
        createdAt: '2024-05-25'
      },
      {
        id: 4,
        type: 'Evlilik İzni',
        startDate: '2024-04-10',
        endDate: '2024-04-12',
        totalDays: 3,
        status: 'approved',
        reason: 'Düğün',
        createdAt: '2024-04-01',
        approvedBy: 'Mehmet Demir'
      }
    ])
    setLoading(false)
  }, [])

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const calculateTotalDays = () => {
    if (!selectedStartDate || !selectedEndDate) return 0
    const start = parseISO(selectedStartDate)
    const end = parseISO(selectedEndDate)
    const diff = differenceInDays(end, start) + 1
    return diff > 0 ? diff : 0
  }

  const handleCreateRequest = () => {
    if (!selectedLeaveType || !selectedStartDate || !selectedEndDate) {
      setError('Lütfen tüm alanları doldurun')
      return
    }

    const totalDays = calculateTotalDays()
    if (totalDays > selectedLeaveType.maxDays) {
      setError(`Bu izin türü için maksimum ${selectedLeaveType.maxDays} gün kullanabilirsiniz`)
      return
    }

    const newRequest: LeaveRequest = {
      id: leaveRequests.length + 1,
      type: selectedLeaveType.name,
      startDate: selectedStartDate,
      endDate: selectedEndDate,
      totalDays,
      status: selectedLeaveType.requiresApproval ? 'pending' : 'approved',
      reason: leaveReason,
      createdAt: new Date().toISOString().split('T')[0]
    }

    setLeaveRequests([newRequest, ...leaveRequests])
    
    // Bakiye güncellemesi
    if (selectedLeaveType.code === 'ANNUAL') {
      setLeaveBalance(prev => ({
        ...prev,
        used: prev.used + totalDays,
        remaining: prev.remaining - totalDays
      }))
    }

    // Modal'ı kapat ve formu temizle
    setShowRequestModal(false)
    setSelectedLeaveType(null)
    setSelectedStartDate('')
    setSelectedEndDate('')
    setLeaveReason('')
    setError(null)
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved':
        return darkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'pending':
        return darkMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-700 border-amber-200'
      case 'rejected':
        return darkMode ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-100 text-rose-700 border-rose-200'
      default:
        return darkMode ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' : 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved':
        return CheckCircle
      case 'pending':
        return Clock
      case 'rejected':
      case 'cancelled':
        return AlertCircle
      default:
        return Clock
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100'}`}>
        <div className="text-center">
          <div className={`inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 ${darkMode ? 'border-cyan-500' : 'border-blue-600'}`} />
          <p className={`mt-4 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>İzin bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pb-32 ${darkMode ? 'bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900' : 'bg-gradient-to-b from-slate-50 via-blue-50 to-slate-100'}`}>
      {/* Başlık ve İstatistik */}
      <div className="px-4 py-3">
        <div className={`rounded-2xl ${darkMode ? 'bg-slate-800/60' : 'bg-white/80'} backdrop-blur-md border ${darkMode ? 'border-white/10' : 'border-slate-200'} p-4`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                İzin Yönetimi
              </h1>
              <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                İzin taleplerinizi buradan yönetin
              </p>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all active:scale-95"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* İzin Bakiyesi */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className={`rounded-xl p-3 ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'} backdrop-blur-sm`}>
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className={`h-4 w-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-xs ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>Kalan İzin</span>
              </div>
              <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {leaveBalance.remaining} <span className="text-sm">gün</span>
              </div>
            </div>
            
            <div className={`rounded-xl p-3 ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'} backdrop-blur-sm`}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className={`h-4 w-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span className={`text-xs ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>Kullanılan</span>
              </div>
              <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {leaveBalance.used} <span className="text-sm">gün</span>
              </div>
            </div>
            
            <div className={`rounded-xl p-3 ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'} backdrop-blur-sm`}>
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className={`h-4 w-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`text-xs ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>Toplam</span>
              </div>
              <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {leaveBalance.annual} <span className="text-sm">gün</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* İzin Türleri */}
      <div className="px-4 py-2">
        <h2 className={`text-sm font-bold mb-3 ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>
          İzin Türleri
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {leaveTypes.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedLeaveType(type)
                  setShowRequestModal(true)
                }}
                className={`rounded-xl p-3 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${darkMode ? 'bg-slate-800/60 hover:bg-slate-800/80' : 'bg-white hover:bg-slate-50'} border ${darkMode ? 'border-white/10' : 'border-slate-200'}`}
              >
                <div className={`h-12 w-12 rounded-full bg-gradient-to-r ${type.gradient} flex items-center justify-center mb-2`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className={`text-xs font-bold text-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {type.name}
                </span>
                <span className={`text-[10px] mt-1 ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>
                  {type.maxDays} gün
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* İzin Talepleri Listesi */}
      <div className="px-4 py-2 mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-sm font-bold ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>
            İzin Taleplerim
          </h2>
          <span className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
            {leaveRequests.length} kayıt
          </span>
        </div>

        <div className="space-y-3">
          {leaveRequests.map((request) => {
            const StatusIcon = getStatusIcon(request.status)
            return (
              <div
                key={request.id}
                className={`rounded-xl p-4 ${darkMode ? 'bg-slate-800/60' : 'bg-white/80'} backdrop-blur-md border ${darkMode ? 'border-white/10' : 'border-slate-200'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(request.status)}`}>
                        <StatusIcon className="h-3 w-3" />
                        {request.status === 'approved' ? 'Onaylandı' : 
                         request.status === 'pending' ? 'Beklemede' : 
                         request.status === 'rejected' ? 'Reddedildi' : 'İptal Edildi'}
                      </div>
                    </div>
                    <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {request.type}
                    </h3>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                      {format(parseISO(request.startDate), 'd MMM', { locale: tr })} - {format(parseISO(request.endDate), 'd MMM yyyy', { locale: tr })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {request.totalDays} <span className="text-sm">gün</span>
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                      toplam
                    </div>
                  </div>
                </div>
                
                {request.reason && (
                  <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                    <p className={`text-sm ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>
                      {request.reason}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3">
                  <div className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                    {format(parseISO(request.createdAt), 'd MMM yyyy', { locale: tr })}
                  </div>
                  <div className="flex gap-2">
                    <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
                      <Edit2 className={`h-4 w-4 ${darkMode ? 'text-white/60' : 'text-slate-500'}`} />
                    </button>
                    <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-rose-500/20' : 'hover:bg-rose-100'}`}>
                      <Trash2 className={`h-4 w-4 ${darkMode ? 'text-rose-400' : 'text-rose-500'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Takvim Önizleme */}
      <div className="px-4 py-2 mt-2">
        <div className={`rounded-xl p-4 ${darkMode ? 'bg-slate-800/60' : 'bg-white/80'} backdrop-blur-md border ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-sm font-bold ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>
              Bu Ayın Takvimi
            </h2>
            <span className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
              {format(currentMonth, 'MMMM yyyy', { locale: tr })}
            </span>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((day, index) => (
              <div key={index} className={`text-center text-xs font-bold py-1 ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                {day}
              </div>
            ))}
            
            {monthDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const isLeaveDay = leaveRequests.some(req => 
                req.status === 'approved' && 
                dateStr >= req.startDate && 
                dateStr <= req.endDate
              )
              const isToday = new Date().toDateString() === day.toDateString()
              
              return (
                <div
                  key={dateStr}
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm mx-auto ${
                    isToday 
                      ? darkMode 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                        : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white'
                      : isLeaveDay
                        ? darkMode
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400'
                          : 'bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200 text-emerald-700'
                        : darkMode
                          ? 'text-white/80'
                          : 'text-slate-700'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* İzin Talebi Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowRequestModal(false)} />
          
          <div className={`relative w-full max-w-md rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'} p-4 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Yeni İzin Talebi
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
              >
                <X className={`h-5 w-5 ${darkMode ? 'text-white' : 'text-slate-700'}`} />
              </button>
            </div>

            {error && (
              <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${
                darkMode ? 'bg-rose-500/20 border border-rose-500/30' : 'bg-rose-100 border border-rose-200'
              }`}>
                <AlertCircle className={`h-5 w-5 ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} />
                <p className={`text-sm ${darkMode ? 'text-rose-300' : 'text-rose-700'}`}>{error}</p>
              </div>
            )}

            {/* İzin Türü Seçimi */}
            {!selectedLeaveType ? (
              <div className="space-y-3">
                <h4 className={`text-sm font-bold ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>
                  İzin Türü Seçin
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {leaveTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedLeaveType(type)}
                        className={`p-3 rounded-xl text-left transition-all duration-300 hover:scale-105 ${
                          darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full bg-gradient-to-r ${type.gradient} flex items-center justify-center`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {type.name}
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>
                              Maks: {type.maxDays} gün
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* Seçili İzin Türü */}
                <div className={`mb-4 p-3 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-r ${selectedLeaveType.gradient} flex items-center justify-center`}>
                        <selectedLeaveType.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {selectedLeaveType.name}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>
                          Maksimum {selectedLeaveType.maxDays} gün
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedLeaveType(null)}
                      className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-slate-200'}`}
                    >
                      <X className={`h-4 w-4 ${darkMode ? 'text-white/60' : 'text-slate-500'}`} />
                    </button>
                  </div>
                </div>

                {/* Tarih Seçimi */}
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      value={selectedStartDate}
                      onChange={(e) => {
                        setSelectedStartDate(e.target.value)
                        if (e.target.value > selectedEndDate) {
                          setSelectedEndDate(e.target.value)
                        }
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={selectedEndDate}
                      onChange={(e) => setSelectedEndDate(e.target.value)}
                      min={selectedStartDate || new Date().toISOString().split('T')[0]}
                      className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                    />
                  </div>

                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className={`text-xs ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>Toplam Gün</div>
                        <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {calculateTotalDays()} <span className="text-sm">gün</span>
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>Kalan Gün</div>
                        <div className={`text-lg font-black ${
                          selectedLeaveType.code === 'ANNUAL' && leaveBalance.remaining - calculateTotalDays() < 0
                            ? darkMode ? 'text-rose-400' : 'text-rose-600'
                            : darkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                          {selectedLeaveType.code === 'ANNUAL' 
                            ? leaveBalance.remaining - calculateTotalDays()
                            : selectedLeaveType.maxDays - calculateTotalDays()
                          } <span className="text-sm">gün</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>
                      Açıklama (İsteğe Bağlı)
                    </label>
                    <textarea
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      rows={3}
                      placeholder="İzin sebebinizi kısaca açıklayın..."
                      className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-white/10 text-white placeholder:text-white/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedLeaveType(null)
                        setSelectedStartDate('')
                        setSelectedEndDate('')
                        setLeaveReason('')
                        setError(null)
                      }}
                      className="flex-1 py-3 rounded-xl font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all active:scale-95"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleCreateRequest}
                      disabled={!selectedStartDate || !selectedEndDate}
                      className={`flex-1 py-3 rounded-xl font-bold text-white transition-all active:scale-95 ${
                        !selectedStartDate || !selectedEndDate
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40'
                      }`}
                    >
                      Talep Oluştur
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}