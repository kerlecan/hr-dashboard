"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Ban,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  Cpu,
  CreditCard,
  Eye,
  EyeOff,
  Factory,
  FileText,
  FileUp,
  Globe,
  GraduationCap,
  KeyRound,
  Laptop,
  Lock,
  LogIn,
  Monitor,
  Phone as PhoneIcon,
  QrCode,
  RefreshCw,
  Rocket,
  Send,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  User,
  Users,
  Wallet
} from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, getRemainingTime, failedAttempts, getRemainingAttempts } = useAuth()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [shake, setShake] = useState(false)
  const [activeModule, setActiveModule] = useState(0)
  const [userType, setUserType] = useState<"dashboard" | "mobile" | null>(null)
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const [remainingAttempts, setRemainingAttempts] = useState<number>(5)
  const [lastFailedAttempt, setLastFailedAttempt] = useState<number | null>(null)
  const [activePlatform, setActivePlatform] = useState<"enterprise" | "mobile">("enterprise")

  const formRef = useRef<HTMLFormElement>(null)
  const usernameInputRef = useRef<HTMLInputElement>(null)
  const mainContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        document.body.style.overflow = "hidden"
        document.body.style.height = "100vh"
      } else {
        document.body.style.overflow = "auto"
        document. body.style.height = "auto"
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
      document.body.style.overflow = "auto"
      document. body.style.height = "auto"
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePlatform((prev) => (prev === "enterprise" ? "mobile" :  "enterprise"))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (! isMobile) {
      const interval = setInterval(() => {
        setActiveModule((prev) => (prev + 1) % 5) // 4'ten 5'e güncellendi
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isMobile])

  useEffect(() => {
    if (username.toLowerCase().includes("web") || username.toLowerCase().includes("mobile") || username.toLowerCase().includes("personel")) {
      setUserType("mobile")
    } else if (username.toLowerCase().includes("dev") || username.toLowerCase().includes("admin") || username.toLowerCase().includes("yonetici")) {
      setUserType("dashboard")
    } else {
      setUserType(null)
    }
  }, [username])

  useEffect(() => {
    if (username. trim()) {
      const time = getRemainingTime(username)
      setRemainingTime(time)
      const attempts = getRemainingAttempts(username)
      setRemainingAttempts(attempts)
    } else {
      setRemainingTime(null)
      setRemainingAttempts(5)
      setError("")
    }
  }, [username, failedAttempts, getRemainingTime, getRemainingAttempts])

  const handleLogin = async (e:  React.FormEvent<HTMLFormElement>) => {
    e. preventDefault()
    e.stopPropagation()

    setError("")
    setSuccess("")
    setLastFailedAttempt(null)
    setLoading(true)

    if (! username.trim() || !password.trim()) {
      triggerShake()
      setError("Lütfen kullanıcı adı ve şifre giriniz.")
      setLoading(false)
      return
    }

    try {
      await login(username. trim(), password)
      setSuccess("✅ Başarıyla giriş yapıldı!  Yönlendiriliyorsunuz...")
    } catch (err:  any) {
      triggerShake()
      setLastFailedAttempt(Date.now())

      let errorMessage = err?. message || "Giriş yapılırken bir hata oluştu"
      if (errorMessage.toLowerCase().includes("şifre") || errorMessage.toLowerCase().includes("password")) {
        errorMessage = `🔐 Şifre hatalı! Kalan deneme hakkınız:  ${getRemainingAttempts(username. trim())}`
      }
      if (errorMessage.toLowerCase().includes("kullanıcı bulunamadı") || errorMessage.toLowerCase().includes("user")) {
        errorMessage = "❌ Kullanıcı bulunamadı!  Lütfen kullanıcı adınızı kontrol edin."
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (! remainingTime || remainingTime <= 0) return
    const interval = setInterval(() => {
      const newTime = getRemainingTime(username)
      if (newTime && newTime > 0) {
        setRemainingTime(newTime)
      } else {
        setRemainingTime(null)
        clearInterval(interval)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [remainingTime, username, getRemainingTime])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const enterpriseModules = [
    { name: "Finans & Muhasebe", shortName: "Finans", icon: BarChart3, color: "from-blue-600 to-cyan-600", features: ["Gerçek Zamanlı Muhasebe", "Otomatik Raporlama", "Vergi Takibi"] },
    { name: "Satın Alma", shortName: "Satın Alma", icon: ShoppingCart, color: "from-emerald-600 to-green-600", features:  ["Tedarikçi Yönetimi", "Sipariş Takibi", "Fiyat Analizi"] },
    { name: "İnsan Kaynakları", shortName:  "İK", icon: Users, color: "from-violet-600 to-purple-600", features: ["Personel Yönetimi", "Bordro Süreçleri", "Performans Takibi"] },
    { name: "Banka Ekstreleri", shortName:  "Banka", icon: CreditCard, color:  "from-amber-600 to-orange-600", features: ["Çoklu Banka Entegrasyonu", "Otomatik Mutabakat", "Ödeme Takibi"] },
    { name: "Üretim Yönetimi", shortName: "Üretim", icon: Factory, color: "from-rose-600 to-pink-600", features:  ["Gerçek Zamanlı İzleme", "OEE Analizi", "Vardiya Yönetimi"] }
  ]

  const mobileModules = [
    { name:  "PDKS", shortName: "PDKS", icon: QrCode, color:  "from-blue-500 to-cyan-500", features: ["QR Okutma", "Anlık Giriş/Çıkış", "Geçiş Kaydı"] },
    { name: "Bordro", shortName: "Bordro", icon:  Wallet, color: "from-emerald-500 to-green-500", features: ["Maaş Bildirimi", "Avans Talebi", "Kesinti Takibi"] },
    { name: "İzinler", shortName:  "İzinler", icon: Calendar, color: "from-violet-500 to-purple-500", features: ["İzin Talebi", "Onay Süreci", "İzin Bakiyesi"] },
    { name: "Vardiyalar", shortName:  "Vardiyalar", icon: Clock, color: "from-amber-500 to-orange-500", features: ["Vardiya Takvimi", "Değişim Talebi", "Nöbet Listesi"] },
    { name: "Üretim Takibi", shortName: "Üretim", icon: Factory, color: "from-rose-500 to-pink-500", features: ["Üretim Durumu", "Makine İzleme", "Performans"] }
  ]

  const modules = activePlatform === "enterprise" ? enterpriseModules : mobileModules

  const enterpriseFeatures = [
    { icon: BarChart3, title: "Birleşik Dashboard", desc: "Tüm departman verileri tek ekranda", color: "text-blue-400" },
    { icon: ShieldCheck, title: "Merkezi Güvenlik", desc:  "Tek noktadan güvenlik yönetimi", color: "text-emerald-400" },
    { icon:  TrendingUp, title: "Akıllı Analitik", desc: "Yapay zeka destekli raporlama", color: "text-violet-400" },
    { icon: Factory, title: "Üretim Kontrolü", desc: "Gerçek zamanlı üretim takibi", color:  "text-rose-400" },
    { icon: FileText, title: "Otomatik Süreçler", desc: "Zaman kazandıran otomasyonlar", color:  "text-cyan-400" }
  ]

  const mobileFeatures = [
    { icon: QrCode, title: "QR Kod Girişi", desc:  "Telefonunuzla hızlı giriş yapın", color: "text-blue-400" },
    { icon: Wallet, title: "Anlık Bordro", desc: "Maaş ve avans bilgileriniz anında", color: "text-emerald-400" },
    { icon: Calendar, title: "İzin Yönetimi", desc: "İzin talepleri ve onay süreçleri", color: "text-violet-400" },
    { icon: Factory, title: "Üretim Durumu", desc: "Anlık üretim ve makine takibi", color: "text-rose-400" },
    { icon: Clock, title: "Vardiya Takibi", desc: "Vardiyalarınızı takip edin", color: "text-amber-400" }
  ]

  const features = activePlatform === "enterprise" ? enterpriseFeatures : mobileFeatures

  return (
    <div
      ref={mainContainerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden"
      style={{
        height: isMobile ? "100dvh" : "auto",
        minHeight: isMobile ? "100dvh" : "100vh",
        overflow: isMobile ? "hidden" : "auto"
      }}
    >
      <div className="absolute inset-0">
        <div
          className={`absolute top-0 left-1/4 w-64 md:w-96 h-64 md:h-96 rounded-full blur-xl md:blur-3xl transition-all duration-1000 ${
            activePlatform === "enterprise" ? "bg-blue-600/10" : "bg-cyan-500/10"
          }`}
        />
        <div
          className={`absolute bottom-0 right-1/4 w-64 md: w-96 h-64 md: h-96 rounded-full blur-xl md:blur-3xl transition-all duration-1000 ${
            activePlatform === "enterprise" ? "bg-emerald-600/10" : "bg-emerald-500/10"
          }`}
        />
        <div
          className={`absolute top-1/4 right-1/4 w-48 md:w-64 h-48 md:h-64 rounded-full blur-xl md:blur-3xl transition-all duration-1000 ${
            activePlatform === "enterprise" ? "bg-violet-600/10" : "bg-violet-500/10"
          }`}
        />
        <div
          className={`absolute bottom-1/4 left-1/4 w-48 md:w-64 h-48 md:h-64 rounded-full blur-xl md:blur-3xl transition-all duration-1000 ${
            activePlatform === "enterprise" ? "bg-amber-600/10" : "bg-amber-500/10"
          }`}
        />
        {/* Üretim için yeni arkaplan efekti */}
        <div
          className={`absolute top-1/2 right-1/6 w-40 md:w-56 h-40 md:h-56 rounded-full blur-xl md:blur-3xl transition-all duration-1000 ${
            activePlatform === "enterprise" ? "bg-rose-600/10" : "bg-rose-500/10"
          }`}
        />
        <div
          className={`absolute top-1/3 left-1/6 animate-float-slow transition-all duration-1000 ${
            activePlatform === "enterprise" ? "text-blue-400/20" : "text-cyan-400/20"
          }`}
        >
          <Laptop className="h-16 w-16" />
        </div>
        <div
          className={`absolute bottom-1/3 right-1/6 animate-float transition-all duration-1000 ${
            activePlatform === "enterprise" ? "text-emerald-400/20" : "text-emerald-400/20"
          }`}
        >
          <PhoneIcon className="h-20 w-20" />
        </div>
        {/* Üretim ikonu arkaplan */}
        <div
          className={`absolute bottom-1/4 right-1/3 animate-float transition-all duration-1000 ${
            activePlatform === "enterprise" ? "text-rose-400/15" : "text-rose-400/15"
          }`}
        >
          <Factory className="h-14 w-14" />
        </div>
      </div>

      {/* Mobilde küçük CV butonu (yukarı kaydır yerine) */}
      {isMobile && (
        <button
          onClick={() => router.push("/cv-upload")}
          className="fixed top-4 right-4 z-30 px-3 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-[12px] text-white/90 flex items-center gap-1 shadow-lg shadow-purple-500/10 active:scale-95 transition-all duration-200"
        >
          <FileUp className="h-3. 5 w-3.5 text-rose-300" />
          <span>CV Yükle</span>
        </button>
      )}

      <div
        className="w-full max-w-7xl relative z-10"
        style={{
          height: isMobile ? "100%" : "auto",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Mobile Header */}
        {isMobile && (
          <div className="mb-6 flex-shrink-0">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-r from-blue-500 via-emerald-500 to-violet-500 rounded-2xl blur-lg opacity-30" />
                <div className="relative p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg">
                  <Globe className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  H&R <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">Enterprise & Mobile</span>
                </h1>
                <p className="text-indigo-200/70 text-xs">Dashboard + Personel Portal Tek Giriş</p>
              </div>
            </div>
          </div>
        )}

        <div className={`flex-1 ${isMobile ? "flex items-center justify-center" : "grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-start lg:items-center"}`}>
          {! isMobile && (
            <div className="hidden lg:block space-y-8">
              <div className="space-y-6">
                <button
                  onClick={() => router.push("/cv-upload")}
                  className="w-full p-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-pink-500/25 active:scale-[0.98] group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-xl group-hover:scale-110 transition-transform backdrop-blur-sm">
                        <FileUp className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-white">CV Yükle & Başvuru Yap</h3>
                        <p className="text-sm text-white/80">Hızlı ve kolay iş başvurusu</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Briefcase className="h-4 w-4 text-white" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <GraduationCap className="h-4 w-4 text-white" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Award className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:translate-x-1 transition-transform">
                        <Send className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                </button>

                <div className="relative">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-emerald-500 to-violet-500 rounded-2xl blur-xl opacity-30" />
                      <div
                        className={`relative p-4 rounded-xl shadow-2xl transition-all duration-500 ${
                          activePlatform === "enterprise" ? "bg-gradient-to-br from-blue-600 to-cyan-600" : "bg-gradient-to-br from-cyan-500 to-blue-500"
                        }`}
                      >
                        {activePlatform === "enterprise" ?  <Cpu className="h-10 w-10 text-white" /> : <PhoneIcon className="h-10 w-10 text-white" />}
                      </div>
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold text-white">
                        {activePlatform === "enterprise" ? (
                          <>
                            H&R <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">Enterprise Suite</span>
                          </>
                        ) : (
                          <>
                            H&R <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">Mobile Portal</span>
                          </>
                        )}
                      </h1>
                      <p className="text-indigo-200/80 mt-2 text-sm">
                        {activePlatform === "enterprise" ? "Tüm İş Süreçleriniz Tek Platformda" : "Personel İşlemleri Her Zaman Yanınızda"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={() => setActivePlatform("enterprise")}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                        activePlatform === "enterprise" ?  "bg-white/20 backdrop-blur-sm border border-white/30" : "bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <Monitor className="h-4 w-4" />
                      <span className="text-sm text-white">Enterprise</span>
                    </button>
                    <button
                      onClick={() => setActivePlatform("mobile")}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                        activePlatform === "mobile" ? "bg-white/20 backdrop-blur-sm border border-white/30" : "bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <Smartphone className="h-4 w-4" />
                      <span className="text-sm text-white">Mobile Portal</span>
                    </button>
                  </div>
                </div>

                {userType && (
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm animate-pulse ${
                      userType === "mobile" ? "border-cyan-500/30 bg-cyan-500/10" : "border-blue-500/30 bg-blue-500/10"
                    }`}
                  >
                    {userType === "mobile" ? (
                      <>
                        <Rocket className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm text-cyan-300 font-medium">H&R Mobile Portal</span>
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-blue-300 font-medium">Yönetici Dashboard</span>
                      </>
                    )}
                  </div>
                )}

                {/* Modül Grid - 5 modül için güncellendi */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {modules.map((module, index) => (
                    <div
                      key={index}
                      className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 cursor-pointer hover:scale-[1.02] group ${
                        activeModule === index ? `border-white/50 bg-gradient-to-br ${module.color}/20 shadow-lg` : "border-white/10 bg-white/5 hover:border-white/30"
                      }`}
                      onMouseEnter={() => setActiveModule(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${module.color} shadow-md group-hover:scale-110 transition-transform`}>
                          <module.icon className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-white text-sm">{module.name}</h3>
                      </div>
                      {activeModule === index && (
                        <div className="mt-3 space-y-1 animate-in fade-in slide-in-from-top-1 duration-300">
                          {module.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-white/70">
                              <Star className="h-2. 5 w-2.5 text-yellow-400" />
                              <span className="truncate">{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">{activePlatform === "enterprise" ? "Entegre Çözümlerimiz" : "Personel Portal Özellikleri"}</h2>
                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="group flex items-start gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200"
                    >
                      <div className={`p-1. 5 rounded-md bg-white/10 group-hover:bg-white/20 mt-0.5 ${feature.color}`}>
                        <feature.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white text-sm">{feature.title}</h3>
                        <p className="text-xs text-indigo-200/60 mt-0.5 truncate">{feature. desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className={`relative w-full ${isMobile ? "max-w-md mx-auto" : ""}`}>
            <div
              className={`relative transition-all duration-300 ${shake ? "animate-shake" : ""}`}
              onMouseEnter={() => !isMobile && setIsHovered(true)}
              onMouseLeave={() => !isMobile && setIsHovered(false)}
            >
              {! isMobile && <div className="hidden lg:block absolute -inset-3 bg-gradient-to-r from-blue-600 via-emerald-600 to-violet-600 rounded-2xl blur-lg opacity-20" />}

              <Card
                className={`relative bg-white/10 backdrop-blur-xl border-white/20 shadow-xl lg:shadow-2xl overflow-hidden transition-colors duration-300 ${
                  error ? "border-red-500/40" : success ? "border-emerald-500/40" : remainingTime ?  "border-orange-500/40" : ""
                }`}
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    error
                      ? "from-red-500 to-orange-500"
                      : success
                      ? "from-emerald-500 to-green-500"
                      : remainingTime
                      ? "from-orange-500 to-amber-500"
                      : "from-blue-500 via-emerald-500 to-violet-500"
                  }`}
                />

                <CardHeader className="p-5 md:p-7 pb-3 md:pb-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg md:text-xl text-white">{isMobile ? "Giriş Yap" : "H&R Kurumsal + Mobile Giriş"}</CardTitle>
                    <div className="hidden md:flex items-center gap-1">
                      <Monitor className="h-3 w-3 text-blue-400" />
                      <Smartphone className="h-3 w-3 text-emerald-400" />
                      <Factory className="h-3 w-3 text-rose-400" />
                      <ShieldCheck className="h-3 w-3 text-violet-400" />
                      <Sparkles
                        className={`h-4 w-4 ${
                          error ?  "text-red-400" : success ?  "text-emerald-400" : remainingTime ? "text-orange-300" : "text-cyan-300"
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-indigo-200/60 mt-1">
                    {userType === "mobile"
                      ? "Personel portalına erişmek için giriş yapın"
                      : userType === "dashboard"
                      ?  "Yönetici dashboarduna erişmek için giriş yapın"
                      :  "Platforma erişmek için giriş yapın"}
                  </p>

                  {remainingTime && (
                    <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-orange-400" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-orange-300">Hesap Geçici Olarak Bloke</p>
                          <p className="text-xs text-orange-400/70 mt-0.5">Lütfen {formatTime(remainingTime)} dakika bekleyin</p>
                        </div>
                        <Timer className="h-4 w-4 text-orange-400 animate-pulse" />
                      </div>
                    </div>
                  )}

                  {! remainingTime && remainingAttempts < 5 && (
                    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-amber-300">Güvenlik Uyarısı</p>
                          <p className="text-xs text-amber-400/70 mt-0.5">Kalan deneme hakkınız:  {remainingAttempts}</p>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-1. 5 h-1.5 rounded-full ${i < remainingAttempts ? "bg-emerald-500" :  "bg-amber-500/30"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-emerald-300">Giriş Başarılı</p>
                          <p className="text-xs text-emerald-400/70 mt-0.5">{success}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-5 md:p-7 pt-0">
                  <form ref={formRef} onSubmit={handleLogin} className="space-y-4 md:space-y-5">
                    <div className="space-y-1. 5">
                      <label className="text-xs md:text-sm font-medium text-white/90 flex items-center gap-1.5">
                        <User
                          className={`h-3 w-3 md:h-3. 5 md:w-3.5 ${
                            error ? "text-red-400" : success ? "text-emerald-400" : remainingTime ? "text-orange-400" : "text-blue-300"
                          }`}
                        />
                        <span>Kullanıcı Adınız</span>
                      </label>
                      <div className="relative">
                        <Input
                          ref={usernameInputRef}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Kullanıcı adınızı giriniz"
                          className={`pl-9 bg-white/5 border-white/20 text-white placeholder: text-white/40 focus:ring-1 transition-all text-sm h-9 md:h-10
                            ${
                              error
                                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                                :  success
                                ?  "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                                : remainingTime
                                ? "border-orange-500/50 focus:border-orange-500 focus: ring-orange-500/20"
                                : "focus:border-blue-400 focus:ring-blue-400/20"
                            }`}
                          disabled={loading || !!remainingTime || !!success}
                          autoComplete="username"
                        />
                        <User
                          className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-3. 5 w-3.5 ${
                            remainingTime ? "text-orange-400/60" : success ? "text-emerald-400/60" : "text-blue-400/60"
                          }`}
                        />
                        {remainingTime && <Ban className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-orange-400/60" />}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-medium text-white/90 flex items-center gap-1.5">
                        <Lock
                          className={`h-3 w-3 md: h-3.5 md:w-3.5 ${
                            error ?  "text-red-400" : success ?  "text-emerald-400" : remainingTime ? "text-orange-400" : "text-blue-300"
                          }`}
                        />
                        <span>Şifre</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e. target.value)}
                          placeholder="••••••••"
                          className={`pl-9 pr-9 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:ring-1 transition-all text-sm h-9 md: h-10
                            ${
                              error
                                ?  "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                                : success
                                ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                                :  remainingTime
                                ? "border-orange-500/50 focus:border-orange-500 focus:ring-orange-500/20"
                                : "focus:border-blue-400 focus:ring-blue-400/20"
                            }`}
                          disabled={loading || !!remainingTime || !!success}
                          autoComplete="current-password"
                        />
                        <Lock
                          className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${
                            remainingTime ? "text-orange-400/60" : success ?  "text-emerald-400/60" : "text-blue-400/60"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                          disabled={loading || !!remainingTime || !!success}
                        >
                          {showPassword ?  <EyeOff className="h-3. 5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div
                        className={`flex items-start gap-2 px-3 py-2 rounded-lg animate-in fade-in slide-in-from-top-1 text-xs ${
                          error. toLowerCase().includes("bloke")
                            ? "bg-orange-500/10 border border-orange-500/20 text-orange-200"
                            :  error.toLowerCase().includes("şifre")
                            ? "bg-red-500/10 border border-red-500/20 text-red-200"
                            : error.toLowerCase().includes("kullanıcı")
                            ? "bg-red-500/10 border border-red-500/20 text-red-200"
                            : "bg-red-500/10 border border-red-500/20 text-red-200"
                        }`}
                      >
                        {error. toLowerCase().includes("bloke") ? (
                          <Lock className="h-3. 5 w-3.5 flex-shrink-0 mt-0.5 text-orange-400" />
                        ) : error.toLowerCase().includes("şifre") ? (
                          <KeyRound className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-red-400" />
                        ) : error.toLowerCase().includes("kullanıcı") ? (
                          <User className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-red-400" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-red-400" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">
                            {error. toLowerCase().includes("şifre")
                              ? "🔐 Şifre Hatalı"
                              : error.toLowerCase().includes("kullanıcı")
                              ?  "👤 Kullanıcı Bulunamadı"
                              : "⚠️ Hata"}
                          </p>
                          <p className="mt-0.5 opacity-90">{error}</p>

                          {error.toLowerCase().includes("şifre") && (
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 text-amber-400" />
                                <span className="text-[10px]">Kalan hak:  {remainingAttempts}/5</span>
                              </div>
                              <div className="flex gap-0.5">
                                {[...Array(remainingAttempts)].map((_, i) => (
                                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                ))}
                                {[...Array(5 - remainingAttempts)].map((_, i) => (
                                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                ))}
                              </div>
                            </div>
                          )}

                          {error.toLowerCase().includes("kullanıcı") && (
                            <div className="mt-2 text-[10px] text-red-300/70">Lütfen kullanıcı adınızı kontrol edin veya sistem yöneticinize başvurun. </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading || !!remainingTime || !!success}
                      className={`w-full text-white font-semibold py-4 relative group overflow-hidden transition-all duration-300 hover:shadow-lg text-sm h-10 md:h-11
                        ${
                          remainingTime
                            ? "bg-gradient-to-r from-orange-600 to-amber-600 cursor-not-allowed opacity-50"
                            : success
                            ? "bg-gradient-to-r from-emerald-600 to-green-600 cursor-not-allowed"
                            : error
                            ? "bg-gradient-to-r from-red-600 to-orange-600 hover:shadow-red-500/25"
                            : "bg-gradient-to-r from-blue-600 to-cyan-600 hover: shadow-cyan-500/25 hover:scale-[1.02]"
                        }`}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <div className="h-3. 5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Giriş Yapılıyor...</span>
                          </>
                        ) : remainingTime ? (
                          <>
                            <Timer className="h-4 w-4" />
                            <span>Hesap Bloke ({formatTime(remainingTime)})</span>
                          </>
                        ) : success ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            <span>Giriş Başarılı</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="h-4 w-4" />
                            <span>Giriş Yap</span>
                          </>
                        )}
                      </span>
                    </Button>

                    {! remainingTime && remainingAttempts < 5 && ! success && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3 text-amber-400" />
                            <span>Kalan Deneme Hakkı:  </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-white/5 px-2 py-1 rounded">{remainingAttempts}/5</span>
                            <div className="flex gap-0.5">
                              {[... Array(remainingAttempts)].map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              ))}
                              {[...Array(5 - remainingAttempts)].map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 bg-amber-500/30 rounded-full" />
                              ))}
                            </div>
                          </div>
                        </div>
                        {lastFailedAttempt && (
                          <p className="text-[10px] text-white/40 mt-1 text-center">
                            Son hatalı giriş:  {new Date(lastFailedAttempt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                    )}

                    {remainingTime && (
                      <div className="pt-2">
                        <div className="text-center">
                          <p className="text-xs text-white/60">Hesap güvenliğiniz için geçici olarak bloke edilmiştir. </p>
                          <div className="flex items-center justify-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                              <span className="text-xs text-orange-400">{formatTime(remainingTime)}</span>
                            </div>
                            <span className="text-xs text-white/40">•</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newTime = getRemainingTime(username)
                                setRemainingTime(newTime)
                              }}
                              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Yenile
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mobil modüller - 5 modül için güncellendi */}
                    {isMobile && (
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-xs text-white/50 mb-2 text-center">Modüller:  </p>
                        <div className="flex justify-center gap-2 flex-wrap">
                          {modules.map((module, index) => (
                            <div key={index} className="flex flex-col items-center" onClick={() => setActiveModule(index)}>
                              <div className={`p-2 rounded-lg ${activeModule === index ? `bg-gradient-to-br ${module. color}` : "bg-white/10"}`}>
                                <module.icon className="h-4 w-4 text-white" />
                              </div>
                              <span className="text-[10px] text-white/70 mt-1 text-center leading-tight max-w-[50px]">{module.shortName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-center pt-2">
                      <p className="text-xs text-white/50">
                        {userType === "mobile"
                          ? "📱 H&R Mobile Portal'a yönlendirileceksiniz"
                          : userType === "dashboard"
                          ? "💼 Yönetici dashboard'una yönlendirileceksiniz"
                          : "👉 Kullanıcı tipinize göre platforma yönlendirileceksiniz"}
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="mt-6 md:mt-10 text-center flex-shrink-0">
          <div className="hidden lg:flex items-center justify-center gap-1. 5 mb-3">
            {modules.map((module, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeModule === index ? `bg-gradient-to-r ${module.color} w-4` : "bg-white/20"}`}
              />
            ))}
          </div>
          <p className="text-xs text-white/40">© {new Date().getFullYear()} H&R Enterprise Suite & Mobile Portal v3.2. 0</p>
          <div className="inline-flex items-center gap-3 mt-1 text-[10px] text-white/30 flex-wrap justify-center">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="hidden sm:inline">Tüm Sistemler Aktif</span>
              <span className="sm:hidden">Aktif</span>
            </span>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span>Enterprise:  Online</span>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span>Mobile: Online</span>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Üretim</span>
            </span>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              <span>CV Upload</span>
            </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-6px);
          }
          50% {
            transform: translateX(6px);
          }
          75% {
            transform: translateX(-6px);
          }
        }
        .animate-shake {
          animation:  shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        @keyframes float {
          0%,
          100% {
            transform:  translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes float-slow {
          0%,
          100% {
            transform:  translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        . animate-float-slow {
          animation:  float-slow 4s ease-in-out infinite;
        }

        /* Mobile-specific styles */
        @media (max-width: 768px) {
          body {
            overflow:  hidden ! important;
            height: 100vh !important;
            position: fixed !important;
            width: 100% ! important;
          }

          : :-webkit-scrollbar {
            display: none;
          }

          input,
          button {
            font-size: 16px !important;
            -webkit-appearance: none;
          }

          /* Prevent text selection */
          * {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
          }

          /* Allow text selection in inputs */
          input,
          textarea {
            -webkit-user-select: text;
            user-select: text;
          }
        }

        @media (max-width: 640px) {
          .min-h-screen {
            min-height: -webkit-fill-available ! important;
            min-height: 100dvh !important;
          }
        }
      `}</style>
    </div>
  )
}