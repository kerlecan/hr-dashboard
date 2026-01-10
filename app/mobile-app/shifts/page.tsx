"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ChevronRight, Calendar, Clock, Sun, Moon, Coffee, Zap, AlertCircle, TrendingUp, Users, Target, BarChart } from 'lucide-react'
import { format, parseISO, isToday, isPast, startOfWeek, endOfWeek, eachDayOfInterval, getWeek } from 'date-fns'
import { tr } from 'date-fns/locale'

type ShiftSegment = {
  order: number
  start: string
  end: string
  type: 'Çalışma' | 'Mola' | 'Diğer'
  duration: number
}

type ShiftDay = {
  date: string
  dayName: string
  shiftCode: string | null
  totalWorkHour: number
  segments: ShiftSegment[]
}

type WeeklyShiftResponse = {
  success: boolean
  persid: string
  week: {
    totalDay: number
    totalWorkHour: number
  }
  days: ShiftDay[]
}

export default function ShiftsPage() {
  const { user } = useAuth()
  const [weeklyData, setWeeklyData] = useState<WeeklyShiftResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [darkMode, setDarkMode] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    const isDark = stored === 'true' || (stored === null && true)
    setDarkMode(isDark)
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 })
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentWeek])

  const fetchWeeklyShifts = useCallback(async (weekDate: Date = currentWeek) => {
    setLoading(true)
    setError(null)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)

    try {
      const dbName = (user as any)?.dbName || 'HOMINUM'
      const persid = (user as any)?.persid

      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 })

      const body = {
        persid,
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd')
      }

      const res = await fetch(`/api/mobil-user/weekly-shift?dbName=${encodeURIComponent(dbName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-db-name': dbName,
        },
        body: JSON.stringify({ persid }),
        cache: 'no-store',
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error('Vardiya verileri alınamadı')
      }

      const data: WeeklyShiftResponse = await res.json()
      setWeeklyData(data)

      const today = new Date().toISOString().split('T')[0]
      setSelectedDay(today)
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.name === 'AbortError' ? 'Bağlantı zaman aşımı' : 'Vardiya verileri yüklenemedi')
    } finally {
      clearTimeout(timer)
      setLoading(false)
      setRefreshing(false)
    }
  }, [user, currentWeek])

  useEffect(() => {
    if (user) {
      fetchWeeklyShifts()
    }
  }, [user, fetchWeeklyShifts])

  const handlePrevWeek = () => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(newWeek.getDate() - 7)
    setCurrentWeek(newWeek)
    fetchWeeklyShifts(newWeek)
  }

  const handleNextWeek = () => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(newWeek.getDate() + 7)
    setCurrentWeek(newWeek)
    fetchWeeklyShifts(newWeek)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchWeeklyShifts()
  }

  const selectedDayData = useMemo(() => {
    if (!selectedDay || !weeklyData) return null
    return weeklyData.days.find(day => day.date === selectedDay)
  }, [selectedDay, weeklyData])

  const stats = useMemo(() => {
    if (!weeklyData) return null

    const totalDays = weeklyData.days.length
    const workingDays = weeklyData.days.filter(day => day.totalWorkHour > 0).length
    const totalHours = weeklyData.days.reduce((sum, day) => sum + day.totalWorkHour, 0)
    const avgHoursPerDay = workingDays > 0 ? totalHours / workingDays : 0

    const today = new Date().toISOString().split('T')[0]
    const todayData = weeklyData.days.find(day => day.date === today)
    const todayStatus = todayData ? (todayData.totalWorkHour > 0 ? 'Çalışma' : 'Dinlenme') : 'Bilinmiyor'

    return {
      totalDays,
      workingDays,
      totalHours,
      avgHoursPerDay,
      todayStatus
    }
  }, [weeklyData])

  const weekNumber = useMemo(() => {
    return getWeek(currentWeek, { weekStartsOn: 1, locale: tr })
  }, [currentWeek])

  const getSegmentColor = (type: string) => {
    switch(type) {
      case 'Çalışma':
        return darkMode 
          ? 'from-blue-500 to-cyan-500' 
          : 'from-blue-600 to-cyan-600'
      case 'Mola':
        return darkMode 
          ? 'from-emerald-500 to-green-500' 
          : 'from-emerald-600 to-green-600'
      default:
        return darkMode 
          ? 'from-purple-500 to-pink-500' 
          : 'from-purple-600 to-pink-600'
    }
  }

  const getDayStatusColor = (day: ShiftDay) => {
    if (day.totalWorkHour > 0) {
      return darkMode 
        ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30'
        : 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-200'
    }
    return darkMode 
      ? 'bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-white/10'
      : 'bg-gradient-to-r from-slate-100 to-slate-200 border-slate-300'
  }

  if (loading && !refreshing) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100'}`}>
        <div className="text-center">
          <div className={`inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 ${darkMode ? 'border-cyan-500' : 'border-blue-600'}`} />
          <p className={`mt-4 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Vardiya bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pb-32 ${darkMode ? 'bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900' : 'bg-gradient-to-b from-slate-50 via-blue-50 to-slate-100'}`}>
      {/* Hafta Navigasyonu */}
      <div className="px-4 py-3">
        <div className={`rounded-2xl ${darkMode ? 'bg-slate-800/60' : 'bg-white/80'} backdrop-blur-md border ${darkMode ? 'border-white/10' : 'border-slate-200'} p-4`}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevWeek}
              className={`p-2 rounded-xl ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'}`}
            >
              <ChevronRight className={`h-5 w-5 rotate-180 ${darkMode ? 'text-white' : 'text-slate-700'}`} />
            </button>
            
            <div className="text-center">
              <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'd MMM', { locale: tr })} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: tr })}
              </div>
              <div className={`text-xs ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                {weekNumber}. hafta
              </div>
            </div>
            
            <button
              onClick={handleNextWeek}
              className={`p-2 rounded-xl ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'}`}
            >
              <ChevronRight className={`h-5 w-5 ${darkMode ? 'text-white' : 'text-slate-700'}`} />
            </button>
          </div>

          {/* Günler Grid */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayData = weeklyData?.days?.find(d => d.date === dateStr)
              const isSelected = selectedDay === dateStr
              const today = isToday(day)
              const pastDay = isPast(day) && !today

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDay(dateStr)}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${isSelected ? 'scale-105' : 'hover:scale-105'} ${getDayStatusColor(dayData || { totalWorkHour: 0, segments: [] })} border ${isSelected ? (darkMode ? 'border-cyan-500/50' : 'border-blue-500/50') : 'border-transparent'}`}
                >
                  <div className={`text-xs font-semibold ${darkMode ? 'text-white/70' : 'text-slate-600'}`}>
                    {format(day, 'EEE', { locale: tr }).slice(0, 3)}
                  </div>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center mt-1 ${today ? (darkMode ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-amber-400 to-orange-400') : ''} ${isSelected ? (darkMode ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500') : ''} ${!today && !isSelected ? (darkMode ? 'bg-slate-700/50' : 'bg-slate-100') : ''}`}>
                    <span className={`text-sm font-bold ${today || isSelected ? 'text-white' : darkMode ? 'text-white' : 'text-slate-700'}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    {dayData?.totalWorkHour ? (
                      <>
                        <div className="flex items-center justify-center">
                          <Clock className={`h-2.5 w-2.5 ${darkMode ? 'text-cyan-400' : 'text-blue-500'}`} />
                        </div>
                        <div className={`text-[10px] font-bold ${darkMode ? 'text-cyan-300' : 'text-blue-600'}`}>
                          {dayData.totalWorkHour.toFixed(1)}s
                        </div>
                      </>
                    ) : (
                      <div className={`text-[10px] ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                        -
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      {stats && (
        <div className="px-4 pb-4">
          <div className={`rounded-2xl ${darkMode ? 'bg-slate-800/60' : 'bg-white/80'} backdrop-blur-md border ${darkMode ? 'border-white/10' : 'border-slate-200'} p-4`}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-cyan-500/20' : 'bg-blue-100'}`}>
                    <TrendingUp className={`h-4 w-4 ${darkMode ? 'text-cyan-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <div className={`text-xs ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>Toplam Çalışma</div>
                    <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {stats.totalHours.toFixed(1)} <span className="text-sm">saat</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                    <Target className={`h-4 w-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <div>
                    <div className={`text-xs ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>Çalışılan Gün</div>
                    <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {stats.workingDays} <span className="text-sm">gün</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                    <BarChart className={`h-4 w-4 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <div className={`text-xs ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>Günlük Ortalama</div>
                    <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {stats.avgHoursPerDay.toFixed(1)} <span className="text-sm">saat</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                    <Users className={`h-4 w-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <div className={`text-xs ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>Bugün Durum</div>
                    <div className={`text-sm font-bold ${stats.todayStatus === 'Çalışma' ? (darkMode ? 'text-cyan-400' : 'text-blue-600') : (darkMode ? 'text-emerald-400' : 'text-emerald-600')}`}>
                      {stats.todayStatus}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seçili Gün Detayları */}
      <div className="px-4 pb-24">
        {selectedDayData ? (
          <div className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-slate-800/60' : 'bg-white/80'} backdrop-blur-md border ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
            <div className={`p-4 ${selectedDayData.totalWorkHour > 0 ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20' : (darkMode ? 'bg-gradient-to-r from-slate-800/50 to-slate-900/50' : 'bg-gradient-to-r from-slate-100 to-slate-200')}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-5 w-5 ${darkMode ? 'text-cyan-400' : 'text-blue-600'}`} />
                    <h2 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {selectedDayData.dayName}
                    </h2>
                    {isToday(parseISO(selectedDayData.date)) && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${darkMode ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white'}`}>
                        BUGÜN
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                    {format(parseISO(selectedDayData.date), 'd MMMM yyyy', { locale: tr })}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>Toplam Çalışma</div>
                  <div className={`text-2xl font-black ${selectedDayData.totalWorkHour > 0 ? (darkMode ? 'text-cyan-400' : 'text-blue-600') : (darkMode ? 'text-white/40' : 'text-slate-400')}`}>
                    {selectedDayData.totalWorkHour.toFixed(1)} <span className="text-lg">saat</span>
                  </div>
                </div>
              </div>
              
              {selectedDayData.shiftCode && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mt-3 ${darkMode ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' : 'bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200'}`}>
                  <Zap className={`h-3.5 w-3.5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <span className={`text-xs font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                    Vardiya Kodu: {selectedDayData.shiftCode}
                  </span>
                </div>
              )}
            </div>

            <div className="p-4">
              {selectedDayData.segments.length > 0 ? (
                <div className="space-y-3">
                  <h3 className={`text-sm font-bold mb-3 ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>
                    Çalışma Planı
                  </h3>
                  
                  {selectedDayData.segments.map((segment, index) => (
                    <div
                      key={index}
                      className={`rounded-xl p-4 border-l-4 ${darkMode ? 'bg-slate-800/40' : 'bg-slate-50/80'} backdrop-blur-sm ${segment.type === 'Çalışma' ? 'border-l-blue-500' : segment.type === 'Mola' ? 'border-l-emerald-500' : 'border-l-purple-500'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${getSegmentColor(segment.type)}`}>
                            {segment.type === 'Çalışma' ? (
                              <Sun className="h-4 w-4 text-white" />
                            ) : segment.type === 'Mola' ? (
                              <Coffee className="h-4 w-4 text-white" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {segment.type}
                            </h4>
                            <p className={`text-xs ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                              {segment.order}. segment
                            </p>
                          </div>
                        </div>
                        <div className={`text-right ${darkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
                          <div className="text-lg font-black">{segment.duration.toFixed(1)}s</div>
                          <div className="text-xs">süre</div>
                        </div>
                      </div>
                      
                      <div className={`grid grid-cols-3 gap-2 mt-3 ${darkMode ? 'bg-slate-900/50' : 'bg-white/50'} rounded-lg p-3`}>
                        <div className="text-center">
                          <div className={`text-xs ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>Başlangıç</div>
                          <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {segment.start}
                          </div>
                        </div>
                        <div className="text-center border-x border-dashed border-white/10">
                          <div className={`text-xs ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>Süre</div>
                          <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {segment.duration.toFixed(1)} saat
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`text-xs ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>Bitiş</div>
                          <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {segment.end}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className={`p-4 rounded-full inline-flex ${darkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                    <Moon className={`h-12 w-12 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
                  </div>
                  <h3 className={`text-lg font-bold mt-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Dinlenme Günü
                  </h3>
                  <p className={`text-sm mt-2 ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                    Bu gün için planlanmış çalışma bulunmuyor. Dinlenme zamanı! 🎉
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className={`p-4 rounded-full inline-flex ${darkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
              <Calendar className={`h-12 w-12 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
            </div>
            <h3 className={`text-lg font-bold mt-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Vardiya Bilgisi Yok
            </h3>
            <p className={`text-sm mt-2 ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
              Seçili gün için vardiya bilgisi bulunamadı.
            </p>
          </div>
        )}

        {error && (
          <div className={`mt-4 rounded-xl p-4 ${darkMode ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30' : 'bg-gradient-to-r from-red-100 to-rose-100 border border-red-200'}`}>
            <div className="flex items-center gap-3">
              <AlertCircle className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
              <div>
                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Hata oluştu
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-white/70' : 'text-slate-600'}`}>
                  {error}
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className={`mt-3 w-full py-2 rounded-lg font-bold text-sm ${darkMode ? 'bg-red-500/30 hover:bg-red-500/40 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            >
              Tekrar Dene
            </button>
          </div>
        )}
      </div>
    </div>
  )
}