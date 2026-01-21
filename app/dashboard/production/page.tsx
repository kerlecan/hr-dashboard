// app/dashboard/production/page.tsx
"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Home, Factory, Truck, Drill, HardHat, 
  Target, AlertTriangle, Clock, CheckCircle,
  TrendingUp, TrendingDown, Activity, BarChart3,
  Shield, Thermometer, Droplets, Battery,
  Users, Calendar, Package, Fuel, 
  Wrench, Zap, Cloud, Mountain,
  ArrowUpRight, ArrowDownRight, Eye,
  RefreshCw, Filter, Download, Settings,
  ChevronRight, ChevronLeft, ChevronUp,
  Brain, Cpu, Database, LineChart,
  PieChart, Bell, AlertCircle, Timer,
  ShieldCheck // Bu satırı ekleyelim
} from "lucide-react"

/* ===========================
   Types & Constants
   =========================== */

type ProductionKPI = {
  id: string
  label: string
  value: number
  unit: string
  target: number
  status: "above" | "on-track" | "below" | "critical"
  change?: number
  icon: React.ReactNode
  color: string
}

type MachineStatus = {
  id: string
  name: string
  type: "excavator" | "truck" | "crusher" | "loader" | "drill"
  status: "active" | "idle" | "maintenance" | "broken"
  efficiency: number
  fuel: number
  hours: number
  lastMaintenance: string
}

type ProductionStep = {
  step: number
  name: string
  planned: number
  actual: number
  efficiency: number
  bottleneck: boolean
  delay: number
  color: string
}

type ShiftPerformance = {
  shift: string
  operatorCount: number
  production: number
  target: number
  efficiency: number
  downtime: number
  incidents: number
}

type DowntimeReason = {
  reason: string
  hours: number
  percentage: number
  cost: number
  color: string
}

type SafetyMetric = {
  daysWithoutAccident: number
  nearMisses: number
  trainingCompletion: number
  highRiskAreas: number
}

type Alert = {
  id: string
  type: "production" | "machine" | "safety" | "stock"
  severity: "high" | "medium" | "low"
  message: string
  time: string
  action: string
}

/* ===========================
   Component
   =========================== */

