// app/mobile-app/page.tsx - WOW EFFECT ANA SAYFA
"use client"

import { useAuth } from '@/contexts/AuthContext'
import { 
  Calendar, Clock, CreditCard, QrCode, 
  FileText, User, Bell, TrendingUp,
  CheckCircle, AlertCircle, ChevronRight,
  Shield, Award, Target, Users,
  BarChart, DollarSign, CalendarDays,
  Clock as TimeIcon, CheckSquare,
  ArrowUpRight, ArrowDownRight,
  Zap, Trophy, Sparkles,
  MessageSquare, BookOpen, Building,
  Briefcase, ShieldCheck, Search,
  Download, Eye, EyeOff,
  Star, Crown, Plus,
  ChevronDown, Filter,
  PieChart, Activity, Wallet,
  ClipboardList, Mail, MapPin,
  Phone, Camera, Mic,
  Volume2, Home, Settings as SettingsIcon,
  HelpCircle, ExternalLink,
  ArrowRight, Check, Lock,
  MoreVertical, Globe,
  Target as TargetIcon, Cpu,
  BarChart as BarChartIcon,
  CreditCard as CardIcon,
  FileCheck, Users as UsersIcon,
  Building as BuildingIcon,
  MessageSquare as MessageSquareIcon,
  BookOpen as BookOpenIcon,
  Briefcase as BriefcaseIcon,
  TrendingUp as TrendingUpIcon,
  Rocket, Sun, Moon,
  Smartphone as SmartphoneIcon,
  Monitor, Zap as ZapIcon,
  Shield as ShieldIcon
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function MobileAppPage() {
  const { user } = useAuth()
  // Varsayılan: dark
  const [darkMode, setDarkMode] = useState(true)
  const [balanceVisible, setBalanceVisible] = useState(false)
  const [activeModule, setActiveModule] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Tercih yoksa varsayılan dark
    const stored = localStorage.getItem('darkMode')
    const isDark = stored === 'true' || (stored === null && true)
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // Loading simülasyonu
    const timer = setTimeout(() => setIsLoading(false), 800)
    
    // Active module rotasyonu
    const moduleInterval = setInterval(() => {
      setActiveModule(prev => (prev + 1) % 4)
    }, 5000)

    return () => {
      clearTimeout(timer)
      clearInterval(moduleInterval)
    }
  }, [])

  // 12 modül - istenilen sıralama
  const allModules = [
    { title: 'PDKS', icon: QrCode, color: 'text-blue-500', path: '/mobile-app/attendance' },
    { title: 'Vardiyalar', icon: TimeIcon, color: 'text-blue-400', path: '/mobile-app/shifts' },
    { title: 'Organizasyon', icon: BuildingIcon, color: 'text-blue-500', path: '/mobile-app/organization' },
    { title: 'Özlük Bilgileri', icon: User, color: 'text-emerald-400', path: '/mobile-app/profile' },
    { title: 'Özlük Evraklarım', icon: FileCheck, color: 'text-amber-400', path: '/mobile-app/documents' },
    { title: 'Talep Oluştur', icon: FileText, color: 'text-pink-500', path: '/mobile-app/requests' },
    { title: 'Eğitim', icon: BookOpenIcon, color: 'text-amber-500', path: '/mobile-app/trainings' },
    { title: 'Anket', icon: MessageSquareIcon, color: 'text-violet-500', path: '/mobile-app/surveys' },
    { title: 'Zimmet', icon: BriefcaseIcon, color: 'text-pink-500', path: '/mobile-app/assets' },
    { title: 'Performans', icon: TrendingUpIcon, color: 'text-cyan-500', path: '/mobile-app/performance' },
    { title: 'Mobil İmza', icon: ShieldCheck, color: 'text-red-500', path: '/mobile-app/e-signature' },
    { title: 'Ayarlar', icon: SettingsIcon, color: 'text-violet-400', path: '/mobile-app/settings' },
  ]

  // Öne çıkanlar - sadece renkli kartlar, veri yok
  const featuredModules = [
    { 
      title: 'PDKS', 
      icon: QrCode, 
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      glow: '0 0 40px rgba(59, 130, 246, 0.3)',
      path: '/mobile-app/attendance',
    },
    { 
      title: 'Bordro', 
      icon: Wallet, 
      gradient: 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)',
      glow: '0 0 40px rgba(16, 185, 129, 0.3)',
      path: '/mobile-app/payroll',
    },
    { 
      title: 'İzinler', 
      icon: Calendar, 
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
      glow: '0 0 40px rgba(245, 158, 11, 0.3)',
      path: '/mobile-app/leaves',
    },
    { 
      title: 'Talepler', 
      icon: FileText, 
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      glow: '0 0 40px rgba(139, 92, 246, 0.3)',
      path: '/mobile-app/requests',
    },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 overflow-hidden">
        <div className="text-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
              <Globe className="h-12 w-12 text-white animate-pulse" />
            </div>
            <div className="text-white text-xl font-bold animate-pulse">
              HRTomorrow
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen w-full overflow-x-hidden transition-all duration-500 ${
      darkMode 
        ? 'bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950' 
        : 'bg-gradient-to-b from-slate-800 via-blue-900/30 to-slate-800'
    }`}>
      {/* Boşluk için padding arttırıldı */}
      <div className="pt-2 pb-4">
        {/* Tüm Modüller - Üstte (12 adet) */}
        <div className="px-5 pb-4">
          <div className="grid grid-cols-2 gap-3.5">
            {allModules.map((module, index) => (
              <Link
                href={module.path}
                key={index}
                className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 hover:scale-103 active:scale-97 ${
                  darkMode 
                    ? 'bg-white/8 hover:bg-white/12 border border-white/10' 
                    : 'bg-white/6 hover:bg-white/10 border border-white/10'
                } shadow-md`}
              >
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/10' : 'bg-white/10'} shadow-sm`}>
                  <module.icon className={`h-5 w-5 ${module.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-white'}`}>
                    {module.title}
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 ${darkMode ? 'text-slate-500' : 'text-slate-300'}`} />
              </Link>
            ))}
          </div>
        </div>

        {/* Öne Çıkanlar - Altta (sadece renkli kartlar) */}
        <div className="px-5 pt-4 pb-6">
          <div className="mb-5">
            <h2 className={`text-xl font-bold text-white mb-1`}>
              Öne Çıkanlar
            </h2>
            <p className={`text-sm text-slate-300`}>
              En çok kullandığınız modüller
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {featuredModules.map((module, index) => (
              <Link
                href={module.path}
                key={index}
                className={`relative overflow-hidden rounded-2xl transition-all duration-450 hover:scale-103 active:scale-97 ${
                  activeModule === index ? 'scale-103 shadow-2xl' : 'shadow-xl'
                }`}
                style={{ 
                  background: module.gradient,
                  boxShadow: `${module.glow}`,
                  transform: activeModule === index ? 'translateY(-5px)' : 'none'
                }}
                onMouseEnter={() => setActiveModule(index)}
              >
                <div className="p-4.5">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-xl ${darkMode ? 'bg-white/20' : 'bg-white/30'} backdrop-blur-sm`}>
                      <module.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{module.title}</h3>
                  <div className="flex items-center justify-end">
                    <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* Minimal grid icon */
function GridIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  )
}