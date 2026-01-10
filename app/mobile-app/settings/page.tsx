"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Rocket, Sparkles, Clock, ArrowLeft, Bell, Star, Zap, Code, Cpu, Layers, Shield,
  CheckCircle2, Circle, ChevronRight, Home, Calendar, User, FileText, Building,
  Award, Briefcase, TrendingUp, ShieldCheck, Settings, MessageSquare, BookOpen,
  PieChart, Heart, Coffee, Hammer, Wrench, Cog, Terminal, GitBranch, Database,
  Server, Wifi, Activity,
} from "lucide-react";

const pageInfo:  Record<string, { title: string; icon: any; color: string; gradient: string; description: string; features: string[] }> = {
  organization: {
    title: "Organizasyon",
    icon:  Building,
    color: "text-blue-400",
    gradient: "from-blue-500 to-cyan-500",
    description: "Şirket yapısını ve organizasyon şemasını görüntüleyin",
    features: ["Organizasyon Şeması", "Departman Yapısı", "Yönetici Hiyerarşisi", "Pozisyon Detayları"],
  },
  profile: {
    title: "Özlük Bilgileri",
    icon: User,
    color: "text-emerald-400",
    gradient:  "from-emerald-500 to-green-500",
    description: "Kişisel ve özlük bilgilerinizi yönetin",
    features:  ["Kişisel Bilgiler", "İletişim Bilgileri", "Acil Durum Kişileri", "Banka Bilgileri"],
  },
  documents: {
    title: "Özlük Evraklarım",
    icon: FileText,
    color: "text-amber-400",
    gradient: "from-amber-500 to-orange-500",
    description:  "Tüm özlük evraklarınıza tek yerden erişin",
    features:  ["Sözleşmeler", "Sertifikalar", "Kimlik Belgeleri", "Eğitim Belgeleri"],
  },
  requests: {
    title: "Taleplerim",
    icon: FileText,
    color: "text-pink-400",
    gradient: "from-pink-500 to-rose-500",
    description:  "Talep oluşturun ve takip edin",
    features:  ["İzin Talebi", "Avans Talebi", "Masraf Talebi", "Zimmet Talebi"],
  },
  trainings: {
    title: "Eğitimler",
    icon: BookOpen,
    color: "text-violet-400",
    gradient: "from-violet-500 to-purple-500",
    description:  "Eğitim programlarını takip edin",
    features:  ["Zorunlu Eğitimler", "Online Eğitimler", "Sertifika Programları", "Eğitim Geçmişi"],
  },
  assets: {
    title: "Zimmetlerim",
    icon: Briefcase,
    color: "text-cyan-400",
    gradient: "from-cyan-500 to-teal-500",
    description:  "Zimmetinizdeki varlıkları görüntüleyin",
    features: ["Bilgisayar & Ekipman", "Araç Zimmetleri", "Kart & Anahtar", "Zimmet Geçmişi"],
  },
  performance: {
    title: "Performans",
    icon: TrendingUp,
    color:  "text-orange-400",
    gradient: "from-orange-500 to-red-500",
    description:  "Performans değerlendirmelerinizi takip edin",
    features: ["Hedef Takibi", "360° Değerlendirme", "Yetkinlik Analizi", "Performans Geçmişi"],
  },
  "e-signature": {
    title: "Mobil İmza",
    icon: ShieldCheck,
    color: "text-red-400",
    gradient: "from-red-500 to-pink-500",
    description: "Belgeleri mobil imza ile onaylayın",
    features:  ["Belge İmzalama", "İmza Geçmişi", "Onay Bekleyenler", "İmza Doğrulama"],
  },
  settings: {
    title: "Ayarlar",
    icon: Settings,
    color: "text-slate-400",
    gradient: "from-slate-500 to-zinc-500",
    description: "Uygulama ayarlarınızı özelleştirin",
    features: ["Bildirim Ayarları", "Tema Seçimi", "Dil Ayarları", "Gizlilik"],
  },
  leaves: {
    title: "İzinlerim",
    icon: Calendar,
    color: "text-green-400",
    gradient: "from-green-500 to-emerald-500",
    description: "İzin haklarınızı ve taleplerizi yönetin",
    features:  ["İzin Bakiyesi", "İzin Talebi", "İzin Geçmişi", "İzin Takvimi"],
  },
};

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`,
          }}
        >
          <div className={`w-1 h-1 rounded-full ${i % 3 === 0 ? "bg-cyan-400/30" : i % 3 === 1 ? "bg-purple-400/30" : "bg-pink-400/30"}`} />
        </div>
      ))}
    </div>
  );
}

function SpinningRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative w-64 h-64">
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-spin-slow" />
        <div className="absolute inset-4 rounded-full border border-purple-500/20 animate-spin-slow" style={{ animationDirection: "reverse", animationDuration: "15s" }} />
        <div className="absolute inset-8 rounded-full border border-pink-500/20 animate-spin-slow" style={{ animationDuration: "20s" }} />
      </div>
    </div>
  );
}

function ProgressBar({ progress, gradient }: { progress: number; gradient: string }) {
  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000 ease-out relative`} style={{ width: `${progress}%` }}>
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
      </div>
    </div>
  );
}

