"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  Plus,
  Filter,
  Search,
  Loader2,
  Eye,
  RefreshCw,
  MoreVertical,
  CalendarDays,
  User,
  Building,
  Check,
  Clock as TimeIcon,
  BarChart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface RequestItem {
  REQUESTID: string
  REQUESTTYPE: string
  REQUESTSTATUS: string
  CURRENTSTEP: number
  CREATEDAT: string
}

interface RequestsResponse {
  success: boolean
  total: number
  data: RequestItem[]
}

export default function MyRequestsPage() {
  const { user } = useAuth()
  const [darkMode, setDarkMode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [filter, setFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    const isDark = stored === 'true' || (stored === null && true)
    setDarkMode(isDark)
    fetchRequests()
  }, [])

  const fetchRequests = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const dbName = (user as any)?.dbName || 'HOMINUM'
      const persid = (user as any)?.persid
      
      if (!persid) {
        throw new Error('Kullanıcı bilgileri alınamadı')
      }
      
      const res = await fetch(`/api/mobweb/request/my?dbName=${encodeURIComponent(dbName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ persid }),
      })
      
      const result: RequestsResponse = await res.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Talepler alınamadı')
      }
      
      setRequests(result.data || [])
    } catch (err: any) {
      console.error('Talepler alınamadı:', err)
      setError(err.message || 'Talepler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return {
          bg: darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100',
          text: darkMode ? 'text-emerald-300' : 'text-emerald-700',
          border: darkMode ? 'border-emerald-500/40' : 'border-emerald-300',
          icon: CheckCircle
        }
      case 'REJECTED':
        return {
          bg: darkMode ? 'bg-red-500/20' : 'bg-red-100',
          text: darkMode ? 'text-red-300' : 'text-red-700',
          border: darkMode ? 'border-red-500/40' : 'border-red-300',
          icon: XCircle
        }
      case 'PENDING':
        return {
          bg: darkMode ? 'bg-amber-500/20' : 'bg-amber-100',
          text: darkMode ? 'text-amber-300' : 'text-amber-700',
          border: darkMode ? 'border-amber-500/40' : 'border-amber-300',
          icon: Clock
        }
      case 'CANCELLED':
        return {
          bg: darkMode ? 'bg-slate-500/20' : 'bg-slate-100',
          text: darkMode ? 'text-slate-300' : 'text-slate-700',
          border: darkMode ? 'border-slate-500/40' : 'border-slate-300',
          icon: XCircle
        }
      default:
        return {
          bg: darkMode ? 'bg-slate-500/20' : 'bg-slate-100',
          text: darkMode ? 'text-slate-300' : 'text-slate-700',
          border: darkMode ? 'border-slate-500/40' : 'border-slate-300',
          icon: AlertCircle
        }
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'LEAVE': return 'İzin Talebi'
      case 'OVERTIME': return 'Fazla Mesai'
      case 'EXPENSE': return 'Masraf Talebi'
      case 'ADVANCE': return 'Avans Talebi'
      case 'DOCUMENT': return 'Evrak Talebi'
      default: return type
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'LEAVE': return Calendar
      case 'OVERTIME': return Clock
      case 'EXPENSE': return FileText
      case 'ADVANCE': return TrendingUp
      case 'DOCUMENT': return FileText
      default: return FileText
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredRequests = requests.filter(item => {
    const matchesFilter = filter === 'ALL' || item.REQUESTSTATUS === filter
    const matchesSearch = search === '' || 
      item.REQUESTID.toLowerCase().includes(search.toLowerCase()) ||
      getTypeText(item.REQUESTTYPE).toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.REQUESTSTATUS === 'PENDING').length,
    approved: requests.filter(r => r.REQUESTSTATUS === 'APPROVED').length,
    rejected: requests.filter(r => r.REQUESTSTATUS === 'REJECTED').length,
  }

  return (
    <div className={`min-h-screen w-full transition-all duration-500 ${
      darkMode 
        ? 'bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950' 
        : 'bg-gradient-to-b from-slate-50 via-blue-50 to-slate-50'
    }`}>
      <div className="px-5 pt-4 pb-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Taleplerim
          </h1>
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Oluşturduğunuz tüm taleplerin durumunu takip edin
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className={`rounded-xl p-4 ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Toplam</span>
              <FileText className={`h-4 w-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            </div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {stats.total}
            </div>
          </div>
          
          <div className={`rounded-xl p-4 ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Bekleyen</span>
              <Clock className={`h-4 w-4 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />
            </div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-amber-300' : 'text-amber-600'}`}>
              {stats.pending}
            </div>
          </div>
          
          <div className={`rounded-xl p-4 ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Onaylanan</span>
              <CheckCircle className={`h-4 w-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-500'}`} />
            </div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>
              {stats.approved}
            </div>
          </div>
          
          <div className={`rounded-xl p-4 ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Reddedilen</span>
              <XCircle className={`h-4 w-4 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
            </div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
              {stats.rejected}
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Talep ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl transition-all ${
                darkMode 
                  ? 'bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30' 
                  : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              }`}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((status) => {
              const isActive = filter === status
              const statusColor = getStatusColor(status)
              const StatusIcon = statusColor.icon
              
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isActive ? 'scale-105 shadow-lg' : ''} ${
                    isActive 
                      ? statusColor.bg + ' ' + statusColor.border + ' border'
                      : darkMode 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-white hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <StatusIcon className={`h-3.5 w-3.5 ${isActive ? statusColor.text : darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span className={`text-xs font-medium ${isActive ? statusColor.text : darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {status === 'ALL' ? 'Tümü' : 
                     status === 'PENDING' ? 'Bekleyen' :
                     status === 'APPROVED' ? 'Onaylanan' :
                     status === 'REJECTED' ? 'Reddedilen' : 'İptal Edilen'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mb-6">
          <button
            onClick={fetchRequests}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              darkMode 
                ? 'bg-white/10 hover:bg-white/20 text-white disabled:opacity-50' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50'
            }`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">Yenile</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
            darkMode 
              ? 'bg-red-500/20 border border-red-500/30' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <AlertCircle className={`h-5 w-5 flex-shrink-0 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${darkMode ? 'text-red-200' : 'text-red-800'}`}>
                Hata
              </p>
              <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                {error}
              </p>
            </div>
            <button 
              onClick={() => setError(null)}
              className={`p-1 rounded-lg ${darkMode ? 'hover:bg-red-500/30' : 'hover:bg-red-100'}`}
            >
              <XCircle className={`h-4 w-4 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
            <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Talepler yükleniyor...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRequests.length === 0 && (
          <div className={`rounded-2xl p-8 text-center ${
            darkMode 
              ? 'bg-white/5 border border-white/10' 
              : 'bg-white border border-slate-200'
          }`}>
            <div className="mb-4">
              <FileText className={`h-12 w-12 mx-auto ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Henüz talep oluşturmadınız
            </h3>
            <p className={`mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Yeni bir talep oluşturarak başlayabilirsiniz
            </p>
            <Link
              href="/mobile-app/leaves/new"
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                darkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
              }`}
            >
              <Plus className="h-5 w-5" />
              <span>Yeni Talep Oluştur</span>
            </Link>
          </div>
        )}

        {/* Requests List */}
        {!loading && filteredRequests.length > 0 && (
          <div className="space-y-4">
            {filteredRequests.map((item) => {
              const statusColor = getStatusColor(item.REQUESTSTATUS)
              const StatusIcon = statusColor.icon
              const TypeIcon = getTypeIcon(item.REQUESTTYPE)
              
              return (
                <Link
                  key={item.REQUESTID}
                  href={`/mobile-app/requests/${item.REQUESTID}`}
                  className={`block rounded-xl transition-all hover:scale-[1.02] active:scale-95 ${
                    darkMode 
                      ? 'bg-white/5 hover:bg-white/10 border border-white/10' 
                      : 'bg-white hover:bg-slate-50 border border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${statusColor.bg}`}>
                          <TypeIcon className={`h-5 w-5 ${statusColor.text}`} />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {getTypeText(item.REQUESTTYPE)}
                          </h3>
                          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatDate(item.CREATEDAT)}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border ${statusColor.bg} ${statusColor.border}`}>
                        <StatusIcon className={`h-3.5 w-3.5 ${statusColor.text}`} />
                        <span className={`text-xs font-medium ${statusColor.text}`}>
                          {item.REQUESTSTATUS === 'PENDING' ? 'Bekliyor' :
                           item.REQUESTSTATUS === 'APPROVED' ? 'Onaylandı' :
                           item.REQUESTSTATUS === 'REJECTED' ? 'Reddedildi' : 'İptal Edildi'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Adım:</span>
                          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-700'}`}>
                            {item.CURRENTSTEP}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>ID:</span>
                          <span className={`text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {item.REQUESTID.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link
        href="/mobile-app/leaves/new"
        className={`fixed bottom-24 right-5 z-40 p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 ${
          darkMode 
            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700' 
            : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
        }`}
      >
        <Plus className="h-6 w-6 text-white" />
      </Link>
    </div>
  )
}