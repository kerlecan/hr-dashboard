// components/MobileMenu.tsx
"use client"

import { useState } from 'react'
import { 
  Menu, X, BarChart3, ShoppingCart, Users, CreditCard,
  Home, Settings, HelpCircle, Bell, LogOut,
  ChevronRight, Sparkles, Zap, Shield, Crown,
  Database, Brain, Activity, Clock, ChevronDown,
  Smartphone, Monitor, Target, Rocket, BadgeCheck,
  TrendingUp, Cloud, ShieldCheck, Lightning
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileMenuProps {
  modules: Array<{
    id: string;
    name: string;
    icon: any;
    path: string;
  }>;
  onModuleSelect: (id: string, path: string) => void;
  onLogout: () => void;
  user?: {
    display?: string;
    username?: string;
  };
}

export default function MobileMenu({ modules, onModuleSelect, onLogout, user }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showStats, setShowStats] = useState(false)

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 active:scale-95"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Menu className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Panel */}
      <div className={`
        fixed right-0 top-0 h-full w-4/5 max-w-sm z-40 md:hidden
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="h-full bg-gradient-to-b from-slate-900 to-slate-950 border-l border-white/10 shadow-2xl overflow-y-auto">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">H&R NEXUS</h3>
                  <p className="text-xs text-white/60">Enterprise AI</p>
                </div>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div className="h-10 w-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.display?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {user?.display || user?.username || 'Kullanıcı'}
                </p>
                <p className="text-xs text-white/60">Premium Üye</p>
              </div>
              <Sparkles className="h-4 w-4 text-yellow-400" />
            </div>
          </div>

          {/* Quick Stats - Accordion */}
          <div className="p-4 border-b border-white/10">
            <button
              onClick={() => setShowStats(!showStats)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-emerald-400" />
                <span className="text-white font-medium">Sistem Durumu</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${showStats ? 'rotate-180' : ''}`} />
            </button>
            
            {showStats && (
              <div className="mt-3 grid grid-cols-2 gap-2 animate-in fade-in duration-200">
                {[
                  { label: 'AI Aktif', value: '4/4', icon: Brain, color: 'text-emerald-400' },
                  { label: 'Güvenlik', value: 'A++', icon: ShieldCheck, color: 'text-blue-400' },
                  { label: 'Veri', value: '4.2M+', icon: Database, color: 'text-cyan-400' },
                  { label: 'Uptime', value: '99.99%', icon: Cloud, color: 'text-purple-400' },
                ].map((stat, index) => (
                  <div key={index} className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      <span className="text-xs text-white/60">{stat.label}</span>
                    </div>
                    <div className="text-lg font-bold text-white">{stat.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Modules */}
          <div className="p-4">
            <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 px-2">
              AI Modülleri
            </h4>
            <div className="space-y-2">
              {modules.map((module) => {
                const Icon = module.icon
                return (
                  <button
                    key={module.id}
                    onClick={() => {
                      onModuleSelect(module.id, module.path)
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg group-hover:from-blue-600/30 group-hover:to-purple-600/30 transition-all">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-white font-medium">{module.name}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-white/60 transition-colors" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Other Menu Items */}
          <div className="p-4 border-t border-white/10">
            <div className="space-y-1">
              {[
                { label: 'Ana Sayfa', icon: Home, path: '/' },
                { label: 'Bildirimler', icon: Bell, path: '/notifications' },
                { label: 'Ayarlar', icon: Settings, path: '/settings' },
                { label: 'Yardım', icon: HelpCircle, path: '/help' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    // Navigate işlemi
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors active:bg-white/10"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-white/10 mt-auto">
            <button
              onClick={() => {
                onLogout()
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Çıkış Yap</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}