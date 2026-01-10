"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import {
  ArrowDownToLine,
  ArrowUpToLine,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet,
  XCircle,
  Eye,
  EyeOff,
  MoreVertical,
  Coins,
  Gem,
  Zap,
  CircleDollarSign,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { AnimatePresence, motion } from "framer-motion"

type PayrollItem = {
  BORDRO_TIPI: string
  YIL: string
  AY: string
  DONEM_BASLANGIC: string
  HESAPLANMA_TARIHI: string
  AYLIK_BRUT: number
  NORMAL_CALISMA_BRUT: number
  EK_KAZANC_BRUT: number
  TOPLAM_BRUT: number
  TOPLAM_KESINTI: number
  NET_UCRET: number
  NET_ODENEN: number
  TOPLAM_ISVEREN_MALIYETI: number
  GELIR_VERGISI: number
  DAMGA_VERGISI: number
  SGK_MATRAHI: number
  SGK_ISCI_PAYI: number
  SGK_ISVEREN_PAYI: number
  DURUM_KODU: number
  DURUM_ACIKLAMA: string
  BORDRO_TIPI_ACIKLAMA: string
}

type PayrollStats = {
  son5Toplam: number
  kapanmisToplam: number
  kapanmamisToplam: number
  sonNetMaaş: number | null
  sonDonem: string | null
  sonDurum: string | null
}

type ApiResponse = {
  success: boolean
  data?: {
    son5Bordro: PayrollItem[]
    istatistik: PayrollStats
  }
}

type FetchState = "idle" | "loading" | "error" | "success"

const monthNamesTR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
]

