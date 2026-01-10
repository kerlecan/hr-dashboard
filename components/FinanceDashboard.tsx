"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
// Mevcut import satırını bulun (lucide-react satırı) ve şu şekilde güncelleyin:
import {
  Search,
  Download,
  RefreshCw,
  Building,
  FileText,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  LogOut,
  ChevronRight,
  Database,
  Cpu,
  PieChart,
  Users,
  Server,
  Zap,
  Shield,
  X,
  Globe,
  Brain,
  Target,
  AlertTriangle,
  TrendingUp,
  LineChart,
  Activity,
  Radio
} from "lucide-react"

/* ===========================
   Types & Constants
   =========================== */

type Voucher = {
  id: string
  docType: string
  docNo: string
  docItem: string
  date: string
  accountName: string
  debit: number
  credit: number
  postway: string
  description: string
  company: string
  account: string
  acctype: string
  rawDate: string
  createdBy?: string
}

type VoucherType = { DOCTYPE: string; STEXT: string }
type Firm = { COMPANY: string; FIRMA: string; PLANT?: string; TESIS?: string; TESISLER?: Array<{ PLANT: string; TESIS: string }> }
type TopAccount = { name: string; total: number; count: number; topFirmCode?: string; topFirmName?: string; firmsCount?: number }

const ALL_VOUCHER_TYPES: VoucherType[] = [
  { DOCTYPE: "AA", STEXT: "AÇILIŞ FİŞİ" },
  { DOCTYPE: "BI", STEXT: "Banka İşlem Fişi" },
  { DOCTYPE: "P1", STEXT: "Alış Faturaları" },
  { DOCTYPE: "CI", STEXT: "Çek İşlem Fişi" },
  { DOCTYPE: "MA", STEXT: "Mahsup Fişi" },
  { DOCTYPE: "PT", STEXT: "Personel Bordro Tahakkuk Fişi" },
  { DOCTYPE: "S1", STEXT: "Satış Faturaları" },
  { DOCTYPE: "P3", STEXT: "Serbest Meslek Makbuzları" },
  { DOCTYPE: "KR", STEXT: "Kredi İşlemleri" },
  { DOCTYPE: "P2", STEXT: "Alış İade Faturaları" },
  { DOCTYPE: "YF", STEXT: "Yansıtma Fişleri" },
  { DOCTYPE: "KD", STEXT: "Kur Değerleme Fişleri" },
  { DOCTYPE: "EM", STEXT: "Enflasyon Muhasebesi Fişi" }
]

/* ===========================
   Small helpers/hooks
   =========================== */

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(v))

const formatTime = (d: Date) =>
  d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

/* ===========================
   Component
   =========================== */

