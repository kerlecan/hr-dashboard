"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Building, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  RefreshCw,
  FileText,
  ChevronRight,
  MoreVertical,
  CalendarDays,
  Briefcase,
  TrendingUp,
  MessageSquare,
  Check,
  X,
  Eye,
  Copy,
  Share2,
  Download
} from 'lucide-react'

interface RequestDetail {
  requestId: string
  type: string
  status: string
  currentStep: number
  employeeId: string
  data: any
  createdAt: string
}

interface ApprovalStep {
  step: number
  approverId: string
  role: string
  status: string
  actionDate: string
  note: string
}

interface DetailResponse {
  success: boolean
  request: RequestDetail
  steps: ApprovalStep[]
  currentApprover: string | null
}

export default function RequestDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const requestId = params.requestId as string
  
  const [darkMode, setDarkMode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<RequestDetail | null>(null)
  const [steps, setSteps] = useState<ApprovalStep[]>([])
  const [currentApprover, setCurrentApprover] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    const isDark = stored === 'true' || (stored === null && true)
    setDarkMode(isDark)
    fetchRequestDetail()
  }, [requestId])

  const fetchRequestDetail = useCallback(async () => {
    if (!user || !requestId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const dbName = (user as any)?.dbName || 'HOMINUM'
      const persid = (user as any)?.persid
      
      if (!persid) {
        throw new Error('Kullanıcı bilgileri alınamadı')
      }
      
      const res = await fetch(`/api/mobweb/request/detail?dbName=${encodeURIComponent(dbName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          persid,
          requestId 
        }),
      })
      
      const result: DetailResponse = await res.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Talep detayı alınamadı')
      }
      
      setDetail(result.request)
      setSteps(result.steps || [])
      setCurrentApprover(result.currentApprover)
    } catch (err: any) {
      console.error('Talep detayı alınamadı:', err)
      setError(err.message || 'Talep detayı yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [user, requestId])

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

  const getRoleText = (role: string) => {
    switch (role) {
      case 'MANAGER1': return '1. Amir'
      case 'MANAGER2': return '2. Amir'
      case 'MANAGER3': return '3. Amir'
      case 'HR': return 'İK'
      case 'ROLE': return 'Rol Bazlı'
      case 'USER': return 'Kullanıcı'
      default: return role
    }
  }

  const getStepStatusText = (status: string) => {
    switch (status) {
      case 'WAITING': return 'Bekliyor'
      case 'APPROVED': return 'Onaylandı'
      case 'REJECTED': return 'Reddedildi'
      case 'SKIPPED': return 'Atlandı'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateOnly = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading && !detail) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center ${
        darkMode 
          ? 'bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950' 
          : 'bg-gradient-to-b from-slate-50 via-blue-50 to-slate-50'
      }`}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className={`min-h-screen w-full ${
        darkMode 
          ? 'bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950' 
          : 'bg-gradient-to-b from-slate-50 via-blue-50 to-slate-50'
      }`}>
        <div className="px-5 pt-4">
          <div className="mb-6">
            <Link 
              href="/mobile-app/requests"
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                darkMode 
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Geri</span>
            </Link>
          </div>
          
          <div className={`rounded-2xl p-8 text-center ${
            darkMode 
              ? 'bg-white/5 border border-white/10' 
              : 'bg-white border border-slate-200'
          }`}>
            <AlertCircle className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Talep bulunamadı
            </h3>
            <p className={`mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Bu talep bulunamadı veya erişim izniniz yok
            </p>
            <Link
              href="/mobile-app/requests"
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                darkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Taleplerime Dön</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const statusColor = getStatusColor(detail.status)
  const StatusIcon = statusColor.icon

  return (
    <div className={`min-h-screen w-full transition-all duration-500 ${
      darkMode 
        ? 'bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950' 
        : 'bg-gradient-to-b from-slate-50 via-blue-50 to-slate-50'
    }`}>
      <div className="px-5 pt-4 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href="/mobile-app/requests"
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                darkMode 
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Geri</span>
            </Link>
            
            <button
              onClick={fetchRequestDetail}
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
          
          <div className="flex items-center justify-between mb-2">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {getTypeText(detail.type)}
            </h1>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusColor.bg} ${statusColor.border}`}>
              <StatusIcon className={`h-4 w-4 ${statusColor.text}`} />
              <span className={`text-sm font-medium ${statusColor.text}`}>
                {detail.status === 'PENDING' ? 'Bekliyor' :
                 detail.status === 'APPROVED' ? 'Onaylandı' :
                 detail.status === 'REJECTED' ? 'Reddedildi' : 'İptal Edildi'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Talep ID: <span className="font-mono">{detail.requestId.substring(0, 12)}...</span>
            </p>
            <span className={`text-sm ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>•</span>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {formatDate(detail.createdAt)}
            </p>
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

        {/* Request Data */}
        <div className={`rounded-2xl p-5 mb-6 ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Talep Detayları
          </h2>
          
          {detail.type === 'LEAVE' && detail.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>İzin Tipi</p>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {detail.data.izinTipi === 'YILLIK' ? 'Yıllık İzin' :
                     detail.data.izinTipi === 'MAZERET' ? 'Mazeret İzni' :
                     detail.data.izinTipi === 'UCRETSIZ' ? 'Ücretsiz İzin' :
                     detail.data.izinTipi === 'HASTALIK' ? 'Hastalık İzni' :
                     detail.data.izinTipi === 'DOGUM' ? 'Doğum İzni' :
                     detail.data.izinTipi === 'EVLILIK' ? 'Evlilik İzni' : detail.data.izinTipi}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Gün Sayısı</p>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {detail.data.gunSayisi} gün
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Başlangıç</p>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {formatDateOnly(detail.data.baslangicTarihi)}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Bitiş</p>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {formatDateOnly(detail.data.bitisTarihi)}
                  </p>
                </div>
              </div>
              
              {detail.data.aciklama && (
                <div>
                  <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Açıklama</p>
                  <p className={`text-sm ${darkMode ? 'text-white' : 'text-slate-900'} mt-1 p-3 rounded-lg ${
                    darkMode ? 'bg-slate-800/50' : 'bg-slate-50'
                  }`}>
                    {detail.data.aciklama}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {detail.type !== 'LEAVE' && (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <pre className={`text-sm whitespace-pre-wrap ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {JSON.stringify(detail.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Approval Steps */}
        <div className={`rounded-2xl p-5 ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Onay Süreci
          </h2>
          
          {steps.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Onay süreci başlatılmadı</p>
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step) => {
                const stepStatusColor = getStatusColor(step.status)
                const StepStatusIcon = stepStatusColor.icon
                
                return (
                  <div 
                    key={step.step}
                    className={`flex items-start gap-4 p-4 rounded-xl ${
                      step.status === 'WAITING' 
                        ? darkMode 
                          ? 'bg-blue-500/10 border border-blue-500/20' 
                          : 'bg-blue-50 border border-blue-100'
                        : darkMode 
                          ? 'bg-white/5 border border-white/10' 
                          : 'bg-slate-50 border border-slate-200'
                    } ${currentApprover === step.approverId ? 'ring-2 ring-blue-500/50' : ''}`}
                  >
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                      step.status === 'WAITING' 
                        ? darkMode 
                          ? 'bg-blue-500/20' 
                          : 'bg-blue-100'
                        : step.status === 'APPROVED'
                        ? darkMode 
                          ? 'bg-emerald-500/20' 
                          : 'bg-emerald-100'
                        : step.status === 'REJECTED'
                        ? darkMode 
                          ? 'bg-red-500/20' 
                          : 'bg-red-100'
                        : darkMode 
                          ? 'bg-slate-500/20' 
                          : 'bg-slate-100'
                    }`}>
                      <span className={`font-bold ${
                        step.status === 'WAITING' 
                          ? darkMode ? 'text-blue-300' : 'text-blue-600'
                          : step.status === 'APPROVED'
                          ? darkMode ? 'text-emerald-300' : 'text-emerald-600'
                          : step.status === 'REJECTED'
                          ? darkMode ? 'text-red-300' : 'text-red-600'
                          : darkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        {step.step}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {getRoleText(step.role)}
                          </h4>
                          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {step.approverId}
                          </p>
                        </div>
                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border ${
                          stepStatusColor.bg
                        } ${stepStatusColor.border}`}>
                          <StepStatusIcon className={`h-3.5 w-3.5 ${stepStatusColor.text}`} />
                          <span className={`text-xs font-medium ${stepStatusColor.text}`}>
                            {getStepStatusText(step.status)}
                          </span>
                        </div>
                      </div>
                      
                      {step.actionDate && (
                        <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {formatDate(step.actionDate)}
                        </div>
                      )}
                      
                      {step.note && (
                        <div className={`mt-2 p-2 rounded-lg ${
                          darkMode ? 'bg-slate-800/50' : 'bg-slate-100'
                        }`}>
                          <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            {step.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {currentApprover && (
            <div className={`mt-6 p-4 rounded-xl ${
              darkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <Clock className={`h-5 w-5 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    Şu anda onay bekleniyor
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-blue-200/80' : 'text-blue-600'}`}>
                    {currentApprover} kullanıcısı onayınızı bekliyor
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}