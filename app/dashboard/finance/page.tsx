"use client"

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
} from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search, Download, RefreshCw, Building, FileText, BarChart3, Calendar,
  ArrowUpRight, ArrowDownRight, CheckCircle, AlertCircle, Clock, User,
  LogOut, ChevronRight, Database, Cpu, PieChart, Users, Server, Zap,
  Shield, X, Brain, Target, AlertTriangle, TrendingUp, LineChart,
  Activity, ChevronLeft, Layers, ShieldCheck, Settings, SlidersHorizontal,
  Timer, DollarSign, CreditCard, Wallet, TrendingDown, Gauge,
  ChevronUp, ChevronDown, Eye, Filter, MoreVertical,
  Banknote, Coins, Landmark, ChartColumnIncreasing, ChartColumnDecreasing,
  Percent, CircleDollarSign, Receipt, CalendarDays, TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon, ArrowRight, ExternalLink,
  Sparkles, Crown, Target as TargetIcon, PieChart as PieChartIcon,
  BarChart4, WalletCards, Gem, Flame, Rocket, Sparkle, Trophy, Medal,
  Bank, Briefcase, MapPin, Phone, Mail, Home,
  Award, Star, Heart, Globe, Cake, PhoneCall, Bell,
  HeartPulse, CheckSquare, XCircle, AlertOctagon, FileSpreadsheet,
  GitBranch, BarChart, Target as TargetIcon2, Users as UsersIcon,
  Database as DatabaseIcon, Cpu as CpuIcon,
} from "lucide-react"

/* ===========================
   Types & Constants
   =========================== */

type VoucherItem = {
  line: number
  accountType: string
  accountCode: string
  accountName: string
  description: string
  debit: number
  credit: number
  currency?: string
  homeCurrency?: string
  exchangeRate?: number
  dueDate?: string
  fiscalYear?: string
  fiscalPeriod?: string
  customerCode?: string
  customerName?: string
  vendorCode?: string
  vendorName?: string
}

type Voucher = {
  company: string
  voucherType: string
  voucherNo: string
  postDate: string
  createdAt?: string
  createdBy?: string
  totalDebit: number
  totalCredit: number
  currencySummary: Record<string, number>
  items: VoucherItem[]
  status: "BALANCED" | "UNBALANCED"
}

type AccountBalance = {
  company: string
  type: "Müşteri" | "Tedarikçi" | string
  accountType?: string
  code: string
  name: string
  level?: "ANA" | "ALT"
  balance: number
  balanceType: "Borç" | "Alacak" | string
}

type TopCari = {
  company: string
  type: "Müşteri" | "Tedarikçi"
  code: string
  name: string
  balance: number
  direction: "Alacak" | "Borç"
}

type DueTracking = {
  company: string
  type: string
  code: string
  name: string
  dueDate: string
  delay: number
  daysToDue: number
  openAmount: number
  status: string
  agingBucket: string
}

type LatestVoucher = {
  COMPANY: string
  FINDOCTYPE: string
  FINDOCNUM: string
  CREATEDAT: string
  CREATEDBY: string
  DEBIT: number
  CREDIT: number
}

type VoucherType = { DOCTYPE: string; STEXT: string }
type Firm = { COMPANY: string; FIRMA: string; PLANT?: string; TESIS?: string; TESISLER?: Array<{ PLANT: string; TESIS: string }> }
type TopAccount = { name: string; total: number; count: number; topFirmCode?: string; firmsCount?: number }

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
  { DOCTYPE: "EM", STEXT: "Enflasyon Muhasebesi Fişi" },
]

const ACCTYPE_LABELS: Record<string, string> = {
  C: "Müşteri",
  V: "Tedarikçi",
  G: "G/L",
  A: "Sabit Kıymet",
  P: "Personel",
  E: "Masraf",
}

const DEFAULT_DB = process.env.NEXT_PUBLIC_DEFAULT_DBNAME || "NAVLUNGO"

/* ===========================
   Helpers
   =========================== */

function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(v))

const formatDate = (iso?: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString("tr-TR")
}

const formatTime = (d: Date) =>
  d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

