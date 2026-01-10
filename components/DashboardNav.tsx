"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, BarChart3, ShoppingCart, Users, CreditCard, 
  Settings, LogOut, Menu, X, 
  Crown, Rocket, ShieldCheck, 
  ChevronRight
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { name: 'Ana Sayfa', icon: Home, path: '/dashboard', color: 'blue' },
  { name: 'Finans', icon: BarChart3, path: '/dashboard/finance', color: 'emerald' },
  { name: 'Satın Alma', icon: ShoppingCart, path: '/dashboard/purchase', color: 'amber' },
  { name: 'İK', icon: Users, path: '/dashboard/hr', color: 'purple' },
  { name: 'Banka', icon: CreditCard, path: '/dashboard/banking', color: 'cyan' },
]

export default function DashboardNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      {/* 1. MOBIL TOP BAR - Şık ve Ferah Hali (Geri Döndü) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[110] px-6 h-20 flex items-center justify-between bg-slate-900/90 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20">
             <Crown className="h-5 w-5 text-white" />
           </div>
           <div className="flex flex-col">
             <span className="font-bold text-white tracking-tight text-lg leading-none">
               H&R <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Tomorrow</span>
             </span>
             <span className="text-[10px] text-slate-500 font-mono mt-1.5 uppercase tracking-[0.2em] font-medium">Enterprise AI</span>
           </div>
        </div>
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-2xl bg-white/5 border border-white/10 active:scale-90 transition-all shadow-inner"
        >
          {isOpen ? <X className="text-white h-6 w-6" /> : <Menu className="text-white h-6 w-6" />}
        </button>
      </div>

      {/* 2. OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* 3. SIDEBAR (İçerik) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[130] w-[85vw] sm:w-[320px] lg:w-72 xl:w-80
        bg-slate-900 border-r border-white/10
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col shadow-2xl
      `}>
        
        {/* LOGO SECTION */}
        <div className="p-8 mt-4 lg:mt-0">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-20 transition duration-1000"></div>
            <div className="relative flex items-center gap-3 bg-slate-800/40 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shrink-0">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-black tracking-wider text-base truncate uppercase">H&R Tomorrow</h1>
                <span className="text-[9px] text-emerald-500 font-medium uppercase tracking-tighter">System Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* USER PROFILE - Türkçe Karakter Fix Korundu */}
        <div className="px-6 mb-6">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-xl uppercase">
                {user?.username?.[0]?.toLocaleUpperCase('tr-TR') || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-white truncate leading-tight">
                  {user?.display || 'Administrator'}
                </p>
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest truncate mt-0.5">
                  {user?.role || 'Full Access'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/40 p-2 rounded-lg border border-white/5 text-center">
                <p className="text-[7px] text-slate-500 uppercase font-bold tracking-tighter">Latency</p>
                <p className="text-xs font-mono text-emerald-400 font-bold">24ms</p>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-white/5 text-center">
                <p className="text-[7px] text-slate-500 uppercase font-bold tracking-tighter">Uptime</p>
                <p className="text-xs font-mono text-blue-400 font-bold">99.9%</p>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-blue-600/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={`p-2 rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold tracking-wide">{item.name}</span>
                {isActive && <motion.div layoutId="activeHighlight" className="absolute left-0 w-1.5 h-6 bg-blue-500 rounded-full" />}
              </Link>
            )
          })}
        </nav>

        {/* FOOTER */}
        <div className="p-6 mt-auto border-t border-white/10 bg-slate-950/50">
          <button onClick={logout} className="w-full flex items-center justify-center gap-3 px-3 py-3 rounded-xl text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-all border border-red-500/10">
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-bold">Oturumu Kapat</span>
          </button>
        </div>
      </aside>

      {/* 4. KRİTİK ÇÖZÜM: SAYFAYI AŞAĞIYA İTEN BOŞLUK */}
      {/* h-24 ekleyerek sayfa içeriğinin bu şık header'ın altından başlamasını sağladık */}
      <div className="h-24 lg:hidden" /> 
      <div className="hidden lg:block lg:pl-72 xl:pl-80 transition-all" />
    </>
  )
}