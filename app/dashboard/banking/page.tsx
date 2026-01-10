"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CheckCircle,
  ChevronLeft,
  CreditCard,
  Download,
  Info,
  RefreshCw,
  Search,
  Landmark,
  Coins,
  Activity,
  Eye,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  DollarSign,
  AlertCircle,
  Clock,
  Cpu,
  FileSpreadsheet,
  Filter as FilterIcon,
  LogOut,
  User,
  ChevronRight,
  Sparkles,
} from "lucide-react"

type BankingResponse = {
  success: boolean
  count: number
  summary: {
    total: number
    financed: number
    pending: number
    amounts: {
      debit: number
      credit: number
      total: number
      net: number
    }
    currency: string
    lastUpdate: string | null
    timeRange: string
  }
  data: BankTransaction[]
}

type BankTransaction = {
  id: string
  referenceId: string
  instanceId: string
  bankAccount: {
    name: string
    group: string
    number: string
    iban: string
    currency: string
    balances: {
      current: number
      available: number
      blocked: number
    }
    lastUpdate: string | null
  }
  transaction: {
    date: string | null
    dateTime: string | null
    time: string | null
    amount: number
    absoluteAmount: number
    currency: string
    type: "DEBIT" | "CREDIT" | "BALANCE" | "OTHER"
    debitCredit: "D" | "C" | "B" | string
    balanceAfter: number
    explanation: string
    status: "FINANCED" | "PENDING"
    isFinanced: boolean
  }
  accounting: {
    bank: {
      accStd: number
      accType: string
      account: string
      corrIban: string
      findocNum: string
    }
    finance: null | {
      docNum: string
      docType: string
      docItem: string
      accStd: string
      amounts: {
        debit: number
        credit: number
        dPost: number
        hPost: number
        total: number
      }
      currency: string
      explanation: string
      changedBy?: string
    }
  }
  system: {
    company: string
    client: string
    created: { by: string; at: string | null }
    updated: { by: string | null; at: string | null }
  }
  references: {
    transactionId?: string
    fullReference: string
  }
}

type Firm = {
  COMPANY: string
  FIRMA: string
  PLANT?: string
  TESIS?: string
}

type StatusFilter = "ALL" | "FINANCED" | "PENDING"
type TypeFilter = "ALL" | "DEBIT" | "CREDIT" | "BALANCE"

type TotalsCurrencySummary = {
  totalTransactions: number
  financed: { count: number; amount: number }
  pending: { count: number; amount: number }
}
type TotalsResponse = {
  success: boolean
  data: Record<string, TotalsCurrencySummary>
}

const normalizeCurrency = (currency?: string) => {
  if (!currency) return "TRY"
  const upper = currency.toUpperCase()
  if (/^[A-Z]{3}$/.test(upper)) return upper
  return "TRY"
}

const formatCurrency = (value: number, currency = "TRY") => {
  const safeCurr = normalizeCurrency(currency)
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: safeCurr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  }
}

const formatNumber = (value: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value)