const netOf = (it: VoucherItem) => (it.debit || 0) - (it.credit || 0)
const isSameDay = (d1?: string, base?: Date) => {
  if (!d1) return false
  const dA = new Date(d1)
  const dB = base ?? new Date()
  return dA.getFullYear() === dB.getFullYear() && dA.getMonth() === dB.getMonth() && dA.getDate() === dB.getDate()
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

/* ===========================
   Component
   =========================== */

export default function FinanceDashboard() {
  const { user, logout, isAuthenticated } = useAuth()

  const [dbName, setDbName] = useState<string>("")
  const [hydrated, setHydrated] = useState(false)

  // Hydrate dbName from localStorage (if any) or default; later user.dbName can override.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("dbName")
      if (stored) setDbName(stored)
      else setDbName(DEFAULT_DB)
      setHydrated(true)
    }
  }, [])

  // If user has a dbName, prefer it (and persist); avoid double fetch by only updating when different.
  useEffect(() => {
    if (user?.dbName && user.dbName !== dbName) {
      setDbName(user.dbName)
      if (typeof window !== "undefined") window.localStorage.setItem("dbName", user.dbName)
    }
  }, [user?.dbName, dbName])

  const resolvedDbName = useMemo(
    () => dbName || user?.dbName || DEFAULT_DB,
    [dbName, user?.dbName]
  )

  const commonHeaders = useMemo(() => ({ "x-db-name": resolvedDbName }), [resolvedDbName])

  const withDbName = useCallback(
    (endpoint: string) => {
      const hasQuery = endpoint.includes("?")
      return `${endpoint}${hasQuery ? "&" : "?"}dbName=${encodeURIComponent(resolvedDbName)}`
    },
    [resolvedDbName]
  )

  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [voucherTypes, setVoucherTypes] = useState<VoucherType[]>([])
  const [firms, setFirms] = useState<Firm[]>([])
  const [mizanAccounts, setMizanAccounts] = useState<AccountBalance[]>([])
  const [accountStatus, setAccountStatus] = useState<AccountBalance[]>([])

  const [topCari, setTopCari] = useState<TopCari[]>([])
  const [dueTracking, setDueTracking] = useState<DueTracking[]>([])
  const [latestVouchers, setLatestVouchers] = useState<LatestVoucher[]>([])

  const [loading, setLoading] = useState({
    vouchers: true,
    types: true,
    firms: true,
    accounts: true,
    mizan: true,
    topCari: true,
    dueTracking: true,
    latestVouchers: true,
  })
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState({
    docType: "all",
    company: "all",
    search: "",
    dateRange: "120",
    acctype: "all",
    accountLevel: "all",
    balanceType: "all" as "all" | "debit" | "credit",
  })
  const debouncedSearch = useDebounced(filters.search, 250)

  const [advancedOpen, setAdvancedOpen] = useState(false)

  const [activeTab, setActiveTab] = useState<"overview" | "yonetim" | "reports" | "analysis" | "mizan" | "vouchers">("overview")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)

  const [showNotification, setShowNotification] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string }>({
    type: "success",
    message: "",
  })
  const notifTimerRef = useRef<number | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const fetchAbortRef = useRef<AbortController | null>(null)

  const showToast = useCallback((type: "success" | "error" | "info", message: string, duration = 3000) => {
    setNotification({ type, message })
    setShowNotification(true)
    if (notifTimerRef.current) window.clearTimeout(notifTimerRef.current)
    notifTimerRef.current = window.setTimeout(() => {
      setShowNotification(false)
      notifTimerRef.current = null
    }, duration)
  }, [])

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
    let arr = Array.from(map.values()).map(f => ({
      ...f,
      TESISLER: f.TESISLER && f.TESISLER.length > 0 ? f.TESISLER : [{ PLANT: "00", TESIS: "Merkez" }],
    }))
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

  const fetchJsonWithRetry = useCallback(
    async <T,>(url: string, init: RequestInit = {}, attempts = 2, backoff = 700): Promise<T> => {
      let lastErr: any
      for (let i = 0; i < attempts; i++) {
        try {
          const res = await fetch(url, init)
          if (!res.ok) {
            // Retry on 502/503/504
            if ([502, 503, 504].includes(res.status) && i + 1 < attempts) {
              await delay(backoff * (i + 1))
              continue
            }
            const text = await res.text()
            throw new Error(`HTTP ${res.status}: ${text || res.statusText}`)
          }
          return (await res.json()) as T
        } catch (err: any) {
          if (err?.name === "AbortError") throw err
          lastErr = err
          if (i + 1 < attempts) await delay(backoff * (i + 1))
        }
      }
      throw lastErr
    },
    []
  )

  const safeFetchJson = useCallback(
    async <T,>(url: string, init?: RequestInit, attempts = 2): Promise<T | null> => {
      try {
        return await fetchJsonWithRetry<T>(url, init, attempts)
      } catch (err: any) {
        if (err?.name !== "AbortError") console.error("fetch error", err)
        return null
      }
    },
    [fetchJsonWithRetry]
  )

  const fetchApiData = useCallback(
    async (endpoint: string, setter: Function, loadingKey: keyof typeof loading, notify = false, init?: RequestInit, attempts = 2) => {
      try {
        const json = await safeFetchJson<any>(withDbName(endpoint), {
          ...init,
          headers: { ...(init?.headers || {}), ...commonHeaders },
          signal: fetchAbortRef.current?.signal,
        }, attempts)

        if (json === null) {
          setter([])
          if (notify) showToast("error", `${endpoint} verisi alınamadı`)
          return
        }

        setter(json.data ?? json ?? [])
        if (notify) showToast("success", `${endpoint} verisi güncellendi`)
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error(`${endpoint} fetch error:`, err)
          if (notify) showToast("error", `${endpoint}: ${err.message}`)
          setter([])
        }
      } finally {
        setLoading(prev => ({ ...prev, [loadingKey]: false }))
      }
    },
    [commonHeaders, showToast, safeFetchJson, withDbName]
  )

  const fetchTopCari = useCallback(async () => {
    try {
      const json: any = await safeFetchJson(withDbName("/api/top10-cari"), {
        signal: fetchAbortRef.current?.signal,
        headers: { ...commonHeaders },
      })
      if (!json) {
        setTopCari([])
        return
      }
      const customers = json?.data?.customers || []
      const vendors = json?.data?.vendors || []
      const merged: TopCari[] = [...customers, ...vendors].map((r: any) => ({
        company: r.company,
        type: r.type,
        code: r.code,
        name: r.name,
        balance: r.balance,
        direction: r.direction,
      }))
      setTopCari(merged)
    } catch (err: any) {
      if (err?.name !== "AbortError") console.error("top10-cari fetch error:", err)
      setTopCari([])
    } finally {
      setLoading(prev => ({ ...prev, topCari: false }))
    }
  }, [commonHeaders, safeFetchJson, withDbName])

  const fetchAllData = useCallback(
    async (notify = false) => {
      if (!resolvedDbName || !hydrated) return

      if (fetchAbortRef.current) fetchAbortRef.current.abort()
      const controller = new AbortController()
      fetchAbortRef.current = controller

      try {
        setError(null)
        setLoading({
          vouchers: true,
          types: true,
          firms: true,
          accounts: true,
          mizan: true,
          topCari: true,
          dueTracking: true,
          latestVouchers: true,
        })
        setIsRefreshing(true)

        const vJson = await safeFetchJson<{ data: Voucher[] }>(withDbName("/api/vouchers"), {
          signal: controller.signal,
          headers: { ...commonHeaders },
        }, 1) // vouchers already heavy; single attempt
        setVouchers(vJson?.data || [])
        setLoading(prev => ({ ...prev, vouchers: false }))

        const tJson = await safeFetchJson<{ data: VoucherType[] }>(withDbName("/api/voucher-types"), {
          signal: controller.signal,
          headers: { ...commonHeaders },
        })
        const mergedTypes: VoucherType[] = ALL_VOUCHER_TYPES.map(t => {
          const api = (tJson?.data || []).find((a: any) => a.DOCTYPE === t.DOCTYPE)
          return api ? { DOCTYPE: api.DOCTYPE, STEXT: api.STEXT || t.STEXT } : t
        })
        ;(tJson?.data || []).forEach((api: any) => {
          if (!mergedTypes.find(m => m.DOCTYPE === api.DOCTYPE)) mergedTypes.push({ DOCTYPE: api.DOCTYPE, STEXT: api.STEXT })
        })
        setVoucherTypes(mergedTypes)
        setLoading(prev => ({ ...prev, types: false }))

        const fJson = await safeFetchJson<{ data: any[] }>(withDbName("/api/firms"), {
          signal: controller.signal,
          headers: { ...commonHeaders },
        })
        const processedFirms = processFirms(fJson?.data || [])
        setFirms(processedFirms)
        setLoading(prev => ({ ...prev, firms: false }))

        await fetchApiData("/api/accounts/active", setAccountStatus, "accounts", false, { headers: { ...commonHeaders } }, 2)
        await fetchApiData("/api/mizan", setMizanAccounts, "mizan", false, { headers: { ...commonHeaders } }, 2)

        await Promise.all([
          fetchTopCari(),
          fetchApiData("/api/due-tracking", setDueTracking, "dueTracking", false, { headers: { ...commonHeaders } }, 2),
          fetchApiData("/api/vouchers/latest", setLatestVouchers, "latestVouchers", false, { headers: { ...commonHeaders } }, 2),
        ])

        const now = new Date()
        setLastRefreshTime(now)
        setRefreshCount(c => c + 1)
        if (notify) showToast("success", `Tüm veriler güncellendi! (${formatTime(now)})`)
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setError(err?.message || String(err))
          setLoading({
            vouchers: false,
            types: false,
            firms: false,
            accounts: false,
            mizan: false,
            topCari: false,
            dueTracking: false,
            latestVouchers: false,
          })
          if (notify) showToast("error", `Hata: ${err?.message || String(err)}`)
        }
      } finally {
        setIsRefreshing(false)
        fetchAbortRef.current = null
      }
    },
    [commonHeaders, hydrated, processFirms, showToast, fetchApiData, fetchTopCari, safeFetchJson, withDbName, resolvedDbName]
  )

  useEffect(() => {
    if (!hydrated) return
    fetchAllData(true)
    return () => {
      if (fetchAbortRef.current) fetchAbortRef.current.abort()
      if (notifTimerRef.current) window.clearTimeout(notifTimerRef.current)
    }
  }, [fetchAllData, hydrated])

  /* ===========================
     Derived data
   =========================== */

  const today = useMemo(() => new Date(), [])

  const filteredVouchers = useMemo(() => {
    const list = vouchers.filter(v => {
      if (filters.docType !== "all" && v.voucherType !== filters.docType) return false
      if (filters.company !== "all" && v.company !== filters.company) return false

      if (filters.dateRange !== "all" && v.postDate) {
        const days = Number(filters.dateRange)
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)
        if (new Date(v.postDate) < cutoff) return false
      }

      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase()
        const hitHeader =
          v.voucherNo.toLowerCase().includes(s) ||
          v.createdBy?.toLowerCase().includes(s) ||
          v.voucherType.toLowerCase().includes(s)
        const hitItems = v.items.some(it =>
          it.accountName.toLowerCase().includes(s) ||
          it.accountCode.toLowerCase().includes(s) ||
          it.description.toLowerCase().includes(s) ||
          (it.customerName || "").toLowerCase().includes(s) ||
          (it.vendorName || "").toLowerCase().includes(s)
        )
        if (!hitHeader && !hitItems) return false
      }

      return true
    })
    return [...list].sort((a, b) => {
      const ta = a.createdAt ? +new Date(a.createdAt) : +new Date(a.postDate)
      const tb = b.createdAt ? +new Date(b.createdAt) : +new Date(b.postDate)
      const t = tb - ta
      if (t !== 0) return t
      return b.voucherNo.localeCompare(a.voucherNo)
    })
  }, [vouchers, filters, debouncedSearch])

  const filteredAccounts = useMemo(() => {
    return mizanAccounts.filter(a => {
      const derivedType = a.accountType || (a.type === "Müşteri" ? "C" : a.type === "Tedarikçi" ? "V" : undefined)
      if (filters.company !== "all" && a.company !== filters.company) return false
      if (filters.acctype !== "all" && derivedType !== filters.acctype) return false
      if (filters.accountLevel !== "all" && (a.level || "ANA") !== filters.accountLevel) return false

      const isDebit = a.balanceType === "Borç"
      const abs = Math.abs(a.balance)
      if (filters.balanceType === "debit" && !isDebit) return false
      if (filters.balanceType === "credit" && isDebit) return false

      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase()
        if (
          !a.code.toLowerCase().includes(s) &&
          !a.name.toLowerCase().includes(s) &&
          !(a.type || "").toLowerCase().includes(s)
        )
          return false
      }
      return abs > 0
    })
  }, [mizanAccounts, filters, debouncedSearch])

  const filteredTopCari = useMemo(() => {
    return topCari.filter(item => {
      if (filters.company !== "all" && item.company !== filters.company) return false
      if (filters.acctype !== "all") {
        const typeCode = item.type === "Müşteri" ? "C" : item.type === "Tedarikçi" ? "V" : item.type
        if (typeCode !== filters.acctype) return false
      }
      if (filters.balanceType !== "all") {
        if (filters.balanceType === "debit" && item.direction !== "Borç") return false
        if (filters.balanceType === "credit" && item.direction !== "Alacak") return false
      }
      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase()
        if (!item.name.toLowerCase().includes(s) && !item.code.toLowerCase().includes(s)) return false
      }
      return true
    })
  }, [topCari, filters, debouncedSearch])

  const filteredDueTracking = useMemo(() => {
    return dueTracking.filter(item => {
      if (filters.company !== "all" && item.company !== filters.company) return false
      if (filters.acctype !== "all") {
        const typeCode = item.type === "Müşteri" ? "C" : item.type === "Tedarikçi" ? "V" : null
        if (typeCode !== filters.acctype) return false
      }
      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase()
        if (!item.name.toLowerCase().includes(s) && !item.code.toLowerCase().includes(s)) return false
      }
      return true
    })
  }, [dueTracking, filters, debouncedSearch])

  const dueSoonCutoff = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d
  }, [])

  const dueBuckets = useMemo(() => {
    const overdue: VoucherItem[] = []
    const dueSoon: VoucherItem[] = []
    filteredVouchers.forEach(v => {
      v.items.forEach(it => {
        if (!it.dueDate) return
        const net = netOf(it)
        if (Math.abs(net) < 0.01) return
        const d = new Date(it.dueDate)
        if (d < today) overdue.push(it)
        else if (d <= dueSoonCutoff) dueSoon.push(it)
      })
    })
    return { overdue, dueSoon }
  }, [filteredVouchers, today, dueSoonCutoff])

  const kpiDueSoonTotal = useMemo(() => dueBuckets.dueSoon.reduce((s, it) => s + Math.abs(netOf(it)), 0), [dueBuckets.dueSoon])
  const kpiOverdueTotal = useMemo(() => dueBuckets.overdue.reduce((s, it) => s + Math.abs(netOf(it)), 0), [dueBuckets.overdue])
  const kpiRiskTotal = kpiDueSoonTotal + kpiOverdueTotal

  const dueTrackingKpis = useMemo(() => {
    const now = new Date()
    const dueSoonItems = filteredDueTracking.filter(item => {
      const dueDate = new Date(item.dueDate)
      return dueDate > now && dueDate <= dueSoonCutoff
    })
    const overdueItems = filteredDueTracking.filter(item => {
      const dueDate = new Date(item.dueDate)
      return dueDate <= now
    })

    return {
      dueSoonTotal: dueSoonItems.reduce((sum, item) => sum + item.openAmount, 0),
      overdueTotal: overdueItems.reduce((sum, item) => sum + item.openAmount, 0),
      dueSoonCount: dueSoonItems.length,
      overdueCount: overdueItems.length,
    }
  }, [filteredDueTracking, dueSoonCutoff])

  const stats = useMemo(() => {
    const totalDebit = filteredVouchers.reduce((s, v) => s + v.totalDebit, 0)
    const totalCredit = filteredVouchers.reduce((s, v) => s + v.totalCredit, 0)
    const balance = Math.abs(totalCredit - totalDebit)
    const balanceType = totalCredit > totalDebit ? "Alacak Bakiyesi" : "Borç Bakiyesi"

    const voucherByType = filteredVouchers.reduce((acc: Record<string, number>, v) => {
      acc[v.voucherType] = (acc[v.voucherType] || 0) + 1
      return acc
    }, {})

    const voucherByCompany = filteredVouchers.reduce((acc: Record<string, number>, v) => {
      acc[v.company] = (acc[v.company] || 0) + 1
      return acc
    }, {})

    const createdByMap = filteredVouchers.reduce((acc: Record<string, number>, v) => {
      const k = v.createdBy || "unknown"
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})

    const accountMap = filteredVouchers.reduce(
      (acc: Record<string, { total: number; count: number; firms: Record<string, number> }>, v) => {
        v.items.forEach(it => {
          if (!it.accountName) return
          if (!acc[it.accountName]) acc[it.accountName] = { total: 0, count: 0, firms: {} }
          const amount = it.debit + it.credit
          acc[it.accountName].total += amount
          acc[it.accountName].count += 1
          acc[it.accountName].firms[v.company] = (acc[it.accountName].firms[v.company] || 0) + amount
        })
        return acc
      },
      {}
    )

    const topAccounts: TopAccount[] = Object.entries(accountMap)
      .map(([name, d]) => {
        const firmsEntries = Object.entries(d.firms)
        const topFirmEntry = firmsEntries.length ? firmsEntries.sort(([, a], [, b]) => b - a)[0] : undefined
        return {
          name,
          total: d.total,
          count: d.count,
          topFirmCode: topFirmEntry?.[0],
          firmsCount: firmsEntries.length,
        }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)

    const mizanCV = mizanAccounts.filter(a => {
      const t = a.accountType || (a.type === "Müşteri" ? "C" : a.type === "Tedarikçi" ? "V" : "")
      return (t === "C" || t === "V") && Math.abs(a.balance) > 0
    })

    const totalMizanDebit = mizanCV.filter(a => a.balanceType === "Borç").reduce((s, a) => s + Math.abs(a.balance), 0)
    const totalMizanCredit = mizanCV.filter(a => a.balanceType !== "Borç").reduce((s, a) => s + Math.abs(a.balance), 0)

    const balancedCount = filteredVouchers.filter(v => v.status === "BALANCED").length
    const unbalancedCount = filteredVouchers.length - balancedCount

    const totalCariDebit = filteredTopCari.filter(c => c.direction === "Borç").reduce((sum, c) => sum + Math.abs(c.balance), 0)
    const totalCariCredit = filteredTopCari.filter(c => c.direction === "Alacak").reduce((sum, c) => sum + Math.abs(c.balance), 0)
    const totalDueAmount = filteredDueTracking.reduce((sum, item) => sum + item.openAmount, 0)

    return {
      totalDebit,
      totalCredit,
      balance,
      balanceType,
      totalVouchers: filteredVouchers.length,
      totalFirms: firms.length,
      voucherByType,
      voucherByCompany,
      createdByMap,
      topAccounts,
      totalMizanDebit,
      totalMizanCredit,
      balancedCount,
      unbalancedCount,
      totalCariDebit,
      totalCariCredit,
      totalDueAmount,
      totalCariCount: filteredTopCari.length,
      totalDueItems: filteredDueTracking.length,
    }
  }, [filteredVouchers, filteredTopCari, filteredDueTracking, firms.length, mizanAccounts])

  const createdByCounts = useMemo(
    () => Object.entries(stats.createdByMap).map(([user, count]) => ({ user, count })).sort((a, b) => b.count - a.count),
    [stats.createdByMap]
  )

  const getFirmName = useCallback((companyCode: string) => firms.find(f => f.COMPANY === companyCode)?.FIRMA || `Firma ${companyCode}`, [firms])
  const getVoucherTypeName = useCallback((typeCode: string) => voucherTypes.find(t => t.DOCTYPE === typeCode)?.STEXT || typeCode, [voucherTypes])

  const exportCSV = useCallback(() => {
    if (!filteredVouchers.length) {
      showToast("info", "İhraç edilecek veri yok.")
      return
    }
    const headers = [
      "company",
      "voucherType",
      "voucherNo",
      "postDate",
      "createdAt",
      "createdBy",
      "line",
      "accountType",
      "accountCode",
      "accountName",
      "description",
      "debit",
      "credit",
      "currency",
      "homeCurrency",
      "exchangeRate",
      "dueDate",
      "fiscalYear",
      "fiscalPeriod",
      "customerCode",
      "customerName",
      "vendorCode",
      "vendorName",
    ]
    const rows: string[] = []
    filteredVouchers.forEach(v => {
      v.items.forEach(it => {
        rows.push(
          headers
            .map(h =>
              JSON.stringify(
                (({
                  company: v.company,
                  voucherType: v.voucherType,
                  voucherNo: v.voucherNo,
                  postDate: v.postDate,
                  createdAt: v.createdAt || "",
                  createdBy: v.createdBy || "",
                  line: it.line,
                  accountType: it.accountType,
                  accountCode: it.accountCode,
                  accountName: it.accountName,
                  description: it.description,
                  debit: it.debit,
                  credit: it.credit,
                  currency: it.currency || "",
                  homeCurrency: it.homeCurrency || "",
                  exchangeRate: it.exchangeRate ?? "",
                  dueDate: it.dueDate || "",
                  fiscalYear: it.fiscalYear || "",
                  fiscalPeriod: it.fiscalPeriod || "",
                  customerCode: it.customerCode || "",
                  customerName: it.customerName || "",
                  vendorCode: it.vendorCode || "",
                  vendorName: it.vendorName || "",
                } as any)[h] ?? "")
              )
            )
            .join(",")
        )
      })
    })
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

  const pagedVouchers = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredVouchers.slice(start, start + pageSize)
  }, [filteredVouchers, page, pageSize])

  const todayVouchers = useMemo(() => filteredVouchers.filter(v => isSameDay(v.createdAt, today)), [filteredVouchers, today])

  const activeAdvancedCount = useMemo(() => {
    let c = 0
    if (filters.docType !== "all") c++
    if (filters.acctype !== "all") c++
    if (filters.accountLevel !== "all") c++
    if (filters.balanceType !== "all") c++
    return c
  }, [filters.docType, filters.acctype, filters.accountLevel, filters.balanceType])

  const isLoading = useMemo(() => Object.values(loading).some(v => v === true), [loading])

  const TooltipLate = () => (
    <span title="Geç girilmiş (CREATEDAT > POSTDATE)" className="text-amber-300">
      ⏰
    </span>
  )
  /* ===========================
     UI Components
   =========================== */

  const LoadingScreen = () => (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-300" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        <div className="relative">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-spin" />
            <div className="absolute inset-4 border-4 border-cyan-500/40 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "3s" }} />
            <div className="absolute inset-8 border-4 border-indigo-500/50 rounded-full animate-spin" style={{ animationDuration: "2s" }} />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <Brain className="w-16 h-16 text-blue-400 animate-pulse" />
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-xl opacity-30 animate-ping" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative text-center mt-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent mb-2 animate-pulse">
            Finans Dashboard Yükleniyor
          </h2>
          <p className="text-white/60 mb-4">Veriler analiz ediliyor...</p>

          <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden mx-auto mb-4">
            <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 rounded-full animate-pulse" style={{ width: "75%" }} />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{vouchers.length}</div>
              <div className="text-xs text-white/60">Fiş</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{formatCurrency(stats.totalDebit + stats.totalCredit)}</div>
              <div className="text-xs text-white/60">Hacim</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{firms.length}</div>
              <div className="text-xs text-white/60">Firma</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const DataRefreshOverlay = ({ open, message, progress = 65 }: { open: boolean; message?: string; progress?: number }) => (
    <div
      className={`fixed top-16 right-4 z-[999] w-[320px] bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-4 space-y-2 transition-all duration-200 ${
        open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 border-[3px] border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <Cpu className="w-5 h-5 text-cyan-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">{message || "Finans verileri işleniyor..."}</p>
          <p className="text-xs text-white/60">Paneller güncelleniyor</p>
          <div className="w-full mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  )

  const Sidebar = () => (
    <aside className="sticky top-0 lg:top-4 h-fit space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-white font-semibold">Finans Dashboard</div>
          <div className="text-xs text-white/60">Finans & Muhasebe Analizi</div>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { id: "overview", label: "Genel Bakış", icon: Building, color: "from-blue-500 to-cyan-500" },
          { id: "yonetim", label: "Yönetim Analizi", icon: Target, color: "from-emerald-500 to-green-500" },
          { id: "reports", label: "Raporlar", icon: PieChart, color: "from-amber-500 to-orange-500" },
          { id: "analysis", label: "Analitik", icon: BarChart3, color: "from-indigo-500 to-purple-500" },
          { id: "mizan", label: "Mizan", icon: Layers, color: "from-fuchsia-500 to-pink-500" },
          { id: "vouchers", label: "Fiş Listesi", icon: FileText, color: "from-purple-500 to-violet-500" },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all bg-gradient-to-r ${item.color} ${
              activeTab === item.id
                ? "text-white shadow-lg ring-2 ring-white/40"
                : "text-white/70 hover:text-white opacity-80 hover:opacity-100"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>
    </aside>
  )

  const DonutChart = ({ segments, size = 160, thickness = 20, centerLabel }: { segments: { label: string; value: number; color: string }[]; size?: number; thickness?: number; centerLabel?: string }) => {
    const total = Math.max(1, segments.reduce((s, seg) => s + seg.value, 0))
    let current = 0
    const gradient = segments
      .map(seg => {
        const start = (current / total) * 360
        const end = ((current + seg.value) / total) * 360
        current += seg.value
        return `${seg.color} ${start}deg ${end}deg`
      })
      .join(", ")
    return (
      <div className="flex flex-col gap-3">
        <div className="relative mx-auto" style={{ width: size, height: size }}>
          <div
            className="rounded-full"
            style={{
              width: size,
              height: size,
              background: `conic-gradient(${gradient})`,
            }}
          />
          <div
            className="absolute inset-0 m-auto rounded-full bg-slate-900/90 flex items-center justify-center border border-white/10"
            style={{ width: size - thickness * 2, height: size - thickness * 2 }}
          >
            <div className="text-center">
              <div className="text-[11px] text-white/60">Toplam</div>
              <div className="text-base font-semibold text-white">{centerLabel ?? total}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {segments.map(seg => (
            <div key={seg.label} className="flex items-center gap-2 text-white/80">
              <span className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
              <span className="truncate">{seg.label}</span>
              <span className="text-white/60 ml-auto text-[10px]">{seg.value} • {Math.round((seg.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const HeadlineCards = () => {
    const totalHacim = stats.totalDebit + stats.totalCredit
    const totalRisk = kpiRiskTotal + dueTrackingKpis.overdueTotal
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            title: "Toplam Hacim",
            value: `₺${formatCurrency(totalHacim)}`,
            sub: `Borç ₺${formatCurrency(stats.totalDebit)} • Alacak ₺${formatCurrency(stats.totalCredit)}`,
            icon: <DollarSign className="w-4 h-4" />,
            color: "from-emerald-500/20 to-green-500/20",
            trend: "up",
          },
          {
            title: "Cari Toplam",
            value: `₺${formatCurrency(stats.totalCariDebit + stats.totalCariCredit)}`,
            sub: `${stats.totalCariCount} kayıt`,
            icon: <Users className="w-4 h-4" />,
            color: "from-blue-500/20 to-cyan-500/20",
            trend: stats.totalCariDebit + stats.totalCariCredit > 0 ? "up" : "down",
          },
          {
            title: "Vade Risk",
            value: `₺${formatCurrency(totalRisk)}`,
            sub: `${dueTrackingKpis.overdueCount + dueTrackingKpis.dueSoonCount} kayıt`,
            icon: <AlertTriangle className="w-4 h-4" />,
            color: "from-amber-500/20 to-orange-500/20",
            trend: "up",
          },
          {
            title: "Firma / Fiş",
            value: `${firms.length} Firma`,
            sub: `${stats.totalVouchers} fiş`,
            icon: <Building className="w-4 h-4" />,
            color: "from-purple-500/20 to-pink-500/20",
            trend: "up",
          },
        ].map(card => (
          <Card key={card.title} className={`bg-gradient-to-br ${card.color} border-white/10 backdrop-blur-xl`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/80 font-semibold">
                  <div className="p-2 rounded-lg bg-white/10">{card.icon}</div>
                  {card.title}
                </div>
                <div className={`p-1 rounded ${card.trend === "up" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                  {card.trend === "up" ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
                </div>
              </div>
              <div className="text-2xl font-bold text-white mt-2">{card.value}</div>
              <div className="text-xs text-white/60 mt-1">{card.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const RadialStat = ({ value, total, label, accent }: { value: number; total: number; label: string; accent: string }) => {
    const pct = total ? Math.min(100, Math.round((value / total) * 100)) : 0
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="relative w-14 h-14">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(${accent} ${pct}%, rgba(255,255,255,0.08) ${pct}%)`,
            }}
          />
          <div className="absolute inset-2 rounded-full bg-slate-900/80 flex items-center justify-center text-white font-semibold text-sm">
            {value}
          </div>
        </div>
        <div>
          <div className="text-white font-semibold">{label}</div>
          <div className="text-xs text-white/60">%{pct}</div>
        </div>
      </div>
    )
  }

  const SimpleBar = ({ label, count, perc, color }: { label: string; count: number; perc: number; color: string }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-white/70">
        <span>{label}</span>
        <span className="text-white font-medium">{count} ({perc}%)</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${perc}%`, background: color }} />
      </div>
    </div>
  )

  const EnhancedTopCari = () => {
    const customerCredit = filteredTopCari.filter(c => c.type === "Müşteri" && c.direction === "Alacak")
    const vendorDebit = filteredTopCari.filter(c => c.type === "Tedarikçi" && c.direction === "Borç")

    const blocks = [
      { title: "Müşteri (C) - Alacaklı", data: customerCredit, color: "emerald" },
      { title: "Tedarikçi (V) - Borçlu", data: vendorDebit, color: "red" },
    ] as const

    return (
      <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-white/10 backdrop-blur-xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-300" />
              <h3 className="text-lg font-semibold text-white">Top 10 Cari (Müşteri Alacaklı / Tedarikçi Borçlu)</h3>
            </div>
            <div className="flex gap-2 text-[11px] text-white/60">
              <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30">Müşteri Alacak: ₺{formatCurrency(stats.totalCariCredit)}</Badge>
              <Badge className="bg-red-500/20 text-red-200 border-red-500/30">Tedarikçi Borç: ₺{formatCurrency(stats.totalCariDebit)}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {blocks.map(block => (
              <div key={block.title} className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                <div className="text-xs text-white/60 mb-2">{block.title}</div>
                <div className="space-y-2">
                  {block.data.slice(0, 10).map((acc, idx) => (
                    <div
                      key={`${acc.company}-${acc.type}-${acc.code}-${idx}`}
                      className="p-2 bg-white/5 rounded border border-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span className="truncate" title={acc.name}>
                          {acc.name}
                        </span>
                        <span>{acc.company || ""}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-[11px] text-white/50 truncate">{acc.code}</div>
                        <div className={`${block.color === "red" ? "text-red-300" : "text-emerald-300"} text-sm font-semibold`}>
                          ₺{formatCurrency(Math.abs(acc.balance))}
                        </div>
                      </div>
                      <div className="mt-1">
                        <Badge className={`${block.color === "red" ? "bg-red-500/15" : "bg-emerald-500/15"} text-white/80 border-transparent text-[10px]`}>
                          {block.color === "red" ? "Borç" : "Alacak"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {block.data.length === 0 && <div className="text-xs text-white/60 text-center py-4">Kayıt yok.</div>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const EnhancedDueTracking = () => {
    const overdueItems = filteredDueTracking.filter(item => item.status === "Gecikmiş")
    const dueSoonItems = filteredDueTracking.filter(item => item.status !== "Gecikmiş" && item.daysToDue <= 7 && item.daysToDue > 0)
    const todayItems = filteredDueTracking.filter(item => item.status === "Bugün")

    const blocks = [
      { title: "Gecikmiş", data: overdueItems, color: "red", icon: AlertTriangle },
      { title: "Bugün", data: todayItems, color: "amber", icon: Clock },
      { title: "Yaklaşan (≤7g)", data: dueSoonItems, color: "emerald", icon: Calendar },
    ] as const

    return (
      <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-white/10 backdrop-blur-xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Vade Takibi
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {blocks.map(block => {
              const total = block.data.reduce((sum, item) => sum + item.openAmount, 0)
              return (
                <div key={block.title} className="p-3 bg-white/5 rounded-lg border border-white/10 max-h-[360px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white text-sm flex items-center gap-2">
                      <block.icon className={`w-4 h-4 text-${block.color}-400`} />
                      {block.title}
                    </span>
                    <Badge className={`border bg-${block.color}-500/15 text-${block.color}-200 border-${block.color}-500/30`}>{block.data.length}</Badge>
                  </div>
                  <div className="text-xs text-white/60 mb-2">
                    Toplam: <span className={`text-${block.color}-200 font-semibold`}>₺{formatCurrency(total)}</span>
                  </div>
                  <div className="space-y-2">
                    {block.data.slice(0, 10).map((item, idx) => (
                      <div
                        key={`${item.company}-${item.type}-${item.code}-${item.dueDate}-${idx}`}
                        className="p-2 bg-white/5 rounded border border-white/5"
                      >
                        <div className="flex justify-between text-xs text-white/60 mb-1">
                          <span className="truncate" title={item.name}>
                            {item.name}
                          </span>
                          <span>{formatDate(item.dueDate)}</span>
                        </div>
                        <div className="text-xs text-white/50 truncate">
                          {item.code} ({item.type})
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-white/60">{item.company}</span>
                          <span className={`text-${block.color}-300 font-semibold`}>₺{formatCurrency(item.openAmount)}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-white/60">
                          {item.agingBucket} • {Math.abs(item.delay)} gün
                        </div>
                      </div>
                    ))}
                    {block.data.length === 0 && <div className="text-xs text-white/60 text-center py-4">Kayıt yok</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  const EnhancedLatestVouchers = () => (
    <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-white/10 backdrop-blur-xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Son 100 Fiş
          </h3>
          <Badge className="bg-white/10 text-white/80 border-white/20">{latestVouchers.length} kayıt</Badge>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {latestVouchers.map((v, idx) => (
            <div key={`${v.COMPANY}-${v.FINDOCTYPE}-${v.FINDOCNUM}-${idx}`} className="p-3 hover:bg-white/5 rounded-lg transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white text-sm">
                    {v.FINDOCTYPE}-{v.FINDOCNUM}
                  </div>
                  <div className="text-xs text-white/60">
                    {getFirmName(v.COMPANY)} • {v.CREATEDBY}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-emerald-400">₺{formatCurrency(v.DEBIT || v.CREDIT)}</div>
                  <div className="text-xs text-cyan-400">{formatDate(v.CREATEDAT)}</div>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <Badge className="bg-red-500/15 text-red-200 border-red-500/30 text-[11px]">Borç: ₺{formatCurrency(v.DEBIT)}</Badge>
                <Badge className="bg-emerald-500/15 text-emerald-200 border-emerald-500/30 text-[11px]">Alacak: ₺{formatCurrency(v.CREDIT)}</Badge>
              </div>
            </div>
          ))}
          {latestVouchers.length === 0 && <div className="text-sm text-white/40 text-center py-4">Veri yok</div>}
        </div>
      </CardContent>
    </Card>
  )

  const MizanView = () => {
    const topDebit = [...filteredAccounts].filter(a => a.balanceType === "Borç").sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
    const topCredit = [...filteredAccounts].filter(a => a.balanceType === "Alacak").sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))

    const renderList = (data: AccountBalance[], color: "red" | "emerald") => (
      <div className="space-y-2">
        {data.map((acc, idx) => {
          const typeLabel = acc.accountType === "C" || acc.type === "Müşteri" ? "C" : acc.accountType === "V" || acc.type === "Tedarikçi" ? "V" : ""
          return (
            <div key={`${acc.company}-${acc.code}-${acc.balance}-${idx}`} className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition">
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate" title={acc.name}>{acc.name}</div>
                  <div className="text-[11px] text-white/60 truncate">{acc.code} • {acc.company}{typeLabel ? ` • ${typeLabel}` : ""}</div>
                </div>
                <div className={`text-sm font-bold ${color === "red" ? "text-red-300" : "text-emerald-300"}`}>₺{formatCurrency(Math.abs(acc.balance))}</div>
              </div>
            </div>
          )
        })}
        {data.length === 0 && <div className="text-xs text-white/50">Kayıt yok.</div>}
      </div>
    )

    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-indigo-600/20 via-cyan-500/10 to-purple-600/20 border border-white/20 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs">
                  <Gauge className="w-4 h-4 text-cyan-300" /> Mizan Özeti (C / V)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/15">
                    <div className="text-[11px] text-white/60">Borç</div>
                    <div className="text-lg font-bold text-red-300 leading-tight">₺{formatCurrency(stats.totalMizanDebit)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/15">
                    <div className="text-[11px] text-white/60">Alacak</div>
                    <div className="text-lg font-bold text-emerald-300 leading-tight">₺{formatCurrency(stats.totalMizanCredit)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/15">
                    <div className="text-[11px] text-white/60">Net</div>
                    <div className="text-lg font-bold text-white leading-tight">
                      ₺{formatCurrency(Math.abs(stats.totalMizanDebit - stats.totalMizanCredit))}{" "}
                      {stats.totalMizanDebit >= stats.totalMizanCredit ? "Borç" : "Alacak"}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/15">
                    <div className="text-[11px] text-white/60">Hesap Adedi</div>
                    <div className="text-lg font-bold text-white leading-tight">{filteredAccounts.length}</div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-[360px] bg-white/5 rounded-2xl border border-white/15 p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-300" /> C / V Dağılımı
                  </div>
                  <Badge className="bg-white/10 text-white/80 border-white/20">{filteredAccounts.length} hesap</Badge>
                </div>
                <div className="space-y-2 text-sm text-white/80">
                  {["C", "V"].map(code => {
                    const count = filteredAccounts.filter(a => (a.accountType || (a.type === "Müşteri" ? "C" : "V")) === code).length
                    const total = filteredAccounts
                      .filter(a => (a.accountType || (a.type === "Müşteri" ? "C" : "V")) === code)
                      .reduce((s, a) => s + Math.abs(a.balance), 0)
                    return (
                      <div key={code} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-white/10 text-white/80 border-white/20">{code}</Badge>
                          <span className="text-white/70">{ACCTYPE_LABELS[code]}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold text-sm">₺{formatCurrency(total)}</div>
                          <div className="text-[11px] text-white/50">{count} hesap</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4 text-red-200" /> Borçlu Hesaplar
                  </div>
                </div>
                {renderList(topDebit, "red")}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-emerald-200" /> Alacaklı Hesaplar
                  </div>
                </div>
                {renderList(topCredit, "emerald")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const YonetimView = () => {
    const toplamHacim = stats.totalDebit + stats.totalCredit
    const likiditeAciligi = stats.totalMizanDebit - stats.totalMizanCredit
    const risk = kpiRiskTotal + dueTrackingKpis.overdueTotal
    const tahsilatPot = stats.totalCariCredit
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-800/80 border border-white/10 shadow-2xl">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-200" />
                <h3 className="text-xl font-semibold text-white">Yönetim İçgörü Panosu (CEO/CFO)</h3>
              </div>
              <Badge className="bg-white/10 text-white border-white/20">Güncel fotoğraf</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                {
                  title: "Kadro Nabzı",
                  value: `${firms.length} firma / ${stats.totalVouchers} fiş`,
                  sub: `Turnover risk: %${dueTrackingKpis.overdueCount > 0 ? "Yüksek" : "Düşük"}`,
                  color: "from-emerald-500/25 to-teal-500/25",
                  icon: Users,
                },
                {
                  title: "Ücret Nabzı",
                  value: formatCurrency(stats.avgSalary || 0),
                  sub: `Ort. fiş: ₺${formatCurrency(toplamHacim / Math.max(1, stats.totalVouchers))}`,
                  color: "from-amber-500/25 to-orange-500/25",
                  icon: DollarSign,
                },
                {
                  title: "Operasyon Yükü",
                  value: `${stats.totalVouchers} fiş`,
                  sub: "Bugün: " + todayVouchers.length,
                  color: "from-cyan-500/25 to-blue-500/25",
                  icon: Timer,
                },
                {
                  title: "Risk / Vade",
                  value: `₺${formatCurrency(risk)}`,
                  sub: `${dueTrackingKpis.overdueCount} geciken`,
                  color: "from-violet-500/25 to-fuchsia-500/25",
                  icon: Gauge,
                },
              ].map(card => (
                <div key={card.title} className={`p-4 rounded-xl border border-white/10 bg-gradient-to-br ${card.color} text-white/90`}>
                  <div className="flex items-center gap-2 text-sm font-semibold mb-1">
                    <card.icon className="w-4 h-4" />
                    {card.title}
                  </div>
                  <div className="text-2xl font-bold text-white">{card.value}</div>
                  <div className="text-xs text-white/70">{card.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-sm text-white font-semibold">Öne Çıkanlar</div>
                <ul className="text-sm text-white/80 space-y-1 list-disc pl-4">
                  <li>En büyük cari alacak: ₺{formatCurrency(stats.totalCariCredit)}</li>
                  <li>En büyük cari borç: ₺{formatCurrency(stats.totalCariDebit)}</li>
                  <li>Bugün girilen fiş: {todayVouchers.length}</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-sm text-white font-semibold">Risk & Radar</div>
                <ul className="text-sm text-white/80 space-y-1 list-disc pl-4">
                  <li>Geciken alacaklar: {dueTrackingKpis.overdueCount} kayıt, ₺{formatCurrency(dueTrackingKpis.overdueTotal)}</li>
                  <li>Yaklaşan vadeler: {dueTrackingKpis.dueSoonCount} kayıt, ₺{formatCurrency(dueTrackingKpis.dueSoonTotal)}</li>
                  <li>Toplam risk: ₺{formatCurrency(risk)}</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-sm text-white font-semibold">Sonraki 30 Gün Aksiyon</div>
                <ul className="text-sm text-white/80 space-y-1 list-disc pl-4">
                  <li>Vade takip raporu hazırlama</li>
                  <li>Cari borç/alacak dengesi analizi</li>
                  <li>Firma bazlı mizan taraması</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-white/10 text-white space-y-2">
              <div className="text-sm font-semibold">Kısa Yönetici Notu</div>
              <p className="text-sm text-white/80 leading-relaxed">
                Finansal durum dengeli, toplam hacim ₺{formatCurrency(toplamHacim)}. Cari alacaklar ₺{formatCurrency(stats.totalCariCredit)} seviyesinde,
                borçlar ₺{formatCurrency(stats.totalCariDebit)}. Risk seviyesi ₺{formatCurrency(risk)}. Operasyonel verimlilik yüksek,
                bugün {todayVouchers.length} fiş girildi.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const FilterBarComponent = () => {
    const [searchDraft, setSearchDraft] = useState(filters.search)
    const searchInputRef = useRef<HTMLInputElement>(null)

    const applySearch = () => {
      setFilters(prev => ({ ...prev, search: searchDraft.trim() }))
      setPage(1)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        applySearch()
      }
      if (e.key === "Escape") {
        setSearchDraft("")
        setFilters(prev => ({ ...prev, search: "" }))
      }
    }

    useEffect(() => {
      searchInputRef.current?.focus({ preventScroll: true })
    }, [])

    return (
      <Card className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl border-white/30 shadow-xl">
        <CardContent className="p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-3 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-800">Fiş no / hesap / müşteri ara</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700/70" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Örn: AA-12345, Müşteri Adı, Hesap Kodu"
                    value={searchDraft}
                    onKeyDown={handleKeyDown}
                    onChange={e => setSearchDraft(e.target.value)}
                    className="pl-9 pr-3 w-full bg-white/90 border-white/60 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-400 h-10 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onMouseDown={e => e.preventDefault()}
                  onClick={applySearch}
                  className="h-10 px-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm hover:from-blue-700 hover:to-cyan-700 gap-2"
                >
                  <Search className="w-4 h-4" />
                  Ara
                </Button>
              </div>
            </div>

            <div className="w-full md:max-w-full">
              <label className="block text-sm text-slate-800 mb-1">Şirket</label>
              <Select
                value={filters.company}
                onValueChange={v => {
                  setFilters(prev => ({ ...prev, company: v }))
                  setPage(1)
                }}
              >
                <SelectTrigger className="bg-white/90 border-white/60 text-slate-900 h-10 min-w-[400px]">
                  <Building className="w-4 h-4 mr-2 text-slate-600" />
                  <SelectValue placeholder="Tüm Şirketler" />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-900 border-slate-200 max-h-64 overflow-y-auto">
                  <SelectItem value="all">Tüm Şirketler</SelectItem>
                  {firms.map(comp => (
                    <SelectItem key={comp.COMPANY} value={comp.COMPANY}>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate max-w-[400px]">{comp.FIRMA}</span>
                        <span className="text-xs text-slate-500 truncate">Kod: {comp.COMPANY}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters({ docType: "all", company: "all", search: "", dateRange: "120", acctype: "all", accountLevel: "all", balanceType: "all" })
                setSearchDraft("")
                setPage(1)
              }}
              className="text-white/70 hover:text-white border border-white/10 h-9"
            >
              Sıfırla
            </Button>
            <div className="text-xs text-white/50 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Son yenileme: {lastRefreshTime ? formatTime(lastRefreshTime) : "—"}</span>
              <span>•</span>
              <span>{refreshCount} kez</span>
              <span className="hidden md:inline">• API: {topCari.length + accountStatus.length + dueTracking.length + latestVouchers.length} kayıt</span>
            </div>
          </div>

          {advancedOpen && (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAdvancedOpen(false)} />
              <div className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-900/95 border-l border-white/10 shadow-2xl flex flex-col">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Settings className="w-5 h-5" />
                    <span className="font-semibold">Gelişmiş Filtreler</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setAdvancedOpen(false)} className="text-white/60 hover:text-white">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto">
                  <div>
                    <div className="text-sm text-white/70 mb-1">Fiş Tipi</div>
                    <Select
                      value={filters.docType}
                      onValueChange={v => {
                        setFilters(prev => ({ ...prev, docType: v }))
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white h-10">
                        <SelectValue placeholder="Fiş Tipi" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/20 max-h-72">
                        <SelectItem value="all" className="text-white">
                          Tüm Fiş Tipleri
                        </SelectItem>
                        {ALL_VOUCHER_TYPES.map(t => (
                          <SelectItem key={t.DOCTYPE} value={t.DOCTYPE} className="text-white">
                            {t.STEXT} ({t.DOCTYPE})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="text-sm text-white/70 mb-1">Hesap Tipi</div>
                    <Select
                      value={filters.acctype}
                      onValueChange={v => {
                        setFilters(prev => ({ ...prev, acctype: v }))
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white h-10">
                        <SelectValue placeholder="Hesap Tipi" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/20">
                        <SelectItem value="all" className="text-white">
                          Tümü
                        </SelectItem>
                        {["C", "V", "G", "A", "P", "E"].map(code => (
                          <SelectItem key={code} value={code} className="text-white">
                            {ACCTYPE_LABELS[code]} ({code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="text-sm text-white/70 mb-1">Hesap Seviyesi</div>
                    <Select
                      value={filters.accountLevel}
                      onValueChange={v => {
                        setFilters(prev => ({ ...prev, accountLevel: v }))
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white h-10">
                        <SelectValue placeholder="Seviye" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/20">
                        <SelectItem value="all" className="text-white">
                          Ana + Alt
                        </SelectItem>
                        <SelectItem value="ANA" className="text-white">
                          Ana Hesap
                        </SelectItem>
                        <SelectItem value="ALT" className="text-white">
                          Alt Hesap
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="text-sm text-white/70 mb-1">Bakiye Tipi</div>
                    <Select
                      value={filters.balanceType}
                      onValueChange={v => {
                        setFilters(prev => ({ ...prev, balanceType: v as "all" | "debit" | "credit" }))
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white h-10">
                        <SelectValue placeholder="Bakiye Tipi" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/20">
                        <SelectItem value="all" className="text-white">
                          Hepsi
                        </SelectItem>
                        <SelectItem value="debit" className="text-white">
                          Borç Bakiyesi
                        </SelectItem>
                        <SelectItem value="credit" className="text-white">
                          Alacak Bakiyesi
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setFilters(prev => ({ ...prev, docType: "all", acctype: "all", accountLevel: "all", balanceType: "all" }))
                      setPage(1)
                    }}
                    className="text-white/70 hover:text-white border border-white/10"
                  >
                    Sıfırla
                  </Button>
                  <Button onClick={() => setAdvancedOpen(false)} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                    Uygula
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const refreshProgress = isRefreshing ? 65 : 100

  if (isLoading && !isRefreshing) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/80 to-cyan-950/60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-3xl animate-spin-slow" />
        </div>
      </div>

      <DataRefreshOverlay open={isRefreshing} message="Veriler güncelleniyor" progress={refreshProgress} />

      <div className="relative z-10">
        <nav className="sticky top-0 z-40 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
                <div className="relative p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 group-hover:from-blue-500/30 group-hover:to-cyan-500/30">
                  <ChevronLeft className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Modüllere Dön</span>
              </Link>

              <div className="h-6 w-px bg-white/20" />

              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-30" />
                  <div className="relative p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Finans & Muhasebe</h1>
                  <p className="text-sm text-white/60">AI Destekli Dashboard</p>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <User className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-white/80">
                  {stats.totalVouchers} Fiş
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <User className="w-4 h-4 text-red-400" />
                <span className="text-sm text-white/80">
                  {stats.totalCariCount} Cari
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchAllData(true)}
                disabled={isRefreshing}
                className="gap-2 text-white/60 hover:text-white border border-white/10 backdrop-blur-sm hover:bg-white/5"
              >
                {isRefreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="hidden md:inline">Yenile</span>
              </Button>

              {isAuthenticated && (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-colors">
                    <User className="w-4 h-4 text-white/80" />
                    <span className="text-sm text-white/90 hidden md:inline">{user?.display || user?.username || "Kullanıcı"}</span>
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

        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-4">
            <Sidebar />

            <div className="space-y-6">
              <FilterBarComponent />

              {activeTab === "overview" && (
                <div className="space-y-6">
                  <HeadlineCards />
                  <EnhancedTopCari />
                  <EnhancedDueTracking />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <EnhancedLatestVouchers />
                    <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/20">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-400" />
                            Sistem Durumu
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                                <div>
                                  <div className="font-medium text-white">API Servisleri</div>
                                  <div className="text-xs text-white/60">Bağlantı aktif</div>
                                </div>
                              </div>
                              <Badge className="bg-emerald-500/15 text-emerald-200 border-emerald-500/30">
                                {topCari.length + accountStatus.length + dueTracking.length + latestVouchers.length} kayıt
                              </Badge>
                            </div>
                          </div>

                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                                <div>
                                  <div className="font-medium text-white">Mevcut API'ler</div>
                                  <div className="text-xs text-white/60">4 endpoint</div>
                                </div>
                              </div>
                              <Badge className="bg-blue-500/15 text-blue-200 border-blue-500/30">Aktif</Badge>
                            </div>
                          </div>

                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                                <div>
                                  <div className="font-medium text-white">Toplam Veri</div>
                                  <div className="text-xs text-white/60">Tüm kaynaklar</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-white">{vouchers.length + topCari.length + dueTracking.length}</div>
                                <div className="text-xs text-purple-400">kayıt</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "yonetim" && <YonetimView />}

              {activeTab === "reports" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 backdrop-blur-xl border-emerald-500/30">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[11px] text-emerald-300 font-semibold uppercase flex items-center gap-2">
                              ⏰ 7 Gün İçinde Ödenecek
                            </div>
                            <div className="text-xl font-extrabold text-white mt-1 leading-tight">₺{formatCurrency(kpiDueSoonTotal + dueTrackingKpis.dueSoonTotal)}</div>
                            <div className="text-[11px] text-emerald-300/60 mt-1">
                              {dueBuckets.dueSoon.length + dueTrackingKpis.dueSoonCount} kayıt
                            </div>
                          </div>
                          <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-emerald-300" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-600/20 to-rose-600/20 backdrop-blur-xl border-red-500/30">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[11px] text-red-200 font-semibold uppercase flex items-center gap-2">
                              🚨 Geciken Alacaklar
                            </div>
                            <div className="text-xl font-extrabold text-white mt-1 leading-tight">₺{formatCurrency(kpiOverdueTotal + dueTrackingKpis.overdueTotal)}</div>
                            <div className="text-[11px] text-red-200/70 mt-1">
                              {dueBuckets.overdue.length + dueTrackingKpis.overdueCount} kayıt
                            </div>
                          </div>
                          <div className="p-2 bg-red-500/20 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-200" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-xl border-purple-500/30">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[11px] text-purple-200 font-semibold uppercase flex items-center gap-2">
                              💰 Toplam Risk Tutarı
                            </div>
                            <div className="text-xl font-extrabold text-white mt-1 leading-tight">
                              ₺{formatCurrency(kpiRiskTotal + dueTrackingKpis.dueSoonTotal + dueTrackingKpis.overdueTotal)}
                            </div>
                            <div className="text-[11px] text-purple-200/70 mt-1">Geciken + Yaklaşan</div>
                          </div>
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Shield className="w-5 h-5 text-purple-200" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 backdrop-blur-xl border-cyan-500/30">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[11px] text-cyan-300 font-semibold uppercase flex items-center gap-2">
                              🟢 Bugün Girilen Fişler
                            </div>
                            <div className="text-xl font-extrabold text-white mt-1 leading-tight">{todayVouchers.length}</div>
                            <div className="text-[11px] text-cyan-300/60 mt-1">Son 24 saat</div>
                          </div>
                          <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <Clock className="w-5 h-5 text-cyan-300" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <EnhancedDueTracking />
                </div>
              )}

              {activeTab === "analysis" && (
                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/20">
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-amber-400" />
                          <h3 className="font-semibold text-lg text-white">Hesap Durum Raporu (C/V)</h3>
                        </div>
                        <div className="flex gap-2 text-xs text-white/60">
                          <Badge className="bg-red-500/15 text-red-200 border-red-500/30">
                            Borç: ₺{formatCurrency(mizanAccounts.filter(a => a.balanceType === "Borç" && Math.abs(a.balance) > 0 && (a.accountType === "C" || a.accountType === "V")).reduce((s, a) => s + Math.abs(a.balance), 0))}
                          </Badge>
                          <Badge className="bg-emerald-500/15 text-emerald-200 border-emerald-500/30">
                            Alacak: ₺{formatCurrency(mizanAccounts.filter(a => a.balanceType === "Alacak" && Math.abs(a.balance) > 0 && (a.accountType === "C" || a.accountType === "V")).reduce((s, a) => s + Math.abs(a.balance), 0))}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[{ title: "Borçlu Hesaplar", data: mizanAccounts.filter(a => a.balanceType === "Borç" && Math.abs(a.balance) > 0 && (a.accountType === "C" || a.accountType === "V")), color: "red" }, { title: "Alacaklı Hesaplar", data: mizanAccounts.filter(a => a.balanceType === "Alacak" && Math.abs(a.balance) > 0 && (a.accountType === "C" || a.accountType === "V")), color: "emerald" }].map(block => {
                          const total = block.data.reduce((sum, a) => sum + Math.abs(a.balance), 0)
                          return (
                            <div key={block.title} className="p-3 bg-white/5 rounded-lg border border-white/10 max-h-[380px] overflow-y-auto">
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-white text-sm">{block.title}</span>
                                <Badge
                                  className={`border ${
                                    block.color === "red"
                                      ? "bg-red-500/15 text-red-200 border-red-500/30"
                                      : "bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
                                  }`}
                                >
                                  {block.data.length}
                                </Badge>
                              </div>
                              <div className="text-xs text-white/60 mb-2">
                                Toplam:{" "}
                                <span className={`${block.color === "red" ? "text-red-200" : "text-emerald-200"} font-semibold`}>
                                  ₺{formatCurrency(total)}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {block.data.slice(0, 50).map((acc, idx) => {
                                  const derivedType = acc.accountType === "C" ? "C" : acc.accountType === "V" ? "V" : ""
                                  return (
                                    <div key={`${acc.company}-${acc.code}-${acc.balanceType}-${idx}`} className="p-2 bg-white/5 rounded-lg border border-white/5 hover:border-white/20 transition">
                                      <div className="flex justify-between text-xs text-white/60 mb-1">
                                        <span className="truncate" title={acc.name}>
                                          {acc.name}
                                        </span>
                                        <span>{acc.company}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <div className="text-xs text-white/50 truncate">
                                          {acc.code} {derivedType ? `(${derivedType})` : ""}
                                        </div>
                                        <div className={`${block.color === "red" ? "text-red-300" : "text-emerald-300"} font-semibold text-sm`}>
                                          ₺{formatCurrency(Math.abs(acc.balance))}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                                {block.data.length === 0 && <div className="text-xs text-white/50">Kayıt yok.</div>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/20">
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-white">
                          <Building className="w-5 h-5 text-cyan-400" />
                          Firma Bazlı Dağılım
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {Object.entries(stats.voucherByCompany)
                            .sort(([, a], [, b]) => b - a)
                            .map(([company, count]) => (
                              <div key={company} className="p-3 hover:bg-white/5 rounded-lg transition-colors">
                                <div className="flex justify-between items-center">
                                  <div className="truncate">
                                    <div className="font-medium text-white truncate">{getFirmName(company)}</div>
                                    <div className="text-sm text-white/60">Kod: {company}</div>
                                  </div>
                                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">{count} fiş</Badge>
                                </div>
                              </div>
                            ))}
                          {Object.keys(stats.voucherByCompany).length === 0 && <div className="text-sm text-white/40 text-center py-4">Veri yok</div>}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/20">
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-white">
                          <Users className="w-5 h-5 text-emerald-400" />
                          Kullanıcı Bazlı Oluşturma
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {createdByCounts.length === 0 && <div className="text-sm text-white/60">Bu aralıkta oluşturulan fiş yok.</div>}
                          {createdByCounts.map(c => (
                            <div key={c.user} className="p-3 hover:bg-white/5 rounded-lg transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                  <div className="font-medium text-white truncate">{c.user}</div>
                                  <div className="text-xs text-white/60">Oluşturulan fiş sayısı</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-white">{c.count} fiş</div>
                                  <div className="text-xs text-cyan-400">
                                    {((c.count / Math.max(1, stats.totalVouchers)) * 100).toFixed(0)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "mizan" && <MizanView />}

              {activeTab === "vouchers" && (
                <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/20 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-white/10 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-white">Fiş Listesi</h3>
                        <p className="text-sm text-white/60">
                          Gösterilen: {filteredVouchers.length} / {vouchers.length} kayıt
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/10" onClick={exportCSV}>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/10">
                          <tr>
                            <th className="p-3 text-left text-xs font-semibold text-white/80">Fiş</th>
                            <th className="p-3 text-left text-xs font-semibold text-white/80">Tarih</th>
                            <th className="p-3 text-right text-xs font-semibold text-white/80">Tutar</th>
                            <th className="p-3 text-left text-xs font-semibold text-white/80 hidden md:table-cell">Firma</th>
                            <th className="p-3 text-left text-xs font-semibold text-white/80 hidden lg:table-cell">Oluşturan</th>
                            <th className="p-3 text-left text-xs font-semibold text-white/80 hidden sm:table-cell">Satır</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedVouchers.map((v, idx) => {
                            const tutar = v.totalDebit || v.totalCredit || 0
                            return (
                              <Fragment key={`${v.company}-${v.voucherType}-${v.voucherNo}-${idx}`}>
                                <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="p-3 align-top">
                                    <div className="font-medium text-white flex items-center gap-2">
                                      {v.voucherType}-{v.voucherNo}
                                      {v.createdAt && v.postDate && +new Date(v.createdAt) > +new Date(v.postDate) && <TooltipLate />}
                                    </div>
                                    <div className="text-xs text-white/60 truncate max-w-[200px]">
                                      {v.items[0]?.description || v.items[0]?.accountName}
                                    </div>
                                    <div className="text-[10px] text-white/40 mt-1">Oluşturma: {formatDate(v.createdAt) || "—"}</div>
                                  </td>
                                  <td className="p-3 align-top">
                                    <div className="font-medium text-white">{formatDate(v.postDate)}</div>
                                    <div className="text-xs text-white/60">Satır: {v.items.length}</div>
                                  </td>
                                  <td className="p-3 text-right align-top">
                                    <div className="font-bold text-emerald-300">₺{formatCurrency(tutar)}</div>
                                  </td>
                                  <td className="p-3 hidden md:table-cell align-top">
                                    <div className="font-medium text-white truncate max-w-[180px]" title={getFirmName(v.company)}>
                                      {getFirmName(v.company)}
                                    </div>
                                    <div className="text-xs text-white/60">Kod: {v.company}</div>
                                  </td>
                                  <td className="p-3 hidden lg:table-cell align-top">
                                    <div className="font-medium text-white truncate max-w-[200px]">{v.createdBy || "—"}</div>
                                  </td>
                                  <td className="p-3 hidden sm:table-cell align-top">
                                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">{v.items.length} satır</Badge>
                                  </td>
                                </tr>
                                <tr className="border-b border-white/5 bg-white/5/10">
                                  <td colSpan={6} className="p-0">
                                    <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                      {v.items.map((it, itemIdx) => {
                                        const role = it.debit > it.credit ? "Borçlu" : it.credit > it.debit ? "Alacaklı" : "Dengede"
                                        const roleColor =
                                          role === "Borçlu"
                                            ? "bg-red-500/15 text-red-200 border-red-500/30"
                                            : role === "Alacaklı"
                                            ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
                                            : "bg-white/10 text-white/80 border-white/20"
                                        const currencyTag = it.currency && it.currency !== "TL" ? `${it.currency}${it.exchangeRate ? ` @${it.exchangeRate}` : ""}` : it.currency || ""
                                        return (
                                          <div key={`${v.company}-${v.voucherType}-${v.voucherNo}-${it.line}-${itemIdx}`} className="p-3 bg-white/5 rounded-lg border border-white/10">
                                            <div className="flex items-center justify-between mb-1">
                                              <div className="text-xs text-white/60">Satır {it.line}</div>
                                              <div className="flex gap-1">
                                                <Badge className="bg-white/10 text-white/80 border-white/20">{it.accountType}</Badge>
                                                <Badge className={roleColor}>{role}</Badge>
                                              </div>
                                            </div>
                                            <div className="font-semibold text-white truncate" title={it.accountName}>
                                              {it.accountName}
                                            </div>
                                            <div className="text-xs text-white/50 truncate">{it.accountCode}</div>
                                            <div className="text-xs text-white/60 mt-1 line-clamp-2">{it.description}</div>
                                            <div className="mt-2 flex justify-between text-sm">
                                              <span className="text-red-300 font-semibold">₺{formatCurrency(it.debit)}</span>
                                              <span className="text-emerald-300 font-semibold">₺{formatCurrency(it.credit)}</span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-[11px] text-white/60">
                                              <span>{currencyTag || "TL"}</span>
                                              <span>{it.customerName || it.vendorName || "—"}</span>
                                            </div>
                                            {it.dueDate && <div className="text-[11px] text-amber-200 mt-1">Vade: {formatDate(it.dueDate)}</div>}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              </Fragment>
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
                      <div className="text-sm text-white/60">
                        Toplam {filteredVouchers.length} kayıt • Sayfa {page} / {Math.max(1, Math.ceil(filteredVouchers.length / pageSize))}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-white/60">Sayfa Boyutu:</label>
                        <select
                          value={pageSize}
                          onChange={e => {
                            setPageSize(Number(e.target.value))
                            setPage(1)
                          }}
                          className="bg-white/5 rounded px-2 py-1 text-sm text-white border border-white/20"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                          <option value={200}>200</option>
                        </select>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPage(p => Math.max(1, p - 1))}

                          disabled={page <= 1}
                          className="text-white/60 hover:text-white"
                        >
                          Önceki
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPage(p => Math.min(Math.ceil(filteredVouchers.length / pageSize), p + 1))}
                          disabled={page >= Math.ceil(filteredVouchers.length / pageSize)}
                          className="text-white/60 hover:text-white"
                        >
                          Sonraki
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="mt-8 border-t border-white/10 pt-6 pb-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left w-full">
                    <p className="text-sm text-white/40">© 2025 Finans Dashboard • Tüm Hakları Saklıdır</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showNotification && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg shadow-lg max-w-md animate-in slide-in-from-right-5 ${
              notification.type === "success"
                ? "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 text-emerald-300"
                : notification.type === "error"
                ? "bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/20 text-red-300"
                : "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 text-blue-300"
            } backdrop-blur-xl`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : notification.type === "error" ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : (
              <Clock className="w-5 h-5 text-blue-400" />
            )}
            <div className="flex-1">
              <p className="font-medium">{notification.type === "success" ? "Başarılı" : notification.type === "error" ? "Hata" : "Bilgi"}</p>
              <p className="text-sm">{notification.message}</p>
            </div>
            <button onClick={() => setShowNotification(false)} className="text-white/40 hover:text-white/60">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}