export default function ProductionDashboard() {
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<"overview" | "machines" | "shifts" | "analytics">("overview")
  const [showAlerts, setShowAlerts] = useState(true)
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null)

  // Mock data for demonstration
  const productionKPIs: ProductionKPI[] = [
    {
      id: "1",
      label: "Planlanan Üretim",
      value: 12500,
      unit: "ton",
      target: 12000,
      status: "above",
      change: 4.2,
      icon: <Target className="w-5 h-5" />,
      color: "from-emerald-500 to-green-500"
    },
    {
      id: "2",
      label: "Gerçekleşen Üretim",
      value: 11800,
      unit: "ton",
      target: 12000,
      status: "on-track",
      change: -1.7,
      icon: <Factory className="w-5 h-5" />,
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: "3",
      label: "Üretim Verimliliği",
      value: 94.5,
      unit: "%",
      target: 95,
      status: "on-track",
      icon: <Activity className="w-5 h-5" />,
      color: "from-purple-500 to-pink-500"
    },
    {
      id: "4",
      label: "Aktif Makine",
      value: 18,
      unit: "adet",
      target: 20,
      status: "below",
      icon: <Drill className="w-5 h-5" />,
      color: "from-amber-500 to-orange-500"
    },
    {
      id: "5",
      label: "Çalışan Vardiya",
      value: 3,
      unit: "vardiya",
      target: 3,
      status: "on-track",
      icon: <Users className="w-5 h-5" />,
      color: "from-indigo-500 to-violet-500"
    },
    {
      id: "6",
      label: "OEE",
      value: 82.3,
      unit: "%",
      target: 85,
      status: "below",
      change: -2.1,
      icon: <Zap className="w-5 h-5" />,
      color: "from-cyan-500 to-blue-500"
    }
  ]

  const productionFlow: ProductionStep[] = [
    {
      step: 1,
      name: "Kazı",
      planned: 3500,
      actual: 3450,
      efficiency: 98.6,
      bottleneck: false,
      delay: 0,
      color: "#3b82f6"
    },
    {
      step: 2,
      name: "Yükleme",
      planned: 3500,
      actual: 3400,
      efficiency: 97.1,
      bottleneck: false,
      delay: 15,
      color: "#8b5cf6"
    },
    {
      step: 3,
      name: "Taşıma",
      planned: 3500,
      actual: 3200,
      efficiency: 91.4,
      bottleneck: true,
      delay: 45,
      color: "#ef4444"
    },
    {
      step: 4,
      name: "Kırma/Eleme",
      planned: 3500,
      actual: 3300,
      efficiency: 94.3,
      bottleneck: false,
      delay: 25,
      color: "#10b981"
    },
    {
      step: 5,
      name: "Stok/Sevkiyat",
      planned: 3500,
      actual: 3400,
      efficiency: 97.1,
      bottleneck: false,
      delay: 10,
      color: "#f59e0b"
    }
  ]

  const machines: MachineStatus[] = [
    {
      id: "EX-101",
      name: "Ekskavatör 101",
      type: "excavator",
      status: "active",
      efficiency: 92,
      fuel: 78,
      hours: 156,
      lastMaintenance: "2024-03-15"
    },
    {
      id: "TR-205",
      name: "Kamyon 205",
      type: "truck",
      status: "maintenance",
      efficiency: 0,
      fuel: 15,
      hours: 245,
      lastMaintenance: "2024-03-10"
    },
    {
      id: "CR-301",
      name: "Kırıcı 301",
      type: "crusher",
      status: "active",
      efficiency: 88,
      fuel: 92,
      hours: 189,
      lastMaintenance: "2024-03-12"
    },
    {
      id: "LD-402",
      name: "Yükleyici 402",
      type: "loader",
      status: "idle",
      efficiency: 65,
      fuel: 45,
      hours: 201,
      lastMaintenance: "2024-03-08"
    },
    {
      id: "DR-501",
      name: "Delici 501",
      type: "drill",
      status: "active",
      efficiency: 95,
      fuel: 88,
      hours: 167,
      lastMaintenance: "2024-03-14"
    }
  ]

  const shiftPerformance: ShiftPerformance[] = [
    {
      shift: "A Vardiya (06-14)",
      operatorCount: 24,
      production: 4200,
      target: 4000,
      efficiency: 105,
      downtime: 1.2,
      incidents: 0
    },
    {
      shift: "B Vardiya (14-22)",
      operatorCount: 22,
      production: 3800,
      target: 4000,
      efficiency: 95,
      downtime: 2.5,
      incidents: 1
    },
    {
      shift: "C Vardiya (22-06)",
      operatorCount: 20,
      production: 3700,
      target: 4000,
      efficiency: 92.5,
      downtime: 3.1,
      incidents: 0
    }
  ]

  const downtimeReasons: DowntimeReason[] = [
    {
      reason: "Mekanik Arıza",
      hours: 48,
      percentage: 42,
      cost: 125000,
      color: "#ef4444"
    },
    {
      reason: "Elektrik Sorunu",
      hours: 24,
      percentage: 21,
      cost: 62500,
      color: "#f59e0b"
    },
    {
      reason: "Personel Eksikliği",
      hours: 18,
      percentage: 16,
      cost: 45000,
      color: "#8b5cf6"
    },
    {
      reason: "Hava Koşulları",
      hours: 12,
      percentage: 10.5,
      cost: 30000,
      color: "#06b6d4"
    },
    {
      reason: "Malzeme Bekleme",
      hours: 8,
      percentage: 7,
      cost: 20000,
      color: "#10b981"
    }
  ]

  const safetyMetrics: SafetyMetric = {
    daysWithoutAccident: 127,
    nearMisses: 3,
    trainingCompletion: 89,
    highRiskAreas: 2
  }

  const alerts: Alert[] = [
    {
      id: "1",
      type: "production",
      severity: "medium",
      message: "Taşıma bandı verimliliği %91.4 ile kritik seviyede",
      time: "10:30",
      action: "Bakım ekibini bilgilendir"
    },
    {
      id: "2",
      type: "machine",
      severity: "high",
      message: "TR-205 kamyonu 4 saatten fazla bakımda",
      time: "09:15",
      action: "Yedek ekipman devreye al"
    },
    {
      id: "3",
      type: "stock",
      severity: "low",
      message: "Stok doluluk oranı %85'i aştı",
      time: "08:45",
      action: "Sevkiyat planını güncelle"
    },
    {
      id: "4",
      type: "safety",
      severity: "medium",
      message: "B bölgesinde ramak kala bildirimi",
      time: "14:20",
      action: "İSG ekibi inceleme yapıyor"
    }
  ]

  const stockMetrics = {
    currentStock: 28500,
    dailyShipment: 3400,
    stockCapacity: 35000,
    pendingOrders: 3
  }

  const qualityMetrics = {
    oreGrade: 4.2,
    moisture: 2.8,
    screeningEfficiency: 96.5,
    returnRate: 1.2
  }

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000)
  }, [])

  const refreshData = () => {
    setLoading(true)
    setTimeout(() => {
      setLastRefresh(new Date())
      setLoading(false)
    }, 800)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      case "idle": return "bg-amber-500/20 text-amber-300 border-amber-500/30"
      case "maintenance": return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "broken": return "bg-red-500/20 text-red-300 border-red-500/30"
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="w-4 h-4" />
      case "idle": return <Clock className="w-4 h-4" />
      case "maintenance": return <Wrench className="w-4 h-4" />
      case "broken": return <AlertCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getMachineIcon = (type: string) => {
    switch (type) {
      case "excavator": return <Drill className="w-5 h-5" />
      case "truck": return <Truck className="w-5 h-5" />
      case "crusher": return <Factory className="w-5 h-5" />
      case "loader": return <HardHat className="w-5 h-5" />
      case "drill": return <Zap className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  const LoadingScreen = () => (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-full blur-3xl animate-pulse delay-300" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        <div className="relative">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-amber-500/30 rounded-full animate-spin" />
            <div className="absolute inset-4 border-4 border-yellow-500/40 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "3s" }} />
            <div className="absolute inset-8 border-4 border-orange-500/50 rounded-full animate-spin" style={{ animationDuration: "2s" }} />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <Factory className="w-16 h-16 text-amber-400 animate-pulse" />
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-xl opacity-30 animate-ping" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative text-center mt-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2 animate-pulse">
            Üretim Dashboard Yükleniyor
          </h2>
          <p className="text-white/60 mb-4">Maden verileri analiz ediliyor...</p>

          <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden mx-auto mb-4">
            <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 rounded-full animate-pulse" style={{ width: "85%" }} />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">18</div>
              <div className="text-xs text-white/60">Aktif Makine</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">11.8K</div>
              <div className="text-xs text-white/60">Ton Üretim</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">94.5%</div>
              <div className="text-xs text-white/60">Verimlilik</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const Sidebar = () => (
    <aside className="sticky top-0 lg:top-4 h-fit space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30">
          <Factory className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-white font-semibold">Üretim Dashboard</div>
          <div className="text-xs text-white/60">Maden Üretim Analizi</div>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { id: "overview", label: "Genel Bakış", icon: Activity, color: "from-amber-500 to-orange-500" },
          { id: "machines", label: "Makine Parkı", icon: Drill, color: "from-blue-500 to-cyan-500" },
          { id: "shifts", label: "Vardiya Analizi", icon: Users, color: "from-emerald-500 to-green-500" },
          { id: "analytics", label: "Detaylı Analiz", icon: BarChart3, color: "from-purple-500 to-pink-500" },
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

  const KPICard = ({ kpi }: { kpi: ProductionKPI }) => (
    <Card className={`bg-gradient-to-br ${kpi.color}/10 border-white/10 backdrop-blur-xl`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${kpi.color}/20`}>
              {kpi.icon}
            </div>
            <span className="text-sm text-white/80 font-medium">{kpi.label}</span>
          </div>
          <div className={`px-2 py-1 rounded text-xs ${
            kpi.status === "above" ? "bg-emerald-500/20 text-emerald-300" :
            kpi.status === "below" ? "bg-red-500/20 text-red-300" :
            "bg-blue-500/20 text-blue-300"
          }`}>
            {kpi.status === "above" ? "Hedef Üstü" : 
             kpi.status === "below" ? "Hedef Altı" : "Hedefte"}
          </div>
        </div>
        <div className="text-2xl font-bold text-white mt-2">
          {kpi.value.toLocaleString()} {kpi.unit}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-white/60">Hedef: {kpi.target.toLocaleString()} {kpi.unit}</div>
          {kpi.change && (
            <div className={`flex items-center gap-1 text-xs ${
              kpi.change >= 0 ? "text-emerald-400" : "text-red-400"
            }`}>
              {kpi.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(kpi.change)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const ProductionFlowChart = () => (
    <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-white/10 backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-blue-300" />
            <h3 className="text-lg font-semibold text-white">Üretim Akışı & Süreç Takibi</h3>
          </div>
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            Gerçek Zamanlı
          </Badge>
        </div>

        <div className="space-y-6">
          {productionFlow.map((step, index) => (
            <div key={step.step} className="relative">
              {index < productionFlow.length - 1 && (
                <div className="absolute left-6 top-14 h-8 w-0.5 bg-white/10" />
              )}
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                  step.bottleneck ? "bg-red-500/20 border border-red-500/30" : "bg-white/5 border border-white/10"
                }`}>
                  {step.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h4 className="text-white font-semibold">{step.name}</h4>
                      {step.bottleneck && (
                        <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Darboğaz
                        </Badge>
                      )}
                    </div>
                    <div className="text-emerald-400 font-semibold">{step.efficiency}%</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="space-y-1">
                      <div className="text-xs text-white/60">Planlanan</div>
                      <div className="text-white font-medium">{step.planned.toLocaleString()} ton</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-white/60">Gerçekleşen</div>
                      <div className="text-white font-medium">{step.actual.toLocaleString()} ton</div>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${step.efficiency}%`,
                        backgroundColor: step.color
                      }}
                    />
                  </div>

                  {step.delay > 0 && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-amber-300">
                      <Clock className="w-4 h-4" />
                      {step.delay} dakika gecikme
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const MachineStatusCard = ({ machine }: { machine: MachineStatus }) => (
    <Card className="bg-white/5 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              machine.status === "active" ? "bg-emerald-500/20" :
              machine.status === "maintenance" ? "bg-blue-500/20" :
              "bg-gray-500/20"
            }`}>
              {getMachineIcon(machine.type)}
            </div>
            <div>
              <div className="text-white font-semibold">{machine.name}</div>
              <div className="text-xs text-white/60">ID: {machine.id}</div>
            </div>
          </div>
          <Badge className={getStatusColor(machine.status)}>
            {getStatusIcon(machine.status)}
            <span className="ml-1 capitalize">{machine.status}</span>
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="text-xs text-white/60">Verimlilik</div>
            <div className={`font-semibold ${
              machine.efficiency >= 90 ? "text-emerald-400" :
              machine.efficiency >= 70 ? "text-amber-400" :
              "text-red-400"
            }`}>
              {machine.efficiency}%
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-white/60">Yakıt</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                  style={{ width: `${machine.fuel}%` }}
                />
              </div>
              <span className="text-white font-medium">{machine.fuel}%</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-white/60">Çalışma Saati</div>
            <div className="text-white font-medium">{machine.hours} saat</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-white/60">Son Bakım</div>
            <div className="text-white font-medium">{machine.lastMaintenance}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const DowntimeAnalysis = () => (
    <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-white/10 backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-300" />
            <h3 className="text-lg font-semibold text-white">Duruş & Kayıp Analizi</h3>
          </div>
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
            Toplam Kayıp: 110 saat
          </Badge>
        </div>

        <div className="space-y-4">
          {downtimeReasons.map((reason, index) => (
            <div key={reason.reason} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-white font-medium">{reason.reason}</div>
                <div className="text-right">
                  <div className="text-white font-semibold">{reason.hours} saat</div>
                  <div className="text-xs text-white/60">~{reason.cost.toLocaleString()} TL kayıp</div>
                </div>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${reason.percentage}%`,
                    backgroundColor: reason.color
                  }}
                />
              </div>
              <div className="text-xs text-white/60">{reason.percentage}% • Öncelik #{index + 1}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const SafetyMetricsCard = () => (
    <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-white/10 backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-300" />
            <h3 className="text-lg font-semibold text-white">Güvenlik & İSG</h3>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Aktif
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-3xl font-bold text-emerald-400">{safetyMetrics.daysWithoutAccident}</div>
            <div className="text-xs text-white/60 mt-1">Gündür Kazasız</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-3xl font-bold text-amber-400">{safetyMetrics.nearMisses}</div>
            <div className="text-xs text-white/60 mt-1">Ramak Kala</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-3xl font-bold text-blue-400">{safetyMetrics.trainingCompletion}%</div>
            <div className="text-xs text-white/60 mt-1">Eğitim Tamamlanma</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-3xl font-bold text-red-400">{safetyMetrics.highRiskAreas}</div>
            <div className="text-xs text-white/60 mt-1">Yüksek Riskli Alan</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const AlertsPanel = () => (
    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-white/10 backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-300" />
            <h3 className="text-lg font-semibold text-white">Alarm & Aksiyon Paneli</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAlerts(!showAlerts)}
            className="text-white/60 hover:text-white"
          >
            {showAlerts ? "Gizle" : "Göster"}
          </Button>
        </div>

        {showAlerts && (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div 
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.severity === "high" ? "bg-red-500/10 border-red-500/20" :
                  alert.severity === "medium" ? "bg-amber-500/10 border-amber-500/20" :
                  "bg-blue-500/10 border-blue-500/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.severity === "high" ? "bg-red-500" :
                        alert.severity === "medium" ? "bg-amber-500" :
                        "bg-blue-500"
                      }`} />
                      <span className="text-sm text-white font-medium">{alert.message}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-white/60">{alert.time}</div>
                      <div className="text-xs text-emerald-300 font-medium">{alert.action}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const StockMetricsCard = () => (
    <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-white/10 backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-300" />
            <h3 className="text-lg font-semibold text-white">Stok & Sevkiyat Durumu</h3>
          </div>
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
            {stockMetrics.pendingOrders} Bekleyen Sipariş
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/60">Mevcut Stok</div>
            <div className="text-xl font-bold text-white">{stockMetrics.currentStock.toLocaleString()} ton</div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                style={{ width: `${(stockMetrics.currentStock / stockMetrics.stockCapacity) * 100}%` }}
              />
            </div>
            <div className="text-xs text-white/60 mt-1">
              Kapasite: {stockMetrics.stockCapacity.toLocaleString()} ton
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/60">Günlük Sevkiyat</div>
            <div className="text-xl font-bold text-white">{stockMetrics.dailyShipment.toLocaleString()} ton</div>
            <div className="text-sm text-emerald-400 mt-1">+15% dünkü sevkiyata göre</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const QualityMetricsCard = () => (
    <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-white/10 backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-cyan-300" />
            <h3 className="text-lg font-semibold text-white">Kalite Göstergeleri</h3>
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
            Hedef Üstü
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-white/60">Cevher Tenörü</div>
            <div className="text-lg font-bold text-white">{qualityMetrics.oreGrade}%</div>
            <div className="text-xs text-emerald-400 mt-1">Hedef: 4.0%</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-white/60">Nem Oranı</div>
            <div className="text-lg font-bold text-white">{qualityMetrics.moisture}%</div>
            <div className="text-xs text-emerald-400 mt-1">Hedef: 3.0%</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-white/60">Elek Verimliliği</div>
            <div className="text-lg font-bold text-white">{qualityMetrics.screeningEfficiency}%</div>
            <div className="text-xs text-emerald-400 mt-1">Hedef: 95%</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-white/60">İade Oranı</div>
            <div className="text-lg font-bold text-white">{qualityMetrics.returnRate}%</div>
            <div className="text-xs text-red-400 mt-1">Hedef: 1.0%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900">
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-amber-950/80 to-orange-950/60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-full blur-3xl animate-spin-slow" />
        </div>
      </div>

      <div className="relative z-10">
        {/* Navigation Header */}
        <nav className="sticky top-0 z-40 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
                <div className="relative p-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 group-hover:from-amber-500/30 group-hover:to-orange-500/30">
                  <ChevronLeft className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Modüllere Dön</span>
              </Link>

              <div className="h-6 w-px bg-white/20" />

              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg blur opacity-30" />
                  <div className="relative p-2 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg">
                    <Factory className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Üretim Dashboard</h1>
                  <p className="text-sm text-white/60">Maden Üretim Yönetimi</p>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-white/80">
                  18 Aktif Makine
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <Target className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-white/80">
                  94.5% Verimlilik
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshData}
                disabled={loading}
                className="gap-2 text-white/60 hover:text-white border border-white/10 backdrop-blur-sm hover:bg-white/5"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="hidden md:inline">Yenile</span>
              </Button>

              <div className="text-xs text-white/40 hidden md:block">
                Son güncelleme: {lastRefresh.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-4">
            <Sidebar />

            <div className="space-y-6">
              {/* Dashboard Purpose Banner */}
              <Card className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-yellow-500/15 border border-amber-500/25 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-amber-300" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white">Maden Üretim Yönetim Dashboard</h2>
                      <p className="text-white/80 mt-1">
                        Üretim, ekipman ve saha performansını tek ekrandan izleyerek anlık ve doğru karar almak
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-white/60">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Hedef üstü</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>Risk</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span>Müdahale şart</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {productionKPIs.map(kpi => (
                      <KPICard key={kpi.id} kpi={kpi} />
                    ))}
                  </div>

                  {/* Production Flow */}
                  <ProductionFlowChart />

                  {/* Machine Status */}
                  <Card className="bg-gradient-to-br from-slate-900/70 to-slate-800/70 border-white/10 backdrop-blur-xl">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Drill className="w-5 h-5 text-white" />
                          <h3 className="text-lg font-semibold text-white">Makine & Ekipman Durumu</h3>
                        </div>
                        <Badge className="bg-white/10 text-white border-white/20">
                          {machines.filter(m => m.status === "active").length}/{machines.length} Aktif
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {machines.map(machine => (
                          <MachineStatusCard key={machine.id} machine={machine} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Alerts and Safety */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AlertsPanel />
                    <SafetyMetricsCard />
                  </div>

                  {/* Stock and Quality */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <StockMetricsCard />
                    <QualityMetricsCard />
                  </div>
                </div>
              )}

              {activeTab === "machines" && (
                <div className="space-y-6">
                  <DowntimeAnalysis />
                  
                  <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-white/10 backdrop-blur-xl">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-5 h-5 text-blue-300" />
                          <h3 className="text-lg font-semibold text-white">Makine Performans Detayları</h3>
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          OEE: 82.3%
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-xs text-white/60">Toplam Çalışma Süresi</div>
                            <div className="text-2xl font-bold text-white">1,058 saat</div>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-xs text-white/60">Toplam Duruş Süresi</div>
                            <div className="text-2xl font-bold text-white">110 saat</div>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-xs text-white/60">Ort. Yakıt Tüketimi</div>
                            <div className="text-2xl font-bold text-white">42 L/saat</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "shifts" && (
                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-white/10 backdrop-blur-xl">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-emerald-300" />
                          <h3 className="text-lg font-semibold text-white">Vardiya & Operatör Performansı</h3>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                          {shiftPerformance.length} Vardiya
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        {shiftPerformance.map(shift => (
                          <div key={shift.shift} className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="text-white font-semibold">{shift.shift}</div>
                                <div className="text-xs text-white/60">{shift.operatorCount} operatör</div>
                              </div>
                              <Badge className={`${
                                shift.efficiency >= 100 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                                shift.efficiency >= 90 ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                                "bg-red-500/20 text-red-300 border-red-500/30"
                              }`}>
                                Verimlilik: {shift.efficiency}%
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="text-xs text-white/60">Üretim</div>
                                <div className="text-white font-semibold">{shift.production.toLocaleString()} ton</div>
                                <div className="text-xs text-white/60">Hedef: {shift.target.toLocaleString()} ton</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs text-white/60">Duruş Süresi</div>
                                <div className="text-white font-semibold">{shift.downtime} saat</div>
                                <div className="text-xs text-white/60">Olay: {shift.incidents}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "analytics" && (
                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-white/10 backdrop-blur-xl">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-purple-300" />
                          <h3 className="text-lg font-semibold text-white">Detaylı Üretim Analizi</h3>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          Haftalık Rapor
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Haftalık Üretim Trendi</h4>
                          <div className="space-y-2">
                            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day, i) => (
                              <div key={day} className="flex items-center justify-between">
                                <div className="text-white/80">{day}</div>
                                <div className="flex items-center gap-3">
                                  <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                      style={{ width: `${60 + (i * 5)}%` }}
                                    />
                                  </div>
                                  <div className="text-white font-medium">{1800 + (i * 200)} ton</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Maliyet Dağılımı</h4>
                          <div className="space-y-3">
                            {[
                              { label: "Yakıt", value: 42, color: "#f59e0b" },
                              { label: "Bakım", value: 28, color: "#8b5cf6" },
                              { label: "Personel", value: 18, color: "#06b6d4" },
                              { label: "Enerji", value: 12, color: "#10b981" }
                            ].map(item => (
                              <div key={item.label} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="text-white/80">{item.label}</div>
                                  <div className="text-white font-medium">{item.value}%</div>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full"
                                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 border-t border-white/10 pt-6 pb-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left w-full">
                    <p className="text-sm text-white/40">© 2025 Maden Üretim Dashboard • Tüm Hakları Saklıdır</p>
                    <p className="text-xs text-white/30 mt-1">Veriler simüle edilmiştir • Demo amaçlıdır</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}