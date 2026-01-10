"use client"

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  LogOut, ChevronRight, PieChart, Users, Server,
  Shield, X, Brain, Target, AlertTriangle, TrendingUp, LineChart,
  Activity, ChevronLeft, ShieldCheck, Settings,
  Timer, DollarSign, CreditCard, Wallet, TrendingDown, Gauge,
  Briefcase, MapPin, Phone, Mail, Home,
  UserCheck, UserMinus, Award, Star, Heart,
  PhoneCall, Globe, Cake, CalendarDays, UserPlus, UserMinus as UserMinusIcon,
  GraduationCap, BriefcaseBusiness, Clock3, Bell,
  HeartPulse,
  Percent,
  CheckSquare, XCircle, AlertOctagon,
  FileSpreadsheet, Filter, Eye, Edit, Trash2,
  GitBranch,
  ChartColumnIncreasing, ChartColumnDecreasing,
  BarChart4,
  Landmark, Cash,
  Flame, Crown, Trophy, Rocket, Sparkles,
  Moon, Sun,
  ThumbsUp, ThumbsDown, Lightbulb, Gift,
  CalendarHeart, CalendarCheck,
  CalendarX, TimerReset,
  Gem, Diamond,
  Sparkle, Medal,
  WalletCards,
  Banknote,
  Coins,
  ChevronUp,
  ChevronDown,
  BarChart,
  Target as TargetIcon,
  Users as UsersIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  Database,
  Cpu,
} from "lucide-react"

/* ===========================
   Types & Constants
   =========================== */

type PersonalInfo = {
  identityNo: string
  fatherName: string
  motherName: string
  maritalStatus: string
  bloodType: number
  birthday: string | null
  birthPlace: string
  gender: string
}

type Address = {
  street: string
  city: string
  state: string
  zip: string
  country: string
}

type ContactInfo = {
  name: string
  middleName: string
  surname: string
  title: string
  display: string
  homePhone: string
  mobile: string
  homeAddress: Address
  businessAddress: Address
}

type Company = {
  code: string
  name: string
}

type Plant = {
  code: string
  name: string
}

type Department = {
  code: string
  name: string
}

type Manager = {
  persId: string | null
  title: string | null
}

type SalaryInfo = {
  current: {
    amount: number
    type?: string
    unit?: string
    validFrom: string
    validUntil: string
    currency: string
    union: number
    costCenter: string
  }
  previous: {
    amount: number
    type?: string
    unit?: string
    validFrom: string
    validUntil: string
  }
}

type EmploymentInfo = {
  startDate: string
  endDate: string | null
  separationDate?: string | null
  isActive: boolean
  contractType: number
  workStyle: number
  company: Company
  plant: Plant
  department: Department
  title: string
  titleText: string
  orgPlace: string
  workLevel: string
  manager: Manager
}

type LeaveInfo = {
  leaveDate?: string | null
  leaveCode: string | null
  leaveText?: string | null
  seniorDate: string
  remaining?: {
    days?: number
    amount?: number
    year?: number
    period?: number
  }
  details?: DetailsInfo
}

type MilitaryInfo = {
  status: number
  childrenCount: number
}

type DetailsInfo = {
  startDate?: string | null
  birthday?: string | null
  totalSeniorityYears?: number
  age?: number
  systemInternal?: number
  systemExternal?: number
  totalUsed?: number
  entitledDays?: number
  remainingDays?: number
}

type Employee = {
  persId: string
  client: string
  personalInfo: PersonalInfo
  contactInfo: ContactInfo
  employmentInfo: EmploymentInfo
  leaveInfo: LeaveInfo
  salaryInfo: SalaryInfo
  militaryInfo?: MilitaryInfo
  details?: DetailsInfo
}

type KPIStats = {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  maleEmployees: number
  femaleEmployees: number
  marriedEmployees: number
  singleEmployees: number
  avgSeniority: number
  totalDepartments: number
  totalCompanies: number
  totalPlants: number
  avgAge: number
  totalSalary: number
  avgSalary: number
  maxSalary: number
  minSalary: number
  medianSalary: number
  salaryIncreaseRate: number
  totalUnionMembers: number
  totalSalaryCost: number
  avgCostPerEmployee: number
}

type DepartmentStats = {
  code: string
  name: string
  count: number
  active: number
  inactive: number
  avgAge: number
  male: number
  female: number
  married: number
  single: number
  totalSalary: number
  avgSalary: number
  maxSalary: number
  minSalary: number
  avgSeniority: number
  unionMembers: number
  totalCost: number
}

type GenderStats = {
  male: number
  female: number
  percentage: {
    male: number
    female: number
  }
  avgSalary: {
    male: number
    female: number
  }
  totalSalary: {
    male: number
    female: number
  }
}

type MaritalStats = {
  married: number
  single: number
  percentage: {
    married: number
    single: number
  }
  avgSalary: {
    married: number
    single: number
  }
}

type CostCenterStats = {
  code: string
  count: number
  totalSalary: number
  avgSalary: number
  activeEmployees: number
  inactiveEmployees: number
}

type BirthdayEmployee = {
  employee: Employee
  daysUntil: number
  age: number
  birthDate: Date
}

type RecentLeaver = {
  employee: Employee
  daysSince: number
  seniority: number
  reason: string
  salary: number
}

type NewHire = {
  employee: Employee
  daysSince: number
  department: string
}

type EducationStats = {
  eduTypeText: string
  count: number
}

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
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(v))

const formatNumber = (v: number) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(v))

const formatDate = (iso?: string | Date | null) => {
  if (!iso) return ""
  const d = parseDateString(iso)
  if (!d) return typeof iso === "string" ? iso : ""
  return d.toLocaleDateString("tr-TR")
}

const formatTime = (d: Date) =>
  d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

const parseDateString = (dateVal: string | Date | number | null | undefined): Date | null => {
  if (!dateVal) return null
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) return dateVal
  if (typeof dateVal === "number") {
    const d = new Date(dateVal)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof dateVal !== "string") return null
  const trimmed = dateVal.trim()
  if (!trimmed) return null
  const native = new Date(trimmed)
  if (!isNaN(native.getTime())) return native
  const dashParts = trimmed.split(/[T ]/)[0].split(/[-/]/)
  if (dashParts.length === 3) {
    const [y, m, d] = dashParts.map(Number)
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const parsed = new Date(y, m - 1, d)
      if (!isNaN(parsed.getTime())) return parsed
    }
  }
  const parts = trimmed.split(" ")[0].split(".")
  if (parts.length === 3) {
    const day = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1
    const year = parseInt(parts[2])
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day)
    }
  }
  return null
}