function formatCurrency(value?: number) {
  if (value === undefined || value === null) return "—"
  return value.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatDateTR(ddmmyyyy?: string) {
  if (!ddmmyyyy) return "—"
  const [dd, mm, yyyy] = ddmmyyyy.split(".")
  const monthIdx = Number(mm) - 1
  const month = monthNamesTR[monthIdx] ?? mm
  return `${dd} ${month} ${yyyy}`
}

function statusPill(durum: string) {
  if (durum?.toUpperCase() === "KAPANMIŞ")
    return { 
      text: "Kapanmış", 
      className: "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-100 border border-emerald-400/40",
      icon: CheckCircle2,
    }
  if (durum?.toUpperCase() === "KAPANMAMIŞ")
    return { 
      text: "Açık", 
      className: "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-100 border border-amber-400/40",
      icon: Zap,
    }
  return { 
    text: durum || "Belirsiz", 
    className: "bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-200 border border-slate-400/40",
    icon: MoreVertical,
  }
}

function percentage(part?: number, total?: number) {
  if (!total || total === 0 || part === undefined || part === null) return 0
  return Math.min(100, Math.max(0, (part / total) * 100))
}

export default function PayrollPage() {
  const { user } = useAuth()
  const [state, setState] = useState<FetchState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PayrollItem[]>([])
  const [stats, setStats] = useState<PayrollStats | null>(null)
  const [selected, setSelected] = useState(0)
  const [showNet, setShowNet] = useState(true)
  const [showGross, setShowGross] = useState(true)

  const fetchData = useCallback(async () => {
    setState("loading")
    setError(null)

    const dbName = (user as any)?.dbName || "HOMINUM"
    const persid = (user as any)?.persid
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const res = await fetch(`/api/mobil-user/payroll-history?dbName=${encodeURIComponent(dbName)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-db-name": dbName,
        },
        body: JSON.stringify({ persid }),
        cache: "no-store",
        signal: controller.signal,
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || "Bilinmeyen hata")
      }

      const json: ApiResponse = await res.json()
      if (!json.success || !json.data) {
        throw new Error("Veri alınamadı")
      }

      setData(json.data.son5Bordro || [])
      setStats(json.data.istatistik || null)
      setSelected(0)
      setState("success")
    } catch (err: any) {
      console.error("Payroll fetch error:", err)
      if (err.name === "AbortError") setError("Sunucu yanıt vermedi, lütfen tekrar deneyin.")
      else setError("Bordro verisi alınamadı. Tekrar deneyin.")
      setState("error")
    } finally {
      clearTimeout(timeout)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const current = useMemo(() => data[selected], [data, selected])

  const gross = current?.TOPLAM_BRUT ?? 0
  const deductions = current?.TOPLAM_KESINTI ?? 0
  const net = current?.NET_ODENEN ?? current?.NET_UCRET ?? 0

  const grossToDeductionPct = percentage(deductions, gross)
  const netPct = percentage(net, gross)

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <main className="px-4 space-y-6 pt-2">
        {/* Net Maaş - Göz butonu kaldırıldı */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-blue-500/5 p-6 text-center space-y-4 shadow-xl">
          <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 p-0.5 shadow-lg">
            <div className="h-full w-full rounded-full bg-slate-950/90 flex items-center justify-center">
              <CircleDollarSign className="h-12 w-12 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white/70">Net Maaş</p>
            <span className="text-4xl font-black text-white block">
              {showNet ? formatCurrency(net) : "•••••"}
            </span>
          </div>
        </div>

        {/* Ay seçim alanı */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-semibold text-white">Son 5 Bordro</p>
            </div>
            <div className="text-xs text-white/60">Seç ve görüntüle</div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            <AnimatePresence>
              {data.map((item, idx) => {
                const active = idx === selected
                const pill = statusPill(item.DURUM_ACIKLAMA)
                const PillIcon = pill.icon
                
                return (
                  <motion.button
                    key={`${item.YIL}-${item.AY}-${idx}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelected(idx)}
                    className={`px-2 py-2 rounded-xl border transition-all duration-200 text-left flex flex-col gap-1 ${
                      active
                        ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-400/50 shadow-md"
                        : "bg-white/5 border-white/10 hover:border-cyan-300/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{`${item.YIL}/${item.AY.padStart(2, "0")}`}</span>
                      <ChevronRight className="h-3 w-3 text-white/70" />
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${pill.className}`}>
                      <PillIcon className="h-2 w-2" />
                      {pill.text}
                    </span>
                  </motion.button>
                )
              })}
            </AnimatePresence>
            {data.length === 0 && (
              <div className="col-span-5 text-center py-3">
                <div className="text-sm text-white/40">Bordro bulunamadı</div>
              </div>
            )}
          </div>
        </div>

        {/* Özet kartları */}
        <div className="grid grid-cols-2 gap-3">
          <ValueCard
            title="Net Ödenen"
            value={showNet ? formatCurrency(net) : "•••••"}
            icon={Coins}
            accent="from-emerald-500 to-green-500"
            badge={current?.BORDRO_TIPI_ACIKLAMA}
            onToggle={() => setShowNet((s) => !s)}
          />
          <ValueCard
            title="Toplam Brüt"
            value={showGross ? formatCurrency(gross) : "•••••"}
            icon={Gem}
            accent="from-blue-500 to-cyan-500"
            badge={current ? formatDateTR(current.DONEM_BASLANGIC) : ""}
            onToggle={() => setShowGross((s) => !s)}
          />
        </div>

        {/* Dağılım */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <BarChart3 className="h-4 w-4 text-cyan-300" />
            Dağılım
          </div>
          <ProgressLine
            label="Net / Brüt"
            value={net}
            total={gross}
            percent={netPct}
            colors="from-emerald-400 to-green-500"
          />
          <ProgressLine
            label="Toplam Kesinti / Brüt"
            value={deductions}
            total={gross}
            percent={grossToDeductionPct}
            colors="from-rose-400 to-pink-500"
          />
          <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
            <InfoRow icon={ArrowUpToLine} label="İşveren Maliyeti" value={formatCurrency(current?.TOPLAM_ISVEREN_MALIYETI)} />
            <InfoRow icon={ArrowDownToLine} label="Gelir Vergisi" value={formatCurrency(current?.GELIR_VERGISI)} />
            <InfoRow icon={ShieldCheck} label="SGK İşçi Payı" value={formatCurrency(current?.SGK_ISCI_PAYI)} />
            <InfoRow icon={ShieldCheck} label="SGK İşveren Payı" value={formatCurrency(current?.SGK_ISVEREN_PAYI)} />
            <InfoRow icon={ShieldCheck} label="Damga Vergisi" value={formatCurrency(current?.DAMGA_VERGISI)} />
            <InfoRow icon={ShieldCheck} label="SGK Matrahı" value={formatCurrency(current?.SGK_MATRAHI)} />
          </div>
        </div>
      </main>

      {/* Boş durum */}
      {state === "success" && data.length === 0 && (
        <EmptyState onRetry={fetchData} />
      )}

      {/* Hata durumu */}
      {state === "error" && (
        <ErrorState message={error} onRetry={fetchData} />
      )}

      {/* Yükleniyor */}
      {state === "loading" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
            <p className="text-sm text-white/80">Bordro yükleniyor…</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* --- Alt bileşenler --- */

function ValueCard({
  title,
  value,
  badge,
  icon: Icon,
  accent,
  onToggle,
}: {
  title: string
  value: string
  badge?: string
  icon: any
  accent: string
  onToggle?: () => void
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${accent} p-[2px]`}>
            <div className="h-full w-full rounded-xl bg-slate-950/80 flex items-center justify-center">
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-xs text-white/70">{title}</p>
            <p className="text-xl font-black text-white">{value}</p>
          </div>
        </div>
        {onToggle && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggle}
            className="text-[11px] px-2 py-1 rounded-full border border-white/20 text-white/80 bg-white/5 hover:border-cyan-300/60"
          >
            {value.includes("••") ? "Göster" : "Gizle"}
          </motion.button>
        )}
      </div>
      {badge && (
        <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] text-white/75">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          {badge}
        </div>
      )}
    </div>
  )
}

function ProgressLine({
  label,
  value,
  total,
  percent,
  colors,
}: {
  label: string
  value: number
  total: number
  percent: number
  colors: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-white/70 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-white">{formatCurrency(value)} / {formatCurrency(total)}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10">
      <Icon className="h-4 w-4 text-white/80" />
      <div className="text-xs text-white/70">{label}</div>
      <div className="ml-auto text-sm font-semibold text-white">{value}</div>
    </div>
  )
}

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="px-4 pb-16">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center space-y-3">
        <CheckCircle2 className="h-8 w-8 text-cyan-300 mx-auto" />
        <p className="text-sm text-white/80">Gösterilecek bordro bulunamadı.</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold"
        >
          Yenile
        </motion.button>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-red-100">
          <XCircle className="h-6 w-6" />
          <p className="font-bold">Hata</p>
        </div>
        <p className="text-sm text-red-100/80">
          {message || "Bilinmeyen bir hata oluştu."}
        </p>
        <button
          onClick={onRetry}
          className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-semibold"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  )
}