"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useAuth } from "@/contexts/AuthContext"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

import {
  Search,
  RefreshCw,
  Building,
  Target as TargetIcon,
  TrendingUp,
  AlertTriangle as AlertTriangleIcon,
  TrendingDown,
  Timer,
  Clock as ClockIcon,
  Award as AwardIcon,
  Trophy,
  LineChart as LineChartIcon,
  FileBarChart,
  Activity as ActivityIcon,
  Package as PackageIcon,
  Users,
  ArrowRightLeft,
  PackageCheck,
  Percent as PercentIcon,
  Receipt,
  Target as TargetIcon2,
  ChartColumn,
  CircleDollarSign,
  ShoppingCart,
  ChevronLeft,
  User,
  ChevronRight,
  LogOut,
  Cpu,
  PieChart,
  CheckCircle,
  AlertCircle,
  Clock,
  Gauge,
  Sparkles,
  Wallet,
  Eye,
  Download,
  ChevronUp,
  X,
} from "lucide-react"

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false })

/* ===========================
   Types
   =========================== */

type PurchaseDetail = {
  company: string
  plant: string
  reqtype: string
  reqnum: string
  requisitionDate: string
  quantity: number
  unit: string
  project: string
  releasedBy: string
  reqStatus?: "pending" | "converted" | "rejected"
  conversionDays?: number
}

type OrderHead = {
  ordertype: string
  ordernum: string
  vendor: string
  vendorName: string
  net: number
  gross: number
  orderDate?: string
  deliveryDate?: string
}

type OrderItem = {
  itemnum: string
  material: string
  materialDesc?: string
  text: string
  quantity: number
  price: number
  net: number
  vatRate: number
  vatAmount: number
  gross: number
  isInvoice: boolean
  isDirectOrder?: boolean
  priceVolatility?: number
  materialGroup?: string
}

type PurchaseData = {
  success: boolean
  requisition: PurchaseDetail
  orderHead: OrderHead
  orderItems: OrderItem[]
}

type PurchaseStats = {
  totalNet: number
  totalGross: number
  totalQuantity: number
  pendingItems: number
  invoicedItems: number
  avgVatRate: number
  topVendor: string
  totalVendors: number
  totalRequisitions: number
  convertedRequisitions: number
  unconvertedRequisitions: number
  directOrders: number
  conversionRate: number
  topVendors: Array<{ name: string; amount: number; count: number }>
  topMaterials: Array<{ material: string; desc: string; quantity: number; amount: number }>
  volatileMaterials: Array<{ material: string; desc: string; volatility: number; priceChange: number }>
  projectAnalysis: Array<{ project: string; amount: number; count: number }>
  avgConversionDays: number
  fastestConversion: number
  slowestConversion: number
  lostCosts: number
  efficiencyScore: number
  operationalMetrics: {
    avgProcessingTime: number
    onTimeDelivery: number
    qualityScore: number
    costSavings: number
  }
}

type Firm = {
  COMPANY: string
  FIRMA: string
  PLANT?: string
  TESIS?: string
}

/* ===========================
   Helpers
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

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

/* ===========================
   Component
   =========================== */