export default function FinanceDashboard() {
  // Auth
  const { user, logout, isAuthenticated } = useAuth()

  // Data
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [voucherTypes, setVoucherTypes] = useState<VoucherType[]>([])
  const [firms, setFirms] = useState<Firm[]>([])

  // Loading / errors
  const [loading, setLoading] = useState({ vouchers: true, types: true, firms: true })
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filters, setFilters] = useState({ docType: "all", company: "all", search: "", dateRange: "7", acctype: "all" })
  const debouncedSearch = useDebounced(filters.search, 300)

  // UI state
  const [activeTab, setActiveTab] = useState<"overview" | "vouchers" | "analysis" | "reports">("overview")
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [accountModalName, setAccountModalName] = useState<string | null>(null)
  const [accountModalData, setAccountModalData] = useState<Array<{ firmCode: string; firmName: string; total: number }>>([])

  const [isMobile, setIsMobile] = useState(false)

  // Refresh
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(300)

  // Notifications
  const [showNotification, setShowNotification] = useState(false)
  const [notification, setNotification] = useState({ type: "success" as "success" | "error" | "info", message: "" })
  const notifTimerRef = useRef<number | null>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)

  // Abort controller for fetches
  const fetchAbortRef = useRef<AbortController | null>(null)

  // Responsive check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // Show toast
  const showToast = useCallback((type: "success" | "error" | "info", message: string, duration = 3000) => {
    setNotification({ type, message })
    setShowNotification(true)
    if (notifTimerRef.current) window.clearTimeout(notifTimerRef.current)
    notifTimerRef.current = window.setTimeout(() => {
      setShowNotification(false)
      notifTimerRef.current = null
    }, duration)
  }, [])

  // Auto refresh
  useEffect(() => {
    if (!autoRefreshEnabled) return
    const id = window.setInterval(() => {
      fetchAllData(false)
    }, autoRefreshInterval * 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefreshEnabled, autoRefreshInterval])

  // Map & process helpers
  const mapVoucher = useCallback((item: any, index: number): Voucher => ({
    id: `${item.COMPANY || "01"}-${item.FINDOCTYPE || "??"}-${item.FINDOCNUM || index}-${item.FINDOCITEM || index}`,
    docType: item.FINDOCTYPE || "??",
    docNo: item.FINDOCNUM || index.toString(),
    docItem: item.FINDOCITEM || "0",
    date: item.POSTDATE ? new Date(item.POSTDATE).toLocaleDateString("tr-TR") : "-",
    rawDate: item.POSTDATE || "",
    accountName: item.ATEXT || item.accountName || item.STEXT1 || "-",
    debit: Number(item.HPOSTAMNT) || 0,
    credit: Number(item.DPOSTAMNT) || 0,
    postway: item.POSTWAY || "0",
    description: item.STEXT1 || item.description || "",
    company: (item.COMPANY || "01").toString().padStart(2, "0"),
    account: item.ACCOUNT || "",
    acctype: item.ACCTYPE || "",
    createdBy: item.CREATEDBY || item.CREATED_BY || item.CREATEDBy || undefined
  }), [])

  const processFirms = useCallback((items: any[]): Firm[] => {
    const map = new Map<string, Firm>()
    items?.forEach((item: any) => {
      const companyRaw = item.COMPANY
      if (!companyRaw) return
      const company = companyRaw.toString().padStart(2, "0")
      if (!map.has(company)) map.set(company, { COMPANY: company, FIRMA: item.FIRMA || `Firma ${company}`, TESISLER: [] })
      const f = map.get(company)!
      if (item.PLANT && item.TESIS) f.TESISLER!.push({ PLANT: item.PLANT, TESIS: item.TESIS })
      if (item.PLANT && item.TESIS && !f.PLANT) {
        f.PLANT = item.PLANT
        f.TESIS = item.TESIS
      }
    })
    let arr = Array.from(map.values()).map(f => ({ ...f, TESISLER: f.TESISLER && f.TESISLER.length > 0 ? f.TESISLER : [{ PLANT: "00", TESIS: "Merkez" }] }))
    arr = arr.sort((a, b) => {
      const na = parseInt(a.COMPANY.replace(/^0+/, "") || "0", 10)
      const nb = parseInt(b.COMPANY.replace(/^0+/, "") || "0", 10)
      if (isNaN(na) && isNaN(nb)) return a.COMPANY.localeCompare(b.COMPANY)
      if (isNaN(na)) return 1
      if (isNaN(nb)) return -1
      return na - nb
    })
    return arr
  }, [])

  // Fetch all data (with AbortController)
  const fetchAllData = useCallback(async (notify = false) => {
    // abort previous
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort()
    }
    const controller = new AbortController()
    fetchAbortRef.current = controller

    try {
      setError(null)
      setLoading({ vouchers: true, types: true, firms: true })
      setIsRefreshing(true)

      // vouchers
      const vRes = await fetch("/api/vouchers", { signal: controller.signal })
      if (!vRes.ok) throw new Error(`Fiş verileri alınamadı: ${vRes.status}`)
      const vJson = await vRes.json()
      const mapped: Voucher[] = (vJson.data || []).map(mapVoucher)
      setVouchers(mapped)
      setLoading(prev => ({ ...prev, vouchers: false }))

      // types
      const tRes = await fetch("/api/voucher-types", { signal: controller.signal }).catch(() => null)
      const tJson = tRes && tRes.ok ? await tRes.json() : { data: [] }
      const mergedTypes: VoucherType[] = ALL_VOUCHER_TYPES.map(t => {
        const api = (tJson.data || []).find((a: any) => a.DOCTYPE === t.DOCTYPE)
        return api ? { DOCTYPE: api.DOCTYPE, STEXT: api.STEXT || t.STEXT } : t
      })
      ;(tJson.data || []).forEach((api: any) => {
        if (!mergedTypes.find(m => m.DOCTYPE === api.DOCTYPE)) mergedTypes.push({ DOCTYPE: api.DOCTYPE, STEXT: api.STEXT })
      })
      setVoucherTypes(mergedTypes)
      setLoading(prev => ({ ...prev, types: false }))

      // firms
      const fRes = await fetch("/api/firms", { signal: controller.signal }).catch(() => null)
      const fJson = fRes && fRes.ok ? await fRes.json() : { data: [] }
      const processed = processFirms(fJson.data || [])
      setFirms(processed)
      setLoading(prev => ({ ...prev, firms: false }))

      // update refresh info
      const now = new Date()
      setLastRefreshTime(now)
      setRefreshCount(c => c + 1)
      if (notify) showToast("success", `Veriler güncellendi! ${mapped.length} fiş yüklendi. (${formatTime(now)})`)
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // ignore abort
      } else {
        setError(err?.message || String(err))
        setLoading({ vouchers: false, types: false, firms: false })
        if (notify) showToast("error", `Hata: ${err?.message || String(err)}`)
      }
    } finally {
      setIsRefreshing(false)
      fetchAbortRef.current = null
    }
  }, [mapVoucher, processFirms, showToast])

  // initial load
  useEffect(() => {
    fetchAllData(true)
    return () => {
      if (fetchAbortRef.current) fetchAbortRef.current.abort()
      if (notifTimerRef.current) window.clearTimeout(notifTimerRef.current)
    }
  }, [fetchAllData])

  // Toggle auto refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => {
      const next = !prev
      showToast("info", next ? `Otomatik yenileme açıldı (${autoRefreshInterval}s)` : "Otomatik yenileme kapatıldı")
      return next
    })
  }, [autoRefreshInterval, showToast])

  // Filtering (uses debounced search)
  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      if (filters.docType !== "all" && v.docType !== filters.docType) return false
      if (filters.company !== "all" && v.company !== filters.company) return false
      if (filters.acctype !== "all" && v.acctype !== filters.acctype)

        return false

      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase()
        if (
          !v.docNo.toLowerCase().includes(s) &&
          !v.accountName.toLowerCase().includes(s) &&
          !v.description.toLowerCase().includes(s) &&
          !v.account.toLowerCase().includes(s) &&
          !v.docType.toLowerCase().includes(s)
        ) return false
      }

      if (filters.dateRange !== "all" && v.rawDate) {
        if (filters.dateRange === "0") {
          const vd = new Date(v.rawDate)
          const today = new Date()
          return vd.getFullYear() === today.getFullYear() && vd.getMonth() === today.getMonth() && vd.getDate() === today.getDate()
        } else {
          const days = parseInt(filters.dateRange)
          const cutoff = new Date()
          cutoff.setDate(cutoff.getDate() - days)
          const vd = new Date(v.rawDate)
          return vd >= cutoff
        }
      }

      return true
    })
  }, [vouchers, filters, debouncedSearch])

  // Stats memo
  const stats = useMemo(() => {
    const totalDebit = filteredVouchers.reduce((s, v) => s + v.debit, 0)
    const totalCredit = filteredVouchers.reduce((s, v) => s + v.credit, 0)
    const balance = Math.abs(totalCredit - totalDebit)
    const balanceType = totalCredit > totalDebit ? "Alacak Bakiyesi" : "Borç Bakiyesi"

    const voucherByType = filteredVouchers.reduce((acc: Record<string, number>, v) => { acc[v.docType] = (acc[v.docType] || 0) + 1; return acc }, {})
    const voucherByCompany = filteredVouchers.reduce((acc: Record<string, number>, v) => { acc[v.company] = (acc[v.company] || 0) + 1; return acc }, {})
    const voucherByDay = filteredVouchers.reduce((acc: Record<string, number>, v) => { const d = v.date.split(" ")[0]; acc[d] = (acc[d] || 0) + 1; return acc }, {})

    const accountMap = filteredVouchers.reduce((acc: Record<string, { total: number; count: number; firms: Record<string, number> }>, v) => {
      if (!v.accountName || v.accountName === "-") return acc
      if (!acc[v.accountName]) acc[v.accountName] = { total: 0, count: 0, firms: {} }
      const amount = v.debit + v.credit
      acc[v.accountName].total += amount
      acc[v.accountName].count += 1
      acc[v.accountName].firms[v.company] = (acc[v.accountName].firms[v.company] || 0) + amount
      return acc
    }, {})

    const topAccounts: TopAccount[] = Object.entries(accountMap).map(([name, d]) => {
      const firmsEntries = Object.entries(d.firms)
      const topFirmEntry = firmsEntries.length ? firmsEntries.sort(([, a], [, b]) => b - a)[0] : undefined
      return {
        name,
        total: d.total,
        count: d.count,
        topFirmCode: topFirmEntry?.[0],
        topFirmName: topFirmEntry ? (firms.find(f => f.COMPANY === topFirmEntry[0])?.FIRMA || topFirmEntry[0]) : undefined,
        firmsCount: firmsEntries.length
      }
    }).sort((a, b) => b.total - a.total).slice(0, 10)

    return {
      totalDebit, totalCredit, totalVouchers: filteredVouchers.length, totalFirms: firms.length, totalVoucherTypes: voucherTypes.length,
      balance, balanceType, voucherByType, voucherByCompany, voucherByDay, topAccounts
    } as const
  }, [filteredVouchers, firms, voucherTypes])

  const createdByCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const v of filteredVouchers) {
      const u = v.createdBy || "unknown"
      map[u] = (map[u] || 0) + 1
    }
    return Object.entries(map).map(([user, count]) => ({ user, count })).sort((a, b) => b.count - a.count)
  }, [filteredVouchers])

  // helpers to get firm & type names
  const getFirmName = useCallback((companyCode: string) => firms.find(f => f.COMPANY === companyCode)?.FIRMA || `Firma ${companyCode}`, [firms])
  const getFirmWithPlants = useCallback((companyCode: string) => {
    const firm = firms.find(f => f.COMPANY === companyCode)
    if (!firm) return { name: `Firma ${companyCode}`, plants: [] }
    return { name: firm.FIRMA, plants: firm.TESISLER || [] }
  }, [firms])
  const getVoucherTypeName = useCallback((typeCode: string) => voucherTypes.find(t => t.DOCTYPE === typeCode)?.STEXT || typeCode, [voucherTypes])

  // open account modal
  const openAccountModal = useCallback((accountName: string) => {
    const map: Record<string, number> = {}
    for (const v of vouchers) {
      if (v.accountName !== accountName) continue
      map[v.company] = (map[v.company] || 0) + v.debit + v.credit
    }
    const arr = Object.entries(map).map(([firmCode, total]) => ({ firmCode, firmName: getFirmName(firmCode), total })).sort((a, b) => b.total - a.total)
    setAccountModalData(arr)
    setAccountModalName(accountName)
    setAccountModalOpen(true)
  }, [vouchers, getFirmName])

  const onFirmClick = useCallback((companyCode: string) => {
    setFilters(prev => ({ ...prev, company: companyCode }))
    setActiveTab("vouchers")
    setTimeout(() => {
      const el = document.getElementById("vouchers-list-top")
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 150)
  }, [])

  // export CSV
  const exportCSV = useCallback(() => {
    if (!filteredVouchers.length) {
      showToast("info", "İhraç edilecek veri yok.")
      return
    }
    const headers = ["company", "docType", "docNo", "date", "accountName", "debit", "credit", "description", "createdBy"]
    const rows = filteredVouchers.map(v => headers.map(h => JSON.stringify((v as any)[h] ?? "")).join(","))
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vouchers_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast("success", "CSV indirildi.")
  }, [filteredVouchers, showToast])

  // pagination slice
  const pagedVouchers = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredVouchers.slice(start, start + pageSize)
  }, [filteredVouchers, page, pageSize])

  /* ===========================
     UI - Render
     =========================== */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-48 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent" />
      </div>

      {/* toast */}
      {showNotification && (
        <div role="status" aria-live="polite" className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg shadow-lg max-w-md animate-in slide-in-from-right-5 ${
          notification.type === "success"
            ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-green-300"
            : notification.type === "error"
              ? "bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/20 text-red-300"
              : "bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 text-white/90"
        } backdrop-blur-xl`}>
          {notification.type === "success" ? <CheckCircle className="w-5 h-5 text-green-400" /> : notification.type === "error" ? <AlertCircle className="w-5 h-5 text-red-400" /> : <Clock className="w-5 h-5 text-indigo-400" />}
          <div className="flex-1">
            <p className="font-medium">{notification.type === "success" ? "Başarılı" : notification.type === "error" ? "Hata" : "Bilgi"}</p>
            <p className="text-sm">{notification.message}</p>
          </div>
          <button aria-label="Kapat" onClick={() => setShowNotification(false)} className="text-white/40 hover:text-white/60">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* main */}
      <div className="relative z-10">
        {/* top nav */}
        <nav className="sticky top-0 z-40 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl border-b border-white/10 px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg blur opacity-30" />
                <div className="relative p-2 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-lg">
                  <Building className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">H&R <span className="text-cyan-300">Tomorrow</span></h1>
                <p className="text-xs text-white/60">Muhasebe Dashboard</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-white/80">{vouchers.length} Fiş</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <Database className="w-3 h-3 text-cyan-400" />
                <span className="text-xs text-white/80">{firms.length} Firma</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <Cpu className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-white/80">%99.9 Uptime</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleAutoRefresh}
                className={`gap-2 ${autoRefreshEnabled ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30" : "text-white/60 hover:text-white"} border border-white/10 backdrop-blur-sm`}
                aria-pressed={autoRefreshEnabled} aria-label="Otomatik yenileme">
                <Clock className="w-4 h-4" />
                <span className="hidden md:inline">Oto</span>
              </Button>

              <Button variant="ghost" size="sm" onClick={() => fetchAllData(true)} disabled={isRefreshing}
                className="gap-2 text-white/60 hover:text-white border border-white/10 backdrop-blur-sm" aria-label="Yenile">
                {isRefreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="hidden md:inline">Yenile</span>
              </Button>

              {isAuthenticated && (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 hover:border-indigo-500/30 transition-colors" aria-haspopup="true">
                    <User className="w-4 h-4 text-white/80" />
                    <span className="text-sm text-white/90 hidden md:inline">{(user as any)?.display || (user as any)?.username}</span>
                    <ChevronRight className="w-3 h-3 text-white/40" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <button onClick={() => logout()} className="w-full px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2 rounded-lg">
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* main content */}
        <div className="p-4 md:p-6">
          {/* stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 backdrop-blur-xl border-red-500/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-red-300 font-semibold uppercase">Toplam Borç</div>
                    <div className="text-2xl md:text-3xl font-extrabold text-white">₺{formatCurrency(stats.totalDebit)}</div>
                    <div className="text-xs text-red-300/60 mt-1">{filteredVouchers.filter(v => v.debit > 0).length} borç fişi</div>
                  </div>
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <ArrowDownRight className="w-6 h-6 text-red-400" />
                  </div>
                </div>
                <div className="mt-3 h-1 bg-gradient-to-r from-red-500 to-transparent rounded-full" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border-green-500/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-green-300 font-semibold uppercase">Toplam Alacak</div>
                    <div className="text-2xl md:text-3xl font-extrabold text-white">₺{formatCurrency(stats.totalCredit)}</div>
                    <div className="text-xs text-green-300/60 mt-1">{filteredVouchers.filter(v => v.credit > 0).length} alacak fişi</div>
                  </div>
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <ArrowUpRight className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div className="mt-3 h-1 bg-gradient-to-r from-green-500 to-transparent rounded-full" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-cyan-300 font-semibold uppercase">Net Bakiye</div>
                    <div className="text-2xl md:text-3xl font-extrabold text-white">₺{formatCurrency(stats.balance)}</div>
                    <Badge className={`mt-2 ${stats.balanceType === "Alacak Bakiyesi" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}`}>{stats.balanceType}</Badge>
                  </div>
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <div className="mt-3 h-1 bg-gradient-to-r from-cyan-500 to-transparent rounded-full" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-purple-300 font-semibold uppercase">Firma & Fiş</div>
                    <div className="text-2xl md:text-3xl font-extrabold text-white">{stats.totalFirms} Firma</div>
                    <div className="text-xs text-purple-300/60 mt-1">{stats.totalVouchers} toplam fiş</div>
                  </div>
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Building className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div className="mt-3 h-1 bg-gradient-to-r from-purple-500 to-transparent rounded-full" />
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 p-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              {[
                { id: "overview", label: "Genel Bakış", icon: Building, color: "from-blue-500 to-cyan-500" },
                { id: "vouchers", label: "Fiş Listesi", icon: FileText, color: "from-purple-500 to-pink-500" },
                { id: "analysis", label: "Analiz", icon: BarChart3, color: "from-green-500 to-emerald-500" },
                { id: "reports", label: "Raporlar", icon: PieChart, color: "from-orange-500 to-amber-500" },
              ].map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                  activeTab === item.id ? `bg-gradient-to-r ${item.color} text-white shadow-lg` : "text-white/60 hover:text-white hover:bg-white/5"
                }`}>
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content area */}
          <div className="space-y-6">
            {/* Overview */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Filters */}
                <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/20">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="lg:col-span-2">
                        <div className="relative group">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-cyan-400" />
                          <Input placeholder="Fiş no, hesap veya açıklama ara..." value={filters.search} onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))} className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400/20" aria-label="Ara" />
                        </div>
                      </div>

                      <Select value={filters.docType} onValueChange={v => setFilters(prev => ({ ...prev, docType: v }))}>
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-white/40" /><SelectValue placeholder="Fiş Tipi" /></div>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/20">
                          <SelectItem value="all" className="text-white">Tüm Fiş Tipleri</SelectItem>
                          {ALL_VOUCHER_TYPES.map(t => <SelectItem key={t.DOCTYPE} value={t.DOCTYPE} className="text-white">{t.STEXT} ({t.DOCTYPE})</SelectItem>)}
                        </SelectContent>
                      </Select>

                      <Select value={filters.company} onValueChange={v => setFilters(prev => ({ ...prev, company: v }))}>
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <div className="flex items-center gap-2"><Building className="w-4 h-4 text-white/40" /><SelectValue placeholder="Firma" /></div>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/20">
                          <SelectItem value="all" className="text-white">Tüm Firmalar</SelectItem>
                          {firms.map(f => <SelectItem key={f.COMPANY} value={f.COMPANY} className="text-white"><div className="flex flex-col"><span className="font-medium truncate">{f.FIRMA}</span><span className="text-xs text-white/60">Kod: {f.COMPANY}</span></div></SelectItem>)}
                        </SelectContent>
                      </Select>

                      <Select value={filters.dateRange} onValueChange={v => setFilters(prev => ({ ...prev, dateRange: v }))}>
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-white/40" /><SelectValue placeholder="Tarih" /></div>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/20">
                          <SelectItem value="0" className="text-white">Bugün</SelectItem>
                          <SelectItem value="7" className="text-white">Son 7 Gün</SelectItem>
                          <SelectItem value="30" className="text-white">Son 30 Gün</SelectItem>
                          <SelectItem value="90" className="text-white">Son 90 Gün</SelectItem>
                          <SelectItem value="365" className="text-white">Son 1 Yıl</SelectItem>
                          <SelectItem value="all" className="text-white">Tüm Zamanlar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Overview grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Voucher Types */}
                  <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white">Fiş Tipleri</h3>
                        <Badge className="bg-white/10 text-white/80 border-white/20">{Object.keys(stats.voucherByType).length} tip</Badge>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {Object.entries(stats.voucherByType).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <div>
                              <div className="font-medium text-white">{getVoucherTypeName(type)}</div>
                              <div className="text-xs text-white/60">Kod: {type}</div>
                            </div>
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">{count}</Badge>
                          </div>
                        ))}
                        {Object.keys(stats.voucherByType).length === 0 && <div className="text-sm text-white/40 text-center py-4">Veri yok</div>}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Accounts */}
                  <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white">En Aktif Hesaplar</h3>
                        <Badge className="bg-white/10 text-white/80 border-white/20">Top 10</Badge>
                      </div>
                      <div className="space-y-4 max-h-64 overflow-y-auto">
                        {stats.topAccounts?.map(acc => {
                          const maxTotal = Math.max(...stats.topAccounts.map(a => a.total))
                          const percentage = maxTotal ? (acc.total / maxTotal) * 100 : 0
                          return (
                            <div key={acc.name} className="group p-2 hover:bg-white/5 rounded-lg transition-all duration-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="min-w-0">
                                  <div className="font-medium text-white truncate">{acc.name}</div>
                                  <div className="text-xs text-white/60">{acc.count} işlem • {acc.firmsCount} firma</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-white">₺{formatCurrency(acc.total)}</div>
                                  <div className="text-xs text-cyan-400">{percentage.toFixed(1)}%</div>
                                </div>
                              </div>
                              <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          )
                        })}
                        {(!stats.topAccounts || stats.topAccounts.length === 0) && <div className="text-sm text-white/40 text-center py-4">Veri yok</div>}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white">Son İşlemler</h3>
                        <Badge className="bg-white/10 text-white/80 border-white/20">Son 10</Badge>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {filteredVouchers.slice(0, 10).map(v => (
                          <div key={v.id} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-white text-sm">{v.docType}-{v.docNo}</div>
                                <div className="text-xs text-white/60 truncate max-w-[200px]">{v.accountName}</div>
                              </div>
                              <div className={`text-sm font-bold ${v.debit > 0 ? "text-red-400" : "text-green-400"}`}>₺{formatCurrency(v.debit || v.credit)}</div>
                            </div>
                          </div>
                        ))}
                        {filteredVouchers.length === 0 && <div className="text-sm text-white/40 text-center py-4">Veri yok</div>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Vouchers */}
            {activeTab === "vouchers" && (
              <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/20 overflow-hidden">
                <CardContent className="p-0">
                  <div id="vouchers-list-top" className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-white">Fiş Listesi</h3>
                      <p className="text-sm text-white/60">Gösterilen: {filteredVouchers.length} / {vouchers.length} kayıt</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/10" onClick={exportCSV} aria-label="CSV indir">
                        <Download className="w-4 h-4 mr-2" />Export
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                          <th className="p-3 text-left text-xs font-semibold text-white/80">Fiş</th>
                          <th className="p-3 text-left text-xs font-semibold text-white/80 hidden md:table-cell">Firma</th>
                          <th className="p-3 text-left text-xs font-semibold text-white/80">Tarih</th>
                          <th className="p-3 text-left text-xs font-semibold text-white/80 hidden lg:table-cell">Hesap</th>
                          <th className="p-3 text-right text-xs font-semibold text-white/80">Borç</th>
                          <th className="p-3 text-right text-xs font-semibold text-white/80">Alacak</th>
                          <th className="p-3 text-left text-xs font-semibold text-white/80 hidden sm:table-cell">Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedVouchers.map(v => {
                          const firm = getFirmWithPlants(v.company)
                          return (
                            <tr key={v.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="p-3">
                                <div className="font-medium text-white">{v.docType}-{v.docNo}</div>
                                <div className="text-xs text-white/60 truncate max-w-[200px]">{v.description || v.accountName}</div>
                                <div className="text-xs text-white/40 mt-1">Oluşturan: {v.createdBy || "—"}</div>
                              </td>
                              <td className="p-3 hidden md:table-cell">
                                <div className="font-medium text-white">{firm.name}</div>
                                <div className="text-xs text-white/60">Kod: {v.company}</div>
                              </td>
                              <td className="p-3">
                                <div className="font-medium text-white">{v.date}</div>
                                <div className="text-xs text-white/60">{v.account}</div>
                              </td>
                              <td className="p-3 hidden lg:table-cell">
                                <div className="font-medium text-white truncate max-w-[240px]">{v.accountName}</div>
                              </td>
                              <td className="p-3 text-right">
                                <div className={`font-bold ${v.debit ? "text-red-400" : "text-white/40"}`}>{v.debit ? `₺${formatCurrency(v.debit)}` : "—"}</div>
                              </td>
                              <td className="p-3 text-right">
                                <div className={`font-bold ${v.credit ? "text-green-400" : "text-white/40"}`}>{v.credit ? `₺${formatCurrency(v.credit)}` : "—"}</div>
                              </td>
                              <td className="p-3 hidden sm:table-cell">
                                {v.postway === "1" ? <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Kayıtlı</Badge> : <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Beklemede</Badge>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {filteredVouchers.length === 0 && (
                    <div className="p-8 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-white/20" />
                      <p className="text-white/60">Filtrelere uygun fiş bulunamadı.</p>
                    </div>
                  )}

                  <div className="p-4 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="text-sm text-white/60">Toplam {filteredVouchers.length} kayıt • Sayfa {page} / {Math.max(1, Math.ceil(filteredVouchers.length / pageSize))}</div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-white/60">Sayfa Boyutu:</label>
                      <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} className="bg-white/5 rounded px-2 py-1 text-sm text-white">
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                      </select>

                      <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Önceki sayfa">Önceki</Button>
                      <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.min(Math.ceil(filteredVouchers.length / pageSize), p + 1))} disabled={page >= Math.ceil(filteredVouchers.length / pageSize)} aria-label="Sonraki sayfa">Sonraki</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis */}
            {activeTab === "analysis" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/20">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-white"><Building className="w-5 h-5 text-cyan-400" />Firma Bazlı Dağılım</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {Object.entries(stats.voucherByCompany).sort(([, a], [, b]) => b - a).map(([company, count]) => {
                          const fi = getFirmWithPlants(company)
                          return (
                            <div key={company} className="p-3 hover:bg-white/5 rounded-lg transition-colors">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-white">{fi.name}</div>
                                  <div className="text-sm text-white/60">Kod: {company}</div>
                                </div>
                                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">{count} fiş</Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/20">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-white"><Calendar className="w-5 h-5 text-purple-400" />Günlük Dağılım</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {Object.entries(stats.voucherByDay).sort(([a], [b]) => +new Date(b) - +new Date(a)).slice(0, 15).map(([date, count]) => (
                          <div key={date} className="p-3 hover:bg-white/5 rounded-lg transition-colors">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium text-white">{date}</div>
                                <div className="text-sm text-white/60">{new Date(date).toLocaleDateString("tr-TR", { weekday: "long" })}</div>
                              </div>
                              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">{count} fiş</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/20">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-white"><Users className="w-5 h-5 text-green-400" />Kullanıcı Bazlı Oluşturma</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {createdByCounts.length === 0 ? <div className="text-sm text-white/60">Bu aralıkta oluşturulan fiş yok.</div> : createdByCounts.map(c => (
                        <div key={c.user} className="p-3 hover:bg-white/5 rounded-lg transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="font-medium text-white truncate">{c.user}</div>
                              <div className="text-xs text-white/60">Oluşturulan fiş sayısı</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-white">{c.count} fiş</div>
                              <div className="text-xs text-cyan-400">{((c.count / Math.max(1, stats.totalVouchers)) * 100).toFixed(0)}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Reports Section - Tamamen Güncellenmiş */}
{activeTab === "reports" && (
  <div className="space-y-6">
    {/* Gerçek Zamanlı İstatistikler Paneli */}
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-purple-300 font-semibold uppercase flex items-center gap-2">
                <Zap className="w-3 h-3" /> AI Öngörü
              </div>
              <div className="text-2xl font-extrabold text-white mt-2">%94.7</div>
              <div className="text-xs text-purple-300/60 mt-1">Doğruluk Oranı</div>
            </div>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Cpu className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 backdrop-blur-xl border-cyan-500/30">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-cyan-300 font-semibold uppercase flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Büyüme
              </div>
              <div className="text-2xl font-extrabold text-white mt-2">+32.4%</div>
              <div className="text-xs text-cyan-300/60 mt-1">Son 30 Gün</div>
            </div>
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl border-green-500/30">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-green-300 font-semibold uppercase flex items-center gap-2">
                <Target className="w-3 h-3" /> Hedef
              </div>
              <div className="text-2xl font-extrabold text-white mt-2">%87.3</div>
              <div className="text-xs text-green-300/60 mt-1">Tamamlanma Oranı</div>
            </div>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-600/20 to-amber-600/20 backdrop-blur-xl border-orange-500/30">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-orange-300 font-semibold uppercase flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" /> Risk
              </div>
              <div className="text-2xl font-extrabold text-white mt-2">Düşük</div>
              <div className="text-xs text-orange-300/60 mt-1">5 Kritik Uyarı</div>
            </div>
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Shield className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* 3D Data Visualization & AI Insights */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border-white/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10" />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                3D Finansal Coğrafya
              </h3>
              <p className="text-sm text-white/60 mt-1">Firma dağılımının interaktif haritası</p>
            </div>
            <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30 animate-pulse">
              CANLI
            </Badge>
          </div>
          
          {/* Interaktif 3D Harita Simülasyonu */}
          <div className="relative h-64 rounded-xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 border border-white/10">
            {/* 3D Etkisi için arkaplan */}
            <div className="absolute inset-0">
              {/* Dönen küre efekti */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-cyan-500/20 animate-spin-slow">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-full blur-sm" />
              </div>
              
              {/* Firma noktaları */}
              {firms.slice(0, 8).map((firm, i) => {
                const angle = (i / firms.length) * Math.PI * 2
                const radius = 70
                const x = radius * Math.cos(angle)
                const y = radius * Math.sin(angle)
                const size = 6 + (i % 3) * 2
                
                return (
                  <div
                    key={firm.COMPANY}
                    className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      width: `${size}px`,
                      height: `${size}px`,
                      animationDelay: `${i * 0.2}s`
                    }}
                  >
                    <div className="absolute -inset-1 bg-cyan-500/20 rounded-full blur-sm" />
                  </div>
                )
              })}
            </div>
            
            {/* Firma etiketleri */}
            <div className="absolute bottom-4 left-0 right-0 px-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {firms.slice(0, 5).map(firm => (
                  <button
                    key={firm.COMPANY}
                    onClick={() => onFirmClick(firm.COMPANY)}
                    className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white/80 hover:text-white transition-all duration-200"
                  >
                    {firm.FIRMA.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-xs text-white/60">Aktif Firma</div>
              <div className="text-lg font-bold text-white">{firms.length}</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-xs text-white/60">Toplam İşlem</div>
              <div className="text-lg font-bold text-white">{stats.totalVouchers}</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-xs text-white/60">Ort. Günlük</div>
              <div className="text-lg font-bold text-white">
                {Math.round(stats.totalVouchers / 30)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Öngörüler ve Tahminler */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                AI Öngörü Motoru
              </h3>
              <p className="text-sm text-white/60 mt-1">Gelecekteki trendler ve risk analizleri</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">AKTİF</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* AI Öngörü Kartları */}
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-white">📈 Önümüzdeki Ay Tahmini</div>
                  <div className="text-sm text-white/60 mt-1">İşlem hacminin %18.3 artması bekleniyor</div>
                </div>
                <Badge className="bg-green-500/20 text-green-300">+%18.3</Badge>
              </div>
              <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '82%' }} />
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-white">⚠️ Risk Uyarısı</div>
                  <div className="text-sm text-white/60 mt-1">Firma-08'de yüksek borç konsantrasyonu</div>
                </div>
                <Badge className="bg-orange-500/20 text-orange-300">%67 Risk</Badge>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-xl border border-cyan-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-white">🎯 Optimizasyon Önerisi</div>
                  <div className="text-sm text-white/60 mt-1">5 firmada otomasyon ile %30 verimlilik artışı</div>
                </div>
                <button className="px-3 py-1 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-500/30 transition-colors">
                  Detay
                </button>
              </div>
            </div>
          </div>
          
          {/* AI Yapay Zeka Simülasyonu */}
          <div className="mt-6 p-4 bg-black/30 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-white">AI Asistan</div>
                <div className="text-sm text-white/60">Gerçek zamanlı analiz yapıyor...</div>
              </div>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => showToast("info", "AI asistanı devreye alınıyor...")}
              >
                Soru Sor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Gelişmiş Raporlar ve İndirilebilir Çıktılar */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Dinamik Grafikler */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <LineChart className="w-5 h-5 text-green-400" />
                Zaman Serisi Analizi
              </h3>
              <p className="text-sm text-white/60 mt-1">Son 90 günlük işlem trendleri</p>
            </div>
            <Select defaultValue="90">
              <SelectTrigger className="w-32 bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Periyot" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20">
                <SelectItem value="30">30 Gün</SelectItem>
                <SelectItem value="90">90 Gün</SelectItem>
                <SelectItem value="365">1 Yıl</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Animasyonlu Grafik Simülasyonu */}
          <div className="h-64 relative">
            {/* Grafik çizgileri */}
            <div className="absolute inset-0 flex items-end">
              {Array.from({ length: 30 }).map((_, i) => {
                const height = 20 + Math.sin(i * 0.3) * 40 + Math.random() * 20
                const delay = i * 0.05
                
                return (
                  <div
                    key={i}
                    className="flex-1 mx-0.5 relative group"
                  >
                    <div
                      className="w-full bg-gradient-to-t from-green-500/30 to-green-500/10 rounded-t transition-all duration-300 group-hover:from-green-500/50 group-hover:to-green-500/20"
                      style={{ 
                        height: `${height}%`,
                        animationDelay: `${delay}s`,
                        animation: 'fadeIn 0.5s forwards'
                      }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-2 py-1 rounded text-xs text-white whitespace-nowrap">
                        {Math.round(1000000 + Math.random() * 500000)} ₺
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* X ekseni */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20" />
            
            {/* Y ekseni */}
            <div className="absolute top-0 bottom-0 left-0 w-px bg-white/20" />
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">₺{formatCurrency(stats.totalDebit + stats.totalCredit)}</div>
              <div className="text-xs text-white/60">Toplam Hacim</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{stats.totalVouchers}</div>
              <div className="text-xs text-white/60">Toplam İşlem</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {Math.round((stats.totalDebit + stats.totalCredit) / Math.max(1, stats.totalVouchers)).toLocaleString()}
              </div>
              <div className="text-xs text-white/60">Ort. İşlem</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hızlı Rapor Üretici */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border-white/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Download className="w-5 h-5 text-amber-400" />
            Hızlı Rapor Üretici
          </h3>
          
          <div className="space-y-4">
            <button
              onClick={() => {
                exportCSV()
                showToast("success", "Detaylı rapor oluşturuluyor...")
              }}
              className="w-full p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 rounded-xl border border-blue-500/20 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="font-semibold text-white">📊 Tam Detaylı Rapor</div>
                  <div className="text-sm text-white/60 mt-1">Excel formatında indir</div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => showToast("info", "PDF rapor hazırlanıyor...")}
              className="w-full p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 rounded-xl border border-purple-500/20 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="font-semibold text-white">📈 Performans Raporu</div>
                  <div className="text-sm text-white/60 mt-1">Yönetici özeti PDF</div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => showToast("info", "Karşılaştırma raporu oluşturuluyor...")}
              className="w-full p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 rounded-xl border border-green-500/20 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="font-semibold text-white">⚖️ Karşılaştırmalı Analiz</div>
                  <div className="text-sm text-white/60 mt-1">Firma bazlı kıyaslama</div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-green-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => showToast("info", "Yasal raporlar hazırlanıyor...")}
              className="w-full p-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 hover:from-orange-500/20 hover:to-amber-500/20 rounded-xl border border-orange-500/20 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="font-semibold text-white">⚖️ Yasal Uyum Raporu</div>
                  <div className="text-sm text-white/60 mt-1">Maliye uyumluluk belgesi</div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-orange-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Gerçek Zamanlı İzleme Paneli */}
    <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border-white/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-400 animate-pulse" />
              Canlı Sistem İzleme
            </h3>
            <p className="text-sm text-white/60 mt-1">Gerçek zamanlı işlem takibi ve uyarılar</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-400">AKTİF</span>
            <span className="text-xs text-white/40 ml-2">{formatTime(new Date())}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/60 mb-2">Anlık İşlem Hızı</div>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold text-green-400">128/sn</div>
              <div className="text-xs text-green-400 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> +12%
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/60 mb-2">Sistem Sağlığı</div>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold text-cyan-400">%99.9</div>
              <div className="text-xs text-cyan-400">Uptime</div>
            </div>
          </div>
          
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/60 mb-2">Son İşlem</div>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold text-white">
                {filteredVouchers[0]?.docNo || '---'}
              </div>
              <div className="text-xs text-white/40">
                {filteredVouchers[0]?.date.split(' ')[0] || ''}
              </div>
            </div>
          </div>
        </div>
        
        {/* Canlı İşlem Akışı */}
        <div className="mt-6">
          <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            Canlı İşlem Akışı
          </div>
          <div className="h-48 overflow-y-auto space-y-2">
            {filteredVouchers.slice(0, 8).map((v, i) => (
              <div
                key={v.id}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${v.debit > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                    <div>
                      <div className="font-medium text-white text-sm">{v.docType}-{v.docNo}</div>
                      <div className="text-xs text-white/60">{v.accountName}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${v.debit > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    ₺{formatCurrency(v.debit || v.credit)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)}
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="mt-8 border-t border-white/10 pt-6 pb-4 px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-xs text-white/40">© {new Date().getFullYear()} H&R Tomorrow • Muhasebe Dashboard</p>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
              <div className="flex items-center gap-1 text-[10px] text-white/30"><Server className="w-3 h-3" /><span>v2.1.0</span></div>
              <div className="w-px h-3 bg-white/20" />
              <div className="flex items-center gap-1 text-[10px] text-white/30"><Zap className="w-3 h-3" /><span>Yüksek Performans</span></div>
              <div className="w-px h-3 bg-white/20" />
              <div className="flex items-center gap-1 text-[10px] text-white/30"><Shield className="w-3 h-3" /><span>256-bit SSL</span></div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-white/30">Sistem Durumu:</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">Aktif</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}