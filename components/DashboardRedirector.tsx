// components/DashboardRedirector.tsx
"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  BarChart3, ShoppingCart, Users, CreditCard, 
  Cpu, Zap, ChevronRight, Building, Shield,
  TrendingUp, FileText, Clock, CheckCircle,
  LogOut, Sparkles, Globe, Target, Rocket,
  Layers, Database, ShieldCheck, Cloud,
  ArrowRight, Star, Gem, Crown, Zap as Lightning,
  PieChart, LineChart, BarChart, Activity,
  Palette, Command, Terminal, Brain,
  Smartphone, Monitor, Tablet, Laptop,
  BadgeCheck, Award, Trophy, Medal,
  Infinity as InfinityIcon, Target as TargetIcon,
  AlertTriangle, Lock, Timer, RefreshCw
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const modules = [
  {
    id: 'finance',
    name: 'Finans & Muhasebe',
    icon: BarChart3,
    color: 'from-blue-600 via-cyan-500 to-indigo-600',
    bgColor: 'bg-gradient-to-br from-blue-50/80 via-cyan-50/60 to-indigo-50/40',
    borderColor: 'border-blue-200/50',
    glowColor: 'shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)]',
    description: 'Akıllı finans yönetimi ve gerçek zamanlı muhasebe',
    features: ['AI Destekli Analiz', 'Otomatik Raporlama', '3D Veri Görselleştirme'],
    path: '/dashboard/finance',
    badge: 'AI POWERED'
  },
  {
    id: 'purchase',
    name: 'Satın Alma',
    icon: ShoppingCart,
    color: 'from-emerald-600 via-green-500 to-teal-600',
    bgColor: 'bg-gradient-to-br from-emerald-50/80 via-green-50/60 to-teal-50/40',
    borderColor: 'border-emerald-200/50',
    glowColor: 'shadow-[0_0_50px_-12px_rgba(16,185,129,0.5)]',
    description: 'Tedarik zinciri optimizasyonu ve akıllı satın alma',
    features: ['Tedarikçi AI Analizi', 'Otomatik Fiyat Karşılaştırma', 'Stok Optimizasyonu'],
    path: '/dashboard/purchase',
    badge: 'SMART AI'
  },
  {
    id: 'hr',
    name: 'İnsan Kaynakları',
    icon: Users,
    color: 'from-violet-600 via-purple-500 to-fuchsia-600',
    bgColor: 'bg-gradient-to-br from-violet-50/80 via-purple-50/60 to-fuchsia-50/40',
    borderColor: 'border-violet-200/50',
    glowColor: 'shadow-[0_0_50px_-12px_rgba(139,92,246,0.5)]',
    description: 'Yapay zeka destekli personel yönetimi ve analitiği',
    features: ['AI Performans Analizi', 'Otomatik Bordro', 'Yetenek Yönetimi'],
    path: '/dashboard/hr',
    badge: 'AI HR'
  },
  {
    id: 'banking',
    name: 'Banka Ekstreleri',
    icon: CreditCard,
    color: 'from-amber-600 via-orange-500 to-red-600',
    bgColor: 'bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-red-50/40',
    borderColor: 'border-amber-200/50',
    glowColor: 'shadow-[0_0_50px_-12px_rgba(245,158,11,0.5)]',
    description: 'Çoklu banka entegrasyonu ve akıllı ödeme takibi',
    features: ['AI Fraud Tespiti', 'Otomatik Mutabakat', 'Akıllı Öngörüler'],
    path: '/dashboard/banking',
    badge: 'SECURE AI'
  }
]