function BuildSteps({ features, gradient }:  { features: string[]; gradient:  string }) {
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setActiveStep((prev) => (prev + 1) % features.length), 2000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="space-y-3">
      {features.map((feature, index) => (
        <div
          key={index}
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
            index < activeStep ? "bg-emerald-500/20 border border-emerald-500/30" : index === activeStep ? `bg-gradient-to-r ${gradient} bg-opacity-20 border border-white/20 scale-105` : "bg-white/5 border border-white/10"
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${index < activeStep ? "bg-emerald-500" : index === activeStep ? "bg-white/20 animate-pulse" : "bg-white/10"}`}>
            {index < activeStep ? <CheckCircle2 className="w-4 h-4 text-white" /> : index === activeStep ? <Cog className="w-4 h-4 text-white animate-spin" /> : <Circle className="w-4 h-4 text-white/50" />}
          </div>
          <span className={`text-sm font-medium transition-all duration-500 ${index < activeStep ? "text-emerald-300" : index === activeStep ? "text-white" : "text-white/50"}`}>{feature}</span>
          {index === activeStep && (
            <div className="ml-auto flex items-center gap-1">
              <span className="text-xs text-white/60">Geliştiriliyor</span>
              <div className="flex gap-1">
                <div className="w-1. 5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "0s" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CodeAnimation() {
  const [lines, setLines] = useState<string[]>([]);
  const codeLines = ["import { createModule } from '@hrtomorrow/core'", "const module = await initializeFeatures()", "await connectDatabase({ secure: true })", "module.enableRealTimeSync()", "await module.deployToProduction()", "console.log('✨ Module ready!')"];
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < codeLines.length) { setLines((prev) => [...prev, codeLines[index]]); index++; } 
      else { setLines([]); index = 0; }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900/80 rounded-xl p-4 font-mono text-xs border border-white/10 overflow-hidden">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-2 text-white/40">terminal</span>
      </div>
      <div className="space-y-1 min-h-[120px]">
        {lines. map((line, index) => (
          <div key={index} className="flex items-start gap-2 animate-fadeIn">
            <span className="text-emerald-400">→</span>
            <span className="text-cyan-300">{line}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">→</span>
          <span className="w-2 h-4 bg-white animate-blink" />
        </div>
      </div>
    </div>
  );
}

export default function ComingSoonPage() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const pageSlug = useMemo(() => {
    const parts = pathname.split("/");
    return parts[parts.length - 1] || "default";
  }, [pathname]);

  const currentPage = pageInfo[pageSlug] || {
    title: "Yeni Özellik",
    icon:  Rocket,
    color: "text-cyan-400",
    gradient: "from-cyan-500 to-blue-500",
    description: "Yeni özellikler geliştiriliyor",
    features: ["Tasarım", "Geliştirme", "Test", "Yayınlama"],
  };

  const PageIcon = currentPage.icon;

  useEffect(() => {
    const timer = setTimeout(() => setProgress(Math.floor(Math.random() * 30) + 45), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = () => {
    if (email) { setSubscribed(true); setTimeout(() => setSubscribed(false), 3000); setEmail(""); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950 text-white pb-32 pt-4 relative overflow-hidden">
      <FloatingParticles />
      <SpinningRings />
      <div className="absolute top-20 -left-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-40 -right-32 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 px-5">
        <Link href="/mobile-app" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all duration-300 mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Ana Sayfa</span>
        </Link>

        <div className="relative">
          <div className={`absolute inset-0 bg-gradient-to-r ${currentPage.gradient} rounded-3xl blur-2xl opacity-20`} />
          <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
            <div className={`bg-gradient-to-r ${currentPage. gradient} p-6 relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <PageIcon className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white">{currentPage.title}</h1>
                  <p className="text-white/80 text-sm mt-1">{currentPage.description}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full">
                  <Hammer className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span className="text-amber-300 font-bold text-sm">YAPIM AŞAMASINDA</span>
                  <Wrench className="w-4 h-4 text-amber-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Geliştirme İlerlemesi</span>
                  <span className={`font-bold bg-gradient-to-r ${currentPage. gradient} bg-clip-text text-transparent`}>%{progress}</span>
                </div>
                <ProgressBar progress={progress} gradient={currentPage.gradient} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white/60 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Gelecek Özellikler
                </h3>
                <BuildSteps features={currentPage.features} gradient={currentPage.gradient} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white/60 mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Canlı Geliştirme
                </h3>
                <CodeAnimation />
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-cyan-500/20 rounded-xl">
                    <Bell className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Hazır Olunca Haber Ver</h4>
                    <p className="text-xs text-white/50">Yayınlandığında bildirim alın</p>
                  </div>
                </div>
                {subscribed ? (
                  <div className="flex items-center justify-center gap-2 py-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-300 font-medium">Kaydınız alındı!</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="email" placeholder="E-posta adresiniz" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus: border-cyan-500/50 focus:ring-2 focus: ring-cyan-500/20 transition-all" />
                    <button onClick={handleSubscribe} className={`px-5 py-2.5 bg-gradient-to-r ${currentPage.gradient} rounded-xl font-bold text-sm text-white hover:scale-105 active:scale-95 transition-all shadow-lg`}>Kayıt</button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-white/40 text-xs">
                  <Coffee className="w-4 h-4" />
                  <span>Takımımız çalışıyor</span>
                </div>
                <div className="flex items-center gap-2 text-white/40 text-xs">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span>Sevgiyle yapılıyor</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-cyan-400" />
            Yakında Gelecek Diğer Özellikler
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(pageInfo).filter(([key]) => key !== pageSlug).slice(0, 6).map(([key, info]) => {
              const Icon = info.icon;
              return (
                <Link key={key} href={`/mobile-app/${key}`} className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 text-center">
                  <div className={`p-2 bg-gradient-to-r ${info.gradient} rounded-lg w-fit mx-auto mb-2`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-white/70">{info.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(180deg); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity:  0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .animate-float { animation: float 10s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        . animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
        .animate-blink { animation: blink 1s step-end infinite; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}