const parseDateLoose = (raw?: string | null) => {
  if (!raw) return null
  const normalized = raw.replace(" ", "T")
  let d = new Date(normalized)
  if (!isNaN(d.getTime())) return d
  const m = raw.match(/^(\d{2})[./-](\d{2})[./-](\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/)
  if (m) {
    const [, dd, mm, yyyy, hh = "00", mi = "00", ss = "00"] = m
    d = new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`)
    if (!isNaN(d.getTime())) return d
  }
  return null
}

const parseDateSafe = (t: BankTransaction) => parseDateLoose(t.transaction.dateTime || t.transaction.date)

// Custom hooks
const useDebounced = (value: string, delay = 250) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

type CurrencyNavCard = {
  currency: string
  total: number
  financedCount: number
  pendingCount: number
  financedAmt: number
  pendingAmt: number
  financedPct: number
  pendingPct: number
  bg: string
  bar: string
}

export default function BankingDashboardPage() {
  const { user, isAuthenticated, logout } = useAuth()

  const [data, setData] = useState<BankingResponse | null>(null)
  const [totalsData, setTotalsData] = useState<Record<string, TotalsCurrencySummary> | null>(null)
  const [totalsError, setTotalsError] = useState<string | null>(null)
  const [firms, setFirms] = useState<Firm[]>([])
  const [loading, setLoading] = useState(true)
  const [totalsLoading, setTotalsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [searchDraft, setSearchDraft] = useState("")
  const [status, setStatus] = useState<StatusFilter>("ALL")
  const [type, setType] = useState<TypeFilter>("ALL")
  const [currency, setCurrency] = useState<string>("ALL")
  const [bank, setBank] = useState<string>("ALL")
  const [firm, setFirm] = useState<string>("ALL")
  const [ibanFilter, setIbanFilter] = useState("")
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "analysis" | "accounts" | "reports">("overview")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string }>({
    type: "success",
    message: "",
  })
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const notifTimerRef = useRef<number | null>(null)
  const firmsAbortRef = useRef<AbortController | null>(null)
  const totalsAbortRef = useRef<AbortController | null>(null)

  const showToast = useCallback((type: "success" | "error" | "info", message: string, duration = 3000) => {
    setNotification({ type, message })
    setShowNotification(true)
    if (notifTimerRef.current) window.clearTimeout(notifTimerRef.current)
    notifTimerRef.current = window.setTimeout(() => {
      setShowNotification(false)
      notifTimerRef.current = null
    }, duration)
  }, [])

  // Kullanıcının dbName bilgisini al
  const getDbName = useCallback(() => {
    if (user?.dbName) return user.dbName

    try {
      const stored = localStorage.getItem("globalApiInfo")
      if (stored) {
        const apiInfo = JSON.parse(stored)
        return apiInfo.dbName
      }
    } catch {}

    return null
  }, [user])

  // API çağrılarında ortak header
  const buildApiHeaders = useCallback((dbName: string) => {
    return {
      "Content-Type": "application/json",
      "x-db-name": dbName, // yeni kurguda header üzerinden de gönder
    }
  }, [])

  // Güncellenmiş fetchData
  const fetchData = useCallback(async () => {
    const dbName = getDbName()
    if (!dbName) {
      setError("Veritabanı bilgisi bulunamadı. Lütfen tekrar giriş yapın.")
      setLoading(false)
      setIsRefreshing(false)
      return
    }

    setIsRefreshing(true)
    setError(null)
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch(`/api/bank-transactions-finance?dbName=${encodeURIComponent(dbName)}`, {
        headers: buildApiHeaders(dbName),
        signal: controller.signal,
        cache: "no-store",
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        const msg = errJson?.message || `API ${res.status}`
        throw new Error(msg)
      }
      const json: BankingResponse = await res.json()
      setData(json)
      showToast("success", `Veriler güncellendi! (${json.summary.lastUpdate || "Şimdi"})`)
    } catch (e: any) {
      if (e?.name === "AbortError") return
      setError(e?.message || "Veri alınamadı")
      showToast("error", e?.message || "Veri alınamadı")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
      abortRef.current = null
    }
  }, [showToast, getDbName, buildApiHeaders])

  // Güncellenmiş fetchTotals
  const fetchTotals = useCallback(async () => {
    const dbName = getDbName()
    if (!dbName) {
      setTotalsError("Veritabanı bilgisi bulunamadı.")
      setTotalsLoading(false)
      return
    }

    setTotalsLoading(true)
    setTotalsError(null)
    if (totalsAbortRef.current) totalsAbortRef.current.abort()
    const controller = new AbortController()
    totalsAbortRef.current = controller
    try {
      const res = await fetch(`/api/bank-transactions-finance-total?dbName=${encodeURIComponent(dbName)}`, {
        headers: buildApiHeaders(dbName),
        signal: controller.signal,
        cache: "no-store",
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        const msg = errJson?.message || `Toplamlar HTTP ${res.status}`
        throw new Error(msg)
      }
      const json: TotalsResponse = await res.json()
      const normalized: Record<string, TotalsCurrencySummary> = {}
      Object.entries(json.data || {}).forEach(([curr, row]) => {
        normalized[curr] = {
          totalTransactions: Number(row.totalTransactions || 0),
          financed: { count: Number(row.financed?.count || 0), amount: Number((row.financed as any)?.amount || 0) },
          pending: { count: Number(row.pending?.count || 0), amount: Number((row.pending as any)?.amount || 0) },
        }
      })
      setTotalsData(normalized)
    } catch (e: any) {
      if (e?.name === "AbortError") return
      setTotalsError(e?.message || "Toplam verisi alınamadı")
    } finally {
      setTotalsLoading(false)
      totalsAbortRef.current = null
    }
  }, [getDbName, buildApiHeaders])

  // Güncellenmiş fetchFirms
  const fetchFirms = useCallback(async () => {
    const dbName = getDbName()
    if (!dbName) {
      console.log("Firmalar alınamadı: dbName yok")
      return
    }

    if (firmsAbortRef.current) firmsAbortRef.current.abort()
    const controller = new AbortController()
    firmsAbortRef.current = controller
    try {
      const res = await fetch(`/api/firms?dbName=${encodeURIComponent(dbName)}`, {
        headers: buildApiHeaders(dbName),
        signal: controller.signal,
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`Firms HTTP ${res.status}`)

      const json = await res.json()
      if (json?.data && Array.isArray(json.data)) {
        setFirms(json.data as Firm[])
      }
    } catch {
      // Sessiz geç
    } finally {
      firmsAbortRef.current = null
    }
  }, [getDbName, buildApiHeaders])

  useEffect(() => {
    fetchData()
    fetchFirms()
    fetchTotals()
    return () => {
      abortRef.current?.abort()
      firmsAbortRef.current?.abort()
      totalsAbortRef.current?.abort()
      if (notifTimerRef.current) window.clearTimeout(notifTimerRef.current)
    }
  }, [fetchData, fetchFirms, fetchTotals])

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 480)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const debouncedIban = useDebounced(ibanFilter, 300)

  const currencies = useMemo(() => {
    const set = new Set<string>()
    data?.data?.forEach((d) => d.transaction.currency && set.add(normalizeCurrency(d.transaction.currency)))
    return ["ALL", ...Array.from(set.values())]
  }, [data])

  const banks = useMemo(() => {
    const set = new Set<string>()
    data?.data?.forEach((d) => d.bankAccount.name && set.add(d.bankAccount.name))
    return ["ALL", ...Array.from(set.values())]
  }, [data])

  const firmOptions = useMemo(() => {
    const set = new Set<string>()
    firms.forEach((f) => f.COMPANY && set.add(f.COMPANY.trim()))
    const arr = Array.from(set.values())
    const extractCode = (s: string) => {
      const m = s.match(/^(\d{1,3})/)
      return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER
    }
    return ["ALL", ...arr.sort((a, b) => extractCode(a) - extractCode(b))]
  }, [firms])

  const filtered = useMemo(() => {
    if (!data?.data) return []
    const term = search.trim().toLowerCase()
    const ibanTerm = debouncedIban.trim().toLowerCase()
    return data.data.filter((row) => {
      const matchSearch =
        !term ||
        row.transaction.explanation.toLowerCase().includes(term) ||
        row.bankAccount.name.toLowerCase().includes(term) ||
        (row.bankAccount.number || "").toLowerCase().includes(term) ||
        (row.referenceId || "").toLowerCase().includes(term) ||
        (row.instanceId || "").toLowerCase().includes(term)
      const matchStatus = status === "ALL" ? true : status === "FINANCED" ? row.transaction.isFinanced : !row.transaction.isFinanced
      const matchType = type === "ALL" ? true : row.transaction.type === type
      const matchCurrency = currency === "ALL" ? true : normalizeCurrency(row.transaction.currency) === currency
      const matchBank = bank === "ALL" ? true : row.bankAccount.name === bank
      const matchIban = !ibanTerm || (row.bankAccount.iban || "").toLowerCase().includes(ibanTerm)
      const matchFirm = firm === "ALL" ? true : (row.system.company || "").trim() === firm
      return matchSearch && matchStatus && matchType && matchCurrency && matchBank && matchIban && matchFirm
    })
  }, [data, search, status, type, currency, bank, debouncedIban, firm])

  const last90DaysData = useMemo(() => {
    if (!data?.data) return []
    const now = new Date()
    return data.data.filter((t) => {
      const d = parseDateSafe(t)
      if (!d) return false
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 90
    })
  }, [data])

  const last3MonthsStats = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleString("tr-TR", { month: "long", year: "numeric" })
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.getMonth(),
        year: d.getFullYear(),
        label,
        count: 0,
        total: 0,
        financedCount: 0,
        creditAmt: 0,
        debitAmt: 0,
        debitCount: 0,
        creditCount: 0,
      }
    })
    filtered.forEach((t) => {
      const d = parseDateSafe(t)
      if (!d) return
      const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
      if (diffMonths < 0 || diffMonths > 2) return
      const idx = diffMonths
      const amt = Math.abs(t.transaction.amount)
      months[idx].count++
      months[idx].total += amt
      if (t.transaction.type === "CREDIT") {
        months[idx].creditAmt += amt
        months[idx].creditCount++
      } else if (t.transaction.type === "DEBIT") {
        months[idx].debitAmt += amt
        months[idx].debitCount++
      }
      if (t.transaction.isFinanced) months[idx].financedCount++
    })
    return months.reverse()
  }, [filtered])

  const pagedTransactions = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const totals = useMemo(() => {
    if (!filtered.length) return { debit: 0, credit: 0, net: 0 }
    const debit = filtered.filter((r) => r.transaction.type === "DEBIT").reduce((s, r) => s + Math.abs(r.transaction.amount), 0)
    const credit = filtered.filter((r) => r.transaction.type === "CREDIT").reduce((s, r) => s + Math.abs(r.transaction.amount), 0)
    return { debit, credit, net: credit - debit }
  }, [filtered])

  const financedAmounts = useMemo(() => {
    const financed = filtered.filter((r) => r.transaction.isFinanced)
    const pending = filtered.filter((r) => !r.transaction.isFinanced)
    const financedSum = financed.reduce((s, r) => s + Math.abs(r.transaction.amount), 0)
    const pendingSum = pending.reduce((s, r) => s + Math.abs(r.transaction.amount), 0)
    return { financed, pending, financedSum, pendingSum }
  }, [filtered])

  const topTimeline = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => (b.transaction.dateTime || b.transaction.date || "").localeCompare(a.transaction.dateTime || a.transaction.date || ""))
        .slice(0, 8),
    [filtered]
  )

  const maxAbs = useMemo(() => (filtered.length ? Math.max(...filtered.map((r) => r.transaction.absoluteAmount)) : 0), [filtered])

  const avgTicket = useMemo(() => (filtered.length ? filtered.reduce((s, r) => s + Math.abs(r.transaction.absoluteAmount), 0) / filtered.length : 0), [filtered])

  const financedRatio = useMemo(() => {
    if (!filtered.length) return 0
    const financed = filtered.filter((r) => r.transaction.isFinanced).length
    return Math.round((financed / filtered.length) * 100)
  }, [filtered])

  const financedCount = filtered.filter((r) => r.transaction.isFinanced).length
  const pendingCount = filtered.length - financedCount

  const summaryFinanced = data?.summary?.financed ?? 0
  const summaryPending = data?.summary?.pending ?? 0
  const summaryTotal = data?.summary?.total ?? 0
  const summaryFinancedRatio = Math.round((summaryFinanced / Math.max(1, summaryTotal)) * 100)
  const summaryPendingRatio = Math.round((summaryPending / Math.max(1, summaryTotal)) * 100)

  const totalsAggregate = useMemo(() => {
    if (!totalsData) return null
    let totalCount = 0
    let financedCountAgg = 0
    let pendingCountAgg = 0
    let financedAmount = 0
    let pendingAmount = 0
    const perCurrency = Object.entries(totalsData).map(([currency, row]) => {
      totalCount += row.totalTransactions
      financedCountAgg += row.financed.count
      pendingCountAgg += row.pending.count
      financedAmount += row.financed.amount
      pendingAmount += row.pending.amount
      return { currency: normalizeCurrency(currency), ...row }
    })
    return { totalCount, financedCount: financedCountAgg, pendingCount: pendingCountAgg, financedAmount, pendingAmount, perCurrency }
  }, [totalsData])

  const navTotals = useMemo(() => {
    const total = totalsAggregate?.totalCount ?? summaryTotal ?? 0
    const financed = totalsAggregate?.financedCount ?? summaryFinanced ?? 0
    const pending = totalsAggregate?.pendingCount ?? summaryPending ?? 0
    const financedPct = Math.round((financed / Math.max(1, total)) * 100)
    return { total, financed, pending, financedPct, pendingPct: 100 - financedPct }
  }, [totalsAggregate, summaryTotal, summaryFinanced, summaryPending])

  const currencyNavCards: CurrencyNavCard[] = useMemo(() => {
    const currencyColors: Record<string, { bg: string; bar: string }> = {
      TRY: { bg: "from-emerald-500/20 to-emerald-400/15", bar: "from-emerald-400 via-emerald-300 to-green-300" },
      USD: { bg: "from-blue-500/20 to-cyan-400/15", bar: "from-cyan-400 via-blue-400 to-sky-300" },
      EUR: { bg: "from-indigo-500/20 to-violet-400/15", bar: "from-indigo-300 via-violet-300 to-purple-300" },
      GBP: { bg: "from-amber-500/20 to-orange-400/15", bar: "from-amber-300 via-orange-300 to-yellow-200" },
    }

    const priority = ["TRY", "USD", "EUR", "GBP"]

    const aggregateFallback = () => {
      const map = new Map<
        string,
        { total: number; financedCount: number; pendingCount: number; financedAmt: number; pendingAmt: number }
      >()
      filtered.forEach((t) => {
        const curr = normalizeCurrency(t.transaction.currency)
        const entry = map.get(curr) || { total: 0, financedCount: 0, pendingCount: 0, financedAmt: 0, pendingAmt: 0 }
        entry.total++
        const amt = Math.abs(t.transaction.amount)
        if (t.transaction.isFinanced) {
          entry.financedCount++
          entry.financedAmt += amt
        } else {
          entry.pendingCount++
          entry.pendingAmt += amt
        }
        map.set(curr, entry)
      })
      return Array.from(map.entries()).map(([currency, v]) => ({ currency, total: v.total, financedCount: v.financedCount, pendingCount: v.pendingCount, financedAmt: v.financedAmt, pendingAmt: v.pendingAmt }))
    }

    const perCurrencyRaw =
      totalsAggregate?.perCurrency?.length
        ? totalsAggregate.perCurrency.map((row) => ({
            currency: normalizeCurrency(row.currency),
            total: row.totalTransactions,
            financedCount: row.financed.count,
            pendingCount: row.pending.count,
            financedAmt: row.financed.amount,
            pendingAmt: row.pending.amount,
          }))
        : aggregateFallback()

    const merged = new Map<string, { total: number; financedCount: number; pendingCount: number; financedAmt: number; pendingAmt: number }>()
    perCurrencyRaw.forEach((row) => {
      const curr = normalizeCurrency(row.currency)
      const prev = merged.get(curr) || { total: 0, financedCount: 0, pendingCount: 0, financedAmt: 0, pendingAmt: 0 }
      merged.set(curr, {
        total: prev.total + row.total,
        financedCount: prev.financedCount + row.financedCount,
        pendingCount: prev.pendingCount + row.pendingCount,
        financedAmt: prev.financedAmt + row.financedAmt,
        pendingAmt: prev.pendingAmt + row.pendingAmt,
      })
    })

    const list = Array.from(merged.entries()).map(([currency, v]) => {
      const financedPct = Math.round((v.financedCount / Math.max(1, v.total)) * 100)
      const colors = currencyColors[currency] || { bg: "from-slate-500/15 to-slate-400/10", bar: "from-slate-200 via-slate-300 to-gray-200" }
      return {
        currency,
        total: v.total,
        financedCount: v.financedCount,
        pendingCount: v.pendingCount,
        financedAmt: v.financedAmt,
        pendingAmt: v.pendingAmt,
        financedPct,
        pendingPct: 100 - financedPct,
        bg: colors.bg,
        bar: colors.bar,
      }
    })

    const sortIdx = (c: string) => {
      const i = priority.indexOf(c)
      return i === -1 ? priority.length + c.charCodeAt(0) : i
    }

    return list.sort((a, b) => sortIdx(a.currency) - sortIdx(b.currency))
  }, [totalsAggregate, filtered])

  const downloadCSV = () => {
    if (!filtered.length) return
    const headers = [
      "Tarih",
      "Saat",
      "Banka",
      "Hesap",
      "Tutar",
      "Kur",
      "Tip",
      "Muhasebe Durumu",
      "Açıklama",
      "Ref",
      "BalanceAfter",
      "Muhasebe Fişi",
      "Firma",
    ]
    const rows = filtered.map((r) => [
      r.transaction.date,
      r.transaction.time,
      r.bankAccount.name,
      r.bankAccount.number,
      r.transaction.amount,
      r.transaction.currency,
      r.transaction.type,
      r.transaction.status,
      (r.transaction.explanation || "").replace(/"/g, '""'),
      r.referenceId,
      r.transaction.balanceAfter,
      r.accounting.finance?.docNum || "",
      r.system.company,
    ])
    const csv = [headers.join(","), ...rows.map((row) => row.map((c) => `"${c ?? ""}"`).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bank-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast("success", "CSV indirildi!")
  }

  const dailyStats = useMemo(() => {
    const map = new Map<
      string,
      { count: number; total: number; creditAmt: number; debitAmt: number; creditCount: number; debitCount: number; financedCount: number }
    >()
    filtered.forEach((t) => {
      const date = (t.transaction.dateTime || t.transaction.date || "Bilinmiyor").slice(0, 10)
      const current =
        map.get(date) || { count: 0, total: 0, creditAmt: 0, debitAmt: 0, creditCount: 0, debitCount: 0, financedCount: 0 }
      current.count++
      const amt = Math.abs(t.transaction.amount)
      current.total += amt
      if (t.transaction.type === "CREDIT") {
        current.creditAmt += amt
        current.creditCount++
      } else if (t.transaction.type === "DEBIT") {
        current.debitAmt += amt
        current.debitCount++
      }
      if (t.transaction.isFinanced) current.financedCount++
      map.set(date, current)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 10)
      .map(([date, stats], idx) => ({ date, ...stats, _k: `${date}-${idx}` }))
  }, [filtered])

  const bankStats = useMemo(() => {
    const map = new Map<
      string,
      { count: number; amount: number; pending: number; financed: number; financedAmount: number; pendingAmount: number }
    >()
    filtered.forEach((t) => {
      const bankName = t.bankAccount.name
      const current =
        map.get(bankName) || { count: 0, amount: 0, pending: 0, financed: 0, financedAmount: 0, pendingAmount: 0 }
      current.count++
      const absAmt = Math.abs(t.transaction.amount)
      current.amount += absAmt
      if (t.transaction.isFinanced) {
        current.financed++
        current.financedAmount += absAmt
      } else {
        current.pending++
        current.pendingAmount += absAmt
      }
      map.set(bankName, current)
    })
    return Array.from(map.entries())
      .map(([bank, stats]) => ({ bank, ...stats }))
      .sort((a, b) => b.amount - a.amount)
  }, [filtered])

  const currencyStats = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>()
    filtered.forEach((t) => {
      const curr = normalizeCurrency(t.transaction.currency || "Bilinmiyor")
      const current = map.get(curr) || { count: 0, amount: 0 }
      current.count++
      current.amount += Math.abs(t.transaction.amount)
      map.set(curr, current)
    })
    return Array.from(map.entries()).map(([currency, stats]) => ({ currency, ...stats }))
  }, [filtered])

  const last30DayStats = useMemo(() => {
    const now = new Date()
    const map = new Map<
      string,
      { count: number; total: number; creditAmt: number; debitAmt: number; creditCount: number; debitCount: number; financedCount: number }
    >()
    filtered.forEach((t) => {
      const d = parseDateSafe(t)
      if (!d) return
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays < 0 || diffDays > 30) return
      const key = d.toISOString().slice(0, 10)
      const current =
        map.get(key) || { count: 0, total: 0, creditAmt: 0, debitAmt: 0, creditCount: 0, debitCount: 0, financedCount: 0 }
      current.count++
      const amt = Math.abs(t.transaction.amount)
      current.total += amt
      if (t.transaction.type === "CREDIT") {
        current.creditAmt += amt
        current.creditCount++
      } else if (t.transaction.type === "DEBIT") {
        current.debitAmt += amt
        current.debitCount++
      }
      if (t.transaction.isFinanced) current.financedCount++
      map.set(key, current)
    })
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, stats]) => ({ date, ...stats }))
  }, [filtered])

  const financeUserStats = useMemo(() => {
    const map = new Map<string, number>()
    filtered
      .filter((t) => t.transaction.isFinanced && t.accounting.finance)
      .forEach((t) => {
        const userName = (t.accounting.finance?.changedBy || t.system.updated.by || t.system.created.by || "Bilinmiyor").trim()
        map.set(userName, (map.get(userName) || 0) + 1)
      })
    return Array.from(map.entries())
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [filtered])

  const avgPerDay = useMemo(() => {
    const totalCount = last30DayStats.reduce((s, d) => s + d.count, 0)
    return last30DayStats.length ? totalCount / last30DayStats.length : 0
  }, [last30DayStats])

  const maxDailyTotal = Math.max(1, ...dailyStats.map((d) => d.total || 0))
  const max30DayTotal = Math.max(1, ...last30DayStats.map((d) => d.total || 0))
  const maxMonthlyTotal = Math.max(1, ...last3MonthsStats.map((x) => x.total || 0))

  const LoadingScreen = () => (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.16),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(236,72,153,0.08),transparent_30%)]" />
        <div className="absolute inset-0 animate-spin-slow opacity-30 bg-[conic-gradient(from_0deg,rgba(56,189,248,0.18),rgba(99,102,241,0.08),rgba(16,185,129,0.18),rgba(56,189,248,0.18))]" />
      </div>

      <div className="relative flex flex-col items-center gap-8 px-6 text-center max-w-4xl">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-emerald-400/30" />
          <div className="relative w-40 h-40 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-[3px] border-cyan-400/50 animate-spin-slow" />
            <div className="absolute w-28 h-28 rounded-full border-[3px] border-emerald-400/40 animate-spin" style={{ animationDuration: "3.4s" }} />
            <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-semibold shadow-lg">
              AI
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-200 via-white to-emerald-200 bg-clip-text text-transparent">
            AI Banking Dashboard verilerinizi Hazırlıyor
          </h2>
          <p className="text-white/70 text-sm sm:text-base">
           Veriler arka planda hazırlanıyor, yaklaşık 1 dk sürebilir. Kahvenizi yudumlarken bekleyin.
          </p>
        </div>

        <div className="w-full max-w-2xl space-y-3">
          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-2/3 animate-[shimmer_1.6s_ease_infinite] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm text-white/60">
            <span>API senkronizasyonu</span>
            <span>Finansal eşleştirme</span>
            <span>Görsel bileşenler</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
          {[
            { label: "Toplam (Şimdiye Kadar Ki)", value: formatNumber(navTotals.total) },
            { label: "Muhasebeleşmiş(Şimdiye Kadar Ki)", value: `${formatNumber(navTotals.financed)} • ${navTotals.financedPct}%` },
            { label: "Bekleyen(Şimdiye Kadar Ki)", value: `${formatNumber(navTotals.pending)} • ${navTotals.pendingPct}%` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left">
              <div className="text-[11px] uppercase tracking-wide text-white/50">{item.label}</div>
              <div className="text-lg font-semibold">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const DataRefreshOverlay = () => (
    <div
      className={`fixed top-16 right-4 z-[999] w-[320px] bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-4 space-y-2 transition-all duration-200 ${
        isRefreshing ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 border-[3px] border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <Cpu className="w-5 h-5 text-cyan-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">Banka verileri (90g) güncelleniyor...</p>
          <p className="text-xs text-white/60">Hareketler analiz ediliyor</p>
          <div className="w-full mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: "65%" }} />
          </div>
        </div>
      </div>
    </div>
  )

  const Sidebar = () => (
    <aside className="sticky top-0 lg:top-4 h-fit space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30">
          <Banknote className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-white font-semibold">Banka Dashboard</div>
          <div className="text-xs text-white/60">Finansal Hareket Analizi</div>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { id: "overview", label: "Genel Bakış", icon: BarChart3, color: "from-blue-500 to-cyan-500" },
          { id: "transactions", label: "Hareket Listesi", icon: CreditCard, color: "from-emerald-500 to-green-500" },
          { id: "analysis", label: "Analitik Raporlar", icon: PieChart, color: "from-amber-500 to-orange-500" },
          { id: "accounts", label: "Hesap Analizi", icon: Landmark, color: "from-violet-500 to-purple-500" },
          { id: "reports", label: "Yönetim Raporu", icon: FileSpreadsheet, color: "from-pink-500 to-rose-500" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items center gap-3 px-3 py-2 rounded-lg text-sm transition-all bg-gradient-to-r ${item.color} ${
              activeTab === item.id ? "text-white shadow-lg ring-2 ring-white/40" : "text-white/70 hover:text-white opacity-80 hover:opacity-100"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>
    </aside>
  )

  const QuarterHeadline = () => {
    const total3m = last3MonthsStats.reduce((s, m) => s + m.count, 0)
    const financed3m = last3MonthsStats.reduce((s, m) => s + m.financedCount, 0)
    const pending3m = Math.max(0, total3m - financed3m)
    const financedPct = Math.round((financed3m / Math.max(1, total3m)) * 100)
    const pendingPct = 100 - financedPct

    const cards = [
      {
        title: "Toplam İşlem",
        value: formatNumber(total3m),
        chip: "3 Aylık Özet",
        desc: "Son 3 ayda toplam işlem",
        icon: <Activity className="w-4 h-4" />,
        gradient: "from-blue-600/25 to-cyan-500/25",
      },
      {
        title: "Muhasebeleşmiş",
        value: `${formatNumber(financed3m)} • %${financedPct}`,
        chip: "% tamamlandı",
        desc: "Son 3 ayda muhasebeleşen işlem",
        icon: <CheckCircle className="w-4 h-4" />,
        gradient: "from-emerald-500/25 to-green-500/20",
      },
      {
        title: "Bekleyen",
        value: `${formatNumber(pending3m)} • %${pendingPct}`,
        chip: "Tamamlanacak",
        desc: "Son 3 ayda bekleyen işlem",
        icon: <AlertCircle className="w-4 h-4" />,
        gradient: "from-amber-500/25 to-orange-500/20",
      },
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className={`border-white/10 bg-gradient-to-br ${card.gradient} backdrop-blur-xl`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/85 font-semibold">
                  <div className="p-2 rounded-lg bg-white/10">{card.icon}</div>
                  <span className="text-sm">{card.title}</span>
                </div>
                <Badge className="bg-white/15 text-white border-white/20 text-[11px]">{card.chip}</Badge>
              </div>
              <div className="text-2xl font-bold text-white">{card.value}</div>
              <div className="text-xs text-white/70">{card.desc}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const CompactFilterBar = () => {
    const applySearch = () => {
      setSearch(searchDraft.trim())
      setPage(1)
    }

    return (
      <Card className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl border-white/30 shadow-xl">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center justify-between gap-3 sm:hidden">
            <div className="text-white/80 text-sm font-semibold">Filtreler</div>
            <Button
              size="sm"
              variant="ghost"
              className="text-white/80 hover:text-white bg-white/10 border border-white/20"
              onClick={() => setMobileFiltersOpen((s) => !s)}
            >
              {mobileFiltersOpen ? "Kapat" : "Göster"}
            </Button>
          </div>

          <div className={`space-y-3 ${mobileFiltersOpen ? "block" : "hidden sm:block"}`}>
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-3 items-end">
              <div className="flex flex-col gap-2 min-w-0">
                <label className="text-sm text-white/80">Açıklama / ref / banka ara</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      value={searchDraft}
                      onChange={(e) => setSearchDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applySearch()
                      }}
                      placeholder="Örn: havale, referans, hesap no"
                      className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-10"
                    />
                  </div>
                  <Button
                    onClick={applySearch}
                    className="h-10 px-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm hover:from-blue-700 hover:to-cyan-700 gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Ara
                  </Button>
                </div>
              </div>

              <div className="w-full">
                <label className="text-xs text-white/70">Firma (kod sıralı)</label>
                <Select
                  value={firm}
                  onValueChange={(v) => {
                    setFirm(v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white min-w-[140px] h-10">
                    <Landmark className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Firma" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-white/20 max-h-64 overflow-y-auto">
                    <SelectItem value="ALL">Tüm Firmalar</SelectItem>
                    {firmOptions
                      .filter((f) => f !== "ALL")
                      .map((f) => {
                        const label = `${f} • ${firms.find((x) => x.COMPANY.trim() === f)?.FIRMA?.trim() || ""}`
                        return (
                          <SelectItem key={f} value={f}>
                            {label}
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.8fr)] gap-3 items-end">
              <div className="w-full">
                <label className="text-xs text-white/70">Banka</label>
                <Select
                  value={bank}
                  onValueChange={(v) => {
                    setBank(v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-10">
                    <Landmark className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Banka" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-white/20 max-h-64 overflow-y-auto">
                    {banks.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b === "ALL" ? "Tüm Bankalar" : b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full">
                <label className="text-xs text-white/70">Döviz</label>
                <Select
                  value={currency}
                  onValueChange={(v) => {
                    setCurrency(v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white min-w-[120px] h-10">
                    <Coins className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Kur" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-white/20">
                    {currencies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c === "ALL" ? "Tüm Kurlar" : c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full">
                <label className="text-xs text-white/70">Muhasebe Durumu</label>
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v as StatusFilter)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white min-w-[140px] h-10">
                    <FilterIcon className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-white/20">
                    <SelectItem value="ALL">Tümü</SelectItem>
                    <SelectItem value="FINANCED">Muhasebeleşmiş</SelectItem>
                    <SelectItem value="PENDING">Bekleyen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full">
                <label className="text-xs text-white/70">İşlem Tipi</label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v as TypeFilter)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white min-w-[140px] h-10">
                    <Activity className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Tip" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-white/20">
                    <SelectItem value="ALL">Tümü</SelectItem>
                    <SelectItem value="DEBIT">Çıkış (D)</SelectItem>
                    <SelectItem value="CREDIT">Giriş (C)</SelectItem>
                    <SelectItem value="BALANCE">Bakiye (B)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-white/70">IBAN</label>
                <Input
                  value={ibanFilter}
                  onChange={(e) => {
                    setIbanFilter(e.target.value)
                    setPage(1)
                  }}
                  placeholder="TRxx xxxx xxxx"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-10 max-w-full md:max-w-[240px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const TransactionModal = () => {
    if (!selectedTransaction) return null
    const t = selectedTransaction
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTransactionModal(false)} />
        <div className="relative w-full max-w-4xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Hareket Detayları</h2>
                  <p className="text-white/60">{t.transaction.explanation || "Açıklama yok"}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowTransactionModal(false)} className="text-white/60 hover:text-white hover:bg-white/10">
                <AlertCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                    <Banknote className="w-4 h-4" />
                    Hareket Bilgileri
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Tarih:</span>
                      <span className="text-white font-medium">{t.transaction.dateTime || t.transaction.date || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Saat:</span>
                      <span className="text-white font-medium">{t.transaction.time || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Tutar:</span>
                      <Badge className={t.transaction.amount >= 0 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}>
                        {formatCurrency(t.transaction.amount)} {t.transaction.currency}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Tip:</span>
                      <Badge
                        className={
                          t.transaction.type === "CREDIT"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : t.transaction.type === "DEBIT"
                            ? "bg-red-500/20 text-red-300 border-red-500/30"
                            : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        }
                      >
                        {t.transaction.type}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Muhasebe Durumu:</span>
                      <Badge className={t.transaction.isFinanced ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}>
                        {t.transaction.isFinanced ? "Muhasebeleşmiş" : "Bekleyen"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Bakiye Sonrası:</span>
                      <span className="text-white font-medium">{formatCurrency(t.transaction.balanceAfter)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                    <Landmark className="w-4 h-4" />
                    Banka Bilgileri
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Banka:</span>
                      <span className="text-white font-medium">{t.bankAccount.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Hesap No:</span>
                      <span className="text-white font-medium">{t.bankAccount.number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">IBAN:</span>
                      <span className="text-white font-medium">{t.bankAccount.iban || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Kur:</span>
                      <span className="text-white font-medium">{t.bankAccount.currency}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Mevcut Bakiye:</span>
                      <span className="text-white font-medium">{formatCurrency(t.bankAccount.balances.current)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Muhasebe Bağlantısı
                  </h3>
                  <div className="space-y-3">
                    {t.accounting.finance ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Fiş No:</span>
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">{t.accounting.finance.docNum}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Fiş Tipi:</span>
                          <span className="text-white font-medium">{t.accounting.finance.docType}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Borç:</span>
                          <span className="text-white font-medium">{formatCurrency(t.accounting.finance.amounts.debit)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Alacak:</span>
                          <span className="text-white font-medium">{formatCurrency(t.accounting.finance.amounts.credit)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Toplam:</span>
                          <span className="text-white font-medium">{formatCurrency(t.accounting.finance.amounts.total)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-500/50" />
                        <p className="text-white/60">Bu hareket henüz muhasebeleşmemiş.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Sistem Bilgileri
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Referans ID:</span>
                      <span className="text-white font-medium">{t.referenceId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Instance ID:</span>
                      <span className="text-white font-medium">{t.instanceId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Şirket:</span>
                      <span className="text-white font-medium">{t.system.company}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Oluşturan:</span>
                      <span className="text-white font-medium">{t.system.created.by}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Son Güncelleme:</span>
                      <span className="text-white font-medium">{t.system.updated.at || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/10 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowTransactionModal(false)} className="text-white bg-white/10 hover:bg-white/15 border border-white/20">
              Kapat
            </Button>
            {!t.accounting.finance && (
              <Button className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Muhasebeleştir
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const OverviewSection = () => {
    const statusSegments = [
      { label: "Muhasebeleşmiş", value: summaryFinanced, color: "#22c55e" },
      { label: "Bekleyen", value: summaryPending, color: "#f59e0b" },
    ]
    const bankBar = bankStats.slice(0, 8).map((b, idx) => ({
      label: b.bank,
      value: b.amount,
      color: ["#38bdf8", "#22c55e", "#f59e0b", "#a855f7", "#ef4444", "#f472b6", "#0ea5e9", "#10b981"][idx % 8],
    }))

    return (
      <div className="space-y-6">
        <QuarterHeadline />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-white/80">
                <BarChart3 className="w-4 h-4" />
                Bankalara Göre Tutar (büyük görünüm)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {bankStats.slice(0, 8).map((b, idx) => (
                  <div key={b.bank} className="space-y-1">
                    <div className="flex items-center justify-between text-sm text-white/80">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: bankBar[idx]?.color }} />
                        {b.bank}
                      </span>
                      <span className="text-white font-semibold">{formatCurrency(b.amount)}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        style={{ width: `${(b.amount / Math.max(1, bankStats[0]?.amount || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-white/60">
                      <span>
                        {b.count} işlem • {b.financed} muhasebeleşmiş / {b.pending} bekleyen
                      </span>
                      <span>
                        Muhasebe: {formatCurrency(b.financedAmount)} | Bekleyen: {formatCurrency(b.pendingAmount)}
                      </span>
                    </div>
                  </div>
                ))}
                {!bankStats.length && <div className="text-white/50 text-sm">Kayıt bulunamadı.</div>}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-white/80">
                <CheckCircle className="w-4 h-4" />
                Muhasebe Özeti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/80">
              <div className="grid grid-cols-2 gap-2">
                <SummaryBadge label="Muhasebeleşmiş" value={`${summaryFinanced} (${summaryFinancedRatio}%)`} color="emerald" />
                <SummaryBadge label="Bekleyen" value={`${summaryPending} (${summaryPendingRatio}%)`} color="amber" />
                <SummaryBadge label="Muhasebeleşen Tutar" value={formatCurrency(financedAmounts.financedSum)} color="blue" />
                <SummaryBadge label="Bekleyen Tutar" value={formatCurrency(financedAmounts.pendingSum)} color="orange" />
              </div>
              <div className="rounded-lg border border-white/10 p-3 bg-white/5">
                <div className="text-xs text-white/60 mb-1">Muhasebe Durumu</div>
                <DonutChart segments={statusSegments} centerLabel={`${summaryTotal}`} size={150} thickness={26} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_0.7fr] gap-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-white/80">
                <Landmark className="w-4 h-4" />
                Günlük İşlem Analizi (Son 10 Gün)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailyStats.map((stat) => (
                  <div
                    key={stat._k}
                    className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm transition hover:border-cyan-400/40"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 text-sm text-white/90">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-md bg-white/10 border border-white/20 text-xs font-semibold">{stat.date}</span>
                        <span className="text-white/60">Toplam</span>
                        <span className="font-semibold text-white">{formatCurrency(stat.total)}</span>
                      </div>
                      <div className="text-white/70 text-xs lg:text-sm flex flex-wrap gap-3">
                        <span>İşlem: {stat.count}</span>
                        <span>
                          Gelen: {stat.creditCount} • {formatCurrency(stat.creditAmt)}
                        </span>
                        <span>
                          Giden: {stat.debitCount} • {formatCurrency(stat.debitAmt)}
                        </span>
                        <span>Muhasebeleşmiş: {stat.financedCount}</span>
                      </div>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-cyan-500 rounded-full"
                        style={{ width: `${(stat.total / maxDailyTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {!dailyStats.length && <div className="text-white/50 text-sm">Kayıt bulunamadı.</div>}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl self-stretch lg:self-start lg:w-[320px] lg:ml-auto">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-white/80">
                  <CheckCircle className="w-4 h-4" />
                  Kullanıcı Bazlı Muhasebeleştirme (Top 5)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {financeUserStats.length ? (
                  financeUserStats.map((u, idx) => (
                    <div key={u.user} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                      <Badge className="bg-blue-500/15 text-blue-200 border-blue-500/30 text-[11px] px-2">#{idx + 1}</Badge>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold truncate">{u.user}</div>
                        <div className="text-xs text-white/60 truncate">Muhasebeleştirilen belge</div>
                      </div>
                      <div className="text-lg font-bold text-white">{u.count}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-white/60 text-sm">Henüz muhasebeleşmiş belge yok.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const TransactionsSection = () => (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-white text-base">Hareket Listesi</CardTitle>
          <div className="text-xs text-white/60">
            {filtered.length} / {data?.summary.total ?? 0} kayıt • Son güncelleme: {data?.summary.lastUpdate || "-"}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-white/10 p-1 border border-white/10">
            {[
              { key: "ALL", label: "Tümü" },
              { key: "FINANCED", label: "Muhasebeleşen" },
              { key: "PENDING", label: "Muhasebeleşmeyen" },
            ].map((opt) => (
              <Button
                key={opt.key}
                size="sm"
                variant="ghost"
                onClick={() => {
                  setStatus(opt.key as StatusFilter)
                  setPage(1)
                }}
                className={`px-3 h-8 text-xs ${status === opt.key ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white" : "text-white/70 hover:text-white"}`}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={downloadCSV}
            disabled={!filtered.length}
            className="text-white bg-white/10 hover:bg-white/15 border border-white/20"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="hidden md:block overflow-x-auto">
          <Table className="min-w-full text-xs sm:text-sm">
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white/70 w-[140px]">Tarih</TableHead>
                <TableHead className="text-white/70 w-[220px]">Banka / Hesap</TableHead>
                <TableHead className="text-white/70 w-[260px]">Açıklama</TableHead>
                <TableHead className="text-white/70 w-[140px]">Tutar</TableHead>
                <TableHead className="text-white/70 w-[140px]">Muhasebe</TableHead>
                <TableHead className="text-white/70 w-[120px]">Fiş</TableHead>
                <TableHead className="text-white/70 w-[120px]">Firma</TableHead>
                <TableHead className="text-white/70 w-[90px]">Detay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedTransactions.map((row, idx) => (
                <TableRow
                  key={`${row.id}-${row.referenceId}-${row.transaction.dateTime || row.transaction.date || "na"}-${idx}`}
                  className="border-white/5 hover:bg-white/5"
                >
                  <TableCell className="text-sm text-white">
                    <div>{row.transaction.dateTime || row.transaction.date || "-"}</div>
                    <div className="text-[11px] text-white/50">{row.transaction.time || ""}</div>
                  </TableCell>
                  <TableCell className="text-sm text-white/80">
                    <div className="font-semibold text-white">{row.bankAccount.name}</div>
                    <div className="text-[11px] text-white/50 break-all">{row.bankAccount.number}</div>
                    <div className="text-[11px] text-white/50 break-all">IBAN: {row.bankAccount.iban || "-"}</div>
                    <div className="text-[11px] text-white/50">Kur: {row.transaction.currency}</div>
                  </TableCell>
                  <TableCell className="text-sm text-white/80 whitespace-normal break-words max-w-[260px]">
                    <div className="line-clamp-2">{row.transaction.explanation || "—"}</div>
                    <div className="text-[11px] text-white/50 break-all">Ref: {row.referenceId}</div>
                  </TableCell>
                  <TableCell className="text-sm font-semibold">
                    <span className={row.transaction.amount >= 0 ? "text-emerald-300" : "text-rose-300"}>
                      {row.transaction.amount >= 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(row.transaction.amount))}
                    </span>
                    <div className="text-[11px] text-white/50">Bakiye: {formatCurrency(row.transaction.balanceAfter)}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Badge
                      className={`text-[11px] ${
                        row.transaction.isFinanced ? "bg-blue-500/15 text-blue-200 border-blue-500/30" : "bg-amber-500/15 text-amber-100 border-amber-500/30"
                      }`}
                    >
                      {row.transaction.isFinanced ? "Muhasebeleşmiş" : "Bekleyen"}
                    </Badge>
                    <div className="text-[11px] text-white/50 flex items-center gap-1 mt-1">
                      {row.transaction.type === "CREDIT" ? (
                        <ArrowUpRight className="w-3 h-3 text-emerald-300" />
                      ) : row.transaction.type === "DEBIT" ? (
                        <ArrowDownRight className="w-3 h-3 text-rose-300" />
                      ) : (
                        <Info className="w-3 h-3 text-white/40" />
                      )}
                      {row.transaction.type}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-white/80">
                    {row.accounting.finance ? (
                      <div className="space-y-0.5">
                        <Badge className="bg-emerald-500/15 text-emerald-200 border-emerald-500/30 text-[11px]">{row.accounting.finance.docNum}</Badge>
                        <div className="text-[11px] text-white/50">{row.accounting.finance.docType}</div>
                      </div>
                    ) : (
                      <Badge className="bg-slate-500/15 text-slate-200 border-slate-500/30 text-[11px]">Yok</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-white/80">
                    <div className="font-semibold text-white">{row.system.company || "-"}</div>
                    <div className="text-[11px] text-white/50">Client: {row.system.client || "-"}</div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTransaction(row)
                        setShowTransactionModal(true)
                      }}
                      className="text-white bg-white/10 hover:bg-blue-600/80 hover:text-white border border-white/20 px-3"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!pagedTransactions.length && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-white/60">
                    Kayıt bulunamadı.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="md:hidden space-y-3 px-4 pb-4">
          {pagedTransactions.map((row, idx) => (
            <div key={`${row.id}-${idx}`} className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-sm space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-white font-semibold">{row.bankAccount.name}</div>
                  <div className="text-xs text-white/50">{row.transaction.dateTime || row.transaction.date || "-"}</div>
                  <div className="text-[11px] text-white/40">{row.transaction.time || ""}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${row.transaction.amount >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {row.transaction.amount >= 0 ? "+" : "-"}
                    {formatCurrency(Math.abs(row.transaction.amount))}
                  </div>
                  <div className="text-[11px] text-white/50">Bakiye: {formatCurrency(row.transaction.balanceAfter)}</div>
                </div>
              </div>
              <div className="text-sm text-white/80 break-words">{row.transaction.explanation || "—"}</div>
              <div className="text-[11px] text-white/50 break-all">Ref: {row.referenceId}</div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={`text-[11px] ${
                    row.transaction.isFinanced ? "bg-blue-500/15 text-blue-200 border-blue-500/30" : "bg-amber-500/15 text-amber-100 border-amber-500/30"
                  }`}
                >
                  {row.transaction.isFinanced ? "Muhasebeleşmiş" : "Bekleyen"}
                </Badge>
                <Badge
                  className={
                    row.transaction.type === "CREDIT"
                      ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
                      : row.transaction.type === "DEBIT"
                      ? "bg-rose-500/15 text-rose-200 border-rose-500/30"
                      : "bg-slate-500/15 text-slate-200 border-slate-500/30"
                  }
                >
                  {row.transaction.type}
                </Badge>
                <Badge className="bg-slate-500/15 text-slate-200 border-slate-500/30 text-[11px]">Kur: {row.transaction.currency}</Badge>
                <Badge className="bg-slate-500/15 text-slate-200 border-slate-500/30 text-[11px]">Firma: {row.system.company || "-"}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTransaction(row)
                    setShowTransactionModal(true)
                  }}
                  className="ml-auto text-white bg-white/10 hover:bg-blue-600/80 hover:text-white border border-white/20 px-3"
                >
                  <Eye className="w-4 h-4" />
                  <span className="ml-1 text-xs">Detay</span>
                </Button>
              </div>
            </div>
          ))}
          {!pagedTransactions.length && <div className="text-center text-white/60 text-sm">Kayıt bulunamadı.</div>}
        </div>

        {filtered.length > 0 && (
          <div className="p-4 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-white/60">
              Sayfa {page} / {Math.ceil(filtered.length / pageSize)} • Toplam {filtered.length} kayıt
            </div>
            <div className="flex items-center gap-3">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="bg-white/5 rounded px-3 py-1.5 text-sm text-white border border-white/20"
              >
                <option value={10}>10 / sayfa</option>
                <option value={20}>20 / sayfa</option>
                <option value={50}>50 / sayfa</option>
                <option value={100}>100 / sayfa</option>
              </select>

              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="text-white/60 hover:text-white">
                  Önceki
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage((p) => Math.min(Math.ceil(filtered.length / pageSize), p + 1))} disabled={page >= Math.ceil(filtered.length / pageSize)}
                  className="text-white/60 hover:text-white"
                >
                  Sonraki
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const AnalysisSection = () => {
    const totalPendingAmount = financedAmounts.pending.reduce((s, r) => s + Math.abs(r.transaction.amount), 0)
    const totalFinancedAmount = financedAmounts.financed.reduce((s, r) => s + Math.abs(r.transaction.amount), 0)
    const topBank = bankStats[0]
    const avgPerDayCalc = avgPerDay
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Toplam Muhasebeleşen Tutar" value={formatCurrency(totalFinancedAmount)} icon={<CheckCircle className="w-4 h-4" />} color="from-emerald-500/25 to-teal-500/25" />
          <KpiCard title="Toplam Bekleyen Tutar" value={formatCurrency(totalPendingAmount)} icon={<AlertCircle className="w-4 h-4" />} color="from-amber-500/25 to-orange-500/25" />
          <KpiCard title="En Aktif Banka" value={topBank ? `${topBank.bank} (${topBank.count})` : "-"} icon={<Landmark className="w-4 h-4" />} color="from-blue-500/25 to-cyan-500/25" />
          <KpiCard title="Günlük Ortalama İşlem" value={`${formatNumber(Math.round(avgPerDayCalc))} adet`} icon={<Activity className="w-4 h-4" />} color="from-purple-500/25 to-pink-500/25" />
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CheckCircle className="w-5 h-5" />
              Muhasebe Durumu Detayı
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-white/80">
            <StatRow label="Toplam işlem" value={formatNumber(filtered.length)} />
            <StatRow label="Muhasebeleşmiş" value={`${financedCount} (${financedRatio}%)`} />
            <StatRow label="Bekleyen" value={`${pendingCount} (${100 - financedRatio}%)`} />
            <StatRow label="Muhasebeleşen tutar" value={formatCurrency(totalFinancedAmount)} />
            <StatRow label="Bekleyen tutar" value={formatCurrency(totalPendingAmount)} />

            <div className="rounded-lg border border-white/10 p-3 bg-white/5 space-y-3">
              <div className="text-xs text-white/60 mb-1">Bankalara göre durum (muhasebeleşmiş / bekleyen)</div>
              <div className="space-y-2">
                {bankStats.length ? (
                  bankStats.map((b) => {
                    const ratio = Math.round((b.financed / Math.max(1, b.count)) * 100)
                    return (
                      <div key={b.bank} className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1">
                        <div className="flex items-center justify-between text-sm text-white">
                          <span className="font-semibold">{b.bank}</span>
                          <span className="text-xs text-white/60">{b.count} işlem</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px] text-white/70">
                          <span>Muhasebeleşmiş: {b.financed}</span>
                          <span>Bekleyen: {b.pending}</span>
                          <span>Muhasebe Tutarı: {formatCurrency(b.financedAmount)}</span>
                          <span>Bekleyen Tutar: {formatCurrency(b.pendingAmount)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${ratio}%` }} />
                          </div>
                          <span className="text-xs text-white/70">{ratio}%</span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-white/60 text-xs">Veri yok</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const AccountsSection = () => (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5" />
            3 Aylık Özet (Ay Bazlı)
          </CardTitle>
          {!last3MonthsStats.some((m) => m.count > 0) && (
            <div className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-md px-3 py-2">
              Son 3 ay için henüz kayıt yok. Son 3 ay toplamı gösteriliyor.
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {last3MonthsStats.map((m) => (
              <div key={m.key} className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-1">
                <div className="flex items-center justify-between text-sm text-white/80">
                  <span className="capitalize">{m.label}</span>
                  <span className="text-white font-semibold">{m.count} işlem</span>
                </div>
                <div className="text-[12px] text-white/70 grid grid-cols-2 gap-1">
                  <span>Toplam: {formatCurrency(m.total)}</span>
                  <span>Muhasebeleşmiş: {m.financedCount}</span>
                  <span>
                    Gelen: {m.creditCount} • {formatCurrency(m.creditAmt)}
                  </span>
                  <span>
                    Giden: {m.debitCount} • {formatCurrency(m.debitAmt)}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-cyan-500"
                    style={{ width: `${(m.total / maxMonthlyTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5" />
            Günlük İşlem Analizi (Son 30 Gün)
          </CardTitle>
          {!last30DayStats.length && (
            <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md px-3 py-2">
              Son 1 ayda veri bulunamadı. Yeni hareketler geldiğinde grafik güncellenecek.
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {last30DayStats.map((stat) => (
              <div key={stat.date} className="space-y-2 p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-sm text-white/80">
                  <span>{stat.date}</span>
                  <span className="text-white font-medium">
                    {stat.count} işlem • {formatCurrency(stat.total)}
                  </span>
                </div>
                <div className="text-[12px] text-white/70 grid grid-cols-2 gap-1">
                  <span>
                    Gelen: {stat.creditCount} • {formatCurrency(stat.creditAmt)}
                  </span>
                  <span>
                    Giden: {stat.debitCount} • {formatCurrency(stat.debitAmt)}
                  </span>
                  <span>Muhasebeleşmiş: {stat.financedCount}</span>
                  <span>Toplam: {stat.count}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-cyan-500 rounded-full"
                    style={{ width: `${(stat.total / max30DayTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {!last30DayStats.length && <div className="text-white/50 text-sm">Son 30 günde veri yok.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const ExecutiveSummarySection = () => (
    <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-800/80 border border-white/10 shadow-2xl">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PieChart className="w-5 h-5 text-amber-200" />
            <h3 className="text-xl font-semibold text-white">Yönetim İçgörü Panosu (AI destekli)</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { title: "Likit Akış", value: formatCurrency(totals.net), sub: `Net: ${totals.net >= 0 ? "Pozitif" : "Negatif"}`, color: "from-emerald-500/25 to-teal-500/25", icon: DollarSign },
            { title: "Muhasebe Oranı", value: `${financedRatio}%`, sub: `${financedCount} / ${filtered.length || 1}`, color: "from-amber-500/25 to-orange-500/25", icon: CheckCircle },
            { title: "Ort. İşlem", value: formatCurrency(avgTicket), sub: `Maks: ${formatCurrency(maxAbs)}`, color: "from-cyan-500/25 to-blue-500/25", icon: CreditCard },
            { title: "Günlük İşlem", value: formatNumber(Math.round(avgPerDay)), sub: "Son 30 gün ortalaması", color: "from-violet-500/25 to-fuchsia-500/25", icon: Activity },
          ].map((card) => (
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-sm text-white font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              AI Önerileri
            </div>
            <ul className="text-sm text-white/80 space-y-2 list-disc pl-4">
              <li>Bekleyen işlemler için otomatik muhasebe kuralları: yüksek tutarlı, tekrarlı açıklamalara öncelik verin.</li>
              <li>En aktif banka {bankStats[0]?.bank || "—"} üzerinde finansman yoğun; komisyon pazarlığı fırsatı var.</li>
              <li>Günlük ortalama {formatNumber(Math.round(avgPerDay))} işlem; pik günler için kontrolleri sıklaştırın.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-sm text-white font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-300" />
              Risk & Radar
            </div>
            <ul className="text-sm text-white/80 space-y-2 list-disc pl-4">
              <li>
                {pendingCount} işlem bekliyor (%{100 - financedRatio}); SLA aşımı yaklaşanlar önceliklendirilmeli.
              </li>
              <li>En büyük bekleyen tutar: {formatCurrency(Math.abs(financedAmounts.pendingSum))}; nakit akışı planına etkisi kontrol edilmeli.</li>
              <li>Kur dağılımında {currencyStats[0]?.currency || "—"} öne çıkıyor; hedge ihtiyacı gözden geçirilsin.</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading || totalsLoading) return <LoadingScreen />

  const userDisplay = user?.display || user?.username || "Kullanıcı"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950/80 to-cyan-950/60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-emerald-500/10 rounded-full blur-3xl animate-spin-slow" />
        </div>
      </div>

      <DataRefreshOverlay />

      <div className="relative z-10">
        <nav className="sticky top-0 z-40 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border-b border-white/10 px-4 md:px-6 py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 md:gap-4">
                <Link href="/dashboard" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
                  <div className="relative p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 group-hover:from-blue-500/30 group-hover:to-cyan-500/30">
                    <ChevronLeft className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">Modüllere Dön</span>
                </Link>

                <div className="hidden sm:block h-6 w-px bg-white/20" />

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-30" />
                    <div className="relative p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg">
                      <Banknote className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold text-white truncate">Banka Ekstreleri</h1>
                    <p className="text-sm text-white/60 truncate">Finansal Hareket Dashboard</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    fetchData()
                    fetchTotals()
                  }}
                  disabled={isRefreshing}
                  className="gap-2 text-white/60 hover:text-white border border-white/10 backdrop-blur-sm hover:bg-white/5"
                >
                  {isRefreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span className="hidden md:inline">Yenile</span>
                </Button>

                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg border border-white/15 text-white/80">
                      <User className="w-4 h-4 text-white/80" />
                      <span className="text-sm truncate max-w-[160px]">{userDisplay}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={logout}
                      className="gap-2 text-white bg-white/10 hover:bg-white/15 border border-white/20 px-3"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Çıkış</span>
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="gap-2 text-white/70 hover:text-white border border-white/10 backdrop-blur-sm hover:bg-white/5">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Çıkış</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <CurrencyNavStats cards={currencyNavCards} />
              {totalsError && <span className="text-xs text-amber-300">{totalsError}</span>}
            </div>
          </div>
        </nav>

        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-4">
            <Sidebar />

            <div className="space-y-6">
              <CompactFilterBar />

              {activeTab === "overview" && <OverviewSection />}
              {activeTab === "transactions" && <TransactionsSection />}
              {activeTab === "analysis" && <AnalysisSection />}
              {activeTab === "accounts" && <AccountsSection />}
              {activeTab === "reports" && <ExecutiveSummarySection />}

              <div className="mt-8 border-t border-white/10 pt-6 pb-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left w-full">
                    <p className="text-sm text-white/40">© 2025 Banka Dashboard • Tüm Hakları Saklıdır</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showTransactionModal && <TransactionModal />}

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
              <AlertCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {showScrollTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-4 z-50 p-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-2xl border border-white/20 hover:scale-105 transition-transform backdrop-blur-lg"
            aria-label="Yukarı çık"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}

/* --- Helper Components --- */

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  )
}

function SummaryBadge({ label, value, color }: { label: string; value: string; color: "emerald" | "amber" | "blue" | "orange" }) {
  const colorMap: Record<typeof color, string> = {
    emerald: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-200 border-amber-500/30",
    blue: "bg-blue-500/15 text-blue-200 border-blue-500/30",
    orange: "bg-orange-500/15 text-orange-200 border-orange-500/30",
  }
  return (
    <div className={`p-3 rounded-lg border ${colorMap[color]} text-[12px]`}>
      <div className="text-white/70">{label}</div>
      <div className="text-white font-semibold">{value}</div>
    </div>
  )
}

function KpiCard({ title, value, sub, icon, color }: { title: string; value: string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`p-4 rounded-xl border border-white/10 bg-gradient-to-br ${color} text-white/90`}>
      <div className="flex items-center gap-2 text-sm font-semibold mb-1">
        {icon}
        {title}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-white/70">{sub}</div>}
    </div>
  )
}

function DonutChart({
  segments,
  size = 140,
  thickness = 24,
  centerLabel,
}: {
  segments: { label: string; value: number; color: string }[]
  size?: number
  thickness?: number
  centerLabel?: string
}) {
  const total = Math.max(1, segments.reduce((s, seg) => s + seg.value, 0))
  let current = 0
  const gradient = segments
    .map((seg) => {
      const start = (current / total) * 360
      const end = ((current + seg.value) / total) * 360
      current += seg.value
      return `${seg.color} ${start}deg ${end}deg`
    })
    .join(", ")
  return (
    <div className="flex flex-col gap-2">
      <div className="relative mx-auto" style={{ width: size, height: size }}>
        <div className="rounded-full" style={{ width: size, height: size, background: `conic-gradient(${gradient})` }} />
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
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-white/80">
            <span className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
            <span className="truncate">{seg.label}</span>
            <span className="text-white/60 ml-auto text-[10px]">
              {seg.value} • {Math.round((seg.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CurrencyNavStats({ cards }: { cards: CurrencyNavCard[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full">
      {cards.map((card, idx) => (
        <div
          key={`${card.currency}-${idx}`}
          className={`rounded-xl border border-white/20 ring-1 ring-white/10 bg-white/10 backdrop-blur-xl px-4 py-3 text-white/90 shadow-lg transition-transform hover:translate-y-0.5 hover:shadow-xl bg-gradient-to-br ${card.bg}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white/10">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="text-sm font-semibold">{card.currency}</div>
            </div>
            <div className="text-[11px] text-white/60">{formatNumber(card.total)} işlem</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px] text-white/75">
            <div className="space-y-0.5">
              <div className="text-white font-semibold">Muhasebeleşen</div>
              <div>
                {formatNumber(card.financedCount)} • %{card.financedPct}
              </div>
              <div className="text-white/60">{formatCurrency(card.financedAmt, card.currency)}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-white font-semibold">Bekleyen</div>
              <div>
                {formatNumber(card.pendingCount)} • %{card.pendingPct}
              </div>
              <div className="text-white/60">{formatCurrency(card.pendingAmt, card.currency)}</div>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${card.bar}`} style={{ width: `${card.financedPct}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}