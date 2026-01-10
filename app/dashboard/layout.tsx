// app/dashboard/layout.tsx
import DashboardNav from '@/components/DashboardNav'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={['GELISTIRME']}>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <DashboardNav />
        
        {/* pt-20 ekleyerek mobilde içeriği 80px aşağı kaydırdık */}
        {/* lg:pt-0 ile masaüstünde bu boşluğu kaldırdık çünkü masaüstünde menü yanda */}
        <main className="flex-1 overflow-auto pt-20 lg:pt-0 transition-all duration-300">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}