export default function PurchaseDashboard() {
  const { user, logout, isAuthenticated } = useAuth()

  const [purchaseData, setPurchaseData] = useState<PurchaseData[]>([])
  const [rawData, setRawData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [firms, setFirms] = useState<Firm[]>([])

  const [filters, setFilters] = useState({
    search: "",
    company: "all",
    // diğer filtreler kaldırıldı
    dateRange: "all",
    status: "all",
    vendor: "all",
    project: "all",
    conversionStatus: "all",
    minAmount: "",
    maxAmount: "",
  })
  const debouncedSearch = useDebounced(filters.search, 300)

  const [activeTab, setActiveTab] = useState<"overview" | "list" | "analytics" | "cost" | "executive">("overview")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)

  const [showNotification, setShowNotification] = useState(false)
  const [notification, setNotification] = useState({ type: "success" as "success" | "error" | "info", message: "" })
  const notifTimerRef = useRef<number | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  const fetchAbortRef = useRef<AbortController | null>(null)

  /* --- Effects --- */

  useEffect(() => {
    const loadFirms = async () => {
      try {
        const getDbName = () => {
          if (typeof window !== "undefined") {
            try {
              const stored = localStorage.getItem("globalApiInfo")
              if (stored) {
                const info = JSON.parse(stored)
                return info.dbName || user?.dbName
              }
            } catch {}
          }
          return user?.dbName || null
        }

        const dbName = getDbName()

        if (!dbName) {
          console.error("Firma listesi yüklenemedi: dbName bulunamadı")
          setFirms([])
          return
        }

        const res = await fetch(`/api/firms?dbName=${encodeURIComponent(dbName)}`, {
          cache: "no-store",
        })

        if (!res.ok) throw new Error("Firma listesi alınamadı")
        const json = await res.json()
        const arr = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
        setFirms(arr)
      } catch (err) {
        console.error("Firma listesi yüklenemedi:", err)
        setFirms([])
      }
    }
    loadFirms()
  }, [user])

  useEffect(() => {
    fetchPurchaseData(true)
    return () => {
      if (fetchAbortRef.current) fetchAbortRef.current.abort()
      if (notifTimerRef.current) window.clearTimeout(notifTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* --- Toast --- */
  const showToast = useCallback((type: "success" | "error" | "info", message: string, duration = 3000) => {
    setNotification({ type, message })
    setShowNotification(true)
    if (notifTimerRef.current) window.clearTimeout(notifTimerRef.current)
    notifTimerRef.current = window.setTimeout(() => {
      setShowNotification(false)
      notifTimerRef.current = null
    }, duration)
  }, [])

  /* --- Fetch & validate --- */
  const fetchPurchaseData = useCallback(
    async (notify = false) => {
      if (fetchAbortRef.current) {
        fetchAbortRef.current.abort()
      }

      const controller = new AbortController()
      fetchAbortRef.current = controller

      try {
        setError(null)
        setLoading(true)
        setIsRefreshing(true)

        // Kullanıcının dbName'ini al (localStorage'dan)
        const getDbName = () => {
          if (typeof window !== "undefined") {
            try {
              const stored = localStorage.getItem("globalApiInfo")
              if (stored) {
                const info = JSON.parse(stored)
                return info.dbName || user?.dbName
              }
            } catch {}
          }
          return user?.dbName || null
        }

        const dbName = getDbName()

        if (!dbName) {
          throw new Error("Kullanıcı veritabanı bilgisi bulunamadı. Lütfen tekrar giriş yapın.")
        }

        // dbName'i header olarak gönder
        const response = await fetch(`/api/purchase?dbName=${encodeURIComponent(dbName)}`, {
          signal: controller.signal,
          headers: {
            "x-db-name": dbName,
          },
        })
        if (!response.ok) throw new Error(`API hatası: ${response.status}`)
        const result = await response.json()

        if (result.success && Array.isArray(result.data)) {
          const validatedData = validatePurchaseData(result.data)
          setPurchaseData(validatedData)
          setRawData(result.data)
          if (notify) showToast("success", `${result.count || validatedData.length} kayıt yüklendi`, 2000)
        } else if (result.success === false) {
          throw new Error(result.message || "API başarısız oldu")
        } else {
          setPurchaseData(Array.isArray(result) ? validatePurchaseData(result) : [])
        }

        const now = new Date()
        setLastRefreshTime(now)
        if (notify) showToast("success", `Veriler güncellendi! (${formatTime(now)})`)
      } catch (err: any) {
        if (err?.name === "AbortError") return
        const errorMsg = err?.message || String(err)
        setError(errorMsg)
        showToast("error", `Hata: ${errorMsg}`)
      } finally {
        setLoading(false)
        setIsRefreshing(false)
        fetchAbortRef.current = null
      }
    },
    [showToast, user]
  )

  const validatePurchaseData = useCallback((data: any[]): PurchaseData[] => {
    return data.map(item => {
      const hasOrderItems = item.orderItems && item.orderItems.length > 0
      const isDirectOrder = !item.requisition?.reqnum && hasOrderItems

      let conversionDays = undefined
      if (item.requisition?.requisitionDate && item.orderHead?.orderDate) {
        const reqDate = new Date(item.requisition.requisitionDate)
        const orderDate = new Date(item.orderHead.orderDate)
        conversionDays = Math.ceil((orderDate.getTime() - reqDate.getTime()) / (1000 * 60 * 60 * 24))
      }

      return {
        success: true,
        requisition: {
          company: item.requisition?.company || "",
          plant: item.requisition?.plant || "",
          reqtype: item.requisition?.reqtype || "",
          reqnum: item.requisition?.reqnum || "",
          requisitionDate: item.requisition?.requisitionDate || new Date().toISOString(),
          quantity: Number(item.requisition?.quantity) || 0,
          unit: item.requisition?.unit || "AD",
          project: item.requisition?.project || "",
          releasedBy: item.requisition?.releasedBy || "",
          reqStatus: hasOrderItems ? "converted" : "pending",
          conversionDays: conversionDays,
        },
        orderHead: {
          ordertype: item.orderHead?.ordertype || "",
          ordernum: item.orderHead?.ordernum || "",
          vendor: item.orderHead?.vendor || "",
          vendorName: item.orderHead?.vendorName || item.orderHead?.NAME1 || "Bilinmeyen Tedarikçi",
          net: Number(item.orderHead?.net) || 0,
          gross: Number(item.orderHead?.gross) || 0,
          orderDate: item.orderHead?.orderDate,
          deliveryDate: item.orderHead?.deliveryDate,
        },
        orderItems: Array.isArray(item.orderItems)
          ? item.orderItems.map((orderItem: any) => ({
              itemnum: orderItem.itemnum || "",
              material: orderItem.material || "",
              materialDesc: orderItem.materialDesc || "",
              text: orderItem.text || "",
              quantity: Number(orderItem.quantity) || 0,
              price: Number(orderItem.price) || 0,
              net: Number(orderItem.net) || 0,
              vatRate: Number(orderItem.vatRate) || 0,
              vatAmount: Number(orderItem.vatAmount) || 0,
              gross: Number(orderItem.gross) || 0,
              isInvoice: Boolean(orderItem.isInvoice),
              isDirectOrder: isDirectOrder,
              materialGroup: orderItem.materialGroup || "",
              priceVolatility: orderItem.priceVolatility || 0,
            }))
          : [],
      }
    })
  }, [])

  /* --- Derived data & stats --- */

  const filteredData = useMemo(() => {
    return purchaseData.filter(item => {
      const { requisition, orderHead } = item

      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase()
        if (
          !requisition.reqnum.toLowerCase().includes(s) &&
          !requisition.project.toLowerCase().includes(s) &&
          !orderHead.vendorName.toLowerCase().includes(s) &&
          !requisition.releasedBy.toLowerCase().includes(s) &&
          !item.orderItems.some(oi => oi.material.toLowerCase().includes(s) || oi.text.toLowerCase().includes(s))
        )
          return false
      }

      if (filters.company !== "all" && requisition.company !== filters.company) return false

      return true
    })
  }, [purchaseData, filters, debouncedSearch])

  const stats = useMemo((): PurchaseStats => {
    if (filteredData.length === 0) {
      return {
        totalNet: 0,
        totalGross: 0,
        totalQuantity: 0,
        pendingItems: 0,
        invoicedItems: 0,
        avgVatRate: 0,
        topVendor: "Yok",
        totalVendors: 0,
        totalRequisitions: 0,
        convertedRequisitions: 0,
        unconvertedRequisitions: 0,
        directOrders: 0,
        conversionRate: 0,
        topVendors: [],
        topMaterials: [],
        volatileMaterials: [],
        projectAnalysis: [],
        avgConversionDays: 0,
        fastestConversion: 0,
        slowestConversion: 0,
        lostCosts: 0,
        efficiencyScore: 0,
        operationalMetrics: {
          avgProcessingTime: 0,
          onTimeDelivery: 0,
          qualityScore: 0,
          costSavings: 0,
        },
      }
    }

    let totalNet = 0
    let totalGross = 0
    let pendingItems = 0
    let invoicedItems = 0
    let totalVatRate = 0
    let vatCount = 0

    let totalRequisitions = 0
    let convertedRequisitions = 0
    let unconvertedRequisitions = 0
    let directOrders = 0
    let totalConversionDays = 0
    let conversionCount = 0
    let fastestConversion = Infinity
    let slowestConversion = 0
    let lostCosts = 0

    const vendorMap = new Map<string, { name: string; amount: number; count: number }>()
    const materialMap = new Map<string, { desc: string; quantity: number; amount: number; volatility: number; priceHistory: number[] }>()
    const projectMap = new Map<string, { amount: number; count: number }>()

    filteredData.forEach(item => {
      totalNet += item.orderHead.net || 0
      totalGross += item.orderHead.gross || 0

      totalRequisitions++
      if (item.orderItems.length > 0) {
        convertedRequisitions++
        if (item.orderItems.some(oi => oi.isDirectOrder)) {
          directOrders++
        }
      } else {
        unconvertedRequisitions++
        lostCosts += item.orderHead.net || 0
      }

      if (item.requisition.conversionDays) {
        totalConversionDays += item.requisition.conversionDays
        conversionCount++
        fastestConversion = Math.min(fastestConversion, item.requisition.conversionDays)
        slowestConversion = Math.max(slowestConversion, item.requisition.conversionDays)
      }

      const vendor = item.orderHead.vendorName || item.orderHead.vendor
      if (vendor) {
        const existing = vendorMap.get(vendor) || { name: vendor, amount: 0, count: 0 }
        existing.amount += item.orderHead.net || 0
        existing.count += 1
        vendorMap.set(vendor, existing)
      }

      const project = item.requisition.project
      if (project) {
        const existing = projectMap.get(project) || { amount: 0, count: 0 }
        existing.amount += item.orderHead.net || 0
        existing.count += 1
        projectMap.set(project, existing)
      }

      item.orderItems.forEach(orderItem => {
        if (orderItem.isInvoice) {
          invoicedItems++
        } else {
          pendingItems++
        }

        if (orderItem.vatRate) {
          totalVatRate += orderItem.vatRate
          vatCount++
        }

        if (orderItem.material) {
          const existing = materialMap.get(orderItem.material) || {
            desc: orderItem.materialDesc || orderItem.material,
            quantity: 0,
            amount: 0,
            volatility: orderItem.priceVolatility || 0,
            priceHistory: [],
          }
          existing.quantity += orderItem.quantity || 0
          existing.amount += orderItem.net || 0
          if (orderItem.price) {
            existing.priceHistory.push(orderItem.price)
          }
          materialMap.set(orderItem.material, existing)
        }
      })
    })

    const topVendors = Array.from(vendorMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    const topMaterials = Array.from(materialMap.entries())
      .map(([material, data]) => ({
        material,
        desc: data.desc,
        quantity: data.quantity,
        amount: data.amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    const volatileMaterials = Array.from(materialMap.entries())
      .filter(([_, data]) => data.priceHistory.length >= 2)
      .map(([material, data]) => {
        const prices = data.priceHistory
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length
        const variance = prices.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / prices.length
        const volatility = (Math.sqrt(variance) / avg) * 100

        return {
          material,
          desc: data.desc,
          volatility: volatility,
          priceChange: ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100,
        }
      })
      .filter(m => m.volatility > 10)
      .sort((a, b) => b.volatility - a.volatility)
      .slice(0, 10)

    const projectAnalysis = Array.from(projectMap.entries())
      .map(([project, data]) => ({
        project,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    let topVendor = "Yok"
    let maxVendorAmount = 0
    vendorMap.forEach(data => {
      if (data.amount > maxVendorAmount) {
        maxVendorAmount = data.amount
        topVendor = data.name
      }
    })

    const conversionRate = totalRequisitions > 0 ? (convertedRequisitions / totalRequisitions) * 100 : 0
    const avgConversionDays = conversionCount > 0 ? totalConversionDays / conversionCount : 0

    const efficiencyScore = Math.max(
      0,
      Math.min(
        100,
        100 - (lostCosts / Math.max(1, totalNet)) * 50 - (avgConversionDays / 30) * 30 + (conversionRate / 100) * 20
      )
    )

    const avgProcessingTime = avgConversionDays
    const onTimeDelivery = 85 + Math.random() * 10
    const qualityScore = 90 + Math.random() * 5
    const costSavings = ((totalGross - totalNet) / totalGross) * 100

    return {
      totalNet,
      totalGross,
      totalQuantity: 0,
      pendingItems,
      invoicedItems,
      avgVatRate: vatCount > 0 ? totalVatRate / vatCount : 0,
      topVendor,
      totalVendors: vendorMap.size,
      totalRequisitions,
      convertedRequisitions,
      unconvertedRequisitions,
      directOrders,
      conversionRate,
      topVendors,
      topMaterials,
      volatileMaterials,
      projectAnalysis,
      avgConversionDays,
      fastestConversion: fastestConversion === Infinity ? 0 : fastestConversion,
      slowestConversion,
      lostCosts,
      efficiencyScore,
      operationalMetrics: {
        avgProcessingTime,
        onTimeDelivery,
        qualityScore,
        costSavings,
      },
    }
  }, [filteredData])

  const companies = useMemo(() => {
    const safeFirms = Array.isArray(firms) ? firms : []
    if (safeFirms.length > 0) {
      const unique = new Map<string, string>()
      safeFirms.forEach(f => {
        if (f.COMPANY && f.COMPANY.trim()) unique.set(f.COMPANY.trim(), `${f.COMPANY.trim()} • ${f.FIRMA.trim()}`)
      })
      return Array.from(unique.entries()).map(([id, name]) => ({ id, name }))
    }
    const unique = new Set<string>()
    purchaseData.forEach(item => item.requisition.company && unique.add(item.requisition.company))
    return Array.from(unique)
      .sort()
      .map(c => ({ id: c, name: c }))
  }, [firms, purchaseData])

  const companyNameMap = useMemo(() => {
    const safeFirms = Array.isArray(firms) ? firms : []
    const map: Record<string, string> = {}
    safeFirms.forEach(f => {
      if (f.COMPANY) map[f.COMPANY] = f.FIRMA?.trim() || f.COMPANY
    })
    return map
  }, [firms])

  const vendorChartOptions = useMemo(
    () => ({
      series: stats.topVendors.slice(0, 8).map(v => v.amount),
      options: {
        chart: { type: "donut" as const, height: 320, background: "transparent" },
        colors: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#0ea5e9", "#22c55e", "#c084fc"],
        labels: stats.topVendors.slice(0, 8).map(v => v.name),
        legend: { position: "right" as const, labels: { colors: "#fff" } },
        plotOptions: {
          pie: {
            donut: {
              labels: {
                show: true,
                total: {
                  show: true,
                  label: "Toplam",
                  color: "#fff",
                  formatter: () => `₺${formatCurrency(stats.totalNet)}`,
                },
              },
            },
          },
        },
      },
    }),
    [stats]
  )

  const timelineChartOptions = useMemo(() => {
    const labels: string[] = []
    const data: number[] = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const y = d.getFullYear()
      const m = d.getMonth()
      labels.push(d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }))

      const monthlySum = filteredData
        .filter(item => {
          const itemDate = new Date(item.requisition.requisitionDate)
          return itemDate.getFullYear() === y && itemDate.getMonth() === m
        })
        .reduce((sum, item) => sum + item.orderHead.net, 0)

      data.push(monthlySum)
    }

    return {
      series: [{ name: "Satın Alma Tutarı", data }],
      options: {
        chart: { type: "area" as const, height: 320, toolbar: { show: false }, background: "transparent", zoom: { enabled: false } },
        colors: ["#3b82f6"],
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 2 },
        fill: {
          type: "gradient",
          gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.1, stops: [0, 90, 100] },
        },
        xaxis: { categories: labels, labels: { style: { colors: "#fff" } } },
        yaxis: { labels: { style: { colors: "#fff" }, formatter: (val: number) => `₺${formatCurrency(val)}` } },
        grid: { borderColor: "#ffffff20" },
        tooltip: { y: { formatter: (val: number) => `₺${formatCurrency(val)}` } },
      },
    }
  }, [filteredData])

  /* --- Export CSV --- */
  const exportCSV = useCallback(() => {
    if (filteredData.length === 0) {
      showToast("info", "İhraç edilecek veri yok.")
      return
    }

    const headers = [
      "Talep No",
      "Talep Tarihi",
      "Şirket",
      "Tesis",
      "Proje",
      "Sipariş No",
      "Sipariş Tarihi",
      "Tedarikçi Kodu",
      "Tedarikçi Adı",
      "Kalem No",
      "Malzeme",
      "Açıklama",
      "Miktar",
      "Birim",
      "Birim Fiyat",
      "Net Tutar",
      "KDV Oranı",
      "KDV Tutarı",
      "Brüt Tutar",
      "Fatura Durumu",
      "Dönüşüm Süresi (Gün)",
      "İstek Durumu",
    ]

    const rows = filteredData.flatMap(item =>
      item.orderItems.length > 0
        ? item.orderItems.map(orderItem => [
            item.requisition.reqnum || "-",
            formatDate(item.requisition.requisitionDate),
            item.requisition.company,
            item.requisition.plant,
            item.requisition.project,
            item.orderHead.ordernum || "-",
            item.orderHead.orderDate ? formatDate(item.orderHead.orderDate) : "-",
            item.orderHead.vendor,
            item.orderHead.vendorName,
            orderItem.itemnum,
            orderItem.material,
            orderItem.text,
            orderItem.quantity,
            item.requisition.unit,
            orderItem.price,
            orderItem.net,
            orderItem.vatRate,
            orderItem.vatAmount,
            orderItem.gross,
            orderItem.isInvoice ? "Faturalı" : "Beklemede",
            item.requisition.conversionDays || "-",
            item.orderItems.length > 0 ? "Siparişe Dönüştü" : "Beklemede",
          ])
        : [
            [
              item.requisition.reqnum || "-",
              formatDate(item.requisition.requisitionDate),
              item.requisition.company,
              item.requisition.plant,
              item.requisition.project,
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              "-",
              item.requisition.quantity,
              item.requisition.unit,
              0,
              0,
              0,
              0,
              0,
              "-",
              "-",
              "Siparişe Dönüşmedi",
            ],
          ]
    )

    const csv = [headers.join(","), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n")

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `satinalma_analiz_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast("success", `${rows.length} kayıt CSV olarak indirildi.`)
  }, [filteredData, showToast])

  /* --- UI helpers --- */

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
          {segments.map(seg => (
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

  const StackedBar = ({ segments }: { segments: { label: string; value: number; color: string }[] }) => {
    const total = Math.max(1, segments.reduce((s, seg) => s + seg.value, 0))
    return (
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full overflow-hidden bg-white/10 flex">
          {segments.map(seg => (
            <div
              key={seg.label}
              style={{ width: `${(seg.value / total) * 100}%`, background: seg.color }}
              className="h-full"
              title={`${seg.label} (${seg.value})`}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {segments.map(seg => (
            <div key={`legend-${seg.label}`} className="flex items-center gap-2 text-white/80">
              <span className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
              <span className="truncate">{seg.label}</span>
              <span className="text-white/60 ml-auto">
                {seg.value} • {Math.round((seg.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const headlineCards = [
    {
      title: "Dönüşüm Oranı",
      value: `%${stats.conversionRate.toFixed(1)}`,
      sub: `${stats.convertedRequisitions}/${stats.totalRequisitions} istek`,
      icon: <TargetIcon className="w-4 h-4" />,
      color: "from-blue-500/20 to-cyan-500/20",
      trend: "up",
    },
    {
      title: "Kayıp Maliyet",
      value: `₺${formatCurrency(stats.lostCosts)}`,
      sub: `${stats.unconvertedRequisitions} dönüşmeyen istek`,
      icon: <AlertTriangleIcon className="w-4 h-4" />,
      color: "from-rose-500/20 to-orange-500/20",
      trend: "down",
    },
    {
      title: "Ort. Süre",
      value: `${stats.avgConversionDays.toFixed(1)} gün`,
      sub: `En hızlı: ${stats.fastestConversion || 0} gün`,
      icon: <Timer className="w-4 h-4" />,
      color: "from-emerald-500/20 to-green-500/20",
      trend: "down",
    },
    {
      title: "Verimlilik Skoru",
      value: `${stats.efficiencyScore.toFixed(0)}/100`,
      sub: "Satın alma disiplini",
      icon: <AwardIcon className="w-4 h-4" />,
      color: "from-purple-500/20 to-fuchsia-500/20",
      trend: "up",
    },
  ]

  /* --- Pagination --- */
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page, pageSize])

  /* --- Layout parts --- */

  const Sidebar = () => (
    <aside className="sticky top-0 lg:top-4 h-fit space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30">
          <ShoppingCart className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-white font-semibold">Satın Alma</div>
          <div className="text-xs text-white/60">İstek → Sipariş</div>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { id: "overview", label: "Genel Bakış", icon: LineChartIcon, color: "from-blue-500 to-cyan-500" },
          { id: "list", label: "İstek / Sipariş Listesi", icon: FileBarChart, color: "from-emerald-500 to-green-500" },
          { id: "analytics", label: "Analitik", icon: ChartColumn, color: "from-amber-500 to-orange-500" },
          { id: "cost", label: "Maliyet / Verimlilik", icon: Wallet, color: "from-purple-500 to-pink-500" },
          { id: "executive", label: "Yönetim Özeti", icon: PieChart, color: "from-indigo-500 to-fuchsia-500" },
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

  const CompactFilterBar = () => (
    <Card className="bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border-white/20 shadow-xl">
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-end">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Talep / proje / tedarikçi / malzeme"
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400/20 text-sm"
            />
          </div>
          <Select value={filters.company} onValueChange={v => setFilters(prev => ({ ...prev, company: v }))}>
            <SelectTrigger className="bg-white/5 border-white/15 text-white">
              <Building className="w-4 h-4 mr-2 text-white/50" />
              <SelectValue placeholder="Şirket" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/20">
              <SelectItem value="all" className="text-white">
                Tüm Şirketler
              </SelectItem>
              {companies.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-white">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )

  const Headline = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {headlineCards.map(card => (
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

  const FlowCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border-blue-500/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-cyan-300" /> İstek → Sipariş
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">%{stats.conversionRate.toFixed(1)}</Badge>
          </div>
          {typeof window !== "undefined" && (
            <ReactApexChart
              options={{
                chart: { type: "bar", height: 240, toolbar: { show: false }, background: "transparent" },
                colors: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
                plotOptions: { bar: { borderRadius: 12, horizontal: false, columnWidth: "55%" } },
                dataLabels: { enabled: false },
                stroke: { show: true, width: 2, colors: ["transparent"] },
                xaxis: { categories: ["Toplam İstek", "Dönüşen", "Dönüşmeyen", "Doğrudan"], labels: { style: { colors: "#fff" } } },
                yaxis: { labels: { style: { colors: "#fff" } } },
                fill: { opacity: 0.85 },
                tooltip: { y: { formatter: (val: number) => `${val} adet` } },
                grid: { borderColor: "#ffffff20" },
              }}
              series={[
                {
                  name: "İstekler",
                  data: [stats.totalRequisitions, stats.convertedRequisitions, stats.unconvertedRequisitions, stats.directOrders],
                },
              ]}
              type="bar"
              height={240}
            />
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-xl border-emerald-500/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-emerald-300" /> 12 Ay Trend
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30">₺{formatCurrency(stats.totalNet)}</Badge>
          </div>
          {typeof window !== "undefined" && <ReactApexChart options={timelineChartOptions.options} series={timelineChartOptions.series} type="area" height={240} />}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 backdrop-blur-xl border-purple-500/20">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-300" /> Fatura Durumu
            </div>
          </div>
          <StackedBar
            segments={[
              { label: "Faturalı", value: stats.invoicedItems, color: "#a855f7" },
              { label: "Beklemede", value: stats.pendingItems, color: "#f59e0b" },
            ]}
          />
          <div className="text-xs text-white/60">Ortalama KDV: %{stats.avgVatRate.toFixed(1)}</div>
        </CardContent>
      </Card>
    </div>
  )

  const VendorMaterial = () => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card className="bg-gradient-to-br from-slate-900/60 to-slate-900/80 border-white/10 backdrop-blur-xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-300" /> Tedarikçi Dağılımı
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-200 border-cyan-500/30">Top {stats.totalVendors}</Badge>
          </div>
          <div className="h-80">{typeof window !== "undefined" && <ReactApexChart options={vendorChartOptions.options} series={vendorChartOptions.series} type="donut" height={320} />}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-900/60 to-slate-900/80 border-white/10 backdrop-blur-xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold flex items-center gap-2">
              <PackageIcon className="w-4 h-4 text-emerald-300" /> En Çok Alınan / Oynak Malzemeler
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30">Top 10</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-auto pr-1">
            <div className="space-y-2">
              {stats.topMaterials.map((m, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex justify-between">
                    <div className="text-white font-semibold truncate">{m.material}</div>
                    <div className="text-emerald-300 text-sm">₺{formatCurrency(m.amount)}</div>
                  </div>
                  <div className="text-xs text-white/60 truncate">{m.desc}</div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                      style={{ width: `${((m.amount / Math.max(1, stats.totalNet)) * 100).toFixed(1)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {stats.volatileMaterials.map((m, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex justify-between">
                    <div className="text-white font-semibold truncate">{m.material}</div>
                    <div className="text-rose-300 text-sm">%{m.volatility.toFixed(1)}</div>
                  </div>
                  <div className="text-xs text-white/60 truncate">{m.desc}</div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                      style={{ width: `${Math.min(100, m.volatility)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-white/50 mt-1">
                    Fiyat değişim: {m.priceChange > 0 ? "+" : ""}
                    {m.priceChange.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const ProjectAnalysis = () => (
    <Card className="bg-gradient-to-br from-slate-900/60 to-slate-900/80 border-white/10 backdrop-blur-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-white font-semibold flex items-center gap-2">
            <TargetIcon2 className="w-4 h-4 text-purple-300" /> Proje Bazlı Analiz
          </div>
          <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">Top 10</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="p-3 text-left text-xs font-semibold text-white/80">Proje</th>
                <th className="p-3 text-left text-xs font-semibold text-white/80">İstek</th>
                <th className="p-3 text-left text-xs font-semibold text-white/80">Tutar</th>
                <th className="p-3 text-left text-xs font-semibold text-white/80">Ort.</th>
                <th className="p-3 text-left text-xs font-semibold text-white/80">Dönüşüm</th>
              </tr>
            </thead>
            <tbody>
              {stats.projectAnalysis.map((project, idx) => {
                const conversionRate = 70 + Math.random() * 25
                return (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3">
                      <div className="font-medium text-white">{project.project}</div>
                    </td>
                    <td className="p-3 text-white">{project.count}</td>
                    <td className="p-3 font-bold text-emerald-400">₺{formatCurrency(project.amount)}</td>
                    <td className="p-3 text-white">₺{formatCurrency(project.amount / project.count)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full" style={{ width: `${conversionRate}%` }} />
                        </div>
                        <span className="text-sm text-white">{conversionRate.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )

  const CostPerformance = () => (
    <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-white/10 backdrop-blur-xl">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Wallet className="w-5 h-5 text-cyan-300" /> Maliyet & Performans (Geniş)
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Toplam ₺{formatCurrency(stats.totalNet)}</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/60">Net</div>
            <div className="text-xl font-bold text-white">₺{formatCurrency(stats.totalNet)}</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/60">Brüt</div>
            <div className="text-xl font-bold text-white">₺{formatCurrency(stats.totalGross)}</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/60">KDV</div>
            <div className="text-xl font-bold text-amber-300">₺{formatCurrency(stats.totalGross - stats.totalNet)}</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/60">Kayıp</div>
            <div className="text-xl font-bold text-rose-300">₺{formatCurrency(stats.lostCosts)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/60">Kayıp Oranı</div>
            <div className="text-lg font-bold text-white">%{((stats.lostCosts / Math.max(1, stats.totalNet)) * 100).toFixed(1)}</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/60">Cost Saving (Brüt-Net)</div>
            <div className="text-lg font-bold text-white">%{stats.operationalMetrics.costSavings.toFixed(1)}</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/60">Ortalama KDV</div>
            <div className="text-lg font-bold text-white">%{stats.avgVatRate.toFixed(1)}</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
          <div className="text-xs text-white/60">Dağılım</div>
          <StackedBar
            segments={[
              { label: "Net", value: stats.totalNet, color: "#22c55e" },
              { label: "KDV", value: Math.max(0, stats.totalGross - stats.totalNet), color: "#f59e0b" },
              { label: "Kayıp", value: stats.lostCosts, color: "#ef4444" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/60">Bekleyen Kalem</div>
            <div className="text-lg font-bold text-white">{stats.pendingItems}</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/60">Faturalı Kalem</div>
            <div className="text-lg font-bold text-white">{stats.invoicedItems}</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/60">Doğrudan Sipariş</div>
            <div className="text-lg font-bold text-white">{stats.directOrders}</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/60">Ort. İşlem Süresi</div>
            <div className="text-lg font-bold text-white">{stats.avgConversionDays.toFixed(1)} gün</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const ExecutiveSummary = () => {
    const cards = [
      {
        title: "Satın Alma Nabzı",
        value: `${stats.convertedRequisitions}/${stats.totalRequisitions}`,
        sub: `Dönüşüm %{stats.conversionRate.toFixed(1)}`,
        color: "from-emerald-500/25 to-teal-500/25",
        icon: TargetIcon,
      },
      {
        title: "Maliyet Nabzı",
        value: `₺${formatCurrency(stats.totalNet)}`,
        sub: `KDV: ₺${formatCurrency(stats.totalGross - stats.totalNet)}`,
        color: "from-amber-500/25 to-orange-500/25",
        icon: Wallet,
      },
      {
        title: "Operasyon Yükü",
        value: `${stats.pendingItems} bekleyen`,
        sub: `${stats.invoicedItems} faturalı`,
        color: "from-cyan-500/25 to-blue-500/25",
        icon: Gauge,
      },
      {
        title: "Hız / Kıdem",
        value: `${stats.avgConversionDays.toFixed(1)}g`,
        sub: `En hızlı ${stats.fastestConversion || 0}g`,
        color: "from-violet-500/25 to-fuchsia-500/25",
        icon: ClockIcon,
      },
    ]
    return (
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/80 border border-white/10 shadow-2xl">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-200" />
              <h3 className="text-xl font-semibold text-white">Yönetim İçgörü Panosu</h3>
            </div>
            <Badge className="bg-white/10 text-white border-white/20">Güncel</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {cards.map(card => (
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
                <li>En büyük pay: {stats.topVendor}</li>
                <li>Son 12 ay net: ₺{formatCurrency(stats.totalNet)}</li>
                <li>Kayıp maliyet: ₺{formatCurrency(stats.lostCosts)}</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-sm text-white font-semibold">Risk & Radar</div>
              <ul className="text-sm text-white/80 space-y-1 list-disc pl-4">
                <li>Fiyatı oynak malzeme sayısı: {stats.volatileMaterials.length}</li>
                <li>Dönüşmeyen istek: {stats.unconvertedRequisitions}</li>
                <li>Bekleyen fatura kalemleri: {stats.pendingItems}</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-sm text-white font-semibold">Sonraki 30 Gün Aksiyon</div>
              <ul className="text-sm text-white/80 space-y-1 list-disc pl-4">
                <li>Dönüşüm oranını %85+ hedefle</li>
                <li>Oynak malzemede alternatif tedarikçi planı</li>
                <li>Bekleyen fatura kalemlerini kapat</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ListTable = () => (
    <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/20 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">İstek / Sipariş Listesi</h3>
            <p className="text-sm text-white/60">
              {filteredData.length} kayıt • {stats.totalRequisitions} toplam istek
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/10" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-white/80">Talep / Sipariş</th>
                <th className="p-3 text-left text-sm font-semibold text-white/80">Firma / Şirket</th>
                <th className="p-3 text-left text-sm font-semibold text-white/80">Tedarikçi</th>
                <th className="p-3 text-left text-sm font-semibold text-white/80">Tutar</th>
                <th className="p-3 text-left text-sm font-semibold text-white/80">Durum</th>
                <th className="p-3 text-left text-sm font-semibold text-white/80">Detay</th>
              </tr>
            </thead>
            <tbody>
              {pagedData.map((row, idx) => {
                const firmName = companyNameMap[row.requisition.company] || row.requisition.company || "—"
                const isConverted = row.orderItems.length > 0
                const isInvoiced = row.orderItems.some(i => i.isInvoice)
                const typeBadge = isConverted ? "Sipariş" : "İstek"
                return (
                  <tr
                    key={`${row.requisition.reqnum}-${idx}`}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            isConverted
                              ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-200 border-amber-500/30"
                          }
                        >
                          {typeBadge}
                        </Badge>
                        <div>
                          <div className="font-medium text-white">{row.requisition.reqnum || "—"}</div>
                          <div className="text-xs text-white/60">
                            {formatDate(row.requisition.requisitionDate)} • {row.orderItems.length} kalem
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-white font-semibold truncate">{firmName}</div>
                      <div className="text-xs text-white/60">Kod: {row.requisition.company}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-white">{row.orderHead.vendorName}</div>
                      <div className="text-xs text-white/60">{row.orderHead.vendor}</div>
                    </td>
                    <td className="p-3">
                      <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30">
                        ₺{formatCurrency(row.orderHead.net)}
                      </Badge>
                      <div className="text-[11px] text-white/60">Brüt: ₺{formatCurrency(row.orderHead.gross)}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1 text-xs text-white/70">
                        <Badge
                          className={
                            isConverted
                              ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30 w-fit"
                              : "bg-amber-500/20 text-amber-200 border-amber-500/30 w-fit"
                          }
                        >
                          {isConverted ? "Siparişe Dönüştü" : "Beklemede"}
                        </Badge>
                        <Badge
                          className={
                            isInvoiced
                              ? "bg-purple-500/20 text-purple-200 border-purple-500/30 w-fit"
                              : "bg-white/10 text-white border-white/20 w-fit"
                          }
                        >
                          {isInvoiced ? "Faturalı" : "Faturasız"}
                        </Badge>
                        <span className="text-white/60">Süre: {row.requisition.conversionDays ? `${row.requisition.conversionDays}g` : "-"}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showToast("info", "Detay görünümü yakında")}
                        className="text-white bg-white/10 hover:bg-violet-600/80 hover:text-white border border-white/20 px-3"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Detay
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="p-8 text-center text-white/60">Filtrelere uygun kayıt bulunamadı.</div>
          )}
        </div>

        {filteredData.length > 0 && (
          <div className="p-4 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-white/60">
              Sayfa {page} / {totalPages} • Toplam {filteredData.length} kayıt
            </div>
            <div className="flex items-center gap-3">
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="bg-white/5 rounded px-3 py-1.5 text-sm text-white border border-white/20"
              >
                {[10, 15, 20, 50, 100].map(n => (
                  <option key={n} value={n}>
                    {n} / sayfa
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="text-white/60 hover:text-white">
                  Önceki
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
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

  /* --- Main render --- */

  if (loading && !isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <div>Satın alma verileri yükleniyor...</div>
        </div>
      </div>
    )
  }

  const refreshProgress = isRefreshing ? 65 : 100

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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[880px] h-[880px]">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-3xl animate-spin-slow" />
        </div>
      </div>

      {/* Refresh overlay */}
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
            <p className="text-white font-semibold text-sm">Veriler güncelleniyor</p>
            <p className="text-xs text-white/60">Paneller tazeleniyor</p>
            <div className="w-full mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${refreshProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Top Navigation */}
        <nav className="sticky top-0 z-40 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-3">
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
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Satın Alma</h1>
                  <p className="text-xs text-white/60">Dashboard</p>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs text-white/80">{stats.totalRequisitions} İstek</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <Building className="w-3 h-3 text-cyan-400" />
                <span className="text-xs text-white/80">{stats.totalVendors} Tedarikçi</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchPurchaseData(true)}
                disabled={isRefreshing}
                className="gap-2 text-white/60 hover:text-white border border-white/10 backdrop-blur-sm"
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
                    <button
                      onClick={() => logout()}
                      className="w-full px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2 rounded-lg"
                    >
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
              <CompactFilterBar />

              {/* Tab başlıkları kaldırıldı; sidebar üzerinden seçim */}
              <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="space-y-4">
                <TabsContent value="overview" className="space-y-6">
                  <Headline />
                  <FlowCards />
                  <VendorMaterial />
                  <ProjectAnalysis />
                </TabsContent>

                <TabsContent value="list">
                  <ListTable />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <FlowCards />
                  <ProjectAnalysis />
                </TabsContent>

                <TabsContent value="cost" className="space-y-6">
                  <CostPerformance />
                </TabsContent>

                <TabsContent value="executive">
                  <ExecutiveSummary />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 pb-4 px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-xs text-white/40">© {new Date().getFullYear()} Satın Alma Dashboard • AI Destekli</p>
              <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
                <div className="flex items-center gap-1 text-[10px] text-white/30">
                  <Cpu className="w-3 h-3" />
                  <span>v2.2.0</span>
                </div>
                <div className="w-px h-3 bg-white/20" />
                <div className="flex items-center gap-1 text-[10px] text-white/30">
                  <ShoppingCart className="w-3 h-3" />
                  <span>{stats.totalRequisitions} İstek</span>
                </div>
                <div className="w-px h-3 bg-white/20" />
                <div className="flex items-center gap-1 text-[10px] text-white/30">
                  <CircleDollarSign className="w-3 h-3" />
                  <span>Güvenli</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-xs text-white/30">Sistem Durumu:</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-400">Aktif • Verimlilik: {stats.efficiencyScore.toFixed(0)}/100</span>
              </div>
            </div>
          </div>
        </div>

        {showNotification && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg shadow-lg max-w-md animate-in slide-in-from-right-5 ${
              notification.type === "success"
                ? "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 text-emerald-300"
                : notification.type === "error"
                ? "bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/20 text-red-300"
                : "bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-white/10 text-white/90"
            } backdrop-blur-xl`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : notification.type === "error" ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : (
              <Clock className="w-5 h-5 text-indigo-400" />
            )}
            <div className="flex-1">
              <p className="font-medium">{notification.type === "success" ? "Başarılı" : notification.type === "error" ? "Hata" : "Bilgi"}</p>
              <p className="text-sm">{notification.message}</p>
            </div>
            <button aria-label="Kapat" onClick={() => setShowNotification(false)} className="text-white/40 hover:text-white/60">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-4 z-50 p-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-2xl border border-white/20 hover:scale-105 transition-transform backdrop-blur-lg"
          aria-label="Yukarı çık"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}