export default function DashboardRedirector() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [recentModules, setRecentModules] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHoveringCard, setIsHoveringCard] = useState<string | null>(null)
  const [activeParticle, setActiveParticle] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Mobil kontrolü
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fare hareketini takip et
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Particle animasyonu
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveParticle(prev => (prev + 1) % 20)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Son kullanılan modülleri local storage'dan al
  useEffect(() => {
    const stored = localStorage.getItem('recentModules')
    if (stored) {
      try {
        setRecentModules(JSON.parse(stored))
      } catch (e) {
        console.error('Error parsing recent modules:', e)
      }
    }
  }, [])

  const handleModuleSelect = (moduleId: string, path: string) => {
    setSelectedModule(moduleId)
    
    // Son kullanılan modülleri güncelle
    const updatedRecent = [moduleId, ...recentModules.filter(id => id !== moduleId)].slice(0, 3)
    setRecentModules(updatedRecent)
    try {
      localStorage.setItem('recentModules', JSON.stringify(updatedRecent))
    } catch (e) {
      console.error('Error saving recent modules:', e)
    }
    
    // Yüksek kaliteli geçiş efekti
    setTimeout(() => {
      router.push(path)
    }, 800)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Seçili modül için icon component'ini bul
  const getSelectedModuleIcon = () => {
    if (!selectedModule) return null
    const foundModule = modules.find(m => m.id === selectedModule)
    return foundModule ? foundModule.icon : null
  }

  // Dinamik gradient hesaplama
  const calculateGradient = (index: number) => {
    const angle = (index * 90) + (mousePosition.x / window.innerWidth) * 180
    return `linear-gradient(${angle}deg, var(--tw-gradient-stops))`
  }

  return (
    <>
      {/* Global styles için inline CSS */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; box-shadow: 0 0 20px currentColor; }
          50% { opacity: 0.7; box-shadow: 0 0 40px currentColor; }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes slide-in-blurred {
          0% { transform: translateY(100px) scale(0.9); opacity: 0; filter: blur(10px); }
          100% { transform: translateY(0) scale(1); opacity: 1; filter: blur(0); }
        }
        
        @keyframes particle-float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { transform: translate(var(--tx, 100px), var(--ty, -100px)) rotate(180deg); }
        }
        
        @keyframes neon-pulse {
          0%, 100% { filter: drop-shadow(0 0 5px currentColor); }
          50% { filter: drop-shadow(0 0 20px currentColor); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
          background-size: 1000px 100%;
        }
        
        .animate-gradient-shift {
          animation: gradient-shift 3s ease infinite;
          background-size: 200% 200%;
        }
        
        .animate-slide-in-blurred {
          animation: slide-in-blurred 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        
        .animate-neon-pulse {
          animation: neon-pulse 1.5s ease-in-out infinite;
        }
        
        /* Glassmorphism efekti */
        .glass-effect {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .glass-effect-dark {
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #3b82f6, #8b5cf6, #10b981);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #2563eb, #7c3aed, #059669);
        }
        
        /* Selection color */
        ::selection {
          background: rgba(59, 130, 246, 0.3);
          color: white;
        }
        
        /* Smooth transitions */
        * {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
      
      {/* Arkaplan efekti - Dinamik partiküller */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Ana gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/80 to-cyan-950/60 animate-gradient-shift" />
        
        {/* Hareketli partiküller */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${Math.sin(Date.now() / 1000 + i) * 100 + 50}%`,
              top: `${Math.cos(Date.now() / 1000 + i) * 100 + 50}%`,
              background: `radial-gradient(circle, ${
                i % 4 === 0 ? '#3b82f6' : 
                i % 4 === 1 ? '#8b5cf6' : 
                i % 4 === 2 ? '#10b981' : '#f59e0b'
              }, transparent)`,
              animation: `particle-float ${3 + i * 0.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`,
              opacity: activeParticle === i ? 1 : 0.3,
              '--tx': `${Math.sin(i) * 200}px`,
              '--ty': `${Math.cos(i) * 200}px`,
            } as React.CSSProperties}
          />
        ))}
        
        {/* Orta efekti */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-3xl animate-spin-slow" />
          <div className="absolute inset-20 bg-gradient-to-r from-emerald-500/5 via-pink-500/5 to-amber-500/5 rounded-full blur-2xl animate-spin-slow" style={{ animationDirection: 'reverse' }} />
        </div>
      </div>

      {/* Ana içerik */}
      <div ref={containerRef} className="relative z-10 min-h-screen p-4 md:p-6 lg:p-8">
        {/* Üst navbar */}
        <nav className="glass-effect rounded-2xl p-4 md:p-6 mb-6 md:mb-8 animate-slide-in-blurred">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute -inset-3 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-2xl">
                  <Crown className="h-8 w-8 text-white" />
                  <div className="absolute -top-2 -right-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
                      <div className="relative p-1 bg-emerald-600 rounded-full">
                        <Rocket className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-4xl font-bold text-white">
                    H&R <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient-shift">Tomorrow</span>
                  </h1>
                  <BadgeCheck className="h-6 w-6 text-emerald-400 animate-pulse" />
                </div>
                <p className="text-sm md:text-base text-white/70 mt-1 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Enterprise AI Platform
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Platform indicator */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                {isMobile ? (
                  <>
                    <Smartphone className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-white">Mobile</span>
                  </>
                ) : (
                  <>
                    <Monitor className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-white">Desktop</span>
                  </>
                )}
              </div>
              
              {/* Stats badges */}
              <div className="hidden md:flex items-center gap-2">
                <div className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full border border-blue-500/30">
                  <div className="flex items-center gap-1.5">
                    <Database className="h-3 w-3 text-blue-400" />
                    <span className="text-xs text-white">4.2M+ Veri</span>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-full border border-emerald-500/30">
                  <div className="flex items-center gap-1.5">
                    <Brain className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs text-white">AI Active</span>
                  </div>
                </div>
              </div>
              
              {/* User info */}
              <div className="px-3 py-1.5 bg-white/10 rounded-full backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                    {user?.display?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <span className="text-xs text-white hidden sm:inline">{user?.display || 'Admin'}</span>
                </div>
              </div>
              
              {/* Logout button */}
              <Button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-600/20 to-rose-600/20 hover:from-red-600/30 hover:to-rose-600/30 text-white border border-red-500/30 hover:border-red-400/50 rounded-full px-4 py-2"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Çıkış</span>
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero section */}
        <div className="mb-8 md:mb-12 animate-slide-in-blurred" style={{ animationDelay: '0.1s' }}>
          <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 lg:p-10">
            {/* Arkaplan gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-cyan-600/10" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
            
            {/* İçerik */}
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full mb-4">
                    <Sparkles className="h-3 w-3 text-cyan-400" />
                    <span className="text-xs font-medium text-white">YENİ NESİL ENTERPRISE AI</span>
                  </div>
                  
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                    İşinizin{' '}
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient-shift">
                      Yapay Zeka Gücü
                    </span>
                    <br />
                    <span className="text-white/90">Tek Platformda Birleşti</span>
                  </h2>
                  
                  <p className="text-lg text-white/70 mb-6 max-w-2xl">
                    Dört güçlü modül, sınırsız özelleştirme ve gerçek zamanlı AI destekli analitik ile iş süreçlerinizi dönüştürün.
                  </p>
                  
                  {/* Quick stats */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <InfinityIcon className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">∞</div>
                        <div className="text-xs text-white/60">Ölçeklenebilirlik</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <TargetIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">99.99%</div>
                        <div className="text-xs text-white/60">Doğruluk</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Lightning className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">0.2ms</div>
                        <div className="text-xs text-white/60">Yanıt Süresi</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Hero visual */}
                <div className="relative">
                  <div className="relative w-64 h-64 md:w-80 md:h-80">
                    {/* Ana küre */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-full blur-2xl animate-spin-slow" />
                    
                    {/* Modül orbit noktaları */}
                    {modules.map((module, index) => {
                      const angle = (index / modules.length) * Math.PI * 2 + Date.now() / 5000
                      const radius = 120
                      const x = Math.cos(angle) * radius
                      const y = Math.sin(angle) * radius
                      
                      return (
                        <div
                          key={module.id}
                          className="absolute w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                            transform: 'translate(-50%, -50%)',
                            animationDelay: `${index * 0.2}s`,
                          }}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${module.color} rounded-2xl blur-md opacity-60`} />
                          <div className={`relative p-3 bg-gradient-to-br ${module.color} rounded-2xl shadow-lg`}>
                            <module.icon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      )
                    })}
                    
                    {/* Merkez */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-lg opacity-30 animate-pulse" />
                        <div className="relative p-4 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full shadow-2xl">
                          <Cpu className="h-10 w-10 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Modules Grid */}
        <div className="mb-12 md:mb-16 animate-slide-in-blurred" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">AI Destekli Modüller</h3>
              <p className="text-white/60">Her biri özel yapay zeka motoru ile güçlendirilmiş</p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-white">4 Premium Modül</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module, index) => {
              const IconComponent = module.icon
              const isHovered = isHoveringCard === module.id
              
              return (
                <div
                  key={module.id}
                  className="relative group"
                  onMouseEnter={() => setIsHoveringCard(module.id)}
                  onMouseLeave={() => setIsHoveringCard(null)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Hover efekti */}
                  {isHovered && (
                    <div className="absolute -inset-3 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-xl transition-opacity duration-500" />
                  )}
                  
                  <Card 
                    className={`relative overflow-hidden border-0 cursor-pointer transition-all duration-500 transform ${
                      isHovered 
                        ? `${module.glowColor} scale-[1.03] translate-y-[-8px]` 
                        : 'hover:scale-[1.02] hover:translate-y-[-4px]'
                    }`}
                    onClick={() => handleModuleSelect(module.id, module.path)}
                  >
                    {/* Arkaplan efekti */}
                    <div className={`absolute inset-0 ${module.bgColor} opacity-90`} />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-white/5 to-transparent rounded-full" />
                    
                    {/* Border gradient */}
                    <div className={`absolute inset-0 rounded-2xl p-[1.5px] ${isHovered ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${module.color} rounded-2xl`} />
                    </div>
                    
                    <CardContent className="relative p-6">
                      {/* Badge */}
                      <div className="absolute top-4 right-4">
                        <div className="px-2 py-1 bg-gradient-to-r from-black/20 to-black/10 rounded-full backdrop-blur-sm">
                          <span className="text-[10px] font-bold text-white/90">{module.badge}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col h-full">
                        {/* Icon */}
                        <div className="mb-6">
                          <div className="relative inline-block">
                            <div className={`absolute -inset-4 bg-gradient-to-br ${module.color} rounded-2xl blur-lg opacity-30 ${isHovered ? 'scale-125' : ''} transition-transform duration-500`} />
                            <div className={`relative p-4 bg-gradient-to-br ${module.color} rounded-2xl shadow-2xl transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`}>
                              <IconComponent className="h-8 w-8 text-white" />
                            </div>
                            {isHovered && (
                              <div className="absolute -top-1 -right-1">
                                <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 mb-6">
                          <h4 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-slate-900 transition-colors">
                            {module.name}
                          </h4>
                          <p className="text-sm text-slate-600 mb-4">
                            {module.description}
                          </p>
                          
                          {/* Features */}
                          <div className="space-y-2">
                            {module.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="p-1 bg-emerald-500/10 rounded-lg">
                                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                                </div>
                                <span className="text-xs text-slate-500">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Action button */}
                        <Button 
                          className={`w-full group/btn rounded-xl py-6 transition-all duration-500 ${
                            isHovered 
                              ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white' 
                              : 'bg-white/90 text-slate-800 hover:bg-white'
                          }`}
                        >
                          <span className="font-semibold">Modüle Git</span>
                          <ArrowRight className={`ml-2 h-4 w-4 transition-transform duration-500 ${
                            isHovered ? 'translate-x-2' : ''
                          }`} />
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                        </Button>
                      </div>
                    </CardContent>
                    
                    {/* Hover çizgisi */}
                    {isHovered && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50" />
                    )}
                  </Card>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Modules & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-slide-in-blurred" style={{ animationDelay: '0.3s' }}>
          {/* Recent Modules */}
          <div className="lg:col-span-2">
            <div className="glass-effect rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-white">Son Kullanılanlar</h4>
                <Clock className="h-5 w-5 text-cyan-400" />
              </div>
              
              {recentModules.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {recentModules.map((moduleId) => {
                    const module = modules.find(m => m.id === moduleId)
                    if (!module) return null
                    
                    return (
                      <button
                        key={moduleId}
                        onClick={() => handleModuleSelect(moduleId, module.path)}
                        className="group relative p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 bg-gradient-to-br ${module.color} rounded-lg`}>
                            <module.icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-white text-sm">{module.name}</div>
                            <div className="text-xs text-white/60">Tıklayarak aç</div>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-50 transition-opacity" />
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/60">Henüz modül kullanılmadı</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">Sistem Durumu</h4>
              <Activity className="h-5 w-5 text-emerald-400 animate-pulse" />
            </div>
            
            <div className="space-y-4">
              {[
                { label: 'AI Motoru', value: '%100', color: 'from-emerald-500 to-green-500', icon: Brain },
                { label: 'Veri Güvenliği', value: 'A++', color: 'from-blue-500 to-cyan-500', icon: ShieldCheck },
                { label: 'Sistem Uptime', value: '99.99%', color: 'from-purple-500 to-pink-500', icon: Cloud },
                { label: 'Performans', value: '0.2ms', color: 'from-amber-500 to-orange-500', icon: Lightning },
              ].map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-gradient-to-br ${stat.color} rounded-lg`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm text-white/80">{stat.label}</span>
                    </div>
                    <span className="text-lg font-bold text-white">{stat.value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Loading Animation */}
        {selectedModule && (() => {
          const SelectedIcon = getSelectedModuleIcon()
          const selectedModuleData = modules.find(m => m.id === selectedModule)
          
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Arkaplan overlay */}
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
              
              {/* Partikül efekti */}
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    background: `radial-gradient(circle, ${
                      selectedModuleData?.color.includes('blue') ? '#3b82f6' :
                      selectedModuleData?.color.includes('emerald') ? '#10b981' :
                      selectedModuleData?.color.includes('violet') ? '#8b5cf6' : '#f59e0b'
                    }, transparent)`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${3 + Math.random() * 2}s`,
                  }}
                />
              ))}
              
              {/* Ana loading card */}
              <div className="relative w-full max-w-2xl mx-4">
                {/* Outer glow */}
                <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 rounded-3xl blur-3xl animate-pulse" />
                
                <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-950/90 rounded-2xl border border-white/10 p-8 md:p-12 shadow-2xl backdrop-blur-xl">
                  <div className="flex flex-col items-center space-y-8">
                    {/* Icon container */}
                    <div className="relative">
                      {/* Orbital rings */}
                      <div className="absolute -ins-16">
                        <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full animate-spin-slow" />
                        <div className="absolute inset-8 border-2 border-purple-500/20 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }} />
                        <div className="absolute inset-16 border-2 border-cyan-500/20 rounded-full animate-spin-slow" />
                      </div>
                      
                      {/* Central icon */}
                      <div className="relative">
                        <div className="absolute -inset-8 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full blur-xl opacity-30 animate-pulse" />
                        <div className="relative p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl">
                          {SelectedIcon && (
                            <SelectedIcon className="h-16 w-16 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Text content */}
                    <div className="text-center space-y-4">
                      <h4 className="text-3xl md:text-4xl font-bold text-white">
                        {selectedModuleData?.name}
                      </h4>
                      <p className="text-xl text-white/70">
                        AI Motoru başlatılıyor...
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full max-w-md">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full animate-shimmer"
                          style={{ 
                            width: '100%',
                            backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-white/60">Yükleniyor</span>
                        <span className="text-sm text-white/60">%<span className="font-mono">98</span></span>
                      </div>
                    </div>
                    
                    {/* Loading spinner */}
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-white/10 rounded-full" />
                      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
                      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-r-purple-500 rounded-full animate-spin" style={{ animationDelay: '0.1s' }} />
                      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-b-cyan-500 rounded-full animate-spin" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </>
  )
}