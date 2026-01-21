"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Calendar, 
  User, 
  Building, 
  ChevronRight,
  Filter,
  Search,
  Loader2,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  MessageSquare,
  TrendingUp,
  Briefcase,
  Eye,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface PendingApproval {
  approvalId: string
  requestId: string
  requestType: string
  employeeId: string
  stepOrder: number
  approverType: string
  createdAt: string
}

interface PendingApprovalsResponse {
  success: boolean
  total: number
  data: PendingApproval[]
}

export default function ApprovalsPage() {
  const { user } = useAuth()
  const [darkMode, setDarkMode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [filter, setFilter] = useState<string>('ALL')
  const [note, setNote] = useState('')
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    const isDark = stored === 'true' || (stored === null && true)
    setDarkMode(isDark)
    fetchPendingApprovals()
  }, [])

  const fetchPendingApprovals = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const dbName = (user as any)?.dbName || 'HOMINUM'
      const persid = (user as any)?.persid
      
      if (!persid) {
        throw new Error('Kullanıcı bilgileri alınamadı')
      }
      
      const res = await fetch(`/api/mobweb/approval/pending?dbName=${encodeURIComponent(dbName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ persid }),
      })
      
      const result: PendingApprovalsResponse = await res.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Onay bekleyenler alınamadı')
      }
      
      setApprovals(result.data || [])
    } catch (err: any) {
      console.error('Onay bekleyenler alınamadı:', err)
      setError(err.message || 'Onay bekleyenler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [user])

  const handleApprove = async (approvalId: string) => {
    if (!user) return
    
    setApproving(approvalId)
    setError(null)
    
    try {
      const dbName = (user as any)?.dbName || 'HOMINUM'
      const persid = (user as any)?.persid
      
      const res = await fetch(`/api/mobweb/approval/approve?dbName=${encodeURIComponent(dbName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persid,
          approvalId,
          note: note || null
        }),
      })
      
      const result = await res.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Onaylama başarısız')
      }
      
      // Listeyi yenile
      await fetchPendingApprovals()
      setNote('')
      setSelectedApproval(null)
      
    } catch (err: any) {
      console.error('Onaylama hatası:', err)
      setError(err.message || 'Onaylama sırasında bir hata oluştu')
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async (approvalId: string) => {
    if (!user) return
    
    setRejecting(approvalId)
    setError(null)
    
    try {
      const dbName = (user as any)?.dbName || 'HOMINUM'
      const persid = (user as any)?.persid
      
      const res = await fetch(`/api/mobweb/approval/reject?dbName=${encodeURIComponent(dbName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persid,
          approvalId,
          note: note || null
        }),
      })
      
      const result = await res.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Reddetme başarısız')
      }
      
      // Listeyi yenile
      await fetchPendingApprovals()
      setNote('')
      setSelectedApproval(null)
      
    } catch (err: any) {
      console.error('Reddetme hatası:', err)
      setError(err.message || 'Reddetme sırasında bir hata oluştu')
    } finally {
      setRejecting(null)
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
      case 'EXPENSE': return TrendingUp
      case 'ADVANCE': return Briefcase
      case 'DOCUMENT': return FileText
      default: return FileText
    }
  }

  const getApproverTypeText = (type: string) => {
    switch (type) {
      case 'MANAGER1': return '1. Amir'
      case 'MANAGER2': return '2. Amir'
      case 'MANAGER3': return '3. Amir'
      case 'HR': return 'İK'
      case 'ROLE': return 'Rol Bazlı'
      case 'USER': return 'Kullanıcı'
      default: return type
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

  const filteredApprovals = approvals.filter(item => {
    if (filter === 'ALL') return true
    return item.requestType === filter
  })

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
            Onay Bekleyenler
          </h1>
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Size gelen onay taleplerini yönetin
          </p>
        </div>

        {/* Stats */}
        <div className={`rounded-xl p-5 mb-6 ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {approvals.length} Bekleyen Talep
              </h3>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Onayınızı bekleyen talepler
              </p>
            </div>
            <button
              onClick={fetchPendingApprovals}
              disabled={loading}
              className={`p-2 rounded-lg transition-all ${
                darkMode 
                  ? 'bg-white/10 hover:bg-white/20 disabled:opacity-50' 
                  : 'bg-slate-100 hover:bg-slate-200 disabled:opacity-50'
              }`}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {['ALL', 'LEAVE', 'OVERTIME', 'EXPENSE', 'ADVANCE', 'DOCUMENT'].map((type) => {
              const isActive = filter === type
              const TypeIcon = getTypeIcon(type)
              
              return (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isActive ? 'scale-105' : ''} ${
                    isActive 
                      ? darkMode 
                        ? 'bg-blue-500/20 border border-blue-500/40' 
                        : 'bg-blue-100 border border-blue-300'
                      : darkMode 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-white hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <TypeIcon className={`h-3.5 w-3.5 ${
                    isActive 
                      ? darkMode ? 'text-blue-300' : 'text-blue-600'
                      : darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                  <span className={`text-xs font-medium ${
                    isActive 
                      ? darkMode ? 'text-blue-300' : 'text-blue-700'
                      : darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {type === 'ALL' ? 'Tümü' : getTypeText(type)}
                  </span>
                </button>
              )
            })}
          </div>
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
        {loading && approvals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
            <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Onay bekleyenler yükleniyor...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredApprovals.length === 0 && (
          <div className={`rounded-2xl p-8 text-center ${
            darkMode 
              ? 'bg-white/5 border border-white/10' 
              : 'bg-white border border-slate-200'
          }`}>
            <div className="mb-4">
              <CheckCircle className={`h-12 w-12 mx-auto ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Onay bekleyen talep yok
            </h3>
            <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Size gelen yeni onay talepleri burada görünecektir
            </p>
          </div>
        )}

        {/* Approvals List */}
        {!loading && filteredApprovals.length > 0 && (
          <div className="space-y-4">
            {filteredApprovals.map((item) => {
              const TypeIcon = getTypeIcon(item.requestType)
              const isApproving = approving === item.approvalId
              const isRejecting = rejecting === item.approvalId
              const isSelected = selectedApproval === item.approvalId
              
              return (
                <div
                  key={item.approvalId}
                  className={`rounded-xl transition-all ${
                    darkMode 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-slate-200 shadow-sm'
                  } ${isSelected ? 'ring-2 ring-blue-500/50' : ''}`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                        }`}>
                          <TypeIcon className={`h-5 w-5 ${
                            darkMode ? 'text-blue-300' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {getTypeText(item.requestType)}
                          </h3>
                          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Talep Sahibi: {item.employeeId}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full ${
                        darkMode ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-amber-100 border border-amber-300'
                      }`}>
                        <Clock className={`h-3.5 w-3.5 ${darkMode ? 'text-amber-300' : 'text-amber-600'}`} />
                        <span className={`text-xs font-medium ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                          Bekliyor
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Onay Adımı</p>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {getApproverTypeText(item.approverType)} ({item.stepOrder}. adım)
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Talep Tarihi</p>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Note Input (when selected) */}
                    {isSelected && (
                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Not (Opsiyonel)
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={2}
                          className={`w-full px-3 py-2 rounded-lg transition-all ${
                            darkMode 
                              ? 'bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30' 
                              : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          }`}
                          placeholder="Onay/reddetme notunuzu buraya yazın..."
                        />
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (isSelected) {
                            handleApprove(item.approvalId)
                          } else {
                            setSelectedApproval(item.approvalId)
                          }
                        }}
                        disabled={isApproving || isRejecting}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                          isApproving 
                            ? 'bg-emerald-500/70 cursor-not-allowed' 
                            : 'bg-emerald-500 hover:bg-emerald-600 active:scale-95'
                        } text-white`}
                      >
                        {isApproving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Onaylanıyor...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            <span>{isSelected ? 'Onayla' : 'İncele'}</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => {
                          if (isSelected) {
                            handleReject(item.approvalId)
                          } else {
                            setSelectedApproval(item.approvalId)
                          }
                        }}
                        disabled={isApproving || isRejecting}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                          isRejecting 
                            ? 'bg-red-500/70 cursor-not-allowed' 
                            : 'bg-red-500 hover:bg-red-600 active:scale-95'
                        } text-white`}
                      >
                        {isRejecting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Reddediliyor...</span>
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4" />
                            <span>{isSelected ? 'Reddet' : 'Reddet'}</span>
                          </>
                        )}
                      </button>
                      
                      {isSelected && (
                        <button
                          onClick={() => {
                            setSelectedApproval(null)
                            setNote('')
                          }}
                          className={`py-2.5 px-4 rounded-lg font-medium transition-all ${
                            darkMode 
                              ? 'bg-white/10 hover:bg-white/20' 
                              : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}