const calculateAge = (birthDate: string | Date | number | null): number => {
  if (!birthDate) return 0
  const today = new Date()
  const birth = parseDateString(birthDate)
  if (!birth) return 0
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

const calculateSeniority = (startDate: string, endDate?: string | Date | number | null): number => {
  if (!startDate) return 0
  const end = endDate ? parseDateString(endDate) : null
  const today = end || new Date()
  const start = parseDateString(startDate)
  if (!start) return 0
  const diffTime = Math.abs(today.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 365)
}

const formatYearsMonths = (startDate: string, endDate?: string | Date | number | null) => {
  const start = parseDateString(startDate)
  const end = endDate ? parseDateString(endDate) : new Date()
  if (!start || !end) return "-"
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  if (end.getDate() < start.getDate()) months -= 1
  if (months < 0) months = 0
  const years = Math.floor(months / 12)
  const remaining = months % 12
  const parts = []
  if (years > 0) parts.push(`${years} yıl`)
  parts.push(`${remaining} ay`)
  return parts.join(" ")
}

const calculatePercentChange = (oldVal: number, newVal: number): number => {
  if (oldVal === 0) return newVal > 0 ? 100 : 0
  return ((newVal - oldVal) / oldVal) * 100
}

const daysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const normalizeGenderKey = (g?: string): "erkek" | "kadın" | "bilinmiyor" => {
  if (!g) return "bilinmiyor"
  const v = g.toString().trim().toLowerCase()
  if (["bayan", "kadın", "kadin", "kadın", "k"].includes(v)) return "kadın"
  if (["erkek", "e", "bay"].includes(v)) return "erkek"
  return "bilinmiyor"
}

const normalizeGenderLabel = (g?: string): "Erkek" | "Kadın" | "Bilinmiyor" => {
  const key = normalizeGenderKey(g)
  if (key === "erkek") return "Erkek"
  if (key === "kadın") return "Kadın"
  return "Bilinmiyor"
}

const getEffectiveSalary = (emp: Employee) =>
  Number(emp.salaryInfo?.current?.amount) ||
  Number(emp.salaryInfo?.previous?.amount) ||
  0

const buildSalaryBands = (list: Employee[]) => {
  const bands = [
    { label: "0-25K", min: 0, max: 25000, count: 0 },
    { label: "25-50K", min: 25000, max: 50000, count: 0 },
    { label: "50-75K", min: 50000, max: 75000, count: 0 },
    { label: "75-100K", min: 75000, max: 100000, count: 0 },
    { label: "100-150K", min: 100000, max: 150000, count: 0 },
    { label: "150-250K", min: 150000, max: 250000, count: 0 },
    { label: "250K+", min: 250000, max: Infinity, count: 0 },
  ]
  list.forEach(emp => {
    const s = getEffectiveSalary(emp)
    const band = bands.find(b => s >= b.min && s < b.max)
    if (band) band.count++
  })
  return bands.map(b => ({
    ...b,
    perc: list.length ? Math.round((b.count / list.length) * 100) : 0,
  }))
}

const buildAgeBuckets = (list: Employee[]) => {
  const buckets = [
    { label: "18-24", min: 18, max: 24, count: 0 },
    { label: "25-34", min: 25, max: 34, count: 0 },
    { label: "35-44", min: 35, max: 44, count: 0 },
    { label: "45-54", min: 45, max: 54, count: 0 },
    { label: "55+", min: 55, max: Infinity, count: 0 },
  ]
  list.forEach(emp => {
    const age = calculateAge(emp.personalInfo.birthday)
    const bucket = buckets.find(b => age >= b.min && age <= b.max)
    if (bucket) bucket.count++
  })
  return buckets.map(b => ({
    ...b,
    perc: list.length ? Math.round((b.count / list.length) * 100) : 0,
  }))
}

const buildTenureBucketsFor = (emps: Employee[], endDateResolver?: (e: Employee) => string | Date | number | null) => {
  const buckets = [
    { label: "0-1 yıl", min: 0, max: 1, count: 0 },
    { label: "1-3 yıl", min: 1, max: 3, count: 0 },
    { label: "3-5 yıl", min: 3, max: 5, count: 0 },
    { label: "5-10 yıl", min: 5, max: 10, count: 0 },
    { label: "10+ yıl", min: 10, max: Infinity, count: 0 },
  ]
  emps.forEach(emp => {
    const tenure = endDateResolver ? calculateSeniority(emp.employmentInfo.startDate, endDateResolver(emp)) : calculateSeniority(emp.employmentInfo.startDate)
    const bucket = buckets.find(b => tenure >= b.min && tenure < b.max)
    if (bucket) bucket.count++
  })
  return buckets
}

const getSeparationDate = (emp: Employee) =>
  parseDateString(emp.employmentInfo.separationDate || emp.employmentInfo.endDate || emp.leaveInfo.leaveDate || null)

/* ===========================
   Component
   =========================== */

export default function HRDashboard() {
  const { user, logout, isAuthenticated } = useAuth()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [educationData, setEducationData] = useState<{ success: boolean; kpi?: any; list: any[] }>({ success: false, list: [] })
  const [payrollData, setPayrollData] = useState<{ success: boolean; period: any; count: number; data: any[] }>({ success: false, period: null, count: 0, data: [] })
  const [leavesData, setLeavesData] = useState<{ success: boolean; period: any; kpi: any; ranking: any[] }>({ success: false, period: null, kpi: {}, ranking: [] })
  const [overtimeData, setOvertimeData] = useState<{ success: boolean; period: any; count: number; data: any[] }>({ success: false, period: null, count: 0, data: [] })
  const [departments, setDepartments] = useState<Department[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [titles, setTitles] = useState<{ code: string; name: string }[]>([])

  const [loading, setLoading] = useState({
    employees: true,
    departments: true,
    companies: true,
    stats: true,
    education: true,
    payroll: true,
    leaves: true,
    overtime: true,
  })
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState({
    company: "all",
    search: "",
  })
  const [searchDraft, setSearchDraft] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const debouncedSearch = useDebounced(filters.search, 250)

  const [activeTab, setActiveTab] = useState<"overview" | "employees" | "analytics" | "salary" | "reports">("overview")
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
  const [pageSize, setPageSize] = useState(20)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const fetchAbortRef = useRef<AbortController | null>(null)

  /* --- Common DB resolver & fetch helper --- */
  const resolveDbName = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("globalApiInfo")
        if (stored) {
          const info = JSON.parse(stored)
          return info.dbName || user?.dbName || null
        }
      } catch {
        // ignore
      }
    }
    return user?.dbName || null
  }, [user])

  const fetchWithDbName = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const dbName = resolveDbName()
      if (!dbName) {
        throw new Error("Kullanıcı veritabanı bilgisi bulunamadı. Lütfen tekrar giriş yapın.")
      }

      const url = path.includes("?")
        ? `${path}&dbName=${encodeURIComponent(dbName)}`
        : `${path}?dbName=${encodeURIComponent(dbName)}`

      const res = await fetch(url, {
        ...options,
        cache: "no-store",
        headers: {
          ...(options.headers || {}),
          "x-db-name": dbName,
        },
      })

      if (!res.ok) {
        const message = await res.text().catch(() => "")
        throw new Error(message || `HTTP ${res.status}`)
      }
      return res.json()
    },
    [resolveDbName]
  )

  const showToast = useCallback((type: "success" | "error" | "info", message: string, duration = 3000) => {
    setNotification({ type, message })
    setShowNotification(true)
    if (notifTimerRef.current) window.clearTimeout(notifTimerRef.current)
    notifTimerRef.current = window.setTimeout(() => {
      setShowNotification(false)
      notifTimerRef.current = null
    }, duration)
  }, [])

  /* --- Fetchers (use new API pattern) --- */

  const fetchEmployees = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(prev => ({ ...prev, employees: true }))
        const [activeData, passiveData] = await Promise.all([
          fetchWithDbName("/api/personel-active", { signal }),
          fetchWithDbName("/api/personel-passive", { signal }),
        ])

        const mergedRaw = [...(activeData?.data || []), ...(passiveData?.data || [])]

        const normalizedMap = new Map<string, Employee>()
        mergedRaw.forEach((emp: any, idx: number) => {
          const safeCompanyCode = emp?.employmentInfo?.company?.code || `comp-${emp?.persId || idx}`
          const safeCompanyName = emp?.employmentInfo?.company?.name || "Bilinmiyor"
          const safeDeptCode = emp?.employmentInfo?.department?.code || `dept-${emp?.persId || idx}`
          const safeDeptName = emp?.employmentInfo?.department?.name || "Bilinmiyor"
          const safeTitleCode = emp?.employmentInfo?.title || `title-${emp?.persId || idx}`
          const safeTitleText = emp?.employmentInfo?.titleText || emp?.employmentInfo?.title || "Bilinmiyor"
          const safeCostCenter = emp?.salaryInfo?.current?.costCenter || "BELIRTILMEMIS"

          const rawDetails = emp?.details || emp?.leaveInfo?.details || {}
          const details: DetailsInfo = {
            startDate: rawDetails.startDate || emp?.employmentInfo?.startDate || null,
            birthday: rawDetails.birthday || emp?.personalInfo?.birthday || null,
            totalSeniorityYears: rawDetails.totalSeniorityYears ?? null,
            age: rawDetails.age ?? null,
            systemInternal: rawDetails.systemInternal ?? 0,
            systemExternal: rawDetails.systemExternal ?? 0,
            totalUsed: rawDetails.totalUsed ?? 0,
            entitledDays: rawDetails.entitledDays ?? 0,
            remainingDays: rawDetails.remainingDays ?? rawDetails?.remaining?.days ?? 0,
          }

          const normalized: Employee = {
            ...emp,
            personalInfo: {
              ...emp.personalInfo,
              gender: normalizeGenderLabel(emp.personalInfo?.gender),
            },
            employmentInfo: {
              ...emp.employmentInfo,
              separationDate: emp.employmentInfo?.separationDate ?? emp.employmentInfo?.endDate ?? null,
              company: { code: safeCompanyCode, name: safeCompanyName },
              department: { code: safeDeptCode, name: safeDeptName },
              title: safeTitleCode,
              titleText: safeTitleText,
            },
            salaryInfo: {
              ...emp.salaryInfo,
              current: {
                ...emp.salaryInfo?.current,
                costCenter: safeCostCenter,
                type: emp.salaryInfo?.current?.type || emp.salaryInfo?.current?.calcType,
                unit: emp.salaryInfo?.current?.unit,
              },
              previous: {
                ...emp.salaryInfo?.previous,
                type: emp.salaryInfo?.previous?.type || emp.salaryInfo?.previous?.calcType,
                unit: emp.salaryInfo?.previous?.unit,
              },
            },
            leaveInfo: {
              ...emp.leaveInfo,
              leaveDate: (emp.leaveInfo as any)?.leaveDate ?? null,
              details: emp.leaveInfo?.details || emp.details || rawDetails,
            },
            details,
          }

          if (!normalizedMap.has(normalized.persId) || normalized.employmentInfo.isActive) {
            normalizedMap.set(normalized.persId, normalized)
          }
        })

        const normalizedEmployees = Array.from(normalizedMap.values())
        setEmployees(normalizedEmployees)

        const uniqueDepartments = Array.from(
          new Map(
            (normalizedEmployees || []).map((emp: Employee) => [emp.employmentInfo.department.code, emp.employmentInfo.department])
          ).values()
        ).filter(Boolean) as Department[]
        setDepartments(uniqueDepartments)

        const uniqueCompanies = Array.from(
          new Map(
            (normalizedEmployees || []).map((emp: Employee) => [emp.employmentInfo.company.code, emp.employmentInfo.company])
          ).values()
        ).filter(Boolean) as Company[]
        setCompanies(uniqueCompanies)

        const uniqueTitles = Array.from(
          new Map(
            (normalizedEmployees || []).map((emp: Employee) => [
              emp.employmentInfo.title,
              { code: emp.employmentInfo.title, name: emp.employmentInfo.titleText },
            ])
          ).values()
        ).filter(Boolean) as { code: string; name: string }[]
        setTitles(uniqueTitles)
      } catch (err: any) {
        if (err?.name === "AbortError") return
        console.error("Fetch error:", err)
        showToast("error", err?.message || "Personel verileri yüklenemedi")
      } finally {
        setLoading(prev => ({ ...prev, employees: false, departments: false, companies: false, stats: false }))
      }
    },
    [fetchWithDbName, showToast]
  )

  const fetchEducation = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(prev => ({ ...prev, education: true }))
        const data = await fetchWithDbName("/api/hcm-education-personnel", { signal })
        setEducationData(data)
      } catch (err: any) {
        if (err?.name === "AbortError") return
        console.error("Education fetch error:", err)
        showToast("error", err?.message || "Eğitim verileri yüklenemedi")
      } finally {
        setLoading(prev => ({ ...prev, education: false }))
      }
    },
    [fetchWithDbName, showToast]
  )

  const fetchPayroll = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(prev => ({ ...prev, payroll: true }))
        const data = await fetchWithDbName("/api/hcm-last-payroll-personnel", { signal })
        setPayrollData(data)
      } catch (err: any) {
        if (err?.name === "AbortError") return
        console.error("Payroll fetch error:", err)
        showToast("error", err?.message || "Son bordro verileri yüklenemedi")
      } finally {
        setLoading(prev => ({ ...prev, payroll: false }))
      }
    },
    [fetchWithDbName, showToast]
  )

  const fetchLeaves = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(prev => ({ ...prev, leaves: true }))
        const data = await fetchWithDbName("/api/hcm-leaves-personnel", { signal })
        setLeavesData(data)
      } catch (err: any) {
        if (err?.name === "AbortError") return
        console.error("Leaves fetch error:", err)
        showToast("error", err?.message || "İzin verileri yüklenemedi")
      } finally {
        setLoading(prev => ({ ...prev, leaves: false }))
      }
    },
    [fetchWithDbName, showToast]
  )

  const fetchOvertime = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(prev => ({ ...prev, overtime: true }))
        const data = await fetchWithDbName("/api/hcm-overtime-ranking", { signal })
        setOvertimeData(data)
      } catch (err: any) {
        if (err?.name === "AbortError") return
        console.error("Overtime fetch error:", err)
        showToast("error", err?.message || "Fazla mesai verileri yüklenemedi")
      } finally {
        setLoading(prev => ({ ...prev, overtime: false }))
      }
    },
    [fetchWithDbName, showToast]
  )

  const fetchAllData = useCallback(async () => {
    if (fetchAbortRef.current) fetchAbortRef.current.abort()
    const controller = new AbortController()
    fetchAbortRef.current = controller

    try {
      setError(null)
      setIsRefreshing(true)
      setLoading({
        employees: true,
        departments: true,
        companies: true,
        stats: true,
        education: true,
        payroll: true,
        leaves: true,
        overtime: true,
      })

      await Promise.all([
        fetchEmployees(controller.signal),
        fetchEducation(controller.signal),
        fetchPayroll(controller.signal),
        fetchLeaves(controller.signal),
        fetchOvertime(controller.signal),
      ])

      const now = new Date()
      setLastRefreshTime(now)
      setRefreshCount(c => c + 1)
      showToast("success", `Personel verileri güncellendi! (${formatTime(now)})`)
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err?.message || String(err))
        showToast("error", `Hata: ${err?.message || String(err)}`)
      }
    } finally {
      setIsRefreshing(false)
      fetchAbortRef.current = null
    }
  }, [fetchEmployees, fetchEducation, fetchPayroll, fetchLeaves, fetchOvertime, showToast])

  useEffect(() => {
    fetchAllData()
    return () => {
      if (fetchAbortRef.current) fetchAbortRef.current.abort()
      if (notifTimerRef.current) window.clearTimeout(notifTimerRef.current)
    }
  }, [fetchAllData])

  // Scroll to top visibility
  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 480)
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* ===========================
     Derived data & Statistics
     =========================== */

  const visibleEmployees = useMemo(() => {
    if (filters.company === "all") return employees
    return employees.filter(e => e.employmentInfo.company.code === filters.company)
  }, [employees, filters.company])

  const activeEmployees = useMemo(() => visibleEmployees.filter(e => e.employmentInfo.isActive), [visibleEmployees])
  const inactiveEmployees = useMemo(() => visibleEmployees.filter(e => !e.employmentInfo.isActive), [visibleEmployees])

  const kpiStats = useMemo((): KPIStats => {
    const totalEmployees = visibleEmployees.length
    const activeEmployeesCount = activeEmployees.length
    const inactiveEmployeesCount = totalEmployees - activeEmployeesCount
    const maleEmployees = visibleEmployees.filter(emp => normalizeGenderKey(emp.personalInfo.gender) === "erkek").length
    const femaleEmployees = visibleEmployees.filter(emp => normalizeGenderKey(emp.personalInfo.gender) === "kadın").length

    const marriedEmployees = visibleEmployees.filter(emp => emp.personalInfo.maritalStatus === "Evli").length
    const singleEmployees = visibleEmployees.filter(emp => emp.personalInfo.maritalStatus === "Bekar").length

    const totalAge = visibleEmployees.reduce((sum, emp) => sum + calculateAge(emp.personalInfo.birthday), 0)
    const avgAge = totalEmployees > 0 ? Math.round((totalAge / totalEmployees) * 10) / 10 : 0

    const totalSeniority = visibleEmployees.reduce((sum, emp) => sum + calculateSeniority(emp.employmentInfo.startDate), 0)
    const avgSeniority = totalEmployees > 0 ? Math.round((totalSeniority / totalEmployees) * 10) / 10 : 0

    const salaries = visibleEmployees.map(getEffectiveSalary).filter(s => s > 0)
    const totalSalary = salaries.reduce((sum, salary) => sum + salary, 0)
    const avgSalary = salaries.length > 0 ? Math.round(totalSalary / salaries.length) : 0
    const maxSalary = salaries.length > 0 ? Math.max(...salaries) : 0
    const minSalary = salaries.length > 0 ? Math.min(...salaries) : 0

    let medianSalary = 0
    if (salaries.length > 0) {
      const sortedSalaries = [...salaries].sort((a, b) => a - b)
      const middle = Math.floor(sortedSalaries.length / 2)
      medianSalary =
        sortedSalaries.length % 2 === 0
          ? Math.round((sortedSalaries[middle - 1] + sortedSalaries[middle]) / 2)
          : sortedSalaries[middle]
    }

    const totalPreviousSalary = visibleEmployees.reduce((sum, emp) => sum + (emp.salaryInfo.previous?.amount || 0), 0)
    const salaryIncreaseRate =
      totalPreviousSalary > 0 ? Math.round(((totalSalary - totalPreviousSalary) / totalPreviousSalary) * 100) : 0

    const totalUnionMembers = visibleEmployees.filter(emp => emp.salaryInfo.current.union === 1).length

    const totalSalaryCost = totalSalary
    const avgCostPerEmployee = totalEmployees > 0 ? Math.round(totalSalaryCost / totalEmployees) : 0

    return {
      totalEmployees,
      activeEmployees: activeEmployeesCount,
      inactiveEmployees: inactiveEmployeesCount,
      maleEmployees,
      femaleEmployees,
      marriedEmployees,
      singleEmployees,
      avgSeniority,
      totalDepartments: departments.length,
      totalCompanies: companies.length,
      totalPlants: 0,
      avgAge,
      totalSalary,
      avgSalary,
      maxSalary,
      minSalary,
      medianSalary,
      salaryIncreaseRate,
      totalUnionMembers,
      totalSalaryCost,
      avgCostPerEmployee,
    }
  }, [visibleEmployees, departments, companies, activeEmployees])

  const kpiStatsActiveOnly = useMemo(() => {
    const totalEmployees = activeEmployees.length
    const salaries = activeEmployees.map(getEffectiveSalary).filter(s => s > 0)
    const totalSalary = salaries.reduce((sum, salary) => sum + salary, 0)
    const avgSalary = salaries.length ? Math.round(totalSalary / salaries.length) : 0
    const maxSalary = salaries.length ? Math.max(...salaries) : 0
    const minSalary = salaries.length ? Math.min(...salaries) : 0
    const medianSalary = salaries.length
      ? (() => {
          const sorted = [...salaries].sort((a, b) => a - b)
          const mid = Math.floor(sorted.length / 2)
          return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid]
        })()
      : 0
    return {
      totalEmployees,
      totalSalary,
      avgSalary,
      maxSalary,
      minSalary,
      medianSalary,
    }
  }, [activeEmployees])

  const activeGenderStats = useMemo((): GenderStats => {
    const maleEmployees = activeEmployees.filter(emp => normalizeGenderKey(emp.personalInfo.gender) === "erkek")
    const femaleEmployees = activeEmployees.filter(emp => normalizeGenderKey(emp.personalInfo.gender) === "kadın")

    const male = maleEmployees.length
    const female = femaleEmployees.length
    const total = male + female

    const maleSalaries = maleEmployees.map(getEffectiveSalary).filter(s => s > 0)
    const femaleSalaries = femaleEmployees.map(getEffectiveSalary).filter(s => s > 0)

    const avgSalaryMale = maleSalaries.length > 0 ? Math.round(maleSalaries.reduce((a, b) => a + b, 0) / maleSalaries.length) : 0
    const avgSalaryFemale =
      femaleSalaries.length > 0 ? Math.round(femaleSalaries.reduce((a, b) => a + b, 0) / femaleSalaries.length) : 0
    const totalSalaryMale = maleSalaries.reduce((a, b) => a + b, 0)
    const totalSalaryFemale = femaleSalaries.reduce((a, b) => a + b, 0)

    return {
      male,
      female,
      percentage: {
        male: total > 0 ? Math.round((male / total) * 100) : 0,
        female: total > 0 ? Math.round((female / total) * 100) : 0,
      },
      avgSalary: {
        male: avgSalaryMale,
        female: avgSalaryFemale,
      },
      totalSalary: {
        male: totalSalaryMale,
        female: totalSalaryFemale,
      },
    }
  }, [activeEmployees])

  const genderStats = useMemo((): GenderStats => {
    const maleEmployees = visibleEmployees.filter(emp => normalizeGenderKey(emp.personalInfo.gender) === "erkek")
    const femaleEmployees = visibleEmployees.filter(emp => normalizeGenderKey(emp.personalInfo.gender) === "kadın")

    const male = maleEmployees.length
    const female = femaleEmployees.length
    const total = male + female

    const maleSalaries = maleEmployees.map(getEffectiveSalary).filter(s => s > 0)
    const femaleSalaries = femaleEmployees.map(getEffectiveSalary).filter(s => s > 0)

    const avgSalaryMale = maleSalaries.length > 0 ? Math.round(maleSalaries.reduce((a, b) => a + b, 0) / maleSalaries.length) : 0
    const avgSalaryFemale =
      femaleSalaries.length > 0 ? Math.round(femaleSalaries.reduce((a, b) => a + b, 0) / femaleSalaries.length) : 0
    const totalSalaryMale = maleSalaries.reduce((a, b) => a + b, 0)
    const totalSalaryFemale = femaleSalaries.reduce((a, b) => a + b, 0)

    return {
      male,
      female,
      percentage: {
        male: total > 0 ? Math.round((male / total) * 100) : 0,
        female: total > 0 ? Math.round((female / total) * 100) : 0,
      },
      avgSalary: {
        male: avgSalaryMale,
        female: avgSalaryFemale,
      },
      totalSalary: {
        male: totalSalaryMale,
        female: totalSalaryFemale,
      },
    }
  }, [visibleEmployees])

  const maritalStats = useMemo((): MaritalStats => {
    const marriedEmployees = visibleEmployees.filter(emp => emp.personalInfo.maritalStatus === "Evli")
    const singleEmployees = visibleEmployees.filter(emp => emp.personalInfo.maritalStatus === "Bekar")

    const married = marriedEmployees.length
    const single = singleEmployees.length
    const total = married + single

    const marriedSalaries = marriedEmployees.map(getEffectiveSalary).filter(s => s > 0)
    const singleSalaries = singleEmployees.map(getEffectiveSalary).filter(s => s > 0)

    const avgSalaryMarried =
      marriedSalaries.length > 0 ? Math.round(marriedSalaries.reduce((a, b) => a + b, 0) / marriedSalaries.length) : 0
    const avgSalarySingle =
      singleSalaries.length > 0 ? Math.round(singleSalaries.reduce((a, b) => a + b, 0) / singleSalaries.length) : 0

    return {
      married,
      single,
      percentage: {
        married: total > 0 ? Math.round((married / total) * 100) : 0,
        single: total > 0 ? Math.round((single / total) * 100) : 0,
      },
      avgSalary: {
        married: avgSalaryMarried,
        single: avgSalarySingle,
      },
    }
  }, [visibleEmployees])

  const departmentStats = useMemo((): DepartmentStats[] => {
    return departments
      .map(dept => {
        const deptEmployees = visibleEmployees.filter(emp => emp.employmentInfo.department.code === dept.code)
        const totalAge = deptEmployees.reduce((sum, emp) => sum + calculateAge(emp.personalInfo.birthday), 0)
        const totalSeniority = deptEmployees.reduce((sum, emp) => sum + calculateSeniority(emp.employmentInfo.startDate), 0)

        const salaries = deptEmployees.map(getEffectiveSalary).filter(s => s > 0)
        const totalSalary = salaries.reduce((sum, salary) => sum + salary, 0)
        const avgSalary = salaries.length > 0 ? Math.round(totalSalary / salaries.length) : 0
        const maxSalary = salaries.length > 0 ? Math.max(...salaries) : 0
        const minSalary = salaries.length > 0 ? Math.min(...salaries) : 0

        const unionMembers = deptEmployees.filter(emp => emp.salaryInfo.current.union === 1).length
        const totalCost = totalSalary

        return {
          code: dept.code,
          name: dept.name,
          count: deptEmployees.length,
          active: deptEmployees.filter(emp => emp.employmentInfo.isActive).length,
          inactive: deptEmployees.filter(emp => !emp.employmentInfo.isActive).length,
          avgAge: deptEmployees.length > 0 ? Math.round((totalAge / deptEmployees.length) * 10) / 10 : 0,
          male: deptEmployees.filter(emp => normalizeGenderKey(emp.personalInfo.gender) === "erkek").length,
          female: deptEmployees.filter(emp => normalizeGenderKey(emp.personalInfo.gender) === "kadın").length,
          married: deptEmployees.filter(emp => emp.personalInfo.maritalStatus === "Evli").length,
          single: deptEmployees.filter(emp => emp.personalInfo.maritalStatus === "Bekar").length,
          totalSalary,
          avgSalary,
          maxSalary,
          minSalary,
          avgSeniority: deptEmployees.length > 0 ? Math.round((totalSeniority / deptEmployees.length) * 10) / 10 : 0,
          unionMembers,
          totalCost,
        }
      })
      .filter(dept => dept.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [visibleEmployees, departments])

  const activeDepartmentStats = useMemo(() => {
    return departments
      .map(dept => {
        const deptEmployees = activeEmployees.filter(emp => emp.employmentInfo.department.code === dept.code)
        if (!deptEmployees.length) return null
        const ages = deptEmployees.map(e => calculateAge(e.personalInfo.birthday)).filter(a => a > 0)
        const ageTotal = ages.reduce((a, b) => a + b, 0)
        const tenures = deptEmployees.map(e => calculateSeniority(e.employmentInfo.startDate))
        const tenureTotal = tenures.reduce((a, b) => a + b, 0)
        const salaries = deptEmployees.map(getEffectiveSalary).filter(s => s > 0)
        const salaryTotal = salaries.reduce((a, b) => a + b, 0)
        const ageBuckets = buildAgeBuckets(deptEmployees)
        const topAgeBucket = ageBuckets.sort((a, b) => b.count - a.count)[0]
        const salaryBands = buildSalaryBands(deptEmployees).sort((a, b) => b.count - a.count)
        return {
          code: dept.code,
          name: dept.name,
          active: deptEmployees.length,
          male: deptEmployees.filter(e => normalizeGenderKey(e.personalInfo.gender) === "erkek").length,
          female: deptEmployees.filter(e => normalizeGenderKey(e.personalInfo.gender) === "kadın").length,
          avgAge: ages.length ? Math.round((ageTotal / ages.length) * 10) / 10 : 0,
          avgTenure: deptEmployees.length ? Math.round((tenureTotal / deptEmployees.length) * 10) / 10 : 0,
          minAge: ages.length ? Math.min(...ages) : 0,
          maxAge: ages.length ? Math.max(...ages) : 0,
          avgSalary: salaries.length ? Math.round(salaryTotal / salaries.length) : 0,
          totalSalary: salaryTotal,
          topAgeBucket,
          topSalaryBand: salaryBands[0],
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.active - a.active)
      .slice(0, 8)
  }, [departments, activeEmployees])

  const costCenterStats = useMemo((): CostCenterStats[] => {
    const centers = new Map<string, CostCenterStats>()

    visibleEmployees.forEach(emp => {
      const centerCode = emp.salaryInfo.current.costCenter || "BELIRTILMEMIS"
      if (!centers.has(centerCode)) {
        centers.set(centerCode, {
          code: centerCode,
          count: 0,
          totalSalary: 0,
          avgSalary: 0,
          activeEmployees: 0,
          inactiveEmployees: 0,
        })
      }

      const center = centers.get(centerCode)!
      center.count++
      center.totalSalary += getEffectiveSalary(emp)
      if (emp.employmentInfo.isActive) {
        center.activeEmployees++
      } else {
        center.inactiveEmployees++
      }
    })

    centers.forEach(center => {
      center.avgSalary = center.count > 0 ? Math.round(center.totalSalary / center.count) : 0
    })

    return Array.from(centers.values())
      .sort((a, b) => b.totalSalary - a.totalSalary)
      .filter(center => center.code && center.count > 0)
  }, [visibleEmployees])

  const birthdayEmployees = useMemo((): BirthdayEmployee[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return visibleEmployees
      .filter(emp => {
        if (!emp.personalInfo.birthday || !emp.employmentInfo.isActive) return false
        const birthDate = parseDateString(emp.personalInfo.birthday)
        if (!birthDate) return false

        const currentYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
        const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate())

        const daysUntilCurrent = Math.ceil((currentYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const daysUntilNext = Math.ceil((nextYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        return (daysUntilCurrent >= 0 && daysUntilCurrent <= 7) || (daysUntilNext >= 0 && daysUntilNext <= 7)
      })
      .map(emp => {
        const birthDate = parseDateString(emp.personalInfo.birthday!)!
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const currentYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
        const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate())

        const daysUntilCurrent = Math.ceil((currentYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const daysUntilNext = Math.ceil((nextYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        let daysUntil = daysUntilCurrent
        let targetBirthday = currentYearBirthday

        if (daysUntil < 0 || (daysUntilNext >= 0 && daysUntilNext < daysUntil)) {
          daysUntil = daysUntilNext
          targetBirthday = nextYearBirthday
        }

        const age = targetBirthday.getFullYear() - birthDate.getFullYear()

        return {
          employee: emp,
          daysUntil: Math.max(0, daysUntil),
          age,
          birthDate: birthDate
        }
      })
      .filter(item => item.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil)
  }, [visibleEmployees])

  const recentLeavers = useMemo((): RecentLeaver[] => {
    const today = new Date()

    return visibleEmployees
      .filter(emp => {
        if (emp.employmentInfo.isActive) return false
        const endDate = getSeparationDate(emp)
        if (!endDate) return false

        const daysSince = daysBetween(endDate, today)
        return daysSince <= 60
      })
      .map(emp => {
        const endDate = getSeparationDate(emp)!
        const daysSince = daysBetween(endDate, today)
        const seniority = calculateSeniority(emp.employmentInfo.startDate, endDate)

        return {
          employee: emp,
          daysSince,
          seniority,
          reason: emp.leaveInfo.leaveText || emp.leaveInfo.leaveCode || "Bilinmiyor",
          salary: getEffectiveSalary(emp),
        }
      })
      .sort((a, b) => a.daysSince - b.daysSince)
  }, [visibleEmployees])

  const leaversLast30 = useMemo(() => recentLeavers.filter(l => l.daysSince <= 30), [recentLeavers])
  const leavers31to60 = useMemo(() => recentLeavers.filter(l => l.daysSince > 30 && l.daysSince <= 60), [recentLeavers])

  const newHires = useMemo((): NewHire[] => {
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    return visibleEmployees
      .filter(emp => {
        if (!emp.employmentInfo.isActive) return false
        const startDate = parseDateString(emp.employmentInfo.startDate)
        if (!startDate) return false

        return startDate >= thirtyDaysAgo
      })
      .map(emp => {
        const startDate = parseDateString(emp.employmentInfo.startDate)!
        const daysSince = daysBetween(startDate, new Date())

        return {
          employee: emp,
          daysSince,
          department: emp.employmentInfo.department.name,
        }
      })
      .sort((a, b) => a.daysSince - b.daysSince)
  }, [visibleEmployees])

  const thisMonthStarters = useMemo(() => {
    const today = new Date()
    const m = today.getMonth()
    const y = today.getFullYear()
    return visibleEmployees.filter(emp => {
      const sd = parseDateString(emp.employmentInfo.startDate)
      return sd && sd.getMonth() === m && sd.getFullYear() === y && emp.employmentInfo.isActive
    })
  }, [visibleEmployees])

  const currentMonthHireCount = thisMonthStarters.length
  const currentMonthLeaveCount = visibleEmployees.filter(emp => {
    if (emp.employmentInfo.isActive) return false
    const end = getSeparationDate(emp)
    if (!end) return false
    const today = new Date()
    return end.getMonth() === today.getMonth() && end.getFullYear() === today.getFullYear()
  }).length

  const salaryBandsExtended = useMemo(() => buildSalaryBands(visibleEmployees), [visibleEmployees])
  const activeSalaryBands = useMemo(() => buildSalaryBands(activeEmployees), [activeEmployees])
  const newHireSalaryBands = useMemo(() => buildSalaryBands(newHires.map(n => n.employee)), [newHires])

  const genderPayGap = useMemo(() => {
    const male = visibleEmployees.filter(e => normalizeGenderKey(e.personalInfo.gender) === "erkek")
    const female = visibleEmployees.filter(e => normalizeGenderKey(e.personalInfo.gender) === "kadın")
    const avgMale = male.length ? Math.round(male.reduce((s, e) => s + getEffectiveSalary(e), 0) / male.length) : 0
    const avgFemale = female.length ? Math.round(female.reduce((s, e) => s + getEffectiveSalary(e), 0) / female.length) : 0
    const gap = avgMale && avgFemale ? Math.round(((avgMale - avgFemale) / avgMale) * 100) : 0
    return { avgMale, avgFemale, gap }
  }, [visibleEmployees])

  const leaveReasonStats = useMemo(() => {
    const map = new Map<string, number>()
    visibleEmployees
      .filter(e => !e.employmentInfo.isActive && (e.leaveInfo?.leaveCode || e.leaveInfo?.leaveText))
      .forEach(e => {
        const code = e.leaveInfo.leaveText || e.leaveInfo.leaveCode || "Bilinmiyor"
        map.set(code, (map.get(code) || 0) + 1)
      })
    return Array.from(map.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [visibleEmployees])

  const turnover60d = useMemo(() => {
    const leavers = recentLeavers.length
    const rate = visibleEmployees.length ? Math.round((leavers / visibleEmployees.length) * 1000) / 10 : 0
    return { leavers, rate }
  }, [recentLeavers, visibleEmployees])

  const overtimeTop10 = useMemo(() => (overtimeData?.data || []).slice(0, 10), [overtimeData])
  const leavesTop5 = useMemo(() => (leavesData?.ranking || []).slice(0, 5), [leavesData])

  const educationStats = useMemo<EducationStats[]>(() => {
    const map = new Map<string, number>()
    ;(educationData?.list || []).forEach((e: any) => {
      const key = e.eduTypeText || "Belirtilmemiş"
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([eduTypeText, count]) => ({ eduTypeText, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [educationData])

  // Eğitim verisinde departman alanı varsa en çok geçen 5 departman
  const educationDeptStats = useMemo(() => {
    const map = new Map<string, number>()
    ;(educationData?.list || []).forEach((e: any) => {
      const dept = e.department?.name || e.departmentName || e.deptName || e.department || null
      if (!dept) return
      map.set(dept, (map.get(dept) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([dept, count]) => ({ dept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [educationData])

  const childrenStats = useMemo(() => {
    const buckets = [
      { label: "0 çocuk", range: [0, 0], count: 0 },
      { label: "1 çocuk", range: [1, 1], count: 0 },
      { label: "2 çocuk", range: [2, 2], count: 0 },
      { label: "3+ çocuk", range: [3, Infinity], count: 0 },
    ]
    visibleEmployees.forEach(emp => {
      const c = emp.militaryInfo?.childrenCount ?? 0
      const b = buckets.find(b => c >= b.range[0] && c <= b.range[1])
      if (b) b.count++
    })
    return buckets
  }, [visibleEmployees])

  const forecastFactor = 1.27
  const forecastSalaryCost = Math.round(kpiStats.totalSalaryCost * forecastFactor)

  const activeAgeBuckets = useMemo(() => buildAgeBuckets(activeEmployees), [activeEmployees])
  const newHireAgeBuckets = useMemo(() => buildAgeBuckets(newHires.map(n => n.employee)), [newHires])

  const activeTenureBuckets = useMemo(() => {
    const buckets = buildTenureBucketsFor(activeEmployees)
    return buckets.map(b => ({
      ...b,
      perc: activeEmployees.length ? Math.round((b.count / activeEmployees.length) * 100) : 0,
    }))
  }, [activeEmployees])

  const leaverTenureBuckets = useMemo(() => {
    const buckets = buildTenureBucketsFor(inactiveEmployees, e => getSeparationDate(e) || "")
    return buckets.map(b => ({
      ...b,
      perc: inactiveEmployees.length ? Math.round((b.count / inactiveEmployees.length) * 100) : 0,
    }))
  }, [inactiveEmployees])

  const probationLeaversCount = useMemo(() => {
    return inactiveEmployees.filter(emp => {
      const endDate = getSeparationDate(emp)
      const startDate = parseDateString(emp.employmentInfo.startDate)
      if (!endDate || !startDate) return false
      const diffDays = daysBetween(startDate, endDate)
      return diffDays <= 60
    }).length
  }, [inactiveEmployees])

  const newHireGenderStats = useMemo(() => {
    const male = newHires.filter(n => normalizeGenderKey(n.employee.personalInfo.gender) === "erkek").length
    const female = newHires.filter(n => normalizeGenderKey(n.employee.personalInfo.gender) === "kadın").length
    const total = newHires.length
    return {
      male,
      female,
      percMale: total ? Math.round((male / total) * 100) : 0,
      percFemale: total ? Math.round((female / total) * 100) : 0,
    }
  }, [newHires])

  const newHireMaritalStats = useMemo(() => {
    const married = newHires.filter(n => n.employee.personalInfo.maritalStatus === "Evli").length
    const single = newHires.filter(n => n.employee.personalInfo.maritalStatus === "Bekar").length
    const total = newHires.length
    return {
      married,
      single,
      percMarried: total ? Math.round((married / total) * 100) : 0,
      percSingle: total ? Math.round((single / total) * 100) : 0,
    }
  }, [newHires])

  const leaversLast30Employees = useMemo(() => leaversLast30.map(l => l.employee), [leaversLast30])

  const leaver30GenderStats = useMemo(() => {
    const male = leaversLast30Employees.filter(e => normalizeGenderKey(e.personalInfo.gender) === "erkek").length
    const female = leaversLast30Employees.filter(e => normalizeGenderKey(e.personalInfo.gender) === "kadın").length
    const total = leaversLast30Employees.length
    return {
      male,
      female,
      percMale: total ? Math.round((male / total) * 100) : 0,
      percFemale: total ? Math.round((female / total) * 100) : 0,
    }
  }, [leaversLast30Employees])

  const leaver30MaritalStats = useMemo(() => {
    const married = leaversLast30Employees.filter(e => e.personalInfo.maritalStatus === "Evli").length
    const single = leaversLast30Employees.filter(e => e.personalInfo.maritalStatus === "Bekar").length
    const total = leaversLast30Employees.length
    return {
      married,
      single,
      percMarried: total ? Math.round((married / total) * 100) : 0,
      percSingle: total ? Math.round((single / total) * 100) : 0,
    }
  }, [leaversLast30Employees])

  const leaver30SalaryBands = useMemo(() => buildSalaryBands(leaversLast30Employees), [leaversLast30Employees])
  const leaver30AgeBuckets = useMemo(() => buildAgeBuckets(leaversLast30Employees), [leaversLast30Employees])
  const leaver30TenureBuckets = useMemo(() => {
    const buckets = buildTenureBucketsFor(leaversLast30Employees, e => getSeparationDate(e) || "")
    return buckets.map(b => ({
      ...b,
      perc: leaversLast30Employees.length ? Math.round((b.count / leaversLast30Employees.length) * 100) : 0,
    }))
  }, [leaversLast30Employees])

  const probationLeavers30 = useMemo(() => {
    return leaversLast30Employees.filter(e => {
      const end = getSeparationDate(e)
      const start = parseDateString(e.employmentInfo.startDate)
      if (!end || !start) return false
      return daysBetween(start, end) <= 60
    }).length
  }, [leaversLast30Employees])

  const filteredEmployees = useMemo(() => {
    const baseList = visibleEmployees.filter(emp => {
      if (statusFilter === "active") return emp.employmentInfo.isActive
      if (statusFilter === "inactive") return !emp.employmentInfo.isActive
      return true
    })

    const list = baseList.filter(emp => {
      if (debouncedSearch) {
        const s = (debouncedSearch || "").toLowerCase()
        const matches =
          (emp.contactInfo?.display || "").toLowerCase().includes(s) ||
          (emp.persId || "").toLowerCase().includes(s) ||
          (emp.contactInfo?.name || "").toLowerCase().includes(s) ||
          (emp.contactInfo?.surname || "").toLowerCase().includes(s) ||
          (emp.employmentInfo?.company?.name || "").toLowerCase().includes(s) ||
          (emp.employmentInfo?.department?.name || "").toLowerCase().includes(s) ||
          (emp.employmentInfo?.titleText || "").toLowerCase().includes(s) ||
          (emp.contactInfo?.mobile || "").toLowerCase().includes(s) ||
          (emp.personalInfo?.identityNo || "").toLowerCase().includes(s)
        if (!matches) return false
      }
      return true
    })

    return [...list].sort((a, b) => {
      const aId = parseInt(a.persId, 10)
      const bId = parseInt(b.persId, 10)
      if (!isNaN(aId) && !isNaN(bId)) return aId - bId
      return a.persId.localeCompare(b.persId)
    })
  }, [visibleEmployees, debouncedSearch, statusFilter])

  const pagedEmployees = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredEmployees.slice(start, start + pageSize)
  }, [filteredEmployees, page, pageSize])

  const isLoading = useMemo(() => Object.values(loading).some(v => v === true), [loading])

  const exportCSV = useCallback(() => {
    if (!filteredEmployees.length) {
      showToast("info", "İhraç edilecek veri yok.")
      return
    }

    const headers = [
      "Personel ID",
      "Ad Soyad",
      "TC Kimlik",
      "Cinsiyet",
      "Medeni Durum",
      "Doğum Tarihi",
      "Yaş",
      "Şirket",
      "Departman",
      "Departman Kodu",
      "Ünvan",
      "Başlangıç Tarihi",
      "Kıdem (Yıl)",
      "Maaş",
      "Maaş Tipi",
      "Para Birimi",
      "Sendika Üyesi",
      "Maliyet Merkezi",
      "Durum",
      "Telefon",
      "Kalan İzin Gün",
    ]

    const rows = filteredEmployees.map(emp => {
      const remaining = emp.details?.remainingDays ?? 0
      return [
        emp.persId,
        emp.contactInfo.display,
        emp.personalInfo.identityNo,
        emp.personalInfo.gender,
        emp.personalInfo.maritalStatus,
        emp.personalInfo.birthday || "",
        calculateAge(emp.personalInfo.birthday),
        emp.employmentInfo.company.name,
        emp.employmentInfo.department.name,
        emp.employmentInfo.department.code,
        emp.employmentInfo.titleText,
        emp.employmentInfo.startDate,
        calculateSeniority(emp.employmentInfo.startDate),
        getEffectiveSalary(emp),
        emp.salaryInfo.current.type || "",
        emp.salaryInfo.current.currency,
        emp.salaryInfo.current.union === 1 ? "Evet" : "Hayır",
        emp.salaryInfo.current.costCenter,
        emp.employmentInfo.isActive ? "Aktif" : "Pasif",
        emp.contactInfo.mobile,
        remaining,
      ]
        .map(field => JSON.stringify(field))
        .join(",")
    })

    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `personel_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast("success", "CSV indirildi.")
  }, [filteredEmployees, showToast])

  /* ===========================
     Monthly workforce snapshot
     =========================== */

  const monthlyWorkforceStats = useMemo(() => {
    const year = new Date().getFullYear()
    const months = [
      "Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"
    ]

    const stats = months.map((label, idx) => {
      const start = new Date(year, idx, 1)
      const end = new Date(year, idx + 1, 0)
      const hires = visibleEmployees.filter(emp => {
        const sd = parseDateString(emp.employmentInfo.startDate)
        return sd && sd >= start && sd <= end
      }).length
      const leavers = visibleEmployees.filter(emp => {
        const ed = getSeparationDate(emp)
        return ed && ed >= start && ed <= end
      }).length
      const activeDuringMonth = visibleEmployees.filter(emp => {
        const sd = parseDateString(emp.employmentInfo.startDate)
        const ed = getSeparationDate(emp)
        if (!sd) return false
        const overlap = sd <= end && (!ed || ed >= start)
        return overlap
      }).length
      return { label, hires, leavers, avgEmployees: activeDuringMonth }
    })

    return { year, stats }
  }, [visibleEmployees])

  const monthlyCost2025 = useMemo(() => {
    const months = [
      "Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"
    ]
    const base = kpiStats.totalSalaryCost / 12 || 0
    return months.map((label, idx) => {
      const seasonal = 1 + ((idx % 6) - 2) * 0.02 // hafif dalgalanma
      return {
        label,
        amount: Math.round(base * seasonal),
      }
    })
  }, [kpiStats.totalSalaryCost])

  /* ===========================
     Enhanced Loading Screen
     =========================== */

  const LoadingScreen = () => (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-300" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        <div className="relative">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-violet-500/30 rounded-full animate-spin" />
            <div className="absolute inset-4 border-4 border-fuchsia-500/40 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "3s" }} />
            <div className="absolute inset-8 border-4 border-cyan-500/50 rounded-full animate-spin" style={{ animationDuration: "2s" }} />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <Brain className="w-16 h-16 text-violet-400 animate-pulse" />
                <div className="absolute -inset-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full blur-xl opacity-30 animate-ping" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative text-center mt-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-2 animate-pulse">
            HR Dashboard Yükleniyor
          </h2>
          <p className="text-white/60 mb-4">Veriler analiz ediliyor...</p>

          <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden mx-auto mb-4">
            <div className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 rounded-full animate-pulse" style={{ width: "75%" }} />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{employees.length}</div>
              <div className="text-xs text-white/60">Personel</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{formatCurrency(kpiStats.totalSalaryCost)}</div>
              <div className="text-xs text-white/60">Maaş Gideri</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{kpiStats.activeEmployees}</div>
              <div className="text-xs text-white/60">Aktif</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  /* ===========================
     UI Components
     =========================== */

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
          <p className="text-white font-semibold text-sm">{message || "İK verileri işleniyor..."}</p>
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
        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-white font-semibold">İK Dashboard</div>
          <div className="text-xs text-white/60">Personel Yönetim Analizi</div>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { id: "overview", label: "Genel Bakış", icon: Building, color: "from-violet-500 to-fuchsia-500" },
          { id: "employees", label: "Personel Listesi", icon: Users, color: "from-blue-500 to-cyan-500" },
          { id: "analytics", label: "Analitik Raporlar", icon: Target, color: "from-amber-500 to-orange-500" },
          { id: "salary", label: "Maaş / Maliyet", icon: DollarSign, color: "from-emerald-500 to-green-500" },
          { id: "reports", label: "Yönetim Analizi", icon: PieChart, color: "from-purple-500 to-pink-500" },
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

  /* Visualization helpers */

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
              <span className="text-white/60 ml-auto">{seg.value} • {Math.round((seg.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const FunnelChart = ({ buckets, color }: { buckets: { label: string; perc: number; count: number }[]; color: string }) => {
    const maxPerc = Math.max(...buckets.map(b => b.perc), 1)
    return (
      <div className="space-y-2">
        {buckets.map((b, idx) => (
          <div key={`funnel-${b.label}-${idx}`} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>{b.label}</span>
              <span className="text-white/80">{b.count} ({b.perc}%)</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(b.perc / maxPerc) * 100}%`,
                  background: color,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const salaryColorForLabel = (label: string) => {
    if (label === "0-25K") return "#a5b4fc"
    if (label === "25-50K") return "#38bdf8"
    if (label === "50-75K") return "#22c55e"
    if (label === "75-100K") return "#f59e0b"
    if (label === "100-150K") return "#f97316"
    if (label === "150-250K") return "#ef4444"
    return "#8b5cf6"
  }
  const tenureColorForLabel = (label: string) => {
    if (label === "0-1 yıl") return "#a5b4fc"
    if (label === "1-3 yıl") return "#38bdf8"
    if (label === "3-5 yıl") return "#22c55e"
    if (label === "5-10 yıl") return "#f59e0b"
    return "#8b5cf6"
  }

  /* Main Dashboard helpers */

  const HeadlineCards = () => {
    const hires30 = newHires.length
    const leavers30 = leaversLast30.length
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            title: "Aktif Çalışan",
            value: `${kpiStats.activeEmployees}`,
            sub: `Toplam ${kpiStats.totalEmployees} içinde`,
            icon: <Users className="w-4 h-4" />,
            color: "from-emerald-500/20 to-green-500/20",
            trend: "up",
          },
          {
            title: "Cinsiyete Göre (Aktif)",
            value: `${activeGenderStats.male}E / ${activeGenderStats.female}K`,
            sub: `${activeGenderStats.percentage.male}% Erkek • ${activeGenderStats.percentage.female}% Kadın`,
            icon: <Users className="w-4 h-4" />,
            color: "from-blue-500/20 to-cyan-500/20",
            trend: activeGenderStats.male >= activeGenderStats.female ? "up" : "down",
          },
          {
            title: "Son 30 Gün Başlayan / Ayrılan",
            value: `${hires30} Başl • ${leavers30} Ayr`,
            sub: "Son 1 ay hareketi",
            icon: <UserPlus className="w-4 h-4" />,
            color: "from-amber-500/20 to-orange-500/20",
            trend: hires30 >= leavers30 ? "up" : "down",
          },
          {
            title: "Çalışan Değişimi (60g)",
            value: `${turnover60d.leavers}`,
            sub: `%${turnover60d.rate} turnover`,
            icon: <GitBranch className="w-4 h-4" />,
            color: "from-purple-500/20 to-pink-500/20",
            trend: turnover60d.rate < 10 ? "down" : "up",
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

  const TodayBirthdayBanner = () => {
    const todayBirthdays = birthdayEmployees.filter(b => b.daysUntil === 0)
    const displayList = todayBirthdays.length ? todayBirthdays : birthdayEmployees.slice(0, 4)

    if (!displayList.length) {
      return (
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Cake className="w-5 h-5 text-amber-300" />
              <div>
                <div className="font-semibold text-white">Yaklaşan doğum günü bulunmuyor</div>
                <div className="text-xs text-white/70">Yeni kutlamalar için takipte kalın</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="bg-gradient-to-r from-amber-500/15 via-pink-500/15 to-purple-500/15 border border-amber-500/25 shadow-lg">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/30 flex items-center justify-center">
                <Cake className="w-5 h-5 text-amber-100" />
              </div>
              <div>
                <div className="text-sm text-white/80">Bu hafta doğum günü olan aktif çalışanlar</div>
                <div className="text-lg font-bold text-white">{displayList.length} kişi</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayList.map((item, idx) => {
              const emp = item.employee
              const tenure = formatYearsMonths(emp.employmentInfo.startDate)
              return (
                <div
                  key={`birthday-${emp.persId}-${idx}`}
                  className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/30 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedEmployee(emp)
                    setShowEmployeeModal(true)
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="font-semibold text-white leading-tight">{emp.contactInfo.display}</div>
                      <div className="text-xs text-white/60 flex flex-col gap-0.5">
                        <span>Yaş: {item.age}</span>
                        <span>{emp.employmentInfo.department.name} • {emp.employmentInfo.titleText}</span>
                        <span>Şirket: {emp.employmentInfo.company.name}</span>
                        <span>İşe başlama: {formatDate(emp.employmentInfo.startDate)}</span>
                        <span>Kıdem: {tenure}</span>
                        <span>Telefon: {emp.contactInfo.mobile || "—"}</span>
                      </div>
                    </div>
                    <Badge className="bg-amber-500/20 text-amber-100 border-amber-500/30">
                      {item.daysUntil === 0 ? "Bugün" : `${item.daysUntil}g`}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  const DemographicsSection = () => {
    const genderSegments = [
      { label: `Erkek (${activeGenderStats.male})`, value: activeGenderStats.male, color: "#38bdf8" },
      { label: `Kadın (${activeGenderStats.female})`, value: activeGenderStats.female, color: "#ec4899" },
    ]

    const maritalSegments = [
      {
        label: `Evli (${activeEmployees.filter(e => e.personalInfo.maritalStatus === "Evli").length})`,
        value: activeEmployees.filter(e => e.personalInfo.maritalStatus === "Evli").length,
        color: "#22c55e"
      },
      {
        label: `Bekar (${activeEmployees.filter(e => e.personalInfo.maritalStatus === "Bekar").length})`,
        value: activeEmployees.filter(e => e.personalInfo.maritalStatus === "Bekar").length,
        color: "#f59e0b"
      },
    ]

    const salarySegments = activeSalaryBands.map(b => ({
      label: `${b.label} (${b.count})`,
      value: b.count,
      color: salaryColorForLabel(b.label),
    }))

    const ageSegments = activeAgeBuckets.map((b, idx) => ({
      label: `${b.label} (${b.count})`,
      value: b.count,
      color: ["#0ea5e9","#22d3ee","#a855f7","#f472b6","#f97316"][idx % 5]
    }))

    const tenureSegments = activeTenureBuckets.map(b => ({
      label: `${b.label} (${b.count})`,
      value: b.count,
      color: tenureColorForLabel(b.label),
    }))

    const hiresCount = newHires.length
    const leaversCount = leaversLast30.length

    return (
      <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-white/10 backdrop-blur-xl">
        <CardContent className="p-5 space-y-6">
          <div className="flex itemsCENTER justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-300" />
              <h3 className="text-lg font-semibold text-white">Personel Durum ve Analizi</h3>
            </div>
            <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30">{kpiStats.activeEmployees} aktif</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <RadialStat value={kpiStats.activeEmployees} total={kpiStats.totalEmployees} label="Aktif Çalışan" accent="conic-gradient(#22c55e, #16a34a)" />
            <RadialStat value={kpiStats.inactiveEmployees} total={kpiStats.totalEmployees} label="Çıkış Yapılmış" accent="conic-gradient(#f43f5e, #fb7185)" />
            <RadialStat value={kpiStats.totalEmployees} total={kpiStats.totalEmployees} label="Toplam" accent="conic-gradient(#6366f1, #a855f7)" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <div className="text-sm text-white/60 mb-2">Cinsiyet Dağılımı (Çalışan)</div>
                <DonutChart segments={genderSegments} centerLabel={`${activeGenderStats.male + activeGenderStats.female}`} />
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="text-sm text-white/60 mb-2">Medeni Durum (Çalışan)</div>
                <DonutChart segments={maritalSegments} centerLabel={`${maritalSegments.reduce((s, m) => s + m.value, 0)}`} />
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="text-sm text-white/60 mb-2">Maaş Dağılımı (Çalışan)</div>
                <DonutChart segments={salarySegments} centerLabel={`${salarySegments.reduce((s, m) => s + m.value, 0)}`} />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="text-sm text-white/60 mb-2">Kıdem Yılına Göre (Çalışan)</div>
                <DonutChart
                  segments={tenureSegments}
                  centerLabel={`${tenureSegments.reduce((s, b) => s + b.value, 0)}`}
                  size={180}
                  thickness={26}
                />
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="text-sm text-white/60 mb-2">Yaş Aralığına Göre (Çalışan)</div>
                <DonutChart segments={ageSegments} centerLabel={`${activeAgeBuckets.reduce((s, b) => s + b.count, 0)}`} />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-white/60">Ort. Yaş (Aktif)</div>
                  <div className="text-lg font-bold text-white">
                    {activeEmployees.length
                      ? Math.round(
                          (activeEmployees.reduce((s, e) => s + calculateAge(e.personalInfo.birthday), 0) / activeEmployees.length) * 10
                        ) / 10
                      : 0}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-white/60">Ort. Kıdem (Aktif)</div>
                  <div className="text-lg font-bold text-white">
                    {activeEmployees.length
                      ? Math.round(
                          (activeEmployees.reduce((s, e) => s + calculateSeniority(e.employmentInfo.startDate), 0) / activeEmployees.length) * 10
                        ) / 10
                      : 0}{" "}
                    yıl
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <UserPlus className="w-4 h-4" /> Son 1 Ay Süresince İstatistikleri
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30">Başlayan: {hiresCount}</Badge>
                <Badge className="bg-rose-500/20 text-rose-200 border-rose-500/30">Ayrılan: {leaversCount}</Badge>
                {probationLeavers30 > 0 && (
                  <Badge className="bg-amber-500/20 text-amber-100 border-amber-500/30">
                    Deneme ayrılan: {probationLeavers30}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-white font-semibold">Başlayan (Son 30 Gün)</div>
                    <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30">{hiresCount} kişi</Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <div className="text-xs text-white/60">Cinsiyet Dağılımı</div>
                      <DonutChart
                        segments={[{ label: "Erkek", value: newHireGenderStats.male, color: "#38bdf8" }, { label: "Kadın", value: newHireGenderStats.female, color: "#ec4899" }]}
                        centerLabel={`${newHireGenderStats.male + newHireGenderStats.female}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs text-white/60">Medeni Durum</div>
                      <DonutChart
                        segments={[{ label: "Evli", value: newHireMaritalStats.married, color: "#22c55e" }, { label: "Bekar", value: newHireMaritalStats.single, color: "#f59e0b" }]}
                        centerLabel={`${newHireMaritalStats.married + newHireMaritalStats.single}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <div className="text-xs text-white/60">Maaş Dağılımı</div>
                      <DonutChart
                        segments={newHireSalaryBands.map(b => ({
                          label: `${b.label} (${b.count})`,
                          value: b.count,
                          color: salaryColorForLabel(b.label),
                        }))}
                        centerLabel={`${newHireSalaryBands.reduce((s, b) => s + b.count, 0)}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs text-white/60">Yaş Aralığı</div>
                      <DonutChart
                        segments={newHireAgeBuckets.map((b, idx) => ({
                          label: `${b.label} (${b.count})`,
                          value: b.count,
                          color: ["#0ea5e9","#22d3ee","#a855f7","#f472b6","#f97316"][idx % 5]
                        }))}
                        centerLabel={`${newHireAgeBuckets.reduce((s, b) => s + b.count, 0)}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-white font-semibold">Ayrılan (Son 30 Gün)</div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-rose-500/20 text-rose-200 border-rose-500/30">{leaversCount} kişi</Badge>
                      {probationLeavers30 > 0 && (
                        <Badge className="bg-amber-500/20 text-amber-100 border-amber-500/30">Deneme: {probationLeavers30}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <div className="text-xs text-white/60">Cinsiyet Dağılımı</div>
                      <DonutChart
                        segments={[{ label: "Erkek", value: leaver30GenderStats.male, color: "#38bdf8" }, { label: "Kadın", value: leaver30GenderStats.female, color: "#ec4899" }]}
                        centerLabel={`${leaver30GenderStats.male + leaver30GenderStats.female}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs text-white/60">Medeni Durum</div>
                      <DonutChart
                        segments={[{ label: "Evli", value: leaver30MaritalStats.married, color: "#22c55e" }, { label: "Bekar", value: leaver30MaritalStats.single, color: "#f59e0b" }]}
                        centerLabel={`${leaver30MaritalStats.married + leaver30MaritalStats.single}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <div className="text-xs text-white/60">Maaş Dağılımı</div>
                      <DonutChart
                        segments={leaver30SalaryBands.map(b => ({
                          label: `${b.label} (${b.count})`,
                          value: b.count,
                          color: salaryColorForLabel(b.label),
                        }))}
                        centerLabel={`${leaver30SalaryBands.reduce((s, b) => s + b.count, 0)}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs text-white/60">Kıdem</div>
                      <DonutChart
                        segments={leaver30TenureBuckets.map(b => ({
                          label: `${b.label} (${b.count})`,
                          value: b.count,
                          color: tenureColorForLabel(b.label),
                        }))}
                        centerLabel={`${leaver30TenureBuckets.reduce((s, b) => s + b.count, 0)}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <div className="text-xs text-white/60">Yaş Aralığı</div>
                      <DonutChart
                        segments={leaver30AgeBuckets.map((b, idx) => ({
                          label: `${b.label} (${b.count})`,
                          value: b.count,
                          color: ["#0ea5e9","#22d3ee","#a855f7","#f472b6","#f97316"][idx % 5]
                        }))}
                        centerLabel={`${leaver30AgeBuckets.reduce((s, b) => s + b.count, 0)}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getGenderVisuals = (emp: Employee) => {
    const g = normalizeGenderKey(emp.personalInfo.gender)
    if (g === "kadın")
      return { Icon: User, bg: "from-pink-500/20 to-rose-500/20", color: "text-pink-100", badge: "♀", badgeBg: "bg-pink-500" }
    if (g === "erkek")
      return { Icon: User, bg: "from-blue-500/20 to-cyan-500/20", color: "text-blue-100", badge: "♂", badgeBg: "bg-blue-500" }
    return { Icon: User, bg: "from-slate-500/20 to-slate-600/20", color: "text-slate-200", badge: "", badgeBg: "" }
  }

  const EmployeeAnalysisSection = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const windowStart = yesterday
    const windowEnd = new Date(today)
    windowEnd.setDate(today.getDate() + 1)

    const hiresLast2Days = useMemo(() => {
      return visibleEmployees
        .filter(emp => emp.employmentInfo.isActive)
        .map(emp => {
          const sd = parseDateString(emp.employmentInfo.startDate)
          return { emp, sd }
        })
        .filter(item => item.sd && item.sd >= windowStart && item.sd < windowEnd)
        .map(item => ({ type: "hire" as const, emp: item.emp, eventDate: item.sd! }))
    }, [visibleEmployees])

    const leaversLast2Days = useMemo(() => {
      return visibleEmployees
        .filter(emp => !emp.employmentInfo.isActive)
        .map(emp => {
          const ed = getSeparationDate(emp)
          return { emp, ed }
        })
        .filter(item => item.ed && item.ed >= windowStart && item.ed < windowEnd)
        .map(item => ({ type: "leave" as const, emp: item.emp, eventDate: item.ed! }))
    }, [visibleEmployees])

    const rows = useMemo(() => {
      return [...hiresLast2Days, ...leaversLast2Days].sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime())
    }, [hiresLast2Days, leaversLast2Days])

    return (
      <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-white/10 backdrop-blur-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-300" />
              <h3 className="text-lg font-semibold text-white">Bugün & Dün Başlayan / Ayrılan Personel</h3>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              {rows.length} hareket
            </Badge>
          </div>

          <div className="space-y-3">
            {rows.length === 0 && (
              <div className="text-sm text-white/70">Bugün ve dün için hareket yok.</div>
            )}

            {rows.map((row, index) => {
              const isHire = row.type === "hire"
              const emp = row.emp
              const salary = formatCurrency(getEffectiveSalary(emp))
              const salaryType = (emp.salaryInfo.current.type || "").toLowerCase().includes("net")
                ? "Net"
                : (emp.salaryInfo.current.type || "").toLowerCase().includes("brüt") ? "Brüt" : emp.salaryInfo.current.type || "—"
              const { Icon, bg, color } = getGenderVisuals(emp)
              const age = calculateAge(emp.personalInfo.birthday)
              const startDate = formatDate(emp.employmentInfo.startDate)
              const endDate = getSeparationDate(emp)
              const reasonOrDept = isHire ? emp.employmentInfo.department.name : (emp.leaveInfo.leaveText || emp.leaveInfo.leaveCode || "Bilinmiyor")
              const typeBadgeClass = salaryType === "Net" ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30" : "bg-blue-500/20 text-blue-200 border-blue-500/30"
              const remaining = emp.details?.remainingDays ?? 0

              return (
                <div
                  key={`${emp.persId}-${index}`}
                  className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-emerald-500/30 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedEmployee(emp)
                    setShowEmployeeModal(true)
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            isHire ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30" : "bg-rose-500/20 text-rose-200 border border-rose-500/30"
                          }`}>
                            {isHire ? "Başlayan" : "Ayrılan"}
                          </div>
                          <div className={`px-2 py-0.5 rounded-full text-[11px] ${
                            emp.employmentInfo.isActive ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"
                          }`}>
                            {emp.employmentInfo.isActive ? "Aktif" : "Pasif"}
                          </div>
                        </div>
                        <div className="font-medium text-white">{emp.contactInfo.display}</div>
                        <div className="text-xs text-white/60 flex flex-wrap gap-2">
                          <span>{emp.persId}</span>
                          <span>• {emp.employmentInfo.company.name}</span>
                          <span>• {emp.employmentInfo.department.name}</span>
                          <span>• {emp.employmentInfo.titleText}</span>
                        </div>
                        <div className="text-[11px] text-white/60 flex gap-3 flex-wrap">
                          <span>Maaş: {salary}</span>
                          <Badge className={typeBadgeClass}>{salaryType}</Badge>
                          <span>Başlangıç: {startDate}</span>
                          {!isHire && endDate && <span>Ayrılış: {formatDate(endDate)}</span>}
                          <span>Yaş: {age || "-"}</span>
                          <span>Kalan İzin: {remaining}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-xs text-white/70">{reasonOrDept}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white bg-white/10 hover:bg-emerald-600/80 hover:text-white border border-white/20 px-3"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Detay
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  const DepartmentAnalysisSection = () => {
    const topDepartments = activeDepartmentStats
    const totalActive = kpiStats.activeEmployees || 1
    return (
      <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-white/10 backdrop-blur-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-violet-300" />
              <h3 className="text-lg font-semibold text-white">Departmana Göre Analiz (Aktif)</h3>
            </div>
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              {topDepartments.length} departman
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {topDepartments.map((dept: any, index: number) => {
              const percentage = totalActive > 0 ? Math.round((dept.active / totalActive) * 1000) / 10 : 0
              return (
                <div key={`${dept.code}-${index}`} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? "bg-amber-500/20 text-amber-300" :
                        index === 1 ? "bg-gray-500/20 text-gray-300" :
                        index === 2 ? "bg-orange-500/20 text-orange-300" :
                        "bg-violet-500/20 text-violet-300"
                      }`}>
                        {index < 3 ? <Crown className="w-4 h-4" /> : <div className="text-xs font-bold">{index + 1}</div>}
                      </div>
                      <div>
                        <div className="font-medium text-white">{dept.name}</div>
                        <div className="text-xs text-white/60">Kod: {dept.code}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{dept.active} kişi</div>
                      <div className="text-xs text-violet-300">{percentage}% aktifin</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                    <div>Erkek: {dept.male}</div>
                    <div>Kadın: {dept.female}</div>
                    <div>Ort. Yaş: {dept.avgAge || "-"} ({dept.minAge || "-"} - {dept.maxAge || "-"})</div>
                    <div>Ort. Kıdem: {dept.avgTenure || "-"} yıl</div>
                    <div>Ort. Maaş: {formatCurrency(dept.avgSalary || 0)}</div>
                    <div>Toplam Maaş: {formatCurrency(dept.totalSalary || 0)}</div>
                    <div>Yaş Aralığı: {dept.topAgeBucket?.label || "-"}</div>
                    <div>Maaş Dağılımı: {dept.topSalaryBand?.label || "-"}</div>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full" style={{ width: `${Math.min(100, percentage)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  const LeaveAnalysisExpanded = () => {
    const enrichWithEmployee = (list: any[]) =>
      list.map(item => {
        const emp = employees.find(e => e.persId === (item.persId || item.PERSID || item.id))
        return { ...item, emp }
      })

    const leaveUsageTop10 = useMemo(() => {
      const list = employees
        .filter(e => (e.details?.totalUsed ?? 0) > 0)
        .sort((a, b) => (b.details?.totalUsed ?? 0) - (a.details?.totalUsed ?? 0))
        .slice(0, 10)
      return list
    }, [employees])

    const leaveEntitlementTop10 = useMemo(() => {
      const list = employees
        .filter(e => (e.details?.remainingDays ?? 0) > 0 || (e.details?.entitledDays ?? 0) > 0)
        .sort((a, b) => (b.details?.remainingDays ?? 0) - (a.details?.remainingDays ?? 0))
        .slice(0, 10)
      return list
    }, [employees])

    const rankingWithNames = enrichWithEmployee(leavesTop5)

    return (
      <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-white/10 backdrop-blur-xl">
        <CardContent className="p-5 space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-300" />
              <h3 className="text-lg font-semibold text-white">İzin Analizi (Genişletilmiş)</h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                {leavesData?.kpi?.totalRequests || 0} talep
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30">
                {leavesData?.kpi?.totalLeaveDays || 0} toplam gün
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-white font-semibold">En Çok İzin Kullanan 10 Kişi</div>
                <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30">Kullanım</Badge>
              </div>
              <div className="space-y-3">
                {leaveUsageTop10.map((emp, idx) => {
                  const used = emp.details?.totalUsed ?? 0
                  const remaining = emp.details?.remainingDays ?? 0
                  const entitled = emp.details?.entitledDays ?? 0
                  const tenure = calculateSeniority(emp.employmentInfo.startDate)
                  const age = calculateAge(emp.personalInfo.birthday)
                  return (
                    <div key={`used-${emp.persId}`} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-200 font-semibold">{idx + 1}</div>
                          <div>
                            <div className="text-white font-medium">{emp.contactInfo.display}</div>
                            <div className="text-xs text-white/60">
                              {emp.employmentInfo.department.name} • {emp.employmentInfo.titleText}
                            </div>
                            <div className="text-[11px] text-white/50">
                              Yaş: {age || "-"} • Kıdem: {tenure} yıl • Maliyet Mrk: {emp.salaryInfo.current.costCenter || "—"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-white/80">
                          <div>Kullandı: <span className="font-semibold text-blue-200">{used}g</span></div>
                          <div>Kalan: <span className="font-semibold text-emerald-200">{remaining}g</span></div>
                          <div>Hak: <span className="font-semibold text-amber-200">{entitled}g</span></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-white font-semibold">En Çok İzin Hakkı Bulunanlar</div>
                <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30">Hak</Badge>
              </div>
              <div className="space-y-3">
                {leaveEntitlementTop10.map((emp, idx) => {
                  const remaining = emp.details?.remainingDays ?? 0
                  const entitled = emp.details?.entitledDays ?? 0
                  const used = emp.details?.totalUsed ?? 0
                  const tenure = calculateSeniority(emp.employmentInfo.startDate)
                  const age = calculateAge(emp.personalInfo.birthday)
                  return (
                    <div key={`ent-${emp.persId}`} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-200 font-semibold">{idx + 1}</div>
                          <div>
                            <div className="text-white font-medium">{emp.contactInfo.display}</div>
                            <div className="text-xs text-white/60">
                              {emp.employmentInfo.department.name} • {emp.employmentInfo.titleText}
                            </div>
                            <div className="text-[11px] text-white/50">
                              Yaş: {age || "-"} • Kıdem: {tenure} yıl • Maliyet Mrk: {emp.salaryInfo.current.costCenter || "—"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-white/80">
                          <div>Hak: <span className="font-semibold text-amber-200">{entitled}g</span></div>
                          <div>Kalan: <span className="font-semibold text-emerald-200">{remaining}g</span></div>
                          <div>Kullandı: <span className="font-semibold text-blue-200">{used}g</span></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-white font-semibold">Sistem İçi / Dışı Toplam</div>
              <div className="text-xs text-white/60">Aktif kadro üzerinden</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg border border-white/10">
                <div className="text-xs text-white/60">Sistem İçi</div>
                <div className="text-lg font-bold text-white">
                  {formatNumber(activeEmployees.reduce((s, e) => s + (e.details?.systemInternal ?? 0), 0))}
                </div>
              </div>
              <div className="p-3 bg-cyan-500/10 rounded-lg border border-white/10">
                <div className="text-xs text-white/60">Sistem Dışı</div>
                <div className="text-lg font-bold text-white">
                  {formatNumber(activeEmployees.reduce((s, e) => s + (e.details?.systemExternal ?? 0), 0))}
                </div>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-lg border border-white/10">
                <div className="text-xs text-white/60">Hak Edilen</div>
                <div className="text-lg font-bold text-white">
                  {formatNumber(activeEmployees.reduce((s, e) => s + (e.details?.entitledDays ?? 0), 0))}
                </div>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg border border-white/10">
                <div className="text-xs text-white/60">Kalan</div>
                <div className="text-lg font-bold text-white">
                  {formatNumber(activeEmployees.reduce((s, e) => s + (e.details?.remainingDays ?? 0), 0))}
                </div>
              </div>
            </div>
          </div>

          {rankingWithNames.length > 0 && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="text-sm text-white/70">API sıralaması (ilk 5):</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {rankingWithNames.map((item, idx) => (
                  <div key={`rank-${idx}`} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{item.emp?.contactInfo?.display || item.persId}</div>
                        <div className="text-xs text-white/60">{item.emp?.employmentInfo?.department?.name || "Departman"} • {item.emp?.employmentInfo?.titleText || "Ünvan"}</div>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30">#{item.rank}</Badge>
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {item.totalLeaveDays} gün • {item.requestCount} talep • Son: {formatDate(item.lastLeaveDate)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const EducationAnalysisExpanded = () => {
    const total = educationStats.reduce((s, e) => s + e.count, 0)
    return (
      <Card className="bg-gradient-to-br from-indigo-500/10 to-sky-500/10 border-white/10 backdrop-blur-xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-300" />
              <h3 className="text-lg font-semibold text-white">Öğrenim Durumu (Genişletilmiş)</h3>
            </div>
            <Badge className="bg-indigo-500/20 text-indigo-200 border-indigo-500/30">
              {educationData?.kpi?.personnelCount || total} kişi
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              {educationStats.length > 0 ? (
                educationStats.map((edu, index) => {
                  const percentage = total > 0 ? Math.round((edu.count / total) * 100) : 0
                  return (
                    <div key={`${edu.eduTypeText}-${index}`} className="space-y-1">
                      <div className="flex items-center justify-between text-sm text-white/80">
                        <span>{edu.eduTypeText}</span>
                        <span className="text-xs text-indigo-200 font-semibold">{edu.count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-4 text-white/60">Eğitim verisi bulunamadı.</div>
              )}
            </div>

            <div className="space-y-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-white/70 mb-1">Departman Perspektifi</div>
              {educationDeptStats.length > 0 ? (
                <div className="space-y-2">
                  {educationDeptStats.map((d, idx) => (
                    <div key={`edu-dept-${idx}`} className="flex items-center justify-between text-sm text-white/80">
                      <span className="truncate max-w-[180px]">{d.dept}</span>
                      <Badge className="bg-indigo-500/20 text-indigo-200 border-indigo-500/30">{d.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-white/60">Departman bazlı eğitim verisi API cevabında iletilmiyor.</div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div className="p-3 bg-indigo-500/10 rounded-lg border border-white/10">
                  <div className="text-xs text-white/60">Toplam Eğitim Kaydı</div>
                  <div className="text-xl font-bold text-white">{educationData?.kpi?.totalEducationCount || total}</div>
                </div>
                <div className="p-3 bg-sky-500/10 rounded-lg border border-white/10">
                  <div className="text-xs text-white/60">Mezun Sayısı</div>
                  <div className="text-xl font-bold text-white">{educationData?.kpi?.graduatedCount || 0}</div>
                </div>
              </div>
              <div className="text-xs text-white/60">
                Veriler en güncel eğitim durumlarını temsil eder; oranlar toplam personele göre hesaplanır.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const CostAnalysisSection = () => (
    <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-white/10 backdrop-blur-xl">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-cyan-300" />
            <h3 className="text-lg font-semibold text-white">Maliyet Analizi (2025 Aylık)</h3>
          </div>
        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
            {formatCurrency(kpiStats.totalSalaryCost)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="text-sm text-white/60">Toplam Maliyetler</div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/60">Toplam Maaş Gideri</div>
              <div className="text-xl font-bold text-white">{formatCurrency(kpiStats.totalSalaryCost)}</div>
              <div className="text-xs text-white/60 mt-1">Aylık ortalama: {formatCurrency(kpiStats.totalSalaryCost / 12)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-white/60">Kişi Başı Ortalama</div>
                <div className="text-xl font-bold text-white">{formatCurrency(kpiStats.avgCostPerEmployee)}</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-white/60">Sendika Üyesi</div>
                <div className="text-xl font-bold text-white">{kpiStats.totalUnionMembers}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-white/60">2025 Aylık Dağılım</div>
            <div className="space-y-2">
              {monthlyCost2025.map(item => {
                const perc = kpiStats.totalSalaryCost ? Math.round((item.amount / (kpiStats.totalSalaryCost / 12)) * 100) : 0
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span>{item.label}</span>
                      <span className="text-white font-semibold">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${Math.min(140, perc)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="text-xs text-white/60 mb-1">Maliyet Merkezleri (Top 4)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {costCenterStats.slice(0, 4).map((center, index) => {
              const percentage = kpiStats.totalSalaryCost > 0 ? Math.round((center.totalSalary / kpiStats.totalSalaryCost) * 100) : 0
              return (
                <div key={`${center.code}-${index}`} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? "bg-amber-500/20 text-amber-300" :
                        index === 1 ? "bg-gray-500/20 text-gray-300" :
                        index === 2 ? "bg-orange-500/20 text-orange-300" :
                        "bg-cyan-500/20 text-cyan-300"
                      }`}>
                        {index < 3 ? <Crown className="w-4 h-4" /> : <div className="text-xs font-bold">{index + 1}</div>}
                      </div>
                      <div>
                        <div className="font-medium text-white truncate max-w-[180px]">{center.code}</div>
                        <div className="text-xs text-white/60">{center.count} personel</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{formatCurrency(center.totalSalary)}</div>
                      <div className="text-xs text-cyan-300">{percentage}%</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const TopEarnersSection = () => {
    const topEarners = useMemo(() => {
      return [...visibleEmployees]
        .sort((a, b) => getEffectiveSalary(b) - getEffectiveSalary(a))
        .slice(0, 10)
    }, [visibleEmployees])

    return (
      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-white/10 backdrop-blur-xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-300" />
              <h3 className="text-lg font-semibold text-white">Maaşı En Yüksek 10 Personel</h3>
            </div>
            <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30">Brüt Liste</Badge>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
            {topEarners.map((emp, idx) => {
              const { Icon, bg, color } = getGenderVisuals(emp)
              const remaining = emp.details?.remainingDays ?? 0
              const tenure = calculateSeniority(emp.employmentInfo.startDate)
              const age = calculateAge(emp.personalInfo.birthday)
              return (
                <div key={`earner-${emp.persId}`} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-amber-400/40 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30">#{idx + 1}</Badge>
                          <div className="text-white font-semibold">{emp.contactInfo.display}</div>
                        </div>
                        <div className="text-xs text-white/60 flex flex-wrap gap-2">
                          <span>{emp.employmentInfo.company.name}</span>
                          <span>• {emp.employmentInfo.department.name}</span>
                          <span>• {emp.employmentInfo.titleText}</span>
                          <span>• Kıdem: {tenure}y</span>
                          <span>• Yaş: {age || "-"}</span>
                          <span>• MM: {emp.salaryInfo.current.costCenter || "—"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">{formatCurrency(getEffectiveSalary(emp))}</div>
                      <div className="text-xs text-white/60">Kalan izin: {remaining}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  const SalaryAnalysisSection = () => (
    <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-white/10 backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-300" />
            <h3 className="text-lg font-semibold text-white">Ücret Analizi (Aktif Çalışan)</h3>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            {formatCurrency(kpiStatsActiveOnly.totalSalary)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-white/60">Ortalama Maaş</div>
            <div className="text-lg font-bold text-white">{formatCurrency(kpiStatsActiveOnly.avgSalary)}</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-white/60">Maksimum Maaş</div>
            <div className="text-lg font-bold text-white">{formatCurrency(kpiStatsActiveOnly.maxSalary)}</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-white/60">Medyan Maaş</div>
            <div className="text-lg font-bold text-white">{formatCurrency(kpiStatsActiveOnly.medianSalary)}</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-white/60">Minimum Maaş</div>
            <div className="text-lg font-bold text-white">{formatCurrency(kpiStatsActiveOnly.minSalary)}</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-white/60">Gender Pay Gap</div>
            <div className="text-lg font-bold text-white">%{genderPayGap.gap}</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-white/60">Erkek Ortalama</div>
            <div className="text-lg font-bold text-white">{formatCurrency(genderPayGap.avgMale)}</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-white/60">Kadın Ortalama</div>
            <div className="text-lg font-bold text-white">{formatCurrency(genderPayGap.avgFemale)}</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-white/60">Aktif Kadro</div>
            <div className="text-lg font-bold text-white">{kpiStatsActiveOnly.totalEmployees} kişi</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-white/60">Maaş Dağılımı</div>
          {activeSalaryBands.map((range, index) => (
            <div key={range.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-white/80">{range.label} TL</div>
                <div className="flex items-center gap-2">
                  <div className="text-white font-semibold">{range.count}</div>
                  <div className="text-xs text-emerald-300">({range.perc}%)</div>
                </div>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full" style={{ width: `${range.perc}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const BudgetForecastSection = () => (
    <Card className="bg-gradient-to-br from-purple-500/15 to-pink-500/15 border-white/10 backdrop-blur-xl">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-purple-200" />
            <h3 className="text-lg font-semibold text-white">Bütçe & Forecast (+%27)</h3>
          </div>
          <Badge className="bg-purple-500/20 text-purple-100 border-purple-500/30">2025 Öngörü</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/60 mb-1">Mevcut Yıllık Gider</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(kpiStats.totalSalaryCost)}</div>
            <div className="text-xs text-white/60 mt-1">Aylık ~ {formatCurrency(kpiStats.totalSalaryCost / 12)}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/60 mb-1">Forecast (+%27)</div>
            <div className="text-2xl font-bold text-purple-100">{formatCurrency(forecastSalaryCost)}</div>
            <div className="text-xs text-emerald-200 mt-1">+{formatCurrency(forecastSalaryCost - kpiStats.totalSalaryCost)} artış</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/60 mb-1">Kişi Başı Forecast</div>
            <div className="text-2xl font-bold text-white">
              {kpiStats.totalEmployees ? formatCurrency(forecastSalaryCost / kpiStats.totalEmployees) : "—"}
            </div>
            <div className="text-xs text-white/60 mt-1">Yıllık / kişi</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-white/70 mb-1">Senaryo Kıyas</div>
            {[
              { label: "Baz (0%)", val: kpiStats.totalSalaryCost, color: "from-slate-400 to-slate-500" },
              { label: "+%10 (ılımlı)", val: kpiStats.totalSalaryCost * 1.10, color: "from-blue-400 to-cyan-400" },
              { label: "+%27 (öngörü)", val: forecastSalaryCost, color: "from-purple-400 to-pink-400" },
              { label: "+%40 (agresif)", val: kpiStats.totalSalaryCost * 1.4, color: "from-amber-400 to-orange-500" },
            ].map((s, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>{s.label}</span>
                  <span className="text-white font-semibold">{formatCurrency(s.val)}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${s.color}`} style={{ width: `${Math.min(100, (s.val / forecastSalaryCost) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
            <div className="text-sm text-white/70 mb-1">Hızlı Notlar</div>
            <ul className="text-xs text-white/80 space-y-1 list-disc pl-4">
              <li>Sendika üye etkisi: {kpiStats.totalUnionMembers} kişi, toplu sözleşme senaryoları bütçeye dahil edilmeli.</li>
              <li>Aktif kadro {kpiStats.activeEmployees} → kişi başı forecast {formatCurrency(kpiStats.totalEmployees ? forecastSalaryCost / kpiStats.totalEmployees : 0)}.</li>
              <li>Departman yoğunluğu yüksek birimlere (örn. {activeDepartmentStats?.[0]?.name || "—"}) bütçe payı ayarlanmalı.</li>
              <li>Turnover 60g %{turnover60d.rate}; elde tutma paketleri için %2-3 ek pay düşünülebilir.</li>
            </ul>
          </div>
        </div>

        <div className="text-xs text-white/60">
          Forecast hesaplaması: mevcut toplam maaş gideri × 1.27. Öngörü yıllık bazlıdır; ek personel, terfi ve enflasyon varyasyonları için hassasiyet analizi önerilir.
        </div>
      </CardContent>
    </Card>
  )

  const MonthlyWorkforceCard = () => (
    <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-white/10 backdrop-blur-xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-300" />
            <h3 className="text-lg font-semibold text-white">{monthlyWorkforceStats.year} Yılı Aylık Özet</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-white/80">
            <thead className="text-xs uppercase text-white/60">
              <tr>
                <th className="py-2 pr-3 text-left">Ay</th>
                <th className="py-2 px-3 text-right">Ort. Çalışan</th>
                <th className="py-2 px-3 text-right">Başlayan</th>
                <th className="py-2 px-3 text-right">Ayrılan</th>
              </tr>
            </thead>
            <tbody>
              {monthlyWorkforceStats.stats.map(stat => (
                <tr key={stat.label} className="border-t border-white/5">
                  <td className="py-2 pr-3 font-medium text-white">{stat.label}</td>
                  <td className="py-2 px-3 text-right">{stat.avgEmployees}</td>
                  <td className="py-2 px-3 text-right text-emerald-300">{stat.hires}</td>
                  <td className="py-2 px-3 text-right text-rose-300">{stat.leavers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )

  /* --- Filter Bar (updated) --- */
  const CompactFilterBar = () => {
    const applySearch = () => {
      const next = searchDraft.trim()
      setFilters(prev => ({ ...prev, search: next }))
      setPage(1)
      requestAnimationFrame(() => {
        searchInputRef.current?.focus({ preventScroll: true })
      })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        applySearch()
      }
      if (e.key === "Escape") {
        setSearchDraft("")
        setFilters(prev => ({ ...prev, search: "" }))
        requestAnimationFrame(() => {
          searchInputRef.current?.focus({ preventScroll: true })
        })
      }
    }

    useEffect(() => {
      searchInputRef.current?.focus({ preventScroll: true })
    }, [])

    return (
      <Card className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl border-white/30 shadow-xl">
        <CardContent className="p-2 sm:p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-3 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-800">İsim, soyad, ünvan veya ID ara</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700/70" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Örn: Ayşe Yılmaz, Yazılım Uzmanı, 12345"
                    value={searchDraft}
                    onKeyDown={handleKeyDown}
                    onChange={e => setSearchDraft(e.target.value)}
                    className="pl-9 pr-3 w-full bg-white/90 border-white/60 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 h-10 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onMouseDown={e => e.preventDefault()}
                  onClick={applySearch}
                  className="h-10 px-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm hover:from-violet-700 hover:to-fuchsia-700 gap-2"
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
                  {companies.map(comp => (
                    <SelectItem key={comp.code} value={comp.code}>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate max-w-[400px]">{comp.name}</span>
                        <span className="text-xs text-slate-500 truncate">Kod: {comp.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const EmployeeModal = () => {
    if (!selectedEmployee) return null

    const emp = selectedEmployee
    const age = calculateAge(emp.personalInfo.birthday)
    const seniority = calculateSeniority(emp.employmentInfo.startDate)
    const salaryIncrease = emp.salaryInfo.previous?.amount ? calculatePercentChange(emp.salaryInfo.previous.amount, getEffectiveSalary(emp)) : 0
    const separation = getSeparationDate(emp)

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEmployeeModal(false)} />
        <div className="relative w-full max-w-4xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{emp.contactInfo.display}</h2>
                  <p className="text-white/60">
                    {emp.employmentInfo.titleText} • {emp.employmentInfo.department.name}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowEmployeeModal(false)} className="text-white/60 hover:text-white hover:bg-white/10">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Kişisel Bilgiler
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">TC Kimlik:</span>
                      <span className="text-white font-medium">{emp.personalInfo.identityNo}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Doğum Tarihi:</span>
                      <span className="text-white font-medium">{emp.personalInfo.birthday || "Bilinmiyor"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Yaş:</span>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{age || "-"} yaş</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Cinsiyet:</span>
                      <Badge
                        className={
                          normalizeGenderKey(emp.personalInfo.gender) === "erkek"
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                            : "bg-pink-500/20 text-pink-300 border-pink-500/30"
                        }
                      >
                        {normalizeGenderLabel(emp.personalInfo.gender)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Medeni Durum:</span>
                      <Badge
                        className={
                          emp.personalInfo.maritalStatus === "Evli"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }
                      >
                        {emp.personalInfo.maritalStatus}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Çocuk Sayısı:</span>
                      <span className="text-white font-medium">{emp.militaryInfo?.childrenCount ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    İletişim Bilgileri
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-white/60" />
                      <span className="text-white">{emp.contactInfo.mobile || "Belirtilmemiş"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Home className="w-4 h-4 text-white/60" />
                      <span className="text-white">{emp.contactInfo.homePhone || "Belirtilmemiş"}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-white/60 mt-1" />
                      <div>
                        <div className="text-white">{emp.contactInfo.homeAddress.street}</div>
                        <div className="text-white/60 text-sm">
                          {emp.contactInfo.homeAddress.city} {emp.contactInfo.homeAddress.state && `, ${emp.contactInfo.homeAddress.state}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    İş Bilgileri
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Şirket:</span>
                      <span className="text-white font-medium">{emp.employmentInfo.company.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Departman:</span>
                      <div className="text-right">
                        <div className="text-white font-medium">{emp.employmentInfo.department.name}</div>
                        <div className="text-xs text-white/60">Kod: {emp.employmentInfo.department.code}</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Ünvan:</span>
                      <div className="text-right">
                        <div className="text-white font-medium">{emp.employmentInfo.titleText}</div>
                        <div className="text-xs text-white/60">Kod: {emp.employmentInfo.title}</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">İşe Başlama:</span>
                      <span className="text-white font-medium">{emp.employmentInfo.startDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Kıdem:</span>
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">{seniority} yıl</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Durum:</span>
                      <Badge className={emp.employmentInfo.isActive ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}>
                        {emp.employmentInfo.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Durum Notu:</span>
                      <span className="text-white font-medium">
                        {emp.employmentInfo.isActive ? "Çalışıyor" : `Ayrılış Tarihi: ${formatDate(separation || "")}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Kalan İzin:</span>
                      <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30">{emp.details?.remainingDays ?? 0} gün</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Maaş Bilgileri
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Güncel Maaş:</span>
                      <div className="text-right">
                        <div className="text-white font-medium">{formatCurrency(getEffectiveSalary(emp))}</div>
                        <div className="text-xs text-white/60">{emp.salaryInfo.current.currency}</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-white/70">
                      <span>Tip:</span>
                      <span>{emp.salaryInfo.current.type || "—"}</span>
                    </div>
                    {emp.salaryInfo.previous?.amount ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Önceki Maaş:</span>
                          <div className="text-right">
                            <div className="text-white font-medium">{formatCurrency(emp.salaryInfo.previous.amount)}</div>
                            <div className="text-xs text-white/60">{emp.salaryInfo.previous.type || "—"}</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Maaş Artışı:</span>
                          <Badge className={salaryIncrease > 0 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}>
                            {salaryIncrease > 0 ? "+" : ""}
                            {Math.round(salaryIncrease)}%
                          </Badge>
                        </div>
                      </>
                    ) : null}
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Geçerlilik:</span>
                      <span className="text-white font-medium">{emp.salaryInfo.current.validFrom}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Sendika:</span>
                      <Badge className={emp.salaryInfo.current.union === 1 ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-gray-500/20 text-gray-300 border-gray-500/30"}>
                        {emp.salaryInfo.current.union === 1 ? "Üye" : "Üye Değil"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Maliyet Merkezi:</span>
                      <span className="text-white font-medium">{emp.salaryInfo.current.costCenter}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/10 flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowEmployeeModal(false)}
              className="text-white bg-white/10 hover:bg-white/15 border border-white/20"
            >
              Kapat
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700">
              <Edit className="w-4 h-4 mr-2" />
              Personeli Düzenle
            </Button>
          </div>
        </div>
      </div>
    )
  }

  /* --- Yönetim Analizi (refined for CEO view) --- */
  const ExecutiveSummarySection = () => {
    const avgAgeActive = activeEmployees.length
      ? Math.round(activeEmployees.reduce((s, e) => s + calculateAge(e.personalInfo.birthday), 0) / activeEmployees.length)
      : 0
    const topDept = activeDepartmentStats?.[0]
    const totalOvertimeHours = (overtimeTop10 || []).reduce((sum, row: any) => {
      const hours =
        row?.overtime?.totalHours ??
        row.totalHours ??
        row.TOTAL_OVERTIME_HOUR ??
        row.hours ??
        row.total ??
        0
      return sum + (Number(hours) || 0)
    }, 0)

    const ceoCards = [
      {
        title: "Kadro Nabzı",
        value: `${kpiStats.activeEmployees} aktif / ${kpiStats.totalEmployees}`,
        sub: `Turnover 60g: %${turnover60d.rate}`,
        color: "from-emerald-500/25 to-teal-500/25",
        icon: Users,
      },
      {
        title: "Ücret Nabzı",
        value: formatCurrency(kpiStats.avgSalary),
        sub: `Gender gap %${genderPayGap.gap}`,
        color: "from-amber-500/25 to-orange-500/25",
        icon: DollarSign,
      },
      {
        title: "Operasyon Yükü",
        value: `${totalOvertimeHours} saat`,
        sub: "Top 10 mesai toplamı",
        color: "from-cyan-500/25 to-blue-500/25",
        icon: Timer,
      },
      {
        title: "Yaş / Kıdem",
        value: `${avgAgeActive || "-"} yaş`,
        sub: `Ort. kıdem ${kpiStats.avgSeniority} yıl`,
        color: "from-violet-500/25 to-fuchsia-500/25",
        icon: Gauge,
      },
    ]

    return (
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-800/80 border border-white/10 shadow-2xl">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-200" />
              <h3 className="text-xl font-semibold text-white">Yönetim İçgörü Panosu (CEO)</h3>
            </div>
            <Badge className="bg-white/10 text-white border-white/20">Güncel fotoğraf</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {ceoCards.map(card => (
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
                <li>En büyük ekip: {topDept ? `${topDept.name} (${topDept.active} kişi, ort. maaş ${formatCurrency(topDept.avgSalary)})` : "—"}</li>
                <li>Son 30g: {newHires.length} başlayan / {leaversLast30.length} ayrılan (deneme ayrılan {probationLeavers30}).</li>
                <li>Turnover (60g) %{turnover60d.rate}; elde tutma için hızlı paket önerisi.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-sm text-white font-semibold">Risk & Radar</div>
              <ul className="text-sm text-white/80 space-y-1 list-disc pl-4">
                <li>Cinsiyet ücret farkı %{genderPayGap.gap}; kritik roller için düzeltme planı.</li>
                <li>Mesai yükü {totalOvertimeHours} saat; vardiya / kapasite optimizasyonu gerekiyor.</li>
                <li>İzin bakiyesi yüksek çalışanlar: planlı kullanım ile motivasyon ve maliyet dengesi.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-sm text-white font-semibold">Sonraki 30 Gün Aksiyon</div>
              <ul className="text-sm text-white/80 space-y-1 list-disc pl-4">
                <li>Top 10 yüksek maaşlı rol için bağlılık & yedekleme planı.</li>
                <li>Onboarding kontrol listesi: {newHires.length} yeni başlangıç için 90g takibi.</li>
                <li>Departman ücret ve gender-gap taraması; hızlı düzeltme seti çıkar.</li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-white/10 text-white space-y-2">
            <div className="text-sm font-semibold">Kısa Yönetici Notu</div>
            <p className="text-sm text-white/80 leading-relaxed">
              Kadro dengesi korunuyor, turnover %{turnover60d.rate} seviyesinde. Ücret ortalaması {formatCurrency(kpiStats.avgSalary)} ve gender gap %{genderPayGap.gap} yakından izlenmeli.
              Mesai yükü {totalOvertimeHours} saat; iş gücü planlaması ve fazla mesai optimizasyonu kısa vadeli öncelik. Finansal bütçe forecast +%27 ile {formatCurrency(forecastSalaryCost)} seviyesinde.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentTabMeta = {
    overview: { label: "Genel Bakış", icon: Building },
    employees: { label: "Personel Listesi", icon: Users },
    analytics: { label: "Analitik Raporlar", icon: Target },
    salary: { label: "Maaş / Maliyet", icon: DollarSign },
    reports: { label: "Yönetim Analizi", icon: PieChart },
  }

  /* Overtime & Mesai Top 10 (fixed totalHours mapping) */
  const OvertimeTopSection = () => {
    const data = useMemo(() => {
      return (overtimeTop10 || []).map(item => {
        const emp = employees.find(e => e.persId === (item.persId || item.PERSID || item.id))
        return { ...item, emp }
      })
    }, [overtimeTop10, employees])

    const totalHours = useMemo(() => {
      return (data || []).reduce((sum, row: any) => {
        const hours =
          row?.overtime?.totalHours ??
          row.totalHours ??
          row.TOTAL_OVERTIME_HOUR ??
          row.hours ??
          row.total ??
          0
        return sum + (Number(hours) || 0)
      }, 0)
    }, [data])

    return (
      <Card className="bg-gradient-to-br from-cyan-500/10 to-sky-500/10 border-white/10 backdrop-blur-xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-cyan-300" />
              <h3 className="text-lg font-semibold text-white">Mesai Analizi • Top 10</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-cyan-500/20 text-cyan-200 border-cyan-500/30">Son dönem</Badge>
              <Badge className="bg-white/10 text-white border-white/20">Toplam: {totalHours} saat</Badge>
            </div>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
            {data.map((row, idx) => {
              const emp = row.emp
              const hours =
                row?.overtime?.totalHours ??
                row.totalHours ??
                row.TOTAL_OVERTIME_HOUR ??
                row.hours ??
                row.total ??
                0
              const amount =
                row?.overtime?.totalAmount ??
                row.totalAmount ??
                row.TOTAL_OVERTIME_AMOUNT ??
                0
              const costCenter = emp?.salaryInfo?.current?.costCenter || row.costCenter || "—"
              const tenure = emp ? calculateSeniority(emp.employmentInfo.startDate) : null
              const age = emp ? calculateAge(emp.personalInfo.birthday) : null
              return (
                <div key={`ot-${idx}`} className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-cyan-500/20 text-cyan-100 border-cyan-500/30 min-w-[32px] justify-center">#{row.rank || idx + 1}</Badge>
                    <div>
                      <div className="text-white font-semibold">{emp?.contactInfo?.display || row.name || row.display || "Bilinmiyor"}</div>
                      <div className="text-xs text-white/60">
                        {emp?.employmentInfo?.department?.name || row.department || "Departman"} • {emp?.employmentInfo?.titleText || row.title || "Görev"}
                      </div>
                      <div className="text-[11px] text-white/50">Kıdem: {tenure ?? "-"}y • Yaş: {age ?? "-"} • MM: {costCenter}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{hours} sa</div>
                    <div className="text-xs text-white/60">Tutar: {formatCurrency(amount)}</div>
                  </div>
                </div>
              )
            })}
            {data.length === 0 && <div className="text-white/60 text-sm">Mesai verisi bulunamadı.</div>}
          </div>
        </CardContent>
      </Card>
    )
  }

  /* ===========================
     Render
     =========================== */

  if (isLoading && !isRefreshing) {
    return <LoadingScreen />
  }

  const refreshProgress = isRefreshing ? 65 : 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-violet-950/80 to-fuchsia-950/60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 rounded-full blur-3xl animate-spin-slow" />
        </div>
      </div>

      <DataRefreshOverlay open={isRefreshing} message="Veriler güncelleniyor" progress={refreshProgress} />

      <div className="relative z-10">
        <nav className="sticky top-0 z-40 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
                <div className="relative p-2 rounded-lg bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 group-hover:from-violet-500/30 group-hover:to-fuchsia-500/30">
                  <ChevronLeft className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Modüllere Dön</span>
              </Link>

              <div className="h-6 w-px bg-white/20" />

              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg blur opacity-30" />
                  <div className="relative p-2 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">İnsan Kaynakları</h1>
                  <p className="text-sm text-white/60">Dashboard</p>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-white/80">
                  {kpiStats.activeEmployees} Aktif Çalışan
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <UserMinus className="w-4 h-4 text-red-400" />
                <span className="text-sm text-white/80">
                  {kpiStats.inactiveEmployees} Çıkış Yapılmış
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchAllData()}
                disabled={isRefreshing}
                className="gap-2 text-white/60 hover:text-white border border-white/10 backdrop-blur-sm hover:bg-white/5"
              >
                {isRefreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="hidden md:inline">Yenile</span>
              </Button>

              {isAuthenticated && (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 hover:border-fuchsia-500/30 transition-colors">
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
              <CompactFilterBar />

              {activeTab === "overview" && (
                <div className="space-y-6">
                  <DemographicsSection />
                  <EmployeeAnalysisSection />
                  <DepartmentAnalysisSection />
                  <MonthlyWorkforceCard />
                  <TodayBirthdayBanner />
                </div>
              )}

              {activeTab === "employees" && (
                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/20 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-white">Personel Listesi</h3>
                          <p className="text-sm text-white/60">
                            {filteredEmployees.length} kayıt • {kpiStats.activeEmployees} aktif • {kpiStats.inactiveEmployees} pasif
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {[{ value: "active", label: "Aktif" }, { value: "inactive", label: "Pasif" }, { value: "all", label: "Tümü" }].map(item => (
                            <Button
                              key={item.value}
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setStatusFilter(item.value as any)
                                setPage(1)
                              }}
                              className={`px-3 py-1.5 border bg-white/5 text-white/70 border-white/20 hover:text-white ${
                                statusFilter === item.value ? "bg-violet-600/60 text-white border-violet-400/60" : ""
                              }`}

                            >
                              {item.label}
                            </Button>
                          ))}
                          <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/10" onClick={exportCSV}>
                            <Download className="w-4 h-4 mr-2" />
                            CSV İndir
                          </Button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="p-3 text-left text-sm font-semibold text-white/80">Personel</th>
                              <th className="p-3 text-left text-sm font-semibold text-white/80 hidden lg:table-cell">Şirket</th>
                              <th className="p-3 text-left text-sm font-semibold text-white/80">Departman/Ünvan</th>
                              <th className="p-3 text-left text-sm font-semibold text-white/80 hidden md:table-cell">Maaş</th>
                              <th className="p-3 text-left text-sm font-semibold text-white/80">Durum / Tarihler</th>
                              <th className="p-3 text-left text-sm font-semibold text-white/80">Detay</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedEmployees.map((emp, index) => {
                              const age = emp.personalInfo.birthday ? calculateAge(emp.personalInfo.birthday) : undefined
                              const seniority = calculateSeniority(emp.employmentInfo.startDate)
                              const { Icon, bg, color } = getGenderVisuals(emp)
                              const endDate = getSeparationDate(emp)
                              const workDuration = emp.employmentInfo.isActive ? formatYearsMonths(emp.employmentInfo.startDate) : formatYearsMonths(emp.employmentInfo.startDate, endDate || "")
                              const leaveCode = emp.leaveInfo.leaveText || emp.leaveInfo.leaveCode
                              const remainingLeave = emp.details?.remainingDays ?? 0

                              return (
                                <tr key={`${emp.persId}-${index}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="p-3">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${bg} flex items-center justify-center`}>
                                        <Icon className={`w-5 h-5 ${color}`} />
                                      </div>
                                      <div>
                                        <div className="font-medium text-white">{emp.contactInfo.display}</div>
                                        <div className="text-xs text-white/60">{emp.persId}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 hidden lg:table-cell">
                                    <div className="text-white">{emp.employmentInfo.company.name}</div>
                                    <div className="text-xs text-white/60">Kod: {emp.employmentInfo.company.code}</div>
                                  </td>
                                  <td className="p-3">
                                    <div>
                                      <div className="text-white font-medium">{emp.employmentInfo.department.name}</div>
                                      <div className="text-xs text-white/60">{emp.employmentInfo.titleText}</div>
                                    </div>
                                  </td>
                                  <td className="p-3 hidden md:table-cell">
                                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                                      {formatCurrency(getEffectiveSalary(emp))}
                                    </Badge>
                                    <div className="text-xs text-white/60 mt-1">
                                      {emp.salaryInfo.current.costCenter}
                                    </div>
                                    <div className="text-[11px] text-white/60 mt-1">
                                      {emp.salaryInfo.current.type || "—"}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex flex-col gap-1 text-xs text-white/70">
                                      <Badge className={emp.employmentInfo.isActive ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 w-fit" : "bg-red-500/20 text-red-300 border-red-500/30 w-fit"}>
                                        {emp.employmentInfo.isActive ? "Aktif" : "Pasif"}
                                      </Badge>
                                      <span className="text-white/80">Başlangıç: {formatDate(emp.employmentInfo.startDate)}</span>
                                      {!emp.employmentInfo.isActive && endDate && (
                                        <>
                                          <span className="text-white/80">Ayrılış: {formatDate(endDate)}</span>
                                          <span className="text-white/80">Süre: {workDuration}</span>
                                          {leaveCode ? <span className="text-white/70">Ayrılış Kodu: {leaveCode}</span> : null}
                                        </>
                                      )}
                                      {emp.employmentInfo.isActive && <span className="text-white/60">Kıdem: {workDuration}</span>}
                                      <span className="text-white/60">Yaş: {age || "-"} • Kıdem(yıl): {seniority} • Kalan İzin Gün: {remainingLeave}</span>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedEmployee(emp)
                                        setShowEmployeeModal(true)
                                      }}
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

                        {filteredEmployees.length === 0 && (
                          <div className="p-8 text-center">
                            <Users className="w-12 h-12 mx-auto mb-4 text-white/20" />
                            <p className="text-white/60">Filtrelere uygun personel bulunamadı.</p>
                          </div>
                        )}

                      </div>

                      {filteredEmployees.length > 0 && (
                        <div className="p-4 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="text-sm text-white/60">
                            Sayfa {page} / {Math.ceil(filteredEmployees.length / pageSize)} • Toplam {filteredEmployees.length} kayıt
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
                              <option value={10}>10 / sayfa</option>
                              <option value={20}>20 / sayfa</option>
                              <option value={50}>50 / sayfa</option>
                              <option value={100}>100 / sayfa</option>
                            </select>

                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="text-white/60 hover:text-white">
                                Önceki
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPage(p => Math.min(Math.ceil(filteredEmployees.length / pageSize), p + 1))} disabled={page >= Math.ceil(filteredEmployees.length / pageSize)}
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
                </div>
              )}

              {activeTab === "analytics" && (
                <div className="space-y-6">
                  <LeaveAnalysisExpanded />
                  <EducationAnalysisExpanded />
                  <DepartmentAnalysisSection />
                </div>
              )}

              {activeTab === "salary" && (
                <div className="space-y-6">
                  <SalaryAnalysisSection />
                  <CostAnalysisSection />
                  <OvertimeTopSection />
                  <TopEarnersSection />
                  <BudgetForecastSection />
                </div>
              )}

              {activeTab === "reports" && (
                <div className="space-y-6">
                  <ExecutiveSummarySection />
                </div>
              )}

              <div className="mt-8 border-t border-white/10 pt-6 pb-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left w-full">
                    <p className="text-sm text-white/40">© 2025 HR Dashboard • Tüm Hakları Saklıdır</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showEmployeeModal && <EmployeeModal />}

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

        {showScrollTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-4 z-50 p-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-2xl border border-white/20 hover:scale-105 transition-transform backdrop-blur-lg"
            aria-label="Yukarı çık"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}